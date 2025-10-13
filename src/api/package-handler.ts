import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import type { Context } from "hono";
import { getSandboxProvider } from "../helper";
import type {
  MCPSandboxProvider,
  MCPServerPackageConfigWithTools,
  Response,
  ToolExecute,
} from "../types";
import { createErrorResponse, createResponse } from "../utils";
import { PackageSO } from "./package-so";

export const packageHandler = {
  executeTool: async (c: Context) => {
    const requestBody: ToolExecute = await c.req.json();
    const provider: MCPSandboxProvider = getSandboxProvider();

    try {
      const toolSO = new PackageSO(provider);
      const result = await toolSO.executeTool(requestBody);

      const response: Response<unknown> = createResponse(result);
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
            `Tool '${requestBody.toolKey}' not found in package '${requestBody.packageName}`,
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

      // Other errors are still thrown
      throw error;
    }
  },

  getPackageDetail: async (c: Context) => {
    const packageName = c.req.query("packageName");
    if (!packageName) {
      const errorResponse = createErrorResponse("Missing packageName query parameter", 400);
      return c.json(errorResponse, 200);
    }
    const provider: MCPSandboxProvider = getSandboxProvider();

    try {
      const toolSO = new PackageSO(provider);
      const result: MCPServerPackageConfigWithTools = await toolSO.getPackageDetail(packageName);

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

  listTools: async (c: Context) => {
    const packageName = c.req.query("packageName");
    if (!packageName) {
      const errorResponse = createErrorResponse("Missing packageName query parameter", 400);
      return c.json(errorResponse, 200);
    }
    const provider: MCPSandboxProvider = getSandboxProvider();

    try {
      const toolSO = new PackageSO(provider);
      const result: Tool[] = await toolSO.listTools(packageName);

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
