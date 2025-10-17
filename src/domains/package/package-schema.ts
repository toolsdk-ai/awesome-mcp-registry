import { z } from "@hono/zod-openapi";
import { BaseResponseSchema } from "../../shared/schemas/common-schema";

/**
 * Package 领域的 Zod Schemas
 * 用于 API 输入输出验证和 OpenAPI 文档生成
 */

// 查询参数 Schema
export const packageNameQuerySchema = z.object({
  packageName: z.string().openapi({
    param: { name: "packageName", in: "query" },
    example: "@modelcontextprotocol/server-filesystem",
  }),
});

// 请求体 Schema
export const ToolExecuteSchema = z
  .object({
    packageName: z.string().openapi({ example: "@modelcontextprotocol/server-filesystem" }),
    toolKey: z.string().openapi({ example: "read_file" }),
    inputData: z.record(z.unknown()).openapi({ example: { path: "/tmp/test.txt" } }),
    envs: z.record(z.string()).optional(),
  })
  .openapi("ToolExecute");

// 工具数据 Schema
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

// Package 详情数据 Schema
const PackageDetailDataSchema = z.object({
  name: z.string().optional(),
  packageName: z.string(),
  description: z.string().optional(),
  category: z.string().optional(),
  validated: z.boolean().optional(),
  runtime: z.enum(["node", "python", "java", "go"]).optional(),
  tools: z.array(ToolDataSchema).optional(),
});

// 响应 Schema
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
