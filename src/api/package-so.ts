import { getPackageConfigByKey, getMcpClient } from '../helper.js';
import type { ToolExecute } from '../types';

interface ExecuteToolResponse {
  success: boolean;
  data?: unknown;
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
}
