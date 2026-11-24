// Fiches de theorie : une idee par fiche, debloquee au palier ou on en a besoin.
//
// Fiche :
//   id            kebab-case, unique
//   palier        premier palier ou la fiche s'ouvre (celui de la premiere lecon qui en a besoin)
//   titre         { fr, en }
//   resume        { fr, en } une phrase
//   corps         { fr: [...], en: [...] } 2 a 4 paragraphes courts, autant en francais qu'en anglais
//   exemple       { droite, gauche, mesure } en notation compacte (js/score.js), ou null
//                 pas de touche noire avant le palier 8, sauf dans la fiche du clavier
//   illustration  'clavier' | 'portee' | 'rythme' | 'mains' | null
//   retenir       { fr, en } la regle a garder en tete
//
// Textes francais : espaces simples avant « : ; ! ? » et dans les guillemets, fr() (js/text.js) les rend insecables.

export const FICHES = [
  // Palier 1 : Decouverte
  {
    id: 'carte-du-clavier',
    palier: 1,
    titre: { fr: 'La carte du clavier', en: 'The keyboard map' },
    resume: {
      fr: 'Les touches noires vont par deux et par trois : ce sont tes repères pour trouver chaque note.',
      en: 'Black keys come in twos and threes, and they lead you to every note.',
    },
    corps: {
      fr: [
        'Regarde les touches noires : elles forment des groupes de deux, puis de trois. Ce motif se répète d’un bout à l’autre du clavier.',
        'Ces groupes sont ta carte. Le do est toujours la touche blanche juste à gauche des deux noires. Le fa, juste à gauche des trois.',
        'Pas besoin de compter les touches : un coup d’œil aux noires suffit pour savoir où tu es, sur n’importe quel piano.',
      ],
      en: [
        'Look at the black keys: they come in groups of two, then three, and that pattern repeats from one end of the keyboard to the other.',
        'Those groups are your map. C is always the white key just left of a pair of black keys. F sits just left of a group of three.',
        'No need to count keys. One glance at the black keys tells you where you are, on any piano you sit down at.',
      ],
    },
    exemple: { droite: 'C#4:1/2 D#4:1/3 C4:2/1 | F#4:1/2 G#4:1/3 A#4:1/4 F4:1/1', gauche: '', mesure: '4/4' },
    illustration: 'clavier',
    retenir: {
      fr: 'Do à gauche des deux noires, fa à gauche des trois.',
      en: 'C sits left of the two black keys, F left of the three.',
    },
  },
  {
    id: 'do-du-milieu',
    palier: 1,
    titre: { fr: 'Le do du milieu et les octaves', en: 'Middle C and octaves' },
    resume: {
      fr: 'Sept noms de notes qui reviennent en boucle, et un do pour te repérer au centre.',
      en: 'Seven note names that keep coming round, and one C to anchor you in the middle.',
    },
    corps: {
      fr: [
        'Les touches blanches portent sept noms : do, ré, mi, fa, sol, la, si. Après si, tout recommence : do, ré, mi…',
        'D’un do au do suivant, on compte huit touches blanches, les deux do compris : c’est une octave. Les deux do portent le même nom parce qu’ils sonnent comme la même note, l’un plus aigu que l’autre.',
        'Le do du milieu, qu’on appelle aussi do central, est le do le plus proche du centre du clavier. Sur un piano de 88 touches, c’est le quatrième en partant de la gauche.',
        'Vers la gauche, le son devient grave. Vers la droite, il devient aigu.',
      ],
      en: [
        'The white keys use just seven letter names. Starting from C: C, D, E, F, G, A, B, and then C again.',
        'From one C to the next is eight white keys, counting both Cs. That span is an octave. Both notes share a name because they sound like the same note, one simply higher.',
        'Middle C is the C closest to the center of the keyboard. On an 88-key piano, it’s the fourth C from the left.',
        'Head left and the sound gets lower. Head right and it gets higher.',
      ],
    },
    exemple: { droite: 'C4:2/1 C5:2/1 | C4:4/1', gauche: '', mesure: '4/4' },
    illustration: 'clavier',
    retenir: {
      fr: 'D’un do au do suivant : une octave, la même note en plus aigu.',
      en: 'From one C to the next: an octave, the same note, only higher.',
    },
  },
  {
    id: 'numeros-des-doigts',
    palier: 1,
    titre: { fr: 'Les numéros des doigts', en: 'Finger numbers' },
    resume: {
      fr: 'Chaque doigt a son numéro, du pouce à l’auriculaire, et c’est le même sur les deux mains.',
      en: 'Every finger has a number, thumb to pinky, and both hands use the same ones.',
    },
    corps: {
      fr: [
        'Pouce 1, index 2, majeur 3, annulaire 4, auriculaire 5. Les deux mains se numérotent de la même façon, en partant du pouce.',
        'Ces numéros te suivront partout : dans les leçons, puis sur les partitions. Un petit chiffre près d’une note te dit quel doigt la joue.',
        'Pour les apprendre, pose tes mains sur une table et lève chaque doigt en disant son numéro. Quelques minutes suffisent.',
      ],
      en: [
        'Thumb 1, index 2, middle 3, ring 4, pinky 5. Both hands are numbered the same way, starting from the thumb.',
        'You’ll meet these numbers everywhere: in your lessons now, on sheet music later. A small number next to a note tells you which finger plays it.',
        'To learn them, rest your hands on a table and lift each finger as you say its number. A few minutes is all it takes.',
      ],
    },
    exemple: { droite: 'C4:1/1 D4:1/2 E4:1/3 F4:1/4 | G4:1/5 F4:1/4 E4:1/3 D4:1/2 | C4:4/1', gauche: '', mesure: '4/4' },
    illustration: 'mains',
    retenir: {
      fr: 'Du pouce à l’auriculaire : 1, 2, 3, 4, 5, sur les deux mains.',
      en: 'Thumb to pinky: 1, 2, 3, 4, 5, on both hands.',
    },
  },
  {
    id: 'position-de-do',
    palier: 1,
    titre: { fr: 'La position de do', en: 'C position' },
    resume: {
      fr: 'Pouce sur le do du milieu, un doigt par touche : cinq notes sous la main, sans bouger.',
      en: 'Thumb on middle C, one finger per key: five notes under your hand without moving.',
    },
    corps: {
      fr: [
        'Pose le pouce droit sur le do du milieu, puis un doigt sur chaque touche blanche : index sur ré, majeur sur mi, annulaire sur fa, auriculaire sur sol. C’est la position de do.',
        'Chaque doigt garde sa touche du début à la fin. Tes yeux n’ont plus à chercher les notes : tes doigts savent déjà où elles sont.',
        'Arrondis la main, comme si elle tenait une balle. Le poignet reste souple, et tu joues avec le bout des doigts.',
      ],
      en: [
        'Put your right thumb on middle C, then one finger on each white key: index on D, middle on E, ring on F, pinky on G. That’s C position.',
        'Each finger keeps its key from start to finish. Your eyes no longer hunt for notes: your fingers already know where they are.',
        'Round your hand as if it were holding a ball. Keep your wrist loose and play with your fingertips.',
      ],
    },
    exemple: { droite: 'C4:1/1 D4:1/2 E4:1/3 C4:1/1 | E4:1/3 F4:1/4 G4:2/5 | G4:1/5 F4:1/4 E4:1/3 D4:1/2 | C4:4/1', gauche: '', mesure: '4/4' },
    illustration: 'clavier',
    retenir: {
      fr: 'Un doigt par touche : tu ne cherches plus la note, tu choisis le doigt.',
      en: 'One finger per key: don’t hunt for the note, choose the finger.',
    },
  },

  // Palier 2 : Premieres melodies
  {
    id: 'jouer-lie',
    palier: 2,
    titre: { fr: 'Jouer lié', en: 'Playing legato' },
    resume: {
      fr: 'Relier les notes sans trou entre elles, pour que la mélodie chante.',
      en: 'Joining notes with no gaps, so the melody sings.',
    },
    corps: {
      fr: [
        'Jouer lié, c’est passer d’une note à l’autre sans laisser de silence entre elles. Les musiciens disent aussi legato, un mot italien qui veut dire « lié ».',
        'Tout se joue dans le relais : un doigt se lève au moment exact où le suivant s’enfonce. Trop tôt, on entend un trou. Trop tard, les deux sons se mélangent.',
        'Écoute-toi jouer : une mélodie liée ressemble à une voix qui chante d’un seul souffle.',
      ],
      en: [
        'Playing legato means moving from one note to the next with no silence in between. Legato is Italian for “bound together.”',
        'It all comes down to the handover: one finger lifts at the exact moment the next one goes down. Too early and you hear a gap. Too late and the two sounds blur.',
        'Listen as you play. A legato melody sounds like a voice singing in a single breath.',
      ],
    },
    exemple: { droite: 'E4:1/3 F4:1/4 G4:2/5 | F4:1/4 E4:1/3 D4:2/2 | E4:1/3 D4:1/2 C4:1/1 D4:1/2 | C4:4/1', gauche: '', mesure: '4/4' },
    illustration: 'mains',
    retenir: {
      fr: 'Un doigt se lève quand le suivant s’enfonce : ni avant, ni après.',
      en: 'One finger lifts as the next goes down: not before, not after.',
    },
  },
  {
    id: 'secondes-tierces',
    palier: 2,
    titre: { fr: 'Secondes et tierces', en: 'Seconds and thirds' },
    resume: {
      fr: 'L’écart entre deux notes a un nom : la seconde va à la touche voisine, la tierce en saute une.',
      en: 'The gap between two notes has a name: a second moves to the next key, a third skips one.',
    },
    corps: {
      fr: [
        'L’écart entre deux notes s’appelle un intervalle. Pour le nommer, compte les touches blanches de la première note à la dernière, les deux comprises.',
        'De do à ré, deux touches : c’est une seconde. Tu passes à la touche voisine, avec le doigt voisin.',
        'De do à mi, trois touches : c’est une tierce. Tu sautes une touche, et un doigt aussi. Do-mi, ré-fa, mi-sol : la main ne bouge pas, ce sont les doigts qui choisissent.',
      ],
      en: [
        'The distance between two notes is called an interval. To name it, count the white keys from the first note to the last, including both.',
        'C to D is two keys: a second. You step to the very next key, with the very next finger.',
        'C to E is three keys: a third. You skip a key, and skip a finger too. C–E, D–F, E–G: your hand stays put while your fingers do the choosing.',
      ],
    },
    exemple: { droite: 'C4:1/1 D4:1/2 C4:1/1 E4:1/3 | D4:1/2 E4:1/3 D4:1/2 F4:1/4 | E4:1/3 F4:1/4 E4:1/3 G4:1/5 | E4:2/3 C4:2/1', gauche: '', mesure: '4/4' },
    illustration: 'clavier',
    retenir: {
      fr: 'Touche voisine : une seconde. Une touche sautée : une tierce.',
      en: 'Next key: a second. Skip a key: a third.',
    },
  },
  {
    id: 'sortir-de-position',
    palier: 2,
    titre: { fr: 'Sortir de la position', en: 'Moving out of position' },
    resume: {
      fr: 'Quand la mélodie dépasse tes cinq doigts, la main se déplace, et le doigté te prévient.',
      en: 'When a tune runs past your five fingers, your hand moves, and the fingering warns you.',
    },
    corps: {
      fr: [
        'Cinq doigts, cinq notes : la position de do ne suffit pas à toutes les mélodies. Quand une note sort de la main, c’est la main qui se déplace.',
        'Le doigté te prévient. Un numéro inattendu, comme le pouce sur sol, annonce que ta main change de place.',
        'Déplace toute la main d’un bloc, sans tendre les doigts. Profite d’une note longue ou d’un silence, et regarde où tu vas avant d’y aller.',
      ],
      en: [
        'Five fingers, five notes: C position can’t cover every tune. When a note falls outside your hand, the hand itself moves.',
        'The fingering gives you fair warning. An unexpected number, like your thumb on G, means your hand is about to take a new position.',
        'Move the whole hand as one, without stretching your fingers. Use a long note or a rest to do it, and look where you’re going before you go.',
      ],
    },
    exemple: { droite: 'C4:1/1 D4:1/2 E4:1/3 F4:1/4 | G4:2/5 -:2 | G4:1/1 A4:1/2 B4:2/3 | C5:4/4', gauche: '', mesure: '4/4' },
    illustration: 'mains',
    retenir: {
      fr: 'La main se déplace d’un bloc, pendant une note longue ou un silence.',
      en: 'Move your whole hand at once, during a long note or a rest.',
    },
  },
  {
    id: 'compter-les-temps',
    palier: 2,
    titre: { fr: 'Compter les temps', en: 'Counting the beat' },
    resume: {
      fr: 'Sous chaque morceau bat une pulsation régulière : la compter, c’est donner à chaque note sa juste durée.',
      en: 'A steady pulse runs under every piece, and counting it gives each note its proper length.',
    },
    corps: {
      fr: [
        'La musique avance sur une pulsation régulière, comme des pas ou les battements du cœur. Chaque battement s’appelle un temps.',
        'Compte « un, deux, trois, quatre » à voix haute, toujours à la même vitesse. Une note courte dure un temps. Une note longue en dure deux, ou quatre.',
        'Continue de compter pendant les notes longues : c’est le compte qui fait tomber la note suivante au bon moment.',
        'La vitesse des temps s’appelle le tempo. Lent ou rapide, il reste le même du début à la fin.',
      ],
      en: [
        'Music moves along on a steady pulse, like footsteps or a heartbeat. Each pulse is called a beat.',
        'Count “one, two, three, four” out loud, always at the same speed. A short note lasts one beat. A long one lasts two, or even four.',
        'Keep counting through the long notes: the count is what lands the next note right on time.',
        'The speed of the beat is the tempo. Slow or fast, it stays the same from start to finish.',
      ],
    },
    exemple: { droite: 'C4:1/1 C4:1/1 C4:1/1 D4:1/2 | E4:2/3 D4:2/2 | C4:1/1 E4:1/3 D4:1/2 D4:1/2 | C4:4/1', gauche: '', mesure: '4/4' },
    illustration: 'rythme',
    retenir: {
      fr: 'Le temps ne s’arrête jamais : compte-le du début à la fin, même quand la note dure.',
      en: 'The beat never stops: count it from start to finish, even while a note is held.',
    },
  },

  // Palier 3 : La main gauche
  {
    id: 'main-gauche',
    palier: 3,
    titre: { fr: 'La main gauche', en: 'The left hand' },
    resume: {
      fr: 'Ta main gauche est le miroir de la droite : mêmes numéros, mais c’est l’auriculaire qui joue le plus grave.',
      en: 'Your left hand mirrors your right: same numbers, but now the pinky plays the lowest note.',
    },
    corps: {
      fr: [
        'La main gauche est le reflet de la droite dans un miroir. Les numéros ne changent pas, pouce 1 et auriculaire 5, mais sur le clavier ils vont dans l’autre sens.',
        'Position de do à gauche : l’auriculaire sur le do juste en dessous du do du milieu, puis un doigt par touche jusqu’au pouce, sur sol.',
        'Pour monter, la main gauche va donc de 5 vers 1. Pour descendre, de 1 vers 5. Il faut un peu de temps pour s’y faire, et c’est normal.',
        'Côté grave, la main gauche joue souvent la basse : les notes qui portent la mélodie.',
      ],
      en: [
        'Your left hand is your right hand’s mirror image. The numbers stay the same, thumb 1 and pinky 5, but they run the other way along the keyboard.',
        'Left-hand C position: pinky on the C just below middle C, then one finger per key up to your thumb, on G.',
        'So going up, the left hand moves from 5 to 1, and going down, from 1 to 5. It takes a little while to feel natural, and that’s perfectly normal.',
        'Down at the low end, the left hand often plays the bass: the notes that carry the melody.',
      ],
    },
    exemple: { droite: '', gauche: 'C3:1/5 D3:1/4 E3:1/3 F3:1/2 | G3:2/1 E3:2/3 | F3:1/2 E3:1/3 D3:1/4 E3:1/3 | C3:4/5', mesure: '4/4' },
    illustration: 'mains',
    retenir: {
      fr: 'À gauche, l’auriculaire prend le grave : pour monter, on va de 5 vers 1.',
      en: 'On the left, the pinky takes the low end: going up means counting down from 5 to 1.',
    },
  },
  {
    id: 'noire-blanche-ronde',
    palier: 3,
    titre: { fr: 'Noire, blanche, ronde', en: 'Quarter, half and whole notes' },
    resume: {
      fr: 'Trois figures de notes pour trois durées : un temps, deux temps, quatre temps.',
      en: 'Three note shapes for three lengths: one beat, two beats, four beats.',
    },
    corps: {
      fr: [
        'La forme d’une note dit combien de temps elle dure. Dans la plupart des morceaux, la noire vaut un temps.',
        'La noire a une tête pleine et une hampe : un temps. La blanche, une tête vide et une hampe : deux temps. La ronde, une tête vide sans hampe : quatre temps. Leur nom vient de leur dessin.',
        'Une note longue se tient : garde la touche enfoncée en comptant, jusqu’au moment où commence la suivante.',
      ],
      en: [
        'A note’s shape tells you how long it lasts. In most pieces, the quarter note gets one beat.',
        'A quarter note has a filled-in head and a stem: one beat. A half note has a hollow head and a stem: two beats. A whole note is hollow with no stem: four beats. The names work like fractions: two halves or four quarters fill a whole.',
        'A long note has to be held: keep the key down while you count, right up to the moment the next note begins.',
      ],
    },
    exemple: { droite: 'C4:1/1 D4:1/2 E4:1/3 F4:1/4 | G4:2/5 E4:2/3 | C4:4/1', gauche: '', mesure: '4/4' },
    illustration: 'rythme',
    retenir: {
      fr: 'Noire : un temps. Blanche : deux. Ronde : quatre.',
      en: 'Quarter: one beat. Half: two. Whole: four.',
    },
  },

  // Palier 4 : Lire les notes
  {
    id: 'portee',
    palier: 4,
    titre: { fr: 'La portée', en: 'The staff' },
    resume: {
      fr: 'Cinq lignes où chaque note a sa place : plus elle est haute, plus elle est aiguë.',
      en: 'Five lines where every note has its place: the higher it sits, the higher it sounds.',
    },
    corps: {
      fr: [
        'Les notes s’écrivent sur une portée : cinq lignes et quatre interlignes, qu’on compte toujours de bas en haut.',
        'Une note se pose sur une ligne ou dans un interligne. Plus elle est placée haut, plus elle est aiguë.',
        'Lignes et interlignes alternent, comme les touches blanches se suivent. D’une ligne à l’interligne voisin, tu passes à la touche voisine : une seconde. D’une ligne à la ligne suivante, tu sautes une touche : une tierce.',
      ],
      en: [
        'Music is written on a staff: five lines and four spaces, always counted from the bottom up.',
        'A note sits either on a line or in a space. The higher it sits, the higher it sounds.',
        'Lines and spaces take turns, the way white keys follow one another. From a line to the next space is the next key: a second. From one line to the next line skips a key: a third.',
      ],
    },
    exemple: { droite: 'E4:1/1 F4:1/2 G4:2/3 | E4:1/1 G4:1/3 B4:2/5 | A4:1/4 G4:1/3 F4:1/2 G4:1/3 | E4:4/1', gauche: '', mesure: '4/4' },
    illustration: 'portee',
    retenir: {
      fr: 'Ligne, interligne, ligne : chaque marche sur la portée est une touche sur le clavier.',
      en: 'Line, space, line: each step on the staff is one key on the keyboard.',
    },
  },
  {
    id: 'cle-de-sol',
    palier: 4,
    titre: { fr: 'La clé de sol', en: 'The treble clef' },
    resume: {
      fr: 'Elle s’enroule autour de la deuxième ligne pour te dire : ici, c’est sol.',
      en: 'It curls around the second line to tell you: this is G.',
    },
    corps: {
      fr: [
        'Au début de la portée, la clé donne le nom d’une ligne, et toutes les autres notes en découlent. La clé de sol s’enroule autour de la deuxième ligne : cette ligne, c’est le sol juste au-dessus du do du milieu.',
        'C’est la clé des notes aiguës, celle que lit surtout la main droite.',
        'Garde trois repères : sol sur la deuxième ligne, le do du milieu sous la portée sur sa petite ligne, et le do suivant dans le troisième interligne. Pour toute autre note, pars du repère le plus proche et compte les marches.',
      ],
      en: [
        'At the start of the staff, the clef names one line, and every other note follows from it. The treble clef curls around the second line: that line is the G just above middle C, which is why it’s also called the G clef.',
        'It’s the clef for higher notes, the one your right hand reads most.',
        'Keep three landmarks in mind: G on the second line, middle C just below the staff on its own little line, and the next C up in the third space. For any other note, start from the nearest landmark and count the steps.',
      ],
    },
    exemple: { droite: 'G4:1/1 A4:1/2 B4:1/3 C5:1/4 | C5:2/4 G4:2/1 | B4:1/3 C5:1/4 B4:1/3 A4:1/2 | G4:4/1', gauche: '', mesure: '4/4' },
    illustration: 'portee',
    retenir: {
      fr: 'La clé de sol tourne autour du sol : la deuxième ligne.',
      en: 'The treble clef circles G: the second line.',
    },
  },
  {
    id: 'cle-de-fa',
    palier: 4,
    titre: { fr: 'La clé de fa', en: 'The bass clef' },
    resume: {
      fr: 'Ses deux points encadrent la quatrième ligne : c’est fa, et c’est là que lit ta main gauche.',
      en: 'Its two dots frame the fourth line: that’s F, and it’s where your left hand reads.',
    },
    corps: {
      fr: [
        'Pour les notes graves, la main gauche lit en clé de fa. Ses deux points encadrent la quatrième ligne : cette ligne, c’est le fa juste en dessous du do du milieu.',
        'Attention, les notes n’y ont pas la même place qu’en clé de sol. Quand la clé change, une même ligne change de nom.',
        'Garde trois repères : fa sur la quatrième ligne, le do du milieu au-dessus de la portée sur sa petite ligne, et le do de ta position de main gauche dans le deuxième interligne.',
      ],
      en: [
        'For low notes, your left hand reads in the bass clef. Its two dots sit either side of the fourth line: that line is the F just below middle C, which is why it’s also called the F clef.',
        'Careful: notes don’t sit where they do in the treble clef. Change the clef and the same line gets a new name.',
        'Keep three landmarks: F on the fourth line, middle C above the staff on its little line, and the C of your left-hand position in the second space.',
      ],
    },
    exemple: { droite: '', gauche: 'C3:1/5 D3:1/4 E3:1/3 F3:1/2 | G3:2/1 F3:2/2 | E3:1/3 F3:1/2 E3:1/3 D3:1/4 | C3:4/5', mesure: '4/4' },
    illustration: 'portee',
    retenir: {
      fr: 'Les deux points de la clé de fa entourent le fa : la quatrième ligne.',
      en: 'The bass clef’s two dots hug F: the fourth line.',
    },
  },
  {
    id: 'do-sur-deux-portees',
    palier: 4,
    titre: { fr: 'Le do du milieu sur deux portées', en: 'Middle C on the grand staff' },
    resume: {
      fr: 'Entre les deux portées, le do du milieu se pose sur une petite ligne ajoutée : une seule touche, deux façons de l’écrire.',
      en: 'Between the two staves, middle C sits on a little added line: one key, two ways to write it.',
    },
    corps: {
      fr: [
        'Au piano, on lit deux portées à la fois, réunies par une accolade : la clé de sol en haut pour la main droite, la clé de fa en bas pour la main gauche.',
        'Quand une note sort de la portée, on lui ajoute une petite ligne rien que pour elle : une ligne supplémentaire.',
        'Le do du milieu se trouve justement entre les deux portées. Écrit pour la main droite, il est sur une ligne supplémentaire sous la portée du haut. Écrit pour la main gauche, sur une ligne supplémentaire au-dessus de la portée du bas. C’est la même touche.',
      ],
      en: [
        'At the piano you read two staves at once, joined by a brace: treble clef on top for the right hand, bass clef below for the left. Together they make the grand staff.',
        'When a note goes past the edge of a staff, it gets a short line all of its own: a ledger line.',
        'Middle C sits right between the two staves. Written for the right hand, it’s on a ledger line below the top staff. Written for the left hand, it’s on a ledger line above the bottom staff. Same key either way.',
      ],
    },
    exemple: { droite: 'C4:1/1 D4:1/2 E4:1/3 D4:1/2 | C4:4/1 | -:4 | -:4', gauche: '-:4 | -:4 | C4:1/1 B3:1/2 A3:1/3 B3:1/2 | C4:4/1', mesure: '4/4' },
    illustration: 'portee',
    retenir: {
      fr: 'Entre les deux portées, sur sa petite ligne : c’est toujours le do du milieu.',
      en: 'Between the staves, on its own little line: that’s always middle C.',
    },
  },

  // Palier 5 : Le rythme
  {
    id: 'croches',
    palier: 5,
    titre: { fr: 'Les croches', en: 'Eighth notes' },
    resume: {
      fr: 'Une croche dure un demi-temps : deux croches tiennent dans un seul temps.',
      en: 'An eighth note lasts half a beat, so two of them fit in one.',
    },
    corps: {
      fr: [
        'La croche ressemble à une noire avec un petit crochet au bout de la hampe. Elle dure deux fois moins longtemps : un demi-temps.',
        'Deux croches font donc une noire. Quand plusieurs se suivent, leurs crochets se rejoignent souvent en une barre qui les relie.',
        'Pour les compter, coupe chaque temps en deux : « un et deux et trois et quatre et ». La première croche tombe sur le chiffre, la seconde sur le « et ».',
      ],
      en: [
        'An eighth note looks like a quarter note with a little flag on its stem. It lasts half as long: half a beat.',
        'So two eighths make a quarter. When several follow one another, their flags often join into a single beam.',
        'To count them, split each beat in two: “one and two and three and four and.” The first eighth lands on the number, the second on the “and.”',
      ],
    },
    exemple: { droite: 'C4:1/1 D4:1/2 E4:1/3 F4:1/4 | G4:0.5/5 F4:0.5/4 E4:0.5/3 D4:0.5/2 C4:0.5/1 D4:0.5/2 E4:0.5/3 F4:0.5/4 | G4:1/5 E4:1/3 C4:2/1', gauche: '', mesure: '4/4' },
    illustration: 'rythme',
    retenir: {
      fr: 'Deux croches par temps : « un et, deux et ».',
      en: 'Two eighths to a beat: “one and, two and.”',
    },
  },
  {
    id: 'silences',
    palier: 5,
    titre: { fr: 'Les silences', en: 'Rests' },
    resume: {
      fr: 'Un silence est un moment où l’on ne joue rien, mais où l’on continue de compter.',
      en: 'A rest is a moment where you play nothing but keep counting.',
    },
    corps: {
      fr: [
        'Un silence se compte exactement comme une note : il a sa durée, et la pulsation continue pendant qu’il passe. Lève la main, laisse le son s’arrêter, et compte.',
        'Chaque durée a son silence. La pause vaut une ronde, quatre temps. La demi-pause, une blanche, deux temps. Le soupir, une noire, un temps. Le demi-soupir, une croche, un demi-temps.',
        'La pause et la demi-pause sont deux petits rectangles faciles à confondre. La pause pend sous la quatrième ligne, la demi-pause est posée sur la troisième.',
      ],
      en: [
        'A rest counts just like a note: it has its own length, and the beat keeps going while it passes. Lift your hand, let the sound stop, and keep counting.',
        'Every note value has a matching rest. A whole rest lasts four beats, a half rest two, a quarter rest one, and an eighth rest half a beat.',
        'Whole and half rests are both small blocks, easy to mix up. The whole rest hangs down from the fourth line; the half rest sits on the middle line like a hat.',
      ],
    },
    exemple: { droite: '-:4 | C4:1/1 -:1 E4:1/3 -:1 | G4:2/5 -:2 | E4:0.5/3 -:0.5 D4:0.5/2 -:0.5 C4:2/1', gauche: '', mesure: '4/4' },
    illustration: 'rythme',
    retenir: {
      fr: 'Un silence se compte aussi : la musique continue, même quand tu ne joues pas.',
      en: 'Rests count too: the music keeps going even when you don’t play.',
    },
  },
  {
    id: 'point',
    palier: 5,
    titre: { fr: 'Le point', en: 'Dotted notes' },
    resume: {
      fr: 'Le point allonge une note de la moitié de sa valeur.',
      en: 'A dot makes a note half as long again.',
    },
    corps: {
      fr: [
        'Un petit point juste après une note lui ajoute la moitié de sa valeur. Il ne se joue pas : il se compte.',
        'Une blanche pointée dure donc trois temps : deux, plus un. Une noire pointée dure un temps et demi : un, plus un demi.',
        'La noire pointée est souvent suivie d’une croche, qui complète le deuxième temps. Ensemble, elles donnent un balancement long-court qu’on entend dans beaucoup de chansons.',
      ],
      en: [
        'A small dot right after a note adds half of its value. You don’t play the dot; you count it.',
        'So a dotted half note lasts three beats: two, plus one. A dotted quarter lasts a beat and a half: one, plus a half.',
        'A dotted quarter is often followed by an eighth note, which finishes off the second beat. Together they make a long-short lilt you’ll hear in countless songs.',
      ],
    },
    exemple: { droite: 'C4:1.5/1 D4:0.5/2 E4:1.5/3 F4:0.5/4 | G4:3/5 -:1 | E4:1.5/3 D4:0.5/2 C4:1/1 E4:1/3 | D4:1.5/2 C4:0.5/1 C4:2/1', gauche: '', mesure: '4/4' },
    illustration: 'rythme',
    retenir: {
      fr: 'Le point ajoute la moitié : blanche pointée, trois temps ; noire pointée, un temps et demi.',
      en: 'A dot adds half: a dotted half is three beats, a dotted quarter one and a half.',
    },
  },
  {
    id: 'mesure',
    palier: 5,
    titre: { fr: 'La mesure', en: 'Time signatures' },
    resume: {
      fr: 'Les deux chiffres du début disent combien de temps compter dans chaque mesure.',
      en: 'The two numbers at the start tell you how many beats to count in each measure.',
    },
    corps: {
      fr: [
        'Les barres verticales découpent la musique en mesures, qui ont toutes le même nombre de temps. Le premier temps de chaque mesure est le plus appuyé.',
        'Au début de la partition, deux chiffres l’annoncent. Celui du haut dit combien de temps compter par mesure, et le 4 du bas veut dire que chaque temps vaut une noire.',
        'En 4/4, on compte « un, deux, trois, quatre ». En 3/4, « un, deux, trois » : c’est la mesure de la valse. Tu croiseras aussi 6/8 : six croches par mesure, qui se balancent en deux grands temps.',
        'Certains airs commencent avant le premier temps, par une mesure incomplète : c’est une levée. « Joyeux anniversaire » en a une.',
      ],
      en: [
        'Bar lines divide music into measures, each holding the same number of beats. The first beat of every measure carries the most weight.',
        'Two numbers at the start announce it. The top one tells you how many beats to count in each measure; a 4 at the bottom means each beat is a quarter note.',
        'In 4/4 you count “one, two, three, four.” In 3/4, “one, two, three”: waltz time. You’ll also meet 6/8, six eighth notes per measure that sway in two big beats.',
        'Some tunes start before the first full measure, on a short one called a pickup. “Happy Birthday” has one.',
      ],
    },
    exemple: { droite: 'C4:1/1 E4:1/3 G4:1/5 | G4:2/5 E4:1/3 | F4:1/4 E4:1/3 D4:1/2 | C4:3/1', gauche: '', mesure: '3/4' },
    illustration: 'rythme',
    retenir: {
      fr: 'Le chiffre du haut dit combien de temps compter ; le premier temps est le plus fort.',
      en: 'The top number says how many beats to count, and beat one is always the strongest.',
    },
  },

  // Palier 6 : Les deux mains
  {
    id: 'deux-mains',
    palier: 6,
    titre: { fr: 'Les deux mains ensemble', en: 'Hands together' },
    resume: {
      fr: 'Sur la partition, ce qui est aligné se joue en même temps ; à l’entraînement, chaque main d’abord, puis les deux, lentement.',
      en: 'On the page, notes lined up vertically sound together; in practice, each hand alone first, then both, slowly.',
    },
    corps: {
      fr: [
        'Sur les deux portées, les notes placées l’une au-dessus de l’autre se jouent en même temps. Lis de gauche à droite, mais aussi de haut en bas.',
        'Le plus souvent, la main droite chante la mélodie et la main gauche joue la basse : des notes plus graves, souvent plus longues, qui la soutiennent.',
        'Pour apprendre un morceau, travaille d’abord chaque main seule. Puis assemble-les, plus lentement que tu n’en as envie, deux mesures à la fois. La vitesse viendra d’elle-même.',
      ],
      en: [
        'On the grand staff, notes stacked one above the other are played at the same time. Read left to right, but also top to bottom.',
        'Most of the time, the right hand sings the melody while the left plays the bass: lower notes, often longer ones, that hold it up.',
        'To learn a piece, practice each hand on its own first. Then put them together, slower than you’d like, a couple of measures at a time. Speed will come by itself.',
      ],
    },
    exemple: { droite: 'E4:1/3 D4:1/2 C4:1/1 D4:1/2 | E4:1/3 E4:1/3 E4:2/3 | D4:1/2 D4:1/2 D4:2/2 | E4:1/3 D4:1/2 C4:2/1', gauche: 'C3:4/5 | C3:4/5 | G3:4/1 | C3:4/5', mesure: '4/4' },
    illustration: 'mains',
    retenir: {
      fr: 'Ce qui est aligné se joue ensemble. Une main, puis l’autre, puis les deux, lentement.',
      en: 'Lined up means played together. One hand, then the other, then both, slowly.',
    },
  },

  // Palier 7 : Les accords
  {
    id: 'accords',
    palier: 7,
    titre: { fr: 'Les accords', en: 'Chords' },
    resume: {
      fr: 'Trois notes empilées une touche blanche sur deux : avec do, fa, sol et la mineur, tu accompagnes déjà beaucoup de chansons.',
      en: 'Three notes stacked on every other white key: with C, F, G and A minor, you can already accompany a great many songs.',
    },
    corps: {
      fr: [
        'Un accord, ce sont plusieurs notes jouées ensemble. Le plus courant en compte trois, empilées une touche blanche sur deux : do, mi, sol. Sur la portée, elles se posent sur trois lignes de suite, ou dans trois interlignes.',
        'La note sur laquelle on empile, la fondamentale, donne son nom à l’accord. Avec la même forme, tu obtiens fa-la-do et sol-si-ré. Do, fa et sol sont des accords majeurs : ils sonnent clair et stable.',
        'La-do-mi a la même forme, mais une autre couleur, plus sombre et plus tendre : c’est un accord mineur. Il partage deux notes avec l’accord de do.',
        'Dans les recueils de chansons, on les écrit souvent avec des lettres : C pour do, F pour fa, G pour sol, Am pour la mineur.',
      ],
      en: [
        'A chord is several notes played together. The most common kind has three, stacked on every other white key: C, E, G. On the staff they sit on three lines in a row, or in three spaces.',
        'The note you build on, the root, gives the chord its name. The same shape gives you F–A–C and G–B–D. C, F and G are major chords: bright and settled.',
        'A–C–E has the same shape but a different color, darker and more tender: it’s a minor chord. It shares two notes with C major.',
        'Songbooks and lead sheets write them as letters above the melody: C, F, G, and Am for A minor. The small m stands for minor.',
      ],
    },
    exemple: { droite: 'C4+E4+G4:2/1+3+5 A4+C5+E5:2/1+3+5 | F4+A4+C5:2/1+3+5 G4+B4+D5:2/1+3+5 | C4+E4+G4:4/1+3+5', gauche: '', mesure: '4/4' },
    illustration: 'clavier',
    retenir: {
      fr: 'Une touche sur deux, trois notes ensemble : la note de base donne son nom à l’accord.',
      en: 'Every other key, three notes at once: the chord is named after the note it’s built on.',
    },
  },
  {
    id: 'renversements',
    palier: 7,
    titre: { fr: 'Les renversements', en: 'Chord inversions' },
    resume: {
      fr: 'Les mêmes notes dans un autre ordre : l’accord garde son nom, et ta main bouge à peine.',
      en: 'The same notes in a different order: the chord keeps its name, and your hand barely moves.',
    },
    corps: {
      fr: [
        'Un accord ne change pas de nom quand on change l’ordre de ses notes. Fa-la-do, la-do-fa ou do-fa-la : c’est toujours l’accord de fa.',
        'Quand la fondamentale n’est plus la note du bas, on dit que l’accord est renversé. Do-fa-la, avec do en bas, est un renversement de l’accord de fa.',
        'À quoi ça sert ? À passer d’un accord à l’autre en bougeant le moins possible. De do-mi-sol à do-fa-la, l’auriculaire reste sur do : les deux autres notes montent juste d’une touche.',
        'C’est ce que fait ta main gauche dans ce palier : sol devient si-ré-sol, la mineur devient do-mi-la. La main reste presque en place, et les accords s’enchaînent sans à-coup.',
      ],
      en: [
        'A chord keeps its name when you shuffle the order of its notes. F–A–C, A–C–F or C–F–A: it’s still an F chord.',
        'When the root is no longer the lowest note, the chord is inverted. C–F–A, with C at the bottom, is an inversion of F.',
        'Why bother? To get from one chord to the next while moving as little as possible. From C–E–G to C–F–A, your pinky stays on C while the other two notes each move up just one key.',
        'That’s what your left hand does at this level: G becomes B–D–G, A minor becomes C–E–A. Your hand stays almost still, and the chords flow into each other.',
      ],
    },
    exemple: { droite: '', gauche: 'C3+E3+G3:2/5+3+1 C3+E3+A3:2/5+3+1 | C3+F3+A3:2/5+2+1 B2+D3+G3:2/5+3+1 | C3+E3+G3:4/5+3+1', mesure: '4/4' },
    illustration: 'clavier',
    retenir: {
      fr: 'Mêmes notes, autre ordre : même accord. On le renverse pour que la main bouge le moins possible.',
      en: 'Same notes, new order, same chord. Invert it so your hand barely has to move.',
    },
  },
  {
    id: 'accords-brises',
    palier: 7,
    titre: { fr: 'Les accords brisés', en: 'Broken chords' },
    resume: {
      fr: 'Jouer les notes d’un accord l’une après l’autre, pour mettre l’harmonie en mouvement.',
      en: 'Playing a chord’s notes one after another, to set the harmony in motion.',
    },
    corps: {
      fr: [
        'Un accord n’est pas obligé de sonner d’un bloc. Ses notes peuvent se suivre, l’une après l’autre : c’est un accord brisé. Quand il monte ou descend note à note, on parle aussi d’arpège.',
        'Pose la main sur l’accord comme pour le plaquer, puis laisse les doigts le jouer à tour de rôle. Rien à chercher : chaque note est déjà sous un doigt.',
        'Tu en as déjà joué un : la basse d’Alberti, do-sol-mi-sol, que ta main gauche a apprise au palier 3, est un accord de do brisé. Bach ouvre son Prélude en do de la même façon.',
      ],
      en: [
        'A chord doesn’t have to sound all at once. Its notes can follow one another: that’s a broken chord. When it climbs or falls note by note, it’s also called an arpeggio.',
        'Set your hand on the chord as if to play it together, then let your fingers take turns. Nothing to hunt for: every note is already under a finger.',
        'You’ve played one already: the Alberti bass your left hand learned earlier, C–G–E–G, is a broken C chord. Bach opens his Prelude in C the same way.',
      ],
    },
    exemple: { droite: '', gauche: 'C3:1/5 E3:1/3 G3:1/1 E3:1/3 | C3:1/5 F3:1/2 A3:1/1 F3:1/2 | B2:1/5 D3:1/3 G3:1/1 D3:1/3 | C3+E3+G3:4/5+3+1', mesure: '4/4' },
    illustration: 'mains',
    retenir: {
      fr: 'Pose la main sur l’accord, puis laisse les doigts le jouer tour à tour.',
      en: 'Set your hand on the chord, then let your fingers play it in turn.',
    },
  },

  // Palier 8 : Aller plus loin
  {
    id: 'dieses-bemols',
    palier: 8,
    titre: { fr: 'Dièses et bémols', en: 'Sharps and flats' },
    resume: {
      fr: 'Le dièse monte une note d’un demi-ton, le bémol la descend : les touches noires ont enfin un nom.',
      en: 'A sharp raises a note by a half step and a flat lowers it: the black keys finally get their names.',
    },
    corps: {
      fr: [
        'Le demi-ton est le plus petit pas du piano : d’une touche à sa voisine immédiate, noire ou blanche.',
        'Le dièse ♯ monte une note d’un demi-ton : fa dièse est la touche noire juste à droite de fa. Le bémol ♭ la descend : si bémol est la touche noire juste à gauche de si. Chaque touche noire a donc deux noms : fa dièse et sol bémol, c’est la même.',
        'Entre mi et fa, et entre si et do, il n’y a pas de touche noire : ces notes sont déjà à un demi-ton l’une de l’autre.',
        'Sur la partition, le signe se place juste avant la note et vaut jusqu’à la fin de la mesure. Le bécarre ♮ l’annule.',
      ],
      en: [
        'A half step is the smallest move on the piano: from one key to its very next neighbor, black or white.',
        'A sharp ♯ raises a note by a half step: F sharp is the black key just right of F. A flat ♭ lowers it: B flat is the black key just left of B. So every black key has two names: F sharp and G flat are the same key.',
        'Between E and F, and between B and C, there’s no black key: those notes are already a half step apart.',
        'On the page, the sign sits just before the note and lasts until the end of the measure. A natural sign ♮ cancels it.',
      ],
    },
    exemple: { droite: 'E4:1/1 F4:1/2 F#4:1/3 G4:1/4 | A4:2/5 G4:2/4 | G4:1/4 F#4:1/3 E4:1/1 F#4:1/3 | G4:4/4', gauche: '', mesure: '4/4' },
    illustration: 'clavier',
    retenir: {
      fr: 'Dièse : un demi-ton plus haut. Bémol : un demi-ton plus bas.',
      en: 'Sharp: a half step up. Flat: a half step down.',
    },
  },
  {
    id: 'passage-du-pouce',
    palier: 8,
    titre: { fr: 'Le passage du pouce', en: 'Passing the thumb under' },
    resume: {
      fr: 'Pour jouer plus de cinq notes d’un trait, le pouce passe sous la main.',
      en: 'To play more than five notes in one sweep, your thumb slips under your hand.',
    },
    corps: {
      fr: [
        'Une gamme a huit notes, ta main cinq doigts. Pour enchaîner sans t’arrêter, le pouce passe sous la main et ouvre une nouvelle position.',
        'Gamme de do, main droite, en montant : do, ré, mi avec 1, 2, 3. Le pouce passe alors sous la main pour prendre fa, et la gamme continue avec 2, 3, 4, 5 jusqu’au do.',
        'En redescendant, c’est l’inverse : après le pouce sur fa, le majeur passe par-dessus pour prendre mi.',
        'Prépare le pouce tôt, en le glissant sous la main pendant que les autres doigts jouent. Le poignet reste à la même hauteur et le coude suit en souplesse : rien ne doit sauter.',
      ],
      en: [
        'A scale has eight notes, your hand has five fingers. To keep going without a break, your thumb tucks under your hand and opens a new position.',
        'C major, right hand, going up: C, D, E with 1, 2, 3. Then your thumb slips under to take F, and the scale carries on with 2, 3, 4, 5 up to C.',
        'Coming down, it’s the reverse: after the thumb plays F, your middle finger crosses over it to take E.',
        'Get the thumb moving early, sliding it under while the other fingers play. Keep your wrist level and let your elbow follow smoothly: nothing should jump.',
      ],
    },
    exemple: { droite: 'C4:1/1 D4:1/2 E4:1/3 F4:1/1 | G4:1/2 A4:1/3 B4:1/4 C5:1/5 | B4:1/4 A4:1/3 G4:1/2 F4:1/1 | E4:1/3 D4:1/2 C4:2/1', gauche: '', mesure: '4/4' },
    illustration: 'mains',
    retenir: {
      fr: 'En montant, le pouce passe dessous ; en descendant, le majeur passe par-dessus.',
      en: 'Thumb under on the way up, middle finger over on the way down.',
    },
  },
  {
    id: 'gamme-majeure',
    palier: 8,
    titre: { fr: 'La gamme majeure', en: 'The major scale' },
    resume: {
      fr: 'Huit notes en escalier, toujours avec le même dessin de tons et de demi-tons.',
      en: 'Eight notes climbing like a staircase, always with the same pattern of whole and half steps.',
    },
    corps: {
      fr: [
        'Une gamme monte marche par marche, d’une note jusqu’à la même note une octave plus haut. La gamme de do va de do à do, sur les seules touches blanches.',
        'Un ton vaut deux demi-tons : entre do et ré, il y a une touche noire. Toutes les gammes majeures suivent le même dessin : ton, ton, demi-ton, ton, ton, ton, demi-ton.',
        'En partant de sol, il faut un fa dièse pour garder ce dessin : sol, la, si, do, ré, mi, fa dièse, sol. C’est pour ça que la gamme de sol a un dièse.',
        'Sur une partition, ce fa dièse est souvent écrit une fois pour toutes au début de chaque ligne : c’est l’armure.',
      ],
      en: [
        'A scale climbs step by step, from one note up to the same note an octave higher. The C major scale runs from C to C on the white keys alone.',
        'A whole step is two half steps: from C to D, with a black key in between. Every major scale follows the same pattern: whole, whole, half, whole, whole, whole, half.',
        'Start on G and you need an F sharp to keep that pattern: G, A, B, C, D, E, F sharp, G. That’s why G major has one sharp.',
        'On sheet music, that F sharp is often written once, at the start of every line. It’s called the key signature.',
      ],
    },
    exemple: { droite: 'G4:1/1 A4:1/2 B4:1/3 C5:1/1 | D5:1/2 E5:1/3 F#5:1/4 G5:1/5 | F#5:1/4 E5:1/3 D5:1/2 C5:1/1 | B4:1/3 A4:1/2 G4:2/1', gauche: '', mesure: '4/4' },
    illustration: 'clavier',
    retenir: {
      fr: 'Ton, ton, demi-ton, ton, ton, ton, demi-ton : le dessin de toutes les gammes majeures.',
      en: 'Whole, whole, half, whole, whole, whole, half: the shape of every major scale.',
    },
  },
  {
    id: 'nuances',
    palier: 8,
    titre: { fr: 'Les nuances', en: 'Dynamics' },
    resume: {
      fr: 'Jouer doux ou fort, et passer de l’un à l’autre : c’est ce qui fait respirer la musique.',
      en: 'Playing soft or loud, and moving between the two: that’s what makes music breathe.',
    },
    corps: {
      fr: [
        'Les nuances disent à quel volume jouer. Elles s’écrivent sous la portée, en italien : p pour piano, doux ; f pour forte, fort. Le nom complet de ton instrument vient de là : pianoforte, celui qui joue doux et fort.',
        'Entre les deux, toute une palette : pp très doux, mp assez doux, mf assez fort, ff très fort. Le crescendo fait grandir le son peu à peu, le decrescendo le fait décroître ; on les dessine aussi avec un soufflet qui s’ouvre ou se referme.',
        'Le volume vient de la vitesse de la touche, pas de la force. Pour jouer fort, laisse tomber le poids du bras. Pour jouer doux, enfonce la touche plus lentement, en partant tout près d’elle.',
        'Essaie avec l’exemple : la première mesure forte, la deuxième piano comme un écho, puis un crescendo jusqu’au sol.',
      ],
      en: [
        'Dynamics tell you how loud to play. They’re written under the staff, in Italian: p for piano, soft; f for forte, loud. Your instrument’s full name, pianoforte, comes from exactly that: it can do both.',
        'In between lies a whole range: pp very soft, mp moderately soft, mf moderately loud, ff very loud. A crescendo grows louder little by little and a decrescendo fades; both can also be drawn as a hairpin that opens or closes.',
        'Volume comes from the speed of the key, not from force. To play loud, let the weight of your arm drop. To play soft, press the key down more slowly, starting right on its surface.',
        'Try it with the example: the first measure forte, the second piano like an echo, then a crescendo up to G.',
      ],
    },
    exemple: { droite: 'E4:1/3 D4:1/2 C4:2/1 | E4:1/3 D4:1/2 C4:2/1 | C4:1/1 D4:1/2 E4:1/3 F4:1/4 | G4:4/5', gauche: '', mesure: '4/4' },
    illustration: null,
    retenir: {
      fr: 'Fort ou doux, tout se joue dans la vitesse de la touche, jamais dans la force.',
      en: 'Loud or soft, it’s all in the speed of the key, never the force.',
    },
  },
  {
    id: 'pedale',
    palier: 8,
    titre: { fr: 'La pédale', en: 'The sustain pedal' },
    resume: {
      fr: 'La pédale de droite laisse les cordes vibrer quand tes doigts se lèvent : elle lie ce que la main seule ne peut pas tenir.',
      en: 'The right pedal lets the strings ring on after your fingers lift, joining up what your hand alone can’t hold.',
    },
    corps: {
      fr: [
        'Dès que tu lâches une touche, un étouffoir de feutre vient arrêter la corde. La pédale de droite soulève tous les étouffoirs à la fois : les notes continuent de sonner, même mains levées. On l’appelle aussi la pédale forte.',
        'Pour la changer sans brouiller le son, relève-la au moment où tu joues la nouvelle note ou le nouvel accord, puis renfonce-la aussitôt. Le pied arrive juste après les doigts.',
        'Change-la à chaque changement d’accord : la garder trop longtemps mélange les harmonies. Sur la partition, « Ped. » ou un trait sous la portée indique quand l’enfoncer, et une étoile ou la fin du trait, quand la relever.',
        'La pédale de gauche, elle, est la pédale douce : elle adoucit le son.',
      ],
      en: [
        'As soon as you let go of a key, a felt damper comes to rest on the string and stops it. The right pedal lifts every damper at once: the notes keep ringing even with your hands in the air.',
        'To change it without blurring the sound, lift it just as you play the new note or chord, then press it straight back down. Your foot comes in just after your fingers.',
        'Change it with every new chord: holding it too long muddies the harmonies. On the page, “Ped.” or a line under the staff shows when to press, and an asterisk or the end of the line shows when to lift.',
        'The left pedal is the soft pedal: it simply makes the sound quieter.',
      ],
    },
    exemple: { droite: 'C4+E4+G4:2/1+3+5 F4+A4+C5:2/1+3+5 | G4+B4+D5:2/1+3+5 C4+E4+G4:2/1+3+5', gauche: 'C3:2/5 F2:2/5 | G2:2/5 C3:2/5', mesure: '4/4' },
    illustration: null,
    retenir: {
      fr: 'Relève la pédale en jouant le nouvel accord, renfonce-la aussitôt après.',
      en: 'Lift the pedal as you play the new chord, then press it straight back down.',
    },
  },
];
