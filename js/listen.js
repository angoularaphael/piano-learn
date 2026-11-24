// Ecoute au micro : reconnait la note jouee sur un vrai piano.
// Tout se passe dans le navigateur, rien n'est envoye nulle part.
import { unlockAudio } from './audio.js';

const TUNE_KEY = 'piano-learn-tuning';

// Detection de hauteur YIN sur une fenetre de son
export function yin(buf, sr, minF = 60, maxF = 2200, threshold = 0.15) {
  const tauMin = Math.floor(sr / maxF);
  const tauMax = Math.min(Math.floor(sr / minF), (buf.length >> 1) - 1);
  const W = buf.length - tauMax;
  const d = new Float32Array(tauMax + 1);
  for (let tau = 1; tau <= tauMax; tau++) {
    let s = 0;
    for (let i = 0; i < W; i++) {
      const x = buf[i] - buf[i + tau];
      s += x * x;
    }
    d[tau] = s;
  }
  // Moyenne cumulee normalisee
  let run = 0;
  d[0] = 1;
  for (let tau = 1; tau <= tauMax; tau++) {
    run += d[tau];
    d[tau] = run ? (d[tau] * tau) / run : 1;
  }
  let tau = -1;
  for (let t = tauMin; t <= tauMax; t++) {
    if (d[t] < threshold) {
      while (t + 1 <= tauMax && d[t + 1] < d[t]) t++;
      tau = t;
      break;
    }
  }
  if (tau === -1) return null;
  // Interpolation parabolique pour plus de precision
  const a = d[tau - 1] ?? d[tau], b = d[tau], c = d[tau + 1] ?? d[tau];
  const shift = (a - c) / (2 * (a - 2 * b + c) || 1);
  return { freq: sr / (tau + (Number.isFinite(shift) ? shift : 0)), clarity: 1 - b };
}

export class Listener {
  constructor({ onNote, onLevel, onPitch } = {}) {
    this.onNote = onNote;
    this.onLevel = onLevel;
    this.onPitch = onPitch;
    this.tuning = Number(localStorage.getItem(TUNE_KEY) || 0); // decalage en cents du piano
    this.mutedUntil = 0;
    this.running = false;
  }

  async start() {
    if (!navigator.mediaDevices?.getUserMedia) throw new Error('micro-indisponible');
    this.stream = await navigator.mediaDevices.getUserMedia({
      audio: { echoCancellation: false, noiseSuppression: false, autoGainControl: false },
    });
    unlockAudio();
    this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    if (this.ctx.state === 'suspended') await this.ctx.resume();
    const src = this.ctx.createMediaStreamSource(this.stream);
    // On coupe les tres graves (bruits de pas, souffle)
    const hp = this.ctx.createBiquadFilter();
    hp.type = 'highpass';
    hp.frequency.value = 50;
    this.analyser = this.ctx.createAnalyser();
    this.analyser.fftSize = 4096;
    src.connect(hp).connect(this.analyser);
    this.buf = new Float32Array(this.analyser.fftSize);

    this.floor = 0.004;
    this.floorSamples = [];
    this.prevRms = 0;
    this.lastOnset = 0;
    this.pending = null;     // note en cours de confirmation
    this.current = null;     // derniere note annoncee
    this.stable = { midi: null, count: 0 };
    this.running = true;
    this.timer = setInterval(() => this.#tick(), 25);
  }

  // Ignore le micro un moment (quand le prof ou le piano 3D font du son)
  mute(ms) {
    this.mutedUntil = Math.max(this.mutedUntil, performance.now() + ms);
    this.pending = null;
  }

  #tick() {
    if (!this.running) return;
    this.analyser.getFloatTimeDomainData(this.buf);
    let sum = 0;
    for (let i = 0; i < this.buf.length; i++) sum += this.buf[i] * this.buf[i];
    const rms = Math.sqrt(sum / this.buf.length);
    const now = performance.now();

    // Bruit de fond mesure pendant la premiere demi-seconde
    if (this.floorSamples.length < 20) {
      this.floorSamples.push(rms);
      if (this.floorSamples.length === 20) {
        const avg = this.floorSamples.reduce((a, b) => a + b, 0) / 20;
        this.floor = Math.max(0.004, avg * 2.5);
      }
      this.prevRms = rms;
      return;
    }

    this.onLevel?.(Math.min(1, rms / 0.15));
    const muted = now < this.mutedUntil;
    const loud = rms > this.floor;

    // Attaque : le volume monte d'un coup
    const onset = loud && rms > this.prevRms * 1.45 && rms - this.prevRms > this.floor * 0.5 && now - this.lastOnset > 110;
    this.prevRms = rms * 0.6 + this.prevRms * 0.4;

    if (!loud) {
      this.current = null;
      this.stable = { midi: null, count: 0 };
      this.onPitch?.(null);
      return;
    }

    const p = yin(this.buf, this.ctx.sampleRate);
    let midi = null;
    let cents = 0;
    if (p && p.clarity > 0.8 && p.freq > 55 && p.freq < 2300) {
      const exact = 69 + 12 * Math.log2(p.freq / 440) - this.tuning / 100;
      midi = Math.round(exact);
      cents = (exact - midi) * 100;
    }
    this.onPitch?.(midi, cents);

    if (onset) {
      this.lastOnset = now;
      this.pending = { frames: [], at: now };
    }
    if (midi != null) {
      this.stable = this.stable.midi === midi ? { midi, count: this.stable.count + 1 } : { midi, count: 1 };
    }

    if (muted) return;

    // Apres une attaque, on attend 3 mesures pour confirmer la note
    if (this.pending) {
      if (midi != null) this.pending.frames.push({ midi, cents });
      if (this.pending.frames.length >= 3 || (now - this.pending.at > 220 && this.pending.frames.length)) {
        const best = this.#mode(this.pending.frames.map((f) => f.midi));
        const fr = this.pending.frames.filter((f) => f.midi === best);
        this.pending = null;
        this.#emit(best, fr.reduce((a, f) => a + f.cents, 0) / fr.length);
      } else if (now - this.pending.at > 400) {
        this.pending = null;
      }
      return;
    }

    // Jeu lie : la note change sans attaque nette
    if (this.stable.count >= 4 && this.stable.midi !== this.current) {
      this.#emit(this.stable.midi, cents);
    }
  }

  #mode(list) {
    const c = new Map();
    list.forEach((m) => c.set(m, (c.get(m) || 0) + 1));
    return [...c.entries()].sort((a, b) => b[1] - a[1])[0][0];
  }

  #emit(midi, cents) {
    this.current = midi;
    // Accordage automatique : on suit doucement l'ecart moyen du piano
    if (Math.abs(cents) < 45) {
      this.tuning = Math.max(-80, Math.min(80, this.tuning + cents * 0.08));
      localStorage.setItem(TUNE_KEY, this.tuning.toFixed(1));
    }
    this.onNote?.(midi);
  }

  stop() {
    this.running = false;
    clearInterval(this.timer);
    this.stream?.getTracks().forEach((t) => t.stop());
    this.ctx?.close();
  }
}

// Une note jouee est-elle la bonne ? On accepte la meme note a une octave pres
// (le micro confond parfois les octaves sur un piano acoustique).
export function sameNote(played, expected) {
  if (played === expected) return true;
  return played % 12 === expected % 12 && Math.abs(played - expected) <= 12;
}
