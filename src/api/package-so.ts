import fs from "node:fs";
import path from "node:path";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getMcpClient, getPackageConfigByKey, typedAllPackagesList } from "../helper.js";
import { MCPSandboxClient } from "../sandbox/mcp-sandbox-client.js";
import type {
  MCPSandboxProvider,
  MCPServerPackageConfig,
  MCPServerPackageConfigWithTools,
  ToolExecute,
} from "../types";
import { getDirname } from "../utils";

const __dirname = getDirname(import.meta.url);

type SandboxRecord = {
  client: MCPSandboxClient;
  refCount: number;
  lastUsedAt: number;
  provider: MCPSandboxProvider;
};

export class PackageSO {
  private sandboxProvider: MCPSandboxProvider = "LOCAL";
  private static sandboxInstances: Map<string, SandboxRecord> = new Map();
  private static MAX_SANDBOXES = 10;

  constructor(provider: MCPSandboxProvider = "LOCAL") {
    this.sandboxProvider = provider;
  }

  // Acquire / Release explicit APIs (for external or future use)
  static async acquireSandbox(
    runtime: "node" | "python" | "java" | "go" = "python",
    provider: MCPSandboxProvider = "DAYTONA",
  ): Promise<MCPSandboxClient> {
    const sandboxKey = PackageSO.getSandboxKey(runtime, provider);
    const record = PackageSO.sandboxInstances.get(sandboxKey);
    if (record) {
      record.refCount++;
      record.lastUsedAt = Date.now();
      return record.client;
    }

    // Create new instance (note MAX_SANDBOXES check, consistent with constructor logic)
    if (PackageSO.sandboxInstances.size >= PackageSO.MAX_SANDBOXES) {
      // Try to evict LRU idle instance
      let lruKey: string | null = null;
      let lruTime = Infinity;
      for (const [k, r] of PackageSO.sandboxInstances) {
        if (r.refCount === 0 && r.lastUsedAt < lruTime) {
          lruKey = k;
          lruTime = r.lastUsedAt;
        }
      }
      if (lruKey) {
        const evict = PackageSO.sandboxInstances.get(lruKey);
        if (evict) {
          await evict.client
            .kill()
            .catch((e) => console.error("[PackageSO] Error killing evicted sandbox:", e));
          PackageSO.sandboxInstances.delete(lruKey);
        }
      } else {
        throw new Error("Cannot create new sandbox: max sandboxes reached and none are idle");
      }
    }

    const client = new MCPSandboxClient(runtime, provider);
    const newRecord: SandboxRecord = {
      client,
      refCount: 1,
      lastUsedAt: Date.now(),
      provider,
    };
    PackageSO.sandboxInstances.set(sandboxKey, newRecord);
    return client;
  }

  static async releaseSandbox(
    runtime: "node" | "python" | "java" | "go" = "python",
    provider: MCPSandboxProvider = "DAYTONA",
  ): Promise<void> {
    const sandboxKey = PackageSO.getSandboxKey(runtime, provider);
    const record = PackageSO.sandboxInstances.get(sandboxKey);
    if (!record) return;
    record.refCount = Math.max(0, record.refCount - 1);
    record.lastUsedAt = Date.now();

    if (record.refCount === 0) {
      try {
        await record.client.kill();
        PackageSO.sandboxInstances.delete(sandboxKey);
        console.log(`[PackageSO] Sandbox ${sandboxKey} closed immediately after use`);
      } catch (error) {
        console.error(`[PackageSO] Error closing sandbox ${sandboxKey}:`, error);
      }
    }
  }

  // Cleanup all static sandbox instances safely
  static async cleanupSandboxInstances(): Promise<void> {
    const killers: Promise<void>[] = [];
    for (const [key, record] of PackageSO.sandboxInstances) {
      killers.push(
        (async () => {
          try {
            await record.client.kill();
          } catch (err) {
            console.error("[PackageSO] cleanup error for sandbox", key, err);
          }
        })(),
      );
      PackageSO.sandboxInstances.delete(key);
    }
    await Promise.all(killers);
  }

  private static getSandboxKey(
    runtime: "node" | "python" | "java" | "go",
    provider: MCPSandboxProvider,
  ): string {
    return `sandbox-${provider}-${runtime}`;
  }

  private isSandboxEnabled(): boolean {
    return this.sandboxProvider === "DAYTONA" || this.sandboxProvider === "SANDOCK";
  }

  async executeTool(request: ToolExecute): Promise<unknown> {
    const mcpServerConfig = getPackageConfigByKey(request.packageName);

    if (this.isSandboxEnabled()) {
      try {
        const result = await this.executeToolInSandbox(request);
        return result;
      } catch (error) {
        console.warn(
          `[executeTool] Sandbox mode failed for tool ${request.toolKey} in package ${request.packageName}, falling back to local mode:`,
          error,
        );
      }
    }

    const { client, closeConnection } = await getMcpClient(mcpServerConfig, request.envs || {});
    try {
      const result = await client.callTool({
        name: request.toolKey,
        arguments: request.inputData,
      });

      console.log(`Tool ${request.toolKey} executed successfully`);
      return result;
    } finally {
      await closeConnection();
    }
  }

  private async executeToolInSandbox(request: ToolExecute): Promise<unknown> {
    const mcpServerConfig = getPackageConfigByKey(request.packageName);
    const runtime = mcpServerConfig.runtime || "python"; // Default to python if not specified

    const sandboxClient = await PackageSO.acquireSandbox(runtime, this.sandboxProvider);

    // Initialize if not already initialized (concurrency protection via MCPSandboxClient.initialize)
    await sandboxClient.initialize();

    try {
      const result = await sandboxClient.executeTool(
        request.packageName,
        request.toolKey,
        request.inputData || {},
        request.envs,
      );
      console.log(`Tool ${request.toolKey} executed successfully in sandbox`);
      return result;
    } catch (error) {
      // If it's a sandbox not found error, try reinitializing and retrying once
      if (error instanceof Error && error.message.includes("sandbox was not found")) {
        console.log("[PackageSO] Retrying tool execution after sandbox failure");
        await sandboxClient.initialize();
        // Retry tool execution
        const result = await sandboxClient.executeTool(
          request.packageName,
          request.toolKey,
          request.inputData || {},
          request.envs,
        );
        console.log(`Tool ${request.toolKey} executed successfully in sandbox (retry)`);
        return result;
      }
      throw error;
    } finally {
      // Release reference count
      await PackageSO.releaseSandbox(runtime, this.sandboxProvider);
    }
  }

  async listTools(packageName: string): Promise<Tool[]> {
    const mcpServerConfig = getPackageConfigByKey(packageName);

    if (this.isSandboxEnabled()) {
      try {
        const tools = await this.listToolsInSandbox(packageName);
        return tools;
      } catch (error) {
        console.warn(
          `[listTools] Sandbox mode failed for package ${packageName}, falling back to local mode:`,
          error,
        );
      }
    }

    const mockEnvs: Record<string, string> = {};
    if (mcpServerConfig.env) {
      Object.keys(mcpServerConfig.env).forEach((key) => {
        mockEnvs[key] = "mock_value";
      });
    }

    const { client, closeConnection } = await getMcpClient(mcpServerConfig, mockEnvs);
    try {
      const { tools } = await client.listTools();

      console.log(`Tools list retrieved successfully for package ${packageName}`);
      return tools;
    } finally {
      await closeConnection();
    }
  }

  private async listToolsInSandbox(packageName: string): Promise<Tool[]> {
    const mcpServerConfig = getPackageConfigByKey(packageName);
    const runtime = mcpServerConfig.runtime || "python";

    const sandboxClient = await PackageSO.acquireSandbox(runtime, this.sandboxProvider);

    try {
      // Initialize only if sandbox is not initialized
      await sandboxClient.initialize();

      const tools = await sandboxClient.listTools(packageName);
      console.log(`Tools list retrieved successfully for package ${packageName} in sandbox`);
      return tools;
    } catch (error) {
      // If it's a sandbox not found error, try reinitializing and retrying once
      if (error instanceof Error && error.message.includes("sandbox was not found")) {
        console.log("[PackageSO] Retrying tools listing after sandbox failure");
        await sandboxClient.initialize();
        // Retry listing tools
        const tools = await sandboxClient.listTools(packageName);
        console.log(
          `Tools list retrieved successfully for package ${packageName} in sandbox (retry)`,
        );
        return tools;
      }
      throw error;
    } finally {
      await PackageSO.releaseSandbox(runtime, this.sandboxProvider);
    }
  }

  async getPackageDetail(packageName: string): Promise<MCPServerPackageConfig> {
    const packageInfo = typedAllPackagesList[packageName];
    if (!packageInfo) {
      throw new Error(`Package ${packageName} not found`);
    }

    const jsonFilePath = path.join(__dirname, "../../packages/", packageInfo.path);
    const jsonStr = fs.readFileSync(jsonFilePath, "utf-8");
    const packageConfig: MCPServerPackageConfig = JSON.parse(jsonStr);

    let tools: Tool[] | undefined;
    try {
      tools = await this.listTools(packageName);
    } catch (error) {
      console.warn(`Warn retrieving tools for package ${packageName}:`, (error as Error).message);
      // if tools cannot be retrieved, set tools to undefined
      tools = undefined;
    }

    const packageConfigWithTools: MCPServerPackageConfigWithTools = {
      ...packageConfig,
      tools,
    };

    return packageConfigWithTools;
  }
}
