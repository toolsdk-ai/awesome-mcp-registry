import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

export async function setupOutputDirectory() {
  const outputDir = path.join(__dirname, '..', '..', 'PDF');
  await fs.mkdir(outputDir, { recursive: true });
  return outputDir;
}

export async function getHTMLPath(IdUnico) {
  const htmlPath = path.join(__dirname, '..', '..', 'dist', IdUnico, 'index.html');
  const htmlExists = await fs.access(htmlPath).then(() => true).catch(() => false);

  if (!htmlExists) {
    throw new Error(`No se encontró el archivo HTML en la ruta esperada: ${htmlPath}`);
  }

  return htmlPath;
}
