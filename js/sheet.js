// La partition : une vraie portee (cle de sol, cle de fa), qui defile en meme temps que les notes tombent,
// ou qui reste posee pour une lecon. Les notes ont les couleurs des mains (cyan a droite, violet a gauche),
// celle qu'on joue s'allume, les justes passent au vert, les ratees s'eteignent en rouge.
import { isBlack } from './notes.js';

const NS = 'http://www.w3.org/2000/svg';
const S = 9;                       // interligne
const TREBLE_TOP = 36;             // ligne du haut de la cle de sol
const BASS_TOP = 112;              // ligne du haut de la cle de fa
const LETTER = [0, 0, 1, 1, 2, 3, 3, 4, 4, 5, 5, 6];
const diatonic = (m) => (Math.floor(m / 12) - 1) * 7 + LETTER[m % 12];
// Cle de sol : ligne du bas = mi4 (30). Cle de fa : ligne du bas = sol2 (18).
const yOf = (m, clef) => (clef === 'G' ? TREBLE_TOP + 4 * S - (diatonic(m) - 30) * (S / 2) : BASS_TOP + 4 * S - (diatonic(m) - 18) * (S / 2));

function el(tag, attrs = {}, parent) {
  const n = document.createElementNS(NS, tag);
  for (const [k, v] of Object.entries(attrs)) n.setAttribute(k, v);
  parent?.appendChild(n);
  return n;
}

// Figure de note la plus proche pour une duree en temps
function figure(dur) {
  const table = [[4, 'ronde', 0, 0], [3, 'blanche', 1, 0], [2, 'blanche', 0, 0], [1.5, 'noire', 1, 0], [1, 'noire', 0, 0],
    [0.75, 'croche', 1, 1], [0.5, 'croche', 0, 1], [0.25, 'double', 0, 2]];
  let best = table[0];
  for (const t of table) if (Math.abs(t[0] - dur) < Math.abs(best[0] - dur)) best = t;
  return { kind: best[1], dot: !!best[2], flags: best[3], hollow: best[1] === 'ronde' || best[1] === 'blanche', stem: best[1] !== 'ronde' };
}

// Silences dessines (plus nets que les glyphes d'une police) : pause, demi-pause, soupir, demi-soupir
function rest(g, x, staffTop, len) {
  const mid = staffTop + 2 * S;
  if (len >= 4) return el('rect', { class: 'rest', x: x - 5, y: staffTop + S, width: 10, height: S * 0.5 }, g);
  if (len >= 2) return el('rect', { class: 'rest', x: x - 5, y: mid - S * 0.5, width: 10, height: S * 0.5 }, g);
  if (len >= 1) {
    return el('path', { class: 'rest', d: `M ${x - 2} ${mid - 13} l 5.5 6 l -4.5 5.5 l 5 6 c -4.5 -2.2 -7.5 0.5 -3.5 5 c -6.5 -3.5 -5 -9.2 0 -7.6 l -5.5 -6.4 l 4.2 -4.8 z` }, g);
  }
  const grp = el('g', { class: 'rest' }, g);
  el('circle', { cx: x - 2.5, cy: mid - 3, r: 2.3 }, grp);
  el('path', { d: `M ${x - 2.5} ${mid - 1.2} c 3 1.2 5 0 6.5 -3.5 l -4.8 13 l -1.4 -0.4 l 4.2 -10.8 c -1.6 1.8 -3 2.4 -4.5 1.7 z` }, grp);
  return grp;
}

export class Sheet {
  // score : partition de js/score.js ; mode 'scroll' (defile avec le temps) ou 'static' (lecon)
  constructor(container, score, { mode = 'scroll', ppb = 58, hands = null } = {}) {
    this.container = container;
    this.score = score;
    this.mode = mode;
    this.ppb = ppb;
    const hasR = score.events.some((e) => e.hand === 'R');
    const hasL = score.events.some((e) => e.hand === 'L');
    this.staves = hands || (hasR && hasL ? 'GF' : hasL ? 'F' : 'G');
    this.heads = new Map();          // indice d'evenement -> groupe SVG
    this.x0 = 74;
    this.cursorX = 150;              // ou se trouve « maintenant » sur la portee qui defile
    this.#build();
  }

  #clefFor(e) {
    if (this.staves === 'G') return 'G';
    if (this.staves === 'F') return 'F';
    return e.hand === 'L' ? 'F' : 'G';
  }

  #build() {
    const { score } = this;
    const total = score.total || 4;
    const width = this.x0 + total * this.ppb + 60;
    const top = this.staves.includes('G') ? 0 : BASS_TOP - TREBLE_TOP;
    const bottom = this.staves.includes('F') ? BASS_TOP + 4 * S + 34 : TREBLE_TOP + 4 * S + 34;
    this.height = bottom - top;
    this.viewTop = top;

    const wrap = document.createElement('div');
    wrap.className = `sheet ${this.mode}`;
    this.wrap = wrap;

    // En-tete fixe : cles et chiffrage (ne defile pas)
    const head = el('svg', { class: 'sheet-head', viewBox: `0 ${top} ${this.x0} ${this.height}`, width: this.x0, height: this.height });
    this.#staffLines(head, this.x0);
    if (this.staves.includes('G')) el('text', { class: 'clef', x: 8, y: TREBLE_TOP + 4 * S + 8, 'font-size': 54 }, head).textContent = '\u{1D11E}';
    if (this.staves.includes('F')) el('text', { class: 'clef', x: 9, y: BASS_TOP + 2.6 * S, 'font-size': 35 }, head).textContent = '\u{1D122}';
    const [num, den] = String(score.mesure || '4/4').split('/');
    for (const staffTop of [this.staves.includes('G') ? TREBLE_TOP : null, this.staves.includes('F') ? BASS_TOP : null]) {
      if (staffTop == null) continue;
      el('text', { class: 'meter', x: 52, y: staffTop + 2 * S - 1 }, head).textContent = num;
      el('text', { class: 'meter', x: 52, y: staffTop + 4 * S - 1 }, head).textContent = den;
    }
    if (this.staves === 'GF') el('line', { class: 'brace', x1: 3, y1: TREBLE_TOP, x2: 3, y2: BASS_TOP + 4 * S }, head);

    // Corps : les notes, qui defilent (ou se parcourent pour une lecon)
    const body = el('svg', { class: 'sheet-body', viewBox: `0 ${top} ${width} ${this.height}`, width, height: this.height });
    this.#staffLines(body, width);
    const g = el('g', {}, body);
    this.track = g;

    // Barres de mesure
    const bars = score.bars.R.length ? score.bars.R : score.bars.L;
    let acc = 0;
    bars.forEach((b, i) => {
      acc += b;
      if (i === bars.length - 1) return;
      const x = this.x0 + acc * this.ppb - this.ppb * 0.32;
      el('line', { class: 'bar', x1: x, y1: this.staves.includes('G') ? TREBLE_TOP : BASS_TOP, x2: x, y2: this.staves.includes('F') ? BASS_TOP + 4 * S : TREBLE_TOP + 4 * S }, g);
    });
    const endX = this.x0 + total * this.ppb - this.ppb * 0.32;
    el('line', { class: 'bar end', x1: endX, y1: this.staves.includes('G') ? TREBLE_TOP : BASS_TOP, x2: endX, y2: this.staves.includes('F') ? BASS_TOP + 4 * S : TREBLE_TOP + 4 * S }, g);

    // Silences : la ou une main ne joue rien
    for (const hand of ['R', 'L']) {
      const evs = score.events.filter((e) => e.hand === hand);
      if (!evs.length) continue;
      const clef = hand === 'L' ? 'F' : 'G';
      if (!this.staves.includes(clef)) continue;
      let t = 0;
      const gaps = [];
      evs.forEach((e) => { if (e.start - t > 0.2) gaps.push([t, e.start - t]); t = Math.max(t, e.start + e.dur); });
      if (total - t > 0.2) gaps.push([t, total - t]);
      for (const [at, len] of gaps) {
        // Un silence par mesure entiere, sinon un seul signe pour le trou
        let t0 = at;
        let left = len;
        while (left > 0.2) {
          const v = [4, 2, 1, 0.5].find((d) => left >= d - 0.01) || 0.5;
          rest(g, this.x0 + t0 * this.ppb, clef === 'G' ? TREBLE_TOP : BASS_TOP, v);
          t0 += v;
          left -= v;
        }
      }
    }

    // Notes : une tete par note, une hampe par accord
    const groups = new Map();
    score.events.forEach((e, i) => {
      const k = `${e.start}|${e.hand}`;
      if (!groups.has(k)) groups.set(k, []);
      groups.get(k).push({ e, i });
    });
    for (const list of groups.values()) this.#chord(g, list);

    const scroller = document.createElement('div');
    scroller.className = 'sheet-scroller';
    scroller.appendChild(body);
    wrap.style.setProperty('--sheet-h', `${this.height}px`);
    wrap.append(scroller, head);
    this.container.innerHTML = '';
    this.container.appendChild(wrap);
    this.body = body;
    this.scroller = scroller;
    if (this.mode === 'scroll') {
      this.cursor = document.createElement('i');
      this.cursor.className = 'sheet-cursor';
      this.cursor.style.left = `${this.cursorX}px`;
      wrap.appendChild(this.cursor);
    }
    this.width = width;
    this.setTime(this.mode === 'scroll' ? -2 : 0);
  }

  #staffLines(svg, width) {
    const tops = [];
    if (this.staves.includes('G')) tops.push(TREBLE_TOP);
    if (this.staves.includes('F')) tops.push(BASS_TOP);
    for (const t of tops) for (let i = 0; i < 5; i++) el('line', { class: 'staff-line', x1: 0, y1: t + i * S, x2: width, y2: t + i * S }, svg);
  }

  #chord(g, list) {
    const e0 = list[0].e;
    const clef = this.#clefFor(e0);
    const fig = figure(e0.dur);
    const x = this.x0 + e0.start * this.ppb;
    const ys = list.map(({ e }) => yOf(e.midi, clef));
    const staffTop = clef === 'G' ? TREBLE_TOP : BASS_TOP;
    const middle = staffTop + 2 * S;
    const avg = ys.reduce((a, b) => a + b, 0) / ys.length;
    const up = avg >= middle;
    const grp = el('g', { class: `note ${e0.hand === 'L' ? 'left' : 'right'}` }, g);

    // Lignes supplementaires
    const ledgers = new Set();
    for (const y of ys) {
      for (let ly = staffTop + 5 * S; ly <= y + 0.1; ly += S) ledgers.add(ly);
      for (let ly = staffTop - S; ly >= y - 0.1; ly -= S) ledgers.add(ly);
    }
    for (const ly of ledgers) el('line', { class: 'ledger', x1: x - 9, y1: ly, x2: x + 9, y2: ly }, grp);

    // Hampe et crochets
    if (fig.stem) {
      const yTip = up ? Math.min(...ys) - 3.4 * S : Math.max(...ys) + 3.4 * S;
      const yBase = up ? Math.max(...ys) : Math.min(...ys);
      const sx = up ? x + 5 : x - 5;
      el('line', { class: 'stem', x1: sx, y1: yBase, x2: sx, y2: yTip }, grp);
      for (let f = 0; f < fig.flags; f++) {
        const fy = yTip + (up ? f * 6 : -f * 6);
        const d = up
          ? `M ${sx} ${fy} c 1 6 9 7 8 15 c 3 -7 -3 -12 -8 -14 z`
          : `M ${sx} ${fy} c 1 -6 9 -7 8 -15 c 3 7 -3 12 -8 14 z`;
        el('path', { class: 'flag', d }, grp);
      }
    }

    list.forEach(({ e, i }, k) => {
      const y = ys[k];
      const head = el('g', { class: 'head-wrap' }, grp);
      el('ellipse', { class: `head ${fig.hollow ? 'hollow' : ''}`, cx: x, cy: y, rx: 5.6, ry: 4.1, transform: `rotate(-20 ${x} ${y})` }, head);
      if (isBlack(e.midi)) el('text', { class: 'acc', x: x - 15, y: y + 4.5 }, head).textContent = '♯';
      if (fig.dot) {
        const onLine = Math.round((y - staffTop) / (S / 2)) % 2 === 0;
        el('circle', { class: 'dot', cx: x + 9, cy: onLine ? y - S / 2 : y, r: 1.5 }, head);
      }
      if (e.finger && this.mode === 'static') el('text', { class: 'finger', x, y: up ? Math.max(...ys) + 14 : Math.min(...ys) - 9 }, head).textContent = e.finger;
      this.heads.set(i, head);
    });
  }

  // Position de lecture (en temps) : en mode defilement, la partition glisse sous le curseur
  setTime(beat) {
    this.now = beat;
    if (this.mode !== 'scroll') return;
    const shift = this.cursorX - (this.x0 + beat * this.ppb);
    this.body.style.transform = `translate3d(${shift.toFixed(1)}px,0,0)`;
    for (const [i, h] of this.heads) {
      const e = this.score.events[i];
      h.classList.toggle('sounding', beat >= e.start - 0.02 && beat < e.start + e.dur);
    }
  }

  // Marque une note jouee (ok) ou ratee
  mark(i, ok) {
    const h = this.heads.get(i);
    if (!h) return;
    h.classList.remove('ok', 'ko');
    h.classList.add(ok ? 'ok' : 'ko');
  }

  // La note (ou l'accord) a jouer maintenant : elle brille, et la partition la garde en vue
  focus(indices = []) {
    for (const h of this.heads.values()) h.classList.remove('now');
    indices.forEach((i) => this.heads.get(i)?.classList.add('now'));
    if (this.mode === 'static' && indices.length) {
      const e = this.score.events[indices[0]];
      const x = this.x0 + e.start * this.ppb;
      const target = Math.max(0, x - this.scroller.clientWidth * 0.4);
      this.scroller.scrollTo?.({ left: target, behavior: 'smooth' });
    }
  }

  reset() {
    for (const h of this.heads.values()) h.classList.remove('ok', 'ko', 'now', 'sounding');
  }

  dispose() {
    this.container.innerHTML = '';
  }
}
