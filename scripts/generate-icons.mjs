import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const iconsDir = path.join(__dirname, '..', 'public', 'icons');
const svgPath = path.join(iconsDir, 'icon.svg');

async function main() {
  let sharp;
  try {
    sharp = (await import('sharp')).default;
  } catch {
    const missing = [192, 512].filter((size) => !fs.existsSync(path.join(iconsDir, `icon-${size}.png`)));
    if (missing.length) {
      console.warn('[icons] sharp não instalado e PNGs ausentes:', missing.join(', '));
      process.exit(1);
    }
    console.log('[icons] PNGs já presentes — pulando geração');
    return;
  }
  const svg = fs.readFileSync(svgPath);
  for (const size of [192, 512]) {
    await sharp(svg).resize(size, size).png().toFile(path.join(iconsDir, `icon-${size}.png`));
  }
  console.log('[icons] PNGs gerados');
}

main().catch(console.error);
