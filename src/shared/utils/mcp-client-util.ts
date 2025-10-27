import assert from "node:assert";
import fs from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { MCPServerPackageConfig } from "../../domains/package/package-types";
import { getDirname } from "./file-util";

const __dirname = getDirname(import.meta.url);

export function getPackageJSON(packageName: string) {
  const packageJSONFilePath = path.join(
    __dirname,
    "../../../node_modules",
    packageName,
    "package.json",
  );

  if (!fs.existsSync(packageJSONFilePath)) {
    throw new Error(
      `Package '${packageName}' not found in node_modules. Install it first with: pnpm add ${packageName}`,
    );
  }

  const packageJSONStr = fs.readFileSync(packageJSONFilePath, "utf8");
  const packageJSON = JSON.parse(packageJSONStr);
  return packageJSON;
}

async function createMcpClient(
  mcpServerConfig: MCPServerPackageConfig,
  transport: StdioClientTransport,
) {
  const { packageName, name } = mcpServerConfig;

  const client = new Client(
    {
      name: `mcp-server-${name}-client`,
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    },
  );
  await client.connect(transport);

  const closeConnection = async () => {
    try {
      await client.close();
    } catch (e) {
      console.warn(`${packageName} mcp client close failure.`, e);
    }

    // Close transport to release child process and file descriptors
    try {
      await transport.close();
    } catch (e) {
      console.warn(`${packageName} mcp transport close failure.`, e);
    }
  };

  return { client, transport, closeConnection };
}

async function getNodeMcpClient(
  mcpServerConfig: MCPServerPackageConfig,
  env?: Record<string, string>,
) {
  const { packageName } = mcpServerConfig;
  const packageJSON = getPackageJSON(packageName);
  let binFilePath = "";
  let binPath: string | undefined;

  if (typeof packageJSON.bin === "string") {
    binPath = packageJSON.bin;
  } else if (typeof packageJSON.bin === "object") {
    binPath = Object.values(packageJSON.bin)[0] as string | undefined;
  } else {
    binPath = packageJSON.main;
  }
  assert(binPath, `Package ${packageName} does not have a valid bin path in package.json.`);

  binFilePath = path.join(__dirname, "../../../node_modules", packageName, binPath);

  const mcpServerBinPath = mcpServerConfig.bin || binFilePath;
  const binArgs = mcpServerConfig.binArgs || [];
  const transport = new StdioClientTransport({
    args: [mcpServerBinPath, ...binArgs],
    command: process.execPath,
    env: env || {},
  });

  return createMcpClient(mcpServerConfig, transport);
}

async function getPyMcpClient(
  mcpServerConfig: MCPServerPackageConfig,
  env?: Record<string, string>,
) {
  const { packageName } = mcpServerConfig;

  const pythonModuleName = packageName;

  const transport = new StdioClientTransport({
    command: "uv",
    args: ["run", "--directory", "./python-mcp", pythonModuleName],
    env: {
      ...(Object.fromEntries(
        Object.entries(process.env).filter(([_, v]) => v !== undefined),
      ) as Record<string, string>),
      ...env,
    },
  });

  return createMcpClient(mcpServerConfig, transport);
}

export async function getMcpClient(
  mcpServerConfig: MCPServerPackageConfig,
  env?: Record<string, string>,
) {
  const { runtime } = mcpServerConfig;
  if (runtime === "python") {
    return getPyMcpClient(mcpServerConfig, env);
  }
  return getNodeMcpClient(mcpServerConfig, env);
}
