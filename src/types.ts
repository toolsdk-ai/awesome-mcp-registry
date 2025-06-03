
import { z } from 'zod'
import type { CategoryConfigSchema, PackageConfigSchema, MCPServerPackageConfigSchema, PackagesListSchema } from './schema';

export type MCPServerPackageConfig= z.infer<typeof MCPServerPackageConfigSchema>;
export type PackageConfig = z.infer<typeof PackageConfigSchema>;
export type CategoryConfig = z.infer<typeof CategoryConfigSchema>;
export type PackagesList = z.infer<typeof PackagesListSchema>;