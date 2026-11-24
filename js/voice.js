// La voix du prof (synthese vocale du navigateur, en francais). Facultative, coupee par defaut.
import { getSettings } from './progress.js';

let chosen = null;
function pickVoice() {
  if (chosen) return chosen;
  const all = window.speechSynthesis?.getVoices() || [];
  const fr = all.filter((v) => (v.lang || '').toLowerCase().startsWith('fr'));
  const rank = (v) => (/natural|neural|online/i.test(v.name) ? 3 : 0) + (/google/i.test(v.name) ? 2 : 0) + (/fr-fr/i.test(v.lang) ? 1 : 0);
  chosen = fr.sort((a, b) => rank(b) - rank(a))[0] || null;
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
  const u = new SpeechSynthesisUtterance(text.replace(/[«»]/g, '').replace(/#/g, ' dièse'));
  u.lang = 'fr-FR';
  u.rate = 1.03;
  const v = pickVoice();
  if (v) u.voice = v;
  window.speechSynthesis.speak(u);
  return Math.min(9000, 400 + text.length * 62);
}

export function hush() {
  if (voiceAvailable()) window.speechSynthesis.cancel();
}
