// La voix du prof (synthese vocale du navigateur, dans la langue de l'eleve). Facultative, coupee par defaut.
import { getSettings } from './progress.js';
import { lang } from './i18n.js';

let chosen = null;
function pickVoice() {
  if (chosen) return chosen;
  const all = window.speechSynthesis?.getVoices() || [];
  const want = lang();
  const mine = all.filter((v) => (v.lang || '').toLowerCase().startsWith(want));
  const main = want === 'en' ? /en-(us|gb)/i : /fr-fr/i;
  const rank = (v) => (/natural|neural|online/i.test(v.name) ? 3 : 0) + (/google/i.test(v.name) ? 2 : 0) + (main.test(v.lang) ? 1 : 0);
  chosen = mine.sort((a, b) => rank(b) - rank(a))[0] || null;
  return chosen;
}
if ('speechSynthesis' in window) window.speechSynthesis.addEventListener?.('voiceschanged', () => { chosen = null; });

export function voiceAvailable() {
  return 'speechSynthesis' in window;
}

// Lit une phrase ; renvoie la duree estimee (pour couper le micro pendant ce temps)
export function speak(text, { force = false } = {}) {
  if (!voiceAvailable() || (!force && !getSettings().voix) || !text) return 0;
  window.speechSynthesis.cancel();
  const en = lang() === 'en';
  const u = new SpeechSynthesisUtterance(text.replace(/[«»“”]/g, '').replace(/[#♯]/g, en ? ' sharp' : ' dièse'));
  u.lang = en ? 'en-US' : 'fr-FR';
  u.rate = 1.03;
  const v = pickVoice();
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
  return Math.min(9000, 400 + text.length * 62);
}

export function hush() {
  if (voiceAvailable()) window.speechSynthesis.cancel();
}
