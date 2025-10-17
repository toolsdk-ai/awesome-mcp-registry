import type { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * 工具执行请求
 */
export interface ToolExecuteRequest {
  packageName: string;
  toolKey: string;
  inputData: Record<string, unknown>;
  envs?: Record<string, string>;
}

/**
 * 工具执行器接口
 * 统一本地执行和沙盒执行的抽象
 */
export interface IToolExecutor {
  /**
   * 执行工具
   * @param request 执行请求
   * @returns 执行结果
   */
  executeTool(request: ToolExecuteRequest): Promise<unknown>;

  /**
   * 列出包的所有工具
   * @param packageName 包名
   * @returns 工具列表
   */
  listTools(packageName: string): Promise<Tool[]>;
}
