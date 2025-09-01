// This script is used to generate README.md
// 1. First, read the category configuration file (config/categories.mjs) to read the categories
// 2. Iterate through the categories, then recursively read the specified directory (all JSON files under packages/{categoryName}), and validate with zod MCPServerConfigSchema.parse
// 3. Start with let README: string, README += the content of all MCP server files under the category
// 4. Read README template(docs/README.tpl.md). Write to the README file (README.md)
import { readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import _ from "lodash";
import categoriesList from "../indexes/categories-list.json";
import allPackagesList from "../indexes/packages-list.json";
import { MCPServerPackageConfigSchema } from "../src/schema";
import type { PackagesList } from "../src/types";
import { getDirname } from "../src/utils";

const __dirname = getDirname(import.meta.url);

let TOC = "";
let README = "";
const COUNT = Object.keys(allPackagesList).length;
const VALIDATED_COUNT = Object.values(allPackagesList as PackagesList).filter(
  (pkg) => pkg.validated,
).length;

for (const [_key, categoryList] of Object.entries(categoriesList)) {
  const packagesList = categoryList.packagesList;

  if (!packagesList || packagesList.length === 0) continue;

  TOC += `  - [${categoryList.config.name}](#${categoryList.config.key})\n`;

  README += `\n\n<a id="${categoryList.config.key}"></a>\n## ${categoryList.config.name}\n`;
  README += `\n${categoryList.config.description}\n\n`;

  for (const packageKey of packagesList) {
    const packageInfo = allPackagesList[packageKey];

    const filePath = join(__dirname, `../packages/`, packageInfo.path);
    const fileContent = readFileSync(filePath, "utf-8");
    const parsedContent = MCPServerPackageConfigSchema.parse(JSON.parse(fileContent));
    const validated = packageInfo.validated ? "✅" : "❌";
    const toolsCount = packageInfo.tools === undefined ? 0 : Object.keys(packageInfo.tools).length;
    const toolsCountLabel = toolsCount > 0 ? ` (${toolsCount} tools)` : "";
    README += `- [${validated} ${parsedContent.key || parsedContent.packageName}](${parsedContent.url || "#"}): ${parsedContent.description} ${toolsCountLabel} (${parsedContent.runtime}) \n`;
  }
}
const templatePath = join(__dirname, "../docs/README.tpl.md");
const templateContent = readFileSync(templatePath, "utf-8");
const compiled = _.template(templateContent);
const finalREADME = compiled({ CONTENT: README, TOC, COUNT, VALIDATED_COUNT });

writeFileSync(join(__dirname, "../README.md"), finalREADME, "utf-8");

console.log("README.md has been generated successfully.");
