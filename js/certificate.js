// Le certificat de fin de parcours : une image a imprimer ou partager, dessinee sur l'appareil.
// Format A4 paysage (rapport racine de 2), fond ivoire, lisible imprime en noir et blanc.
import { BRAND } from './text.js';
import { deliverFile } from './share.js';

const W = 2000;
const H = Math.round(W / Math.SQRT2);
const NAVY = '#12162b';
const INK = '#2b3045';
const MUTED = '#5a5f73';
const GOLD = '#9a7a36';

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

// Une octave de clavier, motif de tete
function keyboardMotif(g, cx, y, keyW = 22, keyH = 70) {
  const whites = 7;
  const x0 = cx - (whites * keyW) / 2;
  g.save();
  g.strokeStyle = NAVY;
  g.lineWidth = 2;
  for (let i = 0; i < whites; i++) g.strokeRect(x0 + i * keyW, y, keyW, keyH);
  g.fillStyle = NAVY;
  [1, 2, 4, 5, 6].forEach((i) => g.fillRect(x0 + i * keyW - keyW * 0.3, y, keyW * 0.6, keyH * 0.6));
  g.restore();
}

// Le visage du prof : sa visiere et ses yeux qui sourient
function teacherFace(g, cx, cy, s = 1) {
  g.save();
  g.translate(cx, cy);
  g.scale(s, s);
  g.fillStyle = '#e9e4da';
  g.beginPath();
  g.ellipse(0, 0, 46, 54, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#0b0d16';
  g.beginPath();
  g.roundRect(-34, -26, 68, 34, 15);
  g.fill();
  g.strokeStyle = '#3ef2ff';
  g.lineWidth = 5;
  g.lineCap = 'round';
  [-14, 14].forEach((x) => { g.beginPath(); g.arc(x, -6, 7, Math.PI * 1.1, Math.PI * 1.9); g.stroke(); });
  g.restore();
}

export async function certificateBlob({ name, song, acc, xp, lessons, songs, date = new Date(), lang = 'fr' }) {
  try {
    await Promise.all([
      document.fonts.load('800 100px Unbounded'),
      document.fonts.load('500 30px "Space Grotesk"'),
      document.fonts.load('700 30px "Space Grotesk"'),
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
  // Fond ivoire, a peine plus sombre sur les bords
  const bg = g.createRadialGradient(W / 2, H / 2, H * 0.2, W / 2, H / 2, W * 0.75);
  bg.addColorStop(0, '#fbf8f1');
  bg.addColorStop(1, '#efe8d9');
  g.fillStyle = bg;
  g.fillRect(0, 0, W, H);
  // Double filet
  g.strokeStyle = NAVY;
  g.lineWidth = 6;
  g.strokeRect(56, 56, W - 112, H - 112);
  g.lineWidth = 1.5;
  g.strokeRect(78, 78, W - 156, H - 156);
  g.strokeStyle = GOLD;
  g.lineWidth = 1;
  g.strokeRect(90, 90, W - 180, H - 180);

  keyboardMotif(g, W / 2, 150);
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.fillStyle = GOLD;
  g.font = '700 30px "Space Grotesk", system-ui, sans-serif';
  if ('letterSpacing' in g) g.letterSpacing = '8px';
  g.fillText(T.eyebrow, W / 2, 300);
  if ('letterSpacing' in g) g.letterSpacing = '0px';

  g.fillStyle = MUTED;
  g.font = '500 34px "Space Grotesk", system-ui, sans-serif';
  g.fillText(T.given, W / 2, 400);

  // Le nom, aussi grand que possible sur une ligne
  let size = 120;
  g.fillStyle = NAVY;
  do {
    g.font = `800 ${size}px Unbounded, system-ui, sans-serif`;
    size -= 4;
  } while (g.measureText(name).width > 1480 && size > 48);
  g.fillText(name, W / 2, 560);
  g.strokeStyle = GOLD;
  g.lineWidth = 2;
  g.beginPath();
  g.moveTo(W / 2 - 260, 610);
  g.lineTo(W / 2 + 260, 610);
  g.stroke();

  g.fillStyle = INK;
  g.font = '500 40px "Space Grotesk", system-ui, sans-serif';
  wrap(g, T.body, 1380).forEach((l, i) => g.fillText(l, W / 2, 700 + i * 60));

  g.fillStyle = MUTED;
  g.font = '500 30px "Space Grotesk", system-ui, sans-serif';
  g.fillText(T.stats, W / 2, 905);

  // Pied : la date a gauche, la signature du prof a droite, la marque au centre
  g.textAlign = 'left';
  g.fillStyle = INK;
  g.font = '500 32px "Space Grotesk", system-ui, sans-serif';
  g.fillText(T.date, 200, H - 210);
  g.strokeStyle = INK;
  g.lineWidth = 1.5;
  g.beginPath();
  g.moveTo(200, H - 250);
  g.lineTo(620, H - 250);
  g.stroke();

  teacherFace(g, W - 410, H - 330, 1.2);
  g.textAlign = 'center';
  g.beginPath();
  g.moveTo(W - 620, H - 250);
  g.lineTo(W - 200, H - 250);
  g.stroke();
  g.fillText(T.sign, W - 410, H - 210);

  g.fillStyle = NAVY;
  g.font = '800 26px Unbounded, system-ui, sans-serif';
  if ('letterSpacing' in g) g.letterSpacing = '6px';
  g.fillText(BRAND.toUpperCase(), W / 2, H - 150);
  if ('letterSpacing' in g) g.letterSpacing = '0px';

  return new Promise((resolve) => c.toBlob(resolve, 'image/png'));
}

// Telecharge, ou partage sur telephone quand c'est possible
export function deliverCertificate(blob, { share = false, title = BRAND } = {}) {
  return deliverFile(blob, 'certificat-piano.png', { share, title });
}
