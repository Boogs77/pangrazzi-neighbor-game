// Disegna i blocchi descritti in reference/edificio.md: node tools/render-blocks.js
// Ogni carattere della riga è una colonna: la posizione delle lettere decide dove sta la finestra.
// Le righe dei blocchi sono allineate dall'alto; le righe "MS" sono la mansarda nel tetto.
// La strada scende dallo spigolo basso a sinistra del primo blocco fino al portone P, poi è piana.
const fs = require('fs'), path = require('path');
const A = require('../building-art.js');
const { canvas, png } = require('./png.js');
const P = A.P;

const COL = 6;                       // pixel per colonna di testo
const DOORS = 'PQRTU';
const ROW_H = 24, WALL_TOP = 36, MARGIN = 8;
const STEPS = 3;                     // gradini sotto l'ingresso R

function parse(file) {
  const blocks = [];
  let cur = null;
  for (const line of fs.readFileSync(file, 'utf8').split(/\r?\n/)) {
    if (/BLOCCO/.test(line)) { cur = { name: line.trim(), rows: [] }; blocks.push(cur); continue; }
    const m = line.match(/^\s*(\w+):/);
    if (!cur || !m) continue;
    // "ap:" sotto una riga: nella colonna di ogni finestra il numero/lettera del suo appartamento
    if (/^ap$/i.test(m[1])) {
      const prev = cur.rows[cur.rows.length - 1];
      for (let i = m[0].length; i < line.length; i++) {
        if (line[i] == ' ') continue;
        const it = prev && prev.items.find(it => it.col == i);
        if (it) it.apt = line[i]; else console.warn('ap: nessuna finestra in colonna', i, 'in', cur.name);
      }
      continue;
    }
    const items = [];
    for (let i = m[0].length; i < line.length; i++)
      if (/[A-Z]/.test(line[i])) items.push({ k: line[i], col: i });
      // '>' o '<' subito dopo una lettera: la sposta di mezza colonna
      else if ('<>'.includes(line[i]) && items.length && items[items.length - 1].col == i - 1) items[items.length - 1].nudge = line[i] == '>' ? .5 : -.5;
      else if (line[i] == '|') items.push({ k: '|', col: i });
    // MS = mansarda nel tetto; ZC = finestre nello zoccolo, sotto l'ultimo piano
    cur.rows.push({ label: m[1], attic: /^m/i.test(m[1]), plinth: /^zc/i.test(m[1]), items });
  }
  return blocks;
}

const base = j => WALL_TOP + 19 + j * ROW_H;   // linea di base delle finestre della j-esima fila sotto il tetto

/* posizione orizzontale di ogni blocco, uno accanto all'altro */
function layout(blocks) {
  let x = 0;
  blocks.forEach((b, i) => {
    const all = b.rows.flatMap(r => r.items);
    const wins = all.filter(it => !DOORS.includes(it.k) && it.k != '|' && it.k != 'L');
    const c0 = Math.min(...wins.map(it => it.col)), c1 = Math.max(...wins.map(it => it.col));
    b.floors = b.rows.filter(r => !r.attic && !r.plinth);
    // piano terra "basso": ultima fila con portone/negozio/porta; è alto solo quanto serve
    const last = b.floors[b.floors.length - 1];
    b.ground = last.items.some(it => 'PQT'.includes(it.k)) ? last : null;
    if (b.ground) {
      const above = base(b.floors.length - 2);
      b.street = above + 4 + Math.max(...last.items.filter(it => A.TYPES[it.k]).map(it => A.TYPES[it.k].h + (DOORS.includes(it.k) ? 0 : 10)));
    } else b.street = base(b.floors.length - 1) + 15;
    if (i == 0) {
      // spazio a sinistra per quello che sporge dal muro (es. ingresso R)
      const minX = Math.min(...all.map(it => 10 + (it.col + (it.nudge || 0) - c0) * COL - ((A.TYPES[it.k] || { w: 0 }).w >> 1)));
      x += MARGIN - Math.min(0, minX);
    }
    const ox = x;
    b.X = col => ox + 10 + (col - c0) * COL;
    b.left = x;
    b.right = b.X(c1) + 10;
    x = b.right;
  });
  return x;
}

function drawAll(blocks) {
  const width = layout(blocks) + MARGIN + 10;
  const low = Math.max(...blocks.map(b => b.street));
  // pendenza: dallo spigolo basso a sinistra del primo blocco fino a poco prima del portone, poi piano
  const first = blocks[0];
  let door = null;
  blocks.forEach(b => b.rows.forEach(r => r.items.forEach(it => { if (door == null && it.k == 'P') door = b.X(it.col + (it.nudge || 0)) - (A.TYPES.P.w >> 1) - 4; })));
  const x0 = first.left, x1 = door != null ? door : blocks.find(b => b.street == low).left;
  const street = x => x <= x0 ? first.street : x >= x1 ? low : Math.round(first.street + (low - first.street) * (x - x0) / (x1 - x0));
  const cv = canvas(width, low + 14);

  // abbaini della mansarda unica: equidistanti tra il primo e l'ultimo
  for (let i = 0; i < blocks.length;) {
    let j = i;
    const ks = [];
    while (j < blocks.length && blocks[j].rows.some(r => r.attic)) {
      blocks[j].rows.filter(r => r.attic).forEach(r => r.items.filter(it => it.k == 'K').forEach(it => ks.push(Object.assign(it, { x: blocks[j].X(it.col) }))));
      j++;
    }
    ks.sort((a, b) => a.x - b.x);
    const a = ks.length && ks[0].x, z = ks.length && ks[ks.length - 1].x;
    ks.forEach((it, n) => it.x = Math.round(a + (z - a) * n / (ks.length - 1 || 1) + (it.nudge || 0) * COL));
    i = Math.max(j, i + 1);
  }

  // cielo e montagna
  cv.rect(P.sky, 0, 0, cv.W, cv.H); cv.rect(P.sky2, 0, 14, cv.W, 20);
  for (let x = 0; x < cv.W; x++) cv.rect(P.mtn, x, 24 + Math.round(5 * Math.sin(x / 13)), 1, cv.H);

  blocks.forEach((b, bi) => {
    const { left, right } = b, w = right - left;
    // tetto: più alto dove c'è la mansarda
    // la mansarda è unica tra blocchi vicini: niente rientri dove continua nel blocco accanto
    const attic = bb => bb && bb.rows.some(r => r.attic);
    if (attic(b)) {
      const pl = attic(blocks[bi - 1]), nr = attic(blocks[bi + 1]);
      cv.rect(P.roof, left + (pl ? 0 : 8), WALL_TOP - 26, w - (pl ? 0 : 8) - (nr ? 0 : 8), 4);
      cv.rect(P.roof, left + (pl ? 0 : 3), WALL_TOP - 22, w - (pl ? 0 : 3) - (nr ? 0 : 3), 8);
    }
    const il = blocks[bi - 1] ? 0 : 2, ir = blocks[bi + 1] ? 0 : 2;
    cv.rect(P.roof, left + il, WALL_TOP - 14, w - il - ir, 4);
    cv.rect(P.roof, left - 2, WALL_TOP - 10, w + 4, 6);
    cv.rect(P.eave, left - 4, WALL_TOP - 4, w + 8, 3);
    for (let x = left - 2; x < right + 3; x += 4) cv.rect(P.rafter, x, WALL_TOP - 1, 1, 1);
    // muro fino alla strada, con zoccolo che segue la pendenza
    for (let x = left; x < right; x++) {
      const s = street(x);
      cv.rect(P.wall, x, WALL_TOP, 1, s - WALL_TOP);
      const top = Math.min(b.street, s) - 10;
      cv.rect(P.plinth, x, top, 1, s - top);
    }
    for (let i = 0; i < 260; i++) {
      const hx = Math.imul(i + bi * 977, 2654435761) >>> 0, hy = Math.imul(hx ^ (hx >>> 13), 2246822519) >>> 0;
      const x = left + hx % w, y = WALL_TOP + hy % (b.street - WALL_TOP);
      if (y < Math.min(b.street, street(x)) - 10) cv.rect(P.wallDark, x, y, 1, 1);
    }
    if (bi) cv.rect(P.wallDark, left, WALL_TOP, 1, b.street - WALL_TOP); // giunto tra blocchi
    // marcapiano sopra il piano terra del primo blocco (visto nelle foto)
    if (bi == 0) {
      const band = base(b.floors.length - 1) - 19;
      // finisce dopo le finestre F e G del piano terra (appartamento 1)
      const fg = b.floors[b.floors.length - 1].items.filter(it => it.k == "F" || it.k == "G");
      const bw = fg.length ? b.X(fg[fg.length - 1].col + (fg[fg.length - 1].nudge || 0)) + 7 - left : w;
      cv.rect(P.bord, left, band, bw, 1); cv.rect(P.brownDark, left, band + 1, bw, 2);
    }
  });

  // finestre, porte e pluviali, dopo tutti i muri: una porta può stare a cavallo tra due blocchi
  blocks.forEach(b => {
    const { left } = b;
    // piano terra basso e zoccolo: finestre allineate in alto, poco sotto l'ultimo piano pieno
    const n = b.floors.length;
    const top0 = base(b.ground ? n - 2 : n - 1) + 5;
    let j = 0;
    b.rows.forEach(r => {
      const low = r == b.ground || r.plinth;
      const y = r.attic ? WALL_TOP - 5 : low ? top0 + 13 : base(j);
      if (!r.attic && !r.plinth) j++;
      r.items.forEach(it => {
        const cx = it.x != null ? it.x : b.X(it.col + (it.nudge || 0));
        if (it.k == '|') return cv.rect(P.pipe, cx, WALL_TOP - 2, 1, street(cx) - WALL_TOP + 2);
        const t = A.TYPES[it.k];
        if (!t) return console.warn('lettera sconosciuta', it.k, 'in', b.name, r.label);
        // le finestrelle H stanno più in basso, a filo dello zoccolo
        // la finestra grande F scende fino allo zoccolo; il terrazzo L ha il pavimento a filo delle finestre
        const bottom = it.k == 'R' ? street(cx) - STEPS * 2
          : DOORS.includes(it.k) ? street(cx)
          : it.k == 'F' ? Math.min(b.street, street(cx)) - 10
          : it.k == 'L' ? y + 2
          : low ? top0 + t.h + (it.k == 'H' ? 7 : 0) : y;
        // terrazzo laterale: sporge dal muro del blocco dalla parte in cui è scritto
        // ingresso R fuori dal muro: appoggiato al palazzo, così la porta resta al centro del suo corpo
        const tx = it.k == 'L' ? (cx < left ? left - t.w : b.right)
          : it.k == 'R' && cx < left ? left - 24
          : cx - (t.w >> 1);
        // a destra il terrazzo è disegnato a specchio, attaccato al muro col lato sinistro
        const g = it.k == 'L' && cx >= left ? { rect: (c, x, y, w, h) => cv.rect(c, 2 * tx + t.w - x - w, y, w, h) } : cv;
        t.draw(g, tx, bottom - t.h);
        it.box = [tx, bottom - t.h, t.w, t.h];
        // l'ingresso R è rialzato: gradini in pietra tutti uguali, centrati sotto la porta
        if (it.k == 'R') {
          cv.rect(P.stoneDark, tx + 3, bottom, 21, STEPS * 2);
          for (let s = 0; s < STEPS; s++) {
            cv.rect(P.stone, tx + 6, bottom + s * 2, 15, 2);
            cv.rect(P.stoneDark, tx + 6, bottom + s * 2 + 1, 15, 1);
          }
        }
      });
      // una rastrelliera continua sotto ogni gruppo di finestre G vicine
      const gs = r.items.filter(it => it.k == 'G');
      let run = [];
      gs.forEach((it, k) => {
        run.push(it);
        if (k == gs.length - 1 || gs[k + 1].col - it.col > 3) {
          const xa = b.X(run[0].col + (run[0].nudge || 0)) - 7, xb = b.X(it.col + (it.nudge || 0)) + 7;
          A.rack(cv, xa, y - 4, xb - xa);
          run = [];
        }
      });
    });
  });

  // marciapiede e strada in pendenza
  for (let x = 0; x < cv.W; x++) {
    const s = street(x);
    cv.rect(P.walk, x, s, 1, 8);
    if ((x * 7) % 23 < 3) cv.rect(P.walkLine, x, s + 2 + x % 5, 1, 1);
    cv.rect(P.road, x, s + 8, 1, cv.H - s - 8);
  }
  return cv;
}

/* appartamenti: un riquadro colorato con il numero attorno alle finestre di ognuno */
const APT_COL = ['#ff5a5a', '#5ad1ff', '#ffd23a', '#7dff7a', '#ff8af0', '#ffa040', '#b48cff', '#5affd2', '#ff3f8f', '#d2ff5a', '#6f8cff', '#ffffff', '#00e0a0', '#ffb3b3', '#a0e0ff', '#e0c080', '#c080ff', '#80ff40'];
function drawApartments(cv, blocks) {
  const apts = new Map();
  blocks.forEach(b => b.rows.forEach(r => r.items.forEach(it => {
    if (!it.apt || !it.box) return;
    const a = apts.get(it.apt) || apts.set(it.apt, { boxes: [], shop: false }).get(it.apt);
    a.boxes.push(it.box);
    if (it.k == 'Q') a.shop = true;
  })));
  [...apts].forEach(([id, { boxes, shop }]) => {
    const c = APT_COL[parseInt(id, 36) % APT_COL.length]; // colore fisso per numero
    const x0 = Math.min(...boxes.map(q => q[0])) - 2, y0 = Math.min(...boxes.map(q => q[1])) - 2;
    const x1 = Math.max(...boxes.map(q => q[0] + q[2])) + 2, y1 = Math.max(...boxes.map(q => q[1] + q[3])) + 2;
    cv.rect(c + '40', x0, y0, x1 - x0, y1 - y0);
    cv.rect(c, x0, y0, x1 - x0, 1); cv.rect(c, x0, y1 - 1, x1 - x0, 1);
    cv.rect(c, x0, y0, 1, y1 - y0); cv.rect(c, x1 - 1, y0, 1, y1 - y0);
    // il negozio è in evidenza: bordo doppio e scritta NEGOZIO
    if (shop) {
      cv.rect(c, x0 + 2, y0 + 2, x1 - x0 - 4, 1); cv.rect(c, x0 + 2, y1 - 3, x1 - x0 - 4, 1);
      cv.rect(c, x0 + 2, y0 + 2, 1, y1 - y0 - 4); cv.rect(c, x1 - 3, y0 + 2, 1, y1 - y0 - 4);
    }
    const label = String(parseInt(id, 36)) + (shop ? ' NEGOZIO' : ''); // a = 10, b = 11, ...
    const lx = (x0 + x1 >> 1) - label.length * 2, ly = (y0 + y1 >> 1) - 3;
    cv.rect('#000000c0', lx - 1, ly - 1, label.length * 4 + 1, 7);
    A.text(cv, label, lx, ly, '#ffffff');
  });
  return cv;
}

const out = path.join(__dirname, '..', 'reference');
const blocks = parse(path.join(out, 'edificio.md'));
blocks.forEach(b => console.log(b.name, b.rows.map(r => r.label + ':' + r.items.map(it => it.k + '@' + it.col + (it.apt ? '#' + it.apt : '')).join(' ')).join(' | ')));
const cv = drawAll(blocks);
png(cv, path.join(out, 'edificio.png'));
png(drawApartments(cv, blocks), path.join(out, 'edificio-appartamenti.png'));
