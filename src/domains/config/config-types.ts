/**
 * Config 领域类型定义
 */

import type { z } from "zod";
import type { CategoryConfigSchema } from "../../shared/schemas";

/**
 * 分类配置类型
 */
export type CategoryConfig = z.infer<typeof CategoryConfigSchema>;
