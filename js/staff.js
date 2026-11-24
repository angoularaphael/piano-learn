// Une portee en SVG : cle de sol ou de fa, une note (ronde), lignes supplementaires si besoin.
import { isBlack } from './notes.js';

const STEP = 5;          // demi-interligne
const BOTTOM = 80;       // y de la ligne du bas
const LETTER = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6]; // degre (do=0 ... si=6) de chaque demi-ton

// Numero diatonique d'une note (do4 = 28) ; une touche noire prend le degre de la blanche juste en dessous
function diatonic(midi) {
  const octave = Math.floor(midi / 12) - 1;
  return octave * 7 + LETTER[midi % 12];
}

// Cle de sol : ligne du bas = mi4 (30). Cle de fa : ligne du bas = sol2 (18).
const REF = { sol: 30, fa: 18 };

export function clefFor(midi) {
  return midi >= 60 ? 'sol' : 'fa';
}

export function staffSVG(midi, clef = clefFor(midi), { label = '' } = {}) {
  const d = diatonic(midi);
  const y = BOTTOM - (d - REF[clef]) * STEP;
  const x = 128;
  const lines = [0, 1, 2, 3, 4].map((i) => `<line x1="10" y1="${BOTTOM - i * 10}" x2="190" y2="${BOTTOM - i * 10}" />`).join('');
  // Lignes supplementaires au-dessus ou en dessous de la portee
  const ledgers = [];
  for (let ly = BOTTOM + 10; ly <= y + 0.1; ly += 10) ledgers.push(ly);
  for (let ly = BOTTOM - 50; ly >= y - 0.1; ly -= 10) ledgers.push(ly);
  const ledger = ledgers.map((ly) => `<line class="ledger" x1="${x - 13}" y1="${ly}" x2="${x + 13}" y2="${ly}" />`).join('');
  const sharp = isBlack(midi) ? `<text class="acc" x="${x - 24}" y="${y + 6}">♯</text>` : '';
  const glyph = clef === 'sol'
    ? '<text class="clef" x="12" y="86" font-size="66">𝄞</text>'
    : '<text class="clef" x="14" y="66" font-size="40">𝄢</text>';
  return `<svg class="staff" viewBox="0 0 200 120" role="img" aria-label="${label || 'Une note sur la portée'}">
    <g class="lines">${lines}</g>${glyph}${ledger}${sharp}
    <ellipse class="head" cx="${x}" cy="${y}" rx="7.2" ry="5.1" transform="rotate(-18 ${x} ${y})" />
    <ellipse class="hole" cx="${x}" cy="${y}" rx="3.6" ry="2.2" transform="rotate(-52 ${x} ${y})" />
  </svg>`;
}
