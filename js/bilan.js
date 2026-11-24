// Ton niveau : avant que le prof commence, on situe l'eleve.
// Debutant : pas de test, on part du debut. Intermediaire ou confirme : quelques questions, puis de
// courts tests joues (micro, ecran, clavier d'ordinateur ou piano numerique) qui le placent au bon palier.
import { mountPiano } from './mount.js';
import { noteName } from './notes.js';
import { pitchToMidi } from './score.js';
import { getState, setBilan, setPlacement, discover, getSettings, setSetting } from './progress.js';
import { PALIERS } from './data/paliers.js';
import { instrumentAt, STAGES } from './instrument.js';
import { sameNote } from './listen.js';
import { staffSVG } from './staff.js';
import { tick } from './audio.js';
import { connectMidi, midiSupported } from './midi.js';
import { fr, esc } from './text.js';
import { keepAwake } from './awake.js';

const NIVEAUX = [
  { id: 'debutant', titre: 'Je débute', desc: 'Je n’ai jamais joué, ou presque. On commence ensemble, depuis le tout premier do.', lit: 1 },
  { id: 'intermediaire', titre: 'Je joue un peu', desc: 'Je connais quelques notes et je joue quelques airs. Deux minutes de tests pour te placer.', lit: 5 },
  { id: 'expert', titre: 'Je joue bien', desc: 'Je lis la partition et je joue à deux mains. Quelques tests plus corsés.', lit: 12 },
];

const MATERIEL = [
  { id: 'acoustique', titre: 'Un piano acoustique', desc: 'Le site écoute au micro. Pose ton téléphone ou ta tablette sur le pupitre.' },
  { id: 'numerique', titre: 'Un piano numérique', desc: 'Branché en USB ou en Bluetooth : chaque note est reconnue sans erreur.' },
  { id: 'ecran', titre: 'L’écran', desc: 'Je joue sur les touches à l’écran, ou avec mon clavier d’ordinateur.' },
];

// Chaque test verifie la competence d'un palier. Le reussir, c'est pouvoir passer ce palier.
const TESTS = [
  { id: 'position', palier: 1, titre: 'Les cinq premières notes', consigne: 'Joue ces notes dans l’ordre.', steps: 'C4 D4 E4 F4 G4', show: 'names' },
  { id: 'melodie', palier: 2, titre: 'Sortir de la position', consigne: 'Joue cet air : il dépasse tes cinq doigts.', steps: 'C4 C4 G4 G4 A4 A4 G4', show: 'names' },
  { id: 'gauche', palier: 3, titre: 'La main gauche', consigne: 'Côté grave, à la main gauche : joue ces notes.', steps: 'C3 D3 E3 F3 G3 C3', show: 'names' },
  { id: 'lecture', palier: 4, titre: 'Lire la partition', consigne: 'Joue la note écrite sur la portée.', steps: 'E4 G4 C5 D4 A4 F3 A3', show: 'staff' },
  { id: 'rythme', palier: 5, titre: 'Le rythme', consigne: 'Joue n’importe quelle touche à chaque note, en même temps que le repère, avec le métronome.', rythme: [1, 1, 0.5, 0.5, 1, 2, 1, 0.5, 0.5, 2], show: 'rythme' },
  { id: 'deux-mains', palier: 6, titre: 'Les deux mains', consigne: 'Joue les deux notes ensemble, une à chaque main.', steps: 'C3+E4 F3+A4 G3+B4 C3+A4', show: 'names' },
  { id: 'accords', palier: 7, titre: 'Les accords', consigne: 'Joue chaque accord : les trois notes ensemble.', steps: 'C4+E4+G4 F4+A4+C5 G3+B3+D4', show: 'chords' },
];

const QUESTIONS = [
  { id: 'notes', texte: 'Je trouve n’importe quelle note sur le clavier.', cap: 1 },
  { id: 'gauche', texte: 'Je joue aussi de la main gauche.', cap: 3 },
  { id: 'lecture', texte: 'Je lis les notes sur une partition.', cap: 4 },
  { id: 'rythme', texte: 'Je compte les rythmes : noires, croches, silences.', cap: 5 },
  { id: 'deuxmains', texte: 'Je joue les deux mains en même temps.', cap: 6 },
  { id: 'accords', texte: 'Je connais les accords de do, de fa et de sol.', cap: 7 },
];

const CHORD_NAMES = { 'C4+E4+G4': 'Accord de do', 'F4+A4+C5': 'Accord de fa', 'G3+B3+D4': 'Accord de sol' };
const parseSteps = (txt) => txt.split(/\s+/).map((tok) => ({ tok, midis: tok.split('+').map(pitchToMidi) }));
const nom = (m) => noteName(m);
const zone = (m) => (m < 60 ? 'grave' : m >= 72 ? 'aigu' : 'milieu');

function miniKeys(n) {
  return `<span class="mini-kb">${Array.from({ length: 12 }, (_, i) => `<i class="${i < n ? 'on' : ''}"></i>`).join('')}</span>`;
}

export function renderBilan(app, { next = null } = {}) {
  const state = getState();
  const answers = {};
  let niveau = null;
  let materiel = getSettings().entree || null;
  let alive = true;
  let m = null;
  let listener = null;
  let runner = null;
  const results = [];
  const learned = new Set();

  app.innerHTML = `
    <div class="bilan">
      <div class="bilan-head">
        <div class="eyebrow" data-reveal>Avant ta première leçon</div>
        <h1 data-split>Où en es-tu <span class="grad-text">au piano</span> ?</h1>
        <div class="bilan-dots" id="dots"><i class="on"></i><i></i><i></i><i></i></div>
      </div>
      <div class="bilan-body" id="body"></div>
    </div>`;
  const body = app.querySelector('#body');
  const dots = [...app.querySelectorAll('#dots i')];
  const step = (n) => dots.forEach((d, i) => { d.classList.toggle('on', i <= n); });
  const swap = (html) => {
    body.classList.remove('in');
    body.innerHTML = html;
    void body.offsetWidth;
    body.classList.add('in');
  };

  // ---------- 1. Le niveau ----------
  function showNiveau() {
    step(0);
    swap(`
      <p class="lead">${fr('Pas de bonne ou de mauvaise réponse : le prof adapte tout le parcours à toi.')}</p>
      <div class="choices three">
        ${NIVEAUX.map((n) => `<button class="choice" data-niveau="${n.id}">${miniKeys(n.lit)}<strong>${esc(n.titre)}</strong><span>${fr(esc(n.desc))}</span></button>`).join('')}
      </div>`);
    body.querySelectorAll('[data-niveau]').forEach((b) => b.addEventListener('click', () => {
      niveau = b.dataset.niveau;
      showMateriel();
    }));
  }

  // ---------- 2. Sur quoi tu joues ----------
  function showMateriel() {
    step(1);
    swap(`
      <p class="lead">${fr('Sur quoi vas-tu jouer ?')}</p>
      <div class="choices three">
        ${MATERIEL.map((x) => `<button class="choice ${materiel === x.id ? 'on' : ''}" data-mat="${x.id}"><strong>${esc(x.titre)}</strong><span>${fr(esc(x.desc))}</span></button>`).join('')}
      </div>
      <p class="hint" id="mat-state"></p>
      <div class="bilan-nav"><button class="btn ghost small" id="back">Retour</button></div>`);
    body.querySelector('#back').addEventListener('click', showNiveau);
    body.querySelectorAll('[data-mat]').forEach((b) => b.addEventListener('click', async () => {
      materiel = b.dataset.mat;
      setSetting('entree', materiel);
      if (materiel === 'numerique' && midiSupported()) {
        const st = body.querySelector('#mat-state');
        st.textContent = 'Branche ton piano, puis autorise l’accès quand ton navigateur le demande…';
        try {
          const list = await connectMidi();
          st.textContent = list.length ? `Connecté : ${list.join(', ')}` : fr('Aucun piano détecté pour l’instant : il sera reconnu dès qu’il sera branché.');
        } catch (e) {
          st.textContent = fr('Accès refusé : tu pourras le connecter plus tard dans les réglages.');
        }
        await new Promise((r) => setTimeout(r, 900));
      }
      if (!alive) return;
      if (niveau === 'debutant') finish(1);
      else showQuestions();
    }));
  }

  // ---------- 3. Quelques questions ----------
  function showQuestions() {
    step(2);
    const list = niveau === 'expert' ? QUESTIONS : QUESTIONS.slice(0, 5);
    swap(`
      <p class="lead">${fr('Coche ce qui est vrai pour toi.')}</p>
      <div class="questions">
        ${list.map((q) => `<label class="question"><input type="checkbox" data-q="${q.id}" ${answers[q.id] ?? (niveau === 'expert') ? 'checked' : ''}><span>${fr(esc(q.texte))}</span></label>`).join('')}
      </div>
      <div class="bilan-nav"><button class="btn ghost small" id="back">Retour</button><button class="btn" id="go">Passer les tests</button></div>`);
    body.querySelector('#back').addEventListener('click', showMateriel);
    body.querySelector('#go').addEventListener('click', () => {
      body.querySelectorAll('[data-q]').forEach((c) => { answers[c.dataset.q] = c.checked; });
      startTests();
    });
  }

  // ---------- 4. Les tests ----------
  function startTests() {
    step(3);
    // Plafond : on ne teste pas ce que l'eleve dit ne pas savoir faire
    const cap = Math.min(8, ...QUESTIONS.filter((q) => answers[q.id] === false).map((q) => q.cap));
    const startIdx = niveau === 'expert' ? (answers.lecture ? 3 : 2) : (answers.notes ? 1 : 0);
    const queue = [];
    for (let i = startIdx; i < TESTS.length && queue.length < 4; i++) {
      if (TESTS[i].palier >= cap) break;
      queue.push(i);
    }
    if (!queue.length) { finish(Math.max(1, Math.min(cap, startIdx + 1))); return; }

    swap(`
      <div class="test-head"><span class="tag" id="t-count"></span><h2 id="t-title"></h2><p class="hint" id="t-consigne"></p></div>
      <div class="test-prompt" id="t-prompt"></div>
      <div class="stage test-stage">
        <div class="piano-wrap" id="t-piano"></div>
      </div>
      <div class="listen-bar" id="t-listen" hidden><span class="mic-dot"></span><span class="meter"><span id="t-meter"></span></span><span class="heard">J’entends <strong id="t-heard">–</strong></span></div>
      <div class="bilan-nav"><button class="btn ghost small" id="t-skip">Je ne sais pas faire</button></div>`);
    m = mountPiano(body.querySelector('#t-piano'), {
      low: 36, high: 84, stage: 'clavier', known: new Set(), view: 'front', focus: [48, 79],
      labels: false,
      onNoteOn: (midi, meta) => { listener?.mute(600); runner?.input(midi, meta?.source || 'touch'); },
    });
    keepAwake(true);
    if (materiel === 'acoustique') startListening();
    body.querySelector('#t-skip').addEventListener('click', () => runner?.giveUp());

    let qi = 0;
    let firstFailed = false;
    const runNext = () => {
      if (!alive) return;
      const idx = queue[qi];
      const test = TESTS[idx];
      body.querySelector('#t-count').textContent = `Test ${qi + 1} sur ${queue.length}`;
      body.querySelector('#t-title').textContent = test.titre;
      body.querySelector('#t-consigne').textContent = fr(test.consigne);
      const done = (pass) => {
        results.push({ test, pass });
        if (!pass) {
          // Premier test rate : on verifie le palier d'en dessous pour bien placer
          if (qi === 0 && idx > 0 && !firstFailed) {
            firstFailed = true;
            queue.splice(0, queue.length, idx - 1);
            qi = 0;
            setTimeout(runNext, 900);
            return;
          }
          finish(test.palier);
          return;
        }
        if (firstFailed) { finish(test.palier + 1); return; }
        qi++;
        if (qi < queue.length) setTimeout(runNext, 900);
        else finish(Math.min(cap, TESTS[queue[queue.length - 1]].palier + 1));
      };
      runner = test.show === 'rythme' ? rhythmRunner(test, done) : notesRunner(test, done);
    };
    runNext();
  }

  async function startListening() {
    const { Listener } = await import('./listen.js');
    if (!alive || listener) return;
    const l = new Listener({
      onNote: (midi) => { const h = body.querySelector('#t-heard'); if (h) h.textContent = nom(midi); runner?.input(midi, 'mic'); },
      onChord: (midis) => { const h = body.querySelector('#t-heard'); if (h) h.textContent = midis.map(nom).join(' + '); runner?.chord?.(midis); },
      onLevel: (v) => { const mt = body.querySelector('#t-meter'); if (mt) mt.style.width = `${Math.round(v * 100)}%`; },
    });
    try {
      await l.start();
      if (!alive) { l.stop(); return; }
      listener = l;
      const bar = body.querySelector('#t-listen');
      if (bar) bar.hidden = false;
    } catch (e) { /* pas de micro : l'ecran et le clavier marchent toujours */ }
  }

  // Test de notes : on joue chaque etape (une note, deux notes ensemble, ou un accord), deux essais par etape
  function notesRunner(test, done) {
    const steps = parseSteps(test.steps);
    const prompt = body.querySelector('#t-prompt');
    let i = 0;
    let ok = 0;
    let tries = 0;
    let got = new Set();
    let timer = null;
    let over = false;
    const show = () => {
      const st = steps[i];
      got = new Set();
      tries = 0;
      const progress = `<div class="t-progress">${steps.map((_, k) => `<i class="${k < i ? (steps[k].ok ? 'ok' : 'ko') : k === i ? 'on' : ''}"></i>`).join('')}</div>`;
      let main = '';
      if (test.show === 'staff') main = staffSVG(st.midis[0], undefined, { label: 'Note à jouer' });
      else if (test.show === 'chords') main = `<b>${esc(CHORD_NAMES[st.tok] || st.midis.map(nom).join(' + '))}</b><span>${st.midis.map(nom).join(' · ')}</span>`;
      else main = `<b>${st.midis.map(nom).join(' + ')}</b><span>${st.midis.length > 1 ? 'ensemble' : `côté ${zone(st.midis[0])}`}</span>`;
      prompt.innerHTML = `${progress}<div class="t-target ${test.show}">${main}</div>`;
      clearTimeout(timer);
      timer = setTimeout(() => fail(), 14000);
      listener?.expectChord(st.midis.length > 1 ? st.midis : null);
    };
    const advance = (good) => {
      steps[i].ok = good;
      if (good) ok++;
      i++;
      if (i >= steps.length) { over = true; clearTimeout(timer); prompt.querySelector('.t-target')?.classList.add('done'); setTimeout(() => done(ok / steps.length >= 0.8), 500); return; }
      setTimeout(show, 260);
    };
    const fail = () => { if (!over) advance(false); };
    show();
    return {
      input(midi, source) {
        if (over) return;
        const st = steps[i];
        const fromMic = source === 'mic';
        // Au micro, un accord se verifie en entier (voir chord) : une note seule ne compte ni pour ni contre
        if (fromMic && st.midis.length > 1) return;
        const hit = st.midis.find((t) => (fromMic ? sameNote(midi, t) : midi === t));
        if (hit != null) {
          got.add(hit);
          m.piano?.flash(midi, '#3dffa8');
          if (st.midis.every((t) => got.has(t))) {
            st.midis.forEach((t) => { if (discover(t)) learned.add(t); });
            advance(true);
          }
          return;
        }
        m.piano?.flash(midi, '#ff5470');
        tries++;
        if (tries >= 2) advance(false);
      },
      chord(midis) {
        if (over) return;
        const st = steps[i];
        if (st.midis.length < 2 || midis.join() !== st.midis.join()) return;
        st.midis.forEach((t) => { m.piano?.flash(t, '#3dffa8'); if (discover(t)) learned.add(t); });
        advance(true);
      },
      giveUp() { if (!over) { over = true; clearTimeout(timer); done(false); } },
      stop() { over = true; clearTimeout(timer); listener?.expectChord(null); },
    };
  }

  // Test de rythme : le metronome compte quatre temps, chaque note doit tomber dans sa fenetre
  function rhythmRunner(test, done) {
    const prompt = body.querySelector('#t-prompt');
    const tempo = 84;
    const beat = 60000 / tempo;
    const pattern = test.rythme;
    const total = pattern.reduce((a, b) => a + b, 0);
    let t = 0;
    const times = pattern.map((d) => { const at = t; t += d; return at; });
    const W = (x) => `${((x / total) * 100).toFixed(2)}%`;
    prompt.innerHTML = `<div class="rhythm">
        <div class="r-track">${times.map((at, k) => `<i class="r-note ${pattern[k] >= 2 ? 'long' : pattern[k] < 1 ? 'short' : ''}" style="left:${W(at)};width:${W(pattern[k])}"></i>`).join('')}<span class="r-head" id="r-head"></span></div>
        <div class="r-count" id="r-count"></div>
      </div>`;
    const head = prompt.querySelector('#r-head');
    const count = prompt.querySelector('#r-count');
    const marks = [...prompt.querySelectorAll('.r-note')];
    const hits = new Array(times.length).fill(false);
    let t0 = 0;
    let over = false;
    let raf = 0;
    const ticks = [];
    // Quatre temps pour se preparer, puis le motif
    const startAt = performance.now() + 500;
    t0 = startAt + 4 * beat;
    for (let b = 0; b < 4 + Math.ceil(total); b++) {
      ticks.push(setTimeout(() => { if (!over) { tick(b % 4 === 0); if (b < 4) count.textContent = String(4 - b); else count.textContent = ''; } }, startAt + b * beat - performance.now()));
    }
    const loop = () => {
      if (over) return;
      const pos = (performance.now() - t0) / beat;
      head.style.left = W(Math.max(0, Math.min(total, pos)));
      head.classList.toggle('wait', pos < 0);
      if (pos > total + 0.6) {
        over = true;
        const ok = hits.filter(Boolean).length;
        setTimeout(() => done(ok / hits.length >= 0.75), 400);
        return;
      }
      raf = requestAnimationFrame(loop);
    };
    raf = requestAnimationFrame(loop);
    return {
      input(midi, source) {
        if (over) return;
        // Le micro entend la note un peu apres le geste : on compense
        const at = (performance.now() - (source === 'mic' ? 120 : 0) - t0) / beat;
        let best = -1;
        let dist = 0.32;
        times.forEach((x, k) => { const dd = Math.abs(x - at); if (!hits[k] && dd < dist) { dist = dd; best = k; } });
        if (best >= 0) { hits[best] = true; marks[best].classList.add('ok'); m.piano?.flash(midi, '#3dffa8'); }
        else m.piano?.flash(midi, '#ff5470');
      },
      giveUp() { if (!over) { over = true; ticks.forEach(clearTimeout); cancelAnimationFrame(raf); done(false); } },
      stop() { over = true; ticks.forEach(clearTimeout); cancelAnimationFrame(raf); },
    };
  }

  // ---------- 5. Le resultat ----------
  function finish(palier) {
    runner?.stop();
    runner = null;
    listener?.stop();
    listener = null;
    keepAwake(false);
    m?.dispose();
    m = null;
    const p = Math.max(1, Math.min(8, palier));
    const pal = PALIERS[p - 1];
    setBilan({ niveau, materiel, reponses: answers, tests: results.map((r) => ({ id: r.test.id, ok: r.pass })), palier: p, date: new Date().toISOString().slice(0, 10) });
    if (p > 1) setPlacement(p);
    const instr = instrumentAt(p);
    const stage = STAGES[instr.stage === 'lumiere' ? 'lumiere' : instr.stage];
    const first = pal.lecons[0];
    // Place plus loin que la lecon demandee : on va directement au debut de son palier
    const target = next && p === 1 ? `#/${next}` : first ? `#/lecon/${first.id}` : '#/parcours';
    const goLabel = next && p === 1 ? 'Commencer la leçon' : `Commencer le palier ${p}`;
    step(3);
    swap(`
      <div class="bilan-result">
        <div class="eyebrow" style="justify-content:center">${niveau === 'debutant' ? 'C’est parti' : 'Ton niveau'}</div>
        <h2>${p === 1 ? fr('On commence au tout début') : fr(`Tu commences au palier ${p}`)}</h2>
        <p class="lead">${fr(p === 1 ? 'Premier palier : Découverte. Le prof te montre où sont les notes, puis tes premiers airs arrivent très vite.' : `Palier ${p} : ${pal.titre}. Les paliers d’avant restent ouverts si tu veux revoir quelque chose.`)}</p>
        ${results.length ? `<ul class="t-results">${results.map((r) => `<li class="${r.pass ? 'ok' : 'ko'}"><i></i>${esc(r.test.titre)}<span>${r.pass ? 'acquis' : 'on travaille ça'}</span></li>`).join('')}</ul>` : ''}
        ${learned.size ? `<p class="hint">${fr(`${learned.size} ${learned.size > 1 ? 'notes sont déjà allumées' : 'note est déjà allumée'} sur ton clavier.`)}</p>` : ''}
        <p class="hint">Ton instrument : <strong>${esc(stage.nom)}</strong></p>
        <div class="result-actions">
          <a class="btn" href="${target}">${goLabel}</a>
          ${p > 2 ? `<a class="btn ghost" href="#/piano?nouveau=${p}">Voir mon instrument</a>` : '<a class="btn ghost" href="#/parcours">Voir le parcours</a>'}
        </div>
      </div>`);
  }

  showNiveau();
  return () => {
    alive = false;
    runner?.stop();
    listener?.stop();
    keepAwake(false);
    m?.dispose();
  };
}

export function needsBilan(state = getState()) {
  return !state.bilan && !state.placement && !Object.keys(state.lessonsDone).length;
}
