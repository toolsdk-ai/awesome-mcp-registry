import path from "node:path";
import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { getDirname } from "../../shared/utils/file-util";
import { createResponse, createRouteResponses } from "../../shared/utils/response-util";
import { configSchemas } from "./config-schema";
import type { CategoryConfig } from "./config-types";

const __dirname = getDirname(import.meta.url);

export const configRoutes = new OpenAPIHono();

const featuredRoute = createRoute({
  method: "get",
  path: "/config/featured",
  responses: createRouteResponses(configSchemas.FeaturedResponseSchema),
});

configRoutes.openapi(featuredRoute, async (c) => {
  const featuredPath = path.join(__dirname, "../../../config/featured.mjs");
  const featuredModule = await import(`file://${featuredPath}`);
  const featured: string[] = featuredModule.default;
  const response = createResponse(featured);
  return c.json(response, 200);
});

const categoriesRoute = createRoute({
  method: "get",
  path: "/config/categories",
  responses: createRouteResponses(configSchemas.CategoriesResponseSchema),
});

configRoutes.openapi(categoriesRoute, async (c) => {
  const categoriesPath = path.join(__dirname, "../../../config/categories.mjs");
  const categoriesModule = await import(`file://${categoriesPath}`);
  const categories: CategoryConfig[] = categoriesModule.default;
  const response = createResponse(categories);
  return c.json(response, 200);
});
