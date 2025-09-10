<div align="center">

# Awesome MCP Registry

**Your private, secure, and customizable MCP Registry — take full control of your tools.**

[![Product Hunt](https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=997428&theme=light&period=daily)](https://www.producthunt.com/products/toolsdk-ai)

![How many MCP Servers in Awesome MCP Registry](https://img.shields.io/badge/MCP_Servers-<%= COUNT %>-blue)
![awesome-mcp-registry License](https://img.shields.io/badge/LICENSE-MIT-ff69b4)

An open, high-quality, well-structured and developer-friendly list of <%= COUNT %>+ MCP servers.

---

</div>

The **Awesome MCP Registry** acts as a central database for MCP servers and packages.  

You can use it to:

- ⚡ Build and host your own MCP projects with ease  
- 🔒 Deploy a fully **private registry** for your team or organization  
- 🛠️ Maintain complete control of your MCP tools in a secure environment  

This registry leverages structured JSON configs to generate:  

- `README.md`  
- [npm package](https://www.npmjs.com/package/@toolsdk.ai/registry)  
- [packages-list.json](https://toolsdk-ai.github.io/awesome-mcp-registry/indexes/packages-list.json)  

---

- [Video: How to submit a MCP server in JSON file?](https://www.youtube.com/watch?v=J_oaDtCoVVo)
- [Quick Start](#quick-start)
- [Contributing Guide](./docs/guide.md)
- [Awesome MCP Servers](#mcp-servers)
<%= TOC %>

<a id="quick-start"></a>

## 🚀 Quick Start

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

## 📦 Submit new MCP servers:

```json
{
  "type": "mcp-server",
  "name": "Github",
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

## MCP Servers

✅: Validated and runnable tools (<%=VALIDATED_COUNT %>)

❌: Cannot be run by the MCP client (with mock environments variables (<%=COUNT - VALIDATED_COUNT %>))

<%= CONTENT %>
