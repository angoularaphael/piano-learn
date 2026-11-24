# Piano Learn

Site pour apprendre le piano à la maison avec un prof en 3D. Le prof montre, on rejoue sur son vrai piano
(le site écoute au micro), et l'instrument grandit avec l'élève : un clavier esquissé au crayon au début
(chaque note apprise s'encre), un vrai clavier au palier 3, un piano à queue au palier 6, une salle de concert au palier 8.
En français et en anglais. Aucun compte, aucun serveur : tout reste sur l'appareil, et le site marche hors ligne.

Lancer en local (sans cache navigateur, pour toujours voir la dernière version) :

    python tools/serve.py

puis ouvrir http://localhost:5580

Le plan complet est dans PLAN.md.

## Comment c'est construit

- `js/main.js` : routeur et pages (accueil en page de titre, séance du jour, parcours, mon piano et son studio, morceaux, profil, réglages).
- `js/hero-scene.js` : la planche de l'accueil, un clavier dessiné au crayon en vraie perspective (Canvas 2D) qui s'encre quand on le joue.
- `css/style.css` + `js/palette.js` : « L'édition », la partition que le prof annote (papier, encre, crayon rouge pour la main droite,
  bleu pour la gauche ; Bodoni Moda, Atkinson Hyperlegible Next, Bravura Text dans `fonts/`, licence SIL OFL).
- `js/instrument.js` : ce que chaque palier débloque (plage de touches, corps de l'instrument, sons, fonctions).
- `js/piano3d.js` : le piano 3D dans un studio de papier (trois corps, touches apprises encrées, plage qui s'agrandit en direct).
- `js/grand.js` : le piano à queue (caisse, couvercle, cadre doré, cordes qui vibrent, étouffoirs, pédales).
- `js/stage.js` : un seul moteur 3D partagé par toutes les pages, résolution qui s'adapte à la machine.
- `js/audio.js` : vrai piano échantillonné (Salamander Grand Piano, CC-BY), réverbération, six sons.
- `js/lesson.js` : une leçon (le prof montre, l'élève rejoue note par note, aide si on hésite).
- `js/tutorial.js` + `js/highway.js` : les morceaux sur un rouleau de pianola (Écouter, Jouer, En rythme, Concert).
- `js/sheet.js` : la partition (portée qui défile, dièses et bécarres par mesure, la note à jouer entourée au crayon).
- `js/teacher.js` + `js/teacher-body.js` : le prof 3D, fait maison (mannequin de porcelaine, visage dessiné à l'encre,
  doigts qui prennent la couleur de leur main, regard qui suit), qui joue avec les doigtés de la partition.
- `js/concert.js` + `js/certificate.js` : la salle de concert du palier 8 et le certificat de fin de parcours.
- `js/recorder.js` : enregistrer ses prises, les réécouter, les exporter en MIDI ou en vidéo.
- `js/session.js` : la séance du jour (oreille, leçon, révision, plaisir), la série et son joker, le rappel d'agenda.
- `js/ear.js` : les jeux d'oreille ; `js/theory.js` + `js/data/theorie.js` : les fiches de théorie.
- `js/listen.js` + `js/chord.js` : l'écoute au micro (YIN, accords vérifiés note par note) ; `js/midi.js` : piano numérique.
- `js/score.js` : la notation des partitions (`E4:1/3` = mi, une noire, majeur) et son vérificateur.
- `js/i18n.js` : les langues (`t('Phrase en français')`, dictionnaires anglais dans `js/i18n/`).
- `js/data/curriculum.js` et `js/data/songs.js` : les leçons et la bibliothèque (versions anglaises dans `js/data/en/`).
- `sw.js` : le mode hors ligne ; sa liste de fichiers se régénère avec `python tools/precache.py` avant chaque commit.

Ajouter `?debug` à l'adresse expose le piano 3D (`window.__piano`), le prof (`window.__teacher`), la salle de
concert (`window.__hall`) et la planche de l'accueil (`window.__hero`, qu'on peut faire avancer à la main) dans la console, et signale les phrases sans traduction.
