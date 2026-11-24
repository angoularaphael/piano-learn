import { lang } from '../i18n.js';

const FR = [
  { id: 'premiere-note', titre: 'Première note', desc: 'Toucher le do pour entrer.' },
  { id: 'premiere-lecon', titre: 'C’est parti', desc: 'Réussir une première leçon.' },
  { id: 'trois-etoiles', titre: 'Sans faute', desc: 'Avoir 3 étoiles sur une leçon ou un morceau.' },
  { id: 'palier-1', titre: 'Les bases', desc: 'Terminer le palier Découverte.' },
  { id: 'octave', titre: 'Une octave', desc: 'Apprendre douze notes différentes.' },
  { id: 'vrai-clavier', titre: 'Le vrai clavier', desc: 'Voir la lumière devenir un vrai clavier (palier 3).' },
  { id: 'deux-mains', titre: 'Deux mains', desc: 'Jouer un morceau avec les deux mains.' },
  { id: 'piano-queue', titre: 'Le piano à queue', desc: 'Ouvrir le palier 6 et son piano de concert.' },
  { id: 'serie-7', titre: 'Une semaine', desc: 'Jouer 7 jours d’affilée.' },
];
const EN = {
  'premiere-note': ['First note', 'Touch C to come in.'],
  'premiere-lecon': ['Off you go', 'Pass your first lesson.'],
  'trois-etoiles': ['Flawless', 'Get 3 stars on a lesson or a piece.'],
  'palier-1': ['The basics', 'Finish the Discovery level.'],
  octave: ['One octave', 'Learn twelve different notes.'],
  'vrai-clavier': ['The real keyboard', 'Watch the light become a real keyboard (level 3).'],
  'deux-mains': ['Two hands', 'Play a piece with both hands.'],
  'piano-queue': ['The grand piano', 'Open level 6 and its concert grand.'],
  'serie-7': ['A whole week', 'Play 7 days in a row.'],
};

export const BADGES = lang() === 'en' ? FR.map((b) => ({ ...b, titre: EN[b.id][0], desc: EN[b.id][1] })) : FR;
