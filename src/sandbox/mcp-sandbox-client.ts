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
  private initializing: Promise<void> | null = null;
  private readonly apiKey: string;
  private toolCache: Map<string, { tools: Tool[]; timestamp: number }> = new Map();
  private readonly TOOL_CACHE_TTL = 30 * 60 * 1000;
  public TOOL_EXECUTION_TIMEOUT = 5 * 60 * 1000;

  // Lifecycle and Auto-Recovery
  public createdAt: number | null = null;
  public lastUsedAt: number | null = null;
  private ttlTimer: NodeJS.Timeout | null = null;
  private autoCloseOnIdleTimer: NodeJS.Timeout | null = null;
  private idleCloseMs: number | null = null;

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.E2B_API_KEY || "e2b-api-key-placeholder";
  }

  // Safe initialize: ensures concurrent calls don't create duplicate sandboxes
  async initialize(): Promise<void> {
    console.time("[MCPSandboxClient] Sandbox initialization");
    if (this.sandbox) {
      this.touch();
      console.log("[MCPSandboxClient] Sandbox already initialized");
      return;
    }
    if (this.initializing) {
      // Wait for existing initialization to complete
      await this.initializing;
      this.touch();
      return;
    }

    this.initializing = (async () => {
      console.time("[MCPSandboxClient] Sandbox initialization");
      try {
        this.sandbox = await Sandbox.create(`mcp-sandbox-01`, {
          apiKey: this.apiKey,
        });
        this.createdAt = Date.now();
        this.touch();
        // After 1-hour forced session termination
        this.setupTTLTimer();
        console.log("[MCPSandboxClient] Sandbox created successfully");
      } finally {
        console.timeEnd("[MCPSandboxClient] Sandbox initialization");
        this.initializing = null;
      }
    })();

    await this.initializing;

    console.timeEnd("[MCPSandboxClient] Sandbox initialization");
  }

  private setupTTLTimer() {
    // Clean up existing timer
    if (this.ttlTimer) {
      clearTimeout(this.ttlTimer);
      this.ttlTimer = null;
    }

    // E2B supports maximum 1-hour sessions, force close at 59m 30s for safety
    const TTL_MS = 60 * 60 * 1000;
    const safetyMs = 30 * 1000;
    const remaining = Math.max(0, TTL_MS - (Date.now() - (this.createdAt || Date.now())));
    this.ttlTimer = setTimeout(async () => {
      console.warn(
        "[MCPSandboxClient] Sandbox TTL reached, closing sandbox to avoid exceeding 1 hour.",
      );
      try {
        await this.kill();
      } catch (err) {
        console.error("[MCPSandboxClient] Error while killing sandbox after TTL:", err);
      }
    }, remaining - safetyMs);
  }

  /**
   * Update sandbox last used time
   */
  touch() {
    this.lastUsedAt = Date.now();
    console.log(`[MCPSandboxClient] Sandbox touched at ${this.lastUsedAt}`);

    // Refresh timer if waiting for idle close
    if (this.autoCloseOnIdleTimer && this.idleCloseMs) {
      clearTimeout(this.autoCloseOnIdleTimer);

      // Reschedule idle close (refresh timer)
      this.autoCloseOnIdleTimer = setTimeout(async () => {
        console.log("[MCPSandboxClient] Idle TTL reached, closing sandbox due to inactivity.");
        try {
          await this.kill();
        } catch (err) {
          console.error("[MCPSandboxClient] Error while killing sandbox on idle:", err);
        }
      }, this.idleCloseMs);
    }
  }

  // Schedule idle auto-close (called by PackageSO when refCount reaches 0)
  scheduleIdleClose(idleMs: number) {
    // Save idle close time for refresh
    this.idleCloseMs = idleMs;

    // Clear existing idle timer
    if (this.autoCloseOnIdleTimer) {
      clearTimeout(this.autoCloseOnIdleTimer);
    }

    // Set new idle timer
    this.autoCloseOnIdleTimer = setTimeout(async () => {
      console.log("[MCPSandboxClient] Idle TTL reached, closing sandbox due to inactivity.");
      try {
        await this.kill();
      } catch (err) {
        console.error("[MCPSandboxClient] Error while killing sandbox on idle:", err);
      }
    }, idleMs);
  }

  // Force close and cleanup timers & cache
  async kill(): Promise<void> {
    console.time("[MCPSandboxClient] Sandbox closing");
    try {
      if (this.ttlTimer) {
        clearTimeout(this.ttlTimer);
        this.ttlTimer = null;
      }
      if (this.autoCloseOnIdleTimer) {
        clearTimeout(this.autoCloseOnIdleTimer);
        this.autoCloseOnIdleTimer = null;
      }
      if (this.sandbox) {
        try {
          await this.sandbox.kill();
        } catch (err) {
          // sandbox.kill may throw, log error but continue cleaning local state
          console.error("[MCPSandboxClient] Error during sandbox.kill():", err);
        }
        this.sandbox = null;
      } else {
        console.log("[MCPSandboxClient] No sandbox to close");
      }
    } finally {
      // clear cache and reset timestamps
      this.toolCache.clear();
      this.createdAt = null;
      this.lastUsedAt = null;
      console.timeEnd("[MCPSandboxClient] Sandbox closing");
    }
  }

  // Clear cache for specific package
  clearPackageCache(packageKey: string): void {
    this.toolCache.delete(packageKey);
  }

  // Clear all tool caches
  clearAllCache(): void {
    this.toolCache.clear();
  }

  async listTools(packageKey: string): Promise<Tool[]> {
    const cached = this.toolCache.get(packageKey);
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp < this.TOOL_CACHE_TTL) {
        console.log(`[MCPSandboxClient] Returning cached tools for package: ${packageKey}`);

        // Refresh cache expiration time
        this.toolCache.set(packageKey, {
          tools: cached.tools,
          timestamp: Date.now(),
        });

        this.touch();
        return cached.tools;
      } else {
        // Cache expired, remove it
        this.toolCache.delete(packageKey);
      }
    }

    if (!this.sandbox) {
      throw new Error("Sandbox not initialized. Call initialize() first.");
    }

    const mcpServerConfig: MCPServerPackageConfig = await getPackageConfigByKey(packageKey);

    console.time("[MCPSandboxClient] Listing tools execution time");

    const testCode: string = this.generateMCPTestCode(mcpServerConfig, "listTools");

    const testResult = await this.runCodeWithTimeout(testCode, { language: "javascript" });

    console.timeEnd("[MCPSandboxClient] Listing tools execution time");

    if (testResult.error) {
      console.error("[MCPSandboxClient] Failed to list tools:", testResult.error);
      throw new Error(`Failed to list tools: ${testResult.error}`);
    }

    const stdout = testResult.logs?.stdout || [];
    const last = stdout[stdout.length - 1] || "{}";

    const result: MCPToolResult = JSON.parse(last);

    this.toolCache.set(packageKey, {
      tools: result.tools,
      timestamp: Date.now(),
    });

    this.touch();
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

    this.touch();
    console.timeEnd(`[MCPSandboxClient] Execute tool: ${toolName} from package: ${packageKey}`);
    return result;
  }

  // Add timeout protection to sandbox.runCode, kill sandbox on timeout
  private async runCodeWithTimeout(code: string, options: { language: string }): Promise<any> {
    if (!this.sandbox) throw new Error("Sandbox not initialized.");

    const execPromise = this.sandbox.runCode(code, options);

    const timeoutMs = this.TOOL_EXECUTION_TIMEOUT;

    let timeoutHandle: NodeJS.Timeout;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(async () => {
        const msg = `[MCPSandboxClient] runCode timeout after ${timeoutMs}ms`;
        console.error(msg);
        // After timeout, try to force kill sandbox to recycle resources and avoid subsequent calls using this stuck instance
        try {
          await this.kill();
        } catch (err) {
          console.error("[MCPSandboxClient] Error killing sandbox after run timeout:", err);
        }
        reject(new Error(msg));
      }, timeoutMs);
    });

    try {
      const result = await Promise.race([execPromise, timeoutPromise]);
      clearTimeout(timeoutHandle!);
      return result;
    } catch (err) {
      console.error("[MCPSandboxClient] runCodeWithTimeout error:", err);
      throw err;
    }
  }

  private generateMCPTestCode(
    mcpServerConfig: MCPServerPackageConfig,
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
