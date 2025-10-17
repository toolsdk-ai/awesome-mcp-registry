import type { MCPSandboxProvider } from "../sandbox/sandbox-types";
import type { IToolExecutor } from "./executor-interface";
import { LocalExecutor } from "./local-executor";
import { SandboxExecutor } from "./sandbox-executor";

/**
 * 执行器工厂
 * 根据配置创建合适的执行器
 */
// biome-ignore lint/complexity/noStaticOnlyClass: 工厂模式使用静态类提供清晰的命名空间
export class ExecutorFactory {
  /**
   * 创建执行器
   * @param provider 沙盒提供商
   * @returns 执行器实例
   */
  static create(provider: MCPSandboxProvider): IToolExecutor {
    if (provider === "LOCAL") {
      console.log("[ExecutorFactory] Creating LocalExecutor");
      return new LocalExecutor();
    }

    console.log(`[ExecutorFactory] Creating SandboxExecutor with provider: ${provider}`);
    return new SandboxExecutor(provider);
  }
}
