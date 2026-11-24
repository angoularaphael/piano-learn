// La seance du jour : une dizaine de minutes, quatre gestes, toujours dans le meme ordre.
// 1. Echauffer l'oreille (un jeu de ton niveau)                       ~2 min
// 2. Apprendre (la prochaine lecon du parcours)                        ~5 min
// 3. Revoir (une lecon ou un morceau pas encore a trois etoiles :
//    on retient mieux ce qu'on va rechercher en memoire un autre jour)  ~2 min
// 4. Te faire plaisir (un morceau ouvert, pour finir en musique)       ~2 min
// Le programme est le meme toute la journee (tire au sort a partir de la date), et chaque geste
// se coche tout seul quand tu le fais, ou que tu le fasses.
import { getState, dailyDone, dayKey, streakInfo } from './progress.js';
import { PALIERS, currentPalier, nextLesson, lessonUnlocked } from './data/paliers.js';
import { SONGS, songOpen } from './data/library.js';
import { gamesOpen } from './ear.js';

// Tirage stable pour la journee
function seeded(seed) {
  let h = 2166136261;
  for (const c of seed) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return () => {
    h = Math.imul(h ^ (h >>> 15), 2246822507);
    h = Math.imul(h ^ (h >>> 13), 3266489909);
    return ((h ^= h >>> 16) >>> 0) / 4294967296;
  };
}

export function todayPlan() {
  const state = getState();
  const cur = currentPalier(state);
  const rnd = seeded(dayKey());
  const pickOne = (arr) => (arr.length ? arr[Math.floor(rnd() * arr.length)] : null);
  const plan = [];

  // 1. L'oreille : les jeux de ton niveau tournent d'un jour a l'autre
  const games = gamesOpen(cur);
  const game = pickOne(games);
  if (game) plan.push({ key: `oreille:${game.id}`, kind: 'oreille', step: 'Échauffer l’oreille', label: game.titre, href: `#/oreille/${game.id}`, min: 2 });

  // 2. Apprendre
  const nxt = nextLesson(state);
  if (nxt) plan.push({ key: `lecon:${nxt.lecon.id}`, kind: 'apprendre', step: 'Apprendre', label: nxt.lecon.titre, href: `#/lecon/${nxt.lecon.id}`, min: 5 });

  // 3. Revoir : d'abord ce qui n'a pas ses trois etoiles
  const done = [];
  PALIERS.forEach((p, i) => p.lecons.forEach((l, j) => {
    const d = state.lessonsDone[l.id];
    if (d && lessonUnlocked(i, j, state) && l.id !== nxt?.lecon.id) done.push({ l, d });
  }));
  const weak = done.filter((x) => x.d.stars < 3);
  const review = pickOne(weak.length ? weak : done);
  if (review) plan.push({ key: `lecon:${review.l.id}`, kind: 'revoir', step: 'Revoir', label: review.l.titre, href: `#/lecon/${review.l.id}`, min: 2 });

  // 4. Plaisir : un morceau ouvert (les nouveaux d'abord)
  const open = SONGS.filter((s) => songOpen(s, cur) && !s.lecon);
  const fresh = open.filter((s) => !state.songsDone[s.id]);
  const song = pickOne(fresh.length ? fresh : open);
  if (song) plan.push({ key: `morceau:${song.id}`, kind: 'plaisir', step: 'Te faire plaisir', label: song.titre, href: `#/morceau/${song.id}`, min: 2 });

  const doneKeys = new Set(dailyDone());
  plan.forEach((s) => { s.done = doneKeys.has(s.key); });
  return plan;
}

// Le prochain geste a faire aujourd'hui (null si la seance est finie)
export function nextStep() {
  return todayPlan().find((s) => !s.done) || null;
}

export function sessionSummary() {
  const plan = todayPlan();
  const done = plan.filter((s) => s.done).length;
  return { plan, done, total: plan.length, complete: plan.length > 0 && done === plan.length, minutes: plan.reduce((a, s) => a + s.min, 0), streak: streakInfo() };
}

// ---------- Rappel quotidien, sans serveur : un evenement d'agenda qui revient chaque jour ----------
const icsText = (t) => String(t).replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
const stamp = (d) => d.toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
const local = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;

function firstAt(time) {
  const [h, m] = time.split(':').map(Number);
  const d = new Date();
  d.setHours(h, m, 0, 0);
  if (d <= new Date()) d.setDate(d.getDate() + 1);
  return d;
}

export function reminderICS({ time = '18:30', title, body, url }) {
  const start = firstAt(time);
  const lines = [
    'BEGIN:VCALENDAR', 'VERSION:2.0', 'PRODID:-//Piano Learn//Seance du jour//FR', 'CALSCALE:GREGORIAN', 'METHOD:PUBLISH',
    'BEGIN:VEVENT',
    `UID:seance-${Date.now().toString(36)}@piano-learn`,
    `DTSTAMP:${stamp(new Date())}`,
    `DTSTART:${local(start)}`,
    'DURATION:PT10M',
    'RRULE:FREQ=DAILY',
    `SUMMARY:${icsText(title)}`,
    `DESCRIPTION:${icsText(`${body}\n${url}`)}`,
    `URL:${url}`,
    'BEGIN:VALARM', 'ACTION:DISPLAY', `DESCRIPTION:${icsText(title)}`, 'TRIGGER:PT0M', 'END:VALARM',
    'END:VEVENT', 'END:VCALENDAR',
  ];
  return new Blob([lines.join('\r\n') + '\r\n'], { type: 'text/calendar' });
}

// Lien Google Agenda (evenement quotidien prerempli : rien n'est envoye tant que tu ne l'enregistres pas)
export function reminderGoogle({ time = '18:30', title, body, url }) {
  const start = firstAt(time);
  const end = new Date(start.getTime() + 10 * 60000);
  const p = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
    details: `${body}\n${url}`,
    dates: `${local(start)}/${local(end)}`,
    recur: 'RRULE:FREQ=DAILY',
  });
  return `https://calendar.google.com/calendar/render?${p.toString()}`;
}
