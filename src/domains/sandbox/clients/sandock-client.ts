import path from "node:path";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { createSandockClient } from "sandock";
import { getSandockConfig } from "../../../shared/config/environment";
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
 * Sandock Sandbox Client
 * Implements SandboxClient interface for Sandock provider
 */
export class SandockSandboxClient implements SandboxClient {
  private sandboxId: string | null = null;
  private initializing: Promise<void> | null = null;
  private readonly packageRepository: PackageRepository;
  private readonly client: ReturnType<typeof createSandockClient>;

  constructor(_runtime: "node" | "python" | "java" | "go" = "node") {
    const __dirname = getDirname(import.meta.url);
    const packagesDir = path.join(__dirname, "../../../../packages");
    this.packageRepository = new PackageRepository(packagesDir);

    const config = getSandockConfig();
    this.client = createSandockClient({
      baseUrl: config.apiUrl,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    });
  }

  async initialize(): Promise<void> {
    if (this.sandboxId) {
      return;
    }
    if (this.initializing) {
      await this.initializing;
      return;
    }

    this.initializing = (async () => {
      try {
        // Create sandbox with pre-built MCP image
        const createResponse = await this.client.POST("/api/sandbox", {
          body: {
            image: "seey/sandock-mcp:latest",
            workdir: "/mcpspace",
          },
        });

        if (!createResponse.data) {
          const errorMsg =
            "error" in createResponse ? JSON.stringify(createResponse.error) : "Unknown error";
          throw new Error(`Failed to create sandbox: ${errorMsg}`);
        }

        this.sandboxId = createResponse.data.data.id;
        console.log(`[SandockSandboxClient] Sandbox created successfully: ${this.sandboxId}`);
      } catch (error) {
        this.sandboxId = null;
        throw error;
      } finally {
        this.initializing = null;
      }
    })();

    await this.initializing;
  }

  private async executeShellCommand(cmd: string): Promise<string> {
    if (!this.sandboxId) {
      throw new Error("Sandbox not initialized. Call initialize() first.");
    }

    const response = await this.client.POST("/api/sandbox/{id}/shell", {
      params: {
        path: {
          id: this.sandboxId,
        },
      },
      body: {
        cmd,
      },
    });

    if (!response.data) {
      const errorMsg = "error" in response ? JSON.stringify(response.error) : "Unknown error";
      throw new Error(`Shell command failed: ${errorMsg}`);
    }

    const stdout = response.data.data.stdout || "";
    const stderr = response.data.data.stderr || "";

    if (stderr.trim()) {
      console.log(`[SandockSandboxClient] stderr: ${stderr}`);
    }

    return stdout;
  }

  private async executeCode(code: string): Promise<SandboxExecuteResult> {
    if (!this.sandboxId) {
      throw new Error("Sandbox not initialized. Call initialize() first.");
    }

    // Write code to a temporary file in /mcpspace (accessible to node_modules)
    const tempFile = `/mcpspace/mcp_test_${Date.now()}.mjs`;

    // Use Sandock's file write API (more reliable)
    await this.client.POST("/api/sandbox/{id}/fs/write", {
      params: {
        path: { id: this.sandboxId },
      },
      body: {
        path: tempFile,
        content: code,
      },
    });

    const output = await this.executeShellCommand(`cd /mcpspace && node ${tempFile}`);

    // Asynchronously clean up temp file without blocking result return
    this.client
      .DELETE("/api/sandbox/{id}/fs", {
        params: {
          path: { id: this.sandboxId },
          query: { path: tempFile },
        },
      })
      .catch((error) => {
        console.warn("[SandockSandboxClient] Warning: Could not delete temp file:", error);
      });

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
      console.error("[SandockSandboxClient] Tool execution error:", result.errorMessage);
      throw new Error(result.errorMessage);
    }

    return result;
  }

  async destroy(): Promise<void> {
    if (!this.sandboxId) {
      return;
    }

    const sandboxIdToStop = this.sandboxId;
    this.sandboxId = null; // Clear immediately to avoid duplicate calls

    // Asynchronously clean up sandbox without blocking result return
    this.client
      .POST("/api/sandbox/{id}/stop", {
        params: {
          path: {
            id: sandboxIdToStop,
          },
        },
      })
      .then((response) => {
        if (!response.data && "error" in response) {
          console.warn(
            `[SandockSandboxClient] Warning: Could not stop sandbox: ${JSON.stringify(response.error)}`,
          );
        } else {
          console.log("[SandockSandboxClient] Sandbox stopped successfully");
        }
      })
      .catch((err) => {
        const errorMessage = (err as Error).message;
        if (errorMessage.includes("not found") || errorMessage.includes("404")) {
          console.log("[SandockSandboxClient] Sandbox already stopped (not found on platform)");
        } else {
          console.warn("[SandockSandboxClient] Warning: Could not stop sandbox:", errorMessage);
        }
      });
  }
}
