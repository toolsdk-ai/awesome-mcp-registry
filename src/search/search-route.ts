import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
import { BaseResponseSchema } from "../schema";
import { createErrorResponse, createResponse, createRouteResponses } from "../utils";
import searchService from "./search-service";

const searchRoutes = new OpenAPIHono();

// Define search query parameter schema
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

// Define search result response schema
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

// Search route definition
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
  try {
    const { q, limit, offset, category } = c.req.valid("query");

    // Build filter condition
    const filter = category ? `category = '${category}'` : undefined;

    // Execute search
    const results = await searchService.search(q, {
      limit,
      offset,
      filter,
    });

    const response = createResponse(results);
    return c.json(response, 200);
  } catch (error) {
    console.error("Search failed:", (error as Error).stack);
    const errorResponse = createErrorResponse((error as Error).message || "Search failed", 500);
    return c.json(errorResponse, 500);
  }
});

// Define suggest query parameter schema
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

// Define suggest result response schema
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

// Search suggest route definition
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
  try {
    const { q, limit } = c.req.valid("query");

    const suggestions = await searchService.suggest(q, limit);

    const response = createResponse({ suggestions });
    return c.json(response, 200);
  } catch (error) {
    console.error("Failed to get suggestions:", (error as Error).stack);
    const errorResponse = createErrorResponse(
      (error as Error).message || "Failed to get suggestions",
    );
    return c.json(errorResponse, 400);
  }
});

// Define facets response schema
const facetsResponseSchema = BaseResponseSchema.extend({
  data: z
    .object({
      categories: z.record(z.string(), z.number()).optional(),
      authors: z.record(z.string(), z.number()).optional(),
      validated: z.record(z.string(), z.number()).optional(),
    })
    .optional(),
}).openapi("FacetsResponse");

// Facets route definition
const facetsRoute = createRoute({
  method: "get",
  path: "/search/facets",
  responses: createRouteResponses(facetsResponseSchema, {
    includeErrorResponses: true,
  }),
});

searchRoutes.openapi(facetsRoute, async (c) => {
  try {
    // Get facets information
    const facets = await searchService.getFacets();

    const response = createResponse({
      categories: facets?.category,
      authors: facets?.author,
      validated: facets?.validated,
    });
    return c.json(response, 200);
  } catch (error) {
    console.error("Failed to get facets:", (error as Error).stack);
    const errorResponse = createErrorResponse(
      (error as Error).message || "Failed to get facets",
      500,
    );
    return c.json(errorResponse, 500);
  }
});

// Define health check response schema
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

// Health check route definition
const healthRoute = createRoute({
  method: "get",
  path: "/search/health",
  responses: createRouteResponses(healthResponseSchema, {
    includeErrorResponses: true,
  }),
});

searchRoutes.openapi(healthRoute, async (c) => {
  try {
    // Perform health check
    const health = await searchService.healthCheck();

    const response = createResponse(health);
    return c.json(response, 200);
  } catch (error) {
    console.error("Health check failed:", (error as Error).stack);
    const errorResponse = createErrorResponse(
      (error as Error).message || "Health check failed",
      500,
    );
    return c.json(errorResponse, 500);
  }
});

// Define management response schema
const managementResponseSchema = BaseResponseSchema.extend({
  data: z
    .object({
      message: z.string(),
      details: z.any().optional(),
    })
    .optional(),
}).openapi("ManagementResponse");

// Initialize search service route definition
const initRoute = createRoute({
  method: "post",
  path: "/search/manage/init",
  responses: createRouteResponses(managementResponseSchema, {
    includeErrorResponses: true,
  }),
});

searchRoutes.openapi(initRoute, async (c) => {
  try {
    // Initialize search service
    await searchService.initialize();

    const response = createResponse({
      message: "Search service initialized successfully",
    });
    return c.json(response, 200);
  } catch (error) {
    console.error("Failed to initialize search service:", (error as Error).stack);
    const errorResponse = createErrorResponse(
      (error as Error).message || "Failed to initialize search service",
      500,
    );
    return c.json(errorResponse, 500);
  }
});

// Index packages route definition
const indexRoute = createRoute({
  method: "post",
  path: "/search/manage/index",
  responses: createRouteResponses(managementResponseSchema, {
    includeErrorResponses: true,
  }),
});

searchRoutes.openapi(indexRoute, async (c) => {
  try {
    // Index all packages
    const stats = await searchService.indexPackages();

    const response = createResponse({
      message: `Indexed ${stats.numberOfDocuments} documents`,
      details: stats,
    });
    return c.json(response, 200);
  } catch (error) {
    console.error("Failed to index packages:", (error as Error).stack);
    const errorResponse = createErrorResponse(
      (error as Error).message || "Failed to index packages",
      500,
    );
    return c.json(errorResponse, 500);
  }
});

// Clear index route definition
const clearRoute = createRoute({
  method: "post",
  path: "/search/manage/clear",
  responses: createRouteResponses(managementResponseSchema, {
    includeErrorResponses: true,
  }),
});

searchRoutes.openapi(clearRoute, async (c) => {
  try {
    // Clear the index
    await searchService.clearIndex();

    const response = createResponse({
      message: "Index cleared successfully",
    });
    return c.json(response, 200);
  } catch (error) {
    console.error("Failed to clear index:", (error as Error).stack);
    const errorResponse = createErrorResponse(
      (error as Error).message || "Failed to clear index",
      500,
    );
    return c.json(errorResponse, 500);
  }
});

// Get index stats route definition
const statsRoute = createRoute({
  method: "get",
  path: "/search/manage/stats",
  responses: createRouteResponses(managementResponseSchema, {
    includeErrorResponses: true,
  }),
});

searchRoutes.openapi(statsRoute, async (c) => {
  try {
    // Get index statistics
    const stats = await searchService.getStats();

    const response = createResponse({
      message: "Index statistics retrieved successfully",
      details: stats,
    });
    return c.json(response, 200);
  } catch (error) {
    console.error("Failed to get index statistics:", (error as Error).stack);
    const errorResponse = createErrorResponse(
      (error as Error).message || "Failed to get index statistics",
      500,
    );
    return c.json(errorResponse, 500);
  }
});

export { searchRoutes };
