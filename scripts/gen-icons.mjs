import sharp from 'sharp';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const PUBLIC = resolve(__dirname, '..', 'public');
const srcSvg = readFileSync(resolve(PUBLIC, 'icon-source.svg'));

async function rasterize(size, out, { padding = 0 } = {}) {
  const inner = size - padding * 2;
  const rendered = await sharp(srcSvg, { density: 512 })
    .resize(inner, inner, { fit: 'contain' })
    .png()
    .toBuffer();

  if (padding === 0) {
    await sharp(rendered).toFile(resolve(PUBLIC, out));
  } else {
    await sharp({
      create: {
        width: size,
        height: size,
        channels: 4,
        background: { r: 10, g: 10, b: 10, alpha: 1 },
      },
    })
      .composite([{ input: rendered, top: padding, left: padding }])
      .png()
      .toFile(resolve(PUBLIC, out));
  }
  console.log(`  ✓ ${out}`);
}

console.log('Generating PWA icons...');
await rasterize(192, 'icon-192.png');
await rasterize(512, 'icon-512.png');
await rasterize(180, 'apple-touch-icon.png');
await rasterize(512, 'icon-maskable-512.png', { padding: 64 });
console.log('Done.');
