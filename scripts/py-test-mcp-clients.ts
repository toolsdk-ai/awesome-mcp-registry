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
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import {
	getPackageConfigByKey,
	getPythonDependencies,
	typedAllPackagesList,
} from "../src/helper";
import type { MCPServerPackageConfig } from "../src/types";

const TEMP_IGNORE_DEP_NAMES = [
	"awslabs-cdk-mcp-server",
	"awslabs-nova-canvas-mcp-server",
	"qanon_mcp",
	"qanon-mcp",
	"llm_bridge_mcp",
	"llm-bridge-mcp",
	"mcp_server_browser_use",
	"mcp-server-browser-use",
	"jupyter_mcp_server",
	"jupyter-mcp-server",
];

async function getPythonMcpClient(
	mcpServerConfig: MCPServerPackageConfig,
	mockEnv: Record<string, string>,
) {
	const { packageName } = mcpServerConfig;
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
	const pythonDeps = getPythonDependencies();

	for (const depName of pythonDeps) {
		// Skip packages that need temporary ignore
		if (TEMP_IGNORE_DEP_NAMES.includes(depName)) {
			continue;
		}
		console.log(`Testing Python MCP Client for package: ${depName}`);

		const mcpServerConfig: MCPServerPackageConfig =
			await getPackageConfigByKey(depName);
		if (mcpServerConfig.runtime !== "python") continue;

		const mockEnv: Record<string, string> = {};
		for (const [key] of Object.entries(mcpServerConfig.env || {})) {
			mockEnv[key] = "MOCK";
		}

		try {
			const mcpClient = await getPythonMcpClient(mcpServerConfig, mockEnv);
			const toolsResp = await mcpClient.client.listTools();

			const saveTools: Record<string, { name: string; description: string }> =
				{};
			for (const toolItem of toolsResp.tools) {
				saveTools[toolItem.name] = {
					name: toolItem.name,
					description: toolItem.description || "",
				};
			}

			await mcpClient.closeConnection();

			packageConfig[depName] = {
				...mcpServerConfig,
				tools: saveTools,
				validated: true,
			};

			if (typedAllPackagesList[depName]) {
				typedAllPackagesList[depName].tools = saveTools;
				typedAllPackagesList[depName].validated = true;
			}

			console.log(
				`✓ ${depName} validated, tools: ${Object.keys(saveTools).length}`,
			);
		} catch (e) {
			packageConfig[depName] = {
				...mcpServerConfig,
				tools: {},
				validated: false,
			};
			console.error(
				`✗ Error validating Python MCP Client for ${depName}:`,
				(e as Error).message,
			);

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

	const validatedPackages = Object.entries(packageConfig)
		.filter(([_, v]) => v.validated)
		.map(([packageName, _]) => packageName);
	console.log("Successfully validated python packages: \n", validatedPackages);
}

await main();
process.exit(0);
