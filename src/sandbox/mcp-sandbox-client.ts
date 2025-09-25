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
  private initializing: Promise<void> | null = null; // 防止并发初始化
  private readonly apiKey: string;
  private toolCache: Map<string, { tools: Tool[]; timestamp: number }> = new Map();
  private readonly TOOL_CACHE_TTL = 30 * 60 * 1000;

  // 生命周期与自动回收
  public createdAt: number | null = null;
  public lastUsedAt: number | null = null;
  private ttlTimer: NodeJS.Timeout | null = null; // 用于1小时强制关闭
  private autoCloseOnIdleTimer: NodeJS.Timeout | null = null; // 可被外部控制的 idle timer

  // 可配置：单次工具执行超时时间（ms）
  public EXECUTION_TIMEOUT = 2 * 60 * 1000; // 默认 2 分钟

  constructor(apiKey?: string) {
    this.apiKey = apiKey || process.env.E2B_API_KEY || "e2b-api-key-placeholder";
  }

  // 安全的 initialize：确保并发调用不会重复创建 sandbox
  async initialize(): Promise<void> {
    console.time("[MCPSandboxClient] Sandbox initialization");
    if (this.sandbox) {
      this.touch();
      console.log("[MCPSandboxClient] Sandbox already initialized");
      return;
    }
    if (this.initializing) {
      // 等待已有初始化完成
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
        this.setupTTLTimer(); // 启动 1 小时强制会话终止
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
    // 清理已有
    if (this.ttlTimer) {
      clearTimeout(this.ttlTimer);
      this.ttlTimer = null;
    }
    // E2B 最大支持 1 小时会话，强制在 59 分 30 秒后关闭以保守处理
    const TTL_MS = 60 * 60 * 1000; // 1h
    const safetyMs = 30 * 1000; // 提前30s关闭
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

  // 更新最后使用时间
  touch() {
    this.lastUsedAt = Date.now();
    // 如果外部正在等候 idle 关闭，使用时将其取消
    if (this.autoCloseOnIdleTimer) {
      clearTimeout(this.autoCloseOnIdleTimer);
      this.autoCloseOnIdleTimer = null;
    }
  }

  // 启动空闲自动关闭（当引用计数为0，被 PackageSO 调用 release 后设置）
  scheduleIdleClose(idleMs: number) {
    if (this.autoCloseOnIdleTimer) {
      clearTimeout(this.autoCloseOnIdleTimer);
    }
    this.autoCloseOnIdleTimer = setTimeout(async () => {
      console.log("[MCPSandboxClient] Idle TTL reached, closing sandbox due to inactivity.");
      try {
        await this.kill();
      } catch (err) {
        console.error("[MCPSandboxClient] Error while killing sandbox on idle:", err);
      }
    }, idleMs);
  }

  // 强制关闭并清理计时器与缓存
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
          // sandbox.kill 可能抛错，记录日志但继续清理本地状态
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

  // 清除特定包的工具缓存
  clearPackageCache(packageKey: string): void {
    this.toolCache.delete(packageKey);
  }

  // 清除所有工具缓存
  clearAllCache(): void {
    this.toolCache.clear();
  }

  async listTools(packageKey: string): Promise<Tool[]> {
    const cached = this.toolCache.get(packageKey);
    if (cached) {
      const now = Date.now();
      if (now - cached.timestamp < this.TOOL_CACHE_TTL) {
        console.log(`[MCPSandboxClient] Returning cached tools for package: ${packageKey}`);

        // refresh cache expiration time
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
      // packageKey,
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

  // 对 sandbox.runCode 添加超时保护，超时则尝试 kill sandbox 并抛错
  private async runCodeWithTimeout(code: string, options: { language: string }): Promise<any> {
    if (!this.sandbox) throw new Error("Sandbox not initialized.");

    const execPromise = this.sandbox.runCode(code, options);

    const timeoutMs = this.EXECUTION_TIMEOUT;

    let timeoutHandle: NodeJS.Timeout;
    const timeoutPromise = new Promise((_, reject) => {
      timeoutHandle = setTimeout(async () => {
        const msg = `[MCPSandboxClient] runCode timeout after ${timeoutMs}ms`;
        console.error(msg);
        // 超时后尝试强制 kill sandbox 来回收资源并避免后续调用使用此已卡死实例
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
    // packageKey: string,
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
