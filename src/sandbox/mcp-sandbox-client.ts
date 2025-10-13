import { Daytona, Image, type Sandbox } from "@daytonaio/sdk";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { extractLastOuterJSON, getPackageConfigByKey } from "../helper";
import type { MCPServerPackageConfig } from "../types";

interface MCPToolResult {
  toolCount: number;
  tools: Tool[];
}

interface MCPExecuteResult {
  result: unknown;
  isError?: boolean;
  errorMessage?: string;
}

export class MCPSandboxClient {
  private sandbox: Sandbox | null = null;
  private initializing: Promise<void> | null = null;
  private readonly apiKey: string;

  private runtime: "node" | "python" | "java" | "go" = "node";

  constructor(runtime: "node" | "python" | "java" | "go" = "node") {
    this.apiKey = process.env.DAYTONA_API_KEY || "daytona-api-key-placeholder";
    this.runtime = runtime;
  }

  // Safe initialize: ensures concurrent calls don't create duplicate sandboxes
  async initialize(): Promise<void> {
    if (this.sandbox) {
      return;
    }
    if (this.initializing) {
      // Wait for existing initialization to complete
      await this.initializing;
      return;
    }

    this.initializing = (async () => {
      try {
        const daytona = new Daytona({
          apiKey: this.apiKey,
        });

        // Create image with required dependencies
        const declarativeImage = Image.base("node:20")
          .runCommands(
            "npm install -g pnpm",
            "mkdir -p /workspace",
            "cd /workspace && npm init -y",
            "cd /workspace && pnpm add @modelcontextprotocol/sdk",
          )
          .workdir("/workspace");

        const pnpmStoreVolume = await daytona.volume.get("demo-pnpm-store-shared", true);

        this.sandbox = await daytona.create(
          {
            language: "javascript",
            image: declarativeImage,
            volumes: [
              {
                volumeId: pnpmStoreVolume.id,
                mountPath: "/pnpm-store",
              },
            ],
          },
          {
            onSnapshotCreateLogs: console.log,
          },
        );

        console.log("[MCPSandboxClient] Daytona Sandbox created successfully");
      } finally {
        this.initializing = null;
      }
    })();

    await this.initializing;
  }

  // Force close and cleanup
  async kill(): Promise<void> {
    try {
      if (this.sandbox) {
        await this.sandbox.delete();
      }
    } catch (err) {
      console.log((err as Error).message);
    } finally {
      this.sandbox = null;
      // clear cache
      // this.toolCache.clear();
    }
  }

  async listTools(packageKey: string): Promise<Tool[]> {
    if (!this.sandbox) {
      throw new Error("Sandbox not initialized. Call initialize() first.");
    }

    const mcpServerConfig: MCPServerPackageConfig = await getPackageConfigByKey(packageKey);

    const testCode: string = this.generateMCPTestCode(mcpServerConfig, "listTools");

    try {
      const response = await this.sandbox.process.codeRun(testCode);

      if (response.exitCode !== 0) {
        throw new Error(`Failed to list tools: ${response.result}`);
      }

      const parsedResultStr = extractLastOuterJSON(response.result);
      const result: MCPToolResult = JSON.parse(parsedResultStr);

      return result.tools;
    } catch (err) {
      console.error("[MCPSandboxClient] Error listing tools:", err);
      throw err;
    }
  }

  async executeTool(
    packageKey: string,
    toolName: string,
    argumentsObj: Record<string, unknown>,
    envs?: Record<string, string>,
  ): Promise<unknown> {
    if (!this.sandbox) {
      throw new Error("Sandbox not initialized. Call initialize() first.");
    }

    const mcpServerConfig: MCPServerPackageConfig = await getPackageConfigByKey(packageKey);

    const testCode: string = this.generateMCPTestCode(
      mcpServerConfig,
      "executeTool",
      toolName,
      argumentsObj,
      envs,
    );

    try {
      const response = await this.sandbox.process.codeRun(testCode);

      if (response.exitCode !== 0) {
        throw new Error(`Failed to execute tool: ${response.result}`);
      }

      const parsedResultStr = extractLastOuterJSON(response.result);
      const result: MCPExecuteResult = JSON.parse(parsedResultStr);

      if (result.isError) {
        console.error("[MCPSandboxClient] Tool execution error:", result.errorMessage);
        throw new Error(result.errorMessage);
      }

      return result;
    } catch (err) {
      console.error("[MCPSandboxClient] Error executing tool:", err);
      throw err;
    }
  }

  private generateMCPTestCode(
    mcpServerConfig: MCPServerPackageConfig,
    operation: "listTools" | "executeTool",
    toolName?: string,
    argumentsObj?: Record<string, unknown>,
    envs?: Record<string, string>,
  ): string {
    const commonCode = `
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function runMCP() {
  let client;
  try {
    const packageName = "${mcpServerConfig.packageName}";

    const transport = new StdioClientTransport({
      command: "pnpx",
      args: ["--silent", packageName],
      env: {
        ...Object.fromEntries(
          Object.entries(process.env).filter(([_, v]) => v !== undefined)
        ),
        PNPM_HOME: "/root/.local/share/pnpm",
        PNPM_STORE_PATH: "/pnpm-store",
        ${this.generateEnvVariables(mcpServerConfig.env, envs)}
      },
    });

    client = new Client(
      {
        name: "mcp-server-${mcpServerConfig.packageName}-client",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    await client.connect(transport);
`;

    if (operation === "listTools") {
      const toolsCode = `${commonCode}
    const toolsObj = await client.listTools();

    const result = {
      toolCount: toolsObj.tools.length,
      tools: toolsObj.tools
    };

    process.stdout.write(JSON.stringify(result));
  } catch (error) {
    console.error("Error in MCP test:", error);
    process.exitCode = 1;
    process.stdout.write(JSON.stringify({ error: error.message || "Unknown error occurred" }));
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error("Error closing MCP client:", closeError);
      }
    }
  }
}

runMCP();
    `;
      return toolsCode;
      // } else if (operation === "executeTool" && toolName) {
    } else {
      const toolExecuteCode = `${commonCode}

    const result = await client.callTool({
      name: "${toolName}",
      arguments: ${JSON.stringify(argumentsObj)}
    });

    process.stdout.write(JSON.stringify(result));
  } catch (error) {
    console.error("Error in MCP test:", error);
    process.exitCode = 1;
    process.stdout.write(JSON.stringify({ 
      result: null, 
      isError: true, 
      errorMessage: error.message 
    }));
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error("Error closing MCP client:", closeError);
      }
    }
  }
}

runMCP();
  `;
      return toolExecuteCode;
    }
  }

  private generateEnvVariables(
    env: MCPServerPackageConfig["env"],
    realEnvs?: Record<string, string>,
  ): string {
    if (!env) {
      return "";
    }

    const envEntries = Object.entries(env).map(([key, _]) => {
      if (realEnvs?.[key]) {
        return `${JSON.stringify(key)}: ${JSON.stringify(realEnvs[key])}`;
      }
      return `${JSON.stringify(key)}: "mock_value"`;
    });

    return envEntries.join(",\n        ");
  }
}
