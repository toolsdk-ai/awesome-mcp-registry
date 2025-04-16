/* eslint-disable import/extensions */
// This script is used to generate README.md
// 1. First, read the category configuration file (config/categories.mjs) to read the categories
// 2. Iterate through the categories, then recursively read the specified directory (all JSON files under packages/{categoryName}), and validate with zod MCPServerConfigSchema.parse
// 3. Start with let README: string, README += the content of all MCP server files under the category
// 4. Read README template(docs/README.tpl.md). Write to the README file (README.md)
import { readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import _ from 'lodash';
import categoriesList from '../indexes/categories-list.json';
import allPackagesList from '../indexes/packages-list.json';
import { MCPServerPackageConfigSchema } from '../types';

let TOC = '';
let README = '';
const COUNT = Object.keys(allPackagesList).length;

for (const [_key, categoryList] of Object.entries(categoriesList)) {
  const packagesList = categoryList.packagesList;

  if (!packagesList || packagesList.length === 0) continue;

  TOC += `  - [${categoryList.config.name}](#${categoryList.config.key})\n`;

  README += `\n\n<a id="${categoryList.config.key}"></a>\n## ${categoryList.config.name}\n`;
  README += `\n${categoryList.config.description}\n\n`;

  for (const packageKey of packagesList) {
    const packageInfo = allPackagesList[packageKey];

    const filePath = join(__dirname, `../packages/`, packageInfo.path);
    const fileContent = readFileSync(filePath, 'utf-8');
    const parsedContent = MCPServerPackageConfigSchema.parse(JSON.parse(fileContent));
    README += `- [${parsedContent.name}](${parsedContent.url || '#'}): ${parsedContent.description}\n`;
  }
}
const templatePath = join(__dirname, '../docs/README.tpl.md');
const templateContent = readFileSync(templatePath, 'utf-8');
const compiled = _.template(templateContent);
const finalREADME = compiled({ CONTENT: README, TOC, COUNT });

writeFileSync(join(__dirname, '../README.md'), finalREADME, 'utf-8');

console.log('README.md has been generated successfully.');
