/* eslint-disable @typescript-eslint/no-require-imports */
import { packageHandler } from './package-handler';
import type { CategoryConfig, PackagesList, Response } from '../types';
import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';

export const packageRoutes: OpenAPIHono = new OpenAPIHono();

const baseResponseSchema = z.object({
  success: z.boolean(),
  code: z.number(),
  message: z.string(),
});

// const errorResponseSchema = baseResponseSchema.omit({ success: true }).extend({ success: z.literal(false) });

const featuredResponseSchema = baseResponseSchema.extend({
  data: z.array(z.string()).optional(),
});

const categoriesResponseSchema = baseResponseSchema.extend({
  data: z
    .array(
      z.object({
        key: z.string(),
        name: z.string(),
        description: z.string().optional(),
      }),
    )
    .optional(),
});

const packagesListResponseSchema = baseResponseSchema.extend({
  data: z
    .record(
      z.object({
        category: z.string().optional(),
        path: z.string(),
        validated: z.boolean().optional(),
        tools: z
          .record(
            z.object({
              name: z.string().optional(),
              description: z.string().optional(),
            }),
          )
          .optional(),
      }),
    )
    .optional(),
});

const packageDetailQuerySchema = z.object({
  packageName: z.string().optional(),
});

const packageDetailDataSchema = z.object({
  type: z.literal('mcp-server'),
  runtime: z.enum(['node', 'python', 'java', 'go']),
  packageName: z.string(),
  packageVersion: z.string().optional(),
  bin: z.string().optional(),
  binArgs: z.array(z.string()).optional(),
  key: z.string().optional(),
  name: z.string().optional(),
  description: z.string().optional(),
  readme: z.string().optional(),
  url: z.string().optional(),
  license: z.string().optional(),
  logo: z.string().optional(),
  author: z.string().optional(),
  env: z
    .record(
      z.object({
        description: z.string(),
        required: z.boolean(),
      }),
    )
    .optional(),
  tools: z
    .array(
      z.object({
        name: z.string(),
        description: z.string().optional(),
        inputSchema: z
          .object({
            type: z.string(),
            properties: z.record(z.unknown()).optional(),
            required: z.array(z.string()).optional(),
          })
          .optional(),
      }),
    )
    .optional(),
});

const packageDetailResponseSchema = baseResponseSchema.extend({
  data: packageDetailDataSchema.optional(),
});

const toolsQuerySchema = z.object({
  packageName: z.string().optional(),
});

const toolDataSchema = z.object({
  name: z.string(),
  description: z.string().optional(),
  inputSchema: z
    .object({
      type: z.string(),
      properties: z.record(z.unknown()).optional(),
      required: z.array(z.string()).optional(),
    })
    .optional(),
});

const toolsResponseSchema = baseResponseSchema.extend({
  data: z.array(toolDataSchema).optional(),
});

const executeToolRequestSchema = z.object({
  packageName: z.string(),
  toolKey: z.string(),
  inputData: z.record(z.unknown()),
  envs: z.record(z.string()).optional(),
});

const executeToolResponseSchema = baseResponseSchema.extend({
  data: z.unknown().optional(),
});

const featuredRoute = createRoute({
  method: 'get',
  path: '/config/featured',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: featuredResponseSchema,
        },
      },
      description: 'Featured list retrieved successfully',
    },
  },
});

const categoriesRoute = createRoute({
  method: 'get',
  path: '/config/categories',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: categoriesResponseSchema,
        },
      },
      description: 'Categories retrieved successfully',
    },
  },
});

const packagesListRoute = createRoute({
  method: 'get',
  path: '/indexes/packages-list',
  responses: {
    200: {
      content: {
        'application/json': {
          schema: packagesListResponseSchema,
        },
      },
      description: 'Packages list retrieved successfully',
    },
  },
});

const toolsRoute = createRoute({
  method: 'get',
  path: '/packages/tools',
  request: {
    query: toolsQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: toolsResponseSchema,
        },
      },
      description: 'Tools list retrieved successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            code: z.number(),
            message: z.string(),
          }),
        },
      },
      description: 'Missing packageName query parameter',
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            code: z.number(),
            message: z.string(),
          }),
        },
      },
      description: 'Package not found',
    },
  },
});

const packageDetailRoute = createRoute({
  method: 'get',
  path: '/packages/detail',
  request: {
    query: packageDetailQuerySchema,
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: packageDetailResponseSchema,
        },
      },
      description: 'Package detail retrieved successfully',
    },
    400: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            code: z.number(),
            message: z.string(),
          }),
        },
      },
      description: 'Missing packageName query parameter',
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            code: z.number(),
            message: z.string(),
          }),
        },
      },
      description: 'Package not found',
    },
  },
});

const executeToolRoute = createRoute({
  method: 'post',
  path: '/packages/run',
  request: {
    body: {
      content: {
        'application/json': {
          schema: executeToolRequestSchema,
        },
      },
      required: true,
    },
  },
  responses: {
    200: {
      content: {
        'application/json': {
          schema: executeToolResponseSchema,
        },
      },
      description: 'Tool executed successfully',
    },
    404: {
      content: {
        'application/json': {
          schema: z.object({
            success: z.boolean(),
            code: z.number(),
            message: z.string(),
          }),
        },
      },
      description: 'Package or tool not found',
    },
  },
});

packageRoutes.openapi(featuredRoute, (c) => {
  const featured: string[] = require('../../config/featured.mjs').default;
  const response: Response<string[]> = {
    success: true,
    code: 200,
    message: 'Featured list retrieved successfully',
    data: featured,
  };
  return c.json(response);
});

packageRoutes.openapi(categoriesRoute, (c) => {
  const categories: CategoryConfig[] = require('../../config/categories.mjs').default;
  const response: Response<CategoryConfig[]> = {
    success: true,
    code: 200,
    message: 'Categories retrieved successfully',
    data: categories,
  };
  return c.json(response);
});

packageRoutes.openapi(packagesListRoute, async (c) => {
  const packagesList: PackagesList = (await import('../../indexes/packages-list.json')).default;
  const response: Response<PackagesList> = {
    success: true,
    code: 200,
    message: 'Packages list retrieved successfully',
    data: packagesList,
  };
  return c.json(response);
});

packageRoutes.openapi(packageDetailRoute, packageHandler.getPackageDetail);

packageRoutes.openapi(toolsRoute, packageHandler.listTools);

packageRoutes.openapi(executeToolRoute, packageHandler.executeTool);
