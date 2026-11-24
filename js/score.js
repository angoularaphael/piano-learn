// Partitions en notation compacte, lisible a l'oeil et verifiable.
//
//   "E4:1/3 E4:1/3 F4:1/4 G4:1/5 | G4:1/5 F4:1/4 E4:1/3 D4:1/2"
//
//   note      : lettre A-G, alteration # ou b facultative, octave (C4 = do du milieu = MIDI 60)
//   :duree    : en temps (noire = 1, blanche = 2, croche = 0.5, noire pointee = 1.5)
//   /doigt    : facultatif, 1 = pouce ... 5 = auriculaire
//   accord    : C4+E4+G4:2/1+3+5
//   silence   : -:1
//   |         : barre de mesure (verifiee : chaque mesure pleine doit faire le bon nombre de temps)
//
// Aucun acces au DOM : ce module tourne aussi dans Node pour valider les donnees.

const LETTERS = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const PITCH = /^([A-G])(#|b)?(\d)$/;

export function pitchToMidi(p) {
  const m = PITCH.exec(p);
  if (!m) throw new Error(`note inconnue « ${p} »`);
  const alt = m[2] === '#' ? 1 : m[2] === 'b' ? -1 : 0;
  return LETTERS[m[1]] + alt + (Number(m[3]) + 1) * 12;
}

// Nombre de temps (en noires) dans une mesure : 4/4 -> 4, 3/4 -> 3, 6/8 -> 3, 2/2 -> 4
export function beatsPerBar(mesure = '4/4') {
  const [n, d] = String(mesure).split('/').map(Number);
  return (n * 4) / d;
}

// Une ligne (une main) -> evenements { midi, start, dur, finger, hand }
export function parseLine(line = '', hand = 'R') {
  const events = [];
  const bars = [];
  const errors = [];
  let t = 0;
  let barStart = 0;
  const tokens = String(line).trim().split(/\s+/).filter(Boolean);
  for (const tok of tokens) {
    if (tok === '|') {
      bars.push(t - barStart);
      barStart = t;
      continue;
    }
    const [head, fingerPart] = tok.split('/');
    const [pitchPart, durPart] = head.split(':');
    const dur = Number(durPart);
    if (!durPart || !Number.isFinite(dur) || dur <= 0) {
      errors.push(`duree manquante ou fausse dans « ${tok} »`);
      continue;
    }
    if (pitchPart !== '-') {
      const pitches = pitchPart.split('+');
      const fingers = fingerPart ? fingerPart.split('+').map(Number) : [];
      pitches.forEach((p, i) => {
        try {
          const f = fingers[i];
          events.push({ midi: pitchToMidi(p), start: t, dur, finger: f >= 1 && f <= 5 ? f : null, hand });
        } catch (e) {
          errors.push(e.message);
        }
      });
      if (fingers.length && fingers.length !== pitches.length) errors.push(`« ${tok} » : autant de doigts que de notes`);
    }
    t += dur;
  }
  if (t > barStart) bars.push(t - barStart);
  return { events, bars, total: t, errors };
}

const round = (x) => Math.round(x * 1000) / 1000;

// Ancien format (liste [midi, temps] jouee note apres note) -> meme forme qu'une ligne
function demoLine(demo = [], hand = 'R') {
  const events = [];
  let t = 0;
  for (const [midi, beats = 1] of demo) {
    if (midi != null) events.push({ midi, start: t, dur: beats, finger: null, hand: hand === 'auto' ? (midi >= 60 ? 'R' : 'L') : hand });
    t += beats;
  }
  return { events, bars: [], total: t, errors: [] };
}

// Partition complete (une ou deux mains) -> evenements tries et etapes (notes qui commencent ensemble)
export function parseScore({ droite = '', gauche = '', mesure = '4/4', demo = null } = {}) {
  if (demo) {
    const d = demoLine(demo, 'R');
    return finishScore(d, { events: [], bars: [], total: 0, errors: [] }, mesure);
  }
  return finishScore(parseLine(droite, 'R'), parseLine(gauche, 'L'), mesure);
}

function finishScore(r, l, mesure) {
  const events = [...r.events, ...l.events]
    .map((e) => ({ ...e, start: round(e.start), dur: round(e.dur) }))
    .sort((a, b) => a.start - b.start || a.midi - b.midi);
  const steps = [];
  for (const e of events) {
    const last = steps[steps.length - 1];
    if (last && last.start === e.start) last.notes.push(e);
    else steps.push({ start: e.start, notes: [e] });
  }
  const total = Math.max(r.total, l.total);
  const midis = events.map((e) => e.midi);
  return {
    events,
    steps,
    total,
    low: midis.length ? Math.min(...midis) : 60,
    high: midis.length ? Math.max(...midis) : 60,
    mesure,
    bars: { R: r.bars, L: l.bars },
    errors: [...r.errors, ...l.errors],
  };
}

// Erreurs de saisie : notes inconnues, mesures qui ne tombent pas juste, mains de longueurs differentes.
// La premiere mesure peut etre une levee (incomplete) et la derniere la completer.
export function validateScore(score, label = '') {
  const s = score.events ? score : parseScore(score);
  const out = [...s.errors];
  const per = beatsPerBar(s.mesure);
  for (const [hand, bars] of Object.entries(s.bars)) {
    if (!bars.length) continue;
    bars.forEach((b, i) => {
      const edge = i === 0 || i === bars.length - 1;
      if (round(b) !== per && !(edge && b < per)) out.push(`main ${hand}, mesure ${i + 1} : ${round(b)} temps au lieu de ${per}`);
    });
    if (bars.length > 2 && bars[0] < per && round(bars[0] + bars[bars.length - 1]) !== per && bars[bars.length - 1] !== per) {
      out.push(`main ${hand} : la levee (${bars[0]}) et la derniere mesure (${bars[bars.length - 1]}) ne font pas une mesure`);
    }
  }
  if (s.bars.R.length && s.bars.L.length) {
    const tr = s.bars.R.reduce((a, b) => a + b, 0);
    const tl = s.bars.L.reduce((a, b) => a + b, 0);
    if (round(tr) !== round(tl)) out.push(`main droite ${round(tr)} temps, main gauche ${round(tl)} temps`);
  }
  for (const e of s.events) if (e.midi < 21 || e.midi > 108) out.push(`note hors du piano : ${e.midi}`);
  return out.map((m) => (label ? `${label} : ${m}` : m));
}
