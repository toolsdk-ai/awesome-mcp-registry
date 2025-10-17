import fs from "node:fs";
import path from "node:path";
import allPackagesList from "../../../indexes/packages-list.json";
import { MCPServerPackageConfigSchema } from "../../shared/schemas";
import type { MCPServerPackageConfig, PackagesList } from "../../shared/types";

/**
 * 包仓储
 * 负责从文件系统读取包配置数据
 */
export class PackageRepository {
  private readonly packagesList: PackagesList;
  private readonly packagesDir: string;

  constructor(packagesDir: string) {
    this.packagesList = allPackagesList as PackagesList;
    this.packagesDir = packagesDir;
  }

  /**
   * 根据包名获取配置
   * @param packageName 包名
   * @returns 包配置
   * @throws Error 如果包不存在
   */
  getPackageConfig(packageName: string): MCPServerPackageConfig {
    const packageInfo = this.packagesList[packageName];
    if (!packageInfo) {
      throw new Error(`Package '${packageName}' not found`);
    }

    const configPath = path.join(this.packagesDir, packageInfo.path);
    const configContent = fs.readFileSync(configPath, "utf-8");
    const packageConfig = MCPServerPackageConfigSchema.parse(JSON.parse(configContent));

    return packageConfig;
  }

  /**
   * 获取所有包列表
   * @returns 包列表
   */
  getAllPackages(): PackagesList {
    return this.packagesList;
  }

  /**
   * 检查包是否存在
   * @param packageName 包名
   * @returns 是否存在
   */
  exists(packageName: string): boolean {
    return !!this.packagesList[packageName];
  }
}
