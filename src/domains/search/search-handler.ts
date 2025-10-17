import path from "node:path";
import type { Context } from "hono";
import { getDirname } from "../../shared/utils/file-util";
import { createErrorResponse, createResponse } from "../../shared/utils/response-util";
import { SearchSO } from "./search-so";

const __dirname = getDirname(import.meta.url);

// 初始化 SearchSO 单例（延迟初始化）
let searchSO: SearchSO | null = null;

async function getSearchSO(): Promise<SearchSO> {
  if (!searchSO) {
    searchSO = await SearchSO.getInstance();
  }
  return searchSO;
}

/**
 * Search Handler
 * 处理搜索相关的 HTTP 请求
 */
export const searchHandler = {
  /**
   * 搜索
   */
  search: async (c: Context) => {
    try {
      const q = c.req.query("q") || "";
      const limit = Number.parseInt(c.req.query("limit") || "20", 10);
      const offset = Number.parseInt(c.req.query("offset") || "0", 10);
      const category = c.req.query("category");

      const filter = category ? `category = '${category}'` : undefined;

      const so = await getSearchSO();
      const results = await so.search(q, { limit, offset, filter });

      return c.json(createResponse(results), 200);
    } catch (error) {
      console.error("Search failed:", (error as Error).stack);
      return c.json(createErrorResponse((error as Error).message || "Search failed", 500), 500);
    }
  },

  /**
   * 获取搜索建议
   */
  suggest: async (c: Context) => {
    try {
      const q = c.req.query("q") || "";
      const limit = Number.parseInt(c.req.query("limit") || "10", 10);

      const so = await getSearchSO();
      const suggestions = await so.suggest(q, limit);

      return c.json(createResponse({ suggestions }), 200);
    } catch (error) {
      console.error("Failed to get suggestions:", (error as Error).stack);
      return c.json(
        createErrorResponse((error as Error).message || "Failed to get suggestions", 400),
        400,
      );
    }
  },

  /**
   * 获取 Facets
   */
  getFacets: async (c: Context) => {
    try {
      const so = await getSearchSO();
      const facets = await so.getFacets();

      return c.json(
        createResponse({
          categories: facets?.category,
          authors: facets?.author,
          validated: facets?.validated,
        }),
        200,
      );
    } catch (error) {
      console.error("Failed to get facets:", (error as Error).stack);
      return c.json(
        createErrorResponse((error as Error).message || "Failed to get facets", 500),
        500,
      );
    }
  },

  /**
   * 健康检查
   */
  healthCheck: async (c: Context) => {
    try {
      const so = await getSearchSO();
      const health = await so.healthCheck();

      return c.json(createResponse(health), 200);
    } catch (error) {
      console.error("Health check failed:", (error as Error).stack);
      return c.json(
        createErrorResponse((error as Error).message || "Health check failed", 500),
        500,
      );
    }
  },

  /**
   * 初始化搜索服务
   */
  initialize: async (c: Context) => {
    try {
      searchSO = await SearchSO.getInstance();

      return c.json(createResponse({ message: "Search service initialized successfully" }), 200);
    } catch (error) {
      console.error("Failed to initialize search service:", (error as Error).stack);
      return c.json(
        createErrorResponse((error as Error).message || "Failed to initialize search service", 500),
        500,
      );
    }
  },

  /**
   * 索引包
   */
  indexPackages: async (c: Context) => {
    try {
      const so = await getSearchSO();
      const packagesPath = path.join(__dirname, "../../../indexes/packages-list.json");
      const stats = await so.indexPackages(packagesPath);

      return c.json(
        createResponse({
          message: `Indexed ${stats.numberOfDocuments} documents`,
          details: stats,
        }),
        200,
      );
    } catch (error) {
      console.error("Failed to index packages:", (error as Error).stack);
      return c.json(
        createErrorResponse((error as Error).message || "Failed to index packages", 500),
        500,
      );
    }
  },

  /**
   * 清空索引
   */
  clearIndex: async (c: Context) => {
    try {
      const so = await getSearchSO();
      await so.clearIndex();

      return c.json(createResponse({ message: "Index cleared successfully" }), 200);
    } catch (error) {
      console.error("Failed to clear index:", (error as Error).stack);
      return c.json(
        createErrorResponse((error as Error).message || "Failed to clear index", 500),
        500,
      );
    }
  },

  /**
   * 获取索引统计
   */
  getStats: async (c: Context) => {
    try {
      const so = await getSearchSO();
      const stats = await so.getStats();

      return c.json(
        createResponse({
          message: "Index statistics retrieved successfully",
          details: stats,
        }),
        200,
      );
    } catch (error) {
      console.error("Failed to get index statistics:", (error as Error).stack);
      return c.json(
        createErrorResponse((error as Error).message || "Failed to get index statistics", 500),
        500,
      );
    }
  },
};
