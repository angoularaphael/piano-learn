// Version anglaise de la bibliotheque : meme structure et memes ids que js/data/songs.js,
// ou le format des champs est decrit.
// Traduits : titre (seulement quand l'oeuvre a un titre anglais connu ; sinon le titre original,
// avec la precision de version en anglais), compositeur (« Traditionnel » et noms francises),
// annee quand c'est du texte, origine et histoire.
// Copies tels quels depuis la version francaise : id, palier, niveau, tempo, mesure, droite,
// gauche, et annee quand c'est un nombre. Les notes sont ecrites en entier (sans les constantes
// de songs.js) : si une note change la-bas, elle doit changer ici aussi.
// « Au clair de la lune » et le theme de l'« Ode a la joie » (palier 1) vivent dans library.js.

export const SONGS = [
  // ---------------------------------------------------------------- Palier 1
  {
    id: 'j-ai-du-bon-tabac', titre: 'J’ai du bon tabac', compositeur: 'Traditional', annee: '18th century',
    origine: 'French folk song', palier: 1, niveau: 2, tempo: 96, mesure: '4/4',
    droite: 'C4:0.5/1 D4:0.5/2 E4:0.5/3 C4:0.5/1 | D4:1/2 D4:0.5/2 E4:0.5/3 F4:1/4 F4:1/4 | E4:1/3 E4:1/3 C4:0.5/1 D4:0.5/2 E4:0.5/3 C4:0.5/1 | D4:1/2 D4:0.5/2 E4:0.5/3 F4:1/4 G4:1/5 | C4:2/1 G4:1/5 G4:0.5/5 F4:0.5/4 | E4:1/3 D4:0.5/2 E4:0.5/3 F4:1/4 G4:1/5 | D4:2/2 G4:1/5 G4:0.5/5 F4:0.5/4 | E4:1/3 D4:0.5/2 E4:0.5/3 F4:1/4 G4:1/5 | D4:2/2 C4:0.5/1 D4:0.5/2 E4:0.5/3 C4:0.5/1 | D4:1/2 D4:0.5/2 E4:0.5/3 F4:1/4 F4:1/4 | E4:1/3 E4:1/3 C4:0.5/1 D4:0.5/2 E4:0.5/3 C4:0.5/1 | D4:1/2 D4:0.5/2 E4:0.5/3 F4:1/4 G4:1/5 | C4:2/1',
    histoire: 'This 18th-century song is often attributed to the Abbé de L’Attaignant. Jean-Baptiste Weckerlin published it in 1870 in his “Chansons et rondes enfantines”.',
  },
  {
    id: 'oh-when-the-saints', titre: 'Oh When the Saints', compositeur: 'Traditional', annee: 'early 20th century',
    origine: 'American gospel song “When the Saints Go Marching In”', palier: 1, niveau: 2, tempo: 120, mesure: '4/4',
    droite: '-:1 C4:1/1 E4:1/3 F4:1/4 | G4:4/5 | -:1 C4:1/1 E4:1/3 F4:1/4 | G4:4/5 | -:1 C4:1/1 E4:1/3 F4:1/4 | G4:2/5 E4:2/3 | C4:2/1 E4:2/3 | D4:4/2 | -:1 E4:1/3 E4:1/3 D4:1/2 | C4:4/1 | E4:2/3 G4:2/5 | G4:1/5 F4:3/4 | -:2 E4:1/3 F4:1/4 | G4:2/5 E4:2/3 | C4:2/1 D4:2/2 | C4:4/1',
    histoire: 'This African American hymn, first recorded in 1923, became a New Orleans jazz standard. Louis Armstrong made it famous around the world in 1938.',
  },
  {
    id: 'a-la-claire-fontaine', titre: 'À la claire fontaine', compositeur: 'Traditional', annee: '15th–18th century',
    origine: 'French folk song', palier: 1, niveau: 2, tempo: 100, mesure: '4/4',
    droite: 'C4:2/1 C4:1/1 E4:1/3 | E4:1/3 D4:1/2 E4:1/3 D4:1/2 | C4:2/1 C4:1/1 E4:1/3 | E4:1/3 D4:1/2 E4:2/3 | E4:2/3 E4:1/3 D4:1/2 | C4:1/1 E4:1/3 G4:1/5 E4:1/3 | G4:2/5 G4:1/5 E4:1/3 | C4:1/1 E4:1/3 D4:2/2 | C4:2/1 C4:1/1 E4:1/3 | E4:1/3 D4:0.5/2 C4:0.5/1 E4:1/3 C4:1/1 | E4:2/3 E4:1/3 D4:0.5/2 C4:0.5/1 | E4:1/3 D4:1/2 C4:2/1',
    histoire: 'Widely sung in France, it has also been sung in Quebec since the 18th century: the coureurs des bois sang it in their canoes, and the Patriotes during the uprisings of 1837–1838.',
  },

  // ---------------------------------------------------------------- Palier 2
  {
    id: 'ah-vous-dirai-je', titre: 'Twinkle, Twinkle, Little Star', compositeur: 'Traditional', annee: 1761,
    origine: 'French tune', palier: 2, niveau: 1, tempo: 100, mesure: '2/4',
    droite: 'C4:1/1 C4:1/1 | G4:1/4 G4:1/4 | A4:1/5 A4:1/5 | G4:2/4 | F4:1/3 F4:1/3 | E4:1/2 E4:1/2 | D4:1/1 D4:1/1 | C4:2/1 | G4:1/4 G4:1/4 | F4:1/3 F4:1/3 | E4:1/2 E4:1/2 | D4:2/1 | G4:1/4 G4:1/4 | F4:1/3 F4:1/3 | E4:1/2 E4:1/2 | D4:2/1 | C4:1/1 C4:1/1 | G4:1/4 G4:1/4 | A4:1/5 A4:1/5 | G4:2/4 | F4:1/3 F4:1/3 | E4:1/2 E4:1/2 | D4:1/1 D4:1/1 | C4:2/1',
    histoire: 'This French tune, known in France as “Ah! vous dirai-je, maman”, was first printed in 1761. Mozart wrote twelve variations on it for piano, and in English it is sung as “Twinkle, Twinkle, Little Star”.',
  },
  {
    id: 'ainsi-font', titre: 'Ainsi font, font, font', compositeur: 'Traditional', annee: '19th century',
    origine: 'French nursery rhyme', palier: 2, niveau: 2, tempo: 100, mesure: '2/4',
    droite: 'C4:0.5/1 E4:0.5/2 | G4:1/4 A4:1/5 | G4:1/4 C4:0.5/1 C4:0.5/1 | D4:0.5/2 F4:0.5/4 E4:0.5/3 D4:0.5/2 | E4:0.5/3 C4:0.5/1 C4:0.5/1 E4:0.5/2 | G4:1/4 A4:1/5 | G4:1/4 C4:0.5/1 C4:0.5/1 | D4:0.5/2 F4:0.5/4 E4:0.5/3 D4:0.5/2 | C4:1/1',
    histoire: 'A nursery rhyme about little puppets, sung while twirling your hands. Jean-Baptiste Weckerlin published it in 1870 in his “Chansons et rondes enfantines”.',
  },
  {
    id: 'sur-le-pont-d-avignon', titre: 'Sur le pont d’Avignon', compositeur: 'Traditional', annee: '15th century',
    origine: 'French folk song (chorus)', palier: 2, niveau: 2, tempo: 112, mesure: '4/4',
    droite: 'C4:1/1 C4:1/1 C4:2/1 | D4:1/2 D4:1/2 D4:2/2 | E4:1.5/3 F4:0.5/4 G4:1/5 C4:1/1 | B3:1.5/2 C4:0.5/3 D4:1/4 G3:1/1 | C4:1/1 C4:1/1 C4:2/1 | D4:1/2 D4:1/2 D4:2/2 | E4:1.5/3 F4:0.5/4 G4:1/5 C4:1/1 | D4:1/2 B3:1/1 C4:1/2 -:1',
    histoire: 'The song refers to the Pont Saint-Bénézet, built over the Rhône in the 12th century. It is thought to date from the 15th century, and Adolphe Adam’s comic opera “Le Sourd ou l’Auberge pleine” made it famous in 1853.',
  },
  {
    id: 'frere-jacques', titre: 'Frère Jacques', compositeur: 'Traditional', annee: 'around 1780',
    origine: 'French round', palier: 2, niveau: 2, tempo: 100, mesure: '4/4',
    droite: 'C4:1/1 D4:1/2 E4:1/3 C4:1/1 | C4:1/1 D4:1/2 E4:1/3 C4:1/1 | E4:1/3 F4:1/4 G4:2/5 | E4:1/3 F4:1/4 G4:2/5 | G4:0.5/4 A4:0.5/5 G4:0.5/4 F4:0.5/3 E4:1/2 C4:1/1 | G4:0.5/4 A4:0.5/5 G4:0.5/4 F4:0.5/3 E4:1/2 C4:1/1 | C4:1/4 G3:1/1 C4:2/4 | C4:1/4 G3:1/1 C4:2/4',
    histoire: 'The earliest trace of this round is a French manuscript from the 1780s. Gustav Mahler reused it in a minor key, as a funeral march, in his First Symphony.',
  },

  // ---------------------------------------------------------------- Palier 3
  {
    id: 'ode-joie', titre: 'Ode to Joy (full version)', compositeur: 'Ludwig van Beethoven', annee: 1824,
    origine: 'Symphony No. 9, final movement', palier: 3, niveau: 2, tempo: 100, mesure: '4/4',
    droite: 'E4:1/3 E4:1/3 F4:1/4 G4:1/5 | G4:1/5 F4:1/4 E4:1/3 D4:1/2 | C4:1/1 C4:1/1 D4:1/2 E4:1/3 | E4:1.5/3 D4:0.5/2 D4:2/2 | -:4 | -:4 | -:4 | -:4 | D4:1/2 D4:1/2 E4:1/3 C4:1/1 | D4:1/2 E4:0.5/3 F4:0.5/4 E4:1/3 C4:1/1 | D4:1/2 E4:0.5/3 F4:0.5/4 E4:1/3 D4:1/2 | C4:1/1 D4:1/2 -:2 | E4:1/3 E4:1/3 F4:1/4 G4:1/5 | G4:1/5 F4:1/4 E4:1/3 D4:1/2 | C4:1/1 C4:1/1 D4:1/2 E4:1/3 | D4:1.5/2 C4:0.5/1 C4:2/1',
    gauche: '-:4 | -:4 | -:4 | -:4 | E3:1/3 E3:1/3 F3:1/2 G3:1/1 | G3:1/1 F3:1/2 E3:1/3 D3:1/4 | C3:1/5 C3:1/5 D3:1/4 E3:1/3 | D3:1.5/4 C3:0.5/5 C3:2/5 | -:4 | -:4 | -:4 | -:2 G3:2/1 | -:4 | -:4 | -:4 | -:4',
    histoire: 'In the symphony, this sixteen-bar theme is first played by the cellos and double basses alone, before the whole orchestra takes it up, then the voices.',
  },
  {
    id: 'frere-jacques-echo', titre: 'Frère Jacques (echo version)', compositeur: 'Traditional', annee: 'around 1780',
    origine: 'French round', palier: 3, niveau: 2, tempo: 100, mesure: '4/4',
    droite: 'C4:1/1 D4:1/2 E4:1/3 C4:1/1 | -:4 | E4:1/3 F4:1/4 G4:2/5 | -:4 | G4:0.5/4 A4:0.5/5 G4:0.5/4 F4:0.5/3 E4:1/2 C4:1/1 | G4:0.5/4 A4:0.5/5 G4:0.5/4 F4:0.5/3 E4:1/2 C4:1/1 | C4:1/1 -:1 C4:2/1 | C4:1/1 -:1 C4:2/1',
    gauche: '-:4 | C3:1/5 D3:1/4 E3:1/3 C3:1/5 | -:4 | E3:1/3 F3:1/2 G3:2/1 | -:4 | -:4 | -:1 G3:1/1 -:2 | -:1 G3:1/1 -:2',
    histoire: 'Frère Jacques is a round: several voices sing the same tune, each one starting a little later. Here, the left hand answers the right an octave lower, and the two thumbs share the “ding, dang, dong”.',
  },
  {
    id: 'j-ai-du-bon-tabac-deux-mains', titre: 'J’ai du bon tabac (both hands)', compositeur: 'Traditional', annee: '18th century',
    origine: 'French folk song', palier: 3, niveau: 2, tempo: 96, mesure: '4/4',
    droite: 'C4:0.5/1 D4:0.5/2 E4:0.5/3 C4:0.5/1 | D4:1/2 D4:0.5/2 E4:0.5/3 F4:1/4 F4:1/4 | E4:1/3 E4:1/3 C4:0.5/1 D4:0.5/2 E4:0.5/3 C4:0.5/1 | D4:1/2 D4:0.5/2 E4:0.5/3 F4:1/4 G4:1/5 | C4:2/1 -:2 | -:4 | -:4 | -:4 | -:2 C4:0.5/1 D4:0.5/2 E4:0.5/3 C4:0.5/1 | D4:1/2 D4:0.5/2 E4:0.5/3 F4:1/4 F4:1/4 | E4:1/3 E4:1/3 C4:0.5/1 D4:0.5/2 E4:0.5/3 C4:0.5/1 | D4:1/2 D4:0.5/2 E4:0.5/3 F4:1/4 G4:1/5 | C4:2/1',
    gauche: '-:2 | -:4 | -:4 | -:4 | -:2 G3:1/1 G3:0.5/1 F3:0.5/2 | E3:1/3 D3:0.5/4 E3:0.5/3 F3:1/2 G3:1/1 | D3:2/4 G3:1/1 G3:0.5/1 F3:0.5/2 | E3:1/3 D3:0.5/4 E3:0.5/3 F3:1/2 G3:1/1 | D3:2/4 -:2 | -:4 | -:4 | -:4 | -:2',
    histoire: 'In his 1870 collection, Weckerlin notes that the tune dates from the 18th century. Here, the middle section, “J’en ai du fin et du râpé”, moves to the left hand.',
  },

  // ---------------------------------------------------------------- Palier 4
  {
    id: 'ah-vous-dirai-je-deux-mains', titre: 'Twinkle, Twinkle, Little Star (both hands)', compositeur: 'Traditional', annee: 1761,
    origine: 'French tune', palier: 4, niveau: 2, tempo: 100, mesure: '2/4',
    droite: 'C4:1/1 C4:1/1 | G4:1/4 G4:1/4 | A4:1/5 A4:1/5 | G4:2/4 | F4:1/3 F4:1/3 | E4:1/2 E4:1/2 | D4:1/1 D4:1/1 | C4:2/1 | -:2 | -:2 | -:2 | -:2 | -:2 | -:2 | -:2 | -:2 | C4:1/1 C4:1/1 | G4:1/4 G4:1/4 | A4:1/5 A4:1/5 | G4:2/4 | F4:1/3 F4:1/3 | E4:1/2 E4:1/2 | D4:1/1 D4:1/1 | C4:2/1',
    gauche: '-:2 | -:2 | -:2 | -:2 | -:2 | -:2 | -:2 | -:2 | G3:1/1 G3:1/1 | F3:1/2 F3:1/2 | E3:1/3 E3:1/3 | D3:2/4 | G3:1/1 G3:1/1 | F3:1/2 F3:1/2 | E3:1/3 E3:1/3 | D3:2/4 | -:2 | -:2 | -:2 | -:2 | -:2 | -:2 | -:2 | -:2',
    histoire: 'Mozart wrote his twelve variations on this tune in Vienna, around 1781–1782. Here, the middle section is read in the bass clef, with the left hand.',
  },
  {
    id: 'au-clair-de-la-lune-deux-mains', titre: 'Au clair de la lune (both hands)', compositeur: 'Traditional', annee: '18th century',
    origine: 'French folk song', palier: 4, niveau: 2, tempo: 92, mesure: '4/4',
    droite: 'C4:1/1 C4:1/1 C4:1/1 D4:1/2 | E4:2/3 D4:2/2 | C4:1/1 E4:1/3 D4:1/2 D4:1/2 | C4:4/1 | -:4 | -:4 | -:4 | -:4 | D4:1/5 D4:1/5 D4:1/5 D4:1/5 | A3:2/2 A3:2/2 | D4:1/5 C4:1/4 B3:1/3 A3:1/2 | G3:4/1 | C4:1/1 C4:1/1 C4:1/1 D4:1/2 | E4:2/3 D4:2/2 | C4:1/1 E4:1/3 D4:1/2 D4:1/2 | C4:4/1',
    gauche: '-:4 | -:4 | -:4 | -:4 | C3:1/5 C3:1/5 C3:1/5 D3:1/4 | E3:2/3 D3:2/4 | C3:1/5 E3:1/3 D3:1/4 D3:1/4 | C3:4/5 | -:4 | -:4 | -:4 | -:4 | -:4 | -:4 | -:4 | -:4',
    histoire: 'This tune is sometimes attributed to Jean-Baptiste Lully, but its author remains unknown. Here, the second phrase is read in the bass clef and played an octave lower.',
  },
  {
    id: 'oh-when-the-saints-deux-mains', titre: 'Oh When the Saints (both hands)', compositeur: 'Traditional', annee: 'early 20th century',
    origine: 'American gospel song', palier: 4, niveau: 2, tempo: 120, mesure: '4/4',
    droite: '-:1 C4:1/1 E4:1/3 F4:1/4 | G4:4/5 | -:1 C4:1/1 E4:1/3 F4:1/4 | G4:4/5 | -:1 C4:1/1 E4:1/3 F4:1/4 | G4:2/5 E4:2/3 | C4:2/1 E4:2/3 | D4:4/2 | -:4 | -:4 | -:4 | -:4 | -:4 | -:4 | -:4 | -:4',
    gauche: '-:4 | -:4 | -:4 | -:4 | -:4 | -:4 | -:4 | -:4 | -:1 E3:1/3 E3:1/3 D3:1/4 | C3:4/5 | E3:2/3 G3:2/1 | G3:1/1 F3:3/2 | -:2 E3:1/3 F3:1/2 | G3:2/1 E3:2/3 | C3:2/5 D3:2/4 | C3:4/5',
    histoire: 'In New Orleans, it is traditionally played at funerals with music, known as jazz funerals. Here, the second half moves to the left hand.',
  },

  // ---------------------------------------------------------------- Palier 5
  {
    id: 'jingle-bells', titre: 'Jingle Bells (chorus)', compositeur: 'James Lord Pierpont', annee: 1857,
    origine: '“The One Horse Open Sleigh”', palier: 5, niveau: 2, tempo: 120, mesure: '4/4',
    droite: 'E4:1/3 E4:1/3 E4:2/3 | E4:1/3 E4:1/3 E4:2/3 | E4:1/3 G4:1/5 C4:1.5/1 D4:0.5/2 | E4:2/3 -:2 | F4:1/4 F4:1/4 F4:1.5/4 F4:0.5/4 | F4:1/4 E4:1/3 E4:1/3 E4:0.5/3 E4:0.5/3 | E4:1/3 D4:1/2 D4:1/2 E4:1/3 | D4:2/2 G4:2/5 | E4:1/3 E4:1/3 E4:2/3 | E4:1/3 E4:1/3 E4:2/3 | E4:1/3 G4:1/5 C4:1.5/1 D4:0.5/2 | E4:2/3 -:2 | F4:1/4 F4:1/4 F4:1.5/4 F4:0.5/4 | F4:1/4 E4:1/3 E4:1/3 E4:0.5/3 E4:0.5/3 | G4:1/5 G4:1/5 F4:1/4 D4:1/2 | C4:3/1 -:1',
    histoire: 'James Lord Pierpont published this song in Boston in 1857 under the title “The One Horse Open Sleigh”. Written for winter, not for Christmas, it became the first song played in space, in 1965.',
  },
  {
    id: 'joyeux-anniversaire', titre: 'Happy Birthday to You', compositeur: 'Mildred J. Hill and Patty Smith Hill', annee: 1893,
    origine: '“Good Morning to All”', palier: 5, niveau: 2, tempo: 100, mesure: '3/4',
    droite: 'G3:0.75/1 G3:0.25/1 | A3:1/2 G3:1/1 C4:1/4 | B3:2/3 G3:0.75/1 G3:0.25/1 | A3:1/2 G3:1/1 D4:1/5 | C4:2/4 G3:0.75/1 G3:0.25/1 | G4:1/5 E4:1/3 C4:1/1 | B3:1/2 A3:1/1 F4:0.75/5 F4:0.25/5 | E4:1/4 C4:1/2 D4:1/3 | C4:2/2',
    histoire: 'The melody comes from “Good Morning to All”, a children’s song published in 1893 by two sisters who were schoolteachers in Kentucky, Mildred and Patty Hill.',
  },
  {
    id: 'auld-lang-syne', titre: 'Auld Lang Syne', compositeur: 'Traditional Scottish', annee: 1788,
    origine: 'Poem by Robert Burns, set to a folk tune', palier: 5, niveau: 2, tempo: 84, mesure: '4/4',
    droite: 'G3:1/1 | C4:1.5/1 C4:0.5/1 C4:1/1 E4:1/3 | D4:1.5/2 C4:0.5/1 D4:1/2 E4:1/3 | C4:1.5/1 C4:0.5/1 E4:1/3 G4:1/4 | A4:3/5 A4:1/5 | G4:1.5/4 E4:0.5/3 E4:1/3 C4:1/1 | D4:1.5/2 C4:0.5/1 D4:1/2 E4:1/3 | C4:1.5/3 A3:0.5/2 A3:1/2 G3:1/1 | C4:3/1 A4:1/5 | G4:1.5/4 E4:0.5/3 E4:1/3 C4:1/1 | D4:1.5/2 C4:0.5/1 D4:1/2 A4:1/5 | G4:1.5/4 E4:0.5/3 E4:1/3 G4:1/4 | A4:3/5 A4:1/5 | G4:1.5/4 E4:0.5/3 E4:1/3 C4:1/1 | D4:1.5/2 C4:0.5/1 D4:1/2 E4:1/3 | C4:1.5/3 A3:0.5/2 A3:1/2 G3:1/1 | C4:3/3',
    histoire: 'Robert Burns sent this poem in 1788, based on an old Scottish song. In France, it is sung as “Ce n’est qu’un au revoir”.',
  },
  {
    id: 'il-pleut-bergere', titre: 'Il pleut, il pleut, bergère', compositeur: 'Louis-Victor Simon', annee: 1780,
    origine: '“Laure et Pétrarque”, words by Fabre d’Églantine', palier: 5, niveau: 3, tempo: 90, mesure: '6/8',
    droite: '-:1 E4:0.5/3 | G4:1/5 E4:0.5/3 G4:1/5 E4:0.5/3 | C4:1.5/1 G3:1/1 -:0.5 | C4:0.5/2 B3:0.5/1 C4:0.5/2 D4:1/3 D4:0.5/3 | E4:3/4 | E4:0.5/3 D4:0.5/2 E4:0.5/3 F4:1/4 F4:0.5/4 | G4:1.5/5 E4:1/3 -:0.5 | G4:0.5/4 A4:0.5/5 G4:0.5/4 F4:1/3 E4:0.5/2 | E4:1.5/2 D4:1/1 -:0.5 | D4:0.5/1 E4:0.5/2 D4:0.5/1 F4:1/3 F4:0.5/3 | E4:1.5/2 G4:1/4 -:0.5 | F4:0.5/3 E4:0.5/2 D4:0.5/1 E4:1/2 C4:0.5/1 | E4:1.5/3 D4:1/2 E4:0.5/3 | G4:1/4 E4:0.5/2 G4:1/4 E4:0.5/2 | F4:1.5/3 A4:1.5/5 | G4:0.5/4 A4:0.5/5 G4:0.5/4 D4:1/1 E4:0.5/2 | C4:1.5/1',
    histoire: 'Fabre d’Églantine wrote the words in 1780, to music by Louis-Victor Simon. The poet later became a deputy during the French Revolution.',
  },
  {
    id: 'bon-roi-dagobert', titre: 'Le bon roi Dagobert', compositeur: 'Traditional', annee: '18th century',
    origine: 'French folk song', palier: 5, niveau: 2, tempo: 110, mesure: '6/8',
    droite: 'E4:0.5/3 | E4:1/3 D4:0.5/2 D4:1/2 C4:0.5/1 | C4:1.5/1 D4:1.5/2 | E4:0.5/3 F4:0.5/4 E4:0.5/3 D4:0.5/2 C4:0.5/1 D4:0.5/2 | C4:1.5/1 -:0.5 C4:0.5/1 D4:0.5/2 | E4:1/3 E4:0.5/3 E4:0.5/3 F4:0.5/4 G4:0.5/5 | D4:1/2 D4:0.5/2 D4:0.5/2 C4:0.5/1 D4:0.5/2 | E4:1/3 E4:0.5/3 E4:0.5/3 F4:0.5/4 G4:0.5/5 | D4:1/2 D4:0.5/2 D4:1/2 E4:0.5/3 | E4:1/3 D4:0.5/2 D4:1/2 C4:0.5/1 | C4:1.5/1 D4:1.5/2 | E4:0.5/3 F4:0.5/4 E4:0.5/3 D4:0.5/2 C4:0.5/1 D4:0.5/2 | C4:2.5/1',
    histoire: 'The song makes fun of the Merovingian king Dagobert I and his adviser, Saint Eligius. Its first lyrics date from the French Revolution and were meant to ridicule the monarchy.',
  },
  {
    id: 'mon-beau-sapin', titre: 'O Christmas Tree', compositeur: 'Traditional German', annee: 1824,
    origine: '“O Tannenbaum”', palier: 5, niveau: 3, tempo: 90, mesure: '3/4',
    droite: 'G3:0.5/1 | C4:0.75/2 C4:0.25/2 C4:1/2 D4:1/3 | E4:0.75/4 E4:0.25/4 E4:1.5/4 E4:0.5/4 | D4:0.5/3 E4:0.5/4 F4:1/5 B3:1/1 | D4:1/3 C4:1/2 -:0.5 G4:0.5/5 | G4:0.5/4 E4:0.5/2 A4:1.5/5 G4:0.5/4 | G4:0.5/4 F4:0.5/3 F4:1.5/3 F4:0.5/3 | F4:0.5/3 D4:0.5/1 G4:1.5/4 F4:0.5/3 | F4:0.5/3 E4:0.5/2 E4:1/2 -:0.5 G3:0.5/1 | C4:0.75/2 C4:0.25/2 C4:1/2 D4:1/3 | E4:0.75/4 E4:0.25/4 E4:1.5/4 E4:0.5/4 | D4:0.5/3 E4:0.5/4 F4:1/5 B3:1/1 | D4:1/3 C4:1/2 -:0.5',
    histoire: 'The tune is a German folk melody. In 1824, Ernst Anschütz wrote the words of “O Tannenbaum”, which became a Christmas carol all over Europe.',
  },
  {
    id: 'berceuse-brahms', titre: 'Brahms’ Lullaby', compositeur: 'Johannes Brahms', annee: 1868,
    origine: '“Wiegenlied”, Op. 49 No. 4', palier: 5, niveau: 3, tempo: 72, mesure: '3/4',
    droite: 'E4:0.5/1 E4:0.5/1 | G4:1.5/3 E4:0.5/1 E4:1/1 | G4:1/3 -:1 E4:0.5/1 G4:0.5/3 | C5:1/5 B4:1.5/4 A4:0.5/3 | A4:1/3 G4:1/2 D4:0.5/1 E4:0.5/2 | F4:1/3 D4:1/1 D4:0.5/1 E4:0.5/2 | F4:1/3 -:1 D4:0.5/1 F4:0.5/3 | B4:0.5/5 A4:0.5/4 G4:1/3 B4:1/5 | C5:1/5 -:1 C4:0.5/1 C4:0.5/1 | C5:2/5 A4:0.5/3 F4:0.5/1 | G4:2/5 E4:0.5/3 C4:0.5/1 | F4:1/3 G4:1/4 A4:1/5 | G4:2/5 C4:0.5/1 C4:0.5/1 | C5:2/5 A4:0.5/3 F4:0.5/1 | G4:2/5 E4:0.5/3 C4:0.5/1 | F4:1/4 E4:1/3 D4:1/2 | C4:2/1',
    histoire: 'Brahms wrote this lullaby in 1868 for the birth of his friend Bertha Faber’s second child.',
  },
  {
    id: 'savez-vous-planter-les-choux', titre: 'Savez-vous planter les choux?', compositeur: 'Traditional', annee: '19th century',
    origine: 'French children’s round dance', palier: 5, niveau: 2, tempo: 120, mesure: '6/8',
    droite: 'C4:1/1 E4:0.5/2 | G4:1/3 C5:0.5/5 G4:1/3 E4:0.5/2 | C4:1.5/1 B3:1/1 C4:0.5/2 | D4:1/3 D4:0.5/3 C4:1/2 D4:0.5/3 | E4:1/4 C4:0.5/2 C4:1/1 E4:0.5/2 | G4:1/3 C5:0.5/5 G4:1/3 E4:0.5/2 | C4:1.5/1 B3:1/1 C4:0.5/2 | D4:1/3 F4:0.5/5 E4:1/4 D4:0.5/3 | C4:1/2 -:0.5',
    histoire: 'A round dance published by Weckerlin in 1870. In each verse, you “plant the cabbages” with a different part of the body: the finger, the foot, the knee, the nose…',
  },
  {
    id: 'il-etait-une-bergere', titre: 'Il était une bergère', compositeur: 'Traditional', annee: '18th century',
    origine: 'French folk song', palier: 5, niveau: 2, tempo: 120, mesure: '6/8',
    droite: 'G3:0.5/1 | C4:1/3 D4:0.5/4 E4:1/5 D4:0.5/4 | C4:1.5/3 C4:1/3 G3:0.5/1 | A3:1/2 A3:0.5/2 G3:0.5/1 G3:0.5/1 G3:0.5/1 | A3:1/2 A3:0.5/2 G3:1/1 G3:0.5/1 | C4:1/3 D4:0.5/4 E4:1/5 D4:0.5/4 | C4:1.5/3 C4:1/1 G4:0.5/5 | E4:1/3 C4:0.5/1 D4:1/2 G3:0.5/1 | C4:1/1 C4:0.5/1 C4:1/1 G4:0.5/5 | E4:1/3 C4:0.5/1 D4:1/2 G3:0.5/1 | C4:2/1 -:0.5',
    histoire: 'A French round dance published by Weckerlin in his “Chansons et rondes enfantines” in 1870. The shepherdess makes a cheese from her sheep’s milk… which the cat comes to taste.',
  },
  {
    id: 'malbrough', titre: 'Malbrough s’en va-t-en guerre', compositeur: 'Traditional', annee: '18th century',
    origine: 'French folk song', palier: 5, niveau: 2, tempo: 110, mesure: '6/8',
    droite: 'G3:0.5/1 | E4:1/4 E4:0.5/4 E4:1/4 D4:0.5/3 | F4:1.5/5 E4:0.75/4 F4:0.25/5 E4:0.5/4 | D4:1/3 D4:0.5/3 D4:0.75/3 C4:0.25/2 D4:0.5/3 | E4:1.5/4 C4:1/2 G3:0.5/1 | E4:1/4 E4:0.5/4 E4:1/4 D4:0.5/3 | F4:1.5/5 E4:1/4 G4:0.5/5 | E4:1/4 C4:0.5/2 D4:1/3 B3:0.5/1 | C4:2/2 -:0.5 G4:0.5/4 | G4:1/4 E4:0.5/2 A4:1/5 A4:0.5/5 | G4:2.5/4 G4:0.5/4 | G4:1/4 E4:0.5/2 A4:1/5 A4:0.5/5 | G4:2.5/4 G3:0.5/1 | E4:1/4 E4:0.5/4 E4:1/4 D4:0.5/3 | F4:1.5/5 E4:0.75/4 F4:0.25/5 E4:0.5/4 | D4:1/3 D4:0.5/3 D4:0.75/3 C4:0.25/2 D4:0.5/3 | E4:1.5/4 C4:1/2 G3:0.5/1 | E4:1/4 E4:0.5/4 E4:1/4 D4:0.5/3 | F4:1.5/5 E4:1/4 G4:0.5/5 | E4:1/4 C4:0.5/2 D4:1/3 B3:0.5/1 | C4:2/2 -:0.5',
    histoire: 'This song mocks the Duke of Marlborough, an English general and enemy of France in the early 18th century. It became very popular in 1781, when the Dauphin’s nurse sang it to the little prince.',
  },

  // ---------------------------------------------------------------- Palier 6
  {
    id: 'canon-pachelbel', titre: 'Pachelbel’s Canon', compositeur: 'Johann Pachelbel', annee: 'between 1680 and 1706',
    origine: 'Canon and Gigue in D major', palier: 6, niveau: 3, tempo: 60, mesure: '4/4',
    droite: '-:4 | -:4 | E5:1/5 D5:1/4 C5:1/3 B4:1/2 | A4:1/1 G4:1/1 A4:1/2 B4:1/3 | C5:1/4 B4:1/3 A4:1/2 G4:1/1 | F4:1/3 E4:1/2 F4:1/3 D4:1/1 | C4:0.5/1 E4:0.5/3 G4:0.5/5 F4:0.5/4 E4:0.5/3 C4:0.5/1 E4:0.5/3 D4:0.5/2 | C4:0.5/1 A3:0.5/2 C4:0.5/1 G4:0.5/3 F4:0.5/2 A4:0.5/4 G4:0.5/3 F4:0.5/2 | E4:4/1',
    gauche: 'C3:1/1 G2:1/4 A2:1/3 E2:1/5 | F2:1/4 C2:1/5 F2:1/2 G2:1/1 | C3:1/1 G2:1/4 A2:1/3 E2:1/5 | F2:1/4 C2:1/5 F2:1/2 G2:1/1 | C3:1/1 G2:1/4 A2:1/3 E2:1/5 | F2:1/4 C2:1/5 F2:1/2 G2:1/1 | C3:1/1 G2:1/4 A2:1/3 E2:1/5 | F2:1/4 C2:1/5 F2:1/2 G2:1/1 | C3:4/1',
    histoire: 'Pachelbel wrote it for three violins and bass, between 1680 and 1706. Forgotten for nearly three centuries, it became famous after a 1968 recording.',
  },
  {
    id: 'ode-joie-deux-mains', titre: 'Ode to Joy (both hands)', compositeur: 'Ludwig van Beethoven', annee: 1824,
    origine: 'Symphony No. 9, final movement', palier: 6, niveau: 3, tempo: 96, mesure: '4/4',
    droite: 'E4:1/3 E4:1/3 F4:1/4 G4:1/5 | G4:1/5 F4:1/4 E4:1/3 D4:1/2 | C4:1/1 C4:1/1 D4:1/2 E4:1/3 | E4:1.5/3 D4:0.5/2 D4:2/2 | E4:1/3 E4:1/3 F4:1/4 G4:1/5 | G4:1/5 F4:1/4 E4:1/3 D4:1/2 | C4:1/1 C4:1/1 D4:1/2 E4:1/3 | D4:1.5/2 C4:0.5/1 C4:2/1 | D4:1/2 D4:1/2 E4:1/3 C4:1/1 | D4:1/2 E4:0.5/3 F4:0.5/4 E4:1/3 C4:1/1 | D4:1/2 E4:0.5/3 F4:0.5/4 E4:1/3 D4:1/2 | C4:1/2 D4:1/3 G3:2/1 | E4:1/3 E4:1/3 F4:1/4 G4:1/5 | G4:1/5 F4:1/4 E4:1/3 D4:1/2 | C4:1/1 C4:1/1 D4:1/2 E4:1/3 | D4:1.5/2 C4:0.5/1 C4:2/1',
    gauche: 'C3:4/1 | G2:4/5 | C3:4/1 | G2:4/5 | C3:4/1 | G2:4/5 | C3:4/1 | G2:2/5 C3:2/1 | G2:4/5 | G2:2/5 C3:2/1 | G2:2/5 C3:2/1 | C3:2/1 G2:2/5 | C3:4/1 | G2:4/5 | C3:4/1 | G2:2/5 C3:2/1',
    histoire: 'Schiller’s poem dates from 1785. Beethoven was already thinking of setting it to music in the early 1790s, more than thirty years before his Ninth Symphony.',
  },
  {
    id: 'hanon-1', titre: 'Hanon, Exercise No. 1 (simplified)', compositeur: 'Charles-Louis Hanon', annee: 1873,
    origine: '“The Virtuoso Pianist in 60 Exercises”', palier: 6, niveau: 2, tempo: 60, mesure: '2/4',
    droite: 'C4:0.25/1 E4:0.25/2 F4:0.25/3 G4:0.25/4 A4:0.25/5 G4:0.25/4 F4:0.25/3 E4:0.25/2 | D4:0.25/1 F4:0.25/2 G4:0.25/3 A4:0.25/4 B4:0.25/5 A4:0.25/4 G4:0.25/3 F4:0.25/2 | E4:0.25/1 G4:0.25/2 A4:0.25/3 B4:0.25/4 C5:0.25/5 B4:0.25/4 A4:0.25/3 G4:0.25/2 | F4:0.25/1 A4:0.25/2 B4:0.25/3 C5:0.25/4 D5:0.25/5 C5:0.25/4 B4:0.25/3 A4:0.25/2 | D5:0.25/5 B4:0.25/4 A4:0.25/3 G4:0.25/2 F4:0.25/1 G4:0.25/2 A4:0.25/3 B4:0.25/4 | C5:0.25/5 A4:0.25/4 G4:0.25/3 F4:0.25/2 E4:0.25/1 F4:0.25/2 G4:0.25/3 A4:0.25/4 | B4:0.25/5 G4:0.25/4 F4:0.25/3 E4:0.25/2 D4:0.25/1 E4:0.25/2 F4:0.25/3 G4:0.25/4 | A4:0.25/5 F4:0.25/4 E4:0.25/3 D4:0.25/2 C4:0.25/1 D4:0.25/2 E4:0.25/3 F4:0.25/4 | G4:0.25/5 E4:0.25/4 D4:0.25/3 C4:0.25/2 B3:0.25/1 C4:0.25/2 D4:0.25/3 E4:0.25/4 | C4:2/1',
    gauche: 'C3:0.25/5 E3:0.25/4 F3:0.25/3 G3:0.25/2 A3:0.25/1 G3:0.25/2 F3:0.25/3 E3:0.25/4 | D3:0.25/5 F3:0.25/4 G3:0.25/3 A3:0.25/2 B3:0.25/1 A3:0.25/2 G3:0.25/3 F3:0.25/4 | E3:0.25/5 G3:0.25/4 A3:0.25/3 B3:0.25/2 C4:0.25/1 B3:0.25/2 A3:0.25/3 G3:0.25/4 | F3:0.25/5 A3:0.25/4 B3:0.25/3 C4:0.25/2 D4:0.25/1 C4:0.25/2 B3:0.25/3 A3:0.25/4 | D4:0.25/1 B3:0.25/2 A3:0.25/3 G3:0.25/4 F3:0.25/5 G3:0.25/4 A3:0.25/3 B3:0.25/2 | C4:0.25/1 A3:0.25/2 G3:0.25/3 F3:0.25/4 E3:0.25/5 F3:0.25/4 G3:0.25/3 A3:0.25/2 | B3:0.25/1 G3:0.25/2 F3:0.25/3 E3:0.25/4 D3:0.25/5 E3:0.25/4 F3:0.25/3 G3:0.25/2 | A3:0.25/1 F3:0.25/2 E3:0.25/3 D3:0.25/4 C3:0.25/5 D3:0.25/4 E3:0.25/3 F3:0.25/2 | G3:0.25/1 E3:0.25/2 D3:0.25/3 C3:0.25/4 B2:0.25/5 C3:0.25/4 D3:0.25/3 E3:0.25/2 | C3:2/5',
    histoire: 'Charles-Louis Hanon, a piano teacher in Boulogne-sur-Mer, published his exercises in 1873. Beginners and experienced pianists still practice them to even out their fingers.',
  },
  {
    id: 'douce-nuit', titre: 'Silent Night', compositeur: 'Franz Xaver Gruber', annee: 1818,
    origine: '“Stille Nacht”, words by Joseph Mohr', palier: 6, niveau: 3, tempo: 60, mesure: '6/8',
    droite: 'G4:0.75/3 A4:0.25/4 G4:0.5/3 E4:1.5/1 | G4:0.75/3 A4:0.25/4 G4:0.5/3 E4:1.5/1 | D5:1/5 D5:0.5/5 B4:1.5/3 | C5:1/4 C5:0.5/4 G4:1.5/1 | A4:1/3 A4:0.5/3 C5:0.75/5 B4:0.25/4 A4:0.5/3 | G4:0.75/2 A4:0.25/3 G4:0.5/2 E4:1.5/1 | A4:1/3 A4:0.5/3 C5:0.75/5 B4:0.25/4 A4:0.5/3 | G4:0.75/2 A4:0.25/3 G4:0.5/2 E4:1.5/1 | D5:1/3 D5:0.5/3 F5:0.75/5 D5:0.25/3 B4:0.5/1 | C5:1.5/2 E5:1/4 -:0.5 | C5:0.75/5 G4:0.25/3 E4:0.5/1 G4:0.75/3 F4:0.25/2 D4:0.5/1 | C4:2.5/1 -:0.5',
    gauche: 'C3:3/1 | C3:3/1 | G2:3/4 | C3:3/1 | F2:3/5 | C3:3/1 | F2:3/5 | C3:3/1 | G2:3/4 | C3:3/1 | C3:1.5/1 G2:1.5/4 | C3:2.5/1 -:0.5',
    histoire: 'On Christmas Eve 1818, in Oberndorf, Austria, Franz Xaver Gruber and the priest Joseph Mohr sang “Stille Nacht” for the first time, accompanied by a guitar.',
  },

  // ---------------------------------------------------------------- Palier 7
  {
    id: 'amazing-grace', titre: 'Amazing Grace', compositeur: 'Traditional (“New Britain” tune)', annee: 1779,
    origine: 'Hymn by John Newton', palier: 7, niveau: 3, tempo: 80, mesure: '3/4',
    droite: 'G4:1/1 | C5:2/2 E5:0.5/4 C5:0.5/2 | E5:2/4 D5:1/3 | C5:2/2 A4:1/1 | G4:2/1 G4:1/1 | C5:2/2 E5:0.5/4 C5:0.5/2 | E5:2/4 D5:1/3 | G5:2/5 E5:1/3 | G5:1.5/5 E5:0.5/3 G5:0.5/5 E5:0.5/3 | C5:2/1 G4:1/1 | A4:1.5/2 C5:0.5/4 C5:0.5/4 A4:0.5/2 | G4:2/1 G4:1/1 | C5:2/2 E5:0.5/4 C5:0.5/2 | E5:2/4 D5:1/3 | C5:3/2',
    gauche: '-:1 | C3+E3+G3:3/5+3+1 | C3+E3+G3:2/5+3+1 B2+D3+G3:1/5+3+1 | C3+E3+A3:2/5+3+1 C3+F3+A3:1/5+2+1 | C3+E3+G3:3/5+3+1 | C3+E3+G3:3/5+3+1 | C3+E3+G3:2/5+3+1 B2+D3+G3:1/5+3+1 | C3+E3+G3:3/5+3+1 | C3+E3+G3:3/5+3+1 | C3+E3+G3:3/5+3+1 | C3+F3+A3:3/5+2+1 | C3+E3+G3:3/5+3+1 | C3+E3+A3:2/5+3+1 C3+E3+G3:1/5+3+1 | C3+E3+G3:2/5+3+1 B2+D3+G3:1/5+3+1 | C3+E3+G3:3/5+3+1',
    histoire: 'The words were written by John Newton, a former slave trader who became a minister, and published in 1779. They have been sung to the tune “New Britain” since 1835.',
  },
  {
    id: 'prelude-en-do', titre: 'Prelude in C (opening)', compositeur: 'Johann Sebastian Bach', annee: 1722,
    origine: '“The Well-Tempered Clavier”, Book I, Prelude No. 1, BWV 846', palier: 7, niveau: 3, tempo: 66, mesure: '4/4',
    droite: '-:0.5 G4:0.25/1 C5:0.25/3 E5:0.25/5 G4:0.25/1 C5:0.25/3 E5:0.25/5 -:0.5 G4:0.25/1 C5:0.25/3 E5:0.25/5 G4:0.25/1 C5:0.25/3 E5:0.25/5 | -:0.5 A4:0.25/1 D5:0.25/3 F5:0.25/5 A4:0.25/1 D5:0.25/3 F5:0.25/5 -:0.5 A4:0.25/1 D5:0.25/3 F5:0.25/5 A4:0.25/1 D5:0.25/3 F5:0.25/5 | -:0.5 G4:0.25/1 D5:0.25/4 F5:0.25/5 G4:0.25/1 D5:0.25/4 F5:0.25/5 -:0.5 G4:0.25/1 D5:0.25/4 F5:0.25/5 G4:0.25/1 D5:0.25/4 F5:0.25/5 | -:0.5 G4:0.25/1 C5:0.25/3 E5:0.25/5 G4:0.25/1 C5:0.25/3 E5:0.25/5 -:0.5 G4:0.25/1 C5:0.25/3 E5:0.25/5 G4:0.25/1 C5:0.25/3 E5:0.25/5 | G4+C5+E5:4/1+3+5',
    gauche: 'C4:0.25/5 E4:1.75/3 C4:0.25/5 E4:1.75/3 | C4:0.25/5 D4:1.75/4 C4:0.25/5 D4:1.75/4 | B3:0.25/5 D4:1.75/3 B3:0.25/5 D4:1.75/3 | C4:0.25/5 E4:1.75/3 C4:0.25/5 E4:1.75/3 | C4+E4:4/5+3',
    histoire: 'This prelude opens the first book of “The Well-Tempered Clavier”, completed in 1722. More than a century later, Charles Gounod set the melody of his “Ave Maria” over it.',
  },
  {
    id: 'le-beau-danube-bleu', titre: 'The Blue Danube (theme)', compositeur: 'Johann Strauss II', annee: 1867,
    origine: 'Waltz “An der schönen blauen Donau”, Op. 314', palier: 7, niveau: 4, tempo: 120, mesure: '3/4',
    droite: 'C4:1/1 | C4:1/1 E4:1/3 G4:1/5 | G4:2/5 G5:1/5 | G5:2/5 E5:1/3 | E5:2/3 C4:1/1 | C4:1/1 E4:1/3 G4:1/5 | G4:2/5 G5:1/5 | G5:2/5 F5:1/4 | F5:2/4 B3:1/1 | B3:1/1 D4:1/2 A4:1/5 | A4:2/5 A5:1/5 | A5:2/5 F5:1/3 | F5:2/3 B3:1/1 | B3:1/1 D4:1/2 A4:1/5 | A4:2/5 A5:1/5 | A5:2/5 E5:1/2 | E5:3/2',
    gauche: '-:1 | -:3 | C3+E3+G3:3/5+3+1 | C3+E3+G3:3/5+3+1 | C3+E3+G3:3/5+3+1 | C3+E3+G3:3/5+3+1 | B2+D3+G3:3/5+3+1 | B2+D3+G3:3/5+3+1 | B2+D3+G3:3/5+3+1 | B2+D3+G3:3/5+3+1 | B2+D3+G3:3/5+3+1 | B2+D3+G3:3/5+3+1 | B2+D3+G3:3/5+3+1 | B2+D3+G3:3/5+3+1 | C3+E3+G3:3/5+3+1 | C3+E3+G3:3/5+3+1 | C3+E3+G3:3/5+3+1',
    histoire: 'Johann Strauss II wrote this waltz in Vienna in 1867. It is played every year at the Vienna Philharmonic’s New Year’s Concert.',
  },

  // ---------------------------------------------------------------- Palier 8
  {
    id: 'lettre-a-elise', titre: 'Für Elise', compositeur: 'Ludwig van Beethoven', annee: 1810,
    origine: 'Bagatelle in A minor, WoO 59', palier: 8, niveau: 4, tempo: 66, mesure: '3/8',
    droite: 'E5:0.25/5 D#5:0.25/4 | E5:0.25/5 D#5:0.25/4 E5:0.25/5 B4:0.25/2 D5:0.25/4 C5:0.25/3 | A4:0.5/1 -:0.25 C4:0.25/1 E4:0.25/2 A4:0.25/4 | B4:0.5/5 -:0.25 E4:0.25/1 G#4:0.25/3 B4:0.25/4 | C5:0.5/5 -:0.25 E4:0.25/1 E5:0.25/5 D#5:0.25/4 | E5:0.25/5 D#5:0.25/4 E5:0.25/5 B4:0.25/2 D5:0.25/4 C5:0.25/3 | A4:0.5/1 -:0.25 C4:0.25/1 E4:0.25/2 A4:0.25/4 | B4:0.5/5 -:0.25 E4:0.25/1 C5:0.25/4 B4:0.25/3 | A4:1/2 E5:0.25/5 D#5:0.25/4 | E5:0.25/5 D#5:0.25/4 E5:0.25/5 B4:0.25/2 D5:0.25/4 C5:0.25/3 | A4:0.5/1 -:0.25 C4:0.25/1 E4:0.25/2 A4:0.25/4 | B4:0.5/5 -:0.25 E4:0.25/1 G#4:0.25/3 B4:0.25/4 | C5:0.5/5 -:0.25 E4:0.25/1 E5:0.25/5 D#5:0.25/4 | E5:0.25/5 D#5:0.25/4 E5:0.25/5 B4:0.25/2 D5:0.25/4 C5:0.25/3 | A4:0.5/1 -:0.25 C4:0.25/1 E4:0.25/2 A4:0.25/4 | B4:0.5/5 -:0.25 E4:0.25/1 C5:0.25/4 B4:0.25/3 | A4:1/2',
    gauche: '-:0.5 | -:1.5 | A2:0.25/5 E3:0.25/2 A3:0.25/1 -:0.75 | E2:0.25/5 E3:0.25/2 G#3:0.25/1 -:0.75 | A2:0.25/5 E3:0.25/2 A3:0.25/1 -:0.75 | -:1.5 | A2:0.25/5 E3:0.25/2 A3:0.25/1 -:0.75 | E2:0.25/5 E3:0.25/2 G#3:0.25/1 -:0.75 | A2:0.25/5 E3:0.25/2 A3:0.25/1 -:0.75 | -:1.5 | A2:0.25/5 E3:0.25/2 A3:0.25/1 -:0.75 | E2:0.25/5 E3:0.25/2 G#3:0.25/1 -:0.75 | A2:0.25/5 E3:0.25/2 A3:0.25/1 -:0.75 | -:1.5 | A2:0.25/5 E3:0.25/2 A3:0.25/1 -:0.75 | E2:0.25/5 E3:0.25/2 G#3:0.25/1 -:0.75 | A2:0.25/5 E3:0.25/2 A3:0.25/1 -:0.25',
    histoire: 'Beethoven wrote this bagatelle in 1810, but it was not published until 1867, forty years after his death. We still don’t know for certain who Elise was.',
  },
  {
    id: 'menuet-en-sol', titre: 'Minuet in G', compositeur: 'Christian Petzold', annee: 1725,
    origine: 'Notebook for Anna Magdalena Bach, BWV Anh. 114', palier: 8, niveau: 4, tempo: 96, mesure: '3/4',
    droite: 'D5:1/5 G4:0.5/1 A4:0.5/2 B4:0.5/3 C5:0.5/4 | D5:1/5 G4:1/1 G4:1/1 | E5:1/5 C5:0.5/1 D5:0.5/2 E5:0.5/3 F#5:0.5/4 | G5:1/5 G4:1/1 G4:1/1 | C5:1/4 D5:0.5/5 C5:0.5/4 B4:0.5/3 A4:0.5/2 | B4:1/3 C5:0.5/4 B4:0.5/3 A4:0.5/2 G4:0.5/1 | F#4:1/2 G4:0.5/1 A4:0.5/2 B4:0.5/3 G4:0.5/1 | A4:3/2 | D5:1/5 G4:0.5/1 A4:0.5/2 B4:0.5/3 C5:0.5/4 | D5:1/5 G4:1/1 G4:1/1 | E5:1/5 C5:0.5/1 D5:0.5/2 E5:0.5/3 F#5:0.5/4 | G5:1/5 G4:1/1 G4:1/1 | C5:1/4 D5:0.5/5 C5:0.5/4 B4:0.5/3 A4:0.5/2 | B4:1/3 C5:0.5/4 B4:0.5/3 A4:0.5/2 G4:0.5/1 | A4:1/3 B4:0.5/4 A4:0.5/3 G4:0.5/2 F#4:0.5/1 | G4:3/2',
    gauche: 'G3+B3+D4:2/5+3+1 A3:1/4 | B3:3/3 | C4:3/2 | B3:3/3 | A3:3/4 | G3:3/5 | D4:1/1 B3:1/3 G3:1/5 | D4:1/1 D3:0.5/5 C4:0.5/1 B3:0.5/2 A3:0.5/3 | B3:2/2 A3:1/3 | G3:1/4 B3:1/2 G3:1/4 | C4:3/1 | B3:1/2 C4:0.5/1 B3:0.5/2 A3:0.5/3 G3:0.5/4 | A3:2/3 F#3:1/5 | G3:2/4 B3:1/2 | C4:1/2 D4:1/1 D3:1/5 | G3:2/1 G2:1/5',
    histoire: 'Long attributed to Johann Sebastian Bach, this minuet appears in the music notebook given to his wife Anna Magdalena in 1725. We now know it is by the organist Christian Petzold.',
  },
  {
    id: 'gymnopedie-1', titre: 'Gymnopédie No. 1 (opening)', compositeur: 'Erik Satie', annee: 1888,
    origine: '“Trois Gymnopédies”', palier: 8, niveau: 3, tempo: 66, mesure: '3/4',
    droite: '-:3 | -:3 | -:3 | -:3 | -:1 E5:1/3 G5:1/5 | F5:1/4 E5:1/3 B4:1/1 | A4:1/1 B4:1/2 C5:1/3 | G4:3/1 | E4:3/1 | -:3 | -:3 | -:3 | -:1 E5:1/3 G5:1/5 | F5:1/4 E5:1/3 B4:1/1 | A4:1/1 B4:1/2 C5:1/3 | G4:3/1',
    gauche: 'F2:1/5 A3+C4+E4:2/4+2+1 | C2:1/5 G3+B3+E4:2/4+2+1 | F2:1/5 A3+C4+E4:2/4+2+1 | C2:1/5 G3+B3+E4:2/4+2+1 | F2:1/5 A3+C4+E4:2/4+2+1 | C2:1/5 G3+B3+E4:2/4+2+1 | F2:1/5 A3+C4+E4:2/4+2+1 | C2:1/5 G3+B3+E4:2/4+2+1 | F2:1/5 A3+C4:2/2+1 | C2:1/5 G3+B3+E4:2/4+2+1 | F2:1/5 A3+C4+E4:2/4+2+1 | C2:1/5 G3+B3+E4:2/4+2+1 | F2:1/5 A3+C4+E4:2/4+2+1 | C2:1/5 G3+B3+E4:2/4+2+1 | F2:1/5 A3+C4+E4:2/4+2+1 | C2:1/5 G3+B3+E4:2/4+2+1',
    histoire: 'Erik Satie was 22 when the first Gymnopédie came out, in the summer of 1888, in a Paris magazine. Its slowness and calm contrasted sharply with the music of the time.',
  },
  {
    id: 'marche-turque', titre: 'Turkish March (theme)', compositeur: 'Wolfgang Amadeus Mozart', annee: 1783,
    origine: 'Piano Sonata No. 11, K. 331, “Alla turca”', palier: 8, niveau: 4, tempo: 100, mesure: '2/4',
    droite: 'B4:0.25/4 A4:0.25/3 G#4:0.25/2 A4:0.25/1 | C5:0.5/3 -:0.5 D5:0.25/3 C5:0.25/2 B4:0.25/1 C5:0.25/2 | E5:0.5/4 -:0.5 F5:0.25/4 E5:0.25/3 D#5:0.25/2 E5:0.25/1 | B5:0.25/4 A5:0.25/3 G#5:0.25/2 A5:0.25/1 B5:0.25/4 A5:0.25/3 G#5:0.25/2 A5:0.25/1 | C6:1/5 A5:0.5/2 C6:0.5/5 | B5:0.5/5 F#5+A5:0.5/2+4 E5+G5:0.5/1+3 F#5+A5:0.5/2+4 | B5:0.5/5 F#5+A5:0.5/2+4 E5+G5:0.5/1+3 F#5+A5:0.5/2+4 | B5:0.5/5 F#5+A5:0.5/2+4 E5+G5:0.5/1+3 D#5+F#5:0.5/2+4 | E5:1/3 B4:0.25/4 A4:0.25/3 G#4:0.25/2 A4:0.25/1 | C5:0.5/3 -:0.5 D5:0.25/3 C5:0.25/2 B4:0.25/1 C5:0.25/2 | E5:0.5/4 -:0.5 F5:0.25/4 E5:0.25/3 D#5:0.25/2 E5:0.25/1 | B5:0.25/4 A5:0.25/3 G#5:0.25/2 A5:0.25/1 B5:0.25/4 A5:0.25/3 G#5:0.25/2 A5:0.25/1 | C6:1/5 A5:0.5/2 C6:0.5/5 | B5:0.5/5 F#5+A5:0.5/2+4 E5+G5:0.5/1+3 F#5+A5:0.5/2+4 | B5:0.5/5 F#5+A5:0.5/2+4 E5+G5:0.5/1+3 F#5+A5:0.5/2+4 | B5:0.5/5 F#5+A5:0.5/2+4 E5+G5:0.5/1+3 D#5+F#5:0.5/2+4 | E5:1/3',
    gauche: '-:1 | A3:0.5/5 C4+E4:0.5/2+1 C4+E4:0.5/2+1 C4+E4:0.5/2+1 | A3:0.5/5 C4+E4:0.5/2+1 C4+E4:0.5/2+1 C4+E4:0.5/2+1 | A3:0.5/5 C4+E4:0.5/2+1 A3:0.5/5 C4+E4:0.5/2+1 | A3:0.5/5 C4+E4:0.5/2+1 C4+E4:0.5/2+1 C4+E4:0.5/2+1 | E3:0.5/5 B3+E4:0.5/2+1 B3+E4:0.5/2+1 B3+E4:0.5/2+1 | E3:0.5/5 B3+E4:0.5/2+1 B3+E4:0.5/2+1 B3+E4:0.5/2+1 | E3:0.5/5 B3+E4:0.5/2+1 B2:0.5/5 B3:0.5/1 | E3:1/5 -:1 | A3:0.5/5 C4+E4:0.5/2+1 C4+E4:0.5/2+1 C4+E4:0.5/2+1 | A3:0.5/5 C4+E4:0.5/2+1 C4+E4:0.5/2+1 C4+E4:0.5/2+1 | A3:0.5/5 C4+E4:0.5/2+1 A3:0.5/5 C4+E4:0.5/2+1 | A3:0.5/5 C4+E4:0.5/2+1 C4+E4:0.5/2+1 C4+E4:0.5/2+1 | E3:0.5/5 B3+E4:0.5/2+1 B3+E4:0.5/2+1 B3+E4:0.5/2+1 | E3:0.5/5 B3+E4:0.5/2+1 B3+E4:0.5/2+1 B3+E4:0.5/2+1 | E3:0.5/5 B3+E4:0.5/2+1 B2:0.5/5 B3:0.5/1 | E3:1/5',
    histoire: 'It is the last movement of a Mozart sonata written around 1783. It imitates Turkish military bands, which were very fashionable in Vienna at the time.',
  },
  {
    id: 'roi-de-la-montagne', titre: 'In the Hall of the Mountain King', compositeur: 'Edvard Grieg', annee: 1876,
    origine: '“Peer Gynt” (Suite No. 1, Op. 46)', palier: 8, niveau: 4, tempo: 100, mesure: '4/4',
    droite: 'A3:0.5/1 B3:0.5/2 C4:0.5/3 D4:0.5/4 E4:0.5/5 C4:0.5/3 E4:1/5 | D#4:0.5/4 B3:0.5/2 D#4:1/4 D4:0.5/4 Bb3:0.5/2 D4:1/4 | A3:0.5/1 B3:0.5/2 C4:0.5/3 D4:0.5/4 E4:0.5/5 C4:0.5/1 E4:0.5/3 A4:0.5/5 | G4:0.5/4 E4:0.5/2 C4:0.5/1 E4:0.5/2 G4:2/4 | A4:0.5/1 B4:0.5/2 C5:0.5/3 D5:0.5/4 E5:0.5/5 C5:0.5/3 E5:1/5 | D#5:0.5/4 B4:0.5/2 D#5:1/4 D5:0.5/4 Bb4:0.5/2 D5:1/4 | A4:0.5/1 B4:0.5/2 C5:0.5/3 D5:0.5/4 E5:0.5/5 C5:0.5/1 E5:0.5/3 A5:0.5/5 | G5:0.5/4 E5:0.5/2 C5:0.5/1 E5:0.5/2 G4+G5:2/1+5 | E4:0.5/1 F#4:0.5/2 G#4:0.5/3 A4:0.5/4 B4:0.5/5 G#4:0.5/3 B4:1/5 | C5:0.5/4 G#4:0.5/1 C5:1/4 B4:0.5/3 G#4:0.5/1 B4:1/3 | E4:0.5/1 F#4:0.5/2 G#4:0.5/3 A4:0.5/4 B4:0.5/5 G#4:0.5/3 B4:1/5 | C5:0.5/4 G#4:0.5/1 C5:1/4 B4:2/3 | E5:0.5/1 F#5:0.5/2 G#5:0.5/3 A5:0.5/4 B5:0.5/5 G#5:0.5/3 B5:1/5 | C6:0.5/4 G#5:0.5/1 C6:1/4 B5:0.5/3 G#5:0.5/1 B5:1/3 | E5:0.5/1 F#5:0.5/2 G#5:0.5/3 A5:0.5/4 B5:0.5/5 G#5:0.5/3 B5:1/5 | C6:0.5/4 G#5:0.5/1 C6:1/4 B4+B5:2/1+5',
    gauche: 'A2:1/5 E3:1/1 A2:1/5 E3:1/1 | A2:1/5 E3:1/1 A2:1/5 E3:1/1 | A2:1/5 E3:1/1 A2:1/5 E3:1/1 | C3:1/5 G3:1/1 C3:1/5 G3:1/1 | A2:1/5 E3:1/1 A2:1/5 E3:1/1 | A2:1/5 E3:1/1 A2:1/5 E3:1/1 | A2:1/5 E3:1/1 A2:1/5 E3:1/1 | C3:1/5 G3:1/1 C3:1/5 G3:1/1 | E3:1/5 B3:1/1 E3:1/5 B3:1/1 | C3:1/5 G#3:1/2 E3:1/4 B3:1/1 | E3:1/5 B3:1/1 E3:1/5 B3:1/1 | C3:1/5 G#3:1/2 E3:1/4 B3:1/1 | E3:1/5 B3:1/1 E3:1/5 B3:1/1 | C3:1/5 G#3:1/2 E3:1/4 B3:1/1 | E3:1/5 B3:1/1 E3:1/5 B3:1/1 | C3:1/5 G#3:1/2 E3:1/4 B3:1/1',
    histoire: 'Grieg wrote this music for Henrik Ibsen’s play “Peer Gynt”, first staged in 1876. The same motif keeps coming back, higher and higher, faster and faster, louder and louder.',
  },
  {
    id: 'greensleeves', titre: 'Greensleeves', compositeur: 'Traditional English', annee: 1580,
    origine: '16th-century English ballad', palier: 8, niveau: 3, tempo: 90, mesure: '6/8',
    droite: 'A4:0.5/1 | C5:1/2 D5:0.5/3 E5:0.75/4 F5:0.25/5 E5:0.5/4 | D5:1/3 B4:0.5/1 G4:0.75/1 A4:0.25/2 B4:0.5/3 | C5:1/4 A4:0.5/2 A4:0.75/2 G#4:0.25/1 A4:0.5/2 | B4:1.5/3 E4:1/1 A4:0.5/1 | C5:1/2 D5:0.5/3 E5:0.75/4 F5:0.25/5 E5:0.5/4 | D5:1/3 B4:0.5/1 G4:0.75/1 A4:0.25/2 B4:0.5/3 | C5:0.75/5 B4:0.25/4 A4:0.5/3 G#4:0.75/2 F#4:0.25/1 G#4:0.5/2 | A4:1.5/3 A4:1/3 -:0.5 | G5:1.5/3 G5:0.75/3 F#5:0.25/2 E5:0.5/1 | D5:1/5 B4:0.5/3 G4:0.75/1 A4:0.25/2 B4:0.5/3 | C5:1/4 A4:0.5/2 A4:0.75/2 G#4:0.25/1 A4:0.5/2 | B4:1/5 G#4:0.5/3 E4:1/1 -:0.5 | G5:1.5/3 G5:0.75/3 F5:0.25/2 E5:0.5/1 | D5:1/5 B4:0.5/3 G4:0.75/1 A4:0.25/2 B4:0.5/3 | C5:0.75/5 B4:0.25/4 A4:0.5/3 G#4:0.75/2 F#4:0.25/1 G#4:0.5/2 | A4:1.5/3 A4:1/3',
    histoire: 'A ballad called “Greensleeves” was registered in London in 1580. The legend that credits it to King Henry VIII has never been proven.',
  },
  {
    id: 'danny-boy', titre: 'Danny Boy', compositeur: 'Traditional Irish', annee: 1855,
    origine: '“Londonderry Air”', palier: 8, niveau: 3, tempo: 72, mesure: '4/4',
    droite: 'B3:0.5/1 C4:0.5/2 D4:0.5/3 | E4:1.5/4 D4:0.5/3 E4:0.5/1 A4:0.5/4 G4:0.5/3 E4:0.5/1 | D4:0.5/3 C4:0.5/2 A3:1/1 -:0.5 C4:0.5/1 E4:0.5/2 F4:0.5/3 | G4:1.5/4 A4:0.5/5 G4:0.5/4 E4:0.5/2 C4:0.5/1 E4:0.5/2 | D4:2/1 -:0.5 B3:0.5/1 C4:0.5/2 D4:0.5/3 | E4:1.5/4 D4:0.5/3 E4:0.5/1 A4:0.5/4 G4:0.5/3 E4:0.5/1 | D4:0.5/3 C4:0.5/2 A3:0.5/1 G#3:0.5/2 A3:0.5/1 B3:0.5/2 C4:0.5/1 D4:0.5/2 | E4:1.5/3 F4:0.5/4 E4:0.5/3 D4:0.5/2 C4:0.5/1 D4:0.5/2 | C4:2/1 -:0.5 G4:0.5/2 A4:0.5/3 B4:0.5/4 | C5:1.5/5 B4:0.5/4 B4:0.5/4 A4:0.5/3 G4:0.5/2 E4:0.5/1 | G4:0.5/5 E4:0.5/3 C4:1/1 -:0.5 G4:0.5/2 A4:0.5/3 B4:0.5/4 | C5:1.5/5 B4:0.5/4 B4:0.5/4 A4:0.5/3 G4:0.5/2 E4:0.5/1 | D4:2/1 -:0.5 G4:0.5/1 G4:0.5/1 G4:0.5/1 | E5:1.5/5 D5:0.5/4 D5:0.5/4 C5:0.5/3 A4:0.5/1 C5:0.5/3 | G4:0.5/1 E4:0.5/3 C4:1/1 -:0.5 B3:0.5/1 C4:0.5/2 D4:0.5/3 | E4:0.5/1 A4:0.5/4 G4:0.5/3 E4:0.5/1 D4:0.5/3 C4:0.5/2 A3:0.5/1 B3:0.5/2 | C4:2.5/3',
    histoire: 'This Irish tune was published in 1855 in George Petrie’s collection. In 1913, Frederic Weatherly set the words of “Danny Boy” to it.',
  },
  {
    id: 'la-surprise', titre: 'Surprise Symphony (theme)', compositeur: 'Joseph Haydn', annee: 1791,
    origine: 'Symphony No. 94, second movement', palier: 8, niveau: 2, tempo: 60, mesure: '2/4',
    droite: 'C4:0.5/1 C4:0.5/1 E4:0.5/3 E4:0.5/3 | G4:0.5/5 G4:0.5/5 E4:1/3 | F4:0.5/5 F4:0.5/5 D4:0.5/3 D4:0.5/3 | B3:0.5/1 B3:0.5/1 G3:1/1 | C4:0.5/1 C4:0.5/1 E4:0.5/3 E4:0.5/3 | G4:0.5/5 G4:0.5/5 E4:1/3 | C5:0.5/5 C5:0.5/5 F#4:0.5/1 F#4:0.5/1 | G4:1/2 G3:0.5/1 -:0.5 | C4:0.5/1 C4:0.5/1 E4:0.5/3 E4:0.5/3 | G4:0.5/5 G4:0.5/5 E4:1/3 | F4:0.5/5 F4:0.5/5 D4:0.5/3 D4:0.5/3 | B3:0.5/1 B3:0.5/1 G3:1/1 | C4:0.5/1 C4:0.5/1 E4:0.5/3 E4:0.5/3 | G4:0.5/5 G4:0.5/5 E4:1/3 | C5:0.5/5 C5:0.5/5 F#4:0.5/1 F#4:0.5/1 | G4:0.5/2 -:0.5 B4+G5:1/1+5',
    gauche: '-:2 | -:2 | -:2 | -:2 | -:2 | -:2 | -:2 | -:2 | -:2 | -:2 | -:2 | -:2 | -:2 | -:2 | -:2 | -:1 D4:1/1',
    histoire: 'Haydn premiered this symphony in London in 1792. In the middle of the very soft theme, a fortissimo chord suddenly bursts out: that’s the “surprise”.',
  },
  {
    id: 'schumann-melodie', titre: 'Melody (Album for the Young)', compositeur: 'Robert Schumann', annee: 1848,
    origine: '“Album for the Young”, Op. 68 No. 1', palier: 8, niveau: 3, tempo: 80, mesure: '4/4',
    droite: 'E5:1/5 D5:1/4 C5:1/3 B4:1/2 | A4:0.5/1 C5:0.5/3 B4:0.5/2 D5:0.5/4 C5:1/3 G4:1/1 | G5:1/5 F5:1/4 E5:1/3 C5:1/2 | B4:1/1 F#4+A4:1/2+3 G4:1/1 -:1 | E5:1/5 D5:1/4 C5:1/3 B4:1/2 | A4:0.5/1 C5:0.5/3 B4:0.5/2 D5:0.5/4 C5:1/3 G4:1/1 | G5:1/5 F5:1/4 E5:1/3 C5:1/2 | B4:1/1 F#4+A4:1/2+3 G4:1/1 -:1',
    gauche: 'C4:0.5/5 G4:0.5/1 F4:0.5/2 G4:0.5/1 E4:0.5/3 G4:0.5/1 C4:0.5/5 E4:0.5/3 | F4:0.5/2 D4:0.5/4 G4:0.5/1 F4:0.5/2 E4:0.5/3 F4:0.5/2 E4:0.5/3 D4:0.5/4 | E4:0.5/3 G4:0.5/1 D4:0.5/4 G4:0.5/1 C4:0.5/5 G4:0.5/1 E4:0.5/3 G4:0.5/1 | D4:0.5/4 G4:0.5/1 C4:0.5/5 D4:0.5/4 B3:0.5/5 D4:0.5/2 G3:1/5 | C4:0.5/5 G4:0.5/1 F4:0.5/2 G4:0.5/1 E4:0.5/3 G4:0.5/1 C4:0.5/5 E4:0.5/3 | F4:0.5/2 D4:0.5/4 G4:0.5/1 F4:0.5/2 E4:0.5/3 F4:0.5/2 E4:0.5/3 D4:0.5/4 | E4:0.5/3 G4:0.5/1 D4:0.5/4 G4:0.5/1 C4:0.5/5 G4:0.5/1 E4:0.5/3 G4:0.5/1 | D4:0.5/4 G4:0.5/1 C4:0.5/5 D4:0.5/4 B3:0.5/5 D4:0.5/2 G3:1/5',
    histoire: 'Schumann wrote his “Album for the Young” in 1848, at first for the seventh birthday of his eldest daughter, Marie. “Melody” is its very first piece.',
  },
  {
    id: 'arabesque-burgmuller', titre: 'Arabesque (opening)', compositeur: 'Friedrich Burgmüller', annee: 1851,
    origine: '“25 Easy and Progressive Studies”, Op. 100 No. 2', palier: 8, niveau: 4, tempo: 100, mesure: '2/4',
    droite: '-:2 | -:2 | A4:0.25/1 B4:0.25/2 C5:0.25/3 B4:0.25/2 A4:0.5/1 -:0.5 | A4:0.25/1 B4:0.25/2 C5:0.25/3 D5:0.25/4 E5:0.5/5 -:0.5 | D5:0.25/1 E5:0.25/2 F5:0.25/3 G5:0.25/4 A5:0.5/5 -:0.5 | A5:0.25/1 B5:0.25/2 C6:0.25/3 D6:0.25/4 E6:0.5/5 -:0.5 | -:0.5 E5:0.5/3 E5:0.5/3 F5:0.5/4 | D5:0.5/2 -:0.5 D5:1/2 | -:0.5 G5:0.5/5 D5:0.5/2 E5:0.5/3 | C5:1/1 C6:0.5/5 -:0.5',
    gauche: 'A3+C4+E4:1/5+3+1 A3+C4+E4:1/5+3+1 | A3+C4+E4:1/5+3+1 A3+C4+E4:1/5+3+1 | A3+C4+E4:1/5+3+1 A3+C4+E4:1/5+3+1 | A3+C4+E4:1/5+3+1 A3+C4+E4:1/5+3+1 | A3+D4+F4:1/5+2+1 A3+D4+F4:1/5+2+1 | A3+C4+E4:1/5+3+1 A3+C4+E4:1/5+3+1 | G3+C4+E4:1/5+2+1 G3+C4+E4:1/5+2+1 | G3+B3+F4:1/5+3+1 G3+B3+F4:1/5+3+1 | G3+B3+F4:1/5+3+1 G3+B3+F4:1/5+3+1 | C4+E4:1.5/2+1 -:0.5',
    histoire: 'Friedrich Burgmüller, a German pianist living in Paris, published his 25 studies in 1851. “Arabesque” is one of the pieces most often played by young pianists.',
  },
];
