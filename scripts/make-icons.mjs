import { writeFileSync, mkdirSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { deflateSync } from 'node:zlib';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const outDir = resolve(__dirname, '..', 'public');
mkdirSync(outDir, { recursive: true });

// Minimal PNG encoder (truecolor + alpha) — produces one solid-color rounded badge
// with a centered text-like glyph area (here we use a flat color + inner square).
function crc32(buf) {
  let c;
  const table = [];
  for (let n = 0; n < 256; n++) {
    c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  let crc = 0xffffffff;
  for (let i = 0; i < buf.length; i++) crc = (crc >>> 8) ^ table[(crc ^ buf[i]) & 0xff];
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const len = Buffer.alloc(4);
  len.writeUInt32BE(data.length, 0);
  const typeBuf = Buffer.from(type, 'ascii');
  const crcBuf = Buffer.alloc(4);
  crcBuf.writeUInt32BE(crc32(Buffer.concat([typeBuf, data])), 0);
  return Buffer.concat([len, typeBuf, data, crcBuf]);
}

function makePng(size) {
  const width = size, height = size;
  // Build raw pixel data: RGBA
  const pixelBytes = Buffer.alloc(height * (1 + width * 4));
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.48;
  const innerR = width * 0.22;

  for (let y = 0; y < height; y++) {
    pixelBytes[y * (1 + width * 4)] = 0; // filter byte: None
    for (let x = 0; x < width; x++) {
      const dx = x - cx + 0.5;
      const dy = y - cy + 0.5;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const off = y * (1 + width * 4) + 1 + x * 4;

      if (dist <= radius) {
        // Background circle: dark
        let r = 20, g = 20, b = 24, a = 255;
        // Inner glyph ring: emerald accent
        if (dist > innerR && dist < innerR + width * 0.05) {
          r = 16; g = 185; b = 129;
        }
        // Center dot: white
        if (dist <= innerR * 0.55) {
          r = 255; g = 255; b = 255;
        }
        pixelBytes[off] = r;
        pixelBytes[off + 1] = g;
        pixelBytes[off + 2] = b;
        pixelBytes[off + 3] = a;
      } else {
        pixelBytes[off] = 0;
        pixelBytes[off + 1] = 0;
        pixelBytes[off + 2] = 0;
        pixelBytes[off + 3] = 0;
      }
    }
  }

  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(width, 0);
  ihdr.writeUInt32BE(height, 4);
  ihdr[8] = 8;   // bit depth
  ihdr[9] = 6;   // color type: RGBA
  ihdr[10] = 0;  // compression
  ihdr[11] = 0;  // filter
  ihdr[12] = 0;  // interlace

  const idat = deflateSync(pixelBytes);
  const iend = Buffer.alloc(0);

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdr),
    chunk('IDAT', idat),
    chunk('IEND', iend),
  ]);
}

for (const size of [192, 512]) {
  const buf = makePng(size);
  const out = resolve(outDir, `icon-${size}.png`);
  writeFileSync(out, buf);
  console.log(`wrote ${out} (${buf.length} bytes)`);
}
