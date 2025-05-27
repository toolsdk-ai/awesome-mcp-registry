# Awesome MCP Registry

![How many MCP Servers in Awesome MCP Registry](https://img.shields.io/badge/MCP_Servers-<%= COUNT %>-blue)
![awesome-mcp-registry License](https://img.shields.io/badge/LICENSE-MIT-ff69b4)


Welcome to the Awesome MCP Registry.

An open, high-quality, well-structured and developer-friendly list of <%= COUNT %>+ MCP servers.



- [Video: How to submit a MCP server in JSON file?](https://www.youtube.com/watch?v=J_oaDtCoVVo)
- [Quick Start](#quick-start)
- [Contributing Guide](./docs/guide.md)
- [Awesome MCP Servers](#mcp-servers)
<%= TOC %>

Unlike other MCP projects, this `Awesome MCP Registry` leverages structured JSON configs to generate `README.md`, [npm package](https://www.npmjs.com/package/@toolsdk.ai/registry) and [packages-list.json](https://toolsdk-ai.github.io/awesome-mcp-registry/indexes/packages-list.json)

You can use the `Awesome MCP Registry` to build your own great MCP projects and hosting sites, acting as the database for MCP servers and packages.


<a id="quick-start"></a>

## Quick Start

#### Install via package manager:

```bash
npm install @toolsdk.ai/registry
```

#### Use it on your JavaScript / Typescript project:

```ts
import mcpServerLists from '@toolsdk.ai/registry/indexes/packages-lists.json';
```

#### Fetch all MCP Servers lists via cURL:

```bash
curl https://toolsdk-ai.github.io/awesome-mcp-registry/indexes/packages-list.json
```

```ts
// JavaScript TypeScript
console.log(await(await fetch('https://toolsdk-ai.github.io/awesome-mcp-registry/indexes/packages-list.json')).json());
```

#### Submit new MCP servers:

```json
{
  "type": "mcp-server",
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

[Fork this repo](https://github.com/toolsdk-ai/awesome-mcp-registry/fork), and create a new file called `your-new-mcp-server.json` under [packages/uncategorized](./packages/uncategorized) folder.

For more detail please see [the guide](./docs/guide.md).

# MCP Servers

✅: Validated and runnable tools
❌: Cannot be run by the MCP client (with mock environments variables)

<%= CONTENT %>
