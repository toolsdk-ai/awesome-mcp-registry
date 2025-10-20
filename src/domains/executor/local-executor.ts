import path from "node:path";
import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { getDirname } from "../../shared/utils/file-util";
import { getMcpClient } from "../../shared/utils/mcp-client-util";
import { PackageRepository } from "../package/package-repository";
import type { ToolExecuteRequest, ToolExecutor } from "./executor-interface";

/**
 * Local Executor
 * Executes MCP tools in local environment
 */
export class LocalExecutor implements ToolExecutor {
  private readonly packageRepository: PackageRepository;

  constructor() {
    const __dirname = getDirname(import.meta.url);
    const packagesDir = path.join(__dirname, "../../../packages");
    this.packageRepository = new PackageRepository(packagesDir);
  }

  async executeTool(request: ToolExecuteRequest): Promise<unknown> {
    const mcpServerConfig = this.packageRepository.getPackageConfig(request.packageName);
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

  async listTools(packageName: string): Promise<Tool[]> {
    const mcpServerConfig = this.packageRepository.getPackageConfig(packageName);

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
