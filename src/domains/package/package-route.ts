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

packageRoutes.openapi(packageDetailRoute, async (c) => {
  const { packageName, sandboxProvider } = c.req.valid("query");
  const result = await packageHandler.getPackageDetail(
    packageName,
    sandboxProvider as "LOCAL" | "DAYTONA" | "SANDOCK" | "E2B" | undefined,
  );
  return c.json(result, 200);
});

const toolsRoute = createRoute({
  method: "get",
  path: "/packages/tools",
  request: { query: packageNameQuerySchema },
  responses: createRouteResponses(ToolsResponseSchema, {
    includeErrorResponses: true,
  }),
});

packageRoutes.openapi(toolsRoute, async (c) => {
  const { packageName, sandboxProvider } = c.req.valid("query");
  const result = await packageHandler.listTools(
    packageName,
    sandboxProvider as "LOCAL" | "DAYTONA" | "SANDOCK" | "E2B" | undefined,
  );
  return c.json(result, 200);
});

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

packageRoutes.openapi(executeToolRoute, async (c) => {
  const body = c.req.valid("json");
  const result = await packageHandler.executeTool(
    body.packageName,
    body.toolKey,
    body.inputData,
    body.envs,
    body.sandboxProvider as "LOCAL" | "DAYTONA" | "SANDOCK" | "E2B" | undefined,
  );
  return c.json(result, 200);
});

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
