import { dirname } from "node:path";
import { fileURLToPath } from "node:url";

export function getDirname(metaUrl: string): string {
  return dirname(fileURLToPath(metaUrl));
}
