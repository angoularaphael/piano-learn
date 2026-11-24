// Outils autour des notes (numerotation MIDI : 60 = do du milieu)

const NOMS = ['Do', 'Do#', 'Ré', 'Ré#', 'Mi', 'Fa', 'Fa#', 'Sol', 'Sol#', 'La', 'La#', 'Si'];

export function isBlack(midi) {
  return [1, 3, 6, 8, 10].includes(midi % 12);
}

export function noteName(midi, withOctave = false) {
  const name = NOMS[midi % 12];
  return withOctave ? `${name}${Math.floor(midi / 12) - 1}` : name;
}

export function frequency(midi) {
  return 440 * Math.pow(2, (midi - 69) / 12);
}

// Position physique des touches : la meme sur AZERTY, QWERTY et QWERTZ,
// seule la lettre imprimee change (voir LAYOUTS).
// Rangee du milieu = touches blanches a partir du do du milieu
export const KEYBOARD_MAP = {
  KeyA: 60, KeyW: 61, KeyS: 62, KeyE: 63, KeyD: 64,
  KeyF: 65, KeyT: 66, KeyG: 67, KeyY: 68, KeyH: 69,
  KeyU: 70, KeyJ: 71, KeyK: 72, KeyO: 73, KeyL: 74,
  KeyP: 75, Semicolon: 76,
};

// Lettres imprimees sur chaque touche selon la disposition du clavier
export const LAYOUTS = {
  azerty: { nom: 'AZERTY', keys: { KeyA: 'Q', KeyW: 'Z', KeyS: 'S', KeyE: 'E', KeyD: 'D', KeyF: 'F', KeyT: 'T', KeyG: 'G', KeyY: 'Y', KeyH: 'H', KeyU: 'U', KeyJ: 'J', KeyK: 'K', KeyO: 'O', KeyL: 'L', KeyP: 'P', Semicolon: 'M' } },
  qwerty: { nom: 'QWERTY', keys: { KeyA: 'A', KeyW: 'W', KeyS: 'S', KeyE: 'E', KeyD: 'D', KeyF: 'F', KeyT: 'T', KeyG: 'G', KeyY: 'Y', KeyH: 'H', KeyU: 'U', KeyJ: 'J', KeyK: 'K', KeyO: 'O', KeyL: 'L', KeyP: 'P', Semicolon: ';' } },
  qwertz: { nom: 'QWERTZ', keys: { KeyA: 'A', KeyW: 'W', KeyS: 'S', KeyE: 'E', KeyD: 'D', KeyF: 'F', KeyT: 'T', KeyG: 'G', KeyY: 'Z', KeyH: 'H', KeyU: 'U', KeyJ: 'J', KeyK: 'K', KeyO: 'O', KeyL: 'L', KeyP: 'P', Semicolon: 'Ö' } },
};

const LAYOUT_KEY = 'piano-learn-layout';

function guessLayout() {
  const lang = (navigator.language || 'fr').toLowerCase();
  if (/^(fr|be)/.test(lang) && !/-ca$|-ch$/.test(lang)) return 'azerty';
  if (/^(de|cs|sk|hu|sl|hr|pl)|-ch$|-at$/.test(lang)) return 'qwertz';
  return 'qwerty';
}

export function getLayout() {
  const saved = localStorage.getItem(LAYOUT_KEY);
  return LAYOUTS[saved] ? saved : guessLayout();
}

export function setLayout(id) {
  if (LAYOUTS[id]) localStorage.setItem(LAYOUT_KEY, id);
}

// Chrome et Edge savent lire la vraie disposition du clavier branche
export async function detectLayout() {
  if (localStorage.getItem(LAYOUT_KEY)) return getLayout();
  try {
    const map = await navigator.keyboard?.getLayoutMap?.();
    if (map) {
      const a = map.get('KeyA'), y = map.get('KeyY');
      const found = a === 'q' ? 'azerty' : y === 'z' ? 'qwertz' : a === 'a' ? 'qwerty' : null;
      if (found) return found;
    }
  } catch (e) { /* pas d'acces, on garde la supposition */ }
  return guessLayout();
}

// midi -> lettre, pour l'affichage sur le piano
export function letterMap(layoutId) {
  const keys = LAYOUTS[layoutId].keys;
  const out = {};
  for (const [code, midi] of Object.entries(KEYBOARD_MAP)) out[midi] = keys[code];
  return out;
}
