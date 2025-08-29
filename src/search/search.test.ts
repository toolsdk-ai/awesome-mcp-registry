import { describe, expect, it, vi } from "vitest";
import searchService from "./search-service";

// Mock the MeiliSearch client
vi.mock("meilisearch", () => {
  return {
    MeiliSearch: vi.fn().mockImplementation(() => {
      const mockIndex = {
        updateSettings: vi.fn().mockResolvedValue({ taskUid: "settings-task" }),
        addDocuments: vi.fn().mockResolvedValue({ taskUid: "documents-task" }),
        getStats: vi.fn().mockResolvedValue({
          numberOfDocuments: 100,
          isIndexing: false,
          fieldDistribution: {},
        }),
        search: vi.fn().mockResolvedValue({
          hits: [{ id: "1", name: "Test Package" }],
          query: "test",
          processingTimeMs: 10,
          limit: 20,
          offset: 0,
          estimatedTotalHits: 1,
        }),
        getTask: vi.fn().mockResolvedValue({ status: "succeeded" }),
        deleteAllDocuments: vi.fn().mockResolvedValue({ taskUid: "clear-task" }),
      };

      return {
        health: vi.fn().mockResolvedValue({ status: "available" }),
        createIndex: vi.fn().mockResolvedValue({ uid: "test-task" }),
        getIndex: vi.fn().mockResolvedValue(mockIndex),
        index: vi.fn().mockReturnValue(mockIndex),
        waitForTask: vi.fn().mockResolvedValue({ status: "succeeded" }),
      };
    }),
  };
});

// Mock fs module
vi.mock("node:fs/promises", () => {
  return {
    default: {
      readFile: vi.fn().mockResolvedValue(
        JSON.stringify({
          "@test/package": {
            name: "Test Package",
            description: "A test package",
          },
        }),
      ),
    },
  };
});

describe("SearchService - MCP Registry Search Service Test", () => {
  it("should initialize search service successfully", async () => {
    const result = await searchService.initialize();
    expect(result).toBeUndefined();
  });

  it("should transform package data for indexing", () => {
    const packageName = "@test/package";
    const packageData = {
      name: "Test Package",
      description: "A test package",
      category: "testing",
      validated: true,
      tools: {
        "test-tool": { description: "A test tool" },
      },
    };

    const result = searchService.transformPackageForIndex(packageName, packageData);

    expect(result).toEqual({
      id: "at-test-package",
      name: "Test Package",
      packageName: "@test/package",
      description: "A test package",
      category: "testing",
      validated: true,
      author: "test",
      tools: "test-tool A test tool",
      toolCount: 1,
      hasTools: true,
      keywords: expect.any(String),
      popularity: expect.any(Number),
      path: "",
    });
  });

  it("should perform search successfully", async () => {
    // First initialize the service
    await searchService.initialize();

    // Mock the search result
    const mockResult = {
      hits: [{ id: "1", name: "Test Package" }],
      query: "test",
      processingTimeMs: 10,
      limit: 20,
      offset: 0,
      estimatedTotalHits: 1,
    };

    if (searchService.index) {
      searchService.index.search = vi.fn().mockResolvedValue(mockResult);
    }

    const result = await searchService.search("test");

    expect(result).toEqual(mockResult);
  });
});
