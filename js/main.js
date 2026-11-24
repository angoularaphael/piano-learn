import { mountPiano } from './mount.js';
import { noteName, isBlack, LAYOUTS, getLayout, setLayout, detectLayout, letterMap } from './notes.js';
import { setInstrument, INSTRUMENTS, setVolume, setReverb, loadStatus, onAudioChange, getContext, setSustain, allNotesOff } from './audio.js';
import {
  getState, onChange, levelInfo, unlockBadge, resetProgress, knownKeys, getSettings, setSetting, onSettings,
  markSeen,
} from './progress.js';
import { PALIERS, palierStatus, isUnlocked, lessonUnlocked, currentPalier, nextLesson } from './data/paliers.js';
import { SONGS, songOpen } from './data/library.js';
import { BADGES } from './data/badges.js';
import { instrumentAt, unlocksOf, STAGES } from './instrument.js';
import { playGate, pageTransition, observeReveals, countUp } from './fx.js';
import { createHeroScene } from './hero-scene.js';
import { renderLesson } from './lesson.js';
import { renderPlayer } from './tutorial.js';
import { renderBilan, needsBilan } from './bilan.js';
import { connectMidi, midiSupported, midiInputs, autoConnectMidi, onMidiDevices } from './midi.js';
import { speak, voiceAvailable } from './voice.js';
import { registerOffline, canInstall, isInstalled, isIOS, install, offlineReady, onInstallChange } from './app-install.js';
import { fr, esc, plural } from './text.js';

const app = document.getElementById('app');
let cleanup = null;

// ---------- Barre d'XP et son de l'instrument ----------
function refreshXp() {
  const info = levelInfo();
  document.getElementById('xp-level').textContent = `NIV ${info.level}`;
  document.getElementById('xp-fill').style.width = `${Math.round(info.ratio * 100)}%`;
  document.getElementById('xp-chip').title = `${info.current} / ${info.need} XP avant le niveau ${info.level + 1}`;
}

// Le son suit l'instrument du palier, sauf si l'eleve en a choisi un autre parmi ceux debloques
function applySound(instr = instrumentAt(currentPalier(getState()))) {
  const chosen = getSettings().son;
  setInstrument(chosen && instr.sons.includes(chosen) ? chosen : instr.son);
}
onChange(() => { refreshXp(); applySound(); });
refreshXp();
applySound();
const st0 = getSettings();
setVolume(st0.volume);
setReverb(st0.reverb);
onSettings((s, key) => {
  if (key === 'volume') setVolume(s.volume);
  if (key === 'reverb') setReverb(s.reverb);
  if (key === 'son') applySound();
});

const stars = (n) => `<span class="mini-stars" aria-label="${n} étoile${n > 1 ? 's' : ''} sur 3">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
const lock = '<svg class="lock" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 7V5.2a3.5 3.5 0 0 1 7 0V7" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="3" y="7" width="10" height="7.5" rx="2" fill="currentColor"/></svg>';

// Petites illustrations des trois corps de l'instrument
const STAGE_ART = {
  lumiere: `<svg viewBox="0 0 120 60" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.4">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${12 + i * 14}" y="14" width="12" height="34" rx="2" opacity="${[1, 1, 1, 0.9, 0.35, 0.25, 0.2][i]}"/>`).join('')}</g><g fill="currentColor">${[0, 1, 3, 4, 5].map((i) => `<rect x="${21 + i * 14}" y="14" width="7" height="20" rx="1.5" opacity="${i < 2 ? 0.9 : 0.25}"/>`).join('')}</g></svg>`,
  clavier: `<svg viewBox="0 0 120 60" aria-hidden="true"><rect x="6" y="18" width="108" height="28" rx="4" fill="none" stroke="currentColor" stroke-width="1.4"/><g fill="currentColor" opacity=".9">${Array.from({ length: 13 }, (_, i) => `<rect x="${10 + i * 8}" y="22" width="6.6" height="20" rx="1" opacity=".55"/>`).join('')}</g><g fill="currentColor">${[0, 1, 3, 4, 5, 7, 8, 10, 11].map((i) => `<rect x="${15 + i * 8}" y="22" width="4" height="12" rx=".8"/>`).join('')}</g><rect x="6" y="46" width="108" height="3" fill="#6d0f1c"/></svg>`,
  queue: `<svg viewBox="0 0 120 60" aria-hidden="true"><path d="M14 8 H92 V14 C92 26 62 28 58 44 C55 54 46 56 36 56 H22 C17 56 14 53 14 48 Z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M14 8 L104 2" stroke="currentColor" stroke-width="1.2" opacity=".6"/><path d="M92 14 L104 2" stroke="currentColor" stroke-width="1" opacity=".5"/><g stroke="currentColor" stroke-width=".6" opacity=".55">${Array.from({ length: 9 }, (_, i) => `<line x1="${20 + i * 7}" y1="12" x2="${20 + i * 5}" y2="${50 - i * 3}"/>`).join('')}</g><rect x="14" y="4" width="78" height="4" rx="1" fill="currentColor" opacity=".8"/></svg>`,
};

// ---------- Accueil ----------
function pageAccueil(_, { entered }) {
  app.classList.add('full');
  const state = getState();
  const nxt = nextLesson(state);
  const started = Object.keys(state.lessonsDone).length > 0;
  const cur = currentPalier(state);
  const instr = instrumentAt(cur);
  const words = ['Do', 'Ré', 'Mi', 'Fa', 'Sol', 'La', 'Si', 'Ode à la joie', 'Lettre à Élise', 'Gymnopédie', 'Clair de lune', 'Frère Jacques'];
  const marquee = [...words, ...words].map((w) => `<span>${esc(w)}</span>`).join('');
  const teaser = SONGS.slice(0, 1).concat(SONGS.filter((s) => s.palier > 1).sort((a, b) => a.palier - b.palier).filter((_, i) => i % 3 === 0)).slice(0, 4);
  app.innerHTML = `
    <section class="hero">
      <div class="hero-canvas" id="hero-canvas"></div>
      <div class="hero-content">
        <div class="eyebrow" data-reveal>Ton prof de piano, en 3D</div>
        <h1 data-split>Apprends le piano, <span class="grad-text">une touche</span> après l’autre</h1>
        <p class="lead" data-reveal style="--d:220ms">${fr('Le prof te montre sur son piano, tu rejoues sur le tien. Le site t’écoute, te dit si c’est juste, et ton instrument grandit avec toi.')}</p>
        <div class="hero-actions" data-reveal style="--d:320ms">
          ${started && nxt ? `<a href="#/lecon/${nxt.lecon.id}" class="btn">Reprendre : ${esc(nxt.lecon.titre)}</a>` : `<a href="${needsBilan() ? '#/bilan' : '#/lecon/1-1'}" class="btn">Commencer</a>`}
          <a href="#/piano" class="btn ghost">${started ? 'Mon piano' : 'Essayer le piano'}</a>
        </div>
      </div>
      <div class="hero-hint">PASSE SUR LES TOUCHES</div>
    </section>

    <div class="marquee" aria-hidden="true"><div class="marquee-track">${marquee}</div></div>

    <section class="section">
      <div class="eyebrow" data-reveal>Comment ça marche</div>
      <h2 data-split>Trois temps, à chaque leçon</h2>
      <div class="grid steps">
        ${[
          ['Le prof montre', 'Il joue l’exercice lentement sur son piano. Tu vois ses doigts, les touches s’allument.'],
          ['Tu joues chez toi', 'Sur ton vrai piano : pose le téléphone sur le pupitre, le site t’écoute au micro. Ou joue à l’écran.'],
          ['Le site attend', 'Il attend la bonne note, sans chrono. Il t’aide si tu hésites. Chaque leçon réussie rapporte de l’XP.'],
        ].map(([t, d], i) => `
          <div class="card" data-reveal style="--d:${i * 90}ms">
            <span class="num">0${i + 1}</span>
            <div class="keys-deco">${[0, 1, 2, 3, 4].map((k) => `<i style="--k:${k + i * 2}"></i>`).join('')}</div>
            <h3>${t}</h3><p class="hint" style="margin:0">${fr(d)}</p>
          </div>`).join('')}
      </div>
    </section>

    <section class="section grows">
      <div class="eyebrow" data-reveal>Ton instrument</div>
      <h2 data-split>Il grandit <span class="grad-text">avec toi</span></h2>
      <p class="lead" data-reveal>${fr('Personne ne commence devant un piano de concert. Tu commences sur un clavier de lumière ; chaque note apprise s’allume pour de bon. Puis la lumière prend corps, et le piano à queue t’attend.')}</p>
      <div class="stages">
        ${Object.values(STAGES).map((s, i) => {
          const open = cur >= s.palier;
          return `<div class="card stage-card ${open ? 'open' : ''} ${instr.stage === s.id ? 'current' : ''}" data-reveal style="--d:${i * 110}ms">
            <div class="stage-art">${STAGE_ART[s.id]}</div>
            <span class="tag ${open ? '' : 'grey'}">${instr.stage === s.id ? 'Ton instrument' : open ? 'Débloqué' : `Palier ${s.palier}`}</span>
            <h3>${esc(s.nom)}</h3>
            <p class="hint">${fr(s.desc)}</p>
            ${open ? '' : `<a class="link" href="#/piano?apercu=${s.palier}">Aperçu</a>`}
          </div>`;
        }).join('<div class="stage-arrow" aria-hidden="true"></div>')}
      </div>
    </section>

    <section class="section">
      <div class="eyebrow" data-reveal>Les morceaux</div>
      <h2 data-split>De vrais airs, très vite</h2>
      <div class="grid songs-teaser">
        ${teaser.map((s, i) => songCard(s, i, cur)).join('')}
      </div>
      <p data-reveal style="margin-top:1.6rem"><a class="btn ghost" href="#/morceaux">Toute la bibliothèque · ${plural(SONGS.length, 'morceau', 'morceaux')}</a></p>
    </section>
    ${footer()}
  `;
  const hero = createHeroScene(document.getElementById('hero-canvas'), { unfold: entered });
  return () => { hero.dispose(); app.classList.remove('full'); };
}

function footer() {
  return `<footer class="foot">
    <p>${fr('Rien ne quitte ton appareil : l’écoute au micro et ta progression restent dans ton navigateur.')}</p>
    <p class="credits">${fr('Sons de piano : Salamander Grand Piano, Alexander Holm (CC-BY 3.0). Prof 3D : modèle X Bot de Mixamo.')}</p>
  </footer>`;
}

// ---------- Parcours ----------
function pageParcours() {
  const state = getState();
  const cur = currentPalier(state);
  const nxt = nextLesson(state);
  const items = PALIERS.map((p, i) => {
    const st = palierStatus(p, state.lessonsDone);
    const open = isUnlocked(i, state);
    const cls = st.complete ? 'done' : open ? 'open' : 'locked';
    const boss = p.lecons.find((l) => l.boss);
    const bossSong = boss ? SONGS.find((s) => s.id === boss.morceau) : null;
    const gifts = unlocksOf(p.id);
    const lessons = p.lecons.map((l, j) => {
      const done = state.lessonsDone[l.id];
      const can = lessonUnlocked(i, j, state);
      const isNext = nxt?.lecon.id === l.id;
      const inner = `<span class="dot ${done ? 'done' : ''} ${l.boss ? 'boss' : ''}"></span><span class="lt">${esc(l.titre)}</span>${done ? stars(done.stars) : isNext ? '<span class="tag">À faire</span>' : can ? '' : lock}`;
      return `<li class="${isNext ? 'next' : ''}">${can ? `<a href="#/lecon/${l.id}">${inner}</a>` : `<span class="l">${inner}</span>`}</li>`;
    }).join('');
    return `
      <div class="palier ${cls}" data-reveal>
        <div class="palier-num">${p.id}</div>
        <div class="card">
          <div class="palier-head">
            <h3>${esc(p.titre)}</h3>
            <span class="tag ${open ? (st.complete ? 'gold' : '') : 'grey'}">${p.bientot ? 'Bientôt' : open ? (st.complete ? 'Terminé' : `${st.done} / ${st.total}`) : 'Bloqué'}</span>
          </div>
          <p class="hint">${fr(esc(p.resume))}</p>
          ${open && !p.bientot ? `<div class="progress-line"><span style="width:${(st.done / Math.max(1, st.total)) * 100}%"></span></div><ul class="lessons">${lessons}</ul>` : ''}
          ${bossSong ? `<p class="hint boss-line">Morceau de fin : <strong>${esc(bossSong.titre)}</strong></p>` : ''}
          ${gifts.length ? `<div class="gifts">${gifts.map((g) => `<span class="gift ${g.type}">${esc(g.nom)}</span>`).join('')}</div>` : ''}
          ${!open && gifts.some((g) => g.type === 'stage') ? `<a class="link" href="#/piano?apercu=${p.id}">Voir l’aperçu</a>` : ''}
        </div>
      </div>`;
  }).join('');

  app.innerHTML = `
    <div class="eyebrow" data-reveal>8 paliers</div>
    <h1 data-split>Ton <span class="grad-text">parcours</span></h1>
    <p class="lead" data-reveal style="--d:200ms">${fr('Du tout premier do jusqu’aux vrais morceaux. Chaque palier se termine par un morceau, et chaque palier fait grandir ton instrument.')}</p>
    <div class="placement card" data-reveal style="--d:260ms">
      <div>
        <strong>${state.bilan ? fr(`Ton niveau : ${{ debutant: 'je débute', intermediaire: 'je joue un peu', expert: 'je joue bien' }[state.bilan.niveau] || 'fait'}`) : 'Tu sais déjà jouer ?'}</strong>
        <p class="hint">${fr(state.bilan ? `Bilan du ${new Date(state.bilan.date).toLocaleDateString('fr-FR', { day: 'numeric', month: 'long' })} : départ au palier ${state.bilan.palier}. Tu peux le refaire quand tu veux.` : 'Deux minutes de questions et de petits tests joués, et le prof te place au bon palier.')}</p>
      </div>
      <a class="btn ghost small" href="#/bilan">${state.bilan ? 'Refaire le bilan' : 'Faire le bilan'}</a>
    </div>
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

// ---------- Mon piano ----------
// Le piano entier, toujours : 88 touches, un vrai clavier bien visible. Ce qui grandit avec le parcours,
// c'est son corps (vrai clavier, puis piano a queue), ses sons, ses fonctions, et la lumiere des notes apprises.
const look = (instr) => (instr.stage === 'lumiere' ? 'clavier' : instr.stage);

function miniKeys(known) {
  const whites = [];
  const blacks = [];
  let w = 0;
  for (let m = 21; m <= 108; m++) {
    if (isBlack(m)) blacks.push({ m, x: w });
    else whites.push({ m, x: w++ });
  }
  const W = 100 / whites.length;
  return whites.map((k) => `<i class="w ${known?.has(k.m) ? 'on' : ''} ${k.m === 60 ? 'c4' : ''}" data-m="${k.m}" style="left:${k.x * W}%;width:${W}%"></i>`).join('')
    + blacks.map((k) => `<i class="b ${known?.has(k.m) ? 'on' : ''}" data-m="${k.m}" style="left:${k.x * W - W * 0.32}%;width:${W * 0.64}%"></i>`).join('');
}

// Position (0 a 1) d'une note sur la longueur du clavier, comptee en touches blanches
function whiteFrac(midi) {
  let w = 0;
  for (let m = 21; m < midi; m++) if (!isBlack(m)) w++;
  return w / 52;
}

function pagePiano(_, { query }) {
  const state = getState();
  const cur = currentPalier(state);
  const apercu = query.get('apercu') ? Math.min(8, Math.max(1, Number(query.get('apercu')))) : null;
  const nouveau = query.get('nouveau') ? Number(query.get('nouveau')) : null;
  const ceremony = nouveau && nouveau <= cur && nouveau > 1;
  const level = apercu || cur;
  const instr = instrumentAt(level);
  const from = ceremony ? instrumentAt(nouveau - 1) : instr;
  const known = apercu ? null : knownKeys();
  const settings = getSettings();
  const soundNow = settings.son && instr.sons.includes(settings.son) ? settings.son : instr.son;
  const hasKeyboard = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  let layout = getLayout();
  let letters = hasKeyboard && settings.lettres !== false;
  if (apercu) setInstrument(instr.son);

  app.innerHTML = `
    <div class="piano-head">
      <div>
        <div class="eyebrow" data-reveal>${apercu ? `Aperçu · palier ${apercu}` : 'Mon piano'}</div>
        <h1 data-split>${esc(STAGES[look(instr)].nom)}</h1>
      </div>
      <span class="now-playing grad-text" id="now" aria-live="off"></span>
    </div>
    ${apercu ? `<div class="preview-banner" data-reveal><span>${fr(`Voici ton instrument tel qu’il sera au palier ${apercu}. Ta progression ne change pas.`)}</span><a class="btn ghost small" href="#/piano">Revenir à mon piano</a></div>` : ''}
    <div class="stage piano-stage" data-reveal style="--d:100ms">
      <div class="piano-wrap" id="piano"></div>
      <div class="ceremony" id="ceremony" hidden></div>
    </div>
    <div class="minimap" id="minimap" data-reveal style="--d:160ms" role="slider" tabindex="0" aria-label="Partie du clavier affichée" aria-valuemin="21" aria-valuemax="108">
      ${miniKeys(known)}
      <span class="mm-window" id="mm-window"></span>
    </div>
    <div class="piano-tools">
      <div class="seg" id="views" role="group" aria-label="Vue">
        <button data-v="front" class="on">Face</button><button data-v="top">Dessus</button>${look(instr) === 'queue' ? '<button data-v="grand">Piano entier</button>' : ''}
      </div>
      <button class="chip" id="zoom" aria-pressed="false">Tout le clavier</button>
      ${instr.features.has('cacher-noms') ? `<label class="chip-toggle"><input type="checkbox" id="opt-labels" ${settings.noms ? 'checked' : ''}> Nom des notes</label>` : ''}
      ${hasKeyboard ? `<label class="chip-toggle"><input type="checkbox" id="opt-letters" ${letters ? 'checked' : ''}> Lettres du clavier</label>` : ''}
      ${instr.features.has('pedale') ? '<button class="chip pedal" id="pedal">Pédale</button>' : ''}
    </div>
    ${hasKeyboard ? `<div class="layout-pick" id="layout-pick" role="radiogroup" aria-label="Disposition de ton clavier d’ordinateur">
      <span class="hint">Ton clavier</span>
      <div class="seg">${Object.entries(LAYOUTS).map(([id, l]) => `<button type="button" data-layout="${id}" role="radio">${l.nom}</button>`).join('')}</div>
    </div>` : ''}
    <p class="hint keys-hint" id="kbd-hint"></p>
    <div class="sounds" data-reveal>
      ${Object.entries(INSTRUMENTS).map(([id, ins]) => {
        const open = instr.sons.includes(id);
        const at = [1, 2, 3, 4, 5, 6, 7, 8].find((p) => instrumentAt(p).sons.includes(id));
        return `<button class="sound ${open ? '' : 'locked'} ${id === soundNow ? 'on' : ''}" data-son="${id}" ${open ? '' : 'disabled'}>
          <strong>${esc(ins.nom)}</strong><span>${open ? fr(esc(ins.desc)) : `${lock} Palier ${at}`}</span></button>`;
      }).join('')}
    </div>
    <div class="stages compact">
      ${Object.values(STAGES).filter((s) => s.id !== 'lumiere').map((s) => `<a class="card stage-card ${level >= s.palier ? 'open' : ''} ${look(instr) === s.id ? 'current' : ''}" href="#/piano${s.palier <= cur ? '' : `?apercu=${s.palier}`}">
          <div class="stage-art">${STAGE_ART[s.id]}</div>
          <span class="tag ${cur >= s.palier ? '' : 'grey'}">${look(instr) === s.id ? 'Ton instrument' : cur >= s.palier ? 'Débloqué' : `Palier ${s.palier} · aperçu`}</span>
          <h3>${esc(s.nom)}</h3><p class="hint">${fr(esc(s.desc))}</p></a>`).join('')}
    </div>
  `;
  const now = document.getElementById('now');
  const minimap = document.getElementById('minimap');
  const mmWindow = document.getElementById('mm-window');
  const zoomBtn = document.getElementById('zoom');
  const hintEl = document.getElementById('kbd-hint');

  // Fenetre affichee : des touches assez larges pour le doigt (environ 46 px par touche blanche)
  let center = 64;
  let shift = 0;
  let whole = false;
  const span = () => {
    const w = document.getElementById('piano').clientWidth || 800;
    // Au doigt, une touche blanche fait au moins 64 px ; a la souris, 46 px
    const px = window.matchMedia('(pointer: coarse)').matches ? 64 : 46;
    const whites = Math.max(6, Math.min(52, Math.round(w / px)));
    return Math.round((whites * 12) / 7);
  };

  const m = mountPiano(document.getElementById('piano'), {
    low: 21, high: 108, stage: look(from), known, view: 'front',
    labels: instr.features.has('cacher-noms') ? settings.noms : true,
    pedal: () => instr.features.has('pedale'),
    onShift: (s) => { shift = s; center = 64 + s; whole = false; placeWindow(); applyLetters(); },
    onNoteOn: (midi) => {
      now.textContent = noteName(midi);
      now.classList.remove('hit');
      void now.offsetWidth;
      now.classList.add('hit');
      unlockBadge('premiere-note');
      const key = minimap.querySelector(`[data-m="${midi}"]`);
      if (key) { key.classList.remove('hit'); void key.offsetWidth; key.classList.add('hit'); }
      // La note jouee sort de la fenetre : la camera la suit
      const half = span() / 2;
      if (!whole && (midi < center - half || midi > center + half)) { center = midi; placeWindow(); }
    },
  });
  if (!m.piano) return () => {};
  const piano = m.piano;

  function placeWindow() {
    const half = span() / 2;
    center = Math.max(21 + half, Math.min(108 - half, center));
    const lo = Math.round(center - half);
    const hi = Math.round(center + half);
    if (whole) piano.setFocus(null);
    else piano.setFocus(lo, hi);
    const a = whole ? 0 : whiteFrac(lo);
    const b = whole ? 1 : whiteFrac(hi) + 1 / 52;
    mmWindow.style.left = `${a * 100}%`;
    mmWindow.style.width = `${(b - a) * 100}%`;
    minimap.setAttribute('aria-valuenow', Math.round(center));
    minimap.setAttribute('aria-valuetext', `Autour du ${noteName(Math.round(center), true)}`);
    zoomBtn.setAttribute('aria-pressed', whole);
    zoomBtn.classList.toggle('on', whole);
  }

  // La bande du clavier entier : on la touche ou on la fait glisser pour se deplacer
  let dragging = false;
  const fromX = (clientX) => {
    const r = minimap.getBoundingClientRect();
    const f = Math.max(0, Math.min(1, (clientX - r.left) / r.width));
    let w = 0;
    for (let mm = 21; mm <= 108; mm++) {
      if (isBlack(mm)) continue;
      if (w / 52 >= f) return mm;
      w++;
    }
    return 108;
  };
  minimap.addEventListener('pointerdown', (e) => {
    dragging = true;
    whole = false;
    minimap.setPointerCapture(e.pointerId);
    center = fromX(e.clientX);
    placeWindow();
  });
  minimap.addEventListener('pointermove', (e) => { if (dragging) { center = fromX(e.clientX); placeWindow(); } });
  const stopDrag = () => { dragging = false; };
  minimap.addEventListener('pointerup', stopDrag);
  minimap.addEventListener('pointercancel', stopDrag);
  minimap.addEventListener('keydown', (e) => {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault();
      e.stopPropagation();
      center += e.key === 'ArrowLeft' ? -7 : 7;
      whole = false;
      placeWindow();
    }
  });
  zoomBtn.addEventListener('click', () => { whole = !whole; placeWindow(); });
  const onResize = () => placeWindow();
  window.addEventListener('resize', onResize);
  placeWindow();

  // Vues
  const views = document.getElementById('views');
  views.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]');
    if (!b) return;
    views.querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    piano.setView(b.dataset.v);
  });
  document.getElementById('opt-labels')?.addEventListener('change', (e) => setSetting('noms', e.target.checked));

  // Clavier d'ordinateur : la disposition (AZERTY, QWERTY, QWERTZ) et les lettres sur les touches
  function applyLetters() {
    document.querySelectorAll('#layout-pick button').forEach((b) => {
      b.classList.toggle('on', b.dataset.layout === layout);
      b.setAttribute('aria-checked', b.dataset.layout === layout);
    });
    const keys = LAYOUTS[layout].keys;
    const kb = (codes) => codes.map((c) => `<kbd>${keys[c]}</kbd>`).join(' ');
    hintEl.innerHTML = hasKeyboard
      ? `${kb(['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK'])} ${fr('jouent do ré mi fa sol la si do,')} ${kb(['KeyW', 'KeyE', 'KeyT', 'KeyY', 'KeyU'])} ${fr('les touches noires. Les flèches ← → changent d’octave.')}${known ? ` <strong>${fr(`${known.size} ${known.size > 1 ? 'notes apprises' : 'note apprise'} sur 88.`)}</strong>` : ''}`
      : `${fr('Touche les notes du bout du doigt ; glisse sur la bande pour parcourir tout le clavier.')}${known ? ` <strong>${fr(`${known.size} ${known.size > 1 ? 'notes apprises' : 'note apprise'} sur 88.`)}</strong>` : ''}`;
    if (!hasKeyboard) return;
    const map = {};
    if (letters) for (const [mid, l] of Object.entries(letterMap(layout))) map[Number(mid) + shift] = l;
    piano.setKeyLetters(letters ? map : null);
  }
  document.getElementById('opt-letters')?.addEventListener('change', (e) => { letters = e.target.checked; setSetting('lettres', letters); applyLetters(); });
  document.getElementById('layout-pick')?.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-layout]');
    if (!b) return;
    layout = b.dataset.layout;
    setLayout(layout);
    applyLetters();
  });
  applyLetters();
  // Chrome et Edge savent lire la vraie disposition du clavier branche
  if (hasKeyboard) detectLayout().then((found) => { if (found !== layout) { layout = found; applyLetters(); } });

  // Sons
  app.querySelectorAll('.sound[data-son]').forEach((b) => b.addEventListener('click', () => {
    if (b.disabled) return;
    setSetting('son', b.dataset.son);
    setInstrument(b.dataset.son);
    app.querySelectorAll('.sound').forEach((x) => x.classList.toggle('on', x === b));
    piano.tap(60, 500, 0.75);
    setTimeout(() => piano.tap(64, 500, 0.65), 120);
    setTimeout(() => piano.tap(67, 700, 0.65), 240);
  }));

  // Pedale a l'ecran
  const pedal = document.getElementById('pedal');
  if (pedal) {
    const set = (on) => { setSustain(on); piano.grand?.setPedal(on); pedal.classList.toggle('on', on); };
    pedal.addEventListener('pointerdown', (e) => { e.preventDefault(); pedal.setPointerCapture(e.pointerId); set(true); });
    pedal.addEventListener('pointerup', () => set(false));
    pedal.addEventListener('pointercancel', () => set(false));
  }

  // Ceremonie : l'instrument du palier precedent se transforme sous tes yeux
  if (ceremony) {
    const gifts = unlocksOf(nouveau);
    const box = document.getElementById('ceremony');
    box.innerHTML = `
      <div class="ceremony-card">
        <div class="eyebrow" style="justify-content:center">Palier ${nouveau} ouvert</div>
        <h2>${esc(PALIERS[nouveau - 1].titre)}</h2>
        <ul>${gifts.map((g, i) => `<li style="--i:${i}"><strong>${esc(g.nom)}</strong><span>${fr(esc(g.desc))}</span></li>`).join('')}</ul>
        <div class="result-actions"><button class="btn" id="cer-play">Jouer</button><a class="btn ghost" href="#/parcours">Voir le parcours</a></div>
      </div>`;
    markSeen(`palier-${nouveau}`);
    if (nouveau >= 3) unlockBadge('vrai-clavier');
    if (nouveau >= 6) unlockBadge('piano-queue');
    const changes = look(instr) !== look(from);
    setTimeout(() => {
      if (changes) {
        piano.setStage(look(instr), { animate: true });
        if (look(instr) === 'queue') piano.setView('grand');
      }
      applySound(instr);
      setTimeout(() => {
        box.hidden = false;
        piano.tap(60, 900, 0.7);
        setTimeout(() => piano.tap(64, 900, 0.6), 150);
        setTimeout(() => piano.tap(67, 900, 0.6), 300);
        setTimeout(() => piano.tap(72, 1400, 0.7), 450);
      }, changes ? 2600 : 700);
    }, 600);
    box.addEventListener('click', (e) => {
      if (e.target.id !== 'cer-play') return;
      box.hidden = true;
      piano.setView('front');
      history.replaceState(null, '', '#/piano');
    });
  }

  return () => {
    window.removeEventListener('resize', onResize);
    m.dispose();
    if (apercu) applySound();
  };
}

// ---------- Morceaux ----------
function songCard(s, i, cur) {
  const open = songOpen(s, cur);
  const st = getState();
  const done = s.lecon ? st.lessonsDone[s.lecon] : st.songsDone[s.id];
  let seed = [...s.id].reduce((a, c) => a + c.charCodeAt(0), 0);
  const wave = Array.from({ length: 22 }, (_, k) => {
    seed = (seed * 9301 + 49297) % 233280;
    return `<i style="--h:${25 + (seed / 233280) * 75};--k:${k}"></i>`;
  }).join('');
  const href = s.lecon ? `#/lecon/${s.lecon}` : `#/morceau/${s.id}`;
  return `
    <a class="card song ${open ? '' : 'locked'}" href="${href}" data-reveal style="--d:${(i % 3) * 80}ms">
      <div class="wave">${wave}</div>
      <h3>${esc(s.titre)}</h3>
      <span class="hint">${esc([s.compositeur, s.annee].filter(Boolean).join(' · '))}</span>
      <div class="meta">
        ${s.libre ? '<span class="tag gold">Libre</span>' : `<span class="tag ${open ? '' : 'grey'}">${open ? '' : lock}Palier ${s.palier}</span>`}
        ${s.actuel ? '<span class="tag">Actuel</span>' : ''}
        ${s.lecon ? '<span class="tag grey">Avec le prof</span>' : ''}
        <span class="lvl" aria-label="Difficulté ${s.niveau || 1} sur 5">${'●'.repeat(s.niveau || 1)}<b>${'●'.repeat(5 - (s.niveau || 1))}</b></span>
        ${done ? stars(done.stars) : ''}
      </div>
    </a>`;
}

function pageMorceaux() {
  const cur = currentPalier(getState());
  const free = SONGS.filter((s) => s.libre);
  const groups = PALIERS.map((p) => ({ p, list: SONGS.filter((s) => s.palier === p.id && !s.libre) })).filter((g) => g.list.length);
  let i = 0;
  app.innerHTML = `
    <div class="eyebrow" data-reveal>Bibliothèque</div>
    <h1 data-split>Les <span class="grad-text">morceaux</span></h1>
    <p class="lead" data-reveal style="--d:200ms">${fr(`${SONGS.length > 1 ? `${SONGS.length} morceaux, du plus simple au plus beau` : 'Les morceaux, du plus simple au plus beau'}. Les notes descendent vers les touches : écoute-les, puis joue-les à ton rythme.`)}</p>
    ${free.length ? `
      <section class="song-group">
        <h2 class="group-title" data-reveal><span>Libres</span>${fr('Pour le plaisir, dès maintenant')}</h2>
        <div class="grid">${free.map((s) => songCard(s, i++, cur)).join('')}</div>
      </section>` : ''}
    ${groups.map(({ p, list }) => `
      <section class="song-group">
        <h2 class="group-title" data-reveal><span>Palier ${p.id}</span>${esc(p.titre)}${p.id > cur ? ` <em>${lock} écoute seulement</em>` : ''}</h2>
        <div class="grid">${list.map((s) => songCard(s, i++, cur)).join('')}</div>
      </section>`).join('')}
  `;
}

// ---------- Profil ----------
function keysMap(known) {
  const whites = [];
  const blacks = [];
  let w = 0;
  for (let m = 21; m <= 108; m++) {
    if (isBlack(m)) blacks.push({ m, x: w });
    else whites.push({ m, x: w++ });
  }
  const W = 100 / whites.length;
  return `<div class="keys-map" role="img" aria-label="${known.size} touches apprises sur 88">
    ${whites.map((k) => `<i class="w ${known.has(k.m) ? 'on' : ''} ${k.m === 60 ? 'c4' : ''}" style="left:${k.x * W}%;width:${W}%"></i>`).join('')}
    ${blacks.map((k) => `<i class="b ${known.has(k.m) ? 'on' : ''}" style="left:${k.x * W - W * 0.32}%;width:${W * 0.64}%"></i>`).join('')}
  </div>`;
}

function pageProfil() {
  const s = getState();
  const info = levelInfo();
  const known = knownKeys();
  const nbLecons = Object.keys(s.lessonsDone).length;
  const cur = currentPalier(s);
  const instr = instrumentAt(cur);
  const C = 2 * Math.PI * 84;
  const name = getSettings().prenom;
  const badges = BADGES.map((b, i) => `
    <div class="card badge ${s.badges.includes(b.id) ? 'got' : ''}" data-reveal style="--d:${i * 60}ms">
      <span class="medal"></span>
      <div><strong>${esc(b.titre)}</strong><br><span class="hint">${fr(esc(b.desc))}</span></div>
    </div>`).join('');
  app.innerHTML = `
    <div class="eyebrow" data-reveal>Profil</div>
    <h1 data-split>${name ? `${esc(name)}, ta` : 'Ta'} <span class="grad-text">progression</span></h1>
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
        <div class="card stat" data-reveal style="--d:80ms"><strong data-count="${nbLecons}">0</strong><span>Leçons réussies</span></div>
        <div class="card stat" data-reveal style="--d:160ms"><strong data-count="${s.streak}">0</strong><span>Jours d’affilée</span></div>
        <div class="card stat" data-reveal style="--d:240ms"><strong data-count="${info.need - info.current}">0</strong><span>XP avant le niveau ${info.level + 1}</span></div>
      </div>
    </div>
    <section class="card keys-card" data-reveal>
      <div class="keys-card-head">
        <div><div class="eyebrow">Ta carte du clavier</div><h2><span data-count="${known.size}">0</span> <small>notes apprises sur 88</small></h2></div>
        <a class="btn ghost small" href="#/piano">${esc(STAGES[instr.stage].nom)}</a>
      </div>
      ${keysMap(known)}
      <p class="hint">${fr('Chaque note réussie dans une leçon s’allume ici, et sur ton piano.')}</p>
    </section>
    <h2 data-split>Badges</h2>
    <div class="badges">${badges}</div>
    <p style="margin-top:2.5rem"><a class="btn ghost" href="#/reglages">Réglages</a></p>
  `;
  requestAnimationFrame(() => {
    document.getElementById('ring-bar').style.strokeDashoffset = C * (1 - info.ratio);
    countUp(app);
  });
}

// ---------- Reglages ----------
function pageReglages() {
  const s = getSettings();
  const instr = instrumentAt(currentPalier(getState()));
  app.innerHTML = `
    <div class="eyebrow" data-reveal>Réglages</div>
    <h1 data-split>À ta <span class="grad-text">main</span></h1>
    <div class="settings">
      <section class="card set" data-reveal>
        <h3>Toi</h3>
        <label class="field"><span>Ton prénom</span><input type="text" id="set-prenom" maxlength="30" value="${esc(s.prenom)}" placeholder="Pour que le prof t’appelle par ton nom" autocomplete="given-name"></label>
      </section>
      <section class="card set" data-reveal style="--d:60ms">
        <h3>Le son</h3>
        <label class="field"><span>Volume</span><input type="range" id="set-volume" min="0" max="120" value="${Math.round(s.volume * 100)}"></label>
        <label class="field"><span>Résonance de la salle</span><input type="range" id="set-reverb" min="0" max="200" value="${Math.round(s.reverb * 100)}"></label>
        <p class="hint" id="load-state"></p>
      </section>
      <section class="card set" data-reveal style="--d:120ms">
        <h3>Le micro</h3>
        <p class="hint">${fr('Joue une note sur ton piano : elle doit s’afficher ici. Le site s’adapte tout seul si ton piano est un peu désaccordé.')}</p>
        <div class="mic-test"><button class="btn ghost small" id="mic-test">Tester le micro</button><span class="meter"><span id="mic-meter"></span></span><strong id="mic-note">–</strong></div>
      </section>
      <section class="card set" data-reveal style="--d:180ms">
        <h3>Piano numérique</h3>
        <p class="hint">${fr(midiSupported() ? 'Branche ton piano numérique en USB (ou en Bluetooth) : chaque note est reconnue sans aucune erreur.' : 'Ton navigateur ne gère pas les pianos numériques. Chrome ou Edge le font.')}</p>
        ${midiSupported() ? '<div class="mic-test"><button class="btn ghost small" id="midi-btn">Connecter</button><span class="hint" id="midi-list"></span></div>' : ''}
      </section>
      <section class="card set" data-reveal style="--d:240ms">
        <h3>Le prof</h3>
        ${voiceAvailable() ? `<label class="chip-toggle"><input type="checkbox" id="set-voix" ${s.voix ? 'checked' : ''}> Il parle à voix haute</label> <button class="btn ghost small" id="voice-test">Écouter</button>` : ''}
        <label class="field"><span>Vitesse des démonstrations et des morceaux</span><input type="range" id="set-vitesse" min="40" max="100" step="5" value="${Math.round(s.vitesse * 100)}"></label>
      </section>
      <section class="card set" data-reveal style="--d:300ms">
        <h3>Le toucher</h3>
        <label class="chip-toggle"><input type="checkbox" id="set-vibration" ${s.vibration ? 'checked' : ''}> Petite vibration sous le doigt (Android)</label>
        ${instr.features.has('cacher-noms') ? `<label class="chip-toggle"><input type="checkbox" id="set-noms" ${s.noms ? 'checked' : ''}> Nom des notes sur les touches</label>` : ''}
      </section>
      <section class="card set" data-reveal style="--d:330ms">
        <h3>L’application</h3>
        <p class="hint">${fr('Installe le site sur ta tablette ou ton téléphone : il s’ouvre en plein écran, et il marche même sans réseau, posé sur le pupitre.')}</p>
        <div class="mic-test"><button class="btn small" id="install-btn" hidden>Installer</button><span class="hint" id="install-state"></span></div>
      </section>
      <section class="card set danger" data-reveal style="--d:360ms">
        <h3>Ta progression</h3>
        <p class="hint">${fr('Elle est gardée dans ce navigateur. La remettre à zéro efface les leçons, les notes apprises, l’XP et les badges.')}</p>
        <button class="btn ghost small" id="reset">Tout remettre à zéro</button>
      </section>
    </div>
    ${footer()}
  `;
  const $ = (id) => document.getElementById(id);
  $('set-prenom').addEventListener('change', (e) => setSetting('prenom', e.target.value.trim()));
  $('set-volume').addEventListener('input', (e) => setSetting('volume', Number(e.target.value) / 100));
  $('set-reverb').addEventListener('input', (e) => setSetting('reverb', Number(e.target.value) / 100));
  $('set-vitesse').addEventListener('input', (e) => setSetting('vitesse', Number(e.target.value) / 100));
  $('set-vibration').addEventListener('change', (e) => { setSetting('vibration', e.target.checked); if (e.target.checked) navigator.vibrate?.(12); });
  $('set-noms')?.addEventListener('change', (e) => setSetting('noms', e.target.checked));
  $('set-voix')?.addEventListener('change', (e) => setSetting('voix', e.target.checked));
  $('voice-test')?.addEventListener('click', () => {
    const p = getSettings().prenom;
    speak(`Bonjour${p ? ` ${p}` : ''}. On reprend là où on s’était arrêtés ?`, { force: true });
  });
  $('reset').addEventListener('click', () => {
    if (confirm('Tout effacer ? Les leçons, les notes apprises, l’XP et les badges. On ne pourra pas revenir en arrière.')) {
      resetProgress();
      route(true);
    }
  });
  const loadState = $('load-state');
  const refreshLoad = () => {
    const st = loadStatus(...instrumentAt(currentPalier(getState())).range);
    const ctx = getContext();
    const lat = Math.round(((ctx.baseLatency || 0) + (ctx.outputLatency || 0)) * 1000);
    loadState.textContent = fr(`Sons du piano prêts : ${st.ready} sur ${st.total}.${lat ? ` Délai de ta sortie audio : ${lat} ms.` : ''}`);
  };
  refreshLoad();
  const offAudio = onAudioChange(refreshLoad);

  let listener = null;
  $('mic-test').addEventListener('click', async () => {
    if (listener) { listener.stop(); listener = null; $('mic-test').textContent = 'Tester le micro'; return; }
    const { Listener } = await import('./listen.js');
    const l = new Listener({
      onNote: (midi) => { $('mic-note').textContent = noteName(midi, true); },
      onLevel: (v) => { $('mic-meter').style.width = `${Math.round(v * 100)}%`; },
    });
    try {
      await l.start();
      listener = l;
      $('mic-test').textContent = 'Arrêter';
    } catch (e) {
      $('mic-note').textContent = 'Micro refusé';
    }
  });

  const midiList = $('midi-list');
  const showMidi = (list) => { if (midiList) midiList.textContent = list.length ? `Connecté : ${list.join(', ')}` : 'Aucun piano détecté pour l’instant.'; };
  const offMidi = onMidiDevices(showMidi);
  if (midiInputs().length) showMidi(midiInputs());
  $('midi-btn')?.addEventListener('click', async () => {
    try { showMidi(await connectMidi()); } catch (e) { if (midiList) midiList.textContent = 'Accès refusé.'; }
  });

  const installBtn = $('install-btn');
  const installState = $('install-state');
  const refreshInstall = async () => {
    const ready = await offlineReady();
    installBtn.hidden = !canInstall() || isInstalled();
    installState.textContent = fr(isInstalled() ? 'Installée sur cet appareil.'
      : canInstall() ? (ready ? 'Prête à marcher hors ligne.' : '')
      : isIOS() ? 'Sur iPhone et iPad : touche Partager, puis « Sur l’écran d’accueil ».'
      : `Ton navigateur propose l’installation dans son menu.${ready ? ' Le site marche déjà hors ligne.' : ''}`);
  };
  installBtn.addEventListener('click', () => install().then(refreshInstall));
  const offInstall = onInstallChange(refreshInstall);
  refreshInstall();

  return () => { listener?.stop(); offAudio(); offMidi(); offInstall(); };
}

// ---------- Morceau, lecon, 404 ----------
function pageMorceau(id) {
  const out = renderPlayer(app, id);
  return out === null ? pageIntrouvable() : out;
}

function pageBilan(_, { query }) {
  return renderBilan(app, { next: query.get('next') });
}

function pageLecon(id) {
  const out = renderLesson(app, id);
  return out === null ? pageIntrouvable() : out;
}

function pageIntrouvable() {
  app.innerHTML = `
    <div class="empty">
      <div class="eyebrow">Erreur 404</div>
      <h1 data-split>Fausse <span class="grad-text">note</span></h1>
      <p class="lead" style="margin:0 auto 1.5rem">Cette page n’existe pas. On reprend depuis le début ?</p>
      <a href="#/" class="btn">Retour à l’accueil</a>
    </div>`;
}

// ---------- Routeur ----------
const ROUTES = {
  '': pageAccueil,
  parcours: pageParcours,
  piano: pagePiano,
  morceaux: pageMorceaux,
  profil: pageProfil,
  reglages: pageReglages,
  bilan: pageBilan,
};

function parse() {
  const raw = location.hash.replace(/^#\/?/, '');
  const [path, qs = ''] = raw.split('?');
  const [name = '', param] = path.split('/');
  return { name, param, query: new URLSearchParams(qs) };
}

function render(opts = {}) {
  if (cleanup) { cleanup(); cleanup = null; }
  // Rien ne continue de sonner d'une page a l'autre (orgue, pedale) ; l'accord d'entree, lui, finit de resonner
  if (!opts.entered) allNotesOff();
  const { name, param, query } = parse();
  document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.route === name || (name === 'lecon' && a.dataset.route === 'parcours') || (name === 'morceau' && a.dataset.route === 'morceaux')));
  const page = name === 'lecon' && needsBilan() ? () => pageBilan(null, { query: new URLSearchParams(`next=lecon/${param}`) })
    : name === 'lecon' ? () => pageLecon(param)
    : name === 'morceau' ? () => pageMorceau(param)
    : ROUTES[name] || pageIntrouvable;
  window.scrollTo(0, 0);
  app.classList.remove('full');
  const result = page(param, { query, ...opts });
  if (typeof result === 'function') cleanup = result;
  observeReveals(app);
}

let first = true;
function route(instant = false) {
  if (first) {
    first = false;
    playGate().then((entered) => {
      if (entered) render({ entered: true });
      idle();
    });
    render({ entered: false });
    return;
  }
  if (instant === true) { render(); return; }
  pageTransition(() => render());
}

// Ce qui peut se preparer en douce : le prof 3D, le piano numerique
function idle() {
  const go = () => {
    import('./teacher.js').then((t) => t.preloadTeacher()).catch(() => {});
    autoConnectMidi();
  };
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 3000 });
  else setTimeout(go, 1500);
}

window.addEventListener('hashchange', () => route());
route();
registerOffline();
