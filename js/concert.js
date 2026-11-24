// La salle de concert : la scene du piano a queue devient une vraie salle.
// - Avant : les lumieres de la salle baissent, un projecteur tombe sur le piano, le public chuchote puis se tait.
// - Pendant : le public ecoute (il oscille a peine), des poussieres flottent dans le faisceau.
// - A la derniere note : la camera recule jusqu'au fond de la salle, le public applaudit,
//   se leve si c'etait tres bien joue, des paillettes tombent dans la lumiere.
// Tout est genere ici (formes, sons) : aucun fichier a telecharger.
import * as THREE from 'three';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { getContext, fxBus } from './audio.js';
import { PAL } from './palette.js';

const ease = (t) => (t <= 0 ? 0 : t >= 1 ? 1 : t * t * (3 - 2 * t));

// ---------- Sons de la salle (synthetises une fois, gardes) ----------
const sounds = {};

function noiseBuffer(ac, seconds, color = 'pink') {
  const n = Math.floor(ac.sampleRate * seconds);
  const buf = ac.createBuffer(2, n, ac.sampleRate);
  for (let c = 0; c < 2; c++) {
    const d = buf.getChannelData(c);
    let b0 = 0, b1 = 0, b2 = 0, last = 0;
    for (let i = 0; i < n; i++) {
      const w = Math.random() * 2 - 1;
      if (color === 'brown') { last = (last + 0.02 * w) / 1.02; d[i] = last * 3.5; continue; }
      b0 = 0.99765 * b0 + w * 0.099046;
      b1 = 0.963 * b1 + w * 0.2965164;
      b2 = 0.57 * b2 + w * 1.0526913;
      d[i] = (b0 + b1 + b2 + w * 0.1848) * 0.11;
    }
  }
  return buf;
}

// Applaudissements : des milliers de claquements, chacun un souffle de bruit filtre,
// donnes par une salle de « clappers » qui ont chacun leur main, leur cadence et leur place.
function applauseBuffer(ac, seconds, people) {
  const sr = ac.sampleRate;
  const n = Math.floor(sr * seconds);
  const buf = ac.createBuffer(2, n, sr);
  const L = buf.getChannelData(0);
  const R = buf.getChannelData(1);
  const clapLen = Math.floor(sr * 0.03);
  const env = (t) => Math.min(1, t / 0.9) * Math.min(1, Math.max(0, (seconds - t) / 2.2));
  for (let p = 0; p < people; p++) {
    const rate = 3.1 + Math.random() * 1.7;
    const f = 700 + Math.random() * 2000;
    const q = 1.2 + Math.random() * 2;
    const loud = 0.35 + Math.random() * 0.65;
    const pan = Math.random() * 2 - 1;
    const gl = Math.sqrt((1 - pan) / 2);
    const gr = Math.sqrt((1 + pan) / 2);
    // Coefficients d'un filtre passe-bande (biquad) propre a cette main
    const w0 = (2 * Math.PI * f) / sr;
    const alpha = Math.sin(w0) / (2 * q);
    const a0 = 1 + alpha;
    const b0 = alpha / a0, b2 = -alpha / a0, a1 = (-2 * Math.cos(w0)) / a0, a2 = (1 - alpha) / a0;
    let t = Math.random() * 0.7;
    while (t < seconds) {
      const amp = loud * env(t) * (0.55 + Math.random() * 0.45);
      const start = Math.floor(t * sr);
      let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
      const decay = 0.005 + Math.random() * 0.004;
      for (let i = 0; i < clapLen && start + i < n; i++) {
        const e = Math.exp(-i / (decay * sr)) * Math.min(1, i / (0.0008 * sr));
        const x = (Math.random() * 2 - 1) * e;
        const y = b0 * x + b2 * x2 - a1 * y1 - a2 * y2;
        x2 = x1; x1 = x; y2 = y1; y1 = y;
        L[start + i] += y * amp * gl;
        R[start + i] += y * amp * gr;
      }
      t += (1 / rate) * (0.85 + Math.random() * 0.3);
    }
  }
  // Le grondement de la salle sous les mains
  let lp = 0;
  for (let i = 0; i < n; i++) {
    lp += ((Math.random() * 2 - 1) - lp) * 0.04;
    const v = lp * 0.5 * env(i / sr);
    L[i] += v;
    R[i] += v;
  }
  let peak = 0;
  for (let i = 0; i < n; i++) peak = Math.max(peak, Math.abs(L[i]), Math.abs(R[i]));
  const k = 0.8 / (peak || 1);
  for (let i = 0; i < n; i++) { L[i] *= k; R[i] *= k; }
  return buf;
}

function play(buffer, { gain = 0.6, fadeIn = 0.4, wet = 0.5, loop = false } = {}) {
  const ac = getContext();
  if (ac.state !== 'running') return null;
  const { out, reverb } = fxBus();
  const src = ac.createBufferSource();
  src.buffer = buffer;
  src.loop = loop;
  const g = ac.createGain();
  g.gain.setValueAtTime(0.0001, ac.currentTime);
  g.gain.exponentialRampToValueAtTime(gain, ac.currentTime + fadeIn);
  src.connect(g);
  g.connect(out);
  const send = ac.createGain();
  send.gain.value = wet;
  g.connect(send).connect(reverb);
  src.start();
  return {
    stop(fade = 0.8) {
      const t = ac.currentTime;
      g.gain.cancelScheduledValues(t);
      g.gain.setValueAtTime(Math.max(0.0001, g.gain.value), t);
      g.gain.exponentialRampToValueAtTime(0.0001, t + fade);
      src.stop(t + fade + 0.05);
    },
  };
}

// Petite tache ronde et douce, pour les poussieres dans la lumiere
let moteTex = null;
function moteTexture() {
  if (moteTex) return moteTex;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  const grd = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  grd.addColorStop(0, 'rgba(255,255,255,1)');
  grd.addColorStop(0.35, 'rgba(255,255,255,.55)');
  grd.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 64, 64);
  moteTex = new THREE.CanvasTexture(c);
  return moteTex;
}

// ---------- Le public ----------
function personGeometry() {
  const torso = new THREE.CapsuleGeometry(8.5, 12, 4, 10).translate(0, 14.5, 0);
  const shoulders = new THREE.SphereGeometry(1, 14, 8).scale(13, 5, 7.5).translate(0, 24, 0);
  const head = new THREE.SphereGeometry(5.8, 14, 10).translate(0, 36, 0.6);
  const g = mergeGeometries([torso, shoulders, head].map((x) => { x.deleteAttribute('uv'); return x; }));
  return g;
}

function seatGeometry() {
  const back = new THREE.BoxGeometry(22, 26, 3).translate(0, 13, -9);
  const seat = new THREE.BoxGeometry(22, 4, 16).translate(0, -1, 0);
  const legs = new THREE.BoxGeometry(20, 20, 2).translate(0, -13, -4);
  return mergeGeometries([back, seat, legs].map((x) => { x.deleteAttribute('uv'); return x; }));
}

// Silhouettes : sombres, avec un liseré de lumiere de scene sur les bords
function silhouetteMaterial(rimColor, rim) {
  const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 0.95, metalness: 0 });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uRim = { value: new THREE.Color(rimColor).multiplyScalar(rim) };
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uRim;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
float rimH = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
totalEmissiveRadiance += uRim * pow(rimH, 2.5);`);
  };
  mat.customProgramCacheKey = () => `salle-${rimColor}-${rim}`;
  return mat;
}

// Faisceau du projecteur : un cone additif, plus dense pres de la source, doux sur les bords
function beamMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color('#ffe9c7') }, uLevel: { value: 0 } },
    vertexShader: `
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uLevel;
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float facing = abs(dot(normalize(vN), normalize(vV)));
        float a = uLevel * (0.25 + 0.75 * vUv.y) * smoothstep(0.0, 0.55, facing);
        gl_FragColor = vec4(uColor * a, a);
      }`,
  });
}

function poolMaterial() {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: { uColor: { value: new THREE.Color('#ffefd6') }, uLevel: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uLevel;
      varying vec2 vUv;
      void main() {
        float d = distance(vUv, vec2(0.5)) * 2.0;
        float a = uLevel * pow(clamp(1.0 - d, 0.0, 1.0), 1.6);
        gl_FragColor = vec4(uColor * a, a);
      }`,
  });
}

// Rideau de fond : velours rouge eclaire par le bas, plis en douceur. Il dessine la silhouette du piano.
function curtainMaterial() {
  return new THREE.ShaderMaterial({
    side: THREE.DoubleSide,
    uniforms: { uLevel: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main() { vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `
      uniform float uLevel;
      varying vec2 vUv;
      void main() {
        float folds = 0.62 + 0.38 * sin(vUv.x * 92.0 + sin(vUv.x * 13.0) * 1.6);
        float glow = pow(1.0 - vUv.y, 1.7) * (1.0 - pow(abs(vUv.x - 0.5) * 2.0, 2.0));
        vec3 velvet = vec3(0.07, 0.008, 0.016);
        vec3 lit = vec3(1.0, 0.42, 0.24);
        vec3 c = velvet + lit * glow * folds * 0.9;
        gl_FragColor = vec4(c * uLevel, 1.0);
      }`,
  });
}

export class ConcertHall {
  constructor(piano) {
    this.piano = piano;
    this.t = 0;
    this.phase = 'idle';        // idle | dim | play | finale
    this.level = 0;             // projecteur 0 -> 1
    this.ovation = 0;
    this.sounds = [];
    const root = piano.root;
    const floor = piano.floorLevel ?? piano.floorY;
    const L = piano.grand?.length ?? 60;
    this.floor = floor;
    this.L = L;
    this.center = new THREE.Vector3(0, floor, -L * 0.42);
    this.group = new THREE.Group();
    root.add(this.group);

    // La scene : une estrade ronde sous le piano ; la salle est plus bas, en gradins
    const STAGE_R = 128;
    const STAGE_H = 46;
    this.hallFloor = floor - STAGE_H;
    const stageMat = new THREE.MeshStandardMaterial({ color: '#120c0a', roughness: 0.55, metalness: 0.1 });
    const stage = new THREE.Mesh(new THREE.CylinderGeometry(STAGE_R, STAGE_R + 2, STAGE_H, 96), stageMat);
    stage.position.set(this.center.x, floor - STAGE_H / 2 - 0.05, this.center.z);
    stage.receiveShadow = piano.shadows;
    this.group.add(stage);
    // Le nez de scene : un filet de lumiere chaude qui dessine l'estrade dans le noir
    const lip = new THREE.Mesh(new THREE.TorusGeometry(STAGE_R + 0.6, 0.35, 6, 160), new THREE.MeshBasicMaterial({ color: new THREE.Color('#ffc98a').multiplyScalar(1.6) }));
    lip.rotation.x = Math.PI / 2;
    lip.position.set(this.center.x, floor - 1.2, this.center.z);
    this.group.add(lip);
    // Le rideau, derriere la scene, a l'oppose du public
    const CURTAIN_H = 300;
    const curtain = new THREE.Mesh(new THREE.CylinderGeometry(215, 215, CURTAIN_H, 96, 1, true, THREE.MathUtils.degToRad(251), THREE.MathUtils.degToRad(110)), curtainMaterial());
    curtain.position.set(this.center.x, this.hallFloor + CURTAIN_H / 2, this.center.z);
    this.group.add(curtain);
    this.curtain = curtain;
    // Le sol de la scene d'origine descend au niveau de la salle, la grille s'efface
    this.floor0 = piano.floor?.position.y;
    if (piano.floor) piano.floor.position.y = this.hallFloor - 0.1;
    if (piano.grid) { this.grid0 = piano.grid.visible; piano.grid.visible = false; }
    // Le studio de papier devient la nuit d'une salle : le fond, la brume, le ciel et le sol
    // s'eteignent le temps du concert, et sont rendus tels quels a la fin
    const sc = piano.scene;
    this.bg0 = sc.background;
    this.fog0 = sc.fog;
    sc.background = new THREE.Color(PAL.night);
    sc.fog = new THREE.FogExp2(PAL.night, 0.011);
    if (piano.sky) {
      this.sky0 = { i: piano.sky.intensity, c: piano.sky.color.clone(), g: piano.sky.groundColor.clone() };
      piano.sky.intensity = 0.4;
      piano.sky.color.set('#b8a58a');
      piano.sky.groundColor.set('#1a130e');
    }
    if (piano.floor?.material?.color) {
      this.floorCol0 = piano.floor.material.color.clone();
      piano.floor.material.color.set('#14100d');
    }

    // Projecteur : la vraie lumiere, le faisceau visible et la flaque au sol
    const top = new THREE.Vector3(-L * 0.06, floor + 200, -L * 0.22);
    const aim = new THREE.Vector3(0, floor, -L * 0.12);
    const spot = new THREE.SpotLight('#ffeacc', 0, 420, 0.3, 0.55, 1.15);
    spot.position.copy(top);
    spot.target.position.copy(aim);
    this.group.add(spot, spot.target);
    this.spot = spot;
    // Lumiere de la salle : eteinte pendant le morceau, elle remonte pour les applaudissements
    this.house = new THREE.HemisphereLight('#ffe2bd', '#1a0f18', 0);
    this.group.add(this.house);
    // Face : la lumiere de la salle vers la scene (elle eclaire le piano du cote du public)
    const fa = THREE.MathUtils.degToRad(36);
    this.front = new THREE.SpotLight('#ffe6c4', 0, 700, 0.32, 0.6, 1);
    this.front.position.set(this.center.x + Math.cos(fa) * 300, floor + 150, this.center.z - Math.sin(fa) * 300);
    this.front.target.position.set(0, floor + 16, -L * 0.3);
    this.group.add(this.front, this.front.target);
    this.sun0 = piano.sun.intensity;
    this.env0 = piano.scene.environmentIntensity;
    const h = top.distanceTo(aim);
    const radius = Math.tan(0.3) * h * 1.05;
    const beam = new THREE.Mesh(new THREE.ConeGeometry(radius, h, 64, 1, true), beamMaterial());
    beam.position.copy(top).lerp(aim, 0.5);
    beam.quaternion.setFromUnitVectors(new THREE.Vector3(0, -1, 0), aim.clone().sub(top).normalize());
    beam.renderOrder = 5;
    this.group.add(beam);
    this.beam = beam;
    const pool = new THREE.Mesh(new THREE.PlaneGeometry(radius * 2.6, radius * 2.6), poolMaterial());
    pool.rotation.x = -Math.PI / 2;
    pool.position.set(aim.x, floor + 0.08, aim.z);
    pool.renderOrder = 2;
    this.group.add(pool);
    this.pool = pool;

    // Poussieres dans le faisceau
    const motes = 220;
    const mp = new Float32Array(motes * 3);
    this.moteSeed = new Float32Array(motes * 3);
    for (let i = 0; i < motes; i++) {
      const s = Math.random();
      const p = top.clone().lerp(aim, 0.15 + s * 0.85);
      const r = Math.sqrt(Math.random()) * radius * (0.15 + s * 0.85) * 0.9;
      const a = Math.random() * Math.PI * 2;
      mp[i * 3] = p.x + Math.cos(a) * r;
      mp[i * 3 + 1] = p.y;
      mp[i * 3 + 2] = p.z + Math.sin(a) * r;
      this.moteSeed[i * 3] = Math.random() * 100;
      this.moteSeed[i * 3 + 1] = 0.5 + Math.random();
      this.moteSeed[i * 3 + 2] = Math.random();
    }
    const mg = new THREE.BufferGeometry();
    mg.setAttribute('position', new THREE.BufferAttribute(mp, 3));
    this.moteBase = mp.slice();
    this.motes = new THREE.Points(mg, new THREE.PointsMaterial({ color: '#ffe8c2', map: moteTexture(), size: 1.6, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending }));
    this.group.add(this.motes);

    // Le public, en arcs autour de la scene, du cote ou le couvercle s'ouvre
    this.people = [];
    const seats = [];
    for (let row = 0; row < 7; row++) {
      const R = STAGE_R + 26 + row * 36;
      const rise = row * 8;
      const a0 = THREE.MathUtils.degToRad(-8);
      const a1 = THREE.MathUtils.degToRad(84);
      const count = Math.floor(((a1 - a0) * R) / 27);
      for (let k = 0; k < count; k++) {
        const a = a0 + ((k + 0.5) / count) * (a1 - a0) + (row % 2 ? 0.5 / count : 0);
        const x = this.center.x + Math.cos(a) * R;
        const z = this.center.z - Math.sin(a) * R;
        const face = Math.atan2(this.center.x - x, this.center.z - z);
        const base = new THREE.Vector3(x, this.hallFloor + 21 + rise, z);
        seats.push({ base, face });
        if (Math.random() < 0.86) {
          this.people.push({
            base, face,
            scale: 0.9 + Math.random() * 0.2,
            phase: Math.random() * Math.PI * 2,
            delay: row * 0.12 + Math.random() * 0.5,
            stand: 0,
            clap: 3.4 + Math.random() * 1.4,
            standsUp: Math.random() < 0.9,
          });
        }
      }
    }
    const personMat = silhouetteMaterial('#ffd9a8', 0.45);
    this.crowd = new THREE.InstancedMesh(personGeometry(), personMat, this.people.length);
    const tints = ['#1c2030', '#2a1620', '#16242e', '#2c241a', '#202026', '#311a1a', '#1a2a24'].map((c) => new THREE.Color(c));
    this.people.forEach((p, i) => this.crowd.setColorAt(i, tints[i % tints.length]));
    this.crowd.frustumCulled = false;
    this.group.add(this.crowd);
    const seatMesh = new THREE.InstancedMesh(seatGeometry(), silhouetteMaterial('#ff9a7a', 0.18), seats.length);
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    seats.forEach((s, i) => {
      q.setFromAxisAngle(new THREE.Vector3(0, 1, 0), s.face);
      m.compose(s.base, q, new THREE.Vector3(1, 1, 1));
      seatMesh.setMatrixAt(i, m);
      seatMesh.setColorAt(i, new THREE.Color('#2a0a12'));
    });
    seatMesh.frustumCulled = false;
    this.group.add(seatMesh);
    this.seats = seatMesh;
    this.#placeCrowd(0);

    // Paillettes de la fin (pretes, invisibles)
    const confN = 260;
    this.conf = new THREE.InstancedMesh(new THREE.PlaneGeometry(1.5, 0.9), new THREE.MeshStandardMaterial({ color: '#ffffff', metalness: 0.7, roughness: 0.3, side: THREE.DoubleSide, emissive: '#3a2a10' }), confN);
    const golds = ['#ffd27a', '#fff1cf', '#ff9db8', '#e8c46a', '#ffffff'].map((c) => new THREE.Color(c));
    this.confState = [];
    for (let i = 0; i < confN; i++) {
      this.conf.setColorAt(i, golds[i % golds.length]);
      this.confState.push({ p: new THREE.Vector3(), v: new THREE.Vector3(), r: new THREE.Euler(), w: new THREE.Vector3(), alive: false });
    }
    this.conf.count = 0;
    this.conf.frustumCulled = false;
    this.group.add(this.conf);
    this.confTop = top.clone().lerp(aim, 0.25);
    this.confRadius = radius * 0.8;

    // La salle a sa lumiere : on garde l'ambiance d'origine pour la rendre a la fin. Le studio de papier
    // est eclaire doucement ; la salle reprend les lumieres de scene et le halo du projecteur
    this.atmo0 = { ...piano.atmo };
    this.stageAtmo = { ...this.atmo0, warm: 520, rim: 1100, fill: 110, bloom: 1.9 };
    this.unhook = piano.onFrame((dt) => this.update(dt));
  }

  // La salle s'eteint, le projecteur s'allume, le public se tait
  dim() {
    this.phase = 'dim';
    const p = this.piano;
    const A = this.stageAtmo;
    p.atmo = { ...A, warm: A.warm * 0.12, rim: A.rim * 0.25, fill: A.fill * 0.15, exposure: 1.05 };
    const ac = getContext();
    if (!sounds.murmur) sounds.murmur = noiseBuffer(ac, 4, 'brown');
    const mur = play(sounds.murmur, { gain: 0.05, fadeIn: 0.6, wet: 0.8, loop: true });
    if (mur) {
      this.sounds.push(mur);
      setTimeout(() => mur.stop(1.8), 1600);
    }
  }

  playing() { if (this.phase !== 'finale') this.phase = 'play'; }

  // Derniere note : la camera recule au fond de la salle, applaudissements a la mesure du jeu
  finale(acc = 100) {
    this.phase = 'finale';
    this.finaleT = 0;
    const p = this.piano;
    const A = this.stageAtmo;
    p.atmo = { ...A, warm: A.warm * 0.55, rim: A.rim * 0.7, fill: A.fill * 0.8 };
    this.standing = acc >= 85;
    const strength = acc >= 95 ? 1 : acc >= 85 ? 0.85 : acc >= 70 ? 0.65 : 0.45;
    const ac = getContext();
    const key = `applause-${this.standing ? 'big' : 'warm'}`;
    if (!sounds[key]) sounds[key] = applauseBuffer(ac, this.standing ? 9 : 6.5, this.standing ? 70 : 42);
    const ap = play(sounds[key], { gain: 0.55 * strength + 0.15, fadeIn: 0.25, wet: 0.6 });
    if (ap) this.sounds.push(ap);
    if (acc >= 70) this.#burst(acc >= 95 ? 260 : 170);
    // Travelling arriere : du clavier jusqu'au fond de la salle
    this.cam0 = { goal: p.camGoal.clone(), target: p.camGoalTarget.clone() };
    const a = THREE.MathUtils.degToRad(36);
    const target = new THREE.Vector3(0, this.floor + 18, -this.L * 0.3);
    const goal = new THREE.Vector3(this.center.x + Math.cos(a) * 330, this.hallFloor + 21 + 4 * 8 + 41 + 38, this.center.z - Math.sin(a) * 330);
    this.cam1 = { goal, target };
  }

  #burst(n) {
    this.conf.count = n;
    for (let i = 0; i < n; i++) {
      const s = this.confState[i];
      const a = Math.random() * Math.PI * 2;
      const r = Math.sqrt(Math.random()) * this.confRadius;
      s.p.set(this.confTop.x + Math.cos(a) * r, this.confTop.y + Math.random() * 40, this.confTop.z + Math.sin(a) * r);
      s.v.set((Math.random() - 0.5) * 6, -4 - Math.random() * 6, (Math.random() - 0.5) * 6);
      s.r.set(Math.random() * 6, Math.random() * 6, Math.random() * 6);
      s.w.set((Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9, (Math.random() - 0.5) * 9);
      s.alive = true;
    }
  }

  #placeCrowd(dt) {
    const m = new THREE.Matrix4();
    const q = new THREE.Quaternion();
    const e = new THREE.Euler();
    const v = new THREE.Vector3();
    const sc = new THREE.Vector3();
    const listening = this.phase === 'play' || this.phase === 'dim';
    this.people.forEach((p, i) => {
      if (this.phase === 'finale' && this.standing && p.standsUp && this.finaleT > p.delay + 0.6) p.stand = Math.min(1, p.stand + dt * 1.6);
      const st = ease(p.stand);
      const clapping = this.phase === 'finale' && this.finaleT > p.delay * 0.4;
      const bob = clapping ? Math.abs(Math.sin(this.t * p.clap * Math.PI)) * 0.9 : 0;
      const sway = listening ? Math.sin(this.t * 0.7 + p.phase) * 0.035 : 0;
      e.set(sway * 0.4, p.face, sway);
      q.setFromEuler(e);
      v.copy(p.base);
      v.y += st * 19 + bob;
      sc.setScalar(p.scale);
      m.compose(v, q, sc);
      this.crowd.setMatrixAt(i, m);
    });
    this.crowd.instanceMatrix.needsUpdate = true;
  }

  update(dt) {
    this.t += dt;
    // Le projecteur monte pendant la mise en lumiere, reste allume ensuite
    const want = this.phase === 'idle' ? 0 : 1;
    this.level += (want - this.level) * (1 - Math.exp(-dt * 1.6));
    this.spot.intensity = this.level * 2600;
    // La salle s'eteint pendant le morceau (le soleil de la scene aussi), puis se rallume
    const dark = this.phase === 'dim' || this.phase === 'play';
    const sunWant = dark ? this.sun0 * 0.28 : this.sun0;
    this.piano.sun.intensity += (sunWant - this.piano.sun.intensity) * (1 - Math.exp(-dt * 1.4));
    const up = this.phase === 'finale' ? Math.min(1, this.finaleT / 2.5) : 0;
    this.house.intensity += (up * 2.2 - this.house.intensity) * (1 - Math.exp(-dt * 2));
    this.front.intensity += ((this.phase === 'play' ? 260 : up * 5200) - this.front.intensity) * (1 - Math.exp(-dt * 1.5));
    this.curtain.material.uniforms.uLevel.value = 0.12 + up * 0.88;
    const envWant = this.env0 + up * (0.85 - this.env0);
    this.piano.scene.environmentIntensity += (envWant - this.piano.scene.environmentIntensity) * (1 - Math.exp(-dt * 1.5));
    this.beam.material.uniforms.uLevel.value = this.level * (this.phase === 'finale' ? 0.13 : 0.1);
    this.pool.material.uniforms.uLevel.value = this.level * 0.32;
    this.motes.material.opacity = this.level * 0.55;
    // Les poussieres derivent lentement
    const pos = this.motes.geometry.attributes.position;
    for (let i = 0; i < pos.count; i++) {
      const s = this.moteSeed[i * 3];
      const sp = this.moteSeed[i * 3 + 1];
      pos.setXYZ(i,
        this.moteBase[i * 3] + Math.sin(this.t * 0.13 * sp + s) * 2.2,
        this.moteBase[i * 3 + 1] + Math.sin(this.t * 0.09 * sp + s * 1.7) * 3,
        this.moteBase[i * 3 + 2] + Math.cos(this.t * 0.11 * sp + s * 0.6) * 2.2);
    }
    pos.needsUpdate = true;

    if (this.phase === 'finale') {
      this.finaleT += dt;
      const k = ease(this.finaleT / 4.2);
      this.piano.camGoal.lerpVectors(this.cam0.goal, this.cam1.goal, k);
      this.piano.camGoalTarget.lerpVectors(this.cam0.target, this.cam1.target, k);
      // Paillettes : chute freinee, elles tournoient
      const m = new THREE.Matrix4();
      const q = new THREE.Quaternion();
      const one = new THREE.Vector3(1, 1, 1);
      for (let i = 0; i < this.conf.count; i++) {
        const s = this.confState[i];
        s.v.y -= 9 * dt;
        s.v.multiplyScalar(1 - Math.min(1, dt * 1.6));
        s.v.x += Math.sin(this.t * 2 + i) * dt * 3;
        s.p.addScaledVector(s.v, dt);
        s.r.x += s.w.x * dt; s.r.y += s.w.y * dt; s.r.z += s.w.z * dt;
        if (s.p.y < this.floor + 0.3) { s.p.y = this.floor + 0.3; s.v.set(0, 0, 0); s.w.set(0, 0, 0); }
        q.setFromEuler(s.r);
        m.compose(s.p, q, one);
        this.conf.setMatrixAt(i, m);
      }
      this.conf.instanceMatrix.needsUpdate = true;
    }
    this.#placeCrowd(dt);
  }

  dispose() {
    this.unhook?.();
    this.sounds.forEach((s) => s.stop(0.6));
    this.piano.atmo = this.atmo0;
    this.piano.sun.intensity = this.sun0;
    this.piano.scene.environmentIntensity = this.env0;
    if (this.piano.floor && this.floor0 != null) this.piano.floor.position.y = this.floor0;
    if (this.piano.grid && this.grid0 != null) this.piano.grid.visible = this.grid0;
    this.piano.scene.background = this.bg0;
    this.piano.scene.fog = this.fog0;
    if (this.sky0) {
      this.piano.sky.intensity = this.sky0.i;
      this.piano.sky.color.copy(this.sky0.c);
      this.piano.sky.groundColor.copy(this.sky0.g);
    }
    if (this.floorCol0) this.piano.floor.material.color.copy(this.floorCol0);
    this.piano.root.remove(this.group);
    this.group.traverse((o) => {
      o.geometry?.dispose();
      if (o.material) [].concat(o.material).forEach((mm) => mm.dispose());
    });
    this.crowd.dispose();
    this.seats.dispose();
    this.conf.dispose();
  }
}
