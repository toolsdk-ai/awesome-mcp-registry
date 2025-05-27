
// Try to read MCP Client

import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { MCPServerPackageConfig } from "../types";
import { MCPServerPackageConfigSchema, PackagesListSchema } from "../schema";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
// import { PluginManager } from 'live-plugin-manager';
import fs from 'fs';
import allPackagesList from '../indexes/packages-list.json';
import assert from 'assert';


// const manager = new PluginManager({
//     //   pluginsPath: './node_modules_live',
// });

export async function getMcpClient(mcpServerConfig: MCPServerPackageConfig, env?: Record<string, string>) {
    const { packageName } = mcpServerConfig;

    // await manager.install(packageName);

    // const packageJSONStr = fs.readFileSync('plugin_packages/' + packageName + '/package.json', 'utf8');
    const packageJSONFilePath = 'node_modules/' + packageName + '/package.json'
    const packageJSONStr = fs.readFileSync(packageJSONFilePath, 'utf8');
    const packageJSON = JSON.parse(packageJSONStr);
    let binFilePath = '';
    let binPath;

    if (typeof packageJSON.bin === 'string') {
        binPath = packageJSON.bin;
    } else if (typeof packageJSON.bin === 'object') {
        binPath = Object.values(packageJSON.bin)[0];
    } else {
        binPath = packageJSON.main;
    }
    assert(binPath, `Package ${packageName} does not have a valid bin path in package.json.`);

    // binFilePath = 'plugin_packages/' + packageName + `/${binPath}`;
    binFilePath = 'node_modules/' + packageName + `/${binPath}`;

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
            version: '1.0.0',
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
