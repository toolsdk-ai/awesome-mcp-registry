// This script is used to generate README.md
// 1. First, read the category configuration file (packages/@toolsdk.ai/registry/config/categories.mjs) to read the categories
// 2. Iterate through the categories, then recursively read the specified directory (all JSON files under packages/@toolsdk.ai/registry/packages/{categoryName}), and validate with zod MCPServerConfigSchema.parse
// 3. Start with let README: string, README += the content of all MCP server files under the category
// 4. Write to the README file (packages/@toolsdk.ai/registry/README.md)
