// Les couleurs du site, pour le code (3D, canevas) : les memes que dans css/style.css.
// Quatre palettes completes, a comparer en direct (le selecteur en bas a gauche) :
// - Edition : papier creme, encre, crayon rouge et bleu ;
// - Laque : le noir laque d'un piano de concert, l'ivoire des touches, la feuille d'or ;
// - Nuit : le bleu nuit, l'ivoire et l'or d'EAM ;
// - Studio : gris clair, noir, orange signal, comme un instrument de studio.
// Dans chaque palette, la couleur d'action est aussi celle de la main droite ; la main gauche est bleue.
// PAL est modifie sur place quand on change de palette : les scenes reconstruites prennent les nouvelles
// couleurs. Le choix est garde dans les reglages ('theme') et pose sur <html data-theme> avant l'affichage
// (petit script en tete d'index.html), pour ne jamais voir l'ancienne palette clignoter.

import { getSettings, setSetting } from './progress.js';

export const THEMES = {
  edition: {
    nom: { fr: 'Édition', en: 'Edition' },
    dark: false,
    paper: '#f3eee3', paperHi: '#f8f4ec', ink: '#1c1814', muted: '#6c6257',
    right: '#c0391f', left: '#2a4b9b', ok: '#2c7445', graphite: '#57524c', brass: '#9b7633',
    studio: '#e7e1d4', floor: '#ebe5d8',
    // Lumiere du studio 3D : ciel, sol, intensite ; soleil ; reflets ; lumieres de scene (hors piano a queue)
    light: { sky: '#fffaf1', ground: '#cfc4b1', hemi: 1.15, sun: 1.7, env: 0.42, warm: 0, rim: 0, fill: 0 },
  },
  laque: {
    nom: { fr: 'Laque', en: 'Lacquer' },
    dark: true,
    paper: '#0e0d0c', paperHi: '#171513', ink: '#f2ece0', muted: '#a0978a',
    right: '#d6b064', left: '#86a8e6', ok: '#73c08c', graphite: '#8e8679', brass: '#c9a45c',
    studio: '#0f0e0c', floor: '#1a1714',
    light: { sky: '#fff1dc', ground: '#14110e', hemi: 0.42, sun: 1.55, env: 0.3, warm: 170, rim: 320, fill: 30 },
  },
  nuit: {
    nom: { fr: 'Nuit', en: 'Night' },
    dark: true,
    paper: '#08101d', paperHi: '#0f1a2c', ink: '#f3eee4', muted: '#919cb0',
    right: '#c9a96e', left: '#8dbdf2', ok: '#6fc28f', graphite: '#8a95a8', brass: '#c9a96e',
    studio: '#0a1322', floor: '#0f1b2e',
    light: { sky: '#eef3ff', ground: '#0a1120', hemi: 0.45, sun: 1.5, env: 0.32, warm: 160, rim: 340, fill: 34 },
  },
  studio: {
    nom: { fr: 'Studio', en: 'Studio' },
    dark: false,
    paper: '#e6e5e1', paperHi: '#f3f2ef', ink: '#121212', muted: '#5f5d58',
    right: '#ef4d12', left: '#2457d6', ok: '#1d8049', graphite: '#67655f', brass: '#9a7b3f',
    studio: '#e2e1dd', floor: '#e8e7e3',
    light: { sky: '#ffffff', ground: '#c9c8c3', hemi: 1.1, sun: 1.65, env: 0.45, warm: 0, rim: 0, fill: 0 },
  },
};
export const THEME_IDS = Object.keys(THEMES);

let current = THEMES[getSettings().theme] ? getSettings().theme : 'edition';
export const PAL = { night: '#14110e', ...THEMES[current] };
export const themeId = () => current;

export function applyTheme() {
  const root = document.documentElement;
  root.dataset.theme = current;
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', THEMES[current].paper);
  document.querySelector('meta[name="color-scheme"]')?.setAttribute('content', THEMES[current].dark ? 'dark' : 'light');
}

// Change de palette : le site entier suit (les pages se redessinent sur l'evenement 'themechange')
export function setTheme(id) {
  if (!THEMES[id] || id === current) return;
  current = id;
  Object.assign(PAL, THEMES[id]);
  setSetting('theme', id);
  applyTheme();
  window.dispatchEvent(new CustomEvent('themechange', { detail: id }));
}

export const handColor = (hand) => (hand === 'L' || hand === 'Left' || hand === 'gauche' ? PAL.left : PAL.right);

// Couleur CSS -> composantes 0-255 (pour les canevas qui melangent les couleurs de la palette)
export function rgb(hex) {
  const h = hex.replace('#', '');
  const n = parseInt(h.length === 3 ? h.replace(/./g, (c) => c + c) : h, 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}
