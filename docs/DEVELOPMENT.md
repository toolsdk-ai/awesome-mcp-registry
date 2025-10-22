# Awesome MCP Registry Developer Guide

This document provides developers with detailed information on how to set up, run, and develop the Awesome MCP Registry project.

- [Awesome MCP Registry Developer Guide](#awesome-mcp-registry-developer-guide)
  - [1. 🧰 Prerequisites](#1--prerequisites)
  - [2. 🧰 Tech Stack](#2--tech-stack)
  - [3. 🎯 Project Purpose](#3--project-purpose)
  - [4. 🚀 Quick Start](#4--quick-start)
    - [4.1 Install Dependencies](#41-install-dependencies)
    - [4.2 Build Project](#42-build-project)
    - [4.3 Start Development Server (Without Search Function)](#43-start-development-server-without-search-function)
    - [4.4 Start Development Server (With Search Function)](#44-start-development-server-with-search-function)
  - [5. 🐳 Docker Usage](#5--docker-usage)
    - [5.1 Quick Start (5 Minutes)](#51-quick-start-5-minutes)
    - [5.2 Verify Deployment](#52-verify-deployment)
    - [5.3 API Usage Examples](#53-api-usage-examples)
    - [5.4 Managing Services](#54-managing-services)
    - [5.5 Troubleshooting](#55-troubleshooting)
  - [6. 🛠 Common Issues and Troubleshooting](#6--common-issues-and-troubleshooting)
    - [6.1 MCP Client Test Errors During Build Process](#61-mcp-client-test-errors-during-build-process)
  - [7. 🗃️ Project Structure](#7-️-project-structure)
  - [8. ⚙️ Environment Variables](#8-️-environment-variables)
  - [9. 📝 Contribution Guide](#9--contribution-guide)

## 1. 🧰 Prerequisites

Before you begin, ensure your development environment meets the following requirements:

- **Node.js** >= 18.x (latest LTS version recommended)
- **pnpm** >= 8.x (package manager)
- **Docker** (optional, required only if search functionality is needed)

## 2. 🧰 Tech Stack

- **Runtime Environment**: Node.js (ESM modules)
- **Package Manager**: pnpm
- **Language**: TypeScript
- **Web Framework**: Hono.js + OpenAPI (Zod)
- **Architecture**: Domain-Driven Design (DDD) + Service Object Pattern
- **Search Service**: MeiliSearch (optional)
- **Sandbox Providers**: LOCAL / Sandock / Daytona / E2B (optional)
- **Build Tool**: TypeScript Compiler (tsc)
- **Code Formatting**: Biome
- **Testing**: Vitest

## 3. 🎯 Project Purpose

This project has two main purposes:

1. **MCP Registry** - Collects and indexes various MCP servers, providing search functionality
2. **MCP Server** - Deployed as a server to remotely call various MCP servers

### Key Features:

- 📦 **Package Management** - Registry of 4000+ MCP servers with metadata and validation
- 🔍 **Search Service** - Full-text search powered by MeiliSearch (optional)
- 🛡️ **Sandbox Execution** - Secure MCP tool execution in isolated environments:
  - **LOCAL** - Direct local execution (default)
  - **Sandock** - Lightweight Docker sandbox for AI agents
  - **Daytona** - Cloud development environments
  - **E2B** - Code interpreter sandbox
- 🌐 **RESTful API** - Complete API with OpenAPI/Swagger documentation
- ⚡ **Performance** - Async execution with connection pooling

Additionally, we have deployed a website [ToolSDK.ai](https://toolsdk.ai) that can search for and run MCP Servers. We also provide a tool called `toolsdk` to help integrate these MCP Servers.

## 4. 🚀 Quick Start

### 4.1 Install Dependencies

```bash
pnpm install
```

### 4.2 Build Project

```bash
make build
```

This will perform the following operations:
- Validate all MCP server configurations
- Install all necessary dependencies
- Build TypeScript code

### 4.3 Start Development Server (Without Search Function)

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

### 4.4 Start Development Server (With Search Function)

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

## 5. 🐳 Docker Usage

Docker Compose allows you to quickly deploy the complete MCP Registry with search functionality and SANDOCK remote execution environment.

### 5.1 Quick Start (5 Minutes)

**Step 1: Clone the Repository**

```bash
git clone https://github.com/petercat-ai/awesome-mcp-registry.git
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
docker-compose up -d
```

This will start two services:
- `mcp-registry` - MCP Registry main application (port 3003)
- `meilisearch` - Search engine service (port 7700)

**Step 5: Initialize Search Index**

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

### 5.2 Verify Deployment

Check service status:

```bash
# View running containers
docker-compose ps

# View application logs
docker-compose logs -f mcp-registry

# Test if API is working
curl http://localhost:3003/api/v1/health
```

Expected output:

```json
{
  "status": "ok",
  "timestamp": "2025-10-22T10:30:00.000Z"
}
```

### 5.3 API Usage Examples

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

### 5.4 Managing Services

```bash
# Stop services
docker-compose down

# Stop and remove data volumes
docker-compose down -v

# Restart services
docker-compose restart

# View logs
docker-compose logs -f

# Rebuild images
docker-compose build --no-cache
```

### 5.5 Troubleshooting

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
- Restart services: `docker-compose restart`

**Issue 3: Search Function Unavailable**

```bash
# Check if MeiliSearch is running
docker-compose ps meilisearch

# Reinitialize indexes
curl -X POST http://localhost:3003/api/v1/search/manage/init
curl -X POST http://localhost:3003/api/v1/search/manage/index
```

**Issue 4: Long Build Time**

First build may take 10-15 minutes, which is normal. The Dockerfile needs to:
- Install Python 3.13 and pyenv
- Install Node.js dependencies (4000+ packages)
- Install Python dependencies
- Build TypeScript code

Subsequent builds will be much faster using Docker cache.

## 6. 🛠 Common Issues and Troubleshooting

### 6.1 MCP Client Test Errors During Build Process

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

## 7. 🗃️ Project Structure

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

## 8. ⚙️ Environment Variables

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

## 9. 📝 Contribution Guide

For detailed information on how to contribute code to the project, add new MCP servers, etc., please refer to the [CONTRIBUTING.md](../CONTRIBUTING.md) file.

### Quick Contribution Checklist

Before submitting your code:

- [ ] Run `pnpm run check` (linting and formatting)
- [ ] Run `pnpm run test` (all tests pass)
- [ ] Update documentation if needed
- [ ] Add tests for new features
- [ ] Use conventional commit messages

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes following the coding guidelines
4. Test your changes: `pnpm run test`
5. Commit your changes: `git commit -m "feat: add new feature"`
6. Push to your fork: `git push origin feature/your-feature`
7. Create a Pull Request

---

**Happy coding! 🚀**

For questions or issues, please [open an issue](https://github.com/petercat-ai/awesome-mcp-registry/issues) or join our community discussions.