import { DaytonaSandboxClient } from "./clients/daytona-client";
import { SandockSandboxClient } from "./clients/sandock-client";
import type { MCPSandboxProvider, SandboxClient } from "./sandbox-types";

/**
 * Sandbox Factory
 * Creates appropriate sandbox client based on provider
 */
// biome-ignore lint/complexity/noStaticOnlyClass: Factory pattern
export class SandboxFactory {
  static create(
    runtime: "node" | "python" | "java" | "go",
    provider: MCPSandboxProvider,
  ): SandboxClient {
    switch (provider) {
      case "SANDOCK":
        return new SandockSandboxClient(runtime);

      case "DAYTONA":
        return new DaytonaSandboxClient(runtime);

      case "E2B":
        throw new Error("E2B sandbox provider is not yet implemented");

      case "LOCAL":
        throw new Error("LOCAL provider should not use sandbox client");

      default:
        throw new Error(`Unknown sandbox provider: ${provider}`);
    }
  }
}
