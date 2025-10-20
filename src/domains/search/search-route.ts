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

searchRoutes.openapi(searchRoute, async (c) => {
  const { q, limit, offset, category } = c.req.valid("query");
  const result = await searchHandler.search({ q, limit, offset, category });
  return c.json(result, 200);
});

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

searchRoutes.openapi(suggestRoute, async (c) => {
  const { q, limit } = c.req.valid("query");
  const result = await searchHandler.suggest(q, limit);
  return c.json(result, 200);
});

const facetsRoute = createRoute({
  method: "get",
  path: "/search/facets",
  responses: createRouteResponses(facetsResponseSchema, {
    includeErrorResponses: true,
  }),
});

searchRoutes.openapi(facetsRoute, async (c) => {
  const result = await searchHandler.getFacets();
  return c.json(result, 200);
});

const healthRoute = createRoute({
  method: "get",
  path: "/search/health",
  responses: createRouteResponses(healthResponseSchema, {
    includeErrorResponses: true,
  }),
});

searchRoutes.openapi(healthRoute, async (c) => {
  const result = await searchHandler.healthCheck();
  return c.json(result, 200);
});

const initRoute = createRoute({
  method: "post",
  path: "/search/manage/init",
  responses: createRouteResponses(managementResponseSchema, {
    includeErrorResponses: true,
  }),
});

searchRoutes.openapi(initRoute, async (c) => {
  const result = await searchHandler.initialize();
  return c.json(result, 200);
});

const indexRoute = createRoute({
  method: "post",
  path: "/search/manage/index",
  responses: createRouteResponses(managementResponseSchema, {
    includeErrorResponses: true,
  }),
});

searchRoutes.openapi(indexRoute, async (c) => {
  const result = await searchHandler.indexPackages();
  return c.json(result, 200);
});

const clearRoute = createRoute({
  method: "post",
  path: "/search/manage/clear",
  responses: createRouteResponses(managementResponseSchema, {
    includeErrorResponses: true,
  }),
});

searchRoutes.openapi(clearRoute, async (c) => {
  const result = await searchHandler.clearIndex();
  return c.json(result, 200);
});

const statsRoute = createRoute({
  method: "get",
  path: "/search/manage/stats",
  responses: createRouteResponses(managementResponseSchema, {
    includeErrorResponses: true,
  }),
});

searchRoutes.openapi(statsRoute, async (c) => {
  const result = await searchHandler.getStats();
  return c.json(result, 200);
});
