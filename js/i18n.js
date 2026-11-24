// Les langues : francais d'abord, anglais aussi.
// - lang() : la langue choisie dans les reglages, sinon celle du navigateur (francais si elle l'est).
// - L(objet) : choisit la bonne version d'un contenu { fr, en } (fiches, lecons traduites...).
import { getSettings } from './progress.js';

// Passe a true quand l'interface entiere est traduite
const AUTO = false;

export function lang() {
  const chosen = getSettings().langue;
  if (chosen === 'fr' || chosen === 'en') return chosen;
  // Sans choix : la langue du navigateur, seulement quand toute l'interface existe dans cette langue
  if (AUTO) {
    const nav = (navigator.languages?.[0] || navigator.language || 'fr').toLowerCase();
    return nav.startsWith('fr') ? 'fr' : 'en';
  }
  return 'fr';
}

export const L = (o) => (o && typeof o === 'object' && !Array.isArray(o) ? o[lang()] ?? o.fr : o);
