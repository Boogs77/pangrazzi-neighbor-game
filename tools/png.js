// Canvas software minimale + esportazione PNG (usato dagli script in tools/)
const fs = require('fs'), zlib = require('zlib');
const SCALE = 4;

function canvas(W, H) {
  const buf = new Uint8Array(W * H * 4);
  return {
    buf, W, H,
    rect(c, x, y, w, h) {
      const n = parseInt(c.slice(1), 16), al = c.length > 7 ? (n & 255) / 255 : 1;
      const rgb = c.length > 7 ? n >>> 8 : n, r = rgb >> 16 & 255, g = rgb >> 8 & 255, b = rgb & 255;
      for (let j = Math.max(0, y); j < Math.min(H, y + h); j++)
        for (let i = Math.max(0, x); i < Math.min(W, x + w); i++) {
          const k = (j * W + i) * 4;
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
  const w = cv.W * SCALE, h = cv.H * SCALE, raw = Buffer.alloc((w * 4 + 1) * h);
  for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) {
    const s = ((y / SCALE | 0) * cv.W + (x / SCALE | 0)) * 4, d = y * (w * 4 + 1) + 1 + x * 4;
    raw[d] = cv.buf[s]; raw[d + 1] = cv.buf[s + 1]; raw[d + 2] = cv.buf[s + 2]; raw[d + 3] = 255;
  }
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w); ihdr.writeUInt32BE(h, 4); ihdr[8] = 8; ihdr[9] = 6;
  fs.writeFileSync(file, Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
    chunk('IHDR', ihdr), chunk('IDAT', zlib.deflateSync(raw)), chunk('IEND', Buffer.alloc(0))]));
  console.log('scritto', file);
}

module.exports = { canvas, png };
