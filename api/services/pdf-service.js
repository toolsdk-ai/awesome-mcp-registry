import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

/**
 * Detecta si se está ejecutando dentro de un contenedor Docker.
 */
function isRunningInDocker() {
  try {
    return (
      fs.existsSync('/.dockerenv') ||
      fs.readFileSync('/proc/1/cgroup', 'utf8').includes('docker')
    );
  } catch {
    return false;
  }
}

export async function generatePDFFromHTML(htmlPath, outputDir, fileName, externalLogger = console) {
  const log = (...args) => externalLogger.info ? externalLogger.info(...args) : console.log(...args);

  const fileUrl = `file://${htmlPath}`;
  const pdfPath = path.join(outputDir, `${fileName}.pdf`);

  let browser;
  try {
    log('🚀 Iniciando generación de PDF...');
    if (!fs.existsSync(htmlPath)) throw new Error(`Archivo HTML no encontrado en: ${htmlPath}`);

    const launchOptions = {
      headless: 'new',
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-gpu',
        '--disable-dev-shm-usage',
      ],
    };

    if (isRunningInDocker()) {
      launchOptions.executablePath = '/usr/bin/chromium-browser';
      log('🐳 Entorno Docker detectado. Usando ejecutable Chromium.');
    } else {
      log('🖥️ Entorno local detectado. Usando configuración por defecto.');
    }

    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();

    await page.setCacheEnabled(false);
    await page.goto(fileUrl, { waitUntil: 'load', timeout: 30000 });

    await page.emulateMediaType('screen');
    await page.pdf({
      path: pdfPath,
      width: '820px',
      height: '1200px',
      printBackground: true,
    });

    log(`✅ PDF generado exitosamente: ${pdfPath}`);
    return pdfPath;
  } catch (error) {
    log('❌ Error al generar PDF:', error.message);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
      log('🧹 Navegador cerrado.');
    }
  }
}
