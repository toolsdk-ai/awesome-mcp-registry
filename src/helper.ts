/**
 * Helper 函数（临时兼容层）
 * 这个文件将逐步被废弃，所有函数已迁移到 shared/utils 中
 * 为了保持向后兼容，这里重新导出这些函数
 */

// 从新位置重新导出
export { getSandboxProvider } from "./shared/config/environment";
export { getMcpClient, getPackageJSON } from "./shared/utils/mcp-client.util";
export { extractLastOuterJSON } from "./shared/utils/string.util";
export {
  extractPackageName,
  getPythonDependencies,
  isValidNpmPackage,
  parsePyprojectToml,
} from "./shared/utils/validation.util";

// 从原 types.ts 导入
import fs from "node:fs";
import path from "node:path";
import allPackagesList from "../indexes/packages-list.json";
import { MCPServerPackageConfigSchema, PackagesListSchema } from "./schema";
import type { MCPServerPackageConfig } from "./types";
import { getDirname } from "./utils";

const __dirname = getDirname(import.meta.url);

export const typedAllPackagesList = PackagesListSchema.parse(allPackagesList);

/**
 * 根据包键获取包配置
 */
export function getPackageConfigByKey(packageKey: string): MCPServerPackageConfig {
  const value = typedAllPackagesList[packageKey];
  if (!value) {
    throw new Error(`Package '${packageKey}' not found in packages list.`);
  }
  const jsonFile = value.path;
  const jsonStr = fs.readFileSync(`${__dirname}/../packages/${jsonFile}`, "utf-8");
  const mcpServerConfig: MCPServerPackageConfig = MCPServerPackageConfigSchema.parse(
    JSON.parse(jsonStr),
  );
  return mcpServerConfig;
}

/**
 * 更新 package.json 依赖
 */
export function updatePackageJsonDependencies({
  packageDeps,
  enableValidation = false,
}: {
  packageDeps: Record<string, string>;
  enableValidation?: boolean;
}) {
  const packageJsonFile = "./package.json";
  const packageJSONStr = fs.readFileSync(packageJsonFile, "utf-8");
  const newDeps = {
    "@daytonaio/sdk": "0.109.0",
    "@e2b/code-interpreter": "^2.0.0",
    "@modelcontextprotocol/sdk": "^1.12.0",
    "@hono/node-server": "1.15.0",
    "@hono/swagger-ui": "^0.5.2",
    "@hono/zod-openapi": "^0.16.4",
    "@iarna/toml": "^2.2.5",
    meilisearch: "^0.33.0",
    lodash: "^4.17.21",
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

  const packageJSON = JSON.parse(packageJSONStr);
  packageJSON.dependencies = newDeps;
  fs.writeFileSync(packageJsonFile, JSON.stringify(packageJSON, null, 2), "utf-8");

  console.log(`Generated new package.json file at ${packageJsonFile}`);
  return;
}

/**
 * 获取实际版本号
 */
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

/**
 * 超时包装器
 */
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
