import fs from "node:fs/promises";
import path from "node:path";
import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
// import dotenv from "dotenv";
import type { Context } from "hono";
import searchService from "../core/search/SearchService";
import { getServerPort, isSearchEnabled } from "../shared/config/environment";
import { getDirname } from "../utils";
import { configRoutes } from "./routes/config.route";
import { packageRoutes } from "./routes/package.route";
import { searchRoutes } from "./routes/search.route";

const __dirname = getDirname(import.meta.url);

// dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
// dotenv.config({ path: path.resolve(process.cwd(), ".env") });

/**
 * 初始化搜索服务
 */
const initializeSearchService = async () => {
  try {
    await searchService.initialize();
    console.log("🔍 Search service initialized");
  } catch (error) {
    console.warn("⚠️  Search service initialization failed:", (error as Error).message);
    console.log("💡 Install and start MeiliSearch to enable enhanced search features");
  }
};

const app: OpenAPIHono = new OpenAPIHono();

// 注册路由
app.route("/api/v1", packageRoutes);
app.route("/api/v1", configRoutes);

// 如果启用搜索，注册搜索路由
if (isSearchEnabled()) {
  initializeSearchService().catch(console.error);
  app.route("/api/v1", searchRoutes);
}

/**
 * 首页路由
 */
app.get("/", async (c: Context) => {
  try {
    const htmlPath = path.join(__dirname, "..", "search", "search.html");
    const html = await fs.readFile(htmlPath, "utf8");
    return c.html(html);
  } catch (error) {
    console.error("Failed to load home page:", error);
    return c.text("MCP Registry API Server is running!");
  }
});

/**
 * 元数据路由
 */
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

/**
 * OpenAPI 文档
 */
app.doc("/api/v1/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "MCP Registry API",
  },
});

/**
 * Swagger UI
 */
app.get("/swagger", swaggerUI({ url: "/api/v1/doc" }));

/**
 * 404 处理
 */
app.notFound((c: Context) => {
  return c.json({ success: false, code: 404, message: "[Registry API] Route not found" }, 404);
});

/**
 * 错误处理
 */
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

/**
 * 启动服务器
 */
const port = getServerPort();
console.log(`Server is running on: http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
