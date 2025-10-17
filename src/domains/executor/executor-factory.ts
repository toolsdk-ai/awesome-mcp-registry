import type { MCPSandboxProvider } from "../sandbox/sandbox-types";
import type { IToolExecutor } from "./executor-interface";
import { LocalExecutor } from "./local-executor";
import { SandboxExecutor } from "./sandbox-executor";

/**
 * Executor Factory
 * Creates appropriate executor based on sandbox provider configuration
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Factory pattern
export class ExecutorFactory {
  static create(provider: MCPSandboxProvider): IToolExecutor {
    if (provider === "LOCAL") {
      console.log("[ExecutorFactory] Creating LocalExecutor");
      return new LocalExecutor();
    }

    console.log(`[ExecutorFactory] Creating SandboxExecutor with provider: ${provider}`);
    return new SandboxExecutor(provider);
  }
}
