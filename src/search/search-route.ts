import { createRoute, OpenAPIHono, z } from "@hono/zod-openapi";
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

// Define search response schema
const searchResponseSchema = z
  .object({
    success: z.boolean(),
    code: z.number(),
    message: z.string(),
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
  })
  .openapi("SearchResponse");

// Search route definition
const searchRoute = createRoute({
  method: "get",
  path: "/search",
  request: {
    query: searchQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: searchResponseSchema,
        },
      },
      description: "Search successful",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            code: z.number(),
            message: z.string(),
          }),
        },
      },
      description: "Bad request",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            code: z.number(),
            message: z.string(),
          }),
        },
      },
      description: "Internal server error",
    },
  },
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

    return c.json({
      success: true,
      code: 200,
      message: "Search successful",
      data: results,
    });
  } catch (error) {
    console.error("Search failed:", error);
    return c.json(
      {
        success: false,
        code: 500,
        message: (error as Error).message || "Search failed",
      },
      500,
    );
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

// Define suggest response schema
const suggestResponseSchema = z
  .object({
    success: z.boolean(),
    code: z.number(),
    message: z.string(),
    data: z
      .object({
        suggestions: z.array(suggestResultSchema),
      })
      .optional(),
  })
  .openapi("SuggestResponse");

// Search suggest route definition
const suggestRoute = createRoute({
  method: "get",
  path: "/search/suggest",
  request: {
    query: suggestQuerySchema,
  },
  responses: {
    200: {
      content: {
        "application/json": {
          schema: suggestResponseSchema,
        },
      },
      description: "Suggestions retrieved successfully",
    },
    400: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            code: z.number(),
            message: z.string(),
          }),
        },
      },
      description: "Bad request",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            code: z.number(),
            message: z.string(),
          }),
        },
      },
      description: "Internal server error",
    },
  },
});

searchRoutes.openapi(suggestRoute, async (c) => {
  try {
    const { q, limit } = c.req.valid("query");

    // Get search suggestions
    const suggestions = await searchService.suggest(q, limit);

    return c.json(
      {
        success: true,
        code: 200,
        message: "Suggestions retrieved successfully",
        data: {
          suggestions,
        },
      },
      200,
    );
  } catch (error) {
    console.error("Failed to get suggestions:", error);
    return c.json(
      {
        success: false,
        code: 400,
        message: (error as Error).message || "Failed to get suggestions",
      },
      400,
    );
  }
});

// Define facets response schema
const facetsResponseSchema = z
  .object({
    success: z.boolean(),
    code: z.number(),
    message: z.string(),
    data: z
      .object({
        categories: z.record(z.string(), z.number()).optional(),
        authors: z.record(z.string(), z.number()).optional(),
        validated: z.record(z.string(), z.number()).optional(),
      })
      .optional(),
  })
  .openapi("FacetsResponse");

// Facets route definition
const facetsRoute = createRoute({
  method: "get",
  path: "/search/facets",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: facetsResponseSchema,
        },
      },
      description: "Facets retrieved successfully",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            code: z.number(),
            message: z.string(),
          }),
        },
      },
      description: "Internal server error",
    },
  },
});

searchRoutes.openapi(facetsRoute, async (c) => {
  try {
    // Get facets information
    const facets = await searchService.getFacets();

    return c.json({
      success: true,
      code: 200,
      message: "Facets retrieved successfully",
      data: {
        categories: facets?.category,
        authors: facets?.author,
        validated: facets?.validated,
      },
    });
  } catch (error) {
    console.error("Failed to get facets:", error);
    return c.json(
      {
        success: false,
        code: 500,
        message: (error as Error).message || "Failed to get facets",
      },
      500,
    );
  }
});

// Define health check response schema
const healthResponseSchema = z
  .object({
    success: z.boolean(),
    code: z.number(),
    message: z.string(),
    data: z
      .object({
        status: z.string(),
        host: z.string(),
        initialized: z.boolean(),
        indexName: z.string(),
        documentCount: z.number(),
      })
      .optional(),
  })
  .openapi("HealthResponse");

// Health check route definition
const healthRoute = createRoute({
  method: "get",
  path: "/search/health",
  responses: {
    200: {
      content: {
        "application/json": {
          schema: healthResponseSchema,
        },
      },
      description: "Health check successful",
    },
    500: {
      content: {
        "application/json": {
          schema: z.object({
            success: z.boolean(),
            code: z.number(),
            message: z.string(),
          }),
        },
      },
      description: "Internal server error",
    },
  },
});

searchRoutes.openapi(healthRoute, async (c) => {
  try {
    // Perform health check
    const health = await searchService.healthCheck();

    return c.json(
      {
        success: true,
        code: 200,
        message: "Health check successful",
        data: health,
      },
      200,
    );
  } catch (error) {
    console.error("Health check failed:", error);
    return c.json(
      {
        success: false,
        code: 500,
        message: (error as Error).message || "Health check failed",
      },
      500,
    );
  }
});

export { searchRoutes };
