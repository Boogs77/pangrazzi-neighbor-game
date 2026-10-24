/* Carattere pixel 3x5 completo (maiuscole, cifre, punteggiatura) per l'interfaccia.
   Le lettere accentate vengono scritte senza accento. g = {rect(colore,x,y,w,h)} */
(function (root) {
const GLYPHS = {
  A:'010101111101101', B:'110101110101110', C:'011100100100011', D:'110101101101110',
  E:'111100110100111', F:'111100110100100', G:'011100101101011', H:'101101111101101',
  I:'111010010010111', J:'001001001101010', K:'101101110101101', L:'100100100100111',
  M:'101111101101101', N:'111101101101101', O:'010101101101010', P:'110101110100100',
  Q:'010101101110011', R:'110101110101101', S:'011100010001110', T:'111010010010010',
  U:'101101101101111', V:'101101101101010', W:'101101111111101', X:'101101010101101',
  Y:'101101010010010', Z:'111001010100111',
  0:'111101101101111', 1:'010110010010111', 2:'111001111100111', 3:'111001111001111',
  4:'101101111001001', 5:'111100111001111', 6:'111100111101111', 7:'111001001001001',
  8:'111101111101111', 9:'111101111001111',
  '.':'000000000000010', ',':'000000000010100', "'":'010010000000000', '!':'010010010000010',
  '?':'110001010000010', '-':'000000111000000', '+':'000010111010000', ':':'000010000010000',
  '/':'001001010100100', '<':'001010100010001', '>':'100010001010100', '(':'001010010010001',
  ')':'100010010010100', '%':'101001010100101', '"':'101101000000000'
};

const clean = s => String(s).normalize('NFD').replace(/[̀-ͯ]/g, '').toUpperCase();

/* scrive s a partire da (x,y); scale = dimensione del pixel; restituisce la larghezza */
function text(g, s, x, y, c, scale = 1) {
  const x0 = x;
  for (const ch of clean(s)) {
    const f = GLYPHS[ch];
    if (f) for (let i = 0; i < 15; i++) if (f[i] == '1') g.rect(c, x + (i % 3) * scale, y + (i / 3 | 0) * scale, scale, scale);
    x += 4 * scale;
  }
  return x - x0 - scale;
}

const width = (s, scale = 1) => clean(s).length * 4 * scale - scale;

/* va a capo sulle parole entro max caratteri */
function wrap(s, max) {
  const out = [];
  let line = '';
  for (const w of clean(s).split(/\s+/)) {
    if (line && (line + ' ' + w).length > max) { out.push(line); line = w; }
    else line = line ? line + ' ' + w : w;
  }
  if (line) out.push(line);
  return out;
}

const api = { GLYPHS, text, width, wrap };
if (typeof module != 'undefined') module.exports = api; else root.PixelFont = api;
})(this);
