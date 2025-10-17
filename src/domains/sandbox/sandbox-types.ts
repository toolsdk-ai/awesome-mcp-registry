/**
 * Sandbox 领域类型定义
 */

// 从 sandbox-client-interface.ts 重新导出
export type { ISandboxClient, SandboxExecuteResult } from "./sandbox-client-interface";
export { SandboxStatus } from "./sandbox-client-interface";

/**
 * 沙盒提供商类型
 */
export type MCPSandboxProvider = "LOCAL" | "DAYTONA" | "SANDOCK" | "E2B";
