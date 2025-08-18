import { Context } from 'hono';
import { PackageSO } from './package-so';
import type { ToolExecute, Response, MCPServerPackageConfigWithTools } from '../types';
import type { Tool } from '@modelcontextprotocol/sdk/types.js';

export const packageHandler = {
  executeTool: async (c: Context) => {
    const requestBody: ToolExecute = await c.req.json();

    try {
      const toolSO = new PackageSO();
      const result = await toolSO.executeTool(requestBody);

      const response: Response<unknown> = {
        success: true,
        code: 200,
        message: 'Tool executed successfully',
        data: result,
      };

      return c.json(response, 200);
    } catch (error) {
      if (error instanceof Error && (error.message.includes('not found') || error.message.includes('Unknown tool'))) {
        return c.json(
          {
            success: false,
            code: 404,
            message: `Package '${requestBody.packageName}' or tool '${requestBody.toolKey}' not found`,
          },
          404,
        );
      }
      // Other errors are still thrown
      throw error;
    }
  },

  getPackageDetail: async (c: Context) => {
    const packageName = c.req.query('packageName');
    if (!packageName) {
      return c.json(
        {
          success: false,
          code: 400,
          message: 'Missing packageName query parameter',
        },
        400,
      );
    }

    try {
      const toolSO = new PackageSO();
      const result: MCPServerPackageConfigWithTools = await toolSO.getPackageDetail(packageName);

      const response: Response<MCPServerPackageConfigWithTools> = {
        success: true,
        code: 200,
        message: 'Package detail retrieved successfully',
        data: result,
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return c.json(
          {
            success: false,
            code: 404,
            message: `Package '${packageName}' not found`,
          },
          404,
        );
      }
      throw error;
    }
  },

  listTools: async (c: Context) => {
    const packageName = c.req.query('packageName');
    if (!packageName) {
      return c.json(
        {
          success: false,
          code: 400,
          message: 'Missing packageName query parameter',
        },
        400,
      );
    }

    try {
      const toolSO = new PackageSO();
      const result: Tool[] = await toolSO.listTools(packageName);

      const response: Response<Tool[]> = {
        success: true,
        code: 200,
        message: 'Tools list retrieved successfully',
        data: result,
      };
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof Error && error.message.includes('not found')) {
        return c.json(
          {
            success: false,
            code: 404,
            message: `Package '${packageName}' not found`,
          },
          404,
        );
      }
      throw error;
    }
  },
};
