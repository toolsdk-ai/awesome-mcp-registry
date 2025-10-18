/**
 * Scripts Helper Module
 *
 * 这个模块为 scripts/ 目录下的脚本提供统一的辅助函数、类型和常量导出。
 * 它作为 src/ 和 scripts/ 之间的桥梁，保持清晰的边界。
 */

import path from "node:path";
import { PackageRepository } from "../../domains/package/package-repository";

// ==================== Re-export Types ====================
export type { CategoryConfig } from "../../domains/config/config-types";
export type {
  MCPServerPackageConfig,
  PackageConfig,
  PackagesList,
} from "../../domains/package/package-types";
// ==================== Re-export Schemas ====================
export {
  CategoryConfigSchema,
  MCPServerPackageConfigSchema,
  PackagesListSchema,
} from "../schemas/common-schema";
export { getDirname } from "../utils/file-util";
export { getMcpClient } from "../utils/mcp-client-util";
// ==================== Re-export Utils ====================
export {
  getActualVersion,
  updatePackageJsonDependencies,
} from "../utils/package-util";
export { withTimeout } from "../utils/promise-util";
export {
  extractPackageName,
  getPythonDependencies,
  isValidNpmPackage,
  parsePyprojectToml,
} from "../utils/validation-util";

// ==================== PackageRepository Instance ====================
// 创建全局 PackageRepository 实例供 scripts 使用
const packagesDir = path.resolve(process.cwd(), "./packages");
const packageRepository = new PackageRepository(packagesDir);

// ==================== Helper Functions ====================
/**
 * 根据 package key 获取包配置
 * 这是 PackageRepository.getPackageConfig 的包装函数，保持向后兼容
 */
export function getPackageConfigByKey(key: string) {
  return packageRepository.getPackageConfig(key);
}

/**
 * 获取所有包的列表
 * 这是 PackageRepository.getAllPackages 的包装，保持向后兼容
 */
export const typedAllPackagesList = packageRepository.getAllPackages();
