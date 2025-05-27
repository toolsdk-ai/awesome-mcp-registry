
// Try to read MCP Client

import type { MCPServerPackageConfig } from "../types";
import { MCPServerPackageConfigSchema, PackagesListSchema } from "../schema";
// import { PluginManager } from 'live-plugin-manager';
import fs from 'fs';
import allPackagesList from '../indexes/packages-list.json';
import { getMcpClient } from "../helper";


// const manager = new PluginManager({
//     //   pluginsPath: './node_modules_live',
// });

async function main() {

    const typedAllPackagesList = PackagesListSchema.parse(allPackagesList);
    for (const [packageKey, value] of Object.entries(typedAllPackagesList)) {
        const jsonFile = value.path;

        // read the JSON file and convert it to MCPServerPackageConfig
        const jsonStr = fs.readFileSync('packages/' + jsonFile, 'utf-8');
        const mcpServerConfig: MCPServerPackageConfig = MCPServerPackageConfigSchema.parse(JSON.parse(jsonStr));


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
