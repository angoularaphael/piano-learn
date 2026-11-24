// L'instrument grandit avec l'eleve.
// Au debut : quelques touches de lumiere et un son doux. Puis le clavier s'allonge, devient un vrai
// clavier, puis un piano a queue ; les sons, la pedale, la transposition arrivent quand on en a besoin.
// Chaque touche apprise reste allumee : le clavier lui-meme est la carte de la progression.
import { INSTRUMENTS } from './audio.js';

export const STAGES = {
  lumiere: {
    id: 'lumiere', palier: 1, nom: 'Le clavier de lumière',
    desc: 'Le clavier de tes premières leçons. Chaque note que tu apprends s’allume et reste allumée.',
  },
  clavier: {
    id: 'clavier', palier: 3, nom: 'Le vrai clavier',
    desc: 'La lumière prend corps : ivoire, ébène, feutre rouge. Un clavier comme le tien.',
  },
  queue: {
    id: 'queue', palier: 6, nom: 'Le piano à queue',
    desc: 'Le grand piano de concert, couvercle ouvert. Tu vois les cordes vibrer sous tes doigts.',
  },
};

export const FEATURES = {
  'cacher-noms': { nom: 'Jouer sans les noms', desc: 'Tu peux cacher le nom des notes pour lire vraiment.' },
  metronome: { nom: 'Le métronome', desc: 'Un battement régulier pour tenir le tempo.' },
  'deux-mains': { nom: 'Les deux mains', desc: 'Choisis la main que tu travailles dans chaque morceau.' },
  accords: { nom: 'Les accords', desc: 'Le nom de l’accord s’affiche quand tu le joues.' },
  pedale: { nom: 'La pédale', desc: 'Maintiens la barre d’espace (ou le bouton) : les notes résonnent.' },
  transposition: { nom: 'La transposition', desc: 'Joue un morceau plus haut ou plus bas sans changer tes doigts.' },
};

// Ce que chaque palier ajoute
const BY_PALIER = {
  1: { stage: 'lumiere', range: [60, 72], sons: ['feutre'], features: [] },
  2: { range: [48, 72], features: [] },
  3: { stage: 'clavier', range: [48, 84], sons: ['droit'], features: [] },
  4: { features: ['cacher-noms'] },
  5: { features: ['metronome'] },
  6: { stage: 'queue', range: [36, 84], sons: ['concert'], features: ['deux-mains'] },
  7: { range: [36, 96], sons: ['electrique'], features: ['accords'] },
  8: { range: [21, 108], sons: ['orgue', 'clavecin'], features: ['pedale', 'transposition'] },
};

// Etat complet de l'instrument a un palier donne (tout ce qui a ete debloque jusque-la)
export function instrumentAt(palier) {
  const out = { palier, stage: 'lumiere', range: [60, 72], sons: [], features: new Set() };
  for (let p = 1; p <= Math.min(8, Math.max(1, palier)); p++) {
    const add = BY_PALIER[p];
    if (add.stage) out.stage = add.stage;
    if (add.range) out.range = add.range;
    (add.sons || []).forEach((s) => out.sons.includes(s) || out.sons.push(s));
    (add.features || []).forEach((f) => out.features.add(f));
  }
  // Le son par defaut suit le corps de l'instrument
  out.son = out.stage === 'queue' ? 'concert' : out.stage === 'clavier' ? 'droit' : 'feutre';
  return out;
}

// Les nouveautes d'un palier, pour la ceremonie de deblocage
export function unlocksOf(palier) {
  const add = BY_PALIER[palier];
  if (!add || palier === 1) return [];
  const prev = instrumentAt(palier - 1);
  const list = [];
  if (add.stage && add.stage !== prev.stage) list.push({ type: 'stage', id: add.stage, nom: STAGES[add.stage].nom, desc: STAGES[add.stage].desc });
  (add.sons || []).forEach((s) => list.push({ type: 'son', id: s, nom: `Nouveau son : ${INSTRUMENTS[s].nom.toLowerCase()}`, desc: INSTRUMENTS[s].desc }));
  (add.features || []).forEach((f) => list.push({ type: 'feature', id: f, nom: FEATURES[f].nom, desc: FEATURES[f].desc }));
  return list;
}

// Plage du piano libre : celle du palier, elargie aux touches deja decouvertes, en octaves entieres
export function freeRange(instr, known = new Set()) {
  let [low, high] = instr.range;
  known.forEach((m) => { low = Math.min(low, m); high = Math.max(high, m); });
  return wholeOctaves(low, high);
}

// Elargit une plage pour qu'elle commence sur un do et finisse sur un do
export function wholeOctaves(low, high) {
  const lo = Math.max(21, low - (((low % 12) + 12) % 12));
  let hi = high + ((12 - (high % 12)) % 12);
  if (hi === lo) hi += 12;
  return [lo, Math.min(108, hi)];
}
