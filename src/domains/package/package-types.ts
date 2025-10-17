/**
 * Package 领域类型定义
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";
import type {
  MCPServerPackageConfigSchema,
  PackageConfigSchema,
  PackagesListSchema,
} from "../../shared/schemas";

/**
 * MCP 服务器包配置类型
 */
export type MCPServerPackageConfig = z.infer<typeof MCPServerPackageConfigSchema>;

/**
 * 包配置类型（包含不同类型的包）
 */
export type PackageConfig = z.infer<typeof PackageConfigSchema>;

/**
 * 包列表类型
 */
export type PackagesList = z.infer<typeof PackagesListSchema>;

/**
 * 带工具列表的包配置
 */
export interface MCPServerPackageConfigWithTools extends MCPServerPackageConfig {
  tools?: Tool[];
}
