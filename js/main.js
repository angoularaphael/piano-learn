import { Piano3D } from './piano3d.js';
import { KEYBOARD_MAP, noteName, LAYOUTS, getLayout, setLayout, detectLayout, letterMap } from './notes.js';
import { unlockAudio } from './audio.js';
import { getState, onChange, levelInfo, unlockBadge, resetProgress } from './progress.js';
import { PALIERS, palierStatus, isUnlocked } from './data/paliers.js';
import { MORCEAUX } from './data/morceaux.js';
import { BADGES } from './data/badges.js';
import { playIntro, curtainSwap, observeReveals, countUp } from './fx.js';
import { createHeroScene } from './hero-scene.js';
import { renderLesson } from './lesson.js';

const app = document.getElementById('app');
let cleanup = null;

// ---------- Barre d'XP ----------
function refreshXp() {
  const info = levelInfo();
  document.getElementById('xp-level').textContent = `NIV ${info.level}`;
  document.getElementById('xp-fill').style.width = `${Math.round(info.ratio * 100)}%`;
  document.getElementById('xp-chip').title = `${info.current} / ${info.need} XP avant le niveau ${info.level + 1}`;
}
onChange(refreshXp);
refreshXp();
document.addEventListener('pointerdown', unlockAudio, { once: true });

// ---------- Piano partage par les pages ----------
export function mountPiano(container, opts = {}) {
  container.innerHTML = '<div class="piano-loading">CHARGEMENT DU PIANO</div>';
  const narrow = window.innerWidth < 640;
  let piano;
  try {
    piano = new Piano3D(container, {
      low: opts.low ?? (narrow ? 55 : 48),
      high: opts.high ?? (narrow ? 76 : 84),
      ...opts,
    });
  } catch (e) {
    console.error(e);
    container.innerHTML = '<div class="piano-loading">Ton navigateur n\'arrive pas à afficher la 3D.</div>';
    return { piano: null, dispose() {} };
  }
  container.querySelector('.piano-loading')?.remove();

  const ro = new ResizeObserver(() => piano.resize());
  ro.observe(container);

  const held = new Set();
  const down = (e) => {
    if (e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
    if (e.target?.closest?.('input[type="text"], textarea, select')) return;
    const midi = KEYBOARD_MAP[e.code];
    if (midi == null) return;
    e.preventDefault();
    held.add(e.code);
    piano.press(midi);
  };
  const up = (e) => {
    const midi = KEYBOARD_MAP[e.code];
    if (midi == null || !held.has(e.code)) return;
    held.delete(e.code);
    piano.release(midi);
  };
  const blur = () => { held.clear(); piano.releaseAll(); };
  window.addEventListener('keydown', down);
  window.addEventListener('keyup', up);
  window.addEventListener('blur', blur);

  return {
    piano,
    dispose() {
      ro.disconnect();
      window.removeEventListener('keydown', down);
      window.removeEventListener('keyup', up);
      window.removeEventListener('blur', blur);
      piano.dispose();
    },
  };
}

// ---------- Pages ----------
function pageAccueil() {
  app.classList.add('full');
  const words = ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si', 'Accords', 'Rythme', 'Deux mains', 'Lettre à Élise', 'Ode à la joie'];
  const marquee = [...words, ...words].map((w) => `<span>${w}</span>`).join('');
  app.innerHTML = `
    <section class="hero">
      <div class="hero-canvas" id="hero-canvas"></div>
      <div class="hero-content">
        <div class="eyebrow" data-reveal>Ton prof de piano en 3D</div>
        <h1 data-split>Apprends le piano, <span class="grad-text">une touche</span> après l'autre</h1>
        <p class="lead" data-reveal style="--d:500ms">Le prof te montre sur son piano, tu rejoues sur le tien. Le site t'écoute, te dit si c'est juste, et tu montes de palier en palier.</p>
        <div class="hero-actions" data-reveal style="--d:700ms">
          <a href="#/parcours" class="btn">Commencer le parcours</a>
          <a href="#/piano" class="btn ghost">Essayer le piano</a>
        </div>
      </div>
      <div class="hero-hint">PASSE SUR LES TOUCHES</div>
    </section>

    <div class="marquee"><div class="marquee-track">${marquee}</div></div>

    <section class="section">
      <div class="eyebrow" data-reveal>Comment ça marche</div>
      <h2 data-split>Trois temps, à chaque leçon</h2>
      <div class="grid steps" style="margin-top:2rem">
        ${[
          ['Le prof montre', 'Il joue l\'exercice doucement sur le piano 3D. Tu vois les touches et les doigts.'],
          ['Tu joues chez toi', 'Sur ton vrai piano. Pose le téléphone sur le pupitre : le site t\'écoute au micro.'],
          ['Tu gagnes de l\'XP', 'Chaque leçon réussie rapporte de l\'XP et des étoiles. Finis un palier pour ouvrir le suivant.'],
        ].map(([t, d], i) => `
          <div class="card" data-reveal style="--d:${i * 120}ms">
            <span class="num">0${i + 1}</span>
            <div class="keys-deco">${[0, 1, 2, 3, 4].map((k) => `<i style="--k:${k + i * 2}"></i>`).join('')}</div>
            <h3>${t}</h3><p class="hint" style="margin:0">${d}</p>
          </div>`).join('')}
      </div>
    </section>
  `;
  const hero = createHeroScene(document.getElementById('hero-canvas'));
  return () => { hero.dispose(); app.classList.remove('full'); };
}

function pageParcours() {
  const { lessonsDone } = getState();
  const items = PALIERS.map((p, i) => {
    const st = palierStatus(p, lessonsDone);
    const open = isUnlocked(i, lessonsDone);
    const cls = st.complete ? 'done' : open ? '' : 'locked';
    const lessons = p.lecons.map((l) => {
      const done = lessonsDone[l.id];
      const inner = `<span class="dot ${done ? 'done' : ''}"></span>${l.titre}`;
      return `<li>${open ? `<a href="#/lecon/${l.id}">${inner}</a>` : `<span class="l">${inner}</span>`}</li>`;
    }).join('');
    return `
      <div class="palier ${cls}" data-reveal>
        <div class="palier-num">${p.id}</div>
        <div class="card">
          <div class="palier-head">
            <h3 style="margin:0">${p.titre}</h3>
            <span class="tag ${open ? '' : 'grey'}">${open ? `${st.done} / ${st.total} leçons` : 'Bloqué'}</span>
          </div>
          <p class="hint" style="margin:.5rem 0 0">${p.resume}</p>
          ${open ? `<div class="progress-line"><span style="width:${(st.done / st.total) * 100}%"></span></div><ul class="lessons">${lessons}</ul>` : ''}
          <p class="hint" style="margin:.9rem 0 0">Morceau de fin : <strong style="color:var(--ink)">${p.final}</strong></p>
        </div>
      </div>`;
  }).join('');

  app.innerHTML = `
    <div class="eyebrow" data-reveal>8 paliers</div>
    <h1 data-split>Ton <span class="grad-text">parcours</span></h1>
    <p class="lead" data-reveal style="--d:300ms">Du tout début jusqu'aux vrais morceaux. Finis toutes les leçons d'un palier pour ouvrir le suivant.</p>
    <div class="path" id="path">${items}</div>
  `;
  const path = document.getElementById('path');
  const onScroll = () => {
    const r = path.getBoundingClientRect();
    const p = (window.innerHeight * 0.6 - r.top) / r.height;
    path.style.setProperty('--fill', Math.max(0, Math.min(1, p)).toFixed(3));
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
  return () => window.removeEventListener('scroll', onScroll);
}

function pagePiano() {
  app.innerHTML = `
    <div class="eyebrow" data-reveal>Mode libre</div>
    <h1 data-split>Piano <span class="grad-text">libre</span></h1>
    <p class="lead" data-reveal style="--d:300ms">Joue ce que tu veux : clique, touche l'écran, ou utilise la rangée du milieu de ton clavier d'ordinateur.</p>
    <div class="piano-wrap" id="piano" data-reveal style="--d:400ms"></div>
    <div class="piano-tools">
      <label class="chip-toggle"><input type="checkbox" id="opt-labels" checked> Nom des notes</label>
      <label class="chip-toggle"><input type="checkbox" id="opt-top"> Vue du dessus</label>
      <label class="chip-toggle"><input type="checkbox" id="opt-letters"> Lettres du clavier</label>
      <span class="now-playing grad-text" id="now"></span>
    </div>
    <div class="layout-pick" id="layout-pick" role="radiogroup" aria-label="Disposition du clavier">
      <span class="hint">Ton clavier :</span>
      ${Object.entries(LAYOUTS).map(([id, l]) => `<button type="button" class="seg" data-layout="${id}" role="radio">${l.nom}</button>`).join('')}
    </div>
    <p class="hint" id="kbd-hint"></p>
  `;
  const now = document.getElementById('now');
  const hintEl = document.getElementById('kbd-hint');
  const lettersOpt = document.getElementById('opt-letters');
  lettersOpt.checked = window.matchMedia('(hover: hover)').matches;
  let layout = getLayout();
  const kb = (codes) => codes.map((c) => `<kbd>${LAYOUTS[layout].keys[c]}</kbd>`).join(' ');
  const applyLayout = () => {
    document.querySelectorAll('#layout-pick .seg').forEach((b) => {
      b.classList.toggle('on', b.dataset.layout === layout);
      b.setAttribute('aria-checked', b.dataset.layout === layout);
    });
    hintEl.innerHTML = `${kb(['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK'])} jouent do ré mi fa sol la si do.
      ${kb(['KeyW', 'KeyE', 'KeyT', 'KeyY', 'KeyU'])} jouent les touches noires. Le point rose marque le do du milieu.`;
    m.piano?.setKeyLetters(lettersOpt.checked ? letterMap(layout) : null);
  };
  const m = mountPiano(document.getElementById('piano'), {
    onNoteOn: (midi) => {
      now.textContent = noteName(midi);
      now.classList.remove('hit');
      void now.offsetWidth;
      now.classList.add('hit');
      unlockBadge('premiere-note');
    },
  });
  if (!m.piano) return () => {};
  document.getElementById('opt-labels').addEventListener('change', (e) => m.piano.setLabelsVisible(e.target.checked));
  document.getElementById('opt-top').addEventListener('change', (e) => m.piano.setView(e.target.checked ? 'top' : 'front'));
  lettersOpt.addEventListener('change', applyLayout);
  document.getElementById('layout-pick').addEventListener('click', (e) => {
    const b = e.target.closest('.seg');
    if (!b) return;
    layout = b.dataset.layout;
    setLayout(layout);
    applyLayout();
  });
  applyLayout();
  // Detection automatique de la vraie disposition (Chrome, Edge)
  detectLayout().then((found) => { if (found !== layout) { layout = found; applyLayout(); } });
  return () => m.dispose();
}

function pageLecon(id) {
  const out = renderLesson(app, id, 'lecon');
  if (out === null) return pageIntrouvable();
  return out;
}

function pageMorceau(id) {
  const out = renderLesson(app, id, 'morceau');
  if (out === null) return pageIntrouvable();
  return out;
}

function pageMorceaux() {
  const { lessonsDone, songsDone } = getState();
  const cards = MORCEAUX.map((s, i) => {
    const open = s.libre || isUnlocked(s.palier - 1, lessonsDone);
    const done = (s.demo && songsDone[s.id]) || (s.lecon && lessonsDone[s.lecon]);
    let seed = s.id.length * 7;
    const wave = Array.from({ length: 22 }, (_, k) => {
      seed = (seed * 9301 + 49297) % 233280;
      return `<i style="--h:${25 + (seed / 233280) * 75};--k:${k}"></i>`;
    }).join('');
    const tagEtat = !open ? '<span class="tag grey">Bloqué</span>'
      : s.libre ? '<span class="tag">Libre</span>'
      : done ? '<span class="tag gold">Réussi</span>' : '';
    const tagPiano = s.demo ? '<span class="tag gold">Version piano</span>' : '';
    const action = !open ? ''
      : s.demo ? `<a class="btn ghost song-go" href="#/morceau/${s.id}">Jouer la version piano</a>`
      : s.lecon ? `<a class="btn ghost song-go" href="#/lecon/${s.lecon}">Jouer avec le prof</a>`
      : '<span class="hint">Notes bientôt disponibles</span>';
    return `
      <div class="card song ${open ? '' : 'locked'}" data-reveal style="--d:${(i % 3) * 100}ms">
        <div class="wave">${wave}</div>
        <h3 style="margin:0">${s.titre}</h3>
        <span class="hint">${s.auteur}</span>
        <div class="meta">
          <span class="tag">Palier ${s.palier}</span>
          <span class="tag ${s.type === 'actuel' ? 'gold' : 'grey'}">${s.type === 'actuel' ? 'Actuel' : 'Classique'}</span>
          ${tagPiano}
          ${tagEtat}
        </div>
        ${action}
      </div>`;
  }).join('');
  app.innerHTML = `
    <div class="eyebrow" data-reveal>Bibliothèque</div>
    <h1 data-split>Les <span class="grad-text">morceaux</span></h1>
    <p class="lead" data-reveal style="--d:300ms">Ils se débloquent au fil du parcours, les plus simples d'abord.</p>
    <div class="grid" style="margin-top:2rem">${cards}</div>
  `;
}

function pageProfil() {
  const s = getState();
  const info = levelInfo();
  const nbLecons = Object.keys(s.lessonsDone).length;
  const C = 2 * Math.PI * 84;
  const badges = BADGES.map((b, i) => `
    <div class="card badge ${s.badges.includes(b.id) ? 'got' : ''}" data-reveal style="--d:${i * 70}ms">
      <span class="medal"></span>
      <div><strong>${b.titre}</strong><br><span class="hint">${b.desc}</span></div>
    </div>`).join('');
  app.innerHTML = `
    <div class="eyebrow" data-reveal>Profil</div>
    <h1 data-split>Ta <span class="grad-text">progression</span></h1>
    <div class="profile-top">
      <div class="ring" data-reveal>
        <svg viewBox="0 0 190 190">
          <defs><linearGradient id="ringgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3ef2ff"/><stop offset="1" stop-color="#8b5cff"/></linearGradient></defs>
          <circle class="track" cx="95" cy="95" r="84" fill="none" stroke-width="10"/>
          <circle class="bar" id="ring-bar" cx="95" cy="95" r="84" fill="none" stroke-width="10" stroke-dasharray="${C}" stroke-dashoffset="${C}"/>
        </svg>
        <div class="ring-label"><strong data-count="${info.level}">0</strong><span>Niveau</span></div>
      </div>
      <div class="stats">
        <div class="card stat" data-reveal><strong data-count="${s.xp}">0</strong><span>XP au total</span></div>
        <div class="card stat" data-reveal style="--d:100ms"><strong data-count="${nbLecons}">0</strong><span>Leçons finies</span></div>
        <div class="card stat" data-reveal style="--d:200ms"><strong data-count="${s.streak}">0</strong><span>Jours d'affilée</span></div>
        <div class="card stat" data-reveal style="--d:300ms"><strong data-count="${info.need - info.current}">0</strong><span>XP avant le niveau ${info.level + 1}</span></div>
      </div>
    </div>
    <h2 data-split>Badges</h2>
    <div class="badges">${badges}</div>
    <p style="margin-top:3rem"><button class="btn ghost" id="reset">Remettre la progression à zéro</button></p>
  `;
  requestAnimationFrame(() => {
    document.getElementById('ring-bar').style.strokeDashoffset = C * (1 - info.ratio);
    countUp(app);
  });
  document.getElementById('reset').addEventListener('click', () => {
    if (confirm('Effacer toute la progression ? On ne pourra pas revenir en arrière.')) {
      resetProgress();
      route(true);
    }
  });
}

function pageIntrouvable() {
  app.innerHTML = `
    <div class="empty">
      <div class="eyebrow">Erreur 404</div>
      <h1 data-split>Fausse <span class="grad-text">note</span></h1>
      <p class="lead" style="margin:0 auto 1.5rem">Cette page n'existe pas. On reprend depuis le début ?</p>
      <a href="#/" class="btn">Retour à l'accueil</a>
    </div>`;
}

// ---------- Routeur ----------
const ROUTES = {
  '': pageAccueil,
  parcours: pageParcours,
  piano: pagePiano,
  morceaux: pageMorceaux,
  profil: pageProfil,
};

function render(observe = true) {
  if (cleanup) { cleanup(); cleanup = null; }
  const [name = '', param] = location.hash.replace(/^#\/?/, '').split('/');
  document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.route === name));
  const page = name === 'lecon' ? () => pageLecon(param)
    : name === 'morceau' ? () => pageMorceau(param)
    : ROUTES[name] || pageIntrouvable;
  window.scrollTo(0, 0);
  const result = page();
  if (typeof result === 'function') cleanup = result;
  if (observe) observeReveals(app);
}

let first = true;
function route(instant = false) {
  if (first) {
    first = false;
    render(false);
    playIntro().then(() => observeReveals(app));
    return;
  }
  if (instant === true) { render(); return; }
  curtainSwap(render);
}

window.addEventListener('hashchange', () => route());
route();
