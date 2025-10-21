import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export interface SandboxExecuteResult {
  exitCode: number;
  result: string;
}

/**
 * Sandbox Client Interface
 * Unified abstraction for different sandbox providers (Daytona, E2B, Sandock)
 */
export interface SandboxClient {
  initialize(): Promise<void>;
  listTools(packageKey: string): Promise<Tool[]>;
  executeTool(
    packageKey: string,
    toolName: string,
    args: Record<string, unknown>,
    envs?: Record<string, string>,
  ): Promise<unknown>;
  destroy(): Promise<void>;
}

export type MCPSandboxProvider = "LOCAL" | "DAYTONA" | "SANDOCK" | "E2B";

export interface MCPToolResult {
  toolCount: number;
  tools: Tool[];
}

export interface MCPExecuteResult {
  result: unknown;
  isError?: boolean;
  errorMessage?: string;
}
