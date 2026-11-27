// Les couleurs du site, pour le code (3D, canevas) : les memes que dans css/style.css.
// Deux palettes, choisies par Eddy le 2026-11-25 :
// - Nuit (par defaut) : le bleu nuit, l'ivoire et l'or d'EAM, l'agence qui signe le site ;
// - Clair (Studio) : gris clair, noir et orange, pour les appareils reglés en mode clair.
// Le reglage 'theme' vaut 'auto' (suit l'appareil), 'nuit' ou 'studio'. Dans chaque palette, la couleur
// d'action est aussi celle de la main droite ; la main gauche est bleue.
// PAL est modifie sur place quand la palette change : les scenes reconstruites prennent les nouvelles
// couleurs. La palette est posee sur <html data-theme> avant l'affichage (petit script en tete d'index.html).
import { getSettings, setSetting } from './progress.js';

export const THEMES = {
  nuit: {
    nom: { fr: 'Nuit', en: 'Night' },
    dark: true,
    paper: '#08101d', paperHi: '#0f1a2c', ink: '#f3eee4', muted: '#919cb0',
    right: '#c9a96e', left: '#8dbdf2', ok: '#6fc28f', graphite: '#8a95a8', brass: '#c9a96e',
    studio: '#0a1322', floor: '#0f1b2e',
    desk: '#6b4a33', deskGrain: '#2a1a10',   // la table du clavier de papier : noyer
    // Lumiere du studio 3D : ciel, sol, intensite ; soleil ; reflets ; lumieres de scene (hors piano a queue)
    light: { sky: '#eef3ff', ground: '#0a1120', hemi: 0.45, sun: 1.5, env: 0.32, warm: 160, rim: 340, fill: 34 },
  },
  studio: {
    nom: { fr: 'Clair', en: 'Light' },
    dark: false,
    paper: '#e6e5e1', paperHi: '#f3f2ef', ink: '#121212', muted: '#5f5d58',
    // brass : le laiton des pianos 3D (un metal). Le CSS imprime un or plus fonce (#7a5f2e) pour le texte.
    right: '#ef4d12', left: '#2457d6', ok: '#1d8049', graphite: '#67655f', brass: '#9a7b3f',
    studio: '#e2e1dd', floor: '#e8e7e3',
    desk: '#cdb08a', deskGrain: '#8d6c46',   // chene clair
    light: { sky: '#ffffff', ground: '#c9c8c3', hemi: 1.1, sun: 1.65, env: 0.45, warm: 0, rim: 0, fill: 0 },
  },
};

// Le certificat s'imprime : papier creme et encre, quelle que soit la palette de l'ecran
export const PRINT = {
  paper: '#f3eee3', paperHi: '#f8f4ec', ink: '#1c1814', muted: '#6c6257',
  right: '#c0391f', left: '#2a4b9b', ok: '#2c7445', graphite: '#57524c', brass: '#9b7633',
};

export const THEME_CHOICES = ['auto', 'nuit', 'studio'];
const prefersLight = () => typeof matchMedia === 'function' && matchMedia('(prefers-color-scheme: light)').matches;
const setting = () => (THEME_CHOICES.includes(getSettings().theme) ? getSettings().theme : 'auto');
const resolve = (choice) => (choice === 'auto' ? (prefersLight() ? 'studio' : 'nuit') : choice);

let current = resolve(setting());
export const PAL = { night: '#14110e', ...THEMES[current] };
export const themeId = () => current;
export const themeSetting = setting;

export function applyTheme() {
  document.documentElement.dataset.theme = current;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEMES[current].paper);
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', THEMES[current].dark ? 'dark' : 'light');
}

function use(id) {
  if (id === current) return;
  current = id;
  Object.assign(PAL, THEMES[id]);
  applyTheme();
  window.dispatchEvent(new CustomEvent('themechange', { detail: id }));
}

// Change le reglage (auto, nuit, studio) : le site entier suit
export function setTheme(choice) {
  if (!THEME_CHOICES.includes(choice)) return;
  setSetting('theme', choice);
  use(resolve(choice));
}

// En automatique, le site suit l'appareil quand il passe du clair au sombre (le soir, par exemple)
if (typeof matchMedia === 'function') {
  matchMedia('(prefers-color-scheme: light)').addEventListener?.('change', () => {
    if (setting() === 'auto') use(resolve('auto'));
  });
}

export const handColor = (hand) => (hand === 'L' || hand === 'Left' || hand === 'gauche' ? PAL.left : PAL.right);

// Couleur CSS -> composantes 0-255 (pour les canevas qui melangent les couleurs de la palette)
export function rgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
