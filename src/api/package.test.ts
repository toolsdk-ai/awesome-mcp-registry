// npx vitest run src/api/tool.test.ts

import { describe, it, expect } from 'vitest';
import { PackageSO } from './package-so';

describe('PackageSO - MCP Tool Execution Service Test', () => {
  it('should execute tool successfully', async () => {
    const toolSO = new PackageSO();
    const request = {
      packageName: 'mcp-starter',
      toolKey: 'hello_tool',
      inputData: { name: 'Mike' },
      envs: {},
    };

    const result = await toolSO.executeTool(request);

    expect(result.success).toBe(true);
    expect(result.data).toEqual({
      content: [],
      message: 'Hello, Mike!',
    });
  });

  it('should handle tool execution failure', async () => {
    const toolSO = new PackageSO();
    const request = {
      packageName: 'mcp-starter',
      toolKey: 'no_hello_tool',
      inputData: { name: 'Mike' },
      envs: {},
    };

    const result = await toolSO.executeTool(request);

    expect(result.success).toBe(false);
    expect(result.error).toBe('Tool execution failed');
  });
});
