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

function touchDay() {
  const today = new Date().toISOString().slice(0, 10);
  if (state.lastDay === today) return;
  const yesterday = new Date(Date.now() - 86400000).toISOString().slice(0, 10);
  state.streak = state.lastDay === yesterday ? state.streak + 1 : 1;
  state.lastDay = today;
  if (state.streak > 1) state.xp += 10 * Math.min(state.streak, 7);
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
  state = { ...DEFAULT, lessonsDone: {}, songsDone: {}, badges: [], known: [], seen: [], bilan: null, placement: 0 };
  save();
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
