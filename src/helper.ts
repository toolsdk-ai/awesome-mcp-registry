import assert from "node:assert";
import fs from "node:fs";
import * as path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import axios from "axios";
import semver from "semver";
import toml from "toml";
import allPackagesList from "../indexes/packages-list.json";
import { MCPServerPackageConfigSchema, PackagesListSchema } from "./schema";
import type { MCPServerPackageConfig } from "./types";

export const typedAllPackagesList = PackagesListSchema.parse(allPackagesList);

export function getPackageConfigByKey(packageKey: string): MCPServerPackageConfig {
  const value = typedAllPackagesList[packageKey];
  if (!value) {
    throw new Error(`Package '${packageKey}' not found in packages list.`);
  }
  const jsonFile = value.path;
  // read the JSON file and convert it to MCPServerPackageConfig
  const jsonStr = fs.readFileSync(`${__dirname}/../packages/${jsonFile}`, "utf-8");
  const mcpServerConfig: MCPServerPackageConfig = MCPServerPackageConfigSchema.parse(
    JSON.parse(jsonStr),
  );
  return mcpServerConfig;
}

function getPackageJSON(packageName: string) {
  const packageJSONFilePath = `${__dirname}/../node_modules/${packageName}/package.json`;
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

  binFilePath = `${__dirname}/../node_modules/${packageName}/${binPath}`;

  const mcpServerBinPath = mcpServerConfig.bin || binFilePath;
  const binArgs = mcpServerConfig.binArgs || [];
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [mcpServerBinPath, ...binArgs],
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
    "@hono/node-server": "1.15.0",
    "@hono/swagger-ui": "^0.5.2",
    "@hono/zod-openapi": "^0.16.4",
    lodash: "^4.17.21",
    toml: "^3.0.0",
    zod: "^3.23.30",
    axios: "^1.9.0",
    hono: "4.8.3",
    semver: "^7.5.4",
  } as Record<string, string>;

  for (const [depName, depVer] of Object.entries(packageDeps)) {
    if (!enableValidation || typedAllPackagesList[depName]?.validated) {
      newDeps[depName] = depVer || "latest";
    }
  }

  const blacklistDeps = new Set([
    "@mcp-server/google-search-mcp",
    "@executeautomation/playwright-mcp-server",
  ]);
  for (const dep of blacklistDeps) {
    if (newDeps[dep]) {
      delete newDeps[dep];
    }
  }

  const packageJSON = JSON.parse(packageJSONStr);
  packageJSON.dependencies = newDeps;
  fs.writeFileSync(packageJsonFile, JSON.stringify(packageJSON, null, 2), "utf-8");

  console.log(`Generated new package.json file at ${packageJsonFile}`);
  return;
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
    console.warn(
      `Failed to read version for ${packageName}, using 'latest' by default`,
      (e as Error).message,
    );
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
      },
    );
  });
}

interface DependencyData {
  versions: Record<string, unknown>;
}

function checkDependencyValidity(dependencyData: DependencyData, versionRange: string): boolean {
  // 兼容 "latest" 的情况
  if (versionRange === "latest") {
    return Object.keys(dependencyData.versions).length > 0;
  }

  // 使用 semver 检查是否有满足版本范围的有效版本
  const versions = Object.keys(dependencyData.versions);
  for (const version of versions) {
    if (semver.satisfies(version, versionRange)) {
      return true;
    }
  }
  return false;
}

async function checkDependencies(dependencies: Record<string, string>): Promise<boolean> {
  const dependencyCache: Record<string, boolean> = {};
  const checkSingleDependency = async (
    depName: string,
    depVersionRange: string,
  ): Promise<boolean> => {
    const cacheKey = `${depName}@${depVersionRange}`;
    if (dependencyCache[cacheKey] !== undefined) {
      return dependencyCache[cacheKey];
    }

    try {
      const depResponse = await axios.get(`https://registry.npmjs.org/${depName}`, {
        timeout: 5000,
        headers: {
          "User-Agent": "MyToolManager/1.0",
        },
      });

      if (depResponse.status !== 200 || !depResponse.data.versions) {
        console.error(`Failed to fetch ${depName}`);
        dependencyCache[cacheKey] = false;
        return false;
      }

      const isValid = checkDependencyValidity(depResponse.data, depVersionRange);
      dependencyCache[cacheKey] = isValid;

      if (!isValid) {
        console.error(`Invalid or missing: ${depName}`);
      }

      return isValid;
    } catch (error) {
      console.error(`Error fetching ${depName}: ${(error as Error).message}`);
      dependencyCache[cacheKey] = false;
      return false;
    }
  };

  const promises = Object.entries(dependencies).map(([depName, depVersionRange]) =>
    checkSingleDependency(depName, depVersionRange),
  );

  const results = await Promise.all(promises);
  return results.every((result) => result);
}

export async function isValidNpmPackage(packageName: string): Promise<boolean> {
  try {
    // 检查主包是否存在
    console.log("checking package:", packageName);
    const response = await axios.get(`https://registry.npmjs.org/${packageName}`, {
      timeout: 5000,
      headers: {
        "User-Agent": "MyToolManager/1.0",
      },
    });

    // 检查主包是否被标记为 unpublished
    if (response.status !== 200 || !response.data?.["dist-tags"]?.latest) {
      console.error(`Package marked as unpublished: ${packageName}`);
      return false;
    }

    // 获取主包的最新版本信息
    const latestVersion = response.data["dist-tags"].latest;
    const versionData = response.data?.versions?.[latestVersion];
    if (!versionData) {
      console.error(`Invalid package: ${packageName} - No version data found`);
      return false;
    }

    // 检查 dependencies 和 devDependencies
    console.log(`Checking dependencies for ${packageName}`);
    const dependencies = {
      ...versionData.dependencies,
      ...versionData.devDependencies,
    };
    if (!(await checkDependencies(dependencies))) {
      return false;
    }

    console.log(`Valid package: ${packageName}`);
    return true;
  } catch (error) {
    console.error(`Error validating package ${packageName}:`, (error as Error).message);
    return false;
  }
}

export function getPythonDependencies(): string[] {
  const content = fs.readFileSync("./python-mcp/pyproject.toml", "utf-8");
  const data = toml.parse(content);
  const deps = data.project?.dependencies || [];
  return deps.map((dep: string) => dep.split(/[=<>!]/)[0].trim());
}
