# Awesome MCP Registry

![How many MCP Servers in Awesome MCP Registry](https://img.shields.io/badge/MCP_Servers-62-blue)
![awesome-mcp-registry License](https://img.shields.io/badge/LICENSE-MIT-ff69b4)


Welcome to the Awesome MCP Registry.

An open, high-quality, well-structured and developer-friendly list of 62+ MCP servers.



- [Awesome MCP Registry](#awesome-mcp-registry)
  - [Quick Start](#quick-start)
      - [Install via package manager:](#install-via-package-manager)
      - [Use it on your JavaScript / Typescript project:](#use-it-on-your-javascript--typescript-project)
      - [Fetch all MCP Servers lists via cURL:](#fetch-all-mcp-servers-lists-via-curl)
      - [Submit new MCP servers:](#submit-new-mcp-servers)
- [MCP Servers](#mcp-servers)
  - [Aggregators](#aggregators)
  - [Art \& Culture](#art--culture)
  - [Browser Automation](#browser-automation)
  - [Cloud Platforms](#cloud-platforms)
  - [Code Execution](#code-execution)
  - [Command Line](#command-line)
  - [Communication](#communication)
  - [Databases](#databases)
  - [Data Platforms](#data-platforms)
  - [Developer Tools](#developer-tools)
  - [Data Science Tools](#data-science-tools)
  - [File Systems](#file-systems)
  - [Knowledge \& Memory](#knowledge--memory)
  - [Location Services](#location-services)
  - [Monitoring](#monitoring)
  - [Search \& Data Extraction](#search--data-extraction)
  - [Version Control](#version-control)
  - [Other Tools and Integrations](#other-tools-and-integrations)


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
  "name": "@modelcontextprotocol/server-github",
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



<a id="aggregators"></a>
## Aggregators

Servers that let you access multiple apps and tools through one MCP server.

- [@modelcontextprotocol/server-everything](https://github.com/modelcontextprotocol/servers/blob/main/src/everything): This MCP server attempts to exercise all the features of the MCP protocol. It is not intended to be a useful server, but rather a test server for builders of MCP clients. It implements prompts, tools, resources, sampling, and more to showcase MCP capabilities.


<a id="art-and-culture"></a>
## Art & Culture

Explore art collections, museums, and cultural heritage with AI-friendly tools.

- [@modelcontextprotocol/server-everart](https://github.com/modelcontextprotocol/servers/blob/main/src/everart): MCP server for EverArt API integration
- [mcp-server-stability-ai](https://github.com/tadasant/mcp-server-stability-ai): Integrates Stability AI's image generation and manipulation capabilities for editing, upscaling, and more via Stable Diffusion models.


<a id="browser-automation"></a>
## Browser Automation

Tools for browsing, scraping, and automating web content in AI-compatible formats.

- [@automatalabs/mcp-server-playwright](https://github.com/Automata-Labs-team/MCP-Server-Playwright/tree/main): MCP server for browser automation using Playwright
- [@modelcontextprotocol/server-puppeteer](https://github.com/modelcontextprotocol/servers/blob/main/src/puppeteer): MCP server for browser automation using Puppeteer
- [@executeautomation/playwright-mcp-server](https://github.com/executeautomation/mcp-playwright/tree/main/src): A Model Context Protocol server for Playwright for Browser Automation and Web Scraping.
- [hyperbrowser-mcp](https://github.com/hyperbrowserai/mcp/tree/main): An MCP server for Hyperbrowser - Hyperbrowser is the next-generation platform empowering AI agents and enabling effortless, scalable browser automation
- [mcp-server-fetch](https://github.com/modelcontextprotocol/servers/blob/main/src/fetch): A Model Context Protocol server providing tools to fetch and convert web content for usage by LLMs


<a id="cloud-platforms"></a>
## Cloud Platforms

Integrate with cloud services to manage and interact with cloud infrastructure.

- [@cloudflare/mcp-server-cloudflare](https://github.com/cloudflare/mcp-server-cloudflare): MCP server for interacting with Cloudflare API
- [@strowk/mcp-k8s](https://github.com/strowk/mcp-k8s-go): MCP server connecting to Kubernetes
- [kubernetes-mcp-server](https://github.com/manusa/kubernetes-mcp-server): Powerful and flexible Kubernetes MCP server implementation with additional features for OpenShift. Besides the typical CRUD operations on any Kubernetes resource, this implementation adds specialized features for Pods and other resources.
- [mcp-server-kubernetes](https://github.com/Flux159/mcp-server-kubernetes): MCP server for managing Kubernetes clusters, enabling LLMs to interact with and control Kubernetes resources.


<a id="code-execution"></a>
## Code Execution

Run code securely, perfect for coding agents and AI-driven programming tasks.

- [mcp-server-make](https://github.com/wrale/mcp-server-make): A Model Context Protocol server that provides make target calling functionality. This server enables LLMs to execute make targets from a specified Makefile within a specified working directory.


<a id="command-line"></a>
## Command Line

Run shell commands and interact with command-line tools easily.

- [mcp-shell](https://github.com/hdresearch/mcp-shell): An MCP server for your shell
- [mcp-server-commands](https://github.com/g0t4/mcp-server-commands): MCP server enabling LLMs to execute shell commands and run scripts through various interpreters with built-in safety controls.


<a id="communication"></a>
## Communication

Connect with messaging platforms to manage chats and interact with team tools.

- [@modelcontextprotocol/server-slack](https://github.com/modelcontextprotocol/servers/blob/main/src/slack): MCP server for interacting with Slack
- [@enescinar/twitter-mcp](https://github.com/EnesCinr/twitter-mcp): This MCP server allows Clients to interact with Twitter, enabling posting tweets and searching Twitter.
- [@gongrzhe/server-gmail-autoauth-mcp](https://github.com/gongrzhe/server-gmail-autoauth-mcp): Gmail MCP server with auto authentication support


<a id="databases"></a>
## Databases

Securely access and query databases with options for read-only permissions.

- [airtable-mcp-server](https://github.com/domdomegg/airtable-mcp-server): Airtable database integration with schema inspection, read and write capabilities
- [@benborla29/mcp-server-mysql](https://github.com/benborla/mcp-server-mysql): An MCP server for interacting with MySQL databases
- [@niledatabase/nile-mcp-server](https://github.com/niledatabase/nile-mcp-server/tree/main): MCP server for Nile Database - Manage and query databases, tenants, users, auth using LLMs
- [mcp-server-sqlite](https://github.com/modelcontextprotocol/servers/blob/main/src/sqlite): A simple SQLite MCP server
- [mcp-mongo-server](https://github.com/kiliczsh/mcp-mongo-server): A Model Context Protocol Server for MongoDB
- [@modelcontextprotocol/server-postgres](https://github.com/modelcontextprotocol/servers/blob/main/src/postgres): MCP server for interacting with PostgreSQL databases


<a id="data-platforms"></a>
## Data Platforms

Tools for integrating, transforming, and managing data pipelines.

- [mcp-tinybird](https://github.com/tinybirdco/mcp-tinybird/tree/main/src/mcp-tinybird): A Model Context Protocol server that lets you interact with a Tinybird Workspace from any MCP client.


<a id="developer-tools"></a>
## Developer Tools

Enhance your development workflow with tools for coding and environment management.

- [@mcp-get-community/server-macos](https://github.com/mcp-get/community-servers/blob/main/src/server-macos): MCP server for macOS system operations
- [mcp-server-aidd](https://github.com/skydeckai/mcp-server-aidd): An MCP server that provides a comprehensive set of tools for AI-driven development workflows. Features include file system operations, code analysis using tree-sitter for multiple programming languages, Git operations, code execution, and system information retrieval. Designed to enhance AI's capability to assist in software development tasks.
- [mcp-server-tree-sitter](https://github.com/wrale/mcp-server-tree-sitter): A Model Context Protocol server that provides code analysis capabilities using tree-sitter. This server enables LLMs to explore, search, and analyze code with appropriate context management.
- [@mcp-get-community/server-llm-txt](https://github.com/mcp-get/community-servers/blob/main/src/server-llm-txt): MCP server that extracts and serves context from llm.txt files, enabling AI models to understand file structure, dependencies, and code relationships in development environments
- [@llmindset/mcp-hfspace](https://github.com/evalstate/mcp-hfspace/): MCP Server for using HuggingFace Spaces. Seamlessly use the latest Open Source Image, Audio and Text Models from within Claude Deskop.
- [awslabs.nova-canvas-mcp-server](https://github.com/awslabs/mcp/tree/main/src/nova-canvas-mcp-server): A Model Context Protocol server that lets you interact with a Nova Canvas from any MCP client.
- [hackmd-mcp](https://github.com/yuna0x0/hackmd-mcp): A Model Context Protocol server for integrating HackMD's note-taking platform with AI assistants
- [mcp-openapi-schema-explorer](https://github.com/kadykov/mcp-openapi-schema-explorer): MCP server providing token-efficient access to OpenAPI/Swagger specs via MCP Resources for client-side exploration.
- [docker-mcp](https://github.com/QuantGeekDev/docker-mcp): A powerful Model Context Protocol (MCP) server for Docker operations, enabling seamless container and compose stack management through Claude AI


<a id="data-science-tools"></a>
## Data Science Tools

Simplify data analysis and exploration with tools for data science workflows.

- [mcp-solver](https://github.com/szeider/mcp-solver): MCP server for Constraint Solving and Optimization


<a id="file-systems"></a>
## File Systems

Manage files and directories with tools for reading, writing, and organizing files.

- [@modelcontextprotocol/server-gdrive](https://github.com/modelcontextprotocol/servers/blob/main/src/gdrive): MCP server for interacting with Google Drive
- [@modelcontextprotocol/server-filesystem](https://github.com/modelcontextprotocol/servers): MCP server for filesystem access


<a id="knowledge-memory"></a>
## Knowledge & Memory

Store and query structured information for AI models to use across sessions.

- [mcp-server-rememberizer](https://github.com/skydeckai/mcp-server-rememberizer): An MCP server for interacting with Rememberizer's document and knowledge management API. This server enables Large Language Models to search, retrieve, and manage documents and integrations through Rememberizer.
- [mcp-rememberizer-vectordb](https://github.com/skydeckai/mcp-rememberizer-vectordb): A Model Context Protocol server for LLMs to interact with Rememberizer Vector Store.
- [@modelcontextprotocol/server-memory](https://github.com/modelcontextprotocol/servers/blob/main/src/memory): MCP server for enabling memory for Claude through a knowledge graph


<a id="location-services"></a>
## Location Services

Work with maps, weather, and location-based data for analytics and insights.

- [@modelcontextprotocol/server-google-maps](https://github.com/modelcontextprotocol/servers/blob/main/src/google-maps): MCP server for using the Google Maps API


<a id="monitoring"></a>
## Monitoring

Analyze app performance and error reports with monitoring tools.

- [mcp-server-sentry](https://github.com/modelcontextprotocol/servers/blob/main/src/sentry): MCP server for retrieving issues from sentry.io
- [@raygun.io/mcp-server-raygun](https://github.com/MindscapeHQ/mcp-server-raygun): MCP server for interacting with Raygun's API for crash reporting and real user monitoring metrics


<a id="search-data-extraction"></a>
## Search & Data Extraction

Find and extract data from various sources quickly and efficiently.

- [mcp-server-perplexity](https://github.com/tanigami/mcp-server-perplexity): MCP Server for the Perplexity API
- [@modelcontextprotocol/server-brave-search](https://github.com/modelcontextprotocol/servers/blob/main/src/brave-search): MCP server for Brave Search API integration
- [@modelcontextprotocol/server-aws-kb-retrieval](https://github.com/modelcontextprotocol/servers/blob/main/src/aws-kb-retrieval-server): MCP server for AWS Knowledge Base retrieval using Bedrock Agent Runtime
- [graphlit-mcp-server](https://github.com/graphlit/graphlit-mcp-server): Graphlit MCP Server for AI, RAG, OpenAI, PDF parsing and preprocessing
- [@chanmeng666/google-news-server](https://github.com/ChanMeng666/server-google-news): MCP server for Google News search via SerpAPI
- [mcp-server-giphy](https://github.com/magarcia/mcp-server-giphy): MCP Server for the Giphy API, enabling AI models to search, retrieve, and utilize GIFs from Giphy
- [@anaisbetts/mcp-youtube](https://github.com/anaisbetts/mcp-youtube): MCP server for fetching YouTube subtitles
- [anilist-mcp](https://github.com/yuna0x0/anilist-mcp): MCP server that interfaces with the AniList API, allowing LLM clients to access and interact with anime, manga, character, staff, and user data from AniList
- [@kimtaeyoon83/mcp-server-youtube-transcript](https://github.com/kimtaeyoon83/mcp-server-youtube-transcript): This is an MCP server that allows you to directly download transcripts of YouTube videos.
- [qanon_mcp](https://github.com/jkingsman/qanon-mcp-server): Enables search, exploration, and analysis of all QAnon posts/drops for sociological study
- [@mcp-get-community/server-curl](https://github.com/mcp-get/community-servers/blob/main/src/server-curl): MCP server for making HTTP requests using a curl-like interface


<a id="version-control"></a>
## Version Control

Manage Git repositories, pull requests, and issues with version control tools.

- [mcp-server-git](https://github.com/modelcontextprotocol/servers/blob/main/src/git): A Model Context Protocol server providing tools to read, search, and manipulate Git repositories programmatically via LLMs
- [@modelcontextprotocol/server-github](https://github.com/modelcontextprotocol/servers/blob/main/src/github): MCP server for using the GitHub API
- [@modelcontextprotocol/server-gitlab](https://github.com/modelcontextprotocol/servers/blob/main/src/gitlab): MCP server for using the GitLab API


<a id="other-tools-and-integrations"></a>
## Other Tools and Integrations

Miscellaneous tools and integrations that don’t fit into other categories.

- [@chargebee/mcp](https://github.com/chargebee/agentkit/tree/main/modelcontextprotocol): MCP Server that connects AI agents to Chargebee platform.
- [@modelcontextprotocol/server-sequential-thinking](https://github.com/modelcontextprotocol/servers/blob/main/src/sequentialthinking): MCP server for sequential thinking and problem solving
- [@llmindset/mcp-miro](https://github.com/evalstate/mcp-miro): A Model Context Protocol server to connect to the MIRO Whiteboard Application
- [mcp-server-flomo](https://github.com/xianminx/mcp-server-flomo): A MCP server for Flomo
- [mcp-server-time](https://github.com/modelcontextprotocol/servers/blob/main/src/time): A Model Context Protocol server providing tools for time queries and timezone conversions for LLMs

