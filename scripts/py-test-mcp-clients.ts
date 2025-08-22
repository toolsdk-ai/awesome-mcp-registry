import fs from 'fs';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { typedAllPackagesList, getPackageConfigByKey, getPythonDependencies } from '../src/helper';
import type { MCPServerPackageConfig } from '../src/types';

const TEMP_IGNORE_DEP_NAMES = [
  'awslabs-cdk-mcp-server',
  'awslabs-nova-canvas-mcp-server',
  'qanon_mcp',
  'qanon-mcp',
  'llm_bridge_mcp',
  'llm-bridge-mcp',
  'mcp_server_browser_use',
  'mcp-server-browser-use',
  'jupyter_mcp_server',
  'jupyter-mcp-server',
];

async function getPythonMcpClient(mcpServerConfig: any, mockEnv: Record<string, string>) {
  const { packageName } = mcpServerConfig;
  const transport = new StdioClientTransport({
    command: 'uv',
    args: ['run', '--directory', './python-mcp', packageName],
    env: {
      ...(Object.fromEntries(Object.entries(process.env).filter(([_, v]) => v !== undefined)) as Record<
        string,
        string
      >),
      ...mockEnv,
    },
  });

  const client = new Client({
    name: `python-mcp-client-${packageName}`,
    version: '1.0.0',
  });

  await client.connect(transport);

  const closeConnection = async () => {
    try {
      await client.close();
    } catch (e) {
      console.warn(`${packageName} python mcp client close failure.`, e);
    }
  };

  return { client, transport, closeConnection };
}

async function main() {
  const packageConfig: Record<string, any> = {};
  const pythonDeps = getPythonDependencies();

  for (const depName of pythonDeps) {
    // 跳过需要临时忽略的包
    if (TEMP_IGNORE_DEP_NAMES.includes(depName)) {
      continue;
    }
    console.log(`Testing Python MCP Client for package: ${depName}`);

    const mcpServerConfig: MCPServerPackageConfig = await getPackageConfigByKey(depName);
    if (mcpServerConfig.runtime !== 'python') continue;

    const mockEnv: Record<string, string> = {};
    for (const [key] of Object.entries(mcpServerConfig.env || {})) {
      mockEnv[key] = 'MOCK';
    }

    try {
      const mcpClient = await getPythonMcpClient(mcpServerConfig, mockEnv);
      const toolsResp = await mcpClient.client.listTools();

      const saveTools: Record<string, any> = {};
      for (const toolItem of toolsResp.tools) {
        saveTools[toolItem.name] = {
          name: toolItem.name,
          description: toolItem.description || '',
        };
      }

      await mcpClient.closeConnection();

      packageConfig[depName] = {
        ...mcpServerConfig,
        tools: saveTools,
        validated: true,
      };

      if (typedAllPackagesList[depName]) {
        typedAllPackagesList[depName].tools = saveTools;
        typedAllPackagesList[depName].validated = true;
      }

      console.log(`✅ ${depName} validated, tools: ${Object.keys(saveTools).length}`);
    } catch (e: any) {
      packageConfig[depName] = {
        ...mcpServerConfig,
        tools: {},
        validated: false,
      };
      console.error(`❌ Error validating Python MCP Client for ${depName}:`, e.message);

      // ~~更新 typedAllPackagesList 中的验证状态~~
      // validated: false 的 Python MCP 暂不做处理
      // if (typedAllPackagesList[depName]) {
      //   typedAllPackagesList[depName].tools = {};
      //   typedAllPackagesList[depName].validated = false;
      // }
    }
  }

  // console.log('校验的 python 包: \n', packageConfig);
  // 将更新后的包列表写入文件
  fs.writeFileSync('indexes/packages-list.json', JSON.stringify(typedAllPackagesList, null, 2), 'utf-8');

  const validatedPackages = Object.entries(packageConfig)
    .filter(([_, v]) => v.validated)
    .map(([packageName, _]) => packageName);
  console.log('校验通过的 python 包: \n', validatedPackages);
}

await main();
process.exit(0);
