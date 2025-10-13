// npx vitest run src/sandbox/mcp-sandbox-client.test.ts

import type { Tool } from "@modelcontextprotocol/sdk/types.js";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import type { MCPServerPackageConfig } from "../types";
import { MCPSandboxClient } from "./mcp-sandbox-client";

// Mock Daytona SDK
vi.mock("@daytonaio/sdk", () => {
  const mockSandbox = {
    process: {
      codeRun: vi.fn(),
    },
    delete: vi.fn().mockResolvedValue(undefined),
  };

  const mockVolume = {
    id: "mock-volume-id",
  };

  const mockDaytona = {
    create: vi.fn().mockResolvedValue(mockSandbox),
    volume: {
      get: vi.fn().mockResolvedValue(mockVolume),
    },
  };

  return {
    Daytona: vi.fn(() => mockDaytona),
    Image: {
      base: vi.fn().mockReturnValue({
        runCommands: vi.fn().mockReturnThis(),
        workdir: vi.fn().mockReturnThis(),
      }),
    },
  };
});

// Mock helper functions
vi.mock("../helper", () => ({
  extractLastOuterJSON: vi.fn((str: string) => str),
  getPackageConfigByKey: vi.fn(
    async (key: string): Promise<MCPServerPackageConfig> => ({
      type: "mcp-server",
      packageName: `@test/${key}`,
      name: "Test Package",
      description: "Test Description",
      runtime: "node",
      env: {
        TEST_API_KEY: {
          description: "Test API Key",
          required: true,
        },
      },
    }),
  ),
}));

// Helper function to get mocked Daytona instance
async function getMockedDaytonaInstance() {
  const { Daytona } = await import("@daytonaio/sdk");
  const DaytonaMock = Daytona as unknown as ReturnType<typeof vi.fn>;
  return DaytonaMock.mock.results[0].value;
}

// Helper function to get mocked sandbox
async function getMockedSandbox() {
  const daytonaInstance = await getMockedDaytonaInstance();
  return daytonaInstance.create.mock.results[0].value;
}

// Helper function to mock extractLastOuterJSON
async function getMockedExtractJSON() {
  const { extractLastOuterJSON } = await import("../helper");
  return extractLastOuterJSON as ReturnType<typeof vi.fn>;
}

describe("MCPSandboxClient - MCP Sandbox Client Unit Tests", () => {
  let client: MCPSandboxClient;

  beforeEach(() => {
    vi.clearAllMocks();
    client = new MCPSandboxClient("node");
  });

  afterEach(async () => {
    if (client) {
      await client.kill();
    }
  });

  describe("Initialization Tests", () => {
    it("should successfully initialize Sandbox", async () => {
      await client.initialize();

      // Verify Daytona is called correctly
      const { Daytona } = await import("@daytonaio/sdk");
      expect(Daytona).toHaveBeenCalledWith({
        apiKey: expect.any(String),
      });
    });

    it("should prevent duplicate initialization", async () => {
      // First initialization
      await client.initialize();

      // Second initialization should return directly without creating new sandbox
      await client.initialize();

      const daytonaInstance = await getMockedDaytonaInstance();

      // create should only be called once
      expect(daytonaInstance.create).toHaveBeenCalledTimes(1);
    });

    it("should support concurrent initialization calls", async () => {
      // Initiate multiple initialization requests simultaneously
      const promises = [client.initialize(), client.initialize(), client.initialize()];

      await Promise.all(promises);

      const daytonaInstance = await getMockedDaytonaInstance();

      // Even with concurrent calls, create should only be called once
      expect(daytonaInstance.create).toHaveBeenCalledTimes(1);
    });

    it("should use correct runtime configuration", () => {
      const nodeClient = new MCPSandboxClient("node");
      const pythonClient = new MCPSandboxClient("python");

      expect(nodeClient).toBeDefined();
      expect(pythonClient).toBeDefined();
    });
  });

  describe("listTools - List Tools Tests", () => {
    it("should successfully list tools", async () => {
      await client.initialize();

      const mockTools: Tool[] = [
        {
          name: "test_tool_1",
          description: "Test Tool 1",
          inputSchema: {
            type: "object",
            properties: {
              param1: { type: "string" },
            },
          },
        },
        {
          name: "test_tool_2",
          description: "Test Tool 2",
          inputSchema: {
            type: "object",
            properties: {
              param2: { type: "number" },
            },
          },
        },
      ];

      const mockResponse = {
        exitCode: 0,
        result: JSON.stringify({
          toolCount: 2,
          tools: mockTools,
        }),
      };

      const mockSandbox = await getMockedSandbox();
      mockSandbox.process.codeRun.mockResolvedValue(mockResponse);

      const extractMock = await getMockedExtractJSON();
      extractMock.mockReturnValue(mockResponse.result);

      const tools = await client.listTools("test-package");

      expect(tools).toEqual(mockTools);
      expect(tools).toHaveLength(2);
      expect(mockSandbox.process.codeRun).toHaveBeenCalledWith(expect.any(String));
    });

    it("should throw error when Sandbox is not initialized", async () => {
      await expect(client.listTools("test-package")).rejects.toThrow(
        "Sandbox not initialized. Call initialize() first.",
      );
    });

    it("should handle execution failure", async () => {
      await client.initialize();

      const mockResponse = {
        exitCode: 1,
        result: "Error: Failed to list tools",
      };

      const mockSandbox = await getMockedSandbox();
      mockSandbox.process.codeRun.mockResolvedValue(mockResponse);

      await expect(client.listTools("test-package")).rejects.toThrow(
        "Failed to list tools",
      );
    });

    it("should handle JSON parsing errors", async () => {
      await client.initialize();

      const mockResponse = {
        exitCode: 0,
        result: "invalid json",
      };

      const mockSandbox = await getMockedSandbox();
      mockSandbox.process.codeRun.mockResolvedValue(mockResponse);

      const extractMock = await getMockedExtractJSON();
      extractMock.mockReturnValue("invalid json");

      await expect(client.listTools("test-package")).rejects.toThrow();
    });
  });

  describe("executeTool - Execute Tool Tests", () => {
    it("should successfully execute tool", async () => {
      await client.initialize();

      const mockResult = {
        result: { message: "Success", data: { value: 42 } },
        isError: false,
      };

      const mockResponse = {
        exitCode: 0,
        result: JSON.stringify(mockResult),
      };

      const mockSandbox = await getMockedSandbox();
      mockSandbox.process.codeRun.mockResolvedValue(mockResponse);

      const extractMock = await getMockedExtractJSON();
      extractMock.mockReturnValue(mockResponse.result);

      const result = await client.executeTool("test-package", "test_tool", {
        param1: "value1",
      });

      expect(result).toEqual(mockResult);
      expect(mockSandbox.process.codeRun).toHaveBeenCalledWith(expect.any(String));
    });

    it("should support passing environment variables", async () => {
      await client.initialize();

      const mockResult = {
        result: { message: "Success with env" },
        isError: false,
      };

      const mockResponse = {
        exitCode: 0,
        result: JSON.stringify(mockResult),
      };

      const mockSandbox = await getMockedSandbox();
      mockSandbox.process.codeRun.mockResolvedValue(mockResponse);

      const extractMock = await getMockedExtractJSON();
      extractMock.mockReturnValue(mockResponse.result);

      const envs = {
        TEST_API_KEY: "real-api-key-123",
        TEST_SECRET: "secret-value",
      };

      const result = await client.executeTool(
        "test-package",
        "test_tool",
        { param1: "value1" },
        envs,
      );

      expect(result).toEqual(mockResult);

      // Verify generated code contains environment variables
      const generatedCode = mockSandbox.process.codeRun.mock.calls[0][0] as string;
      expect(generatedCode).toContain("TEST_API_KEY");
    });

    it("should handle tool execution errors", async () => {
      await client.initialize();

      const mockResult = {
        result: null,
        isError: true,
        errorMessage: "Tool execution failed: Invalid parameters",
      };

      const mockResponse = {
        exitCode: 0,
        result: JSON.stringify(mockResult),
      };

      const mockSandbox = await getMockedSandbox();
      mockSandbox.process.codeRun.mockResolvedValue(mockResponse);

      const extractMock = await getMockedExtractJSON();
      extractMock.mockReturnValue(mockResponse.result);

      await expect(
        client.executeTool("test-package", "test_tool", { invalid: "param" }),
      ).rejects.toThrow("Tool execution failed: Invalid parameters");
    });

    it("should throw error when Sandbox is not initialized", async () => {
      await expect(
        client.executeTool("test-package", "test_tool", {}),
      ).rejects.toThrow("Sandbox not initialized. Call initialize() first.");
    });

    it("should handle non-zero process exit code", async () => {
      await client.initialize();

      const mockResponse = {
        exitCode: 1,
        result: "Process crashed",
      };

      const mockSandbox = await getMockedSandbox();
      mockSandbox.process.codeRun.mockResolvedValue(mockResponse);

      await expect(
        client.executeTool("test-package", "test_tool", {}),
      ).rejects.toThrow("Failed to execute tool");
    });

    it("should correctly serialize complex argument objects", async () => {
      await client.initialize();

      const complexArgs = {
        stringParam: "test",
        numberParam: 42,
        booleanParam: true,
        arrayParam: [1, 2, 3],
        objectParam: { nested: { value: "deep" } },
      };

      const mockResult = {
        result: { success: true },
        isError: false,
      };

      const mockResponse = {
        exitCode: 0,
        result: JSON.stringify(mockResult),
      };

      const mockSandbox = await getMockedSandbox();
      mockSandbox.process.codeRun.mockResolvedValue(mockResponse);

      const extractMock = await getMockedExtractJSON();
      extractMock.mockReturnValue(mockResponse.result);

      await client.executeTool("test-package", "test_tool", complexArgs);

      const generatedCode = mockSandbox.process.codeRun.mock.calls[0][0] as string;
      expect(generatedCode).toContain(JSON.stringify(complexArgs));
    });
  });

  describe("kill - Cleanup Tests", () => {
    it("should successfully cleanup Sandbox", async () => {
      await client.initialize();

      const mockSandbox = await getMockedSandbox();

      await client.kill();

      expect(mockSandbox.delete).toHaveBeenCalledTimes(1);
    });

    it("should safely return when Sandbox is not initialized", async () => {
      // Call kill directly without initialization
      await expect(client.kill()).resolves.not.toThrow();
    });

    it("should handle deletion failure", async () => {
      await client.initialize();

      const mockSandbox = await getMockedSandbox();

      mockSandbox.delete.mockRejectedValue(new Error("Delete failed"));

      // Should not throw error even if deletion fails
      await expect(client.kill()).resolves.not.toThrow();
    });

    it("should reset Sandbox state after kill", async () => {
      await client.initialize();
      await client.kill();

      // Calling methods that require Sandbox should throw error
      await expect(client.listTools("test-package")).rejects.toThrow(
        "Sandbox not initialized",
      );
    });
  });

  describe("Code Generation Tests", () => {
    it("generated listTools code should contain necessary imports", async () => {
      await client.initialize();

      const mockResponse = {
        exitCode: 0,
        result: JSON.stringify({ toolCount: 0, tools: [] }),
      };

      const mockSandbox = await getMockedSandbox();
      mockSandbox.process.codeRun.mockResolvedValue(mockResponse);

      const extractMock = await getMockedExtractJSON();
      extractMock.mockReturnValue(mockResponse.result);

      await client.listTools("test-package");

      const generatedCode = mockSandbox.process.codeRun.mock.calls[0][0] as string;

      // Verify necessary imports
      expect(generatedCode).toContain("import { Client }");
      expect(generatedCode).toContain("import { StdioClientTransport }");
      expect(generatedCode).toContain("@modelcontextprotocol/sdk");
    });

    it("generated executeTool code should contain tool name and arguments", async () => {
      await client.initialize();

      const mockResponse = {
        exitCode: 0,
        result: JSON.stringify({ result: {}, isError: false }),
      };

      const mockSandbox = await getMockedSandbox();
      mockSandbox.process.codeRun.mockResolvedValue(mockResponse);

      const extractMock = await getMockedExtractJSON();
      extractMock.mockReturnValue(mockResponse.result);

      await client.executeTool("test-package", "my_tool", { key: "value" });

      const generatedCode = mockSandbox.process.codeRun.mock.calls[0][0] as string;

      expect(generatedCode).toContain("my_tool");
      expect(generatedCode).toContain("client.callTool");
      expect(generatedCode).toContain(JSON.stringify({ key: "value" }));
    });

    it("generated code should use pnpx to execute package", async () => {
      await client.initialize();

      const mockResponse = {
        exitCode: 0,
        result: JSON.stringify({ toolCount: 0, tools: [] }),
      };

      const mockSandbox = await getMockedSandbox();
      mockSandbox.process.codeRun.mockResolvedValue(mockResponse);

      const extractMock = await getMockedExtractJSON();
      extractMock.mockReturnValue(mockResponse.result);

      await client.listTools("test-package");

      const generatedCode = mockSandbox.process.codeRun.mock.calls[0][0] as string;

      expect(generatedCode).toContain('command: "pnpx"');
      expect(generatedCode).toContain('"--silent"');
    });

    it("generated code should contain environment variable configuration", async () => {
      await client.initialize();

      const mockResponse = {
        exitCode: 0,
        result: JSON.stringify({ result: {}, isError: false }),
      };

      const mockSandbox = await getMockedSandbox();
      mockSandbox.process.codeRun.mockResolvedValue(mockResponse);

      const extractMock = await getMockedExtractJSON();
      extractMock.mockReturnValue(mockResponse.result);

      await client.executeTool(
        "test-package",
        "test_tool",
        {},
        { TEST_API_KEY: "real-value" },
      );

      const generatedCode = mockSandbox.process.codeRun.mock.calls[0][0] as string;

      expect(generatedCode).toContain("PNPM_HOME");
      expect(generatedCode).toContain("PNPM_STORE_PATH");
      expect(generatedCode).toContain("TEST_API_KEY");
    });

    it("generated code should correctly handle missing environment variables", async () => {
      await client.initialize();

      const mockResponse = {
        exitCode: 0,
        result: JSON.stringify({ toolCount: 0, tools: [] }),
      };

      const mockSandbox = await getMockedSandbox();
      mockSandbox.process.codeRun.mockResolvedValue(mockResponse);

      const extractMock = await getMockedExtractJSON();
      extractMock.mockReturnValue(mockResponse.result);

      // Do not pass real environment variables
      await client.listTools("test-package");

      const generatedCode = mockSandbox.process.codeRun.mock.calls[0][0] as string;

      // Should use mock_value as default value
      expect(generatedCode).toContain("mock_value");
    });
  });

  describe("Edge Cases and Exception Tests", () => {
    it("should handle empty tool list", async () => {
      await client.initialize();

      const mockResponse = {
        exitCode: 0,
        result: JSON.stringify({ toolCount: 0, tools: [] }),
      };

      const mockSandbox = await getMockedSandbox();
      mockSandbox.process.codeRun.mockResolvedValue(mockResponse);

      const extractMock = await getMockedExtractJSON();
      extractMock.mockReturnValue(mockResponse.result);

      const tools = await client.listTools("empty-package");

      expect(tools).toEqual([]);
      expect(tools).toHaveLength(0);
    });

    it("should handle empty argument object", async () => {
      await client.initialize();

      const mockResult = {
        result: { success: true },
        isError: false,
      };

      const mockResponse = {
        exitCode: 0,
        result: JSON.stringify(mockResult),
      };

      const mockSandbox = await getMockedSandbox();
      mockSandbox.process.codeRun.mockResolvedValue(mockResponse);

      const extractMock = await getMockedExtractJSON();
      extractMock.mockReturnValue(mockResponse.result);

      await expect(client.executeTool("test-package", "test_tool", {})).resolves.toEqual(
        mockResult,
      );
    });

    it("should handle non-existent package", async () => {
      const { getPackageConfigByKey } = await import("../helper");
      const getPackageMock = getPackageConfigByKey as ReturnType<typeof vi.fn>;
      getPackageMock.mockRejectedValueOnce(
        new Error("Package 'non-existent' not found in packages list."),
      );

      await client.initialize();

      await expect(client.listTools("non-existent")).rejects.toThrow(
        "Package 'non-existent' not found",
      );
    });

    it("should handle network timeout", async () => {
      await client.initialize();

      const mockSandbox = await getMockedSandbox();
      mockSandbox.process.codeRun.mockRejectedValueOnce(new Error("Network timeout"));

      await expect(client.listTools("test-package")).rejects.toThrow("Network timeout");
    });
  });

  describe("Complete Workflow Tests", () => {
    it("should support complete workflow: initialize -> list tools -> execute tool -> cleanup", async () => {
      // 1. Initialize
      await client.initialize();

      const mockSandbox = await getMockedSandbox();

      // 2. List tools
      const mockTools: Tool[] = [
        {
          name: "hello_tool",
          description: "Say hello",
          inputSchema: {
            type: "object",
            properties: { name: { type: "string" } },
          },
        },
      ];

      mockSandbox.process.codeRun.mockResolvedValueOnce({
        exitCode: 0,
        result: JSON.stringify({ toolCount: 1, tools: mockTools }),
      });

      const extractMock = await getMockedExtractJSON();
      extractMock.mockImplementation((str: string) => str);

      const tools = await client.listTools("test-package");
      expect(tools).toHaveLength(1);
      expect(tools[0].name).toBe("hello_tool");

      // 3. Execute tool
      mockSandbox.process.codeRun.mockResolvedValueOnce({
        exitCode: 0,
        result: JSON.stringify({
          result: { message: "Hello, World!" },
          isError: false,
        }),
      });

      const result = await client.executeTool("test-package", "hello_tool", {
        name: "World",
      });
      expect(result).toHaveProperty("result");

      // 4. Cleanup
      await client.kill();
      expect(mockSandbox.delete).toHaveBeenCalled();
    });

    it("should support multiple tool executions", async () => {
      await client.initialize();

      const mockSandbox = await getMockedSandbox();

      const extractMock = await getMockedExtractJSON();
      extractMock.mockImplementation((str: string) => str);

      // Execute multiple times
      for (let i = 0; i < 3; i++) {
        mockSandbox.process.codeRun.mockResolvedValueOnce({
          exitCode: 0,
          result: JSON.stringify({
            result: { iteration: i },
            isError: false,
          }),
        });

        const result = await client.executeTool("test-package", "test_tool", {
          index: i,
        });
        expect(result).toHaveProperty("result");
      }

      expect(mockSandbox.process.codeRun).toHaveBeenCalledTimes(3);
    });
  });
});
