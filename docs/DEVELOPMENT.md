# Awesome MCP Registry Developer Guide

This document provides developers with detailed information on how to set up, run, and develop the Awesome MCP Registry project.

- [Awesome MCP Registry Developer Guide](#awesome-mcp-registry-developer-guide)
  - [1. 🧰 Prerequisites](#1--prerequisites)
  - [2. 🧰 Tech Stack](#2--tech-stack)
  - [3. 🎯 Project Purpose](#3--project-purpose)
  - [4. 🚀 Quick Start with Docker](#4--quick-start-with-docker)
    - [4.1 Quick Start (5 Minutes)](#41-quick-start-5-minutes)
    - [4.2 API Usage Examples](#42-api-usage-examples)
    - [4.3 Troubleshooting](#43-troubleshooting)
  - [5. 📦 Package Management for Private Deployment](#5--package-management-for-private-deployment)
    - [5.1 Understanding Package Structure](#51-understanding-package-structure)
    - [5.2 How to Remove Unwanted Packages](#52-how-to-remove-unwanted-packages)
    - [5.3 Rebuild Indexes](#53-rebuild-indexes)
    - [5.4 Benefits of Package Pruning](#54-benefits-of-package-pruning)
    - [5.5 Recommended Minimal Setup](#55-recommended-minimal-setup)
  - [6. 💻 Local Development Setup](#6--local-development-setup)
    - [6.1 Install Dependencies](#61-install-dependencies)
    - [6.2 Build Project](#62-build-project)
    - [6.3 Start Development Server (Without Search Function)](#63-start-development-server-without-search-function)
    - [6.4 Start Development Server (With Search Function)](#64-start-development-server-with-search-function)
  - [7. 🛠 Common Issues and Troubleshooting](#7--common-issues-and-troubleshooting)
    - [7.1 MCP Client Test Errors During Build Process](#71-mcp-client-test-errors-during-build-process)
  - [8. 🗃️ Project Structure](#8-️-project-structure)
  - [9. ⚙️ Environment Variables](#9-️-environment-variables)

## 1. 🧰 Prerequisites

Before you begin, ensure your development environment meets the following requirements:

- **Docker** (recommended) - For quick start deployment
- **Node.js** >= 18.x (latest LTS version recommended) - Required for local development only
- **pnpm** >= 8.x (package manager) - Required for local development only

## 2. 🧰 Tech Stack

- **Runtime Environment**: Node.js (ESM modules)
- **Package Manager**: pnpm
- **Language**: TypeScript
- **Web Framework**: Hono.js + OpenAPI (Zod)
- **Architecture**: Domain-Driven Design (DDD) + Service Object Pattern
- **Search Service**: MeiliSearch (optional)
- **Sandbox Providers**: LOCAL / Sandock / Daytona / E2B
- **Build Tool**: TypeScript Compiler (tsc)
- **Code Formatting**: Biome
- **Testing**: Vitest

## 3. 🎯 Project Purpose

This project has two main purposes:

1. **MCP Registry** - Collects and indexes various MCP servers, providing search functionality
2. **MCP Server** - Deployed as a server to remotely call various MCP servers

### Key Features:

- 📦 **Package Management** - Registry of 6000+ MCP servers with metadata and validation
- 🔍 **Search Service** - Full-text search powered by MeiliSearch (optional)
- 🛡️ **Sandbox Execution** - Secure MCP tool execution in isolated environments:
  - **LOCAL** - Direct local execution (default)
  - **Sandock** - Lightweight Docker sandbox for AI agents
  - **Daytona** - Cloud development environments
  - **E2B** - Code interpreter sandbox
- 🌐 **RESTful API** - Complete API with OpenAPI/Swagger documentation
- ⚡ **Performance** - Async execution with connection pooling

Additionally, we have deployed a website [ToolSDK.ai](https://toolsdk.ai) that can search for and run MCP Servers. We also provide a tool called `toolsdk` to help integrate these MCP Servers.

## 4. 🚀 Quick Start with Docker

Docker Compose allows you to quickly deploy the complete MCP Registry with search functionality and SANDOCK remote execution environment.

### 4.1 Quick Start (5 Minutes)

**Step 1: Clone the Repository**

```bash
git clone https://github.com/toolsdk-ai/awesome-mcp-registry.git
cd awesome-mcp-registry
```

**Step 2: Get Sandock API Key**

Visit [Sandock website](https://sandock.ai) to register and obtain your API Key.

**Step 3: Configure Environment Variables**

In the `.env` file, you only need to modify this line:

```env
SANDOCK_API_KEY=your-sandock-api-key-here  # Replace with your actual API Key
```

**Step 4: Start Services**

```bash
docker compose up -d
```

> **⚠️ Note:** This command will build and install all 6000+ MCP packages and their dependencies, which may take 10-15 minutes on first run. If you only need specific packages for your use case, consider pruning unwanted packages first by following the guide in [Section 5: Package Management for Private Deployment](#5--package-management-for-private-deployment) to significantly reduce build time and image size.

This will start two services:
- `mcp-registry` - MCP Registry main application (port 3003)
- `meilisearch` - Search engine service (port 7700)

**Step 5: Initialize Search Index (Optional)**

Wait for services to start (about 30-60 seconds), then initialize the search index:

```bash
# Initialize search service
curl -X POST http://localhost:3003/api/v1/search/manage/init

# Index MCP data
curl -X POST http://localhost:3003/api/v1/search/manage/index
```

**Step 6: Access Services**

- 🌐 Homepage: http://localhost:3003
- 📚 API Documentation: http://localhost:3003/swagger
- 🔍 Search Engine Management: http://localhost:7700

### 4.2 API Usage Examples

**List all MCP Servers:**

```bash
curl http://localhost:3003/api/v1/packages
```

**Search MCP Servers:**

```bash
curl "http://localhost:3003/api/v1/search/packages?q=github&limit=5"
```

**Execute MCP Tool (using SANDOCK remote execution):**

```bash
curl -X POST http://localhost:3003/api/v1/packages/run \
  -H "Content-Type: application/json" \
  -d '{
    "packageName": "mcp-starter",
    "toolKey": "hello_tool",
    "inputData": {
      "name": "World"
    },
    "envs": {}
  }'
```

### 4.3 Troubleshooting

**Issue 1: Port Already in Use**

```bash
# Check port usage
lsof -i :3003
lsof -i :7700

# Modify port in .env file
MCP_SERVER_PORT=3004
```

**Issue 2: SANDOCK_API_KEY Not Configured**

Error message:
```
Error: SANDOCK_API_KEY is required when using SANDOCK provider
```

Solution:
- Check if `.env` file exists
- Confirm `SANDOCK_API_KEY` is correctly filled in
- Restart services: `docker compose restart`

**Issue 3: Search Function Unavailable**

```bash
# Check if MeiliSearch is running
docker compose ps meilisearch

# Reinitialize indexes
curl -X POST http://localhost:3003/api/v1/search/manage/init
curl -X POST http://localhost:3003/api/v1/search/manage/index
```

**Issue 4: Long Build Time**

First build may take 10-15 minutes, which is normal. The Dockerfile needs to:
- Install Python 3.13 and pyenv
- Install Node.js dependencies (large number of packages)
- Install Python dependencies
- Build TypeScript code

Subsequent builds will be much faster using Docker cache.

## 5. 📦 Package Management for Private Deployment

If you're deploying this project privately, you probably don't need all 6000+ MCP packages. Here's how to keep only the packages you need to significantly reduce build time and dependencies.

### 5.1 Understanding Package Structure

All MCP packages are stored in the `packages/` directory, organized by category:

```
packages/
├── developer-tools/      # Development related tools
├── databases/            # Database integrations
├── cloud-platforms/      # Cloud service integrations
├── version-control/      # Git, GitHub, etc.
├── communication/        # Slack, Discord, etc.
└── ...                   # 30+ other categories
```

Each package is defined by a JSON configuration file.

### 5.2 How to Remove Unwanted Packages

**Option 1: Remove Specific Packages**

To remove individual packages within a category, simply delete their JSON configuration files:

1. Navigate to the category folder (e.g., `packages/version-control/`)
2. Delete the `.json` files for packages you don't need
3. Run the rebuild process (see Section 5.3)

Example: Keep only GitHub-related packages in version-control by removing other `.json` files like `gitlab.json`, `bitbucket.json`, etc.

**Option 2: Remove Entire Categories**

To remove entire categories (e.g., gaming, sports), edit the `config/categories.mjs` file:

1. Open `config/categories.mjs`
2. Remove the category objects you don't need. For example, to remove gaming and sports:

```javascript
// Remove these entries from the array:
{
  key: "gaming",
  name: "Gaming",
  description: "Connect with gaming data, engines, and related services.",
},
{
  key: "sports",
  name: "Sports",
  description: "Access sports data, results, and stats with ease.",
}
```

3. Run the rebuild process - the build script will automatically remove the corresponding directories and their packages

**Option 3: Keep Only What You Need (Minimal Setup)**

For a minimal deployment with only essential categories:

1. Open `config/categories.mjs`
2. Remove all category entries except the ones you need (e.g., `developer-tools`, `databases`, `cloud-platforms`, `version-control`, `communication`, `file-systems`)
3. Run the rebuild process

This approach is recommended as it ensures consistency between your configuration and the actual packages.

### 5.3 Rebuild Indexes

After removing packages, rebuild the indexes:

**For Linux/macOS:**

```bash
make build
```

**For Windows:**

The `make` command is not available by default on Windows. You'll need to run the build commands manually. Open the `Makefile` file in the project root and execute the commands in the `build` target one by one:

```bash
bun scripts/cat-dirs.ts
pnpm install --no-frozen-lockfile
bun scripts/indexing-lists.ts
bun scripts/check-config.ts
pnpm install --no-frozen-lockfile
npx tsx scripts/test-mcp-clients.ts
pnpm install --no-frozen-lockfile
pnpm prune
bun scripts/readme-gen.ts
pnpm run sort
pnpm run check
pnpm run build
```

This will:
- Scan the remaining packages in `packages/` directory
- Validate them and install only required dependencies
- Generate new indexes in `indexes/`
- Update `package.json` with only the necessary Node.js dependencies

### 5.4 Benefits of Package Pruning

By keeping only the packages you need, you'll get:

- ✅ **Faster Build Time** - From 10-15 minutes to 2-3 minutes
- ✅ **Smaller Dependencies** - From thousands to dozens of packages
- ✅ **Smaller Docker Image** - Reduced image size by 50-80%
- ✅ **Faster Deployment** - Less data to transfer and install
- ✅ **Easier Maintenance** - Focus only on packages you actually use

### 5.5 Recommended Minimal Setup

For a typical private deployment, we recommend keeping only the most commonly used categories. 

Edit `config/categories.mjs` and keep only these essential categories:

- `developer-tools` - Development workflow tools
- `databases` - Database integrations
- `cloud-platforms` - Cloud service integrations
- `version-control` - Git, GitHub, etc.
- `communication` - Slack, Discord, etc.
- `file-systems` - File management tools

To do this, open `config/categories.mjs` and remove all other category entries (like gaming, sports, marketing, travel, etc.). After rebuilding, this will give you a practical set of ~200-300 packages instead of 6000+.

## 6. 💻 Local Development Setup

This section is for developers who want to contribute to the project or run it locally without Docker.

### 6.1 Install Dependencies

```bash
pnpm install
```

### 6.2 Build Project

```bash
make build
```

This will perform the following operations:
- Validate all MCP server configurations
- Install all necessary dependencies
- Build TypeScript code

### 6.3 Start Development Server (Without Search Function)

This is the simplest way to start, suitable for scenarios where only API functionality is needed:

1. Ensure `ENABLE_SEARCH=false` is set in the `.env` file:

```env
ENABLE_SEARCH=false
MCP_SERVER_PORT=3003
```

2. Start the development server:

```bash
make dev
```

3. Access the following endpoints:
   - API Documentation: http://localhost:3003/swagger

### 6.4 Start Development Server (With Search Function)

If you need full search functionality:

1. Set up the `.env` file:

```env
ENABLE_SEARCH=true
MCP_SERVER_PORT=3003
MEILI_HTTP_ADDR=http://localhost:7700
```

2. Start the MeiliSearch service:

```bash
make db
```

3. Build the project and start the development server:

```bash
make build
make dev
```

4. Initialize search indexes:

Call the following endpoints via API:
- `POST /api/v1/search/manage/init` - Initialize search service
- `POST /api/v1/search/manage/index` - Index data

5. Access:
   - Search Page: http://localhost:3003
   - API Documentation: http://localhost:3003/swagger

## 7. 🛠 Common Issues and Troubleshooting

### 7.1 MCP Client Test Errors During Build Process

When executing the `make build` command, you may see error messages similar to the following:

```
Error reading MCP Client for package: claude-prompts... ENOENT: no such file or directory
```

**This is normal!** The reason for these errors is:

- This project includes thousands of MCP packages
- The build process attempts to test all packages through the [test-mcp-clients.ts](file:///root/vika/awesome-mcp-registry/scripts/test-mcp-clients.ts) script
- Due to the large number, the testing process may take several hours
- Not all packages need to be installed and tested, as most packages are not essential for running the registry

**These errors can be ignored as long as the build process continues to execute.** After the build is complete, you can still use the API and search functionality (if search is enabled) normally.

## 8. 🗃️ Project Structure

This project follows **Domain-Driven Design (DDD)** architecture with **Service Object** pattern:

```
.
├── config/           # Configuration files
├── indexes/          # Generated index files
├── packages/         # MCP server configuration files (categorized by domain)
├── scripts/          # Build and maintenance scripts
├── docker/           # Docker related files
│   ├── sandock-mcp.Dockerfile  # Sandock custom image
│   ├── build-and-push.sh       # Image build script
│   └── QUICKSTART.md           # Docker quick start guide
├── docs/             # Documentation
│   └── SANDOCK_BEST_PRACTICES.md  # Sandock usage guide
└── src/              # Source code (Domain-Driven Design)
    ├── api/          # API entry point
    │   └── index.ts  # Server initialization and route registration
    ├── domains/      # Business domains (core logic)
    │   ├── config/   # Configuration management
    │   ├── executor/ # Tool execution (local-executor, sandbox-executor)
    │   ├── package/  # Package management (SO, handler, routes)
    │   ├── sandbox/  # Sandbox management (pooling, providers)
    │   └── search/   # Search service integration
    └── shared/       # Shared infrastructure
        ├── config/   # Environment configuration (environment.ts)
        ├── schemas/  # Common Zod schemas
        ├── types/    # Shared TypeScript types
        └── utils/    # Utility functions
```

### Architecture Highlights:

- **Service Object (SO) Pattern**: Business logic encapsulated in reusable Service Objects
- **Handler Layer**: Thin HTTP request/response handlers
- **Repository Pattern**: Data access abstraction
- **Factory Pattern**: Dynamic object creation (Executor, Sandbox providers)
- **Dependency Injection**: Loose coupling through constructor injection

## 9. ⚙️ Environment Variables

### Quick Configuration (Only 1 Variable Required)

For Docker deployment, you only need to configure **`SANDOCK_API_KEY`**:

```env
# 🔑 Required: Get it from https://sandock.ai
SANDOCK_API_KEY=your-sandock-api-key-here
```

All other configurations have reasonable default values and do not need to be modified.

### Optional Configuration

If you need to customize, you can configure the following variables:

| Variable | Description | Default |
|----------|-------------|---------|
| `ENABLE_SEARCH` | Enable search functionality | `true` |
| `MCP_SERVER_PORT` | Service port | `3003` |

### Advanced Configuration

<details>
<summary>Click to expand complete environment variable list (usually no need to modify)</summary>

| Variable | Description | Default |
|----------|-------------|---------|
| `MCP_SANDBOX_PROVIDER` | Sandbox type | `SANDOCK` |
| `SANDOCK_API_URL` | Sandock service URL | `https://sandock.ai` |
| `MEILI_HTTP_ADDR` | MeiliSearch address | `http://meilisearch:7700` |
| `MEILI_MASTER_KEY` | MeiliSearch master key | - |
| `DAYTONA_API_KEY` | Daytona API Key (required when switching Provider) | - |
| `DAYTONA_API_URL` | Daytona service URL | - |
| `E2B_API_KEY` | E2B API Key (required when switching Provider) | - |

#### Sandbox Provider Options

- **SANDOCK** ⭐ - Default recommendation, lightweight Docker sandbox designed for AI Agents
- **LOCAL** - Direct local execution, no isolation (for development and testing)
- **DAYTONA** - Cloud development environment (team collaboration)
- **E2B** - Code interpreter sandbox (specific scenarios)

</details>

### Configuration Files

- `.env` - Main configuration file (copy from `.env.example`)
- `.env.local` - Local override configuration (not committed to Git)

All environment variables are managed centrally through `src/shared/config/environment.ts`.

---

**Happy coding! 🚀**

For questions or issues, please [open an issue](https://github.com/toolsdk-ai/awesome-mcp-registry/issues) or join our community discussions.