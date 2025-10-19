import path from "node:path";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getDirname } from "../../shared/utils/file-util";
import { PackageRepository } from "../package/package-repository";
import type { ISandboxClient } from "../sandbox/sandbox-client-interface";
import { SandboxPoolSO } from "../sandbox/sandbox-pool-so";
import type { MCPSandboxProvider } from "../sandbox/sandbox-types";
import type { ToolExecuteRequest, ToolExecutor } from "./executor-interface";

/**
 * Sandbox Executor
 * Executes MCP tools in sandbox environment
 */
export class SandboxExecutor implements ToolExecutor {
  private readonly provider: MCPSandboxProvider;
  private readonly sandboxPool: SandboxPoolSO;
  private readonly packageRepository: PackageRepository;

  constructor(provider: MCPSandboxProvider) {
    this.provider = provider;
    this.sandboxPool = SandboxPoolSO.getInstance();
    const __dirname = getDirname(import.meta.url);
    const packagesDir = path.join(__dirname, "../../../packages");
    this.packageRepository = new PackageRepository(packagesDir);
  }

  async executeTool(request: ToolExecuteRequest): Promise<unknown> {
    const mcpServerConfig = this.packageRepository.getPackageConfig(request.packageName);
    const runtime = mcpServerConfig.runtime || "python";

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
      if (error instanceof Error && error.message.includes("sandbox was not found")) {
        console.log("[SandboxExecutor] Retrying tool execution after sandbox failure");
        await sandboxClient.initialize();

        const result = await sandboxClient.executeTool(
          request.packageName,
          request.toolKey,
          request.inputData || {},
          request.envs,
        );

        console.log(`[SandboxExecutor] Tool ${request.toolKey} executed successfully (retry)`);
        return result;
      }
      throw error;
    } finally {
      await this.sandboxPool.release(runtime, this.provider);
    }
  }

  async listTools(packageName: string): Promise<Tool[]> {
    const mcpServerConfig = this.packageRepository.getPackageConfig(packageName);
    const runtime = mcpServerConfig.runtime || "python";

    const sandboxClient: ISandboxClient = await this.sandboxPool.acquire(runtime, this.provider);

    try {
      await sandboxClient.initialize();

      const tools = await sandboxClient.listTools(packageName);
      console.log(`[SandboxExecutor] Tools list retrieved successfully for package ${packageName}`);
      return tools;
    } catch (error) {
      if (error instanceof Error && error.message.includes("sandbox was not found")) {
        console.log("[SandboxExecutor] Retrying tools listing after sandbox failure");
        await sandboxClient.initialize();

        const tools = await sandboxClient.listTools(packageName);
        console.log(`[SandboxExecutor] Tools list retrieved successfully (retry)`);
        return tools;
      }
      throw error;
    } finally {
      await this.sandboxPool.release(runtime, this.provider);
    }
  }
}
