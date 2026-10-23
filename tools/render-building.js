// Esporta la facciata in PNG: node tools/render-building.js
const fs = require('fs'), path = require('path'), zlib = require('zlib');
const A = require('../building-art.js');
const SCALE = 4;

function canvas() {
  const buf = new Uint8Array(A.W * A.H * 4);
  return {
    buf,
    rect(c, x, y, w, h) {
      const n = parseInt(c.slice(1), 16), al = c.length > 7 ? (n & 255) / 255 : 1;
      const rgb = c.length > 7 ? n >>> 8 : n, r = rgb >> 16 & 255, g = rgb >> 8 & 255, b = rgb & 255;
      for (let j = Math.max(0, y); j < Math.min(A.H, y + h); j++)
        for (let i = Math.max(0, x); i < Math.min(A.W, x + w); i++) {
          const k = (j * A.W + i) * 4;
          buf[k] += (r - buf[k]) * al; buf[k + 1] += (g - buf[k + 1]) * al; buf[k + 2] += (b - buf[k + 2]) * al; buf[k + 3] = 255;
        }
    }
  };
}

const CRC = Array.from({ length: 256 }, (_, n) => { for (let k = 0; k < 8; k++) n = n & 1 ? 0xedb88320 ^ n >>> 1 : n >>> 1; return n >>> 0; });
const crc = b => { let c = ~0; for (const x of b) c = CRC[(c ^ x) & 255] ^ c >>> 8; return ~c >>> 0; };
function chunk(type, data) {
  const len = Buffer.alloc(4), t = Buffer.from(type), out = Buffer.alloc(4);
  len.writeUInt32BE(data.length); out.writeUInt32BE(crc(Buffer.concat([t, data])));
  return Buffer.concat([len, t, data, out]);
}
function png(cv, file) {
  const w = A.W * SCALE, h = A.H * SCALE, raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const s = ((y / SCALE | 0) * A.W + (x / SCALE | 0)) * 4, d = y * (w * 4 + 1) + 1 + x * 4;
    raw[d] = cv.buf[s]; raw[d + 1] = cv.buf[s + 1]; raw[d + 2] = cv.buf[s + 2]; raw[d + 3] = 255;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
  console.log('scritto', file);
}

const out = path.join(__dirname, '..', 'reference');

let cv = canvas();
A.draw(cv);
png(cv, path.join(out, 'facciata-proposta.png'));

// variante con gli appartamenti numerati
const COL = ['#ff5a5a', '#5ad1ff', '#ffd23a', '#7dff7a', '#ff8af0', '#ffa040'];
cv = canvas();
A.draw(cv);
A.APTS.forEach((p, i) => {
  const c = COL[i % COL.length];
  const x0 = Math.min(...p.r.map(r => r[0])) - 5, x1 = Math.max(...p.r.map(r => r[0] + r[2])) + 5;
  const y0 = p.r[0][1] - 2, y1 = p.r[0][1] + p.r[0][3] + 1;
  cv.rect(c + '40', x0, y0, x1 - x0, y1 - y0);
  cv.rect(c, x0, y0, x1 - x0, 1); cv.rect(c, x0, y1 - 1, x1 - x0, 1);
  cv.rect(c, x0, y0, 1, y1 - y0); cv.rect(c, x1 - 1, y0, 1, y1 - y0);
  const s = String(p.n), lx = (x0 + x1 >> 1) - s.length * 2, ly = (y0 + y1 >> 1) - 3;
  cv.rect('#000000c0', lx - 1, ly - 1, s.length * 4 + 1, 7);
  A.text(cv, s, lx, ly, '#ffffff');
});
png(cv, path.join(out, 'facciata-appartamenti.png'));
