import path from "node:path";
import dotenv from "dotenv";
import type { MCPSandboxProvider } from "../../domains/sandbox/sandbox-types";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

export function getSandboxProvider(): MCPSandboxProvider {
  console.log("process.env.MCP_SANDBOX_PROVIDER", process.env.MCP_SANDBOX_PROVIDER);
  const provider = (process.env.MCP_SANDBOX_PROVIDER || "LOCAL").toUpperCase();

  if (
    provider === "LOCAL" ||
    provider === "DAYTONA" ||
    provider === "SANDOCK" ||
    provider === "E2B"
  ) {
    return provider as MCPSandboxProvider;
  }

  console.warn(
    `[Environment] Unsupported MCP_SANDBOX_PROVIDER value '${provider}', falling back to LOCAL mode`,
  );
  return "LOCAL";
}

export function getDaytonaConfig() {
  return {
    apiKey: process.env.DAYTONA_API_KEY || "",
    apiUrl: process.env.DAYTONA_API_URL,
  };
}

export function getSandockConfig() {
  return {
    apiKey: process.env.SANDOCK_API_KEY || "",
    apiUrl: process.env.SANDOCK_API_URL || "https://sandock.ai",
  };
}

export function getE2BConfig() {
  return {
    apiKey: process.env.E2B_API_KEY || "",
  };
}

export function getMeiliSearchConfig() {
  return {
    host: process.env.MEILI_HTTP_ADDR || "http://localhost:7700",
    apiKey: process.env.MEILI_MASTER_KEY || null,
  };
}

export function getServerPort(): number {
  const port = process.env.PORT || process.env.MCP_SERVER_PORT;
  return port ? parseInt(port, 10) : 3003;
}

export function isSearchEnabled(): boolean {
  return process.env.ENABLE_SEARCH === "true";
}
