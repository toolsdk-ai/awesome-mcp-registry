import { Context } from 'hono';
import { ToolSO, type ExecuteToolRequest } from './tool-so';

export const toolController = {
  /**
   * 执行工具的控制器方法
   * @param c Hono上下文
   * @returns 工具执行结果
   */
  executeTool: async (c: Context) => {
    try {
      const requestBody: ExecuteToolRequest = await c.req.json();

      const toolSO = new ToolSO();
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
};
