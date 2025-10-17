import path from "node:path";
import type { Context } from "hono";
import { getSandboxProvider } from "../../shared/config/environment";
import { getDirname } from "../../shared/utils/file-util";
import { createErrorResponse, createResponse } from "../../shared/utils/response-util";
import { ExecutorFactory } from "../executor/executor-factory";
import { PackageRepository } from "./package-repository";
import { PackageSO } from "./package-so";

const __dirname = getDirname(import.meta.url);

const packagesDir = path.join(__dirname, "../../../packages");
const repository = new PackageRepository(packagesDir);
const executor = ExecutorFactory.create(getSandboxProvider());

export const packageHandler = {
  getPackageDetail: async (c: Context) => {
    const packageName = c.req.query("packageName");
    if (!packageName) {
      return c.json(createErrorResponse("Missing packageName query parameter", 400), 200);
    }

    try {
      const packageSO = await PackageSO.init(packageName, repository, executor);
      const result = await packageSO.getDetailWithTools();
      return c.json(createResponse(result), 200);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return c.json(createErrorResponse(`Package '${packageName}' not found`, 404), 200);
      }
      throw error;
    }
  },

  executeTool: async (c: Context) => {
    const body = await c.req.json();
    const { packageName, toolKey, inputData, envs } = body;

    try {
      const packageSO = await PackageSO.init(packageName, repository, executor);
      const result = await packageSO.executeTool(toolKey, inputData, envs);
      return c.json(createResponse(result), 200);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          return c.json(createErrorResponse(`Package '${packageName}' not found`, 404), 200);
        }
        if (error.message.includes("Unknown tool")) {
          return c.json(
            createErrorResponse(`Tool '${toolKey}' not found in package '${packageName}'`, 404),
            200,
          );
        }
        return c.json(createErrorResponse(`Error: ${error.message}`, 500), 200);
      }
      throw error;
    }
  },

  listTools: async (c: Context) => {
    const packageName = c.req.query("packageName");
    if (!packageName) {
      return c.json(createErrorResponse("Missing packageName query parameter", 400), 200);
    }

    try {
      const packageSO = await PackageSO.init(packageName, repository, executor);
      const tools = await packageSO.getTools();
      return c.json(createResponse(tools), 200);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return c.json(createErrorResponse(`Package '${packageName}' not found`, 404), 200);
      }
      throw error;
    }
  },
};
