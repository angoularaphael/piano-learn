// Les paliers du parcours. Les lecons du palier 1 seront jouables en premier.
export const PALIERS = [
  {
    id: 1,
    titre: 'Découverte',
    resume: 'Se repérer sur le clavier, trouver le do, jouer do ré mi fa sol avec les bons doigts.',
    lecons: [
      {
        id: '1-1', titre: 'Bien s\'asseoir et placer ses mains',
        texte: 'Assieds-toi au bord du banc, le dos droit, les avant-bras à la hauteur du clavier. Les mains sont arrondies, comme si tu tenais une balle. Regarde, je te joue un petit air.',
        demo: [[60, 1], [60, 1], [60, 1], [62, 1], [64, 2], [62, 2], [60, 1], [64, 1], [62, 1], [62, 1], [60, 4]],
      },
      {
        id: '1-2', titre: 'Trouver le do du milieu',
        texte: 'Le do est toujours juste à gauche du groupe de deux touches noires. Celui du milieu est en face de toi. Regarde, je joue tous les do, du grave à l\'aigu.',
        demo: [[48, 2], [60, 2], [72, 2], [84, 2], [60, 4]],
        highlight: [48, 60, 72, 84],
      },
      {
        id: '1-3', titre: 'Les numéros des doigts',
        texte: 'Pouce = 1, index = 2, majeur = 3, annulaire = 4, auriculaire = 5. Pouce sur le do, et chaque doigt sur sa touche. Je joue doigt par doigt.',
        demo: [[60, 1], [62, 1], [64, 1], [65, 1], [67, 2], [65, 1], [64, 1], [62, 1], [60, 2]],
      },
      {
        id: '1-4', titre: 'Do, ré, mi',
        texte: 'Trois notes, trois doigts : pouce, index, majeur. On monte, on redescend, bien régulier.',
        demo: [[60, 1], [62, 1], [64, 2], [64, 1], [62, 1], [60, 2], [60, 1], [62, 1], [64, 1], [62, 1], [60, 4]],
      },
      {
        id: '1-5', titre: 'Fa et sol',
        texte: 'On ajoute l\'annulaire sur le fa et le petit doigt sur le sol. Garde la main bien ronde.',
        demo: [[64, 1], [65, 1], [67, 2], [67, 1], [65, 1], [64, 2], [65, 1], [67, 1], [65, 1], [64, 1], [62, 1], [60, 3]],
      },
      {
        id: '1-6', titre: 'Monter et descendre de do à sol',
        texte: 'Les cinq doigts à la suite, sans regarder tes mains si tu peux. Écoute si les notes sont bien égales. Puis je fais pareil à la main gauche.',
        demo: [[60, 1], [62, 1], [64, 1], [65, 1], [67, 1], [65, 1], [64, 1], [62, 1], [60, 2], [48, 1], [50, 1], [52, 1], [53, 1], [55, 2]],
      },
      {
        id: '1-7', titre: 'Morceau : Au clair de la lune',
        texte: 'Ton premier vrai morceau ! Deux fois la même phrase, puis une phrase qui descend plus bas : ma main va glisser vers la gauche, suis-la.',
        demo: [
          [60, 1], [60, 1], [60, 1], [62, 1], [64, 2], [62, 2], [60, 1], [64, 1], [62, 1], [62, 1], [60, 4],
          [62, 1], [62, 1], [62, 1], [62, 1], [57, 2], [57, 2], [62, 1], [60, 1], [59, 1], [57, 1], [55, 4],
          [60, 1], [60, 1], [60, 1], [62, 1], [64, 2], [62, 2], [60, 1], [64, 1], [62, 1], [62, 1], [60, 4],
        ],
      },
    ],
    final: 'Au clair de la lune (main droite)',
  },
  {
    id: 2,
    titre: 'Premières mélodies',
    resume: 'Enchaîner les notes main droite, jouer lié, sans s\'arrêter.',
    lecons: [
      {
        id: '2-1', titre: 'Jouer lié',
        texte: 'Jouer lié, c\'est ne lever un doigt qu\'au moment où le suivant appuie. Les notes se tiennent la main, sans trou entre elles.',
        demo: [[60, 1], [62, 1], [64, 1], [65, 1], [67, 2], [65, 1], [64, 1], [62, 1], [60, 2], [64, 1], [65, 1], [67, 1], [65, 1], [64, 4]],
      },
      {
        id: '2-2', titre: 'Sauter une note',
        texte: 'Maintenant on saute une touche : do-mi, ré-fa, mi-sol. La main ne bouge pas, ce sont les doigts qui choisissent.',
        demo: [[60, 1], [64, 1], [62, 1], [65, 1], [64, 1], [67, 2], [67, 1], [64, 1], [65, 1], [62, 1], [64, 1], [60, 2]],
      },
      {
        id: '2-3', titre: 'Petites phrases',
        texte: 'Une vraie petite phrase : « Ah ! vous dirai-je, maman ». Au la, ma main se décale d\'une touche, regarde bien.',
        demo: [[60, 1], [60, 1], [67, 1], [67, 1], [69, 1], [69, 1], [67, 2], [65, 1], [65, 1], [64, 1], [64, 1], [62, 1], [62, 1], [60, 2]],
      },
      {
        id: '2-4', titre: 'Jouer sans regarder ses mains',
        texte: 'Essaie de regarder l\'écran et pas tes mains. Tes doigts savent déjà où sont mi, ré et do. Fais-leur confiance.',
        demo: [[64, 1], [62, 1], [60, 1], [62, 1], [64, 1], [64, 1], [64, 2], [62, 1], [62, 1], [62, 2], [64, 1], [67, 1], [67, 2]],
      },
      {
        id: '2-5', titre: 'Jouer en rythme avec le prof',
        texte: 'Des notes longues et des notes courtes. Compte dans ta tête : les longues durent deux temps, la dernière quatre.',
        demo: [[60, 2], [62, 1], [64, 1], [65, 2], [64, 2], [62, 1], [62, 1], [60, 4]],
      },
      {
        id: '2-6', titre: 'Morceau : Frère Jacques',
        texte: 'Frère Jacques en entier. La troisième phrase va vite, et la dernière descend jusqu\'au sol grave : ma main s\'adapte, fais pareil.',
        demo: [
          [60, 1], [62, 1], [64, 1], [60, 1], [60, 1], [62, 1], [64, 1], [60, 1],
          [64, 1], [65, 1], [67, 2], [64, 1], [65, 1], [67, 2],
          [67, 0.5], [69, 0.5], [67, 0.5], [65, 0.5], [64, 1], [60, 1], [67, 0.5], [69, 0.5], [67, 0.5], [65, 0.5], [64, 1], [60, 1],
          [60, 1], [55, 1], [60, 2], [60, 1], [55, 1], [60, 2],
        ],
      },
    ],
    final: 'Frère Jacques',
  },
  {
    id: 3,
    titre: 'La main gauche',
    resume: 'Les notes graves, do à sol main gauche, puis quelques basses simples.',
    lecons: [
      { id: '3-1', titre: 'Placer la main gauche' },
      { id: '3-2', titre: 'Do à sol en descendant' },
      { id: '3-3', titre: 'Notes tenues' },
      { id: '3-4', titre: 'Basses simples' },
      { id: '3-5', titre: 'Une main puis l\'autre' },
    ],
    final: 'Ode à la joie',
  },
  {
    id: 4,
    titre: 'Lire les notes',
    resume: 'La portée, la clé de sol, la clé de fa, et lire sans chercher.',
    lecons: [
      { id: '4-1', titre: 'La portée' },
      { id: '4-2', titre: 'La clé de sol' },
      { id: '4-3', titre: 'La clé de fa' },
      { id: '4-4', titre: 'Lire et jouer' },
      { id: '4-5', titre: 'Déchiffrage rapide' },
    ],
    final: 'Morceau au choix',
  },
  {
    id: 5,
    titre: 'Le rythme',
    resume: 'Ronde, blanche, noire, croche, les silences, et compter les temps.',
    lecons: [
      { id: '5-1', titre: 'Compter les temps' },
      { id: '5-2', titre: 'Ronde, blanche, noire' },
      { id: '5-3', titre: 'Les croches' },
      { id: '5-4', titre: 'Les silences' },
      { id: '5-5', titre: 'Le point' },
    ],
    final: 'Jingle Bells',
  },
  {
    id: 6,
    titre: 'Les deux mains',
    resume: 'Mélodie à droite, basse à gauche, et les faire marcher ensemble.',
    lecons: [
      { id: '6-1', titre: 'Mains ensemble, notes longues' },
      { id: '6-2', titre: 'Basse qui ne bouge pas' },
      { id: '6-3', titre: 'Basse qui change' },
      { id: '6-4', titre: 'Garder le tempo à deux mains' },
    ],
    final: 'Lettre à Élise (début simplifié)',
  },
  {
    id: 7,
    titre: 'Les accords',
    resume: 'Do, fa et sol majeur, et accompagner une mélodie.',
    lecons: [
      { id: '7-1', titre: 'L\'accord de do' },
      { id: '7-2', titre: 'Fa et sol' },
      { id: '7-3', titre: 'Changer d\'accord en rythme' },
      { id: '7-4', titre: 'Accompagner une chanson' },
    ],
    final: 'Un morceau actuel, arrangé simple',
  },
  {
    id: 8,
    titre: 'Aller plus loin',
    resume: 'Dièses, bémols, gammes, nuances : de quoi jouer de vrais morceaux.',
    lecons: [
      { id: '8-1', titre: 'Dièses et bémols' },
      { id: '8-2', titre: 'La gamme de do' },
      { id: '8-3', titre: 'Jouer doux, jouer fort' },
      { id: '8-4', titre: 'La pédale' },
    ],
    final: 'Morceaux intermédiaires',
  },
];

export function palierStatus(palier, lessonsDone) {
  const done = palier.lecons.filter((l) => lessonsDone[l.id]).length;
  return { done, total: palier.lecons.length, complete: done === palier.lecons.length };
}

export function isUnlocked(index, lessonsDone) {
  if (index === 0) return true;
  return palierStatus(PALIERS[index - 1], lessonsDone).complete;
}
