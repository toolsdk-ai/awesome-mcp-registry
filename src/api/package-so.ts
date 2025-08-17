import fs from 'fs';
import path from 'path';
import { getPackageConfigByKey, getMcpClient, typedAllPackagesList } from '../helper.js';
import type { MCPServerPackageConfig, ToolExecute, Response, MCPServerPackageConfigWithTools } from '../types';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export class PackageSO {
  async executeTool(request: ToolExecute): Promise<Response<unknown>> {
    const mcpServerConfig = getPackageConfigByKey(request.packageName);

    const { client, closeConnection } = await getMcpClient(mcpServerConfig, request.envs || {});
    try {
      const result = await client.callTool({
        name: request.toolKey,
        arguments: request.inputData,
      });

      console.log(`Tool ${request.toolKey} executed successfully`);
      return {
        success: true,
        code: 200,
        message: 'Tool executed successfully',
        data: result,
      };
    } finally {
      await closeConnection();
    }
  }

  async listTools(packageName: string): Promise<Response<Tool[]>> {
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
      return {
        success: true,
        code: 200,
        message: 'Tools list retrieved successfully',
        data: tools,
      };
    } finally {
      await closeConnection();
    }
  }

  async getPackageDetail(packageName: string): Promise<Response<MCPServerPackageConfig>> {
    const packageInfo = typedAllPackagesList[packageName];
    if (!packageInfo) {
      return {
        success: false,
        code: 404,
        message: `Package ${packageName} not found`,
      };
    }

    const jsonFilePath = path.join(__dirname, '../../packages/', packageInfo.path);
    const jsonStr = fs.readFileSync(jsonFilePath, 'utf-8');
    const packageConfig: MCPServerPackageConfig = JSON.parse(jsonStr);

    let tools;
    try {
      const toolList = await this.listTools(packageName);
      tools = toolList.success ? toolList.data : undefined;
    } catch (error) {
      console.warn(`Warn retrieving tools for package ${packageName}:`, (error as Error).message);
      // 如果无法获取工具列表，则将tools设置为undefined
      tools = undefined;
    }

    // const toolList = await this.listTools(packageName);
    const packageConfigWithTools: MCPServerPackageConfigWithTools = {
      ...packageConfig,
      tools,
    };

    return {
      success: true,
      code: 200,
      message: 'Package detail retrieved successfully',
      data: packageConfigWithTools,
    };
  }
}
