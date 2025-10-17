import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { MCPServerPackageConfigWithTools } from "../../shared/types";
import type { IToolExecutor, ToolExecuteRequest } from "../executor/IToolExecutor";
import type { PackageRepository } from "./PackageRepository";

/**
 * 包服务
 * 处理包相关的核心业务逻辑
 */
export class PackageService {
  constructor(
    private readonly executor: IToolExecutor,
    private readonly repository: PackageRepository,
  ) {}

  /**
   * 获取包详情（包含工具列表）
   * @param packageName 包名
   * @returns 包详情
   */
  async getPackageDetail(packageName: string): Promise<MCPServerPackageConfigWithTools> {
    const packageConfig = this.repository.getPackageConfig(packageName);

    let tools: Tool[] | undefined;
    try {
      tools = await this.executor.listTools(packageName);
    } catch (error) {
      console.warn(`[PackageService] Failed to get tools for ${packageName}:`, error);
      tools = undefined;
    }

    return {
      ...packageConfig,
      tools,
    };
  }

  /**
   * 执行工具
   * @param request 执行请求
   * @returns 执行结果
   */
  async executeTool(request: ToolExecuteRequest): Promise<unknown> {
    // 验证包是否存在
    if (!this.repository.exists(request.packageName)) {
      throw new Error(`Package '${request.packageName}' not found`);
    }

    // 执行器内部已处理本地/沙盒切换
    return await this.executor.executeTool(request);
  }

  /**
   * 列出工具
   * @param packageName 包名
   * @returns 工具列表
   */
  async listTools(packageName: string): Promise<Tool[]> {
    // 验证包是否存在
    if (!this.repository.exists(packageName)) {
      throw new Error(`Package '${packageName}' not found`);
    }

    return await this.executor.listTools(packageName);
  }
}
