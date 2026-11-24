// Page d'une lecon.
// Le prof montre, puis l'eleve rejoue note par note : le site attend la bonne note, qu'elle vienne
// du micro (vrai piano), de l'ecran, du clavier d'ordinateur ou d'un piano numerique.
// Chaque note apprise s'encre pour de bon sur le clavier.
import { PAL, handColor } from './palette.js';
import { mountPiano } from './mount.js';
import { noteName } from './notes.js';
import { parseScore } from './score.js';
import { getState, unlockBadge, completeLesson, discover, knownKeys, getSettings, setSetting } from './progress.js';
import { findLesson, palierStatus, currentPalier, ALL_LESSONS, PALIERS, lessonUnlocked } from './data/paliers.js';
import { instrumentAt, freeRange, wholeOctaves } from './instrument.js';
import { sameNote } from './listen.js';
import { countUp } from './fx.js';
import { speak, hush, voiceAvailable } from './voice.js';
import { fr, esc, DOIGTS } from './text.js';
import { renderPlayer } from './tutorial.js';
import { hasKeyboard } from './kbd-ui.js';
import { t, lang } from './i18n.js';
import { Sheet } from './sheet.js';
import { keepAwake } from './awake.js';

const EN = lang() === 'en';
// Ou trouver une touche, dit avec les reperes des touches noires
const PLACES_EN = [
  'just left of the two black keys', 'the first of the two black keys', 'between the two black keys',
  'the second of the two black keys', 'just right of the two black keys', 'just left of the three black keys',
  'the first of the three black keys', 'between the first and second of the three black keys',
  'the middle one of the three black keys', 'between the second and third of the three black keys',
  'the last of the three black keys', 'just right of the three black keys',
];
const PLACES = {
  0: 'juste à gauche des deux touches noires',
  1: 'la première des deux touches noires',
  2: 'entre les deux touches noires',
  3: 'la deuxième des deux touches noires',
  4: 'juste à droite des deux touches noires',
  5: 'juste à gauche des trois touches noires',
  6: 'la première des trois touches noires',
  7: 'entre la première et la deuxième des trois noires',
  8: 'celle du milieu des trois touches noires',
  9: 'entre la deuxième et la troisième des trois noires',
  10: 'la dernière des trois touches noires',
  11: 'juste à droite des trois touches noires',
};
function where(midi) {
  if (EN) return PLACES_EN[midi % 12] + (midi < 60 ? ', on the low side (left)' : midi > 71 ? ', on the high side (right)' : ', in the middle of the keyboard');
  const zone = midi < 60 ? ', côté grave (à gauche)' : midi > 71 ? ', côté aigu (à droite)' : ', au milieu du clavier';
  return PLACES[midi % 12] + zone;
}
// Nom d'une note dans une phrase : « le do », « l’ré »… en francais ; « C » en anglais
const nom = (m) => (EN ? noteName(m) : noteName(m).toLowerCase());
const art = (m) => (EN ? '' : /^[aeiouy]/i.test(noteName(m)) ? 'l’' : 'le ');
// « , avec le pouce de la main droite » / « , with your right thumb »
function fingerPhrase(n) {
  if (!n.finger) return '';
  if (EN) return `, with your ${n.hand === 'L' ? 'left' : 'right'} ${DOIGTS[n.finger]}`;
  return `, avec ${n.finger === 1 ? 'le pouce' : `le ${DOIGTS[n.finger]}`} de la main ${n.hand === 'L' ? 'gauche' : 'droite'}`;
}

export function renderLesson(app, id) {
  const found = findLesson(id);
  if (!found) return null;
  const { palier, lecon, index } = found;
  const state = getState();
  const pIndex = PALIERS.indexOf(palier);

  if (!lessonUnlocked(pIndex, index, state)) {
    const prev = palier.lecons[index - 1];
    app.innerHTML = `
      <div class="empty">
        <div class="eyebrow">${t('Pas encore')}</div>
        <h1 data-split>${t('Une touche <span class="pencil-word">après l’autre</span>')}</h1>
        <p class="lead" style="margin:0 auto 1.6rem">${fr(prev ? t('Cette leçon s’ouvre quand tu as fini « {titre} ».', { titre: esc(prev.titre) }) : t('Ce palier s’ouvre quand tu as fini le précédent.'))}</p>
        <a class="btn" href="${prev ? `#/lecon/${prev.id}` : '#/parcours'}">${prev ? t('Aller à cette leçon') : t('Voir le parcours')}</a>
      </div>`;
    return () => {};
  }

  if (lecon.type === 'morceau') return renderPlayer(app, lecon.morceau, { lecon, palier });

  const score = parseScore(lecon);
  const steps = score.steps;
  const total = steps.length;
  const all = ALL_LESSONS;
  const next = all[all.findIndex((l) => l.id === id) + 1];
  const instr = instrumentAt(currentPalier(state));
  const known = knownKeys();
  const free = freeRange(instr, known);
  const need = wholeOctaves(score.low, score.high);
  // Avec le prof, le clavier a au moins trois octaves (a l'echelle de ses mains) ; les touches pas encore
  // apprises restent des fantomes : la decouverte passe par la lumiere, pas par la taille.
  const full = [Math.min(free[0], need[0], 48), Math.max(free[1], need[1], 84)];
  const settings = getSettings();
  const canHideNames = instr.features.has('cacher-noms');
  const withSheet = instr.features.has('portee');

  app.innerHTML = `
    <div class="lesson-head">
      <p class="crumbs" data-reveal><a href="#/parcours">${t('Parcours')}</a><i></i><span>${t('Palier {n}', { n: palier.id })} · ${esc(palier.titre)}</span><i></i><span>${t('Leçon {i} sur {n}', { i: index + 1, n: palier.lecons.length })}</span></p>
      <h1 data-split class="lesson-title">${esc(lecon.titre)}</h1>
    </div>
    <div class="stage" data-reveal style="--d:120ms">
      <div class="piano-wrap stage-3d" id="stage"></div>
      <div class="bubble" id="bubble">
        <span class="bubble-who">${t('Le prof')}</span>
        <p id="bubble-text">${fr(esc(lecon.texte || ''))}</p>
      </div>
      <div class="stage-loading" id="stage-loading"><span></span>${t('Le prof s’installe au piano')}</div>
      <div class="toast" id="toast" aria-live="polite"></div>
      <div class="result" id="result" hidden></div>
    </div>
    <div class="listen-bar" id="listen-bar" hidden>
      <span class="mic-dot"></span>
      <span class="meter"><span id="meter"></span></span>
      <span class="heard">${t('J’entends')} <strong id="heard">–</strong></span>
    </div>
    ${withSheet ? `<div class="lesson-sheet" id="lesson-sheet" aria-label="${t('La partition de l’exercice')}"></div>` : ''}
    <div class="seq" id="seq" ${withSheet ? 'hidden' : ''} aria-label="${t('Les notes de l’exercice')}">${steps.map((s) => `<span>${s.notes.map((n) => noteName(n.midi)).join('+')}</span>`).join('')}</div>
    <div class="lesson-controls">
      <button class="btn ghost" id="watch" disabled>${t('Regarder le prof')}</button>
      <button class="btn" id="go">${t('À toi de jouer')}</button>
      <div class="toggles">
        <div class="seg" id="views" role="group" aria-label="${t('Caméra')}"><button data-v="teacher" class="on">${t('Le prof')}</button><button data-v="hands">${t('Ses mains')}</button></div>
        ${canHideNames ? `<label class="chip-toggle"><input type="checkbox" id="opt-labels" ${settings.noms ? 'checked' : ''}> ${t('Nom des notes')}</label>` : ''}
        ${voiceAvailable() ? `<label class="chip-toggle"><input type="checkbox" id="opt-voice" ${settings.voix ? 'checked' : ''}> ${t('Voix du prof')}</label>` : ''}
      </div>
    </div>
    <p class="hint lesson-tip">${fr(hasKeyboard() ? t('Pose ton téléphone ou ta tablette sur le pupitre : le site écoute ton piano au micro. Pas de piano sous la main ? Joue sur les touches à l’écran ou sur ton clavier d’ordinateur.') : t('Pose ton téléphone ou ta tablette sur le pupitre : le site écoute ton piano au micro. Pas de piano sous la main ? Joue sur les touches à l’écran.'))}</p>
  `;

  const $ = (sel) => app.querySelector(sel);
  const bubble = $('#bubble');
  const bubbleText = $('#bubble-text');
  const toast = $('#toast');
  const chips = [...app.querySelectorAll('#seq span')];
  const watchBtn = $('#watch');
  const goBtn = $('#go');
  const result = $('#result');
  const heard = $('#heard');
  const meter = $('#meter');
  const listenBar = $('#listen-bar');
  const views = $('#views');
  const setView = (v) => {
    piano.setView(v);
    views.querySelectorAll('button').forEach((b) => b.classList.toggle('on', b.dataset.v === v));
  };

  let alive = true;
  let teacher = null;
  let listener = null;
  let mode = 'watch';
  let idx = 0;
  let got = new Set();
  let errors = 0;
  let errorsHere = 0;
  let hesitate = null;
  let fresh = [];
  let speakingUntil = 0;

  const say = (txt, { voice = true } = {}) => {
    bubbleText.textContent = fr(txt);
    bubble.classList.remove('pop');
    void bubble.offsetWidth;
    bubble.classList.add('pop');
    if (voice) {
      const ms = speak(txt);
      if (ms) { speakingUntil = performance.now() + ms; listener?.mute(ms); }
    }
  };
  const showToast = (html) => {
    toast.innerHTML = html;
    toast.classList.remove('show');
    void toast.offsetWidth;
    toast.classList.add('show');
  };

  const m = mountPiano($('#stage'), {
    low: full[0],
    high: full[1],
    stage: instr.stage,
    known,
    floorY: -31,
    view: 'teacher',
    labels: canHideNames ? settings.noms : true,
    onNoteOn: (midi, meta) => {
      if (meta?.teacher) return;
      listener?.mute(650); // le son du piano a l'ecran ne doit pas etre compte une deuxieme fois par le micro
      handle(midi, meta?.source || 'touch');
    },
  });
  if (!m.piano) return () => {};
  const piano = m.piano;
  keepAwake(true);
  const sheet = withSheet ? new Sheet($('#lesson-sheet'), score, { mode: 'static', ppb: 46 }) : null;
  const eventIndex = (n) => score.events.indexOf(n);

  // Le prof arrive (charge une seule fois pour tout le site)
  import('./teacher.js').then(({ Teacher }) => Teacher.load(piano, { main: lecon.main })).then((t) => {
    if (!alive) { t.dispose(); return; }
    teacher = t;
    if (window.__piano) window.__teacher = t; // ?debug : pour les essais
    $('#stage-loading').classList.add('done');
    watchBtn.disabled = false;
  }).catch((e) => {
    console.error(e);
    $('#stage-loading').innerHTML = fr(t('Le prof n’a pas pu venir (connexion ?). Tu peux quand même jouer : appuie sur « À toi de jouer ».'));
    setTimeout(() => $('#stage-loading')?.classList.add('done'), 3200);
  });

  $('#opt-labels')?.addEventListener('change', (e) => { setSetting('noms', e.target.checked); });
  $('#opt-voice')?.addEventListener('change', (e) => { setSetting('voix', e.target.checked); if (!e.target.checked) hush(); });
  views.addEventListener('click', (e) => {
    const b = e.target.closest('button[data-v]');
    if (b) setView(b.dataset.v);
  });

  const clearChips = () => chips.forEach((c) => c.classList.remove('on', 'past', 'ok', 'bad'));

  // ---------- Le prof montre ----------
  watchBtn.addEventListener('click', async () => {
    if (!teacher) return;
    if (watchBtn.dataset.playing) { teacher.stop(); return; }
    stopPlay();
    clearChips();
    result.hidden = true;
    watchBtn.dataset.playing = '1';
    watchBtn.textContent = t('Arrêter');
    say(lecon.texte);
    // La camera descend du visage du prof vers ses mains
    setView('hands');
    const done = await teacher.playScore(steps, {
      tempo: (lecon.tempo || 80) * (getSettings().vitesse || 1),
      total: score.total,
      onStep: (i) => chips.forEach((c, k) => { c.classList.toggle('on', k === i); c.classList.toggle('past', k < i); }),
    });
    if (!alive) return;
    clearChips();
    if (done) { teacher.nod(); say(t('À toi maintenant. Appuie sur « À toi de jouer » quand tu veux.')); }
    delete watchBtn.dataset.playing;
    watchBtn.textContent = t('Revoir');
  });

  // ---------- A toi de jouer ----------
  const step = () => steps[idx];

  function focusOn(midis) {
    const narrow = piano.container.clientWidth < 700;
    if (narrow) {
      const lo = Math.min(...midis);
      const hi = Math.max(...midis);
      piano.setFocus(lo - 5, hi + 5);
    } else piano.setFocus(need[0], need[1]);
  }

  function showStep() {
    const st = step();
    piano.clearHighlights();
    clearChips();
    chips.forEach((c, k) => c.classList.toggle('ok', k < idx));
    chips[idx]?.classList.add('on');
    chips[idx]?.scrollIntoView({ block: 'nearest', inline: 'center', behavior: 'smooth' });
    got = new Set();
    errorsHere = 0;
    st.notes.forEach((n) => piano.highlight(n.midi, handColor(n.hand)));
    sheet?.focus(st.notes.map(eventIndex));
    const first = st.notes[0];
    piano.showFinger(first.midi, first.finger);
    const hand = {};
    for (let k = idx; k < Math.min(steps.length, idx + 8); k++) {
      steps[k].notes.forEach((n) => {
        if (n.finger && n.hand === first.hand && !hand[n.midi]) hand[n.midi] = { finger: n.finger, hand: n.hand };
      });
    }
    piano.setHandMap(hand);
    listener?.expectChord(st.notes.length > 1 ? st.notes.map((n) => n.midi) : null);
    focusOn(st.notes.map((n) => n.midi));
    const doigt = fingerPhrase(first);
    const note = art(first.midi) + st.notes.map((n) => nom(n.midi)).join(t(' et '));
    if (idx === 0) say(t('À toi ! Commence par {note}{doigt}.', { note, doigt }), { voice: false });
    else say(t('{bravo} Maintenant {note}{doigt}.', { bravo: [t('Bien.'), t('Oui.'), t('Juste.'), t('Parfait.')][idx % 4], note, doigt }), { voice: false });
    armHesitation();
  }

  // Si l'eleve hesite : un indice, puis le prof montre
  function armHesitation() {
    clearTimeout(hesitate);
    const st = step();
    if (!st) return;
    hesitate = setTimeout(() => {
      if (mode !== 'play' || step() !== st) return;
      const n = st.notes[0].midi;
      say(t('Cherche {note} : {ou}.', { note: art(n) + nom(n), ou: where(n) }));
      hesitate = setTimeout(() => {
        if (mode !== 'play' || step() !== st || !teacher) return;
        say(t('Regarde, je te le montre.'));
        listener?.mute(1500);
        st.notes.forEach((x) => teacher.playNote(x.midi, 600, { hand: x.hand, finger: x.finger }));
        setTimeout(() => { if (mode === 'play') { teacher?.restHand('Right'); teacher?.restHand('Left'); } }, 1300);
      }, 6000);
    }, 5000);
  }

  function handle(midi, source) {
    if (mode !== 'play') return;
    const st = step();
    if (!st) return;
    teacher?.watch(midi);
    const fromMic = source === 'mic';
    // Au micro, un accord se verifie en entier (handleChord) : une note seule ne compte ni pour ni contre
    if (fromMic && st.notes.length > 1) return;
    const match = st.notes.find((n) => (fromMic ? sameNote(midi, n.midi) : midi === n.midi));
    if (match) {
      got.add(match.midi);
      const complete = fromMic || st.notes.every((n) => got.has(n.midi));
      if (fromMic) piano.flash(match.midi, PAL.ok);
      if (!complete) return;
      st.notes.forEach((n) => {
        sheet?.mark(eventIndex(n), true);
        piano.flash(n.midi, PAL.ok);
        if (discover(n.midi)) {
          piano.discover(n.midi);
          fresh.push(n.midi);
          showToast(`<b>${t('Nouvelle note : {nom}', { nom: noteName(n.midi) })}</b><span>${fr(t('Elle est encrée pour de bon sur ton clavier.'))}</span>`);
        }
      });
      if (getSettings().vibration && source === 'touch') navigator.vibrate?.([4, 30, 8]);
      idx++;
      if (idx >= total) finish();
      else showStep();
      return;
    }
    errors++;
    errorsHere++;
    piano.flash(midi, PAL.graphite);
    const chip = chips[idx];
    chip?.classList.remove('bad');
    void chip?.offsetWidth;
    chip?.classList.add('bad');
    const want = st.notes[0].midi;
    if (errorsHere >= 3 && teacher) {
      say(t('Regarde bien, c’est ce {note}-là : {ou}.', { note: nom(want), ou: where(want) }));
      listener?.mute(1400);
      teacher.playNote(want, 600, { hand: st.notes[0].hand, finger: st.notes[0].finger });
      teacher.shake();
      setTimeout(() => { if (mode === 'play') { teacher?.restHand('Right'); teacher?.restHand('Left'); } }, 1300);
      errorsHere = 0;
    } else {
      say(t('Ça, c’était un {joue}. Cherche {note}.', { joue: nom(midi), note: art(want) + nom(want) }), { voice: false });
    }
    armHesitation();
  }

  // Accord entendu au micro, verifie note par note
  function handleChord(midis) {
    const st = step();
    if (mode !== 'play' || !st || st.notes.length < 2) return;
    if (midis.join() !== st.notes.map((n) => n.midi).join()) return;
    st.notes.forEach((n) => got.add(n.midi));
    handle(st.notes[0].midi, 'chord');
  }

  goBtn.addEventListener('click', async () => {
    if (mode === 'play') { stopPlay(); say(t('On reprend quand tu veux.'), { voice: false }); return; }
    teacher?.stop();
    delete watchBtn.dataset.playing;
    watchBtn.textContent = teacher ? t('Revoir le prof') : t('Regarder le prof');
    result.hidden = true;
    mode = 'play';
    idx = 0;
    errors = 0;
    fresh = [];
    sheet?.reset();
    // A l'eleve : le prof retire ses mains du clavier
    teacher?.restHand('Right');
    teacher?.restHand('Left');
    goBtn.textContent = t('Arrêter');
    setView('hands');
    showStep();
    const n0 = steps[0]?.notes[0];
    if (n0?.finger) say(t('Pose ta main : chaque numéro est un doigt. {doigt} sur {note}, et on y va.', { doigt: n0.finger === 1 ? t('Le pouce') : t('Le doigt {n}', { n: n0.finger }), note: art(n0.midi) + nom(n0.midi) }), { voice: false });
    startListening();
  });

  async function startListening() {
    if (listener) return;
    const { Listener } = await import('./listen.js');
    if (mode !== 'play' || listener || !alive) return;
    const l = new Listener({
      onNote: (midi) => {
        if (performance.now() < speakingUntil) return;
        heard.textContent = noteName(midi);
        handle(midi, 'mic');
      },
      onLevel: (v) => { meter.style.width = `${Math.round(v * 100)}%`; teacher?.hear(v); },
      onPitch: (midi) => { if (midi == null) heard.textContent = '–'; },
      onChord: (midis) => { heard.textContent = midis.map((x) => noteName(x)).join(' + '); handleChord(midis); },
    });
    try {
      await l.start();
      if (mode !== 'play' || !alive) { l.stop(); return; }
      listener = l;
      const cur = step();
      listener.expectChord(cur && cur.notes.length > 1 ? cur.notes.map((n) => n.midi) : null);
      listenBar.hidden = false;
      teacher?.listen(true);
    } catch (e) {
      showToast(`<b>${t('Micro non disponible')}</b><span>${fr(t('Joue sur les touches à l’écran, ou autorise le micro dans ton navigateur.'))}</span>`);
    }
  }

  function stopPlay() {
    mode = 'watch';
    clearTimeout(hesitate);
    piano.clearHighlights();
    piano.hideFinger();
    piano.setHandMap(null);
    piano.setFocus(null);
    goBtn.textContent = t('À toi de jouer');
    listener?.stop();
    listener = null;
    listenBar.hidden = true;
    teacher?.listen(false);
  }

  function finish() {
    const acc = Math.round((100 * total) / (total + errors));
    stopPlay();
    clearChips();
    chips.forEach((c) => c.classList.add('ok'));
    const { stars, gained } = completeLesson(id, acc);
    const badges = [];
    if (unlockBadge('premiere-lecon')) badges.push(t('C’est parti'));
    if (stars === 3 && unlockBadge('trois-etoiles')) badges.push(t('Sans faute'));
    if (getState().streak >= 7 && unlockBadge('serie-7')) badges.push(t('Une semaine'));
    const st = getState();
    const palierDone = palierStatus(palier, st.lessonsDone).complete;

    say(lecon.apres || (acc >= 95 ? t('Parfait, rien à redire.') : acc >= 80 ? t('Très bien joué. Encore un essai pour les trois étoiles ?') : t('C’est validé. Rejoue-la quand tu veux pour faire mieux.')));
    if (teacher) {
      teacher.nod();
      teacher.playScore(parseScore({ droite: 'C4:0.5 E4:0.5 G4:0.5 C5:1.5' }).steps, { tempo: 150 });
    }
    const nextIsNewPalier = next && next.palier !== palier.id;
    result.innerHTML = `
      <div class="result-card">
        <div class="eyebrow" style="justify-content:center">${t('Leçon réussie')}</div>
        <div class="stars">${[1, 2, 3].map((n) => `<i class="${n <= stars ? 'got' : ''}" style="--n:${n}"></i>`).join('')}</div>
        <div class="result-xp">+<span data-count="${gained}">0</span> XP</div>
        <p class="hint" style="margin:.2rem 0 0">${t('Précision {acc} %', { acc })}${fresh.length ? ` · ${fresh.length === 1 ? t('nouvelle note') : t('nouvelles notes')} : ${fresh.map((m) => noteName(m)).join(', ')}` : ''}</p>
        ${badges.length ? `<p class="new-badge">${t('Nouveau badge : {liste}', { liste: badges.join(', ') })}</p>` : ''}
        <div class="result-actions">
          <button class="btn ghost" id="again">${t('Recommencer')}</button>
          ${palierDone && nextIsNewPalier ? `<a class="btn" href="#/piano?nouveau=${palier.id + 1}">${t('Découvrir le palier {n}', { n: palier.id + 1 })}</a>`
            : next ? `<a class="btn" href="#/lecon/${next.id}">${t('Leçon suivante')}</a>` : `<a class="btn" href="#/parcours">${t('Retour au parcours')}</a>`}
        </div>
      </div>`;
    result.hidden = false;
    countUp(result);
    $('#again').addEventListener('click', () => goBtn.click());
  }

  return () => {
    alive = false;
    keepAwake(false);
    clearTimeout(hesitate);
    hush();
    stopPlay();
    teacher?.stop();
    teacher?.dispose();
    m.dispose();
  };
}

