// Reglages du clavier d'ordinateur, partages par les pages qui ont un piano :
// disposition (AZERTY, QWERTY, QWERTZ) et lettres affichees sur les touches.
import { LAYOUTS, getLayout, setLayout, detectLayout, letterMap } from './notes.js';
import { getSettings, setSetting } from './progress.js';
import { fr } from './text.js';

export const hasKeyboard = () => window.matchMedia('(hover: hover) and (pointer: fine)').matches;

// Le bloc HTML : interrupteur "Lettres du clavier", choix de la disposition, rappel des touches
export function kbdControlsHTML() {
  if (!hasKeyboard()) return '';
  const on = getSettings().lettres !== false;
  return `
    <div class="kbd-tools">
      <label class="chip-toggle"><input type="checkbox" data-kbd="letters" ${on ? 'checked' : ''}> Lettres du clavier</label>
      <div class="layout-pick" role="radiogroup" aria-label="Disposition de ton clavier d’ordinateur">
        <span class="hint">Ton clavier</span>
        <div class="seg">${Object.entries(LAYOUTS).map(([id, l]) => `<button type="button" data-layout="${id}" role="radio">${l.nom}</button>`).join('')}</div>
      </div>
      <p class="hint keys-hint" data-kbd="hint"></p>
    </div>`;
}

// Branche le bloc sur un piano. Renvoie setShift() a appeler quand les fleches changent d'octave.
export function bindKbdControls(root, piano) {
  const box = root.querySelector('.kbd-tools');
  if (!box || !piano) return { setShift() {} };
  let layout = getLayout();
  let letters = getSettings().lettres !== false;
  let shift = 0;

  function apply() {
    box.querySelectorAll('button[data-layout]').forEach((b) => {
      b.classList.toggle('on', b.dataset.layout === layout);
      b.setAttribute('aria-checked', b.dataset.layout === layout);
    });
    const keys = LAYOUTS[layout].keys;
    const kb = (codes) => codes.map((c) => `<kbd>${keys[c]}</kbd>`).join(' ');
    box.querySelector('[data-kbd="hint"]').innerHTML =
      `${kb(['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK'])} ${fr('jouent do ré mi fa sol la si do,')} ${kb(['KeyW', 'KeyE', 'KeyT', 'KeyY', 'KeyU'])} ${fr('les touches noires. Les flèches ← → changent d’octave.')}`;
    const map = {};
    if (letters) for (const [mid, l] of Object.entries(letterMap(layout))) map[Number(mid) + shift] = l;
    piano.setKeyLetters(letters ? map : null);
  }

  box.querySelector('[data-kbd="letters"]').addEventListener('change', (e) => {
    letters = e.target.checked;
    setSetting('lettres', letters);
    apply();
  });
  box.querySelector('.layout-pick').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-layout]');
    if (!b) return;
    layout = b.dataset.layout;
    setLayout(layout);
    apply();
  });
  apply();
  // Chrome et Edge savent lire la vraie disposition du clavier branche
  detectLayout().then((found) => { if (found !== layout) { layout = found; apply(); } });

  return { setShift(s) { shift = s; apply(); } };
}
