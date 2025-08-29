import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
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

describe("SearchService", () => {
  beforeEach(() => {
    // Reset the search service state before each test
    (searchService as any).isInitialized = false;
    (searchService as any).index = null;

    // Clear all mocks
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe("initialize", () => {
    it("should initialize the search service successfully", async () => {
      await searchService.initialize();
      expect((searchService as any).isInitialized).toBe(true);
    });

    it("should handle index already exists error", async () => {
      const consoleLogSpy = vi.spyOn(console, "log").mockImplementation(() => {});
      const consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});

      // Mock createIndex to throw "already exists" error
      const mockCreateIndex = vi.fn().mockImplementation(() => {
        throw new Error("index already exists");
      });

      // Temporarily replace the mock
      const originalMock = (searchService as any).client.createIndex;
      (searchService as any).client.createIndex = mockCreateIndex;

      await searchService.initialize();

      expect(consoleLogSpy).toHaveBeenCalledWith("✅ Using existing index: mcp-packages");
      expect((searchService as any).isInitialized).toBe(true);

      // Restore the mock
      (searchService as any).client.createIndex = originalMock;
      consoleLogSpy.mockRestore();
      consoleErrorSpy.mockRestore();
    });
  });

  describe("configureIndex", () => {
    it("should configure index settings", async () => {
      await searchService.initialize();
      await searchService.configureIndex();
      if (searchService.index) {
        expect(searchService.index.updateSettings).toHaveBeenCalled();
      }
    });
  });

  describe("transformPackageForIndex", () => {
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
  });

  describe("createSafeId", () => {
    it("should create a safe ID for MeiliSearch", () => {
      const packageName = "@test/package";
      const result = searchService.createSafeId(packageName);
      expect(result).toBe("at-test-package");
    });
  });

  describe("calculatePopularityScore", () => {
    it("should calculate popularity score based on package data", () => {
      const packageData = {
        validated: true,
        tools: {
          tool1: {},
          tool2: {},
        },
        description: "This is a detailed description that is longer than 50 characters",
      };

      const result = searchService.calculatePopularityScore(packageData);
      // 10 (validated) + 4 (2 tools * 2) + 5 (long description) = 19
      expect(result).toBe(19);
    });
  });

  describe("extractAuthor", () => {
    it("should extract author from scoped package name", () => {
      const packageName = "@test/package";
      const result = searchService.extractAuthor(packageName);
      expect(result).toBe("test");
    });

    it("should return empty string for non-scoped package", () => {
      const packageName = "package";
      const result = searchService.extractAuthor(packageName);
      expect(result).toBe("");
    });
  });

  describe("extractKeywords", () => {
    it("should extract keywords from package data", () => {
      const packageData = {
        category: "testing-tools",
        description: "A package for testing with database support",
      };
      const packageName = "@test/testing-package";

      const result = searchService.extractKeywords(packageData, packageName);
      expect(result).toContain("testing");
      expect(result).toContain("tools");
      expect(result).toContain("test");
      expect(result).toContain("package");
    });
  });

  describe("indexPackages", () => {
    it("should throw error if service is not initialized", async () => {
      await expect(searchService.indexPackages()).rejects.toThrow(
        "Search service not initialized. Call initialize() first.",
      );
    });

    it("should index packages successfully", async () => {
      await searchService.initialize();
      const result = await searchService.indexPackages();

      expect(result.numberOfDocuments).toBe(100);
      if (searchService.index) {
        expect(searchService.index.addDocuments).toHaveBeenCalled();
      }
    });
  });

  describe("search", () => {
    it("should throw error if service is not initialized", async () => {
      await expect(searchService.search("test")).rejects.toThrow(
        "Search service not initialized. Call initialize() first.",
      );
    });

    it("should perform search successfully", async () => {
      await searchService.initialize();
      const result = await searchService.search("test");

      expect(result).toEqual({
        hits: [{ id: "1", name: "Test Package" }],
        query: "test",
        processingTimeMs: 10,
        limit: 20,
        offset: 0,
        estimatedTotalHits: 1,
      });
    });
  });

  describe("suggest", () => {
    it("should throw error if service is not initialized", async () => {
      await expect(searchService.suggest("test")).rejects.toThrow(
        "Search service not initialized. Call initialize() first.",
      );
    });

    it("should get suggestions successfully", async () => {
      await searchService.initialize();

      // Mock search to return suggestion format
      if (!searchService.index) {
        return;
      }
      searchService.index.search = vi.fn().mockResolvedValue({
        hits: [
          {
            name: "Test Package",
            packageName: "@test/package",
            category: "testing",
            _formatted: { name: "Test Package" },
          },
        ],
      });

      const result = await searchService.suggest("test");

      expect(result).toEqual([
        {
          name: "Test Package",
          packageName: "@test/package",
          category: "testing",
          highlighted: "Test Package",
        },
      ]);
    });
  });

  describe("getFacets", () => {
    it("should throw error if service is not initialized", async () => {
      await expect(searchService.getFacets()).rejects.toThrow(
        "Search service not initialized. Call initialize() first.",
      );
    });

    it("should get facets successfully", async () => {
      await searchService.initialize();
      // Mock search to return facets
      if (!searchService.index) {
        return;
      }
      searchService.index.search = vi.fn().mockResolvedValue({
        facetDistribution: {
          category: { testing: 1 },
          validated: { true: 1 },
          author: { test: 1 },
        },
      });

      const result = await searchService.getFacets();

      expect(result).toEqual({
        category: { testing: 1 },
        validated: { true: 1 },
        author: { test: 1 },
      });
    });
  });

  describe("getStats", () => {
    it("should throw error if service is not initialized", async () => {
      await expect(searchService.getStats()).rejects.toThrow(
        "Search service not initialized. Call initialize() first.",
      );
    });

    it("should get stats successfully", async () => {
      await searchService.initialize();
      const result = await searchService.getStats();

      expect(result).toEqual({
        numberOfDocuments: 100,
        isIndexing: false,
        fieldDistribution: {},
      });
    });
  });

  describe("clearIndex", () => {
    it("should throw error if service is not initialized", async () => {
      await expect(searchService.clearIndex()).rejects.toThrow(
        "Search service not initialized. Call initialize() first.",
      );
    });

    it("should clear index successfully", async () => {
      await searchService.initialize();
      await searchService.clearIndex();
      if (!searchService.index) {
        return;
      }
      expect(searchService.index.deleteAllDocuments).toHaveBeenCalled();
    });
  });

  describe("healthCheck", () => {
    it("should perform health check successfully", async () => {
      await searchService.initialize();
      const result = await searchService.healthCheck();

      expect(result).toEqual({
        status: "healthy",
        host: "http://localhost:7700",
        initialized: true,
        indexName: "mcp-packages",
        documentCount: 100,
      });
    });

    it("should handle health check when not initialized", async () => {
      const freshSearchService = new (searchService.constructor as any)("mcp-packages");
      const result = await freshSearchService.healthCheck();

      expect(result).toEqual({
        status: "healthy",
        host: "http://localhost:7700",
        initialized: false,
        indexName: "mcp-packages",
        documentCount: 0,
      });
    });
  });
});
