import { z } from "@hono/zod-openapi";
import { BaseResponseSchema } from "../../shared/schemas/common-schema";

export const searchQuerySchema = z.object({
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

export const searchResultSchema = z
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

export const searchResponseSchema = BaseResponseSchema.extend({
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

export const suggestQuerySchema = z.object({
  q: z.string().openapi({
    description: "Suggestion query",
    example: "data",
  }),
  limit: z.coerce.number().min(1).max(20).optional().openapi({
    description: "Limit the number of results",
    example: 10,
  }),
});

export const suggestResultSchema = z
  .object({
    name: z.string(),
    packageName: z.string(),
    category: z.string(),
    highlighted: z.string(),
  })
  .openapi("SuggestResult");

export const suggestResponseSchema = BaseResponseSchema.extend({
  data: z
    .object({
      suggestions: z.array(suggestResultSchema),
    })
    .optional(),
}).openapi("SuggestResponse");

export const facetsResponseSchema = BaseResponseSchema.extend({
  data: z
    .object({
      categories: z.record(z.string(), z.number()).optional(),
      authors: z.record(z.string(), z.number()).optional(),
      validated: z.record(z.string(), z.number()).optional(),
    })
    .optional(),
}).openapi("FacetsResponse");

export const healthResponseSchema = BaseResponseSchema.extend({
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

export const managementResponseSchema = BaseResponseSchema.extend({
  data: z
    .object({
      message: z.string(),
      details: z.any().optional(),
    })
    .optional(),
}).openapi("ManagementResponse");
