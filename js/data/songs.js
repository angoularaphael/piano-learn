// Bibliotheque principale (notation compacte, voir js/score.js).
//
// Morceau :
//   id          kebab-case, unique
//   titre       nom affiche
//   compositeur auteur, ou « Traditionnel »
//   annee       annee exacte (nombre) ou periode (texte) quand on ne la connait pas precisement
//   origine     l'oeuvre ou la source d'ou vient l'air
//   palier      premier palier ou l'eleve a tout ce qu'il faut pour le jouer
//   niveau      difficulte de 1 a 5 a l'interieur de la bibliotheque
//   tempo       noires par minute
//   mesure      '4/4', '3/4', '2/4', '6/8', '3/8'
//   droite / gauche   les notes de chaque main (doigtes : toutes les notes jusqu'au palier 5, main droite ensuite)
//   histoire    une ou deux phrases d'histoire verifiable
//
// Les sources de chaque melodie (et les simplifications) sont notees dans .research/sources-melodies.md.
// « Au clair de la lune » et le thème de l'« Ode à la joie » (palier 1) vivent dans library.js.

const R4 = '-:4';
const R2 = '-:2';
const rests = (bar, n) => Array(n).fill(bar).join(' | ');

// --- Mélodies réutilisées par plusieurs versions ---------------------------------

// J'ai du bon tabac (en do) : A = levée + 4 mesures, B = milieu, A = reprise
const TABAC = 'C4:0.5/1 D4:0.5/2 E4:0.5/3 C4:0.5/1 | D4:1/2 D4:0.5/2 E4:0.5/3 F4:1/4 F4:1/4 | E4:1/3 E4:1/3 C4:0.5/1 D4:0.5/2 E4:0.5/3 C4:0.5/1 | D4:1/2 D4:0.5/2 E4:0.5/3 F4:1/4 G4:1/5 | C4:2/1 G4:1/5 G4:0.5/5 F4:0.5/4 | E4:1/3 D4:0.5/2 E4:0.5/3 F4:1/4 G4:1/5 | D4:2/2 G4:1/5 G4:0.5/5 F4:0.5/4 | E4:1/3 D4:0.5/2 E4:0.5/3 F4:1/4 G4:1/5 | D4:2/2 C4:0.5/1 D4:0.5/2 E4:0.5/3 C4:0.5/1 | D4:1/2 D4:0.5/2 E4:0.5/3 F4:1/4 F4:1/4 | E4:1/3 E4:1/3 C4:0.5/1 D4:0.5/2 E4:0.5/3 C4:0.5/1 | D4:1/2 D4:0.5/2 E4:0.5/3 F4:1/4 G4:1/5 | C4:2/1';

// Oh When the Saints : première moitié (mesures 1 à 8) et seconde moitié (9 à 16)
const SAINTS_1 = '-:1 C4:1/1 E4:1/3 F4:1/4 | G4:4/5 | -:1 C4:1/1 E4:1/3 F4:1/4 | G4:4/5 | -:1 C4:1/1 E4:1/3 F4:1/4 | G4:2/5 E4:2/3 | C4:2/1 E4:2/3 | D4:4/2';
const SAINTS_2 = '-:1 E4:1/3 E4:1/3 D4:1/2 | C4:4/1 | E4:2/3 G4:2/5 | G4:1/5 F4:3/4 | -:2 E4:1/3 F4:1/4 | G4:2/5 E4:2/3 | C4:2/1 D4:2/2 | C4:4/1';
const SAINTS_2_GAUCHE = '-:1 E3:1/3 E3:1/3 D3:1/4 | C3:4/5 | E3:2/3 G3:2/1 | G3:1/1 F3:3/2 | -:2 E3:1/3 F3:1/2 | G3:2/1 E3:2/3 | C3:2/5 D3:2/4 | C3:4/5';

// Ah ! vous dirai-je, maman (2/4) : A (8 mesures) et B (8 mesures)
const AH_A = 'C4:1/1 C4:1/1 | G4:1/4 G4:1/4 | A4:1/5 A4:1/5 | G4:2/4 | F4:1/3 F4:1/3 | E4:1/2 E4:1/2 | D4:1/1 D4:1/1 | C4:2/1';
const AH_B = 'G4:1/4 G4:1/4 | F4:1/3 F4:1/3 | E4:1/2 E4:1/2 | E4:1/2 D4:1/1 | G4:1/4 G4:1/4 | F4:1/3 F4:1/3 | E4:1/2 E4:1/2 | E4:1/2 D4:1/1';
const AH_B_GAUCHE = 'G3:1/1 G3:1/1 | F3:1/2 F3:1/2 | E3:1/3 E3:1/3 | E3:1/3 D3:1/4 | G3:1/1 G3:1/1 | F3:1/2 F3:1/2 | E3:1/3 E3:1/3 | E3:1/3 D3:1/4';

// Au clair de la lune : phrase A (main droite, puis main gauche) et partie B (position de sol)
const CLAIR_A = 'C4:1/1 C4:1/1 C4:1/1 D4:1/2 | E4:2/3 D4:2/2 | C4:1/1 E4:1/3 D4:1/2 D4:1/2 | C4:4/1';
const CLAIR_A_GAUCHE = 'C3:1/5 C3:1/5 C3:1/5 D3:1/4 | E3:2/3 D3:2/4 | C3:1/5 E3:1/3 D3:1/4 D3:1/4 | C3:4/5';
const CLAIR_B = 'D4:1/5 D4:1/5 D4:1/5 D4:1/5 | A3:2/2 A3:2/2 | D4:1/5 C4:1/4 B3:1/3 A3:1/2 | G3:4/1';

// Ode à la joie (en do), seize mesures ; mesure 12 sans la syncope de Beethoven
const ODE_A1 = 'E4:1/3 E4:1/3 F4:1/4 G4:1/5 | G4:1/5 F4:1/4 E4:1/3 D4:1/2 | C4:1/1 C4:1/1 D4:1/2 E4:1/3 | E4:1.5/3 D4:0.5/2 D4:2/2';
const ODE_A2 = 'E4:1/3 E4:1/3 F4:1/4 G4:1/5 | G4:1/5 F4:1/4 E4:1/3 D4:1/2 | C4:1/1 C4:1/1 D4:1/2 E4:1/3 | D4:1.5/2 C4:0.5/1 C4:2/1';
const ODE_A2_GAUCHE = 'E3:1/3 E3:1/3 F3:1/2 G3:1/1 | G3:1/1 F3:1/2 E3:1/3 D3:1/4 | C3:1/5 C3:1/5 D3:1/4 E3:1/3 | D3:1.5/4 C3:0.5/5 C3:2/5';
const ODE_B = 'D4:1/2 D4:1/2 E4:1/3 C4:1/1 | D4:1/2 E4:0.5/3 F4:0.5/4 E4:1/3 C4:1/1 | D4:1/2 E4:0.5/3 F4:0.5/4 E4:1/3 D4:1/2';

// Lettre à Élise : la partie A (sans la levée), main droite et main gauche
const ELISE_A = 'E5:0.25/5 D#5:0.25/4 E5:0.25/5 B4:0.25/2 D5:0.25/4 C5:0.25/3 | A4:0.5/1 -:0.25 C4:0.25/1 E4:0.25/2 A4:0.25/4 | B4:0.5/5 -:0.25 E4:0.25/1 G#4:0.25/3 B4:0.25/4 | C5:0.5/5 -:0.25 E4:0.25/1 E5:0.25/5 D#5:0.25/4 | E5:0.25/5 D#5:0.25/4 E5:0.25/5 B4:0.25/2 D5:0.25/4 C5:0.25/3 | A4:0.5/1 -:0.25 C4:0.25/1 E4:0.25/2 A4:0.25/4 | B4:0.5/5 -:0.25 E4:0.25/1 C5:0.25/4 B4:0.25/3';
const ELISE_A_GAUCHE = '-:1.5 | A2:0.25/5 E3:0.25/2 A3:0.25/1 -:0.75 | E2:0.25/5 E3:0.25/2 G#3:0.25/1 -:0.75 | A2:0.25/5 E3:0.25/2 A3:0.25/1 -:0.75 | -:1.5 | A2:0.25/5 E3:0.25/2 A3:0.25/1 -:0.75 | E2:0.25/5 E3:0.25/2 G#3:0.25/1 -:0.75';

// Marche turque : le thème (8 mesures, sans la levée)
const TURCA = 'C5:0.5/3 -:0.5 D5:0.25/3 C5:0.25/2 B4:0.25/1 C5:0.25/2 | E5:0.5/4 -:0.5 F5:0.25/4 E5:0.25/3 D#5:0.25/2 E5:0.25/1 | B5:0.25/4 A5:0.25/3 G#5:0.25/2 A5:0.25/1 B5:0.25/4 A5:0.25/3 G#5:0.25/2 A5:0.25/1 | C6:1/5 A5:0.5/2 C6:0.5/5 | B5:0.5/5 F#5+A5:0.5/2+4 E5+G5:0.5/1+3 F#5+A5:0.5/2+4 | B5:0.5/5 F#5+A5:0.5/2+4 E5+G5:0.5/1+3 F#5+A5:0.5/2+4 | B5:0.5/5 F#5+A5:0.5/2+4 E5+G5:0.5/1+3 D#5+F#5:0.5/2+4';
const TURCA_GAUCHE = 'A3:0.5/5 C4+E4:0.5/2+1 C4+E4:0.5/2+1 C4+E4:0.5/2+1 | A3:0.5/5 C4+E4:0.5/2+1 C4+E4:0.5/2+1 C4+E4:0.5/2+1 | A3:0.5/5 C4+E4:0.5/2+1 A3:0.5/5 C4+E4:0.5/2+1 | A3:0.5/5 C4+E4:0.5/2+1 C4+E4:0.5/2+1 C4+E4:0.5/2+1 | E3:0.5/5 B3+E4:0.5/2+1 B3+E4:0.5/2+1 B3+E4:0.5/2+1 | E3:0.5/5 B3+E4:0.5/2+1 B3+E4:0.5/2+1 B3+E4:0.5/2+1 | E3:0.5/5 B3+E4:0.5/2+1 B2:0.5/5 B3:0.5/1';

// Dans l'antre du roi de la montagne (en la mineur) : A, puis A une octave plus haut, B, puis B une octave plus haut
const ROI_A = (o, top) => `A${o}:0.5/1 B${o}:0.5/2 C${o + 1}:0.5/3 D${o + 1}:0.5/4 E${o + 1}:0.5/5 C${o + 1}:0.5/3 E${o + 1}:1/5 | D#${o + 1}:0.5/4 B${o}:0.5/2 D#${o + 1}:1/4 D${o + 1}:0.5/4 Bb${o}:0.5/2 D${o + 1}:1/4 | A${o}:0.5/1 B${o}:0.5/2 C${o + 1}:0.5/3 D${o + 1}:0.5/4 E${o + 1}:0.5/5 C${o + 1}:0.5/1 E${o + 1}:0.5/3 A${o + 1}:0.5/5 | G${o + 1}:0.5/4 E${o + 1}:0.5/2 C${o + 1}:0.5/1 E${o + 1}:0.5/2 ${top}`;
const ROI_B = (o, top) => `E${o}:0.5/1 F#${o}:0.5/2 G#${o}:0.5/3 A${o}:0.5/4 B${o}:0.5/5 G#${o}:0.5/3 B${o}:1/5 | C${o + 1}:0.5/4 G#${o}:0.5/1 C${o + 1}:1/4 B${o}:0.5/3 G#${o}:0.5/1 B${o}:1/3 | E${o}:0.5/1 F#${o}:0.5/2 G#${o}:0.5/3 A${o}:0.5/4 B${o}:0.5/5 G#${o}:0.5/3 B${o}:1/5 | C${o + 1}:0.5/4 G#${o}:0.5/1 C${o + 1}:1/4 ${top}`;
const ROI_A_GAUCHE = 'A2:1/5 E3:1/1 A2:1/5 E3:1/1 | A2:1/5 E3:1/1 A2:1/5 E3:1/1 | A2:1/5 E3:1/1 A2:1/5 E3:1/1 | C3:1/5 G3:1/1 C3:1/5 G3:1/1';
const ROI_B_GAUCHE = 'E3:1/5 B3:1/1 E3:1/5 B3:1/1 | C3:1/5 G#3:1/2 E3:1/4 B3:1/1 | E3:1/5 B3:1/1 E3:1/5 B3:1/1 | C3:1/5 G#3:1/2 E3:1/4 B3:1/1';

// Prélude en do : un demi-temps de silence, puis l'accord brisé à la main droite (deux fois par mesure)
const prelR = (a, b, c, f) => Array(2).fill(`-:0.5 ${a}:0.25/1 ${b}:0.25/${f} ${c}:0.25/5 ${a}:0.25/1 ${b}:0.25/${f} ${c}:0.25/5`).join(' ');
const prelL = (a, b, f) => Array(2).fill(`${a}:0.25/5 ${b}:1.75/${f}`).join(' ');

// Hanon n° 1 : motif montant (do mi fa sol la sol fa mi) et motif descendant, main droite et main gauche
const LETTRES = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
const note = (i, o) => `${LETTRES[((i % 7) + 7) % 7]}${o + Math.floor(i / 7)}`;
const hanonUp = (i, o, f) => [0, 2, 3, 4, 5, 4, 3, 2].map((k, n) => `${note(i + k, o)}:0.25/${f[n]}`).join(' ');
const hanonDown = (i, o, f) => [0, -2, -3, -4, -5, -4, -3, -2].map((k, n) => `${note(i + k, o)}:0.25/${f[n]}`).join(' ');
const hanon = (o, up, down, fin) => [0, 1, 2, 3].map((i) => hanonUp(i, o, up))
  .concat([8, 7, 6, 5, 4].map((i) => hanonDown(i, o, down)))
  .concat([fin]).join(' | ');

// Malbrough s'en va-t-en guerre (en do, 6/8) : la phrase principale, sans la levée ni la dernière note
const MALBROUGH_A = 'E4:1/3 E4:0.5/3 E4:1/3 D4:0.5/2 | F4:1.5/4 E4:0.75/3 F4:0.25/4 E4:0.5/3 | D4:1/2 D4:0.5/2 D4:0.75/2 C4:0.25/1 D4:0.5/2 | E4:1.5/3 C4:1/1 G3:0.5/1 | E4:1/3 E4:0.5/3 E4:1/3 D4:0.5/2 | F4:1.5/4 E4:1/3 G4:0.5/5 | E4:1/3 C4:0.5/1 D4:1/2 B3:0.5/1';

// Canon de Pachelbel : la basse obstinée (deux mesures)
const CANON_BASSE = 'C3:1/1 G2:1/4 A2:1/3 E2:1/5 | F2:1/4 C2:1/5 F2:1/2 G2:1/1';

// Accords de la main gauche (position serrée autour du do grave)
const DO = 'C3+E3+G3';
const FA = 'C3+F3+A3';
const SOL = 'B2+D3+G3';
const LAm = 'C3+E3+A3';
const acc = (a, d) => `${a}:${d}/${a === FA ? '5+2+1' : '5+3+1'}`;

// Gymnopédie (en do) : basse sur le premier temps, accord sur les deux suivants
const GYM_FA = 'F2:1/5 A3+C4+E4:2/4+2+1';
const GYM_DO = 'C2:1/5 G3+B3+E4:2/4+2+1';

export const SONGS = [
  // ---------------------------------------------------------------- Palier 1
  {
    id: 'j-ai-du-bon-tabac', titre: 'J’ai du bon tabac', compositeur: 'Traditionnel', annee: 'XVIIIe siècle',
    origine: 'Chanson populaire française', palier: 1, niveau: 2, tempo: 96, mesure: '4/4',
    droite: TABAC,
    histoire: 'Cette chanson du XVIIIe siècle est souvent attribuée à l’abbé de L’Attaignant. Jean-Baptiste Weckerlin l’a publiée en 1870 dans ses « Chansons et rondes enfantines ».',
  },
  {
    id: 'oh-when-the-saints', titre: 'Oh When the Saints', compositeur: 'Traditionnel', annee: 'fin du XIXe siècle',
    origine: 'Chant gospel américain « When the Saints Go Marching In »', palier: 1, niveau: 2, tempo: 120, mesure: '4/4',
    droite: `${SAINTS_1} | ${SAINTS_2}`,
    histoire: 'Ce chant religieux afro-américain est devenu l’hymne des fanfares de La Nouvelle-Orléans. Louis Armstrong l’a rendu célèbre dans le monde entier avec son enregistrement de 1938.',
  },
  {
    id: 'a-la-claire-fontaine', titre: 'À la claire fontaine', compositeur: 'Traditionnel', annee: 'XVIIe siècle',
    origine: 'Chanson populaire française', palier: 1, niveau: 2, tempo: 100, mesure: '4/4',
    droite: 'C4:2/1 C4:1/1 E4:1/3 | E4:1/3 D4:1/2 E4:1/3 D4:1/2 | C4:2/1 C4:1/1 E4:1/3 | E4:1/3 D4:1/2 E4:2/3 | E4:2/3 E4:1/3 D4:1/2 | C4:1/1 E4:1/3 G4:1/5 E4:1/3 | G4:2/5 G4:1/5 E4:1/3 | C4:1/1 E4:1/3 D4:2/2 | C4:2/1 C4:1/1 E4:1/3 | E4:1/3 D4:0.5/2 C4:0.5/1 E4:1/3 C4:1/1 | E4:2/3 E4:1/3 D4:0.5/2 C4:0.5/1 | E4:1/3 D4:1/2 C4:2/1',
    histoire: 'Chantée en France depuis des siècles, elle a traversé l’Atlantique avec les colons : au Québec, les coureurs des bois la chantaient en canot, puis les Patriotes en 1837.',
  },

  // ---------------------------------------------------------------- Palier 2
  {
    id: 'ah-vous-dirai-je', titre: 'Ah ! vous dirai-je, maman', compositeur: 'Traditionnel', annee: 1761,
    origine: 'Air français', palier: 2, niveau: 1, tempo: 100, mesure: '2/4',
    droite: `${AH_A} | ${AH_B} | ${AH_A}`,
    histoire: 'Cet air français est imprimé pour la première fois en 1761. Mozart en a tiré douze variations pour piano, et les Anglais le chantent sous le nom de « Twinkle, Twinkle, Little Star ».',
  },
  {
    id: 'ainsi-font', titre: 'Ainsi font, font, font', compositeur: 'Traditionnel', annee: 'XIXe siècle',
    origine: 'Comptine française', palier: 2, niveau: 2, tempo: 100, mesure: '2/4',
    droite: 'C4:0.5/1 E4:0.5/2 | G4:1/4 A4:1/5 | G4:1/4 C4:0.5/1 C4:0.5/1 | D4:0.5/2 F4:0.5/4 E4:0.5/3 D4:0.5/2 | E4:0.5/3 C4:0.5/1 C4:0.5/1 E4:0.5/2 | G4:1/4 A4:1/5 | G4:1/4 C4:0.5/1 C4:0.5/1 | D4:0.5/2 F4:0.5/4 E4:0.5/3 D4:0.5/2 | C4:1/1',
    histoire: 'Comptine des petites marionnettes, qu’on chante en faisant tourner les mains. Jean-Baptiste Weckerlin l’a publiée en 1870 dans ses « Chansons et rondes enfantines ».',
  },
  {
    id: 'sur-le-pont-d-avignon', titre: 'Sur le pont d’Avignon', compositeur: 'Traditionnel', annee: 'XVe siècle',
    origine: 'Chanson populaire française (refrain)', palier: 2, niveau: 2, tempo: 112, mesure: '4/4',
    droite: 'C4:1/1 C4:1/1 C4:2/1 | D4:1/2 D4:1/2 D4:2/2 | E4:1.5/3 F4:0.5/4 G4:1/5 C4:1/1 | B3:1.5/2 C4:0.5/3 D4:1/4 G3:1/1 | C4:1/1 C4:1/1 C4:2/1 | D4:1/2 D4:1/2 D4:2/2 | E4:1.5/3 F4:0.5/4 G4:1/5 C4:1/1 | D4:1/2 B3:1/1 C4:1/2 -:1',
    histoire: 'La chanson évoque le pont Saint-Bénézet, construit au XIIe siècle sur le Rhône. Elle remonterait au XVe siècle, et l’opéra-comique « Le Sourd ou l’Auberge pleine » d’Adolphe Adam l’a rendue célèbre en 1853.',
  },
  {
    id: 'frere-jacques', titre: 'Frère Jacques', compositeur: 'Traditionnel', annee: 'vers 1780',
    origine: 'Canon français', palier: 2, niveau: 2, tempo: 100, mesure: '4/4',
    droite: 'C4:1/1 D4:1/2 E4:1/3 C4:1/1 | C4:1/1 D4:1/2 E4:1/3 C4:1/1 | E4:1/3 F4:1/4 G4:2/5 | E4:1/3 F4:1/4 G4:2/5 | G4:0.5/4 A4:0.5/5 G4:0.5/4 F4:0.5/3 E4:1/2 C4:1/1 | G4:0.5/4 A4:0.5/5 G4:0.5/4 F4:0.5/3 E4:1/2 C4:1/1 | C4:1/4 G3:1/1 C4:2/4 | C4:1/4 G3:1/1 C4:2/4',
    histoire: 'La plus ancienne trace de ce canon est un manuscrit français des années 1780. Gustav Mahler l’a repris en mineur, comme une marche funèbre, dans sa Première Symphonie.',
  },

  // ---------------------------------------------------------------- Palier 3
  {
    id: 'ode-joie', titre: 'Ode à la joie (complète)', compositeur: 'Ludwig van Beethoven', annee: 1824,
    origine: 'Symphonie n° 9, dernier mouvement', palier: 3, niveau: 2, tempo: 100, mesure: '4/4',
    droite: `${ODE_A1} | ${rests(R4, 4)} | ${ODE_B} | C4:1/1 D4:1/2 -:2 | ${ODE_A2}`,
    gauche: `${rests(R4, 4)} | ${ODE_A2_GAUCHE} | ${rests(R4, 3)} | -:2 G3:2/1 | ${rests(R4, 4)}`,
    histoire: 'Dans la symphonie, ce thème de seize mesures est d’abord joué par les violoncelles et les contrebasses seuls, avant d’être repris par tout l’orchestre puis par les voix.',
  },
  {
    id: 'frere-jacques-echo', titre: 'Frère Jacques en écho', compositeur: 'Traditionnel', annee: 'vers 1780',
    origine: 'Canon français', palier: 3, niveau: 2, tempo: 100, mesure: '4/4',
    droite: `C4:1/1 D4:1/2 E4:1/3 C4:1/1 | ${R4} | E4:1/3 F4:1/4 G4:2/5 | ${R4} | G4:0.5/4 A4:0.5/5 G4:0.5/4 F4:0.5/3 E4:1/2 C4:1/1 | G4:0.5/4 A4:0.5/5 G4:0.5/4 F4:0.5/3 E4:1/2 C4:1/1 | C4:1/1 -:1 C4:2/1 | C4:1/1 -:1 C4:2/1`,
    gauche: `${R4} | C3:1/5 D3:1/4 E3:1/3 C3:1/5 | ${R4} | E3:1/3 F3:1/2 G3:2/1 | ${R4} | ${R4} | -:1 G3:1/1 -:2 | -:1 G3:1/1 -:2`,
    histoire: 'Frère Jacques est un canon : plusieurs voix chantent le même air en décalé. Ici, la main gauche répond à la droite une octave plus bas, et les deux pouces se partagent le « ding, dang, dong ».',
  },
  {
    id: 'j-ai-du-bon-tabac-deux-mains', titre: 'J’ai du bon tabac (à deux mains)', compositeur: 'Traditionnel', annee: 'XVIIIe siècle',
    origine: 'Chanson populaire française', palier: 3, niveau: 2, tempo: 96, mesure: '4/4',
    droite: `C4:0.5/1 D4:0.5/2 E4:0.5/3 C4:0.5/1 | D4:1/2 D4:0.5/2 E4:0.5/3 F4:1/4 F4:1/4 | E4:1/3 E4:1/3 C4:0.5/1 D4:0.5/2 E4:0.5/3 C4:0.5/1 | D4:1/2 D4:0.5/2 E4:0.5/3 F4:1/4 G4:1/5 | C4:2/1 -:2 | ${rests(R4, 3)} | -:2 C4:0.5/1 D4:0.5/2 E4:0.5/3 C4:0.5/1 | D4:1/2 D4:0.5/2 E4:0.5/3 F4:1/4 F4:1/4 | E4:1/3 E4:1/3 C4:0.5/1 D4:0.5/2 E4:0.5/3 C4:0.5/1 | D4:1/2 D4:0.5/2 E4:0.5/3 F4:1/4 G4:1/5 | C4:2/1`,
    gauche: `-:2 | ${rests(R4, 3)} | -:2 G3:1/1 G3:0.5/1 F3:0.5/2 | E3:1/3 D3:0.5/4 E3:0.5/3 F3:1/2 G3:1/1 | D3:2/4 G3:1/1 G3:0.5/1 F3:0.5/2 | E3:1/3 D3:0.5/4 E3:0.5/3 F3:1/2 G3:1/1 | D3:2/4 -:2 | ${rests(R4, 3)} | -:2`,
    histoire: 'Dans son recueil de 1870, Weckerlin note que l’air date du XVIIIe siècle. Ici, la partie du milieu, « J’en ai du fin et du râpé », passe à la main gauche.',
  },

  // ---------------------------------------------------------------- Palier 4
  {
    id: 'ah-vous-dirai-je-deux-mains', titre: 'Ah ! vous dirai-je, maman (à deux mains)', compositeur: 'Traditionnel', annee: 1761,
    origine: 'Air français', palier: 4, niveau: 2, tempo: 100, mesure: '2/4',
    droite: `${AH_A} | ${rests(R2, 8)} | ${AH_A}`,
    gauche: `${rests(R2, 8)} | ${AH_B_GAUCHE} | ${rests(R2, 8)}`,
    histoire: 'Mozart a écrit ses douze variations sur cet air à Vienne, vers 1781-1782. Ici, la partie du milieu se lit en clé de fa, à la main gauche.',
  },
  {
    id: 'au-clair-de-la-lune-deux-mains', titre: 'Au clair de la lune (à deux mains)', compositeur: 'Traditionnel', annee: 'XVIIIe siècle',
    origine: 'Chanson populaire française', palier: 4, niveau: 2, tempo: 92, mesure: '4/4',
    droite: `${CLAIR_A} | ${rests(R4, 4)} | ${CLAIR_B} | ${CLAIR_A}`,
    gauche: `${rests(R4, 4)} | ${CLAIR_A_GAUCHE} | ${rests(R4, 8)}`,
    histoire: 'On a longtemps attribué cet air à Jean-Baptiste Lully, sans aucune preuve. Ici, la deuxième phrase se lit en clé de fa et se joue une octave plus bas.',
  },
  {
    id: 'oh-when-the-saints-deux-mains', titre: 'Oh When the Saints (à deux mains)', compositeur: 'Traditionnel', annee: 'fin du XIXe siècle',
    origine: 'Chant gospel américain', palier: 4, niveau: 2, tempo: 120, mesure: '4/4',
    droite: `${SAINTS_1} | ${rests(R4, 8)}`,
    gauche: `${rests(R4, 8)} | ${SAINTS_2_GAUCHE}`,
    histoire: 'À La Nouvelle-Orléans, les fanfares jouaient ce chant lentement en allant au cimetière, puis joyeusement au retour. Ici, la seconde moitié passe à la main gauche.',
  },

  // ---------------------------------------------------------------- Palier 5
  {
    id: 'jingle-bells', titre: 'Jingle Bells (refrain)', compositeur: 'James Lord Pierpont', annee: 1857,
    origine: '« The One Horse Open Sleigh »', palier: 5, niveau: 2, tempo: 120, mesure: '4/4',
    droite: 'E4:1/3 E4:1/3 E4:2/3 | E4:1/3 E4:1/3 E4:2/3 | E4:1/3 G4:1/5 C4:1.5/1 D4:0.5/2 | E4:2/3 -:2 | F4:1/4 F4:1/4 F4:1.5/4 F4:0.5/4 | F4:1/4 E4:1/3 E4:1/3 E4:0.5/3 E4:0.5/3 | E4:1/3 D4:1/2 D4:1/2 E4:1/3 | D4:2/2 G4:2/5 | E4:1/3 E4:1/3 E4:2/3 | E4:1/3 E4:1/3 E4:2/3 | E4:1/3 G4:1/5 C4:1.5/1 D4:0.5/2 | E4:2/3 -:2 | F4:1/4 F4:1/4 F4:1.5/4 F4:0.5/4 | F4:1/4 E4:1/3 E4:1/3 E4:0.5/3 E4:0.5/3 | G4:1/5 G4:1/5 F4:1/4 D4:1/2 | C4:3/1 -:1',
    histoire: 'James Lord Pierpont publie cette chanson à Boston en 1857 sous le titre « The One Horse Open Sleigh ». Écrite pour l’hiver, et non pour Noël, elle est devenue en 1965 la première chanson jouée dans l’espace.',
  },
  {
    id: 'joyeux-anniversaire', titre: 'Joyeux anniversaire', compositeur: 'Mildred J. Hill et Patty Smith Hill', annee: 1893,
    origine: '« Good Morning to All »', palier: 5, niveau: 2, tempo: 100, mesure: '3/4',
    droite: 'G3:0.75/1 G3:0.25/1 | A3:1/2 G3:1/1 C4:1/4 | B3:2/3 G3:0.75/1 G3:0.25/1 | A3:1/2 G3:1/1 D4:1/5 | C4:2/4 G3:0.75/1 G3:0.25/1 | G4:1/5 E4:1/3 C4:1/1 | B3:1/2 A3:1/1 F4:0.75/5 F4:0.25/5 | E4:1/4 C4:1/2 D4:1/3 | C4:2/2',
    histoire: 'La mélodie vient de « Good Morning to All », une chanson pour enfants publiée en 1893 par deux sœurs institutrices du Kentucky, Mildred et Patty Hill.',
  },
  {
    id: 'auld-lang-syne', titre: 'Auld Lang Syne', compositeur: 'Traditionnel écossais', annee: 1788,
    origine: 'Poème de Robert Burns sur un air populaire', palier: 5, niveau: 2, tempo: 84, mesure: '4/4',
    droite: 'G3:1/1 | C4:1.5/1 C4:0.5/1 C4:1/1 E4:1/3 | D4:1.5/2 C4:0.5/1 D4:1/2 E4:1/3 | C4:1.5/1 C4:0.5/1 E4:1/3 G4:1/4 | A4:3/5 A4:1/5 | G4:1.5/4 E4:0.5/3 E4:1/3 C4:1/1 | D4:1.5/2 C4:0.5/1 D4:1/2 E4:1/3 | C4:1.5/3 A3:0.5/2 A3:1/2 G3:1/1 | C4:3/1 A4:1/5 | G4:1.5/4 E4:0.5/3 E4:1/3 C4:1/1 | D4:1.5/2 C4:0.5/1 D4:1/2 A4:1/5 | G4:1.5/4 E4:0.5/3 E4:1/3 G4:1/4 | A4:3/5 A4:1/5 | G4:1.5/4 E4:0.5/3 E4:1/3 C4:1/1 | D4:1.5/2 C4:0.5/1 D4:1/2 E4:1/3 | C4:1.5/3 A3:0.5/2 A3:1/2 G3:1/1 | C4:3/3',
    histoire: 'Robert Burns envoie ce poème en 1788, d’après une vieille chanson écossaise. En France, on le chante sous le titre « Ce n’est qu’un au revoir ».',
  },
  {
    id: 'il-pleut-bergere', titre: 'Il pleut, il pleut, bergère', compositeur: 'Louis-Victor Simon', annee: 1780,
    origine: '« Laure et Pétrarque », paroles de Fabre d’Églantine', palier: 5, niveau: 3, tempo: 90, mesure: '6/8',
    droite: '-:1 E4:0.5/3 | G4:1/5 E4:0.5/3 G4:1/5 E4:0.5/3 | C4:1.5/1 G3:1/1 -:0.5 | C4:0.5/2 B3:0.5/1 C4:0.5/2 D4:1/3 D4:0.5/3 | E4:3/4 | E4:0.5/4 D4:0.5/3 E4:0.5/4 F4:1/5 F4:0.5/5 | G4:1.5/5 E4:1/3 -:0.5 | G4:0.5/4 A4:0.5/5 G4:0.5/4 F4:1/3 E4:0.5/2 | E4:1.5/2 D4:1/1 -:0.5 | D4:0.5/1 E4:0.5/2 D4:0.5/1 F4:1/3 F4:0.5/3 | E4:1.5/2 G4:1/4 -:0.5 | F4:0.5/3 E4:0.5/2 D4:0.5/1 E4:1/2 C4:0.5/1 | E4:1.5/3 D4:1/2 E4:0.5/3 | G4:1/5 E4:0.5/3 G4:1/5 E4:0.5/3 | F4:1.5/3 A4:1.5/5 | G4:0.5/4 A4:0.5/5 G4:0.5/4 D4:1/1 E4:0.5/2 | C4:1.5/1',
    histoire: 'Fabre d’Églantine en écrit les paroles en 1780, sur une musique de Louis-Victor Simon. Le poète deviendra plus tard député sous la Révolution.',
  },
  {
    id: 'bon-roi-dagobert', titre: 'Le bon roi Dagobert', compositeur: 'Traditionnel', annee: 'XVIIIe siècle',
    origine: 'Chanson populaire française', palier: 5, niveau: 2, tempo: 110, mesure: '6/8',
    droite: 'E4:0.5/3 | E4:1/3 D4:0.5/2 D4:1/2 C4:0.5/1 | C4:1.5/1 D4:1.5/2 | E4:0.5/3 F4:0.5/4 E4:0.5/3 D4:0.5/2 C4:0.5/1 D4:0.5/2 | C4:1.5/1 -:0.5 C4:0.5/1 D4:0.5/2 | E4:1/3 E4:0.5/3 E4:0.5/3 F4:0.5/4 G4:0.5/5 | D4:1/2 D4:0.5/2 D4:0.5/2 C4:0.5/1 D4:0.5/2 | E4:1/3 E4:0.5/3 E4:0.5/3 F4:0.5/4 G4:0.5/5 | D4:1/2 D4:0.5/2 D4:1/2 E4:0.5/3 | E4:1/3 D4:0.5/2 D4:1/2 C4:0.5/1 | C4:1.5/1 D4:1.5/2 | E4:0.5/3 F4:0.5/4 E4:0.5/3 D4:0.5/2 C4:0.5/1 D4:0.5/2 | C4:2.5/1',
    histoire: 'La chanson se moque du roi mérovingien Dagobert Ier et de son conseiller saint Éloi. Ses premières paroles datent de la Révolution, pour tourner la monarchie en ridicule.',
  },
  {
    id: 'mon-beau-sapin', titre: 'Mon beau sapin', compositeur: 'Traditionnel allemand', annee: 1824,
    origine: '« O Tannenbaum »', palier: 5, niveau: 3, tempo: 90, mesure: '3/4',
    droite: 'G3:0.5/1 | C4:0.75/2 C4:0.25/2 C4:1/2 D4:1/3 | E4:0.75/4 E4:0.25/4 E4:1.5/4 E4:0.5/4 | D4:0.5/3 E4:0.5/4 F4:1/5 B3:1/1 | D4:1/3 C4:1/2 -:0.5 G4:0.5/5 | G4:0.5/4 E4:0.5/2 A4:1.5/5 G4:0.5/4 | G4:0.5/4 F4:0.5/3 F4:1.5/3 F4:0.5/3 | F4:0.5/3 D4:0.5/1 G4:1.5/4 F4:0.5/3 | F4:0.5/3 E4:0.5/2 E4:1/2 -:0.5 G3:0.5/1 | C4:0.75/2 C4:0.25/2 C4:1/2 D4:1/3 | E4:0.75/4 E4:0.25/4 E4:1.5/4 E4:0.5/4 | D4:0.5/3 E4:0.5/4 F4:1/5 B3:1/1 | D4:1/3 C4:1/2 -:0.5',
    histoire: 'L’air est une mélodie populaire allemande. Ernst Anschütz écrit en 1824 les paroles de « O Tannenbaum », devenu un chant de Noël dans toute l’Europe.',
  },
  {
    id: 'berceuse-brahms', titre: 'Berceuse de Brahms', compositeur: 'Johannes Brahms', annee: 1868,
    origine: '« Wiegenlied », op. 49 n° 4', palier: 5, niveau: 3, tempo: 72, mesure: '3/4',
    droite: 'E4:0.5/1 E4:0.5/1 | G4:1.5/3 E4:0.5/1 E4:1/1 | G4:1/3 -:1 E4:0.5/1 G4:0.5/3 | C5:1/5 B4:1.5/4 A4:0.5/3 | A4:1/3 G4:1/2 D4:0.5/1 E4:0.5/2 | F4:1/3 D4:1/1 D4:0.5/1 E4:0.5/2 | F4:1/3 -:1 D4:0.5/1 F4:0.5/3 | B4:0.5/5 A4:0.5/4 G4:1/3 B4:1/5 | C5:1/5 -:1 C4:0.5/1 C4:0.5/1 | C5:2/5 A4:0.5/3 F4:0.5/1 | G4:2/5 E4:0.5/3 C4:0.5/1 | F4:1/3 G4:1/4 A4:1/5 | G4:2/5 C4:0.5/1 C4:0.5/1 | C5:2/5 A4:0.5/3 F4:0.5/1 | G4:2/5 E4:0.5/3 C4:0.5/1 | F4:1/4 E4:1/3 D4:1/2 | C4:2/1',
    histoire: 'Brahms compose cette berceuse en 1868 pour la naissance du deuxième enfant de son amie Bertha Faber.',
  },
  {
    id: 'savez-vous-planter-les-choux', titre: 'Savez-vous planter les choux ?', compositeur: 'Traditionnel', annee: 'XIXe siècle',
    origine: 'Ronde enfantine française', palier: 5, niveau: 2, tempo: 120, mesure: '6/8',
    droite: 'C4:1/1 E4:0.5/2 | G4:1/3 C5:0.5/5 G4:1/3 E4:0.5/2 | C4:1.5/1 B3:1/1 C4:0.5/2 | D4:1/3 D4:0.5/3 C4:1/2 D4:0.5/3 | E4:1/4 C4:0.5/2 C4:1/2 E4:0.5/4 | G4:1/3 C5:0.5/5 G4:1/3 E4:0.5/2 | C4:1.5/1 B3:1/1 C4:0.5/2 | D4:1/3 F4:0.5/5 E4:1/4 D4:0.5/3 | C4:1/2 -:0.5',
    histoire: 'Ronde publiée par Weckerlin en 1870. À chaque couplet, on « plante les choux » avec une autre partie du corps : le doigt, le pied, le genou, le nez…',
  },
  {
    id: 'il-etait-une-bergere', titre: 'Il était une bergère', compositeur: 'Traditionnel', annee: 'XVIIIe siècle',
    origine: 'Chanson populaire française', palier: 5, niveau: 2, tempo: 120, mesure: '6/8',
    droite: 'G3:0.5/1 | C4:1/3 D4:0.5/4 E4:1/5 D4:0.5/4 | C4:1.5/3 C4:1/3 G3:0.5/1 | A3:1/2 A3:0.5/2 G3:0.5/1 G3:0.5/1 G3:0.5/1 | A3:1/2 A3:0.5/2 G3:1/1 G3:0.5/1 | C4:1/3 D4:0.5/4 E4:1/5 D4:0.5/4 | C4:1.5/3 C4:1/1 G4:0.5/5 | E4:1/3 C4:0.5/1 D4:1/2 G3:0.5/1 | C4:1/1 C4:0.5/1 C4:1/1 G4:0.5/5 | E4:1/3 C4:0.5/1 D4:1/2 G3:0.5/1 | C4:2/1 -:0.5',
    histoire: 'Ronde française publiée par Weckerlin dans ses « Chansons et rondes enfantines » en 1870. La bergère y fait un fromage avec le lait de ses moutons… que le chat vient goûter.',
  },
  {
    id: 'malbrough', titre: 'Malbrough s’en va-t-en guerre', compositeur: 'Traditionnel', annee: 'XVIIIe siècle',
    origine: 'Chanson populaire française', palier: 5, niveau: 2, tempo: 110, mesure: '6/8',
    droite: `G3:0.5/1 | ${MALBROUGH_A} | C4:2/2 -:0.5 G4:0.5/4 | G4:1/4 E4:0.5/2 A4:1/5 A4:0.5/5 | G4:2.5/4 G4:0.5/4 | G4:1/4 E4:0.5/2 A4:1/5 A4:0.5/5 | G4:2.5/4 G3:0.5/1 | ${MALBROUGH_A} | C4:2/2 -:0.5`,
    histoire: 'Cette chanson se moque du duc de Marlborough, général anglais ennemi de la France au début du XVIIIe siècle. Elle devient très populaire en 1781, quand la nourrice du Dauphin la chante au petit prince.',
  },

  // ---------------------------------------------------------------- Palier 6
  {
    id: 'canon-pachelbel', titre: 'Canon de Pachelbel', compositeur: 'Johann Pachelbel', annee: 'entre 1680 et 1706',
    origine: 'Canon et gigue en ré majeur', palier: 6, niveau: 3, tempo: 60, mesure: '4/4',
    droite: `${rests(R4, 2)} | E5:1/5 D5:1/4 C5:1/3 B4:1/2 | A4:1/1 G4:1/1 A4:1/2 B4:1/3 | C5:1/4 B4:1/3 A4:1/2 G4:1/1 | F4:1/3 E4:1/2 F4:1/3 D4:1/1 | C4:0.5/1 E4:0.5/3 G4:0.5/5 F4:0.5/4 E4:0.5/3 C4:0.5/1 E4:0.5/3 D4:0.5/2 | C4:0.5/2 A3:0.5/1 C4:0.5/2 G4:0.5/3 F4:0.5/2 A4:0.5/4 G4:0.5/3 F4:0.5/2 | E4:4/1`,
    gauche: `${CANON_BASSE} | ${CANON_BASSE} | ${CANON_BASSE} | ${CANON_BASSE} | C3:4/1`,
    histoire: 'Pachelbel l’écrit pour trois violons et basse, entre 1680 et 1706. Oublié pendant près de trois siècles, il devient célèbre après un enregistrement de 1968.',
  },
  {
    id: 'ode-joie-deux-mains', titre: 'Ode à la joie (à deux mains)', compositeur: 'Ludwig van Beethoven', annee: 1824,
    origine: 'Symphonie n° 9, dernier mouvement', palier: 6, niveau: 3, tempo: 96, mesure: '4/4',
    droite: `${ODE_A1} | ${ODE_A2} | ${ODE_B} | C4:1/2 D4:1/3 G3:2/1 | ${ODE_A2}`,
    gauche: 'C3:4/1 | G2:4/5 | C3:4/1 | G2:4/5 | C3:4/1 | G2:4/5 | C3:4/1 | G2:2/5 C3:2/1 | G2:4/5 | G2:2/5 C3:2/1 | G2:2/5 C3:2/1 | C3:2/1 G2:2/5 | C3:4/1 | G2:4/5 | C3:4/1 | G2:2/5 C3:2/1',
    histoire: 'Le poème de Schiller date de 1785. Beethoven songeait déjà à le mettre en musique au début des années 1790, plus de trente ans avant sa Neuvième Symphonie.',
  },
  {
    id: 'hanon-1', titre: 'Hanon, exercice n° 1 (simplifié)', compositeur: 'Charles-Louis Hanon', annee: 1873,
    origine: '« Le Pianiste virtuose en 60 exercices »', palier: 6, niveau: 2, tempo: 60, mesure: '2/4',
    droite: hanon(4, [1, 2, 3, 4, 5, 4, 3, 2], [5, 4, 3, 2, 1, 2, 3, 4], 'C4:2/1'),
    gauche: hanon(3, [5, 4, 3, 2, 1, 2, 3, 4], [1, 2, 3, 4, 5, 4, 3, 2], 'C3:2/5'),
    histoire: 'Charles-Louis Hanon, professeur de piano à Boulogne-sur-Mer, publie ses exercices en 1873. Pianistes débutants et confirmés les travaillent encore pour rendre leurs doigts égaux.',
  },
  {
    id: 'douce-nuit', titre: 'Douce nuit', compositeur: 'Franz Xaver Gruber', annee: 1818,
    origine: '« Stille Nacht », paroles de Joseph Mohr', palier: 6, niveau: 3, tempo: 60, mesure: '6/8',
    droite: 'G4:0.75/3 A4:0.25/4 G4:0.5/3 E4:1.5/1 | G4:0.75/3 A4:0.25/4 G4:0.5/3 E4:1.5/1 | D5:1/5 D5:0.5/5 B4:1.5/3 | C5:1/4 C5:0.5/4 G4:1.5/1 | A4:1/2 A4:0.5/2 C5:0.75/4 B4:0.25/3 A4:0.5/2 | G4:0.75/3 A4:0.25/4 G4:0.5/3 E4:1.5/1 | A4:1/2 A4:0.5/2 C5:0.75/4 B4:0.25/3 A4:0.5/2 | G4:0.75/3 A4:0.25/4 G4:0.5/3 E4:1.5/1 | D5:1/3 D5:0.5/3 F5:0.75/5 D5:0.25/3 B4:0.5/1 | C5:1.5/2 E5:1/4 -:0.5 | C5:0.75/5 G4:0.25/3 E4:0.5/1 G4:0.75/3 F4:0.25/2 D4:0.5/1 | C4:2.5/1 -:0.5',
    gauche: 'C3:3/1 | C3:3/1 | G2:3/4 | C3:3/1 | F2:3/5 | C3:3/1 | F2:3/5 | C3:3/1 | G2:3/4 | C3:3/1 | C3:1.5/1 G2:1.5/4 | C3:2.5/1 -:0.5',
    histoire: 'Le soir de Noël 1818, à Oberndorf en Autriche, Franz Xaver Gruber et le prêtre Joseph Mohr chantent pour la première fois « Stille Nacht », accompagnés à la guitare.',
  },

  // ---------------------------------------------------------------- Palier 7
  {
    id: 'amazing-grace', titre: 'Amazing Grace', compositeur: 'Traditionnel (air « New Britain »)', annee: 1779,
    origine: 'Cantique de John Newton', palier: 7, niveau: 3, tempo: 80, mesure: '3/4',
    droite: 'G4:1/1 | C5:2/2 E5:0.5/4 C5:0.5/2 | E5:2/4 D5:1/3 | C5:2/2 A4:1/1 | G4:2/1 G4:1/1 | C5:2/2 E5:0.5/4 C5:0.5/2 | E5:2/4 D5:1/3 | G5:2/5 E5:1/3 | G5:1.5/5 E5:0.5/3 G5:0.5/5 E5:0.5/3 | C5:2/1 G4:1/1 | A4:1.5/2 C5:0.5/4 C5:0.5/4 A4:0.5/2 | G4:2/1 G4:1/1 | C5:2/2 E5:0.5/4 C5:0.5/2 | E5:2/4 D5:1/3 | C5:3/2',
    gauche: `-:1 | ${acc(DO, 3)} | ${acc(DO, 2)} ${acc(SOL, 1)} | ${acc(LAm, 2)} ${acc(FA, 1)} | ${acc(DO, 3)} | ${acc(DO, 3)} | ${acc(DO, 2)} ${acc(SOL, 1)} | ${acc(DO, 3)} | ${acc(DO, 3)} | ${acc(DO, 3)} | ${acc(FA, 3)} | ${acc(DO, 3)} | ${acc(LAm, 2)} ${acc(DO, 1)} | ${acc(DO, 2)} ${acc(SOL, 1)} | ${acc(DO, 3)}`,
    histoire: 'Le texte est écrit par John Newton, ancien marchand d’esclaves devenu pasteur, et publié en 1779. La mélodie « New Britain » l’accompagne depuis 1835.',
  },
  {
    id: 'prelude-en-do', titre: 'Prélude en do (début)', compositeur: 'Jean-Sébastien Bach', annee: 1722,
    origine: '« Le Clavier bien tempéré », livre I, prélude n° 1, BWV 846', palier: 7, niveau: 3, tempo: 66, mesure: '4/4',
    droite: `${prelR('G4', 'C5', 'E5', 3)} | ${prelR('A4', 'D5', 'F5', 3)} | ${prelR('G4', 'D5', 'F5', 4)} | ${prelR('G4', 'C5', 'E5', 3)} | G4+C5+E5:4/1+3+5`,
    gauche: `${prelL('C4', 'E4', 3)} | ${prelL('C4', 'D4', 4)} | ${prelL('B3', 'D4', 3)} | ${prelL('C4', 'E4', 3)} | C4+E4:4/5+3`,
    histoire: 'Ce prélude ouvre le premier livre du « Clavier bien tempéré », achevé en 1722. Plus d’un siècle plus tard, Charles Gounod pose dessus la mélodie de son « Ave Maria ».',
  },
  {
    id: 'le-beau-danube-bleu', titre: 'Le Beau Danube bleu (thème)', compositeur: 'Johann Strauss fils', annee: 1867,
    origine: 'Valse « An der schönen blauen Donau », op. 314', palier: 7, niveau: 4, tempo: 120, mesure: '3/4',
    droite: 'C4:1/1 | C4:1/1 E4:1/3 G4:1/5 | G4:2/5 G5:1/5 | G5:2/5 E5:1/3 | E5:2/3 C4:1/1 | C4:1/1 E4:1/3 G4:1/5 | G4:2/5 G5:1/5 | G5:2/5 F5:1/4 | F5:2/4 B3:1/1 | B3:1/1 D4:1/2 A4:1/5 | A4:2/5 A5:1/5 | A5:2/5 F5:1/3 | F5:2/3 B3:1/1 | B3:1/1 D4:1/2 A4:1/5 | A4:2/5 A5:1/5 | A5:2/5 E5:1/2 | E5:3/2',
    gauche: `-:1 | -:3 | ${Array(4).fill(acc(DO, 3)).join(' | ')} | ${Array(8).fill(acc(SOL, 3)).join(' | ')} | ${Array(3).fill(acc(DO, 3)).join(' | ')}`,
    histoire: 'Johann Strauss fils compose cette valse à Vienne en 1867. Elle est jouée chaque année au concert du Nouvel An de l’Orchestre philharmonique de Vienne.',
  },

  // ---------------------------------------------------------------- Palier 8
  {
    id: 'lettre-a-elise', titre: 'Lettre à Élise', compositeur: 'Ludwig van Beethoven', annee: 1810,
    origine: 'Bagatelle en la mineur, WoO 59', palier: 8, niveau: 4, tempo: 66, mesure: '3/8',
    droite: `E5:0.25/5 D#5:0.25/4 | ${ELISE_A} | A4:1/2 E5:0.25/5 D#5:0.25/4 | ${ELISE_A} | A4:1/2`,
    gauche: `-:0.5 | ${ELISE_A_GAUCHE} | A2:0.25/5 E3:0.25/2 A3:0.25/1 -:0.75 | ${ELISE_A_GAUCHE} | A2:0.25/5 E3:0.25/2 A3:0.25/1 -:0.25`,
    histoire: 'Beethoven écrit cette bagatelle en 1810, mais elle n’est publiée qu’en 1867, quarante ans après sa mort. On ne sait toujours pas avec certitude qui était Élise.',
  },
  {
    id: 'menuet-en-sol', titre: 'Menuet en sol', compositeur: 'Christian Petzold', annee: 1725,
    origine: 'Petit livre d’Anna Magdalena Bach, BWV Anh. 114', palier: 8, niveau: 4, tempo: 96, mesure: '3/4',
    droite: 'D5:1/5 G4:0.5/1 A4:0.5/2 B4:0.5/3 C5:0.5/4 | D5:1/5 G4:1/1 G4:1/1 | E5:1/5 C5:0.5/1 D5:0.5/2 E5:0.5/3 F#5:0.5/4 | G5:1/5 G4:1/1 G4:1/1 | C5:1/4 D5:0.5/5 C5:0.5/4 B4:0.5/3 A4:0.5/2 | B4:1/3 C5:0.5/4 B4:0.5/3 A4:0.5/2 G4:0.5/1 | F#4:1/2 G4:0.5/1 A4:0.5/2 B4:0.5/3 G4:0.5/1 | A4:3/2 | D5:1/5 G4:0.5/1 A4:0.5/2 B4:0.5/3 C5:0.5/4 | D5:1/5 G4:1/1 G4:1/1 | E5:1/5 C5:0.5/1 D5:0.5/2 E5:0.5/3 F#5:0.5/4 | G5:1/5 G4:1/1 G4:1/1 | C5:1/4 D5:0.5/5 C5:0.5/4 B4:0.5/3 A4:0.5/2 | B4:1/3 C5:0.5/4 B4:0.5/3 A4:0.5/2 G4:0.5/1 | A4:1/3 B4:0.5/4 A4:0.5/3 G4:0.5/2 F#4:0.5/1 | G4:3/2',
    gauche: 'G3+B3+D4:2/5+3+1 A3:1/4 | B3:3/3 | C4:3/2 | B3:3/3 | A3:3/4 | G3:3/5 | D4:1/1 B3:1/3 G3:1/5 | D4:1/1 D3:0.5/5 C4:0.5/1 B3:0.5/2 A3:0.5/3 | B3:2/2 A3:1/3 | G3:1/4 B3:1/2 G3:1/4 | C4:3/1 | B3:1/2 C4:0.5/1 B3:0.5/2 A3:0.5/3 G3:0.5/4 | A3:2/3 F#3:1/5 | G3:2/4 B3:1/2 | C4:1/2 D4:1/1 D3:1/5 | G3:2/1 G2:1/5',
    histoire: 'Longtemps attribué à Jean-Sébastien Bach, ce menuet figure dans le carnet de musique offert à sa femme Anna Magdalena en 1725. On sait aujourd’hui qu’il est de l’organiste Christian Petzold.',
  },
  {
    id: 'gymnopedie-1', titre: 'Gymnopédie n° 1 (début)', compositeur: 'Erik Satie', annee: 1888,
    origine: '« Trois Gymnopédies »', palier: 8, niveau: 3, tempo: 66, mesure: '3/4',
    droite: '-:3 | -:3 | -:3 | -:3 | -:1 E5:1/3 G5:1/5 | F5:1/4 E5:1/3 B4:1/1 | A4:1/1 B4:1/2 C5:1/3 | G4:3/1 | E4:3/1 | -:3 | -:3 | -:3 | -:1 E5:1/3 G5:1/5 | F5:1/4 E5:1/3 B4:1/1 | A4:1/1 B4:1/2 C5:1/3 | G4:3/1',
    // mesure 9 : la main droite tient le mi, l'accord de la main gauche le laisse de côté
    gauche: `${Array(4).fill(`${GYM_FA} | ${GYM_DO}`).join(' | ')} | F2:1/5 A3+C4:2/2+1 | ${GYM_DO} | ${Array(3).fill(`${GYM_FA} | ${GYM_DO}`).join(' | ')}`,
    histoire: 'Erik Satie a 22 ans quand il publie ses trois Gymnopédies, en 1888 à Paris. Leur lenteur et leur calme tranchent avec la musique de son époque.',
  },
  {
    id: 'marche-turque', titre: 'Marche turque (thème)', compositeur: 'Wolfgang Amadeus Mozart', annee: 1783,
    origine: 'Sonate pour piano n° 11, K. 331, « Alla turca »', palier: 8, niveau: 4, tempo: 100, mesure: '2/4',
    droite: `B4:0.25/4 A4:0.25/3 G#4:0.25/2 A4:0.25/1 | ${TURCA} | E5:1/3 B4:0.25/4 A4:0.25/3 G#4:0.25/2 A4:0.25/1 | ${TURCA} | E5:1/3`,
    gauche: `-:1 | ${TURCA_GAUCHE} | E3:1/5 -:1 | ${TURCA_GAUCHE} | E3:1/5`,
    histoire: 'C’est le dernier mouvement d’une sonate de Mozart, écrite vers 1783. Il imite les fanfares militaires turques, très à la mode à Vienne à l’époque.',
  },
  {
    id: 'roi-de-la-montagne', titre: 'Dans l’antre du roi de la montagne', compositeur: 'Edvard Grieg', annee: 1876,
    origine: '« Peer Gynt » (suite n° 1, op. 46)', palier: 8, niveau: 4, tempo: 100, mesure: '4/4',
    droite: `${ROI_A(3, 'G4:2/4')} | ${ROI_A(4, 'G4+G5:2/1+5')} | ${ROI_B(4, 'B4:2/3')} | ${ROI_B(5, 'B4+B5:2/1+5')}`,
    gauche: `${ROI_A_GAUCHE} | ${ROI_A_GAUCHE} | ${ROI_B_GAUCHE} | ${ROI_B_GAUCHE}`,
    histoire: 'Grieg écrit cette musique pour la pièce « Peer Gynt » d’Henrik Ibsen, créée en 1876. Le même motif revient sans cesse, de plus en plus haut, de plus en plus vite et de plus en plus fort.',
  },
  {
    id: 'greensleeves', titre: 'Greensleeves', compositeur: 'Traditionnel anglais', annee: 1580,
    origine: 'Ballade anglaise du XVIe siècle', palier: 8, niveau: 3, tempo: 90, mesure: '6/8',
    droite: 'A4:0.5/1 | C5:1/2 D5:0.5/3 E5:0.75/4 F5:0.25/5 E5:0.5/4 | D5:1/3 B4:0.5/1 G4:0.75/1 A4:0.25/2 B4:0.5/3 | C5:1/4 A4:0.5/2 A4:0.75/2 G#4:0.25/1 A4:0.5/2 | B4:1.5/3 E4:1/1 A4:0.5/1 | C5:1/2 D5:0.5/3 E5:0.75/4 F5:0.25/5 E5:0.5/4 | D5:1/3 B4:0.5/1 G4:0.75/1 A4:0.25/2 B4:0.5/3 | C5:0.75/5 B4:0.25/4 A4:0.5/3 G#4:0.75/2 F#4:0.25/1 G#4:0.5/2 | A4:1.5/3 A4:1/3 -:0.5 | G5:1.5/3 G5:0.75/3 F#5:0.25/2 E5:0.5/1 | D5:1/5 B4:0.5/3 G4:0.75/1 A4:0.25/2 B4:0.5/3 | C5:1/4 A4:0.5/2 A4:0.75/2 G#4:0.25/1 A4:0.5/2 | B4:1/5 G#4:0.5/3 E4:1/1 -:0.5 | G5:1.5/3 G5:0.75/3 F5:0.25/2 E5:0.5/1 | D5:1/5 B4:0.5/3 G4:0.75/1 A4:0.25/2 B4:0.5/3 | C5:0.75/5 B4:0.25/4 A4:0.5/3 G#4:0.75/2 F#4:0.25/1 G#4:0.5/2 | A4:1.5/3 A4:1/3',
    histoire: 'Une ballade intitulée « Greensleeves » est enregistrée à Londres en 1580. La légende qui l’attribue au roi Henri VIII n’a jamais été prouvée.',
  },
  {
    id: 'danny-boy', titre: 'Danny Boy', compositeur: 'Traditionnel irlandais', annee: 1855,
    origine: '« Londonderry Air »', palier: 8, niveau: 3, tempo: 72, mesure: '4/4',
    droite: 'B3:0.5/1 C4:0.5/2 D4:0.5/3 | E4:1.5/4 D4:0.5/3 E4:0.5/4 A4:0.5/5 G4:0.5/4 E4:0.5/3 | D4:0.5/2 C4:0.5/1 A3:1/1 -:0.5 C4:0.5/1 E4:0.5/3 F4:0.5/4 | G4:1.5/4 A4:0.5/5 G4:0.5/4 E4:0.5/3 C4:0.5/1 E4:0.5/3 | D4:2/2 -:0.5 B3:0.5/1 C4:0.5/2 D4:0.5/3 | E4:1.5/4 D4:0.5/3 E4:0.5/4 A4:0.5/5 G4:0.5/4 E4:0.5/3 | D4:0.5/5 C4:0.5/4 A3:0.5/2 G#3:0.5/1 A3:0.5/2 B3:0.5/3 C4:0.5/4 D4:0.5/5 | E4:1.5/3 F4:0.5/4 E4:0.5/3 D4:0.5/2 C4:0.5/1 D4:0.5/2 | C4:2/1 -:0.5 G4:0.5/2 A4:0.5/3 B4:0.5/4 | C5:1.5/5 B4:0.5/4 B4:0.5/4 A4:0.5/3 G4:0.5/2 E4:0.5/1 | G4:0.5/5 E4:0.5/3 C4:1/1 -:0.5 G4:0.5/2 A4:0.5/3 B4:0.5/4 | C5:1.5/5 B4:0.5/4 B4:0.5/4 A4:0.5/3 G4:0.5/2 E4:0.5/1 | D4:2/1 -:0.5 G4:0.5/1 G4:0.5/1 G4:0.5/1 | E5:1.5/5 D5:0.5/4 D5:0.5/4 C5:0.5/3 A4:0.5/2 C5:0.5/3 | G4:0.5/5 E4:0.5/3 C4:1/1 -:0.5 B3:0.5/1 C4:0.5/2 D4:0.5/3 | E4:0.5/1 A4:0.5/4 G4:0.5/3 E4:0.5/1 D4:0.5/4 C4:0.5/3 A3:0.5/1 B3:0.5/2 | C4:2.5/3',
    histoire: 'Cet air irlandais est publié en 1855 dans la collection de George Petrie. En 1913, Frederic Weatherly y pose les paroles de « Danny Boy ».',
  },
  {
    id: 'la-surprise', titre: 'La Surprise (thème)', compositeur: 'Joseph Haydn', annee: 1791,
    origine: 'Symphonie n° 94, deuxième mouvement', palier: 8, niveau: 2, tempo: 60, mesure: '2/4',
    droite: Array(2).fill('C4:0.5/1 C4:0.5/1 E4:0.5/3 E4:0.5/3 | G4:0.5/5 G4:0.5/5 E4:1/3 | F4:0.5/5 F4:0.5/5 D4:0.5/3 D4:0.5/3 | B3:0.5/1 B3:0.5/1 G3:1/1 | C4:0.5/1 C4:0.5/1 E4:0.5/3 E4:0.5/3 | G4:0.5/5 G4:0.5/5 E4:1/3 | C5:0.5/5 C5:0.5/5 F#4:0.5/1 F#4:0.5/1').join(' | G4:1/2 G3:0.5/1 -:0.5 | ') + ' | G4:0.5/2 -:0.5 B4+G5:1/1+5',
    gauche: `${rests(R2, 15)} | -:1 D4:1/1`,
    histoire: 'Haydn crée cette symphonie à Londres en 1792. Au milieu du thème tout doux, un accord fortissimo éclate soudain : c’est la « surprise ».',
  },
  {
    id: 'schumann-melodie', titre: 'Mélodie (Album pour la jeunesse)', compositeur: 'Robert Schumann', annee: 1848,
    origine: '« Album pour la jeunesse », op. 68 n° 1', palier: 8, niveau: 3, tempo: 80, mesure: '4/4',
    droite: Array(2).fill('E5:1/5 D5:1/4 C5:1/3 B4:1/2 | A4:0.5/1 C5:0.5/3 B4:0.5/2 D5:0.5/4 C5:1/3 G4:1/1 | G5:1/5 F5:1/4 E5:1/3 C5:1/2 | B4:1/1 F#4+A4:1/2+3 G4:1/1 -:1').join(' | '),
    gauche: Array(2).fill('C4:0.5/5 G4:0.5/1 F4:0.5/2 G4:0.5/1 E4:0.5/3 G4:0.5/1 C4:0.5/5 E4:0.5/3 | F4:0.5/2 D4:0.5/4 G4:0.5/1 F4:0.5/2 E4:0.5/3 F4:0.5/2 E4:0.5/3 D4:0.5/4 | E4:0.5/3 G4:0.5/1 D4:0.5/4 G4:0.5/1 C4:0.5/5 G4:0.5/1 E4:0.5/3 G4:0.5/1 | D4:0.5/4 G4:0.5/1 C4:0.5/5 D4:0.5/4 B3:0.5/5 D4:0.5/3 G3:1/5').join(' | '),
    histoire: 'Schumann compose son « Album pour la jeunesse » en 1848, d’abord pour les sept ans de sa fille aînée, Marie. « Mélodie » en est la toute première pièce.',
  },
  {
    id: 'arabesque-burgmuller', titre: 'L’Arabesque (début)', compositeur: 'Friedrich Burgmüller', annee: 1851,
    origine: '« 25 études faciles et progressives », op. 100 n° 2', palier: 8, niveau: 4, tempo: 100, mesure: '2/4',
    droite: '-:2 | -:2 | A4:0.25/1 B4:0.25/2 C5:0.25/3 B4:0.25/2 A4:0.5/1 -:0.5 | A4:0.25/1 B4:0.25/2 C5:0.25/3 D5:0.25/4 E5:0.5/5 -:0.5 | D5:0.25/1 E5:0.25/2 F5:0.25/3 G5:0.25/4 A5:0.5/5 -:0.5 | A5:0.25/1 B5:0.25/2 C6:0.25/3 D6:0.25/4 E6:0.5/5 -:0.5 | -:0.5 E5:0.5/3 E5:0.5/3 F5:0.5/4 | D5:0.5/2 -:0.5 D5:1/2 | -:0.5 G5:0.5/5 D5:0.5/2 E5:0.5/3 | C5:1/1 C6:0.5/5 -:0.5',
    gauche: `${Array(4).fill('A3+C4+E4:1/5+3+1 A3+C4+E4:1/5+3+1').join(' | ')} | A3+D4+F4:1/5+2+1 A3+D4+F4:1/5+2+1 | A3+C4+E4:1/5+3+1 A3+C4+E4:1/5+3+1 | G3+C4+E4:1/5+2+1 G3+C4+E4:1/5+2+1 | G3+B3+F4:1/5+3+1 G3+B3+F4:1/5+3+1 | G3+B3+F4:1/5+3+1 G3+B3+F4:1/5+3+1 | C4+E4:1.5/2+1 -:0.5`,
    histoire: 'Friedrich Burgmüller, pianiste allemand installé à Paris, publie ses 25 études en 1851. « L’Arabesque » est l’une des pièces les plus jouées par les jeunes pianistes.',
  },
];
