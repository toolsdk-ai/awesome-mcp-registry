import fs from "node:fs";
import path from "node:path";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getMcpClient, getPackageConfigByKey, typedAllPackagesList } from "../helper.js";
import { MCPSandboxClient } from "../sandbox/mcp-sandbox-client.js";
import type {
  MCPServerPackageConfig,
  MCPServerPackageConfigWithTools,
  ToolExecute,
} from "../types";
import { getDirname } from "../utils";

const __dirname = getDirname(import.meta.url);

type SandboxRecord = {
  client: MCPSandboxClient;
  refCount: number;
  lastUsedAt: number;
  // idleTimer is scheduled on release when refCount reaches 0
  idleCloseMs?: number;
};

export class PackageSO {
  private useSandbox: boolean = false;
  private sandboxClient: MCPSandboxClient | null = null;
  private static sandboxInstances: Map<string, SandboxRecord> = new Map();

  // 全局控制常量（可调整）
  private static MAX_SANDBOXES = 10;
  // private static IDLE_CLOSE_MS = 5 * 60 * 1000; // 5 分钟空闲后关闭
  private static IDLE_CLOSE_MS = 2 * 60 * 1000; // 2 分钟空闲后关闭

  constructor(useSandbox: boolean = false) {
    this.useSandbox = useSandbox;
    if (useSandbox) {
      // 默认使用 key = 'default'（可以按 packageKey 做细分）
      const sandboxKey = "default";
      const record = PackageSO.sandboxInstances.get(sandboxKey);
      if (record) {
        // 增加引用计数
        record.refCount++;
        record.lastUsedAt = Date.now();
        this.sandboxClient = record.client;
        // 取消任何 idle close 计时
        record.client.touch();
      } else {
        // 如果没有，则创建一个新的实例（并受最大数量限制）
        this.sandboxClient = new MCPSandboxClient();
        const newRecord: SandboxRecord = {
          client: this.sandboxClient,
          refCount: 1,
          lastUsedAt: Date.now(),
          idleCloseMs: PackageSO.IDLE_CLOSE_MS,
        };

        // 尝试插入，若超过 MAX 则尝试回收 LRU 可回收实例
        if (PackageSO.sandboxInstances.size >= PackageSO.MAX_SANDBOXES) {
          // 找到最老且 refCount === 0 的实例
          let lruKey: string | null = null;
          let lruTime = Infinity;
          for (const [k, r] of PackageSO.sandboxInstances) {
            if (r.refCount === 0 && r.lastUsedAt < lruTime) {
              lruKey = k;
              lruTime = r.lastUsedAt;
            }
          }
          if (lruKey) {
            const evict = PackageSO.sandboxInstances.get(lruKey)!;
            // 立刻关闭并删除
            evict.client.kill().catch((e) => {
              console.error("[PackageSO] Error killing evicted sandbox:", e);
            });
            PackageSO.sandboxInstances.delete(lruKey);
          } else {
            // 没有可回收的实例 -> 抛错，防止超过系统限制
            throw new Error("Cannot create new sandbox: max sandboxes reached and none are idle");
          }
        }

        PackageSO.sandboxInstances.set(sandboxKey, newRecord);
      }
    }
  }

  // Acquire / Release 更明确的 API（供外部或未来使用）
  static async acquireSandbox(key = "default"): Promise<MCPSandboxClient> {
    const record = PackageSO.sandboxInstances.get(key);
    if (record) {
      record.refCount++;
      record.lastUsedAt = Date.now();
      record.client.touch();
      return record.client;
    }

    // 创建新实例（注意 MAX_SANDBOXES 检查，与构造逻辑一致）
    if (PackageSO.sandboxInstances.size >= PackageSO.MAX_SANDBOXES) {
      // 尝试淘汰 LRU idle
      let lruKey: string | null = null;
      let lruTime = Infinity;
      for (const [k, r] of PackageSO.sandboxInstances) {
        if (r.refCount === 0 && r.lastUsedAt < lruTime) {
          lruKey = k;
          lruTime = r.lastUsedAt;
        }
      }
      if (lruKey) {
        const evict = PackageSO.sandboxInstances.get(lruKey)!;
        await evict.client
          .kill()
          .catch((e) => console.error("[PackageSO] Error killing evicted sandbox:", e));
        PackageSO.sandboxInstances.delete(lruKey);
      } else {
        throw new Error("Cannot create new sandbox: max sandboxes reached and none are idle");
      }
    }

    const client = new MCPSandboxClient();
    const newRecord: SandboxRecord = {
      client,
      refCount: 1,
      lastUsedAt: Date.now(),
      idleCloseMs: PackageSO.IDLE_CLOSE_MS,
    };
    PackageSO.sandboxInstances.set(key, newRecord);
    return client;
  }

  static async releaseSandbox(key = "default"): Promise<void> {
    const record = PackageSO.sandboxInstances.get(key);
    if (!record) return;
    record.refCount = Math.max(0, record.refCount - 1);
    record.lastUsedAt = Date.now();

    if (record.refCount === 0) {
      // schedule idle close after IDLE_CLOSE_MS
      record.client.scheduleIdleClose(record.idleCloseMs || PackageSO.IDLE_CLOSE_MS);
    }
  }

  // 清理所有静态沙箱实例的方法（safe）
  static async cleanupSandboxInstances(): Promise<void> {
    const killers: Promise<void>[] = [];
    for (const [key, record] of PackageSO.sandboxInstances) {
      killers.push(
        (async () => {
          try {
            await record.client.kill();
          } catch (err) {
            console.error("[PackageSO] cleanup error for sandbox", key, err);
          }
        })(),
      );
      PackageSO.sandboxInstances.delete(key);
    }
    await Promise.all(killers);
  }

  // 在进程退出时自动清理（首次 require 这个模块会注册）
  private static registerExitHandlerOnce = (() => {
    let registered = false;
    return () => {
      if (registered) return;
      registered = true;
      const cleanup = async () => {
        try {
          await PackageSO.cleanupSandboxInstances();
        } catch (err) {
          console.error("[PackageSO] Error during exit cleanup:", err);
        }
      };
      process.on("exit", () => {
        void cleanup();
      });
      process.on("SIGINT", () => {
        void cleanup().then(() => process.exit(0));
      });
      process.on("SIGTERM", () => {
        void cleanup().then(() => process.exit(0));
      });
    };
  })();

  // 确保注册
  private static ensureExitHandler() {
    PackageSO.registerExitHandlerOnce();
  }

  async executeTool(request: ToolExecute): Promise<unknown> {
    if (this.useSandbox) {
      return this.executeToolInSandbox(request);
    }

    const mcpServerConfig = getPackageConfigByKey(request.packageName);

    const { client, closeConnection } = await getMcpClient(mcpServerConfig, request.envs || {});
    try {
      const result = await client.callTool({
        name: request.toolKey,
        arguments: request.inputData,
      });

      console.log(`Tool ${request.toolKey} executed successfully`);
      return result;
    } finally {
      await closeConnection();
    }
  }

  private async executeToolInSandbox(request: ToolExecute): Promise<unknown> {
    if (!this.sandboxClient) {
      throw new Error("Sandbox client not initialized");
    }

    // 如果尚未初始化，则初始化（防止 race -> 使用 MCPSandboxClient.initialize 的并发保护）
    if (!this.sandboxClient["sandbox"]) {
      await this.sandboxClient.initialize();
    }

    // 标记使用（touch）
    this.sandboxClient.touch();

    // 执行
    try {
      const result = await this.sandboxClient.executeTool(
        request.packageName,
        request.toolKey,
        request.inputData || {},
        request.envs,
      );
      console.log(`Tool ${request.toolKey} executed successfully in sandbox`);
      return result;
    } finally {
      // release: 如果你用默认 key 的话，release 对应的 refCount
      // 这里我们默认使用 "default"，如果你以后支持按包 key 则要对应修改
      await PackageSO.releaseSandbox("default");
    }
  }

  async listTools(packageName: string): Promise<Tool[]> {
    if (this.useSandbox) {
      return this.listToolsInSandbox(packageName);
    }

    const mcpServerConfig = getPackageConfigByKey(packageName);

    const mockEnvs: Record<string, string> = {};
    if (mcpServerConfig.env) {
      Object.keys(mcpServerConfig.env).forEach((key) => {
        mockEnvs[key] = "mock_value";
      });
    }

    const { client, closeConnection } = await getMcpClient(mcpServerConfig, mockEnvs);
    try {
      const { tools } = await client.listTools();

      console.log(`Tools list retrieved successfully for package ${packageName}`);
      return tools;
    } finally {
      await closeConnection();
    }
  }

  private async listToolsInSandbox(packageName: string): Promise<Tool[]> {
    if (!this.sandboxClient) {
      throw new Error("Sandbox client not initialized");
    }

    // 只在沙箱未初始化时初始化
    if (!this.sandboxClient["sandbox"]) {
      await this.sandboxClient.initialize();
    }

    this.sandboxClient.touch();
    try {
      const tools = await this.sandboxClient.listTools(packageName);
      console.log(`Tools list retrieved successfully for package ${packageName} in sandbox`);
      return tools;
    } finally {
      await PackageSO.releaseSandbox("default");
    }
  }

  async getPackageDetail(packageName: string): Promise<MCPServerPackageConfig> {
    const packageInfo = typedAllPackagesList[packageName];
    if (!packageInfo) {
      throw new Error(`Package ${packageName} not found`);
    }

    const jsonFilePath = path.join(__dirname, "../../packages/", packageInfo.path);
    const jsonStr = fs.readFileSync(jsonFilePath, "utf-8");
    const packageConfig: MCPServerPackageConfig = JSON.parse(jsonStr);

    let tools: Tool[] | undefined;
    try {
      tools = await this.listTools(packageName);
    } catch (error) {
      console.warn(`Warn retrieving tools for package ${packageName}:`, (error as Error).message);
      // if tools cannot be retrieved, set tools to undefined
      tools = undefined;
    }

    const packageConfigWithTools: MCPServerPackageConfigWithTools = {
      ...packageConfig,
      tools,
    };

    return packageConfigWithTools;
  }

  async getPackageDetailBySandbox(packageName: string): Promise<MCPServerPackageConfig> {
    const packageInfo = typedAllPackagesList[packageName];
    if (!packageInfo) {
      throw new Error(`Package ${packageName} not found`);
    }

    // 使用 sandbox 进行查询时，明确 acquireSandbox 以增加引用计数
    PackageSO.ensureExitHandler();
    const client = await PackageSO.acquireSandbox("default");
    // 这里需要把当前实例 sandboxClient 设为 client，这样已有逻辑可以继续使用
    this.sandboxClient = client;
    try {
      return await this.getPackageDetail(packageName);
    } finally {
      await PackageSO.releaseSandbox("default");
    }
  }
}
