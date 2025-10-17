import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getPackageConfigByKey } from "../../helper";
import { getMcpClient } from "../../shared/utils/mcp-client.util";
import type { IToolExecutor, ToolExecuteRequest } from "./IToolExecutor";

/**
 * 本地执行器
 * 在本地环境中执行 MCP 工具
 */
export class LocalExecutor implements IToolExecutor {
  /**
   * 执行工具
   */
  async executeTool(request: ToolExecuteRequest): Promise<unknown> {
    const mcpServerConfig = getPackageConfigByKey(request.packageName);
    const { client, closeConnection } = await getMcpClient(mcpServerConfig, request.envs || {});

    try {
      const result = await client.callTool({
        name: request.toolKey,
        arguments: request.inputData,
      });

      console.log(`[LocalExecutor] Tool ${request.toolKey} executed successfully`);
      return result;
    } finally {
      await closeConnection();
    }
  }

  /**
   * 列出工具
   */
  async listTools(packageName: string): Promise<Tool[]> {
    const mcpServerConfig = getPackageConfigByKey(packageName);

    // 为需要环境变量的包创建 mock 环境变量
    const mockEnvs: Record<string, string> = {};
    if (mcpServerConfig.env) {
      Object.keys(mcpServerConfig.env).forEach((key) => {
        mockEnvs[key] = "mock_value";
      });
    }

    const { client, closeConnection } = await getMcpClient(mcpServerConfig, mockEnvs);

    try {
      const { tools } = await client.listTools();
      console.log(`[LocalExecutor] Tools list retrieved successfully for package ${packageName}`);
      return tools;
    } finally {
      await closeConnection();
    }
  }
}
