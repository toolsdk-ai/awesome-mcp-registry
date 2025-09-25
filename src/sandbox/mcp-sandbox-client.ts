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
  // 添加工具缓存机制
  private toolCache: Map<string, { tools: Tool[]; timestamp: number }> = new Map();
  // 缓存过期时间(毫秒) - 5分钟
  private readonly CACHE_TTL = 5 * 60 * 1000;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.E2B_API_KEY || "e2b-api-key-placeholder";
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
      // 清除缓存
      this.toolCache.clear();
      console.log("[MCPSandboxClient] Sandbox closed successfully");
    } else {
      console.log("[MCPSandboxClient] No sandbox to close");
    }
    console.timeEnd("[MCPSandboxClient] Sandbox closing");
  }

  // 清除特定包的工具缓存
  clearPackageCache(packageKey: string): void {
    this.toolCache.delete(packageKey);
  }

  // 清除所有工具缓存
  clearAllCache(): void {
    this.toolCache.clear();
  }

  async listTools(packageKey: string): Promise<Tool[]> {
    // 检查缓存
    const cached = this.toolCache.get(packageKey);
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp < this.CACHE_TTL) {
        console.log(`[MCPSandboxClient] Returning cached tools for package: ${packageKey}`);
        return cached.tools;
      } else {
        // 缓存过期，删除它
        this.toolCache.delete(packageKey);
      }
    }

    if (!this.sandbox) {
      throw new Error("Sandbox not initialized. Call initialize() first.");
    }

    const mcpServerConfig: MCPServerPackageConfig = await getPackageConfigByKey(packageKey);

    console.time("[MCPSandboxClient] Listing tools execution time");

    const testCode: string = this.generateMCPTestCode(mcpServerConfig, packageKey, "listTools");
    const testResult = await this.sandbox.runCode(testCode, {
      language: "javascript",
    });
    console.timeEnd("[MCPSandboxClient] Listing tools execution time");

    if (testResult.error) {
      console.error("[MCPSandboxClient] Failed to list tools:", testResult.error);
      throw new Error(`Failed to list tools: ${testResult.error}`);
    }

    const result: MCPToolResult = JSON.parse(
      testResult.logs.stdout[testResult.logs.stdout.length - 1] || "{}",
    );

    // 缓存结果
    this.toolCache.set(packageKey, {
      tools: result.tools,
      timestamp: Date.now(),
    });

    return result.tools;
  }

  async executeTool(
    packageKey: string,
    toolName: string,
    argumentsObj: Record<string, unknown>,
    envs?: Record<string, string>,
  ): Promise<unknown> {
    console.time(`[MCPSandboxClient] Execute tool: ${toolName} from package: ${packageKey}`);

    if (!this.sandbox) {
      console.timeEnd(`[MCPSandboxClient] Execute tool: ${toolName} from package: ${packageKey}`);
      throw new Error("Sandbox not initialized. Call initialize() first.");
    }

    const mcpServerConfig = await getPackageConfigByKey(packageKey);

    const testCode: string = this.generateMCPTestCode(
      mcpServerConfig,
      packageKey,
      "executeTool",
      toolName,
      argumentsObj,
      envs,
    );

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
    }

    const result: MCPExecuteResult = JSON.parse(
      testResult.logs.stdout[testResult.logs.stdout.length - 1] || "{}",
    );

    if (result.isError) {
      console.error("[MCPSandboxClient] Tool execution error:", result.errorMessage);
      console.timeEnd(`[MCPSandboxClient] Execute tool: ${toolName} from package: ${packageKey}`);
      throw new Error(result.errorMessage);
    }

    console.timeEnd(`[MCPSandboxClient] Execute tool: ${toolName} from package: ${packageKey}`);
    return result;
  }

  private generateMCPTestCode(
    mcpServerConfig: MCPServerPackageConfig,
    packageKey: string,
    operation: "listTools" | "executeTool",
    toolName?: string,
    argumentsObj?: Record<string, unknown>,
    envs?: Record<string, string>,
  ): string {
    const commonCode = `
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
`;

    if (operation === "listTools") {
      return `${commonCode}
    const toolsObj = await client.listTools();

    const result = {
      toolCount: toolsObj.tools.length,
      tools: toolsObj.tools
    };

    console.log(JSON.stringify(result));
    client.close();

    return;
  } catch (error) {
    console.error("Error in MCP test:", error);
    client.close();
    throw error;
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

    console.log(JSON.stringify(result))
    client.close();
    return;
  } catch (error) {
    client.close();
    console.log(JSON.stringify({ 
      result: null, 
      isError: true, 
      errorMessage: error.message 
    }));
  }
}

runMCP();
`;
    }
  }

  private generateEnvVariables(
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
}
