import path from "node:path";
import { Sandbox } from "@e2b/code-interpreter";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import dotenv from "dotenv";
import { getPackageConfigByKey } from "../helper";

import type { MCPServerPackageConfig } from "../types";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

interface MCPToolResult {
  toolCount: number;
  tools: Tool[];
}

interface MCPExecuteResult {
  result: unknown;
  isError?: boolean;
  errorMessage?: string;
}

export class MCPSandboxClient {
  private sandbox: Sandbox | null = null;
  private readonly apiKey: string;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.E2B_API_KEY || "e2b-api-key-placeholder";
    console.log("[MCPSandboxClient] Client initialized with API key:", this.apiKey);
  }

  async initialize(): Promise<void> {
    console.time("[MCPSandboxClient] Sandbox initialization");
    if (!this.sandbox) {
      this.sandbox = await Sandbox.create("mcp-sandbox-01", {
        apiKey: this.apiKey,
      });
      console.log("[MCPSandboxClient] Sandbox created successfully");
    } else {
      console.log("[MCPSandboxClient] Sandbox already initialized");
    }
    console.timeEnd("[MCPSandboxClient] Sandbox initialization");
  }

  async close(): Promise<void> {
    console.time("[MCPSandboxClient] Sandbox closing");
    if (this.sandbox) {
      await this.sandbox.kill();
      this.sandbox = null;
      console.log("[MCPSandboxClient] Sandbox closed successfully");
    } else {
      console.log("[MCPSandboxClient] No sandbox to close");
    }
    console.timeEnd("[MCPSandboxClient] Sandbox closing");
  }

  async listTools(packageKey: string): Promise<Tool[]> {
    console.log(`[MCPSandboxClient] Listing tools for package: ${packageKey}`);
    if (!this.sandbox) {
      throw new Error("Sandbox not initialized. Call initialize() first.");
    }

    const mcpServerConfig: MCPServerPackageConfig = await getPackageConfigByKey(packageKey);
    console.log(`[MCPSandboxClient] Package config loaded for: ${mcpServerConfig.packageName}`);

    console.time("[MCPSandboxClient] Listing tools execution time");
    const testCode = `
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from "node:fs";

function getPackageJSON(packageName) {
  const packageJSONFilePath = \`/home/node_modules/\${packageName}/package.json\`;

  if (!fs.existsSync(packageJSONFilePath)) {
    throw new Error(\`Package '\${packageName}' not found in node_modules.\`);
  }

  const packageJSONStr = fs.readFileSync(packageJSONFilePath, "utf8");
  const packageJSON = JSON.parse(packageJSONStr);
  return packageJSON;
}

async function runMCP() {
  try {
    const packageName = "${mcpServerConfig.packageName}";
    const packageJSON = getPackageJSON(packageName);
    
    let binPath;
    if (typeof packageJSON.bin === "string") {
      binPath = packageJSON.bin;
    } else if (typeof packageJSON.bin === "object") {
      binPath = Object.values(packageJSON.bin)[0];
    } else {
      binPath = packageJSON.main;
    }
    
    if (!binPath) {
      throw new Error(\`Package \${packageName} does not have a valid bin path in package.json.\`);
    }

    const binFilePath = \`/home/node_modules/\${packageName}/\${binPath}\`;
    const binArgs = ${JSON.stringify(mcpServerConfig.binArgs || [])};

    const transport = new StdioClientTransport({
      command: "node",
      args: [binFilePath, ...binArgs],
      env: {
        ...(Object.fromEntries(
          Object.entries(process.env).filter(([_, v]) => v !== undefined)
        ) as Record<string, string>),
        ${this.generateEnvVariables(mcpServerConfig.env)}
      },
    });

    const client = new Client(
      {
        name: "mcp-server-${packageKey}-client",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    await client.connect(transport);

    const toolsObj = await client.listTools();
    client.close();

    const result = {
      toolCount: toolsObj.tools.length,
      tools: toolsObj.tools
    };

    console.log(JSON.stringify(result))
    return;
  } catch (error) {
    console.error("Error in MCP test:", error);
    throw error;
  }
}

runMCP();
`;

    const testResult = await this.sandbox.runCode(testCode, {
      language: "javascript",
    });
    console.timeEnd("[MCPSandboxClient] Listing tools execution time");

    if (testResult.error) {
      console.error("[MCPSandboxClient] Failed to list tools:", testResult.error);
      throw new Error(`Failed to list tools: ${testResult.error}`);
    }

    console.log("[MCPSandboxClient] Tools listed successfully");
    const result: MCPToolResult = JSON.parse(
      testResult.logs.stdout[testResult.logs.stdout.length - 1] || "{}",
    );

    console.log(`[MCPSandboxClient] Parsed result with ${result.toolCount} tools`);
    return result.tools;
  }

  async executeTool(
    packageKey: string,
    toolName: string,
    argumentsObj: Record<string, unknown>,
    envs?: Record<string, string>,
  ): Promise<unknown> {
    console.time(`[MCPSandboxClient] Execute tool: ${toolName} from package: ${packageKey}`);
    console.log(`[MCPSandboxClient] Tool arguments:`, argumentsObj);

    if (!this.sandbox) {
      console.timeEnd(`[MCPSandboxClient] Execute tool: ${toolName} from package: ${packageKey}`);
      throw new Error("Sandbox not initialized. Call initialize() first.");
    }

    const mcpServerConfig = await getPackageConfigByKey(packageKey);
    console.log(
      `[MCPSandboxClient] Package config loaded for execution: ${mcpServerConfig.packageName}`,
    );

    const testCode = `
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import fs from "node:fs";

function getPackageJSON(packageName) {
  const packageJSONFilePath = \`/home/node_modules/\${packageName}/package.json\`;

  if (!fs.existsSync(packageJSONFilePath)) {
    throw new Error(\`Package '\${packageName}' not found in node_modules.\`);
  }

  const packageJSONStr = fs.readFileSync(packageJSONFilePath, "utf8");
  const packageJSON = JSON.parse(packageJSONStr);
  return packageJSON;
}

async function runMCP() {
  try {

    const packageName = "${mcpServerConfig.packageName}";
    const packageJSON = getPackageJSON(packageName);

    let binPath;
    if (typeof packageJSON.bin === "string") {
      binPath = packageJSON.bin;
    } else if (typeof packageJSON.bin === "object") {
      binPath = Object.values(packageJSON.bin)[0];
    } else {
      binPath = packageJSON.main;
    }
    
    if (!binPath) {
      throw new Error(\`Package \${packageName} does not have a valid bin path in package.json.\`);
    }

    const binFilePath = \`/home/node_modules/\${packageName}/\${binPath}\`;
    const binArgs = ${JSON.stringify(mcpServerConfig.binArgs || [])};

    const transport = new StdioClientTransport({
      command: "node",
      args: [binFilePath, ...binArgs],
      env: {
        ...(Object.fromEntries(
          Object.entries(process.env).filter(([_, v]) => v !== undefined),
        ) as Record<string, string>),
        ${this.generateEnvVariables(mcpServerConfig.env, envs)}
      },
    });

    const client = new Client(
      {
        name: "mcp-server-${packageKey}-client",
        version: "1.0.0",
      },
      {
        capabilities: {
          tools: {},
        },
      },
    );

    await client.connect(transport);
    console.log("[MCP Server] Connected to transport for tool execution");

    const result = await client.callTool({
      name: "${toolName}",
      arguments: ${JSON.stringify(argumentsObj)}
    });
    console.log("[MCP Server] Tool executed successfully");

    await client.close();
    console.log(JSON.stringify(result))
    return;
  } catch (error) {
    console.error("Error in MCP tool execution:", error);
    return JSON.stringify({ 
      result: null, 
      isError: true, 
      errorMessage: error.message 
    });
  }
}

runMCP();
`;

    console.log("[MCPSandboxClient] Running code in sandbox to execute tool");
    const testResult = await this.sandbox.runCode(testCode, {
      language: "javascript",
    });

    if (testResult.error) {
      console.error("[MCPSandboxClient] Failed to execute tool:", testResult.error);
      throw new Error(`Failed to execute tool: ${testResult.error}`);
    }

    // Handle stderr output, log if there are error messages
    if (testResult.logs.stderr && testResult.logs.stderr.length > 0) {
      const stderrOutput = testResult.logs.stderr.join("\n");
      console.error("[MCPSandboxClient] Tool execution stderr output:", stderrOutput);

      // If stderr contains error information, throw an error
      if (stderrOutput.includes("Error in MCP tool execution")) {
        throw new Error(`MCP Tool execution failed with stderr: ${stderrOutput}`);
      }
    }

    console.log("[MCPSandboxClient] Tool executed successfully in sandbox");
    const result: MCPExecuteResult = JSON.parse(
      testResult.logs.stdout[testResult.logs.stdout.length - 1] || "{}",
    );

    if (result.isError) {
      console.error("[MCPSandboxClient] Tool execution error:", result.errorMessage);
      console.timeEnd(`[MCPSandboxClient] Execute tool: ${toolName} from package: ${packageKey}`);
      throw new Error(result.errorMessage);
    }

    console.log("[MCPSandboxClient] Tool execution completed successfully");
    console.timeEnd(`[MCPSandboxClient] Execute tool: ${toolName} from package: ${packageKey}`);
    return result;
  }

  private generateEnvVariables(
    env: MCPServerPackageConfig["env"],
    realEnvs?: Record<string, string>,
  ): string {
    if (!env) {
      console.log("[MCPSandboxClient] No environment variables to generate");
      return "";
    }

    const envEntries = Object.entries(env).map(([key, _]) => {
      if (realEnvs?.[key]) {
        return `${JSON.stringify(key)}: ${JSON.stringify(realEnvs[key])}`;
      }
      return `${JSON.stringify(key)}: "mock_value"`;
    });

    console.log("[MCPSandboxClient] Generated mock environment variables:", envEntries);
    return envEntries.join(",\n        ");
  }
}
