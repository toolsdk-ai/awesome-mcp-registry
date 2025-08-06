// Try to read MCP Client

import fs from 'fs';
import {
  getActualVersion,
  getMcpClient,
  getPackageConfigByKey,
  typedAllPackagesList,
  updatePackageJsonDependencies,
  withTimeout,
} from '../src/helper';
async function main() {
  const packageDeps: Record<string, string> = {};

  // Check if this is a fresh installation where packages aren't installed yet
  const nodeModulesExists = fs.existsSync(__dirname + '/../node_modules');
  if (!nodeModulesExists) {
    console.log('⚠️  Node modules not found. This appears to be a fresh installation.');
    console.log('💡 MCP client testing requires packages to be installed first.');
    console.log('📝 Skipping validation step. Run this script manually later if needed.');
    process.exit(0);
  }

  let totalPackages = 0;
  let availablePackages = 0;
  
  // First pass: count available packages
  for (const [packageKey, _value] of Object.entries(typedAllPackagesList)) {
    const mcpServerConfig = await getPackageConfigByKey(packageKey);
    if (mcpServerConfig.runtime === 'node') {
      totalPackages++;
      const packageJSONFilePath = __dirname + '/../node_modules/' + mcpServerConfig.packageName + '/package.json';
      if (fs.existsSync(packageJSONFilePath)) {
        availablePackages++;
      }
    }
  }
  
  console.log(`📊 Found ${availablePackages}/${totalPackages} packages available for testing`);
  
  // If less than 10% of packages are available, skip testing to avoid build failures
  if (totalPackages > 0 && (availablePackages / totalPackages) < 0.1) {
    console.log('⚠️  Very few MCP packages are installed locally.');
    console.log('💡 This is normal for a fresh installation. Skipping full validation.');
    console.log('📝 To run full validation later: pnpm install <packages> && bun scripts/test-mcp-clients.ts');
    process.exit(0);
  }

  for (const [packageKey, value] of Object.entries(typedAllPackagesList)) {
    const mcpServerConfig = await getPackageConfigByKey(packageKey);

    if (mcpServerConfig.runtime === 'node') {
      if (value.validated === true) {
        // Skip already validated packages to prevent state override
        const version = getActualVersion(mcpServerConfig.packageName, mcpServerConfig.packageVersion);
        packageDeps[mcpServerConfig.packageName] = version || 'latest';
        continue;
      }

      const mockEnv = {};
      for (const [key, _env] of Object.entries(mcpServerConfig.env || {})) {
        mockEnv[key] = 'MOCK';
      }
      console.log(`Reading MCP Client for package: ${packageKey} ${value.path}`);
      try {
        // const parsedContent: MCPServerPackageConfig= MCPServerPackageConfigSchema.parse(JSON.parse(fileContent));

        const mcpClient = await withTimeout(5000, getMcpClient(mcpServerConfig, mockEnv));
        const tools = await mcpClient.client.listTools();
        console.log(
          `Read success MCP Client for package: ${packageKey} ${value.path}, tools: ${Object.keys(tools).length}`,
        );

        const saveTools = {};
        for (const [_toolKey, toolItem] of Object.entries(tools.tools)) {
          saveTools[toolItem.name] = {
            name: toolItem.name,
            description: toolItem.description || '',
          };
        }

        // close the mcp client
        if (mcpClient) {
          await mcpClient.closeConnection();
        }

        typedAllPackagesList[packageKey].tools = saveTools;
        typedAllPackagesList[packageKey].validated = true;

        const version = getActualVersion(mcpServerConfig.packageName, mcpServerConfig.packageVersion);
        packageDeps[mcpServerConfig.packageName] = version || 'latest';
      } catch (e) {
        console.error(`Error reading MCP Client for package: ${packageKey} ${value.path}`, e.message);
        typedAllPackagesList[packageKey].tools = {};
        typedAllPackagesList[packageKey].validated = false;
      } finally {
        //
      }
    }
  }

  // write again with tools
  fs.writeFileSync('indexes/packages-list.json', JSON.stringify(typedAllPackagesList, null, 2), 'utf-8');

  // print, all unvalidated packages
  const unvalidatedPackages = Object.values(typedAllPackagesList).filter((value) => !value.validated);
  console.warn(`Warning! Unvalidated packages: ${unvalidatedPackages.length}`, unvalidatedPackages);

  // Write package.json dependencies
  updatePackageJsonDependencies({ packageDeps, enableValidation: true });
}

await main();
process.exit(0);
