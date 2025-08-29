import fs from "node:fs/promises"; // The imports and exports are not sorted.
import path from "node:path";
import { fileURLToPath } from "node:url";
import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import dotenv from "dotenv";
import type { Context } from "hono";
import searchService from "../search/search-service";
import { packageRoutes } from "./package-route";
import { searchRoutes } from "./search-route";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const initializeSearchService = async () => {
  try {
    await searchService.initialize();
    console.log("🔍 Search service initialized");
  } catch (error) {
    console.warn("⚠️  Search service initialization failed:", (error as Error).message);
    console.log("💡 Install and start MeiliSearch to enable enhanced search features");
  }
};

if (process.env.ENABLE_SEARCH === "true") {
  initializeSearchService().catch(console.error);
}

const app: OpenAPIHono = new OpenAPIHono();

app.route("/api/v1", packageRoutes);

app.route("/api/v1", searchRoutes);

// 主页路由，提供搜索页面
app.get("/", async (c: Context) => {
  try {
    const htmlPath = path.join(__dirname, "home.html");
    const html = await fs.readFile(htmlPath, "utf8");
    return c.html(html);
  } catch (error) {
    console.error("Failed to load home page:", error);
    return c.text("MCP Registry API Server is running!");
  }
});

app.get("/api/meta", (c: Context) => {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const packageJson = require("../../package.json");
  return c.json({ version: packageJson.version });
});

app.doc("/api/v1/doc", {
  openapi: "3.0.0",
  info: {
    version: "1.0.0",
    title: "MCP Registry API",
  },
});

app.get("/swagger", swaggerUI({ url: "/api/v1/doc" }));

app.notFound((c: Context) => {
  return c.json({ success: false, code: 404, message: "Route not found" }, 404);
});

app.onError((err: Error, c: Context) => {
  console.error("Server Error:", err);
  return c.json({ success: false, code: 500, message: "Internal server error" }, 500);
});

const port = process.env.MCP_SERVER_PORT ? parseInt(process.env.MCP_SERVER_PORT, 10) : 3003;
console.log(`Server is running on: http://localhost:${port}`);

serve({
  fetch: app.fetch,
  port,
});

export default app;
