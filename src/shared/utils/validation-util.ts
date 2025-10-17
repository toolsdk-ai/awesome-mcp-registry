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

function checkDependencyValidity(dependencyData: DependencyData, versionRange: string): boolean {
  if (versionRange === "latest") {
    return Object.keys(dependencyData.versions).length > 0;
  }

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
    console.log("Checking package:", packageName);
    const response = await axios.get(`https://registry.npmjs.org/${packageName}`, {
      timeout: 5000,
      headers: {
        "User-Agent": "MyToolManager/1.0",
      },
    });

    if (response.status !== 200 || !response.data?.["dist-tags"]?.latest) {
      console.error(`Package marked as unpublished: ${packageName}`);
      return false;
    }

    const latestVersion = response.data["dist-tags"].latest;
    const versionData = response.data?.versions?.[latestVersion];
    if (!versionData) {
      console.error(`Invalid package: ${packageName} - No version data found`);
      return false;
    }

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

export function parsePyprojectToml(): PyProjectToml {
  const pyprojectPath = "./python-mcp/pyproject.toml";
  const content = fs.readFileSync(pyprojectPath, "utf-8");
  return toml.parse(content) as PyProjectToml;
}

export function extractPackageName(dep: string): string {
  return dep.split(/[=<>!]/)[0].trim();
}

export function getPythonDependencies(): string[] {
  const data: PyProjectToml = parsePyprojectToml();
  const deps = data.project?.dependencies || [];
  return deps.map(extractPackageName);
}
