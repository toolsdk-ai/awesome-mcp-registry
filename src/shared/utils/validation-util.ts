/**
 * 验证工具函数
 */

import fs from "node:fs";
import toml from "@iarna/toml";
import axios from "axios";
import semver from "semver";

interface DependencyData {
  versions: Record<string, unknown>;
}

interface PyProjectToml {
  project?: {
    dependencies?: string[];
    [key: string]: unknown;
  };
  [key: string]: unknown;
}

/**
 * 检查依赖有效性
 */
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

/**
 * 检查多个依赖
 */
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

/**
 * 验证 NPM 包是否有效
 */
export async function isValidNpmPackage(packageName: string): Promise<boolean> {
  try {
    console.log("Checking package:", packageName);
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

/**
 * 解析 pyproject.toml 文件
 */
export function parsePyprojectToml(): PyProjectToml {
  const pyprojectPath = "./python-mcp/pyproject.toml";
  const content = fs.readFileSync(pyprojectPath, "utf-8");
  return toml.parse(content) as PyProjectToml;
}

/**
 * 从依赖字符串中提取包名
 * @param dep 依赖字符串 (e.g., "package>=1.0.0")
 * @returns 包名
 */
export function extractPackageName(dep: string): string {
  return dep.split(/[=<>!]/)[0].trim();
}

/**
 * 获取 Python 依赖列表
 */
export function getPythonDependencies(): string[] {
  const data: PyProjectToml = parsePyprojectToml();
  const deps = data.project?.dependencies || [];
  return deps.map(extractPackageName);
}
