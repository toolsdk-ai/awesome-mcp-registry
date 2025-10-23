import path from "node:path";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getDirname } from "../../shared/utils/file-util";
import { PackageRepository } from "../package/package-repository";
import { SandboxPoolSO } from "../sandbox/sandbox-pool-so";
import type { MCPSandboxProvider, SandboxClient } from "../sandbox/sandbox-types";
import type { ToolExecuteRequest, ToolExecutor } from "./executor-types";
import { LocalExecutor } from "./local-executor";

/**
 * Sandbox Executor
 * Executes MCP tools in sandbox environment
 */
export class SandboxExecutor implements ToolExecutor {
  private readonly provider: MCPSandboxProvider;
  private readonly sandboxPool: SandboxPoolSO;
  private readonly packageRepository: PackageRepository;
  private readonly localExecutor: LocalExecutor;

  constructor(provider: MCPSandboxProvider) {
    this.provider = provider;
    this.sandboxPool = SandboxPoolSO.getInstance();
    const __dirname = getDirname(import.meta.url);
    const packagesDir = path.join(__dirname, "../../../packages");
    this.packageRepository = new PackageRepository(packagesDir);
    this.localExecutor = new LocalExecutor();
  }

  async executeTool(request: ToolExecuteRequest): Promise<unknown> {
    const mcpServerConfig = this.packageRepository.getPackageConfig(request.packageName);
    const runtime = mcpServerConfig.runtime || "python";

    // Sandbox only supports node runtime, fallback to LOCAL for other runtimes
    if (runtime !== "node") {
      console.log(
        `[SandboxExecutor] Runtime '${runtime}' is not supported in sandbox, using LOCAL execution`,
      );
      return await this.localExecutor.executeTool(request);
    }

    const sandboxClient = await this.sandboxPool.acquire(runtime, this.provider);

    try {
      await sandboxClient.initialize();

      const result = await sandboxClient.executeTool(
        request.packageName,
        request.toolKey,
        request.inputData || {},
        request.envs,
      );

      console.log(`[SandboxExecutor] Tool ${request.toolKey} executed successfully in sandbox`);
      return result;
    } catch (error) {
      console.warn(`[SandboxExecutor] sandbox execution failed, falling back to LOCAL execution`);
      console.warn(
        `[SandboxExecutor] Error: ${error instanceof Error ? error.message : String(error)}`,
      );

      try {
        const result = await this.localExecutor.executeTool(request);
        console.log(
          `[SandboxExecutor] Tool ${request.toolKey} executed successfully with LOCAL fallback`,
        );
        return result;
      } catch (localError) {
        console.error("[SandboxExecutor] LOCAL fallback execution also failed");
        throw localError;
      }
    } finally {
      await this.sandboxPool.release(runtime, this.provider);
    }
  }

  async listTools(packageName: string): Promise<Tool[]> {
    const mcpServerConfig = this.packageRepository.getPackageConfig(packageName);
    const runtime = mcpServerConfig.runtime || "python";

    // Sandbox only supports node runtime, fallback to LOCAL for other runtimes
    if (runtime !== "node") {
      console.log(
        `[SandboxExecutor] Runtime '${runtime}' is not supported in sandbox, using LOCAL execution`,
      );
      return await this.localExecutor.listTools(packageName);
    }

    const sandboxClient: SandboxClient = await this.sandboxPool.acquire(runtime, this.provider);

    try {
      await sandboxClient.initialize();

      const tools = await sandboxClient.listTools(packageName);
      console.log(`[SandboxExecutor] Tools list retrieved successfully for package ${packageName}`);
      return tools;
    } catch (error) {
      console.warn(`[SandboxExecutor] sandbox list tools failed, falling back to LOCAL execution`);
      console.warn(
        `[SandboxExecutor] Error: ${error instanceof Error ? error.message : String(error)}`,
      );

      try {
        const tools = await this.localExecutor.listTools(packageName);
        console.log(`[SandboxExecutor] Tools list retrieved successfully with LOCAL fallback`);
        return tools;
      } catch (localError) {
        console.error("[SandboxExecutor] LOCAL fallback list tools also failed");
        throw localError;
      }
    } finally {
      await this.sandboxPool.release(runtime, this.provider);
    }
  }
}
