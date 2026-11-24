// Enregistrer, reecouter, garder. Ce que tu joues devient une « prise » : la liste de tes notes
// (hauteur, force, debut, duree) et de tes coups de pedale, quelques Ko en tout.
// - Elle se rejoue sur le piano 3D : les touches bougent, le son est celui de ton instrument.
// - Elle s'exporte en fichier MIDI, qui s'ouvre dans n'importe quel logiciel de musique.
// - Elle s'exporte en video : l'image du piano et le son, enregistres pendant qu'il la rejoue.
// Tout reste sur l'appareil (pas de serveur).
import { getContext, fxBus, setSustain } from './audio.js';

const KEY = 'piano-learn-prises-v1';
const MAX_TAKES = 12;
const MAX_MS = 10 * 60 * 1000;

// ---------- Les prises gardees ----------
export function listTakes() {
  try {
    return JSON.parse(localStorage.getItem(KEY) || '[]');
  } catch (e) {
    return [];
  }
}

function writeTakes(list) {
  try {
    localStorage.setItem(KEY, JSON.stringify(list));
    return true;
  } catch (e) {
    return false;   // memoire pleine ou navigation privee
  }
}

export function saveTake(take) {
  const list = [take, ...listTakes()].slice(0, MAX_TAKES);
  return writeTakes(list) ? take : null;
}

export function deleteTake(id) {
  writeTakes(listTakes().filter((t) => t.id !== id));
}

// ---------- Enregistrer ----------
export class Recorder {
  constructor() {
    this.active = false;
  }

  start() {
    this.active = true;
    this.t0 = performance.now();
    this.notes = [];
    this.open = new Map();
    this.pedals = [];
  }

  elapsed() {
    return this.active ? performance.now() - this.t0 : 0;
  }

  on(midi, velocity = 0.8) {
    if (!this.active) return;
    if (this.open.has(midi)) this.off(midi);
    this.open.set(midi, [midi, Math.round(Math.max(1, Math.min(127, velocity * 127))), Math.round(this.elapsed()), 0]);
    if (this.elapsed() > MAX_MS) this.onLimit?.();
  }

  off(midi) {
    const n = this.open.get(midi);
    if (!n) return;
    this.open.delete(midi);
    n[3] = Math.max(30, Math.round(this.elapsed() - n[2]));
    this.notes.push(n);
  }

  pedal(on) {
    if (this.active) this.pedals.push([Math.round(this.elapsed()), on ? 1 : 0]);
  }

  // Termine la prise : les notes encore tenues s'arretent, le silence du debut est retire
  stop(extra = {}) {
    if (!this.active) return null;
    for (const midi of [...this.open.keys()]) this.off(midi);
    this.active = false;
    if (!this.notes.length) return null;
    const first = Math.min(...this.notes.map((n) => n[2]));
    const shift = Math.max(0, first - 150);
    const notes = this.notes.map(([m, v, t, d]) => [m, v, t - shift, d]).sort((a, b) => a[2] - b[2]);
    const pedals = this.pedals.map(([t, on]) => [Math.max(0, t - shift), on]);
    const end = Math.max(...notes.map((n) => n[2] + n[3]));
    return { id: `p${Date.now().toString(36)}`, at: Date.now(), dur: end + 200, notes, pedals, ...extra };
  }
}

// ---------- Reecouter ----------
// Rejoue une prise sur le piano 3D, au temps reel (horloge du navigateur, pas des images).
export function replay(piano, take, { onEnd, onTime, lead = 350 } = {}) {
  const events = [];
  take.notes.forEach(([m, v, t, d]) => {
    events.push([t, 1, m, v]);
    events.push([t + d, 0, m, 0]);
  });
  (take.pedals || []).forEach(([t, on]) => events.push([t, 2, on, 0]));
  events.sort((a, b) => a[0] - b[0] || a[1] - b[1]);
  let start = performance.now() + lead;
  let last = performance.now();
  let i = 0;
  const down = new Set();
  let done = false;
  const finish = (natural) => {
    if (done) return;
    done = true;
    unhook();
    down.forEach((m) => piano.release(m, { source: 'replay' }));
    down.clear();
    setSustain(false);
    piano.grand?.setPedal(false);
    if (natural) onEnd?.();
  };
  const unhook = piano.onFrame(() => {
    const now = performance.now();
    // Onglet cache puis revenu : on reprend la ou on en etait, sans jouer d'un coup les notes en retard
    if (now - last > 400) start += now - last - 16;
    last = now;
    const t = now - start;
    while (i < events.length && events[i][0] <= t) {
      const [, kind, a, b] = events[i++];
      if (kind === 1) { piano.press(a, b / 127, { source: 'replay' }); down.add(a); }
      else if (kind === 0) { piano.release(a, { source: 'replay' }); down.delete(a); }
      else { setSustain(!!a); piano.grand?.setPedal(!!a); }
    }
    onTime?.(Math.max(0, Math.min(1, t / take.dur)));
    if (t > take.dur + 250) finish(true);
  });
  return { stop: () => finish(false) };
}

// ---------- Fichier MIDI (format standard, type 0) ----------
function vlq(n) {
  const bytes = [n & 0x7f];
  while ((n >>= 7)) bytes.unshift((n & 0x7f) | 0x80);
  return bytes;
}

export function midiFile(take, { bpm = 120, name = 'Piano' } = {}) {
  const PPQ = 480;
  const tick = (ms) => Math.round((ms * PPQ * bpm) / 60000);
  const ev = [];
  take.notes.forEach(([m, v, t, d]) => {
    ev.push([tick(t), [0x90, m, v]]);
    ev.push([tick(t + d), [0x80, m, 64]]);
  });
  (take.pedals || []).forEach(([t, on]) => ev.push([tick(t), [0xb0, 64, on ? 127 : 0]]));
  const rank = (e) => (e[1][0] === 0x80 ? 0 : e[1][0] === 0xb0 ? 1 : 2);
  ev.sort((a, b) => a[0] - b[0] || rank(a) - rank(b));
  const us = Math.round(60000000 / bpm);
  const title = [...new TextEncoder().encode(name)].slice(0, 120);
  const track = [
    0x00, 0xff, 0x03, ...vlq(title.length), ...title,
    0x00, 0xff, 0x51, 0x03, (us >> 16) & 0xff, (us >> 8) & 0xff, us & 0xff,
    0x00, 0xff, 0x58, 0x04, 4, 2, 24, 8,
    0x00, 0xc0, 0x00,
  ];
  let prev = 0;
  for (const [t, bytes] of ev) {
    track.push(...vlq(t - prev), ...bytes);
    prev = t;
  }
  track.push(0x00, 0xff, 0x2f, 0x00);
  const len = track.length;
  const out = new Uint8Array(14 + 8 + len);
  out.set([0x4d, 0x54, 0x68, 0x64, 0, 0, 0, 6, 0, 0, 0, 1, (PPQ >> 8) & 0xff, PPQ & 0xff], 0);
  out.set([0x4d, 0x54, 0x72, 0x6b, (len >>> 24) & 0xff, (len >>> 16) & 0xff, (len >>> 8) & 0xff, len & 0xff], 14);
  out.set(track, 22);
  return new Blob([out], { type: 'audio/midi' });
}

// ---------- Video ----------
export function videoSupported() {
  return typeof MediaRecorder !== 'undefined' && !!HTMLCanvasElement.prototype.captureStream;
}

function videoType() {
  const types = ['video/mp4;codecs=avc1.42E01E,mp4a.40.2', 'video/mp4', 'video/webm;codecs=vp9,opus', 'video/webm;codecs=vp8,opus', 'video/webm'];
  return types.find((t) => MediaRecorder.isTypeSupported?.(t)) || '';
}

// Filme le piano pendant qu'il rejoue la prise : l'image du canevas et la sortie du son
export function recordVideo(piano, take, { onTime } = {}) {
  return new Promise((resolve, reject) => {
    try {
      const ac = getContext();
      if (ac.state !== 'running') ac.resume().catch(() => {});
      const vstream = piano.renderer.domElement.captureStream(30);
      const { out } = fxBus();
      const dest = ac.createMediaStreamDestination();
      out.connect(dest);
      const stream = new MediaStream([...vstream.getVideoTracks(), ...dest.stream.getAudioTracks()]);
      const mimeType = videoType();
      const rec = new MediaRecorder(stream, mimeType ? { mimeType, videoBitsPerSecond: 6_000_000 } : undefined);
      const chunks = [];
      rec.ondataavailable = (e) => { if (e.data?.size) chunks.push(e.data); };
      const cleanup = () => {
        try { out.disconnect(dest); } catch (e) { /* deja deconnecte */ }
        vstream.getTracks().forEach((t) => t.stop());
      };
      rec.onstop = () => {
        cleanup();
        const type = (rec.mimeType || mimeType || 'video/webm').split(';')[0];
        resolve({ blob: new Blob(chunks, { type }), ext: type.includes('mp4') ? 'mp4' : 'webm' });
      };
      rec.onerror = (e) => { cleanup(); reject(e.error || e); };
      rec.start(250);
      const player = replay(piano, take, {
        lead: 600,
        onTime,
        onEnd: () => setTimeout(() => { if (rec.state !== 'inactive') rec.stop(); }, 1200),
      });
      // Securite : on n'enregistre jamais plus que la prise et un peu de marge
      setTimeout(() => { if (rec.state !== 'inactive') { player.stop(); rec.stop(); } }, take.dur + 6000);
    } catch (e) {
      reject(e);
    }
  });
}
