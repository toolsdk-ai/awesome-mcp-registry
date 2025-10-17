import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { createRouteResponses } from "../../shared/utils/response-util";
import { searchHandler } from "./search-handler";
import {
  facetsResponseSchema,
  healthResponseSchema,
  managementResponseSchema,
  searchQuerySchema,
  searchResponseSchema,
  suggestQuerySchema,
  suggestResponseSchema,
} from "./search-schema";

export const searchRoutes = new OpenAPIHono();

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
