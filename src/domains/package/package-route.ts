import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { getPythonDependencies } from "../../helper";
import type { PackagesList } from "../../shared/types";
import { createResponse, createRouteResponses } from "../../shared/utils/response-util";
import { packageHandler } from "./package-handler";
import {
  ExecuteToolResponseSchema,
  PackageDetailResponseSchema,
  PackagesListResponseSchema,
  packageNameQuerySchema,
  ToolExecuteSchema,
  ToolsResponseSchema,
} from "./package-schema";

export const packageRoutes = new OpenAPIHono();

/**
 * 包详情路由
 */
const packageDetailRoute = createRoute({
  method: "get",
  path: "/packages/detail",
  request: { query: packageNameQuerySchema },
  responses: createRouteResponses(PackageDetailResponseSchema, {
    includeErrorResponses: true,
  }),
});

packageRoutes.openapi(packageDetailRoute, packageHandler.getPackageDetail);

/**
 * 工具列表路由
 */
const toolsRoute = createRoute({
  method: "get",
  path: "/packages/tools",
  request: { query: packageNameQuerySchema },
  responses: createRouteResponses(ToolsResponseSchema, {
    includeErrorResponses: true,
  }),
});

packageRoutes.openapi(toolsRoute, packageHandler.listTools);

/**
 * 执行工具路由
 */
const executeToolRoute = createRoute({
  method: "post",
  path: "/packages/run",
  request: {
    body: {
      content: {
        "application/json": {
          schema: ToolExecuteSchema,
        },
      },
      required: true,
    },
  },
  responses: createRouteResponses(ExecuteToolResponseSchema, {
    includeErrorResponses: true,
  }),
});

packageRoutes.openapi(executeToolRoute, packageHandler.executeTool);

/**
 * 包列表路由
 */
const packagesListRoute = createRoute({
  method: "get",
  path: "/indexes/packages-list",
  responses: createRouteResponses(PackagesListResponseSchema),
});

packageRoutes.openapi(packagesListRoute, async (c) => {
  const packagesList: PackagesList = (await import("../../../indexes/packages-list.json")).default;
  const response = createResponse(packagesList);
  return c.json(response, 200);
});

/**
 * Python 依赖路由
 */
const pythonTomlRoute = createRoute({
  method: "get",
  path: "/python-mcp/pyproject",
  responses: createRouteResponses(PackagesListResponseSchema),
});

packageRoutes.openapi(pythonTomlRoute, async (c) => {
  const pythonDependencies = getPythonDependencies();
  const response = createResponse(pythonDependencies);
  return c.json(response, 200);
});
