/*
This script is used to automatically collect and install Python dependencies from the MCP Registry

Main functions:
1. Iterate through all registered MCP packages
   - Filter packages with Python runtime
   - Validate package names against PEP 508 specification
   - Check if packages exist in the PyPI repository
   
2. Collect valid Python packages
   - Deduplicate package names
   - Record package version information (if specified)

3. Generate dependency installation script
   - Create bash script file
   - Use uv tool to add dependencies one by one
   - Ensure dependencies are installed in a clean environment (remove old lock file)
   
Usage flow:
1. Scan all package configuration files
2. Filter packages with runtime === 'python'
3. Validate package validity
4. Generate and execute installation script
*/

import fs from "node:fs";
import axios from "axios";
import { getPackageConfigByKey, typedAllPackagesList } from "../src/helper";

// Simple validation function to check if dependency conforms to PEP 508 specification
function isValidPEP508(dependency: string): boolean {
  return /^[a-zA-Z0-9._-]+$/.test(dependency);
}

// Check if package exists on PyPI
async function isPackageOnPyPI(packageName: string): Promise<boolean> {
  try {
    const response = await axios.get(`https://pypi.org/pypi/${packageName}/json`, {
      timeout: 5000,
    });
    return response.status === 200;
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
  } catch (_error) {
    // Package doesn't exist or request failed
    return false;
  }
}

// Collect all eligible Python packages
async function collectPythonPackages(maxPackages: number = 100): Promise<string[]> {
  const pythonPackages: string[] = [];
  let pythonPackageCount = 0;

  for (const [packageKey, value] of Object.entries(
    typedAllPackagesList as Record<string, { path: string }>,
  )) {
    // If maximum quantity limit has been reached, stop processing
    if (pythonPackageCount >= maxPackages) {
      console.log(
        `Reached maximum Python package processing limit (${maxPackages}), stopping processing more packages`,
      );
      break;
    }

    try {
      const mcpServerConfig = await getPackageConfigByKey(packageKey);

      if (mcpServerConfig.runtime === "python") {
        const packageName = mcpServerConfig.packageName;

        if (!isValidPEP508(packageName)) {
          console.log(`✗ Skipping invalid package name: ${packageName} (${value.path})`);
          continue;
        }

        if (!(await isPackageOnPyPI(packageName))) {
          console.log(`✗ Skipping package not found on PyPI: ${packageName} (${value.path})`);
          continue;
        }

        pythonPackageCount++;
        const version = mcpServerConfig.packageVersion;
        const fullName =
          version && version !== "latest" ? `${packageName}==${version}` : packageName;

        pythonPackages.push(fullName);
        console.log(`✓ Added package ${pythonPackageCount}: ${fullName} (${value.path})`);
      }
    } catch (error) {
      console.error(`Error processing package ${packageKey}:`, error);
    }
  }

  return pythonPackages;
}

// Generate installation script content
function generateInstallScript(packages: string[]): string {
  const installCommands = packages.map((pkg) => `uv add ${pkg}`).join("\n");

  return `# x: print each command
set -x
cd python-mcp

# initialize the project if pyproject.toml does not exist
if [ ! -f pyproject.toml ]; then
  uv init
fi

# delete old lock file to ensure a clean installation
rm -f uv.lock

# add dependencies one by one
${installCommands}

echo "All Python dependencies have been installed successfully."
`;
}

// Write installation script file
function writeInstallScript(scriptContent: string, filePath: string): void {
  fs.writeFileSync(filePath, scriptContent, "utf-8");
  fs.chmodSync(filePath, 0o755);
}

// Main function
async function main() {
  // Collect all packages with runtime: python, and verify they exist on PyPI
  const pythonPackages: string[] = await collectPythonPackages();

  if (pythonPackages.length === 0) {
    console.log("No new Python package dependencies to add");
    return;
  }

  // Deduplication
  const uniquePythonPackages = [...new Set(pythonPackages)];
  console.log(`Collected ${uniquePythonPackages.length} unique Python packages`);

  // Generate and write installation script
  const installScript = generateInstallScript(uniquePythonPackages);
  writeInstallScript(installScript, "./install-python-deps.sh");

  console.log(`\nInstallation script generated: install-python-deps.sh`);
  console.log("Run the following command to install Python dependencies:");
  console.log("  ./install-python-deps.sh");
}

await main();
process.exit(0);
