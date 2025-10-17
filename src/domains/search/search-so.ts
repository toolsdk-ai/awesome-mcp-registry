/**
 * Search Service Object
 * 处理 MeiliSearch 搜索和索引相关的业务逻辑
 */

import fs from "node:fs/promises";
import { type Index, MeiliSearch } from "meilisearch";
import { getMeiliSearchConfig } from "../../shared/config/environment";

interface PackageData {
  name?: string;
  description?: string;
  category?: string;
  validated?: boolean;
  tools?: Record<string, { description?: string }>;
  path?: string;
}

interface SearchOptions {
  limit?: number;
  offset?: number;
  filter?: string | string[];
  sort?: string[];
  matchingStrategy?: string;
}

/**
 * Search Service Object
 * 使用单例模式管理 MeiliSearch 连接和索引
 */
export class SearchSO {
  private static instance: SearchSO | null = null;

  private constructor(
    private readonly client: MeiliSearch,
    private _index: Index | null,
    private readonly host: string,
    private readonly indexName: string,
  ) {}

  // ===== Getters =====
  get index() {
    return this._index;
  }
  get isInitialized() {
    return this._index !== null;
  }

  // ===== 静态工厂方法（单例）=====
  /**
   * 获取或创建 SearchSO 实例（单例模式）
   */
  static async getInstance(
    host?: string,
    apiKey?: string,
    indexName: string = "mcp-packages",
  ): Promise<SearchSO> {
    if (SearchSO.instance?.isInitialized) {
      return SearchSO.instance;
    }

    const meiliConfig = getMeiliSearchConfig();
    const meiliHost = host || meiliConfig.host;
    const meiliKey = apiKey || meiliConfig.apiKey || undefined;

    const client = new MeiliSearch({
      host: meiliHost,
      apiKey: meiliKey,
    });

    console.log(`Connecting to MeiliSearch at ${meiliHost}...`);

    // 健康检查
    await client.health();
    console.log("✅ MeiliSearch is healthy");

    // 创建或获取索引
    let index: Index;
    try {
      await client.createIndex(indexName, { primaryKey: "id" });
      console.log(`✅ Created new index: ${indexName}`);
      index = await client.getIndex(indexName);
    } catch (error) {
      if ((error as Error).message.includes("exists")) {
        console.log(`✅ Using existing index: ${indexName}`);
      }
      index = await client.getIndex(indexName);
    }

    const searchSO = new SearchSO(client, index, meiliHost, indexName);
    await searchSO.configureIndex();

    console.log("✅ Search service initialized successfully");
    SearchSO.instance = searchSO;
    return searchSO;
  }

  // ===== 业务方法 =====
  /**
   * 配置搜索索引设置
   */
  private async configureIndex(): Promise<void> {
    if (!this._index) return;

    try {
      await this._index.updateSettings({
        searchableAttributes: [
          "name",
          "packageName",
          "description",
          "tools",
          "category",
          "author",
          "keywords",
        ],
        filterableAttributes: ["category", "validated", "author", "hasTools", "popularity"],
        sortableAttributes: ["popularity", "name", "category"],
        rankingRules: [
          "words",
          "typo",
          "proximity",
          "attribute",
          "sort",
          "exactness",
          "popularity:desc",
        ],
        synonyms: {
          ai: ["artificial intelligence", "machine learning", "ml"],
          db: ["database"],
          api: ["rest", "graphql"],
          auth: ["authentication", "authorization"],
          mcp: ["model context protocol"],
        },
      });
      console.log("✅ Search index configured");
    } catch (error) {
      console.error("❌ Failed to configure index:", (error as Error).message);
      throw error;
    }
  }

  /**
   * 搜索包
   */
  async search(query: string, options: SearchOptions = {}) {
    if (!this._index) {
      throw new Error("Search index not initialized. Call getInstance() first.");
    }

    try {
      const searchOptions = {
        limit: options.limit || 20,
        offset: options.offset || 0,
        filter: options.filter || undefined,
        sort: options.sort || ["popularity:desc"],
        attributesToHighlight: ["name", "description"],
        attributesToCrop: ["description"],
        cropLength: 100,
        highlightPreTag: "<mark>",
        highlightPostTag: "</mark>",
        matchingStrategy: options.matchingStrategy || "last",
        ...options,
      };

      const results = await this._index.search(query, searchOptions);

      return {
        hits: results.hits,
        query: results.query,
        processingTimeMs: results.processingTimeMs,
        limit: results.limit,
        offset: results.offset,
        estimatedTotalHits: results.estimatedTotalHits,
      };
    } catch (error) {
      console.error("❌ Search failed:", (error as Error).message);
      throw error;
    }
  }

  /**
   * 获取搜索建议/自动完成
   */
  async suggest(query: string, limit: number = 10) {
    if (!this._index) {
      throw new Error("Search index not initialized");
    }

    try {
      const results = await this._index.search(query, {
        limit: limit,
        attributesToRetrieve: ["name", "packageName", "category"],
        attributesToHighlight: ["name"],
        cropLength: 0,
      });

      return results.hits.map(
        (hit: {
          name?: string;
          packageName?: string;
          category?: string;
          _formatted?: { name?: string };
        }) => ({
          name: hit.name || "",
          packageName: hit.packageName || "",
          category: hit.category || "",
          highlighted: hit._formatted?.name || hit.name || "",
        }),
      );
    } catch (error) {
      console.error("❌ Suggestions failed:", (error as Error).message);
      throw error;
    }
  }

  /**
   * 索引所有包
   */
  async indexPackages(packagesPath: string) {
    if (!this._index) {
      throw new Error("Search index not initialized");
    }

    try {
      console.log("📥 Loading packages data...");
      const packagesData = await fs.readFile(packagesPath, "utf8");
      const packages = JSON.parse(packagesData);

      console.log(`📦 Found ${Object.keys(packages).length} packages to index`);

      // Transform packages for indexing
      const documents = Object.entries(packages).map(([packageName, packageData]) =>
        this.transformPackageForIndex(packageName, packageData as PackageData),
      );

      console.log("🔄 Indexing packages...");

      // Add documents to index in batches
      const batchSize = 1000;
      const batches = [];
      for (let i = 0; i < documents.length; i += batchSize) {
        batches.push(documents.slice(i, i + batchSize));
      }

      for (let i = 0; i < batches.length; i++) {
        const batch = batches[i];
        const task = await this._index.addDocuments(batch);
        console.log(
          `📝 Indexed batch ${i + 1}/${batches.length} (${batch.length} documents) - Task ID: ${task.taskUid}`,
        );
        await this.client.waitForTask(task.taskUid);
      }

      // Get final stats
      const stats = await this._index.getStats();
      console.log(`✅ Indexing complete! ${stats.numberOfDocuments} documents indexed`);

      return stats;
    } catch (error) {
      console.error("❌ Failed to index packages:", (error as Error).message);
      throw error;
    }
  }

  /**
   * 获取分面搜索结果（用于过滤器）
   */
  async getFacets() {
    if (!this._index) {
      throw new Error("Search index not initialized");
    }

    try {
      const results = await this._index.search("", {
        limit: 0,
        facets: ["category", "validated", "author"],
      });
      return results.facetDistribution;
    } catch (error) {
      console.error("❌ Failed to get facets:", (error as Error).message);
      throw error;
    }
  }

  /**
   * 获取索引统计信息
   */
  async getStats() {
    if (!this._index) {
      throw new Error("Search index not initialized");
    }

    try {
      return await this._index.getStats();
    } catch (error) {
      console.error("❌ Failed to get stats:", (error as Error).message);
      throw error;
    }
  }

  /**
   * 清空索引
   */
  async clearIndex(): Promise<void> {
    if (!this._index) {
      throw new Error("Search index not initialized");
    }

    try {
      const task = await this._index.deleteAllDocuments();
      await this.client.waitForTask(task.taskUid);
      console.log("✅ Index cleared");
    } catch (error) {
      console.error("❌ Failed to clear index:", (error as Error).message);
      throw error;
    }
  }

  /**
   * 健康检查
   */
  async healthCheck() {
    try {
      await this.client.health();
      const stats = this.isInitialized ? await this.getStats() : null;

      return {
        status: "healthy",
        host: this.host,
        initialized: this.isInitialized,
        indexName: this.indexName,
        documentCount: stats?.numberOfDocuments || 0,
      };
    } catch (_error) {
      return {
        status: "unhealthy",
        host: this.host,
        initialized: false,
        indexName: this.indexName,
        documentCount: 0,
      };
    }
  }

  // ===== 私有辅助方法 =====
  /**
   * 转换包数据用于索引
   */
  private transformPackageForIndex(
    packageName: string,
    packageData: PackageData,
  ): Record<string, unknown> {
    const tools = packageData.tools || {};
    const toolNames = Object.keys(tools);
    const toolDescriptions = Object.values(tools)
      .map((t) => t.description || "")
      .join(" ");

    const popularity = this.calculatePopularityScore(packageData);
    const safeId = this.createSafeId(packageName);

    return {
      id: safeId,
      name: packageData.name || packageName,
      packageName: packageName,
      description: packageData.description || "",
      category: packageData.category || "uncategorized",
      validated: packageData.validated || false,
      author: this.extractAuthor(packageName),
      tools: `${toolNames.join(" ")} ${toolDescriptions}`,
      toolCount: toolNames.length,
      hasTools: toolNames.length > 0,
      keywords: this.extractKeywords(packageData, packageName),
      popularity: popularity,
      path: packageData.path || "",
    };
  }

  private createSafeId(packageName: string): string {
    return packageName
      .replace(/@/g, "at-")
      .replace(/\//g, "-")
      .replace(/\./g, "_")
      .replace(/:/g, "-")
      .replace(/[^a-zA-Z0-9\-_]/g, "_")
      .substring(0, 500);
  }

  private calculatePopularityScore(packageData: PackageData): number {
    let score = 0;
    if (packageData.validated) score += 10;
    const toolCount = Object.keys(packageData.tools || {}).length;
    score += toolCount * 2;
    if (packageData.description && packageData.description.length > 50) score += 5;
    return score;
  }

  private extractAuthor(packageName: string): string {
    if (packageName.startsWith("@")) {
      return packageName.split("/")[0].substring(1);
    }
    return "";
  }

  private extractKeywords(packageData: PackageData, packageName: string): string {
    const keywords: string[] = [];

    if (packageData.category) {
      keywords.push(packageData.category.replace(/-/g, " "));
    }

    if (packageData.description) {
      const desc = packageData.description.toLowerCase();
      const commonKeywords = [
        "api",
        "database",
        "auth",
        "search",
        "ai",
        "ml",
        "tool",
        "server",
        "client",
      ];
      commonKeywords.forEach((keyword) => {
        if (desc.includes(keyword)) keywords.push(keyword);
      });
    }

    const nameWords = packageName
      .replace(/[@/\-_]/g, " ")
      .split(" ")
      .filter((w) => w.length > 2);
    keywords.push(...nameWords);

    return [...new Set(keywords)].join(" ");
  }
}
