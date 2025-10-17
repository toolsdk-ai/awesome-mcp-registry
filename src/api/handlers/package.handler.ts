import path from "node:path";
import type { Context } from "hono";
import { ExecutorFactory } from "../../core/executor/ExecutorFactory";
import { PackageRepository } from "../../core/package/PackageRepository";
import { PackageService } from "../../core/package/PackageService";
import { getSandboxProvider } from "../../shared/config/environment";
import type { ToolExecute } from "../../shared/types";
import { createErrorResponse, createResponse, getDirname } from "../../utils";

const __dirname = getDirname(import.meta.url);

// 创建包服务实例（单例）
const packagesDir = path.join(__dirname, "../../../packages");
const packageRepository = new PackageRepository(packagesDir);
const provider = getSandboxProvider();
const executor = ExecutorFactory.create(provider);
const packageService = new PackageService(executor, packageRepository);

/**
 * 包处理器
 * 处理包相关的 HTTP 请求
 */
export const packageHandler = {
  /**
   * 执行工具
   */
  executeTool: async (c: Context) => {
    const requestBody: ToolExecute = await c.req.json();

    try {
      const result = await packageService.executeTool(requestBody);
      const response = createResponse(result);
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          const errorResponse = createErrorResponse(
            `Package '${requestBody.packageName}' not found`,
            404,
          );
          return c.json(errorResponse, 200);
        }
        if (error.message.includes("Unknown tool")) {
          const errorResponse = createErrorResponse(
            `Tool '${requestBody.toolKey}' not found in package '${requestBody.packageName}'`,
            404,
          );
          return c.json(errorResponse, 200);
        }
        const errorResponse = createErrorResponse(
          `[executeTool] Error executing tool: ${error.message}`,
          500,
        );
        return c.json(errorResponse, 200);
      }

      throw error;
    }
  },

  /**
   * 获取包详情
   */
  getPackageDetail: async (c: Context) => {
    const packageName = c.req.query("packageName");
    if (!packageName) {
      const errorResponse = createErrorResponse("Missing packageName query parameter", 400);
      return c.json(errorResponse, 200);
    }

    try {
      const result = await packageService.getPackageDetail(packageName);
      const response = createResponse(result);
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        const errorResponse = createErrorResponse(`Package '${packageName}' not found`, 404);
        return c.json(errorResponse, 200);
      }
      throw error;
    }
  },

  /**
   * 列出工具
   */
  listTools: async (c: Context) => {
    const packageName = c.req.query("packageName");
    if (!packageName) {
      const errorResponse = createErrorResponse("Missing packageName query parameter", 400);
      return c.json(errorResponse, 200);
    }

    try {
      const result = await packageService.listTools(packageName);
      const response = createResponse(result);
      return c.json(response, 200);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        const errorResponse = createErrorResponse(`Package '${packageName}' not found`, 404);
        return c.json(errorResponse, 200);
      }
      throw error;
    }
  },
};
