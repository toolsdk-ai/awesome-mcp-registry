import fs from "node:fs";
import path from "node:path";

export function updatePackageJsonDependencies({
  packageDeps,
  enableValidation = false,
  packagesListPath,
}: {
  packageDeps: Record<string, string>;
  enableValidation?: boolean;
  packagesListPath?: string;
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
    sandock: "^0.2.2",
    semver: "^7.5.4",
  } as Record<string, string>;

  if (enableValidation && packagesListPath) {
    const packagesListStr = fs.readFileSync(packagesListPath, "utf-8");
    const packagesList = JSON.parse(packagesListStr);

    for (const [depName, depVer] of Object.entries(packageDeps)) {
      if (packagesList[depName]?.validated) {
        newDeps[depName] = depVer || "latest";
      }
    }
  } else {
    Object.assign(newDeps, packageDeps);
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
    const packageJsonPath = path.join(process.cwd(), "node_modules", packageName, "package.json");
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
