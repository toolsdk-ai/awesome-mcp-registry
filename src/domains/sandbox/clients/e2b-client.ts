import path from "node:path";
import { Sandbox } from "@e2b/code-interpreter";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getE2BConfig } from "../../../shared/config/environment";
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

/**
 * E2B Sandbox Client
 * Implements SandboxClient interface for E2B provider
 */
export class E2BSandboxClient implements SandboxClient {
  private sandbox: Sandbox | null = null;
  private initializing: Promise<void> | null = null;
  private readonly packageRepository: PackageRepository;
  private readonly apiKey: string;
  private readonly runtime: "node" | "python" | "java" | "go";

  constructor(runtime: "node" | "python" | "java" | "go" = "node") {
    const __dirname = getDirname(import.meta.url);
    const packagesDir = path.join(__dirname, "../../../../packages");
    this.packageRepository = new PackageRepository(packagesDir);

    const config = getE2BConfig();
    this.apiKey = config.apiKey;
    this.runtime = runtime;
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
        const templateMap: Record<string, string> = {
          python: "mcp-sandbox-python",
          node: "mcp-sandbox-node",
          java: "mcp-sandbox-java",
          go: "mcp-sandbox-go",
        };

        const template = templateMap[this.runtime];
        if (!template) {
          throw new Error(`[E2BSandboxClient] Unsupported runtime: ${this.runtime}`);
        }

        this.sandbox = await Sandbox.create(template, {
          apiKey: this.apiKey,
          timeoutMs: 30 * 1000,
        });

        console.log(`[E2BSandboxClient] Sandbox (${template}) created successfully`);
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

    // Map runtime to language string expected by the sandbox
    const runtimeToLanguage: Record<string, string> = {
      node: "javascript",
      python: "python",
      java: "java",
      go: "go",
    };
    const language = runtimeToLanguage[this.runtime] || "javascript";
    const result = await this.sandbox.runCode(code, { language });

    if (result.error) {
      return {
        exitCode: 1,
        result: result.error.toString(),
      };
    }

    const stdout = result.logs?.stdout || [];
    const output = stdout[stdout.length - 1] || "";

    return {
      exitCode: 0,
      result: output,
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
      console.error("[E2BSandboxClient] Tool execution error:", result.errorMessage);
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
      .kill()
      .then(() => {
        console.log("[E2BSandboxClient] Sandbox destroyed successfully");
      })
      .catch((err: Error) => {
        const errorMessage = err.message;

        if (errorMessage.includes("not found")) {
          console.log("[E2BSandboxClient] Sandbox already destroyed (not found on platform)");
        } else {
          console.warn("[E2BSandboxClient] Warning: Could not destroy sandbox:", errorMessage);
        }
      });
  }
}
