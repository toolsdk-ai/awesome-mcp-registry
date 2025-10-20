import path from "node:path";
import { getDirname } from "../../shared/utils/file-util";
import { createErrorResponse, createResponse } from "../../shared/utils/response-util";
import { SearchSO } from "./search-so";

const __dirname = getDirname(import.meta.url);

let searchSO: SearchSO | null = null;

async function getSearchSO(): Promise<SearchSO> {
  if (!searchSO) {
    searchSO = await SearchSO.getInstance();
  }
  return searchSO;
}

export const searchHandler = {
  search: async ({
    q,
    limit = 20,
    offset = 0,
    category,
  }: {
    q: string;
    limit?: number;
    offset?: number;
    category?: string;
  }) => {
    try {
      const filter = category ? `category = '${category}'` : undefined;
      const so = await getSearchSO();
      const results = await so.search(q, { limit, offset, filter });
      return createResponse(results);
    } catch (error) {
      console.error("Search failed:", (error as Error).stack);
      return createErrorResponse((error as Error).message || "Search failed", 500);
    }
  },

  suggest: async (q: string, limit = 10) => {
    try {
      const so = await getSearchSO();
      const suggestions = await so.suggest(q, limit);
      return createResponse({ suggestions });
    } catch (error) {
      console.error("Failed to get suggestions:", (error as Error).stack);
      return createErrorResponse((error as Error).message || "Failed to get suggestions", 400);
    }
  },

  getFacets: async () => {
    try {
      const so = await getSearchSO();
      const facets = await so.getFacets();
      return createResponse({
        categories: facets?.category,
        authors: facets?.author,
        validated: facets?.validated,
      });
    } catch (error) {
      console.error("Failed to get facets:", (error as Error).stack);
      return createErrorResponse((error as Error).message || "Failed to get facets", 500);
    }
  },

  healthCheck: async () => {
    try {
      const so = await getSearchSO();
      const health = await so.healthCheck();
      return createResponse(health);
    } catch (error) {
      console.error("Health check failed:", (error as Error).stack);
      return createErrorResponse((error as Error).message || "Health check failed", 500);
    }
  },

  initialize: async () => {
    try {
      searchSO = await SearchSO.getInstance();
      return createResponse({ message: "Search service initialized successfully" });
    } catch (error) {
      console.error("Failed to initialize search service:", (error as Error).stack);
      return createErrorResponse(
        (error as Error).message || "Failed to initialize search service",
        500,
      );
    }
  },

  indexPackages: async () => {
    try {
      const so = await getSearchSO();
      const packagesPath = path.join(__dirname, "../../../indexes/packages-list.json");
      const stats = await so.indexPackages(packagesPath);
      return createResponse({
        message: `Indexed ${stats.numberOfDocuments} documents`,
        details: stats,
      });
    } catch (error) {
      console.error("Failed to index packages:", (error as Error).stack);
      return createErrorResponse((error as Error).message || "Failed to index packages", 500);
    }
  },

  clearIndex: async () => {
    try {
      const so = await getSearchSO();
      await so.clearIndex();
      return createResponse({ message: "Index cleared successfully" });
    } catch (error) {
      console.error("Failed to clear index:", (error as Error).stack);
      return createErrorResponse((error as Error).message || "Failed to clear index", 500);
    }
  },

  getStats: async () => {
    try {
      const so = await getSearchSO();
      const stats = await so.getStats();
      return createResponse({
        message: "Index statistics retrieved successfully",
        details: stats,
      });
    } catch (error) {
      console.error("Failed to get index statistics:", (error as Error).stack);
      return createErrorResponse((error as Error).message || "Failed to get index statistics", 500);
    }
  },
};
