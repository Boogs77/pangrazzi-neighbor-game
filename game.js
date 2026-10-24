/* Pangrazzi: The Neighbor Game — titolo, scelta amministratore, menu e minigiochi.
   Schermo logico 240x135; tutto è disegnato a rettangoli (g.rect) come gli sprite. */
(() => {
'use strict';
const W = 240, H = 135;
const cv = document.getElementById('c'), ctx = cv.getContext('2d');
const wrap = document.getElementById('wrap'), nameInput = document.getElementById('name');
const F = window.PixelFont, AD = window.AdminsArt;
const g = { rect(c, x, y, w, h) { ctx.fillStyle = c; ctx.fillRect(Math.round(x), Math.round(y), Math.round(w), Math.round(h)); } };
const C = { bg: '#0d0f24', pan: '#1b1f4b', panD: '#14173a', ink: '#fff7d6', y: '#f5c518', g: '#3ddc84', r: '#e63946', b: '#4fc3f7', dim: '#8a8fb8' };

/* --- memoria locale: lingua, amministratore, record --- */
const store = {
  get(k, d) { try { const v = localStorage.getItem('pangrazzi.' + k); return v == null ? d : JSON.parse(v); } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('pangrazzi.' + k, JSON.stringify(v)); } catch (e) { /* senza memoria si gioca lo stesso */ } }
};
let lang = store.get('lang', 'it');
const L = (it, en) => lang == 'en' ? en : it;
const records = id => store.get('rec.' + id, []);
function addRecord(id, name, score) {
  const list = records(id), entry = { name, score };
  list.push(entry);
  list.sort((a, b) => b.score - a.score);
  const top = list.slice(0, 5);
  store.set('rec.' + id, top);
  return top.indexOf(entry);
}

/* --- disegno --- */
const rnd = (a, b) => a + Math.random() * (b - a);
const pick = a => a[Math.random() * a.length | 0];
function ell(c, cx, cy, rx, ry) {
  if (rx < .5 || ry < .5) return;
  for (let y = -Math.round(ry); y <= Math.round(ry); y++) {
    const h = Math.round(rx * Math.sqrt(Math.max(0, 1 - (y * y) / (ry * ry))));
    g.rect(c, cx - h, cy + y, 2 * h + 1, 1);
  }
}
const text = (s, x, y, c = C.ink, sc = 1) => F.text(g, s, x, y, c, sc);
const center = (s, y, c = C.ink, sc = 1, x0 = 0, w = W) => F.text(g, s, x0 + ((w - F.width(s, sc)) >> 1), y, c, sc);
function para(s, x, y, max, c = C.ink, lh = 7) { F.wrap(s, max).forEach(l => { text(l, x, y, c); y += lh; }); return y; }
function panel(x, y, w, h) { g.rect(C.ink, x - 1, y - 1, w + 2, h + 2); g.rect(C.panD, x, y, w, h); }

/* --- scene, pulsanti, input --- */
let scene = null, btns = [];
function button(x, y, w, h, label, fn, col = C.y, tc = '#000000') {
  g.rect(C.ink, x - 1, y - 1, w + 2, h + 2); g.rect(col, x, y, w, h);
  F.text(g, label, x + ((w - F.width(label)) >> 1), y + ((h - 5) >> 1), tc);
  btns.push({ x, y, w, h, fn });
}
function go(s, ...args) { hideName(); scene = s; s.enter && s.enter(...args); }
function setLang(l) { lang = l; store.set('lang', l); document.documentElement.lang = l; }

cv.addEventListener('pointerdown', e => {
  const r = cv.getBoundingClientRect(), x = (e.clientX - r.left) * W / r.width, y = (e.clientY - r.top) * H / r.height;
  for (let i = btns.length - 1; i >= 0; i--) {
    const b = btns[i];
    if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) { b.fn(); return; }
  }
  scene.click && scene.click(x, y);
});
addEventListener('keydown', e => {
  if (e.target == nameInput) { if (e.key == 'Enter' && scene.submit) scene.submit(); return; }
  scene.key && scene.key(e.key);
});

// campo del nome: un <input> vero sopra il canvas, posizionato in coordinate di gioco
let nameBox = null;
function showName(x, y, w, h, val) {
  nameBox = [x, y, w, h];
  Object.assign(nameInput.style, { display: 'block', left: x / W * 100 + '%', top: y / H * 100 + '%', width: w / W * 100 + '%', height: h / H * 100 + '%' });
  nameInput.value = val;
  fitName();
  nameInput.focus();
}
function hideName() { nameBox = null; nameInput.style.display = 'none'; nameInput.blur(); }
function fitName() { if (nameBox) nameInput.style.fontSize = Math.max(10, wrap.clientHeight * 7 / H) + 'px'; }
addEventListener('resize', fitName);

const bg = new Image();
bg.src = 'reference/edificio.png';

/* --- testi inglesi degli amministratori (gli italiani sono in admins-art.js) --- */
const ADMIN_EN = [
  { name: 'Accountant', desc: 'Thirty years of residents meetings. Knows every clause of the rules and never gets a sum wrong.', bonus: 'Bills and sums are easier', malus: 'Slow at repairs' },
  { name: 'Young Gun', desc: 'Just graduated, runs the building from his smartphone. Lots of energy, little experience.', bonus: 'More time for every problem', malus: 'Mood drops faster' },
  { name: 'The Lawyer', desc: 'Elegant and firm: no quarrel between neighbours can resist her, and meetings end on time.', bonus: 'Quarrels and meetings are easier', malus: 'Hates getting her hands dirty' },
  { name: 'Mountain Man', desc: 'Grew up in Val di Rabbi, fixes everything with his bare hands and a bit of wire.', bonus: 'Repairs are easier', malus: 'Hates paperwork' },
  { name: 'Granny', desc: 'Has known everyone forever and brings a cake to every floor. Impossible to be angry with her.', bonus: 'Mood rises more', malus: 'Moves slowly: less time' }
];
const adminText = i => lang == 'en' ? ADMIN_EN[i] : AD.ADMINS[i];

/* =================== TITOLO =================== */
const Title = {
  draw() {
    g.rect(C.bg, 0, 0, W, H);
    center('Pangrazzi', 3, C.y, 3);
    center('The Neighbor Game', 21, C.ink);
    g.rect(C.y, 0, 28, W, 1);
    // il condominio intero e fermo, ridotto alla larghezza dello schermo
    if (bg.complete && bg.naturalWidth) {
      const w = 200, h = Math.round(w * bg.naturalHeight / bg.naturalWidth), x = (W - w) >> 1;
      g.rect(C.ink, x - 1, 30, w + 2, h + 2);
      ctx.imageSmoothingEnabled = true; ctx.imageSmoothingQuality = 'high';
      ctx.drawImage(bg, x, 31, w, h);
      ctx.imageSmoothingEnabled = false;
    }
    g.rect(C.y, 0, 106, W, 1);
    F.wrap(L("Sei l'amministratore del Condominio Pangrazzi e devi puntare alla felicita di tutti i condomini.",
      'You are the administrator of the Pangrazzi condominium, and your goal is the happiness of every resident.'), 56)
      .forEach((l, i) => center(l, 108 + i * 7));
    button(95, 122, 50, 11, L('Gioca', 'Play'), () => go(Choose));
    button(197, 2, 17, 9, 'IT', () => setLang('it'), lang == 'it' ? C.y : C.dim);
    button(218, 2, 17, 9, 'EN', () => setLang('en'), lang == 'en' ? C.y : C.dim);
  },
  key(k) { if (k == 'Enter' || k == ' ') go(Choose); }
};

/* =================== SCELTA AMMINISTRATORE =================== */
const Choose = {
  enter() { this.i = store.get('admin', 0); },
  move(d) { this.i = (this.i + d + 5) % 5; },
  pick() { store.set('admin', this.i); go(Menu); },
  draw() {
    const i = this.i, a = adminText(i);
    g.rect(C.bg, 0, 0, W, H);
    g.rect(C.pan, 0, 14, 116, 111);
    for (let k = 0; k < 6; k++) g.rect('#ffffff08', 28 + k * 5, 14, 60 - k * 10, 111);
    g.rect(C.panD, 0, 125, 116, 10);
    AD.drawAdmin(g, i, 58, 126);
    center(L("Scegli l'amministratore", 'Choose your administrator'), 4, C.y);
    g.rect(C.y, 0, 12, W, 1);
    const px = 120, pw = 116;
    panel(px, 18, pw, 113);
    const sc = F.width(a.name, 2) <= pw - 8 ? 2 : 1;
    text(a.name, px + 4, 22, C.y, sc);
    g.rect(C.y, px + 4, 22 + 6 * sc, F.width(a.name, sc), 1);
    let y = 39;
    y = para(a.desc, px + 4, y, 27) + 3;
    text('Bonus', px + 4, y, C.g); y = para('+ ' + a.bonus, px + 4, y + 7, 27) + 2;
    text('Malus', px + 4, y, C.r); para('- ' + a.malus, px + 4, y + 7, 27);
    button(px + 3, 117, 11, 11, '<', () => this.move(-1), C.pan, C.ink);
    text((i + 1) + '/5', px + 18, 120, C.dim);
    button(px + 34, 117, 11, 11, '>', () => this.move(1), C.pan, C.ink);
    button(px + pw - 40, 117, 36, 11, L('Scegli', 'Choose'), () => this.pick());
    for (let k = 0; k < 5; k++) g.rect(k == i ? C.y : C.dim, 44 + k * 6, 130, 3, 3);
    button(2, 1, 11, 10, '<', () => go(Title), C.bg, C.dim);
  },
  click(x) { if (x < 116) this.move(1); },
  key(k) {
    if (k == 'ArrowLeft') this.move(-1);
    else if (k == 'ArrowRight') this.move(1);
    else if (k == 'Enter' || k == ' ') this.pick();
    else if (k == 'Escape') go(Title);
  }
};

/* =================== MENU MINIGIOCHI =================== */
const Menu = {
  draw() {
    g.rect(C.bg, 0, 0, W, H);
    center(L('Minigiochi', 'Minigames'), 4, C.y);
    g.rect(C.y, 0, 12, W, 1);
    text(L('Amministratore: ', 'Administrator: ') + adminText(store.get('admin', 0)).name, 6, 16, C.dim);
    GAMES.forEach((gm, k) => {
      const x = 8 + k * 116, y = 26, w = 108, h = 78;
      panel(x, y, w, h);
      gm.icon(x + w / 2, y + 30);
      center(gm.title(), y + 44, C.y, 1, x, w);
      const best = records(gm.id)[0];
      center(best ? L('Record: ', 'Best: ') + best.name + ' ' + best.score : L('Nessun record', 'No record yet'), y + 54, C.dim, 1, x, w);
      button(x + 24, y + 63, 60, 11, L('Gioca', 'Play'), () => go(Intro, gm));
    });
    center(L('Altri 11 minigiochi in arrivo...', '11 more minigames coming soon...'), 108, C.dim);
    button(8, 119, 112, 12, L('Cambia amministratore', 'Change administrator'), () => go(Choose), C.pan, C.ink);
    button(180, 119, 52, 12, L('Titolo', 'Title'), () => go(Title), C.pan, C.ink);
  },
  key(k) { if (k == 'Escape') go(Title); }
};

/* =================== SPIEGAZIONE PRIMA DEL GIOCO =================== */
const Intro = {
  enter(gm) { this.gm = gm; this.t = 0; },
  update(dt) { this.t += dt; },
  draw() {
    const gm = this.gm;
    gm.drawBg();
    g.rect('#0d0f24c8', 0, 0, W, H);
    panel(14, 6, 212, 106);
    const shake = (this.t * 8 | 0) % 2 && this.t % 2 < .6 ? 1 : 0;
    center(gm.ring(), 11 + shake, C.r, 2);
    center(gm.title(), 26, C.y);
    para(gm.intro(), 20, 37, 50);
    center(gm.tip(), 104, C.b);
    button(20, 119, 70, 12, L('Indietro', 'Back'), () => go(Menu), C.pan, C.ink);
    button(150, 119, 70, 12, L('Via!', 'Go!'), () => go(Play, gm));
  },
  key(k) { if (k == 'Enter' || k == ' ') go(Play, this.gm); else if (k == 'Escape') go(Menu); }
};

/* =================== PARTITA =================== */
const Play = {
  enter(gm) { this.gm = gm; this.m = gm.create(); this.endT = 0; },
  update(dt) {
    this.m.update(dt);
    if (this.m.over && (this.endT += dt) > 1.6) go(End, this.gm, this.m.score);
  },
  draw() {
    this.m.draw();
    if (this.m.over) { g.rect('#0d0f24c0', 0, 54, W, 24); center(this.m.reason, 60, C.y, 2); }
  },
  click(x, y) { if (!this.m.over) this.m.click(x, y); },
  key(k) { if (k == 'Escape') go(Menu); }
};

/* =================== FINE: NOME E RECORD =================== */
const End = {
  enter(gm, score) {
    this.gm = gm; this.score = score; this.saved = -1;
    const recs = records(gm.id);
    this.isBest = !recs.length || score > recs[0].score;
    showName(84, 58, 72, 12, store.get('lastName', ''));
  },
  submit() {
    if (this.saved >= 0) return;
    const n = (nameInput.value.trim() || '???').toUpperCase().slice(0, 10);
    store.set('lastName', n);
    this.saved = addRecord(this.gm.id, n, this.score);
    hideName();
  },
  draw() {
    const gm = this.gm;
    gm.drawBg();
    g.rect('#0d0f24c8', 0, 0, W, H);
    panel(30, 6, 180, 106);
    center(L('Fine!', 'Game over!'), 10, C.y, 2);
    center(gm.title(), 23, C.dim);
    center(String(this.score), 31, C.ink, 2);
    if (this.isBest && this.score > 0) center(L('Nuovo record!', 'New record!'), 44, C.g);
    if (this.saved < 0) {
      center(L('Scrivi il tuo nome', 'Type your name'), 51, C.ink);
      button(95, 75, 50, 11, L('Salva', 'Save'), () => this.submit());
      center(L('(oppure Invio)', '(or press Enter)'), 90, C.dim);
    } else {
      center(L('Classifica', 'High scores'), 51, C.y);
      records(gm.id).forEach((r, k) => {
        const c = k == this.saved ? C.y : C.ink, y = 60 + k * 9;
        text((k + 1) + '. ' + r.name, 64, y, c);
        const s = String(r.score);
        text(s, 176 - F.width(s), y, c);
      });
    }
    button(30, 119, 80, 12, L('Rigioca', 'Play again'), () => go(Intro, gm));
    button(130, 119, 80, 12, L('Menu', 'Menu'), () => go(Menu), C.pan, C.ink);
  },
  key(k) { if (k == 'Enter' && this.saved >= 0) go(Menu); }
};

/* =================== MINIGIOCO 1: PERDITA D'ACQUA =================== */
const FLOOR = 124;
const LEAK_PTS = [[24, 40], [24, 84], [72, 14], [118, 30], [118, 76], [164, 50]];

function drawRoom() {
  g.rect('#e9dcb8', 0, 0, W, FLOOR);
  for (let x = 0; x < W; x += 8) g.rect('#e0d0a8', x, 0, 3, FLOOR);
  // finestra con vista sulle montagne
  g.rect('#f4f1e8', 44, 30, 52, 44); g.rect('#a9cbe0', 47, 33, 46, 38);
  for (let x = 47; x < 93; x++) g.rect('#5d7a6a', x, 52 + Math.round(5 * Math.sin(x / 7)), 1, 19);
  g.rect('#f4f1e8', 69, 33, 2, 38); g.rect('#f4f1e8', 47, 51, 46, 2);
  g.rect('#b5332e', 38, 26, 8, 52); g.rect('#b5332e', 94, 26, 8, 52); g.rect('#8a2622', 36, 25, 68, 3);
  // quadro
  g.rect('#7a5230', 134, 38, 22, 16); g.rect('#6f9fd0', 136, 40, 18, 12); g.rect('#e0b24f', 140, 44, 8, 6);
  // divano
  g.rect('#4a2a3e', 30, 98, 52, 4); g.rect('#6a3a5a', 32, 100, 48, 20); g.rect('#7e4a6c', 34, 102, 21, 9); g.rect('#7e4a6c', 57, 102, 21, 9);
  g.rect('#5a3050', 28, 104, 6, 18); g.rect('#5a3050', 78, 104, 6, 18);
  // tavolino e lampada
  g.rect('#7a5230', 126, 104, 26, 3); g.rect('#5a3a22', 128, 107, 2, 17); g.rect('#5a3a22', 148, 107, 2, 17);
  g.rect('#f5c518', 134, 92, 10, 7); g.rect('#5a3a22', 138, 99, 2, 5);
  // battiscopa e pavimento
  g.rect('#9a7a52', 0, FLOOR - 4, W, 4);
  g.rect('#8a6440', 0, FLOOR, W, H - FLOOR);
  for (let y = FLOOR + 3; y < H; y += 4) for (let x = (y * 7) % 30; x < W; x += 30) g.rect('#6e4e30', x, y, 18, 1);
  // tubi
  g.rect('#8a9098', 0, 12, W, 4); g.rect('#b8bec6', 0, 12, W, 1);
  [24, 118, 164].forEach(x => { g.rect('#8a9098', x - 2, 14, 4, FLOOR - 18); g.rect('#b8bec6', x - 2, 14, 1, FLOOR - 18); });
}

function makeLeak() {
  const admin = store.get('admin', 0), HEAD = FLOOR - 100 + 4;
  const m = { t: 0, score: 0, closed: 0, level: 0, next: 1, drops: [], fx: [], over: false, reason: '',
    leaks: LEAK_PTS.map(([x, y]) => ({ x, y, on: false })) };
  m.update = dt => {
    m.fx.forEach(f => f.t += dt); m.fx = m.fx.filter(f => f.t < .8);
    if (m.over) return;
    m.t += dt;
    const on = m.leaks.filter(l => l.on), maxOn = Math.min(6, 3 + (m.t / 15 | 0));
    if ((m.next -= dt) <= 0) {
      const off = m.leaks.filter(l => !l.on);
      if (off.length && on.length < maxOn) pick(off).on = true;
      m.next = Math.max(.6, 2.2 - m.t * .025) * rnd(.7, 1.3);
    }
    on.forEach(l => { if (Math.random() < dt * 30) m.drops.push({ x: l.x + rnd(-2, 2), y: l.y + 2, vx: rnd(-16, 16), vy: rnd(-8, 8) }); });
    m.level = Math.max(0, m.level + (on.length * 1.5 - .6) * dt);
    const wy = FLOOR - m.level;
    m.drops.forEach(d => { d.vy += 170 * dt; d.x += d.vx * dt; d.y += d.vy * dt; });
    m.drops = m.drops.filter(d => d.y < wy && d.y < FLOOR);
    m.score = m.closed * 10 + (m.t | 0);
    if (wy <= HEAD) { m.over = true; m.reason = L('Sommerso!', 'Flooded!'); }
  };
  m.click = (x, y) => {
    let best = null, bd = 12;
    m.leaks.forEach(l => { const d = Math.hypot(x - l.x, y - l.y); if (l.on && d < bd) { bd = d; best = l; } });
    if (best) { best.on = false; m.closed++; m.fx.push({ x: best.x, y: best.y - 6, t: 0 }); }
  };
  m.draw = () => {
    drawRoom();
    m.leaks.forEach(l => {
      const hot = l.on && (m.t * 6 | 0) % 2;
      g.rect(l.on ? (hot ? C.r : '#ff8a00') : '#5a6068', l.x - 4, l.y - 4, 9, 9);
      g.rect('#8a9098', l.x - 3, l.y - 3, 7, 7); g.rect('#3a3e44', l.x - 1, l.y - 1, 3, 3);
    });
    AD.drawAdmin(g, admin, 205, FLOOR);
    m.drops.forEach(d => g.rect('#4fa8ff', d.x, d.y, 1, 2));
    const wy = FLOOR - m.level;
    if (m.level > 0) {
      g.rect('#2f7fd0a8', 0, wy, W, H - wy);
      for (let x = 0; x < W; x += 2) g.rect('#9fd4ff', x, wy + Math.round(Math.sin(x / 6 + m.t * 4)), 2, 1);
    }
    m.fx.forEach(f => text('+10', f.x - 7, f.y - f.t * 14, C.g));
    // barra in alto
    g.rect('#0d0f24d0', 0, 0, W, 10);
    text(L('Punti ', 'Score ') + m.score, 3, 3, C.ink);
    text(L('Chiuse ', 'Fixed ') + m.closed, 70, 3, C.dim);
    const pct = Math.min(100, Math.round(m.level / (FLOOR - HEAD) * 100));
    text(L('Acqua', 'Water'), 136, 3, C.b);
    g.rect('#000000', 160, 3, 60, 5); g.rect(pct > 70 ? C.r : C.b, 160, 3, 60 * pct / 100, 5);
    text((m.t | 0) + 's', 224, 3, C.dim);
  };
  return m;
}

function iconDrop(cx, cy) {
  ell('#1a1420', cx, cy + 3, 9, 9); ell('#4fa8ff', cx, cy + 3, 8, 8);
  for (let k = 0; k < 9; k++) g.rect(k < 8 ? '#4fa8ff' : '#1a1420', cx - (k >> 1), cy - 12 + k, (k >> 1) * 2 + 1, 1);
  g.rect('#c8e8ff', cx - 4, cy + 1, 2, 4);
}

/* =================== MINIGIOCO 2: RACCOLTA FUNGHI =================== */
function drawForest() {
  g.rect('#9ec6e6', 0, 0, W, 60);
  for (let x = 0; x < W; x++) g.rect('#6f8a80', x, 26 + Math.round(9 * Math.sin(x / 31) + 4 * Math.sin(x / 11)), 1, 40);
  for (let i = 0; i < 26; i++) {
    const x = (i * 47) % W, h = 18 + (i * 7) % 12, y = 60 - h;
    for (let k = 0; k < h; k++) g.rect(i & 1 ? '#2c4a33' : '#365a3d', x - (k >> 2), y + k, (k >> 2) * 2 + 1, 1);
  }
  g.rect('#5a8a3a', 0, 58, W, H - 58);
  for (let i = 0; i < 70; i++) g.rect(i % 3 ? '#4c7a30' : '#6e9e46', (i * 53) % W, 60 + (i * 29) % 75, 3 + i % 5, 1);
  for (let i = 0; i < 12; i++) { const x = (i * 71) % W, y = 64 + (i * 37) % 68; g.rect('#7aaa4a', x, y - 2, 1, 2); g.rect('#7aaa4a', x + 2, y - 3, 1, 3); g.rect('#7aaa4a', x + 4, y - 2, 1, 2); }
  // abeti grandi ai lati
  [[6, 30], [232, 24]].forEach(([x, y]) => {
    for (let k = 0; k < 40; k++) g.rect('#24402b', x - (k >> 1), y + k, (k >> 1) * 2 + 1, 1);
    g.rect('#5a3a22', x - 2, y + 40, 5, 8);
  });
}

const MUSH = { p: { pts: 10 }, f: { pts: 5 }, r: { pts: 0 } };
function drawMush(type, x, y, k = 1) {
  const O = '#2a1a10';
  if (type == 'f') {        // finferlo: giallo, a imbuto
    g.rect(O, x - 2, y - 6 * k, 4, 6 * k + 1); g.rect('#f0c040', x - 1, y - 6 * k, 2, 6 * k);
    for (let j = 0; j < 6; j++) {
      const w = Math.round((5 + j * 1.6) * k), yy = Math.round(y - 5 * k - j * k);
      g.rect(O, x - (w >> 1) - 1, yy, w + 2, 1);
      g.rect(j == 5 ? '#c8901a' : '#f2b81c', x - (w >> 1), yy, w, 1);
    }
    g.rect('#ffd860', x - 3 * k, y - 10 * k, 3 * k, 1);
    return;
  }
  // porcino e fungo rosso: gambo + cappello rotondo
  ell(O, x, y - 3 * k, 3 * k + 1, 3 * k + 1); ell(type == 'p' ? '#efe2c4' : '#f4f4f4', x, y - 3 * k, 3 * k, 3 * k);
  ell(O, x, y - 8 * k, 7 * k + 1, 4 * k + 1); ell(type == 'p' ? '#7a4a24' : '#d8282c', x, y - 8 * k, 7 * k, 4 * k);
  if (type == 'p') g.rect('#a06a3a', x - 4 * k, y - 10 * k, 4 * k, 1);
  else [[-4, -9], [1, -11], [3, -7], [-1, -7]].forEach(([dx, dy]) => g.rect('#ffffff', x + dx * k, y + dy * k, Math.max(1, k), Math.max(1, k)));
}

function makeMush() {
  const m = { t: 0, dur: 45, score: 0, basket: { p: 0, f: 0 }, list: [], fx: [], next: .5, shake: 0, over: false, reason: '' };
  function spawn() {
    for (let n = 0; n < 12; n++) {
      const x = rnd(14, 226), y = rnd(70, 128);
      if (m.list.some(s => Math.hypot(s.x - x, s.y - y) < 18)) continue;
      const r = Math.random();
      m.list.push({ x, y, type: r < .16 ? 'r' : r < .56 ? 'f' : 'p', age: 0, life: rnd(1.3, 2.3) * Math.max(.6, 1 - m.t / 90) });
      return;
    }
  }
  m.update = dt => {
    m.fx.forEach(f => f.t += dt); m.fx = m.fx.filter(f => f.t < .9);
    m.shake = Math.max(0, m.shake - dt);
    if (m.over) return;
    m.t += dt;
    if ((m.next -= dt) <= 0) { spawn(); m.next = Math.max(.3, .85 - m.t * .01) * rnd(.6, 1.3); }
    m.list.forEach(s => s.age += dt);
    m.list = m.list.filter(s => s.age < s.life);
    if (m.t >= m.dur) { m.over = true; m.reason = L('Tempo scaduto!', "Time's up!"); }
  };
  m.click = (x, y) => {
    for (let i = m.list.length - 1; i >= 0; i--) {
      const s = m.list[i];
      if (x < s.x - 9 || x > s.x + 9 || y < s.y - 14 || y > s.y + 2) continue;
      m.list.splice(i, 1);
      if (s.type == 'r') {
        m.basket = { p: 0, f: 0 }; m.score = 0; m.shake = .4;
        m.fx.push({ x: s.x, y: s.y - 16, t: 0, s: L('Velenoso!', 'Poisonous!'), c: C.r });
      } else {
        m.basket[s.type]++; m.score += MUSH[s.type].pts;
        m.fx.push({ x: s.x, y: s.y - 16, t: 0, s: '+' + MUSH[s.type].pts, c: C.g });
      }
      return;
    }
  };
  m.draw = () => {
    ctx.save();
    if (m.shake) ctx.translate(Math.round(rnd(-2, 2)), 0);
    drawForest();
    [...m.list].sort((a, b) => a.y - b.y).forEach(s => {
      const k = Math.min(1, s.age / .15);
      if (s.life - s.age < .4 && (s.age * 12 | 0) % 2) return;  // lampeggia prima di sparire
      ell('#00000040', s.x, s.y + 1, 6 * k, 2 * k);
      drawMush(s.type, s.x, s.y, k);
    });
    m.fx.forEach(f => text(f.s, f.x - F.width(f.s) / 2, f.y - f.t * 14, f.c));
    ctx.restore();
    g.rect('#0d0f24d0', 0, 0, W, 10);
    text(L('Punti ', 'Score ') + m.score, 3, 3, C.ink);
    drawMush('p', 92, 9, .6); text(String(m.basket.p), 98, 3, C.ink);
    drawMush('f', 122, 9, .6); text(String(m.basket.f), 128, 3, C.ink);
    const left = Math.max(0, Math.ceil(m.dur - m.t));
    text(left + 's', 224 - F.width(left + 's') + 12, 3, left <= 10 ? C.r : C.dim);
  };
  return m;
}

/* =================== ELENCO MINIGIOCHI =================== */
const GAMES = [
  { id: 'leak',
    title: () => L("Perdita d'acqua", 'Water leak'),
    ring: () => L('Driiin!', 'Riiing!'),
    intro: () => L("La signora del secondo piano e' al telefono: 'Amministratore, piove in salotto!'. I tubi perdono da tutte le parti e l'acqua sale. Clicca sulle perdite rosse per chiuderle, prima che l'acqua ti arrivi sopra la testa!",
      "The lady on the second floor is on the phone: 'Administrator, it's raining in my living room!'. The pipes are leaking everywhere and the water is rising. Click the red leaks to shut them before the water goes over your head!"),
    tip: () => L('Clicca sulle perdite che lampeggiano', 'Click the flashing leaks'),
    drawBg: drawRoom, create: makeLeak, icon: iconDrop },
  { id: 'mush',
    title: () => L('Raccolta funghi', 'Mushroom hunt'),
    ring: () => L('Che bel sole!', 'What a sunny day!'),
    intro: () => L("Il condominio organizza la polentata e mancano i funghi! Corri nel bosco della Val di Rabbi e raccogli porcini (marroni, 10 punti) e finferli (gialli, 5 punti). Attento ai funghi rossi: sono velenosi e ti svuotano il cestino!",
      "The building is having a polenta party and there are no mushrooms! Run to the Val di Rabbi woods and pick porcini (brown, 10 points) and chanterelles (yellow, 5 points). Watch out for the red ones: they are poisonous and empty your basket!"),
    tip: () => L('45 secondi: clicca sui funghi buoni', '45 seconds: click the good mushrooms'),
    drawBg: drawForest, create: makeMush,
    icon: (cx, cy) => { drawMush('p', cx - 12, cy + 8, 1.4); drawMush('f', cx + 2, cy + 8, 1.3); drawMush('r', cx + 16, cy + 8, 1.1); } }
];

/* --- avvio --- */
setLang(lang);
go(Title);
let last = performance.now();
function frame(t) {
  const dt = Math.min(.05, (t - last) / 1000);
  last = t;
  scene.update && scene.update(dt);
  btns = [];
  scene.draw();
  requestAnimationFrame(frame);
}
requestAnimationFrame(frame);
})();
