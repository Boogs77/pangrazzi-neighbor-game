/* Facciata del condominio di Bagni di Rabbi, pixel art 240x135.
   Funziona sia nel browser (canvas) sia in Node (tools/render-building.js).
   g = {rect(colore,x,y,w,h)} */
(function (root) {
const W = 240, H = 135;

/* font 3x5 */
const FONT = {
  A:'010101111101101', B:'110101110101110', E:'111100110100111', I:'111010010010111',
  N:'110101101101101', O:'111101101101111', R:'110101110101101', S:'111100111001111',
  U:'101101101101111', V:'101101101101010',
  C:'111100100100111', D:'110101101101110', F:'111100110100100', G:'111100101101111',
  H:'101101111101101', K:'101110100110101', P:'111101111100100', Q:'010101101110011',
  T:'111010010010010', Z:'111001010100111',
  0:'111101101101111', 1:'010110010010111', 2:'111001111100111', 3:'111001111001111',
  4:'101101111001001', 5:'111100111001111', 6:'111100111101111', 7:'111001001001001',
  8:'111101111101111', 9:'111101111001111'
};
function text(g, s, x, y, c) {
  for (const ch of String(s)) {
    const f = FONT[ch];
    if (f) for (let i = 0; i < 15; i++) if (f[i] == '1') g.rect(c, x + i % 3, y + (i / 3 | 0), 1, 1);
    x += 4;
  }
}

/* palette */
const P = {
  sky: '#a9bccb', sky2: '#c8d3dc', cloud: '#e6ebef',
  mtnFar: '#6f8a80', mtn: '#3f6247', fir: '#2c4a33', fir2: '#365a3d',
  wall: '#e0b24f', wallDark: '#c99a3c', wallLight: '#ecd49a', plinth: '#b8a888',
  roof: '#3a3a40', eave: '#4a3020', rafter: '#6b4a30',
  red: '#b5332e', redDark: '#8a2622', mauve: '#7d5c78', mauveDark: '#5e4459',
  bord: '#8c3a3a', bordDark: '#6a2a2a', brown: '#5a3a22', brownDark: '#3e2716',
  glass: '#2a2a33', curtain: '#efe9da', stone: '#d6cdb6', stoneDark: '#a99f88',
  pipe: '#9a6038', geran: '#e23a3a', leaf: '#3f8a3a',
  walk: '#a39886', walkLine: '#857a69', road: '#55575c', roadLine: '#e8e8e8',
  bus: '#2f6fd0', white: '#f4f1e8', wood: '#7a5230', woodLight: '#9c6e42', fence: '#c98a4a'
};

/* geometria
   corpo lungo (corpo lungo): piano terra con negozio + 3 piani
   testata (testata): 3 file di finestre, marcapiano sopra l'ultima, mansarda solo qui */
const MAIN = { x: 4, w: 146, top: 42 };
const HEAD = { x: 150, w: 86, top: 42 };
const FLOORS = [44, 62, 80];                      // y piani del corpo lungo: 3o, 2o, 1o
const MAIN_BAYS = [10, 28, 46, 64, 82, 100, 118, 136];
const HEAD_PIPE = 208;                            // pluviale che divide la testata in due
const HEAD_ROWS = { A: 46, B: 64, band: 82, C: 87 };
const GROUND = 98, STREET = 120;

/* appartamenti: finestre [x,y,w,h,tipo]; tipo: s=scuri, g=inferriata, p=piccola con tenda, d=abbaino */
const APTS = [];
(function () {
  ['3', '2', '1'].forEach((fl, f) => {
    for (let a = 0; a < 4; a++)
      APTS.push({ floor: fl, r: [MAIN_BAYS[a * 2], MAIN_BAYS[a * 2 + 1]].map(x => [x, FLOORS[f] + 2, 10, 13, 's']) });
  });
  [['3', HEAD_ROWS.A], ['2', HEAD_ROWS.B]].forEach(([fl, y]) => {
    APTS.push({ floor: fl, r: [156, 172, 188].map(x => [x, y, 9, 12, 's']) });
    APTS.push({ floor: fl, r: [213, 225].map(x => [x, y, 9, 12, 's']) });
  });
  APTS.push({ floor: '1', r: [[168, HEAD_ROWS.C, 11, 16, 'g'], ...[184, 192, 200].map(x => [x, HEAD_ROWS.C + 1, 6, 8, 'p'])] });
  APTS.push({ floor: '1', r: [212, 220, 228].map(x => [x, HEAD_ROWS.C + 1, 6, 8, 'p']) });
  APTS.push({ floor: 'M', r: [[176, 33, 8, 7, 'd']] });
  const rank = { '1': 0, '2': 1, '3': 2, M: 3 };
  APTS.sort((p, q) => rank[p.floor] - rank[q.floor] || p.r[0][0] - q.r[0][0]);
  APTS.forEach((p, i) => p.n = i + 1);
})();

/* aspetto statico delle finestre, ispirato alle foto */
const LOOK = {
  shutter(x, y) {
    if (x >= HEAD.x || y == FLOORS[0] + 2) return 'red';
    return ((x * 7 + y * 3) >> 3) % 3 == 0 ? 'bord' : 'mauve';
  },
  open(x, y) {
    if (x >= HEAD.x) return y == HEAD_ROWS.A && x != 225;
    if (y == FLOORS[0] + 2) return (x / 18 | 0) % 3 != 1;
    return (x == 64 && y == FLOORS[2] + 2) || (x == 118 && y == FLOORS[1] + 2);
  }
};

function shutters(g, r, col, open) {
  const [a, b, w, h] = r, c = P[col], d = P[col + 'Dark'];
  g.rect(P.wallDark, a - 1, b - 1, w + 2, h + 2);
  if (!open) {
    g.rect(c, a, b, w, h);
    for (let y = b + 1; y < b + h; y += 2) g.rect(d, a, y, w, 1);
    g.rect(d, a + (w >> 1), b, 1, h);
    return;
  }
  const k = Math.max(3, Math.round(w * .3));
  g.rect(P.brownDark, a, b, w, h);
  g.rect(P.glass, a + 1, b + 1, w - 2, h - 2);
  g.rect(P.curtain, a + 1, b + 1, w - 2, (h >> 1));
  g.rect(P.brown, a + (w >> 1), b + 1, 1, h - 2);
  [a - k, a + w].forEach(sx => {
    g.rect(c, sx, b, k, h);
    for (let y = b + 1; y < b + h; y += 2) g.rect(d, sx, y, k, 1);
  });
}

function grate(g, x, y, w, h) {
  g.rect(P.brownDark, x, y, w, h);
  g.rect(P.glass, x + 1, y + 1, w - 2, h - 2);
  g.rect(P.curtain, x + 2, y + 1, w - 4, (h >> 1) - 1);
  // inferriata a losanghe
  for (let j = 0; j < h - 2; j++) for (let i = 0; i < w - 2; i++)
    if ((i + j) % 4 == 0 || (i - j + 400) % 4 == 0) g.rect('#8f8f8f', x + 1 + i, y + 1 + j, 1, 1);
}

function plain(g, x, y, w, h) {
  g.rect(P.wallDark, x - 1, y - 1, w + 2, h + 2);
  g.rect(P.brown, x, y, w, h);
  g.rect(P.curtain, x + 1, y + 1, w - 2, h - 2);
  g.rect('#d8d0c0', x + 1, y + h - 3, w - 2, 1);
}

function dormer(g, x, y, w, h) {
  g.rect(P.wall, x - 2, y - 1, w + 4, h + 2);
  g.rect(P.roof, x - 3, y - 3, w + 6, 2);
  g.rect(P.brownDark, x, y, w, h);
  g.rect(P.glass, x + 1, y + 1, w - 2, h - 2);
  g.rect(P.red, x - 2, y, 2, h); g.rect(P.red, x + w, y, 2, h);
}

function window_(g, r, look) {
  const k = r[4];
  if (k == 'g') grate(g, ...r);
  else if (k == 'p') plain(g, ...r);
  else if (k == 'd') dormer(g, ...r);
  else shutters(g, r, look.shutter(r[0], r[1]), look.open(r[0], r[1]));
}

function grateWindow(g, x, y) {
  g.rect(P.brown, x - 3, y, 3, 12); g.rect(P.brown, x + 10, y, 3, 12);
  grate(g, x, y, 10, 12);
  g.rect(P.stoneDark, x - 1, y + 12, 12, 1);
  for (let i = 0; i < 5; i++) { g.rect(P.leaf, x + i * 2, y + 10, 2, 2); g.rect(P.geran, x + i * 2 + (i & 1), y + 9, 1, 1); }
}

function rack(g, x, y, w) {
  g.rect(P.wood, x, y, w, 1); g.rect(P.wood, x, y + 3, w, 1);
  for (let i = 0; i < w; i += 2) g.rect(P.woodLight, x + i, y + 1 + (i >> 1) % 2, 1, 1);
  g.rect('#00000030', x + 1, y + 4, w - 2, 2);
}

function background(g) {
  g.rect(P.sky, 0, 0, W, 40); g.rect(P.sky2, 0, 22, W, 30);
  [[20, 8, 30, 4], [30, 5, 16, 3], [95, 12, 36, 4], [110, 9, 18, 3], [160, 4, 22, 3]].forEach(c => g.rect(P.cloud, ...c));
  for (let x = 0; x < W; x++) {
    g.rect(P.mtnFar, x, 22 + Math.round(8 * Math.sin(x / 23) + 5 * Math.sin(x / 9 + 1)), 1, 60);
    g.rect(P.mtn, x, 34 + Math.round(5 * Math.sin(x / 15 + 2)), 1, 60);
  }
  for (let i = 0; i < 40; i++) {
    const x = (i * 37) % W, y = 30 + (i * 13) % 12, c = i & 1 ? P.fir : P.fir2;
    for (let k = 0; k < 6; k++) g.rect(c, x - (k >> 1), y + k, 1 + (k >> 1) * 2, 1);
  }
  for (let x = 200; x < W; x++) g.rect(P.fir, x, 10 + ((W - x) >> 1), 1, 100);
}

function building(g, look) {
  look = look || LOOK;
  // tetto corpo lungo
  g.rect(P.roof, MAIN.x - 2, MAIN.top - 8, MAIN.w + 2, 4);
  g.rect(P.eave, MAIN.x - 4, MAIN.top - 4, MAIN.w + 4, 3);
  // tetto testata, più alto: qui c'è la mansarda
  g.rect(P.roof, HEAD.x + 2, HEAD.top - 18, HEAD.w - 6, 3);
  g.rect(P.roof, HEAD.x, HEAD.top - 15, HEAD.w + 1, 4);
  g.rect(P.roof, HEAD.x - 2, HEAD.top - 11, HEAD.w + 5, 7);
  g.rect(P.eave, HEAD.x - 3, HEAD.top - 4, HEAD.w + 7, 3);
  g.rect('#2c2c30', HEAD.x + 58, HEAD.top - 24, 5, 7); // comignolo
  for (let x = MAIN.x - 2; x < HEAD.x + HEAD.w + 3; x += 4) g.rect(P.rafter, x, MAIN.top - 1, 1, 1);
  // muri
  g.rect(P.wall, MAIN.x, MAIN.top, MAIN.w + HEAD.w, STREET - MAIN.top);
  g.rect(P.wallLight, HEAD.x + HEAD.w - 4, HEAD.top, 4, STREET - HEAD.top);
  for (let i = 0; i < 300; i++)
    g.rect(P.wallDark, MAIN.x + (i * 53) % (MAIN.w + HEAD.w), MAIN.top + (i * 29) % (STREET - MAIN.top - 8), 1, 1);
  g.rect(P.wallDark, HEAD.x, HEAD.top, 1, STREET - HEAD.top); // giunto tra i due blocchi
  // marcapiano della testata
  g.rect(P.bord, HEAD.x, HEAD_ROWS.band, HEAD.w, 1);
  g.rect(P.brownDark, HEAD.x, HEAD_ROWS.band + 1, HEAD.w, 2);
  // zoccolo: più alto sulla testata
  g.rect(P.plinth, MAIN.x, STREET - 6, MAIN.w, 6);
  g.rect(P.plinth, HEAD.x, STREET - 10, HEAD.w, 10);
  // pluviali
  [80, HEAD.x - 1, HEAD_PIPE].forEach(x => g.rect(P.pipe, x, MAIN.top - 2, 1, STREET - MAIN.top + 2));

  // finestre degli appartamenti
  APTS.forEach(p => p.r.forEach(r => {
    window_(g, r, look);
    const st = look.state && look.state(p, r);
    if (st && st.glow) g.rect(st.glow, r[0] + 1, r[1] + 1, r[2] - 2, r[3] - 2);
  }));
  rack(g, 182, HEAD_ROWS.C + 10, 25);
  rack(g, 210, HEAD_ROWS.C + 10, 25);

  // piano terra corpo lungo
  lowWindow(g, 9, 106);
  archDoor(g, 23, 99);
  grateWindow(g, 48, 102); grateWindow(g, 66, 102);
  // panchina
  g.rect(P.wood, 83, 113, 12, 2); g.rect(P.wood, 83, 110, 12, 1);
  g.rect('#333', 84, 115, 1, 5); g.rect('#333', 93, 115, 1, 5);
  // bacheche
  [[96, 104], [134, 108]].forEach(([x, y]) => {
    g.rect(P.brownDark, x - 1, y - 1, 10, 9); g.rect(P.white, x, y, 8, 7);
    g.rect('#6aa86a', x + 1, y + 1, 4, 3); g.rect('#d04040', x + 5, y + 4, 2, 1);
  });
  shopDoor(g, 104, 95);
  // ingresso esterno della testata: sporge dalla linea del palazzo
  porch(g, 145, 100);
}

/* porte e finestre del piano terra; (x,y) = angolo in alto a sinistra */
function lowWindow(g, x, y) {
  g.rect(P.brown, x, y, 10, 8); g.rect(P.brownDark, x + 4, y, 1, 8);
}

function archDoor(g, x, y) {
  const h = 21;
  g.rect(P.stone, x, y + 3, 18, h - 3);
  g.rect(P.stone, x + 2, y + 1, 14, 2); g.rect(P.stone, x + 4, y, 10, 1);
  g.rect(P.stoneDark, x + 1, y + 4, 1, h - 4); g.rect(P.stoneDark, x + 16, y + 4, 1, h - 4);
  g.rect(P.brown, x + 3, y + 5, 12, h - 5); g.rect(P.brown, x + 5, y + 3, 8, 2);
  g.rect(P.brownDark, x + 9, y + 3, 1, h - 3);
  g.rect('#c8a050', x + 7, y + 11, 1, 1); g.rect('#c8a050', x + 11, y + 11, 1, 1);
}

function shopDoor(g, x, y) {
  g.rect(P.brownDark, x, y, 42, 2);
  g.rect(P.wood, x + 2, y + 2, 38, 9);
  g.rect(P.brownDark, x + 2, y + 10, 38, 1);
  text(g, 'SOUVENIRS', x + 4, y + 4, P.curtain);
  g.rect(P.brownDark, x + 13, y + 11, 14, 14);
  g.rect('#4a4038', x + 15, y + 13, 10, 12);
  for (let k = y + 15; k < y + 25; k += 3) g.rect('#7a6a50', x + 16, k, 8, 1);
  g.rect(P.geran, x + 10, y + 21, 2, 2); g.rect(P.leaf, x + 10, y + 23, 2, 2);
}

// ingresso con tettoia: corpo in muratura largo 21, porta da 13 al centro
function porch(g, x, y) {
  g.rect(P.stoneDark, x + 3, y + 4, 21, 16);
  g.rect(P.brown, x + 7, y + 5, 13, 15);
  g.rect(P.glass, x + 9, y + 7, 4, 6); g.rect(P.glass, x + 15, y + 7, 4, 6);
  g.rect(P.brownDark, x + 13, y + 5, 1, 15);
  g.rect(P.roof, x, y, 27, 2); g.rect(P.brownDark, x + 1, y + 2, 25, 2);
  g.rect('#f0e0a0', x + 13, y + 4, 1, 1);
}

function doubleDoor(g, x, y) {
  g.rect(P.bord, x - 1, y - 1, 14, 19);
  g.rect(P.brownDark, x, y, 12, 18);
  g.rect(P.brown, x + 1, y + 1, 4, 17); g.rect(P.brown, x + 7, y + 1, 4, 17);
  for (let k = y + 3; k < y + 18; k += 4) { g.rect(P.brownDark, x + 1, k, 4, 1); g.rect(P.brownDark, x + 7, k, 4, 1); }
  g.rect('#c8a050', x + 5, y + 9, 1, 1);
}

function singleDoor(g, x, y) {
  g.rect(P.stoneDark, x, y, 8, 10);
  g.rect(P.brown, x + 1, y + 1, 6, 9);
  for (let k = y + 3; k < y + 10; k += 3) g.rect(P.brownDark, x + 2, k, 4, 1);
  g.rect('#c8a050', x + 5, y + 5, 1, 1);
}

// terrazzo in legno visto di lato, attaccato al muro sul lato destro del disegno
function sideBalcony(g, x, y) {
  g.rect(P.brownDark, x, y + 8, 12, 2);                      // pavimento
  g.rect(P.wood, x, y, 12, 1); g.rect(P.wood, x, y + 4, 12, 1); // corrimano
  for (let k = 0; k < 12; k += 2) g.rect(P.woodLight, x + k, y + 1, 1, 7);
  g.rect(P.brownDark, x + 8, y + 10, 4, 1); g.rect(P.brownDark, x + 10, y + 11, 2, 1); // mensola
  g.rect(P.geran, x + 1, y - 1, 2, 1); g.rect(P.leaf, x + 3, y - 1, 2, 1); g.rect(P.geran, x + 5, y - 1, 2, 1);
}

/* legenda: una lettera per ogni tipo di finestra/porta (vedi GAME_DESIGN.md) */
const TYPES = {
  A: { it: 'Scuri rossi aperti', w: 16, h: 13, draw: (g, x, y) => shutters(g, [x + 3, y, 10, 13], 'red', true) },
  B: { it: 'Scuri rossi chiusi', w: 12, h: 13, draw: (g, x, y) => shutters(g, [x + 1, y, 10, 13], 'red', false) },
  C: { it: 'Scuri viola chiusi', w: 12, h: 13, draw: (g, x, y) => shutters(g, [x + 1, y, 10, 13], 'mauve', false) },
  D: { it: 'Scuri viola aperti', w: 16, h: 13, draw: (g, x, y) => shutters(g, [x + 3, y, 10, 13], 'mauve', true) },
  E: { it: 'Inferriata, scuri marroni, gerani', w: 16, h: 13, draw: (g, x, y) => grateWindow(g, x + 3, y) },
  F: { it: 'Grande con inferriata', w: 11, h: 16, draw: (g, x, y) => grate(g, x, y, 11, 16) },
  G: { it: 'Piccola con rastrelliera', w: 11, h: 14, draw: (g, x, y) => { plain(g, x + 1, y + 1, 8, 9); rack(g, x - 1, y + 10, 13); } },
  H: { it: 'Finestrella bassa', w: 10, h: 8, draw: lowWindow },
  K: { it: 'Abbaino mansarda', w: 12, h: 10, draw: (g, x, y) => dormer(g, x + 2, y + 3, 8, 7) },
  L: { it: 'Terrazzo laterale', w: 12, h: 12, draw: sideBalcony },
  P: { it: 'Portone ad arco', w: 18, h: 21, draw: archDoor },
  Q: { it: 'Negozio Souvenirs', w: 42, h: 25, draw: shopDoor },
  R: { it: 'Ingresso con tettoia', w: 27, h: 20, draw: porch },
  T: { it: 'Porta a due ante', w: 12, h: 18, draw: doubleDoor },
  U: { it: 'Porta singola', w: 8, h: 10, draw: singleDoor }
};

function street(g) {
  g.rect(P.walk, 0, STREET, W, 8);
  for (let i = 0; i < 40; i++) g.rect(P.walkLine, (i * 23) % W, STREET + 1 + (i * 5) % 6, 3 + i % 4, 1);
  g.rect(P.road, 0, STREET + 8, W, H - STREET - 8);
  g.rect(P.roadLine, 0, STREET + 9, W, 1);
  // staccionata davanti all'ingresso della testata
  for (let x = 143; x < 170; x += 3) g.rect(P.fence, x, 113 + (x & 1), 2, 11 - (x & 1));
  g.rect(P.fence, 143, 117, 27, 1);
  // arco di tronchi "SOUVENIRS"
  g.rect('#8a8070', 186, 120, 40, 5);
  g.rect(P.wood, 188, 110, 3, 12); g.rect(P.wood, 221, 110, 3, 12);
  g.rect(P.woodLight, 187, 107, 38, 6); g.rect(P.wood, 187, 112, 38, 1);
  text(g, 'SOUVENIRS', 189, 108, P.brownDark);
  [190, 198, 208, 216].forEach((x, i) => g.rect(i & 1 ? '#f0f0f0' : P.geran, x, 119, 2, 1));
  // fermata bus
  g.rect('#777', 2, 100, 1, 26);
  g.rect(P.bus, 0, 98, 5, 7); g.rect(P.white, 1, 100, 3, 3);
}

function draw(g, look) { background(g); building(g, look); street(g); }

const api = { W, H, P, APTS, LOOK, FONT, TYPES, text, rack, draw, background, building, street };
if (typeof module != 'undefined') module.exports = api; else root.BuildingArt = api;
})(this);
