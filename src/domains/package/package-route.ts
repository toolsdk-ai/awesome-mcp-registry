import { createRoute, OpenAPIHono } from "@hono/zod-openapi";
import { createResponse, createRouteResponses } from "../../shared/utils/response-util";
import { getPythonDependencies } from "../../shared/utils/validation-util";
import { packageHandler } from "./package-handler";
import {
  ExecuteToolResponseSchema,
  PackageDetailResponseSchema,
  PackagesListResponseSchema,
  packageNameQuerySchema,
  ToolExecuteSchema,
  ToolsResponseSchema,
} from "./package-schema";
import type { PackagesList } from "./package-types";

export const packageRoutes = new OpenAPIHono();

const packageDetailRoute = createRoute({
  method: "get",
  path: "/packages/detail",
  request: { query: packageNameQuerySchema },
  responses: createRouteResponses(PackageDetailResponseSchema, {
    includeErrorResponses: true,
  }),
});

packageRoutes.openapi(packageDetailRoute, packageHandler.getPackageDetail);

const toolsRoute = createRoute({
  method: "get",
  path: "/packages/tools",
  request: { query: packageNameQuerySchema },
  responses: createRouteResponses(ToolsResponseSchema, {
    includeErrorResponses: true,
  }),
});

packageRoutes.openapi(toolsRoute, packageHandler.listTools);

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
