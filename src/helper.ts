/**
 * @deprecated 该文件已废弃，请从新位置导入
 *
 * 迁移指南：
 * - getSandboxProvider -> shared/config/environment
 * - getMcpClient, getPackageJSON -> shared/utils/mcp-client-util
 * - extractLastOuterJSON -> shared/utils/string-util
 * - extractPackageName, getPythonDependencies, isValidNpmPackage, parsePyprojectToml -> shared/utils/validation-util
 * - getPackageConfigByKey -> 使用 PackageRepository.getPackageConfig (domains/package/package-repository)
 * - updatePackageJsonDependencies, getActualVersion -> shared/utils/package-util
 * - withTimeout -> shared/utils/promise-util
 */

// 从新位置重新导出（兼容层）
export { getSandboxProvider } from "./shared/config/environment";
export { getMcpClient, getPackageJSON } from "./shared/utils/mcp-client-util";
export { getActualVersion, updatePackageJsonDependencies } from "./shared/utils/package-util";
export { withTimeout } from "./shared/utils/promise-util";
export { extractLastOuterJSON } from "./shared/utils/string-util";
export {
  extractPackageName,
  getPythonDependencies,
  isValidNpmPackage,
  parsePyprojectToml,
} from "./shared/utils/validation-util";

// 保留旧的实现以便兼容，但标记为废弃
import fs from "node:fs";
import path from "node:path";
import allPackagesList from "../indexes/packages-list.json";
import { MCPServerPackageConfigSchema, PackagesListSchema } from "./schema";
import type { MCPServerPackageConfig } from "./types";
import { getDirname } from "./utils";

const __dirname = getDirname(import.meta.url);

export const typedAllPackagesList = PackagesListSchema.parse(allPackagesList);

/**
 * @deprecated 请使用 PackageRepository.getPackageConfig 代替
 * 根据包键获取包配置
 */
export function getPackageConfigByKey(packageKey: string): MCPServerPackageConfig {
  const value = typedAllPackagesList[packageKey];
  if (!value) {
    throw new Error(`Package '${packageKey}' not found in packages list.`);
  }
  const jsonFile = value.path;
  const jsonStr = fs.readFileSync(`${__dirname}/../packages/${jsonFile}`, "utf-8");
  const mcpServerConfig: MCPServerPackageConfig = MCPServerPackageConfigSchema.parse(
    JSON.parse(jsonStr),
  );
  return mcpServerConfig;
}
