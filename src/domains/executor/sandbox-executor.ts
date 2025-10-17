import path from "node:path";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getDirname } from "../../shared/utils/file-util";
import { PackageRepository } from "../package/package-repository";
import type { ISandboxClient } from "../sandbox/sandbox-client-interface";
import { SandboxPoolSO } from "../sandbox/sandbox-pool-so";
import type { MCPSandboxProvider } from "../sandbox/sandbox-types";
import type { IToolExecutor, ToolExecuteRequest } from "./executor-interface";

/**
 * 沙盒执行器
 * 在沙盒环境中执行 MCP 工具
 */
export class SandboxExecutor implements IToolExecutor {
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

  /**
   * 执行工具
   */
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
      // 如果是沙盒未找到错误，尝试重新初始化并重试
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

  /**
   * 列出工具
   */
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
      // 如果是沙盒未找到错误，尝试重新初始化并重试
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
