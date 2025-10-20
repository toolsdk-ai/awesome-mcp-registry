import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { z } from "zod";
import type {
  MCPServerPackageConfigSchema,
  PackageConfigSchema,
  PackagesListSchema,
} from "../../shared/schemas";

export type MCPServerPackageConfig = z.infer<typeof MCPServerPackageConfigSchema>;

export type PackageConfig = z.infer<typeof PackageConfigSchema>;

export type PackagesList = z.infer<typeof PackagesListSchema>;

export interface MCPServerPackageConfigWithTools extends MCPServerPackageConfig {
  tools?: Tool[];
}
