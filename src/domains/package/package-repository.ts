import fs from "node:fs";
import path from "node:path";
import allPackagesList from "../../../indexes/packages-list.json";
import { MCPServerPackageConfigSchema } from "../../shared/schemas";
import type { MCPServerPackageConfig, PackagesList } from "./package-types";

export class PackageRepository {
  private readonly packagesList: PackagesList;
  private readonly packagesDir: string;

  constructor(packagesDir: string) {
    this.packagesList = allPackagesList as PackagesList;
    this.packagesDir = packagesDir;
  }

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

  getAllPackages(): PackagesList {
    return this.packagesList;
  }

  exists(packageName: string): boolean {
    return !!this.packagesList[packageName];
  }
}
