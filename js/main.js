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
import { Recorder, listTakes, saveTake, deleteTake, replay, midiFile, recordVideo, videoSupported } from './recorder.js';
import { deliverFile, canShareFiles } from './share.js';
import { hasKeyboard as keyboardPresent } from './kbd-ui.js';
import { renderEarList, renderEarGame } from './ear.js';
import { renderTheoryList, renderTheoryCard } from './theory.js';
import { sessionSummary, reminderICS, reminderGoogle } from './session.js';
import { exportData, importData, validData } from './progress.js';
import { t, lang, setLang, locale } from './i18n.js';

const app = document.getElementById('app');
let cleanup = null;

// Pluriel selon la langue : le francais garde le singulier pour 0 et 1, l'anglais seulement pour 1
const many = (n) => (lang() === 'en' ? n !== 1 : n > 1);

// ---------- La page autour des pages ----------
// index.html reste en francais (la langue par defaut) : le reste de la coquille se traduit ici, au demarrage.
// L'entree (la touche do) se traduit dans fx.js, au moment ou elle s'affiche.
function translateShell() {
  document.documentElement.lang = lang();
  document.title = t('Piano Learn · Apprendre le piano pas à pas');
  document.querySelector('.brand')?.setAttribute('aria-label', t('Piano Learn, accueil'));
  const nav = document.getElementById('nav');
  nav?.setAttribute('aria-label', t('Navigation principale'));
  const NAV = { parcours: t('Parcours'), piano: t('Mon piano'), morceaux: t('Morceaux'), profil: t('Profil') };
  nav?.querySelectorAll('a[data-route]').forEach((a) => { if (NAV[a.dataset.route]) a.textContent = NAV[a.dataset.route]; });
}
translateShell();

// ---------- Barre d'XP et son de l'instrument ----------
function refreshXp() {
  const info = levelInfo();
  document.getElementById('xp-level').textContent = t('NIV {n}', { n: info.level });
  document.getElementById('xp-fill').style.width = `${Math.round(info.ratio * 100)}%`;
  document.getElementById('xp-chip').title = t('{current} / {need} XP avant le niveau {next}', { current: info.current, need: info.need, next: info.level + 1 });
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

const stars = (n) => `<span class="mini-stars" aria-label="${many(n) ? t('{n} étoiles sur 3', { n }) : t('{n} étoile sur 3', { n })}">${[1, 2, 3].map((i) => `<i class="${i <= n ? 'on' : ''}"></i>`).join('')}</span>`;
const lock = '<svg class="lock" viewBox="0 0 16 16" aria-hidden="true"><path d="M4.5 7V5.2a3.5 3.5 0 0 1 7 0V7" fill="none" stroke="currentColor" stroke-width="1.5"/><rect x="3" y="7" width="10" height="7.5" rx="2" fill="currentColor"/></svg>';

// Petites illustrations des trois corps de l'instrument
const STAGE_ART = {
  lumiere: `<svg viewBox="0 0 120 60" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="1.4">${[0, 1, 2, 3, 4, 5, 6].map((i) => `<rect x="${12 + i * 14}" y="14" width="12" height="34" rx="2" opacity="${[1, 1, 1, 0.9, 0.35, 0.25, 0.2][i]}"/>`).join('')}</g><g fill="currentColor">${[0, 1, 3, 4, 5].map((i) => `<rect x="${21 + i * 14}" y="14" width="7" height="20" rx="1.5" opacity="${i < 2 ? 0.9 : 0.25}"/>`).join('')}</g></svg>`,
  clavier: `<svg viewBox="0 0 120 60" aria-hidden="true"><rect x="6" y="18" width="108" height="28" rx="4" fill="none" stroke="currentColor" stroke-width="1.4"/><g fill="currentColor" opacity=".9">${Array.from({ length: 13 }, (_, i) => `<rect x="${10 + i * 8}" y="22" width="6.6" height="20" rx="1" opacity=".55"/>`).join('')}</g><g fill="currentColor">${[0, 1, 3, 4, 5, 7, 8, 10, 11].map((i) => `<rect x="${15 + i * 8}" y="22" width="4" height="12" rx=".8"/>`).join('')}</g><rect x="6" y="46" width="108" height="3" fill="#6d0f1c"/></svg>`,
  queue: `<svg viewBox="0 0 120 60" aria-hidden="true"><path d="M14 8 H92 V14 C92 26 62 28 58 44 C55 54 46 56 36 56 H22 C17 56 14 53 14 48 Z" fill="none" stroke="currentColor" stroke-width="1.4"/><path d="M14 8 L104 2" stroke="currentColor" stroke-width="1.2" opacity=".6"/><path d="M92 14 L104 2" stroke="currentColor" stroke-width="1" opacity=".5"/><g stroke="currentColor" stroke-width=".6" opacity=".55">${Array.from({ length: 9 }, (_, i) => `<line x1="${20 + i * 7}" y1="12" x2="${20 + i * 5}" y2="${50 - i * 3}"/>`).join('')}</g><rect x="14" y="4" width="78" height="4" rx="1" fill="currentColor" opacity=".8"/></svg>`,
};

// Lecons, oreille, theorie : les trois facons d'apprendre, sous le meme onglet
const learnNav = (active) => `<nav class="subnav" aria-label="${t('Apprendre')}" data-reveal>${[['parcours', t('Leçons')], ['oreille', t('Oreille')], ['theorie', t('Théorie')]]
  .map(([r, l]) => `<a href="#/${r}" class="${r === active ? 'on' : ''}" ${r === active ? 'aria-current="page"' : ''}>${l}</a>`).join('')}</nav>`;

const CHECK = '<svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8.5l3 3 6-7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>';
const FLAME = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2.5c.6 3.2 3.6 4.9 4.9 8 1.7 4-1 9-4.9 9s-6.7-3.3-5.6-7.1c.5-1.8 1.7-2.8 2.4-4.2.4 1.5.5 2.5 1.6 3.3.3-3.3.6-6.4 1.6-9z" fill="currentColor"/></svg>';

// La seance du jour : quatre gestes, une dizaine de minutes, la serie et son joker
function todayCard() {
  const s = sessionSummary();
  if (!s.plan.length) return '';
  const next = s.plan.find((x) => !x.done);
  const st = s.streak;
  const note = st.savedBy ? t('Tu avais manqué un jour : ton joker de la semaine a gardé ta série.')
    : st.jokerFree ? t('Un joker par semaine : si tu manques un jour, ta série tient quand même.')
    : t('Ton joker de la semaine est déjà pris : reviens demain pour garder ta série.');
  return `
    <section class="section today" id="today">
      <div class="card today-card" data-reveal>
        <div class="today-head">
          <div>
            <div class="eyebrow">${t('Ta séance du jour')}</div>
            <h2>${s.complete ? fr(t('Séance faite. À demain !')) : t('{min} minutes, {n} gestes', { min: s.minutes, n: s.total })}</h2>
          </div>
          <div class="streak ${st.days ? 'on' : ''} ${st.playedToday ? 'today-ok' : ''}" aria-label="${many(st.days) ? t('{n} jours d’affilée', { n: st.days }) : t('{n} jour d’affilée', { n: st.days })}">
            ${FLAME}<strong data-count="${st.days}">0</strong><span>${many(st.days) ? t('jours') : t('jour')}</span>
          </div>
        </div>
        <ol class="today-steps">
          ${s.plan.map((x, i) => `<li class="${x.done ? 'done' : x === next ? 'next' : ''}"><a href="${x.href}">
            <span class="ts-check">${x.done ? CHECK : i + 1}</span>
            <span class="ts-text"><span class="ts-step">${x.step}</span><span class="ts-label">${esc(x.label)}</span></span>
            <span class="ts-min">${x.min} min</span></a></li>`).join('')}
        </ol>
        <div class="today-actions">
          ${next ? `<a class="btn" href="${next.href}">${s.done ? t('Continuer') : t('Commencer')} · ${esc(next.step.toLowerCase())}</a>` : `<a class="btn ghost" href="#/piano">${t('Jouer librement')}</a>`}
          <button class="btn ghost" id="remind" aria-expanded="false">${t('Me le rappeler chaque jour')}</button>
        </div>
        <p class="hint streak-note">${fr(note)}</p>
        <div class="remind-box" id="remind-box" hidden>
          <label class="field"><span>${fr(t('À quelle heure ?'))}</span><input type="time" id="remind-time" value="${esc(getSettings().rappel || '18:30')}"></label>
          <div class="result-actions">
            <button class="btn small" id="remind-ics">${t('Ajouter à mon agenda')}</button>
            <a class="btn ghost small" id="remind-google" target="_blank" rel="noopener">${t('Google Agenda')}</a>
          </div>
          <p class="hint">${fr(t('Un rendez-vous de dix minutes, chaque jour, dans ton agenda (téléphone, ordinateur). Rien n’est envoyé à personne : c’est ton agenda qui te le rappelle.'))}</p>
        </div>
      </div>
    </section>`;
}

function bindToday() {
  const btn = document.getElementById('remind');
  if (!btn) return;
  const box = document.getElementById('remind-box');
  const time = document.getElementById('remind-time');
  const google = document.getElementById('remind-google');
  const url = `${location.origin}${location.pathname}#/`;
  const opts = () => ({ time: time.value || '18:30', title: t('Piano : ta séance du jour'), body: t('Dix minutes au piano : l’oreille, une leçon, une révision, un morceau.'), url });
  const refresh = () => { google.href = reminderGoogle(opts()); };
  btn.addEventListener('click', () => {
    box.hidden = !box.hidden;
    btn.setAttribute('aria-expanded', String(!box.hidden));
    refresh();
  });
  time.addEventListener('change', () => { setSetting('rappel', time.value); refresh(); });
  document.getElementById('remind-ics').addEventListener('click', () => {
    setSetting('rappel', time.value);
    deliverFile(reminderICS(opts()), t('seance-piano.ics'));
  });
}

// ---------- Accueil ----------
function pageAccueil(_, { entered }) {
  app.classList.add('full');
  const state = getState();
  const nxt = nextLesson(state);
  const started = Object.keys(state.lessonsDone).length > 0;
  const cur = currentPalier(state);
  const instr = instrumentAt(cur);
  // Les notes dans la langue de l'eleve (Do Re Mi... ou C D E...), et les titres tels que la bibliotheque les affiche
  const words = [...[60, 62, 64, 65, 67, 69, 71].map((n) => noteName(n)), t('Ode à la joie'), t('Lettre à Élise'), 'Gymnopédie', 'Clair de lune', 'Frère Jacques'];
  const marquee = [...words, ...words].map((w) => `<span>${esc(w)}</span>`).join('');
  const teaser = SONGS.slice(0, 1).concat(SONGS.filter((s) => s.palier > 1).sort((a, b) => a.palier - b.palier).filter((_, i) => i % 3 === 0)).slice(0, 4);
  app.innerHTML = `
    <section class="hero">
      <div class="hero-canvas" id="hero-canvas"></div>
      <div class="hero-content">
        <div class="eyebrow" data-reveal>${t('Ton prof de piano, en 3D')}</div>
        <h1 data-split>${t('Apprends le piano, <span class="grad-text">une touche</span> après l’autre')}</h1>
        <p class="lead" data-reveal style="--d:220ms">${fr(t('Le prof te montre sur son piano, tu rejoues sur le tien. Le site t’écoute, te dit si c’est juste, et ton instrument grandit avec toi.'))}</p>
        <div class="hero-actions" data-reveal style="--d:320ms">
          ${started && nxt ? `<a href="#/lecon/${nxt.lecon.id}" class="btn">${t('Reprendre : {titre}', { titre: esc(nxt.lecon.titre) })}</a>` : `<a href="${needsBilan() ? '#/bilan' : '#/lecon/1-1'}" class="btn">${t('Commencer')}</a>`}
          <a href="#/piano" class="btn ghost">${started ? t('Mon piano') : t('Essayer le piano')}</a>
        </div>
      </div>
      <div class="hero-hint">${t('PASSE SUR LES TOUCHES')}</div>
    </section>

    ${started ? todayCard() : ''}
    <div class="marquee" aria-hidden="true"><div class="marquee-track">${marquee}</div></div>

    <section class="section">
      <div class="eyebrow" data-reveal>${t('Comment ça marche')}</div>
      <h2 data-split>${t('Trois temps, à chaque leçon')}</h2>
      <div class="grid steps">
        ${[
          [t('Le prof montre'), t('Il joue l’exercice lentement sur son piano. Tu vois ses doigts, les touches s’allument.')],
          [t('Tu joues chez toi'), t('Sur ton vrai piano : pose le téléphone sur le pupitre, le site t’écoute au micro. Ou joue à l’écran.')],
          [t('Le site attend'), t('Il attend la bonne note, sans chrono. Il t’aide si tu hésites. Chaque leçon réussie rapporte de l’XP.')],
        ].map(([title, d], i) => `
          <div class="card" data-reveal style="--d:${i * 90}ms">
            <span class="num">0${i + 1}</span>
            <div class="keys-deco">${[0, 1, 2, 3, 4].map((k) => `<i style="--k:${k + i * 2}"></i>`).join('')}</div>
            <h3>${title}</h3><p class="hint" style="margin:0">${fr(d)}</p>
          </div>`).join('')}
      </div>
    </section>

    <section class="section grows">
      <div class="eyebrow" data-reveal>${t('Ton instrument')}</div>
      <h2 data-split>${t('Il grandit <span class="grad-text">avec toi</span>')}</h2>
      <p class="lead" data-reveal>${fr(t('Personne ne commence devant un piano de concert. Tu commences sur un clavier de lumière ; chaque note apprise s’allume pour de bon. Puis la lumière prend corps, et le piano à queue t’attend.'))}</p>
      <div class="stages">
        ${Object.values(STAGES).map((s, i) => {
          const open = cur >= s.palier;
          return `<div class="card stage-card ${open ? 'open' : ''} ${instr.stage === s.id ? 'current' : ''}" data-reveal style="--d:${i * 110}ms">
            <div class="stage-art">${STAGE_ART[s.id]}</div>
            <span class="tag ${open ? '' : 'grey'}">${instr.stage === s.id ? t('Ton instrument') : open ? t('Débloqué') : t('Palier {n}', { n: s.palier })}</span>
            <h3>${esc(s.nom)}</h3>
            <p class="hint">${fr(s.desc)}</p>
            ${open ? '' : `<a class="link" href="#/piano?apercu=${s.palier}">${t('Aperçu')}</a>`}
          </div>`;
        }).join('<div class="stage-arrow" aria-hidden="true"></div>')}
      </div>
    </section>

    <section class="section">
      <div class="eyebrow" data-reveal>${t('Les morceaux')}</div>
      <h2 data-split>${t('De vrais airs, très vite')}</h2>
      <div class="grid songs-teaser">
        ${teaser.map((s, i) => songCard(s, i, cur)).join('')}
      </div>
      <p data-reveal style="margin-top:1.6rem"><a class="btn ghost" href="#/morceaux">${t('Toute la bibliothèque')} · ${plural(SONGS.length, t('morceau'), t('morceaux'))}</a></p>
    </section>
    ${footer()}
  `;
  const hero = createHeroScene(document.getElementById('hero-canvas'), { unfold: entered });
  bindToday();
  countUp(app);
  return () => { hero.dispose(); app.classList.remove('full'); };
}

function footer() {
  return `<footer class="foot">
    <p>${fr(t('Rien ne quitte ton appareil : l’écoute au micro et ta progression restent dans ton navigateur.'))}</p>
    <p class="credits">${fr(t('Sons de piano : Salamander Grand Piano, Alexander Holm (CC-BY 3.0). Prof 3D : modèle X Bot de Mixamo.'))}</p>
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
      const inner = `<span class="dot ${done ? 'done' : ''} ${l.boss ? 'boss' : ''}"></span><span class="lt">${esc(l.titre)}</span>${done ? stars(done.stars) : isNext ? `<span class="tag">${t('À faire')}</span>` : can ? '' : lock}`;
      return `<li class="${isNext ? 'next' : ''}">${can ? `<a href="#/lecon/${l.id}">${inner}</a>` : `<span class="l">${inner}</span>`}</li>`;
    }).join('');
    return `
      <div class="palier ${cls}" data-reveal>
        <div class="palier-num">${p.id}</div>
        <div class="card">
          <div class="palier-head">
            <h3>${esc(p.titre)}</h3>
            <span class="tag ${open ? (st.complete ? 'gold' : '') : 'grey'}">${p.bientot ? t('Bientôt') : open ? (st.complete ? t('Terminé') : `${st.done} / ${st.total}`) : t('Bloqué')}</span>
          </div>
          <p class="hint">${fr(esc(p.resume))}</p>
          ${open && !p.bientot ? `<div class="progress-line"><span style="width:${(st.done / Math.max(1, st.total)) * 100}%"></span></div><ul class="lessons">${lessons}</ul>` : ''}
          ${bossSong ? `<p class="hint boss-line">${t('Morceau de fin : <strong>{titre}</strong>', { titre: esc(bossSong.titre) })}</p>` : ''}
          ${gifts.length ? `<div class="gifts">${gifts.map((g) => `<span class="gift ${g.type}">${esc(g.nom)}</span>`).join('')}</div>` : ''}
          ${!open && gifts.some((g) => g.type === 'stage') ? `<a class="link" href="#/piano?apercu=${p.id}">${t('Voir l’aperçu')}</a>` : ''}
        </div>
      </div>`;
  }).join('');

  const niveau = { debutant: t('Ton niveau : je débute'), intermediaire: t('Ton niveau : je joue un peu'), expert: t('Ton niveau : je joue bien') };
  const bilanDate = state.bilan ? new Date(state.bilan.date).toLocaleDateString(locale(), { day: 'numeric', month: 'long' }) : '';
  app.innerHTML = `
    ${learnNav('parcours')}
    <div class="eyebrow" data-reveal>${t('8 paliers')}</div>
    <h1 data-split>${t('Ton <span class="grad-text">parcours</span>')}</h1>
    <p class="lead" data-reveal style="--d:200ms">${fr(t('Du tout premier do jusqu’aux vrais morceaux. Chaque palier se termine par un morceau, et chaque palier fait grandir ton instrument.'))}</p>
    <div class="placement card" data-reveal style="--d:260ms">
      <div>
        <strong>${state.bilan ? fr(niveau[state.bilan.niveau] || t('Ton niveau : fait')) : t('Tu sais déjà jouer ?')}</strong>
        <p class="hint">${fr(state.bilan ? t('Bilan du {date} : départ au palier {n}. Tu peux le refaire quand tu veux.', { date: bilanDate, n: state.bilan.palier }) : t('Deux minutes de questions et de petits tests joués, et le prof te place au bon palier.'))}</p>
      </div>
      <a class="btn ghost small" href="#/bilan">${state.bilan ? t('Refaire le bilan') : t('Faire le bilan')}</a>
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
  const hasKeyboard = keyboardPresent();
  let layout = getLayout();
  let letters = hasKeyboard && settings.lettres !== false;
  if (apercu) setInstrument(instr.son);

  app.innerHTML = `
    <div class="piano-head">
      <div>
        <div class="eyebrow" data-reveal>${apercu ? t('Aperçu · palier {n}', { n: apercu }) : t('Mon piano')}</div>
        <h1 data-split>${esc(STAGES[look(instr)].nom)}</h1>
      </div>
      <span class="now-playing grad-text" id="now" aria-live="off"></span>
    </div>
    ${apercu ? `<div class="preview-banner" data-reveal><span>${fr(t('Voici ton instrument tel qu’il sera au palier {n}. Ta progression ne change pas.', { n: apercu }))}</span><a class="btn ghost small" href="#/piano">${t('Revenir à mon piano')}</a></div>` : ''}
    <div class="stage piano-stage" data-reveal style="--d:100ms">
      <div class="piano-wrap" id="piano"></div>
      <div class="ceremony" id="ceremony" hidden></div>
    </div>
    <div class="minimap" id="minimap" data-reveal style="--d:160ms" role="slider" tabindex="0" aria-label="${t('Partie du clavier affichée')}" aria-valuemin="21" aria-valuemax="108">
      ${miniKeys(known)}
      <span class="mm-window" id="mm-window"></span>
    </div>
    <div class="studio" id="studio" data-reveal style="--d:190ms">
      <button class="rec-btn" id="rec" aria-pressed="false"><i class="rec-dot" aria-hidden="true"></i><span id="rec-label">${t('Enregistrer')}</span><time id="rec-time" hidden>0:00</time></button>
      <p class="hint studio-hint" id="studio-hint">${fr(t('Appuie, joue ce que tu veux, puis réécoute-toi. Tes prises restent sur cet appareil.'))}</p>
      <ol class="takes" id="takes" aria-label="${t('Mes prises')}"></ol>
    </div>
    <div class="piano-tools">
      <div class="seg" id="views" role="group" aria-label="${t('Vue')}">
        <button data-v="front" class="on">${t('Face')}</button><button data-v="top">${t('Dessus')}</button>${look(instr) === 'queue' ? `<button data-v="grand">${t('Piano entier')}</button>` : ''}
      </div>
      <button class="chip" id="zoom" aria-pressed="false">${t('Tout le clavier')}</button>
      ${instr.features.has('cacher-noms') ? `<label class="chip-toggle"><input type="checkbox" id="opt-labels" ${settings.noms ? 'checked' : ''}> ${t('Nom des notes')}</label>` : ''}
      ${hasKeyboard ? `<label class="chip-toggle"><input type="checkbox" id="opt-letters" ${letters ? 'checked' : ''}> ${t('Lettres du clavier')}</label>` : ''}
      ${instr.features.has('pedale') ? `<button class="chip pedal" id="pedal">${t('Pédale')}</button>` : ''}
    </div>
    ${hasKeyboard ? `<div class="layout-pick" id="layout-pick" role="radiogroup" aria-label="${t('Disposition de ton clavier d’ordinateur')}">
      <span class="hint">${t('Ton clavier')}</span>
      <div class="seg">${Object.entries(LAYOUTS).map(([id, l]) => `<button type="button" data-layout="${id}" role="radio">${l.nom}</button>`).join('')}</div>
    </div>` : ''}
    <p class="hint keys-hint" id="kbd-hint"></p>
    <div class="sounds" data-reveal>
      ${Object.entries(INSTRUMENTS).map(([id, ins]) => {
        const open = instr.sons.includes(id);
        const at = [1, 2, 3, 4, 5, 6, 7, 8].find((p) => instrumentAt(p).sons.includes(id));
        return `<button class="sound ${open ? '' : 'locked'} ${id === soundNow ? 'on' : ''}" data-son="${id}" ${open ? '' : 'disabled'}>
          <strong>${esc(ins.nom)}</strong><span>${open ? fr(esc(ins.desc)) : `${lock} ${t('Palier {n}', { n: at })}`}</span></button>`;
      }).join('')}
    </div>
    <div class="stages compact">
      ${Object.values(STAGES).filter((s) => s.id !== 'lumiere').map((s) => `<a class="card stage-card ${level >= s.palier ? 'open' : ''} ${look(instr) === s.id ? 'current' : ''}" href="#/piano${s.palier <= cur ? '' : `?apercu=${s.palier}`}">
          <div class="stage-art">${STAGE_ART[s.id]}</div>
          <span class="tag ${cur >= s.palier ? '' : 'grey'}">${look(instr) === s.id ? t('Ton instrument') : cur >= s.palier ? t('Débloqué') : t('Palier {n} · aperçu', { n: s.palier })}</span>
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

  const rec = new Recorder();
  const m = mountPiano(document.getElementById('piano'), {
    low: 21, high: 108, stage: look(from), known, view: 'front',
    labels: instr.features.has('cacher-noms') ? settings.noms : true,
    pedal: () => instr.features.has('pedale'),
    onShift: (s) => { shift = s; center = 64 + s; whole = false; placeWindow(); applyLetters(); },
    onPedal: (on) => rec.pedal(on),
    onNoteOff: (midi, meta) => { if (meta?.source !== 'replay') rec.off(midi); },
    onNoteOn: (midi, meta, velocity) => {
      if (meta?.source !== 'replay') rec.on(midi, velocity);
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
    minimap.setAttribute('aria-valuetext', t('Autour du {note}', { note: noteName(Math.round(center), true) }));
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
    const learnt = known ? ` <strong>${fr(many(known.size) ? t('{n} notes apprises sur 88.', { n: known.size }) : t('{n} note apprise sur 88.', { n: known.size }))}</strong>` : '';
    hintEl.innerHTML = hasKeyboard
      ? `${kb(['KeyA', 'KeyS', 'KeyD', 'KeyF', 'KeyG', 'KeyH', 'KeyJ', 'KeyK'])} ${fr(t('jouent do ré mi fa sol la si do,'))} ${kb(['KeyW', 'KeyE', 'KeyT', 'KeyY', 'KeyU'])} ${fr(t('les touches noires. Les flèches ← → changent d’octave.'))}${learnt}`
      : `${fr(t('Touche les notes du bout du doigt ; glisse sur la bande pour parcourir tout le clavier.'))}${learnt}`;
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
    const set = (on) => { setSustain(on); piano.grand?.setPedal(on); pedal.classList.toggle('on', on); rec.pedal(on); };
    pedal.addEventListener('pointerdown', (e) => { e.preventDefault(); pedal.setPointerCapture(e.pointerId); set(true); });
    pedal.addEventListener('pointerup', () => set(false));
    pedal.addEventListener('pointercancel', () => set(false));
  }


  // ---------- Studio : enregistrer, reecouter, garder ----------
  const recBtn = document.getElementById('rec');
  const recLabel = document.getElementById('rec-label');
  const recTime = document.getElementById('rec-time');
  const takesEl = document.getElementById('takes');
  const studioHint = document.getElementById('studio-hint');
  const stageEl = app.querySelector('.piano-stage');
  const HINT = studioHint.textContent;
  const PLAY = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M8 5.5v13l10.5-6.5z" fill="currentColor"/></svg>';
  const STOP = '<svg viewBox="0 0 24 24" aria-hidden="true"><rect x="7" y="7" width="10" height="10" rx="2" fill="currentColor"/></svg>';
  const dateFmt = new Intl.DateTimeFormat(locale(), { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });
  const mmss = (ms) => { const sec = Math.round(ms / 1000); return `${Math.floor(sec / 60)}:${String(sec % 60).padStart(2, '0')}`; };
  const soundOf = () => { const st = getSettings(); return st.son && instr.sons.includes(st.son) ? st.son : instr.son; };
  let recTimer = null;
  let player = null;
  let filming = false;
  let msgTimer = null;

  function say(text) {
    clearTimeout(msgTimer);
    studioHint.textContent = fr(text);
    studioHint.hidden = false;
    msgTimer = setTimeout(() => { studioHint.textContent = HINT; studioHint.hidden = listTakes().length > 0; }, 5000);
  }

  function renderTakes() {
    const list = listTakes();
    studioHint.hidden = list.length > 0 && studioHint.textContent === HINT;
    takesEl.innerHTML = list.map((tk, i) => `
      <li class="take" data-id="${tk.id}">
        <button class="take-play" data-act="play" aria-label="${t('Réécouter la prise {n}', { n: list.length - i })}">${PLAY}</button>
        <div class="take-meta"><strong>${t('Prise {n}', { n: list.length - i })}</strong><span>${dateFmt.format(tk.at)} · ${mmss(tk.dur)} · ${plural(tk.notes.length, t('note'), t('notes'))}</span></div>
        <div class="take-actions">
          <button class="chip small" data-act="midi" title="${fr(t('Fichier MIDI : il s’ouvre dans n’importe quel logiciel de musique'))}">MIDI</button>
          ${videoSupported() ? `<button class="chip small" data-act="video" title="${fr(t('Une vidéo du piano qui rejoue ta prise, avec le son'))}">${t('Vidéo')}</button>` : ''}
          <button class="icon-btn" data-act="del" aria-label="${t('Supprimer la prise {n}', { n: list.length - i })}">×</button>
        </div>
        <i class="take-progress" aria-hidden="true"></i>
      </li>`).join('');
  }

  function startRec() {
    stopPlayer();
    rec.start();
    recBtn.classList.add('on');
    recBtn.setAttribute('aria-pressed', 'true');
    recLabel.textContent = t('Arrêter');
    recTime.hidden = false;
    recTime.textContent = '0:00';
    stageEl.classList.add('recording');
    studioHint.hidden = true;
    recTimer = setInterval(() => { recTime.textContent = mmss(rec.elapsed()); }, 250);
  }

  function stopRec() {
    clearInterval(recTimer);
    const take = rec.stop({ son: soundOf(), stage: look(instr) });
    recBtn.classList.remove('on');
    recBtn.setAttribute('aria-pressed', 'false');
    recLabel.textContent = t('Enregistrer');
    recTime.hidden = true;
    stageEl.classList.remove('recording');
    if (!take) { renderTakes(); say(t('Rien d’enregistré : joue au moins une note.')); return; }
    if (!saveTake(take)) say(t('Plus de place sur cet appareil pour garder cette prise.'));
    renderTakes();
    takesEl.firstElementChild?.classList.add('fresh');
  }
  rec.onLimit = () => stopRec();
  recBtn.addEventListener('click', () => (rec.active ? stopRec() : startRec()));

  function stopPlayer() {
    if (!player) return;
    const p = player;
    player = null;
    p.handle.stop();
    endPlay(p);
  }
  function endPlay(p) {
    p.li?.classList.remove('playing');
    const btn = p.li?.querySelector('[data-act="play"]');
    if (btn) btn.innerHTML = PLAY;
    const bar = p.li?.querySelector('.take-progress');
    if (bar) bar.style.transform = '';
    if (p.before) setInstrument(p.before);
  }
  function play(take, li) {
    stopPlayer();
    if (rec.active) stopRec();
    // La prise se rejoue avec le son qu'elle avait
    const now = soundOf();
    const before = take.son && take.son !== now && instr.sons.includes(take.son) ? now : null;
    if (before) setInstrument(take.son);
    li.classList.add('playing');
    li.querySelector('[data-act="play"]').innerHTML = STOP;
    const bar = li.querySelector('.take-progress');
    const p = { id: take.id, li, before };
    p.handle = replay(piano, take, {
      onTime: (f) => { bar.style.transform = `scaleX(${f})`; },
      onEnd: () => { if (player === p) { player = null; endPlay(p); } },
    });
    player = p;
  }

  async function film(take, li, btn) {
    // Deuxieme geste : la video est prete, on la donne (le partage a besoin d'un geste frais)
    if (btn.classList.contains('ready') && btn.blob) {
      await deliverFile(btn.blob, btn.filename, { share: canShareFiles(btn.blob.type), title: t('Ma prise au piano') });
      return;
    }
    if (filming) return;
    filming = true;
    stopPlayer();
    if (rec.active) stopRec();
    const before = soundOf();
    if (take.son && take.son !== before && instr.sons.includes(take.son)) setInstrument(take.son);
    li.classList.add('playing', 'filming');
    stageEl.classList.add('filming');
    const bar = li.querySelector('.take-progress');
    btn.textContent = t('Vidéo · {p} %', { p: 0 });
    try {
      const { blob, ext } = await recordVideo(piano, take, {
        onTime: (f) => { bar.style.transform = `scaleX(${f})`; btn.textContent = t('Vidéo · {p} %', { p: Math.round(f * 100) }); },
      });
      const n = li.querySelector('.take-meta strong')?.textContent.replace(/\D/g, '') || '1';
      btn.blob = blob;
      btn.filename = `${t('prise-{n}', { n })}.${ext}`;
      btn.classList.add('ready');
      btn.textContent = canShareFiles(blob.type) ? t('Partager la vidéo') : t('Télécharger la vidéo');
    } catch (e) {
      console.error(e);
      btn.textContent = t('Vidéo');
      say(t('La vidéo n’a pas pu être créée sur ce navigateur. Le fichier MIDI, lui, marche partout.'));
    }
    setInstrument(before);
    filming = false;
    li.classList.remove('playing', 'filming');
    stageEl.classList.remove('filming');
    bar.style.transform = '';
  }

  takesEl.addEventListener('click', (e) => {
    const btn = e.target.closest('button[data-act]');
    if (!btn) return;
    const li = btn.closest('.take');
    const take = listTakes().find((tk) => tk.id === li.dataset.id);
    if (!take) return;
    const act = btn.dataset.act;
    if (act === 'play') {
      if (player?.id === take.id) stopPlayer();
      else if (!filming) play(take, li);
    } else if (act === 'midi') {
      const n = li.querySelector('.take-meta strong')?.textContent.replace(/\D/g, '') || '1';
      deliverFile(midiFile(take, { name: t('Prise {n}', { n }) }), `${t('prise-{n}', { n })}.mid`);
    } else if (act === 'video') {
      film(take, li, btn);
    } else if (act === 'del') {
      // Deux gestes pour effacer : la prise ne se recupere pas
      if (!btn.classList.contains('confirm')) {
        btn.classList.add('confirm');
        btn.textContent = fr(t('Effacer ?'));
        setTimeout(() => { if (btn.isConnected) { btn.classList.remove('confirm'); btn.textContent = '×'; } }, 3000);
        return;
      }
      if (player?.id === take.id) stopPlayer();
      deleteTake(take.id);
      renderTakes();
    }
  });
  renderTakes();

  // Ceremonie : l'instrument du palier precedent se transforme sous tes yeux
  if (ceremony) {
    const gifts = unlocksOf(nouveau);
    const box = document.getElementById('ceremony');
    box.innerHTML = `
      <div class="ceremony-card">
        <div class="eyebrow" style="justify-content:center">${t('Palier {n} ouvert', { n: nouveau })}</div>
        <h2>${esc(PALIERS[nouveau - 1].titre)}</h2>
        <ul>${gifts.map((g, i) => `<li style="--i:${i}"><strong>${esc(g.nom)}</strong><span>${fr(esc(g.desc))}</span></li>`).join('')}</ul>
        <div class="result-actions"><button class="btn" id="cer-play">${t('Jouer')}</button><a class="btn ghost" href="#/parcours">${t('Voir le parcours')}</a></div>
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
    // On ne perd jamais une prise : partir de la page pendant l'enregistrement la garde
    if (rec.active) stopRec();
    stopPlayer();
    clearInterval(recTimer);
    clearTimeout(msgTimer);
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
        ${s.libre ? `<span class="tag gold">${t('Libre')}</span>` : `<span class="tag ${open ? '' : 'grey'}">${open ? '' : lock}${t('Palier {n}', { n: s.palier })}</span>`}
        ${s.actuel ? `<span class="tag">${t('Actuel')}</span>` : ''}
        ${s.lecon ? `<span class="tag grey">${t('Avec le prof')}</span>` : ''}
        <span class="lvl" aria-label="${t('Difficulté {n} sur 5', { n: s.niveau || 1 })}">${'●'.repeat(s.niveau || 1)}<b>${'●'.repeat(5 - (s.niveau || 1))}</b></span>
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
    <div class="eyebrow" data-reveal>${t('Bibliothèque')}</div>
    <h1 data-split>${t('Les <span class="grad-text">morceaux</span>')}</h1>
    <p class="lead" data-reveal style="--d:200ms">${fr(SONGS.length > 1
      ? t('{n} morceaux, du plus simple au plus beau. Les notes descendent vers les touches : écoute-les, puis joue-les à ton rythme.', { n: SONGS.length })
      : t('Les morceaux, du plus simple au plus beau. Les notes descendent vers les touches : écoute-les, puis joue-les à ton rythme.'))}</p>
    ${free.length ? `
      <section class="song-group">
        <h2 class="group-title" data-reveal><span>${t('Libres')}</span>${fr(t('Pour le plaisir, dès maintenant'))}</h2>
        <div class="grid">${free.map((s) => songCard(s, i++, cur)).join('')}</div>
      </section>` : ''}
    ${groups.map(({ p, list }) => `
      <section class="song-group">
        <h2 class="group-title" data-reveal><span>${t('Palier {n}', { n: p.id })}</span>${esc(p.titre)}${p.id > cur ? ` <em>${lock} ${t('écoute seulement')}</em>` : ''}</h2>
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
  return `<div class="keys-map" role="img" aria-label="${many(known.size) ? t('{n} touches apprises sur 88', { n: known.size }) : t('{n} touche apprise sur 88', { n: known.size })}">
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
    <div class="eyebrow" data-reveal>${t('Profil')}</div>
    <h1 data-split>${name ? t('{name}, ta <span class="grad-text">progression</span>', { name: esc(name) }) : t('Ta <span class="grad-text">progression</span>')}</h1>
    <div class="profile-top">
      <div class="ring" data-reveal>
        <svg viewBox="0 0 190 190">
          <defs><linearGradient id="ringgrad" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#3ef2ff"/><stop offset="1" stop-color="#8b5cff"/></linearGradient></defs>
          <circle class="track" cx="95" cy="95" r="84" fill="none" stroke-width="10"/>
          <circle class="bar" id="ring-bar" cx="95" cy="95" r="84" fill="none" stroke-width="10" stroke-dasharray="${C}" stroke-dashoffset="${C}"/>
        </svg>
        <div class="ring-label"><strong data-count="${info.level}">0</strong><span>${t('Niveau')}</span></div>
      </div>
      <div class="stats">
        <div class="card stat" data-reveal><strong data-count="${s.xp}">0</strong><span>${t('XP au total')}</span></div>
        <div class="card stat" data-reveal style="--d:80ms"><strong data-count="${nbLecons}">0</strong><span>${t('Leçons réussies')}</span></div>
        <div class="card stat" data-reveal style="--d:160ms"><strong data-count="${s.streak}">0</strong><span>${t('Jours d’affilée')}</span></div>
        <div class="card stat" data-reveal style="--d:240ms"><strong data-count="${info.need - info.current}">0</strong><span>${t('XP avant le niveau {n}', { n: info.level + 1 })}</span></div>
      </div>
    </div>
    <section class="card keys-card" data-reveal>
      <div class="keys-card-head">
        <div><div class="eyebrow">${t('Ta carte du clavier')}</div><h2><span data-count="${known.size}">0</span> <small>${many(known.size) ? t('notes apprises sur 88') : t('note apprise sur 88')}</small></h2></div>
        <a class="btn ghost small" href="#/piano">${esc(STAGES[instr.stage].nom)}</a>
      </div>
      ${keysMap(known)}
      <p class="hint">${fr(t('Chaque note réussie dans une leçon s’allume ici, et sur ton piano.'))}</p>
    </section>
    <h2 data-split>${t('Badges')}</h2>
    <div class="badges">${badges}</div>
    <p style="margin-top:2.5rem"><a class="btn ghost" href="#/reglages">${t('Réglages')}</a></p>
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
    <div class="eyebrow" data-reveal>${t('Réglages')}</div>
    <h1 data-split>${t('À ta <span class="grad-text">main</span>')}</h1>
    <div class="settings">
      <section class="card set" data-reveal>
        <h3 id="set-lang-title">${t('Langue · Language')}</h3>
        <div class="seg" id="set-lang" role="radiogroup" aria-labelledby="set-lang-title" style="justify-self:start">
          ${[['fr', 'Français'], ['en', 'English']].map(([id, label]) => `<button type="button" role="radio" lang="${id}" data-lang="${id}" class="${id === lang() ? 'on' : ''}" aria-checked="${id === lang()}">${label}</button>`).join('')}
        </div>
      </section>
      <section class="card set" data-reveal style="--d:30ms">
        <h3>${t('Toi')}</h3>
        <label class="field"><span>${t('Ton prénom')}</span><input type="text" id="set-prenom" maxlength="30" value="${esc(s.prenom)}" placeholder="${t('Pour que le prof t’appelle par ton nom')}" autocomplete="given-name"></label>
      </section>
      <section class="card set" data-reveal style="--d:60ms">
        <h3>${t('Le son')}</h3>
        <label class="field"><span>${t('Volume')}</span><input type="range" id="set-volume" min="0" max="120" value="${Math.round(s.volume * 100)}"></label>
        <label class="field"><span>${t('Résonance de la salle')}</span><input type="range" id="set-reverb" min="0" max="200" value="${Math.round(s.reverb * 100)}"></label>
        <p class="hint" id="load-state"></p>
      </section>
      <section class="card set" data-reveal style="--d:120ms">
        <h3>${t('Le micro')}</h3>
        <p class="hint">${fr(t('Joue une note sur ton piano : elle doit s’afficher ici. Le site s’adapte tout seul si ton piano est un peu désaccordé.'))}</p>
        <div class="mic-test"><button class="btn ghost small" id="mic-test">${t('Tester le micro')}</button><span class="meter"><span id="mic-meter"></span></span><strong id="mic-note">–</strong></div>
      </section>
      <section class="card set" data-reveal style="--d:180ms">
        <h3>${t('Piano numérique')}</h3>
        <p class="hint">${fr(midiSupported() ? t('Branche ton piano numérique en USB (ou en Bluetooth) : chaque note est reconnue sans aucune erreur.') : t('Ton navigateur ne gère pas les pianos numériques. Chrome ou Edge le font.'))}</p>
        ${midiSupported() ? `<div class="mic-test"><button class="btn ghost small" id="midi-btn">${t('Connecter')}</button><span class="hint" id="midi-list"></span></div>` : ''}
      </section>
      <section class="card set" data-reveal style="--d:240ms">
        <h3>${t('Le prof')}</h3>
        ${voiceAvailable() ? `<label class="chip-toggle"><input type="checkbox" id="set-voix" ${s.voix ? 'checked' : ''}> ${t('Il parle à voix haute')}</label> <button class="btn ghost small" id="voice-test">${t('Écouter')}</button>` : ''}
        <label class="field"><span>${t('Vitesse des démonstrations et des morceaux')}</span><input type="range" id="set-vitesse" min="40" max="100" step="5" value="${Math.round(s.vitesse * 100)}"></label>
      </section>
      <section class="card set" data-reveal style="--d:300ms">
        <h3>${t('Le toucher')}</h3>
        <label class="chip-toggle"><input type="checkbox" id="set-vibration" ${s.vibration ? 'checked' : ''}> ${t('Petite vibration sous le doigt (Android)')}</label>
        ${instr.features.has('cacher-noms') ? `<label class="chip-toggle"><input type="checkbox" id="set-noms" ${s.noms ? 'checked' : ''}> ${t('Nom des notes sur les touches')}</label>` : ''}
      </section>
      <section class="card set" data-reveal style="--d:330ms">
        <h3>${t('L’application')}</h3>
        <p class="hint">${fr(t('Installe le site sur ta tablette ou ton téléphone : il s’ouvre en plein écran, et il marche même sans réseau, posé sur le pupitre.'))}</p>
        <div class="mic-test"><button class="btn small" id="install-btn" hidden>${t('Installer')}</button><span class="hint" id="install-state"></span></div>
      </section>
      <section class="card set" data-reveal style="--d:345ms">
        <h3>${t('Changer d’appareil')}</h3>
        <p class="hint">${fr(t('Pas de compte, pas de serveur : ta progression tient dans un petit fichier. Garde-le, ou rouvre-le sur ton autre appareil (tes leçons, ton XP, tes badges, tes réglages et tes prises).'))}</p>
        <div class="result-actions" style="justify-content:flex-start">
          <button class="btn small" id="export">${t('Exporter ma progression')}</button>
          <label class="btn ghost small file-btn">${t('Importer un fichier')}<input type="file" id="import-file" accept="application/json,.json" hidden></label>
        </div>
        <p class="hint" id="transfer-state" aria-live="polite"></p>
      </section>
      <section class="card set danger" data-reveal style="--d:360ms">
        <h3>${t('Ta progression')}</h3>
        <p class="hint">${fr(t('Elle est gardée dans ce navigateur. La remettre à zéro efface les leçons, les notes apprises, l’XP et les badges.'))}</p>
        <button class="btn ghost small" id="reset">${t('Tout remettre à zéro')}</button>
      </section>
    </div>
    ${footer()}
  `;
  const $ = (id) => document.getElementById(id);
  // La langue : le choix est garde, et la page se recharge dans la nouvelle langue
  $('set-lang').addEventListener('click', (e) => {
    const b = e.target.closest('button[data-lang]');
    if (b && b.dataset.lang !== lang()) setLang(b.dataset.lang);
  });
  $('set-prenom').addEventListener('change', (e) => setSetting('prenom', e.target.value.trim()));
  $('set-volume').addEventListener('input', (e) => setSetting('volume', Number(e.target.value) / 100));
  $('set-reverb').addEventListener('input', (e) => setSetting('reverb', Number(e.target.value) / 100));
  $('set-vitesse').addEventListener('input', (e) => setSetting('vitesse', Number(e.target.value) / 100));
  $('set-vibration').addEventListener('change', (e) => { setSetting('vibration', e.target.checked); if (e.target.checked) navigator.vibrate?.(12); });
  $('set-noms')?.addEventListener('change', (e) => setSetting('noms', e.target.checked));
  $('set-voix')?.addEventListener('change', (e) => setSetting('voix', e.target.checked));
  $('voice-test')?.addEventListener('click', () => {
    const p = getSettings().prenom;
    speak(p ? t('Bonjour {name}. On reprend là où on s’était arrêtés ?', { name: p }) : t('Bonjour. On reprend là où on s’était arrêtés ?'), { force: true });
  });
  // Export : un fichier date ; import : verifie, puis confirme en deux gestes (il remplace tout)
  const tState = $('transfer-state');
  $('export').addEventListener('click', () => {
    const data = exportData({ takes: listTakes() });
    const day = new Date().toISOString().slice(0, 10);
    deliverFile(new Blob([JSON.stringify(data)], { type: 'application/json' }), t('piano-progression-{day}.json', { day }));
    tState.textContent = fr(t('Fichier prêt. Ouvre-le ici même, dans Réglages, sur ton autre appareil.'));
  });
  let pending = null;
  $('import-file').addEventListener('change', async (e) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    let data = null;
    try { data = JSON.parse(await file.text()); } catch (err) { data = null; }
    if (!validData(data)) { tState.textContent = fr(t('Ce fichier n’est pas une progression de Piano Learn.')); return; }
    pending = data;
    const p = data.progress;
    const nl = Object.keys(p.lessonsDone).length;
    const lessons = many(nl) ? t('{n} leçons', { n: nl }) : t('{n} leçon', { n: nl });
    const date = new Date(data.at).toLocaleDateString(locale(), { day: 'numeric', month: 'long', year: 'numeric' });
    tState.innerHTML = `${fr(t('Progression du {date} : {xp} XP, {lessons}. Elle remplacera celle-ci.', { date, xp: p.xp, lessons }))} <button class="btn small" id="import-go">${t('Remplacer')}</button>`;
    $('import-go').addEventListener('click', () => {
      if (!pending || !importData(pending)) return;
      if (Array.isArray(pending.takes)) { try { localStorage.setItem('piano-learn-prises-v1', JSON.stringify(pending.takes.slice(0, 12))); } catch (err) { /* plein */ } }
      pending = null;
      route(true);
    });
  });
  $('reset').addEventListener('click', () => {
    if (confirm(t('Tout effacer ? Les leçons, les notes apprises, l’XP et les badges. On ne pourra pas revenir en arrière.'))) {
      resetProgress();
      route(true);
    }
  });
  const loadState = $('load-state');
  const refreshLoad = () => {
    const st = loadStatus(...instrumentAt(currentPalier(getState())).range);
    const ctx = getContext();
    const lat = Math.round(((ctx.baseLatency || 0) + (ctx.outputLatency || 0)) * 1000);
    loadState.textContent = fr(`${t('Sons du piano prêts : {ready} sur {total}.', { ready: st.ready, total: st.total })}${lat ? ` ${t('Délai de ta sortie audio : {ms} ms.', { ms: lat })}` : ''}`);
  };
  refreshLoad();
  const offAudio = onAudioChange(refreshLoad);

  let listener = null;
  $('mic-test').addEventListener('click', async () => {
    if (listener) { listener.stop(); listener = null; $('mic-test').textContent = t('Tester le micro'); return; }
    const { Listener } = await import('./listen.js');
    const l = new Listener({
      onNote: (midi) => { $('mic-note').textContent = noteName(midi, true); },
      onLevel: (v) => { $('mic-meter').style.width = `${Math.round(v * 100)}%`; },
    });
    try {
      await l.start();
      listener = l;
      $('mic-test').textContent = t('Arrêter');
    } catch (e) {
      $('mic-note').textContent = t('Micro refusé');
    }
  });

  const midiList = $('midi-list');
  const showMidi = (list) => { if (midiList) midiList.textContent = list.length ? fr(t('Connecté : {list}', { list: list.join(', ') })) : t('Aucun piano détecté pour l’instant.'); };
  const offMidi = onMidiDevices(showMidi);
  if (midiInputs().length) showMidi(midiInputs());
  $('midi-btn')?.addEventListener('click', async () => {
    try { showMidi(await connectMidi()); } catch (e) { if (midiList) midiList.textContent = t('Accès refusé.'); }
  });

  const installBtn = $('install-btn');
  const installState = $('install-state');
  const refreshInstall = async () => {
    const ready = await offlineReady();
    installBtn.hidden = !canInstall() || isInstalled();
    installState.textContent = fr(isInstalled() ? t('Installée sur cet appareil.')
      : canInstall() ? (ready ? t('Prête à marcher hors ligne.') : '')
      : isIOS() ? t('Sur iPhone et iPad : touche Partager, puis « Sur l’écran d’accueil ».')
      : `${t('Ton navigateur propose l’installation dans son menu.')}${ready ? ` ${t('Le site marche déjà hors ligne.')}` : ''}`);
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
      <div class="eyebrow">${t('Erreur 404')}</div>
      <h1 data-split>${t('Fausse <span class="grad-text">note</span>')}</h1>
      <p class="lead" style="margin:0 auto 1.5rem">${fr(t('Cette page n’existe pas. On reprend depuis le début ?'))}</p>
      <a href="#/" class="btn">${t('Retour à l’accueil')}</a>
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
  const learning = ['lecon', 'oreille', 'theorie'].includes(name);
  document.querySelectorAll('#nav a').forEach((a) => a.classList.toggle('active', a.dataset.route === name || (learning && a.dataset.route === 'parcours') || (name === 'morceau' && a.dataset.route === 'morceaux')));
  const page = name === 'lecon' && needsBilan() ? () => pageBilan(null, { query: new URLSearchParams(`next=lecon/${param}`) })
    : name === 'lecon' ? () => pageLecon(param)
    : name === 'morceau' ? () => pageMorceau(param)
    : name === 'oreille' ? () => (param ? renderEarGame(app, param) : renderEarList(app, learnNav('oreille')))
    : name === 'theorie' ? () => (param ? renderTheoryCard(app, param) : renderTheoryList(app, learnNav('theorie')))
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
    import('./teacher.js').then((mod) => mod.preloadTeacher()).catch(() => {});
    autoConnectMidi();
  };
  if ('requestIdleCallback' in window) requestIdleCallback(go, { timeout: 3000 });
  else setTimeout(go, 1500);
}

window.addEventListener('hashchange', () => route());
route();
registerOffline();
