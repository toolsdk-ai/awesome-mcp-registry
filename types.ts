
import { z } from 'zod'
import type { CategoryConfigSchema, PackageConfigSchema } from './schema';

export type PackageConfig = z.infer<typeof PackageConfigSchema>;
export type CategoryConfig = z.infer<typeof CategoryConfigSchema>;