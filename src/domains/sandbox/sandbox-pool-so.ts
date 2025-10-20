import type { SandboxClient, SandboxStatus } from "./sandbox-client-interface";
import { SandboxFactory } from "./sandbox-factory";
import type { MCPSandboxProvider } from "./sandbox-types";

interface SandboxPoolRecord {
  client: SandboxClient;
  refCount: number;
  lastUsedAt: number;
  provider: MCPSandboxProvider;
  runtime: "node" | "python" | "java" | "go";
}

/**
 * Sandbox Pool Service Object
 * Manages sandbox instance lifecycle with singleton pattern
 */
export class SandboxPoolSO {
  private static instance: SandboxPoolSO;
  private pools: Map<string, SandboxPoolRecord>;
  private readonly maxSize: number;

  private constructor(maxSize: number = 10) {
    this.pools = new Map();
    this.maxSize = maxSize;
  }

  static getInstance(): SandboxPoolSO {
    if (!SandboxPoolSO.instance) {
      SandboxPoolSO.instance = new SandboxPoolSO();
    }
    return SandboxPoolSO.instance;
  }

  private getSandboxKey(
    runtime: "node" | "python" | "java" | "go",
    provider: MCPSandboxProvider,
  ): string {
    return `sandbox-${provider}-${runtime}`;
  }

  async acquire(
    runtime: "node" | "python" | "java" | "go",
    provider: MCPSandboxProvider,
  ): Promise<SandboxClient> {
    const sandboxKey = this.getSandboxKey(runtime, provider);
    const record = this.pools.get(sandboxKey);

    if (record) {
      record.refCount++;
      record.lastUsedAt = Date.now();
      console.log(
        `[SandboxPoolSO] Reusing existing sandbox: ${sandboxKey} (refCount: ${record.refCount})`,
      );
      return record.client;
    }

    if (this.pools.size >= this.maxSize) {
      await this.evictLRU();
    }

    console.log(`[SandboxPoolSO] Creating new sandbox: ${sandboxKey}`);
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

  async release(
    runtime: "node" | "python" | "java" | "go",
    provider: MCPSandboxProvider,
  ): Promise<void> {
    const sandboxKey = this.getSandboxKey(runtime, provider);
    const record = this.pools.get(sandboxKey);

    if (!record) {
      console.warn(`[SandboxPoolSO] Sandbox ${sandboxKey} not found in pool`);
      return;
    }

    record.refCount = Math.max(0, record.refCount - 1);
    record.lastUsedAt = Date.now();

    console.log(`[SandboxPoolSO] Released sandbox: ${sandboxKey} (refCount: ${record.refCount})`);

    if (record.refCount === 0) {
      try {
        await record.client.destroy();
        this.pools.delete(sandboxKey);
        console.log(`[SandboxPoolSO] Sandbox ${sandboxKey} destroyed and removed from pool`);
      } catch (error) {
        console.error(`[SandboxPoolSO] Error destroying sandbox ${sandboxKey}:`, error);
      }
    }
  }

  /**
   * LRU eviction strategy
   * Evicts least recently used sandbox with zero reference count
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
          console.log(`[SandboxPoolSO] Evicted LRU sandbox: ${lruKey}`);
        } catch (error) {
          console.error(`[SandboxPoolSO] Error evicting sandbox ${lruKey}:`, error);
        }
      }
    } else {
      throw new Error("Cannot create new sandbox: max sandboxes reached and none are idle");
    }
  }

  async cleanup(): Promise<void> {
    console.log(`[SandboxPoolSO] Cleaning up ${this.pools.size} sandbox(es)`);

    const cleanupPromises: Promise<void>[] = [];
    for (const [key, record] of this.pools) {
      cleanupPromises.push(
        (async () => {
          try {
            await record.client.destroy();
            console.log(`[SandboxPoolSO] Cleaned up sandbox: ${key}`);
          } catch (error) {
            console.error(`[SandboxPoolSO] Error cleaning up sandbox ${key}:`, error);
          }
        })(),
      );
    }

    await Promise.all(cleanupPromises);
    this.pools.clear();
    console.log("[SandboxPoolSO] All sandboxes cleaned up");
  }

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
