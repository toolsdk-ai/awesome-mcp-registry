# Installation Guide - Awesome MCP Registry

This guide will help you set up and run the Awesome MCP Registry project locally.

## Prerequisites

Before you begin, ensure you have the following installed on your system:

### Required Dependencies

1. **Node.js** (version 18 or higher)
   - Download from [nodejs.org](https://nodejs.org/)
   - Verify installation: `node --version`

2. **pnpm** (Package manager)
   - Install globally: `npm install -g pnpm`
   - Verify installation: `pnpm --version`

3. **Bun** (JavaScript runtime)
   - Install from [bun.sh](https://bun.sh/)
   - On macOS/Linux: `curl -fsSL https://bun.sh/install | bash`
   - On Windows: `powershell -c "irm bun.sh/install.ps1 | iex"`
   - Verify installation: `bun --version`

### Optional Dependencies

- **Git** - For cloning the repository
- **Make** - For running build commands (usually pre-installed on macOS/Linux)

## Common Issues and Solutions

### MCP Client Testing Errors During Build

During the build process, you might see many errors like:
```
Error reading MCP Client for package: claude-prompts... ENOENT: no such file or directory
```

**This is normal and expected!** These errors occur because:
- The registry contains thousands of MCP packages
- The build process attempts to test all packages by installing them locally
- Installing all packages would take hours and consume gigabytes of space
- Most packages aren't needed for running the registry

**Solutions:**

1. **Use Safe Build (Recommended):**
   ```bash
   make build-safe
   ```
   This skips MCP client testing and builds only essential functionality.

2. **Use Automated Installation:**
   ```bash
   ./install.sh
   ```
   The install script automatically handles this issue and uses safe build mode.

3. **If you see these errors,** the build will either:
   - ✅ Automatically skip testing (safe mode)
   - ✅ Complete successfully despite warnings
   - ✅ Provide clear fallback instructions

To run full validation later (for development):
```bash
bun scripts/test-mcp-clients.ts
```

## Installation Steps

### 1. Clone the Repository

```bash
git clone https://github.com/toolsdk-ai/awesome-mcp-registry.git
cd awesome-mcp-registry
```

### 2. Install Dependencies

```bash
pnpm install
```

This will install all required npm packages as defined in `package.json`.

### 3. Build the Project

#### Option A: Safe Build (Recommended)
```bash
make build-safe
```

#### Option B: Full Build (For Development)
```bash
make build
```

**Safe build** will complete without MCP client testing errors.
**Full build** includes MCP client testing which may take hours.

Or run the build steps manually:

```bash
# Generate directory catalogs
bun scripts/cat-dirs.ts

# Install dependencies (if package.json was updated)
pnpm install --no-frozen-lockfile

# Generate package indexes
bun scripts/indexing-lists.ts

# Validate configurations
bun scripts/check-config.ts

# Install any new dependencies
pnpm install --no-frozen-lockfile

# Test MCP clients
bun scripts/test-mcp-clients.ts

# Generate README from templates
bun scripts/readme-gen.ts

# Run linting
pnpm run lint

# Compile TypeScript
pnpm run build
```

## Running the Application

### Development Mode

1. **Start the CLI Generator API Server:**
   ```bash
   pnpm run server
   ```
   This starts the API server defined in `api/cli-generator.js`.

2. **Build and Generate Files:**
   ```bash
   make build
   ```
   This runs the complete build pipeline to generate all indexes and documentation.

### Available Commands

| Command | Description |
|---------|-------------|
| `pnpm run build` | Compile TypeScript to `dist/` directory |
| `pnpm run lint` | Run ESLint on TypeScript files |
| `pnpm run server` | Start the CLI generator API server |
| `make build` | Run complete build pipeline |
| `bun scripts/indexing-lists.ts` | Generate package index files |
| `bun scripts/readme-gen.ts` | Generate README from templates |
| `bun scripts/check-config.ts` | Validate all configuration files |

## Project Structure

```
awesome-mcp-registry/
├── api/                    # API server files
├── config/                 # Configuration files
├── docs/                   # Documentation
├── indexes/                # Generated index files
├── packages/               # MCP server packages (categorized)
├── scripts/                # Build and utility scripts
├── src/                    # TypeScript source files
├── Dockerfile             # Docker configuration
├── Makefile              # Build automation
├── package.json          # Node.js dependencies and scripts
└── README.md             # Generated documentation
```

## Usage as a Package

The registry can also be used as an npm package in other projects:

### Installation

```bash
npm install @toolsdk.ai/registry
```

### Import in TypeScript/JavaScript

```typescript
import mcpServerLists from '@toolsdk.ai/registry/indexes/packages-lists.json';
import { McpServer } from '@toolsdk.ai/registry/types';

// Use the imported data
console.log(mcpServerLists);
```

### Fetch via API

```bash
curl https://toolsdk-ai.github.io/awesome-mcp-registry/indexes/packages-list.json
```

```javascript
// Fetch in JavaScript
const data = await fetch('https://toolsdk-ai.github.io/awesome-mcp-registry/indexes/packages-list.json');
const mcpServers = await data.json();
```

## Development Workflow

### Adding New MCP Servers

1. Navigate to the appropriate category in `packages/`
2. Create a new JSON file following the schema in `src/types.ts`
3. Run `make build` to validate and regenerate indexes
4. Submit a pull request

### Example MCP Server Configuration

```json
{
  "type": "mcp-server",
  "name": "GitHub",
  "packageName": "@modelcontextprotocol/server-github",
  "description": "MCP server for using the GitHub API",
  "url": "https://github.com/modelcontextprotocol/servers/blob/main/src/github",
  "runtime": "node",
  "license": "MIT",
  "env": {
    "GITHUB_PERSONAL_ACCESS_TOKEN": {
      "description": "Personal access token for GitHub API access",
      "required": true
    }
  }
}
```

## Docker Support

You can also run the project using Docker:

```bash
# Build the Docker image
docker build -t awesome-mcp-registry .

# Run the container
docker run -p 3000:3000 awesome-mcp-registry
```

## Troubleshooting

### Common Issues

1. **Bun not found error:**
   - Ensure Bun is installed and in your PATH
   - Restart your terminal after installation

2. **pnpm command not found:**
   - Install pnpm globally: `npm install -g pnpm`

3. **TypeScript compilation errors:**
   - Run `pnpm install` to ensure all dependencies are installed
   - Check that TypeScript version is compatible

4. **Make command not found (Windows):**
   - Install make via chocolatey: `choco install make`
   - Or run the build steps manually as shown above

### Getting Help

- Check the [Contributing Guide](./docs/guide.md)
- Open an issue on the GitHub repository
- Review the project documentation in the `docs/` directory

## Verification

After installation, verify everything works by running:

```bash
# Test the build process
make build

# Check if indexes were generated
ls -la indexes/

# Verify TypeScript compilation
ls -la dist/
```

You should see generated files in both `indexes/` and `dist/` directories if everything is set up correctly.