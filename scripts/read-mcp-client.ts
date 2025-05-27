
// Try to read MCP Client

import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { MCPServerPackageConfig } from "../types";
import { MCPServerPackageConfigSchema } from "../schema";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { PluginManager } from 'live-plugin-manager';
import fs from 'fs';
import allPackagesList from '../indexes/packages-list.json';


const manager = new PluginManager({
    //   pluginsPath: './node_modules_live',
});

export async function getMcpClient(mcpServerConfig: MCPServerPackageConfig, env?: Record<string, string>) {
    const { packageName } = mcpServerConfig;

    await manager.install(packageName);

    const packageJSONStr = fs.readFileSync('plugin_packages/' + packageName + '/package.json', 'utf8');
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

    binFilePath = 'plugin_packages/' + packageName + `/${binPath}`;

    const transport = new StdioClientTransport({
        command: process.execPath,
        args: [binFilePath],
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

    for (const [packageKey, value] of Object.entries(allPackagesList)) {
        const jsonFile = value.path;

        // read the JSON file and convert it to MCPServerPackageConfig
        const jsonStr = fs.readFileSync('packages/' + jsonFile, 'utf-8');
        const mcpServerConfig: MCPServerPackageConfig = MCPServerPackageConfigSchema.parse(JSON.parse(jsonStr));

        // const mcpClient = await getMcpClient(mcpServerConfig, {});

        if (mcpServerConfig.runtime === 'node')
        console.log(`Reading MCP Client for package: ${packageKey} ${value.path}`, mcpServerConfig);
    }
}
main();