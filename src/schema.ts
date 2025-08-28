import { z } from "@hono/zod-openapi";

export const PackageKeySchema = z.string();

export const HostingBlackListSchema = z.array(PackageKeySchema);

export const FeaturedListSchema = z.array(PackageKeySchema);

export const ToolExecuteSchema = z.object({
  packageName: z.string(),
  toolKey: z.string(),
  inputData: z.record(z.unknown()),
  envs: z.record(z.string()).optional(),
});

export const CategoryConfigSchema = z.object({
  key: z.string(),
  name: z.string(),
  description: z.string().optional(),
});

export const MCPServerPackageConfigSchema = z.object({
  type: z.literal("mcp-server"),

  runtime: z.enum(["node", "python", "java", "go"]),
  packageName: z.string().describe("Name of the node, python, java package "),
  packageVersion: z
    .string()
    .optional()
    .describe("Version of the package, if not provided then it will use latest version"),

  bin: z
    .string()
    .optional()
    .describe(
      "Binary Command to run the MCP server, if not provided then it will use the package name",
    ),
  binArgs: z
    .array(z.string())
    .optional()
    .describe(
      "Binary Arguments to pass to the command, if not provided then it will use an empty array",
    ),

  // if no custom key then would use name
  key: z.string().optional().describe("Unique key for url and slug"),
  name: z
    .string()
    .optional()
    .describe("Custom name for display, if empty then it will use the package name"),
  description: z.string().optional(),
  readme: z
    .string()
    .optional()
    .describe("URL to the README file, if not provided then it will use the package URL"),

  url: z.string().optional(),
  license: z.string().optional().describe("Open source license lie MIT, AGPL, GPL, etc"),
  logo: z
    .string()
    .optional()
    .describe(
      "URL to custom logo image, if undefined and the URL is Github, then it will use the Github logo",
    ),
  author: z.string().optional().describe("Author name of the ToolSDK.ai's developer ID"),
  env: z
    .record(
      z.object({
        description: z.string(),
        required: z.boolean(),
      }),
    )
    .optional(),
});

export const PackageConfigSchema = z.discriminatedUnion("type", [
  MCPServerPackageConfigSchema,
  z.object({
    type: z.literal("toolapp"),
    packageName: z.string(),
    url: z.string().optional(),
  }),
]);

export const PackagesListSchema = z.record(
  z.object({
    category: z.string().optional(),
    path: z.string(),
    validated: z.boolean().optional(),
    tools: z
      .record(
        z.object({
          name: z.string().optional(),
          description: z.string().optional(),
        }),
      )
      .optional(),
  }),
);

export const BaseResponseSchema = z.object({
  success: z.boolean(),
  code: z.number(),
  message: z.string(),
});

export const ErrorResponseSchema = BaseResponseSchema.omit({
  success: true,
}).extend({
  success: z.literal(false),
});

export const FeaturedResponseSchema = BaseResponseSchema.extend({
  data: z.array(z.string()).optional(),
});

export const CategoriesResponseSchema = BaseResponseSchema.extend({
  data: z.array(CategoryConfigSchema).optional(),
});

export const PackagesListResponseSchema = BaseResponseSchema.extend({
  data: PackagesListSchema.optional(),
});

export const PackageDetailDataSchema = MCPServerPackageConfigSchema.extend({
  tools: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        inputSchema: z
          .object({
            type: z.string(),
            properties: z.record(z.unknown()).optional(),
            required: z.array(z.string()).optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});

export const PackageDetailResponseSchema = BaseResponseSchema.extend({
  data: PackageDetailDataSchema.optional(),
});

export const ToolDataSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  inputSchema: z
    .object({
      type: z.string(),
      properties: z.record(z.unknown()).optional(),
      required: z.array(z.string()).optional(),
    })
    .optional(),
});

export const ToolsResponseSchema = BaseResponseSchema.extend({
  data: z.array(ToolDataSchema).optional(),
});

export const ExecuteToolResponseSchema = BaseResponseSchema.extend({
  data: z.unknown().optional(),
});

export const createSuccessResponseSchema = <T extends z.ZodTypeAny>(dataSchema: T) => {
  return BaseResponseSchema.extend({
    data: dataSchema.optional(),
  });
};

export const packageNameQuerySchema = z.object({
  packageName: z.string().optional(),
});
