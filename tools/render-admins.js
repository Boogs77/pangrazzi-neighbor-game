// Schermate di scelta dell'amministratore: node tools/render-admins.js -> reference/admin-N.png
const path = require('path');
const { canvas, png } = require('./png.js');
const { ADMINS, drawAdmin } = require('../admins-art.js');
const F = require('../pixel-font.js');

const W = 240, H = 135;
const C = { bg: '#0d0f24', pan: '#1b1f4b', panD: '#14173a', ink: '#fff7d6', y: '#f5c518', g: '#3ddc84', r: '#e63946', dim: '#8a8fb8' };

function screen(i) {
  const g = canvas(W, H), a = ADMINS[i];
  // sfondo: palcoscenico a sinistra con faretto
  g.rect(C.bg, 0, 0, W, H);
  g.rect(C.pan, 0, 14, 116, 111);
  for (let k = 0; k < 6; k++) g.rect('#ffffff08', 58 - 30 + k * 5, 14, 60 - k * 10, 111);
  g.rect(C.panD, 0, 125, 116, 10);
  for (let x = 0; x < 116; x += 8) g.rect('#1b1f4b', x, 127 + (x >> 3) % 2 * 3, 5, 1);
  drawAdmin(g, i, 58, 126);

  // titolo
  const title = "Scegli l'amministratore";
  F.text(g, title, (W - F.width(title)) >> 1, 4, C.y);
  g.rect(C.y, 0, 12, W, 1);

  // pannello descrizione
  const px = 120, pw = 116;
  g.rect(C.ink, px - 1, 17, pw + 2, 115); g.rect(C.panD, px, 18, pw, 113);
  F.text(g, a.name, px + 4, 22, C.y, 2);
  g.rect(C.y, px + 4, 34, F.width(a.name, 2), 1);
  let y = 39;
  F.wrap(a.desc, 27).forEach(l => { F.text(g, l, px + 4, y, C.ink); y += 7; });
  y += 3;
  F.text(g, 'Bonus', px + 4, y, C.g); y += 7;
  F.wrap('+ ' + a.bonus, 27).forEach(l => { F.text(g, l, px + 4, y, C.ink); y += 7; });
  y += 2;
  F.text(g, 'Malus', px + 4, y, C.r); y += 7;
  F.wrap('- ' + a.malus, 27).forEach(l => { F.text(g, l, px + 4, y, C.ink); y += 7; });

  // navigazione e tasto
  const nav = '<  ' + (i + 1) + '/' + ADMINS.length + '  >';
  F.text(g, nav, px + 4, 121, C.dim);
  const bw = F.width('Scegli') + 8;
  g.rect(C.ink, px + pw - bw - 5, 116, bw + 2, 13); g.rect(C.y, px + pw - bw - 4, 117, bw, 11);
  F.text(g, 'Scegli', px + pw - bw, 120, '#000000');
  // pallini delle 5 schede
  ADMINS.forEach((_, k) => g.rect(k == i ? C.y : C.dim, 44 + k * 6, 130, 3, 3));
  return g;
}

const out = path.join(__dirname, '..', 'reference');
ADMINS.forEach((_, i) => png(screen(i), path.join(out, 'admin-' + (i + 1) + '.png')));
