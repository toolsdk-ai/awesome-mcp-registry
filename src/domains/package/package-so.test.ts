import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { ToolExecutor } from "../executor/executor-interface";
import type { PackageRepository } from "./package-repository";
import { PackageSO } from "./package-so";
import type { MCPServerPackageConfig } from "./package-types";

describe("PackageSO", () => {
  let mockRepository: PackageRepository;
  let mockExecutor: ToolExecutor;

  beforeEach(() => {
    // Mock PackageRepository
    mockRepository = {
      getPackageConfig: vi.fn(),
      getAllPackages: vi.fn(),
      exists: vi.fn(),
    } as unknown as PackageRepository;

    // Mock ToolExecutor
    mockExecutor = {
      listTools: vi.fn(),
      executeTool: vi.fn(),
    } as unknown as ToolExecutor;
  });

  describe("init", () => {
    it("should successfully initialize PackageSO instance", async () => {
      // Arrange
      const packageName = "@modelcontextprotocol/server-filesystem";
      const mockConfig: MCPServerPackageConfig = {
        type: "mcp-server",
        runtime: "node",
        packageName,
        name: "Filesystem Server",
        description: "A server for filesystem operations",
      };
      const mockPackageInfo = {
        path: "path/to/package",
        category: "filesystem",
        validated: true,
      };

      vi.spyOn(mockRepository, "getPackageConfig").mockReturnValue(mockConfig);
      vi.spyOn(mockRepository, "getAllPackages").mockReturnValue({
        [packageName]: mockPackageInfo,
      });

      // Act
      const packageSO = await PackageSO.init(packageName, mockRepository, mockExecutor);

      // Assert
      expect(packageSO.packageName).toBe(packageName);
      expect(packageSO.name).toBe("Filesystem Server");
      expect(packageSO.description).toBe("A server for filesystem operations");
      expect(packageSO.category).toBe("filesystem");
      expect(packageSO.validated).toBe(true);
      expect(mockRepository.getPackageConfig).toHaveBeenCalledWith(packageName);
      expect(mockRepository.getAllPackages).toHaveBeenCalled();
    });

    it("should handle case when package config exists but packageInfo does not", async () => {
      // Arrange
      const packageName = "@test/new-package";
      const mockConfig: MCPServerPackageConfig = {
        type: "mcp-server",
        runtime: "node",
        packageName,
        name: "New Package",
        description: "A new package",
      };

      vi.spyOn(mockRepository, "getPackageConfig").mockReturnValue(mockConfig);
      vi.spyOn(mockRepository, "getAllPackages").mockReturnValue({});

      // Act
      const packageSO = await PackageSO.init(packageName, mockRepository, mockExecutor);

      // Assert
      expect(packageSO.packageName).toBe(packageName);
      expect(packageSO.name).toBe("New Package");
      expect(packageSO.category).toBeUndefined();
      expect(packageSO.validated).toBeUndefined();
    });

    it("should handle null description", async () => {
      // Arrange
      const packageName = "@test/package";
      const mockConfig = {
        type: "mcp-server",
        runtime: "node",
        packageName,
        name: "Test Package",
        description: null,
      } as unknown as MCPServerPackageConfig;

      vi.spyOn(mockRepository, "getPackageConfig").mockReturnValue(mockConfig);
      vi.spyOn(mockRepository, "getAllPackages").mockReturnValue({});

      // Act
      const packageSO = await PackageSO.init(packageName, mockRepository, mockExecutor);

      // Assert
      expect(packageSO.description).toBeNull();
    });
  });

  describe("getTools", () => {
    it("should successfully return tools list", async () => {
      // Arrange
      const packageName = "@test/package";
      const mockConfig: MCPServerPackageConfig = {
        type: "mcp-server",
        runtime: "node",
        packageName,
        name: "Test Package",
        description: "Test description",
      };
      const mockTools: Tool[] = [
        {
          name: "read_file",
          description: "Read a file",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string" },
            },
          },
        },
        {
          name: "write_file",
          description: "Write a file",
          inputSchema: {
            type: "object",
            properties: {
              path: { type: "string" },
              content: { type: "string" },
            },
          },
        },
      ];

      vi.spyOn(mockRepository, "getPackageConfig").mockReturnValue(mockConfig);
      vi.spyOn(mockRepository, "getAllPackages").mockReturnValue({});
      vi.spyOn(mockExecutor, "listTools").mockResolvedValue(mockTools);

      const packageSO = await PackageSO.init(packageName, mockRepository, mockExecutor);

      // Act
      const tools = await packageSO.getTools();

      // Assert
      expect(tools).toEqual(mockTools);
      expect(tools).toHaveLength(2);
      expect(mockExecutor.listTools).toHaveBeenCalledWith(packageName);
      expect(mockExecutor.listTools).toHaveBeenCalledTimes(1);
    });

    it("should throw error when executor fails", async () => {
      // Arrange
      const packageName = "@test/package";
      const mockConfig: MCPServerPackageConfig = {
        type: "mcp-server",
        runtime: "node",
        packageName,
        name: "Test Package",
        description: "Test description",
      };
      const errorMessage = "Failed to list tools";

      vi.spyOn(mockRepository, "getPackageConfig").mockReturnValue(mockConfig);
      vi.spyOn(mockRepository, "getAllPackages").mockReturnValue({});
      vi.spyOn(mockExecutor, "listTools").mockRejectedValue(new Error(errorMessage));

      const packageSO = await PackageSO.init(packageName, mockRepository, mockExecutor);

      // Act & Assert
      await expect(packageSO.getTools()).rejects.toThrow(errorMessage);
    });
  });

  describe("executeTool", () => {
    it("should successfully execute tool", async () => {
      // Arrange
      const packageName = "@test/package";
      const toolKey = "read_file";
      const inputData = { path: "/tmp/test.txt" };
      const envs = { ENV_VAR: "test_value" };
      const mockResult = { content: "file content", success: true };

      const mockConfig: MCPServerPackageConfig = {
        type: "mcp-server",
        runtime: "node",
        packageName,
        name: "Test Package",
        description: "Test description",
      };

      vi.spyOn(mockRepository, "getPackageConfig").mockReturnValue(mockConfig);
      vi.spyOn(mockRepository, "getAllPackages").mockReturnValue({});
      vi.spyOn(mockExecutor, "executeTool").mockResolvedValue(mockResult);

      const packageSO = await PackageSO.init(packageName, mockRepository, mockExecutor);

      // Act
      const result = await packageSO.executeTool(toolKey, inputData, envs);

      // Assert
      expect(result).toEqual(mockResult);
      expect(mockExecutor.executeTool).toHaveBeenCalledWith({
        packageName,
        toolKey,
        inputData,
        envs,
      });
      expect(mockExecutor.executeTool).toHaveBeenCalledTimes(1);
    });

    it("should execute normally without envs parameter", async () => {
      // Arrange
      const packageName = "@test/package";
      const toolKey = "read_file";
      const inputData = { path: "/tmp/test.txt" };
      const mockResult = { content: "file content" };

      const mockConfig: MCPServerPackageConfig = {
        type: "mcp-server",
        runtime: "node",
        packageName,
        name: "Test Package",
        description: "Test description",
      };

      vi.spyOn(mockRepository, "getPackageConfig").mockReturnValue(mockConfig);
      vi.spyOn(mockRepository, "getAllPackages").mockReturnValue({});
      vi.spyOn(mockExecutor, "executeTool").mockResolvedValue(mockResult);

      const packageSO = await PackageSO.init(packageName, mockRepository, mockExecutor);

      // Act
      const result = await packageSO.executeTool(toolKey, inputData);

      // Assert
      expect(result).toEqual(mockResult);
      expect(mockExecutor.executeTool).toHaveBeenCalledWith({
        packageName,
        toolKey,
        inputData,
        envs: undefined,
      });
    });

    it("should throw error when tool execution fails", async () => {
      // Arrange
      const packageName = "@test/package";
      const toolKey = "unknown_tool";
      const inputData = { param: "value" };
      const errorMessage = "Unknown tool: unknown_tool";

      const mockConfig: MCPServerPackageConfig = {
        type: "mcp-server",
        runtime: "node",
        packageName,
        name: "Test Package",
        description: "Test description",
      };

      vi.spyOn(mockRepository, "getPackageConfig").mockReturnValue(mockConfig);
      vi.spyOn(mockRepository, "getAllPackages").mockReturnValue({});
      vi.spyOn(mockExecutor, "executeTool").mockRejectedValue(new Error(errorMessage));

      const packageSO = await PackageSO.init(packageName, mockRepository, mockExecutor);

      // Act & Assert
      await expect(packageSO.executeTool(toolKey, inputData)).rejects.toThrow(errorMessage);
    });
  });

  describe("getDetailWithTools", () => {
    it("should return complete package details with tools list", async () => {
      // Arrange
      const packageName = "@test/package";
      const mockConfig: MCPServerPackageConfig = {
        type: "mcp-server",
        runtime: "node",
        packageName,
        name: "Test Package",
        description: "A test package for demonstration",
      };
      const mockPackageInfo = {
        path: "path/to/package",
        category: "testing",
        validated: true,
      };
      const mockTools: Tool[] = [
        {
          name: "test_tool",
          description: "A test tool",
          inputSchema: {
            type: "object",
            properties: {},
          },
        },
      ];

      vi.spyOn(mockRepository, "getPackageConfig").mockReturnValue(mockConfig);
      vi.spyOn(mockRepository, "getAllPackages").mockReturnValue({
        [packageName]: mockPackageInfo,
      });
      vi.spyOn(mockExecutor, "listTools").mockResolvedValue(mockTools);

      const packageSO = await PackageSO.init(packageName, mockRepository, mockExecutor);

      // Act
      const detail = await packageSO.getDetailWithTools();

      // Assert
      expect(detail).toEqual({
        name: "Test Package",
        packageName: "@test/package",
        description: "A test package for demonstration",
        category: "testing",
        validated: true,
        tools: mockTools,
      });
    });

    it("should return undefined tools when getting tools fails", async () => {
      // Arrange
      const packageName = "@test/package";
      const mockConfig: MCPServerPackageConfig = {
        type: "mcp-server",
        runtime: "node",
        packageName,
        name: "Test Package",
        description: "Test description",
      };

      vi.spyOn(mockRepository, "getPackageConfig").mockReturnValue(mockConfig);
      vi.spyOn(mockRepository, "getAllPackages").mockReturnValue({});
      vi.spyOn(mockExecutor, "listTools").mockRejectedValue(new Error("Failed to get tools"));

      const consoleWarnSpy = vi.spyOn(console, "warn").mockImplementation(() => {});

      const packageSO = await PackageSO.init(packageName, mockRepository, mockExecutor);

      // Act
      const detail = await packageSO.getDetailWithTools();

      // Assert
      expect(detail.tools).toBeUndefined();
      expect(detail.name).toBe("Test Package");
      expect(detail.packageName).toBe(packageName);
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        expect.stringContaining(`[PackageSO] Failed to get tools for ${packageName}`),
        expect.any(Error),
      );

      consoleWarnSpy.mockRestore();
    });

    it("should correctly handle packages without category and validated", async () => {
      // Arrange
      const packageName = "@test/minimal-package";
      const mockConfig: MCPServerPackageConfig = {
        type: "mcp-server",
        runtime: "node",
        packageName,
        name: "Minimal Package",
        description: "A minimal package",
      };
      const mockTools: Tool[] = [];

      vi.spyOn(mockRepository, "getPackageConfig").mockReturnValue(mockConfig);
      vi.spyOn(mockRepository, "getAllPackages").mockReturnValue({});
      vi.spyOn(mockExecutor, "listTools").mockResolvedValue(mockTools);

      const packageSO = await PackageSO.init(packageName, mockRepository, mockExecutor);

      // Act
      const detail = await packageSO.getDetailWithTools();

      // Assert
      expect(detail).toEqual({
        name: "Minimal Package",
        packageName: "@test/minimal-package",
        description: "A minimal package",
        category: undefined,
        validated: undefined,
        tools: mockTools,
      });
    });
  });

  describe("Getters", () => {
    it("should correctly access all properties through getters", async () => {
      // Arrange
      const packageName = "@test/package";
      const mockConfig: MCPServerPackageConfig = {
        type: "mcp-server",
        runtime: "node",
        packageName,
        name: "Test Package",
        description: "Test description",
      };
      const mockPackageInfo = {
        path: "path/to/package",
        category: "test-category",
        validated: false,
      };

      vi.spyOn(mockRepository, "getPackageConfig").mockReturnValue(mockConfig);
      vi.spyOn(mockRepository, "getAllPackages").mockReturnValue({
        [packageName]: mockPackageInfo,
      });

      // Act
      const packageSO = await PackageSO.init(packageName, mockRepository, mockExecutor);

      // Assert
      expect(packageSO.packageName).toBe(packageName);
      expect(packageSO.name).toBe("Test Package");
      expect(packageSO.description).toBe("Test description");
      expect(packageSO.category).toBe("test-category");
      expect(packageSO.validated).toBe(false);
      expect(packageSO.config).toEqual(mockConfig);
    });

    it("should return complete config object through config getter", async () => {
      // Arrange
      const packageName = "@test/package";
      const mockConfig: MCPServerPackageConfig = {
        type: "mcp-server",
        runtime: "node",
        packageName,
        name: "Test Package",
        description: "Test description",
      };

      vi.spyOn(mockRepository, "getPackageConfig").mockReturnValue(mockConfig);
      vi.spyOn(mockRepository, "getAllPackages").mockReturnValue({});

      // Act
      const packageSO = await PackageSO.init(packageName, mockRepository, mockExecutor);

      // Assert
      expect(packageSO.config).toBe(mockConfig);
      expect(packageSO.config).toEqual({
        name: "Test Package",
        description: "Test description",
      });
    });
  });
});
