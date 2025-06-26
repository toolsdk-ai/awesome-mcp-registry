// Try to read MCP Client

import fs from 'fs';
import { getMcpClient, getPackageConfigByKey, typedAllPackagesList } from "../src/helper";


const packageJsonFile = './package.json';
async function main() {
  const packageDeps: Record<string, string> = {}

  for (const [packageKey, value] of Object.entries(typedAllPackagesList)) {
    const mcpServerConfig = await getPackageConfigByKey(packageKey);

    if (mcpServerConfig.runtime === 'node') {

      const mockEnv = {};
      for (const [key, _env] of Object.entries(mcpServerConfig.env || {})) {
        mockEnv[key] = 'MOCK'
      }
      console.log(`Reading MCP Client for package: ${packageKey} ${value.path}`);
      try {

        // const parsedContent: MCPServerPackageConfig= MCPServerPackageConfigSchema.parse(JSON.parse(fileContent));

        const mcpClient = await getMcpClient(mcpServerConfig, mockEnv);
        const tools = await mcpClient.client.listTools();
        console.log(`Read success MCP Client for package: ${packageKey} ${value.path}, tools: ${Object.keys(tools).length}`);

        const saveTools = {}
        for (const [_toolKey, toolItem] of Object.entries(tools.tools)) {
          saveTools[toolItem.name] = {
            name: toolItem.name,
            description: toolItem.description || '',
          }
        }

        // close the mcp client
        if (mcpClient) {
          await mcpClient.closeConnection();
        }

        typedAllPackagesList[packageKey].tools = saveTools;
        typedAllPackagesList[packageKey].validated = true;

        if (mcpServerConfig.runtime === 'node') {
          packageDeps[mcpServerConfig.packageName] = mcpServerConfig.packageVersion || 'latest';
        }
      } catch (e) {
        console.error(`Error reading MCP Client for package: ${packageKey} ${value.path}`, e);
        typedAllPackagesList[packageKey].tools = {};
        typedAllPackagesList[packageKey].validated = false;
      } finally {
        //
      }
    }
  }



  // write again with tools
  fs.writeFileSync('indexes/packages-list.json', JSON.stringify(typedAllPackagesList, null, 2), 'utf-8');


  // print, all unvalidated packages
  const unvalidatedPackages = Object.values(typedAllPackagesList).filter((value) => !value.validated);
  console.warn(`Warning! Unvalidated packages: ${unvalidatedPackages.length}`, unvalidatedPackages);


  // Write package.json dependencies

  const packageJSONStr = fs.readFileSync(packageJsonFile, 'utf-8');
  const newDeps = {
    "@modelcontextprotocol/sdk": "^1.12.0",
    "lodash": "^4.17.21",
    "zod": "^3.23.30",
  };
  const packageJSON = JSON.parse(packageJSONStr);
  for (const [depName, depVer] of Object.entries(packageDeps)) {
    if (typedAllPackagesList[depName]?.validated) {
      newDeps[depName] = packageDeps[depVer] || 'latest';
    }
  }

  packageJSON.dependencies = newDeps

  fs.writeFileSync(packageJsonFile, JSON.stringify(packageJSON, null, 2), 'utf-8');

  console.log(`Generated new package.json file at ${packageJsonFile}`);
}

await main();
process.exit(0);