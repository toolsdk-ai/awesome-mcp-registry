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

  runtime: z.enum(['node', 'python', 'java', 'go']),
  packageName: z.string().describe('Name of the node, python, java package '),
  packageVersion: z.string().optional().describe('Version of the package, if not provided then it will use latest version'),

  bin: z.string().optional().describe('Binary Command to run the MCP server, if not provided then it will use the package name'),
  binArgs: z.array(z.string()).optional().describe('Binary Arguments to pass to the command, if not provided then it will use an empty array'),

  // if no custom key then would use name
  key: z.string().optional().describe('Unique key for url and slug'),
  name: z.string().optional().describe('Custom name for display, if empty then it will use the package name'),
  description: z.string().optional(),
  readme: z.string().optional().describe('URL to the README file, if not provided then it will use the package URL'),

  url: z.string().optional(),
  license: z.string().optional().describe('Open source license lie MIT, AGPL, GPL, etc'),
  logo: z.string().optional().describe('URL to custom logo image, if undefined and the URL is Github, then it will use the Github logo'),
  author: z.string().optional().describe('Author name of the ToolSDK.ai\'s developer ID'),
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
    starCount: z.number().optional(),
  }),
]);

export const PackagesListSchema = z.record(
  z.object({
    category: z.string().optional(),
    path: z.string(),
    validated: z.boolean().optional(),
    stars: z.number().optional(),
    tools: z.record(z.object(
      {
        name: z.string().optional(),
        description: z.string().optional(),
      })).optional(),
  })
)