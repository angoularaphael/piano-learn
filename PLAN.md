# Plan du site d'apprentissage du piano

## L'idee

Un site ou un prof en 3D, assis devant un piano 3D, montre quoi jouer. L'eleve rejoue sur son vrai piano (acoustique) a la maison. Le site ecoute avec le micro, verifie si c'est la bonne note, et donne de l'XP. On avance palier par palier, du tout debut (do re mi) jusqu'a de vrais morceaux.

Public : debutants de tout age. Ton simple, encourageant, pas enfantin.

## Comment se passe une lecon

1. Le prof explique en une ou deux phrases (bulle de texte, voix en option).
2. Il joue l'exercice lentement sur le piano 3D : ses doigts appuient sur les touches, la touche s'allume, on entend le son.
3. A l'eleve : la note a jouer s'affiche, elle la joue sur son piano.
4. Le micro ecoute. Bonne note = la touche passe au vert, on passe a la suivante. Mauvaise note = le prof remontre.
5. Fin de l'exercice : score de precision, XP gagne, etoiles (1 a 3).

Astuce pratique : le site doit bien marcher sur tablette posee sur le pupitre du piano.

## Les paliers

| Palier | Nom | Contenu | Morceau de fin |
|---|---|---|---|
| 1 | Decouverte | Se reperer sur le clavier, trouver le do, do re mi fa sol, numeros des doigts, posture | Au clair de la lune (main droite) |
| 2 | Premieres melodies | Do a sol main droite, jouer lie, petits enchainements | Frere Jacques |
| 3 | La main gauche | Do a sol main gauche, notes graves | Ode a la joie (main droite + basses simples) |
| 4 | Lire les notes | Portee, cle de sol, cle de fa, lire sans regarder les touches | Morceau au choix du palier |
| 5 | Le rythme | Ronde, blanche, noire, croche, silences, compter les temps | Jingle Bells |
| 6 | Les deux mains | Coordination, melodie + basse | Lettre a Elise (debut simplifie) |
| 7 | Les accords | Do, fa, sol majeurs, accompagner une melodie | Morceau actuel arrange simplement |
| 8 | Aller plus loin | Dieses, bemols, gammes, nuances | Morceaux intermediaires |

Chaque palier : 5 a 8 lecons courtes (5 a 10 min), puis un morceau de fin a reussir pour debloquer le palier suivant.

## XP et niveaux

- Lecon reussie : +50 XP, bonus selon la precision (jusqu'a +50).
- Morceau de fin de palier : +200 XP.
- Serie de jours d'affilee : bonus quotidien (+10 XP par jour de serie).
- Le niveau monte avec l'XP total (niveau 1, 2, 3...), separement des paliers.
- Badges : premiere note, 7 jours de suite, premier morceau a deux mains, etc.
- Tout est garde dans le navigateur pour l'instant (pas de compte). On pourra ajouter les comptes plus tard.

## Les pages

- Accueil : presentation, bouton "Commencer".
- Carte de progression : les paliers en chemin, ce qui est fait, ce qui est bloque.
- Lecon : le prof 3D, le piano 3D, les consignes, le retour du micro.
- Bibliotheque : tous les morceaux, classes par difficulte, debloques selon le niveau.
- Profil : niveau, XP, badges, serie de jours.
- Reglages : micro (test et calibrage), vitesse du prof, voix on/off.

## Le prof 3D

- Personnage 3D gratuit avec squelette (Mixamo ou equivalent, licence a verifier), assis au piano.
- Animation : on deplace ses mains et ses doigts vers les touches en code (cinematique inverse), donc il peut jouer n'importe quel exercice sans animer chaque lecon a la main.
- Expressions simples : il hoche la tete quand c'est juste, il montre a nouveau quand c'est faux.
- Camera reglable : vue de face, vue du dessus sur les mains.

## L'ecoute au micro (piano acoustique)

- Detection de la note jouee directement dans le navigateur (rien n'est envoye sur internet).
- Calibrage au debut : on joue un la, le site s'adapte si le piano est un peu desaccorde.
- Limite a savoir : une note a la fois, ca marche bien. Les accords (plusieurs notes en meme temps) sont beaucoup plus durs a reconnaitre au micro. Pour les paliers 6 et 7, on verifie la note principale, ou on propose un bouton "j'ai reussi" en secours.
- Plus tard si besoin : branchement d'un piano numerique en USB (detection parfaite).

## Les morceaux

- Classiques libres de droits : aucun souci (Au clair de la lune, Frere Jacques, Ode a la joie, Lettre a Elise, Canon de Pachelbel, Gymnopedie...).
- Musiques actuelles : attention. Publier une partition ou un arrangement d'une chanson protegee demande en principe une licence (en France, via la SACEM / les editeurs). Pistes :
  - garder les morceaux actuels tant que le site est prive,
  - ou passer par une licence avant la mise en ligne publique,
  - ou faire des morceaux originaux "dans le style de".
  A trancher avant la mise en ligne.

## Technique

- Vite + JavaScript, Three.js pour la 3D.
- Sons du piano 3D : echantillons de piano libres de droits.
- Detection de note : librairie de detection de hauteur (type pitchy).
- Sauvegarde : localStorage.
- Hebergement : Vercel ou Netlify (gratuit).
- Responsive : ordinateur, tablette, telephone.

## Ordre de construction

1. Base : piano 3D jouable (clic + son) et structure des pages.
2. Le prof 3D assis au piano, qui joue une suite de notes.
3. Ecoute au micro et validation des notes, avec calibrage.
4. Palier 1 complet + systeme d'XP et carte de progression.
5. Paliers 2 a 5, bibliotheque de morceaux classiques.
6. Paliers 6 a 8, accords, morceaux actuels (selon la decision sur les droits).
7. Finitions : badges, voix du prof, mise en ligne.

## Questions encore ouvertes

- Le nom du site ?
- On met le projet sur GitHub (pour sauvegarder et mettre en ligne) ? Le dossier n'est pas encore un depot git.
- Une couleur ou un style deja en tete ?
