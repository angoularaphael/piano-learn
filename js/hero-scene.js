// La planche de l'accueil : un clavier dessine au crayon, en vraie perspective.
// - Il se dessine sous tes yeux : les lignes de construction d'abord, puis chaque touche, du do du
//   milieu vers les deux bouts, avec les debords de trait d'un dessin a main levee.
// - La Lettre a Elise se joue toute seule : la touche jouee se colore au crayon, s'encre (ivoire,
//   ebene) et garde l'encre ; le prof ecrit son nom dessus, comme sur la gommette d'un debutant.
//   Rouge pour la main droite, bleu pour la main gauche (sous le do du milieu).
// - Les touches que l'eleve connait deja sont encrees d'avance : la planche montre SON clavier.
// - La souris (ou le doigt) joue les touches ; la perspective suit le curseur et le defilement.
// Dessin 2D (Canvas) d'apres une projection 3D faite ici : ni WebGL, ni image a telecharger.
import { isBlack, noteName } from './notes.js';
import { noteOn, noteOff } from './audio.js';
import { lang } from './i18n.js';
import { PAL } from './palette.js';

// Debut de la Lettre a Elise, en boucle
const MELODY = [
  [76, 1], [75, 1], [76, 1], [75, 1], [76, 1], [71, 1], [74, 1], [72, 1], [69, 3],
  [60, 1], [64, 1], [69, 1], [71, 3], [64, 1], [68, 1], [71, 1], [72, 3],
  [64, 1], [76, 1], [75, 1], [76, 1], [75, 1], [76, 1], [71, 1], [74, 1], [72, 1], [69, 3],
  [60, 1], [64, 1], [69, 1], [71, 3], [64, 1], [72, 1], [71, 1], [69, 4],
];
const BEAT = 280;

// Proportions d'un vrai clavier, en largeurs de touche blanche (2,35 cm)
const G = { gap: 0.07, len: 6.3, h: 0.62, bw: 0.56, bt: 0.42, bh: 0.46, blen: 4.05, slope: 0.42, rail: 1.25, cheek: 0.7 };
// Les noires ne sont pas centrees sur la fente : do# et fa# penchent a gauche, re# et la# a droite
const BLACK_SHIFT = { 1: -0.1, 3: 0.1, 6: -0.14, 8: 0, 10: 0.14 };
const ZB = -G.len / 2;
const ZF = G.len / 2;

const PAPER = '#f8f4ec';
const IVORY = '#fffdf8';
const IVORY_SHADE = '#e2d8c6';
const EBONY = '#211b17';
const EBONY_SIDE = '#100d0b';
const SERIF = '"Bodoni Moda", "Bodoni 72", Didot, Georgia, serif';

const clamp01 = (v) => (v < 0 ? 0 : v > 1 ? 1 : v);
const hash = (i) => {
  const s = Math.sin(i * 127.1 + 311.7) * 43758.5453;
  return s - Math.floor(s);
};

// Le grain du graphite : un motif de bruit, fixe sur le papier comme une vraie mine
function graphite(g) {
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const x = c.getContext('2d');
  const img = x.createImageData(96, 96);
  for (let i = 0; i < 96 * 96; i++) {
    img.data[i * 4] = 50;
    img.data[i * 4 + 1] = 46;
    img.data[i * 4 + 2] = 42;
    img.data[i * 4 + 3] = 130 + Math.random() * 125;
  }
  x.putImageData(img, 0, 0);
  return g.createPattern(c, 'repeat');
}

// Les touches, une fois pour toutes, en coordonnees du clavier
function buildKeys(low, high) {
  const whites = [];
  for (let m = low; m <= high; m++) if (!isBlack(m)) whites.push(m);
  const n = whites.length;
  const index = new Map(whites.map((m, i) => [m, i]));
  const keys = [];
  for (let m = low; m <= high; m++) {
    const base = {
      m, press: 0, held: false, flash: 0, color: m < 60 ? PAL.left : PAL.right,
      ink: 0, inkTo: 0, label: null, poly: [], seed: m * 7.31,
    };
    if (!isBlack(m)) {
      const i = index.get(m);
      keys.push({ ...base, black: false, x0: i - n / 2 + G.gap / 2, x1: i + 1 - n / 2 - G.gap / 2, cx: i + 0.5 - n / 2 });
    } else if (index.has(m - 1)) {
      const cx = index.get(m - 1) + 1 - n / 2 + BLACK_SHIFT[m % 12];
      keys.push({ ...base, black: true, cx });
    }
  }
  return { n, keys, byMidi: new Map(keys.map((k) => [k.m, k])) };
}

function makeCamera(yaw, pitch, dist, tgt) {
  const cp = Math.cos(pitch);
  const eye = [tgt[0] + dist * cp * Math.sin(yaw), tgt[1] + dist * Math.sin(pitch), tgt[2] + dist * cp * Math.cos(yaw)];
  const f = [tgt[0] - eye[0], tgt[1] - eye[1], tgt[2] - eye[2]];
  const fl = Math.hypot(f[0], f[1], f[2]);
  f[0] /= fl; f[1] /= fl; f[2] /= fl;
  const r = [-f[2], 0, f[0]];
  const rl = Math.hypot(r[0], r[2]);
  r[0] /= rl; r[2] /= rl;
  const u = [r[1] * f[2] - r[2] * f[1], r[2] * f[0] - r[0] * f[2], r[0] * f[1] - r[1] * f[0]];
  return { eye, f, r, u };
}

function inside(poly, x, y) {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i];
    const [xj, yj] = poly[j];
    if ((yi > y) !== (yj > y) && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

export function createHeroScene(container, { unfold = false, known = [] } = {}) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const canvas = document.createElement('canvas');
  canvas.setAttribute('aria-hidden', 'true');
  canvas.style.touchAction = 'pan-y';
  container.appendChild(canvas);
  const g = canvas.getContext('2d');
  if (!g) return { dispose() { canvas.remove(); }, unfold() {} };
  const grain = graphite(g);
  const knownSet = new Set(known);

  let W = 1;
  let H = 1;
  let dpr = 1;
  let model = null;
  let F = 1;
  let ox = 0;
  let oy = 0;
  let cam = null;
  let speed = unfold ? 1 : 0.5;
  let drawT = reduced ? 1e9 : 0;
  let drawEnd = 3;

  const view = { yaw: 0.2, pitch: 0.8, mx: 0, my: 0, sx: 0, sy: 0 };
  const TARGET = [0, -0.2, 0.6];
  const DIST = 62;

  function project(x, y, z) {
    const dx = x - cam.eye[0];
    const dy = y - cam.eye[1];
    const dz = z - cam.eye[2];
    const cz = dx * cam.f[0] + dy * cam.f[1] + dz * cam.f[2];
    const cx = dx * cam.r[0] + dy * cam.r[1] + dz * cam.r[2];
    const cy = dx * cam.u[0] + dy * cam.u[1] + dz * cam.u[2];
    return [ox + (cx / cz) * F, oy - (cy / cz) * F];
  }

  // Le clavier tient dans la planche, avec de l'air autour ; calcule une fois par taille
  function layout() {
    const w = container.clientWidth || 1;
    const h = container.clientHeight || 1;
    dpr = Math.min(window.devicePixelRatio || 1, 2);
    W = Math.round(w * dpr);
    H = Math.round(h * dpr);
    canvas.width = W;
    canvas.height = H;
    canvas.style.width = `${w}px`;
    canvas.style.height = `${h}px`;
    const narrow = w < 560;
    const [low, high] = narrow ? [53, 79] : [48, 84];
    if (!model || model.low !== low) {
      const old = model;
      model = { ...buildKeys(low, high), low };
      for (const k of model.keys) {
        const prev = old?.byMidi.get(k.m);
        k.ink = k.inkTo = prev ? prev.inkTo : knownSet.has(k.m) ? 1 : 0;
      }
      // Fin du dessin : la derniere touche, la plus loin du do du milieu
      const far = Math.max(...model.keys.map((k) => Math.abs(k.cx - model.byMidi.get(60).cx)));
      drawEnd = 1.2 + far * 0.05 + 0.5;
    }
    cam = makeCamera(view.yaw, view.pitch, DIST, TARGET);
    F = 1;
    ox = 0;
    oy = 0;
    const half = model.n / 2 + G.cheek;
    const pts = [];
    for (const x of [-half, half]) {
      for (const [y, z] of [[G.rail, ZB - 1.2], [-G.h, ZF + 0.9], [-G.h, ZF], [G.rail, ZB]]) pts.push(project(x, y, z));
    }
    const xs = pts.map((p) => p[0]);
    const ys = pts.map((p) => p[1]);
    const bw = Math.max(...xs) - Math.min(...xs);
    const bh = Math.max(...ys) - Math.min(...ys);
    // Le clavier deborde un peu la planche, comme un detail recadre dans une gravure
    F = Math.min((W * 1.08) / bw, (H * 0.86) / bh);
    ox = W / 2 - ((Math.max(...xs) + Math.min(...xs)) / 2) * F;
    oy = H / 2 - ((Math.max(...ys) + Math.min(...ys)) / 2) * F + H * 0.03;
  }

  // ---------- Les traits ----------
  // Trait de crayon : une mine effilee aux deux bouts, qui deborde un peu des angles, a peine courbe
  function pencil(a, b, { w = 1.7, over = 5, alpha = 0.92, p = 1, seed = 0 } = {}) {
    if (p <= 0 || alpha <= 0.01) return;
    let dx = b[0] - a[0];
    let dy = b[1] - a[1];
    const len = Math.hypot(dx, dy);
    if (len < 0.5) return;
    dx /= len;
    dy /= len;
    const nx = -dy;
    const ny = dx;
    const o = over * dpr * (0.6 + hash(seed) * 0.8);
    const sx = a[0] - dx * o;
    const sy = a[1] - dy * o;
    const L = (len + o * (1 + hash(seed + 1))) * p;
    const ex = sx + dx * L;
    const ey = sy + dy * L;
    const bow = (hash(seed + 2) - 0.5) * 1.4 * dpr;
    const hw = w * dpr;
    const mx = (sx + ex) / 2 + nx * bow;
    const my = (sy + ey) / 2 + ny * bow;
    g.globalAlpha = alpha;
    g.fillStyle = grain;
    g.beginPath();
    g.moveTo(sx, sy);
    g.quadraticCurveTo(mx + nx * hw, my + ny * hw, ex, ey);
    g.quadraticCurveTo(mx - nx * hw, my - ny * hw, sx, sy);
    g.fill();
  }

  function ink(a, b, alpha, w = 1.35) {
    if (alpha <= 0.01) return;
    g.globalAlpha = alpha;
    g.strokeStyle = PAL.ink;
    g.lineWidth = w * dpr;
    g.beginPath();
    g.moveTo(a[0], a[1]);
    g.lineTo(b[0], b[1]);
    g.stroke();
  }

  // Une arete : crayon tant que la touche n'est pas encree, encre ensuite
  function edge(a, b, k, p, i) {
    pencil(a, b, { p, alpha: 0.92 * (1 - k.ink), seed: k.seed + i * 3 });
    if (p >= 1) ink(a, b, k.ink);
  }

  function fill(poly, color, alpha) {
    if (alpha <= 0.01) return;
    g.globalAlpha = alpha;
    g.fillStyle = color;
    g.beginPath();
    poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.fill();
  }

  // Hachures dans une face : des traits paralleles, comme a la mine tenue de biais
  function hatch(poly, { angle = Math.PI / 4, gap = 3.2, alpha = 0.5, color = null, p = 1, w = 0.7 } = {}) {
    if (alpha <= 0.01 || p <= 0) return;
    const xs = poly.map((q) => q[0]);
    const ys = poly.map((q) => q[1]);
    const x0 = Math.min(...xs);
    const x1 = Math.max(...xs);
    const y0 = Math.min(...ys);
    const y1 = Math.max(...ys);
    const cx = (x0 + x1) / 2;
    const cy = (y0 + y1) / 2;
    const R = Math.hypot(x1 - x0, y1 - y0) / 2 + 2;
    const ca = Math.cos(angle);
    const sa = Math.sin(angle);
    const step = gap * dpr;
    g.save();
    g.beginPath();
    poly.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y)));
    g.closePath();
    g.clip();
    g.globalAlpha = alpha;
    g.strokeStyle = color || grain;
    g.lineWidth = w * dpr;
    g.beginPath();
    const count = Math.ceil((2 * R) / step);
    const shown = Math.ceil(count * p);
    for (let i = 0; i < shown; i++) {
      const d = -R + i * step;
      const px = cx - sa * d;
      const py = cy + ca * d;
      g.moveTo(px - ca * R, py - sa * R);
      g.lineTo(px + ca * R, py + sa * R);
    }
    g.stroke();
    g.restore();
  }

  // ---------- Le dessin ----------
  const prog = (start, dur) => clamp01((drawT - start * speed) / (dur * speed));

  function drawWhite(k, c4) {
    const p = prog(0.55 + Math.abs(k.cx - c4) * 0.05, 0.42);
    if (p <= 0) { k.poly = []; return; }
    const drop = k.press * 0.26;
    const yAt = (z) => -drop * ((z - ZB) / (ZF - ZB));
    const tl = project(k.x0, yAt(ZB), ZB);
    const tr = project(k.x1, yAt(ZB), ZB);
    const fr = project(k.x1, yAt(ZF), ZF);
    const fl = project(k.x0, yAt(ZF), ZF);
    const br = project(k.x1, yAt(ZF) - G.h, ZF);
    const bl = project(k.x0, yAt(ZF) - G.h, ZF);
    const top = [tl, tr, fr, fl];
    const front = [fl, fr, br, bl];
    k.poly = [top, front];
    const f = clamp01((p - 0.35) * 2.2);
    fill(top, PAPER, f);
    fill(front, PAPER, f);
    fill(top, IVORY, f * k.ink);
    fill(front, IVORY_SHADE, f * k.ink * 0.9);
    if (k.flash > 0.01) {
      fill(top, k.color, 0.12 * k.flash);
      hatch(top, { angle: -0.9, gap: 2.6, alpha: 0.85 * k.flash, color: k.color, w: 0.9 });
    }
    // Les aretes, dans l'ordre ou on les tracerait
    const s = (i) => clamp01(p * 5 - i);
    edge(fl, fr, k, s(0), 0);
    edge(tl, fl, k, s(1), 1);
    edge(tr, fr, k, s(1.4), 2);
    edge(fl, bl, k, s(2.4), 3);
    edge(fr, br, k, s(2.8), 4);
    edge(bl, br, k, s(3.6), 5);
  }

  function drawBlack(k, c4) {
    const p = prog(1.0 + Math.abs(k.cx - c4) * 0.05, 0.4);
    if (p <= 0) { k.poly = []; return; }
    const drop = k.press * 0.2;
    const zt = ZB + G.blen - G.slope; // bord avant du dessus
    const zf = ZB + G.blen;           // pied de la pente
    const yAt = (z) => -drop * ((z - ZB) / (zf - ZB));
    const L0 = k.cx - G.bt / 2;
    const L1 = k.cx + G.bt / 2;
    const B0 = k.cx - G.bw / 2;
    const B1 = k.cx + G.bw / 2;
    const t0 = project(L0, G.bh + yAt(ZB), ZB);
    const t1 = project(L1, G.bh + yAt(ZB), ZB);
    const t2 = project(L1, G.bh + yAt(zt), zt);
    const t3 = project(L0, G.bh + yAt(zt), zt);
    const f2 = project(B1, yAt(zf), zf);
    const f3 = project(B0, yAt(zf), zf);
    const b1 = project(B1, yAt(ZB), ZB);
    const b0 = project(B0, yAt(ZB), ZB);
    const top = [t0, t1, t2, t3];
    const front = [t3, t2, f2, f3];
    // Le flanc tourne vers le regard
    const right = cam.eye[0] > k.cx;
    const side = right ? [t1, t2, f2, b1] : [t0, t3, f3, b0];
    k.poly = [top, front, side];
    const f = clamp01((p - 0.3) * 2.2);
    fill(side, PAPER, f);
    fill(front, PAPER, f);
    fill(top, PAPER, f);
    const sketch = 1 - k.ink;
    hatch(side, { angle: 0.8, gap: 2, alpha: 0.7 * sketch * f, p });
    hatch(side, { angle: -0.8, gap: 2, alpha: 0.55 * sketch * f, p });
    hatch(front, { angle: 0.8, gap: 2.1, alpha: 0.65 * sketch * f, p });
    hatch(front, { angle: -0.8, gap: 2.1, alpha: 0.5 * sketch * f, p });
    hatch(top, { angle: 0.8, gap: 2.5, alpha: 0.6 * sketch * f, p });
    fill(side, EBONY_SIDE, f * k.ink);
    fill(front, EBONY_SIDE, f * k.ink);
    fill(top, EBONY, f * k.ink);
    if (k.flash > 0.01) fill(top, k.color, 0.9 * k.flash);
    const s = (i) => clamp01(p * 5 - i);
    edge(t0, t1, k, s(0), 0);
    edge(t1, t2, k, s(0.6), 1);
    edge(t3, t2, k, s(1.2), 2);
    edge(t0, t3, k, s(1.6), 3);
    edge(t3, f3, k, s(2.4), 4);
    edge(t2, f2, k, s(2.8), 5);
    edge(f3, f2, k, s(3.4), 6);
    // Un fil de lumiere sur l'arete avant d'une noire encree : le vernis
    if (k.ink > 0.5 && p >= 1) {
      g.globalAlpha = 0.35 * k.ink;
      g.strokeStyle = PAPER;
      g.lineWidth = 0.8 * dpr;
      g.beginPath();
      g.moveTo(t3[0], t3[1]);
      g.lineTo(t2[0], t2[1]);
      g.stroke();
    }
  }

  // La caisse : le cylindre derriere les touches, et les deux joues
  function drawBody() {
    const half = model.n / 2;
    const p = prog(0.25, 0.7);
    if (p <= 0) return;
    const k = { ink: 0, seed: 991 };
    const a = project(-half - G.cheek, G.rail, ZB - 0.05);
    const b = project(half + G.cheek, G.rail, ZB - 0.05);
    const c = project(half + G.cheek, 0, ZB - 0.05);
    const d = project(-half - G.cheek, 0, ZB - 0.05);
    const a2 = project(-half - G.cheek, G.rail, ZB - 1.3);
    const b2 = project(half + G.cheek, G.rail, ZB - 1.3);
    fill([a, b, c, d], PAPER, clamp01(p * 2));
    fill([a2, b2, b, a], PAPER, clamp01(p * 2));
    hatch([a2, b2, b, a], { angle: 0.12, gap: 3.4, alpha: 0.22, p });
    edge(a, b, k, p, 0);
    edge(a2, b2, k, clamp01(p * 1.4 - 0.3), 1);
    edge(a2, a, k, clamp01(p * 2 - 0.6), 2);
    edge(b2, b, k, clamp01(p * 2 - 0.8), 3);
  }

  function drawCheeks() {
    const half = model.n / 2;
    const p = prog(0.7, 0.6);
    if (p <= 0) return;
    for (const [s, x0, x1] of [[-1, -half - G.cheek, -half - 0.04], [1, half + 0.04, half + G.cheek]]) {
      const k = { ink: 0, seed: s > 0 ? 501 : 701 };
      const y1 = 0.95;
      const t0 = project(x0, y1, ZB);
      const t1 = project(x1, y1, ZB);
      const t2 = project(x1, y1, ZF + 0.15);
      const t3 = project(x0, y1, ZF + 0.15);
      const b2 = project(x1, -G.h, ZF + 0.15);
      const b3 = project(x0, -G.h, ZF + 0.15);
      // La face interieure, tournee vers les touches
      const ix = s < 0 ? x1 : x0;
      const i0 = project(ix, y1, ZB);
      const i1 = project(ix, y1, ZF + 0.15);
      const i2 = project(ix, -G.h, ZF + 0.15);
      const i3 = project(ix, 0, ZB);
      const innerVisible = s < 0 ? cam.eye[0] > ix : cam.eye[0] < ix;
      const f = clamp01((p - 0.3) * 2);
      if (innerVisible) {
        fill([i0, i1, i2, i3], PAPER, f);
        hatch([i0, i1, i2, i3], { angle: 1.2, gap: 2.8, alpha: 0.35 * f, p });
      }
      fill([t0, t1, t2, t3], PAPER, f);
      fill([t3, t2, b2, b3], PAPER, f);
      hatch([t3, t2, b2, b3], { angle: 0.9, gap: 3.6, alpha: 0.18 * f, p });
      const q = (i) => clamp01(p * 4 - i);
      edge(t0, t1, k, q(0), 0);
      edge(t1, t2, k, q(0.5), 1);
      edge(t0, t3, k, q(0.8), 2);
      edge(t3, t2, k, q(1.4), 3);
      edge(t3, b3, k, q(2), 4);
      edge(t2, b2, k, q(2.3), 5);
      edge(b3, b2, k, q(2.8), 6);
      if (innerVisible) edge(i1, i2, k, q(2.6), 7);
    }
  }

  // Les lignes de construction : tirees a la regle, au-dela du clavier, tres legeres
  function drawConstruction() {
    const p = prog(0, 0.7);
    if (p <= 0) return;
    const half = model.n / 2 + G.cheek + 2.6;
    const lines = [
      [[-half, -G.h, ZF + 0.15], [half, -G.h, ZF + 0.15]],
      [[-half, 0, ZB], [half, 0, ZB]],
      [[-half, G.rail, ZB - 0.05], [half, G.rail, ZB - 0.05]],
    ];
    lines.forEach(([a, b], i) => pencil(project(...a), project(...b), { w: 0.6, over: 0, alpha: 0.22, p: clamp01(p * 1.6 - i * 0.3), seed: 50 + i }));
    // L'ombre portee, hachee a l'horizontale devant le clavier
    const ps = prog(1.4, 0.8);
    const sh = model.n / 2 + G.cheek * 0.6;
    for (let i = 0; i < 5; i++) {
      const z = ZF + 0.35 + i * 0.22;
      pencil(project(-sh + i * 0.4, -G.h, z), project(sh - i * 0.5, -G.h, z), { w: 0.55, over: 2, alpha: 0.26 - i * 0.045, p: clamp01(ps * 1.5 - i * 0.12), seed: 80 + i });
    }
  }

  function drawLabels(now) {
    for (const k of model.keys) {
      const lb = k.label;
      if (!lb) continue;
      const age = drawT - lb.t0;
      if (age > 1.8) { k.label = null; continue; }
      const alpha = age < 1.2 ? 1 : 1 - (age - 1.2) / 0.6;
      const reveal = clamp01(age / 0.24);
      const kw = Math.abs(project(k.cx + 0.5, 0, ZF)[0] - project(k.cx - 0.5, 0, ZF)[0]);
      const fs = Math.max(14 * dpr, Math.min(24 * dpr, kw * 0.62));
      // Sur une blanche, le nom s'ecrit au crayon pres du bord ; sur une noire, en reserve de papier
      const at = k.black ? project(k.cx, G.bh - k.press * 0.12, ZB + G.blen - G.slope - 0.5) : project(k.cx, -k.press * 0.2, ZF - 1.35);
      const y = at[1];
      g.font = `italic 500 ${fs}px ${SERIF}`;
      g.textAlign = 'center';
      g.textBaseline = 'alphabetic';
      const tw = g.measureText(lb.text).width;
      g.save();
      g.beginPath();
      g.rect(at[0] - tw / 2 - 4, y - fs * 1.2, (tw + 8) * reveal, fs * 1.6);
      g.clip();
      g.globalAlpha = alpha;
      g.fillStyle = k.black && (k.ink > 0.5 || k.flash > 0.3) ? PAPER : k.color;
      g.fillText(lb.text, at[0], y);
      g.restore();
    }
  }

  function draw(now) {
    g.setTransform(1, 0, 0, 1, 0, 0);
    g.globalAlpha = 1;
    g.clearRect(0, 0, W, H);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    const c4 = model.byMidi.get(60).cx;
    drawConstruction();
    drawBody();
    for (const k of model.keys) if (!k.black) drawWhite(k, c4);
    drawCheeks();
    for (const k of model.keys) if (k.black) drawBlack(k, c4);
    drawLabels(now);
    g.globalAlpha = 1;
  }

  // ---------- Jouer ----------
  let soundOn = false;
  const label = (m) => {
    const name = noteName(m).replace('#', '♯');
    return lang() === 'fr' ? name.toLowerCase() : name;
  };
  function press(m, withSound) {
    const k = model?.byMidi.get(m);
    if (!k || k.held) return;
    k.held = true;
    k.flash = 1;
    k.inkTo = 1;
    k.label = { text: label(m), t0: drawT };
    if (withSound && soundOn) noteOn(m, 0.6);
  }
  function release(m, withSound) {
    const k = model?.byMidi.get(m);
    if (!k || !k.held) return;
    k.held = false;
    if (withSound && soundOn) noteOff(m);
  }

  // Melodie automatique, une fois le dessin termine
  let mi = 0;
  let timer = null;
  function nextNote() {
    const [m, len] = MELODY[mi];
    mi = (mi + 1) % MELODY.length;
    press(m, false);
    setTimeout(() => release(m, false), len * BEAT * 0.85);
    timer = setTimeout(nextNote, len * BEAT + (mi === 0 ? 2200 : 0));
  }
  function startMelody(delay) {
    clearTimeout(timer);
    if (!reduced) timer = setTimeout(nextNote, delay);
  }

  // Survol : la touche sous la souris joue (les noires d'abord : elles sont dessus)
  let hovered = null;
  function keyAt(e) {
    const r = canvas.getBoundingClientRect();
    const x = (e.clientX - r.left) * dpr;
    const y = (e.clientY - r.top) * dpr;
    view.mx = ((e.clientX - r.left) / r.width) * 2 - 1;
    view.my = ((e.clientY - r.top) / r.height) * 2 - 1;
    for (const pass of [true, false]) {
      for (const k of model.keys) {
        if (k.black !== pass) continue;
        if (k.poly.some((poly) => inside(poly, x, y))) return k.m;
      }
    }
    return null;
  }
  function onMove(e) {
    if (e.pointerType === 'touch' && !e.buttons) return;
    const m = keyAt(e);
    if (m !== hovered) {
      if (hovered != null) release(hovered, true);
      hovered = m;
      if (m != null) press(m, true);
    }
  }
  function onLeave() {
    if (hovered != null) release(hovered, true);
    hovered = null;
    view.mx = 0;
    view.my = 0;
  }
  function onDown(e) {
    soundOn = true;
    hovered = null;
    onMove({ clientX: e.clientX, clientY: e.clientY, pointerType: 'mouse', buttons: 1 });
  }
  function onUp(e) { if (e.pointerType === 'touch') onLeave(); }
  canvas.addEventListener('pointermove', onMove);
  canvas.addEventListener('pointerleave', onLeave);
  canvas.addEventListener('pointerdown', onDown);
  canvas.addEventListener('pointerup', onUp);
  canvas.addEventListener('pointercancel', onLeave);

  // ---------- Taille et boucle ----------
  const ro = new ResizeObserver(() => layout());
  ro.observe(container);
  layout();
  startMelody((drawEnd * speed + 0.5) * 1000);

  let visible = true;
  const vio = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  vio.observe(container);

  let raf = 0;
  let last = performance.now();
  let t = 0;
  const frame = (now) => {
    raf = requestAnimationFrame(frame);
    // Le dessin suit le vrai temps (il finit a l'heure meme sur un appareil lent) ; les touches,
    // elles, avancent par petits pas pour rester souples
    const real = Math.min(0.5, (now - last) / 1000);
    last = now;
    if (!visible || document.hidden || !model) return;
    step(real, now);
  };
  function step(real, now) {
    const dt = Math.min(0.05, real);
    drawT += real;
    t += reduced ? 0 : dt;
    for (const k of model.keys) {
      k.press += ((k.held ? 1 : 0) - k.press) * clamp01(dt * 22);
      if (!k.held) k.flash = Math.max(0, k.flash - dt * 1.6);
      k.ink += (k.inkTo - k.ink) * clamp01(dt * 2.4);
    }
    // La perspective suit le curseur et le defilement, et respire a peine
    view.sx += (view.mx - view.sx) * clamp01(dt * 3);
    view.sy += (view.my - view.sy) * clamp01(dt * 3);
    const scroll = Math.min(window.scrollY / Math.max(1, window.innerHeight), 1);
    cam = makeCamera(
      view.yaw + view.sx * 0.1 + Math.sin(t * 0.25) * 0.025,
      view.pitch - view.sy * 0.05 + scroll * 0.14,
      DIST,
      TARGET,
    );
    draw(now);
  }
  raf = requestAnimationFrame(frame);
  // ?debug : faire avancer le dessin a la main (l'onglet de test tourne au ralenti)
  if (location.search.includes('debug')) {
    window.__hero = {
      canvas,
      advance(seconds) { for (let i = 0; i < seconds * 60; i++) step(1 / 60, performance.now()); },
      quiet() { clearTimeout(timer); model.keys.forEach((k) => { k.held = false; k.flash = 0; k.label = null; }); },
      play(m) { press(m, false); setTimeout(() => release(m, false), 400); },
    };
  }

  return {
    unfold() {
      if (reduced) return;
      speed = 1;
      drawT = 0;
      startMelody((drawEnd + 0.5) * 1000);
    },
    dispose() {
      cancelAnimationFrame(raf);
      clearTimeout(timer);
      ro.disconnect();
      vio.disconnect();
      canvas.removeEventListener('pointermove', onMove);
      canvas.removeEventListener('pointerleave', onLeave);
      canvas.removeEventListener('pointerdown', onDown);
      canvas.removeEventListener('pointerup', onUp);
      canvas.removeEventListener('pointercancel', onLeave);
      if (hovered != null) release(hovered, true);
      canvas.remove();
    },
  };
}
