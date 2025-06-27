import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { MCPServerPackageConfig } from "./types";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import fs from "fs";
import * as path from "path";
import allPackagesList from "../indexes/packages-list.json";
import assert from "assert";
import { MCPServerPackageConfigSchema, PackagesListSchema } from "./schema";

export const typedAllPackagesList = PackagesListSchema.parse(allPackagesList);

export function getPackageConfigByKey(packageKey: string): MCPServerPackageConfig {
  const value = typedAllPackagesList[packageKey];

  const jsonFile = value.path;
  // read the JSON file and convert it to MCPServerPackageConfig
  const jsonStr = fs.readFileSync(__dirname + "/../packages/" + jsonFile, "utf-8");
  const mcpServerConfig: MCPServerPackageConfig = MCPServerPackageConfigSchema.parse(JSON.parse(jsonStr));
  return mcpServerConfig;
}

export function getPackageJSON(packageName: string) {
  const packageJSONFilePath = __dirname + "/../node_modules/" + packageName + "/package.json";
  const packageJSONStr = fs.readFileSync(packageJSONFilePath, "utf8");
  const packageJSON = JSON.parse(packageJSONStr);
  return packageJSON;
}
export async function getMcpClient(mcpServerConfig: MCPServerPackageConfig, env?: Record<string, string>) {
  const { packageName } = mcpServerConfig;

  const packageJSON = getPackageJSON(packageName);
  let binFilePath = "";
  let binPath;

  if (typeof packageJSON.bin === "string") {
    binPath = packageJSON.bin;
  } else if (typeof packageJSON.bin === "object") {
    binPath = Object.values(packageJSON.bin)[0];
  } else {
    binPath = packageJSON.main;
  }
  assert(binPath, `Package ${packageName} does not have a valid bin path in package.json.`);

  // binFilePath = 'plugin_packages/' + packageName + `/${binPath}`;
  binFilePath = __dirname + "/../node_modules/" + packageName + `/${binPath}`;

  const mcpServerBinPath = mcpServerConfig.bin || binFilePath;
  const binArgs = mcpServerConfig.binArgs || [];
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [mcpServerBinPath, ...binArgs],
    env: env || {},
  });

  const client = new Client(
    {
      name: `mcp-server-${mcpServerConfig.name}-client`,
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );
  await client.connect(transport);

  const closeConnection = async () => {
    try {
      await client.close();
    } catch (e) {
      console.warn(`${packageName} mcp client close failure.`, e);
    }
  };

  return { client, transport, closeConnection };
}

export function updatePackageJsonDependencies({
  packageDeps,
  enableValidation = false,
}: {
  packageDeps: Record<string, string>;
  enableValidation?: boolean;
}) {
  // Write package.json dependencies
  const packageJsonFile = "./package.json";
  const packageJSONStr = fs.readFileSync(packageJsonFile, "utf-8");
  const newDeps = {
    "@modelcontextprotocol/sdk": "^1.12.0",
    lodash: "^4.17.21",
    zod: "^3.23.30",
  } as Record<string, string>;

  for (const [depName, depVer] of Object.entries(packageDeps)) {
    if (!enableValidation || typedAllPackagesList[depName]?.validated) {
      newDeps[depName] = depVer || "latest";
    }
  }

  const packageJSON = JSON.parse(packageJSONStr);
  packageJSON.dependencies = newDeps;
  fs.writeFileSync(packageJsonFile, JSON.stringify(packageJSON, null, 2), "utf-8");

  console.log(`Generated new package.json file at ${packageJsonFile}`);
}

export function getActualVersion(packageName: string, configuredVersion?: string): string {
  if (configuredVersion && configuredVersion !== "latest") {
    return configuredVersion;
  }

  try {
    const packageJsonPath = path.join(__dirname, "../node_modules", packageName, "package.json");
    const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, "utf-8"));
    return packageJson.version;
  } catch (e) {
    console.warn(`Failed to read version for ${packageName}, using 'latest' by default`, (e as Error).message);
    return "latest";
  }
}

export function withTimeout<T>(ms: number, promise: Promise<T>): Promise<T> {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error(`Operation timed out after ${ms}ms`));
    }, ms);
    promise.then(
      (res) => {
        clearTimeout(timer);
        resolve(res);
      },
      (err) => {
        clearTimeout(timer);
        reject(err);
      }
    );
  });
}