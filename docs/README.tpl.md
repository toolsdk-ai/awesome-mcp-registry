# Awesome MCP Registry

Welcome to the Awesome MCP Registry, your go-to open and structured registry for MCP servers and packages.

Unlike other MCP projects, this `Awesome MCP Registry` leverages structured JSON configs to generate `README.md`, [npm package](https://www.npmjs.com/package/@toolsdk.ai/registry) and [packages-list.json](https://toolsdk-ai.github.io/awesome-mcp-registry/indexes/packages-list.json)

You can use the `Awesome MCP Registry` to build your own great MCP projects and hosting sites, acting as the database for MCP servers and packages.

## Quick Start

Install via package manager:

```bash
npm install @toolsdk.ai/registry
```

Use it on your JavaScript / Typescript project:

```ts
import mcpServerLists from '@toolsdk.ai/registry/indexes/packages-lists.json';
```

Fetch all the lists via cURL:

```bash
curl https://toolsdk-ai.github.io/awesome-mcp-registry/indexes/packages-list.json
```

# MCP Servers

<%= CONTENT %>
