/*
1. 遍历所有包列表
1.1 筛选出runtime为python的包
1.2 使用isValidPEP508验证包名是否符合PEP 508规范
1.3 检查包是否存在于PyPI仓库中
2. 收集有效的Python包
2.1 对包名进行去重处理
3. 生成依赖安装脚本
3.1 创建bash脚本文件
3.2 使用uv工具逐一添加依赖项
3.3 确保在干净的环境中安装依赖（删除旧的锁文件）
*/

import fs from 'fs';
import { typedAllPackagesList, getPackageConfigByKey } from '../src/helper';
import axios from 'axios';

// 验证依赖项是否符合 PEP 508 规范的简单检查函数
function isValidPEP508(dependency: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(dependency);
}

// 检查包是否在 PyPI 上存在
async function isPackageOnPyPI(packageName: string): Promise<boolean> {
  try {
    const response = await axios.get(`https://pypi.org/pypi/${packageName}/json`, {
      timeout: 5000,
    });
    return response.status === 200;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (error) {
    // 包不存在或者请求失败
    return false;
  }
}

// 收集所有符合条件的Python包
async function collectPythonPackages(maxPackages: number = 100): Promise<string[]> {
  const pythonPackages: string[] = [];
  let pythonPackageCount = 0;

  for (const [packageKey, value] of Object.entries(typedAllPackagesList)) {
    // 如果已达到最大数量限制，则停止处理
    if (pythonPackageCount >= maxPackages) {
      console.log(`已达到最大Python包处理数量限制 (${maxPackages})，停止处理更多包`);
      break;
    }

    try {
      const mcpServerConfig = await getPackageConfigByKey(packageKey);

      if (mcpServerConfig.runtime === 'python') {
        const packageName = mcpServerConfig.packageName;

        if (!isValidPEP508(packageName)) {
          console.log(`✗ 跳过无效包名: ${packageName} (${value.path})`);
          continue;
        }

        if (!(await isPackageOnPyPI(packageName))) {
          console.log(`✗ 跳过不存在于 PyPI 的包: ${packageName} (${value.path})`);
          continue;
        }

        pythonPackageCount++;
        const version = mcpServerConfig.packageVersion;
        const fullName = version && version !== 'latest' ? `${packageName}==${version}` : packageName;

        pythonPackages.push(fullName);
        console.log(`✓ 添加包${pythonPackageCount}: ${fullName} (${value.path})`);
      }
    } catch (error) {
      console.error(`处理包 ${packageKey} 时出错:`, error);
    }
  }

  return pythonPackages;
}

// 生成安装脚本内容
function generateInstallScript(packages: string[]): string {
  const installCommands = packages.map((pkg) => `uv add ${pkg}`).join('\n');

  return `#!/bin/bash
# x打印每个命令
set -x
cd python-mcp

# 如果 pyproject.toml 不存在，初始化项目
if [ ! -f pyproject.toml ]; then
  uv init
fi

# 删除旧的锁文件，保证干净安装
rm -f uv.lock

# 逐一添加依赖
${installCommands}

echo "所有 Python 依赖安装完成"
`;
}

// 写入安装脚本文件
function writeInstallScript(scriptContent: string, filePath: string): void {
  fs.writeFileSync(filePath, scriptContent, 'utf-8');
  fs.chmodSync(filePath, 0o755);
}

// 主函数
async function main() {
  // 收集所有runtime: python 的包，并验证它们是否在 PyPI 上存在
  const pythonPackages: string[] = await collectPythonPackages();

  if (pythonPackages.length === 0) {
    console.log('没有需要添加的新 Python 包依赖');
    return;
  }

  // 去重处理
  const uniquePythonPackages = [...new Set(pythonPackages)];
  console.log(`收集到 ${uniquePythonPackages.length} 个唯一的 Python 包`);

  // 生成并写入安装脚本
  const installScript = generateInstallScript(uniquePythonPackages);
  writeInstallScript(installScript, './install-python-deps.sh');

  console.log(`\n已生成安装脚本: install-python-deps.sh`);
  console.log('运行以下命令来安装 Python 依赖:');
  console.log('  ./install-python-deps.sh');
}

await main();
process.exit(0);
