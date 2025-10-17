import { z } from "@hono/zod-openapi";
import { BaseResponseSchema } from "../../shared/schemas/common-schema";

export const packageNameQuerySchema = z.object({
  packageName: z.string().openapi({
    param: { name: "packageName", in: "query" },
    example: "@modelcontextprotocol/server-filesystem",
  }),
});

export const ToolExecuteSchema = z
  .object({
    packageName: z.string().openapi({ example: "@modelcontextprotocol/server-filesystem" }),
    toolKey: z.string().openapi({ example: "read_file" }),
    inputData: z.record(z.unknown()).openapi({ example: { path: "/tmp/test.txt" } }),
    envs: z.record(z.string()).optional(),
  })
  .openapi("ToolExecute");

const ToolDataSchema = z.object({
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

const PackageDetailDataSchema = z.object({
  name: z.string().optional(),
  packageName: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  validated: z.boolean().optional(),
  runtime: z.enum(["node", "python", "java", "go"]).optional(),
  tools: z.array(ToolDataSchema).optional(),
});

export const PackageDetailResponseSchema = BaseResponseSchema.extend({
  data: PackageDetailDataSchema.optional(),
}).openapi("PackageDetailResponse");

export const ToolsResponseSchema = BaseResponseSchema.extend({
  data: z.array(ToolDataSchema).optional(),
}).openapi("ToolsResponse");

export const ExecuteToolResponseSchema = BaseResponseSchema.extend({
  data: z.unknown().optional(),
}).openapi("ExecuteToolResponse");

export const PackagesListResponseSchema = BaseResponseSchema.extend({
  data: z.record(z.unknown()).optional(),
}).openapi("PackagesListResponse");
