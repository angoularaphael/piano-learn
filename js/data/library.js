// La bibliotheque de morceaux, rassemblee depuis trois sources :
// - songs.js : la bibliotheque principale (notation compacte, doigtes, histoire de chaque morceau) ;
// - BASE : les morceaux du palier 1, toujours disponibles ;
// - morceaux.js : les versions piano de l'equipe (format [midi, temps]) et les liens vers les lecons.
import { MORCEAUX } from './morceaux.js';

const BASE = [
  {
    id: 'au-clair-de-la-lune', titre: 'Au clair de la lune', compositeur: 'Chanson traditionnelle',
    origine: 'Chanson populaire française du XVIIIe siècle', palier: 1, niveau: 1, tempo: 92, mesure: '4/4',
    droite: 'C4:1/1 C4:1/1 C4:1/1 D4:1/2 | E4:2/3 D4:2/2 | C4:1/1 E4:1/3 D4:1/2 D4:1/2 | C4:4/1 | C4:1/1 C4:1/1 C4:1/1 D4:1/2 | E4:2/3 D4:2/2 | C4:1/1 E4:1/3 D4:1/2 D4:1/2 | C4:4/1 | D4:1/5 D4:1/5 D4:1/5 D4:1/5 | A3:2/2 A3:2/2 | D4:1/5 C4:1/4 B3:1/3 A3:1/2 | G3:4/1 | C4:1/1 C4:1/1 C4:1/1 D4:1/2 | E4:2/3 D4:2/2 | C4:1/1 E4:1/3 D4:1/2 D4:1/2 | C4:4/1',
    histoire: 'En 1860, Édouard-Léon Scott de Martinville en a gravé quelques notes avec son phonautographe : c’est l’un des plus anciens enregistrements de voix humaine connus.',
  },
  {
    id: 'ode-joie-theme', titre: 'Ode à la joie', compositeur: 'Ludwig van Beethoven', annee: 1824,
    origine: 'Symphonie n° 9, dernier mouvement', palier: 1, niveau: 1, tempo: 100, mesure: '4/4',
    droite: 'E4:1/3 E4:1/3 F4:1/4 G4:1/5 | G4:1/5 F4:1/4 E4:1/3 D4:1/2 | C4:1/1 C4:1/1 D4:1/2 E4:1/3 | E4:1.5/3 D4:0.5/2 D4:2/2 | E4:1/3 E4:1/3 F4:1/4 G4:1/5 | G4:1/5 F4:1/4 E4:1/3 D4:1/2 | C4:1/1 C4:1/1 D4:1/2 E4:1/3 | D4:1.5/2 C4:0.5/1 C4:2/1',
    histoire: 'Beethoven, presque sourd, a dirigé la première de sa Neuvième symphonie à Vienne en 1824. Ce thème est aujourd’hui l’hymne de l’Union européenne.',
  },
];

const norm = (t) => String(t).toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]/g, '');

let main = [];
try {
  const mod = await import('./songs.js');
  if (Array.isArray(mod.SONGS)) main = mod.SONGS;
} catch (e) { /* la bibliotheque principale n'est pas encore la */ }

const songs = [...main];
const has = (s) => songs.some((x) => x.id === s.id || norm(x.titre) === norm(s.titre));
BASE.forEach((s) => { if (!has(s)) songs.push(s); });

// Versions piano de l'equipe (morceaux actuels au tempo du morceau) et liens vers les lecons du parcours
for (const m of MORCEAUX) {
  const entry = { id: m.id, titre: m.titre, compositeur: m.auteur, palier: m.palier };
  if (has(entry)) continue;
  if (m.demo) {
    songs.push({
      ...entry, niveau: 3, tempo: m.tempo || 100, mesure: '4/4', demo: m.demo,
      intro: m.texte, libre: !!m.libre, actuel: m.type === 'actuel',
    });
  } else if (m.lecon) {
    songs.push({ ...entry, niveau: 1, lecon: m.lecon });
  }
}

songs.sort((a, b) => a.palier - b.palier || (a.niveau || 1) - (b.niveau || 1));

export const SONGS = songs;
export const findSong = (id) => SONGS.find((s) => s.id === id) || null;
// Un morceau est ouvert si son palier est atteint, ou s'il est en acces libre
export const songOpen = (s, palier) => !!s.libre || s.palier <= palier;
