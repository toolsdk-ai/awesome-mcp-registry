/* eslint-disable @typescript-eslint/no-require-imports */
import { packageHandler } from './package-handler';
import type { CategoryConfig, PackagesList } from '../types';
import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import {
  FeaturedResponseSchema,
  CategoriesResponseSchema,
  PackagesListResponseSchema,
  PackageDetailResponseSchema,
  ToolsResponseSchema,
  ToolExecuteSchema,
  ExecuteToolResponseSchema,
  packageNameQuerySchema,
} from '../schema';
import { createResponse, createRouteResponses } from '../utils';

export const packageRoutes: OpenAPIHono = new OpenAPIHono();

const featuredRoute = createRoute({
  method: 'get',
  path: '/config/featured',
  responses: createRouteResponses(FeaturedResponseSchema),
});

packageRoutes.openapi(featuredRoute, (c) => {
  const featured: string[] = require('../../config/featured.mjs').default;
  const response = createResponse(featured);
  return c.json(response, 200);
});

const categoriesRoute = createRoute({
  method: 'get',
  path: '/config/categories',
  responses: createRouteResponses(CategoriesResponseSchema),
});

packageRoutes.openapi(categoriesRoute, (c) => {
  const categories: CategoryConfig[] = require('../../config/categories.mjs').default;
  const response = createResponse(categories);
  return c.json(response, 200);
});

const packagesListRoute = createRoute({
  method: 'get',
  path: '/indexes/packages-list',
  responses: createRouteResponses(PackagesListResponseSchema),
});

packageRoutes.openapi(packagesListRoute, async (c) => {
  const packagesList: PackagesList = (await import('../../indexes/packages-list.json')).default;
  const response = createResponse(packagesList);
  return c.json(response, 200);
});

const packageDetailRoute = createRoute({
  method: 'get',
  path: '/packages/detail',
  request: { query: packageNameQuerySchema },
  responses: createRouteResponses(PackageDetailResponseSchema, {
    includeErrorResponses: true,
  }),
});

packageRoutes.openapi(packageDetailRoute, packageHandler.getPackageDetail);

const toolsRoute = createRoute({
  method: 'get',
  path: '/packages/tools',
  request: { query: packageNameQuerySchema },
  responses: createRouteResponses(ToolsResponseSchema, {
    includeErrorResponses: true,
  }),
});

packageRoutes.openapi(toolsRoute, packageHandler.listTools);

const executeToolRoute = createRoute({
  method: 'post',
  path: '/packages/run',
  request: {
    body: {
      content: {
        'application/json': {
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
