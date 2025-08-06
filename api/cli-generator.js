import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { generatePDFFromHTML } from '../api/services/pdf-service.js';
import { getLogger } from '../api/utils/logger.js';
import minimist from 'minimist';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const execAsync = (cmd) =>
  new Promise((res, rej) =>
    exec(cmd, (err, stdout) => (err ? rej(err) : res(stdout)))
  );

// Parsear los argumentos de línea de comandos
// minimist analizará '--input=valor' como { input: 'valor' }
const args = minimist(process.argv.slice(2));

// Extraer los argumentos por nombre
const inputPath = args.input;
const outputDir = args.output;
const logFile = args.log || 'conversion.log';

// Inicializar el logger con la ruta de salida y el nombre del archivo (si se proporcionó outputDir)
const logger = outputDir ? getLogger(outputDir, logFile) : console;

if (!inputPath || !outputDir) {
  logger.error('❌ Debes proporcionar la ruta del JSON y la ruta de salida como argumentos');
  logger.info('ℹ️ Uso: node ./api/cli-generator.js --input="/ruta/entrada.json" --output="/ruta/salida/" --log="nombre_log.txt"');
  process.exit(1);
} 


const run = async () => {
  const totalStartTime = Date.now(); // ⏱️ Inicio total

  try {
    logger.info(`📥 Leyendo archivo JSON desde: ${inputPath}`);
    // // console.log(`📥 Leyendo archivo JSON desde: ${inputPath}`);
    // const invoiceJSON = JSON.parse(await fs.readFile(inputPath, 'utf-8'));
    // const {
    //   NombrePDFSinExtension = 'factura',
    //   IdUnico = 'default'
    // } = invoiceJSON.Documents?.[0] || {};

    // if (!validateJson(invoiceJSON)) {
    //   logger.warn('⚠️ Datos inválidos recibidos');
    //   process.exit(1);
    // }

    const invoiceDataPath = path.resolve(__dirname, '../src/data/invoice.json');
    await fs.copyFile(inputPath, invoiceDataPath);
    logger.info(`📄 Archivo copiado a: ${invoiceDataPath}`);

    logger.info('🔧 Ejecutando build de Astro...');
    const buildStart = Date.now();



    await execAsync('npm run build');
    const buildEnd = Date.now();
    const buildDuration = ((buildEnd - buildStart) / 1000).toFixed(2);
    logger.info(`⏱️ Tiempo de build: ${buildDuration} segundos`);

    const htmlPath = path.resolve(__dirname, `../dist/${IdUnico}/index.html`);

    // 🕒 Tiempo para generación de PDF
    logger.info('📄 Generando PDF...');
    const htmlStart = Date.now();
    const finalPdfPath = await generatePDFFromHTML(htmlPath, outputDir, NombrePDFSinExtension, logger);
    const htmlEnd = Date.now();
    const htmlDuration = ((htmlEnd - htmlStart) / 1000).toFixed(2);
    logger.info(`⏱️ Tiempo de generación del PDF/HTML: ${htmlDuration} segundos`);

    logger.info(`✅ PDF generado correctamente en: ${finalPdfPath}`);
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