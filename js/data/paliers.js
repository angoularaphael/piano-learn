// Les paliers du parcours, avec leur ordre de deblocage.
// Le contenu des lecons vit dans curriculum.js ; ici on calcule ce qui est ouvert, fait, ou a venir.
import { PALIERS as CURRICULUM } from './curriculum.js';
import { PALIERS_EQUIPE } from './paliers-equipe.js';

// Squelette des 8 paliers : sert tant qu'un palier n'a pas encore son contenu complet
const SKELETON = [
  { id: 1, titre: 'Découverte', resume: 'Trouver le do, connaître ses doigts, jouer ses cinq premières notes.' },
  { id: 2, titre: 'Premières mélodies', resume: 'Enchaîner les notes main droite, sortir de la position, jouer lié.' },
  { id: 3, titre: 'La main gauche', resume: 'Les notes graves, do à sol main gauche, puis une main après l’autre.' },
  { id: 4, titre: 'Lire les notes', resume: 'La portée, la clé de sol, la clé de fa, et lire sans chercher.' },
  { id: 5, titre: 'Le rythme', resume: 'Ronde, blanche, noire, croche, les silences, et compter les temps.' },
  { id: 6, titre: 'Les deux mains', resume: 'Mélodie à droite, basse à gauche, et les faire marcher ensemble.' },
  { id: 7, titre: 'Les accords', resume: 'Do, fa, sol majeur, et accompagner une mélodie.' },
  { id: 8, titre: 'Aller plus loin', resume: 'Dièses, bémols, gammes, nuances, pédale : de vrais morceaux.' },
];

// Pour chaque palier : le parcours complet s'il existe, sinon les lecons de l'equipe qui ont deja leurs notes
export const PALIERS = SKELETON.map((s) => {
  const full = CURRICULUM.find((p) => p.id === s.id);
  if (full) return { ...s, ...full };
  const team = PALIERS_EQUIPE.find((p) => p.id === s.id);
  const ready = team ? team.lecons.filter((l) => l.demo?.length).map((l) => ({ tempo: 96, main: 'deux', ...l })) : [];
  return ready.length ? { ...s, lecons: ready } : { ...s, lecons: [], bientot: true };
});

export const ALL_LESSONS = PALIERS.flatMap((p) => p.lecons.map((l) => ({ ...l, palier: p.id })));

export function findLesson(id) {
  const palier = PALIERS.find((p) => p.lecons.some((l) => l.id === id));
  if (!palier) return null;
  const index = palier.lecons.findIndex((l) => l.id === id);
  return { palier, lecon: palier.lecons[index], index };
}

export function palierStatus(palier, lessonsDone) {
  const done = palier.lecons.filter((l) => lessonsDone[l.id]).length;
  const total = palier.lecons.length;
  return { done, total, complete: total > 0 && done === total };
}

// Un palier s'ouvre quand le precedent est fini (ou si l'eleve a choisi de commencer plus loin)
export function isUnlocked(index, state) {
  if (index === 0) return true;
  if ((state.placement || 0) >= PALIERS[index].id) return true;
  return palierStatus(PALIERS[index - 1], state.lessonsDone).complete;
}

// Dans un palier, les lecons s'ouvrent l'une apres l'autre
export function lessonUnlocked(palierIndex, lessonIndex, state) {
  if (!isUnlocked(palierIndex, state)) return false;
  if (lessonIndex === 0) return true;
  const p = PALIERS[palierIndex];
  if ((state.placement || 0) > p.id) return true;
  return !!state.lessonsDone[p.lecons[lessonIndex - 1].id];
}

// Le palier le plus haut atteint : il decide de l'instrument
export function currentPalier(state) {
  let best = 1;
  PALIERS.forEach((p, i) => { if (isUnlocked(i, state)) best = p.id; });
  return best;
}

// La prochaine lecon a faire
export function nextLesson(state) {
  for (let i = 0; i < PALIERS.length; i++) {
    const p = PALIERS[i];
    for (let j = 0; j < p.lecons.length; j++) {
      if (!state.lessonsDone[p.lecons[j].id] && lessonUnlocked(i, j, state)) return { palier: p, lecon: p.lecons[j] };
    }
  }
  return null;
}
