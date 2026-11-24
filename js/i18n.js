// Les langues : francais d'abord, anglais aussi.
// - lang() : la langue choisie dans les reglages, sinon celle du navigateur (francais s'il est en francais).
//   Elle ne change pas pendant la visite : changer de langue recharge la page.
// - t('Phrase en francais', { variables }) : la phrase dans la langue de l'eleve. La phrase francaise
//   sert de cle : le code reste lisible, et une traduction manquante retombe sur le francais.
//   Les variables s'ecrivent {nom} dans la phrase.
// - L({ fr, en }) : la bonne version d'un contenu deja traduit (fiches, textes de donnees).
// - locale() : pour les dates et les nombres.
import { getSettings, setSetting } from './progress.js';
import { EN_PAGES } from './i18n/en-pages.js';
import { EN_PLAY } from './i18n/en-play.js';

const EN = { ...EN_PAGES, ...EN_PLAY };
const DEBUG = typeof location !== 'undefined' && location.search.includes('debug');
const missing = new Set();
let current = null;

export function lang() {
  if (current) return current;
  const chosen = getSettings().langue;
  if (chosen === 'fr' || chosen === 'en') current = chosen;
  else {
    const nav = (navigator.languages?.[0] || navigator.language || 'fr').toLowerCase();
    current = nav.startsWith('fr') ? 'fr' : 'en';
  }
  return current;
}

export function setLang(l) {
  setSetting('langue', l);
  location.reload();
}

export function t(fr, vars) {
  let s = fr;
  if (lang() === 'en') {
    const en = EN[fr];
    if (en != null) s = en;
    else if (DEBUG && !missing.has(fr)) {
      missing.add(fr);
      console.warn('[i18n] sans traduction :', fr);
    }
  }
  return vars ? s.replace(/\{(\w+)\}/g, (_, k) => (vars[k] ?? '')) : s;
}

// Le prof a l'ecran est une femme ou un homme (reglage 'prof') : en francais, les phrases qui le designent
// s'accordent (« la prof », « Regarder la prof »). En anglais, « the teacher » ne change pas.
const FEM = {
  'Le prof': 'La prof',
  'Regarder le prof': 'Regarder la prof',
  'Revoir le prof': 'Revoir la prof',
  'Voix du prof': 'Voix de la prof',
  'Le prof s’installe au piano': 'La prof s’installe au piano',
  'Le prof n’a pas pu venir (connexion ?). Tu peux quand même jouer : appuie sur « À toi de jouer ».': 'La prof n’a pas pu venir (connexion ?). Tu peux quand même jouer : appuie sur « À toi de jouer ».',
};
export const tp = (fr, vars) => t(lang() === 'fr' && getSettings().prof !== 'homme' && FEM[fr] ? FEM[fr] : fr, vars);

export const L = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? o[lang()] ?? o.fr : o);
export const locale = () => (lang() === 'en' ? 'en-GB' : 'fr-FR');
export const missingKeys = () => [...missing];
