import { Context } from 'hono';
import { PackageSO } from './package-so';
import type { ToolExecute, Response, MCPServerPackageConfig } from '../types';

export const packageHandler = {
  executeTool: async (c: Context) => {
    const requestBody: ToolExecute = await c.req.json();

    try {
      const toolSO = new PackageSO();
      const result: Response<unknown> = await toolSO.executeTool(requestBody);

      const statusCode = result.success ? 200 : 500;
      return c.json(result, statusCode);
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

    const toolSO = new PackageSO();
    const result: Response<MCPServerPackageConfig> = await toolSO.getPackageDetail(packageName);
    const statusCode = result.success ? 200 : 404;
    return c.json(result, statusCode);
  },
};
