// Moteur audio.
// - Vrai piano a queue echantillonne (Salamander Grand Piano, Alexander Holm, licence CC-BY 3.0),
//   charge par ordre de priorite autour des touches utilisees, garde en cache pour les visites suivantes.
// - Tant qu'un son n'est pas arrive, une synthese prend le relais : une touche sonne toujours.
// - Le son est deverrouille des le premier geste (y compris sur iPhone, mode silencieux compris).
// - Plusieurs instruments, debloques au fil du parcours : feutre, droit, concert, electrique, orgue, clavecin.
import { lang } from './i18n.js';
import { frequency } from './notes.js';

const SAMPLE_URL = new URL('../sounds/piano/', import.meta.url).href;
const CACHE_NAME = 'pl-piano-v2';
const NAMES = ['C', 'Cs', 'D', 'Ds', 'E', 'F', 'Fs', 'G', 'Gs', 'A', 'As', 'B'];
// Un echantillon toutes les trois notes, du la grave (21) au do aigu (108)
const SAMPLE_MIDIS = [];
for (let m = 21; m <= 108; m += 3) SAMPLE_MIDIS.push(m);
const sampleFile = (m) => `${NAMES[m % 12]}${Math.floor(m / 12) - 1}.mp3`;

const INSTRUMENTS_EN = {
  feutre: ['Felt piano', 'Soft and intimate, like a piano whose hammers are covered in felt.'],
  droit: ['Upright piano', 'The living-room piano: warm, a little woody.'],
  concert: ['Grand piano', 'The concert grand, in a hall that rings.'],
  electrique: ['Electric piano', 'The round, bright sound of the seventies.'],
  orgue: ['Organ', 'Notes hold for as long as you keep the key down.'],
  clavecin: ['Harpsichord', 'The strings are plucked, as in Bach’s day.'],
};

export const INSTRUMENTS = {
  feutre: { nom: 'Piano feutre', desc: 'Doux et intime, comme un piano dont les marteaux sont garnis de feutre.', kind: 'sample', cutoff: [900, 3200], attack: 0.006, release: 0.16, room: 'room', wet: 0.16, gain: 1.15 },
  droit: { nom: 'Piano droit', desc: 'Le piano du salon : chaleureux, un peu boisé.', kind: 'sample', cutoff: [2200, 9000], attack: 0.003, release: 0.12, room: 'room', wet: 0.2, gain: 1, body: true },
  concert: { nom: 'Piano à queue', desc: 'Le grand piano de concert, dans une salle qui résonne.', kind: 'sample', cutoff: [3000, 18000], attack: 0.002, release: 0.1, room: 'hall', wet: 0.26, gain: 1 },
  electrique: { nom: 'Piano électrique', desc: 'Le son rond et brillant des années 70.', kind: 'fm', room: 'room', wet: 0.2, gain: 0.9 },
  orgue: { nom: 'Orgue', desc: 'Les notes tiennent tant que tu gardes la touche.', kind: 'organ', room: 'hall', wet: 0.3, gain: 0.55 },
  clavecin: { nom: 'Clavecin', desc: 'Les cordes sont pincées, comme au temps de Bach.', kind: 'harpsi', room: 'room', wet: 0.2, gain: 0.6 },
};

if (lang() === 'en') for (const [id, [nom, desc]] of Object.entries(INSTRUMENTS_EN)) Object.assign(INSTRUMENTS[id], { nom, desc });

let ctx = null;
let out = null;        // sortie generale
let dryBus = null;
let wetSend = null;
let convolver = null;
let bodyEq = null;
let current = 'feutre';
const irs = {};
const voices = new Map();
let sustain = false;
const sustained = new Set();
const listeners = new Set();

// ---------- Contexte et deverrouillage ----------
function buildGraph() {
  ctx = new (window.AudioContext || window.webkitAudioContext)({ latencyHint: 'interactive' });
  // iPhone : jouer meme quand l'interrupteur silencieux est active
  try { if (navigator.audioSession) navigator.audioSession.type = 'playback'; } catch (e) { /* pas supporte */ }

  const comp = ctx.createDynamicsCompressor();
  comp.threshold.value = -10;
  comp.knee.value = 12;
  comp.ratio.value = 3;
  comp.attack.value = 0.001;
  comp.release.value = 0.2;
  out = ctx.createGain();
  out.gain.value = volume;
  out.connect(comp).connect(ctx.destination);

  bodyEq = ctx.createBiquadFilter();
  bodyEq.type = 'peaking';
  bodyEq.frequency.value = 900;
  bodyEq.Q.value = 0.9;
  bodyEq.gain.value = 0;

  dryBus = ctx.createGain();
  dryBus.connect(bodyEq).connect(out);
  convolver = ctx.createConvolver();
  wetSend = ctx.createGain();
  dryBus.connect(wetSend).connect(convolver).connect(out);
  applyInstrument();

  ctx.addEventListener?.('statechange', () => {
    if (ctx.state !== 'running') armUnlock();
    emit();
  });
}

export function getContext() {
  if (!ctx) buildGraph();
  return ctx;
}

// Sortie pour les sons d'ambiance (salle de concert) : meme volume general, meme reverberation
export function fxBus() {
  getContext();
  return { out, reverb: convolver };
}

function ensureRunning() {
  const ac = getContext();
  if (ac.state !== 'running') ac.resume().catch(() => {});
  return ac;
}

let armed = false;
let silentDone = false;
const GESTURES = ['pointerdown', 'pointerup', 'touchend', 'mousedown', 'click', 'keydown'];
function onGesture() {
  const ac = ensureRunning();
  if (!silentDone) {
    // Ancien iOS : un son vide joue pendant le geste ouvre la sortie audio
    const b = ac.createBuffer(1, 1, ac.sampleRate);
    const s = ac.createBufferSource();
    s.buffer = b;
    s.connect(ac.destination);
    s.start(0);
    silentDone = true;
  }
  if (ac.state === 'running') disarmUnlock();
}
function armUnlock() {
  if (armed) return;
  armed = true;
  GESTURES.forEach((ev) => window.addEventListener(ev, onGesture, { capture: true, passive: true }));
}
function disarmUnlock() {
  if (!armed) return;
  armed = false;
  GESTURES.forEach((ev) => window.removeEventListener(ev, onGesture, { capture: true }));
}
armUnlock();

export function unlockAudio() {
  onGesture();
}

// ---------- Reverberation de synthese (aucun fichier) ----------
function impulse(kind) {
  if (irs[kind]) return irs[kind];
  const seconds = kind === 'hall' ? 2.8 : 1.3;
  const rate = ctx.sampleRate;
  const len = Math.floor(rate * seconds);
  const buf = ctx.createBuffer(2, len, rate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let lp = 0;
    for (let i = 0; i < len; i++) {
      const t = i / len;
      const n = Math.random() * 2 - 1;
      lp += (n - lp) * (0.92 - 0.8 * t); // les aigus s'eteignent plus vite que les graves
      const env = Math.pow(1 - t, kind === 'hall' ? 3.2 : 4.5);
      const fadeIn = i < rate * 0.006 ? i / (rate * 0.006) : 1;
      d[i] = lp * env * fadeIn;
    }
  }
  irs[kind] = buf;
  return buf;
}

function applyInstrument() {
  if (!ctx) return;
  const inst = INSTRUMENTS[current];
  const now = ctx.currentTime;
  const ir = impulse(inst.room);
  if (convolver.buffer !== ir) convolver.buffer = ir;
  wetSend.gain.setTargetAtTime(inst.wet * reverbAmount, now, 0.05);
  dryBus.gain.setTargetAtTime(inst.gain, now, 0.05);
  bodyEq.gain.setTargetAtTime(inst.body ? 4 : 0, now, 0.05);
}

export function setInstrument(id) {
  if (!INSTRUMENTS[id] || id === current) return;
  current = id;
  applyInstrument();
  emit();
}

let volume = 0.9;
let reverbAmount = 1;
export function setVolume(v) {
  volume = Math.max(0, Math.min(1.2, v));
  if (out) out.gain.setTargetAtTime(volume, ctx.currentTime, 0.03);
}
export function setReverb(v) {
  reverbAmount = Math.max(0, Math.min(2, v));
  applyInstrument();
}

// ---------- Chargement des echantillons ----------
const buffers = new Map();   // midi de l'echantillon -> { buffer, offset }
const loading = new Set();
const failed = new Set();
let queue = [];
let active = 0;
let decoder = null;

function getDecoder() {
  if (ctx) return ctx;
  if (!decoder) {
    const Offline = window.OfflineAudioContext || window.webkitOfflineAudioContext;
    decoder = Offline ? new Offline(1, 1, 48000) : null;
  }
  return decoder;
}

// Ignore le silence en tete du fichier (decalage d'encodeur mp3) : l'attaque part tout de suite
function attackOffset(buffer) {
  const d = buffer.getChannelData(0);
  const max = Math.min(d.length, Math.floor(buffer.sampleRate * 0.12));
  for (let i = 0; i < max; i++) {
    if (Math.abs(d[i]) > 0.003) return Math.max(0, (i - 24) / buffer.sampleRate);
  }
  return 0;
}

async function decode(m, ab) {
  const dec = getDecoder();
  if (!dec) return;
  try {
    const buffer = await new Promise((res, rej) => {
      const p = dec.decodeAudioData(ab, res, rej);
      if (p && p.catch) p.catch(rej);
    });
    buffers.set(m, { buffer, offset: attackOffset(buffer) });
  } catch (e) {
    failed.add(m);
  }
  emit();
}

async function fetchSample(m) {
  const url = SAMPLE_URL + sampleFile(m);
  let res = null;
  let cache = null;
  try {
    cache = await caches.open(CACHE_NAME);
    res = await cache.match(url);
  } catch (e) { cache = null; }
  if (!res) {
    res = await fetch(url, { mode: 'cors' });
    if (!res.ok) throw new Error(`son ${url} : ${res.status}`);
    if (cache) cache.put(url, res.clone()).catch(() => {});
  }
  return res.arrayBuffer();
}

function pump() {
  while (active < 4 && queue.length) {
    const m = queue.shift();
    if (buffers.has(m) || loading.has(m) || failed.has(m)) continue;
    loading.add(m);
    active++;
    fetchSample(m)
      .then((ab) => decode(m, ab))
      .catch(() => { failed.add(m); emit(); })
      .finally(() => { loading.delete(m); active--; pump(); });
  }
}

// Charge les sons utiles pour une plage de touches, les plus proches du centre d'abord
export function preload(low = 57, high = 72, center = 60) {
  const wanted = SAMPLE_MIDIS.filter((m) => m >= low - 3 && m <= high + 3 && !buffers.has(m) && !failed.has(m));
  wanted.sort((a, b) => Math.abs(a - center) - Math.abs(b - center));
  queue = [...wanted, ...queue.filter((m) => !wanted.includes(m))];
  pump();
}

export function loadStatus(low = 21, high = 108) {
  const need = SAMPLE_MIDIS.filter((m) => m >= low - 3 && m <= high + 3);
  return { ready: need.filter((m) => buffers.has(m)).length, total: need.length };
}

function nearestSample(midi) {
  let best = null;
  let dist = Infinity;
  for (const [m] of buffers) {
    const d = Math.abs(m - midi);
    if (d < dist) { dist = d; best = m; }
  }
  return dist <= 4 ? best : null;
}

// ---------- Voix ----------
function stopVoice(v, when, tau = 0.012) {
  const g = v.gain.gain;
  try {
    if (g.cancelAndHoldAtTime) g.cancelAndHoldAtTime(when);
    else { g.cancelScheduledValues(when); g.setValueAtTime(g.value, when); }
  } catch (e) { /* deja arrete */ }
  g.setTargetAtTime(0, when, tau);
  v.nodes.forEach((n) => { try { n.stop(when + tau * 8); } catch (e) { /* deja arrete */ } });
}

function samplerVoice(midi, vel, now, inst) {
  const sm = nearestSample(midi);
  if (sm == null) return null;
  const { buffer, offset } = buffers.get(sm);
  const src = ctx.createBufferSource();
  src.buffer = buffer;
  src.playbackRate.value = Math.pow(2, (midi - sm) / 12);
  const f = ctx.createBiquadFilter();
  f.type = 'lowpass';
  const [lo, hi] = inst.cutoff;
  f.frequency.value = lo + (hi - lo) * vel * vel;
  f.Q.value = 0.4;
  const g = ctx.createGain();
  const peak = (0.18 + 0.82 * Math.pow(vel, 1.6)) * 0.9;
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(peak, now + inst.attack);
  src.connect(f).connect(g).connect(dryBus);
  src.start(now, offset);
  // Sans les etouffoirs (pedale) un son finit quand meme par s'eteindre
  return { gain: g, nodes: [src], release: midi >= 89 ? 0.9 : inst.release };
}

// Piano de synthese (le temps que les vrais sons arrivent) : une onde riche par note, preparee une fois,
// une deuxieme corde a peine desaccordee pour que le son chante, et un petit bruit de marteau.
let waves = null;
let hammer = null;
function synthAssets() {
  if (waves) return;
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
  const d = hammer.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * (1 - i / len);
}

function synthPiano(midi, vel, now) {
  synthAssets();
  const f0 = frequency(midi);
  const sustainT = Math.max(1.2, 6 - (midi - 36) * 0.07);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, now);
  g.gain.linearRampToValueAtTime(0.32 * vel, now + 0.004);
  g.gain.exponentialRampToValueAtTime(0.12 * vel, now + 0.25);
  g.gain.exponentialRampToValueAtTime(0.0008, now + sustainT);
  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.Q.value = 0.6;
  filter.frequency.setValueAtTime(Math.min(16000, f0 * 12), now);
  filter.frequency.exponentialRampToValueAtTime(Math.max(400, f0 * 3), now + 1.2);
  filter.connect(g).connect(dryBus);
  const o1 = ctx.createOscillator();
  o1.setPeriodicWave(midi < 52 ? waves.low : midi > 76 ? waves.high : waves.mid);
  o1.frequency.value = f0;
  const o2 = ctx.createOscillator();
  o2.setPeriodicWave(waves.high);
  o2.frequency.value = f0 * 1.0016;
  const g2 = ctx.createGain();
  g2.gain.value = 0.35;
  o1.connect(filter);
  o2.connect(g2).connect(filter);
  [o1, o2].forEach((o) => { o.start(now); o.stop(now + sustainT + 0.1); });
  const noise = ctx.createBufferSource();
  noise.buffer = hammer;
  const nf = ctx.createBiquadFilter();
  nf.type = 'bandpass';
  nf.frequency.value = Math.min(5000, f0 * 4);
  const ng = ctx.createGain();
  ng.gain.value = 0.05 * vel;
  noise.connect(nf).connect(ng).connect(dryBus);
  noise.start(now);
  return { gain: g, nodes: [o1, o2], release: 0.18 };
}

function fmVoice(midi, vel, now) {
  const f0 = frequency(midi);
  const car = ctx.createOscillator();
  car.frequency.value = f0;
  const mod = ctx.createOscillator();
  mod.frequency.value = f0;
  const depth = ctx.createGain();
  depth.gain.setValueAtTime(f0 * (1.2 + 2.6 * vel), now);
  depth.gain.exponentialRampToValueAtTime(f0 * 0.18, now + 1.1);
  mod.connect(depth).connect(car.frequency);
  const bark = ctx.createOscillator();
  bark.frequency.value = f0 * 14;
  const barkG = ctx.createGain();
  barkG.gain.setValueAtTime(f0 * 0.9 * vel, now);
  barkG.gain.exponentialRampToValueAtTime(1, now + 0.05);
  bark.connect(barkG).connect(car.frequency);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.34 * vel, now + 0.003);
  g.gain.exponentialRampToValueAtTime(0.0008, now + 3.6);
  car.connect(g).connect(dryBus);
  const nodes = [car, mod, bark];
  nodes.forEach((n) => { n.start(now); n.stop(now + 3.8); });
  return { gain: g, nodes, release: 0.2 };
}

function organVoice(midi, vel, now) {
  const f0 = frequency(midi);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.16, now + 0.012);
  g.connect(dryBus);
  const nodes = [];
  [[0.5, 0.55], [1, 1], [2, 0.6], [3, 0.28], [4, 0.22], [8, 0.08]].forEach(([n, amp]) => {
    const fr = f0 * n;
    if (fr > 12000) return;
    const o = ctx.createOscillator();
    o.frequency.value = fr;
    const pg = ctx.createGain();
    pg.gain.value = amp;
    o.connect(pg).connect(g);
    o.start(now);
    nodes.push(o);
  });
  // Petit clic de contact, comme sur un orgue electrique
  const click = ctx.createOscillator();
  click.type = 'square';
  click.frequency.value = f0 * 6;
  const cg = ctx.createGain();
  cg.gain.setValueAtTime(0.03 * vel, now);
  cg.gain.exponentialRampToValueAtTime(0.0001, now + 0.012);
  click.connect(cg).connect(dryBus);
  click.start(now);
  click.stop(now + 0.02);
  return { gain: g, nodes, release: 0.03, hold: true };
}

function harpsiVoice(midi, vel, now) {
  const f0 = frequency(midi);
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, now);
  g.gain.linearRampToValueAtTime(0.22, now + 0.0015);
  g.gain.exponentialRampToValueAtTime(0.06, now + 0.12);
  g.gain.exponentialRampToValueAtTime(0.0006, now + Math.max(1.4, 4.5 - (midi - 40) * 0.05));
  const hp = ctx.createBiquadFilter();
  hp.type = 'highpass';
  hp.frequency.value = f0 * 0.9;
  const lp = ctx.createBiquadFilter();
  lp.type = 'lowpass';
  lp.frequency.setValueAtTime(Math.min(14000, f0 * 16), now);
  lp.frequency.exponentialRampToValueAtTime(Math.max(900, f0 * 4), now + 0.6);
  hp.connect(lp).connect(g).connect(dryBus);
  const nodes = [];
  [-4, 4].forEach((cents) => {
    const o = ctx.createOscillator();
    o.type = 'sawtooth';
    o.frequency.value = f0;
    o.detune.value = cents;
    o.connect(hp);
    o.start(now);
    o.stop(now + 5);
    nodes.push(o);
  });
  return { gain: g, nodes, release: 0.03 };
}

// ---------- Jouer ----------
export function noteOn(midi, velocity = 0.8) {
  const ac = ensureRunning();
  const now = ac.currentTime;
  const old = voices.get(midi);
  if (old) { stopVoice(old, now, 0.015); voices.delete(midi); }
  sustained.delete(midi);
  const inst = INSTRUMENTS[current];
  const vel = Math.max(0.05, Math.min(1, velocity));
  let v = null;
  if (inst.kind === 'sample') v = samplerVoice(midi, vel, now, inst);
  else if (inst.kind === 'fm') v = fmVoice(midi, vel, now);
  else if (inst.kind === 'organ') v = organVoice(midi, vel, now);
  else if (inst.kind === 'harpsi') v = harpsiVoice(midi, vel, now);
  if (!v) {
    v = synthPiano(midi, vel, now);
    preload(midi, midi, midi);
  }
  v.start = now;
  voices.set(midi, v);
  // Polyphonie maximale : on libere les plus anciennes
  if (voices.size > 40) {
    const oldest = [...voices.entries()].sort((a, b) => a[1].start - b[1].start)[0];
    stopVoice(oldest[1], now, 0.03);
    voices.delete(oldest[0]);
  }
  window.dispatchEvent(new CustomEvent('pl:note', { detail: { midi } }));
}

export function noteOff(midi, immediate = false) {
  const v = voices.get(midi);
  if (!v || !ctx) return;
  if (sustain && !immediate) { sustained.add(midi); return; }
  voices.delete(midi);
  stopVoice(v, ctx.currentTime, immediate ? 0.01 : v.release);
}

export function setSustain(on) {
  sustain = !!on;
  if (!sustain) {
    sustained.forEach((m) => {
      const v = voices.get(m);
      if (v) { voices.delete(m); stopVoice(v, ctx.currentTime, v.release); }
    });
    sustained.clear();
  }
}

export function allNotesOff() {
  if (!ctx) return;
  voices.forEach((v) => stopVoice(v, ctx.currentTime, 0.02));
  voices.clear();
  sustained.clear();
}

// Petit "tic" de metronome
export function tick(accent = false, when = 0) {
  if (!ctx || ctx.state !== 'running') return;
  const t = Math.max(ctx.currentTime, when);
  const o = ctx.createOscillator();
  o.frequency.value = accent ? 1760 : 1320;
  const g = ctx.createGain();
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(accent ? 0.22 : 0.14, t + 0.002);
  g.gain.exponentialRampToValueAtTime(0.0001, t + 0.05);
  o.connect(g).connect(out);
  o.start(t);
  o.stop(t + 0.06);
}

// ---------- Etat pour l'interface ----------
function emit() {
  listeners.forEach((fn) => fn());
}
export function onAudioChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

// Les sons du milieu du clavier partent tout de suite, avant meme le premier geste
preload(57, 72, 60);
