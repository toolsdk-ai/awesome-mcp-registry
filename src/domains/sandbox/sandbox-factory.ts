import { DaytonaSandboxClient } from "./clients/daytona-client";
import { E2BSandboxClient } from "./clients/e2b-client";
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
        return new E2BSandboxClient(runtime);

      case "LOCAL":
        throw new Error("LOCAL provider should not use sandbox client");

      default:
        throw new Error(`Unknown sandbox provider: ${provider}`);
    }
  }
}
