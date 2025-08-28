#!/usr/bin/env node

/**
 * Search Index Management CLI
 * Manages MeiliSearch indexing for the MCP Registry
 */

/* eslint-env node */
/* global process */

import { createRequire } from "node:module";
import searchService from "../api/services/search-service.js";

const require = createRequire(import.meta.url);
const packageJson = require("../package.json");

// CLI Commands
const commands = {
  init: "Initialize search service and create index",
  index: "Index all packages data",
  clear: "Clear the search index",
  stats: "Show index statistics",
  health: "Check search service health",
  help: "Show this help message",
};

function showHelp() {
  console.log(`
🔍 MCP Registry Search Index Manager v${packageJson.version}

Usage: node scripts/search-index.js <command>

Commands:
`);

  Object.entries(commands).forEach(([cmd, desc]) => {
    console.log(`  ${cmd.padEnd(8)} - ${desc}`);
  });

  console.log(`
Environment Variables:
  MEILI_HTTP_ADDR    - MeiliSearch server URL (default: http://localhost:7700)
  MEILI_MASTER_KEY   - MeiliSearch master key (optional for development)

Examples:
  node scripts/search-index.js init     # Initialize search service
  node scripts/search-index.js index    # Index all packages
  node scripts/search-index.js stats    # Show statistics
`);
}

async function runCommand(command) {
  const start = Date.now();

  try {
    switch (command) {
      case "init": {
        console.log("🔄 Initializing search service...");
        await searchService.initialize();
        console.log(`✅ Search service initialized in ${Date.now() - start}ms`);
        break;
      }
      case "index": {
        console.log("🔄 Initializing search service...");
        await searchService.initialize();
        console.log("📥 Starting indexing process...");
        const stats = await searchService.indexPackages();
        console.log(`✅ Indexing completed in ${Date.now() - start}ms`);
        console.log(`📊 Indexed ${stats.numberOfDocuments} documents`);
        break;
      }
      case "clear": {
        console.log("🔄 Initializing search service...");
        await searchService.initialize();
        console.log("🗑️  Clearing index...");
        await searchService.clearIndex();
        console.log(`✅ Index cleared in ${Date.now() - start}ms`);
        break;
      }
      case "stats": {
        console.log("🔄 Initializing search service...");
        await searchService.initialize();
        const indexStats = await searchService.getStats();
        console.log("📊 Index Statistics:");
        console.log(`   Documents: ${indexStats.numberOfDocuments.toLocaleString()}`);
        console.log(`   Indexing: ${indexStats.isIndexing ? "Yes" : "No"}`);
        console.log(`   Field Distribution:`, indexStats.fieldDistribution);
        break;
      }
      case "health": {
        const health = await searchService.healthCheck();
        console.log("🏥 Search Service Health:");
        console.log(`   Status: ${health.status}`);
        console.log(`   Host: ${health.host}`);
        console.log(`   Initialized: ${health.initialized}`);
        console.log(`   Index: ${health.indexName}`);
        console.log(`   Documents: ${health.documentCount}`);
        if (health.error) {
          console.log(`   Error: ${health.error}`);
        }
        break;
      }
      case "help":
      case "--help":
      case "-h":
        showHelp();
        break;
      default:
        console.error(`❌ Unknown command: ${command}`);
        showHelp();
        process.exit(1);
    }
  } catch (error) {
    console.error(`❌ Command failed:`, error.message);
    console.error("💡 Make sure MeiliSearch is running and accessible");
    process.exit(1);
  }
}

// Main execution
async function main() {
  const command = process.argv[2];

  if (!command) {
    showHelp();
    return;
  }

  console.log(`🚀 MCP Registry Search Index Manager`);
  console.log(`📅 ${new Date().toISOString()}`);
  console.log(`🔧 Command: ${command}\n`);

  await runCommand(command);
}

// Handle unhandled rejections
process.on("unhandledRejection", (error) => {
  console.error("❌ Unhandled rejection:", error);
  process.exit(1);
});

// Run if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  main().catch(console.error);
}
