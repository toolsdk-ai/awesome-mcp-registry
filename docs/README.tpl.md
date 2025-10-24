<div align="center">

# Awesome MCP Registry

**Your private, secure, and customizable MCP Registry — take full control of your tools.**

[![Product Hunt](https://api.producthunt.com/widgets/embed-image/v1/top-post-badge.svg?post_id=997428&theme=light&period=daily)](https://www.producthunt.com/products/toolsdk-ai)

![How many MCP Servers in Awesome MCP Registry](https://img.shields.io/badge/MCP_Servers-<%= COUNT %>-blue)
![awesome-mcp-registry License](https://img.shields.io/badge/LICENSE-MIT-ff69b4)

🚀 **Open-source**, **production-ready**, and **developer-friendly** registry for <%= COUNT %>+ Model Context Protocol (MCP) servers, plugins, and AI agent tools.

Perfect for **AI automation**, **chatbot development**, **LLM integrations**, and **enterprise AI deployments**.

---

</div>

## 🌟 Why Awesome MCP Registry?

**Awesome MCP Registry** is the most comprehensive, self-hosted registry for Model Context Protocol (MCP) servers and AI agent tools. Built for developers, teams, and enterprises who need full control over their AI infrastructure.

### 🎯 Key Features

- 🔐 **Private & Self-Hosted** - Deploy your own secure MCP registry with Docker in minutes
- 🤖 **<%= COUNT %>+ AI Tools** - Largest curated collection of MCP servers for Claude, LLMs, and AI agents
- ⚡ **Remote Execution** - Run MCP tools in isolated sandbox environments via REST API
- 🔍 **Powerful Search** - Fast, full-text search powered by Meilisearch
- 📦 **NPM Integration** - Use as a TypeScript/Node.js SDK in your projects
- 🛠️ **Developer-Friendly** - OpenAPI/Swagger documentation, structured JSON configs
- 🐳 **Docker Ready** - Production-grade deployment with Docker Compose
- 🔌 **Plugin System** - Extensible architecture for custom integrations

### 💡 Use Cases

- 🏢 **Enterprise AI Teams** - Deploy private MCP registry for your organization
- 🤖 **AI Agent Development** - Build and test AI agents with verified MCP tools
- 💬 **Chatbot Builders** - Integrate LLM-powered chatbots with MCP servers
- 🔧 **Developer Tools** - Access automation tools, APIs, and integrations
- 🚀 **CI/CD Automation** - Execute MCP tools in your deployment pipelines

---

## 📦 What You Get

This open-source registry provides:

- 📚 **Structured Database** - <%= COUNT %>+ validated MCP servers with metadata
- 🔗 **Multiple Formats** - JSON, npm package, and generated documentation
- 🌐 **REST API** - Query and execute tools remotely
- 📖 **Auto-Generated Docs** - Always up-to-date README and API documentation

**Available as:**

- 📄 `README.md` - Human-readable documentation
- 📦 [npm package](https://www.npmjs.com/package/@toolsdk.ai/registry) - TypeScript/JavaScript SDK
- 🔗 [packages-list.json](https://toolsdk-ai.github.io/awesome-mcp-registry/indexes/packages-list.json) - Raw data API  

---

## 📚 Table of Contents

- [🎥 Video: How to submit a MCP server in JSON file?](https://www.youtube.com/watch?v=J_oaDtCoVVo)
- [🚀 Quick Start](#quick-start)
  - [🐳 Docker Self-Hosting](#-docker-self-hosting)
  - [📦 Install via Package Manager](#install-via-package-manager)
  - [📄 Submit New MCP Servers](#submit-new-mcp-servers)
- [📖 Development Guide](./docs/DEVELOPMENT.md)
- [🤝 Contributing Guide](./docs/guide.md)
- [⭐ Awesome MCP Servers](#mcp-servers)

<%= TOC %>

<a id="quick-start"></a>

## 🚀 Quick Start

### 🐳 Self-Hosted MCP Registry with Docker

Deploy your own **private MCP registry** in 5 minutes! Get a production-ready AI agent tool registry with full-text search, REST API, and secure sandbox execution.

Perfect for **AI developers**, **LLM teams**, and **enterprises** building with Claude, Anthropic, and other AI platforms.

#### ⚡ Quick Deploy (2 Steps)

**Step 1: Configure Sandbox Environment**

- Get your Sandock API Key from https://sandock.ai (for secure remote code execution)
- Edit `.env` and set: `SANDOCK_API_KEY=your-api-key-here`

**Step 2: Launch with Docker Compose**

```bash
docker compose up -d
```

That's it! Your self-hosted MCP registry is now running with:
- 🔍 **Full-text search** (Meilisearch)
- 🌐 **REST API** with OpenAPI documentation
- 🛡️ **Sandbox execution** for AI agent tools

#### 🎉 Access Your Private AI Tool Registry

- 🌐 **Web Interface**: http://localhost:3003
- 📚 **Swagger API Docs**: http://localhost:3003/swagger  
- 🔍 **Search & Execute** <%= COUNT %>+ MCP tools remotely
- 🤖 **Integrate** with your AI agents, chatbots, and LLM applications

#### 💻 Remote Tool Execution Example

Execute any MCP tool via REST API - perfect for AI automation, chatbot integrations, and serverless deployments:

```bash
curl -X POST http://localhost:3003/api/v1/packages/run \
  -H "Content-Type: application/json" \
  -d '{
    "packageName": "@modelcontextprotocol/server-everything",
    "toolKey": "echo",
    "inputData": {
      "message": "Hello from Awesome MCP Registry!"
    },
    "envs": {}
  }'
```

**Use Cases:**
- 🤖 Build AI agents with remote tool execution
- 💬 Power chatbots with MCP server integrations
- 🚀 Create serverless AI workflows
- 🔧 Automate tasks with LLM-powered tools

> 📖 For advanced deployment options and configuration, see the [DEVELOPMENT documentation](./docs/DEVELOPMENT.md#4--quick-start-with-docker).

<a id="install-via-package-manager"></a>

### 📦 Install as NPM Package (TypeScript/Node.js SDK)

Use the MCP Registry as a TypeScript/JavaScript SDK in your AI agent, chatbot, or LLM integration projects:

```bash
npm install @toolsdk.ai/registry
```

#### Use in TypeScript/JavaScript Projects

Perfect for AI agent development, chatbot builders, and LLM tool integrations:

```ts
import mcpServerLists from '@toolsdk.ai/registry/indexes/packages-lists.json';
```

#### 🌐 Access via Public API (No Installation Required)

Fetch the complete MCP server registry programmatically - ideal for AI applications, integrations, and automation:

```bash
curl https://toolsdk-ai.github.io/awesome-mcp-registry/indexes/packages-list.json
```

```ts
// JavaScript/TypeScript - Fetch API
const mcpServers = await (
  await fetch('https://toolsdk-ai.github.io/awesome-mcp-registry/indexes/packages-list.json')
).json();

// Use for AI agent tool discovery, LLM integrations, etc.
console.log(mcpServers);
```

```python
# Python - For AI/ML projects
import requests

mcp_servers = requests.get(
    'https://toolsdk-ai.github.io/awesome-mcp-registry/indexes/packages-list.json'
).json()

# Perfect for LangChain, CrewAI, AutoGen integrations
```

<a id="submit-new-mcp-servers"></a>

## 🤝 Contribute Your MCP Server

Help grow the world's largest open-source MCP registry! Share your AI tools, plugins, and integrations with the community.

### How to Submit

**1. Create JSON Config** - Simple, structured format:

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

**2. Submit via Pull Request**

- [Fork this repository](https://github.com/toolsdk-ai/awesome-mcp-registry/fork)
- Create `your-mcp-server.json` in [packages/uncategorized](./packages/uncategorized)
- Submit a PR and join <%= COUNT %>+ MCP servers!

**3. Get Discovered**

Your MCP server will be:
- ✅ Listed in the registry
- 🔍 Searchable via REST API
- 📦 Available in npm package
- 🌐 Featured on our website

📖 **Detailed Guide**: [Contributing Documentation](./docs/guide.md)

---

<a id="mcp-servers"></a>

## 📋 MCP Servers Directory

**<%= COUNT %>+ AI Agent Tools, LLM Integrations & Automation Servers**

- ✅ **Validated & Tested** (<%=VALIDATED_COUNT %>) - Production-ready MCP servers
- ⚙️ **Community Contributed** (<%=COUNT - VALIDATED_COUNT %>) - Requires configuration

Browse by category: Developer Tools, AI Agents, Databases, Cloud Platforms, APIs, and more!

<%= CONTENT %>
