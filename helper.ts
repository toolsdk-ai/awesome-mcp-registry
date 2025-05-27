
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import type { MCPServerPackageConfig } from "./types";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import fs from 'fs';
import allPackagesList from './indexes/packages-list.json';
import assert from 'assert';


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
