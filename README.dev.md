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
│   ├── CODE-GUIDELINES.md         # Coding standards and best practices
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

For detailed coding guidelines, see [docs/CODE-GUIDELINES.md](./docs/CODE-GUIDELINES.md).

## 8. ⚙️ Environment Variables

The project uses the following environment variables, which can be configured in `.env` or `.env.local`:

### Core Settings

- `MCP_SERVER_PORT` / `PORT`: Server port (default: 3003)
- `NODE_ENV`: Environment mode (development / production)

### Search Service (Optional)

- `ENABLE_SEARCH`: Enable MeiliSearch integration (default: false)
- `MEILI_HTTP_ADDR`: MeiliSearch service address (default: http://localhost:7700)
- `MEILI_MASTER_KEY`: MeiliSearch master key (optional)

### Sandbox Providers (Optional)

- `MCP_SANDBOX_PROVIDER`: Sandbox provider to use (default: LOCAL)
  - `LOCAL` - Direct local execution (no sandbox)
  - `SANDOCK` - Sandock Docker sandbox
  - `DAYTONA` - Daytona cloud environments
  - `E2B` - E2B code interpreter

#### Sandock Configuration

- `SANDOCK_API_URL`: Sandock API endpoint (default: https://sandock.ai)
- `SANDOCK_API_KEY`: Sandock API key (required for Sandock provider)

#### Daytona Configuration

- `DAYTONA_API_URL`: Daytona API endpoint
- `DAYTONA_API_KEY`: Daytona API key (required for Daytona provider)

#### E2B Configuration

- `E2B_API_KEY`: E2B API key (required for E2B provider)

### Example Configuration

```env
MCP_SERVER_PORT=3003
NODE_ENV=development

# Search (optional)
ENABLE_SEARCH=true
MEILI_HTTP_ADDR=http://localhost:7700

# Sandbox (optional - uncomment to enable)
# MCP_SANDBOX_PROVIDER=SANDOCK
# SANDOCK_API_URL=https://sandock.ai
# SANDOCK_API_KEY=your_sandock_api_key_here
```

All environment variables are accessed through `src/shared/config/environment.ts` for type safety and validation.

## 9. 📝 Contribution Guide

For detailed information on how to contribute code to the project, add new MCP servers, etc., please refer to the [CONTRIBUTING.md](./CONTRIBUTING.md) file.

### Quick Contribution Checklist

Before submitting your code:

- [ ] Follow [CODE-GUIDELINES.md](./docs/CODE-GUIDELINES.md) coding standards
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