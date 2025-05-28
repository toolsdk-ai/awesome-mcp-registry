// This script generates two JSON files: packages-list.json and categories-list.json, which serve as collections for package and category data.
// It reads category configurations from a predefined file and iterates through each category.
// For each category, it recursively scans the corresponding directory for JSON files, validates them using the MCPServerPackageConfigSchema, and adds them to the packages list.
// It also associates the packages with their respective categories and ensures no duplicate keys exist.
// Finally, it writes the generated data to the specified output files in the collections directory.

import * as fs from 'fs';
import * as path from 'path';
import { MCPServerPackageConfigSchema, } from '../src/schema';
import { type CategoryConfig , type MCPServerPackageConfig, type PackagesList} from '../src/types';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const categoryConfigs: CategoryConfig[] = require('../config/categories').default;

const packagesDir = './packages';
const packagesListFile = './indexes/packages-list.json';
const categoriesListFile = './indexes/categories-list.json';
const packageJsonFile = './package.json';

async function generatePackagesList() {
  const packagesList: PackagesList = {};
  const categoriesList: Record<string, { config: CategoryConfig; packagesList: string[] }> = {};
  const packageDeps: Record<string, string> = {}

  function traverseDirectory(directory: string, categoryName: string) {
    const entries = fs.readdirSync(directory);

    for (const entry of entries) {
      const entryPath = path.join(directory, entry);
      if (fs.statSync(entryPath).isFile() && entry.endsWith('.json')) {
        const fileContent = fs.readFileSync(entryPath, 'utf-8');
        const parsedContent: MCPServerPackageConfig= MCPServerPackageConfigSchema.parse(JSON.parse(fileContent));
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

        if (parsedContent.runtime === 'node') {
          packageDeps[parsedContent.packageName] = parsedContent.packageVersion || 'latest';
        }
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

  fs.writeFileSync(packagesListFile, JSON.stringify(packagesList, null, 2), 'utf-8');
  fs.writeFileSync(categoriesListFile, JSON.stringify(categoriesList, null, 2), 'utf-8');
  console.log(`Generated packages list at ${packagesListFile}`);
  console.log(`Generated categories list at ${categoriesListFile}`);



  const packageJSONStr = fs.readFileSync(packageJsonFile, 'utf-8');
  const newDeps = {
    "@modelcontextprotocol/sdk": "^1.12.0",
    "lodash": "^4.17.21",
    "zod": "^3.23.30",
  };
  const packageJSON = JSON.parse(packageJSONStr);
  for (const [depName, depVer] of Object.entries(packageDeps)) {
    newDeps[depName] = packageDeps[depVer] || 'latest';
  }

  packageJSON.dependencies = newDeps

  fs.writeFileSync(packageJsonFile, JSON.stringify(packageJSON, null, 2), 'utf-8');

  console.log(`Generated new package.json file at ${packageJsonFile}`, packageJSON);
}

generatePackagesList();
