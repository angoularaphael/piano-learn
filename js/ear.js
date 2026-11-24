// Les jeux d'oreille : de courtes manches pour entrainer ce que les yeux ne voient pas.
// Chaque jeu s'ouvre au palier ou il devient utile, donne de l'XP et compte dans la seance du jour.
// Apres chaque reponse, un petit dessin montre ce qui s'est passe (la note monte, les deux touches de
// l'intervalle, les trois notes de l'accord) : on apprend aussi en se trompant.
import { PAL, handColor } from './palette.js';
import { noteOn, noteOff, tick, getContext } from './audio.js';
import { getState, completeEar, earBest, knownKeys } from './progress.js';
import { currentPalier } from './data/paliers.js';
import { instrumentAt } from './instrument.js';
import { noteName, isBlack } from './notes.js';
import { mountPiano } from './mount.js';
import { fr, esc } from './text.js';
import { countUp } from './fx.js';
import { hasKeyboard } from './kbd-ui.js';
import { t, lang } from './i18n.js';

export const EAR_GAMES = [
  { id: 'hauteur', palier: 1, rounds: 10, titre: t('Plus aigu, plus grave'), desc: t('Deux notes sonnent. La deuxième monte-t-elle, ou descend-elle ?') },
  { id: 'retrouve', palier: 1, rounds: 8, titre: t('Retrouve la note'), desc: t('Une note sonne : cherche-la sur le clavier, à l’oreille.') },
  { id: 'pareil', palier: 2, rounds: 8, titre: t('Pareil ou pas ?'), desc: t('Deux petites mélodies. Sont-elles identiques ?') },
  { id: 'intervalles', palier: 4, rounds: 10, titre: t('Les intervalles'), desc: t('L’écart entre deux notes : seconde, tierce, quinte ou octave ?') },
  { id: 'rythme', palier: 5, rounds: 6, titre: t('Écho rythmique'), desc: t('Écoute un rythme, puis tape-le à ton tour.') },
  { id: 'accords', palier: 7, rounds: 10, titre: t('Majeur ou mineur ?'), desc: t('Un accord sonne : lumineux, ou plus sombre ?') },
];

export const gameById = (id) => EAR_GAMES.find((g) => g.id === id);
export const gamesOpen = (palier) => EAR_GAMES.filter((g) => g.palier <= palier);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const rand = (a, b) => a + Math.floor(Math.random() * (b - a + 1));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const nom = (m) => (lang() === 'en' ? noteName(m) : noteName(m).toLowerCase()).replace('#', '♯');
// Avant le palier 8 (les dieses), les jeux restent sur les touches blanches : des noms que l'eleve connait
const whites = (lo, hi) => { const out = []; for (let m = lo; m <= hi; m++) if (!isBlack(m)) out.push(m); return out; };

// Joue une suite d'evenements [notes, duree en ms]
async function playSeq(seq, alive, vel = 0.78) {
  for (const [notes, ms] of seq) {
    if (!alive()) return;
    const ns = [].concat(notes);
    ns.forEach((n) => noteOn(n, vel));
    await sleep(ms);
    ns.forEach((n) => noteOff(n));
    await sleep(45);
  }
}

// ---------- Petits dessins ----------
function miniKeys(low, high, marks = {}) {
  const whites = [];
  for (let m = low; m <= high; m++) if (!isBlack(m)) whites.push(m);
  const W = 22;
  const H = 70;
  const xOf = (m) => whites.indexOf(m) * W;
  let svg = `<svg class="ear-kb" viewBox="0 0 ${whites.length * W} ${H}" aria-hidden="true">`;
  whites.forEach((m) => { svg += `<rect class="w ${marks[m] || ''}" x="${xOf(m) + 1}" y="1" width="${W - 2}" height="${H - 2}" rx="3"/>`; });
  for (let m = low; m <= high; m++) {
    if (!isBlack(m)) continue;
    const x = xOf(m - 1) + W * 0.68;
    svg += `<rect class="b ${marks[m] || ''}" x="${x}" y="1" width="${W * 0.64}" height="${H * 0.6}" rx="2"/>`;
  }
  Object.keys(marks).forEach((k) => {
    const m = Number(k);
    if (!marks[m] || isBlack(m)) return;
    svg += `<text x="${xOf(m) + W / 2}" y="${H - 9}">${noteName(m)}</text>`;
  });
  return `${svg}</svg>`;
}

function pitchArrow(a, b) {
  const y = (m) => 74 - ((m - Math.min(a, b) + 2) / (Math.abs(a - b) + 4)) * 64;
  const up = b > a;
  return `<svg class="pitch-viz" viewBox="0 0 220 84" aria-hidden="true">
    <line class="pv-line" x1="60" y1="${y(a)}" x2="160" y2="${y(b)}"/>
    <circle class="pv-dot" cx="60" cy="${y(a)}" r="9"/><circle class="pv-dot two" cx="160" cy="${y(b)}" r="9"/>
    <text x="60" y="${y(a) + (up ? 24 : -16)}">1</text><text x="160" y="${y(b) + (up ? -16 : 24)}">2</text>
  </svg>`;
}

function motifViz(a, b, diff) {
  const lo = Math.min(...a, ...b) - 1;
  const hi = Math.max(...a, ...b) + 1;
  const row = (m, yRow, cls) => m.map((n, i) => `<circle class="pv-dot ${i === diff && cls ? 'diff' : ''}" cx="${30 + i * 40}" cy="${yRow - ((n - lo) / (hi - lo)) * 30}" r="7"/>`).join('');
  return `<svg class="pitch-viz" viewBox="0 0 ${50 + a.length * 40} 96" aria-hidden="true">
    <text x="6" y="40" class="lbl">1</text><text x="6" y="88" class="lbl">2</text>
    ${row(a, 44, false)}${row(b, 92, true)}</svg>`;
}

// ---------- Les questions ----------
const INTERVALS_4 = [
  { id: '2', semis: 2, label: t('Seconde'), hint: t('deux notes voisines, comme « Frè-re » dans Frère Jacques') },
  { id: '3', semis: 4, label: t('Tierce'), hint: t('on saute une touche blanche, comme do-mi') },
  { id: '5', semis: 7, label: t('Quinte'), hint: t('le grand saut d’« Ah ! vous dirai-je, maman »') },
  { id: '8', semis: 12, label: t('Octave'), hint: t('la même note, plus haut') },
];
const INTERVALS_6 = [...INTERVALS_4.slice(0, 2), { id: '4', semis: 5, label: t('Quarte'), hint: t('le début de « La Marseillaise »') }, ...INTERVALS_4.slice(2)];

function makeQuestion(game, st) {
  if (game.id === 'hauteur') {
    let a;
    let b;
    if (st.palier >= 8) {
      a = rand(52, 76);
      b = a + (Math.random() < 0.5 ? st.gap : -st.gap);
    } else {
      // L'ecart se compte en touches blanches (de 1 a 7)
      const w = whites(48, 84);
      const steps = Math.max(1, Math.min(7, Math.round(st.gap * 0.6)));
      const i = rand(steps, w.length - 1 - steps);
      a = w[i];
      b = w[i + (Math.random() < 0.5 ? steps : -steps)];
    }
    return {
      answers: [{ id: 'up', label: t('Plus aigu'), icon: '↑' }, { id: 'down', label: t('Plus grave'), icon: '↓' }],
      answer: b > a ? 'up' : 'down',
      play: (alive) => playSeq([[a, 650], [b, 900]], alive),
      explain: (ok) => `${ok ? t('Juste.') : t('Pas cette fois.')} ${b > a ? t('La deuxième note monte : {a} puis {b}.', { a: nom(a), b: nom(b) }) : t('La deuxième note descend : {a} puis {b}.', { a: nom(a), b: nom(b) })}`,
      viz: () => pitchArrow(a, b),
      after: (ok) => { st.gap = ok ? Math.max(1, st.gap - 1) : Math.min(12, st.gap + 2); },
    };
  }
  if (game.id === 'pareil') {
    const len = st.round < 3 ? 3 : 4;
    const w = whites(60, 74);
    const idx = Array.from({ length: len }, () => rand(0, w.length - 3));
    const a = idx.map((i) => w[i]);
    const same = Math.random() < 0.5;
    const b = a.slice();
    let diff = -1;
    if (!same) {
      diff = rand(1, len - 1);
      const i = idx[diff];
      let j = i + pick([-2, -1, 1, 2]);
      if (j < 0 || j >= w.length || j === i) j = i + 1;
      b[diff] = w[j];
    }
    return {
      answers: [{ id: 'same', label: t('Pareil') }, { id: 'diff', label: t('Différent') }],
      answer: same ? 'same' : 'diff',
      play: async (alive) => { await playSeq(a.map((n) => [n, 380]), alive); await sleep(650); await playSeq(b.map((n) => [n, 380]), alive); },
      explain: (ok) => `${ok ? t('Juste.') : t('Écoute encore.')} ${same ? t('Les deux mélodies sont identiques.') : t('La note {n} change : {a} devient {b}.', { n: diff + 1, a: nom(a[diff]), b: nom(b[diff]) })}`,
      viz: () => motifViz(a, b, diff),
    };
  }
  if (game.id === 'intervalles') {
    const set = st.palier >= 6 ? INTERVALS_6 : INTERVALS_4;
    const iv = pick(set);
    // Deux touches blanches tant que les dieses ne sont pas appris
    const roots = st.palier >= 8 ? Array.from({ length: 13 }, (_, k) => 55 + k) : whites(53, 67).filter((r) => !isBlack(r + iv.semis));
    const a = pick(roots);
    const b = a + iv.semis;
    return {
      answers: set.map((x) => ({ id: x.id, label: x.label })),
      answer: iv.id,
      play: async (alive) => { await playSeq([[a, 600], [b, 800]], alive); await sleep(180); await playSeq([[[a, b], 1000]], alive, 0.7); },
      explain: (ok) => `${ok ? t('Juste') : t('C’était une {nom}', { nom: iv.label.toLowerCase() })} : ${iv.hint}. ${nom(a)} – ${nom(b)}.`,
      viz: () => miniKeys(a - (a % 12 === 0 ? 0 : (a % 12)), Math.max(b + 2, a + 14), { [a]: 'on', [b]: 'on two' }),
    };
  }
  if (game.id === 'accords') {
    const major = Math.random() < 0.5;
    // Accords sur les touches blanches : do, fa, sol majeurs ; re, mi, la mineurs (ceux du palier 7)
    const root = st.palier >= 8 ? rand(53, 65) : pick(major ? [53, 55, 60, 65] : [57, 62, 64]);
    const notes = [root, root + (major ? 4 : 3), root + 7];
    return {
      answers: [{ id: 'maj', label: t('Majeur'), sub: t('lumineux') }, { id: 'min', label: t('Mineur'), sub: t('plus sombre') }],
      answer: major ? 'maj' : 'min',
      play: async (alive) => { await playSeq([[notes, 1300]], alive, 0.68); await sleep(150); await playSeq(notes.map((n) => [n, 330]), alive, 0.7); },
      explain: (ok) => `${ok ? t('Juste.') : t('Pas cette fois.')} ${major ? t('{note} majeur : la note du milieu est à deux tons de la première.', { note: nom(root) }) : t('{note} mineur : la note du milieu est à un ton et demi de la première.', { note: nom(root) })}`,
      viz: () => miniKeys(root - (root % 12), root - (root % 12) + 23, Object.fromEntries(notes.map((n, i) => [n, i === 1 ? 'on two' : 'on']))),
    };
  }
  return null;
}

// Rythmes de l'echo (en temps, sur une mesure a 4 temps)
const RHYTHMS = [
  [[0, 1, 2, 3], [0, 2, 3], [0, 1, 2], [0, 1, 3]],
  [[0, 1, 1.5, 2, 3], [0, 0.5, 1, 2, 3], [0, 1, 2, 2.5, 3], [0, 1.5, 2, 3]],
  [[0, 0.5, 1, 1.5, 2, 3], [0, 1, 1.5, 2.5, 3], [0, 0.5, 1.5, 2, 3], [0, 1.5, 2, 2.5, 3]],
];

// ---------- La page des jeux ----------
export function renderEarList(app, subnav = '') {
  const cur = currentPalier(getState());
  app.innerHTML = `
    ${subnav}
    <div class="page-head">
      <div class="eyebrow" data-reveal>${t('L’oreille')}</div>
      <h1 data-split>${t('Entraîne <span class="pencil-word">ton oreille</span>')}</h1>
      <p class="lead" data-reveal>${fr(t('Quelques minutes, sans regarder le clavier. C’est l’oreille qui fait les musiciens : elle te dira bientôt quand une note est juste, avant même que le site te le dise.'))}</p>
    </div>
    <div class="grid ear-grid">
      ${EAR_GAMES.map((g, i) => {
        const open = g.palier <= cur;
        const best = earBest(g.id);
        return `<a class="card ear-card ${open ? '' : 'locked'}" ${open ? `href="#/oreille/${g.id}"` : 'aria-disabled="true"'} data-reveal style="--d:${i * 70}ms">
          <span class="tag ${open ? '' : 'grey'}">${open ? (best ? t('Record {n} / {total}', { n: best, total: g.rounds }) : t('Nouveau')) : t('Palier {n}', { n: g.palier })}</span>
          <h3>${esc(g.titre)}</h3>
          <p class="hint">${fr(esc(g.desc))}</p>
        </a>`;
      }).join('')}
    </div>`;
  return () => {};
}

// ---------- Une partie ----------
export function renderEarGame(app, id) {
  const game = gameById(id);
  const state = getState();
  const palier = currentPalier(state);
  if (!game || game.palier > palier) {
    app.innerHTML = `<div class="page-head"><h1>${t('Ce jeu arrive plus tard')}</h1><p class="lead">${fr(game ? t('Il s’ouvre au palier {n}.', { n: game.palier }) : t('Ce jeu n’existe pas.'))}</p><a class="btn" href="#/oreille">${t('Les jeux d’oreille')}</a></div>`;
    return () => {};
  }
  let alive = true;
  const isAlive = () => alive;
  const st = { round: 0, score: 0, results: [], gap: 7, palier, busy: false };
  const special = game.id === 'retrouve' || game.id === 'rythme';

  app.innerHTML = `
    <div class="lesson-head">
      <p class="crumbs" data-reveal><a href="#/oreille">${t('L’oreille')}</a><i></i><span>${esc(game.titre)}</span></p>
      <h1 data-split class="lesson-title">${esc(game.titre)}</h1>
    </div>
    <div class="stage ear-stage" data-reveal style="--d:120ms">
      <div class="ear-top">
        <span class="ear-round" id="ear-round">${t('Manche {n} / {total}', { n: 1, total: game.rounds })}</span>
        <ol class="ear-dots" id="ear-dots">${Array.from({ length: game.rounds }, () => '<li></li>').join('')}</ol>
      </div>
      ${game.id === 'retrouve' ? '<div class="piano-wrap ear-piano" id="ear-piano"></div>' : ''}
      ${game.id === 'rythme' ? `<div class="beat-row" id="beat-row" aria-hidden="true"></div><button class="tap-pad" id="tap-pad" disabled><span>${t('Tape ici')}</span>${hasKeyboard() ? `<small>${t('ou la barre d’espace')}</small>` : ''}</button>` : ''}
      <div class="ear-viz" id="ear-viz" aria-hidden="true"></div>
      <p class="ear-say" id="ear-say" aria-live="polite">${fr(esc(game.desc))}</p>
      <div class="ear-answers" id="ear-answers"></div>
      <div class="ear-actions">
        <button class="btn" id="ear-go">${t('Commencer')}</button>
        <button class="btn ghost" id="ear-again" hidden>${t('Réécouter')}</button>
        ${game.id === 'retrouve' ? `<button class="btn ghost" id="ear-ref" hidden>${t('Le do de repère')}</button>` : ''}
      </div>
      <div class="result" id="ear-result" hidden></div>
    </div>`;

  const $ = (s) => app.querySelector(s);
  const sayEl = $('#ear-say');
  const viz = $('#ear-viz');
  const answersEl = $('#ear-answers');
  const goBtn = $('#ear-go');
  const againBtn = $('#ear-again');
  const dots = [...app.querySelectorAll('#ear-dots li')];
  const say = (text) => { sayEl.textContent = fr(text); };
  let q = null;
  let piano = null;
  let mounted = null;

  function setRound() {
    $('#ear-round').textContent = t('Manche {n} / {total}', { n: Math.min(st.round + 1, game.rounds), total: game.rounds });
  }
  function record(ok) {
    st.results.push(ok);
    if (ok) st.score++;
    const d = dots[st.round];
    d?.classList.add(ok ? 'ok' : 'ko');
  }

  // ---- Jeux a boutons ----
  async function askButtons() {
    q = makeQuestion(game, st);
    viz.innerHTML = '';
    viz.classList.remove('show');
    answersEl.innerHTML = q.answers.map((a) => `<button class="ear-answer" data-a="${a.id}">${a.icon ? `<b>${a.icon}</b>` : ''}<span>${esc(a.label)}</span>${a.sub ? `<small>${esc(a.sub)}</small>` : ''}</button>`).join('');
    answersEl.classList.add('wait');
    say(t('Écoute…'));
    await q.play(isAlive);
    if (!alive) return;
    answersEl.classList.remove('wait');
    say(game.id === 'hauteur' ? t('La deuxième note monte, ou descend ?') : t('Ta réponse ?'));
  }

  answersEl.addEventListener('click', async (e) => {
    const b = e.target.closest('.ear-answer');
    if (!b || !q || st.busy || answersEl.classList.contains('wait')) return;
    st.busy = true;
    const ok = b.dataset.a === q.answer;
    answersEl.querySelectorAll('.ear-answer').forEach((x) => {
      x.classList.toggle('right', x.dataset.a === q.answer);
      x.classList.toggle('wrong', x === b && !ok);
    });
    record(ok);
    q.after?.(ok);
    say(q.explain(ok));
    viz.innerHTML = q.viz();
    viz.classList.add('show');
    if (getState()) navigator.vibrate?.(ok ? [6] : [12, 40, 12]);
    await sleep(ok ? 1500 : 2600);
    st.busy = false;
    next();
  });

  // ---- Retrouve la note (au clavier 3D) ----
  let target = null;
  let tries = 0;
  function poolNotes() {
    const known = [...knownKeys()].filter((m) => m >= 48 && m <= 84);
    return known.length >= 4 ? known : [60, 62, 64, 65, 67];
  }
  function mountKeys() {
    const instr = instrumentAt(palier);
    mounted = mountPiano($('#ear-piano'), {
      low: 48, high: 84, stage: instr.stage === 'queue' ? 'clavier' : instr.stage, known: knownKeys(), view: 'front', labels: true,
      onNoteOn: (midi, meta) => { if (!meta?.auto) guess(midi); },
    });
    piano = mounted.piano;
    const pool = poolNotes();
    piano?.setFocus(Math.min(...pool) - 4, Math.max(...pool) + 4);
  }
  async function askFind() {
    tries = 0;
    let t;
    do { t = pick(poolNotes()); } while (t === target && poolNotes().length > 1);
    target = t;
    say(t('Écoute la note, puis cherche-la sur le clavier.'));
    await playSeq([[target, 900]], isAlive);
  }
  function guess(midi) {
    if (target == null || st.busy) return;
    if (midi === target) {
      st.busy = true;
      piano?.flash(midi, PAL.ok);
      record(tries === 0 || tries === 1);
      say(tries ? `${t('Trouvé : c’était {note}.', { note: nom(target) })} ${tries === 1 ? t('Au deuxième essai, ça compte.') : t('Ça viendra plus vite.')}` : t('Juste du premier coup : {note}.', { note: nom(target) }));
      target = null;
      setTimeout(() => { st.busy = false; next(); }, 1300);
      return;
    }
    tries++;
    piano?.flash(midi, PAL.graphite);
    if (tries >= 3) {
      st.busy = true;
      record(false);
      say(target > midi ? t('C’était {note}, plus haut. Écoute-la encore.', { note: nom(target) }) : t('C’était {note}, plus bas. Écoute-la encore.', { note: nom(target) }));
      piano?.tap(target, 800, 0.75, { auto: true });
      target = null;
      setTimeout(() => { st.busy = false; next(); }, 2200);
    } else say(target > midi ? t('Plus haut…') : t('Plus bas…'));
  }

  // ---- Echo rythmique ----
  const pad = $('#tap-pad');
  const beatRow = $('#beat-row');
  let taps = [];
  let listening = false;
  let pattern = null;
  const BPM = 84;
  const beatMs = 60000 / BPM;
  async function askRhythm() {
    const level = st.round < 2 ? 0 : st.round < 4 ? 1 : 2;
    pattern = pick(RHYTHMS[level]);
    await playPattern();
  }
  async function playPattern() {
    clearTimeout(tap.timer);
    beatRow.innerHTML = [0, 1, 2, 3].map((b) => `<i data-b="${b}"></i>`).join('');
    pad.disabled = true;
    listening = false;
    say(t('Écoute le rythme…'));
    const ac = getContext();
    const t0 = ac.currentTime + 0.35;
    pattern.forEach((b) => tick(b === 0, t0 + (b * beatMs) / 1000));
    pattern.forEach((b) => setTimeout(() => { if (alive) { const el = beatRow.querySelector(`[data-b="${Math.floor(b)}"]`); el?.classList.remove('hit'); void el?.offsetWidth; el?.classList.add('hit'); } }, 350 + b * beatMs));
    await sleep(350 + 4 * beatMs + 200);
    if (!alive) return;
    taps = [];
    listening = true;
    pad.disabled = false;
    pad.focus({ preventScroll: true });
    say(t('À toi : tape le même rythme.'));
  }
  function tap() {
    if (!listening) return;
    const now = performance.now();
    taps.push(now);
    pad.classList.remove('hit');
    void pad.offsetWidth;
    pad.classList.add('hit');
    tick(taps.length === 1);
    clearTimeout(tap.timer);
    // Fin de l'echo : un temps et demi sans frapper, ou autant de coups que le modele
    tap.timer = setTimeout(judgeRhythm, beatMs * 1.6);
    if (taps.length >= pattern.length + 2) judgeRhythm();
  }
  function judgeRhythm() {
    if (!listening) return;
    listening = false;
    clearTimeout(tap.timer);
    pad.disabled = true;
    const rel = taps.map((at) => (at - taps[0]) / beatMs);
    const tol = 0.24;
    const ok = rel.length === pattern.length && pattern.every((b, i) => Math.abs(rel[i] - b) <= tol);
    record(ok);
    const want = pattern.map((b) => (Number.isInteger(b) ? '♩' : '♪')).join(' ');
    say(ok ? t('Juste, bien en place.') : rel.length !== pattern.length ? t('Il y avait {n} coups, tu en as tapé {k}. ({rythme})', { n: pattern.length, k: rel.length, rythme: want }) : t('Presque : un coup est arrivé trop tôt ou trop tard.'));
    setTimeout(() => next(), ok ? 1300 : 2400);
  }
  pad?.addEventListener('pointerdown', (e) => { e.preventDefault(); tap(); });
  const onKey = (e) => {
    if (game.id !== 'rythme' || e.repeat) return;
    if (e.code === 'Space' || e.code === 'Enter') { e.preventDefault(); tap(); }
  };
  window.addEventListener('keydown', onKey);

  // ---- Deroule ----
  async function next() {
    if (!alive) return;
    st.round++;
    if (st.round >= game.rounds) { finish(); return; }
    setRound();
    if (game.id === 'retrouve') await askFind();
    else if (game.id === 'rythme') await askRhythm();
    else await askButtons();
  }

  async function finish() {
    answersEl.innerHTML = '';
    viz.classList.remove('show');
    againBtn.hidden = true;
    const res = completeEar(game.id, st.score, game.rounds);
    const { nextStep } = await import('./session.js');
    const step = nextStep();
    const box = $('#ear-result');
    const verdict = st.score >= game.rounds ? t('Sans faute') : st.score >= game.rounds * 0.8 ? t('Très belle oreille') : st.score >= game.rounds * 0.5 ? t('Ça vient') : t('On recommence ?');
    box.innerHTML = `
      <div class="result-card">
        <div class="eyebrow" style="justify-content:center">${esc(game.titre)}</div>
        <h3 class="ear-verdict">${verdict}</h3>
        <div class="ear-score"><span data-count="${st.score}">0</span><small>/ ${game.rounds}</small></div>
        ${res.gained ? `<div class="result-xp">+<span data-count="${res.gained}">0</span> XP</div>` : ''}
        <p class="hint" style="margin:.2rem 0 0">${t('Record : {n} / {total}', { n: res.best, total: game.rounds })}</p>
        <div class="result-actions">
          <button class="btn ghost" id="ear-replay">${t('Rejouer')}</button>
          ${step ? `<a class="btn" href="${step.href}">${t('Suite de ta séance')}</a>` : `<a class="btn" href="#/oreille">${t('Les autres jeux')}</a>`}
        </div>
      </div>`;
    box.hidden = false;
    countUp(box);
    $('#ear-replay').addEventListener('click', () => {
      box.hidden = true;
      Object.assign(st, { round: 0, score: 0, results: [], gap: 7 });
      dots.forEach((d) => d.classList.remove('ok', 'ko'));
      begin();
    });
  }

  async function begin() {
    goBtn.hidden = true;
    againBtn.hidden = false;
    $('#ear-ref') && ($('#ear-ref').hidden = false);
    st.round = -1;
    await next();
  }

  goBtn.addEventListener('click', () => {
    getContext().resume?.();
    if (game.id === 'retrouve' && !piano) mountKeys();
    begin();
  });
  againBtn.addEventListener('click', () => {
    if (game.id === 'retrouve' && target != null) playSeq([[target, 900]], isAlive);
    else if (game.id === 'rythme' && pattern) playPattern();
    else if (q && !st.busy && !special) q.play(isAlive);
  });
  $('#ear-ref')?.addEventListener('click', () => playSeq([[60, 800]], isAlive));

  return () => {
    alive = false;
    clearTimeout(tap.timer);
    window.removeEventListener('keydown', onKey);
    mounted?.dispose();
  };
}
