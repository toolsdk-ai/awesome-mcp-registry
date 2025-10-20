import { DaytonaSandboxClient } from "./clients/daytona-client";
import type { ISandboxClient } from "./sandbox-client-interface";
import type { MCPSandboxProvider } from "./sandbox-types";

/**
 * Sandbox Factory
 * Creates appropriate sandbox client based on provider
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Factory pattern
export class SandboxFactory {
  static create(
    runtime: "node" | "python" | "java" | "go",
    provider: MCPSandboxProvider,
  ): ISandboxClient {
    switch (provider) {
      case "DAYTONA":
      case "SANDOCK":
        return new DaytonaSandboxClient(runtime, provider);

      case "E2B":
        throw new Error("E2B sandbox provider is not yet implemented");

      case "LOCAL":
        throw new Error("LOCAL provider should not use sandbox client");

      default:
        throw new Error(`Unknown sandbox provider: ${provider}`);
    }
  }
}
