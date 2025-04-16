# Awesome MCP Registry

Welcome to the Awesome MCP Registry, your go-to open and structured registry for MCP servers and packages.

Unlike other MCP projects, this `Awesome MCP Registry` leverages structured JSON configs to generate `README.md`, [npm package](https://www.npmjs.com/package/@toolsdk.ai/registry) and [packages-list.json](https://toolsdk-ai.github.io/awesome-mcp-registry/indexes/packages-list.json)

You can use the `Awesome MCP Registry` to build your own great MCP projects and hosting sites, acting as the database for MCP servers and packages.

## Quick Start

#### Install via package manager:

```bash
npm install @toolsdk.ai/registry
```

#### Use it on your JavaScript / Typescript project:

```ts
import mcpServerLists from '@toolsdk.ai/registry/indexes/packages-lists.json';
```

#### Fetch all the lists via cURL:

```bash
curl https://toolsdk-ai.github.io/awesome-mcp-registry/indexes/packages-list.json
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

Create a new file called `your-new-mcp-server.json` under [packages/uncategorized](./packages/uncategorized) folder.
For more detail please see [the guide](./docs/guide.md).

# MCP Servers



## Aggregators
Servers for accessing many apps and tools through a single MCP server.

- [@modelcontextprotocol/server-everything](https://github.com/modelcontextprotocol/servers/blob/main/src/everything): This MCP server attempts to exercise all the features of the MCP protocol. It is not intended to be a useful server, but rather a test server for builders of MCP clients. It implements prompts, tools, resources, sampling, and more to showcase MCP capabilities.


## Art & Culture
Access and explore art collections, cultural heritage, and museum databases. Enables AI models to search and analyze artistic and cultural content.

- [@modelcontextprotocol/server-everart](https://github.com/modelcontextprotocol/servers/blob/main/src/everart): MCP server for EverArt API integration
- [mcp-server-stability-ai](https://github.com/tadasant/mcp-server-stability-ai): Integrates Stability AI's image generation and manipulation capabilities for editing, upscaling, and more via Stable Diffusion models.


## Browser Automation
Web content access and automation capabilities. Enables searching, scraping, and processing web content in AI-friendly formats.

- [@automatalabs/mcp-server-playwright](https://github.com/Automata-Labs-team/MCP-Server-Playwright/tree/main): MCP server for browser automation using Playwright
- [@modelcontextprotocol/server-puppeteer](https://github.com/modelcontextprotocol/servers/blob/main/src/puppeteer): MCP server for browser automation using Puppeteer
- [@executeautomation/playwright-mcp-server](https://github.com/executeautomation/mcp-playwright/tree/main/src): A Model Context Protocol server for Playwright for Browser Automation and Web Scraping.
- [hyperbrowser-mcp](https://github.com/hyperbrowserai/mcp/tree/main): An MCP server for Hyperbrowser - Hyperbrowser is the next-generation platform empowering AI agents and enabling effortless, scalable browser automation
- [mcp-server-fetch](https://github.com/modelcontextprotocol/servers/blob/main/src/fetch): A Model Context Protocol server providing tools to fetch and convert web content for usage by LLMs


## Cloud Platforms
Cloud platform service integration. Enables management and interaction with cloud infrastructure and services.

- [@cloudflare/mcp-server-cloudflare](https://github.com/cloudflare/mcp-server-cloudflare): MCP server for interacting with Cloudflare API
- [@strowk/mcp-k8s](https://github.com/strowk/mcp-k8s-go): MCP server connecting to Kubernetes
- [kubernetes-mcp-server](https://github.com/manusa/kubernetes-mcp-server): Powerful and flexible Kubernetes MCP server implementation with additional features for OpenShift. Besides the typical CRUD operations on any Kubernetes resource, this implementation adds specialized features for Pods and other resources.
- [mcp-server-kubernetes](https://github.com/Flux159/mcp-server-kubernetes): MCP server for managing Kubernetes clusters, enabling LLMs to interact with and control Kubernetes resources.


## Code Execution
Code execution servers. Allow LLMs to execute code in a secure environment, e.g. for coding agents.

- [mcp-server-make](https://github.com/wrale/mcp-server-make): A Model Context Protocol server that provides make target calling functionality. This server enables LLMs to execute make targets from a specified Makefile within a specified working directory.


## Command Line
Run commands, capture output and otherwise interact with shells and command line tools.

- [mcp-shell](https://github.com/hdresearch/mcp-shell): An MCP server for your shell
- [mcp-server-commands](https://github.com/g0t4/mcp-server-commands): MCP server enabling LLMs to execute shell commands and run scripts through various interpreters with built-in safety controls.


## Communication
Integration with communication platforms for message management and channel operations. Enables AI models to interact with team communication tools.

- [@modelcontextprotocol/server-slack](https://github.com/modelcontextprotocol/servers/blob/main/src/slack): MCP server for interacting with Slack
- [@enescinar/twitter-mcp](https://github.com/EnesCinr/twitter-mcp): This MCP server allows Clients to interact with Twitter, enabling posting tweets and searching Twitter.
- [@gongrzhe/server-gmail-autoauth-mcp](https://github.com/gongrzhe/server-gmail-autoauth-mcp): Gmail MCP server with auto authentication support


## Databases
Secure database access with schema inspection capabilities. Enables querying and analyzing data with configurable security controls including read-only access.

- [airtable-mcp-server](https://github.com/domdomegg/airtable-mcp-server): Airtable database integration with schema inspection, read and write capabilities
- [@benborla29/mcp-server-mysql](https://github.com/benborla/mcp-server-mysql): An MCP server for interacting with MySQL databases
- [@niledatabase/nile-mcp-server](https://github.com/niledatabase/nile-mcp-server/tree/main): MCP server for Nile Database - Manage and query databases, tenants, users, auth using LLMs
- [mcp-server-sqlite](https://github.com/modelcontextprotocol/servers/blob/main/src/sqlite): A simple SQLite MCP server
- [mcp-mongo-server](https://github.com/kiliczsh/mcp-mongo-server): A Model Context Protocol Server for MongoDB
- [@modelcontextprotocol/server-postgres](https://github.com/modelcontextprotocol/servers/blob/main/src/postgres): MCP server for interacting with PostgreSQL databases


## Data Platforms
Data Platforms for data integration, transformation and pipeline orchestration.

- [mcp-tinybird](https://github.com/tinybirdco/mcp-tinybird/tree/main/src/mcp-tinybird): A Model Context Protocol server that lets you interact with a Tinybird Workspace from any MCP client.


## Developer Tools
Tools and integrations that enhance the development workflow and environment management.

- [@mcp-get-community/server-macos](https://github.com/mcp-get/community-servers/blob/main/src/server-macos): MCP server for macOS system operations
- [mcp-server-aidd](https://github.com/skydeckai/mcp-server-aidd): An MCP server that provides a comprehensive set of tools for AI-driven development workflows. Features include file system operations, code analysis using tree-sitter for multiple programming languages, Git operations, code execution, and system information retrieval. Designed to enhance AI's capability to assist in software development tasks.
- [mcp-server-tree-sitter](https://github.com/wrale/mcp-server-tree-sitter): A Model Context Protocol server that provides code analysis capabilities using tree-sitter. This server enables LLMs to explore, search, and analyze code with appropriate context management.
- [@mcp-get-community/server-llm-txt](https://github.com/mcp-get/community-servers/blob/main/src/server-llm-txt): MCP server that extracts and serves context from llm.txt files, enabling AI models to understand file structure, dependencies, and code relationships in development environments
- [@llmindset/mcp-hfspace](https://github.com/evalstate/mcp-hfspace/): MCP Server for using HuggingFace Spaces. Seamlessly use the latest Open Source Image, Audio and Text Models from within Claude Deskop.
- [awslabs.nova-canvas-mcp-server](https://github.com/awslabs/mcp/tree/main/src/nova-canvas-mcp-server): A Model Context Protocol server that lets you interact with a Nova Canvas from any MCP client.
- [hackmd-mcp](https://github.com/yuna0x0/hackmd-mcp): A Model Context Protocol server for integrating HackMD's note-taking platform with AI assistants
- [mcp-openapi-schema-explorer](https://github.com/kadykov/mcp-openapi-schema-explorer): MCP server providing token-efficient access to OpenAPI/Swagger specs via MCP Resources for client-side exploration.
- [docker-mcp](https://github.com/QuantGeekDev/docker-mcp): A powerful Model Context Protocol (MCP) server for Docker operations, enabling seamless container and compose stack management through Claude AI


## Data Science Tools
Integrations and tools designed to simplify data exploration, analysis and enhance data science workflows.

- [mcp-solver](https://github.com/szeider/mcp-solver): MCP server for Constraint Solving and Optimization


## File Systems
Provides direct access to local file systems with configurable permissions. Enables AI models to read, write, and manage files within specified directories.

- [@modelcontextprotocol/server-gdrive](https://github.com/modelcontextprotocol/servers/blob/main/src/gdrive): MCP server for interacting with Google Drive
- [@modelcontextprotocol/server-filesystem](https://github.com/modelcontextprotocol/servers): MCP server for filesystem access


## Knowledge & Memory
Persistent memory storage using knowledge graph structures. Enables AI models to maintain and query structured information across sessions.

- [mcp-server-rememberizer](https://github.com/skydeckai/mcp-server-rememberizer): An MCP server for interacting with Rememberizer's document and knowledge management API. This server enables Large Language Models to search, retrieve, and manage documents and integrations through Rememberizer.
- [mcp-rememberizer-vectordb](https://github.com/skydeckai/mcp-rememberizer-vectordb): A Model Context Protocol server for LLMs to interact with Rememberizer Vector Store.
- [@modelcontextprotocol/server-memory](https://github.com/modelcontextprotocol/servers/blob/main/src/memory): MCP server for enabling memory for Claude through a knowledge graph


## Location Services
Location-based services and mapping tools. Enables AI models to work with geographic data, weather information, and location-based analytics.

- [@modelcontextprotocol/server-google-maps](https://github.com/modelcontextprotocol/servers/blob/main/src/google-maps): MCP server for using the Google Maps API


## Monitoring
Access and analyze application monitoring data. Enables AI models to review error reports and performance metrics.

- [mcp-server-sentry](https://github.com/modelcontextprotocol/servers/blob/main/src/sentry): MCP server for retrieving issues from sentry.io
- [@raygun.io/mcp-server-raygun](https://github.com/MindscapeHQ/mcp-server-raygun): MCP server for interacting with Raygun's API for crash reporting and real user monitoring metrics


## Search & Data Extraction
Tools and services for searching and extracting data from various sources. Enables AI models to retrieve and process information efficiently.

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


## Version Control
Interact with Git repositories and version control platforms. Enables repository management, code analysis, pull request handling, issue tracking, and other version control operations through standardized APIs.

- [mcp-server-git](https://github.com/modelcontextprotocol/servers/blob/main/src/git): A Model Context Protocol server providing tools to read, search, and manipulate Git repositories programmatically via LLMs
- [@modelcontextprotocol/server-github](https://github.com/modelcontextprotocol/servers/blob/main/src/github): MCP server for using the GitHub API
- [@modelcontextprotocol/server-gitlab](https://github.com/modelcontextprotocol/servers/blob/main/src/gitlab): MCP server for using the GitLab API


## Other Tools and Integrations
Miscellaneous tools and integrations that do not fit into other categories.

- [@chargebee/mcp](https://github.com/chargebee/agentkit/tree/main/modelcontextprotocol): MCP Server that connects AI agents to Chargebee platform.
- [@modelcontextprotocol/server-sequential-thinking](https://github.com/modelcontextprotocol/servers/blob/main/src/sequentialthinking): MCP server for sequential thinking and problem solving
- [@llmindset/mcp-miro](https://github.com/evalstate/mcp-miro): A Model Context Protocol server to connect to the MIRO Whiteboard Application
- [mcp-server-flomo](https://github.com/xianminx/mcp-server-flomo): A MCP server for Flomo
- [mcp-server-time](https://github.com/modelcontextprotocol/servers/blob/main/src/time): A Model Context Protocol server providing tools for time queries and timezone conversions for LLMs

