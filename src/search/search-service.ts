/**
 * MeiliSearch Service for Awesome MCP Registry
 * Handles search indexing and querying for MCP packages
 */

import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { MeiliSearch } from "meilisearch";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

interface PackageData {
  name?: string;
  description?: string;
  category?: string;
  validated?: boolean;
  tools?: Record<string, any>;
  path?: string;
}

interface SearchOptions {
  limit?: number;
  offset?: number;
  filter?: string | string[];
  sort?: string[];
  matchingStrategy?: string;
}

interface SearchResults {
  hits: any[];
  query: string;
  processingTimeMs: number;
  limit: number;
  offset: number;
  estimatedTotalHits: number;
}

interface IndexStats {
  numberOfDocuments: number;
  isIndexing: boolean;
  fieldDistribution: Record<string, number>;
}

class SearchService {
  private host: string;
  private apiKey: string | null;
  private indexName: string;
  protected client: MeiliSearch;
  protected _index: any;
  protected isInitialized: boolean;

  constructor(indexName: string = "mcp-packages") {
    // MeiliSearch configuration
    this.host = process.env.MEILI_HTTP_ADDR || "http://localhost:7700";
    this.apiKey = process.env.MEILI_MASTER_KEY || null;
    this.indexName = indexName;

    // Initialize MeiliSearch client
    this.client = new MeiliSearch({
      host: this.host,
      apiKey: this.apiKey || undefined,
    });

    this._index = null;
    this.isInitialized = false;
  }

  /**
   * Get the initialization status
   */
  getIsInitialized(): boolean {
    return this.isInitialized;
  }

  /**
   * Get the MeiliSearch client
   */
  getClient(): MeiliSearch {
    return this.client;
  }

  /**
   * Get the index
   */
  get index(): any {
    return this._index;
  }

  /**
   * Set the index
   */
  set index(value: any) {
    this._index = value;
  }

  /**
   * Initialize the search service and create/configure index
   */
  async initialize(): Promise<void> {
    try {
      console.log(`Connecting to MeiliSearch at ${this.host}...`);

      // Check if MeiliSearch is running
      await this.client.health();
      console.log("✅ MeiliSearch is healthy");

      // Create or get the index
      try {
        await this.client.createIndex(this.indexName, { primaryKey: "id" });
        console.log(`✅ Created new index: ${this.indexName}`);
      } catch (error: any) {
        if (error.message.includes("already exists")) {
          console.log(`✅ Using existing index: ${this.indexName}`);
        } else {
          throw error;
        }
      }

      // Get the index object
      this.index = this.client.index(this.indexName);

      // Configure search settings
      await this.configureIndex();

      this.isInitialized = true;
      console.log("✅ Search service initialized successfully");
    } catch (error: any) {
      console.error("❌ Failed to initialize search service:", error.message);
      console.log("💡 Make sure MeiliSearch is running on", this.host);
      throw error;
    }
  }

  /**
   * Configure search index settings for optimal MCP package search
   */
  async configureIndex(): Promise<void> {
    try {
      // Configure searchable attributes (ranked by importance)
      await this.index.updateSettings({
        searchableAttributes: [
          "name",
          "packageName",
          "description",
          "tools",
          "category",
          "author",
          "keywords",
        ],
        // Configure filterable attributes
        filterableAttributes: ["category", "validated", "author", "hasTools", "popularity"],
        // Configure sortable attributes
        sortableAttributes: ["popularity", "name", "category"],
        // Configure ranking rules for relevance
        rankingRules: [
          "words",
          "typo",
          "proximity",
          "attribute",
          "sort",
          "exactness",
          "popularity:desc",
        ],
        // Configure synonyms for better search
        synonyms: {
          ai: ["artificial intelligence", "machine learning", "ml"],
          db: ["database"],
          api: ["rest", "graphql"],
          auth: ["authentication", "authorization"],
          mcp: ["model context protocol"],
        },
      });

      console.log("✅ Search index configured");
    } catch (error: any) {
      console.error("❌ Failed to configure index:", error.message);
      throw error;
    }
  }

  /**
   * Transform package data for search indexing
   */
  transformPackageForIndex(packageName: string, packageData: PackageData): any {
    // Extract tools information
    const tools = packageData.tools || {};
    const toolNames = Object.keys(tools);
    const toolDescriptions = Object.values(tools)
      .map((t) => t.description || "")
      .join(" ");

    // Calculate basic popularity score (can be enhanced with real metrics)
    const popularity = this.calculatePopularityScore(packageData);

    // Create a safe ID by encoding special characters
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

  /**
   * Create a safe ID for MeiliSearch (alphanumeric, hyphens, underscores only)
   */
  createSafeId(packageName: string): string {
    return packageName
      .replace(/@/g, "at-")
      .replace(/\//g, "-")
      .replace(/\./g, "_")
      .replace(/:/g, "-")
      .replace(/[^a-zA-Z0-9\-_]/g, "_")
      .substring(0, 500); // Keep under 511 byte limit
  }

  /**
   * Calculate a popularity score for ranking
   */
  calculatePopularityScore(packageData: PackageData): number {
    let score = 0;

    // Boost for validated packages
    if (packageData.validated) score += 10;

    // Boost for packages with tools
    const toolCount = Object.keys(packageData.tools || {}).length;
    score += toolCount * 2;

    // Boost for packages with good descriptions
    if (packageData.description && packageData.description.length > 50) score += 5;

    return score;
  }

  /**
   * Extract author from package name
   */
  extractAuthor(packageName: string): string {
    if (packageName.startsWith("@")) {
      return packageName.split("/")[0].substring(1);
    }
    return "";
  }

  /**
   * Extract relevant keywords from package data
   */
  extractKeywords(packageData: PackageData, packageName: string): string {
    const keywords: string[] = [];

    // Add category as keyword
    if (packageData.category) {
      keywords.push(packageData.category.replace(/-/g, " "));
    }

    // Extract keywords from description
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

    // Extract from package name
    const nameWords = packageName
      .replace(/[@/\-_]/g, " ")
      .split(" ")
      .filter((w) => w.length > 2);
    keywords.push(...nameWords);

    return [...new Set(keywords)].join(" ");
  }

  /**
   * Index all packages from the packages-list.json file
   */
  async indexPackages(): Promise<IndexStats> {
    if (!this.isInitialized) {
      throw new Error("Search service not initialized. Call initialize() first.");
    }

    try {
      console.log("📥 Loading packages data...");

      const packagesPath = path.join(__dirname, "..", "..", "indexes", "packages-list.json");
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
        const task = await this.index.addDocuments(batch);
        console.log(
          `📝 Indexed batch ${i + 1}/${batches.length} (${batch.length} documents) - Task ID: ${task.taskUid}`,
        );

        // Wait for task completion
        await this.client.waitForTask(task.taskUid);
      }

      // Get final stats
      const stats = await this.index.getStats();
      console.log(`✅ Indexing complete! ${stats.numberOfDocuments} documents indexed`);

      return stats;
    } catch (error: any) {
      console.error("❌ Failed to index packages:", error.message);
      throw error;
    }
  }

  /**
   * Search packages with advanced options
   */
  async search(query: string, options: SearchOptions = {}): Promise<SearchResults> {
    if (!this.isInitialized) {
      throw new Error("Search service not initialized. Call initialize() first.");
    }

    try {
      const searchOptions = {
        limit: options.limit || 20,
        offset: options.offset || 0,
        filter: options.filter || null,
        sort: options.sort || ["popularity:desc"],
        attributesToHighlight: ["name", "description"],
        attributesToCrop: ["description"],
        cropLength: 100,
        highlightPreTag: "<mark>",
        highlightPostTag: "</mark>",
        matchingStrategy: options.matchingStrategy || "last",
        ...options,
      };

      const results = await this.index.search(query, searchOptions);

      return {
        hits: results.hits,
        query: results.query,
        processingTimeMs: results.processingTimeMs,
        limit: results.limit,
        offset: results.offset,
        estimatedTotalHits: results.estimatedTotalHits,
      };
    } catch (error: any) {
      console.error("❌ Search failed:", error.message);
      throw error;
    }
  }

  /**
   * Get search suggestions/autocomplete
   */
  async suggest(query: string, limit: number = 10): Promise<any[]> {
    if (!this.isInitialized) {
      throw new Error("Search service not initialized. Call initialize() first.");
    }

    try {
      const results = await this.index.search(query, {
        limit: limit,
        attributesToRetrieve: ["name", "packageName", "category"],
        attributesToHighlight: ["name"],
        cropLength: 0,
      });

      return results.hits.map((hit: any) => ({
        name: hit.name,
        packageName: hit.packageName,
        category: hit.category,
        highlighted: hit._formatted?.name || hit.name,
      }));
    } catch (error: any) {
      console.error("❌ Suggestions failed:", error.message);
      throw error;
    }
  }

  /**
   * Get faceted search results (for filters)
   */
  async getFacets(): Promise<any> {
    if (!this.isInitialized) {
      throw new Error("Search service not initialized. Call initialize() first.");
    }

    try {
      const results = await this.index.search("", {
        limit: 0,
        facets: ["category", "validated", "author"],
      });

      return results.facetDistribution;
    } catch (error: any) {
      console.error("❌ Failed to get facets:", error.message);
      throw error;
    }
  }

  /**
   * Get index statistics
   */
  async getStats(): Promise<IndexStats> {
    if (!this.isInitialized) {
      throw new Error("Search service not initialized. Call initialize() first.");
    }

    try {
      return await this.index.getStats();
    } catch (error: any) {
      console.error("❌ Failed to get stats:", error.message);
      throw error;
    }
  }

  /**
   * Clear the index
   */
  async clearIndex(): Promise<void> {
    if (!this.isInitialized) {
      throw new Error("Search service not initialized. Call initialize() first.");
    }

    try {
      const task = await this.index.deleteAllDocuments();
      await this.client.waitForTask(task.taskUid);
      console.log("✅ Index cleared");
    } catch (error: any) {
      console.error("❌ Failed to clear index:", error.message);
      throw error;
    }
  }

  /**
   * Health check for the search service
   */
  async healthCheck(): Promise<any> {
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
    } catch (error: any) {
      return {
        status: "unhealthy",
        error: error.message,
        host: this.host,
        initialized: false,
      };
    }
  }
}

// Export singleton instance
const searchService = new SearchService();
export default searchService;
