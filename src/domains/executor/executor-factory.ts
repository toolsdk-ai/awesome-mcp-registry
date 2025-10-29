import { getSandboxProvider } from "../../shared/config/environment";
import type { MCPSandboxProvider } from "../sandbox/sandbox-types";
import type { ToolExecutor } from "./executor-types";
import { LocalExecutor } from "./local-executor";
import { SandboxExecutor } from "./sandbox-executor";

/**
 * Executor Factory
 * Creates appropriate executor based on sandbox provider configuration
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Factory pattern
export class ExecutorFactory {
  /**
   * Validate if the provided sandbox provider is valid
   */
  private static isValidProvider(provider: unknown): provider is MCPSandboxProvider {
    return (
      provider === "LOCAL" || provider === "DAYTONA" || provider === "SANDOCK" || provider === "E2B"
    );
  }

  /**
   * Create executor with optional provider override
   * If sandboxProvider is provided, it takes priority over environment config
   */
  static create(overrideProvider?: MCPSandboxProvider): ToolExecutor {
    const provider = ExecutorFactory.isValidProvider(overrideProvider)
      ? overrideProvider
      : getSandboxProvider();

    if (provider === "LOCAL") {
      console.log("[ExecutorFactory] Creating LocalExecutor");
      return new LocalExecutor();
    }

    console.log(`[ExecutorFactory] Creating SandboxExecutor with provider: ${provider}`);
    return new SandboxExecutor(provider);
  }
}
