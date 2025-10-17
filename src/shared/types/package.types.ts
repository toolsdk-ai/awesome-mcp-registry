/**
 * 包相关类型
 * 从原有的 types.ts 迁移过来
 */

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";
import type {
  CategoryConfigSchema,
  MCPServerPackageConfigSchema,
  PackageConfigSchema,
  PackagesListSchema,
} from "../../shared/schemas";

export type MCPServerPackageConfig = z.infer<typeof MCPServerPackageConfigSchema>;
export type PackageConfig = z.infer<typeof PackageConfigSchema>;
export type CategoryConfig = z.infer<typeof CategoryConfigSchema>;
export type PackagesList = z.infer<typeof PackagesListSchema>;

/**
 * 带工具列表的包配置
 */
export interface MCPServerPackageConfigWithTools extends MCPServerPackageConfig {
  tools?: Tool[];
}

/**
 * 通用响应格式
 */
export interface Response<T> {
  success: boolean;
  code: number;
  message: string;
  data?: T;
}
