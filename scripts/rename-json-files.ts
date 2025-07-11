import fs from 'fs';
import path from 'path';

/**
 * 重命名指定目录下的 JSON 文件，文件名前加上 runtime 字段的值
 * @param baseDir 基础目录路径，例如：'packages'
 */
function renameJsonFiles(baseDir: string): void {
  // 读取所有子目录
  fs.readdirSync(baseDir).forEach((dir) => {
    const dirPath = path.join(baseDir, dir);
    if (fs.statSync(dirPath).isDirectory()) {
      // 遍历子目录中的 .json 文件
      fs.readdirSync(dirPath).forEach((file) => {
        console.log(`Processing: ${dirPath} ${file}`);
        if (path.extname(file) === '.json') {
          const filePath = path.join(dirPath, file);

          // 读取 JSON 文件内容
          // eslint-disable-next-line @typescript-eslint/no-require-imports
          const data = require(filePath) as { runtime?: string };
          const runtime = data.runtime;

          if (runtime) {
            // 构造新文件名
            const newFileName = `${runtime}-${file}`;
            const newFilePath = path.join(dirPath, newFileName);

            // 重命名文件
            fs.renameSync(filePath, newFilePath);
            console.log(`Renamed: ${filePath} -> ${newFilePath}`);
          } else {
            console.warn(`Missing 'runtime' field in ${filePath}`);
          }
        }
      });
    }
  });
}

/**
 * 主函数，程序入口
 */
function main(): void {
  const baseDirectory = '/home/seey/mcp/awesome-mcp-registry/packages'; // 指定基础目录
  renameJsonFiles(baseDirectory);
}

main();
