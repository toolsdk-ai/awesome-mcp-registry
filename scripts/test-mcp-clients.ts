// Try to read MCP Client

import fs from 'fs';
import { getMcpClient, getPackageConfigByKey, typedAllPackagesList } from "../src/helper";



async function main() {

  for (const [packageKey, value] of Object.entries(typedAllPackagesList)) {
    const mcpServerConfig = await getPackageConfigByKey(packageKey);

    if (mcpServerConfig.runtime === 'node') {

      const mockEnv = {};
      for (const [key, _env] of Object.entries(mcpServerConfig.env || {})) {
        mockEnv[key] = 'MOCK'
      }
      console.log(`Reading MCP Client for package: ${packageKey} ${value.path}`);
      try {

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
        typedAllPackagesList[packageKey].tools = saveTools;
        typedAllPackagesList[packageKey].validated = true;

        // close the mcp client
        if (mcpClient) {
          await mcpClient.closeConnection();
        }
      } catch (e) {
        console.error(`Error reading MCP Client for package: ${packageKey} ${value.path}`, e);
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
}

await main();
process.exit(0);
