// Son de piano synthetise (pas de fichiers a telecharger)
import { frequency } from './notes.js';

let ctx = null;
let master = null;
const voices = new Map();

function ensureContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)();
    master = ctx.createDynamicsCompressor();
    master.threshold.value = -14;
    master.ratio.value = 4;
    const out = ctx.createGain();
    out.gain.value = 0.8;
    master.connect(out).connect(ctx.destination);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

// Harmoniques : un peu de chaque, plus discretes dans les aigus
const PARTIALS = [
  { n: 1, g: 1.0 },
  { n: 2, g: 0.45 },
  { n: 3, g: 0.22 },
  { n: 4, g: 0.12 },
  { n: 5, g: 0.07 },
  { n: 6, g: 0.04 },
];

export function noteOn(midi, velocity = 0.8) {
  const ac = ensureContext();
  noteOff(midi, true);

  const now = ac.currentTime;
  const f0 = frequency(midi);
  // Les notes graves tiennent plus longtemps
  const sustain = Math.max(1.2, 6 - (midi - 36) * 0.07);

  const voice = ac.createGain();
  voice.gain.setValueAtTime(0, now);
  voice.gain.linearRampToValueAtTime(0.32 * velocity, now + 0.005);
  voice.gain.exponentialRampToValueAtTime(0.12 * velocity, now + 0.25);
  voice.gain.exponentialRampToValueAtTime(0.0008, now + sustain);

  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.6;
  filter.frequency.setValueAtTime(Math.min(16000, f0 * 12), now);
  filter.frequency.exponentialRampToValueAtTime(Math.max(400, f0 * 3), now + 1.2);

  filter.connect(voice).connect(master);

  const oscs = [];
  for (const p of PARTIALS) {
    const freq = f0 * p.n * (1 + 0.0004 * p.n * p.n); // legere inharmonicite
    if (freq > 18000) continue;
    const osc = ac.createOscillator();
    osc.type = 'sine';
    osc.frequency.value = freq;
    const g = ac.createGain();
    const brightness = midi > 72 ? 0.6 : 1;
    g.gain.value = p.g * (p.n === 1 ? 1 : brightness);
    // Les harmoniques hautes s'eteignent plus vite
    g.gain.setValueAtTime(g.gain.value, now);
    g.gain.exponentialRampToValueAtTime(Math.max(0.0001, g.gain.value * 0.05), now + sustain / p.n + 0.2);
    osc.connect(g).connect(filter);
    osc.start(now);
    osc.stop(now + sustain + 0.1);
    oscs.push(osc);
  }

  // Petit bruit de marteau
  const len = Math.floor(ac.sampleRate * 0.03);
  const buf = ac.createBuffer(1, len, ac.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  const noise = ac.createBufferSource();
  noise.buffer = buf;
  const nf = ac.createBiquadFilter();
  nf.type = 'bandpass';
  nf.frequency.value = Math.min(5000, f0 * 4);
  const ng = ac.createGain();
  ng.gain.value = 0.05 * velocity;
  noise.connect(nf).connect(ng).connect(master);
  noise.start(now);

  voices.set(midi, { voice, oscs });
  window.dispatchEvent(new CustomEvent('pl:note', { detail: { midi } }));
}

export function noteOff(midi, immediate = false) {
  const v = voices.get(midi);
  if (!v || !ctx) return;
  voices.delete(midi);
  const now = ctx.currentTime;
  const release = immediate ? 0.03 : 0.35;
  v.voice.gain.cancelScheduledValues(now);
  v.voice.gain.setValueAtTime(Math.max(0.0001, v.voice.gain.value), now);
  v.voice.gain.exponentialRampToValueAtTime(0.0001, now + release);
  for (const o of v.oscs) {
    try { o.stop(now + release + 0.05); } catch (e) { /* deja arrete */ }
  }
}

export function unlockAudio() {
  ensureContext();
}
