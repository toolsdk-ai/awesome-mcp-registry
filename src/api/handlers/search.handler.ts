import type { Context } from "hono";
import searchService from "../../core/search/SearchService";
import { createErrorResponse, createResponse } from "../../utils";

/**
 * 搜索处理器
 * 处理搜索相关的 HTTP 请求
 */
export const searchHandler = {
  /**
   * 搜索
   */
  search: async (c: Context) => {
    try {
      const { q, limit, offset, category } = c.req.valid("query");

      const filter = category ? `category = '${category}'` : undefined;

      const results = await searchService.search(q, {
        limit,
        offset,
        filter,
      });

      const response = createResponse(results);
      return c.json(response, 200);
    } catch (error) {
      console.error("Search failed:", (error as Error).stack);
      const errorResponse = createErrorResponse((error as Error).message || "Search failed", 500);
      return c.json(errorResponse, 500);
    }
  },

  /**
   * 获取搜索建议
   */
  suggest: async (c: Context) => {
    try {
      const { q, limit } = c.req.valid("query");

      const suggestions = await searchService.suggest(q, limit);

      const response = createResponse({ suggestions });
      return c.json(response, 200);
    } catch (error) {
      console.error("Failed to get suggestions:", (error as Error).stack);
      const errorResponse = createErrorResponse(
        (error as Error).message || "Failed to get suggestions",
      );
      return c.json(errorResponse, 400);
    }
  },

  /**
   * 获取 Facets
   */
  getFacets: async (c: Context) => {
    try {
      const facets = await searchService.getFacets();

      const response = createResponse({
        categories: facets?.category,
        authors: facets?.author,
        validated: facets?.validated,
      });
      return c.json(response, 200);
    } catch (error) {
      console.error("Failed to get facets:", (error as Error).stack);
      const errorResponse = createErrorResponse(
        (error as Error).message || "Failed to get facets",
        500,
      );
      return c.json(errorResponse, 500);
    }
  },

  /**
   * 健康检查
   */
  healthCheck: async (c: Context) => {
    try {
      const health = await searchService.healthCheck();

      const response = createResponse(health);
      return c.json(response, 200);
    } catch (error) {
      console.error("Health check failed:", (error as Error).stack);
      const errorResponse = createErrorResponse(
        (error as Error).message || "Health check failed",
        500,
      );
      return c.json(errorResponse, 500);
    }
  },

  /**
   * 初始化搜索服务
   */
  initialize: async (c: Context) => {
    try {
      await searchService.initialize();

      const response = createResponse({
        message: "Search service initialized successfully",
      });
      return c.json(response, 200);
    } catch (error) {
      console.error("Failed to initialize search service:", (error as Error).stack);
      const errorResponse = createErrorResponse(
        (error as Error).message || "Failed to initialize search service",
        500,
      );
      return c.json(errorResponse, 500);
    }
  },

  /**
   * 索引包
   */
  indexPackages: async (c: Context) => {
    try {
      const stats = await searchService.indexPackages();

      const response = createResponse({
        message: `Indexed ${stats.numberOfDocuments} documents`,
        details: stats,
      });
      return c.json(response, 200);
    } catch (error) {
      console.error("Failed to index packages:", (error as Error).stack);
      const errorResponse = createErrorResponse(
        (error as Error).message || "Failed to index packages",
        500,
      );
      return c.json(errorResponse, 500);
    }
  },

  /**
   * 清空索引
   */
  clearIndex: async (c: Context) => {
    try {
      await searchService.clearIndex();

      const response = createResponse({
        message: "Index cleared successfully",
      });
      return c.json(response, 200);
    } catch (error) {
      console.error("Failed to clear index:", (error as Error).stack);
      const errorResponse = createErrorResponse(
        (error as Error).message || "Failed to clear index",
        500,
      );
      return c.json(errorResponse, 500);
    }
  },

  /**
   * 获取索引统计
   */
  getStats: async (c: Context) => {
    try {
      const stats = await searchService.getStats();

      const response = createResponse({
        message: "Index statistics retrieved successfully",
        details: stats,
      });
      return c.json(response, 200);
    } catch (error) {
      console.error("Failed to get index statistics:", (error as Error).stack);
      const errorResponse = createErrorResponse(
        (error as Error).message || "Failed to get index statistics",
        500,
      );
      return c.json(errorResponse, 500);
    }
  },
};
