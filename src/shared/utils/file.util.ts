/**
 * 文件操作工具函数
 */

import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

/**
 * 获取当前文件的目录名
 * @param metaUrl import.meta.url
 * @returns 目录路径
 */
export function getDirname(metaUrl: string): string {
  return dirname(fileURLToPath(metaUrl));
}
