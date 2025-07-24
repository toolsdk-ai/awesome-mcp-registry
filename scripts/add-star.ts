import * as fs from 'fs';
import * as path from 'path';
import axios from 'axios';
import type { PackagesList } from '../src/types';
import { PackagesListSchema } from '../src/schema';

const packagesDir = './packages';
const packagesListFile = './indexes/packages-list.json';

interface GitHubApiResponse {
  stargazers_count: number;
}

async function getGitHubStars(url: string, token?: string): Promise<number> {
  const match = url.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) {
    throw new Error(`Invalid GitHub URL: ${url}`);
  }

  const [, owner, repo] = match;
  const apiUrl = `https://api.github.com/repos/${owner}/${repo}`;

  try {
    const response = await axios.get<GitHubApiResponse>(apiUrl, {
      headers: token ? { Authorization: `Bearer ${token}` } : {},
      timeout: 5000,
    });

    return response.data.stargazers_count;
  } catch (error) {
    console.error(`Failed to fetch stars for ${url}:`, (error as Error).message);
    return -1;
  }
}

async function addStar(token?: string, forceUpdate = false): Promise<void> {
  const packagesList: PackagesList = PackagesListSchema.parse(JSON.parse(fs.readFileSync(packagesListFile, 'utf-8')));

  async function processJsonFile(filePath: string): Promise<void> {
    try {
      const content = JSON.parse(fs.readFileSync(filePath, 'utf-8'));

      if (!content.url || !content.url.includes('github.com')) {
        return;
      }

      // 检查是否已有 stars 且不需要强制更新
      if (content.stars !== undefined && !forceUpdate) {
        console.log(`Skipping ${filePath}, stars already exists`);
        return;
      }

      const stars = await getGitHubStars(content.url, token);
      if (stars === -1) {
        return;
      }

      // 更新原始文件
      content.stars = stars;
      fs.writeFileSync(filePath, JSON.stringify(content, null, 2));

      if (content.packageName && packagesList[content.packageName]) {
        packagesList[content.packageName].stars = stars;
        console.log(`Updated stars in packagesList for ${content.packageName}: ${stars}`);
      }

      console.log(`Updated stars for ${filePath}: ${stars}`);
    } catch (error) {
      console.error(`Error processing ${filePath}:`, (error as Error).message);
    }
  }

  async function traverseDirectory(directory: string) {
    const entries = fs.readdirSync(directory);

    for (const entry of entries) {
      const entryPath = path.join(directory, entry);
      if (fs.statSync(entryPath).isFile() && entry.endsWith('.json')) {
        await processJsonFile(entryPath);
      } else if (fs.statSync(entryPath).isDirectory()) {
        await traverseDirectory(entryPath);
      }
    }
  }

  await traverseDirectory(packagesDir);

  // 保存更新后的 packages-list.json
  fs.writeFileSync(packagesListFile, JSON.stringify(packagesList, null, 2));
}

/**
 * Main function
 * # 基本使用
 * GITHUB_TOKEN=your_token node scripts/add-star.js
 *
 * # 强制更新所有 star 数据
 * GITHUB_TOKEN=your_token node scripts/add-star.js --force
 */
async function main() {
  const token = process.env.GITHUB_TOKEN || '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';
  const forceUpdate = process.argv.includes('--force');

  if (!token) {
    console.warn('Warning: GITHUB_TOKEN not provided. API rate limits may apply.');
  }

  await addStar(token, forceUpdate);
}

// Execute the main function
main().catch((error) => {
  console.error('Error:', error);
  process.exit(1);
});
