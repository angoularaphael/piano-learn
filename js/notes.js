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

// Position physique des touches (meme place en AZERTY et QWERTY)
// Rangee du milieu = touches blanches a partir du do du milieu
export const KEYBOARD_MAP = {
  KeyA: 60, KeyW: 61, KeyS: 62, KeyE: 63, KeyD: 64,
  KeyF: 65, KeyT: 66, KeyG: 67, KeyY: 68, KeyH: 69,
  KeyU: 70, KeyJ: 71, KeyK: 72, KeyO: 73, KeyL: 74,
  KeyP: 75, Semicolon: 76,
};
