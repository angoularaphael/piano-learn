// Bibliotheque. "lecon" = lecon du parcours ; "demo" = version piano jouable depuis cette page.
export const MORCEAUX = [
  {
    id: 'industry-baby',
    titre: 'Industry Baby',
    auteur: 'Lil Nas X, Jack Harlow',
    palier: 3,
    type: 'actuel',
    libre: true,
    lecon: null,
    // Le morceau tourne a 150 BPM, mais cette transcription est notee en demi-temps :
    // 75 ici redonne la vraie vitesse (refrain : environ une note toutes les 0,8 temps a 150).
    tempo: 75,
    texte: 'Industry Baby à sa vraie vitesse, en mi bémol mineur comme l\'original. Riff, refrain, couplet, refrain. Main droite, suis-moi jusqu\'au bout.',
    demo: industryBabyDemo(),
  },

  {
    id: 'rush-e',
    titre: 'Rush E',
    auteur: 'Andrew Wrangell / Sheet Music Boss',
    palier: 8,
    type: 'actuel',
    libre: true,
    lecon: null,
    tempo: 156,
    texte: 'Rush E, la version jouable. C\'est en la mineur, pas en mi : le gag, c\'est d\'enfoncer le mi encore et encore, puis le thème. Je joue au tempo du morceau.',
    demo: rushEDemo(),
  },
  {
    id: 'axel-f',
    titre: 'Axel F',
    auteur: 'Crazy Frog / Harold Faltermeyer',
    palier: 4,
    type: 'actuel',
    libre: true,
    lecon: null,
    tempo: 138,
    texte: 'Axel F, version Crazy Frog, en ré mineur à 138 BPM. Le riff : ré... fa, ré ré sol ré do. Puis ré... la, ré ré si bémol la fa. Et la fin qui monte au ré aigu.',
    demo: axelFDemo(),
  },
  { id: 'clair-de-lune', titre: 'Au clair de la lune', auteur: 'Traditionnel', palier: 1, type: 'classique', lecon: '1-7' },
  { id: 'ah-vous-dirai-je', titre: 'Ah ! vous dirai-je, maman', auteur: 'Traditionnel', palier: 2, type: 'classique', lecon: '2-3' },
  { id: 'frere-jacques', titre: 'Frère Jacques', auteur: 'Traditionnel', palier: 2, type: 'classique', lecon: '2-6' },
  { id: 'ode-joie', titre: 'Ode à la joie', auteur: 'Beethoven', palier: 3, type: 'classique' },
  { id: 'jingle-bells', titre: 'Jingle Bells', auteur: 'J. Pierpont', palier: 5, type: 'classique' },
  { id: 'lettre-elise', titre: 'Lettre à Élise', auteur: 'Beethoven', palier: 6, type: 'classique' },
  { id: 'canon', titre: 'Canon en ré', auteur: 'Pachelbel', palier: 7, type: 'classique' },
  { id: 'gymnopedie', titre: 'Gymnopédie n°1', auteur: 'Satie', palier: 8, type: 'classique' },
].filter((m) => !m.brouillon);

// D# mineur, 150 BPM. Riff + refrains + couplet Jack + outro.
function industryBabyDemo() {
  const riff = (n) => [
    [n, 0.75], [n, 0.25], [n, 0.5], [n, 0.25], [n, 0.5], [n, 0.75],
  ];
  const baby = [
    [70, 0.25], [68, 0.25], [70, 0.5], [66, 1],
    [70, 0.25], [68, 0.25], [70, 0.5], [66, 1],
    [70, 0.25], [68, 0.25], [70, 0.25], [68, 0.25], [66, 0.25], [66, 0.75],
    [70, 0.25], [68, 0.25], [70, 0.5], [66, 1],
  ];
  const industry = [
    [70, 0.25], [70, 0.25], [70, 0.25], [70, 0.25], [70, 0.25], [70, 0.25], [75, 1],
    [70, 0.5], [66, 0.5], [68, 0.25], [66, 0.25], [65, 1],
    [70, 0.25], [70, 0.25], [70, 0.25], [70, 0.25], [70, 0.25], [70, 0.25], [75, 1],
    [70, 1.5],
    [75, 0.25], [75, 0.25], [77, 0.25], [77, 0.25], [78, 0.25], [77, 0.25], [75, 0.25], [73, 0.25], [75, 1],
    [70, 0.5], [66, 0.5], [68, 0.25], [66, 0.25], [65, 1],
    [70, 0.25], [70, 0.25], [70, 0.25], [70, 0.25], [70, 0.25], [70, 0.25], [75, 1],
    [70, 2],
  ];
  const couplet = [
    [63, 0.5], [65, 0.5], [66, 0.5], [70, 0.25], [68, 0.25], [66, 1],
    [68, 0.25], [66, 0.25], [65, 1],
    [65, 0.25], [65, 0.25], [65, 0.25], [65, 0.25], [66, 0.25], [65, 0.25], [63, 1],
    [63, 0.5], [65, 0.5], [66, 0.5], [70, 0.25], [68, 0.25], [66, 1],
    [68, 0.25], [66, 0.25], [65, 1],
    [65, 0.25], [65, 0.25], [65, 0.25], [65, 0.25], [65, 0.25], [66, 0.25], [65, 0.25], [63, 1],
    [70, 0.25], [70, 0.25], [70, 0.25], [68, 0.25], [68, 0.25], [66, 0.25],
    [68, 0.25], [66, 0.25], [68, 0.25], [66, 0.25], [68, 0.25], [66, 0.25], [63, 1],
    [70, 0.25], [70, 0.25], [70, 0.25], [68, 0.25], [68, 0.25], [66, 0.25],
    [68, 0.25], [66, 0.25], [68, 0.25], [66, 0.25], [68, 0.25], [70, 0.5], [70, 1],
    [63, 0.5], [65, 0.5], [66, 0.5], [70, 0.25], [68, 0.25], [66, 1],
    [68, 0.25], [66, 0.25], [65, 1],
    [65, 0.25], [65, 0.25], [65, 0.25], [65, 0.25], [65, 0.25], [66, 0.25], [65, 0.25], [63, 1.5],
    [61, 0.25], [63, 0.5], [68, 0.5], [66, 1],
    [68, 0.25], [66, 0.25], [68, 0.25], [68, 0.25], [68, 0.25], [68, 0.25], [68, 0.5],
    [68, 0.25], [66, 0.25], [68, 0.25], [68, 0.25], [68, 0.25], [68, 0.25], [63, 0.5],
    [68, 0.25], [66, 0.25], [68, 0.25], [68, 0.25], [68, 0.25], [68, 0.25], [63, 0.5],
    [68, 0.25], [68, 0.25], [68, 0.25], [68, 0.25], [68, 0.25], [68, 0.25], [68, 0.25], [63, 0.5],
    [68, 0.25], [68, 0.25], [68, 0.25], [68, 0.25], [68, 0.25], [70, 0.25], [66, 0.25], [68, 1],
    [70, 0.25], [70, 0.25], [68, 0.25], [68, 0.25], [68, 0.25], [68, 0.25], [68, 0.25], [63, 0.5],
    [68, 0.25], [68, 0.25], [68, 0.25], [68, 0.25], [68, 0.25], [70, 0.25], [68, 0.25], [63, 1],
    [63, 0.25], [66, 0.25], [66, 0.25], [65, 0.25], [66, 0.25], [66, 0.25], [66, 0.25], [66, 0.25],
    [70, 0.25], [68, 0.25], [63, 0.5], [63, 0.5], [63, 0.5], [63, 1],
    [63, 0.25], [63, 0.25], [68, 1], [65, 1],
    [63, 0.25], [61, 0.25], [63, 0.25], [61, 0.25], [63, 0.25], [61, 0.25], [63, 0.25], [61, 0.25],
    [68, 0.5], [65, 1],
    [63, 0.25], [61, 0.25], [63, 0.25], [61, 0.25], [63, 0.25], [61, 0.25], [63, 0.25], [61, 0.25],
    [68, 0.5], [65, 1],
    [63, 0.5], [61, 0.25], [63, 0.5], [63, 0.25], [61, 0.25], [63, 0.5],
  ];
  return [
    ...riff(63), ...riff(70), ...riff(75), [75, 2],
    ...riff(63), ...riff(70), ...riff(75), [75, 1],
    ...baby, ...baby,
    ...industry,
    ...baby, ...baby,
    ...couplet,
    ...industry,
    ...baby, ...baby,
    ...riff(63), ...riff(70), ...riff(75), [75, 2],
  ];
}

function rushEDemo() {
  const acc = { C: 0, 'C#': 1, D: 2, 'D#': 3, E: 4, F: 5, 'F#': 6, G: 7, 'G#': 8, A: 9, 'A#': 10, B: 11 };
  const parse = (str) => str.trim().split(/\s+/).flatMap((tok) => {
    const m = tok.match(/^([A-G]#?)(\d)(?:\*(\d+))?(?::([\d.]+))?$/);
    const midi = 12 * (+m[2] + 1) + acc[m[1]];
    const times = +(m[3] || 1);
    const dur = m[4] ? +m[4] : 0.25;
    return Array.from({ length: times }, () => [midi, dur]);
  });
  // Version jouable (A mineur, 156 BPM) : mi marteles, theme, montee, milieu, modulation sib.
  const theme = parse(`
    E4*21 F4 E4 D#4 E4:0.75
    A4:0.5 C5:0.5 D5*5 C5 B4 D5 C5*5 B4 A4 C5 B4*4
    F#4:0.5 B4:0.5 G#4:1
  `);
  const montee = parse(`
    E4*18 F4 E4 D#4 E4:0.5
    A4 C5 E5 A5 C6 D6 C6 B5 D6 C6 B5 A5 C6 B5 A5 G#5 B5 A5
    E5 C5 A4 F4 E4 D4 C4 B3 A3 G#3 B3 A3:1
  `);
  const milieu = parse(`
    D4 C#4 D4 E4 F4 E4 D4 F4 E4 D4 C4 D4 E4:0.5
    C4 B3 A#3 B3 C4 D4 C4 B3 D4 C4 A3 C4 E4 A4 E4 C4 A3
    D4 C#4 D4 E4 F4 E4 D4 F4 E4 D4 C4 D4 E4 A4
    D4 F4 E4 C4 D4 B3 A3 E4 A4:1
  `);
  const sib = parse(`
    F4*22 F#4 F4 E4 F4:0.75
    A#4:0.5 C#5:0.5 D#5*5 C#5 C5 D#5 C#5*5 C5 A#4 C#5 C5*4
    G4:0.5 C5:0.5 A4:1
    F4*16 F#4 F4 E4 F4:0.5
    A#4 C#5 F5 A#5 C#6 D#6 C#6 C6 D#6 C#6 C6 A#5 C#6 C6 A#5 A5 C6 A#5
    F5 C#5 A#4 F#4 F4 D#4 C#4 C4 A#3 A3 C4 A#3:1
  `);
  return [...theme, ...montee, ...milieu, ...theme, ...montee, ...sib];
}

function axelFDemo() {
  // Re mineur. Noires = 1 temps. Le riff tient sur trois mesures, puis une note longue.
  const D = 62, F = 65, G = 67, C = 60, A = 69, Bb = 70, D5 = 74, A3 = 57, E = 64;
  const riff = [
    [D, 1], [F, 0.75], [D, 0.5], [D, 0.25], [G, 0.5], [D, 0.5], [C, 0.5],
    [D, 1], [A, 0.75], [D, 0.5], [D, 0.25], [Bb, 0.5], [A, 0.5], [F, 0.5],
    [D, 0.5], [A, 0.5], [D5, 0.5], [D, 0.25], [C, 0.5], [C, 0.25], [A3, 0.5], [E, 0.5],
    [D, 2.5],
  ];
  // Reprise une octave plus haut, comme le synthe dans la version Crazy Frog
  const haut = riff.map(([m, d]) => [m + 12, d]);
  return [...riff, ...riff, ...haut, ...riff];
}
