import { readFileSync } from "node:fs";
import { join } from "node:path";
import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import type { Context } from "hono";
import { configRoutes } from "../domains/config/config-route";
import { packageRoutes } from "../domains/package/package-route";
import { searchRoutes } from "../domains/search/search-route";
import { SearchSO } from "../domains/search/search-so";
import { getServerPort, isSearchEnabled } from "../shared/config/environment";
import { getDirname } from "../shared/utils";

const initializeSearchService = async () => {
  try {
    await SearchSO.getInstance();
    console.log("🔍 Search service initialized");
  } catch (error) {
    console.warn("⚠️  Search service initialization failed:", (error as Error).message);
    console.log("💡 Install and start MeiliSearch to enable enhanced search features");
  }
};

// Load search.html content
const __dirname = getDirname(import.meta.url);
const searchHtmlPath = join(__dirname, "../domains/search/search.html");
const searchHtmlContent = readFileSync(searchHtmlPath, "utf-8");

const app = new OpenAPIHono();

// Domain routes
app.route("/api/v1", packageRoutes);
app.route("/api/v1/config", configRoutes);

if (isSearchEnabled()) {
  initializeSearchService().catch(console.error);
  app.route("/api/v1/search", searchRoutes);
}

app.get("/", (c: Context) => {
  return c.html(searchHtmlContent);
});

app.get("/api/meta", async (c: Context) => {
  try {
    const packageJson = await import("../../package.json", {
      assert: { type: "json" },
    });
    return c.json({ version: packageJson.default.version });
  } catch (error) {
    console.error("Failed to load package.json:", error);
    return c.json({ version: "unknown" });
  }
});

// OpenAPI documentation
app.doc("/api/v1/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "MCP Registry API",
  },
});

// Swagger UI
app.get("/swagger", swaggerUI({ url: "/api/v1/doc" }));

app.notFound((c: Context) => {
  return c.json({ success: false, code: 404, message: "[Registry API] Route not found" }, 404);
});

app.onError((err: Error, c: Context) => {
  console.error("Server Error:", err);
  return c.json(
    {
      success: false,
      code: 500,
      message: `[Registry API] Internal server error, errMsg: ${err.message}`,
    },
    500,
  );
});

const port = getServerPort();

serve({
  fetch: app.fetch,
  port,
});

console.log(`🚀 Server is running on http://localhost:${port}`);

export default app;
