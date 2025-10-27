import path from "node:path";
import { Daytona, type DaytonaConfig, Image, type Sandbox } from "@daytonaio/sdk";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getDaytonaConfig } from "../../../shared/config/environment";
import { getDirname } from "../../../shared/utils/file-util";
import { extractLastOuterJSON } from "../../../shared/utils/string-util";
import { PackageRepository } from "../../package/package-repository";
import type { MCPServerPackageConfig } from "../../package/package-types";
import type {
  MCPExecuteResult,
  MCPToolResult,
  SandboxClient,
  SandboxExecuteResult,
} from "../sandbox-types";
import { generateMCPTestCode } from "../sandbox-utils";

// Singleton Daytona client shared across all instances to prevent memory leaks
let sharedDaytonaClient: Daytona | null = null;

function getDaytonaClient(): Daytona {
  if (!sharedDaytonaClient) {
    const config = getDaytonaConfig();

    const daytonaConfig: DaytonaConfig = {
      apiKey: config.apiKey,
    };

    if (config.apiUrl) {
      daytonaConfig.apiUrl = config.apiUrl;
    }

    sharedDaytonaClient = new Daytona(daytonaConfig);
    console.log("[DaytonaSandboxClient] Shared Daytona client initialized");
  }
  return sharedDaytonaClient;
}

/**
 * Daytona Sandbox Client
 * Implements SandboxClient interface for Daytona provider
 */
export class DaytonaSandboxClient implements SandboxClient {
  private sandbox: Sandbox | null = null;
  private initializing: Promise<void> | null = null;
  private readonly packageRepository: PackageRepository;

  constructor(_runtime: "node" | "python" | "java" | "go" = "node") {
    const __dirname = getDirname(import.meta.url);
    const packagesDir = path.join(__dirname, "../../../../packages");
    this.packageRepository = new PackageRepository(packagesDir);
  }

  async initialize(): Promise<void> {
    if (this.sandbox) {
      return;
    }
    if (this.initializing) {
      await this.initializing;
      return;
    }

    this.initializing = (async () => {
      try {
        // Use shared singleton Daytona client instead of creating new one per initialization
        const daytona = getDaytonaClient();

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
          autoDeleteInterval: 0,
        });

        console.log("[DaytonaSandboxClient] Sandbox created successfully");
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

    const response = await this.sandbox.process.codeRun(code);
    return {
      exitCode: response.exitCode,
      result: response.result,
    };
  }

  async listTools(packageKey: string): Promise<Tool[]> {
    const mcpServerConfig: MCPServerPackageConfig =
      this.packageRepository.getPackageConfig(packageKey);
    const testCode: string = generateMCPTestCode(mcpServerConfig, "listTools");

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
    const testCode: string = generateMCPTestCode(
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
    if (!this.sandbox) {
      return;
    }

    const sandboxToDelete = this.sandbox;
    this.sandbox = null; // Clear immediately to avoid duplicate calls

    // Asynchronously clean up sandbox without blocking result return
    sandboxToDelete
      .delete()
      .then(() => {
        console.log("[DaytonaSandboxClient] Sandbox destroyed successfully");
      })
      .catch((err: Error) => {
        const errorMessage = err.message;

        if (errorMessage.includes("not found")) {
          console.log("[DaytonaSandboxClient] Sandbox already destroyed (not found on platform)");
        } else {
          console.warn("[DaytonaSandboxClient] Warning: Could not destroy sandbox:", errorMessage);
        }
      });
  }
}
