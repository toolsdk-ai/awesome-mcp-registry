
import { z } from 'zod'
import type { CategoryConfigSchema, PackageConfigSchema, MCPServerPackageConfigSchema } from './schema';

export type MCPServerPackageConfig= z.infer<typeof MCPServerPackageConfigSchema>;
export type PackageConfig = z.infer<typeof PackageConfigSchema>;
export type CategoryConfig = z.infer<typeof CategoryConfigSchema>;