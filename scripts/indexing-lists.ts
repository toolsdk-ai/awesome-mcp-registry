// This script generates two JSON files: packages-list.json and categories-list.json, which serve as collections for package and category data.
// It reads category configurations from a predefined file and iterates through each category.
// For each category, it recursively scans the corresponding directory for JSON files, validates them using the MCPServerPackageConfigSchema, and adds them to the packages list.
// It also associates the packages with their respective categories and ensures no duplicate keys exist.
// Finally, it writes the generated data to the specified output files in the collections directory.

import * as fs from 'fs';
import * as path from 'path';
import { MCPServerPackageConfigSchema, } from '../schema';
import { type CategoryConfig } from '../types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const categoryConfigs: CategoryConfig[] = require('../config/categories').default;

const packagesDir = './packages';
const pacakgesListFile = './indexes/packages-list.json';
const categoriesListFile = './indexes/categories-list.json';

async function generatePackagesList() {
  const packagesList: Record<string, { path: string }> = {};
  const categoriesList: Record<string, { config: CategoryConfig; packagesList: string[] }> = {};

  function traverseDirectory(directory: string, categoryName: string) {
    const entries = fs.readdirSync(directory);

    for (const entry of entries) {
      const entryPath = path.join(directory, entry);
      if (fs.statSync(entryPath).isFile() && entry.endsWith('.json')) {
        const fileContent = fs.readFileSync(entryPath, 'utf-8');
        const parsedContent = MCPServerPackageConfigSchema.parse(JSON.parse(fileContent));
        // if (parsedContent.name) {
          const key = parsedContent.key || parsedContent.name || parsedContent.packageName;
          if (key in packagesList) {
            throw new Error(`Duplicate key detected: "${key}" in file "${entryPath}"`);
          }
          const relativePath = path.relative(packagesDir, entryPath);
          packagesList[key] = { path: relativePath };

          // Add to the category's packages list
          if (!categoriesList[categoryName]) {
            throw new Error(`Category "${categoryName}" not found in categories list.`);
          }
          categoriesList[categoryName].packagesList.push(key);
        // }
      } else if (fs.statSync(entryPath).isDirectory()) {
        traverseDirectory(entryPath, categoryName);
      }
    }
  }

  // const categoryConfigs: CategoryConfig[] = (await import(categoryCfg)).default;

  for (const category of categoryConfigs) {
    categoriesList[category.key] = { config: category, packagesList: [] };

    const categoryDir = path.join(packagesDir, category.key);
    if (fs.existsSync(categoryDir)) {
      traverseDirectory(categoryDir, category.key);
    }
  }

  fs.writeFileSync(pacakgesListFile, JSON.stringify(packagesList, null, 2), 'utf-8');
  fs.writeFileSync(categoriesListFile, JSON.stringify(categoriesList, null, 2), 'utf-8');
  console.log(`Generated packages list at ${pacakgesListFile}`);
  console.log(`Generated categories list at ${categoriesListFile}`);
}

generatePackagesList();
