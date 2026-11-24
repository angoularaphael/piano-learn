// Le parcours : 8 paliers, des lecons courtes, un morceau de fin par palier.
// Les notes sont ecrites en notation compacte (voir js/score.js).
//
// Lecon :
//   id      '2-1' (palier-numero)
//   titre   court, il tient sur une ligne
//   type    'demo'    : le prof joue, puis l'eleve rejoue note par note (le site attend la bonne note)
//           'morceau' : un morceau de la bibliotheque (js/data/songs.js), joue en mode cascade
//   boss    true pour le morceau de fin du palier (il ouvre le palier suivant)
//   main    'droite' | 'gauche' | 'deux'
//   tempo   noires par minute pour la demonstration
//   texte   ce que dit le prof avant de jouer (1 a 3 phrases courtes, tutoiement)
//   apres   ce qu'il dit quand c'est reussi (facultatif)
//   droite / gauche   les notes de chaque main
//   mesure  facultatif, '4/4' par defaut ('3/4', '3/8' : voir js/score.js)
//   morceau id du morceau pour le type 'morceau'
//
// Sources des melodies et simplifications : .research/sources-melodies.md

export const PALIERS = [
  {
    id: 1,
    titre: 'Découverte',
    resume: 'Trouver le do, connaître ses doigts, jouer ses cinq premières notes.',
    lecons: [
      {
        id: '1-1', titre: 'Le do du milieu', type: 'demo', main: 'droite', tempo: 72,
        texte: 'Au milieu du clavier, repère les deux touches noires collées. Le do, c’est la touche blanche juste à leur gauche. Pose ton pouce dessus et joue-le trois fois.',
        apres: 'Voilà ta première note. Tu la retrouveras toujours de la même façon.',
        droite: 'C4:1/1 C4:1/1 C4:2/1',
      },
      {
        id: '1-2', titre: 'Deux noires, trois noires', type: 'demo', main: 'droite', tempo: 72,
        texte: 'Les touches noires vont par deux, puis par trois, et ce motif se répète sur tout le clavier. C’est ta carte. Joue les deux noires, puis les trois.',
        apres: 'Avec ces deux groupes, tu ne te perdras plus jamais sur un clavier.',
        droite: 'C#4:1/2 D#4:1/3 -:2 | F#4:1/2 G#4:1/3 A#4:2/4',
      },
      {
        id: '1-3', titre: 'Tous les do', type: 'demo', main: 'deux', tempo: 66,
        texte: 'Le do est toujours à gauche des deux touches noires. Il revient toutes les sept touches blanches : c’est une octave. Joue chaque do, du grave vers l’aigu.',
        apres: 'Grave à gauche, aigu à droite. Le clavier n’a plus de secret pour toi.',
        gauche: 'C3:2/5 -:2 | -:4',
        droite: '-:2 C4:2/1 | C5:2/1 C6:2/1',
      },
      {
        id: '1-4', titre: 'Les numéros des doigts', type: 'demo', main: 'droite', tempo: 76,
        texte: 'Pouce 1, index 2, majeur 3, annulaire 4, auriculaire 5. Pouce sur le do : chaque doigt garde sa touche. On monte jusqu’au sol, puis on redescend.',
        apres: 'Cinq doigts, cinq notes. C’est la position de do.',
        droite: 'C4:1/1 D4:1/2 E4:1/3 F4:1/4 | G4:2/5 -:2 | G4:1/5 F4:1/4 E4:1/3 D4:1/2 | C4:4/1',
      },
      {
        id: '1-5', titre: 'Do, ré, mi', type: 'demo', main: 'droite', tempo: 84,
        texte: 'Trois doigts, trois notes : il n’en faut pas plus pour jouer un air que tout le monde connaît. Écoute, puis à toi.',
        apres: 'Tu viens de jouer le début d’« Au clair de la lune ».',
        droite: 'C4:1/1 C4:1/1 C4:1/1 D4:1/2 | E4:2/3 D4:2/2 | C4:1/1 E4:1/3 D4:1/2 D4:1/2 | C4:4/1',
      },
      {
        id: '1-6', titre: 'Fa et sol', type: 'demo', main: 'droite', tempo: 84,
        texte: 'L’annulaire prend le fa, l’auriculaire le sol. Garde la main ronde, comme si tu tenais une balle, et le poignet souple.',
        apres: 'Les cinq doigts travaillent ensemble. Place au premier vrai morceau.',
        droite: 'E4:1/3 F4:1/4 G4:2/5 | G4:1/5 F4:1/4 E4:2/3 | E4:1/3 F4:1/4 G4:1/5 F4:1/4 | E4:1/3 D4:1/2 C4:2/1',
      },
      { id: '1-7', titre: 'Au clair de la lune', type: 'morceau', boss: true, main: 'droite', morceau: 'au-clair-de-la-lune', texte: 'Ton premier vrai morceau. Deux fois la même phrase, puis une phrase qui descend plus bas : ta main glisse vers la gauche, puis revient. Joue chaque note quand elle touche le clavier.', apres: 'Ta première chanson entière. Le palier suivant est ouvert.' },
    ],
  },
  {
    id: 2,
    titre: 'Premières mélodies',
    resume: 'Enchaîner les notes main droite, jouer lié, sortir de la position.',
    lecons: [
      {
        id: '2-1', titre: 'Jouer lié', type: 'demo', main: 'droite', tempo: 80,
        texte: 'Jouer lié, c’est ne lever un doigt qu’au moment où le suivant appuie. Les notes se tiennent la main, sans trou entre elles. Monte jusqu’au sol, redescends, puis fais un petit tour autour du fa.',
        apres: 'Tu entends comme ça chante ? C’est ça, jouer lié.',
        droite: 'C4:1/1 D4:1/2 E4:1/3 F4:1/4 | G4:2/5 F4:1/4 E4:1/3 | D4:2/2 C4:2/1 | E4:1/3 F4:1/4 G4:1/5 F4:1/4 | E4:4/3',
      },
      {
        id: '2-2', titre: 'Sauter une note', type: 'demo', main: 'droite', tempo: 80,
        texte: 'Maintenant on saute une touche : do-mi, ré-fa, mi-sol, puis on redescend. La main ne bouge pas, ce sont les doigts qui choisissent : un doigt sur deux, puis le doigt voisin.',
        apres: 'Ces petits sauts s’appellent des tierces. On en trouve dans presque toutes les mélodies.',
        droite: 'C4:1/1 E4:1/3 D4:1/2 F4:1/4 | E4:1/3 G4:3/5 | G4:1/5 E4:1/3 F4:1/4 D4:1/2 | E4:1/3 C4:3/1',
      },
      {
        id: '2-3', titre: 'Petites phrases', type: 'demo', main: 'droite', tempo: 92,
        texte: 'Une vraie petite phrase : « Ah ! vous dirai-je, maman ». Au la, ta main se décale d’une touche vers la droite : l’auriculaire prend le la. À la fin, le pouce redescend sur do, comme on reprend son souffle.',
        apres: 'Une phrase qui monte, une phrase qui redescend. Mozart a écrit douze variations sur cet air.',
        droite: 'C4:1/1 C4:1/1 G4:1/4 G4:1/4 | A4:1/5 A4:1/5 G4:2/4 | F4:1/3 F4:1/3 E4:1/2 E4:1/2 | D4:1/1 D4:1/1 C4:2/1',
      },
      {
        id: '2-4', titre: 'Jouer sans regarder ses mains', type: 'demo', main: 'droite', tempo: 92,
        texte: 'Regarde l’écran, pas tes mains. Pose-les une fois en position de do, puis fais confiance à tes doigts : ils savent où sont mi, ré et do. Si tu te perds, touche les deux noires du milieu pour te repérer.',
        apres: 'C’est le début de « Mary Had a Little Lamb », une comptine américaine. Tes doigts ont trouvé leur chemin tout seuls.',
        droite: 'E4:1/3 D4:1/2 C4:1/1 D4:1/2 | E4:1/3 E4:1/3 E4:2/3 | D4:1/2 D4:1/2 D4:2/2 | E4:1/3 G4:1/5 G4:2/5',
      },
      {
        id: '2-5', titre: 'Jouer en rythme avec le prof', type: 'demo', main: 'droite', tempo: 84,
        texte: 'Des notes longues et des notes courtes. Compte dans ta tête « un, deux, trois, quatre » sans t’arrêter : les longues durent deux temps, la dernière quatre. Joue en même temps que moi.',
        apres: 'Le tempo n’a pas bougé. Les notes longues comptent autant que les courtes.',
        droite: 'C4:2/1 D4:1/2 E4:1/3 | F4:2/4 E4:2/3 | D4:1/2 D4:1/2 E4:2/3 | C4:4/1',
      },
      {
        id: '2-6', titre: 'Frère Jacques', type: 'morceau', boss: true, main: 'droite', morceau: 'frere-jacques',
        texte: 'Frère Jacques en entier. La troisième phrase va plus vite, et la dernière descend jusqu’au sol grave : laisse ta main glisser, puis revenir. Joue chaque note quand elle touche le clavier.',
        apres: 'Frère Jacques ne dort plus. Prochaine étape : la main gauche.',
      },
    ],
  },
  {
    id: 3,
    titre: 'La main gauche',
    resume: 'La main gauche en position de do, puis les deux mains qui se relaient.',
    lecons: [
      {
        id: '3-1', titre: 'Placer la main gauche', type: 'demo', main: 'gauche', tempo: 76,
        texte: 'Le do de la main gauche, c’est celui juste en dessous du do du milieu. Pose l’auriculaire dessus, puis un doigt par touche jusqu’au pouce, sur sol. À gauche, tout est en miroir : c’est le pouce qui est vers le milieu du clavier.',
        apres: 'Ta main gauche a trouvé sa place : la position de do, une octave plus bas.',
        gauche: 'C3:1/5 D3:1/4 E3:1/3 F3:1/2 | G3:2/1 -:2 | G3:1/1 F3:1/2 E3:1/3 D3:1/4 | C3:4/5',
      },
      {
        id: '3-2', titre: 'L’Ode à la main gauche', type: 'demo', main: 'gauche', tempo: 84,
        texte: 'Même air que l’Ode à la joie, une octave plus bas. Attention : pour monter, la main gauche va de l’auriculaire vers le pouce. Mi, c’est le majeur ; sol, c’est le pouce.',
        apres: 'La main gauche chante aussi. Elle est plus lente au début, c’est normal.',
        gauche: 'E3:1/3 E3:1/3 F3:1/2 G3:1/1 | G3:1/1 F3:1/2 E3:1/3 D3:1/4 | C3:1/5 C3:1/5 D3:1/4 E3:1/3 | E3:1.5/3 D3:0.5/4 D3:2/4',
      },
      {
        id: '3-3', titre: 'Notes tenues', type: 'demo', main: 'gauche', tempo: 80,
        texte: 'Une blanche dure deux temps, une ronde quatre. Garde la touche enfoncée jusqu’au bout en comptant dans ta tête : le son doit tenir jusqu’à la note suivante.',
        apres: 'Des notes qui tiennent : c’est ce qui fera sonner tes basses.',
        gauche: 'C3:1/5 C3:1/5 C3:1/5 D3:1/4 | E3:2/3 D3:2/4 | C3:1/5 E3:1/3 D3:1/4 D3:1/4 | C3:4/5',
      },
      {
        id: '3-4', titre: 'La basse d’Alberti', type: 'demo', main: 'gauche', tempo: 72,
        texte: 'Do, sol, mi, sol : la main gauche dessine un zigzag régulier, et le pouce revient toujours sur sol. Ce motif s’appelle la basse d’Alberti. Mozart ouvre ainsi sa « Sonate facile ».',
        apres: 'Avec ce zigzag, une seule main fait entendre tout un accord.',
        gauche: 'C3:0.5/5 G3:0.5/1 E3:0.5/3 G3:0.5/1 C3:0.5/5 G3:0.5/1 E3:0.5/3 G3:0.5/1 | D3:0.5/4 G3:0.5/1 F3:0.5/2 G3:0.5/1 C3:0.5/5 G3:0.5/1 E3:0.5/3 G3:0.5/1',
      },
      {
        id: '3-5', titre: 'Une main puis l’autre', type: 'demo', main: 'deux', tempo: 84,
        texte: 'La main droite pose une question, la main gauche répond une octave plus bas. Pendant que l’une joue, l’autre attend, déjà posée sur ses touches.',
        apres: 'Question, réponse : tes deux mains commencent à dialoguer.',
        droite: 'C4:1/1 D4:1/2 E4:1/3 C4:1/1 | -:4 | E4:1/3 F4:1/4 G4:2/5 | -:4',
        gauche: '-:4 | C3:1/5 D3:1/4 E3:1/3 C3:1/5 | -:4 | E3:1/3 F3:1/2 G3:2/1',
      },
      {
        id: '3-6', titre: 'J’ai du bon tabac à deux mains', type: 'morceau', main: 'deux', morceau: 'j-ai-du-bon-tabac-deux-mains',
        texte: 'La main droite chante le début, la main gauche reprend la partie du milieu, puis la droite revient. Prépare la main qui attend pendant que l’autre joue.',
        apres: 'Une chanson entière, partagée entre tes deux mains.',
      },
      {
        id: '3-7', titre: 'Le sol de la main gauche', type: 'demo', main: 'deux', tempo: 84,
        texte: 'Au milieu de l’Ode à la joie, la mélodie descend jusqu’au sol sous le do. Ce sol, c’est le pouce de la main gauche qui le joue : la mélodie passe d’une main à l’autre sans s’arrêter.',
        apres: 'La mélodie a changé de main en plein vol. C’est tout le secret du morceau final.',
        droite: 'D4:1/2 D4:1/2 E4:1/3 C4:1/1 | D4:1/2 E4:0.5/3 F4:0.5/4 E4:1/3 C4:1/1 | D4:1/2 E4:0.5/3 F4:0.5/4 E4:1/3 D4:1/2 | C4:1/1 D4:1/2 -:2',
        gauche: '-:4 | -:4 | -:4 | -:2 G3:2/1',
      },
      {
        id: '3-8', titre: 'Ode à la joie complète', type: 'morceau', boss: true, main: 'deux', morceau: 'ode-joie',
        texte: 'L’Ode à la joie en entier, avec deux mains qui se relaient : la droite commence, la gauche reprend une octave plus bas, puis la droite revient pour la partie du milieu. Le pouce gauche garde son sol.',
        apres: 'Le thème complet de Beethoven. Au prochain palier, tu apprends à le lire sur la partition.',
      },
    ],
  },
  {
    id: 4,
    titre: 'Lire les notes',
    resume: 'La portée, la clé de sol, la clé de fa : lire avant de jouer.',
    lecons: [
      {
        id: '4-1', titre: 'La portée', type: 'demo', main: 'droite', tempo: 80,
        texte: 'Cinq lignes, quatre interlignes : c’est la portée. Plus la note est haut, plus elle est aiguë. Do s’écrit sous la portée sur sa petite ligne, mi sur la première ligne, fa juste au-dessus, sol sur la deuxième.',
        apres: 'Tu viens de lire ta première partition : le début de « Frère Jacques », note par note.',
        droite: 'C4:1/1 D4:1/2 E4:1/3 C4:1/1 | C4:1/1 D4:1/2 E4:1/3 C4:1/1 | E4:1/3 F4:1/4 G4:2/5 | E4:1/3 F4:1/4 G4:2/5',
      },
      {
        id: '4-2', titre: 'La clé de sol', type: 'demo', main: 'droite', tempo: 84,
        texte: 'La clé de sol s’enroule autour de la deuxième ligne : cette ligne, c’est sol. Pars de ce repère, puis descends marche par marche : une ligne, un interligne, une ligne.',
        apres: 'Sol sur la deuxième ligne : ce repère ne te quittera plus.',
        droite: 'G4:1/4 G4:1/4 F4:1/3 F4:1/3 | E4:1/2 E4:1/2 E4:1/2 D4:1/1 | G4:1/4 G4:1/4 F4:1/3 F4:1/3 | E4:1/2 E4:1/2 E4:1/2 D4:1/1',
      },
      {
        id: '4-3', titre: 'Marches et sauts', type: 'demo', main: 'droite', tempo: 84,
        texte: 'D’une ligne à l’interligne voisin, c’est une marche : la touche d’à côté. D’une ligne à la ligne suivante, c’est un saut : une touche sur deux. Do, mi, sol montent ainsi de ligne en ligne.',
        apres: 'Marche ou saut : tu lis maintenant l’écart entre deux notes d’un coup d’œil.',
        droite: 'C4:0.5/1 E4:0.5/2 | G4:1/4 A4:1/5 G4:1/4 C4:0.5/1 C4:0.5/1 | D4:0.5/2 F4:0.5/4 E4:0.5/3 D4:0.5/2 E4:0.5/3 C4:0.5/1',
      },
      {
        id: '4-4', titre: 'La clé de fa', type: 'demo', main: 'gauche', tempo: 84,
        texte: 'La main gauche lit en clé de fa. Ses deux points entourent la quatrième ligne : cette ligne, c’est fa. Ton do grave est dans le deuxième interligne, en partant du bas.',
        apres: 'Clé de sol à droite, clé de fa à gauche : tu lis pour tes deux mains.',
        gauche: 'C3:1/5 D3:1/4 E3:1/3 C3:1/5 | C3:1/5 D3:1/4 E3:1/3 C3:1/5 | E3:1/3 F3:1/2 G3:2/1 | E3:1/3 F3:1/2 G3:2/1',
      },
      {
        id: '4-5', titre: 'Deux portées, deux mains', type: 'demo', main: 'deux', tempo: 84,
        texte: 'Les deux portées se partagent le travail : en haut la clé de sol pour la main droite, en bas la clé de fa pour la gauche. Le do du milieu est entre les deux, sur sa petite ligne. Même phrase, deux lectures.',
        apres: 'Une phrase en haut, la même en bas : tu lis les deux clés.',
        droite: 'C4:1/1 C4:1/1 C4:1/1 D4:1/2 | E4:2/3 D4:2/2 | C4:1/1 E4:1/3 D4:1/2 D4:1/2 | C4:4/1 | -:4 | -:4 | -:4 | -:4',
        gauche: '-:4 | -:4 | -:4 | -:4 | C3:1/5 C3:1/5 C3:1/5 D3:1/4 | E3:2/3 D3:2/4 | C3:1/5 E3:1/3 D3:1/4 D3:1/4 | C3:4/5',
      },
      {
        id: '4-6', titre: 'Déchiffrer', type: 'demo', main: 'droite', tempo: 84,
        texte: 'Déchiffrer, c’est lire un air que tu ne connais pas encore. Repère la première note, puis suis le dessin : ça monte, ça descend, ça saute ? Si tu te trompes, continue : on corrige au tour suivant.',
        apres: 'Tu viens de déchiffrer « Sur le pont d’Avignon ». Lire, ça s’apprend en lisant beaucoup.',
        droite: 'C4:1/1 C4:1/1 C4:2/1 | D4:1/2 D4:1/2 D4:2/2 | E4:1.5/3 F4:0.5/4 G4:1/5 C4:1/1 | B3:1.5/2 C4:0.5/3 D4:1/4 G3:1/1 | C4:1/1 C4:1/1 C4:2/1 | D4:1/2 D4:1/2 D4:2/2 | E4:1.5/3 F4:0.5/4 G4:1/5 C4:1/1 | D4:1/2 B3:1/1 C4:1/2 -:1',
      },
      {
        id: '4-7', titre: 'Ah ! vous dirai-je, maman', type: 'morceau', boss: true, main: 'deux', morceau: 'ah-vous-dirai-je-deux-mains',
        texte: '« Ah ! vous dirai-je, maman » sur deux portées : la main droite lit la clé de sol, la main gauche lit la partie du milieu en clé de fa. Regarde toujours une note plus loin que celle que tu joues.',
        apres: 'Tu lis et tu joues en même temps. Place au rythme.',
      },
    ],
  },
  {
    id: 5,
    titre: 'Le rythme',
    resume: 'Ronde, blanche, noire, croche, silences, notes pointées et mesures à trois temps.',
    lecons: [
      {
        id: '5-1', titre: 'Compter les temps', type: 'demo', main: 'droite', tempo: 100,
        texte: 'Une mesure à quatre temps se compte « un, deux, trois, quatre », toujours à la même vitesse. Ici, le premier temps est un silence : compte-le quand même, puis joue sur deux, trois, quatre. La note longue tient les quatre temps.',
        apres: 'Tu as compté sans t’arrêter. C’est le début de « Oh When the Saints ».',
        droite: '-:1 C4:1/1 E4:1/3 F4:1/4 | G4:4/5 | -:1 C4:1/1 E4:1/3 F4:1/4 | G4:4/5 | -:1 C4:1/1 E4:1/3 F4:1/4 | G4:2/5 E4:2/3 | C4:2/1 E4:2/3 | D4:4/2',
      },
      {
        id: '5-2', titre: 'Ronde, blanche, noire', type: 'demo', main: 'droite', tempo: 92,
        texte: 'La noire dure un temps, la blanche deux, la ronde quatre. Dans cette fin d’« Au clair de la lune », tu entends les trois : compte à voix haute et laisse chaque note durer jusqu’au bout.',
        apres: 'Noire, blanche, ronde : chaque note a maintenant sa durée.',
        droite: 'D4:1/5 D4:1/5 D4:1/5 D4:1/5 | A3:2/2 A3:2/2 | D4:1/5 C4:1/4 B3:1/3 A3:1/2 | G3:4/1 | C4:1/1 C4:1/1 C4:1/1 D4:1/2 | E4:2/3 D4:2/2 | C4:1/1 E4:1/3 D4:1/2 D4:1/2 | C4:4/1',
      },
      {
        id: '5-3', titre: 'Les croches', type: 'demo', main: 'droite', tempo: 92,
        texte: 'Une croche dure un demi-temps : deux croches tiennent dans une noire. Compte « un et deux et » : les croches tombent sur le chiffre et sur le « et ».',
        apres: '« J’ai du bon tabac », en croches bien régulières.',
        droite: 'C4:0.5/1 D4:0.5/2 E4:0.5/3 C4:0.5/1 | D4:1/2 D4:0.5/2 E4:0.5/3 F4:1/4 F4:1/4 | E4:1/3 E4:1/3 C4:0.5/1 D4:0.5/2 E4:0.5/3 C4:0.5/1 | D4:1/2 D4:0.5/2 E4:0.5/3 F4:1/4 G4:1/5 | C4:2/1',
      },
      {
        id: '5-4', titre: 'Les silences', type: 'demo', main: 'droite', tempo: 96,
        texte: 'Un silence, c’est un temps où l’on ne joue rien, mais où l’on compte quand même. Mozart ouvre sa « Petite musique de nuit » avec des silences : ce sont eux qui donnent l’élan. Lève bien la main pendant chacun d’eux.',
        apres: 'Les silences font partie de la musique. Tu viens de jouer du Mozart.',
        droite: 'C4:1/2 -:0.5 G3:0.5/1 C4:1/2 -:0.5 G3:0.5/1 | C4:0.5/2 G3:0.5/1 C4:0.5/1 E4:0.5/3 G4:1/5 -:1 | F4:1/5 -:0.5 D4:0.5/3 F4:1/5 -:0.5 D4:0.5/3 | F4:0.5/5 D4:0.5/3 B3:0.5/1 D4:0.5/3 G3:1/1 -:1',
      },
      {
        id: '5-5', titre: 'Le point', type: 'demo', main: 'droite', tempo: 84,
        texte: 'Le point après une note l’allonge de la moitié de sa valeur : une noire pointée dure un temps et demi. Elle est souvent suivie d’une croche, qui complète le temps. Écoute le balancement : long, court.',
        apres: 'C’est « Auld Lang Syne », qu’on chante pour se dire au revoir. Le point n’a plus de secret pour toi.',
        droite: 'G3:1/1 | C4:1.5/1 C4:0.5/1 C4:1/1 E4:1/3 | D4:1.5/2 C4:0.5/1 D4:1/2 E4:1/3 | C4:1.5/1 C4:0.5/1 E4:1/3 G4:1/4 | A4:3/5',
      },
      {
        id: '5-6', titre: 'La mesure à trois temps', type: 'demo', main: 'droite', tempo: 100, mesure: '3/4',
        texte: 'Certaines musiques se comptent à trois : « un, deux, trois », avec un appui sur le un. C’est la mesure de la valse… et de « Joyeux anniversaire ». Garde le même tempo du début à la fin.',
        apres: 'À trois temps, tu peux maintenant jouer pour tous les anniversaires.',
        droite: 'G3:0.75/1 G3:0.25/1 | A3:1/2 G3:1/1 C4:1/4 | B3:2/3 G3:0.75/1 G3:0.25/1 | A3:1/2 G3:1/1 D4:1/5 | C4:2/4 G3:0.75/1 G3:0.25/1 | G4:1/5 E4:1/3 C4:1/1 | B3:1/2 A3:1/1 F4:0.75/5 F4:0.25/5 | E4:1/4 C4:1/2 D4:1/3 | C4:2/2',
      },
      {
        id: '5-7', titre: 'Il pleut, bergère', type: 'morceau', main: 'droite', morceau: 'il-pleut-bergere',
        texte: 'Une mesure à six-huit : deux grands temps, chacun partagé en trois croches. Compte « un-deux-trois, quatre-cinq-six » et laisse la musique se balancer.',
        apres: 'Six-huit, c’est le pas des chansons qui se balancent.',
      },
      {
        id: '5-8', titre: 'Jingle Bells', type: 'morceau', boss: true, main: 'droite', morceau: 'jingle-bells',
        texte: 'Le refrain de « Jingle Bells », avec tout ce que tu viens d’apprendre : noires, blanches, croches, notes pointées et silences. Garde le tempo du début à la fin.',
        apres: 'Tout le rythme y était. Prochaine étape : jouer des deux mains en même temps.',
      },
    ],
  },
  {
    id: 6,
    titre: 'Les deux mains',
    resume: 'Mélodie à droite, basse à gauche, et les faire marcher ensemble.',
    lecons: [
      {
        id: '6-1', titre: 'Mains ensemble, notes longues', type: 'demo', main: 'deux', tempo: 84,
        texte: 'Première fois à deux mains en même temps. La main gauche joue une seule note longue pendant que la droite chante. Appuie les deux ensemble, puis laisse la gauche tenir.',
        apres: 'Tes deux mains ont joué ensemble. Le plus dur est fait.',
        droite: 'C4:1/1 C4:1/1 G4:1/4 G4:1/4 | A4:1/5 A4:1/5 G4:2/4 | F4:1/3 F4:1/3 E4:1/2 E4:1/2 | D4:1/1 D4:1/1 C4:2/1',
        gauche: 'C3:4/5 | F3:2/2 C3:2/5 | F3:2/2 C3:2/5 | G3:2/1 C3:2/5',
      },
      {
        id: '6-2', titre: 'Une basse qui ne bouge pas', type: 'demo', main: 'deux', tempo: 84,
        texte: '« Frère Jacques » tient sur un seul accord : la main gauche peut garder le même do. Rejoue-le au début de chaque mesure, en même temps que la première note de la main droite.',
        apres: 'Une basse fixe sous une mélodie qui bouge : c’est la base de l’accompagnement.',
        droite: 'C4:1/1 D4:1/2 E4:1/3 C4:1/1 | C4:1/1 D4:1/2 E4:1/3 C4:1/1 | E4:1/3 F4:1/4 G4:2/5 | E4:1/3 F4:1/4 G4:2/5',
        gauche: 'C3:4/5 | C3:4/5 | C3:4/5 | C3:4/5',
      },
      {
        id: '6-3', titre: 'Une basse qui change', type: 'demo', main: 'deux', tempo: 84,
        texte: 'Cette fois, la basse change : do, puis sol plus grave, puis do. Le pouce reste sur do, l’auriculaire va chercher le sol. Le changement se fait sur le premier temps, avec la main droite.',
        apres: 'La basse a suivi la mélodie. Tu tiens l’Ode à la joie à deux mains.',
        droite: 'E4:1/3 E4:1/3 F4:1/4 G4:1/5 | G4:1/5 F4:1/4 E4:1/3 D4:1/2 | C4:1/1 C4:1/1 D4:1/2 E4:1/3 | E4:1.5/3 D4:0.5/2 D4:2/2',
        gauche: 'C3:4/1 | G2:4/5 | C3:4/1 | G2:4/5',
      },
      {
        id: '6-4', titre: 'Une basse qui marche', type: 'demo', main: 'deux', tempo: 60,
        texte: 'Ici, la main gauche change de note à chaque temps : c’est une basse qui marche. Les deux mains jouent ensemble sur chaque temps, comme deux personnes qui marchent au même pas.',
        apres: 'Tu viens de jouer le début du Canon de Pachelbel.',
        droite: 'E5:1/5 D5:1/4 C5:1/3 B4:1/2 | A4:1/1 G4:1/1 A4:1/2 B4:1/3',
        gauche: 'C3:1/1 G2:1/4 A2:1/3 E2:1/5 | F2:1/4 C2:1/5 F2:1/2 G2:1/1',
      },
      {
        id: '6-5', titre: 'Garder le tempo à deux mains', type: 'demo', main: 'deux', tempo: 50,
        texte: 'L’exercice n° 1 de Hanon : les deux mains font exactement le même dessin, à une octave d’écart. Joue lentement et bien égal, chaque note au même volume. Accélère seulement quand c’est facile.',
        apres: 'Égal et régulier à deux mains : c’est ce que travaillent tous les pianistes.',
        droite: 'C4:0.25/1 E4:0.25/2 F4:0.25/3 G4:0.25/4 A4:0.25/5 G4:0.25/4 F4:0.25/3 E4:0.25/2 D4:0.25/1 F4:0.25/2 G4:0.25/3 A4:0.25/4 B4:0.25/5 A4:0.25/4 G4:0.25/3 F4:0.25/2',
        gauche: 'C3:0.25/5 E3:0.25/4 F3:0.25/3 G3:0.25/2 A3:0.25/1 G3:0.25/2 F3:0.25/3 E3:0.25/4 D3:0.25/5 F3:0.25/4 G3:0.25/3 A3:0.25/2 B3:0.25/1 A3:0.25/2 G3:0.25/3 F3:0.25/4',
      },
      {
        id: '6-6', titre: 'Ode à la joie à deux mains', type: 'morceau', main: 'deux', morceau: 'ode-joie-deux-mains',
        texte: 'L’Ode à la joie en entier, à deux mains. La main gauche ne joue que des do et des sol, mais elle doit changer au bon moment. Écoute si les deux mains tombent bien ensemble.',
        apres: 'Un morceau complet à deux mains. Bravo.',
      },
      {
        id: '6-7', titre: 'Canon de Pachelbel', type: 'morceau', boss: true, main: 'deux', morceau: 'canon-pachelbel',
        texte: 'La main gauche répète sans fin la même basse de huit notes, la main droite chante par-dessus. Laisse la gauche partir seule deux mesures, puis entre avec la droite.',
        apres: 'Plus de trois siècles après, ce canon fait toujours son effet. Prochaine étape : les accords.',
      },
    ],
  },
  {
    id: 7,
    titre: 'Les accords',
    resume: 'Les accords de do, fa, sol et la mineur, pour accompagner une mélodie.',
    lecons: [
      {
        id: '7-1', titre: 'L’accord de do', type: 'demo', main: 'gauche', tempo: 72,
        texte: 'Un accord, ce sont plusieurs notes jouées ensemble. L’accord de do : do, mi, sol, une touche sur deux, avec l’auriculaire, le majeur et le pouce. Pose les trois doigts, puis appuie d’un seul geste.',
        apres: 'Do, mi, sol : ton premier accord, plaqué puis égrené.',
        gauche: 'C3+E3+G3:2/5+3+1 C3+E3+G3:2/5+3+1 | C3:1/5 E3:1/3 G3:1/1 E3:1/3 | C3+E3+G3:4/5+3+1',
      },
      {
        id: '7-2', titre: 'Fa et sol', type: 'demo', main: 'gauche', tempo: 66,
        texte: 'Pour l’accord de fa, garde l’auriculaire sur do : l’index et le pouce montent d’une touche, sur fa et la. Pour l’accord de sol, l’auriculaire descend sur si, le majeur sur ré, le pouce sur sol. Puis retour à do.',
        apres: 'Do, fa, sol, do : avec ces trois accords, on accompagne des centaines de chansons.',
        gauche: 'C3+E3+G3:4/5+3+1 | C3+F3+A3:4/5+2+1 | B2+D3+G3:4/5+3+1 | C3+E3+G3:4/5+3+1',
      },
      {
        id: '7-3', titre: 'Accords brisés', type: 'demo', main: 'deux', tempo: 60,
        texte: 'Un accord peut aussi se jouer note après note : c’est un accord brisé. Bach commence ainsi son Prélude en do : la main gauche pose do et mi, la main droite continue l’accord vers l’aigu.',
        apres: 'Le début du Prélude en do de Bach. Tout le morceau est construit sur ce geste.',
        droite: '-:0.5 G4:0.25/1 C5:0.25/3 E5:0.25/5 G4:0.25/1 C5:0.25/3 E5:0.25/5 -:0.5 G4:0.25/1 C5:0.25/3 E5:0.25/5 G4:0.25/1 C5:0.25/3 E5:0.25/5 | -:0.5 A4:0.25/1 D5:0.25/3 F5:0.25/5 A4:0.25/1 D5:0.25/3 F5:0.25/5 -:0.5 A4:0.25/1 D5:0.25/3 F5:0.25/5 A4:0.25/1 D5:0.25/3 F5:0.25/5',
        gauche: 'C4:0.25/5 E4:1.75/3 C4:0.25/5 E4:1.75/3 | C4:0.25/5 D4:1.75/4 C4:0.25/5 D4:1.75/4',
      },
      {
        id: '7-4', titre: 'Le la mineur', type: 'demo', main: 'gauche', tempo: 66,
        texte: 'La mineur se joue avec la, do, mi. Depuis l’accord de do, garde do et mi, et monte seulement le pouce de sol à la. Écoute la couleur, plus sombre. Puis enchaîne do, la mineur, fa, sol.',
        apres: 'Quatre accords, et déjà de quoi accompagner presque tout.',
        gauche: 'C3+E3+G3:4/5+3+1 | C3+E3+A3:4/5+3+1 | C3+F3+A3:4/5+2+1 | B2+D3+G3:4/5+3+1 | C3+E3+G3:4/5+3+1',
      },
      {
        id: '7-5', titre: 'Changer d’accord en rythme', type: 'demo', main: 'deux', tempo: 76,
        texte: 'Les accords accompagnent maintenant la mélodie. La main gauche change d’accord sur le premier et le troisième temps, pendant que la droite continue. Prépare chaque changement un peu avant.',
        apres: 'Mélodie à droite, accords à gauche : tu accompagnes une chanson.',
        droite: 'C4:1/1 C4:1/1 C4:1/1 D4:1/2 | E4:2/3 D4:2/2 | C4:1/1 E4:1/3 D4:1/2 D4:1/2 | C4:4/1',
        gauche: 'C3+E3+G3:4/5+3+1 | C3+E3+G3:2/5+3+1 B2+D3+G3:2/5+3+1 | C3+E3+G3:2/5+3+1 B2+D3+G3:2/5+3+1 | C3+E3+G3:4/5+3+1',
      },
      {
        id: '7-6', titre: 'Prélude en do', type: 'morceau', main: 'deux', morceau: 'prelude-en-do',
        texte: 'Les quatre premières mesures du Prélude de Bach : un accord brisé par mesure, joué deux fois. Écoute l’harmonie avancer de mesure en mesure, puis revenir au do.',
        apres: 'Quatre accords, et c’est déjà du Bach.',
      },
      {
        id: '7-7', titre: 'Le Beau Danube bleu', type: 'morceau', main: 'deux', morceau: 'le-beau-danube-bleu',
        texte: 'La valse du « Beau Danube bleu », à trois temps. La main gauche plaque un accord sur le premier temps et le tient. La main droite fait de grands sauts : regarde où elle doit aller avant de partir.',
        apres: 'Une valse de Strauss, rien que ça.',
      },
      {
        id: '7-8', titre: 'Amazing Grace', type: 'morceau', boss: true, main: 'deux', morceau: 'amazing-grace',
        texte: '« Amazing Grace » avec tes quatre accords : do, fa, sol et la mineur. La main droite chante, la main gauche change d’accord au bon moment. Compte à trois temps.',
        apres: 'Une mélodie et ses accords : tu sais accompagner. Dernier palier : aller plus loin.',
      },
    ],
  },
  {
    id: 8,
    titre: 'Aller plus loin',
    resume: 'Dièses, bémols, gammes, nuances, pédale : de vrais morceaux.',
    lecons: [
      {
        id: '8-1', titre: 'Dièses et bémols', type: 'demo', main: 'droite', tempo: 50, mesure: '3/8',
        texte: 'Un dièse monte une note d’un demi-ton : ré dièse, c’est la touche noire juste à droite de ré. Un bémol, lui, descend d’un demi-ton. Écoute ce mi et ce ré dièse qui se balancent : tu les connais.',
        apres: 'Le début de la « Lettre à Élise ». Les touches noires ont maintenant un nom.',
        droite: 'E5:0.25/5 D#5:0.25/4 | E5:0.25/5 D#5:0.25/4 E5:0.25/5 B4:0.25/2 D5:0.25/4 C5:0.25/3 | A4:1/1',
      },
      {
        id: '8-2', titre: 'La gamme de do', type: 'demo', main: 'droite', tempo: 72,
        texte: 'Huit notes de do à do avec cinq doigts : le secret, c’est le passage du pouce. Après mi, joué par le majeur, le pouce passe sous la main pour prendre fa. En redescendant, le majeur passe par-dessus le pouce pour reprendre mi.',
        apres: 'Ta première gamme complète. Joue-la chaque jour pour te chauffer les doigts.',
        droite: 'C4:0.5/1 D4:0.5/2 E4:0.5/3 F4:0.5/1 G4:0.5/2 A4:0.5/3 B4:0.5/4 C5:0.5/5 | B4:0.5/4 A4:0.5/3 G4:0.5/2 F4:0.5/1 E4:0.5/3 D4:0.5/2 C4:1/1',
      },
      {
        id: '8-3', titre: 'La gamme de sol', type: 'demo', main: 'droite', tempo: 72,
        texte: 'La gamme de sol a un dièse : fa dièse. Même doigté que pour do, le pouce passe après si. Au moment du fa, prends la touche noire avec l’annulaire.',
        apres: 'Sol majeur et son fa dièse : c’est la tonalité du menuet qui t’attend.',
        droite: 'G4:0.5/1 A4:0.5/2 B4:0.5/3 C5:0.5/1 D5:0.5/2 E5:0.5/3 F#5:0.5/4 G5:0.5/5 | F#5:0.5/4 E5:0.5/3 D5:0.5/2 C5:0.5/1 B4:0.5/3 A4:0.5/2 G4:1/1',
      },
      {
        id: '8-4', titre: 'Jouer doux, jouer fort', type: 'demo', main: 'deux', tempo: 60,
        texte: 'Le piano sait jouer doux et fort : son nom complet est d’ailleurs « pianoforte ». Joue ce thème de Haydn tout doucement, du bout des doigts… jusqu’au dernier accord, que tu frappes fort, d’un coup.',
        apres: 'C’est la symphonie « La Surprise » de Haydn. Doux, fort : ce sont les nuances.',
        droite: 'C4:0.5/1 C4:0.5/1 E4:0.5/3 E4:0.5/3 G4:0.5/5 G4:0.5/5 E4:1/3 | F4:0.5/5 F4:0.5/5 D4:0.5/3 D4:0.5/3 B3:0.5/1 B3:0.5/1 G3:1/1 | C4:0.5/1 C4:0.5/1 E4:0.5/3 E4:0.5/3 G4:0.5/5 G4:0.5/5 E4:1/3 | C5:0.5/5 C5:0.5/5 F#4:0.5/1 F#4:0.5/1 G4:0.5/2 -:0.5 B4+G5:1/1+5',
        gauche: '-:4 | -:4 | -:4 | -:3 D4:1/1',
      },
      {
        id: '8-5', titre: 'La pédale', type: 'demo', main: 'deux', tempo: 66, mesure: '3/4',
        texte: 'La pédale de droite fait durer le son quand les doigts se lèvent. Dans cette Gymnopédie de Satie, à chaque nouvelle basse, relève la pédale au moment où tu joues la note, puis renfonce-la aussitôt : le son reste lié sans se mélanger.',
        apres: 'Avec la pédale, la main gauche peut sauter sans que le son s’arrête.',
        droite: '-:3 | -:1 E5:1/3 G5:1/5 | F5:1/4 E5:1/3 B4:1/1 | A4:1/1 B4:1/2 C5:1/3 | G4:3/1',
        gauche: 'C2:1/5 G3+B3+E4:2/4+2+1 | F2:1/5 A3+C4+E4:2/4+2+1 | C2:1/5 G3+B3+E4:2/4+2+1 | F2:1/5 A3+C4+E4:2/4+2+1 | C2:1/5 G3+B3+E4:2/4+2+1',
      },
      {
        id: '8-6', titre: 'Menuet en sol', type: 'morceau', main: 'deux', morceau: 'menuet-en-sol',
        texte: 'Un des menuets les plus joués par les pianistes qui débutent. Tu y retrouves la gamme de sol et son fa dièse. Trois temps par mesure, avec légèreté.',
        apres: 'Un menuet de l’époque de Bach, à deux mains. Il ne reste qu’une étape.',
      },
      {
        id: '8-7', titre: 'Gymnopédie n° 1', type: 'morceau', main: 'deux', morceau: 'gymnopedie-1',
        texte: 'Le début de la première Gymnopédie de Satie, lent et calme. Change la pédale à chaque basse et laisse la mélodie flotter au-dessus.',
        apres: 'Satie a écrit en tête de cette pièce : « lent et douloureux ». Tu as trouvé le ton.',
      },
      {
        id: '8-8', titre: 'Lettre à Élise', type: 'morceau', boss: true, main: 'deux', morceau: 'lettre-a-elise',
        texte: 'La première partie de la « Lettre à Élise », jouée deux fois. Mi et ré dièse se balancent à droite, la main gauche répond en arpèges. Prends ton temps : la beauté est dans le calme.',
        apres: 'Tu joues la « Lettre à Élise ». Tu as commencé par une seule note, le do du milieu : regarde le chemin parcouru.',
      },
    ],
  },
];
