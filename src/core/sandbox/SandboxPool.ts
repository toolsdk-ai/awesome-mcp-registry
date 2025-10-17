import type { MCPSandboxProvider } from "../../shared/types";
import type { ISandboxClient, SandboxStatus } from "./ISandboxClient";
import { SandboxFactory } from "./SandboxFactory";

/**
 * 沙盒池记录
 */
interface SandboxPoolRecord {
  client: ISandboxClient;
  refCount: number;
  lastUsedAt: number;
  provider: MCPSandboxProvider;
  runtime: "node" | "python" | "java" | "go";
}

/**
 * 沙盒池管理器
 * 负责沙盒实例的生命周期管理（单例模式）
 */
export class SandboxPool {
  private static instance: SandboxPool;
  private pools: Map<string, SandboxPoolRecord>;
  private readonly maxSize: number;

  private constructor(maxSize: number = 10) {
    this.pools = new Map();
    this.maxSize = maxSize;
  }

  /**
   * 获取沙盒池单例
   */
  static getInstance(): SandboxPool {
    if (!SandboxPool.instance) {
      SandboxPool.instance = new SandboxPool();
    }
    return SandboxPool.instance;
  }

  /**
   * 获取沙盒键
   */
  private getSandboxKey(
    runtime: "node" | "python" | "java" | "go",
    provider: MCPSandboxProvider,
  ): string {
    return `sandbox-${provider}-${runtime}`;
  }

  /**
   * 获取或创建沙盒实例
   */
  async acquire(
    runtime: "node" | "python" | "java" | "go",
    provider: MCPSandboxProvider,
  ): Promise<ISandboxClient> {
    const sandboxKey = this.getSandboxKey(runtime, provider);
    const record = this.pools.get(sandboxKey);

    if (record) {
      record.refCount++;
      record.lastUsedAt = Date.now();
      console.log(
        `[SandboxPool] Reusing existing sandbox: ${sandboxKey} (refCount: ${record.refCount})`,
      );
      return record.client;
    }

    // 检查是否达到最大数量
    if (this.pools.size >= this.maxSize) {
      await this.evictLRU();
    }

    // 创建新的沙盒实例
    console.log(`[SandboxPool] Creating new sandbox: ${sandboxKey}`);
    const client = SandboxFactory.create(runtime, provider);

    const newRecord: SandboxPoolRecord = {
      client,
      refCount: 1,
      lastUsedAt: Date.now(),
      provider,
      runtime,
    };

    this.pools.set(sandboxKey, newRecord);
    return client;
  }

  /**
   * 释放沙盒实例
   */
  async release(
    runtime: "node" | "python" | "java" | "go",
    provider: MCPSandboxProvider,
  ): Promise<void> {
    const sandboxKey = this.getSandboxKey(runtime, provider);
    const record = this.pools.get(sandboxKey);

    if (!record) {
      console.warn(`[SandboxPool] Sandbox ${sandboxKey} not found in pool`);
      return;
    }

    record.refCount = Math.max(0, record.refCount - 1);
    record.lastUsedAt = Date.now();

    console.log(`[SandboxPool] Released sandbox: ${sandboxKey} (refCount: ${record.refCount})`);

    // 如果引用计数为 0，立即关闭沙盒
    if (record.refCount === 0) {
      try {
        await record.client.destroy();
        this.pools.delete(sandboxKey);
        console.log(`[SandboxPool] Sandbox ${sandboxKey} destroyed and removed from pool`);
      } catch (error) {
        console.error(`[SandboxPool] Error destroying sandbox ${sandboxKey}:`, error);
      }
    }
  }

  /**
   * LRU 淘汰策略
   * 淘汰最久未使用且引用计数为 0 的沙盒
   */
  private async evictLRU(): Promise<void> {
    let lruKey: string | null = null;
    let lruTime = Infinity;

    for (const [key, record] of this.pools) {
      if (record.refCount === 0 && record.lastUsedAt < lruTime) {
        lruKey = key;
        lruTime = record.lastUsedAt;
      }
    }

    if (lruKey) {
      const evictRecord = this.pools.get(lruKey);
      if (evictRecord) {
        try {
          await evictRecord.client.destroy();
          this.pools.delete(lruKey);
          console.log(`[SandboxPool] Evicted LRU sandbox: ${lruKey}`);
        } catch (error) {
          console.error(`[SandboxPool] Error evicting sandbox ${lruKey}:`, error);
        }
      }
    } else {
      throw new Error("Cannot create new sandbox: max sandboxes reached and none are idle");
    }
  }

  /**
   * 清理所有沙盒
   */
  async cleanup(): Promise<void> {
    console.log(`[SandboxPool] Cleaning up ${this.pools.size} sandbox(es)`);

    const cleanupPromises: Promise<void>[] = [];
    for (const [key, record] of this.pools) {
      cleanupPromises.push(
        (async () => {
          try {
            await record.client.destroy();
            console.log(`[SandboxPool] Cleaned up sandbox: ${key}`);
          } catch (error) {
            console.error(`[SandboxPool] Error cleaning up sandbox ${key}:`, error);
          }
        })(),
      );
    }

    await Promise.all(cleanupPromises);
    this.pools.clear();
    console.log("[SandboxPool] All sandboxes cleaned up");
  }

  /**
   * 获取池状态（用于调试）
   */
  getPoolStatus() {
    const status: Record<string, { refCount: number; lastUsedAt: number; status: SandboxStatus }> =
      {};
    for (const [key, record] of this.pools) {
      status[key] = {
        refCount: record.refCount,
        lastUsedAt: record.lastUsedAt,
        status: record.client.getStatus(),
      };
    }
    return status;
  }
}
