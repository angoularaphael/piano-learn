// Petits outils de texte : typographie francaise et echappement.
import { lang } from './i18n.js';

// Espaces insecables fines avant : ; ! ? et dans les guillemets, pour qu'un signe ne parte jamais seul a la ligne
export function fr(text = '') {
  return String(text)
    .replace(/ ([:;!?»])/g, ' $1')
    .replace(/« /g, '« ');
}

export function esc(text = '') {
  return String(text).replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
}

export const DOIGTS = lang() === 'en'
  ? ['', 'thumb', 'index finger', 'middle finger', 'ring finger', 'little finger']
  : ['', 'pouce', 'index', 'majeur', 'annulaire', 'auriculaire'];

export const plural = (n, one, many) => `${n} ${n > 1 ? many : one}`;

// Nom de l'application, en un seul endroit (certificat, partages, plaque du piano)
export const BRAND = 'Piano Learn';
