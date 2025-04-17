// This script processes the configuration file located at packages/@toolsdk.ai/registry/config/categories.mjs.
// It ensures that a folder exists for each category defined in the configuration.
// If a folder does not exist, it creates one.
// Additionally, it removes any folders in the categories directory that are not listed in the configuration.
// This script is intended to be executed using Bun.
import * as fs from 'fs';
import * as path from 'path';
import type { CategoryConfig } from '../types';

// Define the paths
// eslint-disable-next-line @typescript-eslint/no-require-imports
const categoriesData = require('../config/categories');

// const categoriesJsonPath = require('../../packages/@toolsdk.ai/registry/config/categories');

const categoriesFolderBasePath = path.resolve('./packages'); // Adjust this path as needed

// Function to ensure directory exists
function ensureDirectoryExists(dirPath: string) {
  if (!fs.existsSync(dirPath)) {
    console.log(`Creating directory: ${dirPath}`);
    fs.mkdirSync(dirPath, { recursive: true });
  }
 

}

// Main function
async function main() {
  // const categoriesData = fs.readFileSync(categoriesJsonPath, 'utf8');
  const categories = categoriesData.default;
  try {
    // Read the categories JSON file

    console.log(`Found ${categories.length} categories in the configuration file.`);

    // Ensure the base categories folder exists
    ensureDirectoryExists(categoriesFolderBasePath);

    // Process each category
    for (const category of categories) {
      const categoryFolderPath = path.join(categoriesFolderBasePath, category.key);
      ensureDirectoryExists(categoryFolderPath);
      console.log(`Ensured category folder exists: ${category.key}`);

       // Write the README.md of the category folder
      const readmePath = path.join(categoryFolderPath, 'README.md');
      fs.writeFileSync(
        readmePath,
        `# ${category.name}\n\n${category.description}\n\n`);
    }

    console.log('All category folders have been verified and created if needed.');
  } catch (error) {
    console.error('Error processing categories:', error);
    process.exit(1);
  }

  // 如果配置里没这个文件夹？删除它！ 请注意，排除config目录和 docs 目录
  // Check for and delete any folders that are not in the categories list
  const existingFolders = fs.readdirSync(categoriesFolderBasePath);
  for (const folder of existingFolders) {
    if (!categories.find((category: CategoryConfig) => category.key === folder)) {
      const folderPath = path.join(categoriesFolderBasePath, folder);
      console.log(`Deleting folder: ${folderPath}`);
      fs.rmdirSync(folderPath, { recursive: true });
    }
  }
}

// Execute the main function
main();
