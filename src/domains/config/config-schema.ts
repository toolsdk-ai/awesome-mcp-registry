import { z } from "@hono/zod-openapi";
import { BaseResponseSchema, CategoryConfigSchema } from "../../shared/schemas/common-schema";

export const configSchemas = {
  FeaturedResponseSchema: BaseResponseSchema.extend({
    data: z.array(z.string()).optional(),
  }).openapi("FeaturedResponse"),

  CategoriesResponseSchema: BaseResponseSchema.extend({
    data: z.array(CategoryConfigSchema).optional(),
  }).openapi("CategoriesResponse"),
};
