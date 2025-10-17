import path from "node:path";
import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import dotenv from "dotenv";
import type { Context } from "hono";
import { configRoutes } from "../domains/config/config-route";
import { packageRoutes } from "../domains/package/package-route";
import { searchRoutes } from "../domains/search/search-route";
import { SearchSO } from "../domains/search/search-so";
import { getDirname } from "../shared/utils/file-util";

const __dirname = getDirname(import.meta.url);

// 加载环境变量
dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

// 初始化搜索服务
const initializeSearchService = async () => {
  try {
    await SearchSO.getInstance();
    console.log("🔍 Search service initialized");
  } catch (error) {
    console.warn("⚠️  Search service initialization failed:", (error as Error).message);
    console.log("💡 Install and start MeiliSearch to enable enhanced search features");
  }
};

const app = new OpenAPIHono();

// Domain routes
app.route("/api/v1", packageRoutes);
app.route("/api/v1", configRoutes);

// 仅在启用搜索时加载搜索路由
if (process.env.ENABLE_SEARCH === "true") {
  initializeSearchService().catch(console.error);
  app.route("/api/v1", searchRoutes);
}

// 首页
app.get("/", (c: Context) => {
  return c.json({
    message: "MCP Registry API Server",
    version: "1.0.0",
    status: "running",
    docs: "/swagger",
  });
});

// 元信息
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

// 404 处理
app.notFound((c: Context) => {
  return c.json({ success: false, code: 404, message: "[Registry API] Route not found" }, 404);
});

// 错误处理
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

// 启动服务器
const port = Number.parseInt(process.env.PORT || "3003", 10);

console.log(`🚀 Server is starting on port ${port}...`);

serve({
  fetch: app.fetch,
  port,
});

console.log(`✅ Server is running on http://localhost:${port}`);

export default app;
