import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { IToolExecutor } from "../executor/executor-interface";
import type { PackageRepository } from "./package-repository";
import type { MCPServerPackageConfig } from "./package-types";

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

  async getTools(): Promise<Tool[]> {
    return await this._executor.listTools(this.packageName);
  }

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
