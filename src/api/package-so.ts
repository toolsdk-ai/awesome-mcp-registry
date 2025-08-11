import fs from 'fs';
import path from 'path';
import { getPackageConfigByKey, getMcpClient, typedAllPackagesList } from '../helper.js';
import type { MCPServerPackageConfig, ToolExecute } from '../types';

interface ExecuteToolResponse {
  success: boolean;
  data?: unknown;
  error?: string;
}

interface PackageDetailResponse {
  success: boolean;
  data?: MCPServerPackageConfig;
  error?: string;
}

export class PackageSO {
  async executeTool(request: ToolExecute): Promise<ExecuteToolResponse> {
    try {
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
          data: result,
        };
      } finally {
        await closeConnection();
      }
    } catch (error) {
      console.error(`Tool execution failed: ${error}`);
      return {
        success: false,
        error: 'Tool execution failed',
      };
    }
  }

  async getPackageDetail(packageName: string): Promise<PackageDetailResponse> {
    try {
      const packageInfo = typedAllPackagesList[packageName];
      if (!packageInfo) {
        return {
          success: false,
          error: `Package ${packageName} not found`,
        };
      }

      const jsonFilePath = path.join(__dirname, '../../packages/', packageInfo.path);
      const jsonStr = fs.readFileSync(jsonFilePath, 'utf-8');
      const packageConfig: MCPServerPackageConfig = JSON.parse(jsonStr);

      return {
        success: true,
        data: packageConfig,
      };
    } catch (error) {
      console.error(`Failed to get package detail: ${error}`);
      return {
        success: false,
        error: `Failed to get package detail: ${error}`,
      };
    }
  }
}
