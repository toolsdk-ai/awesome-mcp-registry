# Guide for ToolSDK.ai MCP Servers Registry

- [Guide for ToolSDK.ai MCP Servers Registry](#guide-for-toolsdkai-mcp-servers-registry)
  - [How to submit new packages?](#how-to-submit-new-packages)
  - [What differences about ToolSDK.ai MCP Servers](#what-differences-about-toolsdkai-mcp-servers)
  - [Config](#config)
  - [Scripts](#scripts)

## How to submit new packages?

Open a package directory, where you will find various categories.

```
packages/
├── uncategorized/
├── database/
└── ...
```

Select the appropriate category and fill in a configuration.

The format for the configuration is as follows; this is the format of the JSON configuration:

```ts
interface MCPServerConfig {
  //
}
```

For example, if you want to submit an MCP server package using an official GitHub MCP server, create a file named `modelcontextprotocol-github.json` in the `packages/code-execution` directory.
Every file that enters this repository will be validated by Zod. You can open [types.ts](./types.ts) to see the definition of the Zod schema.

## What differences about ToolSDK.ai MCP Servers

Currently, there are numerous MCP-related registry platforms available in the market, such as mcp.so and Smithery.

However, mcp.so lacks an open API interface and functions primarily as a unified, aggregated hosting platform.

In contrast, Smithery.ai has modified certain official MCP servers to create a more convenient hosting solution tailored to its needs.

Projects like awesome-mcp-servers are also noteworthy, as it showcase many MCP servers in a README format.

However, the information is presented in an unstructured manner, making it impossible to index via an API; users must download the entries individually.

ToolSDK.ai's MCP Server Registry aims to establish a free and open community for collaboratively building an MCP server registry.

Anyone can contribute MCP configuration files through community pull requests, which will automatically generate a README file, thereby facilitating the collective maintenance and innovation of the MCP ecosystem.

It has the following features:

- **Structure JSON Config**: The configuration of the registry structure using JSON files. It enables the definition of categories, tools, and their relationships in a structured format.
- **Auto README Generation**: Automates the generation of README files for each category and tool in the registry. It ensures that the documentation is always up-to-date and consistent across the registry.

## Config

- `config/featured.json`
- `hosting-blacklist.json`

## Scripts

```bash
# Generate the indexes
bun ./scripts/indexing-lists.ts

# Generate the README
bun ./scripts/readme-gen.ts
```
