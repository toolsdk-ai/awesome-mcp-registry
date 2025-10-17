import type { MCPSandboxProvider } from "../../shared/types";
import { DaytonaSandboxClient } from "./clients/DaytonaSandboxClient";
import type { ISandboxClient } from "./ISandboxClient";

/**
 * 沙盒工厂
 * 根据提供商创建对应的沙盒客户端
 */
export class SandboxFactory {
  /**
   * 创建沙盒客户端
   * @param runtime 运行时环境
   * @param provider 沙盒提供商
   * @returns 沙盒客户端实例
   */
  static create(
    runtime: "node" | "python" | "java" | "go",
    provider: MCPSandboxProvider,
  ): ISandboxClient {
    switch (provider) {
      case "DAYTONA":
      case "SANDOCK":
        // Daytona 和 Sandock 使用同一个客户端，只是配置不同
        return new DaytonaSandboxClient(runtime, provider);

      case "E2B":
        // 未来实现 E2B
        throw new Error("E2B sandbox provider is not yet implemented");

      case "LOCAL":
        throw new Error("LOCAL provider should not use sandbox client");

      default:
        throw new Error(`Unknown sandbox provider: ${provider}`);
    }
  }
}
