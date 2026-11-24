// Page d'une lecon : le prof montre, puis l'eleve joue et le site ecoute.
import { mountPiano } from './main.js';
import { noteName } from './notes.js';
import { getState, unlockBadge, completeLesson } from './progress.js';
import { PALIERS, palierStatus } from './data/paliers.js';
import { sameNote } from './listen.js';
import { countUp } from './fx.js';

const DOIGTS = ['', 'pouce', 'index', 'majeur', 'annulaire', 'auriculaire'];

export function renderLesson(app, id) {
  const palier = PALIERS.find((p) => p.lecons.some((l) => l.id === id));
  const lecon = palier?.lecons.find((l) => l.id === id);
  if (!lecon) return null;
  const demo = lecon.demo || [];
  const all = PALIERS.flatMap((p) => p.lecons);
  const next = all[all.findIndex((l) => l.id === id) + 1];

  app.innerHTML = `
    <p class="hint" data-reveal><a href="#/parcours">Parcours</a> / Palier ${palier.id} - ${palier.titre}</p>
    <h1 data-split style="font-size:clamp(1.8rem,4.5vw,3.2rem)">${lecon.titre}</h1>
    <div class="stage" data-reveal>
      <div class="piano-wrap stage-3d" id="stage"></div>
      <div class="bubble" id="bubble">
        <span class="bubble-who">Le prof</span>
        <p id="bubble-text">${lecon.texte || 'Le prof prépare cette leçon. Elle arrive très vite.'}</p>
      </div>
      <div class="stage-loading" id="stage-loading"><span></span>Le prof s'installe au piano</div>
      <div class="result" id="result" hidden></div>
    </div>
    <div class="listen-bar" id="listen-bar" hidden>
      <span class="mic-dot"></span>
      <span class="meter"><span id="meter"></span></span>
      <span class="heard">J'entends : <strong id="heard">-</strong></span>
    </div>
    <div class="seq" id="seq">${demo.map(([m]) => `<span>${noteName(m)}</span>`).join('')}</div>
    <div class="piano-tools">
      ${demo.length ? `<button class="btn ghost" id="play" disabled>Regarder le prof</button>
      <button class="btn" id="go" disabled>À toi de jouer</button>` : ''}
      <label class="chip-toggle"><input type="checkbox" id="opt-hands"> Vue sur les mains</label>
      <label class="chip-toggle"><input type="checkbox" id="opt-labels" checked> Nom des notes</label>
    </div>
    <p class="hint">Pose ton téléphone ou ton ordi près du piano. Pas de micro ? Tu peux aussi jouer sur le piano 3D ou avec ton clavier d'ordinateur.</p>
  `;

  const bubbleText = document.getElementById('bubble-text');
  const bubble = document.getElementById('bubble');
  const say = (txt) => {
    bubbleText.textContent = txt;
    bubble.classList.remove('pop');
    void bubble.offsetWidth;
    bubble.classList.add('pop');
  };
  const chips = [...document.querySelectorAll('#seq span')];
  const playBtn = document.getElementById('play');
  const goBtn = document.getElementById('go');
  const result = document.getElementById('result');
  const heard = document.getElementById('heard');
  const meter = document.getElementById('meter');
  const listenBar = document.getElementById('listen-bar');

  let teacher = null;
  let alive = true;
  let listener = null;
  let mode = 'watch';
  let idx = 0;
  let errors = 0;
  let errorsHere = 0;

  const m = mountPiano(document.getElementById('stage'), {
    low: 36, high: 96, floorY: -31, view: 'teacher',
    onNoteOn: (midi, meta) => {
      if (meta?.teacher || mode !== 'play') return;
      listener?.mute(700); // le son du piano 3D ne doit pas etre compte une deuxieme fois par le micro
      handle(midi);
    },
  });
  if (!m.piano) return () => {};
  const piano = m.piano;
  const baseHighlights = () => (lecon.highlight || []).forEach((n) => piano.highlight(n, '#ff4fd8'));
  baseHighlights();
  document.getElementById('opt-labels').addEventListener('change', (e) => piano.setLabelsVisible(e.target.checked));
  const handsOpt = document.getElementById('opt-hands');
  handsOpt.addEventListener('change', (e) => piano.setView(e.target.checked ? 'hands' : 'teacher'));

  import('./teacher.js').then(({ Teacher }) => Teacher.load(piano)).then((t) => {
    if (!alive) { t.dispose(); return; }
    teacher = t;
    document.getElementById('stage-loading').classList.add('done');
    if (playBtn) playBtn.disabled = false;
    if (goBtn) goBtn.disabled = false;
  }).catch((e) => {
    console.error(e);
    document.getElementById('stage-loading').innerHTML = 'Le prof n\'a pas pu se charger. Vérifie ta connexion.';
  });

  const clearChips = () => chips.forEach((c) => c.classList.remove('on', 'past', 'ok', 'bad'));

  // ---------- Le prof montre ----------
  playBtn?.addEventListener('click', async () => {
    if (!teacher) return;
    if (playBtn.dataset.playing) { teacher.stop(); return; }
    stopPlay();
    clearChips();
    result.hidden = true;
    playBtn.dataset.playing = '1';
    playBtn.textContent = 'Arrêter';
    say(lecon.texte);
    const done = await teacher.playSequence(demo, {
      tempo: 96,
      onNote: (i) => chips.forEach((c, k) => { c.classList.toggle('on', k === i); c.classList.toggle('past', k < i); }),
    });
    clearChips();
    if (done) { teacher.nod(); say('À toi maintenant. Appuie sur « À toi de jouer » quand tu es prête.'); }
    delete playBtn.dataset.playing;
    playBtn.textContent = 'Revoir';
  });

  // ---------- A toi de jouer ----------
  const target = () => demo[idx]?.[0];

  function showTarget() {
    piano.clearHighlights();
    const t = target();
    clearChips();
    chips.forEach((c, k) => c.classList.toggle('ok', k < idx));
    chips[idx]?.classList.add('on');
    piano.highlight(t, '#3ef2ff');
    const hint = teacher?.fingerHint(t);
    const nom = noteName(t).toLowerCase();
    if (idx === 0) say(`À toi ! Commence par le ${nom}${hint ? `, avec le ${DOIGTS[hint.finger]} de la main ${hint.hand}` : ''}.`);
    else say(hint ? `Bien. Maintenant le ${nom}, avec le ${DOIGTS[hint.finger]}.` : `Bien. Maintenant le ${nom}.`);
  }

  // La touche reussie s'allume sur le piano 3D, sans rejouer le son
  function flash(midi) {
    const was = piano.sound;
    piano.sound = false;
    piano.press(midi, 0.8, { teacher: true });
    piano.sound = was;
    setTimeout(() => {
      piano.sound = false;
      piano.release(midi);
      piano.sound = was;
    }, 260);
  }

  function handle(midi) {
    const t = target();
    if (t == null || mode !== 'play') return;
    if (sameNote(midi, t)) {
      flash(t);
      idx++;
      errorsHere = 0;
      if (idx >= demo.length) finish();
      else showTarget();
      return;
    }
    errors++;
    errorsHere++;
    const chip = chips[idx];
    chip?.classList.remove('bad');
    void chip?.offsetWidth;
    chip?.classList.add('bad');
    const nom = noteName(t).toLowerCase();
    if (errorsHere >= 3 && teacher) {
      say(`Regarde bien, c'est ce ${nom}-là.`);
      listener?.mute(1400);
      teacher.playNote(t, 600);
      teacher.shake();
      errorsHere = 0;
    } else {
      say(`Ça, c'était un ${noteName(midi).toLowerCase()}. Cherche le ${nom}.`);
    }
  }

  goBtn?.addEventListener('click', async () => {
    if (mode === 'play') { stopPlay(); say('On reprend quand tu veux.'); return; }
    teacher?.stop();
    result.hidden = true;
    mode = 'play';
    idx = 0;
    errors = 0;
    errorsHere = 0;
    goBtn.textContent = 'Arrêter';
    if (!handsOpt.checked) { handsOpt.checked = true; piano.setView('hands'); }
    showTarget();
    const { Listener } = await import('./listen.js');
    if (mode !== 'play' || listener) return;
    const l = new Listener({
      onNote: (midi) => { heard.textContent = noteName(midi); handle(midi); },
      onLevel: (v) => { meter.style.width = `${Math.round(v * 100)}%`; },
      onPitch: (midi) => { if (midi == null) heard.textContent = '-'; },
    });
    try {
      await l.start();
      if (mode !== 'play') { l.stop(); return; }
      listener = l;
      listenBar.hidden = false;
    } catch (e) {
      say('Je n\'ai pas accès au micro. Autorise-le dans ton navigateur, ou joue sur le piano 3D en attendant.');
    }
  });

  function stopPlay() {
    mode = 'watch';
    piano.clearHighlights();
    baseHighlights();
    if (goBtn) goBtn.textContent = 'À toi de jouer';
    listener?.stop();
    listener = null;
    listenBar.hidden = true;
  }

  function finish() {
    const total = demo.length;
    const acc = Math.round((100 * total) / (total + errors));
    stopPlay();
    clearChips();
    chips.forEach((c) => c.classList.add('ok'));
    const { stars, gained } = completeLesson(id, acc);
    const fresh = [];
    if (unlockBadge('premiere-lecon')) fresh.push('C\'est parti');
    if (stars === 3 && unlockBadge('trois-etoiles')) fresh.push('Sans faute');
    if (palier.id === 1 && palierStatus(palier, getState().lessonsDone).complete && unlockBadge('palier-1')) fresh.push('Les bases');
    if (getState().streak >= 7 && unlockBadge('serie-7')) fresh.push('Une semaine');

    say(acc >= 95 ? 'Parfait, rien à redire !' : acc >= 80 ? 'Très bien joué. Encore un essai pour les trois étoiles ?' : 'C\'est validé. Rejoue-la quand tu veux pour faire mieux.');
    if (teacher) {
      teacher.nod();
      // Petit arpege de victoire
      teacher.playSequence([[60, 0.5], [64, 0.5], [67, 0.5], [72, 1.5]], { tempo: 150 });
    }

    result.innerHTML = `
      <div class="result-card">
        <div class="eyebrow" style="justify-content:center">Leçon terminée</div>
        <div class="stars">${[1, 2, 3].map((n) => `<i class="${n <= stars ? 'got' : ''}" style="--n:${n}"></i>`).join('')}</div>
        <div class="result-xp">+<span data-count="${gained}">0</span> XP</div>
        <p class="hint" style="margin:.2rem 0 0">Précision : ${acc} %</p>
        ${fresh.length ? `<p class="new-badge">Nouveau badge : ${fresh.join(', ')}</p>` : ''}
        <div class="hero-actions" style="justify-content:center;margin-top:1.4rem">
          <button class="btn ghost" id="again">Recommencer</button>
          ${next ? `<a class="btn" href="#/lecon/${next.id}">Leçon suivante</a>` : '<a class="btn" href="#/parcours">Retour au parcours</a>'}
        </div>
      </div>`;
    result.hidden = false;
    countUp(result);
    document.getElementById('again').addEventListener('click', () => goBtn.click());
  }

  return () => {
    alive = false;
    stopPlay();
    teacher?.stop();
    teacher?.dispose();
    m.dispose();
  };
}
