import path from "node:path";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { CategoriesResponseSchema, FeaturedResponseSchema } from "../../schema";
import type { CategoryConfig } from "../../types";
import { createResponse, createRouteResponses, getDirname } from "../../utils";

const __dirname = getDirname(import.meta.url);

export const configRoutes: OpenAPIHono = new OpenAPIHono();

/**
 * Featured 配置路由
 */
const featuredRoute = createRoute({
  method: "get",
  path: "/config/featured",
  responses: createRouteResponses(FeaturedResponseSchema),
});

configRoutes.openapi(featuredRoute, async (c) => {
  const featuredPath = path.join(__dirname, "../../../config/featured.mjs");
  const featuredModule = await import(`file://${featuredPath}`);
  const featured: string[] = featuredModule.default;
  const response = createResponse(featured);
  return c.json(response, 200);
});

/**
 * Categories 配置路由
 */
const categoriesRoute = createRoute({
  method: "get",
  path: "/config/categories",
  responses: createRouteResponses(CategoriesResponseSchema),
});

configRoutes.openapi(categoriesRoute, async (c) => {
  const categoriesPath = path.join(__dirname, "../../../config/categories.mjs");
  const categoriesModule = await import(`file://${categoriesPath}`);
  const categories: CategoryConfig[] = categoriesModule.default;
  const response = createResponse(categories);
  return c.json(response, 200);
});
