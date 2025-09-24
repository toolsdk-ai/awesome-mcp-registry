import fs from "node:fs";
import path from "node:path";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getMcpClient, getPackageConfigByKey, typedAllPackagesList } from "../helper.js";
import { MCPSandboxClient } from "../sandbox/mcp-sandbox-client.js";
import type {
  MCPServerPackageConfig,
  MCPServerPackageConfigWithTools,
  ToolExecute,
} from "../types";
import { getDirname } from "../utils";

const __dirname = getDirname(import.meta.url);

export class PackageSO {
  private useSandbox: boolean = false;
  private sandboxClient: MCPSandboxClient | null = null;

  constructor(useSandbox: boolean = false) {
    this.useSandbox = useSandbox;
    if (useSandbox) {
      this.sandboxClient = new MCPSandboxClient();
    }
  }

  async executeTool(request: ToolExecute): Promise<unknown> {
    if (this.useSandbox) {
      return this.executeToolInSandbox(request);
    }

    const mcpServerConfig = getPackageConfigByKey(request.packageName);

    const { client, closeConnection } = await getMcpClient(mcpServerConfig, request.envs || {});
    try {
      const result = await client.callTool({
        name: request.toolKey,
        arguments: request.inputData,
      });

      console.log(`Tool ${request.toolKey} executed successfully`);
      return result;
    } finally {
      await closeConnection();
    }
  }

  private async executeToolInSandbox(request: ToolExecute): Promise<unknown> {
    if (!this.sandboxClient) {
      throw new Error("Sandbox client not initialized");
    }

    try {
      await this.sandboxClient.initialize();
      const result = await this.sandboxClient.executeTool(
        request.packageName,
        request.toolKey,
        request.inputData || {},
        request.envs,
      );
      console.log(`Tool ${request.toolKey} executed successfully in sandbox`);
      return result;
    } finally {
      await this.sandboxClient.close();
    }
  }

  async listTools(packageName: string): Promise<Tool[]> {
    if (this.useSandbox) {
      return this.listToolsInSandbox(packageName);
    }

    const mcpServerConfig = getPackageConfigByKey(packageName);

    const mockEnvs: Record<string, string> = {};
    if (mcpServerConfig.env) {
      Object.keys(mcpServerConfig.env).forEach((key) => {
        mockEnvs[key] = "mock_value";
      });
    }

    const { client, closeConnection } = await getMcpClient(mcpServerConfig, mockEnvs);
    try {
      const { tools } = await client.listTools();

      console.log(`Tools list retrieved successfully for package ${packageName}`);
      return tools;
    } finally {
      await closeConnection();
    }
  }

  private async listToolsInSandbox(packageName: string): Promise<Tool[]> {
    if (!this.sandboxClient) {
      throw new Error("Sandbox client not initialized");
    }

    try {
      await this.sandboxClient.initialize();
      const tools = await this.sandboxClient.listTools(packageName);
      console.log(`Tools list retrieved successfully for package ${packageName} in sandbox`);
      return tools;
    } finally {
      await this.sandboxClient.close();
    }
  }

  async getPackageDetail(packageName: string): Promise<MCPServerPackageConfig> {
    const packageInfo = typedAllPackagesList[packageName];
    if (!packageInfo) {
      throw new Error(`Package ${packageName} not found`);
    }

    const jsonFilePath = path.join(__dirname, "../../packages/", packageInfo.path);
    const jsonStr = fs.readFileSync(jsonFilePath, "utf-8");
    const packageConfig: MCPServerPackageConfig = JSON.parse(jsonStr);

    let tools: Tool[] | undefined;
    try {
      tools = await this.listTools(packageName);
    } catch (error) {
      console.warn(`Warn retrieving tools for package ${packageName}:`, (error as Error).message);
      // if tools cannot be retrieved, set tools to undefined
      tools = undefined;
    }

    const packageConfigWithTools: MCPServerPackageConfigWithTools = {
      ...packageConfig,
      tools,
    };

    return packageConfigWithTools;
  }

  async getPackageDetailBySandbox(packageName: string): Promise<MCPServerPackageConfig> {
    const packageInfo = typedAllPackagesList[packageName];
    if (!packageInfo) {
      throw new Error(`Package ${packageName} not found`);
    }

    const sandboxPackageSO = new PackageSO(true);
    return await sandboxPackageSO.getPackageDetail(packageName);
  }
}
