import { Context } from 'hono';
import { PackageSO } from './package-so';
import type { ToolExecute } from '../types';

export const packageController = {
  executeTool: async (c: Context) => {
    try {
      const requestBody: ToolExecute = await c.req.json();

      const toolSO = new PackageSO();
      const result = await toolSO.executeTool(requestBody);

      const statusCode = result.success ? 200 : 500;
      return c.json(result, statusCode);
    } catch (error) {
      return c.json(
        {
          success: false,
          error: (error as Error).message,
        },
        500,
      );
    }
  },

  getPackageDetail: async (c: Context) => {
    try {
      const packageName = c.req.query('packageName');
      if (!packageName) {
        return c.json(
          {
            success: false,
            error: 'Missing packageName query parameter',
          },
          400,
        );
      }

      const toolSO = new PackageSO();
      const result = await toolSO.getPackageDetail(packageName);

      const statusCode = result.success ? 200 : 404;
      return c.json(result, statusCode);
    } catch (error) {
      return c.json(
        {
          success: false,
          error: (error as Error).message,
        },
        500,
      );
    }
  },
};
