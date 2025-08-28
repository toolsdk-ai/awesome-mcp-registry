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

// Check if package exists on PyPI and if it's not too large
async function isPackageOnPyPI(
  packageName: string,
  maxSizeMB: number = 50,
): Promise<{ exists: boolean; sizeMB?: number }> {
  try {
    const response = await axios.get(`https://pypi.org/pypi/${packageName}/json`, {
      timeout: 5000,
    });

    if (response.status !== 200) {
      return { exists: false };
    }

    // Get the size of the latest release
    const urls = response.data.urls;
    if (!urls || urls.length === 0) {
      return { exists: true }; // Package exists but has no files
    }

    // Find the wheel or source distribution with the smallest size
    let minSize = Infinity;
    for (const file of urls) {
      if (
        (file.packagetype === "bdist_wheel" || file.packagetype === "sdist") &&
        file.size < minSize
      ) {
        minSize = file.size;
      }
    }

    // If we found files, check the size
    if (minSize !== Infinity) {
      const sizeMB = minSize / (1024 * 1024);
      if (sizeMB > maxSizeMB) {
        console.log(
          `✗ Skipping package ${packageName} - too large (${sizeMB.toFixed(2)} MB > ${maxSizeMB} MB)`,
        );
        return { exists: false };
      }
      return { exists: true, sizeMB };
    }

    return { exists: true }; // Package exists but couldn't determine size
  } catch (_error) {
    // Package doesn't exist or request failed
    return { exists: false };
  }
}

// Collect all eligible Python packages
async function collectPythonPackages(maxPackages: number = 10000): Promise<string[]> {
  const pythonPackages: string[] = [];
  let pythonPackageCount = 0;
  let pythonPackageSum = 0;

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
        pythonPackageSum++;

        if (!isValidPEP508(packageName)) {
          console.log(`✗ Skipping invalid package name: ${packageName} (${value.path})`);
          continue;
        }

        const packageCheck = await isPackageOnPyPI(packageName);
        if (!packageCheck.exists) {
          console.log(
            `✗ Skipping package not found on PyPI or too large: ${packageName} (${value.path})`,
          );
          continue;
        }

        pythonPackageCount++;
        const version = mcpServerConfig.packageVersion;
        const fullName =
          version && version !== "latest" ? `${packageName}==${version}` : packageName;

        pythonPackages.push(fullName);
        if (packageCheck.sizeMB) {
          console.log(
            `✓ Added package ${pythonPackageCount}(sum:${pythonPackageSum}): ${fullName} (${packageCheck.sizeMB.toFixed(2)} MB) (${value.path})`,
          );
        } else {
          console.log(
            `✓ Added package ${pythonPackageCount}(sum:${pythonPackageSum}): ${fullName} (${value.path})`,
          );
        }
      }
    } catch (error) {
      console.error(`Error processing package ${packageKey}:`, error);
    }
  }

  return pythonPackages;
}

// Generate installation script content
function generateInstallScript(packages: string[]): string {
  const SKIP_PACKAGES = ["scmcp", "optuna-mcp", "chroma-mcp", "imagesorcery-mcp"];

  const filteredPackages = packages.filter((pkg) => !SKIP_PACKAGES.includes(pkg));
  const installCommands = filteredPackages.map((pkg) => `uv add ${pkg}`).join("\n");

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
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("Fatal error:", err);
    process.exit(1);
  });
