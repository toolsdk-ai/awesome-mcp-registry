import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { MCPServerPackageConfig } from "../../shared/types";
import type { IToolExecutor } from "../executor/executor-interface";
import type { PackageRepository } from "./package-repository";

/**
 * Package Service Object
 * 包管理业务对象，处理包相关的核心业务逻辑
 */
export class PackageSO {
  private constructor(
    private readonly _packageName: string,
    private readonly _config: MCPServerPackageConfig,
    private readonly _packageInfo: { category?: string; validated?: boolean },
    _repository: PackageRepository,
    private readonly _executor: IToolExecutor,
  ) {}

  // ===== Getters =====
  get packageName() {
    return this._packageName;
  }
  get name() {
    return this._config.name;
  }
  get description() {
    return this._config.description;
  }
  get category() {
    return this._packageInfo.category;
  }
  get validated() {
    return this._packageInfo.validated;
  }
  get config() {
    return this._config;
  }

  // ===== 初始化方法 =====
  /**
   * 初始化 PackageSO
   * @param packageName 包名
   * @param repository 包仓储
   * @param executor 执行器
   * @returns PackageSO 实例
   */
  static async init(
    packageName: string,
    repository: PackageRepository,
    executor: IToolExecutor,
  ): Promise<PackageSO> {
    const config = repository.getPackageConfig(packageName);
    const allPackages = repository.getAllPackages();
    const packageInfo = allPackages[packageName] || {};
    return new PackageSO(packageName, config, packageInfo, repository, executor);
  }

  // ===== 业务方法 =====
  /**
   * 获取工具列表
   * @returns 工具列表
   */
  async getTools(): Promise<Tool[]> {
    return await this._executor.listTools(this.packageName);
  }

  /**
   * 执行工具
   * @param toolKey 工具键
   * @param inputData 输入数据
   * @param envs 环境变量
   * @returns 执行结果
   */
  async executeTool(
    toolKey: string,
    inputData: Record<string, unknown>,
    envs?: Record<string, string>,
  ): Promise<unknown> {
    return await this._executor.executeTool({
      packageName: this.packageName,
      toolKey,
      inputData,
      envs,
    });
  }

  // ===== 数据转换方法（供 Handler 使用）=====
  /**
   * 获取包详情（包含工具列表）
   * @returns 包详情数据
   */
  async getDetailWithTools() {
    let tools: Tool[] | undefined;
    try {
      tools = await this.getTools();
    } catch (error) {
      console.warn(`[PackageSO] Failed to get tools for ${this.packageName}:`, error);
      tools = undefined;
    }

    return {
      name: this.name,
      packageName: this.packageName,
      description: this.description,
      category: this.category,
      validated: this.validated,
      tools,
    };
  }
}
