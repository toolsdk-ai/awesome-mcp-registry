import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export interface ToolExecuteRequest {
  packageName: string;
  toolKey: string;
  inputData: Record<string, unknown>;
  envs?: Record<string, string>;
}

/**
 * Tool Executor Interface
 * Unified abstraction for local and sandbox execution
 */
export interface ToolExecutor {
  executeTool(request: ToolExecuteRequest): Promise<unknown>;
  listTools(packageName: string): Promise<Tool[]>;
}
