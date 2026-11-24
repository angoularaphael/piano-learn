// Le certificat de fin de parcours : une image a imprimer ou partager, dessinee sur l'appareil.
// Format A4 paysage (rapport racine de 2). Il est compose comme la page de titre d'une edition :
// papier, encre, filets, et le crayon rouge du prof. En tete, le parcours ecrit sur une portee : huit
// rondes de do a do, une par palier, la derniere en rouge sous un point d'orgue, puis la double barre
// de fin. Lisible imprime en noir et blanc.
import { BRAND } from './text.js';
import { deliverFile } from './share.js';
import { PRINT } from './palette.js';

// Le certificat s'imprime : papier creme et encre, quelle que soit la palette de l'ecran
const PAL = PRINT;

const W = 2000;
const H = Math.round(W / Math.SQRT2);
const SERIF = '"Bodoni Moda", "Bodoni 72", Didot, Georgia, serif';
const SANS = '"Atkinson Hyperlegible Next", "Segoe UI", system-ui, sans-serif';
const MUSIC = '"Bravura Text"';

function wrap(g, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let line = '';
  for (const w of words) {
    const t = line ? `${line} ${w}` : w;
    if (g.measureText(t).width > maxWidth && line) { lines.push(line); line = w; } else line = t;
  }
  if (line) lines.push(line);
  return lines;
}

// Un trait de crayon : epais au milieu, effile aux deux bouts, a peine tremble
function pencil(g, pts, width, color) {
  g.save();
  g.fillStyle = color;
  const n = pts.length;
  for (let i = 0; i < n - 1; i++) {
    const [x0, y0] = pts[i];
    const [x1, y1] = pts[i + 1];
    const t = i / (n - 1);
    const w = width * (0.25 + 0.75 * Math.sin(Math.PI * Math.min(1, t * 1.08)));
    const steps = Math.max(2, Math.ceil(Math.hypot(x1 - x0, y1 - y0) / 2));
    for (let k = 0; k < steps; k++) {
      const u = k / steps;
      g.globalAlpha = 0.82 + 0.18 * Math.sin((i + u) * 2.3);
      g.beginPath();
      g.arc(x0 + (x1 - x0) * u, y0 + (y1 - y0) * u, w / 2, 0, Math.PI * 2);
      g.fill();
    }
  }
  g.restore();
}

// Points d'une courbe de Bezier cubique
function bezier(p0, p1, p2, p3, n = 48) {
  const out = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = (1 - t) ** 3;
    const b = 3 * (1 - t) ** 2 * t;
    const c = 3 * (1 - t) * t * t;
    const d = t ** 3;
    out.push([a * p0[0] + b * p1[0] + c * p2[0] + d * p3[0], a * p0[1] + b * p1[1] + c * p2[1] + d * p3[1]]);
  }
  return out;
}

// Une ronde gravee : l'ovale incline, le vide de l'interieur incline dans l'autre sens
function wholeNote(g, x, y, s, color) {
  g.save();
  g.fillStyle = color;
  g.beginPath();
  g.ellipse(x, y, s * 0.82, s * 0.56, -0.18, 0, Math.PI * 2);
  g.ellipse(x, y, s * 0.36, s * 0.42, 0.9, 0, Math.PI * 2, true);
  g.fill('evenodd');
  g.restore();
}

// Le parcours sur une portee : cle de sol, huit rondes de do a do, point d'orgue, double barre
function courseStaff(g, cx, top, width, s) {
  const x0 = cx - width / 2;
  const x1 = cx + width / 2;
  const bottom = top + 4 * s;
  g.save();
  g.strokeStyle = PAL.ink;
  g.lineWidth = 1.6;
  for (let i = 0; i < 5; i++) {
    g.beginPath();
    g.moveTo(x0, top + i * s);
    g.lineTo(x1, top + i * s);
    g.stroke();
  }
  // Double barre de fin : un trait fin, un trait epais
  g.fillStyle = PAL.ink;
  g.fillRect(x1 - s * 0.62, top, s * 0.5, 4 * s);
  g.fillRect(x1 - s * 1.08, top, 1.8, 4 * s);
  // Cle de sol (Bravura) : sa boite englobante est calee sur la portee (SMuFL : de -2.632 a +4.392
  // interlignes autour de la ligne de sol)
  g.font = `${s * 8}px ${MUSIC}`;
  const m = g.measureText('');
  const glyphH = m.actualBoundingBoxAscent + m.actualBoundingBoxDescent;
  if (glyphH > 0) {
    const want = 7.024 * s;
    const k = want / glyphH;
    const gLine = bottom - s;
    g.save();
    g.translate(x0 + s * 0.5, gLine + 2.632 * s);
    g.scale(k, k);
    g.textBaseline = 'alphabetic';
    g.fillText('', 0, -m.actualBoundingBoxDescent);
    g.restore();
  }
  // Huit rondes, do3 a do4 (do central a do aigu) : une par palier
  const first = x0 + s * 5.4;
  const last = x1 - s * 3.4;
  const roman = ['I', 'II', 'III', 'IV', 'V', 'VI', 'VII', 'VIII'];
  for (let i = 0; i < 8; i++) {
    const x = first + ((last - first) * i) / 7;
    const y = bottom + s - (i * s) / 2; // do : une ligne supplementaire sous la portee
    const red = i === 7;
    if (i === 0) {
      g.strokeStyle = PAL.ink;
      g.lineWidth = 1.6;
      g.beginPath();
      g.moveTo(x - s * 1.25, y);
      g.lineTo(x + s * 1.25, y);
      g.stroke();
    }
    wholeNote(g, x, y, s, red ? PAL.right : PAL.ink);
    g.fillStyle = red ? PAL.right : PAL.graphite;
    g.font = `italic 400 ${Math.round(s * 1.35)}px ${SERIF}`;
    g.textAlign = 'center';
    g.fillText(roman[i], x, bottom + s * 3.6);
    if (red) {
      // Point d'orgue : le dernier palier, tenu
      const fy = top - s * 1.3;
      g.strokeStyle = PAL.right;
      g.lineWidth = s * 0.2;
      g.beginPath();
      g.arc(x, fy + s * 0.55, s * 1.05, Math.PI * 1.08, Math.PI * 1.92);
      g.stroke();
      g.beginPath();
      g.arc(x, fy + s * 0.18, s * 0.2, 0, Math.PI * 2);
      g.fillStyle = PAL.right;
      g.fill();
    }
  }
  g.restore();
}

// Le visage du prof, au trait : la tete de porcelaine, les yeux qui sourient, le rose aux joues
function teacherFace(g, cx, cy, s = 1) {
  g.save();
  g.translate(cx, cy);
  g.scale(s, s);
  g.fillStyle = '#fbf7ef';
  g.strokeStyle = PAL.ink;
  g.lineWidth = 2.4;
  g.beginPath();
  g.ellipse(0, 0, 46, 54, 0, 0, Math.PI * 2);
  g.fill();
  g.stroke();
  // Le collier de laiton
  g.strokeStyle = PAL.brass;
  g.lineWidth = 4;
  g.beginPath();
  g.ellipse(0, 66, 22, 5, 0, 0, Math.PI * 2);
  g.stroke();
  g.fillStyle = 'rgba(192,57,31,0.22)';
  [-25, 25].forEach((x) => { g.beginPath(); g.ellipse(x, 10, 9, 5, 0, 0, Math.PI * 2); g.fill(); });
  g.strokeStyle = PAL.ink;
  g.lineWidth = 4.2;
  g.lineCap = 'round';
  [-16, 16].forEach((x) => { g.beginPath(); g.arc(x, -2, 8, Math.PI * 1.12, Math.PI * 1.88); g.stroke(); });
  g.lineWidth = 3;
  g.beginPath();
  g.arc(0, 12, 9, Math.PI * 0.2, Math.PI * 0.8);
  g.stroke();
  g.restore();
}

export async function certificateBlob({ name, song, acc, xp, lessons, songs, date = new Date(), lang = 'fr' }) {
  try {
    await Promise.all([
      document.fonts.load(`500 120px ${SERIF}`),
      document.fonts.load(`italic 400 40px ${SERIF}`),
      document.fonts.load(`400 38px ${SANS}`),
      document.fonts.load(`700 28px ${SANS}`),
      document.fonts.load(`60px ${MUSIC}`, ''),
    ]);
  } catch (e) { /* polices systeme a defaut */ }
  const num = (n) => new Intl.NumberFormat(lang === 'en' ? 'en-GB' : 'fr-FR').format(n);
  const T = lang === 'en' ? {
    eyebrow: 'CERTIFICATE OF COMPLETION',
    given: 'This certificate is presented to',
    body: `for completing all eight levels of ${BRAND}, from the very first note to the final concert, and performing “${song}” for a full hall.`,
    stats: `${lessons} lessons · ${songs} pieces · ${num(xp)} XP · concert accuracy ${acc}%`,
    sign: 'The teacher',
    date: new Intl.DateTimeFormat('en-GB', { dateStyle: 'long' }).format(date),
  } : {
    eyebrow: 'CERTIFICAT DE FIN DE PARCOURS',
    given: 'Ce certificat est remis à',
    body: `pour avoir parcouru les huit paliers de ${BRAND}, de la première note au concert final, et joué « ${song} » devant une salle entière.`,
    stats: `${lessons} leçons · ${songs} morceaux · ${num(xp)} XP · précision du concert ${acc} %`,
    sign: 'Le prof',
    date: `le ${new Intl.DateTimeFormat('fr-FR', { dateStyle: 'long' }).format(date)}`,
  };

  const c = document.createElement('canvas');
  c.width = W;
  c.height = H;
  const g = c.getContext('2d');
  g.fillStyle = '#f7f2e7';
  g.fillRect(0, 0, W, H);
  // Filets d'edition : un filet d'encre, un filet vermillon a l'interieur
  g.strokeStyle = PAL.ink;
  g.lineWidth = 4;
  g.strokeRect(60, 60, W - 120, H - 120);
  g.strokeStyle = PAL.right;
  g.lineWidth = 1.5;
  g.strokeRect(78, 78, W - 156, H - 156);

  courseStaff(g, W / 2, 150, 1060, 15);

  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.fillStyle = PAL.right;
  g.font = `700 28px ${SANS}`;
  if ('letterSpacing' in g) g.letterSpacing = '8px';
  g.fillText(T.eyebrow, W / 2, 360);
  if ('letterSpacing' in g) g.letterSpacing = '0px';

  g.fillStyle = PAL.graphite;
  g.font = `italic 400 44px ${SERIF}`;
  g.fillText(T.given, W / 2, 440);

  // Le nom, aussi grand que possible sur une ligne
  let size = 132;
  g.fillStyle = PAL.ink;
  do {
    g.font = `500 ${size}px ${SERIF}`;
    size -= 4;
  } while (g.measureText(name).width > 1440 && size > 52);
  g.fillText(name, W / 2, 590);
  // Souligne au crayon rouge, a la main
  const nw = Math.min(1440, g.measureText(name).width);
  const ux = W / 2 - nw / 2 - 20;
  pencil(g, bezier([ux, 632], [ux + nw * 0.35, 640], [ux + nw * 0.7, 622], [ux + nw + 40, 628]), 7, PAL.right);

  g.fillStyle = PAL.ink;
  g.font = `400 38px ${SANS}`;
  wrap(g, T.body, 1360).forEach((l, i) => g.fillText(l, W / 2, 730 + i * 58));

  g.fillStyle = PAL.graphite;
  g.font = `400 29px ${SANS}`;
  g.fillText(T.stats, W / 2, 930);

  // Pied : la date a gauche, la signature du prof a droite, la marque au centre
  g.textAlign = 'left';
  g.fillStyle = PAL.ink;
  g.font = `italic 400 36px ${SERIF}`;
  g.fillText(T.date, 200, H - 206);
  g.strokeStyle = PAL.ink;
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(200, H - 250);
  g.lineTo(620, H - 250);
  g.stroke();

  teacherFace(g, W - 410, H - 350, 1.15);
  g.textAlign = 'center';
  g.strokeStyle = PAL.ink;
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(W - 620, H - 250);
  g.lineTo(W - 200, H - 250);
  g.stroke();
  // Le paraphe du prof, au crayon rouge, par-dessus la ligne
  pencil(g, bezier([W - 560, H - 262], [W - 470, H - 300], [W - 380, H - 228], [W - 250, H - 276]), 5, PAL.right);
  g.fillStyle = PAL.ink;
  g.font = `italic 400 36px ${SERIF}`;
  g.fillText(T.sign, W - 410, H - 206);

  g.fillStyle = PAL.ink;
  g.font = `600 26px ${SERIF}`;
  if ('letterSpacing' in g) g.letterSpacing = '7px';
  g.fillText(BRAND.toUpperCase(), W / 2, H - 140);
  if ('letterSpacing' in g) g.letterSpacing = '0px';

  return new Promise((resolve) => c.toBlob(resolve, 'image/png'));
}

// Telecharge, ou partage sur telephone quand c'est possible
export function deliverCertificate(blob, { share = false, title = BRAND } = {}) {
  return deliverFile(blob, 'certificat-piano.png', { share, title });
}
