/* Amministratori giocabili: sprite pixel art alti ~100 px (3/4 dello schermo 240x135) e schede.
   Funziona sia nel browser sia in Node. g = {rect(colore,x,y,w,h)}; drawAdmin(g, i, cx, piedi) */
(function (root) {
const OUT = '#1a1420';

/* --- forme --- */
function ell(g, c, cx, cy, rx, ry) {
  for (let y = -ry; y <= ry; y++) {
    const h = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry + .01))));
    g.rect(c, cx - h, cy + y, 2 * h + 1, 1);
  }
}
const ellO = (g, f, cx, cy, rx, ry) => { ell(g, OUT, cx, cy, rx + 1, ry + 1); ell(g, f, cx, cy, rx, ry); };
const box = (g, f, x, y, w, h) => { g.rect(OUT, x - 1, y - 1, w + 2, h + 2); g.rect(f, x, y, w, h); };
// trapezio centrato: larghezza w0 in alto e w1 in basso
function trap(g, c, cx, y0, y1, w0, w1) {
  for (let y = y0; y <= y1; y++) {
    const w = Math.round(w0 + (w1 - w0) * (y - y0) / Math.max(1, y1 - y0));
    g.rect(c, cx - (w >> 1), y, w, 1);
  }
}
const trapO = (g, f, cx, y0, y1, w0, w1) => { trap(g, OUT, cx, y0 - 1, y1 + 1, w0 + 2, w1 + 2); trap(g, f, cx, y0, y1, w0, w1); };

/* --- parti comuni --- */
function head(g, s, cx, t) {
  g.rect(OUT, cx - 5, t + 21, 10, 7); g.rect(s.skin, cx - 4, t + 21, 8, 7); // collo
  box(g, s.skin, cx - 12, t + 10, 3, 5); box(g, s.skin, cx + 9, t + 10, 3, 5);  // orecchie
  ellO(g, s.skin, cx, t + 12, 9, 11);
  g.rect(s.shade, cx - 8, t + 16, 2, 3); g.rect(s.shade, cx + 7, t + 16, 2, 3);
}
function eyes(g, s, cx, t) {
  g.rect('#ffffff', cx - 6, t + 12, 3, 2); g.rect('#ffffff', cx + 3, t + 12, 3, 2);
  g.rect(s.eye || '#2a1e18', cx - 5, t + 12, 2, 2); g.rect(s.eye || '#2a1e18', cx + 4, t + 12, 2, 2);
  g.rect(s.brow, cx - 6, t + 10, 4, 1); g.rect(s.brow, cx + 3, t + 10, 4, 1);
  g.rect(s.shade, cx, t + 14, 2, 3); g.rect(s.shade, cx - 1, t + 16, 1, 1);  // naso
}
function mouth(g, c, cx, y, w = 5) { g.rect(c, cx - (w >> 1), y, w, 1); }
function glasses(g, c, cx, t, round) {
  [cx - 7, cx + 2].forEach(x => {
    g.rect(c, x, t + 10, 6, 1); g.rect(c, x, t + 15, 6, 1); g.rect(c, x, t + 10, 1, 6); g.rect(c, x + 5, t + 10, 1, 6);
    if (round) { g.rect('#00000000', x, t + 10, 1, 1); }
    g.rect('#cfe6f5', x + 1, t + 11, 4, 1);
  });
  g.rect(c, cx - 1, t + 12, 3, 1); g.rect(c, cx - 10, t + 12, 3, 1); g.rect(c, cx + 8, t + 12, 3, 1);
}
function hand(g, s, x, y) { ellO(g, s.skin, x, y, 3, 3); }
function shadow(g, cx, y, rx) { ell(g, '#00000055', cx, y, rx, 3); }

/* --- i 5 personaggi; t = cima della testa, f = piedi --- */
const DRAW = [
  // 1. anziano calvo, capelli bianchi ai lati, occhiali, giacca, sovrappeso
  (g, cx, f) => {
    const t = f - 100, s = { skin: '#f0c6a0', shade: '#d9a47e', brow: '#e8e8e8' };
    const jk = '#5d6577', jkD = '#454c5c';
    shadow(g, cx, f, 24);
    box(g, '#4b4f5c', cx - 12, t + 64, 10, 31); box(g, '#4b4f5c', cx + 2, t + 64, 10, 31); // pantaloni
    g.rect('#3a3e49', cx - 3, t + 66, 1, 28);
    box(g, '#1c1c22', cx - 14, t + 95, 13, 4); box(g, '#1c1c22', cx + 1, t + 95, 13, 4);   // scarpe
    // braccia dietro la pancia
    box(g, jk, cx - 27, t + 30, 7, 30); box(g, jk, cx + 20, t + 30, 7, 30);
    hand(g, s, cx - 24, t + 63);
    // busto + pancia: prima i contorni, poi il colore
    trap(g, OUT, cx, t + 25, t + 67, 38, 40); ell(g, OUT, cx, t + 50, 21, 15);
    trap(g, jk, cx, t + 26, t + 66, 36, 38); ell(g, jk, cx, t + 50, 20, 14);
    trap(g, '#f2f2ee', cx, t + 26, t + 42, 12, 2);                       // camicia
    trap(g, '#8e2a2a', cx, t + 30, t + 46, 3, 5); g.rect('#6e1e1e', cx - 2, t + 28, 4, 3); // cravatta
    for (let k = 0; k < 14; k++) { g.rect(jkD, cx - 7 - (k >> 1), t + 27 + k, 1, 1); g.rect(jkD, cx + 6 + (k >> 1), t + 27 + k, 1, 1); } // risvolti
    g.rect('#2a2d36', cx - 1, t + 50, 2, 2); g.rect('#2a2d36', cx - 1, t + 57, 2, 2);  // bottoni
    g.rect('#f2f2ee', cx + 12, t + 33, 3, 2);                                          // fazzoletto
    // cartellina nella mano destra
    box(g, '#b0763a', cx + 17, t + 52, 13, 17); g.rect('#8a5a2a', cx + 17, t + 52, 13, 2); g.rect('#f2f2ee', cx + 19, t + 55, 9, 1);
    hand(g, s, cx + 23, t + 62);
    head(g, s, cx, t);
    // calvo: lucido in cima, capelli bianchi solo vicino alle orecchie
    g.rect('#fbe2c8', cx - 4, t + 3, 6, 2); g.rect('#fbe2c8', cx - 2, t + 2, 3, 1);
    ell(g, '#f6f6f6', cx - 10, t + 9, 2, 4); ell(g, '#f6f6f6', cx + 10, t + 9, 2, 4);
    g.rect('#d8d8d8', cx - 11, t + 11, 1, 3); g.rect('#d8d8d8', cx + 11, t + 11, 1, 3);
    eyes(g, s, cx, t);
    glasses(g, '#2a2a2a', cx, t);
    g.rect('#f6f6f6', cx - 3, t + 18, 7, 1); mouth(g, '#9a5a4a', cx, t + 20, 3); // baffi bianchi
    g.rect(s.shade, cx - 5, t + 22, 10, 1);                                         // doppio mento
  },
  // 2. giovane moro, camicia e jeans
  (g, cx, f) => {
    const t = f - 100, s = { skin: '#e6b48c', shade: '#c99470', brow: '#2a1b12' }, hair = '#2a1b12';
    const sh = '#9cc3e8', shD = '#7aa5d0';
    shadow(g, cx, f, 18);
    box(g, '#3a5a94', cx - 10, t + 62, 9, 33); box(g, '#3a5a94', cx + 1, t + 62, 9, 33);  // jeans
    g.rect('#5a7ab4', cx - 4, t + 64, 1, 30); g.rect('#5a7ab4', cx + 7, t + 64, 1, 30);
    box(g, '#f0f0f0', cx - 12, t + 95, 12, 4); box(g, '#f0f0f0', cx, t + 95, 12, 4);        // sneakers
    g.rect('#d04040', cx - 9, t + 96, 5, 1); g.rect('#d04040', cx + 3, t + 96, 5, 1);
    // braccia: manica arrotolata, avambraccio scoperto
    box(g, sh, cx - 21, t + 29, 6, 15); box(g, sh, cx + 15, t + 29, 6, 15);
    g.rect(shD, cx - 21, t + 42, 6, 2); g.rect(shD, cx + 15, t + 42, 6, 2);
    box(g, s.skin, cx - 20, t + 45, 5, 14); box(g, s.skin, cx + 16, t + 45, 5, 14);
    trapO(g, sh, cx, t + 26, t + 62, 32, 26);
    g.rect('#6a4a2a', cx - 13, t + 60, 26, 3); g.rect('#d0b040', cx - 1, t + 60, 3, 3);   // cintura
    g.rect(shD, cx, t + 30, 1, 30);
    for (let y = t + 33; y < t + 60; y += 6) g.rect('#f4f8fc', cx - 1, y, 1, 1);           // bottoni
    trap(g, '#cfe2f5', cx - 4, t + 25, t + 30, 6, 2); trap(g, '#cfe2f5', cx + 4, t + 25, t + 30, 6, 2); // colletto
    g.rect(s.skin, cx - 2, t + 25, 4, 4);
    // telefono
    box(g, '#16161c', cx + 16, t + 55, 5, 8); g.rect('#5ad1ff', cx + 17, t + 56, 3, 5);
    hand(g, s, cx - 18, t + 61); hand(g, s, cx + 18, t + 61);
    head(g, s, cx, t);
    // capelli corti mori con ciuffo
    ell(g, OUT, cx, t + 5, 11, 6); ell(g, hair, cx, t + 5, 10, 5);
    g.rect(hair, cx - 10, t + 5, 20, 4); g.rect(hair, cx - 4, t - 1, 10, 3); g.rect('#4a3424', cx - 2, t, 5, 1);
    g.rect(hair, cx - 10, t + 8, 2, 6); g.rect(hair, cx + 8, t + 8, 2, 6);                 // basette
    eyes(g, s, cx, t);
    mouth(g, '#9a5a4a', cx, t + 19, 5); g.rect('#9a5a4a', cx + 3, t + 18, 1, 1);           // sorriso
    for (let k = 0; k < 7; k++) g.rect('#b88a68', cx - 5 + k * 2 - (k & 1), t + 21 + (k & 1), 1, 1); // barba corta
  },
  // 3. donna bionda elegante
  (g, cx, f) => {
    const t = f - 100, s = { skin: '#f4d0b6', shade: '#dcae90', brow: '#b08a30', eye: '#2a4a7a' };
    const hair = '#f0cc5a', hairD = '#cfa63a', nv = '#283a6e', nvD = '#1c2a52';
    shadow(g, cx, f, 16);
    ellO(g, hair, cx, t + 19, 13, 18);                                                    // capelli lunghi dietro
    g.rect(hairD, cx - 12, t + 22, 2, 12); g.rect(hairD, cx + 11, t + 22, 2, 12);
    box(g, s.skin, cx - 7, t + 80, 5, 15); box(g, s.skin, cx + 2, t + 80, 5, 15);         // gambe
    box(g, '#7a1f2b', cx - 9, t + 95, 8, 4); box(g, '#7a1f2b', cx + 1, t + 95, 8, 4);     // décolleté
    g.rect('#7a1f2b', cx - 3, t + 97, 2, 3); g.rect('#7a1f2b', cx + 7, t + 97, 2, 3);
    box(g, nv, cx - 19, t + 29, 5, 29); box(g, nv, cx + 14, t + 29, 5, 29);               // braccia
    // borsetta rossa al braccio sinistro
    g.rect('#8a2030', cx - 22, t + 46, 1, 6); g.rect('#8a2030', cx - 13, t + 46, 1, 6);
    box(g, '#b0303a', cx - 25, t + 51, 14, 10); g.rect('#d0a040', cx - 19, t + 54, 2, 2);
    trapO(g, '#22305c', cx, t + 56, t + 80, 26, 24);                                     // gonna
    g.rect(nvD, cx, t + 66, 1, 14);
    trapO(g, nv, cx, t + 26, t + 46, 30, 20); trapO(g, nv, cx, t + 46, t + 58, 20, 27);   // tailleur sciancrato
    trap(g, '#f6f3ee', cx, t + 26, t + 40, 10, 2);                                        // camicetta
    for (let k = 0; k < 12; k++) { g.rect(nvD, cx - 6 - (k >> 1), t + 27 + k, 1, 1); g.rect(nvD, cx + 5 + (k >> 1), t + 27 + k, 1, 1); }
    g.rect('#d0a040', cx - 1, t + 49, 2, 2);
    for (let k = -4; k <= 4; k += 2) g.rect('#ffffff', cx + k, t + 28 + (Math.abs(k) >> 1 ^ 2), 1, 1); // perle
    hand(g, s, cx - 16, t + 61); hand(g, s, cx + 16, t + 61);
    head(g, s, cx, t);
    // frangia e ciocche
    ell(g, OUT, cx, t + 4, 11, 6); ell(g, hair, cx, t + 4, 10, 5);
    g.rect(hair, cx - 10, t + 4, 6, 7); g.rect(hair, cx + 5, t + 4, 5, 5); g.rect(hairD, cx - 3, t + 2, 6, 1);
    eyes(g, s, cx, t);
    g.rect('#1a1420', cx - 7, t + 11, 4, 1); g.rect('#1a1420', cx + 3, t + 11, 4, 1);     // ciglia
    g.rect('#c8323c', cx - 2, t + 18, 5, 2); g.rect('#e05a64', cx - 1, t + 18, 3, 1);     // rossetto
    g.rect('#d0a040', cx - 11, t + 15, 1, 2); g.rect('#d0a040', cx + 10, t + 15, 1, 2);   // orecchini
    g.rect('#f0a0a0', cx - 7, t + 16, 2, 1); g.rect('#f0a0a0', cx + 5, t + 16, 2, 1);
  },
  // 4. montanaro di mezza età: cappello alpino, barba, camicia a quadri, gilet, calzettoni
  (g, cx, f) => {
    const t = f - 100, s = { skin: '#d49a70', shade: '#b87e58', brow: '#5a3a22' };
    const fl = '#b8382c', flD = '#7a1f18', gil = '#5b4a2c', beard = '#6e4a2c';
    shadow(g, cx, f, 22);
    box(g, '#6b4f30', cx - 13, t + 62, 12, 20); box(g, '#6b4f30', cx + 1, t + 62, 12, 20); // braghe
    box(g, '#a83a32', cx - 12, t + 82, 10, 12); box(g, '#a83a32', cx + 2, t + 82, 10, 12); // calzettoni
    g.rect('#e8e0d0', cx - 12, t + 84, 10, 1); g.rect('#e8e0d0', cx + 2, t + 84, 10, 1);
    box(g, '#3a2716', cx - 15, t + 93, 14, 6); box(g, '#3a2716', cx + 1, t + 93, 14, 6);   // scarponi
    g.rect('#5a3a22', cx - 15, t + 93, 14, 1); g.rect('#5a3a22', cx + 1, t + 93, 14, 1);
    const checks = (x, y, w, h) => {
      for (let i = 0; i < w; i += 4) g.rect(flD, x + i, y, 1, h);
      for (let j = 0; j < h; j += 4) g.rect(flD, x, y + j, w, 1);
    };
    box(g, fl, cx - 25, t + 29, 8, 30); box(g, fl, cx + 17, t + 29, 8, 30); checks(cx - 25, t + 29, 8, 30); checks(cx + 17, t + 29, 8, 30);
    trapO(g, fl, cx, t + 26, t + 63, 42, 36);
    checks(cx - 20, t + 26, 40, 37);
    trap(g, gil, cx - 13, t + 28, t + 63, 14, 12); trap(g, gil, cx + 13, t + 28, t + 63, 14, 12); // gilet
    g.rect(OUT, cx - 7, t + 28, 1, 35); g.rect(OUT, cx + 6, t + 28, 1, 35);
    for (let y = t + 36; y < t + 62; y += 7) g.rect('#c8b070', cx - 9, y, 2, 2);
    // chiave inglese
    box(g, '#9aa0a8', cx + 24, t + 40, 3, 22); box(g, '#9aa0a8', cx + 21, t + 36, 9, 5); g.rect('#1a1420', cx + 24, t + 36, 3, 3);
    hand(g, s, cx - 21, t + 62); hand(g, s, cx + 25, t + 60);
    head(g, s, cx, t);
    // barba folta con qualche pelo grigio
    ell(g, OUT, cx, t + 19, 10, 8); ell(g, beard, cx, t + 19, 9, 7);
    g.rect(s.skin, cx - 6, t + 13, 12, 3);
    eyes(g, s, cx, t);
    g.rect('#4e3420', cx - 4, t + 16, 9, 2);                                              // baffi
    g.rect('#3a1a14', cx - 2, t + 19, 5, 1);
    [[-6, 20], [5, 22], [-2, 24], [3, 19]].forEach(([dx, dy]) => g.rect('#a89888', cx + dx, t + dy, 1, 2));
    // cappello alpino verde con piuma
    trapO(g, '#3e5c30', cx, t - 6, t + 2, 14, 18);
    box(g, '#3e5c30', cx - 13, t + 2, 26, 3);
    g.rect('#2a1e14', cx - 9, t - 1, 18, 2);
    g.rect('#e8dcc0', cx + 8, t - 9, 1, 8); g.rect('#e8dcc0', cx + 9, t - 11, 1, 4); g.rect('#c03a30', cx + 7, t - 2, 3, 2);
  },
  // 5. nonna: crocchia grigia, occhiali, scialle, gonna lunga, bastone
  (g, cx, f) => {
    const t = f - 92, s = { skin: '#efc6a8', shade: '#d4a688', brow: '#a8a8b0' };
    const hair = '#d0d0d6', card = '#8c6aa0', cardD = '#6c4c80', dress = '#34406e';
    shadow(g, cx, f, 20);
    box(g, '#c8a890', cx - 8, t + 82, 6, 6); box(g, '#c8a890', cx + 2, t + 82, 6, 6);     // calze
    box(g, '#5a3a22', cx - 11, t + 88, 10, 4); box(g, '#5a3a22', cx + 1, t + 88, 10, 4);  // scarpe
    // bastone
    g.rect(OUT, cx + 22, t + 52, 4, 41); g.rect('#6b4426', cx + 23, t + 52, 2, 40);
    g.rect(OUT, cx + 19, t + 50, 7, 4); g.rect('#6b4426', cx + 20, t + 51, 5, 2);
    trapO(g, dress, cx, t + 48, t + 82, 30, 38);                                          // gonna lunga a fiori
    for (let i = 0; i < 24; i++) g.rect(i & 1 ? '#f0d070' : '#e86a8a', cx - 15 + (i * 7) % 31, t + 52 + (i * 5) % 28, 1, 1);
    box(g, card, cx - 21, t + 25, 7, 27); box(g, card, cx + 14, t + 25, 7, 27);           // braccia
    trapO(g, card, cx, t + 22, t + 52, 30, 34);                                          // golfino
    trap(g, dress, cx, t + 22, t + 52, 6, 10);
    for (let y = t + 28; y < t + 50; y += 6) { g.rect('#f0e8d8', cx - 6, y, 2, 2); }
    g.rect(cardD, cx - 17, t + 22, 34, 3);                                               // scialle sulle spalle
    for (let x = cx - 15; x < cx + 15; x += 3) g.rect(cardD, x, t + 25, 1, 2);
    g.rect('#d0a040', cx + 3, t + 27, 3, 3); g.rect('#e86a8a', cx + 4, t + 28, 1, 1);    // spilla
    // borsetta
    box(g, '#7a3a5a', cx - 26, t + 46, 10, 8); g.rect('#5a2a40', cx - 23, t + 42, 1, 4); g.rect('#5a2a40', cx - 19, t + 42, 1, 4);
    hand(g, s, cx - 18, t + 54); hand(g, s, cx + 22, t + 53);
    // testa con capelli grigi raccolti e crocchia
    ellO(g, hair, cx, t + 9, 11, 9);
    ellO(g, hair, cx, t - 3, 6, 4); g.rect('#a8a8b0', cx - 3, t - 4, 7, 1);
    head(g, s, cx, t + 1);
    ell(g, hair, cx, t + 4, 10, 4); g.rect(hair, cx - 10, t + 4, 3, 7); g.rect(hair, cx + 8, t + 4, 3, 7);
    g.rect('#a8a8b0', cx - 6, t + 3, 12, 1);
    eyes(g, s, cx, t + 1);
    glasses(g, '#c8a040', cx, t + 1);
    g.rect('#e89a9a', cx - 8, t + 17, 2, 2); g.rect('#e89a9a', cx + 6, t + 17, 2, 2);     // guance rosse
    mouth(g, '#9a5a4a', cx, t + 20, 5); g.rect('#9a5a4a', cx - 3, t + 19, 1, 1); g.rect('#9a5a4a', cx + 3, t + 19, 1, 1);
    g.rect(s.shade, cx - 4, t + 6, 1, 1); g.rect(s.shade, cx + 3, t + 6, 1, 1);           // rughe
  }
];

/* schede: testi provvisori, da sostituire con quelli dell'utente */
const ADMINS = [
  { name: 'Il Ragioniere', desc: "Trent'anni di assemblee alle spalle. Conosce ogni comma del regolamento e non sbaglia mai un conto.", bonus: 'Bollette e conti piu facili', malus: 'Lento nelle riparazioni' },
  { name: 'Il Giovane', desc: 'Appena laureato, gestisce il condominio dallo smartphone. Tanta energia, poca esperienza.', bonus: 'Piu tempo per ogni problema', malus: "L'umore cala piu in fretta" },
  { name: "L'Avvocata", desc: 'Elegante e decisa: nessuna lite tra vicini le resiste e le assemblee finiscono in orario.', bonus: 'Liti e assemblee piu facili', malus: 'Odia sporcarsi le mani' },
  { name: 'Il Montanaro', desc: 'Cresciuto in Val di Rabbi, ripara tutto con le sue mani e un pezzo di fil di ferro.', bonus: 'Riparazioni piu facili', malus: 'Odia la burocrazia' },
  { name: 'La Nonna', desc: 'Conosce tutti da sempre e porta una torta a ogni piano. Impossibile arrabbiarsi con lei.', bonus: "L'umore sale di piu", malus: 'Si muove piano: meno tempo' }
];

const drawAdmin = (g, i, cx, feet) => DRAW[i](g, cx, feet);

const api = { ADMINS, drawAdmin };
if (typeof module != 'undefined') module.exports = api; else root.AdminsArt = api;
})(this);
