// Progression et reglages, gardes dans le navigateur (aucun compte, rien ne part sur internet).
const KEY = 'piano-learn-progress-v1';
const SETTINGS_KEY = 'piano-learn-settings-v1';

const DEFAULT = {
  xp: 0,
  lessonsDone: {},   // { '1-1': { stars: 3, best: 95 } }
  songsDone: {},     // { 'ode-joie-theme': { stars: 2, best: 88 } }
  badges: [],
  streak: 0,
  lastDay: null,
  known: [],         // touches decouvertes (numeros MIDI), dans l'ordre de la decouverte
  seen: [],          // deblocages deja celebres ('palier-2', 'stage-clavier'...)
  placement: 0,      // palier de depart (bilan de niveau ou choix de l'eleve)
  bilan: null,       // { niveau, materiel, reponses, tests, palier, date }
  jour: null,        // seance du jour : { date, done: ['lecon:3-2', ...] }
  joker: null,       // un jour manque par semaine ne casse pas la serie : { week, used, saved }
  oreille: {},       // meilleurs scores des jeux d'oreille : { 'hauteur': 9 }
};

const DEFAULT_SETTINGS = {
  prenom: '',
  son: null,         // instrument choisi (null = celui du palier)
  volume: 0.9,
  reverb: 1,
  vibration: true,
  voix: false,
  vitesse: 1,        // vitesse du prof et des morceaux
  noms: true,        // nom des notes sur les touches
  lettres: true,     // lettres du clavier d'ordinateur sur les touches (piano libre)
  entree: null,      // acoustique | numerique | ecran
  affichage: null,   // notes | mix | partition (morceaux)
  rappel: '18:30',   // heure du rappel quotidien (fichier calendrier)
  langue: null,      // fr | en (null = celle du navigateur)
  theme: 'edition',  // palette de couleurs (js/palette.js)
  prof: 'femme',     // le prof 3D : femme | homme
};

function read(key, fallback) {
  try {
    const raw = localStorage.getItem(key);
    return raw ? { ...fallback, ...JSON.parse(raw) } : { ...fallback };
  } catch (e) {
    return { ...fallback };
  }
}
function write(key, value) {
  try { localStorage.setItem(key, JSON.stringify(value)); } catch (e) { /* navigation privee */ }
}

let state = read(KEY, DEFAULT);
let settings = read(SETTINGS_KEY, DEFAULT_SETTINGS);
const listeners = new Set();
const settingListeners = new Set();

function save() {
  write(KEY, state);
  listeners.forEach((fn) => fn(state));
}

export function getState() {
  return state;
}

export function onChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Niveau 1 -> 2 : 100 XP, puis chaque niveau demande 50 XP de plus
export function levelInfo(xp = state.xp) {
  let level = 1;
  let need = 100;
  let rest = xp;
  while (rest >= need) {
    rest -= need;
    level += 1;
    need += 50;
  }
  return { level, current: rest, need, ratio: rest / need };
}

export function addXp(amount) {
  state.xp += amount;
  touchDay();
  save();
}

// Jours en heure locale (et non en temps universel : la journee de l'eleve finit a minuit chez lui)
const pad = (n) => String(n).padStart(2, '0');
export function dayKey(d = new Date()) {
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
}
function daysAgo(n) {
  const d = new Date();
  d.setHours(12, 0, 0, 0);
  d.setDate(d.getDate() - n);
  return dayKey(d);
}
// Semaine du calendrier (du lundi au dimanche) : un joker par semaine
export function weekKey(d = new Date()) {
  const x = new Date(d);
  x.setHours(12, 0, 0, 0);
  x.setDate(x.getDate() - ((x.getDay() + 6) % 7));
  return dayKey(x);
}

function touchDay() {
  const today = dayKey();
  if (state.lastDay === today) return;
  const week = weekKey();
  if (!state.joker || state.joker.week !== week) state.joker = { week, used: false, saved: null };
  if (state.lastDay === daysAgo(1)) state.streak += 1;
  else if (state.lastDay === daysAgo(2) && state.streak > 0 && !state.joker.used) {
    // Un seul jour manque : le joker de la semaine garde la serie
    state.joker.used = true;
    state.joker.saved = daysAgo(1);
    state.streak += 1;
  } else state.streak = 1;
  state.lastDay = today;
  if (state.streak > 1) state.xp += 10 * Math.min(state.streak, 7);
}

// La serie en cours, telle qu'on peut l'afficher aujourd'hui (elle peut encore etre sauvee)
export function streakInfo() {
  const today = dayKey();
  const week = weekKey();
  const jokerFree = !state.joker || state.joker.week !== week || !state.joker.used;
  let alive = state.lastDay === today || state.lastDay === daysAgo(1);
  if (!alive && state.lastDay === daysAgo(2) && jokerFree) alive = true;
  return {
    days: alive ? state.streak : 0,
    playedToday: state.lastDay === today,
    jokerFree,
    savedBy: state.joker?.saved && state.joker.week === week ? state.joker.saved : null,
  };
}

// ---------- Seance du jour ----------
export function dailyDone() {
  return state.jour?.date === dayKey() ? state.jour.done : [];
}
export function markDaily(key) {
  const today = dayKey();
  if (state.jour?.date !== today) state.jour = { date: today, done: [] };
  if (state.jour.done.includes(key)) return false;
  state.jour.done.push(key);
  save();
  return true;
}

// ---------- Jeux d'oreille ----------
export function earBest(id) {
  return state.oreille?.[id] || 0;
}
export function completeEar(id, score, total) {
  if (!state.oreille) state.oreille = {};
  const best = Math.max(score, state.oreille[id] || 0);
  const first = !state.oreille[id];
  state.oreille[id] = best;
  const gained = Math.round((score / Math.max(1, total)) * (first ? 40 : 15));
  addXp(gained);
  markDaily(`oreille:${id}`);
  return { gained, best };
}

export function starsFor(accuracy) {
  return accuracy >= 95 ? 3 : accuracy >= 80 ? 2 : 1;
}

export function completeLesson(id, accuracy) {
  const stars = starsFor(accuracy);
  const prev = state.lessonsDone[id];
  state.lessonsDone[id] = {
    stars: Math.max(stars, prev?.stars || 0),
    best: Math.max(accuracy, prev?.best || 0),
  };
  const gained = (prev ? 10 : 50) + Math.round(accuracy / 2);
  addXp(gained);
  markDaily(`lecon:${id}`);
  return { stars, gained, first: !prev };
}

export function completeSong(id, accuracy, boss = false) {
  const stars = starsFor(accuracy);
  const prev = state.songsDone[id];
  state.songsDone[id] = {
    stars: Math.max(stars, prev?.stars || 0),
    best: Math.max(accuracy, prev?.best || 0),
  };
  const gained = (prev ? 15 : boss ? 200 : 80) + Math.round(accuracy / 2);
  addXp(gained);
  markDaily(`morceau:${id}`);
  return { stars, gained, first: !prev };
}

export function unlockBadge(id) {
  if (state.badges.includes(id)) return false;
  state.badges.push(id);
  save();
  return true;
}

// ---------- Touches decouvertes ----------
export function knownKeys() {
  return new Set(state.known);
}

export function discover(midi) {
  if (state.known.includes(midi)) return false;
  state.known.push(midi);
  if (state.known.length >= 12 && !state.badges.includes('octave')) state.badges.push('octave');
  save();
  return true;
}

// Un deblocage n'est celebre qu'une fois
export function markSeen(id) {
  if (state.seen.includes(id)) return false;
  state.seen.push(id);
  save();
  return true;
}

export function setBilan(bilan) {
  state.bilan = bilan;
  save();
}

export function setPlacement(palier) {
  state.placement = palier;
  save();
}

export function resetProgress() {
  state = { ...DEFAULT, lessonsDone: {}, songsDone: {}, badges: [], known: [], seen: [], bilan: null, placement: 0, jour: null, joker: null, oreille: {} };
  save();
}

// ---------- Changer d'appareil, sans compte ni serveur ----------
// Toute la progression tient dans un petit fichier (ou un code a copier) qu'on rouvre ailleurs.
export function exportData(extra = {}) {
  return { app: 'piano-learn', v: 1, at: new Date().toISOString(), progress: state, settings, ...extra };
}

export function validData(d) {
  const p = d?.progress;
  return !!(d && d.app === 'piano-learn' && p && typeof p.xp === 'number' && p.lessonsDone && typeof p.lessonsDone === 'object'
    && Array.isArray(p.known) && Array.isArray(p.badges));
}

export function importData(d) {
  if (!validData(d)) return false;
  state = { ...DEFAULT, ...d.progress };
  settings = { ...DEFAULT_SETTINGS, ...(d.settings || {}) };
  write(SETTINGS_KEY, settings);
  save();
  settingListeners.forEach((fn) => fn(settings, null));
  return true;
}

// ---------- Reglages ----------
export function getSettings() {
  return settings;
}

export function setSetting(key, value) {
  settings = { ...settings, [key]: value };
  write(SETTINGS_KEY, settings);
  settingListeners.forEach((fn) => fn(settings, key));
}

export function onSettings(fn) {
  settingListeners.add(fn);
  return () => settingListeners.delete(fn);
}
