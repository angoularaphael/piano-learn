# Piano Learn

Site pour apprendre le piano à la maison avec un prof en 3D. Le prof montre, on rejoue sur son vrai piano
(le site écoute au micro), et l'instrument grandit avec l'élève : quelques touches de lumière au début,
un vrai clavier au palier 3, un piano à queue au palier 6.

Lancer en local (sans cache navigateur, pour toujours voir la dernière version) :

    python tools/serve.py

puis ouvrir http://localhost:5580

Le plan complet est dans PLAN.md.

## Comment c'est construit

- `js/main.js` : routeur et pages (accueil, parcours, mon piano, morceaux, profil, réglages).
- `js/instrument.js` : ce que chaque palier débloque (plage de touches, corps de l'instrument, sons, fonctions).
- `js/piano3d.js` : le piano 3D (trois corps, touches apprises allumées, plage qui s'agrandit en direct).
- `js/grand.js` : le piano à queue (caisse, couvercle, cadre doré, cordes qui vibrent, étouffoirs, pédales).
- `js/stage.js` : un seul moteur 3D partagé par toutes les pages, résolution qui s'adapte à la machine.
- `js/audio.js` : vrai piano échantillonné (Salamander Grand Piano, CC-BY), réverbération, six sons.
- `js/lesson.js` : une leçon (le prof montre, l'élève rejoue note par note, aide si on hésite).
- `js/tutorial.js` + `js/highway.js` : les morceaux en notes qui tombent, modes Écouter et Jouer.
- `js/teacher.js` : le prof 3D qui joue avec les doigtés de la partition.
- `js/listen.js` : l'écoute au micro (YIN) ; `js/midi.js` : piano numérique en USB.
- `js/score.js` : la notation des partitions (`E4:1/3` = mi, une noire, majeur) et son vérificateur.
- `js/data/curriculum.js` : les leçons ; `js/data/songs.js` : la bibliothèque de morceaux.

Ajouter `?debug` à l'adresse expose le piano 3D dans la console (`window.__piano`) pour les réglages.
