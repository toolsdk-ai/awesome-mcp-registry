import { serve } from "@hono/node-server";
import { swaggerUI } from "@hono/swagger-ui";
import { OpenAPIHono } from "@hono/zod-openapi";
import dotenv from "dotenv";
import path from "path";
import { packageRoutes } from "./package-route";

dotenv.config({ path: path.resolve(process.cwd(), ".env.local") });
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const app: OpenAPIHono = new OpenAPIHono();

app.route("/api/v1", packageRoutes);

app.get("/", (c) => {
	return c.text("MCP Registry API Server is running!");
});

app.get("/api/meta", (c) => {
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

app.notFound((c) => {
	return c.json({ success: false, code: 404, message: "Route not found" }, 404);
});

app.onError((err, c) => {
	console.error("Server Error:", err);
	return c.json(
		{ success: false, code: 500, message: "Internal server error" },
		500,
	);
});

const port = process.env.MCP_SERVER_PORT
	? parseInt(process.env.MCP_SERVER_PORT)
	: 3000;
console.log(`Server is running on: http://localhost:${port}`);

serve({
	fetch: app.fetch,
	port,
});

export default app;
