import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";
import type {
  BaseResponseSchema,
  CategoriesResponseSchema,
  CategoryConfigSchema,
  ErrorResponseSchema,
  ExecuteToolResponseSchema,
  FeaturedResponseSchema,
  MCPServerPackageConfigSchema,
  PackageConfigSchema,
  PackageDetailDataSchema,
  PackageDetailResponseSchema,
  PackagesListResponseSchema,
  PackagesListSchema,
  ToolDataSchema,
  ToolExecuteSchema,
  ToolsResponseSchema,
} from "./schema";

export type MCPServerPackageConfig = z.infer<typeof MCPServerPackageConfigSchema>;
export type PackageConfig = z.infer<typeof PackageConfigSchema>;
export type CategoryConfig = z.infer<typeof CategoryConfigSchema>;
export type PackagesList = z.infer<typeof PackagesListSchema>;
export type ToolExecute = z.infer<typeof ToolExecuteSchema>;

export type MCPSandboxProvider = "LOCAL" | "DAYTONA" | "SANDOCK";

export interface Response<T> {
  success: boolean;
  code: number;
  message: string;
  data?: T;
}

export type MCPServerPackageConfigWithTools = MCPServerPackageConfig & {
  tools?: Tool[];
};

// API Response Types
export type BaseResponse = z.infer<typeof BaseResponseSchema>;
export type FeaturedResponse = z.infer<typeof FeaturedResponseSchema>;
export type CategoriesResponse = z.infer<typeof CategoriesResponseSchema>;
export type PackagesListResponse = z.infer<typeof PackagesListResponseSchema>;
export type PackageDetailData = z.infer<typeof PackageDetailDataSchema>;
export type PackageDetailResponse = z.infer<typeof PackageDetailResponseSchema>;
export type ToolData = z.infer<typeof ToolDataSchema>;
export type ToolsResponse = z.infer<typeof ToolsResponseSchema>;
export type ExecuteToolResponse = z.infer<typeof ExecuteToolResponseSchema>;
export type ErrorResponse = z.infer<typeof ErrorResponseSchema>;
