import { Piano3D } from './piano3d.js';
import { KEYBOARD_MAP, noteName } from './notes.js';
import { unlockAudio } from './audio.js';
import { getState, onChange, levelInfo, unlockBadge, resetProgress } from './progress.js';
import { PALIERS, palierStatus, isUnlocked } from './data/paliers.js';
import { MORCEAUX } from './data/morceaux.js';
import { BADGES } from './data/badges.js';

const app = document.getElementById('app');
let cleanup = null;

// ---------- Barre d'XP ----------
function refreshXp() {
  const info = levelInfo();
  document.getElementById('xp-level').textContent = `Niv. ${info.level}`;
  document.getElementById('xp-fill').style.width = `${Math.round(info.ratio * 100)}%`;
  document.getElementById('xp-chip').title = `${info.current} / ${info.need} XP avant le niveau ${info.level + 1}`;
}
onChange(refreshXp);
refreshXp();

// ---------- Piano partage par les pages ----------
function mountPiano(container, opts = {}) {
  container.innerHTML = '<div class="piano-loading">Le piano arrive...</div>';
  const narrow = window.innerWidth < 640;
  let piano;
  try {
    piano = new Piano3D(container, {
      low: opts.low ?? (narrow ? 55 : 48),
      high: opts.high ?? (narrow ? 76 : 84),
      ...opts,
    });
  } catch (e) {
    container.innerHTML = '<div class="piano-loading">Ton navigateur n\'arrive pas a afficher la 3D.</div>';
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
  document.addEventListener('pointerdown', unlockAudio, { once: true });

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
  app.innerHTML = `
    <section class="hero">
      <div>
        <span class="tag gold">Pour débuter de zéro</span>
        <h1>Apprendre le piano, une touche après l'autre</h1>
        <p class="lead">Ton prof te montre sur son piano, tu rejoues sur le tien. Le site t'écoute, te dit si c'est juste, et tu avances palier par palier : d'abord do ré mi, puis de vrais morceaux.</p>
        <div class="hero-actions">
          <a href="#/parcours" class="btn">Commencer le parcours</a>
          <a href="#/piano" class="btn ghost">Essayer le piano</a>
        </div>
      </div>
      <div class="hero-art" id="hero-piano"></div>
    </section>

    <h2>Comment ça marche</h2>
    <div class="grid steps">
      <div class="card"><h3>Le prof montre</h3><p>Il joue l'exercice doucement sur le piano 3D. Tu vois quelles touches, avec quels doigts.</p></div>
      <div class="card"><h3>Tu joues chez toi</h3><p>Sur ton vrai piano. Pose le téléphone ou la tablette sur le pupitre, le site t'écoute avec le micro.</p></div>
      <div class="card"><h3>Tu gagnes de l'XP</h3><p>Chaque leçon réussie rapporte de l'XP et des étoiles. Termine un palier pour débloquer le suivant.</p></div>
    </div>
  `;
  const m = mountPiano(document.getElementById('hero-piano'), { low: 60, high: 72 });
  return () => m.dispose();
}

function pageParcours() {
  const { lessonsDone } = getState();
  const items = PALIERS.map((p, i) => {
    const st = palierStatus(p, lessonsDone);
    const open = isUnlocked(i, lessonsDone);
    const cls = st.complete ? 'done' : open ? '' : 'locked';
    const lessons = p.lecons.map((l) => {
      const done = lessonsDone[l.id];
      const label = open ? `<a href="#/lecon/${l.id}">${l.titre}</a>` : l.titre;
      return `<li><span class="dot ${done ? 'done' : ''}"></span>${label}</li>`;
    }).join('');
    return `
      <div class="palier ${cls}">
        <div class="palier-num">${p.id}</div>
        <div class="card">
          <div style="display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap">
            <h3 style="margin:0">${p.titre}</h3>
            <span class="tag ${open ? '' : 'grey'}">${open ? `${st.done} / ${st.total} leçons` : 'Bloqué'}</span>
          </div>
          <p class="hint" style="margin:.4rem 0 0">${p.resume}</p>
          ${open ? `<ul class="lessons">${lessons}</ul>` : ''}
          <p class="hint" style="margin:.75rem 0 0">Morceau de fin : <strong>${p.final}</strong></p>
        </div>
      </div>`;
  }).join('');

  app.innerHTML = `
    <h1>Ton parcours</h1>
    <p class="lead">Huit paliers, du tout début jusqu'aux vrais morceaux. Finis toutes les leçons d'un palier pour ouvrir le suivant.</p>
    <div class="path">${items}</div>
  `;
}

function pagePiano() {
  app.innerHTML = `
    <h1>Piano libre</h1>
    <p class="lead">Joue ce que tu veux. Clique ou touche les touches, ou utilise la rangée du milieu de ton clavier d'ordinateur.</p>
    <div class="piano-wrap" id="piano"></div>
    <div class="piano-tools">
      <label class="toggle"><input type="checkbox" id="opt-labels" checked> Afficher le nom des notes</label>
      <label class="toggle"><input type="checkbox" id="opt-top"> Vue du dessus</label>
      <span class="now-playing" id="now"></span>
    </div>
    <p class="hint">Clavier d'ordinateur : <kbd>Q</kbd> <kbd>S</kbd> <kbd>D</kbd> <kbd>F</kbd> <kbd>G</kbd> <kbd>H</kbd> <kbd>J</kbd> <kbd>K</kbd> pour do ré mi fa sol la si do, et la rangée du dessus pour les touches noires. Le point doré marque le do du milieu.</p>
  `;
  const now = document.getElementById('now');
  const m = mountPiano(document.getElementById('piano'), {
    onNoteOn: (midi) => {
      now.textContent = noteName(midi);
      unlockBadge('premiere-note');
    },
  });
  if (!m.piano) return () => {};
  document.getElementById('opt-labels').addEventListener('change', (e) => m.piano.setLabelsVisible(e.target.checked));
  document.getElementById('opt-top').addEventListener('change', (e) => m.piano.setView(e.target.checked ? 'top' : 'front'));
  return () => m.dispose();
}

function pageLecon(id) {
  const palier = PALIERS.find((p) => p.lecons.some((l) => l.id === id));
  const lecon = palier?.lecons.find((l) => l.id === id);
  if (!lecon) return pageIntrouvable();
  app.innerHTML = `
    <p class="hint"><a href="#/parcours">Parcours</a> / Palier ${palier.id} - ${palier.titre}</p>
    <h1>${lecon.titre}</h1>
    <div class="card empty">
      <h2>Cette leçon arrive bientôt</h2>
      <p class="lead" style="margin:0 auto 1.5rem">Le prof est en train de s'installer au piano. En attendant, tu peux t'entraîner librement.</p>
      <a href="#/piano" class="btn">Aller au piano libre</a>
    </div>
  `;
}

function pageMorceaux() {
  const { lessonsDone } = getState();
  const cards = MORCEAUX.map((s) => {
    const open = isUnlocked(s.palier - 1, lessonsDone);
    return `
      <div class="card song ${open ? '' : 'locked'}">
        <h3 style="margin:0">${s.titre}</h3>
        <span class="hint">${s.auteur}</span>
        <div class="meta">
          <span class="tag">Palier ${s.palier}</span>
          <span class="tag ${s.type === 'actuel' ? 'gold' : 'grey'}">${s.type === 'actuel' ? 'Actuel' : 'Classique'}</span>
          ${open ? '' : '<span class="tag grey">Bloqué</span>'}
        </div>
      </div>`;
  }).join('');
  app.innerHTML = `
    <h1>Les morceaux</h1>
    <p class="lead">Ils se débloquent au fur et à mesure du parcours. Les plus simples d'abord.</p>
    <div class="grid">${cards}</div>
  `;
}

function pageProfil() {
  const s = getState();
  const info = levelInfo();
  const nbLecons = Object.keys(s.lessonsDone).length;
  const badges = BADGES.map((b) => `
    <div class="card badge ${s.badges.includes(b.id) ? 'got' : ''}">
      <span class="medal"></span>
      <div><strong>${b.titre}</strong><br><span class="hint">${b.desc}</span></div>
    </div>`).join('');
  app.innerHTML = `
    <h1>Ton profil</h1>
    <div class="stats">
      <div class="card stat"><strong>${info.level}</strong>Niveau</div>
      <div class="card stat"><strong>${s.xp}</strong>XP au total</div>
      <div class="card stat"><strong>${nbLecons}</strong>Leçons finies</div>
      <div class="card stat"><strong>${s.streak}</strong>Jours d'affilée</div>
    </div>
    <h2>Badges</h2>
    <div class="badges">${badges}</div>
    <p style="margin-top:2.5rem"><button class="btn ghost" id="reset">Remettre la progression à zéro</button></p>
  `;
  document.getElementById('reset').addEventListener('click', () => {
    if (confirm('Effacer toute la progression ? On ne pourra pas revenir en arrière.')) {
      resetProgress();
      pageProfil();
    }
  });
}

function pageIntrouvable() {
  app.innerHTML = `
    <div class="empty">
      <h1>Cette page n'existe pas</h1>
      <p class="lead" style="margin:0 auto 1.5rem">Fausse note ! On retourne au début ?</p>
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

function route() {
  if (cleanup) { cleanup(); cleanup = null; }
  const [name = '', param] = location.hash.replace(/^#\/?/, '').split('/');
  document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.route === name));
  const page = name === 'lecon' ? () => pageLecon(param) : ROUTES[name] || pageIntrouvable;
  const result = page();
  if (typeof result === 'function') cleanup = result;
  window.scrollTo(0, 0);
}

window.addEventListener('hashchange', route);
route();
