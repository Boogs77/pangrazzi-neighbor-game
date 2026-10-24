/* Pangrazzi: The Neighbor Game — titolo, scelta amministratore, menu e minigiochi.
   Schermo logico 240x135; tutto è disegnato a rettangoli (g.rect) come gli sprite. */
(() => {
'use strict';
const W = 240, H = 135;
const cv = document.getElementById('c');
// ?lo=1 nell'indirizzo: canvas a bassa risoluzione (prova per i telefoni che non disegnano quello grande)
if (/[?&]lo=1/.test(location.search)) { cv.width = W; cv.height = H; }
const ctx = cv.getContext('2d');
const S = cv.width / W;   // pixel reali per pixel di gioco (canvas 1200x675 => 5)
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

const pos = e => { const r = cv.getBoundingClientRect(); return [(e.clientX - r.left) * W / r.width, (e.clientY - r.top) * H / r.height]; };
cv.addEventListener('pointerdown', e => {
  e.preventDefault();   // sul telefono: niente zoom, scorrimento o clic doppio simulato
  const [x, y] = pos(e);
  for (let i = btns.length - 1; i >= 0; i--) {
    const b = btns[i];
    if (x >= b.x && x < b.x + b.w && y >= b.y && y < b.y + b.h) { b.fn(); return; }
  }
  scene.click && scene.click(x, y);
});
// trascinamento (tasto premuto o dito sullo schermo), usato per sventolare: va solo a scene.drag,
// mai a funzioni con altri nomi (es. Choose.move), perché il dito si muove anche durante un semplice tocco
cv.addEventListener('pointermove', e => {
  if (e.pointerType == 'mouse' && !(e.buttons & 1)) { scene.hover && scene.hover(...pos(e)); return; }   // mouse senza tasto: solo hover
  e.preventDefault();
  scene.drag && scene.drag(...pos(e));
});
// browser senza pointer events (vecchi telefoni): stessi comandi con il tocco
if (!window.PointerEvent) {
  const t = e => e.changedTouches[0];
  cv.addEventListener('touchstart', e => { e.preventDefault(); cv.dispatchEvent(Object.assign(new Event('pointerdown'), { clientX: t(e).clientX, clientY: t(e).clientY })); }, { passive: false });
  cv.addEventListener('touchmove', e => { e.preventDefault(); scene.drag && scene.drag(...pos(t(e))); }, { passive: false });
}
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
bg.src = 'reference/edificio.png?v=202610241812';

/* --- testi inglesi degli amministratori (gli italiani sono in admins-art.js) --- */
const ADMIN_EN = [
  { name: 'Accountant', desc: 'Thirty years of residents meetings. Knows every clause of the rules and never gets a sum wrong.', bonus: 'Bills and sums are easier', malus: 'Slow at repairs' },
  { name: 'Young Gun', desc: 'Just graduated, runs the building from his smartphone. Lots of energy, little experience.', bonus: 'More time for every problem', malus: 'Mood drops faster' },
  { name: 'The Lawyer', desc: 'Elegant and firm: no quarrel between neighbours can resist her, and meetings end on time.', bonus: 'Quarrels and meetings are easier', malus: 'Hates getting her hands dirty' },
  { name: 'Mountain Man', desc: 'Grew up in Val di Rabbi, fixes everything with his bare hands and a bit of wire.', bonus: 'Repairs are easier', malus: 'Hates paperwork' },
  { name: 'Granny', desc: 'Has known everyone forever and brings a cake to every floor. Impossible to be angry with her.', bonus: 'Mood rises more', malus: 'Moves slowly: less time' }
];
const adminText = i => lang == 'en' ? ADMIN_EN[i] : AD.ADMINS[i];
// amministratore salvato, sempre un numero valido 0..4
const adminIndex = () => { const i = Number(store.get('admin', 0)); return i >= 0 && i < 5 ? i | 0 : 0; };

/* =================== TITOLO =================== */
const Title = {
  draw() {
    g.rect(C.bg, 0, 0, W, H);
    center('Pangrazzi', 3, C.y, 3);
    center('The Neighbor Game', 20, C.ink);
    // il condominio intero e fermo, a tutta larghezza: stessa immagine (nitida) dell'arcade
    g.rect(C.y, 0, 26, W, 1);
    drawFacadeImage(27);
    g.rect(C.y, 0, 116, W, 1);
    F.wrap(L("Sei l'amministratore del Condominio Pangrazzi e devi puntare alla felicita di tutti i condomini.",
      'You are the administrator of the Pangrazzi condominium, and your goal is the happiness of every resident.'), 56)
      .forEach((l, i) => center(l, 119 + i * 7));
    button(192, 5, 44, 13, L('Gioca', 'Play'), () => go(Choose));
    button(3, 3, 17, 9, 'IT', () => setLang('it'), lang == 'it' ? C.y : C.dim);
    button(23, 3, 17, 9, 'EN', () => setLang('en'), lang == 'en' ? C.y : C.dim);
  },
  key(k) { if (k == 'Enter' || k == ' ') go(Choose); }
};

/* =================== SCELTA AMMINISTRATORE =================== */
const Choose = {
  enter() { this.i = adminIndex(); },
  move(d) { this.i = (this.i + d + 5) % 5; },
  pick() { store.set('admin', this.i); go(Mode); },
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
    text(L('Amministratore: ', 'Administrator: ') + adminText(adminIndex()).name, 6, 16, C.dim);
    // schede 2 per riga
    // elenco compatto a due colonne (fino a 14 minigiochi): tutta la riga è cliccabile
    GAMES.forEach((gm, k) => {
      const x = 6 + (k % 2) * 116, y = 24 + (k >> 1) * 13, w = 112, h = 12;
      g.rect(C.panD, x, y, w, h); g.rect(C.pan, x, y + h - 1, w, 1);
      miniIcon(gm.id, x + 7, y + 6);
      text(gm.title(), x + 15, y + 1, C.y);
      const best = records(gm.id)[0];
      text(best ? best.name.slice(0, 6) + ' ' + best.score : '-', x + 15, y + 7, C.dim);
      btns.push({ x, y, w, h, fn: () => go(Intro, gm) });
    });
    const more = 13 - GAMES.length, ms = L('+' + more + ' in arrivo', '+' + more + ' coming');
    text(ms, 234 - F.width(ms), 16, C.dim);
    button(8, 119, 112, 12, L('Cambia amministratore', 'Change administrator'), () => go(Choose), C.pan, C.ink);
    button(180, 119, 52, 12, L('Indietro', 'Back'), () => go(Mode), C.pan, C.ink);
  },
  key(k) { if (k == 'Escape') go(Mode); }
};

/* =================== MODALITÀ: ARCADE O MINIGIOCHI =================== */
const Mode = {
  draw() {
    g.rect(C.bg, 0, 0, W, H);
    center(L('Come vuoi giocare?', 'How do you want to play?'), 4, C.y);
    g.rect(C.y, 0, 12, W, 1);
    text(L('Amministratore: ', 'Administrator: ') + adminText(adminIndex()).name, 6, 16, C.dim);
    const cards = [
      { t: 'Arcade', d: L('Turni sempre piu difficili: clicca sugli appartamenti che chiedono aiuto e fai felici i condomini.',
          'Harder and harder turns: click the flats that call for help and keep the residents happy.'),
        rec: records('arcade')[0], fn: () => go(Arcade, true) },
      { t: L('Minigiochi', 'Minigames'), d: L('Scegli un minigioco e allenati quanto vuoi.', 'Pick a minigame and practise as much as you like.'),
        rec: null, fn: () => go(Menu) }
    ];
    cards.forEach((c, k) => {
      const x = 8 + k * 116, y = 26, w = 108, h = 88;
      panel(x, y, w, h);
      center(c.t, y + 4, C.y, 2, x, w);
      para(c.d, x + 4, y + 20, 26);
      if (k == 0) center(c.rec ? L('Record: ', 'Best: ') + c.rec.name + ' ' + c.rec.score : L('Nessun record', 'No record yet'), y + 63, C.dim, 1, x, w);
      button(x + 24, y + 73, 60, 11, L('Gioca', 'Play'), c.fn);
    });
    button(8, 120, 112, 12, L('Cambia amministratore', 'Change administrator'), () => go(Choose), C.pan, C.ink);
    button(180, 120, 52, 12, L('Titolo', 'Title'), () => go(Title), C.pan, C.ink);
  },
  key(k) { if (k == 'Escape') go(Title); }
};

/* =================== ARCADE: IL CONDOMINIO E I SUOI PROBLEMI =================== */
// ogni turno aggiunge 2 minigiochi; per ora esiste solo il primo
const TURNS = [
  { games: ['leak', 'mush'], dur: 75, every: [6, 10], max: 2, deadline: 25 },
  { games: ['leak', 'mush', 'mouse', 'smoke'], dur: 90, every: [5, 8], max: 3, deadline: 22 },
  { games: ['leak', 'mush', 'mouse', 'smoke', 'gas', 'snow'], dur: 100, every: [4, 7], max: 3, deadline: 20 },
  { games: ['leak', 'mush', 'mouse', 'smoke', 'gas', 'snow', 'ice', 'wood'], dur: 110, every: [4, 6], max: 3, deadline: 20 }
];
const FY = 14;                                       // la facciata parte sotto la barra in alto
const fs_ = () => W / FACADE.w;                      // scala facciata -> schermo
let run = null;

function unitBox(u) {
  const s = fs_(), x0 = Math.min(...u.boxes.map(b => b[0])), y0 = Math.min(...u.boxes.map(b => b[1]));
  const x1 = Math.max(...u.boxes.map(b => b[0] + b[2])), y1 = Math.max(...u.boxes.map(b => b[1] + b[3]));
  return [x0 * s, FY + y0 * s, (x1 - x0) * s, (y1 - y0) * s];
}
function drawFacadeImage(y) {
  if (bg.complete && bg.naturalWidth) ctx.drawImage(bg, 0, y, W, FACADE.h * fs_());
}
function drawFacade() {
  g.rect(C.bg, 0, 0, W, H);
  drawFacadeImage(FY);
}
function miniIcon(id, x, y) {
  if (id == 'leak') { ell('#1a1420', x, y + 1, 3, 3); ell('#4fa8ff', x, y + 1, 2, 2); g.rect('#4fa8ff', x, y - 3, 1, 2); }
  else if (id == 'mush') drawMush('p', x, y + 3, .4);
  else if (id == 'mouse') drawMouse(x - 1, y + 3, .5);
  else if (id == 'gas') drawBombola(x, y + 4, true);
  else if (id == 'ice') { g.rect('#bfe4ff', x - 4, y + 1, 9, 2); g.rect('#ffffff', x - 2, y + 1, 2, 1); g.rect('#d04040', x - 1, y - 4, 4, 4); }
  else if (id == 'wood') { g.rect('#3e2716', x - 4, y - 1, 9, 4); g.rect('#8a5a2e', x - 3, y, 7, 2); g.rect('#d8b080', x - 4, y, 2, 2); }
  else if (id == 'snow') { g.rect('#ffffff', x - 3, y, 7, 1); g.rect('#ffffff', x, y - 3, 1, 7); g.rect('#c8d4e4', x - 2, y - 2, 1, 1); g.rect('#c8d4e4', x + 2, y + 2, 1, 1); }
  else { ell('#6a6a74', x, y, 4, 2); ell('#c8c8d0', x - 1, y - 1, 3, 2); ell('#e8e8ee', x + 1, y - 1, 2, 1); }
}
const GAME = id => GAMES.find(gm => gm.id == id);
const ARCADE = { id: 'arcade', title: () => 'Arcade', drawBg: drawFacade, restart: () => go(Arcade, true), back: () => go(Mode) };

const Arcade = {
  enter(fresh) {
    if (fresh || !run) run = { turn: 0, t: 0, score: 0, happy: 60, problems: [], next: 2, fx: [] };
  },
  cfg() { return TURNS[run.turn]; },
  update(dt) {
    const cfg = this.cfg();
    run.t += dt;
    run.fx.forEach(f => f.t += dt); run.fx = run.fx.filter(f => f.t < 1.5);
    run.problems.forEach(p => p.left -= dt);
    run.problems.filter(p => p.left <= 0).forEach(p => {
      run.happy = Math.max(0, run.happy - 15);
      const [x, y, w] = unitBox(FACADE.units.find(u => u.n == p.n));
      run.fx.push({ x: x + w / 2, y, t: 0, s: L('Arrabbiato!', 'Angry!') });
    });
    run.problems = run.problems.filter(p => p.left > 0);
    if ((run.next -= dt) <= 0 && run.t < cfg.dur - 8) {
      const busy = run.problems.map(p => p.n), free = FACADE.units.filter(u => u.kind == 'apt' && !busy.includes(u.n));
      if (run.problems.length < cfg.max && free.length)
        run.problems.push({ n: pick(free).n, game: pick(cfg.games), left: cfg.deadline, total: cfg.deadline });
      run.next = rnd(...cfg.every);
    }
    if (run.happy <= 0) go(TurnEnd, true);
    else if (run.t >= cfg.dur) go(TurnEnd, false);
  },
  draw() {
    drawFacade();
    const blink = (run.t * 4 | 0) % 2;
    run.problems.forEach(p => {
      const u = FACADE.units.find(v => v.n == p.n), s = fs_();
      u.boxes.forEach(b => g.rect(blink ? '#ff8a00b0' : '#fff7d6a0', b[0] * s, FY + b[1] * s, b[2] * s, b[3] * s));
      const [x, y, w, h] = unitBox(u), f = p.left / p.total;
      g.rect('#000000', x, y + h + 1, w, 2); g.rect(f > .4 ? C.g : C.r, x, y + h + 1, w * f, 2);
      g.rect(C.ink, x + w / 2 - 5, y - 9, 11, 9); g.rect(C.panD, x + w / 2 - 4, y - 8, 9, 7);
      miniIcon(p.game, x + w / 2, y - 5);
    });
    run.fx.forEach(f => text(f.s, f.x - F.width(f.s) / 2, f.y - 10 - f.t * 8, C.r));
    // barra in alto: turno, tempo, punti, felicità
    const cfg = this.cfg();
    g.rect(C.bg, 0, 0, W, FY - 1);
    text(L('Turno ', 'Turn ') + (run.turn + 1), 3, 3, C.y);
    text(Math.max(0, Math.ceil(cfg.dur - run.t)) + 's', 44, 3, C.dim);
    text(L('Punti ', 'Score ') + run.score, 68, 3, C.ink);
    text(L('Felicita', 'Happiness'), 140, 3, C.ink);
    g.rect('#000000', 182, 3, 54, 5);
    g.rect(run.happy > 50 ? C.g : run.happy > 25 ? C.y : C.r, 182, 3, 54 * run.happy / 100, 5);
    // elenco problemi in basso
    const by = FY + Math.round(FACADE.h * fs_()) + 2;
    panel(4, by, 232, H - by - 2);
    if (!run.problems.length) center(L('Tutto tranquillo... per ora.', 'All quiet... for now.'), by + 4, C.dim);
    else {
      center(L("Clicca sull'appartamento che lampeggia", 'Click the flashing flat'), by + 3, C.y);
      run.problems.slice(0, 2).forEach((p, k) => {
        miniIcon(p.game, 10, by + 13 + k * 7);
        text(L('Int. ', 'Flat ') + p.n + ' - ' + GAME(p.game).title() + '  ' + Math.ceil(p.left) + 's', 16, by + 11 + k * 7, C.ink);
      });
    }
  },
  click(x, y) {
    const s = fs_(), lx = x / s, ly = (y - FY) / s, pad = 2 / s;
    const p = run.problems.find(p => FACADE.units.find(u => u.n == p.n).boxes
      .some(b => lx >= b[0] - pad && lx <= b[0] + b[2] + pad && ly >= b[1] - pad && ly <= b[1] + b[3] + pad));
    if (p) go(Intro, GAME(p.game), { p });
  },
  key(k) { if (k == 'Escape') go(Mode); }
};

/* risultato di un intervento in modalità arcade */
const ArcadeResult = {
  enter(gm, m, actx) {
    this.gm = gm; this.m = m; this.d = m.success ? 10 : -10;
    run.score += m.score;
    run.happy = Math.max(0, Math.min(100, run.happy + this.d));
    run.problems = run.problems.filter(p => p !== actx.p);
  },
  draw() {
    this.gm.drawBg();
    g.rect('#0d0f24c8', 0, 0, W, H);
    panel(40, 20, 160, 80);
    center(this.m.success ? L('Risolto!', 'Solved!') : L('Non risolto...', 'Not solved...'), 26, this.m.success ? C.g : C.r, 2);
    center('+' + this.m.score + L(' punti', ' points'), 46, C.ink);
    center(L('Felicita ', 'Happiness ') + (this.d > 0 ? '+' : '') + this.d, 56, this.d > 0 ? C.g : C.r);
    center(L('Totale: ', 'Total: ') + run.score, 70, C.y);
    button(85, 84, 70, 12, L('Continua', 'Continue'), () => go(Arcade));
  },
  key(k) { if (k == 'Enter' || k == ' ') go(Arcade); }
};

/* fine turno: per ora c'è solo il turno 1, poi si salva il record */
const TurnEnd = {
  enter(evicted) {
    this.evicted = evicted;
    run.happy = Math.max(0, run.happy - 10 * run.problems.length);  // problemi lasciati aperti
    run.problems = [];
    this.bonus = evicted ? 0 : run.happy * 3;
    this.games = run.score;
    run.score += this.bonus;
  },
  draw() {
    drawFacade();
    g.rect('#0d0f24c8', 0, 0, W, H);
    panel(30, 10, 180, 100);
    center(this.evicted ? L('Sfrattato!', 'Evicted!') : L('Fine turno ', 'End of turn ') + (run.turn + 1), 16, this.evicted ? C.r : C.y, 2);
    if (this.evicted) para(L('I condomini sono troppo arrabbiati: l\'assemblea ti ha mandato via.', 'The residents are too angry: the meeting has sent you away.'), 40, 34, 40);
    else {
      text(L('Minigiochi', 'Minigames'), 44, 36); text(String(this.games), 196 - F.width(String(this.games)), 36);
      text(L('Bonus felicita', 'Happiness bonus'), 44, 46); text(String(this.bonus), 196 - F.width(String(this.bonus)), 46, C.g);
      g.rect(C.dim, 44, 55, 152, 1);
      text(L('Totale', 'Total'), 44, 59, C.y); text(String(run.score), 196 - F.width(String(run.score)), 59, C.y);
      const nx = TURNS[run.turn + 1];
      para(nx ? L('Prossimo turno: ' + nx.games.length + ' minigiochi, problemi piu frequenti.', 'Next turn: ' + nx.games.length + ' minigames, more frequent problems.')
        : L('I turni successivi arriveranno presto!', 'More turns are coming soon!'), 44, 76, 38, C.dim);
    }
    button(85, 116, 70, 12, L('Continua', 'Continue'), () => this.next());
  },
  // turno successivo se esiste, altrimenti fine partita con record
  next() {
    if (!this.evicted && TURNS[run.turn + 1]) {
      Object.assign(run, { turn: run.turn + 1, t: 0, problems: [], next: 2, fx: [] });
      go(Arcade);
    } else go(End, ARCADE, run.score);
  },
  key(k) { if (k == 'Enter' || k == ' ') this.next(); }
};

/* =================== SPIEGAZIONE PRIMA DEL GIOCO =================== */
// actx (solo in arcade) = { p: problema dell'appartamento cliccato }
const Intro = {
  enter(gm, actx) { this.gm = gm; this.actx = actx; this.t = 0; },
  update(dt) { this.t += dt; },
  back() { this.actx ? go(Arcade) : go(Menu); },
  draw() {
    const gm = this.gm, a = this.actx;
    gm.drawBg();
    g.rect('#0d0f24c8', 0, 0, W, H);
    panel(14, 6, 212, 106);
    const shake = (this.t * 8 | 0) % 2 && this.t % 2 < .6 ? 1 : 0;
    center(gm.ring(), 11 + shake, C.r, 2);
    center(gm.title() + (a ? ' - ' + L('Interno ', 'Flat ') + a.p.n : ''), 26, C.y);
    para(gm.intro(), 20, 37, 50);
    center(gm.tip(!!a), 104, C.b);
    button(20, 119, 70, 12, L('Indietro', 'Back'), () => this.back(), C.pan, C.ink);
    button(150, 119, 70, 12, L('Via!', 'Go!'), () => go(Play, gm, a));
  },
  key(k) { if (k == 'Enter' || k == ' ') go(Play, this.gm, this.actx); else if (k == 'Escape') this.back(); }
};

/* =================== PARTITA =================== */
const Play = {
  enter(gm, actx) {
    this.gm = gm; this.actx = actx; this.m = gm.create({ arcade: !!actx }); this.endT = 0;
    if (/[?&]debug/.test(location.search)) window.__m = this.m;   // ?debug: stato del minigioco leggibile dalla console
  },
  update(dt) {
    this.m.update(dt);
    if (this.m.over && (this.endT += dt) > 1.6)
      this.actx ? go(ArcadeResult, this.gm, this.m, this.actx) : go(End, this.gm, this.m.score);
  },
  draw() {
    this.m.draw();
    if (this.m.over) { g.rect('#0d0f24c0', 0, 54, W, 24); center(this.m.reason, 60, C.y, 2); }
  },
  click(x, y) { if (!this.m.over) this.m.click(x, y); },
  drag(x, y) { if (!this.m.over && this.m.drag) this.m.drag(x, y); if (!this.m.over && this.m.hover) this.m.hover(x, y); },
  hover(x, y) { if (!this.m.over && this.m.hover) this.m.hover(x, y); },
  key(k) { if (k == 'Escape') this.actx ? go(Arcade) : go(Menu); }
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
    const n = (nameInput.value.trim() || 'BOOGS').toUpperCase().slice(0, 10);   // nome vuoto: BOOGS
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
    button(30, 119, 80, 12, L('Rigioca', 'Play again'), () => gm.restart ? gm.restart() : go(Intro, gm));
    button(130, 119, 80, 12, L('Menu', 'Menu'), () => gm.back ? gm.back() : go(Menu), C.pan, C.ink);
  },
  key(k) { if (k == 'Enter' && this.saved >= 0) this.gm.back ? this.gm.back() : go(Menu); }
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

function makeLeak(opts = {}) {
  const admin = adminIndex(), HEAD = FLOOR - 100 + 4;
  const m = { t: 0, dur: opts.arcade ? 30 : 45, success: false, score: 0, closed: 0, level: 0, next: 1, drops: [], fx: [], over: false, reason: '',
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
    else if (m.t >= m.dur) { m.over = true; m.success = true; m.reason = L('Riparato!', 'Fixed!'); }
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
    const tt = (isFinite(m.dur) ? Math.max(0, Math.ceil(m.dur - m.t)) : m.t | 0) + 's';
    text(tt, 236 - F.width(tt), 3, C.dim);
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

function makeMush(opts = {}) {
  const m = { t: 0, dur: opts.arcade ? 25 : 45, success: false, score: 0, basket: { p: 0, f: 0 }, list: [], fx: [], next: .5, shake: 0, over: false, reason: '' };
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
    if (m.t >= m.dur) {
      m.over = true; m.success = m.score >= 30;
      m.reason = opts.arcade && m.success ? L('Cestino pieno!', 'Full basket!') : L('Tempo scaduto!', "Time's up!");
    }
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

/* =================== MINIGIOCO 3: CACCIA AI TOPI =================== */
function drawKitchen() {
  g.rect('#dfe8e4', 0, 0, W, FLOOR);
  for (let y = 0; y < 72; y += 8) {
    g.rect('#c9d6d0', 0, y, W, 1);
    for (let x = (y / 8 & 1) * 6; x < W; x += 12) g.rect('#c9d6d0', x, y, 1, 8);
  }
  // pensili
  g.rect('#a8784a', 10, 14, 96, 26);
  for (let x = 10; x < 106; x += 32) { g.rect('#8a5e36', x, 14, 1, 26); g.rect('#e0d0a8', x + 27, 25, 2, 4); }
  // finestra
  g.rect('#f4f1e8', 120, 14, 50, 36); g.rect('#a9cbe0', 123, 17, 44, 30); g.rect('#f4f1e8', 144, 17, 2, 30);
  for (let x = 123; x < 167; x++) g.rect('#5d7a6a', x, 36 + Math.round(4 * Math.sin(x / 6)), 1, 11);
  // frigorifero
  g.rect('#9aa4a8', 195, 31, 36, FLOOR - 31); g.rect('#e8eef0', 196, 32, 34, FLOOR - 32);
  g.rect('#c8d0d4', 196, 62, 34, 1); g.rect('#9aa4a8', 224, 40, 2, 14); g.rect('#9aa4a8', 224, 70, 2, 22);
  // piano di lavoro, fornelli e mobili bassi
  g.rect('#5a5a62', 6, 72, 150, 4); g.rect('#2a2a30', 112, 70, 28, 2);
  g.rect('#b8875a', 8, 76, 146, 44);
  for (let x = 8; x < 150; x += 36) { g.rect('#9a6e46', x, 76, 1, 44); g.rect('#e0d0a8', x + 30, 92, 2, 4); }
  // battiscopa con le tane (archi scuri), poi il pavimento a scacchi che ne taglia la metà inferiore
  g.rect('#9a7a52', 0, FLOOR - 4, W, 4);
  MOUSE_HOLES.forEach(([x, y]) => { if (y == FLOOR) ell('#1a1210', x, y, 5, 7); });
  g.rect('#a89070', 0, FLOOR, W, H - FLOOR);
  for (let y = FLOOR; y < H; y += 5) for (let x = ((y - FLOOR) / 5 & 1) * 10; x < W; x += 20) g.rect('#c8b090', x, y, 10, 5);
}
// tane nel battiscopa, sul piano di lavoro e sopra il frigorifero
const MOUSE_HOLES = [[22, FLOOR], [62, FLOOR], [102, FLOOR], [142, FLOOR], [178, FLOOR], [40, 72], [92, 72], [212, 31]];

function drawMouse(x, y, k = 1, white = false, squash = 0) {
  const O = '#1a1420', body = white ? '#f2f2f2' : '#8a8a94', hy = squash ? 1 - squash : 1;
  g.rect('#c08a8a', x - 9 * k, y - 2 * k, 4 * k, 1); g.rect('#c08a8a', x - 11 * k, y - 3 * k, 2 * k, 1);   // coda
  ell(O, x, y - 4 * k * hy, 6 * k + 1, 4 * k * hy + 1); ell(body, x, y - 4 * k * hy, 6 * k, 4 * k * hy);
  ell(O, x + 5 * k, y - 6 * k * hy, 4 * k + 1, 3 * k * hy + 1); ell(body, x + 5 * k, y - 6 * k * hy, 4 * k, 3 * k * hy);
  ell('#f0a0b0', x + 3 * k, y - 10 * k * hy, 2 * k, 2 * k); ell('#f0a0b0', x + 7 * k, y - 10 * k * hy, 2 * k, 2 * k);
  g.rect(O, x + 7 * k, y - 7 * k * hy, Math.max(1, k), Math.max(1, k));
  g.rect('#e86a8a', x + 9 * k, y - 6 * k * hy, Math.max(1, k), Math.max(1, k));
}

function makeMouse(opts = {}) {
  const admin = adminIndex();
  const m = { t: 0, dur: opts.arcade ? 25 : 40, success: false, score: 0, hits: 0, mice: [], fx: [], next: .6, over: false, reason: '' };
  m.update = dt => {
    m.fx.forEach(f => f.t += dt); m.fx = m.fx.filter(f => f.t < .6);
    if (m.over) return;
    m.t += dt;
    const maxOn = Math.min(5, 2 + (m.t / 10 | 0));
    if ((m.next -= dt) <= 0) {
      const busy = m.mice.map(o => o.h), free = MOUSE_HOLES.map((_, i) => i).filter(i => !busy.includes(i));
      if (m.mice.length < maxOn && free.length) {
        const white = Math.random() < .12;
        m.mice.push({ h: pick(free), age: 0, white, life: rnd(.8, 1.3) * Math.max(.55, 1 - m.t / 70) * (white ? .6 : 1), hit: 0 });
      }
      m.next = Math.max(.3, .85 - m.t * .012) * rnd(.6, 1.3);
    }
    m.mice.forEach(o => { o.age += dt; if (o.hit) o.hit += dt; });
    m.mice = m.mice.filter(o => (o.hit ? o.hit < .35 : o.age < o.life));
    if (m.t >= m.dur) {
      m.over = true; m.success = m.score >= 80;
      m.reason = opts.arcade && m.success ? L('Topi sconfitti!', 'Mice defeated!') : L('Tempo scaduto!', "Time's up!");
    }
  };
  // quanto il topo è fuori dalla tana (0..1): sale, resta, poi rientra
  const out = o => Math.min(1, o.age / .12, (o.life - o.age) / .12);
  m.click = (x, y) => {
    for (const o of m.mice) {
      const [hx, hy] = MOUSE_HOLES[o.h];
      if (o.hit || out(o) < .5 || Math.abs(x - hx) > 10 || y < hy - 14 || y > hy + 2) continue;
      o.hit = .001;
      const p = o.white ? 25 : 10;
      m.score += p; m.hits++;
      m.fx.push({ x: hx, y: hy - 16, t: 0, s: '+' + p });
      return;
    }
    m.fx.push({ x, y: y - 4, t: 0, s: L('Mancato', 'Miss'), miss: true });
  };
  m.draw = () => {
    drawKitchen();
    m.mice.forEach(o => {
      const [hx, hy] = MOUSE_HOLES[o.h];
      ctx.save(); ctx.beginPath(); ctx.rect(hx - 14, hy - 20, 28, 20); ctx.clip();   // il topo esce dalla tana
      drawMouse(hx - 2, hy + (o.hit ? 0 : (1 - out(o)) * 12), 1, o.white, o.hit ? .6 : 0);
      ctx.restore();
      if (o.hit) { const s = 'PAF!'; text(s, hx - F.width(s) / 2, hy - 18, C.y); }
    });
    m.fx.forEach(f => text(f.s, f.x - F.width(f.s) / 2, f.y - f.t * 14, f.miss ? C.dim : C.g));
    g.rect('#0d0f24d0', 0, 0, W, 10);
    text(L('Punti ', 'Score ') + m.score, 3, 3, C.ink);
    text(L('Topi ', 'Mice ') + m.hits, 70, 3, C.dim);
    const left = Math.max(0, Math.ceil(m.dur - m.t)) + 's';
    text(left, 236 - F.width(left), 3, m.dur - m.t <= 10 ? C.r : C.dim);
  };
  return m;
}

/* =================== MINIGIOCO 4: VIA IL FUMO! =================== */
const ROOMS = [4, 82, 160];                 // x di partenza delle 3 stanze, larghe 76
const RW = 76, RT = 12;
function drawRooms(smoke) {
  g.rect('#5a4a3a', 0, 0, W, H);
  ROOMS.forEach((x0, i) => {
    g.rect(['#e8d4b0', '#d8e0c8', '#e0d0d8'][i], x0, RT, RW, FLOOR - RT);
    g.rect('#8a6440', x0, FLOOR - 3, RW, 3);
    // camino con fuoco
    g.rect('#6a6058', x0 + 8, 52, 18, 24); g.rect('#8a8278', x0 + 4, 76, 26, FLOOR - 79);
    g.rect('#1a1210', x0 + 9, 88, 16, FLOOR - 91);
    const fl = (performance.now() / 120 + i) | 0;
    g.rect('#e86a20', x0 + 11, FLOOR - 10, 12, 6); g.rect('#f5c518', x0 + 13 + fl % 3, FLOOR - 13, 6, 6);
    // poltrona e finestra aperta
    g.rect('#7a4a3a', x0 + 36, 104, 16, 14); g.rect('#9a5a4a', x0 + 38, 98, 12, 8);
    g.rect('#f4f1e8', x0 + 54, 36, 18, 28); g.rect('#a9cbe0', x0 + 56, 38, 14, 24);
    g.rect('#6a8ab0', x0 + 56, 38, 3, 24);                                   // anta aperta
    if (!smoke) return;
    // fumo: nuvole grigie sempre più fitte
    const s = smoke[i], n = Math.round(s / 5), t = performance.now() / 1000;
    if (s > 5) g.rect('#7a7a84' + Math.round(s * 1.2).toString(16).padStart(2, '0'), x0, RT, RW, FLOOR - RT);
    for (let k = 0; k < n; k++) {
      const bx = x0 + 10 + (k * 37 + i * 11) % 56 + Math.sin(t * .6 + k) * 3, by = RT + 8 + (k * 23 + i * 7) % 70 + Math.cos(t * .5 + k) * 2;
      ell('#a8a8b0c0', bx, by, 7, 4); ell('#d8d8e0a0', bx - 1, by - 1, 4, 2);
    }
  });
  g.rect('#3a2a1e', 0, RT - 2, W, 2);
}

function makeSmoke(opts = {}) {
  const m = { t: 0, dur: opts.arcade ? 30 : 45, success: false, score: 0, smoke: [10, 10, 10], rate: [3, 3, 3],
    removed: 0, fan: null, next: 1.5, over: false, reason: '' };
  const room = x => ROOMS.findIndex(x0 => x >= x0 && x < x0 + RW);
  function blow(x, y, amount) {
    const i = room(x);
    if (i < 0 || y < RT || y > FLOOR) return;
    const d = Math.min(m.smoke[i], amount);
    m.smoke[i] -= d; m.removed += d;
    m.fan = { x, y, t: 0 };
  }
  m.update = dt => {
    if (m.fan && (m.fan.t += dt) > .25) m.fan = null;
    if (m.over) return;
    m.t += dt;
    // ogni camino cambia ritmo; ogni tanto uno sbuffo improvviso
    if ((m.next -= dt) <= 0) {
      m.rate = m.rate.map(() => rnd(2, 5) + m.t * .09);
      m.smoke[Math.random() * 3 | 0] += 12;
      m.next = rnd(1.5, 3);
    }
    m.smoke = m.smoke.map((s, i) => Math.min(100, s + m.rate[i] * dt));
    m.score = Math.round(m.removed / 2) + (m.t | 0);
    if (m.smoke.some(s => s >= 100)) { m.over = true; m.reason = L('Coff! Che fumo!', 'Cough! Too much smoke!'); }
    else if (m.t >= m.dur) { m.over = true; m.success = true; m.reason = L('Aria pulita!', 'Fresh air!'); }
  };
  m.click = (x, y) => blow(x, y, 7);
  let last = null;
  m.drag = (x, y) => {
    if (last) blow(x, y, Math.min(4, Math.hypot(x - last[0], y - last[1]) * .3));
    last = [x, y];
    clearTimeout(m.lastT); m.lastT = setTimeout(() => last = null, 120);
  };
  m.draw = () => {
    drawRooms(m.smoke);
    ROOMS.forEach((x0, i) => {
      const s = m.smoke[i];
      g.rect('#000000', x0 + 4, RT + 3, RW - 8, 4);
      g.rect(s > 70 ? C.r : s > 40 ? C.y : C.g, x0 + 4, RT + 3, (RW - 8) * s / 100, 4);
    });
    if (m.fan) {   // ventaglio e linee di vento verso la finestra
      const { x, y } = m.fan;
      for (let k = 0; k < 5; k++) g.rect('#c8a040', x - 4 + k * 2, y - 6 + Math.abs(k - 2), 1, 6 - Math.abs(k - 2));
      g.rect('#7a5230', x, y, 1, 4);
      for (let k = 0; k < 3; k++) g.rect('#ffffffa0', x + 6 + k * 4, y - 4 + k * 3, 5, 1);
    }
    g.rect('#0d0f24d0', 0, 0, W, 10);
    text(L('Punti ', 'Score ') + m.score, 3, 3, C.ink);
    const tt = (isFinite(m.dur) ? Math.max(0, Math.ceil(m.dur - m.t)) : m.t | 0) + 's';
    text(tt, 236 - F.width(tt), 3, C.dim);
  };
  return m;
}

/* =================== MINIGIOCO 5: BOMBOLE DEL GAS =================== */
// spaccato del condominio: 4 piani (0 = 3° piano, 3 = piano terra), scala al centro, furgone in strada
const GF = [14, 42, 70, 98], FH = 28, STAIR = [104, 126], VAN = [204, 104, 34, 22];
const gasFloorY = f => GF[f] + FH - 2;          // quota del pavimento del piano f
function drawBombola(x, y, full) {              // (x,y) = base al centro
  g.rect('#1a1420', x - 3, y - 9, 6, 9);
  g.rect(full ? '#e86a20' : '#9aa0a8', x - 2, y - 8, 4, 8);
  g.rect(full ? '#ffa060' : '#c8ccd0', x - 2, y - 8, 1, 7);
  g.rect('#3a3a40', x - 1, y - 10, 2, 2);
}
function drawSection(m) {
  g.rect('#9ec6e6', 0, 0, W, H);
  g.rect('#55575c', 0, 126, W, H - 126); g.rect('#a39886', 0, 124, W, 3);
  g.rect('#3a3a40', 14, 6, 192, 6);                                     // tetto
  g.rect('#c99a3c', 16, 12, 188, 114);                                  // muri esterni
  GF.forEach((y, f) => {
    // stanze e vano scala
    g.rect('#f0e2c0', 20, y + 1, 82, FH - 3);
    if (!(f == 3)) g.rect('#e8d8c8', 128, y + 1, 74, FH - 3); else g.rect('#d8cfb8', 128, y + 1, 74, FH - 3);
    g.rect('#d8cfb8', STAIR[0], y + 1, STAIR[1] - STAIR[0], FH - 3);
    for (let k = 0; k < 7; k++) g.rect('#b8ae98', STAIR[0] + 2 + k * 3, y + FH - 4 - k * 3, 4, 1);   // gradini
    g.rect('#8a7a62', 16, y + FH - 2, 188, 2);                          // solaio
    // porte verso la scala e finestre sul lato esterno
    g.rect('#7a5230', 96, y + 9, 6, FH - 11); g.rect('#7a5230', 128, y + 9, 6, FH - 11);
    g.rect('#f4f1e8', 26, y + 6, 12, 10); g.rect('#a9cbe0', 27, y + 7, 10, 8);
    g.rect('#f4f1e8', 186, y + 6, 12, 10); g.rect('#a9cbe0', 187, y + 7, 10, 8);
    g.rect('#7a5230', 50, y + 16, 18, 2); g.rect('#5a3a22', 52, y + 18, 2, 6); g.rect('#5a3a22', 64, y + 18, 2, 6);  // tavolo
  });
  text(L('Androne', 'Hall'), 146, GF[3] + 10, '#8a7a62');
  // furgone del gas
  const [vx, vy, vw, vh] = VAN;
  g.rect('#1a1420', vx - 1, vy - 1, vw + 2, vh - 3); g.rect('#f4f4f4', vx, vy, vw, vh - 5);
  g.rect('#a9cbe0', vx + vw - 9, vy + 3, 7, 6); g.rect('#e86a20', vx + 2, vy + 9, vw - 14, 5);
  text('GAS', vx + 4, vy + 3, '#e86a20');
  ell('#1a1420', vx + 7, vy + vh - 3, 3, 3); ell('#1a1420', vx + vw - 7, vy + vh - 3, 3, 3);
}

function makeGas(opts = {}) {
  const apts = [];
  for (let f = 0; f < 4; f++) for (let side = 0; side < 2; side++) {
    if (f == 3 && side == 1) continue;                                   // a destra del piano terra c'è l'androne
    apts.push({ f, side, x: side ? 128 : 20, w: side ? 74 : 82, st: 'ok', left: 0, total: 1 });
  }
  const m = { apts, t: 0, dur: opts.arcade ? 35 : 45, success: false, score: 0, lives: 3, delivered: 0,
    cart: { f: 3, target: null }, load: [], next: 1.2, fx: [], over: false, reason: '' };
  const say = (x, y, s, c) => m.fx.push({ x, y, s, c, t: 0 });
  function arrive(tg) {
    if (tg.van) {
      const n = m.load.filter(b => b == 'E').length;
      if (n) { m.load = m.load.map(() => 'F'); m.score += 2 * n; say(VAN[0] + 17, VAN[1] - 4, L('Ricaricate!', 'Refilled!'), C.g); }
      return;
    }
    const a = tg.apt;
    if (a.st == 'waiting' && m.load.includes('F')) {
      m.load.splice(m.load.indexOf('F'), 1);
      a.st = 'ok'; m.delivered++;
      const p = 20 + Math.ceil(a.left);
      m.score += p; say(a.x + a.w / 2, GF[a.f] + 4, '+' + p, C.g);
    } else if (a.st == 'empty' && m.load.length < 2) {
      m.load.push('E'); a.st = 'waiting'; a.left = Math.min(a.total, a.left + 6);
    } else if (a.st == 'empty') say(a.x + a.w / 2, GF[a.f] + 4, L('Carrello pieno', 'Cart full'), C.r);
  }
  m.update = dt => {
    m.fx.forEach(f => f.t += dt); m.fx = m.fx.filter(f => f.t < 1);
    if (m.over) return;
    m.t += dt;
    // carrello: sale e scende la scala, poi esegue l'azione
    const c = m.cart;
    if (c.target) {
      const d = c.target.f - c.f, step = 2.4 * dt;
      if (Math.abs(d) <= step) { c.f = c.target.f; const tg = c.target; c.target = null; arrive(tg); }
      else c.f += Math.sign(d) * step;
    }
    // nuove richieste di gas
    if ((m.next -= dt) <= 0) {
      const free = apts.filter(a => a.st == 'ok');
      if (free.length) { const a = pick(free); a.st = 'empty'; a.total = a.left = Math.max(12, 20 - m.t * .1); }
      m.next = Math.max(1.6, 4 - m.t * .05) * rnd(.7, 1.3);
    }
    apts.forEach(a => {
      if (a.st == 'ok') return;
      if ((a.left -= dt) <= 0) {
        if (a.st == 'waiting') { const i = m.load.indexOf('E'); if (i >= 0) m.load.splice(i, 1); }
        a.st = 'ok'; m.lives--; say(a.x + a.w / 2, GF[a.f] + 4, L('Senza gas!', 'No gas!'), C.r);
      }
    });
    if (m.lives <= 0) { m.over = true; m.reason = L('Tutti al freddo!', 'Everyone is cold!'); }
    else if (m.t >= m.dur) {
      m.over = true; m.success = m.delivered >= 3;
      m.reason = m.success ? L('Gas consegnato!', 'Gas delivered!') : L('Tempo scaduto!', "Time's up!");
    }
  };
  m.click = (x, y) => {
    const [vx, vy, vw, vh] = VAN;
    if (x >= vx && x < vx + vw && y >= vy && y < vy + vh) { m.cart.target = { f: 3, van: true }; return; }
    const a = apts.find(a => x >= a.x && x < a.x + a.w && y >= GF[a.f] && y < GF[a.f] + FH);
    if (a) { m.cart.target = { f: a.f, apt: a }; return; }
    const f = GF.findIndex(gy => y >= gy && y < gy + FH);
    if (f >= 0 && x >= STAIR[0] && x < STAIR[1]) m.cart.target = { f };
  };
  m.draw = () => {
    drawSection(m);
    const blink = (m.t * 4 | 0) % 2;
    apts.forEach(a => {
      const bx = a.side ? a.x + 12 : a.x + a.w - 12, base = gasFloorY(a.f);
      if (a.st == 'empty') {
        drawBombola(bx, base, false);
        if (blink) text('!', bx - 1, base - 18, C.r);
      } else if (a.st == 'waiting') {
        g.rect('#00000040', bx - 3, base - 9, 6, 9);                        // posto vuoto: aspetta la bombola piena
      }
      if (a.st != 'ok') {
        const f = a.left / a.total;
        g.rect('#000000', a.x + 4, GF[a.f] + 2, a.w - 8, 2); g.rect(f > .4 ? C.g : C.r, a.x + 4, GF[a.f] + 2, (a.w - 8) * f, 2);
      }
    });
    // carrello con l'amministratore stilizzato
    const cy = GF[0] + m.cart.f * FH + FH - 2, cx = (STAIR[0] + STAIR[1]) / 2;
    g.rect('#2a2a30', cx - 6, cy - 2, 12, 2); g.rect('#2a2a30', cx + 5, cy - 14, 1, 12);
    m.load.forEach((b, k) => drawBombola(cx - 3 + k * 6, cy - 2, b == 'F'));
    ell('#f0c6a0', cx + 8, cy - 18, 2, 2); g.rect('#3a5a94', cx + 7, cy - 15, 3, 7); g.rect('#2a2a30', cx + 7, cy - 8, 3, 6);
    m.fx.forEach(f => text(f.s, f.x - F.width(f.s) / 2, f.y - f.t * 10, f.c));
    g.rect('#0d0f24d0', 0, 0, W, 10);
    text(L('Punti ', 'Score ') + m.score, 3, 3, C.ink);
    text(L('Consegne ', 'Delivered ') + m.delivered, 60, 3, C.dim);
    for (let k = 0; k < 3; k++) g.rect(k < m.lives ? C.r : '#3a3a50', 150 + k * 7, 3, 5, 5);
    const tt = (isFinite(m.dur) ? Math.max(0, Math.ceil(m.dur - m.t)) : m.t | 0) + 's';
    text(tt, 236 - F.width(tt), 3, C.dim);
  };
  return m;
}

/* =================== MINIGIOCO 6: SPALA LA NEVE =================== */
const SNOW_CW = 10, SNOW_N = 24, WALK = 113;     // celle di neve larghe 10 px sul marciapiede
function drawWinter(depth, flakes) {
  g.rect('#b8c4cc', 0, 0, W, 40);
  g.rect('#e0b24f', 0, 20, W, 80);
  for (let x = 6; x < W; x += 24) {                                     // finestre con la neve sui davanzali
    if (x > 100 && x < 130) continue;
    [28, 56].forEach(y => { g.rect('#b5332e', x, y, 14, 14); g.rect('#f4f8ff', x - 1, y + 14, 16, 2); });
  }
  g.rect('#3a3a40', 0, 14, W, 6); g.rect('#f4f8ff', 0, 12, W, 3);       // tetto innevato
  g.rect('#d6cdb6', 106, 64, 28, 36); g.rect('#5a3a22', 110, 70, 20, 30); g.rect('#3e2716', 119, 70, 1, 30);  // portone
  g.rect('#a39886', 0, 100, W, 22);                                     // marciapiede
  g.rect('#55575c', 0, 122, W, H - 122); g.rect('#f4f8ff', 0, 122, W, 2);
  if (depth) depth.forEach((d, i) => {
    if (d < .5) return;
    const h = Math.round(d);
    g.rect('#f4f8ff', i * SNOW_CW, 117 - h, SNOW_CW, h + 3);
    g.rect('#ffffff', i * SNOW_CW + 2, 116 - h, SNOW_CW - 4, 1);
    g.rect('#c8d4e4', i * SNOW_CW, 119, SNOW_CW, 1);
  });
  if (flakes) flakes.forEach(f => g.rect('#ffffff', f.x, f.y, 1, 1));
}

function makeSnow(opts = {}) {
  const m = { t: 0, dur: opts.arcade ? 25 : 45, success: false, score: 0, removed: 0, falls: 0, safe: 0,
    depth: Array.from({ length: SNOW_N }, () => rnd(1, 3)), people: [], flakes: [], next: 3.5, shovel: null, fx: [], over: false, reason: '' };
  for (let i = 0; i < 70; i++) m.flakes.push({ x: rnd(0, W), y: rnd(0, H), v: rnd(10, 25) });
  function dig(x, amount) {
    const i = Math.floor(x / SNOW_CW);
    [[i, 1], [i - 1, .4], [i + 1, .4]].forEach(([k, w]) => {
      if (k < 0 || k >= SNOW_N) return;
      const d = Math.min(m.depth[k], amount * w);
      m.depth[k] -= d; m.removed += d;
    });
  }
  m.update = dt => {
    m.fx.forEach(f => f.t += dt); m.fx = m.fx.filter(f => f.t < 1);
    if (m.shovel && (m.shovel.t += dt) > .2) m.shovel = null;
    m.flakes.forEach(f => { f.y += f.v * dt; f.x += Math.sin(f.y / 9) * .3; if (f.y > H) { f.y = -2; f.x = rnd(0, W); } });
    if (m.over) return;
    m.t += dt;
    // nevicata graduale: all'inizio ~0.3 cm/s per cella, poi sempre più fitta
    const rate = .5 + m.t * .02;
    m.depth = m.depth.map(d => Math.min(12, d + rnd(0, rate * 1.2) * dt));
    // i condomini escono dal portone e camminano sul marciapiede
    if ((m.next -= dt) <= 0) {
      m.people.push({ x: 120, dir: Math.random() < .5 ? -1 : 1, fallen: 0, slipped: false, col: pick(['#b5332e', '#3a5a94', '#3e5c30', '#7a3a5a']) });
      m.next = rnd(3, 5) / (1 + m.t / 40);
    }
    m.people.forEach(p => {
      if (p.fallen > 0) { p.fallen -= dt; return; }
      p.x += p.dir * 22 * dt;
      const i = Math.floor(p.x / SNOW_CW);
      if (i >= 0 && i < SNOW_N && m.depth[i] > 7 && p.lastFall != i) {
        p.fallen = 1; p.slipped = true; p.lastFall = i; m.falls++;
        m.fx.push({ x: p.x, y: WALK - 20, s: L('Ahi!', 'Ouch!'), c: C.r, t: 0 });
      }
    });
    m.people = m.people.filter(p => {
      const out = p.x < -6 || p.x > W + 6;
      if (out && !p.slipped) { m.safe++; m.fx.push({ x: Math.min(W - 10, Math.max(10, p.x)), y: WALK - 20, s: '+10', c: C.g, t: 0 }); }
      return !out;
    });
    m.score = Math.round(m.removed / 2) + m.safe * 10;
    if (!opts.arcade && m.falls >= 5) { m.over = true; m.reason = L('Troppe cadute!', 'Too many falls!'); }
    else if (m.t >= m.dur) {
      m.over = true; m.success = m.falls <= 1;
      m.reason = opts.arcade && m.success ? L('Marciapiede pulito!', 'Sidewalk clear!') : L('Tempo scaduto!', "Time's up!");
    }
  };
  m.click = (x, y) => { if (y > 70) { dig(x, 5); m.shovel = { x, y, t: 0 }; } };
  let last = null;
  m.drag = (x, y) => {
    if (y > 70 && last) { dig(x, Math.min(3, Math.hypot(x - last[0], y - last[1]) * .25)); m.shovel = { x, y, t: 0 }; }
    last = [x, y];
    clearTimeout(m.lastT); m.lastT = setTimeout(() => last = null, 120);
  };
  m.draw = () => {
    drawWinter(m.depth, null);
    m.people.forEach(p => {                                             // omino; se è caduto è sdraiato
      if (p.fallen > 0) { g.rect(p.col, p.x - 6, WALK - 3, 10, 3); ell('#f0c6a0', p.x + 5, WALK - 2, 2, 2); return; }
      ell('#f0c6a0', p.x, WALK - 15, 2, 2); g.rect(p.col, p.x - 2, WALK - 12, 5, 7);
      const st = (m.t * 8 | 0) % 2;
      g.rect('#2a2a30', p.x - 2 + st, WALK - 5, 2, 5); g.rect('#2a2a30', p.x + 1 - st, WALK - 5, 2, 5);
    });
    if (m.shovel) {                                                     // pala
      const { x, y } = m.shovel;
      g.rect('#7a5230', x, y - 10, 1, 9); g.rect('#9aa0a8', x - 3, y - 2, 7, 3);
    }
    m.flakes.forEach(f => g.rect('#ffffff', f.x, f.y, 1, 1));
    m.fx.forEach(f => text(f.s, f.x - F.width(f.s) / 2, f.y - f.t * 10, f.c));
    g.rect('#0d0f24d0', 0, 0, W, 10);
    text(L('Punti ', 'Score ') + m.score, 3, 3, C.ink);
    text(L('Cadute ', 'Falls ') + m.falls, 70, 3, m.falls ? C.r : C.dim);
    const left = Math.max(0, Math.ceil(m.dur - m.t)) + 's';
    text(left, 236 - F.width(left), 3, m.dur - m.t <= 10 ? C.r : C.dim);
  };
  return m;
}

/* =================== MINIGIOCO 7: GHIACCIO! =================== */
// marciapiede in pendenza (come quello vero): in alto a sinistra, in basso a destra
const ICE_N = 14, ICE_W = 16, ICE_X0 = 16;                 // lastre possibili lungo il marciapiede
const walkY = x => 98 + Math.round(x * 20 / W);           // quota del marciapiede alla x data
const BUCKET = [2, 84, 12, 12];                            // secchio del sale in cima alla salita
function drawSlope(cells) {
  g.rect('#1e2a48', 0, 0, W, H);                           // sera d'inverno
  for (let i = 0; i < 30; i++) g.rect('#c8d4ff', (i * 67) % W, (i * 23) % 40, 1, 1);
  g.rect('#c99a3c', 0, 30, W, 90);
  for (let x = 10; x < W; x += 26) [40, 64].forEach(y => { g.rect('#ffd860', x, y, 12, 12); g.rect('#b5332e', x - 3, y, 3, 12); g.rect('#b5332e', x + 12, y, 3, 12); });
  g.rect('#3a3a40', 0, 24, W, 6); g.rect('#f4f8ff', 0, 22, W, 3);
  // lampione
  g.rect('#3a3a40', 120, 40, 2, 60); g.rect('#ffd860', 116, 38, 10, 3); g.rect('#ffd86030', 100, 41, 42, 56);
  for (let x = 0; x < W; x++) {                            // marciapiede in porfido e strada
    const y = walkY(x);
    g.rect('#8a8070', x, y, 1, 8); if ((x * 7) % 19 < 2) g.rect('#6e6458', x, y + 3, 1, 1);
    g.rect('#3a3c42', x, y + 8, 1, H - y - 8);
  }
  if (cells) cells.forEach((c, i) => {
    if (c.st == 'none') return;
    const x0 = ICE_X0 + i * ICE_W;
    for (let x = x0; x < x0 + ICE_W - 2; x++) {
      const y = walkY(x);
      if (c.st == 'ice') { g.rect(c.grow < 1 ? '#bfe4ff80' : '#bfe4ff', x, y, 1, 3); if ((x + i) % 5 == 0) g.rect('#ffffff', x, y, 1, 1); }
      else { g.rect('#9a8a70', x, y, 1, 2); if ((x * 3 + i) % 4 == 0) g.rect('#f4f4f4', x, y, 1, 1); }   // sale
    }
  });
  // secchio del sale
  const [bx, by, bw, bh] = BUCKET;
  g.rect('#1a1420', bx - 1, by - 1, bw + 2, bh + 2); g.rect('#d04040', bx, by, bw, bh); g.rect('#f4f4f4', bx + 2, by + 2, bw - 4, 3);
}

function makeIce(opts = {}) {
  const m = { t: 0, dur: opts.arcade ? 25 : 45, success: false, score: 0, salt: 8, falls: 0, safe: 0, lives: 3,
    cells: Array.from({ length: ICE_N }, () => ({ st: 'none', grow: 0, left: 0 })), people: [], fx: [], next: 1, nextP: 2.5, over: false, reason: '' };
  const say = (x, y, s, c) => m.fx.push({ x, y, s, c, t: 0 });
  m.update = dt => {
    m.fx.forEach(f => f.t += dt); m.fx = m.fx.filter(f => f.t < 1);
    if (m.over) return;
    m.t += dt;
    // si formano lastre di ghiaccio; il sale dura qualche secondo
    if ((m.next -= dt) <= 0) {
      const free = m.cells.filter(c => c.st == 'none');
      if (free.length) { const c = pick(free); c.st = 'ice'; c.grow = 0; }
      m.next = Math.max(.7, 2 - m.t * .03) * rnd(.7, 1.3);
    }
    m.cells.forEach(c => {
      if (c.st == 'ice') c.grow = Math.min(1, c.grow + dt / 1.2);
      if (c.st == 'salt' && (c.left -= dt) <= 0) c.st = 'none';
    });
    // condomini che salgono o scendono il marciapiede
    if ((m.nextP -= dt) <= 0) {
      const dir = Math.random() < .5 ? 1 : -1;
      m.people.push({ x: dir > 0 ? -4 : W + 4, dir, fallen: 0, slipped: false, last: -1, col: pick(['#b5332e', '#3a5a94', '#3e5c30', '#7a3a5a', '#d0a040']) });
      m.nextP = rnd(2.5, 4) / (1 + m.t / 50);
    }
    m.people.forEach(p => {
      if (p.fallen > 0) { p.fallen -= dt; return; }
      p.x += p.dir * 20 * dt;
      const i = Math.floor((p.x - ICE_X0) / ICE_W);
      const c = m.cells[i];
      if (c && c.st == 'ice' && c.grow >= 1 && p.last != i) {
        p.fallen = 1.1; p.slipped = true; p.last = i; m.falls++; m.lives--;
        say(p.x, walkY(p.x) - 20, L('Patatrac!', 'Crash!'), C.r);
      }
    });
    m.people = m.people.filter(p => {
      const out = p.x < -8 || p.x > W + 8;
      if (out && !p.slipped) { m.safe++; m.score += 10; }
      return !out;
    });
    if (!opts.arcade && m.lives <= 0) { m.over = true; m.reason = L('Tutti per terra!', 'Everyone fell!'); }
    else if (m.t >= m.dur) {
      m.over = true; m.success = m.falls <= 1;
      m.reason = opts.arcade && m.success ? L('Niente ghiaccio!', 'No more ice!') : L('Tempo scaduto!', "Time's up!");
    }
  };
  m.click = (x, y) => {
    const [bx, by, bw, bh] = BUCKET;
    if (x >= bx - 2 && x < bx + bw + 2 && y >= by - 2 && y < by + bh + 2) { m.salt = 8; say(bx + 8, by - 6, L('Sale!', 'Salt!'), C.g); return; }
    const i = Math.floor((x - ICE_X0) / ICE_W), c = m.cells[i];
    if (!c || Math.abs(y - walkY(x)) > 10) return;
    if (c.st != 'ice') return;
    if (m.salt <= 0) { say(x, y - 10, L('Sale finito!', 'Out of salt!'), C.r); return; }
    m.salt--; c.st = 'salt'; c.left = 6; m.score += 5;
    say(x, y - 10, '+5', C.g);
  };
  m.draw = () => {
    drawSlope(m.cells);
    m.people.forEach(p => {
      const y = walkY(p.x);
      if (p.fallen > 0) { g.rect(p.col, p.x - 6, y - 3, 10, 3); ell('#f0c6a0', p.x + 5, y - 2, 2, 2); return; }
      ell('#f0c6a0', p.x, y - 15, 2, 2); g.rect(p.col, p.x - 2, y - 12, 5, 7);
      const st = (m.t * 8 | 0) % 2;
      g.rect('#2a2a30', p.x - 2 + st, y - 5, 2, 5); g.rect('#2a2a30', p.x + 1 - st, y - 5, 2, 5);
    });
    m.fx.forEach(f => text(f.s, f.x - F.width(f.s) / 2, f.y - f.t * 10, f.c));
    g.rect('#0d0f24d0', 0, 0, W, 10);
    text(L('Punti ', 'Score ') + m.score, 3, 3, C.ink);
    text(L('Sale ', 'Salt ') + m.salt, 64, 3, m.salt ? C.ink : C.r);
    for (let k = 0; k < 3; k++) g.rect(!opts.arcade && k >= m.lives ? '#3a3a50' : C.r, 120 + k * 7, 3, 5, 5);
    const left = Math.max(0, Math.ceil(m.dur - m.t)) + 's';
    text(left, 236 - F.width(left), 3, m.dur - m.t <= 10 ? C.r : C.dim);
  };
  return m;
}

/* =================== MINIGIOCO 8: LA LEGNAIA =================== */
// catasta in cantina: griglia 10x7, ciocchi orizzontali lunghi 1-3; fila completa = bonus e si libera
const WCOLS = 10, WROWS = 7, WCW = 10, WCH = 8, WX = 70, WY = 50;
const WOOD = ['#8a5a2e', '#9a6a3a', '#7a4a24'];
function drawLog(x, y, len, col, alpha = '') {
  g.rect('#3e2716' + alpha, x, y, len * WCW, WCH);
  g.rect(col + alpha, x + 1, y + 1, len * WCW - 2, WCH - 2);
  g.rect('#00000020', x + 1, y + WCH - 3, len * WCW - 2, 1);
  [x + 1, x + len * WCW - 7].forEach(rx => { g.rect('#d8b080' + alpha, rx, y + 1, 6, WCH - 2); g.rect('#a07848' + alpha, rx + 2, y + 3, 2, 2); });
}
function drawCellar() {
  g.rect('#4a4440', 0, 0, W, H);
  for (let y = 12; y < 110; y += 8) for (let x = ((y / 8) & 1) * 9; x < W; x += 18) g.rect('#5a544e', x, y, 16, 6);   // pietre
  g.rect('#2a2420', 0, 110, W, H - 110);
  g.rect('#6a6058', 0, 108, W, 2);
  g.rect('#a9cbe0', 200, 16, 22, 10); g.rect('#3a3430', 210, 16, 1, 10);              // bocca di lupo
  g.rect('#5a3a22', WX - 4, WY - 2, 2, WROWS * WCH + 4); g.rect('#5a3a22', WX + WCOLS * WCW + 2, WY - 2, 2, WROWS * WCH + 4);   // paletti
  g.rect('#3a3430', WX, WY + WROWS * WCH, WCOLS * WCW, 2);
  g.rect('#2a2420', 20, 70, 30, 38); g.rect('#e86a20', 26, 92, 18, 10); g.rect('#f5c518', 30, 94, 8, 6);   // stufa
}

function makeWood(opts = {}) {
  const m = { t: 0, dur: opts.arcade ? 30 : 45, success: false, score: 0, rows: 0, grid: Array.from({ length: WROWS }, () => Array(WCOLS).fill(0)),
    log: null, col: 3, auto: 0, nid: 0, colors: {}, fx: [], over: false, reason: '' };
  const newLog = () => { const r = Math.random(); m.log = { len: r < .3 ? 1 : r < .7 ? 2 : 3, c: 1 + (Math.random() * 3 | 0), id: ++m.nid }; m.auto = Math.max(2, 4 - m.t * .04); };
  newLog();
  const clampCol = c => Math.max(0, Math.min(WCOLS - m.log.len, c));
  // riga dove si posa il ciocco: sopra la colonna più alta tra quelle che occupa
  function landing(c) {
    let r = WROWS - 1;
    for (let k = c; k < c + m.log.len; k++) {
      let top = WROWS;
      for (let rr = 0; rr < WROWS; rr++) if (m.grid[rr][k]) { top = rr; break; }
      r = Math.min(r, top - 1);
    }
    return r;
  }
  function drop() {
    const c = clampCol(m.col), r = landing(c);
    if (r < 0) { m.over = true; m.reason = L('Catasta crollata!', 'The pile fell!'); return; }
    for (let k = c; k < c + m.log.len; k++) m.grid[r][k] = m.log.id;
    m.colors[m.log.id] = m.log.c;
    m.score += m.log.len;
    // file complete: bonus e la fila sparisce, quelle sopra scendono
    for (let rr = WROWS - 1; rr >= 0; rr--) {
      if (m.grid[rr].every(v => v)) {
        m.grid.splice(rr, 1); m.grid.unshift(Array(WCOLS).fill(0)); m.rows++; m.score += 30;
        m.fx.push({ x: WX + WCOLS * WCW / 2, y: WY + rr * WCH, t: 0, s: L('Fila! +30', 'Row! +30') });
        rr++;
      }
    }
    newLog();
  }
  m.update = dt => {
    m.fx.forEach(f => f.t += dt); m.fx = m.fx.filter(f => f.t < 1);
    if (m.over) return;
    m.t += dt;
    if ((m.auto -= dt) <= 0) drop();                    // il ciocco cade da solo se aspetti troppo
    if (!m.over && m.t >= m.dur) {
      m.over = true; m.success = m.rows >= 2;
      m.reason = opts.arcade && m.success ? L('Legnaia in ordine!', 'Woodpile sorted!') : L('Tempo scaduto!', "Time's up!");
    }
  };
  m.hover = x => { m.col = Math.floor((x - WX) / WCW - m.log.len / 2 + .5); };
  m.click = (x, y) => { m.hover(x); drop(); };
  m.draw = () => {
    drawCellar();
    m.grid.forEach((row, r) => {                            // i ciocchi posati: celle consecutive con lo stesso numero = un tronco
      for (let c = 0; c < WCOLS;) {
        if (!row[c]) { c++; continue; }
        let n = 1; while (c + n < WCOLS && row[c + n] == row[c]) n++;
        drawLog(WX + c * WCW, WY + r * WCH, n, WOOD[m.colors[row[c]] - 1]);
        c += n;
      }
    });
    if (m.log && !m.over) {
      const c = clampCol(m.col), r = landing(c);
      if (r >= 0) drawLog(WX + c * WCW, WY + r * WCH, m.log.len, WOOD[m.log.c - 1], '60');   // dove cadrà
      drawLog(WX + c * WCW, WY - 14, m.log.len, WOOD[m.log.c - 1]);
      g.rect('#000000', WX, WY - 18, WCOLS * WCW, 2);
      g.rect(m.auto > 1 ? C.g : C.r, WX, WY - 18, WCOLS * WCW * Math.min(1, m.auto / 4), 2);
    }
    m.fx.forEach(f => text(f.s, f.x - F.width(f.s) / 2, f.y - f.t * 12, C.y));
    g.rect('#0d0f24d0', 0, 0, W, 10);
    text(L('Punti ', 'Score ') + m.score, 3, 3, C.ink);
    text(L('File ', 'Rows ') + m.rows, 70, 3, C.dim);
    const left = Math.max(0, Math.ceil(m.dur - m.t)) + 's';
    text(left, 236 - F.width(left), 3, m.dur - m.t <= 10 ? C.r : C.dim);
  };
  return m;
}

/* =================== ELENCO MINIGIOCHI =================== */
const GAMES = [
  { id: 'leak',
    title: () => L("Perdita d'acqua", 'Water leak'),
    ring: () => L('Driiin!', 'Riiing!'),
    intro: () => L("La signora del primo piano è al telefono: 'Amministratore, piove in salotto!'. I tubi perdono da tutte le parti, l'acqua sale. Clicca sulle perdite rosse per chiuderle prima che l'acqua ti arrivi sopra la testa!",
      "The lady on the first floor is on the phone: 'Administrator, it's raining in my living room!'. The pipes are leaking everywhere, the water is rising. Click the red leaks to shut them before the water goes over your head!"),
    tip: a => a ? L('Resisti 30 secondi chiudendo le perdite', 'Hold on for 30 seconds by shutting the leaks') : L('45 secondi: clicca sulle perdite che lampeggiano', '45 seconds: click the flashing leaks'),
    drawBg: drawRoom, create: makeLeak, icon: iconDrop },
  { id: 'mush',
    title: () => L('Raccolta funghi', 'Mushroom hunt'),
    ring: () => L('Che bel sole!', 'What a sunny day!'),
    intro: () => L("Come ogni mattina, si parte alla ricerca di funghi. Corri nel bosco della Val di Rabbi e raccogli porcini (marroni, 10 punti) e finferli (gialli, 5 punti). Attento ai funghi rossi: sono velenosi e ti svuotano il cestino!",
      "Like every morning, off we go mushroom hunting. Run to the Val di Rabbi woods and pick porcini (brown, 10 points) and chanterelles (yellow, 5 points). Watch out for the red ones: they are poisonous and empty your basket!"),
    tip: a => a ? L('25 secondi: almeno 30 punti per risolvere', '25 seconds: at least 30 points to solve it') : L('45 secondi: clicca sui funghi buoni', '45 seconds: click the good mushrooms'),
    drawBg: drawForest, create: makeMush,
    icon: (cx, cy) => { drawMush('p', cx - 4, cy + 8, 1.1); drawMush('f', cx + 6, cy + 10, .9); } },
  { id: 'mouse',
    title: () => L('Caccia ai topi', 'Mouse panic'),
    ring: () => L('Aiuto, un topo!', 'Help, a mouse!'),
    intro: () => L("Urla dalla cucina del terzo piano: ci sono i topi! Spuntano dalle tane, dal piano di lavoro e da sopra il frigorifero. Colpiscili piu veloce che puoi: i topi grigi valgono 10 punti, quelli bianchi sono velocissimi e ne valgono 25!",
      "Screams from the third-floor kitchen: mice! They pop out of holes, off the worktop and from on top of the fridge. Hit them as fast as you can: grey mice are worth 10 points, white ones are super fast and worth 25!"),
    tip: a => a ? L('25 secondi: almeno 80 punti per risolvere', '25 seconds: at least 80 points to solve it') : L('40 secondi: clicca sui topi', '40 seconds: click the mice'),
    drawBg: drawKitchen, create: makeMouse,
    icon: (cx, cy) => drawMouse(cx - 2, cy + 8, 1.4) },
  { id: 'smoke',
    title: () => L('Via il fumo!', 'Smoke out!'),
    ring: () => L('Coff coff!', 'Cough cough!'),
    intro: () => L("Si sono accesi tutti i caminetti insieme e il fumo invade gli appartamenti. Sventola come un matto: clicca o trascina dentro le stanze per spingere il fumo fuori dalla finestra, prima che una casa si riempia del tutto!",
      "All the fireplaces were lit at once and smoke is filling the flats. Fan like crazy: click or drag inside the rooms to push the smoke out of the window, before a home fills up completely!"),
    tip: a => a ? L('Resisti 30 secondi senza far riempire le stanze', 'Hold on 30 seconds without letting a room fill up') : L('45 secondi: clicca o trascina nelle stanze', '45 seconds: click or drag in the rooms'),
    drawBg: () => drawRooms(null), create: makeSmoke,
    icon: (cx, cy) => { ell('#6a6a74', cx, cy + 2, 10, 6); ell('#a8a8b0', cx - 2, cy, 8, 5); ell('#d8d8e0', cx + 2, cy - 2, 5, 3); } },
  { id: 'gas',
    title: () => L('Bombole del gas', 'Gas run'),
    ring: () => L('Senza gas!', 'Out of gas!'),
    intro: () => L("Niente gas, niente polenta! Gli appartamenti lasciano fuori dalla porta le bombole vuote. Clicca su un appartamento per mandarci il carrello, porta le vuote al furgone del gas giu in strada e riporta su quelle piene prima che scada il tempo.",
      "No gas, no polenta! The flats leave their empty gas bottles outside the door. Click a flat to send the cart there, take the empties to the gas van down in the street and bring the full ones back up before time runs out."),
    tip: a => a ? L('35 secondi: consegna almeno 3 bombole', '35 seconds: deliver at least 3 bottles') : L('45 secondi, 3 vite, carrello da 2 bombole', '45 seconds, 3 lives, cart holds 2 bottles'),
    drawBg: drawSection, create: makeGas,
    icon: (cx, cy) => { drawBombola(cx - 4, cy + 9, true); drawBombola(cx + 4, cy + 9, false); } },
  { id: 'snow',
    title: () => L('Spala la neve', 'Snow day'),
    ring: () => L('Nevica!', "It's snowing!"),
    intro: () => L("Stanotte in Val di Rabbi sono caduti trenta centimetri di neve e continua a nevicare! Spala il marciapiede davanti al portone: clicca o trascina sulla neve. Se un condomino passa sulla neve alta scivola, e sono guai!",
      "Last night a foot of snow fell in Val di Rabbi and it is still snowing! Shovel the sidewalk in front of the door: click or drag on the snow. If a resident walks on deep snow they slip, and that means trouble!"),
    tip: a => a ? L('25 secondi: al massimo una caduta', '25 seconds: one fall at most') : L('45 secondi, max 5 cadute: clicca o trascina', '45 seconds, 5 falls max: click or drag'),
    drawBg: () => drawWinter(null, null), create: makeSnow,
    icon: (cx, cy) => { g.rect('#7a5230', cx + 2, cy - 10, 1, 14); g.rect('#9aa0a8', cx - 2, cy + 3, 9, 4); ell('#f4f8ff', cx - 5, cy + 8, 5, 3); } },
  { id: 'ice',
    title: () => L('Ghiaccio!', 'Black ice!'),
    ring: () => L('Che scivolone!', 'Watch your step!'),
    intro: () => L("Stasera gela e il marciapiede in salita davanti al condominio diventa una pista di pattinaggio. Clicca sulle lastre di ghiaccio per spargere il sale prima che i condomini ci passino sopra. Il sale finisce: ricaricalo dal secchio rosso in cima alla salita!",
      "It is freezing tonight and the sloping sidewalk in front of the building turns into an ice rink. Click the ice patches to spread salt before the residents walk on them. Salt runs out: refill it from the red bucket at the top of the slope!"),
    tip: a => a ? L('25 secondi: al massimo una caduta', '25 seconds: one fall at most') : L('45 secondi, 3 vite, 8 manciate di sale', '45 seconds, 3 lives, 8 handfuls of salt'),
    drawBg: () => drawSlope(null), create: makeIce,
    icon: (cx, cy) => { g.rect('#bfe4ff', cx - 8, cy + 4, 16, 3); g.rect('#ffffff', cx - 5, cy + 4, 2, 1); g.rect('#d04040', cx - 3, cy - 6, 7, 8); g.rect('#f4f4f4', cx - 2, cy - 5, 5, 2); } },
  { id: 'wood',
    title: () => L('La legnaia', 'Woodpile'),
    ring: () => L('Arriva il freddo!', 'Winter is coming!'),
    intro: () => L("Il camion ha scaricato la legna per l'inverno e va sistemata in cantina. Muovi il ciocco e clicca dove farlo cadere: ogni fila completa vale 30 punti e lascia spazio. Non aspettare troppo, il ciocco cade da solo, e se la catasta arriva in cima crolla tutto!",
      "The truck has dropped off the winter firewood and it must be stacked in the cellar. Move the log and click where to drop it: every full row is worth 30 points and frees space. Do not wait too long, the log drops by itself, and if the pile reaches the top it all falls down!"),
    tip: a => a ? L('30 secondi: completa almeno 2 file', '30 seconds: complete at least 2 rows') : L('45 secondi: completa piu file che puoi', '45 seconds: complete as many rows as you can'),
    drawBg: drawCellar, create: makeWood,
    icon: (cx, cy) => { drawLog(cx - 10, cy + 2, 2, WOOD[0]); drawLog(cx - 5, cy - 6, 1, WOOD[1]); } }
];

/* --- avvio --- */
setLang(lang);
go(Title);
{
  const pm = location.search.match(/[?&]play=([a-z]+)/), gm = pm && GAMES.find(x => x.id == pm[1]);
  if (gm) go(Play, gm, /[?&]arcade/.test(location.search) ? { p: { n: 1 } } : undefined);
}
let last = performance.now();
// un errore non deve bloccare il gioco: lo mostriamo in fondo allo schermo e si continua
let lastError = '';
addEventListener('error', e => { lastError = (e.message || 'errore') + ' @' + (e.lineno || '?'); });
function frame(t) {
  requestAnimationFrame(frame);
  const dt = Math.min(.05, (t - last) / 1000);
  last = t;
  try {
    scene.update && scene.update(dt);
    btns = [];
    ctx.setTransform(S, 0, 0, S, 0, 0);
    ctx.imageSmoothingEnabled = false;
    scene.draw();
  } catch (e) {
    lastError = String(e && e.message || e) + ' @' + String(e && e.stack || '').split(/\n/).slice(0, 2).join(' ').slice(-60);
    console.error(e);
  }
  if (lastError) {
    ctx.setTransform(S, 0, 0, S, 0, 0);
    g.rect('#000000d0', 0, H - 9, W, 9);
    F.wrap(lastError, 58).slice(0, 1).forEach(l => text(l, 2, H - 7, C.r));
  }
}
requestAnimationFrame(frame);
})();
