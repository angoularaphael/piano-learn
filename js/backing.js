// Instru de fond, uniquement en mode « Ecouter ».
// Synthese maison, calée sur les memes temps que la melodie (pas d'extrait commercial).
import { getContext } from './audio.js';
import { frequency } from './notes.js';

const SPECS = {
  // Tempo morceaux = 75 : un temps ici = deux noires a 150. Batterie et basses en D#m / G#m / A#.
  'industry-baby': {
    bar: 2,
    kick: [0, 0.5, 1, 1.5],
    snare: [0.5, 1.5],
    hat: [0, 0.25, 0.5, 0.75, 1, 1.25, 1.5, 1.75],
    bass: [
      { t: 0, midi: 39, d: 1 },
      { t: 1, midi: 44, d: 0.5 },
      { t: 1.5, midi: 46, d: 0.5 },
    ],
    stab: [
      { t: 0, notes: [56, 59, 63], d: 1 },
      { t: 1, notes: [58, 62, 65], d: 0.5 },
      { t: 1.5, notes: [51, 54, 58], d: 0.5 },
    ],
  },
  // La mineur, oom-pah de la version jouable.
  'rush-e': {
    bar: 4,
    kick: [0, 2],
    snare: [1, 3],
    hat: [0.5, 1.5, 2.5, 3.5],
    bass: [
      { t: 0, midi: 45, d: 1 },
      { t: 1, midi: 52, d: 1 },
      { t: 2, midi: 45, d: 1 },
      { t: 3, midi: 40, d: 1 },
    ],
    stab: [
      { t: 0, notes: [57, 60, 64], d: 2 },
      { t: 2, notes: [52, 55, 59], d: 2 },
    ],
  },
  // Re mineur, disco 4/4 comme Crazy Frog.
  'axel-f': {
    bar: 4,
    kick: [0, 1, 2, 3],
    snare: [1, 3],
    hat: [0, 0.5, 1, 1.5, 2, 2.5, 3, 3.5],
    bass: [
      { t: 0, midi: 38, d: 1 },
      { t: 1, midi: 45, d: 1 },
      { t: 2, midi: 38, d: 0.5 },
      { t: 2.5, midi: 41, d: 0.5 },
      { t: 3, midi: 43, d: 1 },
    ],
    stab: [
      { t: 0, notes: [50, 53, 57], d: 2 },
      { t: 2, notes: [48, 53, 57], d: 2 },
    ],
  },
};

function bus() {
  const ctx = getContext();
  const g = ctx.createGain();
  g.gain.value = 0.42;
  g.connect(ctx.destination);
  return { ctx, g };
}

function envGain(ctx, dest, t, peak, attack, hold, release) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + attack);
  g.gain.exponentialRampToValueAtTime(peak * 0.7, t + hold);
  g.gain.exponentialRampToValueAtTime(0.0001, t + hold + release);
  g.connect(dest);
  return g;
}

function kick(ctx, dest, t) {
  const o = ctx.createOscillator();
  o.frequency.setValueAtTime(150, t);
  o.frequency.exponentialRampToValueAtTime(42, t + 0.12);
  const g = envGain(ctx, dest, t, 0.9, 0.004, 0.04, 0.18);
  o.connect(g);
  o.start(t);
  o.stop(t + 0.28);
}

function snare(ctx, dest, t) {
  const n = ctx.createBufferSource();
  const len = Math.floor(ctx.sampleRate * 0.18);
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
  n.buffer = buf;
  const bp = ctx.createBiquadFilter();
  bp.type = 'bandpass';
  bp.frequency.value = 1800;
  bp.Q.value = 0.9;
  const g = envGain(ctx, dest, t, 0.28, 0.002, 0.03, 0.12);
  n.connect(bp).connect(g);
  n.start(t);
  const o = ctx.createOscillator();
  o.frequency.value = 180;
  const og = envGain(ctx, dest, t, 0.12, 0.002, 0.02, 0.08);
  o.connect(og);
  o.start(t);
  o.stop(t + 0.12);
}

function hat(ctx, dest, t, open = false) {
  const n = ctx.createBufferSource();
  const len = Math.floor(ctx.sampleRate * (open ? 0.12 : 0.05));
  const buf = ctx.createBuffer(1, len, ctx.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
  n.buffer = buf;
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = 7000;
  const g = envGain(ctx, dest, t, open ? 0.08 : 0.045, 0.001, 0.01, open ? 0.08 : 0.03);
  n.connect(hp).connect(g);
  n.start(t);
}

function bass(ctx, dest, t, midi, dur, beat) {
  const f0 = frequency(midi);
  const o = ctx.createOscillator();
  o.type = 'triangle';
  o.frequency.setValueAtTime(f0, t);
  const sub = ctx.createOscillator();
  sub.frequency.value = f0 * 0.5;
  const g = envGain(ctx, dest, t, 0.34, 0.01, Math.max(0.05, dur * beat * 0.55), 0.12);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 420;
  o.connect(lp);
  sub.connect(lp);
  lp.connect(g);
  o.start(t);
  sub.start(t);
  const stop = t + dur * beat + 0.05;
  o.stop(stop);
  sub.stop(stop);
}

function stab(ctx, dest, t, notes, dur, beat) {
  const g = envGain(ctx, dest, t, 0.09, 0.02, dur * beat * 0.45, 0.25);
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.value = 1400;
  lp.connect(g);
  notes.forEach((midi) => {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = frequency(midi);
    o.detune.value = (midi % 3) * 3;
    const og = ctx.createGain();
    og.gain.value = 1 / notes.length;
    o.connect(og).connect(lp);
    o.start(t);
    o.stop(t + dur * beat + 0.2);
  });
}

export function createBacking(id, { bpm }) {
  const spec = SPECS[id];
  if (!spec) return null;
  const { ctx, g } = bus();
  let t0 = null;
  let beat0 = 0;
  let armed = -1;
  const bar = spec.bar;

  function audioTime(beat) {
    return t0 + (beat - beat0) * (60 / bpm);
  }

  function fire(beat) {
    const t = audioTime(beat);
    if (t < ctx.currentTime - 0.02) return;
    const pos = ((beat % bar) + bar) % bar;
    const near = (list, x) => list.some((v) => Math.abs(v - x) < 0.001);
    if (near(spec.kick, pos)) kick(ctx, g, t);
    if (near(spec.snare, pos)) snare(ctx, g, t);
    if (near(spec.hat, pos)) hat(ctx, g, t, pos % 1 === 0);
    spec.bass.forEach((b) => { if (Math.abs(b.t - pos) < 0.001) bass(ctx, g, t, b.midi, b.d, 60 / bpm); });
    spec.stab.forEach((s) => { if (Math.abs(s.t - pos) < 0.001) stab(ctx, g, t, s.notes, s.d, 60 / bpm); });
  }

  return {
    update(scoreBeat) {
      if (scoreBeat < 0) return;
      if (t0 == null) {
        t0 = ctx.currentTime + 0.04;
        beat0 = 0;
      }
      const grid = 0.25;
      const from = Math.max(0, Math.floor(scoreBeat / grid) * grid);
      const until = scoreBeat + (bpm / 60) * 0.18;
      for (let b = from; b <= until + 1e-6; b = Math.round((b + grid) * 1000) / 1000) {
        const key = Math.round(b * 1000);
        if (key <= armed) continue;
        armed = key;
        fire(b);
      }
    },
    stop() {
      const now = ctx.currentTime;
      g.gain.cancelScheduledValues(now);
      g.gain.setValueAtTime(g.gain.value, now);
      g.gain.linearRampToValueAtTime(0.0001, now + 0.08);
    },
  };
}
