// Esporta la facciata in PNG: node tools/render-building.js
const path = require('path');
const A = require('../building-art.js');
const { canvas: blank, png } = require('./png.js');
const canvas = (W = A.W, H = A.H) => blank(W, H);

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

// legenda dei tipi di finestra/porta
const rows = [['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'K', 'L'], ['P', 'Q', 'R', 'T', 'U']];
cv = canvas(224, 92);
cv.rect(A.P.wall, 0, 0, cv.W, cv.H);
rows.forEach((row, ri) => {
  let x = 6;
  const base = ri ? 78 : 30;
  row.forEach(k => {
    const t = A.TYPES[k], cw = Math.max(t.w, 9);
    t.draw(cv, x + (cw - t.w >> 1), base - t.h);
    const lx = x + (cw >> 1) - 2;
    cv.rect('#000000', lx - 2, base + 3, 7, 9);
    A.text(cv, k, lx, base + 5, '#ffffff');
    x += cw + 9;
  });
});
png(cv, path.join(out, 'legenda.png'));
