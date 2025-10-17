/**
 * 环境配置管理
 * 集中管理所有环境变量
 */

import path from "node:path";
import dotenv from "dotenv";
import type { MCPSandboxProvider } from "../types";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

/**
 * 获取沙盒提供商
 */
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

/**
 * 获取 Daytona API 配置
 */
export function getDaytonaConfig() {
  return {
    apiKey: process.env.DAYTONA_API_KEY || "",
    apiUrl: process.env.DAYTONA_API_URL,
  };
}

/**
 * Get Sandock Daytona API Configuration
 */
export function getSandockDaytonaConfig() {
  return {
    apiKey: process.env.DAYTONA_API_KEY || "",
    apiUrl: process.env.SANDOCK_DAYTONA_API_URL || process.env.DAYTONA_API_URL,
  };
}

/**
 * 获取 MeiliSearch 配置
 */
export function getMeiliSearchConfig() {
  return {
    host: process.env.MEILI_HTTP_ADDR || "http://localhost:7700",
    apiKey: process.env.MEILI_MASTER_KEY || null,
  };
}

/**
 * 获取服务器端口
 */
export function getServerPort(): number {
  return process.env.MCP_SERVER_PORT ? parseInt(process.env.MCP_SERVER_PORT, 10) : 3003;
}

/**
 * 是否启用搜索功能
 */
export function isSearchEnabled(): boolean {
  return process.env.ENABLE_SEARCH === "true";
}
