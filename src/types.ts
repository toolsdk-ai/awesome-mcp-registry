import { z } from 'zod';
import type {
  CategoryConfigSchema,
  PackageConfigSchema,
  MCPServerPackageConfigSchema,
  PackagesListSchema,
  ToolExecuteSchema,
} from './schema';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export type MCPServerPackageConfig = z.infer<typeof MCPServerPackageConfigSchema>;
export type PackageConfig = z.infer<typeof PackageConfigSchema>;
export type CategoryConfig = z.infer<typeof CategoryConfigSchema>;
export type PackagesList = z.infer<typeof PackagesListSchema>;
export type ToolExecute = z.infer<typeof ToolExecuteSchema>;

export interface Response<T> {
  success: boolean;
  code: number;
  message: string;
  data?: T;
}

export type MCPServerPackageConfigWithTools = MCPServerPackageConfig & {
  tools?: Tool[];
};
