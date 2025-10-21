import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export type { SandboxClient, SandboxExecuteResult } from "./sandbox-client-interface";

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
