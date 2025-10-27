import type { MCPServerPackageConfig } from "../package/package-types";

export function generateEnvVariables(
  env: MCPServerPackageConfig["env"],
  realEnvs?: Record<string, string>,
): string {
  if (!env) {
    return "";
  }

  const envEntries = Object.entries(env).map(([key, _]) => {
    if (realEnvs?.[key]) {
      return `${JSON.stringify(key)}: ${JSON.stringify(realEnvs[key])}`;
    }
    return `${JSON.stringify(key)}: "mock_value"`;
  });

  return envEntries.join(",\n        ");
}

export function generateMCPTestCode(
  mcpServerConfig: MCPServerPackageConfig,
  operation: "listTools" | "executeTool",
  toolName?: string,
  argumentsObj?: Record<string, unknown>,
  envs?: Record<string, string>,
): string {
  const commonCode = `
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

async function runMCP() {
  let client;
  let transport;
  try {
    const packageName = "${mcpServerConfig.packageName}";

    transport = new StdioClientTransport({
      command: "pnpx",
      args: ["--silent", packageName],
      env: {
        ...Object.fromEntries(
          Object.entries(process.env).filter(([_, v]) => v !== undefined)
        ),
        PNPM_HOME: "/root/.local/share/pnpm",
        PNPM_STORE_PATH: "/pnpm-store",
        ${generateEnvVariables(mcpServerConfig.env, envs)}
      },
    });

    client = new Client(
      {
        name: "mcp-server-${mcpServerConfig.packageName}-client",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    await client.connect(transport);
`;

  if (operation === "listTools") {
    return `${commonCode}
    const toolsObj = await client.listTools();

    const result = {
      toolCount: toolsObj.tools.length,
      tools: toolsObj.tools
    };

    process.stdout.write(JSON.stringify(result));
  } catch (error) {
    console.error("Error in MCP test:", error);
    process.exitCode = 1;
    process.stdout.write(JSON.stringify({ error: error.message || "Unknown error occurred" }));
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error("Error closing MCP client:", closeError);
      }
    }
    if (transport) {
      try {
        await transport.close();
      } catch (transportError) {
        console.error("Error closing transport:", transportError);
      }
    }
  }
}

runMCP();
    `;
  } else {
    return `${commonCode}

    const result = await client.callTool({
      name: "${toolName}",
      arguments: ${JSON.stringify(argumentsObj)}
    });

    process.stdout.write(JSON.stringify(result));
  } catch (error) {
    console.error("Error in MCP test:", error);
    process.exitCode = 1;
    process.stdout.write(JSON.stringify({ 
      result: null, 
      isError: true, 
      errorMessage: error.message 
    }));
  } finally {
    if (client) {
      try {
        await client.close();
      } catch (closeError) {
        console.error("Error closing MCP client:", closeError);
      }
    }
    if (transport) {
      try {
        await transport.close();
      } catch (transportError) {
        console.error("Error closing transport:", transportError);
      }
    }
  }
}

runMCP();
  `;
  }
}
