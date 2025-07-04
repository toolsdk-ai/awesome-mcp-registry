// This script generates two JSON files: packages-list.json and categories-list.json, which serve as collections for package and category data.
// It reads category configurations from a predefined file and iterates through each category.
// For each category, it recursively scans the corresponding directory for JSON files, validates them using the MCPServerPackageConfigSchema, and adds them to the packages list.
// It also associates the packages with their respective categories and ensures no duplicate keys exist.
// Finally, it writes the generated data to the specified output files in the collections directory.

import * as fs from 'fs';
import * as path from 'path';
import { MCPServerPackageConfigSchema, PackagesListSchema } from '../src/schema';
import { type CategoryConfig, type MCPServerPackageConfig, type PackagesList } from '../src/types';
import { isValidNpmPackage, getActualVersion, updatePackageJsonDependencies } from '../src/helper';

// eslint-disable-next-line @typescript-eslint/no-require-imports
const categoryConfigs: CategoryConfig[] = require('../config/categories').default;

const packagesDir = './packages';
const packagesListFile = './indexes/packages-list.json';
// Read the current packages list from the json file
const previousPackagesList: PackagesList = PackagesListSchema.parse(
  JSON.parse(fs.readFileSync(packagesListFile, 'utf-8')),
) as PackagesList;

const categoriesListFile = './indexes/categories-list.json';
// Compare check `newPackagesList` with `previousPackagesList`, print the differences
function comparePackagesLists(previousPackagesList: PackagesList, newPackagesList: PackagesList) {
  const currentKeys = new Set(Object.keys(previousPackagesList));
  const newKeys = new Set(Object.keys(newPackagesList));

  const addedKeys = [...newKeys].filter((key) => !currentKeys.has(key));
  const removedKeys = [...currentKeys].filter((key) => !newKeys.has(key));
  const commonKeys = [...newKeys].filter((key) => currentKeys.has(key));

  if (addedKeys.length > 0) {
    console.log(`Added packages (${addedKeys.length}):`, addedKeys);
  }

  if (removedKeys.length > 0) {
    console.log(`Removed packages (${removedKeys.length}):`, removedKeys);
  }

  const modifiedKeys = commonKeys.filter((key) => {
    const current = previousPackagesList[key];
    const updated = newPackagesList[key];
    return JSON.stringify(current) !== JSON.stringify(updated);
  });

  if (modifiedKeys.length > 0) {
    console.log(`Modified packages (${modifiedKeys.length}):`, modifiedKeys);
  }

  if (addedKeys.length === 0 && removedKeys.length === 0 && modifiedKeys.length === 0) {
    console.log('No changes detected in packages list.');
  }
}

async function generatePackagesList() {
  const newPackagesList: PackagesList = JSON.parse(JSON.stringify(previousPackagesList));
  const newPackagesKeys = new Set();
  const categoriesList: Record<string, { config: CategoryConfig; packagesList: string[] }> = {};
  const packageDeps: Record<string, string> = {};

  async function traverseDirectory(directory: string, categoryName: string) {
    const entries = fs.readdirSync(directory);

    for (const entry of entries) {
      const entryPath = path.join(directory, entry);
      if (fs.statSync(entryPath).isFile() && entry.endsWith('.json')) {
        const fileContent = fs.readFileSync(entryPath, 'utf-8');
        const parsedContent: MCPServerPackageConfig = MCPServerPackageConfigSchema.parse(JSON.parse(fileContent));
        const key = parsedContent.key || parsedContent.packageName;
        const relativePath = path.relative(packagesDir, entryPath);
        newPackagesList[key] = {
          ...newPackagesList[key],
          path: relativePath,
          category: categoryName,
        };

        newPackagesKeys.add(key);

        // Add to the category's packages list
        if (!categoriesList[categoryName]) {
          throw new Error(`Category "${categoryName}" not found in categories list.`);
        }
        categoriesList[categoryName].packagesList.push(key);

        if (parsedContent.runtime === 'node') {
          const isValid = await isValidNpmPackage(parsedContent.packageName);
          if (isValid) {
            const version = getActualVersion(parsedContent.packageName, parsedContent.packageVersion);
            packageDeps[parsedContent.packageName] = version || 'latest';
          }
        }
      } else if (fs.statSync(entryPath).isDirectory()) {
        await traverseDirectory(entryPath, categoryName);
      }
    }
  }

  // const categoryConfigs: CategoryConfig[] = (await import(categoryCfg)).default;

  for (const category of categoryConfigs) {
    categoriesList[category.key] = { config: category, packagesList: [] };

    const categoryDir = path.join(packagesDir, category.key);
    if (fs.existsSync(categoryDir)) {
      await traverseDirectory(categoryDir, category.key);
    }
  }

  // delete packages that are not in the new packages list, base on `newPackagesKeys`
  for (const key in newPackagesList) {
    if (!newPackagesKeys.has(key)) {
      delete newPackagesList[key];
      console.log(`Removed redundant package: ${key}, not exist anymore`);
    }
  }

  fs.writeFileSync(packagesListFile, JSON.stringify(newPackagesList, null, 2), 'utf-8');
  fs.writeFileSync(categoriesListFile, JSON.stringify(categoriesList, null, 2), 'utf-8');
  console.log(`Generated packages list at ${packagesListFile}`);
  console.log(`Generated categories list at ${categoriesListFile}`);

  // compare previous and new packages lists
  comparePackagesLists(previousPackagesList, newPackagesList);

  // Write package.json dependencies
  updatePackageJsonDependencies({ packageDeps });
}

await generatePackagesList();
process.exit(0);
