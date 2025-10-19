/**
 * Scripts Helper Module
 *
 * This module provides unified helper functions, types, and constant exports for scripts in the scripts/ directory.
 * It serves as a bridge between src/ and scripts/, maintaining clear boundaries.
 */

import path from "node:path";
import { PackageRepository } from "../../domains/package/package-repository";

// ==================== Constants ====================
/**
 * Path to the packages directory
 */
export const PACKAGES_DIR_PATH = path.resolve(process.cwd(), "./packages");

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

// ==================== Re-export Utils ====================
// File utilities
export { getDirname } from "../utils/file-util";

// MCP client utilities
export { getMcpClient } from "../utils/mcp-client-util";

// Package utilities
export {
  getActualVersion,
  updatePackageJsonDependencies,
} from "../utils/package-util";

// Promise utilities
export { withTimeout } from "../utils/promise-util";

// Validation utilities
export {
  extractPackageName,
  getPythonDependencies,
  isValidNpmPackage,
  parsePyprojectToml,
} from "../utils/validation-util";

// ==================== PackageRepository Instance ====================
/**
 * Singleton PackageRepository instance for scripts to use
 * Lazily initialized on first access to avoid side effects during module loading
 */
let packageRepositoryInstance: PackageRepository | null = null;

/**
 * Get the singleton PackageRepository instance
 */
function getPackageRepository(): PackageRepository {
  if (!packageRepositoryInstance) {
    packageRepositoryInstance = new PackageRepository(PACKAGES_DIR_PATH);
  }
  return packageRepositoryInstance;
}

// ==================== Package Access Functions ====================
/**
 * Get package configuration by package key
 *
 * @param key - Package key to look up
 * @returns Package configuration object
 */
export function getPackageConfigByKey(key: string) {
  return getPackageRepository().getPackageConfig(key);
}

/**
 * Get list of all packages
 * Note: This function reads from the file system each time it's called.
 * If you need to iterate and modify the list, consider using a local variable.
 *
 * @returns Object containing all packages indexed by their keys
 */
export function getAllPackages() {
  return getPackageRepository().getAllPackages();
}
