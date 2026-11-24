// Les morceaux en cascade : les notes glissent vers leurs touches.
// « Écouter » : le piano joue tout seul. « Jouer » : chaque note attend que tu la joues (au micro,
// a l'ecran, au clavier ou sur un piano numerique) ; la main que tu ne travailles pas est jouee pour toi.
import { PAL, handColor } from './palette.js';
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
import { createBacking } from './backing.js';
import { fr, esc, DOIGTS, BRAND } from './text.js';
import { keepAwake } from './awake.js';
import { Sheet } from './sheet.js';
import { kbdControlsHTML, bindKbdControls } from './kbd-ui.js';
import { t, lang, tp } from './i18n.js';

const HANDS = { R: t('Main droite'), L: t('Main gauche'), RL: t('Les deux') };
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
  const canSheet = instr.features.has('portee');
  // La salle de concert : au palier 8, et c'est la que se joue le morceau de fin du parcours
  const finalConcert = !!lecon?.boss && palier?.id === PALIERS.length;
  const canConcert = instr.features.has('concert') && canRhythm && !locked && instr.stage === 'queue';
  const VIEWS = { notes: t('Notes qui tombent'), mix: t('Notes et partition'), partition: t('Partition') };
  let display = canSheet ? (settings.affichage || 'mix') : 'notes';
  let part = hasLeft && hasRight ? 'RL' : hasLeft ? 'L' : 'R';
  const known = knownKeys();
  const free = freeRange(instr, known);
  const need = wholeOctaves(score.low, score.high);
  const range = [Math.min(free[0], need[0]), Math.max(free[1], need[1])];
  const stars = '★'.repeat(song.niveau || 1) + '☆'.repeat(5 - (song.niveau || 1));
  const crumbs = lecon
    ? `<a href="#/parcours">${t('Parcours')}</a><i></i><span>${t('Palier {n}', { n: palier.id })} · ${esc(palier.titre)}</span><i></i><span>${lecon.boss ? t('Morceau de fin') : t('Morceau')}</span>`
    : `<a href="#/morceaux">${t('Morceaux')}</a><i></i><span>${t('Palier {n}', { n: song.palier })}</span><i></i><span class="lvl" aria-label="${t('Difficulté {n} sur 5', { n: song.niveau })}">${stars}</span>`;

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
      <div class="sheet-panel" id="sheet" hidden></div>
      <div class="countdown" id="countdown"></div>
      ${lecon?.texte || song.intro ? `<div class="bubble" id="bubble"><span class="bubble-who">${tp('Le prof')}</span><p id="bubble-text">${fr(esc(lecon?.texte || song.intro))}</p></div>` : ''}
      <div class="toast" id="toast" aria-live="polite"></div>
      <div class="concert-card" id="concert-card" hidden></div>
      <div class="result" id="result" hidden></div>
    </div>
    <div class="listen-bar" id="listen-bar" hidden>
      <span class="mic-dot"></span>
      <span class="meter"><span id="meter"></span></span>
      <span class="heard">${t('J’entends')} <strong id="heard">–</strong></span>
    </div>
    <div class="player-controls">
      <button class="btn" id="play" ${locked ? 'disabled' : ''}>${locked ? t('Palier {n}', { n: song.palier }) : t('Jouer')}</button>
      <button class="btn ghost" id="listen">${t('Écouter')}</button>
      ${canConcert ? `<button class="btn ${finalConcert ? 'concert-cta' : 'ghost'}" id="concert">${finalConcert ? t('Monter sur scène') : t('Concert')}</button>` : ''}
      <button class="btn ghost" id="rhythm" ${canRhythm && !locked ? '' : 'disabled'} title="${canRhythm ? t('Le morceau n’attend pas : chaque note est jugée sur son temps') : t('Arrive avec le métronome, au palier 5')}">${canRhythm ? t('En rythme') : `${LOCK} ${t('En rythme · palier 5')}`}</button>
      ${hasLeft && hasRight ? `<div class="seg" id="hands" role="group" aria-label="${t('Main travaillée')}">${Object.entries(HANDS).map(([k, v]) => `<button data-h="${k}" class="${k === part ? 'on' : ''}">${v}</button>`).join('')}</div>` : ''}
      <div class="seg" id="display" role="group" aria-label="${t('Affichage')}">${Object.entries(VIEWS).map(([k, v]) => `<button data-d="${k}" class="${k === display ? 'on' : ''}" ${k !== 'notes' && !canSheet ? `disabled title="${t('La partition arrive au palier 4')}"` : ''}>${k !== 'notes' && !canSheet ? LOCK : ''}${v}</button>`).join('')}</div>
      <label class="speed">${t('Vitesse')} <input type="range" id="speed" min="40" max="100" step="5" value="${Math.round((settings.vitesse || 1) * 100)}"><output id="speed-out">${Math.round((settings.vitesse || 1) * 100)} %</output></label>
    </div>
    ${kbdControlsHTML()}
    ${locked ? `<p class="hint locked-note">${fr(t('Ce morceau s’ouvre au palier {n}. Tu peux déjà l’écouter.', { n: song.palier }))}</p>` : ''}
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
  let backing = null;
  let hall = null;              // la salle de concert, quand on joue en concert
  let concert = false;
  const timers = new Set();
  const fresh = [];

  const say = (text) => {
    if (!bubble) return;
    bubbleText.textContent = fr(text);
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

  let kbd = { setShift() {} };
  const m = mountPiano($('#stage'), {
    low: range[0], high: range[1], stage: instr.stage, known, view: 'highway', focus: need,
    floorY: instr.stage === 'queue' ? -31 : -6,
    labels: instr.features.has('cacher-noms') ? settings.noms : true,
    pedal: () => instr.features.has('pedale'),
    onShift: (s) => kbd.setShift(s),
    onNoteOn: (midi, meta) => {
      if (meta?.auto) return;
      listener?.mute(600);
      onPlayed(midi, meta?.source || 'touch');
    },
  });
  if (!m.piano) return () => {};
  const piano = m.piano;
  kbd = bindKbdControls(app, piano);
  keepAwake(true);
  const beatsPerSecond = () => ((song.tempo || 90) * scale) / 60;
  const hw = new Highway(piano, { speed: 7 / ((song.tempo || 90) / 60) });

  // La partition, synchronisee avec les notes qui tombent
  const sheetBox = $('#sheet');
  const stageBox = app.querySelector('.player-stage');
  let sheet = null;
  const markNote = (i, ok) => { hw.mark(i, ok); sheet?.mark(i, ok); };
  function applyDisplay(d) {
    display = d;
    const withSheet = d !== 'notes';
    if (withSheet && !sheet) sheet = new Sheet(sheetBox, score, { mode: 'scroll', ppb: Math.max(44, Math.min(64, 8000 / Math.max(1, score.total))) });
    sheetBox.hidden = !withSheet;
    stageBox.classList.toggle('with-sheet', withSheet);
    stageBox.classList.toggle('sheet-only', d === 'partition');
    hw.group.visible = d !== 'partition';
    piano.setView(d === 'partition' ? 'front' : 'highway');
    sheet?.setTime(now);
    app.querySelectorAll('#display button').forEach((b) => b.classList.toggle('on', b.dataset.d === d));
  }

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
    sheet?.reset();
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
    const tm = setTimeout(() => { timers.delete(tm); piano.release(e.midi, { auto: true }); }, ms);
    timers.add(tm);
    markNote(e.i, true);
  }

  function nextHint() {
    const st = learn[si];
    if (!st) { next.innerHTML = ''; piano.hideFinger(); piano.clearHighlights(); return; }
    piano.clearHighlights();
    st.notes.forEach((n) => piano.highlight(n.midi, handColor(n.hand)));
    const n0 = st.notes[0];
    piano.showFinger(n0.midi, n0.finger);
    sheet?.focus(st.notes.map((n) => n.i));
    listener?.expectChord(st.notes.length > 1 ? st.notes.map((n) => n.midi) : null);
    next.innerHTML = `<b>${st.notes.map((n) => noteName(n.midi)).join(' + ')}</b>${n0.finger ? `<span>${DOIGTS[n0.finger]} · ${n0.hand === 'L' ? t('main gauche') : t('main droite')}</span>` : ''}`;
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
      markNote(hit.i, true);
      piano.flash(hit.midi, PAL.ok);
      if (fromMic || st.notes.every((n) => st.got.has(n.midi))) {
        st.done = true;
        st.notes.forEach((n) => { markNote(n.i, true); if (discover(n.midi)) { piano.discover(n.midi); fresh.push(n.midi); } });
        correct += st.notes.length;
        combo++;
        const gap = Math.abs(st.start - now);
        next.innerHTML = `<b>${gap < 0.12 ? t('Parfait') : t('Bien')}</b><span>${combo > 2 ? t('{n} d’affilée', { n: combo }) : '&nbsp;'}</span>`;
      }
      return;
    }
    const at = performance.now();
    if (at - lastWrong > 180) { errors++; lastWrong = at; combo = 0; }
    piano.flash(midi, PAL.graphite);
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
    // Au micro, un accord se verifie en entier (onChord) : une note seule ne compte ni pour ni contre
    if (fromMic && st.notes.length > 1 && source !== 'chord') return;
    const hit = st.notes.find((n) => (fromMic ? sameNote(midi, n.midi) : midi === n.midi) && !st.got.has(n.midi));
    if (hit) {
      st.got.add(hit.midi);
      markNote(hit.i, true);
      piano.flash(hit.midi, PAL.ok);
      const done = fromMic || st.notes.every((n) => st.got.has(n.midi));
      if (done) {
        st.notes.forEach((n) => {
          markNote(n.i, true);
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
    const at = performance.now();
    if (at - lastWrong > 180) { errors++; lastWrong = at; }
    piano.flash(midi, PAL.graphite);
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
        say(t('Cherche {notes}, la touche en couleur.', { notes: st.notes.map((n) => (lang() === 'en' ? noteName(n.midi) : noteName(n.midi).toLowerCase())).join(t(' et ')) }));
      } else if (waited > 9000 && hintLevel === 1) {
        hintLevel = 2;
        say(t('Écoute-la, puis joue-la.'));
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
          st.notes.forEach((n) => { if (!st.got.has(n.midi)) markNote(n.i, false); });
          misses += st.notes.length - st.got.size;
          correct += st.got.size;
          combo = 0;
          next.innerHTML = `<b>${t('Raté')}</b><span>&nbsp;</span>`;
        }
        si++;
      }
    }
    while (autoIdx < auto.length && auto[autoIdx].start <= target) {
      if (auto[autoIdx].start >= now - 0.01) playAuto(auto[autoIdx]);
      autoIdx++;
    }
    if (mode === 'ecoute') backing?.update(target);
    // Rate une note qui est passee sans etre jouee (mode ecoute : rien a rater)
    now = target;
    hw.setTime(now);
    sheet?.setTime(now);
    prog.style.transform = `scaleX(${Math.max(0, Math.min(1, now / score.total))})`;
    if (now >= score.total + (mode === 'rythme' ? WINDOW + 0.4 : 0.4) && si >= learn.length) finish();
  });

  function start(which) {
    stop();
    begin(which);
  }

  function begin(which) {
    result.hidden = true;
    mode = which;
    prepare();
    playBtn.textContent = which === 'joue' ? t('Arrêter') : t('Jouer');
    listenBtn.textContent = which === 'ecoute' ? t('Arrêter') : t('Écouter');
    if (canRhythm) rhythmBtn.textContent = which === 'rythme' ? t('Arrêter') : t('En rythme');
    piano.setView(display === 'partition' ? 'front' : 'highway');
    if (which === 'rythme') {
      next.innerHTML = '';
      piano.hideFinger();
      piano.clearHighlights();
      startListening();
      say(t('Le morceau n’attend pas : joue chaque note au moment où elle touche le clavier.'));
    } else if (which === 'joue') {
      nextHint();
      waitStart = performance.now();
      startListening();
      say(lecon?.texte || song.intro || t('Les notes arrivent : joue chacune quand elle touche le clavier.'));
    } else {
      next.innerHTML = '';
      piano.hideFinger();
      if (backing) say(t('L’instru tourne derrière. Le piano est calé dessus.'));
    }
    now = -3.2;
    lastCount = null;
    backing?.stop();
    backing = which === 'ecoute' ? createBacking(song.id, { bpm: (song.tempo || 90) * scale }) : null;
  }

  function stop({ keepHall = false } = {}) {
    const was = mode;
    mode = 'idle';
    if (!keepHall) closeHall();
    timers.forEach((tm) => clearTimeout(tm));
    timers.clear();
    piano.releaseAll();
    piano.clearHighlights();
    piano.hideFinger();
    countdown.textContent = '';
    lastCount = null;
    playBtn.textContent = locked ? t('Palier {n}', { n: song.palier }) : t('Jouer');
    listenBtn.textContent = t('Écouter');
    if (canRhythm) rhythmBtn.textContent = t('En rythme');
    if (concertBtn) concertBtn.textContent = finalConcert ? t('Monter sur scène') : t('Concert');
    listener?.stop();
    listener = null;
    listenBar.hidden = true;
    backing?.stop();
    backing = null;
    return was;
  }

  async function startListening() {
    if (listener) return;
    const { Listener } = await import('./listen.js');
    if (mode !== 'joue' && mode !== 'rythme') return;
    const l = new Listener({
      onNote: (midi) => { heard.textContent = noteName(midi); onPlayed(midi, 'mic'); },
      onChord: (midis) => {
        heard.textContent = midis.map((x) => noteName(x)).join(' + ');
        const st = learn[si];
        if (mode !== 'joue' || !st || midis.join() !== st.notes.map((n) => n.midi).join()) return;
        st.notes.forEach((n) => onPlayed(n.midi, 'touch'));
      },
      onLevel: (v) => { meter.style.width = `${Math.round(v * 100)}%`; },
      onPitch: (midi) => { if (midi == null) heard.textContent = '–'; },
    });
    try {
      await l.start();
      if (!alive || (mode !== 'joue' && mode !== 'rythme')) { l.stop(); return; }
      listener = l;
      listenBar.hidden = false;
    } catch (e) {
      showToast(`<b>${t('Micro non disponible')}</b><span>${fr(t('Joue sur les touches à l’écran, ou autorise le micro.'))}</span>`);
    }
  }

  function finish() {
    const wasRhythm = mode === 'rythme';
    const wasPlaying = mode === 'joue' || wasRhythm;
    const wasConcert = concert && wasRhythm;
    stop({ keepHall: wasConcert });
    mode = 'fini';
    if (!wasPlaying) {
      showToast(`<b>${esc(song.titre)}</b><span>${fr(t('À toi, maintenant : appuie sur « Jouer ».'))}</span>`);
      mode = 'idle';
      return;
    }
    const totalNotes = learn.reduce((a, s) => a + s.notes.length, 0);
    const acc = totalNotes ? Math.round((100 * correct) / Math.max(1, correct + errors + misses)) : 100;
    const boss = !!lecon?.boss;
    const res = completeSong(song.id, acc, boss);
    if (lecon) completeLesson(lecon.id, acc);
    const badges = [];
    if (part === 'RL' && hasLeft && hasRight && unlockBadge('deux-mains')) badges.push(t('Deux mains'));
    if (res.stars === 3 && unlockBadge('trois-etoiles')) badges.push(t('Sans faute'));
    const st = getState();
    const pal = lecon ? palier : null;
    const palierDone = pal && palierStatus(pal, st.lessonsDone).complete;
    if (pal?.id === 1 && palierDone && unlockBadge('palier-1')) badges.push(t('Les bases'));
    const all = ALL_LESSONS;
    const nextLesson = lecon ? all[all.findIndex((l) => l.id === lecon.id) + 1] : null;
    if (wasConcert) {
      hall?.finale(acc);
      say(acc >= 95 ? t('Toute la salle est debout.') : acc >= 85 ? t('La salle se lève pour toi.') : acc >= 70 ? t('Écoute ces applaudissements : ils sont pour toi.') : t('La salle t’applaudit. Rejoue-le : la prochaine fois, elle se lèvera.'));
      const later = setTimeout(() => { if (alive) showConcertResult({ acc, res, badges, palierDone }); }, 4600);
      timers.add(later);
      return;
    }
    say(lecon?.apres || (acc >= 95 ? t('Magnifique.') : t('Bravo, morceau terminé.')));
    result.innerHTML = `
      <div class="result-card">
        <div class="eyebrow" style="justify-content:center">${boss ? t('Palier réussi') : wasRhythm ? t('Joué en rythme') : t('Morceau joué')}</div>
        <div class="stars">${[1, 2, 3].map((n) => `<i class="${n <= res.stars ? 'got' : ''}" style="--n:${n}"></i>`).join('')}</div>
        <div class="result-xp">+<span data-count="${res.gained}">0</span> XP</div>
        <p class="hint" style="margin:.2rem 0 0">${t('Précision {acc} %', { acc })}${fresh.length ? ` · ${fresh.length === 1 ? t('nouvelle note') : t('nouvelles notes')} : ${fresh.map((m) => noteName(m)).join(', ')}` : ''}</p>
        ${badges.length ? `<p class="new-badge">${t('Nouveau badge : {liste}', { liste: badges.join(', ') })}</p>` : ''}
        <div class="result-actions">
          <button class="btn ghost" id="again">${t('Rejouer')}</button>
          ${palierDone && pal.id < 8 ? `<a class="btn" href="#/piano?nouveau=${pal.id + 1}">${t('Découvrir le palier {n}', { n: pal.id + 1 })}</a>`
            : nextLesson ? `<a class="btn" href="#/lecon/${nextLesson.id}">${t('Leçon suivante')}</a>`
            : `<a class="btn" href="#/morceaux">${t('Autres morceaux')}</a>`}
        </div>
      </div>`;
    result.hidden = false;
    countUp(result);
    $('#again').addEventListener('click', () => start(wasRhythm ? 'rythme' : 'joue'));
  }

  // ---------- Le concert ----------
  const concertBtn = $('#concert');
  const concertCard = $('#concert-card');
  // Pendant le concert, les autres boutons se taisent : un seul geste possible, s'arreter
  const lockControls = (on) => [playBtn, listenBtn, rhythmBtn].forEach((b) => { if (on) b.setAttribute('aria-disabled', 'true'); else b.removeAttribute('aria-disabled'); b.classList.toggle('muted', on); });
  function closeHall() {
    concert = false;
    hall?.dispose();
    hall = null;
    concertCard.hidden = true;
    stageBox.classList.remove('in-concert');
    lockControls(false);
  }

  async function startConcert() {
    stop();
    const { ConcertHall } = await import('./concert.js');
    if (!alive) return;
    hall = new ConcertHall(piano);
    if (window.__piano) window.__hall = hall; // ?debug : pour les essais
    concert = true;
    stageBox.classList.add('in-concert');
    lockControls(true);
    piano.setView(display === 'partition' ? 'front' : 'highway');
    mode = 'rideau';
    concertBtn.textContent = t('Arrêter');
    hall.dim();
    const who = getSettings().prenom;
    concertCard.innerHTML = `
      <p class="eyebrow">${finalConcert ? t('Concert de fin de parcours') : t('Concert')}</p>
      <h2>${esc(song.titre)}</h2>
      <p class="concert-who">${fr(who ? t('Au piano ce soir : {nom}.', { nom: esc(who) }) : t('Au piano ce soir : toi.'))}</p>
      <p class="concert-hint">${fr(t('La salle s’éteint. Respire, puis joue chaque note quand elle touche le clavier.'))}</p>`;
    concertCard.hidden = false;
    concertCard.classList.remove('go');
    void concertCard.offsetWidth;
    concertCard.classList.add('go');
    const tm = setTimeout(() => {
      timers.delete(tm);
      if (!alive || !concert || mode !== 'rideau') return;
      concertCard.hidden = true;
      hall.playing();
      begin('rythme');
      concertBtn.textContent = t('Arrêter');
      rhythmBtn.textContent = t('En rythme');
    }, 3600);
    timers.add(tm);
  }

  function showConcertResult({ acc, res, badges, palierDone }) {
    lockControls(false);
    const courseDone = finalConcert && palierDone;
    const verdict = acc >= 95 ? t('Ovation debout') : acc >= 85 ? t('La salle se lève') : acc >= 70 ? t('Beaux applaudissements') : t('La salle applaudit');
    const s = getState();
    result.innerHTML = `
      <div class="result-card concert-result">
        <div class="eyebrow" style="justify-content:center">${courseDone ? t('Parcours terminé') : t('Concert donné')}</div>
        <h3 class="concert-verdict">${verdict}</h3>
        <div class="stars">${[1, 2, 3].map((n) => `<i class="${n <= res.stars ? 'got' : ''}" style="--n:${n}"></i>`).join('')}</div>
        ${res.gained ? `<div class="result-xp">+<span data-count="${res.gained}">0</span> XP</div>` : ''}
        <p class="hint" style="margin:.2rem 0 0">${t('Précision {acc} %', { acc })}</p>
        ${badges.length ? `<p class="new-badge">${t('Nouveau badge : {liste}', { liste: badges.join(', ') })}</p>` : ''}
        ${courseDone ? `
        <div class="certif">
          <p>${fr(t('Les huit paliers sont derrière toi. Ton certificat t’attend : écris ton nom tel qu’il doit y figurer.'))}</p>
          <label class="field"><span>${t('Nom sur le certificat')}</span><input type="text" id="certif-name" maxlength="40" value="${esc(getSettings().prenom || '')}" placeholder="${t('Ton nom')}" autocomplete="name"></label>
          <div class="result-actions">
            <button class="btn" id="certif-get">${t('Télécharger le certificat')}</button>
            ${navigator.canShare ? `<button class="btn ghost" id="certif-share">${t('Partager')}</button>` : ''}
          </div>
        </div>` : ''}
        <div class="result-actions">
          <button class="btn ghost" id="again">${t('Rejouer le concert')}</button>
          <a class="btn ${courseDone ? 'ghost' : ''}" href="#/morceaux">${courseDone ? t('Tous les morceaux') : t('Autres morceaux')}</a>
        </div>
      </div>`;
    result.hidden = false;
    countUp(result);
    $('#again').addEventListener('click', () => startConcert());
    const give = async (share) => {
      const fallback = t('Pianiste');
      const name = ($('#certif-name').value || '').trim() || fallback;
      if (!getSettings().prenom && name !== fallback) setSetting('prenom', name.split(' ')[0]);
      const { certificateBlob, deliverCertificate } = await import('./certificate.js');
      const blob = await certificateBlob({
        name,
        song: song.titre,
        acc,
        xp: s.xp,
        lessons: Object.keys(s.lessonsDone).length,
        songs: Object.keys(s.songsDone).length,
        lang: lang(),
      });
      await deliverCertificate(blob, { share, title: `${BRAND} · ${t('certificat')}` });
    };
    $('#certif-get')?.addEventListener('click', () => give(false));
    $('#certif-share')?.addEventListener('click', () => give(true));
  }

  concertBtn?.addEventListener('click', () => {
    if (concert && (mode === 'rythme' || mode === 'rideau')) { stop(); return; }
    startConcert();
  });

  const busy = () => concert && (mode === 'rythme' || mode === 'rideau');
  playBtn.addEventListener('click', () => { if (busy()) return; if (mode === 'joue') { stop(); return; } start('joue'); });
  listenBtn.addEventListener('click', () => { if (busy()) return; if (mode === 'ecoute') { stop(); return; } start('ecoute'); });
  rhythmBtn.addEventListener('click', () => { if (!canRhythm || busy()) return; if (mode === 'rythme') { stop(); return; } start('rythme'); });
  $('#hands')?.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-h]');
    if (!b) return;
    part = b.dataset.h;
    $('#hands').querySelectorAll('button').forEach((x) => x.classList.toggle('on', x === b));
    if (mode === 'joue') start('joue');
  });
  $('#display').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-d]');
    if (!b || b.disabled) return;
    setSetting('affichage', b.dataset.d);
    applyDisplay(b.dataset.d);
  });
  applyDisplay(display);

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
