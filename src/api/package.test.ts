// npx vitest run src/api/package.test.ts

import { describe, expect, it } from "vitest";
import { PackageSO } from "./package-so";

describe("PackageSO - MCP Tool Execution Service Test", () => {
	it("should execute tool successfully", async () => {
		const toolSO = new PackageSO();
		const request = {
			packageName: "mcp-starter",
			toolKey: "hello_tool",
			inputData: { name: "Mike" },
			envs: {},
		};

		const result = await toolSO.executeTool(request);

		expect(result).toEqual({
			content: [],
			message: "Hello, Mike!",
		});
	});
});
