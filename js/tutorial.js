// Les morceaux en cascade : les notes glissent vers leurs touches.
// « Écouter » : le piano joue tout seul. « Jouer » : chaque note attend que tu la joues (au micro,
// a l'ecran, au clavier ou sur un piano numerique) ; la main que tu ne travailles pas est jouee pour toi.
import { mountPiano } from './mount.js';
import { Highway } from './highway.js';
import { parseScore, beatsPerBar } from './score.js';
import { noteName } from './notes.js';
import { findSong, songOpen } from './data/library.js';
import { getState, getSettings, setSetting, completeSong, completeLesson, unlockBadge, discover, knownKeys } from './progress.js';
import { PALIERS, palierStatus, currentPalier, ALL_LESSONS } from './data/paliers.js';
import { instrumentAt, freeRange, wholeOctaves } from './instrument.js';
import { sameNote } from './listen.js';
import { countUp } from './fx.js';
import { tick } from './audio.js';
import { fr, esc, DOIGTS } from './text.js';
import { keepAwake } from './awake.js';

const HANDS = { R: 'Main droite', L: 'Main gauche', RL: 'Les deux' };
const WINDOW = 0.32;   // tolerance en mode rythme, en temps (environ 0,2 s a 100 a la noire)
const LOCK = '<svg class="lock" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 7V5.2a3.5 3.5 0 0 1 7 0V7" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="3" y="7" width="10" height="7.5" rx="2" fill="currentColor"/></svg>';

export function renderPlayer(app, songId, { lecon = null, palier = null } = {}) {
  const song = findSong(songId);
  if (!song) return null;
  const state = getState();
  const cur = currentPalier(state);
  const locked = !songOpen(song, cur);
  const instr = instrumentAt(cur);
  const score = parseScore(song);
  const hasLeft = score.events.some((e) => e.hand === 'L');
  const hasRight = score.events.some((e) => e.hand === 'R');
  const settings = getSettings();
  const canRhythm = instr.features.has('metronome');
  let part = hasLeft && hasRight ? 'RL' : hasLeft ? 'L' : 'R';
  const known = knownKeys();
  const free = freeRange(instr, known);
  const need = wholeOctaves(score.low, score.high);
  const range = [Math.min(free[0], need[0]), Math.max(free[1], need[1])];
  const stars = '★'.repeat(song.niveau || 1) + '☆'.repeat(5 - (song.niveau || 1));
  const crumbs = lecon
    ? `<a href="#/parcours">Parcours</a><i></i><span>Palier ${palier.id} · ${esc(palier.titre)}</span><i></i><span>${lecon.boss ? 'Morceau de fin' : 'Morceau'}</span>`
    : `<a href="#/morceaux">Morceaux</a><i></i><span>Palier ${song.palier}</span><i></i><span class="lvl" aria-label="Difficulté ${song.niveau} sur 5">${stars}</span>`;

  app.innerHTML = `
    <div class="lesson-head player-head">
      <p class="crumbs" data-reveal>${crumbs}</p>
      <h1 data-split class="lesson-title">${esc(song.titre)}</h1>
      <p class="player-meta" data-reveal style="--d:120ms">${esc([song.compositeur, song.annee, song.origine].filter(Boolean).join(' · '))}</p>
    </div>
    <div class="stage player-stage" data-reveal style="--d:160ms">
      <div class="piano-wrap stage-3d" id="stage"></div>
      <div class="hud">
        <div class="hud-progress"><span id="prog"></span></div>
        <div class="hud-next" id="hud-next" aria-live="polite"></div>
      </div>
      <div class="countdown" id="countdown"></div>
      ${lecon?.texte || song.intro ? `<div class="bubble" id="bubble"><span class="bubble-who">Le prof</span><p id="bubble-text">${fr(esc(lecon?.texte || song.intro))}</p></div>` : ''}
      <div class="toast" id="toast" aria-live="polite"></div>
      <div class="result" id="result" hidden></div>
    </div>
    <div class="listen-bar" id="listen-bar" hidden>
      <span class="mic-dot"></span>
      <span class="meter"><span id="meter"></span></span>
      <span class="heard">J’entends <strong id="heard">–</strong></span>
    </div>
    <div class="player-controls">
      <button class="btn" id="play" ${locked ? 'disabled' : ''}>${locked ? `Palier ${song.palier}` : 'Jouer'}</button>
      <button class="btn ghost" id="listen">Écouter</button>
      <button class="btn ghost" id="rhythm" ${canRhythm && !locked ? '' : 'disabled'} title="${canRhythm ? 'Le morceau n’attend pas : chaque note est jugée sur son temps' : 'Arrive avec le métronome, au palier 5'}">${canRhythm ? 'En rythme' : `${LOCK} En rythme · palier 5`}</button>
      ${hasLeft && hasRight ? `<div class="seg" id="hands" role="group" aria-label="Main travaillée">${Object.entries(HANDS).map(([k, v]) => `<button data-h="${k}" class="${k === part ? 'on' : ''}">${v}</button>`).join('')}</div>` : ''}
      <label class="speed">Vitesse <input type="range" id="speed" min="40" max="100" step="5" value="${Math.round((settings.vitesse || 1) * 100)}"><output id="speed-out">${Math.round((settings.vitesse || 1) * 100)} %</output></label>
    </div>
    ${locked ? `<p class="hint locked-note">${fr(`Ce morceau s’ouvre au palier ${song.palier}. Tu peux déjà l’écouter.`)}</p>` : ''}
    ${song.histoire ? `<p class="story" data-reveal>${fr(esc(song.histoire))}</p>` : ''}
  `;

  const $ = (s) => app.querySelector(s);
  const prog = $('#prog');
  const next = $('#hud-next');
  const countdown = $('#countdown');
  const toast = $('#toast');
  const result = $('#result');
  const playBtn = $('#play');
  const listenBtn = $('#listen');
  const rhythmBtn = $('#rhythm');
  const listenBar = $('#listen-bar');
  const heard = $('#heard');
  const meter = $('#meter');
  const bubble = $('#bubble');
  const bubbleText = $('#bubble-text');

  let alive = true;
  let mode = 'idle';            // idle | ecoute | joue | rythme | fini
  let misses = 0;
  let combo = 0;
  let lastBeat = null;
  let lastCount = null;
  let now = -3;                 // en temps ; on commence un peu avant la premiere note
  let scale = settings.vitesse || 1;
  let listener = null;
  let waitStart = 0;
  let hintLevel = 0;
  let correct = 0;
  let errors = 0;
  let lastWrong = 0;
  let learn = [];
  let si = 0;
  let autoIdx = 0;
  let auto = [];
  const timers = new Set();
  const fresh = [];

  const say = (t) => {
    if (!bubble) return;
    bubbleText.textContent = fr(t);
    bubble.classList.remove('pop');
    void bubble.offsetWidth;
    bubble.classList.add('pop');
  };
  const showToast = (html) => {
    toast.innerHTML = html;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
  };

  const m = mountPiano($('#stage'), {
    low: range[0], high: range[1], stage: instr.stage, known, view: 'highway', focus: need,
    floorY: instr.stage === 'queue' ? -31 : -6,
    labels: instr.features.has('cacher-noms') ? settings.noms : true,
    pedal: () => instr.features.has('pedale'),
    onNoteOn: (midi, meta) => {
      if (meta?.auto) return;
      listener?.mute(600);
      onPlayed(midi, meta?.source || 'touch');
    },
  });
  if (!m.piano) return () => {};
  const piano = m.piano;
  keepAwake(true);
  const beatsPerSecond = () => ((song.tempo || 90) * scale) / 60;
  const hw = new Highway(piano, { speed: 7 / ((song.tempo || 90) / 60) });

  // Prepare les notes : celles de l'eleve (par etapes) et celles jouees pour lui
  function prepare() {
    const mine = mode === 'joue' || mode === 'rythme' ? part : '';
    hw.load(score, 'RL');
    learn = [];
    auto = [];
    score.events.forEach((e, i) => {
      if (mine.includes(e.hand)) {
        const last = learn[learn.length - 1];
        if (last && Math.abs(last.start - e.start) < 0.001) last.notes.push({ ...e, i });
        else learn.push({ start: e.start, notes: [{ ...e, i }], got: new Set() });
      } else auto.push({ ...e, i });
    });
    si = 0;
    autoIdx = 0;
    correct = 0;
    errors = 0;
    misses = 0;
    combo = 0;
    lastBeat = null;
    now = -3;
    hw.setTime(now);
  }

  function playAuto(e) {
    const ms = (e.dur / beatsPerSecond()) * 1000 * 0.92;
    piano.press(e.midi, e.hand === 'L' ? 0.62 : 0.74, { auto: true });
    listener?.mute(ms + 200);
    const t = setTimeout(() => { timers.delete(t); piano.release(e.midi, { auto: true }); }, ms);
    timers.add(t);
    hw.mark(e.i, true);
  }

  function nextHint() {
    const st = learn[si];
    if (!st) { next.innerHTML = ''; piano.hideFinger(); piano.clearHighlights(); return; }
    piano.clearHighlights();
    st.notes.forEach((n) => piano.highlight(n.midi, n.hand === 'L' ? '#a98bff' : '#3ef2ff'));
    const n0 = st.notes[0];
    piano.showFinger(n0.midi, n0.finger);
    next.innerHTML = `<b>${st.notes.map((n) => noteName(n.midi)).join(' + ')}</b>${n0.finger ? `<span>${n0.finger === 1 ? 'pouce' : DOIGTS[n0.finger]} · main ${n0.hand === 'L' ? 'gauche' : 'droite'}</span>` : ''}`;
  }

  // Mode rythme : la note compte si elle tombe dans sa fenetre de temps
  function onRhythm(midi, fromMic) {
    for (let k = si; k < learn.length; k++) {
      const st = learn[k];
      if (st.start - now > WINDOW) break;
      if (st.done || Math.abs(st.start - now) > WINDOW) continue;
      const hit = st.notes.find((n) => (fromMic ? sameNote(midi, n.midi) : midi === n.midi) && !st.got.has(n.midi));
      if (!hit) continue;
      st.got.add(hit.midi);
      hw.mark(hit.i, true);
      piano.flash(hit.midi, '#3dffa8');
      if (fromMic || st.notes.every((n) => st.got.has(n.midi))) {
        st.done = true;
        st.notes.forEach((n) => { hw.mark(n.i, true); if (discover(n.midi)) { piano.discover(n.midi); fresh.push(n.midi); } });
        correct += st.notes.length;
        combo++;
        const gap = Math.abs(st.start - now);
        next.innerHTML = `<b>${gap < 0.12 ? 'Parfait' : 'Bien'}</b><span>${combo > 2 ? `${combo} d’affilée` : '&nbsp;'}</span>`;
      }
      return;
    }
    const t = performance.now();
    if (t - lastWrong > 180) { errors++; lastWrong = t; combo = 0; }
    piano.flash(midi, '#ff5470');
  }

  // Une note jouee par l'eleve
  function onPlayed(midi, source) {
    if (mode === 'rythme') { onRhythm(midi, source === 'mic'); return; }
    if (mode !== 'joue') return;
    const st = learn[si];
    if (!st) return;
    // On accepte une note un peu en avance (jusqu'a un temps et demi)
    if (st.start - now > 1.5) return;
    const fromMic = source === 'mic';
    const hit = st.notes.find((n) => (fromMic ? sameNote(midi, n.midi) : midi === n.midi) && !st.got.has(n.midi));
    if (hit) {
      st.got.add(hit.midi);
      hw.mark(hit.i, true);
      piano.flash(hit.midi, '#3dffa8');
      const done = fromMic || st.notes.every((n) => st.got.has(n.midi));
      if (done) {
        st.notes.forEach((n) => {
          hw.mark(n.i, true);
          if (discover(n.midi)) { piano.discover(n.midi); fresh.push(n.midi); }
        });
        correct += st.notes.length;
        si++;
        hintLevel = 0;
        waitStart = performance.now();
        nextHint();
      }
      return;
    }
    // Fausse note (une seule fois par accord)
    const t = performance.now();
    if (t - lastWrong > 180) { errors++; lastWrong = t; }
    piano.flash(midi, '#ff5470');
  }

  // Boucle du morceau
  piano.onFrame((dt) => {
    if (mode !== 'ecoute' && mode !== 'joue' && mode !== 'rythme') return;
    // Decompte cale sur l'arrivee des notes : 3, 2, 1, avec le metronome
    if (now < 0) {
      const c = Math.ceil(-now);
      if (c !== lastCount && c >= 1 && c <= 3) {
        lastCount = c;
        countdown.textContent = c;
        countdown.classList.remove('go');
        void countdown.offsetWidth;
        countdown.classList.add('go');
        tick(c === 3);
      }
    } else if (lastCount != null) {
      lastCount = null;
      countdown.textContent = '';
    }
    let target = now + dt * beatsPerSecond();
    const st = learn[si];
    if (mode === 'joue' && st && target >= st.start) {
      if (now < st.start) waitStart = performance.now();
      target = st.start;
      // Aide si l'eleve hesite : la touche pulse, puis on lui fait entendre la note
      const waited = performance.now() - waitStart;
      if (waited > 4500 && hintLevel === 0) {
        hintLevel = 1;
        say(`Cherche ${st.notes.map((n) => noteName(n.midi).toLowerCase()).join(' et ')}, la touche qui brille.`);
      } else if (waited > 9000 && hintLevel === 1) {
        hintLevel = 2;
        say('Écoute-la, puis joue-la.');
        st.notes.forEach((n) => { piano.tap(n.midi, 500, 0.6, { auto: true }); });
        listener?.mute(900);
      }
    }
    if (mode === 'rythme') {
      // Le metronome bat chaque temps, plus fort au debut de la mesure
      const beat = Math.floor(target);
      if (beat >= 0 && beat !== lastBeat) {
        lastBeat = beat;
        tick(beat % Math.max(1, Math.round(beatsPerBar(song.mesure))) === 0);
      }
      // Une note passee sans etre jouee est ratee
      while (learn[si] && (learn[si].done || learn[si].start < target - WINDOW)) {
        const st = learn[si];
        if (!st.done) {
          st.notes.forEach((n) => { if (!st.got.has(n.midi)) hw.mark(n.i, false); });
          misses += st.notes.length - st.got.size;
          correct += st.got.size;
          combo = 0;
          next.innerHTML = '<b>Raté</b><span>&nbsp;</span>';
        }
        si++;
      }
    }
    while (autoIdx < auto.length && auto[autoIdx].start <= target) {
      if (auto[autoIdx].start >= now - 0.01) playAuto(auto[autoIdx]);
      autoIdx++;
    }
    // Rate une note qui est passee sans etre jouee (mode ecoute : rien a rater)
    now = target;
    hw.setTime(now);
    prog.style.transform = `scaleX(${Math.max(0, Math.min(1, now / score.total))})`;
    if (now >= score.total + (mode === 'rythme' ? WINDOW + 0.4 : 0.4) && si >= learn.length) finish();
  });

  function start(which) {
    stop();
    result.hidden = true;
    mode = which;
    prepare();
    playBtn.textContent = which === 'joue' ? 'Arrêter' : 'Jouer';
    listenBtn.textContent = which === 'ecoute' ? 'Arrêter' : 'Écouter';
    if (canRhythm) rhythmBtn.textContent = which === 'rythme' ? 'Arrêter' : 'En rythme';
    piano.setView('highway');
    if (which === 'rythme') {
      next.innerHTML = '';
      piano.hideFinger();
      piano.clearHighlights();
      startListening();
      say('Le morceau n’attend pas : joue chaque note au moment où elle touche le clavier.');
    } else if (which === 'joue') {
      nextHint();
      waitStart = performance.now();
      startListening();
      say(lecon?.texte || song.intro || 'Les notes arrivent : joue chacune quand elle touche le clavier.');
    } else {
      next.innerHTML = '';
      piano.hideFinger();
    }
    now = -3.2;
    lastCount = null;
  }

  function stop() {
    const was = mode;
    mode = 'idle';
    timers.forEach((t) => clearTimeout(t));
    timers.clear();
    piano.releaseAll();
    piano.clearHighlights();
    piano.hideFinger();
    countdown.textContent = '';
    lastCount = null;
    playBtn.textContent = locked ? `Palier ${song.palier}` : 'Jouer';
    listenBtn.textContent = 'Écouter';
    if (canRhythm) rhythmBtn.textContent = 'En rythme';
    listener?.stop();
    listener = null;
    listenBar.hidden = true;
    return was;
  }

  async function startListening() {
    if (listener) return;
    const { Listener } = await import('./listen.js');
    if (mode !== 'joue' && mode !== 'rythme') return;
    const l = new Listener({
      onNote: (midi) => { heard.textContent = noteName(midi); onPlayed(midi, 'mic'); },
      onLevel: (v) => { meter.style.width = `${Math.round(v * 100)}%`; },
      onPitch: (midi) => { if (midi == null) heard.textContent = '–'; },
    });
    try {
      await l.start();
      if (!alive || (mode !== 'joue' && mode !== 'rythme')) { l.stop(); return; }
      listener = l;
      listenBar.hidden = false;
    } catch (e) {
      showToast(`<b>Micro non disponible</b><span>${fr('Joue sur les touches à l’écran, ou autorise le micro.')}</span>`);
    }
  }

  function finish() {
    const wasRhythm = mode === 'rythme';
    const wasPlaying = mode === 'joue' || wasRhythm;
    stop();
    mode = 'fini';
    if (!wasPlaying) {
      showToast(`<b>${esc(song.titre)}</b><span>${fr('À toi, maintenant : appuie sur « Jouer ».')}</span>`);
      mode = 'idle';
      return;
    }
    const totalNotes = learn.reduce((a, s) => a + s.notes.length, 0);
    const acc = totalNotes ? Math.round((100 * correct) / Math.max(1, correct + errors + misses)) : 100;
    const boss = !!lecon?.boss;
    const res = completeSong(song.id, acc, boss);
    if (lecon) completeLesson(lecon.id, acc);
    const badges = [];
    if (part === 'RL' && hasLeft && hasRight && unlockBadge('deux-mains')) badges.push('Deux mains');
    if (res.stars === 3 && unlockBadge('trois-etoiles')) badges.push('Sans faute');
    const st = getState();
    const pal = lecon ? palier : null;
    const palierDone = pal && palierStatus(pal, st.lessonsDone).complete;
    if (pal?.id === 1 && palierDone && unlockBadge('palier-1')) badges.push('Les bases');
    const all = ALL_LESSONS;
    const nextLesson = lecon ? all[all.findIndex((l) => l.id === lecon.id) + 1] : null;
    say(lecon?.apres || (acc >= 95 ? 'Magnifique.' : 'Bravo, morceau terminé.'));
    result.innerHTML = `
      <div class="result-card">
        <div class="eyebrow" style="justify-content:center">${boss ? 'Palier réussi' : wasRhythm ? 'Joué en rythme' : 'Morceau joué'}</div>
        <div class="stars">${[1, 2, 3].map((n) => `<i class="${n <= res.stars ? 'got' : ''}" style="--n:${n}"></i>`).join('')}</div>
        <div class="result-xp">+<span data-count="${res.gained}">0</span> XP</div>
        <p class="hint" style="margin:.2rem 0 0">Précision ${acc} %${fresh.length ? ` · ${fresh.length === 1 ? 'nouvelle note' : 'nouvelles notes'} : ${fresh.map((m) => noteName(m)).join(', ')}` : ''}</p>
        ${badges.length ? `<p class="new-badge">Nouveau badge : ${badges.join(', ')}</p>` : ''}
        <div class="result-actions">
          <button class="btn ghost" id="again">Rejouer</button>
          ${palierDone && pal.id < 8 ? `<a class="btn" href="#/piano?nouveau=${pal.id + 1}">Découvrir le palier ${pal.id + 1}</a>`
            : nextLesson ? `<a class="btn" href="#/lecon/${nextLesson.id}">Leçon suivante</a>`
            : `<a class="btn" href="#/morceaux">Autres morceaux</a>`}
        </div>
      </div>`;
    result.hidden = false;
    countUp(result);
    $('#again').addEventListener('click', () => start(wasRhythm ? 'rythme' : 'joue'));
  }

  playBtn.addEventListener('click', () => { if (mode === 'joue') { stop(); return; } start('joue'); });
  listenBtn.addEventListener('click', () => { if (mode === 'ecoute') { stop(); return; } start('ecoute'); });
  rhythmBtn.addEventListener('click', () => { if (!canRhythm) return; if (mode === 'rythme') { stop(); return; } start('rythme'); });
  $('#hands')?.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-h]');
    if (!b) return;
    part = b.dataset.h;
    $('#hands').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    if (mode === 'joue') start('joue');
  });
  const speed = $('#speed');
  speed.addEventListener('input', () => {
    scale = Number(speed.value) / 100;
    $('#speed-out').textContent = `${speed.value} %`;
    setSetting('vitesse', scale);
  });

  prepare();
  return () => {
    alive = false;
    keepAwake(false);
    stop();
    hw.dispose();
    m.dispose();
  };
}
