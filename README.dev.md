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
    - [5.1 Running with Docker (Without Search Function)](#51-running-with-docker-without-search-function)
    - [5.2 Running with Docker (With Search Function)](#52-running-with-docker-with-search-function)
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
- **Web Framework**: Hono.js
- **Search Service**: MeiliSearch (optional)
- **Build Tool**: TypeScript Compiler (tsc)
- **Code Formatting**: Biome
- **Testing**: Vitest

## 3. 🎯 Project Purpose

This project has two main purposes:

1. **MCP Registry** - Collects and indexes various MCP servers, providing search functionality
2. **MCP Server** - Deployed as a server to remotely call various MCP servers

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

### 5.1 Running with Docker (Without Search Function)

```bash
# Build image
make docker-build

# Run container (ensure ENABLE_SEARCH=false)
make docker-run

# Visit http://localhost:3003
```

### 5.2 Running with Docker (With Search Function)

```bash
# Set ENABLE_SEARCH=true in .env
# Start MeiliSearch
make db

# Build and run the main application
make docker-build
make docker-run

# Visit http://localhost:3003 to use search functionality and API interfaces
```

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

```
.
├── config/     # Configuration files
├── indexes/    # Generated index files
├── packages/   # MCP server configuration files (categorized)
├── scripts/    # Build and maintenance scripts
└── src/        # Source code
    ├── api/    # API routes and server entry points
    └── search/ # Search service
```

## 8. ⚙️ Environment Variables

The project uses the following environment variables, which can be configured in `.env` or `.env.local`:

- `MCP_SERVER_PORT`: Server port (default: 3003)
- `ENABLE_SEARCH`: Whether to enable search service (default: false)
- `MEILI_HTTP_ADDR`: MeiliSearch service address (default: http://localhost:7700)

## 9. 📝 Contribution Guide

For detailed information on how to contribute code to the project, add new MCP servers, etc., please refer to the [CONTRIBUTING.md](./CONTRIBUTING.md) file.