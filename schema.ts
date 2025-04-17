import { z } from 'zod';

export const PackageKeySchema = z.string();

export const HostingBlackListSchema = z.array(PackageKeySchema);

export const FeaturedListSchema = z.array(PackageKeySchema);

export const CategoryConfigSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

export const MCPServerPackageConfigSchema = z.object({
  type: z.literal('mcp-server'),

  runtime: z.enum(['node', 'python', 'java']),
  packageName: z.string(),

  // if no custom key then would use name
  key: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),


  url: z.string().optional(),
  license: z.string().optional(),
  logo: z.string().optional().describe('URL to custom logo image, if undefined and the URL is Github, then it will use the Github logo'),
  author: z.string().optional(),
  env: z
    .record(
      z.object({
        description: z.string(),
        required: z.boolean(),
      }),
    )
    .optional(),
});
export const PackageConfigSchema = z.discriminatedUnion('type', [
  MCPServerPackageConfigSchema,
  z.object({
    type: z.literal('toolapp'),
    packageName: z.string(),
    url: z.string().optional(),
  }),
]);
