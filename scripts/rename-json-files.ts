import fs from "node:fs";
import path from "node:path";
import { getDirname } from "../src/shared/scripts-helpers";

const __dirname = getDirname(import.meta.url);

const LANGUAGE_PREFIXES = ["node", "python", "java", "go"];
// const BASE_DIR = '/home/username/mcp/awesome-mcp-registry/packages';

/**
 * 重命名指定目录下的 JSON 文件，文件名前加上 runtime 字段的值
 * @param baseDir 基础目录路径，例如：'packages'
 */
function renameJsonFiles(baseDir: string): void {
  // 读取所有子目录
  fs.readdirSync(baseDir).forEach((dir) => {
    const dirPath = path.join(baseDir, dir);
    if (fs.statSync(dirPath).isDirectory()) {
      // 遍历子目录中的 *.json 文件
      fs.readdirSync(dirPath).forEach((file) => {
        if (path.extname(file) === ".json") {
          const filePath = path.join(dirPath, file);

          // 读取 JSON 文件内容
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const data = require(filePath) as { runtime?: string };
          const runtime = data.runtime;

          if (runtime && !LANGUAGE_PREFIXES.some((prefix) => file.startsWith(`${prefix}-`))) {
            // 构造新文件名
            const newFileName = `${runtime}-${file}`;
            const newFilePath = path.join(dirPath, newFileName);

            // 重命名文件
            fs.renameSync(filePath, newFilePath);
            console.log(`Renamed: ${filePath} -> ${newFilePath}`);
          }
        }
      });
    }
  });
  console.log("[renameJsonFiles] All done!");
}

/**
 * 主函数，程序入口
 */
function main(): void {
  // 使用脚本所在目录的上一级作为基础目录
  const projectRoot = path.resolve(__dirname, "..");

  // 获取 BASE_DIR 环境变量，如果没有则使用相对路径默认值
  const targetDir = process.env.BASE_DIR || path.join(projectRoot, "packages");
  renameJsonFiles(targetDir);
}

main();
