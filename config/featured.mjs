/**
 * Featured MCP Servers Configuration
 *
 * Maintained by toolsdk.ai
 * Contains toolsdk.ai's officially recommended featured mcp servers
 *
 * Sorting logic:
 * 1. Development tools (core development tools like GitHub, Notion, etc.)
 * 2. Data and knowledge management (Mem0, Phoenix, etc.)
 * 3. Search and browser automation (Exa, Tavily, Hyperbrowser, etc.)
 * 4. Communication and collaboration tools (Slack, Teams, Gmail, etc.)
 * 5. Cloud platforms and databases (Kubernetes, MySQL, etc.)
 * 6. AI and large language model related tools (MindBridge, OpenAI integration, etc.)
 * 7. Other utility tools (translation, PDF processing, authentication management, etc.)
 * 8. Sales and CRM tools (like Salesforce)
 */

export default [
  // Development tools
  "@modelcontextprotocol/server-github",
  "@notionhq/notion-mcp-server",
  "@antv/mcp-server-chart",
  "@sourcebot/mcp",
  "blender-mcp",

  // Data and knowledge management
  "@mem0/mcp-server",
  "@arizeai/phoenix-mcp",

  // Search and browser automation
  "exa-mcp-server",
  "@toolsdk.ai/tavily-mcp",
  "hyperbrowser-mcp",
  "search1api-mcp",

  // Communication and collaboration tools
  "@modelcontextprotocol/server-slack",
  "@floriscornel/teams-mcp",
  "linkedin-mcp-runner",
  "@cristip73/mcp-server-asana",
  "@taazkareem/clickup-mcp-server",
  "@kevinwatt/mcp-webhook",
  "@isaacphi/mcp-gdrive",
  "@kazuph/mcp-gmail-gas",
  "@enescinar/twitter-mcp",

  // Cloud platforms and databases
  "mcp-server-kubernetes",
  "@kevinwatt/mysql-mcp",
  "@niledatabase/nile-mcp-server",

  // AI and large language model related tools
  "@pinkpixel/mindbridge",
  "@mzxrai/mcp-openai",
  "@upstash/context7-mcp",

  // Other tools
  "deepl-mcp-server",
  "@toolsdk.ai/mcp-send-email",
  "@toolsdk.ai/mcp-server-google-analytics",
  "@shtse8/pdf-reader-mcp",
  "@clerk/agent-toolkit",

  // Sales and CRM tools
  "@tsmztech/mcp-server-salesforce",
];
