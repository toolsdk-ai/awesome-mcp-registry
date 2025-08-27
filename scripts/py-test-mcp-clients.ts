/*
This script is used to test Python MCP clients by connecting to each Python-based MCP server
and retrieving their available tools.

Main workflow:
1. Retrieve all Python dependencies from the registry
2. Filter out packages that need to be temporarily ignored
3. For each Python MCP package:
   - Create a client connection using StdioClientTransport
   - Mock required environment variables
   - Connect to the MCP server
   - List available tools
   - Store tool information
   - Close the connection
4. Update package list with validation results
5. Save the updated information to packages-list.json
6. Output the list of successfully validated packages

Error handling:
- Packages that fail validation are marked with validated: false
- Connection errors are caught and logged
- Client connections are properly closed even in case of errors
*/

import fs from "node:fs";
import toml from "@iarna/toml";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
  extractPackageName,
  getPackageConfigByKey,
  getPythonDependencies,
  parsePyprojectToml,
  typedAllPackagesList,
} from "../src/helper";
import type { MCPServerPackageConfig } from "../src/types";

/**
 * Converts package name to Python dependency format
 * @param packageName - Original package name
 * @returns Converted package name with dashes instead of dots or underscores
 */
function convertPackageNameToPythonDep(packageName: string): string {
  return packageName.replace(/[._]/g, "-");
}

/**
 * Removes invalid dependencies from pyproject.toml
 * @param invalidPackages - List of invalid package names to remove
 */
async function removeInvalidDependencies(invalidPackages: string[]) {
  if (invalidPackages.length === 0) return;

  try {
    const pyProjectData = parsePyprojectToml();
    const depsWithVersion = pyProjectData.project?.dependencies || [];

    const validDeps = depsWithVersion.filter((dep: string) => {
      const depName = extractPackageName(dep);
      return !invalidPackages.includes(depName);
    });

    // Update dependencies list
    if (pyProjectData.project) {
      pyProjectData.project.dependencies = validDeps;
    }

    // Write updated content back to file
    const cleanData = JSON.parse(JSON.stringify(pyProjectData));
    const updatedContent = toml.stringify(cleanData);
    fs.writeFileSync("./python-mcp/pyproject.toml", updatedContent, "utf-8");

    console.log(
      `Invalid packages that were removed (${invalidPackages.length}): \n`,
      invalidPackages,
    );
  } catch (error) {
    console.error("Error removing invalid dependencies:", (error as Error).message);
  }
}

async function getPythonMcpClient(packageName: string, mockEnv: Record<string, string>) {
  const transport = new StdioClientTransport({
    command: "uv",
    args: ["run", "--directory", "./python-mcp", packageName],
    env: {
      ...(Object.fromEntries(
        Object.entries(process.env).filter(([_, v]) => v !== undefined),
      ) as Record<string, string>),
      ...mockEnv,
    },
  });

  const client = new Client({
    name: `python-mcp-client-${packageName}`,
    version: "1.0.0",
  });

  await client.connect(transport);

  const closeConnection = async () => {
    try {
      await client.close();
    } catch (e) {
      console.warn(`${packageName} python mcp client close failure.`, e);
    }
  };

  return { client, transport, closeConnection };
}

async function main() {
  const packageConfig: Record<
    string,
    MCPServerPackageConfig & {
      tools: Record<string, { name: string; description: string }>;
      validated: boolean;
    }
  > = {};
  // Track packages that failed validation
  const invalidPackages: string[] = [];
  const pythonDeps = getPythonDependencies();

  for (const packageKey of Object.keys(typedAllPackagesList)) {
    console.log(`Testing Python MCP Client for package: ${packageKey}`);

    const mcpServerConfig: MCPServerPackageConfig = await getPackageConfigByKey(packageKey);
    if (mcpServerConfig.runtime !== "python") {
      console.log(`Skipping non-Python package: ${packageKey}`);
      continue;
    }

    // Determine the actual package name used in pyproject.toml
    let actualPackageName = "";

    if (pythonDeps.includes(mcpServerConfig.packageName)) {
      actualPackageName = mcpServerConfig.packageName;
      console.log(`Found package with exact match: ${mcpServerConfig.packageName}`);
    } else {
      // If no exact match, try converted name
      const convertedPackageName = convertPackageNameToPythonDep(mcpServerConfig.packageName);
      if (!pythonDeps.includes(convertedPackageName)) {
        console.log(
          `Skipping package not installed in python-mcp: ${packageKey} (${mcpServerConfig.packageName})`,
        );
        continue;
      }

      actualPackageName = convertedPackageName;
      console.log(`Found package with converted name: ${convertedPackageName}`);
    }

    const mockEnv: Record<string, string> = {};
    for (const [key] of Object.entries(mcpServerConfig.env || {})) {
      mockEnv[key] = "MOCK";
    }

    try {
      const mcpClient = await getPythonMcpClient(mcpServerConfig.packageName, mockEnv);
      const toolsResp = await mcpClient.client.listTools();

      const saveTools: Record<string, { name: string; description: string }> = {};
      for (const toolItem of toolsResp.tools) {
        saveTools[toolItem.name] = {
          name: toolItem.name,
          description: toolItem.description || "",
        };
      }

      await mcpClient.closeConnection();

      packageConfig[packageKey] = {
        ...mcpServerConfig,
        tools: saveTools,
        validated: true,
      };

      if (typedAllPackagesList[packageKey]) {
        typedAllPackagesList[packageKey].tools = saveTools;
        typedAllPackagesList[packageKey].validated = true;
      }

      console.log(`✓ ${packageKey} validated, tools: ${Object.keys(saveTools).length}`);
    } catch (e) {
      packageConfig[packageKey] = {
        ...mcpServerConfig,
        tools: {},
        validated: false,
      };

      console.error(
        `✗ Error validating Python MCP Client for ${packageKey}:`,
        (e as Error).message,
      );

      // Record invalid package for later removal from pyproject.toml
      invalidPackages.push(actualPackageName);

      // Not processing Python MCPs with validated: false for now
      // if (typedAllPackagesList[depName]) {
      //   typedAllPackagesList[depName].tools = {};
      //   typedAllPackagesList[depName].validated = false;
      // }
    }
  }

  // console.log('Validated python packages: \n', packageConfig);
  // Write the updated package list to file
  fs.writeFileSync(
    "indexes/packages-list.json",
    JSON.stringify(typedAllPackagesList, null, 2),
    "utf-8",
  );

  if (invalidPackages.length > 0) {
    await removeInvalidDependencies(invalidPackages);
  }

  // print the list of successfully validated packages
  const validatedPackages = Object.values(packageConfig)
    .filter((v) => v.validated)
    .map((v) => v.packageName);
  console.log(
    `Successfully validated python packages (${validatedPackages.length}): \n`,
    validatedPackages,
  );
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
