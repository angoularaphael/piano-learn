// Progression gardee dans le navigateur
const KEY = 'piano-learn-progress-v1';

const DEFAULT = {
  xp: 0,
  lessonsDone: {},   // { '1-1': { stars: 3, best: 95 } }
  songsDone: {},
  badges: [],
  streak: 0,
  lastDay: null,
};

let state = load();
const listeners = new Set();

function load() {
  try {
    const raw = localStorage.getItem(KEY);
    return raw ? { ...DEFAULT, ...JSON.parse(raw) } : { ...DEFAULT };
  } catch (e) {
    return { ...DEFAULT };
  }
}

function save() {
  localStorage.setItem(KEY, JSON.stringify(state));
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

function completeEntry(bag, id, accuracy, firstXp) {
  const stars = accuracy >= 95 ? 3 : accuracy >= 80 ? 2 : 1;
  const prev = bag[id];
  const firstTime = !prev;
  bag[id] = {
    stars: Math.max(stars, prev?.stars || 0),
    best: Math.max(accuracy, prev?.best || 0),
  };
  const gained = (firstTime ? firstXp : 10) + Math.round(accuracy / 2);
  addXp(gained);
  return { stars, gained };
}

export function completeLesson(id, accuracy) {
  return completeEntry(state.lessonsDone, id, accuracy, 50);
}

export function completeSong(id, accuracy) {
  return completeEntry(state.songsDone, id, accuracy, 80);
}

export function unlockBadge(id) {
  if (state.badges.includes(id)) return false;
  state.badges.push(id);
  save();
  return true;
}

export function resetProgress() {
  state = { ...DEFAULT, lessonsDone: {}, songsDone: {}, badges: [] };
  save();
}
