import { exec } from "node:child_process";
import fs from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import minimist from "minimist";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = (cmd) =>
  new Promise((res, rej) => exec(cmd, (err, stdout) => (err ? rej(err) : res(stdout))));

const args = minimist(process.argv.slice(2));

// Extraer los argumentos por nombre
const inputPath = args.input;
const outputDir = args.output;

// Inicializar el logger con la ruta de salida y el nombre del archivo (si se proporcionó outputDir)
const logger = console;

if (!inputPath || !outputDir) {
  logger.error("❌ Debes proporcionar la ruta del JSON y la ruta de salida como argumentos");
  logger.info(
    'ℹ️ Uso: node ./api/cli-generator.js --input="/ruta/entrada.json" --output="/ruta/salida/" --log="nombre_log.txt"',
  );
  process.exit(1);
}

const run = async () => {
  const totalStartTime = Date.now(); // ⏱️ Inicio total

  try {
    logger.info(`📥 Leyendo archivo JSON desde: ${inputPath}`);

    const invoiceDataPath = path.resolve(__dirname, "../src/data/invoice.json");
    await fs.copyFile(inputPath, invoiceDataPath);
    logger.info(`📄 Archivo copiado a: ${invoiceDataPath}`);

    logger.info("🔧 Ejecutando build de Astro...");
    const buildStart = Date.now();

    await execAsync("npm run build");
    const buildEnd = Date.now();
    const buildDuration = ((buildEnd - buildStart) / 1000).toFixed(2);
    logger.info(`⏱️ Tiempo de build: ${buildDuration} segundos`);

    logger.info(`✅ Build completado correctamente`);
  } catch (err) {
    logger.error(`❌ ERROR: ${err.message}`);
    process.exit(1);
  } finally {
    const totalEndTime = Date.now();
    const totalDuration = ((totalEndTime - totalStartTime) / 1000).toFixed(2);
    const totalMessage = `⏱️ Tiempo total de ejecución: ${totalDuration} segundos`;

    logger.info(totalMessage);
  }
};

run();
