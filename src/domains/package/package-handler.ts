import path from "node:path";
import { getDirname } from "../../shared/utils/file-util";
import { createErrorResponse, createResponse } from "../../shared/utils/response-util";
import { ExecutorFactory } from "../executor/executor-factory";
import type { MCPSandboxProvider } from "../sandbox/sandbox-types";
import { PackageRepository } from "./package-repository";
import { PackageSO } from "./package-so";

const __dirname = getDirname(import.meta.url);

const packagesDir = path.join(__dirname, "../../../packages");
const repository = new PackageRepository(packagesDir);

export const packageHandler = {
  getPackageDetail: async (packageName: string, sandboxProvider?: MCPSandboxProvider) => {
    try {
      const executor = ExecutorFactory.create(sandboxProvider);
      const packageSO = await PackageSO.init(packageName, repository, executor);
      const result = await packageSO.getDetailWithTools();
      return createResponse(result);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return createErrorResponse(`Package '${packageName}' not found`, 404);
      }
      throw error;
    }
  },

  executeTool: async (
    packageName: string,
    toolKey: string,
    inputData: Record<string, unknown>,
    envs?: Record<string, string>,
    sandboxProvider?: MCPSandboxProvider,
  ) => {
    try {
      const executor = ExecutorFactory.create(sandboxProvider);
      const packageSO = await PackageSO.init(packageName, repository, executor);
      const result = await packageSO.executeTool(toolKey, inputData, envs);
      return createResponse(result);
    } catch (error) {
      if (error instanceof Error) {
        if (error.message.includes("not found")) {
          return createErrorResponse(`Package '${packageName}' not found`, 404);
        }
        if (error.message.includes("Unknown tool")) {
          return createErrorResponse(
            `Tool '${toolKey}' not found in package '${packageName}'`,
            404,
          );
        }
        return createErrorResponse(`Error: ${error.message}`, 500);
      }
      throw error;
    }
  },

  listTools: async (packageName: string, sandboxProvider?: MCPSandboxProvider) => {
    try {
      const executor = ExecutorFactory.create(sandboxProvider);
      const packageSO = await PackageSO.init(packageName, repository, executor);
      const tools = await packageSO.getTools();
      return createResponse(tools);
    } catch (error) {
      if (error instanceof Error && error.message.includes("not found")) {
        return createErrorResponse(`Package '${packageName}' not found`, 404);
      }
      throw error;
    }
  },
};
