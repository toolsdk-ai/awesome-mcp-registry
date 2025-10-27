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

// Singleton HTTP client shared across all instances to prevent memory leaks
let sharedSandockClient: ReturnType<typeof createSandockClient> | null = null;

function getSandockClient(): ReturnType<typeof createSandockClient> {
  if (!sharedSandockClient) {
    const config = getSandockConfig();
    sharedSandockClient = createSandockClient({
      baseUrl: config.apiUrl,
      headers: {
        Authorization: `Bearer ${config.apiKey}`,
      },
    });
    console.log("[SandockSandboxClient] Shared HTTP client initialized");
  }
  return sharedSandockClient;
}

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

    // Use shared singleton client instead of creating new one per instance
    this.client = getSandockClient();
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
        const { data, error } = await this.client.POST("/api/sandbox", {
          body: {
            image: "seey/sandock-mcp:latest",
            workdir: "/mcpspace",
            usePersistentCache: true,
          },
        });

        if (error) {
          throw new Error(`Failed to create sandbox: ${JSON.stringify(error)}`);
        }

        this.sandboxId = data.data.id;
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

    const { data, error } = await this.client.POST("/api/sandbox/{id}/shell", {
      params: {
        path: {
          id: this.sandboxId,
        },
      },
      body: {
        cmd,
      },
    });

    if (error) {
      throw new Error(`Shell command failed: ${JSON.stringify(error)}`);
    }

    const stdout = data.data.stdout || "";
    const stderr = data.data.stderr || "";

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

    // Set custom pnpm store directory (volume-mounted cache directory) before executing code
    const output = await this.executeShellCommand(
      `cd /mcpspace && pnpm config set store-dir /data/pnpm-store && node ${tempFile}`,
    );

    // Fire-and-forget: cleanup temp file in background without blocking result return
    // The cleanup will complete asynchronously, and logs will appear when it does
    this.cleanupTempFileAsync(tempFile, this.sandboxId).catch((err) => {
      // This should never happen due to internal error handling, but just in case
      console.error("[SandockSandboxClient] Unexpected error in cleanupTempFileAsync:", err);
    });

    return {
      exitCode: 0,
      result: output,
    };
  }

  private async cleanupTempFileAsync(tempFile: string, sandboxId: string | null): Promise<void> {
    if (!sandboxId) {
      console.warn("[SandockSandboxClient] Sandbox ID is null, skipping temp file cleanup");
      return;
    }

    try {
      const { error } = await this.client.DELETE("/api/sandbox/{id}/fs", {
        params: {
          path: { id: sandboxId },
          query: { path: tempFile },
        },
      });

      if (error) {
        console.warn(
          `[SandockSandboxClient] Warning: Could not delete temp file ${tempFile}:`,
          error,
        );
      } else {
        console.log(`[SandockSandboxClient] Temp file ${tempFile} deleted successfully`);
      }
    } catch (cleanupError) {
      console.warn(
        `[SandockSandboxClient] Error during temp file cleanup for ${tempFile}:`,
        cleanupError,
      );
    }
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

    const sandboxIdToDelete = this.sandboxId;
    this.sandboxId = null; // Clear immediately to avoid duplicate calls

    // Fire-and-forget: destroy sandbox in background without blocking
    // The cleanup will complete asynchronously, and logs will appear when it does
    this.destroySandboxAsync(sandboxIdToDelete).catch((err) => {
      // This should never happen due to internal error handling, but just in case
      console.error("[SandockSandboxClient] Unexpected error in destroySandboxAsync:", err);
    });
  }

  private async destroySandboxAsync(sandboxId: string): Promise<void> {
    try {
      // Delete sandbox completely using the fs delete API with root path
      // This removes all files and effectively shuts down the sandbox
      const { error } = await this.client.DELETE("/api/sandbox/{id}/fs", {
        params: {
          path: { id: sandboxId },
          query: { path: "/" },
        },
      });

      if (error) {
        // Check if error is "not found" (already deleted)
        const errorStr = JSON.stringify(error);
        if (errorStr.includes("not found") || errorStr.includes("404")) {
          console.log(
            `[SandockSandboxClient] Sandbox ${sandboxId} already deleted (not found on platform)`,
          );
        } else {
          console.warn(
            `[SandockSandboxClient] Warning: Could not delete sandbox ${sandboxId}: ${errorStr}`,
          );
        }
      } else {
        console.log(`[SandockSandboxClient] Sandbox ${sandboxId} deleted successfully`);
      }
    } catch (err) {
      const errorMessage = (err as Error).message;
      if (errorMessage.includes("not found") || errorMessage.includes("404")) {
        console.log(
          `[SandockSandboxClient] Sandbox ${sandboxId} already deleted (not found on platform)`,
        );
      } else {
        console.warn(
          `[SandockSandboxClient] Warning: Could not delete sandbox ${sandboxId}: ${errorMessage}`,
        );
      }
    }
  }
}
