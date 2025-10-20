import path from "node:path";
import { Daytona, type DaytonaConfig, Image, type Sandbox } from "@daytonaio/sdk";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getDaytonaConfig, getSandockDaytonaConfig } from "../../../shared/config/environment";
import { getDirname } from "../../../shared/utils/file-util";
import { extractLastOuterJSON } from "../../../shared/utils/string-util";
import { PackageRepository } from "../../package/package-repository";
import type { MCPServerPackageConfig } from "../../package/package-types";
import type { ISandboxClient, SandboxExecuteResult } from "../sandbox-client-interface";
import { SandboxStatus } from "../sandbox-client-interface";
import type { MCPSandboxProvider } from "../sandbox-types";

interface MCPToolResult {
  toolCount: number;
  tools: Tool[];
}

interface MCPExecuteResult {
  result: unknown;
  isError?: boolean;
  errorMessage?: string;
}

/**
 * Daytona Sandbox Client
 * Implements ISandboxClient interface for Daytona/Sandock providers
 */
export class DaytonaSandboxClient implements ISandboxClient {
  private sandbox: Sandbox | null = null;
  private initializing: Promise<void> | null = null;
  private readonly provider: MCPSandboxProvider;
  private status: SandboxStatus = SandboxStatus.IDLE;
  private readonly packageRepository: PackageRepository;

  constructor(
    _runtime: "node" | "python" | "java" | "go" = "node",
    provider: MCPSandboxProvider = "DAYTONA",
  ) {
    this.provider = provider;
    const __dirname = getDirname(import.meta.url);
    const packagesDir = path.join(__dirname, "../../../../packages");
    this.packageRepository = new PackageRepository(packagesDir);
  }

  getStatus(): SandboxStatus {
    return this.status;
  }

  async initialize(): Promise<void> {
    if (this.sandbox) {
      return;
    }
    if (this.initializing) {
      await this.initializing;
      return;
    }

    this.status = SandboxStatus.INITIALIZING;
    this.initializing = (async () => {
      try {
        const config = this.provider === "SANDOCK" ? getSandockDaytonaConfig() : getDaytonaConfig();

        const daytonaConfig: DaytonaConfig = {
          apiKey: config.apiKey,
        };

        if (config.apiUrl) {
          daytonaConfig.apiUrl = config.apiUrl;
        }

        const daytona = new Daytona(daytonaConfig);

        const declarativeImage = Image.base("node:20")
          .runCommands(
            "npm install -g pnpm",
            "mkdir -p /workspace",
            "cd /workspace && npm init -y",
            "cd /workspace && pnpm add @modelcontextprotocol/sdk",
          )
          .workdir("/workspace");

        this.sandbox = await daytona.create({
          language: "javascript",
          image: declarativeImage,
        });

        this.status = SandboxStatus.READY;
        console.log(`[DaytonaSandboxClient] Sandbox created successfully (${this.provider})`);
      } catch (error) {
        this.status = SandboxStatus.ERROR;
        throw error;
      } finally {
        this.initializing = null;
      }
    })();

    await this.initializing;
  }

  private async executeCode(code: string): Promise<SandboxExecuteResult> {
    if (!this.sandbox) {
      throw new Error("Sandbox not initialized. Call initialize() first.");
    }

    this.status = SandboxStatus.BUSY;
    try {
      const response = await this.sandbox.process.codeRun(code);
      return {
        exitCode: response.exitCode,
        result: response.result,
      };
    } finally {
      this.status = SandboxStatus.READY;
    }
  }

  async listTools(packageKey: string): Promise<Tool[]> {
    const mcpServerConfig: MCPServerPackageConfig =
      this.packageRepository.getPackageConfig(packageKey);
    const testCode: string = this.generateMCPTestCode(mcpServerConfig, "listTools");

    const response = await this.executeCode(testCode);

    if (response.exitCode !== 0) {
      throw new Error(`Failed to list tools: ${response.result}`);
    }

    const parsedResultStr = extractLastOuterJSON(response.result);
    const result: MCPToolResult = JSON.parse(parsedResultStr);

    return result.tools;
  }

  async executeTool(
    packageKey: string,
    toolName: string,
    argumentsObj: Record<string, unknown>,
    envs?: Record<string, string>,
  ): Promise<unknown> {
    const mcpServerConfig: MCPServerPackageConfig =
      this.packageRepository.getPackageConfig(packageKey);
    const testCode: string = this.generateMCPTestCode(
      mcpServerConfig,
      "executeTool",
      toolName,
      argumentsObj,
      envs,
    );

    const response = await this.executeCode(testCode);

    if (response.exitCode !== 0) {
      throw new Error(`Failed to execute tool: ${response.result}`);
    }

    const parsedResultStr = extractLastOuterJSON(response.result);
    const result: MCPExecuteResult = JSON.parse(parsedResultStr);

    if (result.isError) {
      console.error("[DaytonaSandboxClient] Tool execution error:", result.errorMessage);
      throw new Error(result.errorMessage);
    }

    return result;
  }

  async destroy(): Promise<void> {
    try {
      if (this.sandbox) {
        await this.sandbox.delete();
        this.status = SandboxStatus.DESTROYED;
        console.log("[DaytonaSandboxClient] Sandbox destroyed");
      }
    } catch (err) {
      console.error("[DaytonaSandboxClient] Error destroying sandbox:", (err as Error).message);
    } finally {
      this.sandbox = null;
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
      return `${commonCode}
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
    } else {
      return `${commonCode}

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
