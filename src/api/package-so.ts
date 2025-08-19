import fs from 'fs';
import path from 'path';
import { getPackageConfigByKey, getMcpClient, typedAllPackagesList } from '../helper.js';
import type { MCPServerPackageConfig, ToolExecute, MCPServerPackageConfigWithTools } from '../types';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export class PackageSO {
  async executeTool(request: ToolExecute): Promise<unknown> {
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

  async listTools(packageName: string): Promise<Tool[]> {
    const mcpServerConfig = getPackageConfigByKey(packageName);

    const mockEnvs: Record<string, string> = {};
    if (mcpServerConfig.env) {
      Object.keys(mcpServerConfig.env).forEach((key) => {
        mockEnvs[key] = 'mock_value';
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

  async getPackageDetail(packageName: string): Promise<MCPServerPackageConfig> {
    const packageInfo = typedAllPackagesList[packageName];
    if (!packageInfo) {
      throw new Error(`Package ${packageName} not found`);
    }

    const jsonFilePath = path.join(__dirname, '../../packages/', packageInfo.path);
    const jsonStr = fs.readFileSync(jsonFilePath, 'utf-8');
    const packageConfig: MCPServerPackageConfig = JSON.parse(jsonStr);

    let tools;
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
}
