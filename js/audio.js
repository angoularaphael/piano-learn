// Son de piano synthetise (pas de fichiers a telecharger).
// Optimise pour la reactivite : une seule onde par note (harmoniques precalculees),
// bruit de marteau prepare une fois pour toutes.
import { frequency } from './notes.js';

let ctx = null;
let master = null;
let waves = null;
let hammer = null;
const voices = new Map();

function ensureContext() {
  if (!ctx) {
    ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
    master = ctx.createDynamicsCompressor();
    master.threshold.value = -14;
    master.ratio.value = 4;
    master.attack.value = 0.001;
    const out = ctx.createGain();
    out.gain.value = 0.8;
    master.connect(out).connect(ctx.destination);

    // Harmoniques du piano : riches dans le grave, plus douces dans l'aigu
    const make = (amps) => {
      const real = new Float32Array(amps.length + 1);
      const imag = new Float32Array(amps.length + 1);
      amps.forEach((a, i) => { imag[i + 1] = a; });
      return ctx.createPeriodicWave(real, imag);
    };
    waves = {
      low: make([1, 0.55, 0.35, 0.2, 0.12, 0.08, 0.05, 0.03]),
      mid: make([1, 0.45, 0.22, 0.12, 0.07, 0.04]),
      high: make([1, 0.25, 0.08, 0.03]),
    };

    const len = Math.floor(ctx.sampleRate * 0.03);
    hammer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = hammer.getChannelData(0);
    for (let i = 0; i < len; i++) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
  }
  if (ctx.state === 'suspended') ctx.resume();
  return ctx;
}

export function noteOn(midi, velocity = 0.8) {
  const ac = ensureContext();
  noteOff(midi, true);

  const now = ac.currentTime;
  const f0 = frequency(midi);
  // Les notes graves tiennent plus longtemps
  const sustain = Math.max(1.2, 6 - (midi - 36) * 0.07);

  const voice = ac.createGain();
  voice.gain.setValueAtTime(0.0001, now);
  voice.gain.linearRampToValueAtTime(0.32 * velocity, now + 0.004);
  voice.gain.exponentialRampToValueAtTime(0.12 * velocity, now + 0.25);
  voice.gain.exponentialRampToValueAtTime(0.0008, now + sustain);

  // Le son s'assombrit en s'eteignant, comme une vraie corde
  const filter = ac.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.6;
  filter.frequency.setValueAtTime(Math.min(16000, f0 * 12), now);
  filter.frequency.exponentialRampToValueAtTime(Math.max(400, f0 * 3), now + 1.2);
  filter.connect(voice).connect(master);

  const osc = ac.createOscillator();
  osc.setPeriodicWave(midi < 52 ? waves.low : midi > 76 ? waves.high : waves.mid);
  osc.frequency.value = f0;
  // Deuxieme corde tres legerement desaccordee : le son "chante"
  const osc2 = ac.createOscillator();
  osc2.setPeriodicWave(waves.high);
  osc2.frequency.value = f0 * 1.0016;
  const g2 = ac.createGain();
  g2.gain.value = 0.35;
  osc.connect(filter);
  osc2.connect(g2).connect(filter);
  osc.start(now);
  osc2.start(now);
  osc.stop(now + sustain + 0.1);
  osc2.stop(now + sustain + 0.1);

  const noise = ac.createBufferSource();
  noise.buffer = hammer;
  const nf = ac.createBiquadFilter();
  nf.type = 'bandpass';
  nf.frequency.value = Math.min(5000, f0 * 4);
  const ng = ac.createGain();
  ng.gain.value = 0.05 * velocity;
  noise.connect(nf).connect(ng).connect(master);
  noise.start(now);

  voices.set(midi, { voice, oscs: [osc, osc2] });
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
