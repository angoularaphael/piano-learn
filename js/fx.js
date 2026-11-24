// Effets d'interface : la touche d'entree, les transitions de page, les apparitions, les compteurs.
import { noteOn, noteOff, unlockAudio } from './audio.js';
import { discover, unlockBadge } from './progress.js';
import { noteName } from './notes.js';
import { t } from './i18n.js';

const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- La touche d'entree ----------
// Le site s'ouvre sur un seul do, a cote de ses deux touches noires. Le toucher joue la premiere note,
// debloque le son pour toute la visite, et deploie le reste.
export function playGate() {
  const gate = document.getElementById('gate');
  if (!gate) return Promise.resolve(false);
  let seen = false;
  try { seen = sessionStorage.getItem('pl-gate') === '1'; } catch (e) { /* stockage bloque */ }
  if (seen) { gate.remove(); return Promise.resolve(false); }
  // index.html l'ecrit en francais : on le met dans la langue de l'eleve avant de le montrer
  const c = gate.querySelector('[data-midi="60"]');
  c.setAttribute('aria-label', t('Do. Touche-le pour entrer.'));
  c.querySelector('span').textContent = noteName(60);
  const hint = gate.querySelector('.gate-hint');
  hint.textContent = t('Touche le do pour entrer');
  gate.querySelector('.gate-sub').textContent = t('Le son s’allume avec lui');
  gate.hidden = false;
  document.body.classList.add('gated');
  return new Promise((resolve) => {
    let done = false;
    const open = (midi) => {
      if (done) return;
      done = true;
      try { sessionStorage.setItem('pl-gate', '1'); } catch (e) { /* stockage bloque */ }
      unlockAudio();
      // Le do touche a l'entree est la toute premiere note apprise
      discover(60);
      unlockBadge('premiere-note');
      noteOn(midi, 0.75);
      setTimeout(() => noteOn(64, 0.5), 140);
      setTimeout(() => noteOn(67, 0.5), 280);
      setTimeout(() => noteOn(72, 0.55), 420);
      setTimeout(() => [midi, 64, 67, 72].forEach((m) => noteOff(m)), 1600);
      gate.classList.add('open');
      document.body.classList.remove('gated');
      setTimeout(() => gate.remove(), 1100);
      resolve(true);
    };
    gate.querySelectorAll('[data-midi]').forEach((k) => {
      k.addEventListener('pointerdown', (e) => {
        const midi = Number(k.dataset.midi);
        k.classList.add('down');
        if (midi === 60) { open(60); return; }
        e.preventDefault();
        unlockAudio();
        noteOn(midi, 0.6);
        setTimeout(() => noteOff(midi), 350);
        hint.textContent = t('Presque. Le do, c’est la blanche juste à gauche des deux noires.');
        gate.classList.remove('nudge');
        void gate.offsetWidth;
        gate.classList.add('nudge');
      });
      k.addEventListener('pointerup', () => k.classList.remove('down'));
      k.addEventListener('pointerleave', () => k.classList.remove('down'));
    });
    gate.querySelector('[data-midi="60"]').addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); open(60); }
    });
    const onKey = (e) => {
      if (e.code === 'KeyA' || e.key === 'Enter') { window.removeEventListener('keydown', onKey); open(60); }
    };
    window.addEventListener('keydown', onKey);
    requestAnimationFrame(() => gate.querySelector('[data-midi="60"]').focus({ preventScroll: true }));
  });
}

// ---------- Transition de page ----------
// Le contenu change tout de suite ; un trait de lumiere balaie l'ecran comme un glissando.
const sweep = document.getElementById('sweep');
let activeTransition = null;
export function pageTransition(swap) {
  if (reduced || document.hidden) { swap(); return; }
  sweep?.classList.remove('run');
  void sweep?.offsetWidth;
  sweep?.classList.add('run');
  if (document.startViewTransition) {
    // Une navigation rapide en interrompt une autre : on termine la precedente sans bruit
    activeTransition?.skipTransition?.();
    const vt = document.startViewTransition(() => swap());
    activeTransition = vt;
    [vt.ready, vt.finished, vt.updateCallbackDone].forEach((p) => p?.catch(() => {}));
    vt.finished?.finally(() => { if (activeTransition === vt) activeTransition = null; });
  } else {
    swap();
    const app = document.getElementById('app');
    app.classList.remove('enter');
    void app.offsetWidth;
    app.classList.add('enter');
  }
}

// ---------- Texte decoupe en mots ----------
export function splitWords(root) {
  root.querySelectorAll('[data-split]').forEach((el) => {
    if (el.dataset.done) return;
    el.dataset.done = '1';
    el.classList.add('split');
    let i = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === 3) {
          const frag = document.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(' ')); return; }
            const w = document.createElement('span');
            w.className = 'w';
            const inner = document.createElement('span');
            inner.textContent = part;
            inner.style.setProperty('--i', i++);
            w.appendChild(inner);
            frag.appendChild(w);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === 1) {
          walk(child);
        }
      });
    };
    walk(el);
  });
}

// ---------- Apparitions au scroll ----------
let io = null;
export function observeReveals(root) {
  splitWords(root);
  io?.disconnect();
  io = new IntersectionObserver((entries) => {
    entries.forEach((e) => {
      if (e.isIntersecting) {
        e.target.classList.add('in');
        io.unobserve(e.target);
      }
    });
  }, { threshold: 0.08, rootMargin: '0px 0px -4% 0px' });
  root.querySelectorAll('[data-reveal], .split').forEach((el) => io.observe(el));
}

// ---------- Compteurs qui defilent ----------
export function countUp(root) {
  root.querySelectorAll('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    if (reduced || !end) { el.textContent = end; return; }
    const start = performance.now();
    const dur = 1100;
    const step = (now) => {
      const p = Math.min(1, (now - start) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
