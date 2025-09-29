import fs from "node:fs";
import path from "node:path";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getMcpClient, getPackageConfigByKey, typedAllPackagesList } from "../helper.js";
import { MCPSandboxClient } from "../sandbox/mcp-sandbox-client.js";
import type {
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
  // idleTimer is scheduled on release when refCount reaches 0
  idleCloseMs?: number;
};

export class PackageSO {
  private useSandbox: boolean = false;
  private sandboxClient: MCPSandboxClient | null = null;
  private static sandboxInstances: Map<string, SandboxRecord> = new Map();

  private static MAX_SANDBOXES = 10;
  private static IDLE_CLOSE_MS = 5 * 60 * 1000;

  constructor(useSandbox: boolean = false) {
    this.useSandbox = useSandbox;
    if (useSandbox) {
      const sandboxKey = "default";
      const record = PackageSO.sandboxInstances.get(sandboxKey);
      if (record) {
        record.refCount++;
        record.lastUsedAt = Date.now();
        this.sandboxClient = record.client;
        // Cancel all idle close timer
        record.client.touch();
      } else {
        // Create a new instance if none exists (subject to max limit)
        this.sandboxClient = new MCPSandboxClient();
        const newRecord: SandboxRecord = {
          client: this.sandboxClient,
          refCount: 1,
          lastUsedAt: Date.now(),
          idleCloseMs: PackageSO.IDLE_CLOSE_MS,
        };

        // Try to insert, evict LRU idle instance if MAX is reached
        if (PackageSO.sandboxInstances.size >= PackageSO.MAX_SANDBOXES) {
          // Find the oldest idle instance (refCount === 0)
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
            // Immediately close and delete
            if (evict) {
              evict.client.kill().catch((e) => {
                console.error("[PackageSO] Error killing evicted sandbox:", e);
              });
              PackageSO.sandboxInstances.delete(lruKey);
            }
          } else {
            // No recyclable instances -> throw error to prevent exceeding system limit
            throw new Error("Cannot create new sandbox: max sandboxes reached and none are idle");
          }
        }

        PackageSO.sandboxInstances.set(sandboxKey, newRecord);
      }
    }
  }

  // Acquire / Release explicit APIs (for external or future use)
  static async acquireSandbox(key = "default"): Promise<MCPSandboxClient> {
    const record = PackageSO.sandboxInstances.get(key);
    if (record) {
      record.refCount++;
      record.lastUsedAt = Date.now();
      record.client.touch();
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

    const client = new MCPSandboxClient();
    const newRecord: SandboxRecord = {
      client,
      refCount: 1,
      lastUsedAt: Date.now(),
      idleCloseMs: PackageSO.IDLE_CLOSE_MS,
    };
    PackageSO.sandboxInstances.set(key, newRecord);
    return client;
  }

  static async releaseSandbox(key = "default"): Promise<void> {
    const record = PackageSO.sandboxInstances.get(key);
    if (!record) return;
    record.refCount = Math.max(0, record.refCount - 1);
    record.lastUsedAt = Date.now();

    if (record.refCount === 0) {
      // schedule idle close after IDLE_CLOSE_MS
      record.client.scheduleIdleClose(record.idleCloseMs || PackageSO.IDLE_CLOSE_MS);
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

  async executeTool(request: ToolExecute): Promise<unknown> {
    if (this.useSandbox) {
      return this.executeToolInSandbox(request);
    }

    const mcpServerConfig = getPackageConfigByKey(request.packageName);

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
    if (!this.sandboxClient) {
      throw new Error("Sandbox client not initialized");
    }

    // Initialize if not already initialized (concurrency protection via MCPSandboxClient.initialize)
    await this.sandboxClient.initialize();

    // Mark usage
    this.sandboxClient.touch();

    try {
      const result = await this.sandboxClient.executeTool(
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
        await this.sandboxClient.initialize();
        // Retry tool execution
        const result = await this.sandboxClient.executeTool(
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
      await PackageSO.releaseSandbox("default");
    }
  }

  async listTools(packageName: string): Promise<Tool[]> {
    const mcpServerConfig = getPackageConfigByKey(packageName);

    if (this.useSandbox && mcpServerConfig.runtime === "node") {
      try {
        const tools = await this.listToolsInSandbox(packageName);
        return tools;
      } catch (error) {
        console.warn(
          `Sandbox mode failed for package ${packageName}, falling back to local mode:`,
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
    if (!this.sandboxClient) {
      throw new Error("Sandbox client not initialized");
    }

    // Initialize only if sandbox is not initialized
    await this.sandboxClient.initialize();

    this.sandboxClient.touch();
    try {
      const tools = await this.sandboxClient.listTools(packageName);
      console.log(`Tools list retrieved successfully for package ${packageName} in sandbox`);
      return tools;
    } catch (error) {
      // If it's a sandbox not found error, try reinitializing and retrying once
      if (error instanceof Error && error.message.includes("sandbox was not found")) {
        console.log("[PackageSO] Retrying tools listing after sandbox failure");
        await this.sandboxClient.initialize();
        // Retry listing tools
        const tools = await this.sandboxClient.listTools(packageName);
        console.log(
          `Tools list retrieved successfully for package ${packageName} in sandbox (retry)`,
        );
        return tools;
      }
      throw error;
    } finally {
      await PackageSO.releaseSandbox("default");
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
