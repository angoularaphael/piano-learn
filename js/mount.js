// Monte le piano 3D dans une page, avec toutes les facons de jouer :
// doigts et souris (dans le moteur 3D), clavier d'ordinateur, piano numerique (MIDI).
import { Piano3D } from './piano3d.js';
import { KEYBOARD_MAP } from './notes.js';
import { getSettings, onSettings } from './progress.js';
import { onMidi } from './midi.js';
import { setSustain } from './audio.js';
import { keyboardSeen } from './kbd-ui.js';

export function mountPiano(container, opts = {}) {
  container.querySelector('.piano-loading')?.remove();
  const s = getSettings();
  let piano;
  try {
    piano = new Piano3D(container, { labels: s.noms, haptics: s.vibration, ...opts });
  } catch (e) {
    console.error(e);
    container.insertAdjacentHTML('beforeend', '<div class="piano-loading">Ton navigateur n’arrive pas à afficher la 3D.</div>');
    return { piano: null, dispose() {} };
  }

  if (location.search.includes('debug')) window.__piano = piano;

  // Clavier d'ordinateur : la rangee du milieu joue les blanches, les fleches changent d'octave
  let shift = 0;
  let seen = false;
  const held = new Map();
  const typing = (e) => e.target?.closest?.('input[type="text"], input[type="search"], textarea, select, [contenteditable]');
  const down = (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey || typing(e)) return;
    if (e.code === 'Space' && opts.pedal?.()) {
      e.preventDefault();
      if (!e.repeat) { setSustain(true); piano.grand?.setPedal(true); opts.onPedal?.(true); }
      return;
    }
    if (e.code === 'ArrowLeft' || e.code === 'ArrowRight') {
      const next = shift + (e.code === 'ArrowLeft' ? -12 : 12);
      if (60 + next >= piano.low - 12 && 76 + next <= piano.high + 12) { shift = next; opts.onShift?.(shift); }
      e.preventDefault();
      return;
    }
    const base = KEYBOARD_MAP[e.code];
    if (base == null) return;
    e.preventDefault();
    if (!seen) { seen = true; keyboardSeen(); }
    if (e.repeat || held.has(e.code)) return;
    const midi = base + shift;
    held.set(e.code, midi);
    piano.press(midi, 0.8, { source: 'keyboard' });
  };
  const up = (e) => {
    if (e.code === 'Space' && opts.pedal?.()) { setSustain(false); piano.grand?.setPedal(false); opts.onPedal?.(false); return; }
    const midi = held.get(e.code);
    if (midi == null) return;
    held.delete(e.code);
    piano.release(midi, { source: 'keyboard' });
  };
  const blur = () => { held.clear(); piano.releaseAll(); setSustain(false); };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', blur);

  // Piano numerique : le son vient de l'appli, la note est reconnue sans erreur possible
  const offMidi = onMidi({
    noteOn: (m, v) => piano.press(m, v, { source: 'midi' }),
    noteOff: (m) => piano.release(m, { source: 'midi' }),
    pedal: (on) => { setSustain(on); piano.grand?.setPedal(on); opts.onPedal?.(on); },
  });

  const offSettings = onSettings((st, key) => {
    if (key === 'noms') piano.setLabelsVisible(st.noms);
    if (key === 'vibration') piano.haptics = st.vibration;
  });

  return {
    piano,
    dispose() {
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      offMidi();
      offSettings();
      setSustain(false);
      piano.dispose();
    },
  };
}
