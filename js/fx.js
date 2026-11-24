// Effets d'interface : intro, rideau en touches, apparitions, lueurs
const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---------- Intro ----------
export function playIntro() {
  const intro = document.getElementById('intro');
  if (!intro) return Promise.resolve();
  const seen = sessionStorage.getItem('pl-intro');
  const wait = reduced || seen ? 0 : 1900;
  sessionStorage.setItem('pl-intro', '1');
  return new Promise((res) => {
    setTimeout(() => {
      intro.classList.add('done');
      setTimeout(() => intro.remove(), 700);
      res();
    }, wait);
  });
}

// ---------- Rideau de transition ----------
const PATTERN = [1, 1, 0, 1, 1, 1, 0]; // touche noire apres do, re, fa, sol, la
const curtain = document.getElementById('curtain');
function buildCurtain() {
  const n = window.innerWidth < 640 ? 7 : 14;
  curtain.innerHTML = '';
  for (let i = 0; i < n; i++) {
    const el = document.createElement('i');
    el.style.setProperty('--i', i);
    if (PATTERN[i % 7] && i < n - 1) el.classList.add('black');
    curtain.appendChild(el);
  }
}
buildCurtain();
window.addEventListener('resize', () => { if (!curtain.classList.contains('cover')) buildCurtain(); });

export function curtainSwap(swap) {
  if (reduced) { swap(); return; }
  curtain.classList.remove('open');
  curtain.querySelectorAll('i').forEach((el) => { el.style.transition = 'none'; el.style.transform = ''; });
  void curtain.offsetWidth;
  curtain.querySelectorAll('i').forEach((el) => { el.style.transition = ''; });
  curtain.classList.add('cover');
  const n = curtain.children.length;
  setTimeout(() => {
    swap();
    curtain.classList.add('open');
    setTimeout(() => {
      curtain.classList.remove('cover', 'open');
      curtain.querySelectorAll('i').forEach((el) => { el.style.transition = 'none'; });
      void curtain.offsetWidth;
      curtain.querySelectorAll('i').forEach((el) => { el.style.transition = ''; });
    }, 520 + n * 28);
  }, 480 + n * 28);
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
  }, { threshold: 0.12, rootMargin: '0px 0px -5% 0px' });
  root.querySelectorAll('[data-reveal], .split').forEach((el) => io.observe(el));
}

// ---------- Lueur qui suit la souris ----------
const glow = document.getElementById('cursor-glow');
let gx = 0, gy = 0, tx = 0, ty = 0;
window.addEventListener('pointermove', (e) => {
  tx = e.clientX; ty = e.clientY;
  const card = e.target.closest?.('.card');
  if (card) {
    const r = card.getBoundingClientRect();
    card.style.setProperty('--mx', `${e.clientX - r.left}px`);
    card.style.setProperty('--my', `${e.clientY - r.top}px`);
  }
}, { passive: true });
function glowLoop() {
  gx += (tx - gx) * 0.12;
  gy += (ty - gy) * 0.12;
  glow.style.transform = `translate(${gx}px, ${gy}px)`;
  requestAnimationFrame(glowLoop);
}
if (!reduced && glow) glowLoop();

// ---------- Boutons aimantes ----------
document.addEventListener('pointermove', (e) => {
  const b = e.target.closest?.('.btn');
  document.querySelectorAll('.btn.magnet').forEach((el) => {
    if (el !== b) { el.style.transform = ''; el.classList.remove('magnet'); }
  });
  if (!b || reduced) return;
  const r = b.getBoundingClientRect();
  const dx = e.clientX - (r.left + r.width / 2);
  const dy = e.clientY - (r.top + r.height / 2);
  b.classList.add('magnet');
  b.style.transform = `translate(${dx * 0.18}px, ${dy * 0.25}px)`;
});

// ---------- Egaliseur du header qui reagit aux notes ----------
const bars = [...document.querySelectorAll('#eq i')];
window.addEventListener('pl:note', (e) => {
  const midi = e.detail.midi;
  bars.forEach((b, i) => {
    const h = 6 + Math.abs(Math.sin(midi * 0.7 + i * 1.3)) * 16;
    b.style.animation = 'none';
    b.style.height = `${h}px`;
    clearTimeout(b._t);
    b._t = setTimeout(() => { b.style.height = ''; b.style.animation = ''; }, 260 + i * 30);
  });
});

// ---------- Compteurs qui defilent ----------
export function countUp(root) {
  root.querySelectorAll('[data-count]').forEach((el) => {
    const end = Number(el.dataset.count);
    if (reduced || !end) { el.textContent = end; return; }
    const start = performance.now();
    const dur = 1400;
    const step = (t) => {
      const p = Math.min(1, (t - start) / dur);
      el.textContent = Math.round(end * (1 - Math.pow(1 - p, 3)));
      if (p < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  });
}
