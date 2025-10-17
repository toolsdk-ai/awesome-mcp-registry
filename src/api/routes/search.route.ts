import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { BaseResponseSchema } from "../../schema";
import { createRouteResponses } from "../../utils";
import { searchHandler } from "../handlers/search.handler";

export const searchRoutes = new OpenAPIHono();

// 搜索查询参数 schema
const searchQuerySchema = z.object({
  q: z.string().openapi({
    description: "Search query",
    example: "database",
  }),
  limit: z.coerce.number().min(1).max(100).optional().openapi({
    description: "Limit the number of results",
    example: 20,
  }),
  offset: z.coerce.number().min(0).optional().openapi({
    description: "Offset for pagination",
    example: 0,
  }),
  category: z.string().optional().openapi({
    description: "Filter by category",
    example: "databases",
  }),
});

// 搜索结果 schema
const searchResultSchema = z
  .object({
    id: z.string(),
    name: z.string(),
    packageName: z.string(),
    description: z.string(),
    category: z.string(),
    validated: z.boolean(),
    author: z.string(),
    toolCount: z.number(),
    hasTools: z.boolean(),
    popularity: z.number(),
  })
  .openapi("SearchResult");

const searchResponseSchema = BaseResponseSchema.extend({
  data: z
    .object({
      hits: z.array(searchResultSchema),
      query: z.string(),
      processingTimeMs: z.number(),
      limit: z.number(),
      offset: z.number(),
      estimatedTotalHits: z.number(),
    })
    .optional(),
}).openapi("SearchResponse");

/**
 * 搜索路由
 */
const searchRoute = createRoute({
  method: "get",
  path: "/search",
  request: {
    query: searchQuerySchema,
  },
  responses: createRouteResponses(searchResponseSchema, {
    includeErrorResponses: true,
  }),
});

searchRoutes.openapi(searchRoute, searchHandler.search);

// 建议查询参数 schema
const suggestQuerySchema = z.object({
  q: z.string().openapi({
    description: "Suggestion query",
    example: "data",
  }),
  limit: z.coerce.number().min(1).max(20).optional().openapi({
    description: "Limit the number of results",
    example: 10,
  }),
});

// 建议结果 schema
const suggestResultSchema = z
  .object({
    name: z.string(),
    packageName: z.string(),
    category: z.string(),
    highlighted: z.string(),
  })
  .openapi("SuggestResult");

const suggestResponseSchema = BaseResponseSchema.extend({
  data: z
    .object({
      suggestions: z.array(suggestResultSchema),
    })
    .optional(),
}).openapi("SuggestResponse");

/**
 * 搜索建议路由
 */
const suggestRoute = createRoute({
  method: "get",
  path: "/search/suggest",
  request: {
    query: suggestQuerySchema,
  },
  responses: createRouteResponses(suggestResponseSchema, {
    includeErrorResponses: true,
  }),
});

searchRoutes.openapi(suggestRoute, searchHandler.suggest);

// Facets 响应 schema
const facetsResponseSchema = BaseResponseSchema.extend({
  data: z
    .object({
      categories: z.record(z.string(), z.number()).optional(),
      authors: z.record(z.string(), z.number()).optional(),
      validated: z.record(z.string(), z.number()).optional(),
    })
    .optional(),
}).openapi("FacetsResponse");

/**
 * Facets 路由
 */
const facetsRoute = createRoute({
  method: "get",
  path: "/search/facets",
  responses: createRouteResponses(facetsResponseSchema, {
    includeErrorResponses: true,
  }),
});

searchRoutes.openapi(facetsRoute, searchHandler.getFacets);

// 健康检查响应 schema
const healthResponseSchema = BaseResponseSchema.extend({
  data: z
    .object({
      status: z.string(),
      host: z.string(),
      initialized: z.boolean(),
      indexName: z.string(),
      documentCount: z.number(),
    })
    .optional(),
}).openapi("HealthResponse");

/**
 * 健康检查路由
 */
const healthRoute = createRoute({
  method: "get",
  path: "/search/health",
  responses: createRouteResponses(healthResponseSchema, {
    includeErrorResponses: true,
  }),
});

searchRoutes.openapi(healthRoute, searchHandler.healthCheck);

// 管理响应 schema
const managementResponseSchema = BaseResponseSchema.extend({
  data: z
    .object({
      message: z.string(),
      details: z.any().optional(),
    })
    .optional(),
}).openapi("ManagementResponse");

/**
 * 初始化搜索服务路由
 */
const initRoute = createRoute({
  method: "post",
  path: "/search/manage/init",
  responses: createRouteResponses(managementResponseSchema, {
    includeErrorResponses: true,
  }),
});

searchRoutes.openapi(initRoute, searchHandler.initialize);

/**
 * 索引包路由
 */
const indexRoute = createRoute({
  method: "post",
  path: "/search/manage/index",
  responses: createRouteResponses(managementResponseSchema, {
    includeErrorResponses: true,
  }),
});

searchRoutes.openapi(indexRoute, searchHandler.indexPackages);

/**
 * 清空索引路由
 */
const clearRoute = createRoute({
  method: "post",
  path: "/search/manage/clear",
  responses: createRouteResponses(managementResponseSchema, {
    includeErrorResponses: true,
  }),
});

searchRoutes.openapi(clearRoute, searchHandler.clearIndex);

/**
 * 索引统计路由
 */
const statsRoute = createRoute({
  method: "get",
  path: "/search/manage/stats",
  responses: createRouteResponses(managementResponseSchema, {
    includeErrorResponses: true,
  }),
});

searchRoutes.openapi(statsRoute, searchHandler.getStats);
