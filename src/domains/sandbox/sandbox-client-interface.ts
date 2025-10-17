import type { Tool } from "@modelcontextprotocol/sdk/types.js";

/**
 * 沙盒执行结果
 */
export interface SandboxExecuteResult {
  exitCode: number;
  result: string;
}

/**
 * 沙盒状态
 */
export enum SandboxStatus {
  IDLE = "idle",
  INITIALIZING = "initializing",
  READY = "ready",
  BUSY = "busy",
  ERROR = "error",
  DESTROYED = "destroyed",
}

/**
 * 沙盒客户端接口
 * 不同沙盒提供商（Daytona、E2B、Sandock）的统一抽象
 */
export interface ISandboxClient {
  /**
   * 初始化沙盒（幂等操作）
   */
  initialize(): Promise<void>;

  /**
   * 列出工具
   * @param packageKey 包键
   * @returns 工具列表
   */
  listTools(packageKey: string): Promise<Tool[]>;

  /**
   * 执行工具
   * @param packageKey 包键
   * @param toolName 工具名
   * @param args 参数
   * @param envs 环境变量
   * @returns 执行结果
   */
  executeTool(
    packageKey: string,
    toolName: string,
    args: Record<string, unknown>,
    envs?: Record<string, string>,
  ): Promise<unknown>;

  /**
   * 销毁沙盒
   */
  destroy(): Promise<void>;

  /**
   * 获取沙盒状态
   */
  getStatus(): SandboxStatus;
}
