#!/usr/bin/env node

/**
 * Awesome MCP Registry - Web Server
 * Serves the MCP registry data via HTTP API and provides a simple web interface
 */

import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import { fileURLToPath } from "node:url";

// Import search service with error handling
let searchService = null;
try {
  const { default: service } = await import("./services/search-service.js");
  searchService = service;
} catch (error) {
  console.warn("⚠️  Search service not available:", error.message);
  console.log("💡 Install meilisearch to enable enhanced search: pnpm add meilisearch");
}

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configuration
const PORT = process.env.PORT || 3000;
const HOST = process.env.HOST || "localhost";

// Helper function to get MIME type
function getMimeType(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    ".html": "text/html",
    ".css": "text/css",
    ".js": "application/javascript",
    ".json": "application/json",
    ".png": "image/png",
    ".jpg": "image/jpeg",
    ".jpeg": "image/jpeg",
    ".gif": "image/gif",
    ".svg": "image/svg+xml",
    ".ico": "image/x-icon",
    ".txt": "text/plain",
    ".md": "text/markdown",
  };
  return mimeTypes[ext] || "application/octet-stream";
}

// Helper function to send JSON response
function sendJSON(res, data, statusCode = 200) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  });
  res.end(JSON.stringify(data, null, 2));
}

// Helper function to send error response
function sendError(res, message, statusCode = 500) {
  sendJSON(res, { error: message, status: statusCode }, statusCode);
}

// Helper function to serve static files
async function serveStaticFile(res, filePath) {
  try {
    const data = await fs.readFile(filePath);
    const mimeType = getMimeType(filePath);

    res.writeHead(200, {
      "Content-Type": mimeType,
      "Access-Control-Allow-Origin": "*",
    });
    res.end(data);
    return true;
  } catch (_error) {
    return false;
  }
}

// Generate HTML homepage
function generateHomepage() {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Awesome MCP Registry</title>
    <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            line-height: 1.6;
            color: #333;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
        }
        .container {
            max-width: 1200px;
            margin: 0 auto;
            padding: 20px;
        }
        header {
            text-align: center;
            color: white;
            padding: 60px 20px;
        }
        h1 {
            font-size: 3.5em;
            margin-bottom: 20px;
            text-shadow: 2px 2px 4px rgba(0,0,0,0.3);
        }
        .subtitle {
            font-size: 1.3em;
            margin-bottom: 40px;
            opacity: 0.9;
        }
        .stats {
            display: flex;
            justify-content: center;
            gap: 40px;
            margin-bottom: 40px;
            flex-wrap: wrap;
        }
        .stat {
            background: rgba(255,255,255,0.2);
            padding: 20px 30px;
            border-radius: 10px;
            backdrop-filter: blur(10px);
            text-align: center;
        }
        .stat-number {
            font-size: 2.5em;
            font-weight: bold;
            display: block;
        }
        .stat-label {
            font-size: 0.9em;
            opacity: 0.8;
        }
        .api-section {
            background: white;
            border-radius: 15px;
            padding: 40px;
            margin: 40px 0;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
        }
        .api-section h2 {
            color: #667eea;
            margin-bottom: 20px;
            font-size: 2em;
        }
        .endpoints {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
            gap: 20px;
            margin: 20px 0;
        }
        .endpoint {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            border-left: 4px solid #667eea;
        }
        .endpoint-method {
            background: #667eea;
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            font-size: 0.8em;
            font-weight: bold;
            display: inline-block;
            margin-bottom: 10px;
        }
        .endpoint-url {
            font-family: 'Monaco', 'Menlo', monospace;
            background: #e9ecef;
            padding: 8px;
            border-radius: 4px;
            margin: 10px 0;
        }
        .endpoint-desc {
            color: #666;
            font-size: 0.9em;
        }
        .quick-start {
            background: #f8f9fa;
            padding: 20px;
            border-radius: 8px;
            margin: 20px 0;
        }
        .quick-start code {
            background: #e9ecef;
            padding: 2px 6px;
            border-radius: 3px;
            font-family: 'Monaco', 'Menlo', monospace;
        }
        .footer {
            text-align: center;
            color: white;
            padding: 40px 20px;
            opacity: 0.8;
        }
        .footer a {
            color: white;
            text-decoration: none;
            border-bottom: 1px dotted rgba(255,255,255,0.5);
        }
        @media (max-width: 768px) {
            h1 { font-size: 2.5em; }
            .stats { flex-direction: column; align-items: center; }
            .api-section { padding: 20px; }
        }
        
        /* Search UI Styles */
        .search-container {
            background: rgba(255,255,255,0.2);
            border-radius: 15px;
            padding: 30px;
            margin: 40px auto;
            max-width: 800px;
            backdrop-filter: blur(10px);
        }
        
        .search-box {
            position: relative;
            width: 100%;
        }
        
        .search-input {
            width: 100%;
            padding: 15px 50px 15px 20px;
            font-size: 1.1em;
            border: none;
            border-radius: 10px;
            background: rgba(255,255,255,0.9);
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            outline: none;
            transition: all 0.3s ease;
        }
        
        .search-input:focus {
            background: white;
            box-shadow: 0 6px 25px rgba(0,0,0,0.15);
            transform: translateY(-2px);
        }
        
        .search-button {
            position: absolute;
            right: 10px;
            top: 50%;
            transform: translateY(-50%);
            background: #667eea;
            border: none;
            border-radius: 8px;
            color: white;
            padding: 8px 12px;
            cursor: pointer;
            transition: background 0.3s ease;
        }
        
        .search-button:hover {
            background: #5a67d8;
        }
        
        .search-filters {
            display: flex;
            gap: 15px;
            margin-top: 20px;
            flex-wrap: wrap;
            justify-content: center;
        }
        
        .filter-select {
            padding: 8px 12px;
            border: none;
            border-radius: 6px;
            background: rgba(255,255,255,0.9);
            cursor: pointer;
            transition: all 0.3s ease;
        }
        
        .filter-select:focus {
            background: white;
            outline: none;
            box-shadow: 0 2px 10px rgba(0,0,0,0.1);
        }
        
        .search-results {
            background: white;
            border-radius: 15px;
            margin: 40px auto;
            max-width: 1000px;
            box-shadow: 0 10px 30px rgba(0,0,0,0.1);
            display: none;
        }
        
        .search-results.show {
            display: block;
        }
        
        .search-header {
            padding: 20px 30px;
            border-bottom: 1px solid #e9ecef;
            background: #f8f9fa;
            border-radius: 15px 15px 0 0;
        }
        
        .search-count {
            color: #667eea;
            font-weight: bold;
        }
        
        .search-list {
            max-height: 600px;
            overflow-y: auto;
        }
        
        .package-item {
            padding: 20px 30px;
            border-bottom: 1px solid #e9ecef;
            transition: background 0.2s ease;
        }
        
        .package-item:hover {
            background: #f8f9fa;
        }
        
        .package-item:last-child {
            border-bottom: none;
            border-radius: 0 0 15px 15px;
        }
        
        .package-name {
            font-size: 1.2em;
            font-weight: bold;
            color: #667eea;
            margin-bottom: 8px;
        }
        
        .package-description {
            color: #666;
            margin-bottom: 10px;
            line-height: 1.4;
        }
        
        .package-meta {
            display: flex;
            gap: 15px;
            font-size: 0.9em;
            color: #888;
            flex-wrap: wrap;
        }
        
        .package-category {
            background: #e9ecef;
            padding: 2px 8px;
            border-radius: 4px;
            color: #667eea;
            font-weight: 500;
        }
        
        .package-validated {
            background: #d4edda;
            color: #155724;
            padding: 2px 8px;
            border-radius: 4px;
            font-weight: 500;
        }
        
        .loading {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .no-results {
            text-align: center;
            padding: 40px;
            color: #666;
        }
        
        .error-message {
            background: #f8d7da;
            color: #721c24;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            border: 1px solid #f5c6cb;
        }
        
        .search-suggestions {
            position: absolute;
            top: 100%;
            left: 0;
            right: 0;
            background: white;
            border-radius: 0 0 10px 10px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.1);
            max-height: 200px;
            overflow-y: auto;
            z-index: 1000;
            display: none;
        }
        
        .suggestion-item {
            padding: 10px 20px;
            cursor: pointer;
            border-bottom: 1px solid #e9ecef;
            transition: background 0.2s ease;
        }
        
        .suggestion-item:hover {
            background: #f8f9fa;
        }
        
        .suggestion-item:last-child {
            border-bottom: none;
        }
        
        @media (max-width: 768px) {
            .search-filters {
                flex-direction: column;
                align-items: center;
            }
            
            .filter-select {
                width: 200px;
            }
            
            .package-meta {
                flex-direction: column;
                gap: 8px;
            }
        }
    </style>
</head>
<body>
    <div class="container">
        <header>
            <h1>🚀 Awesome MCP Registry</h1>
            <p class="subtitle">An Open, Structured, and Standard Registry for MCP Servers and Packages</p>
            <div class="stats" id="stats">
                <div class="stat">
                    <span class="stat-number" id="total-packages">4000+</span>
                    <span class="stat-label">MCP Servers</span>
                </div>
                <div class="stat">
                    <span class="stat-number" id="total-categories">20+</span>
                    <span class="stat-label">Categories</span>
                </div>
                <div class="stat">
                    <span class="stat-number">✨</span>
                    <span class="stat-label">Open Source</span>
                </div>
            </div>
        </header>

        <!-- Search Interface -->
        <div class="search-container">
            <div class="search-box">
                <input 
                    type="text" 
                    class="search-input" 
                    id="searchInput"
                    placeholder="Search MCP packages... (e.g., 'database', 'github', 'AI')"
                    autocomplete="off"
                >
                <button class="search-button" id="searchButton">🔍</button>
                <div class="search-suggestions" id="suggestions"></div>
            </div>
            
            <div class="search-filters">
                <select class="filter-select" id="categoryFilter">
                    <option value="">All Categories</option>
                </select>
                
                <select class="filter-select" id="validatedFilter">
                    <option value="">All Packages</option>
                    <option value="true">Validated Only</option>
                    <option value="false">Unvalidated Only</option>
                </select>
                
                <select class="filter-select" id="sortFilter">
                    <option value="">Default Sort</option>
                    <option value="name">Sort by Name</option>
                    <option value="popularity:desc">Most Popular</option>
                    <option value="category">Sort by Category</option>
                </select>
            </div>
        </div>

        <!-- Search Results -->
        <div class="search-results" id="searchResults">
            <div class="search-header">
                <div class="search-count" id="searchCount">0 packages found</div>
            </div>
            <div class="search-list" id="searchList"></div>
        </div>

        <div class="api-section">
            <h2>🔌 API Endpoints</h2>
            <p>Access the complete MCP registry data programmatically:</p>
            
            <div class="endpoints">
                <div class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <div class="endpoint-url">/api/packages</div>
                    <div class="endpoint-desc">Get all MCP packages with full metadata</div>
                </div>
                
                <div class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <div class="endpoint-url">/api/categories</div>
                    <div class="endpoint-desc">Get all categories with package counts</div>
                </div>
                
                <div class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <div class="endpoint-url">/api/packages/:category</div>
                    <div class="endpoint-desc">Get packages filtered by category</div>
                </div>
                
                <div class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <div class="endpoint-url">/api/search?q=:query</div>
                    <div class="endpoint-desc">Search packages by name or description (enhanced with MeiliSearch)</div>
                </div>
                
                <div class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <div class="endpoint-url">/api/search/suggest?q=:query</div>
                    <div class="endpoint-desc">Get search suggestions/autocomplete</div>
                </div>
                
                <div class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <div class="endpoint-url">/api/search/facets</div>
                    <div class="endpoint-desc">Get available filters for search</div>
                </div>
                
                <div class="endpoint">
                    <span class="endpoint-method">POST</span>
                    <div class="endpoint-url">/api/search/index</div>
                    <div class="endpoint-desc">Rebuild search index (admin)</div>
                </div>
            </div>

            <div class="quick-start">
                <h3>Quick Start</h3>
                <p>Fetch all MCP servers:</p>
                <p><code>curl http://localhost:${PORT}/api/packages</code></p>
                <p>Or use in JavaScript:</p>
                <p><code>fetch('/api/packages').then(r => r.json()).then(console.log)</code></p>
            </div>
        </div>

        <div class="api-section">
            <h2>📦 Static Files</h2>
            <p>Direct access to registry data files:</p>
            
            <div class="endpoints">
                <div class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <div class="endpoint-url">/indexes/packages-list.json</div>
                    <div class="endpoint-desc">Complete packages index (static file)</div>
                </div>
                
                <div class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <div class="endpoint-url">/indexes/categories-list.json</div>
                    <div class="endpoint-desc">Categories index (static file)</div>
                </div>
                
                <div class="endpoint">
                    <span class="endpoint-method">GET</span>
                    <div class="endpoint-url">/packages/:category/:package.json</div>
                    <div class="endpoint-desc">Individual package configuration</div>
                </div>
            </div>
        </div>

        <footer class="footer">
            <p>Built with ❤️ by the MCP community • <a href="https://github.com/toolsdk-ai/awesome-mcp-registry">View on GitHub</a></p>
        </footer>
    </div>

    <script>
        // Load and display real stats
        fetch('/api/packages')
            .then(r => r.json())
            .then(data => {
                if (data.length) {
                    document.getElementById('total-packages').textContent = data.length.toLocaleString();
                }
            })
            .catch(() => {}); // Ignore errors, keep default values

        fetch('/api/categories')
            .then(r => r.json())
            .then(data => {
                if (data.length) {
                    document.getElementById('total-categories').textContent = data.length;
                }
                // Populate category filter
                populateCategoryFilter(data);
            })
            .catch(() => {}); // Ignore errors, keep default values

        // Search functionality
        const searchInput = document.getElementById('searchInput');
        const searchButton = document.getElementById('searchButton');
        const searchResults = document.getElementById('searchResults');
        const searchList = document.getElementById('searchList');
        const searchCount = document.getElementById('searchCount');
        const suggestions = document.getElementById('suggestions');
        const categoryFilter = document.getElementById('categoryFilter');
        const validatedFilter = document.getElementById('validatedFilter');
        const sortFilter = document.getElementById('sortFilter');

        let searchTimeout;
        let currentQuery = '';

        // Populate category filter
        function populateCategoryFilter(categories) {
            categories.forEach(category => {
                const option = document.createElement('option');
                option.value = category.name;
                option.textContent = category.name + ' (' + category.count + ')';
                categoryFilter.appendChild(option);
            });
        }

        // Debounced search function
        function performSearch() {
            const query = searchInput.value.trim();
            const category = categoryFilter.value;
            const validated = validatedFilter.value;
            const sort = sortFilter.value;

            currentQuery = query;

            if (query.length < 2) {
                hideSearchResults();
                hideSuggestions();
                return;
            }

            // Show loading
            showLoading();
            
            // Build search URL
            const params = new URLSearchParams();
            params.append('q', query);
            if (category) params.append('category', category);
            if (validated) params.append('validated', validated);
            if (sort) params.append('sort', sort);
            params.append('limit', '50');

            fetch('/api/search?' + params.toString())
                .then(r => r.json())
                .then(data => {
                    if (currentQuery === query) { // Only update if still the current query
                        displaySearchResults(data);
                    }
                })
                .catch(error => {
                    if (currentQuery === query) {
                        showError('Search failed: ' + error.message);
                    }
                });
        }

        // Get search suggestions
        function getSuggestions(query) {
            if (query.length < 2) {
                hideSuggestions();
                return;
            }

            fetch('/api/search/suggest?q=' + encodeURIComponent(query) + '&limit=5')
                .then(r => r.json())
                .then(data => {
                    displaySuggestions(data);
                })
                .catch(() => {
                    hideSuggestions();
                });
        }

        // Display search suggestions
        function displaySuggestions(suggestions_data) {
            if (!suggestions_data || suggestions_data.length === 0) {
                hideSuggestions();
                return;
            }

            suggestions.innerHTML = '';
            suggestions_data.forEach(suggestion => {
                const item = document.createElement('div');
                item.className = 'suggestion-item';
                item.textContent = suggestion;
                item.onclick = () => {
                    searchInput.value = suggestion;
                    hideSuggestions();
                    performSearch();
                };
                suggestions.appendChild(item);
            });
            suggestions.style.display = 'block';
        }

        // Hide suggestions
        function hideSuggestions() {
            suggestions.style.display = 'none';
        }

        // Display search results
        function displaySearchResults(data) {
            if (data.error) {
                showError(data.error);
                return;
            }

            const packages = data.packages || data.hits || data;
            const count = data.totalHits || data.estimatedTotalHits || packages.length;
            
            searchCount.textContent = count.toLocaleString() + ' package' + (count !== 1 ? 's' : '') + ' found';
            
            if (packages.length === 0) {
                searchList.innerHTML = '<div class="no-results">No packages found matching your search criteria.</div>';
            } else {
                searchList.innerHTML = packages.map(pkg => {
                    // Handle both direct package data and MeiliSearch hit format
                    const packageData = pkg._source || pkg;
                    const highlighted = pkg._formatted || packageData;
                    
                    const name = highlighted.name || highlighted.packageName || packageData.name || packageData.packageName;
                    const description = highlighted.description || packageData.description || 'No description available';
                    const category = packageData.category || 'uncategorized';
                    const author = packageData.author || 'Unknown';
                    const toolsCount = packageData.tools ? Object.keys(packageData.tools).length : 0;
                    
                    return '<div class="package-item">' +
                        '<div class="package-name">' + name + '</div>' +
                        '<div class="package-description">' + description + '</div>' +
                        '<div class="package-meta">' +
                            '<span class="package-category">' + category + '</span>' +
                            (packageData.validated ? '<span class="package-validated">✓ Validated</span>' : '') +
                            '<span>Author: ' + author + '</span>' +
                            (toolsCount ? '<span>Tools: ' + toolsCount + '</span>' : '') +
                        '</div>' +
                    '</div>';
                }).join('');
            }
            
            showSearchResults();
        }

        // Show loading state
        function showLoading() {
            searchList.innerHTML = '<div class="loading">🔍 Searching...</div>';
            searchCount.textContent = 'Searching...';
            showSearchResults();
        }

        // Show error message
        function showError(message) {
            searchList.innerHTML = '<div class="error-message">❌ ' + message + '</div>';
            searchCount.textContent = 'Search error';
            showSearchResults();
        }

        // Show search results section
        function showSearchResults() {
            searchResults.classList.add('show');
        }

        // Hide search results section
        function hideSearchResults() {
            searchResults.classList.remove('show');
        }

        // Event listeners
        searchInput.addEventListener('input', (e) => {
            clearTimeout(searchTimeout);
            const query = e.target.value.trim();
            
            // Debounce search
            searchTimeout = setTimeout(() => {
                performSearch();
            }, 300);
            
            // Get suggestions immediately
            getSuggestions(query);
        });

        searchInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                e.preventDefault();
                clearTimeout(searchTimeout);
                hideSuggestions();
                performSearch();
            }
        });

        searchButton.addEventListener('click', () => {
            hideSuggestions();
            performSearch();
        });

        // Filter change handlers
        [categoryFilter, validatedFilter, sortFilter].forEach(filter => {
            filter.addEventListener('change', () => {
                if (searchInput.value.trim().length >= 2) {
                    performSearch();
                }
            });
        });

        // Hide suggestions when clicking outside
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.search-box')) {
                hideSuggestions();
            }
        });

        // Handle escape key
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                hideSuggestions();
                if (searchInput.value === '') {
                    hideSearchResults();
                }
            }
        });
    </script>
</body>
</html>`;
}

// Request handler
async function handleRequest(req, res) {
  const url = new URL(req.url, `http://${HOST}:${PORT}`);
  const pathname = url.pathname;
  const method = req.method;

  console.log(`${new Date().toISOString()} - ${method} ${pathname}`);

  // Handle CORS preflight
  if (method === "OPTIONS") {
    res.writeHead(200, {
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type",
    });
    res.end();
    return;
  }

  try {
    // Homepage
    if (pathname === "/") {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.end(generateHomepage());
      return;
    }

    // Health check
    if (pathname === "/health") {
      sendJSON(res, {
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        version: process.env.npm_package_version || "1.0.0",
      });
      return;
    }

    // API Routes
    if (pathname.startsWith("/api/")) {
      const apiPath = pathname.substring(4); // Remove '/api'

      // Get all packages
      if (apiPath === "/packages") {
        try {
          const packagesData = await fs.readFile(
            path.join(__dirname, "..", "indexes", "packages-list.json"),
            "utf8",
          );
          const packages = JSON.parse(packagesData);
          sendJSON(res, packages);
          return;
        } catch (_error) {
          sendError(res, "Packages data not found. Run build first.", 404);
          return;
        }
      }

      // Get all categories
      if (apiPath === "/categories") {
        try {
          const categoriesData = await fs.readFile(
            path.join(__dirname, "..", "indexes", "categories-list.json"),
            "utf8",
          );
          const categories = JSON.parse(categoriesData);
          sendJSON(res, categories);
          return;
        } catch (_error) {
          sendError(res, "Categories data not found. Run build first.", 404);
          return;
        }
      }

      // Enhanced search with MeiliSearch
      if (apiPath === "/search") {
        const query = url.searchParams.get("q");
        if (!query) {
          sendError(res, 'Query parameter "q" is required', 400);
          return;
        }

        try {
          // Try MeiliSearch first
          if (searchService?.isInitialized) {
            const limit = parseInt(url.searchParams.get("limit"), 10) || 20;
            const offset = parseInt(url.searchParams.get("offset"), 10) || 0;
            const category = url.searchParams.get("category");
            const validated = url.searchParams.get("validated");
            const sort = url.searchParams.get("sort");

            const filters = [];
            if (category) filters.push(`category = "${category}"`);
            if (validated) filters.push(`validated = ${validated === "true"}`);

            const searchOptions = {
              limit,
              offset,
              filter: filters.length > 0 ? filters.join(" AND ") : null,
              sort: sort ? [sort] : undefined,
            };

            const results = await searchService.search(query, searchOptions);
            sendJSON(res, results);
            return;
          }

          // Fallback to basic search if MeiliSearch is not available
          console.warn("MeiliSearch not available, falling back to basic search");
          const packagesData = await fs.readFile(
            path.join(__dirname, "..", "indexes", "packages-list.json"),
            "utf8",
          );
          const packages = JSON.parse(packagesData);

          const searchTerm = query.toLowerCase();
          const packagesArray = Object.entries(packages).map(([name, data]) => ({
            ...data,
            packageName: name,
            name: data.name || name,
          }));

          const results = packagesArray.filter(
            (pkg) =>
              pkg.name?.toLowerCase().includes(searchTerm) ||
              pkg.description?.toLowerCase().includes(searchTerm) ||
              pkg.packageName?.toLowerCase().includes(searchTerm),
          );

          sendJSON(res, {
            hits: results,
            query: query,
            processingTimeMs: 0,
            limit: results.length,
            offset: 0,
            estimatedTotalHits: results.length,
            fallback: true,
          });
          return;
        } catch (error) {
          console.error("Search error:", error);
          sendError(res, `Search failed: ${error.message}`, 500);
          return;
        }
      }

      // Search suggestions
      if (apiPath === "/search/suggest") {
        const query = url.searchParams.get("q");
        if (!query) {
          sendError(res, 'Query parameter "q" is required', 400);
          return;
        }

        try {
          if (searchService?.isInitialized) {
            const limit = parseInt(url.searchParams.get("limit"), 10) || 10;
            const suggestions = await searchService.suggest(query, limit);
            sendJSON(res, suggestions);
            return;
          }

          sendError(res, "Search suggestions not available. MeiliSearch required.", 503);
          return;
        } catch (error) {
          console.error("Suggestions error:", error);
          sendError(res, `Suggestions failed: ${error.message}`, 500);
          return;
        }
      }

      // Search facets
      if (apiPath === "/search/facets") {
        try {
          if (searchService?.isInitialized) {
            const facets = await searchService.getFacets();
            sendJSON(res, facets);
            return;
          }

          sendError(res, "Search facets not available. MeiliSearch required.", 503);
          return;
        } catch (error) {
          console.error("Facets error:", error);
          sendError(res, `Facets failed: ${error.message}`, 500);
          return;
        }
      }

      // Index rebuild (POST endpoint)
      if (apiPath === "/search/index" && method === "POST") {
        try {
          if (!searchService) {
            sendError(res, "Search service not available. Install meilisearch first.", 503);
            return;
          }

          if (!searchService.isInitialized) {
            await searchService.initialize();
          }

          const stats = await searchService.indexPackages();
          sendJSON(res, {
            success: true,
            message: "Index rebuilt successfully",
            stats: stats,
          });
          return;
        } catch (error) {
          console.error("Index rebuild error:", error);
          sendError(res, `Index rebuild failed: ${error.message}`, 500);
          return;
        }
      }

      // Search health check
      if (apiPath === "/search/health") {
        try {
          if (!searchService) {
            sendJSON(
              res,
              {
                status: "unavailable",
                error: "Search service not loaded. Install meilisearch first.",
                host: "N/A",
                initialized: false,
              },
              503,
            );
            return;
          }

          const health = await searchService.healthCheck();
          sendJSON(res, health, health.status === "healthy" ? 200 : 503);
          return;
        } catch (error) {
          sendError(res, `Health check failed: ${error.message}`, 500);
          return;
        }
      }

      // Get packages by category
      if (apiPath.startsWith("/packages/")) {
        const category = apiPath.substring(10); // Remove '/packages/'
        try {
          const packagesData = await fs.readFile(
            path.join(__dirname, "..", "indexes", "packages-list.json"),
            "utf8",
          );
          const packages = JSON.parse(packagesData);

          const categoryPackages = packages.filter((pkg) => pkg.category === category);
          sendJSON(res, categoryPackages);
          return;
        } catch (_error) {
          sendError(res, "Packages data not found. Run build first.", 404);
          return;
        }
      }

      sendError(res, "API endpoint not found", 404);
      return;
    }

    // Static file serving
    const rootDir = path.join(__dirname, "..");
    let filePath;

    // Serve index files
    if (pathname.startsWith("/indexes/")) {
      filePath = path.join(rootDir, pathname.substring(1));
    }
    // Serve package files
    else if (pathname.startsWith("/packages/")) {
      filePath = path.join(rootDir, pathname.substring(1));
    }
    // Serve config files
    else if (pathname.startsWith("/config/")) {
      filePath = path.join(rootDir, pathname.substring(1));
    }
    // Serve README
    else if (pathname === "/README.md") {
      filePath = path.join(rootDir, "README.md");
    } else {
      res.writeHead(404, { "Content-Type": "text/plain" });
      res.end("404 - Not Found");
      return;
    }

    // Try to serve the static file
    if (await serveStaticFile(res, filePath)) {
      return;
    }

    // File not found
    res.writeHead(404, { "Content-Type": "text/plain" });
    res.end("404 - File Not Found");
  } catch (_error) {
    console.error("Server error:", error);
    sendError(res, "Internal Server Error", 500);
  }
}

// Initialize search service on startup
async function initializeServer() {
  if (!searchService) {
    console.log("📝 Search service not available - enhanced search features disabled");
    console.log("💡 To enable enhanced search, install MeiliSearch: pnpm add meilisearch");
    return;
  }

  try {
    console.log("🔄 Initializing search service...");
    await searchService.initialize();
    console.log("✅ Search service ready");
  } catch (error) {
    console.warn("⚠️  Search service initialization failed:", error.message);
    console.log("📝 Server will start without enhanced search capabilities");
    console.log("💡 To enable enhanced search, make sure MeiliSearch is running");
  }
}

// Create and start server
const server = http.createServer(handleRequest);

server.listen(PORT, HOST, async () => {
  console.log(`🚀 Awesome MCP Registry server running at http://${HOST}:${PORT}`);
  console.log(`📊 API available at http://${HOST}:${PORT}/api/`);
  console.log(`🔍 Health check: http://${HOST}:${PORT}/health`);
  console.log(`📖 Documentation: http://${HOST}:${PORT}/`);

  // Initialize search service after server starts
  await initializeServer();
});

// Graceful shutdown
process.on("SIGTERM", () => {
  console.log("Received SIGTERM, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

process.on("SIGINT", () => {
  console.log("Received SIGINT, shutting down gracefully...");
  server.close(() => {
    console.log("Server closed.");
    process.exit(0);
  });
});

export default server;
