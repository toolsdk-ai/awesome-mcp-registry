import type { z } from "zod";
import type { CategoryConfigSchema } from "../../shared/schemas";

export type CategoryConfig = z.infer<typeof CategoryConfigSchema>;
