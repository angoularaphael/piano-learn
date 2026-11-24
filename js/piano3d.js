// Le piano 3D qui grandit avec l'eleve, pose dans un studio clair.
// - Trois corps : le clavier esquisse au crayon, le vrai clavier, le piano a queue (voir grand.js).
// - Sa plage de touches change en direct : les nouvelles touches se dessinent.
// - Au debut, les touches pas encore apprises ne sont qu'un trait de crayon sur le papier ;
//   une touche apprise s'encre (ivoire, ebene) et le reste.
// - Ce qu'il faut jouer prend la couleur du crayon du prof : vermillon a droite, bleu a gauche.
// - Une touche descend des que le doigt la touche, le son part dans le meme instant.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { isBlack, noteName } from './notes.js';
import { noteOn, noteOff, preload } from './audio.js';
import { createBloom } from './bloom.js';
import { attach, detach, measureFrame, onQualityChange, lowPower, bloomAllowed } from './stage.js';
import { buildGrand } from './grand.js';
import { PAL } from './palette.js';

export const WHITE = { w: 0.92, h: 0.6, l: 6 };
export const BLACK = { w: 0.56, h: 0.5, l: 3.8 };
export const STRIKE_Z = -WHITE.l / 2;
const PRESS = { white: 0.075, black: 0.085 };
// L'encre posee sur les touches est une vraie encre (sombre) dans toutes les palettes ; le rouge du do
// suit la couleur d'action de la palette (PAL est relu a chaque construction)
const INK = new THREE.Color('#1c1814');
const accent = () => new THREE.Color(PAL.right);
const IVORY = new THREE.Color('#f7f2e7');
const EBONY = new THREE.Color('#15110e');
const SKETCH_WHITE = new THREE.Color('#efe8dc');   // touche pas encore apprise : du papier, un trait de crayon
const SKETCH_BLACK = new THREE.Color('#d8cfbf');   // noire pas encore apprise : une ombre hachuree
const GRAPHITE = new THREE.Color('#5f584f');

const ease = (t) => 1 - Math.pow(1 - Math.min(1, Math.max(0, t)), 3);

// ---------- Ressources partagees (gardees d'une page a l'autre) ----------
let GEO = null;
function geometries() {
  if (GEO) return GEO;
  GEO = {
    white: new RoundedBoxGeometry(WHITE.w, WHITE.h, WHITE.l, 3, 0.06),
    black: new RoundedBoxGeometry(BLACK.w, BLACK.h, BLACK.l, 3, 0.07),
    whiteEdges: new THREE.EdgesGeometry(new THREE.BoxGeometry(WHITE.w - 0.02, WHITE.h, WHITE.l)),
    blackEdges: new THREE.EdgesGeometry(new THREE.BoxGeometry(BLACK.w, BLACK.h, BLACK.l)),
    label: new THREE.PlaneGeometry(0.78, 0.78),
    memory: new THREE.BoxGeometry(WHITE.w * 0.62, 0.035, 0.05),
    finger: new THREE.PlaneGeometry(1, 1),
  };
  planarUV(GEO.black, 1.1);
  return GEO;
}

// Coordonnees de texture a l'echelle du monde, face par face : les hachures gardent le meme pas et
// le meme angle sur le dessus, l'avant et les flancs d'une touche noire
function planarUV(geo, scale) {
  const pos = geo.attributes.position;
  const nor = geo.attributes.normal;
  const uv = geo.attributes.uv;
  for (let i = 0; i < pos.count; i++) {
    const nx = Math.abs(nor.getX(i));
    const ny = Math.abs(nor.getY(i));
    const nz = Math.abs(nor.getZ(i));
    let u;
    let v;
    if (ny >= nx && ny >= nz) { u = pos.getX(i); v = pos.getZ(i); }
    else if (nz >= nx) { u = pos.getX(i); v = pos.getY(i); }
    else { u = pos.getZ(i); v = pos.getY(i); }
    uv.setXY(i, u * scale, v * scale);
  }
  uv.needsUpdate = true;
}

// Les hachures au crayon d'une noire pas encore apprise : des traits de mine a 45 degres sur le papier
let HATCH = null;
function hatchTexture() {
  if (HATCH) return HATCH;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#ffffff';
  g.fillRect(0, 0, 128, 128);
  g.lineCap = 'round';
  for (let i = -8; i < 24; i++) {
    g.strokeStyle = `rgba(40, 36, 32, ${0.78 + ((i * 37) % 10) / 45})`;
    g.lineWidth = 3.4 + ((i * 13) % 5) / 5;
    g.beginPath();
    g.moveTo(i * 16 - 128, 128);
    g.lineTo(i * 16, 0);
    g.stroke();
  }
  HATCH = new THREE.CanvasTexture(c);
  HATCH.wrapS = HATCH.wrapT = THREE.RepeatWrapping;
  HATCH.colorSpace = THREE.SRGBColorSpace;
  HATCH.anisotropy = 4;
  return HATCH;
}

const labelCache = new Map();
function labelTexture(text, mode, mark) {
  const key = `${text}|${mode}|${mark ? PAL.right : 0}`;
  if (labelCache.has(key)) return labelCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.font = '700 40px "Atkinson Hyperlegible Next", system-ui, sans-serif';
  g.fillStyle = mode === 'light' ? '#3b342d' : '#4a433c';
  g.fillText(text, 64, 56);
  if (mark) {
    // Le do du milieu : un point de crayon rouge
    g.fillStyle = PAL.right;
    g.beginPath();
    g.arc(64, 102, 8, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  labelCache.set(key, tex);
  return tex;
}

const handCache = new Map();
function handTexture(n, hand) {
  const key = `${n}${hand}${PAL.left}${PAL.right}`;
  if (handCache.has(key)) return handCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = 96;
  const g = c.getContext('2d');
  const col = hand === 'L' ? PAL.left : PAL.right;
  g.fillStyle = 'rgba(248,244,236,.94)';
  g.beginPath();
  g.arc(48, 48, 40, 0, Math.PI * 2);
  g.fill();
  g.strokeStyle = col;
  g.lineWidth = 6;
  g.lineCap = 'round';
  g.beginPath();
  g.arc(48, 49, 37, -2.2, 3.9);
  g.stroke();
  g.fillStyle = col;
  g.font = 'italic 600 58px "Bodoni Moda", Georgia, serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(String(n), 48, 52);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  handCache.set(key, tex);
  return tex;
}

const fingerCache = new Map();
function fingerTexture(n) {
  const key = `${n}${PAL.right}`;
  if (fingerCache.has(key)) return fingerCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.shadowColor = 'rgba(28,24,20,.28)';
  g.shadowBlur = 10;
  g.shadowOffsetY = 4;
  g.fillStyle = '#f8f4ec';
  g.beginPath();
  g.arc(64, 62, 50, 0, Math.PI * 2);
  g.fill();
  g.shadowColor = 'transparent';
  g.strokeStyle = PAL.right;
  g.lineWidth = 7;
  g.lineCap = 'round';
  g.beginPath();
  g.arc(64, 63, 46, -2.4, 3.75);
  g.stroke();
  g.fillStyle = '#1c1814';
  g.font = 'italic 600 74px "Bodoni Moda", Georgia, serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(String(n), 64, 66);
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  fingerCache.set(key, tex);
  return tex;
}

export class Piano3D {
  constructor(container, opts = {}) {
    this.container = container;
    this.low = opts.low ?? 60;
    this.high = opts.high ?? 72;
    this.stage = opts.stage ?? 'lumiere';
    this.known = opts.known ?? null;              // Set des touches apprises (null = toutes)
    this.labelsOn = opts.labels ?? true;
    this.sound = opts.sound ?? true;
    this.interactive = opts.interactive ?? true;
    this.autoCamera = opts.autoCamera ?? true;
    this.onNoteOn = opts.onNoteOn || null;
    this.onNoteOff = opts.onNoteOff || null;
    this.haptics = opts.haptics ?? false;
    this.view = opts.view ?? 'front';
    this.floorY = opts.floorY ?? -6;
    this.focusRange = opts.focus ?? null;
    this.shadows = !lowPower();

    this.keys = new Map();
    this.pressed = new Set();
    this.highlights = new Map();
    this.pointers = new Map();
    this.frameHooks = new Set();
    this.anims = [];
    this.fingers = [];

    this.#setup();
    this.#buildKeys();
    this.#buildBody();
    this.#bindPointer();
    this.resize(true);
    preload(this.low, this.high, Math.round((this.low + this.high) / 2));

    this.visible = true;
    this.io = new IntersectionObserver(([e]) => { this.visible = e.isIntersecting; });
    this.io.observe(container);
    this.ro = new ResizeObserver(() => this.resize());
    this.ro.observe(container);
    this.unq = onQualityChange(() => this.resize());

    this.clock = new THREE.Clock();
    this.time = 0;
    this.renderer.setAnimationLoop(() => this.#tick());
  }

  get width() { return this.whiteCount; }

  // ---------- Scene ----------
  #setup() {
    const r = attach(this.container, this);
    this.renderer = r;
    r.toneMappingExposure = 1;
    r.shadowMap.enabled = this.shadows;

    const scene = new THREE.Scene();
    // Le studio prend la palette : papier clair, ou nuit pour les palettes sombres
    const L = PAL.light;
    scene.background = new THREE.Color(PAL.studio);
    scene.fog = new THREE.Fog(new THREE.Color(PAL.studio), 95, 300);
    if (!Piano3D.env) {
      const pmrem = new THREE.PMREMGenerator(r);
      Piano3D.env = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
      pmrem.dispose();
    }
    scene.environment = Piano3D.env;
    scene.environmentIntensity = L.env;
    this.scene = scene;
    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 600);

    this.sky = new THREE.HemisphereLight(L.sky, L.ground, L.hemi);
    scene.add(this.sky);
    const sun = new THREE.DirectionalLight('#fff4e4', L.sun);
    sun.position.set(-14, 40, 26);
    sun.castShadow = this.shadows;
    sun.shadow.mapSize.set(1024, 1024);
    sun.shadow.radius = 4;
    Object.assign(sun.shadow.camera, { left: -40, right: 40, top: 40, bottom: -60, far: 140 });
    sun.shadow.bias = -0.0006;
    sun.shadow.normalBias = 0.02;
    scene.add(sun);
    this.sun = sun;
    // Lumiere chaude de scene, pour le piano a queue
    this.warm = new THREE.SpotLight('#ffe2b8', 0, 240, 0.42, 0.75, 1.2);
    this.warm.position.set(-8, 80, 40);
    this.warm.target.position.set(0, 0, -6);
    this.rim = new THREE.SpotLight('#bcd2ff', 0, 260, 0.6, 0.8, 1.1);
    this.rim.position.set(60, 50, -110);
    this.rim.target.position.set(0, -4, -24);
    this.fill = new THREE.PointLight('#ffe9cf', 0, 200, 1.3);
    this.fill.position.set(34, 46, 70);
    scene.add(this.warm, this.warm.target, this.rim, this.rim.target, this.fill);

    // Sol leger a calculer : il couvre la moitie de l'ecran, chaque pixel compte
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(900, 900),
      new THREE.MeshLambertMaterial({ color: PAL.floor })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = this.floorY;
    floor.receiveShadow = this.shadows;
    scene.add(floor);
    const grid = new THREE.GridHelper(320, 160, '#17204a', '#141a3a');
    grid.position.y = this.floorY + 0.01;
    grid.material.transparent = true;
    grid.material.opacity = 0;
    grid.material.depthWrite = false;
    grid.visible = false;
    scene.add(grid);
    this.grid = grid;
    this.floor = floor;

    this.root = new THREE.Group();
    scene.add(this.root);
    this.keysGroup = new THREE.Group();
    this.root.add(this.keysGroup);
    this.bodyGroup = new THREE.Group();
    this.root.add(this.bodyGroup);

    this.bloom = createBloom(r, scene, this.camera, { strength: 0.35, radius: 0.4, threshold: 3 });
  }

  // ---------- Touches ----------
  #layout(low, high) {
    let wi = -1;
    const list = [];
    for (let m = low; m <= high; m++) {
      if (!isBlack(m)) wi++;
      list.push({ midi: m, black: isBlack(m), slot: isBlack(m) ? wi + 0.5 : wi });
    }
    const count = wi + 1;
    const offset = (count - 1) / 2;
    return { list: list.map((p) => ({ ...p, x: p.slot - offset })), count };
  }

  #isKnown(midi) {
    return !this.known || this.known.has(midi);
  }

  #makeKey(midi, x) {
    const g = geometries();
    const black = isBlack(midi);
    const pivot = new THREE.Group();
    pivot.position.set(x, 0, -WHITE.l / 2);
    const mat = this.#keyMaterial();
    const mesh = new THREE.Mesh(black ? g.black : g.white, mat);
    if (black) mesh.position.set(0, WHITE.h / 2 + BLACK.h / 2 - 0.12, BLACK.l / 2);
    else mesh.position.set(0, 0, WHITE.l / 2);
    mesh.castShadow = this.shadows;
    mesh.receiveShadow = this.shadows;
    mesh.userData.midi = midi;
    pivot.add(mesh);

    const edgeMat = new THREE.LineBasicMaterial({ color: GRAPHITE.clone(), transparent: true, opacity: 0, depthWrite: false });
    const edges = new THREE.LineSegments(black ? g.blackEdges : g.whiteEdges, edgeMat);
    edges.position.copy(mesh.position);
    pivot.add(edges);

    let label = null;
    if (!black) {
      label = new THREE.Mesh(g.label, new THREE.MeshBasicMaterial({ transparent: true, depthWrite: false, opacity: 0 }));
      label.rotation.x = -Math.PI / 2;
      label.position.set(0, WHITE.h / 2 + 0.004, WHITE.l - 0.72);
      label.renderOrder = 3;
      pivot.add(label);
    }

    // Trait de memoire : un coup de crayon sur le devant des touches apprises (corps reels)
    const memory = new THREE.Mesh(g.memory, new THREE.MeshBasicMaterial({
      color: midi % 12 === 0 ? accent() : INK.clone(), transparent: true, opacity: 0, depthWrite: false,
    }));
    memory.position.set(0, black ? WHITE.h / 2 + BLACK.h - 0.115 : WHITE.h / 2 + 0.02, black ? BLACK.l - 0.12 : WHITE.l - 0.1);
    if (black) { memory.scale.set(0.55, 1, 1); memory.material.color.copy(IVORY); }
    pivot.add(memory);

    this.keysGroup.add(pivot);
    const k = {
      letter: null,
      midi, black, pivot, mesh, mat, edges, edgeMat, label, memory, x,
      angle: 0, glow: 0, known: this.#isKnown(midi), knownT: this.#isKnown(midi) ? 1 : 0,
      appear: 1, appearDelay: 0, flash: 0,
    };
    this.#dress(k);
    if (this.letterMap?.[midi]) this.#letter(k, this.letterMap[midi]);
    return k;
  }

  // La lettre du clavier d'ordinateur qui joue cette touche
  #letter(k, letter) {
    if (k.letter) { k.pivot.remove(k.letter); k.letter.material.map.dispose(); k.letter.material.dispose(); k.letter = null; }
    if (!letter) return;
    const c = document.createElement('canvas');
    c.width = c.height = 96;
    const g = c.getContext('2d');
    g.fillStyle = '#f8f4ec';
    g.strokeStyle = PAL.ink;
    g.lineWidth = 5;
    g.beginPath();
    if (g.roundRect) g.roundRect(9, 9, 78, 78, 9); else g.rect(9, 9, 78, 78);
    g.fill();
    g.stroke();
    g.fillStyle = PAL.ink;
    g.font = '800 52px "Atkinson Hyperlegible Next", system-ui, sans-serif';
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.fillText(letter, 48, 52);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const size = k.black ? 0.52 : 0.84;
    const m = new THREE.Mesh(new THREE.PlaneGeometry(size, size), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
    m.rotation.x = -Math.PI / 2;
    if (k.black) m.position.set(0, WHITE.h / 2 + BLACK.h - 0.12 + 0.004, BLACK.l - 0.55);
    else m.position.set(0, WHITE.h / 2 + 0.004, WHITE.l - 1.85);
    m.renderOrder = 3;
    k.pivot.add(m);
    k.letter = m;
  }

  // Position de la main : le numero du doigt pose sur chaque touche (carte midi -> { doigt, main })
  setHandMap(map) {
    for (const k of this.keys.values()) {
      const want = map?.[k.midi];
      const key = want ? `${want.finger}${want.hand}` : null;
      if (k.handKey === key) continue;
      if (k.hand) { k.pivot.remove(k.hand); k.hand.material.dispose(); k.hand = null; }
      k.handKey = key;
      if (!want) continue;
      const m = new THREE.Mesh(geometries().finger, new THREE.MeshBasicMaterial({ map: handTexture(want.finger, want.hand), transparent: true, depthWrite: false }));
      m.rotation.x = -Math.PI / 2;
      const size = k.black ? 0.46 : 0.62;
      m.scale.set(size, size, 1);
      if (k.black) m.position.set(0, WHITE.h / 2 + BLACK.h - 0.12 + 0.006, BLACK.l - 0.9);
      else m.position.set(0, WHITE.h / 2 + 0.006, WHITE.l - 1.7);
      m.renderOrder = 4;
      k.pivot.add(m);
      k.hand = m;
    }
  }

  // Affiche (carte midi -> lettre) ou retire (null) les lettres du clavier d'ordinateur
  setKeyLetters(map) {
    this.letterMap = map || null;
    for (const k of this.keys.values()) this.#letter(k, this.letterMap?.[k.midi] || null);
  }

  #keyMaterial() {
    return new THREE.MeshStandardMaterial({ color: '#000000', emissive: new THREE.Color('#000000') });
  }

  // Habille une touche selon le corps de l'instrument
  #dress(k) {
    const light = this.stage === 'lumiere';
    const m = k.mat;
    if (light) {
      m.color.copy(k.black ? SKETCH_BLACK : SKETCH_WHITE);
      m.map = k.black ? hatchTexture() : null;
      m.roughness = 0.85;
      m.metalness = 0;
      m.transparent = false;
    } else {
      m.map = null;
      m.transparent = false;
      m.opacity = 1;
      m.color.copy(k.black ? EBONY : IVORY);
      m.roughness = k.black ? 0.16 : 0.3;
      m.metalness = k.black ? 0.08 : 0;
    }
    k.base = m.color.clone();
    m.needsUpdate = true;
    if (k.label) this.#refreshLabel(k);
  }

  #refreshLabel(k) {
    if (!k.label) return;
    const mode = this.stage === 'lumiere' ? 'light' : 'ink';
    const tex = labelTexture(noteName(k.midi), mode, k.midi === 60);
    if (k.label.material.map !== tex) {
      k.label.material.map = tex;
      k.label.material.needsUpdate = true;
    }
  }

  #buildKeys() {
    const { list, count } = this.#layout(this.low, this.high);
    this.whiteCount = count;
    this.keyMeshes = [];
    for (const p of list) {
      const k = this.#makeKey(p.midi, p.x);
      this.keys.set(p.midi, k);
      this.keyMeshes.push(k.mesh);
    }
  }

  // Change la plage : les touches glissent a leur nouvelle place, les nouvelles sortent du noir
  setRange(low, high, { animate = true } = {}) {
    if (low === this.low && high === this.high) return;
    const { list, count } = this.#layout(low, high);
    const keep = new Set(list.map((p) => p.midi));
    for (const [midi, k] of this.keys) {
      if (keep.has(midi)) continue;
      this.release(midi);
      this.#letter(k, null);
      if (k.hand) { k.hand.material.dispose(); k.hand = null; }
      this.keysGroup.remove(k.pivot);
      k.mat.dispose();
      k.edgeMat.dispose();
      k.label?.material.dispose();
      k.memory.material.dispose();
      this.keys.delete(midi);
    }
    const center = (low + high) / 2;
    for (const p of list) {
      let k = this.keys.get(p.midi);
      if (k) {
        if (animate) this.#tween(k.pivot.position, 'x', p.x, 700);
        else k.pivot.position.x = p.x;
        k.x = p.x;
      } else {
        k = this.#makeKey(p.midi, p.x);
        this.keys.set(p.midi, k);
        if (animate) {
          k.appear = 0;
          k.appearDelay = Math.abs(p.midi - center) * 0.018 + 0.25;
        }
      }
    }
    this.low = low;
    this.high = high;
    this.whiteCount = count;
    this.keyMeshes = [...this.keys.values()].map((k) => k.mesh);
    this.#buildBody();
    preload(low, high, Math.round(center));
    this.resize();
  }

  // ---------- Corps de l'instrument ----------
  #clearBody() {
    this.grand?.dispose();
    this.grand = null;
    this.bodyGroup.traverse((o) => {
      if (o.geometry && !o.userData.shared) o.geometry.dispose();
      if (o.material) [].concat(o.material).forEach((m) => m.dispose());
    });
    this.bodyGroup.clear();
  }

  #buildBody({ assemble = false } = {}) {
    this.#clearBody();
    const W = this.whiteCount;
    const floorLevel = this.stage === 'queue' ? Math.min(this.floorY, -30) : this.floorY;
    this.floor.position.y = floorLevel;
    this.grid.position.y = floorLevel + 0.01;
    this.floorLevel = floorLevel;
    const add = (geo, mat, x, y, z, shadow = true) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = shadow && this.shadows;
      m.receiveShadow = shadow && this.shadows;
      this.bodyGroup.add(m);
      return m;
    };
    const ink = (c = '#1c1814') => new THREE.MeshBasicMaterial({ color: new THREE.Color(c) });

    if (this.stage === 'lumiere') {
      // L'esquisse : le clavier dessine sur une feuille, deux traits d'encre pour le cadre
      const sheet = new THREE.MeshLambertMaterial({ color: '#f6f1e6' });
      add(new RoundedBoxGeometry(W + 2.2, 0.12, WHITE.l + 2.4, 2, 0.04), sheet, 0, -0.42, 0.25);
      add(new THREE.BoxGeometry(W + 0.8, 0.03, 0.035), ink(), 0, -0.34, WHITE.l / 2 + 0.4, false);
      add(new THREE.BoxGeometry(W + 0.8, 0.03, 0.035), ink(), 0, -0.34, -WHITE.l / 2 - 0.45, false);
    } else {
      const body = new THREE.MeshStandardMaterial({ color: '#17120f', roughness: 0.3, metalness: 0.1 });
      // Feutre rouge derriere les touches, comme sur un vrai piano
      add(new THREE.BoxGeometry(W + 0.2, 0.32, 0.16), new THREE.MeshStandardMaterial({ color: '#6d0f1c', roughness: 1 }), 0, 0.12, -WHITE.l / 2 - 0.08);
      if (this.stage === 'queue') {
        this.grand = buildGrand({ width: W, keyLength: WHITE.l, floorY: floorLevel, shadows: this.shadows, low: this.low, high: this.high, keyX: (m) => this.keyX(m) });
        this.grand.setLid(!assemble);
        this.bodyGroup.add(this.grand.group);
      } else {
        add(new RoundedBoxGeometry(W + 0.6, 0.6, WHITE.l + 0.8, 3, 0.1), body, 0, -0.68, 0.1);
        const cheek = new RoundedBoxGeometry(0.9, 1.7, WHITE.l + 1.6, 3, 0.15);
        add(cheek, body, -(W / 2 + 0.7), -0.1, 0.3);
        add(cheek, body, W / 2 + 0.7, -0.1, 0.3);
        add(new RoundedBoxGeometry(W + 2.3, 2.2, 2.4, 3, 0.2), body, 0, 0.35, -WHITE.l / 2 - 1.25);
        // Un liseré de laiton sous le clavier, comme sur les beaux pianos droits
        add(new THREE.BoxGeometry(W + 2.2, 0.05, 0.05), new THREE.MeshStandardMaterial({ color: PAL.brass, roughness: 0.35, metalness: 0.8 }), 0, -0.98, WHITE.l / 2 + 0.52, false);
        const footY = (this.floorY - 1) / 2;
        add(new RoundedBoxGeometry(Math.max(6, W * 0.5), Math.abs(this.floorY) - 1, 1.4, 3, 0.2), body, 0, footY, -WHITE.l / 2 - 1.1);
      }
    }
    this.#applyAtmosphere();
  }

  // L'ambiance suit l'instrument : le studio de papier, puis la lumiere de scene pour le piano a queue
  #applyAtmosphere() {
    const s = this.stage;
    this.atmo = {
      grid: 0,
      warm: s === 'queue' ? 360 : PAL.light.warm,
      rim: s === 'queue' ? 420 : PAL.light.rim,
      fill: s === 'queue' ? 60 : PAL.light.fill,
      exposure: 1,
      bloom: 3,
    };
    // Des ombres douces partout : c'est ce qui pose le piano dans le studio
    const wantShadows = this.shadows;
    if (this.renderer.shadowMap.enabled !== wantShadows) {
      this.renderer.shadowMap.enabled = wantShadows;
      this.scene.traverse((o) => { if (o.material) [].concat(o.material).forEach((m) => { m.needsUpdate = true; }); });
    }
    // Premiere construction : l'ambiance est posee tout de suite, sans fondu
    if (!this.atmoReady) {
      this.atmoReady = true;
      const a = this.atmo;
      this.warm.intensity = a.warm;
      this.rim.intensity = a.rim;
      this.fill.intensity = a.fill;
      this.grid.material.opacity = a.grid;
      this.renderer.toneMappingExposure = a.exposure;
      this.bloom.bloom.threshold = a.bloom;
    }
  }

  // Change le corps de l'instrument. Anime : une vague de lumiere traverse le clavier et le transforme.
  setStage(stage, { animate = true } = {}) {
    if (stage === this.stage) return;
    this.stage = stage;
    const keys = [...this.keys.values()].sort((a, b) => a.x - b.x);
    keys.forEach((k, i) => {
      const delay = animate ? 0.2 + i * 0.022 : 0;
      if (!animate) { this.#dress(k); return; }
      this.#after(delay, () => { k.flash = 1.4; this.#dress(k); });
    });
    const build = () => {
      this.#buildBody({ assemble: animate });
      if (animate) this.#assemble();
      this.resize();
    };
    if (animate) this.#after(0.2 + keys.length * 0.022 * 0.5, build);
    else build();
  }

  // Les pieces du corps arrivent les unes apres les autres
  #assemble() {
    const parts = this.grand ? this.grand.parts : this.bodyGroup.children;
    parts.forEach((p, i) => {
      const target = p.position.clone();
      const s = p.scale.clone();
      p.position.y -= 6;
      p.scale.multiplyScalar(0.001);
      const delay = i * 0.06;
      this.anims.push({ t: -delay, dur: 0.9, step: (e) => {
        p.position.y = target.y - 6 * (1 - e);
        p.scale.copy(s).multiplyScalar(Math.max(0.001, e));
      } });
    });
    if (this.grand) this.grand.openLid(1.4 + parts.length * 0.06);
  }

  #after(seconds, fn) {
    this.anims.push({ t: -seconds, dur: 0, step: () => {}, done: fn });
  }

  #tween(obj, prop, to, ms) {
    const from = obj[prop];
    this.anims.push({ t: 0, dur: ms / 1000, step: (e) => { obj[prop] = from + (to - from) * e; } });
  }

  // ---------- Touches apprises ----------
  setKnown(set) {
    this.known = set;
    for (const k of this.keys.values()) k.known = this.#isKnown(k.midi);
  }

  // Une nouvelle note est apprise : elle s'illumine et garde sa lumiere
  discover(midi) {
    const k = this.keys.get(midi);
    if (!this.known) return;
    this.known.add(midi);
    if (!k) return;
    k.known = true;
    k.flash = 2;
  }

  setLabelsVisible(v) {
    this.labelsOn = v;
  }

  // ---------- Entree : souris, doigts ----------
  #bindPointer() {
    if (!this.interactive) return;
    const el = this.renderer.domElement;
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const local = new THREE.Vector3();
    const hit = (e) => {
      const rect = el.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(ndc, this.camera);
      const h = ray.intersectObjects(this.keyMeshes, false)[0];
      if (!h) return null;
      // Plus on appuie pres du bord de la touche, plus le son est fort (comme sur un vrai clavier)
      local.copy(h.point);
      h.object.worldToLocal(local);
      const len = h.object.userData.midi != null && isBlack(h.object.userData.midi) ? BLACK.l : WHITE.l;
      const along = Math.min(1, Math.max(0, local.z / len + 0.5));
      return { midi: h.object.userData.midi, velocity: 0.58 + 0.36 * along };
    };
    this._starts = new Map();
    this._onDown = (e) => {
      const h = hit(e);
      if (!h) return;
      // Souris : on garde le pointeur. Doigt : la page peut encore defiler si le geste devient vertical.
      if (e.pointerType !== 'touch') {
        e.preventDefault();
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* evenement simule */ }
      }
      this._starts.set(e.pointerId, { x: e.clientX, y: e.clientY, scrolling: false });
      this.pointers.set(e.pointerId, h.midi);
      if (this.haptics && e.pointerType === 'touch') navigator.vibrate?.(6);
      this.press(h.midi, h.velocity, { source: 'touch' });
    };
    this._onMove = (e) => {
      const start = this._starts.get(e.pointerId);
      if (start && !start.scrolling && e.pointerType === 'touch') {
        const dx = e.clientX - start.x;
        const dy = e.clientY - start.y;
        if (Math.abs(dy) > 14 && Math.abs(dy) > Math.abs(dx) * 1.2) {
          start.scrolling = true;
          const prev = this.pointers.get(e.pointerId);
          if (prev != null) this.release(prev);
          this.pointers.delete(e.pointerId);
          try { el.releasePointerCapture(e.pointerId); } catch (err) { /* pas capture */ }
          return;
        }
      }
      if (!this.pointers.has(e.pointerId)) return;
      if (!el.hasPointerCapture?.(e.pointerId)) {
        try { el.setPointerCapture(e.pointerId); } catch (err) { /* evenement simule */ }
      }
      const h = hit(e);
      const midi = h?.midi ?? null;
      const prev = this.pointers.get(e.pointerId);
      if (midi === prev) return;
      if (prev != null) this.release(prev);
      this.pointers.set(e.pointerId, midi);
      if (midi != null) {
        if (this.haptics && e.pointerType === 'touch') navigator.vibrate?.(4);
        this.press(midi, h.velocity * 0.9, { source: 'touch' });
      }
    };
    this._onUp = (e) => {
      this._starts.delete(e.pointerId);
      if (!this.pointers.has(e.pointerId)) return;
      const midi = this.pointers.get(e.pointerId);
      this.pointers.delete(e.pointerId);
      if (midi != null) this.release(midi);
    };
    el.addEventListener('pointerdown', this._onDown);
    el.addEventListener('pointermove', this._onMove);
    el.addEventListener('pointerup', this._onUp);
    el.addEventListener('pointercancel', this._onUp);
    el.addEventListener('lostpointercapture', this._onUp);
  }

  colorFor(midi) {
    return midi % 12 === 0 ? accent() : INK;
  }

  // Position (repere du piano) du dessus d'une touche, cote joueur
  keyTop(midi, along = 0.75) {
    const k = this.keys.get(midi);
    if (!k) return null;
    const v = new THREE.Vector3();
    if (k.black) v.set(k.x, WHITE.h / 2 + BLACK.h - 0.12, -WHITE.l / 2 + BLACK.l * along);
    else v.set(k.x, WHITE.h / 2, -WHITE.l / 2 + WHITE.l * along);
    return v;
  }

  // Abscisse d'une touche, meme hors du clavier visible (pour les notes qui tombent)
  keyX(midi) {
    const k = this.keys.get(midi);
    if (k) return k.x;
    let wi = 0;
    if (midi < this.low) { for (let m = midi; m < this.low; m++) if (!isBlack(m)) wi--; }
    else { for (let m = this.low; m < midi; m++) if (!isBlack(m)) wi++; }
    const offset = (this.whiteCount - 1) / 2;
    return wi - offset + (isBlack(midi) ? -0.5 : 0);
  }

  // Appui : la touche descend tout de suite, le son part dans le meme geste
  press(midi, velocity = 0.8, meta = {}) {
    if (this.pressed.has(midi)) return;
    const k = this.keys.get(midi);
    if (!k) {
      // Touche hors du clavier visible (piano numerique, clavier d'ordinateur) : on l'entend quand meme
      if (midi < 21 || midi > 108) return;
      this.pressed.add(midi);
      if (this.sound && !meta.silent) noteOn(midi, velocity);
      this.onNoteOn?.(midi, meta, velocity);
      return;
    }
    this.pressed.add(midi);
    k.glow = 1;
    k.angle = (k.black ? PRESS.black : PRESS.white) * 0.85;
    k.pivot.rotation.x = k.angle;
    const p = new THREE.Vector3(k.x, k.black ? 0.8 : 0.32, k.black ? -WHITE.l / 2 + 0.2 : -WHITE.l / 2 + 0.25);
    void p;
    if (this.sound && !meta.silent) noteOn(midi, velocity);
    this.grand?.strike(midi, velocity);
    this.onNoteOn?.(midi, meta, velocity);
  }

  release(midi, meta = {}) {
    if (!this.pressed.has(midi)) return;
    this.pressed.delete(midi);
    if (this.sound && !meta.silent) noteOff(midi);
    this.grand?.damp(midi);
    this.onNoteOff?.(midi, meta);
  }

  releaseAll() {
    [...this.pressed].forEach((m) => this.release(m));
  }

  tap(midi, ms = 400, velocity = 0.8, meta = {}) {
    this.press(midi, velocity, meta);
    setTimeout(() => this.release(midi, meta), ms);
  }

  // Fait briller une touche sans la jouer (bonne note entendue au micro, par exemple)
  flash(midi, color) {
    const k = this.keys.get(midi);
    if (!k) return;
    k.flash = 1.6;
    k.flashColor = color ? new THREE.Color(color) : null;
  }

  highlight(midi, color) {
    if (!this.keys.has(midi)) return;
    if (color) this.highlights.set(midi, new THREE.Color(color));
    else this.highlights.delete(midi);
  }

  clearHighlights() {
    this.highlights.clear();
  }

  // Le numero du doigt flotte au-dessus de la touche a jouer
  showFinger(midi, n) {
    this.hideFinger();
    const k = this.keys.get(midi);
    if (!k || !n) return;
    const sprite = new THREE.Mesh(geometries().finger, new THREE.MeshBasicMaterial({ map: fingerTexture(n), transparent: true, depthWrite: false, depthTest: false }));
    sprite.renderOrder = 10;
    sprite.userData = { midi, t: 0 };
    sprite.scale.setScalar(k.black ? 0.75 : 0.95);
    this.root.add(sprite);
    this.fingers.push(sprite);
  }

  hideFinger() {
    this.fingers.forEach((s) => { this.root.remove(s); s.material.dispose(); });
    this.fingers = [];
  }

  setView(view) {
    this.view = view;
    this.resize();
  }

  // Cadre la camera sur une partie du clavier (null = tout le clavier)
  setFocus(low, high, instant = false) {
    this.focusRange = low == null ? null : [low, high];
    this.resize(instant);
  }

  onFrame(fn) {
    this.frameHooks.add(fn);
    return () => this.frameHooks.delete(fn);
  }

  // Largeur et centre (en unites du piano) de la zone a cadrer
  #span() {
    const narrow = this.container.clientWidth < 700;
    const touch = window.matchMedia('(pointer: coarse)').matches;
    let [lo, hi] = this.focusRange || [this.low, this.high];
    lo = Math.max(lo, this.low);
    hi = Math.min(hi, this.high);
    const xs = [this.keyX(lo), this.keyX(hi)];
    let width = Math.abs(xs[1] - xs[0]) + 1;
    let center = (xs[0] + xs[1]) / 2;
    // Sur telephone, jamais plus de 11 touches blanches a l'ecran : elles restent assez larges pour le doigt
    // Au doigt : assez de place pour poser le bout du doigt sur chaque touche blanche
    const fingerW = Math.max(6, Math.floor(this.container.clientWidth / 72));
    const maxW = this.view === 'highway'
      ? (narrow ? (this.container.clientWidth < 480 ? 9 : 13) : 999)
      : touch && this.focusRange ? fingerW : narrow ? (this.container.clientWidth < 480 ? 9 : 13) : 999;
    if (width > maxW) width = maxW;
    if (!narrow && !touch && this.focusRange) width = Math.max(width, Math.min(15, this.whiteCount));
    return { width, center };
  }

  resize(instant = false) {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.bloom.setSize(w, h);
    const cam = this.camera;
    cam.aspect = w / h;
    cam.updateProjectionMatrix();
    if (!this.autoCamera) return;
    const vfov = THREE.MathUtils.degToRad(cam.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * cam.aspect);
    const { width, center } = this.#span();
    const fit = (wd) => Math.max((wd / 2) / Math.tan(hfov / 2), 12);
    const grandDepth = this.grand ? this.grand.length : 0;
    const VIEWS = {
      // Sur telephone : plus haut, plus pres, les touches prennent toute la largeur du doigt
      front: this.container.clientWidth < 700
        ? { dir: [0, 1.25, 1], target: [center, 0, 0.6], d: fit(width + 1.2) }
        : { dir: [0, 1.05, 1], target: [center, 0.6, 0.4], d: fit(Math.max(width + 3, 21)) },
      top: { dir: [0, 1, 0.12], target: [center, 0, 0.6], d: fit(width + 4) },
      // Face au prof (on le voit de l'autre cote du piano) : pour ecouter ses explications
      // Au piano a queue, le couvercle ouvert boucherait la vue : on le regarde du cote des aigus, comme
      // le public voit un pianiste, de trois quarts
      teacher: { dir: this.stage === 'queue' ? [0.82, 0.42, -0.4] : [-0.5, 0.5, -0.82], target: this.teacherTarget || [0, 10.8, 14], d: 66 * (cam.aspect < 1 ? 1.5 : cam.aspect < 1.4 ? 1.15 : 1) },
      // Par-dessus l'epaule droite du prof : on voit ses doigts arrondis sur les touches, comme assis a cote de lui
      // (vu d'aplomb, des doigts courbes ont l'air de moignons ; plus bas, sa tete masque le clavier)
      hands: { dir: [0.24, 0.86, 0.46], target: [center - 0.8, 1.2, 3.2], d: fit(width + 3) * 1.12 },
      // Les notes arrivent du fond : le clavier en bas, la piste qui monte vers l'horizon
      highway: { dir: [0, 1.1, 1], target: [center, 0, -6.5], d: Math.max(22, fit(width + 4) * 1.3) },
      grand: { dir: [-0.7, 0.55, 0.95], target: [0, -9, -grandDepth * 0.38], d: Math.max(fit(width + 16), grandDepth * 1.55) },
    };
    const v = VIEWS[this.view] || VIEWS.front;
    const dir = new THREE.Vector3(...v.dir).normalize();
    this.camGoalTarget = new THREE.Vector3(...v.target);
    this.camGoal = this.camGoalTarget.clone().addScaledVector(dir, v.d);
    if (instant || !this.camBase) {
      this.camTarget = this.camGoalTarget.clone();
      this.camBase = this.camGoal.clone();
    }
  }

  // ---------- Boucle ----------
  #tick() {
    const raw = this.clock.getDelta();
    if (!this.visible || document.hidden) return;
    measureFrame(raw * 1000);
    const dt = Math.min(raw, 0.05);
    this.time += dt;
    const t = this.time;
    const light = this.stage === 'lumiere';

    // Animations en cours
    for (let i = this.anims.length - 1; i >= 0; i--) {
      const a = this.anims[i];
      a.t += dt;
      if (a.t < 0) continue;
      const e = a.dur ? ease(a.t / a.dur) : 1;
      a.step(e);
      if (!a.dur || a.t >= a.dur) {
        a.done?.();
        this.anims.splice(i, 1);
      }
    }

    const kDown = 1 - Math.exp(-dt * 60);
    const kUp = 1 - Math.exp(-dt * 22);
    const pulse = 0.55 + 0.45 * Math.sin(t * 6.5);
    for (const [midi, key] of this.keys) {
      const down = this.pressed.has(midi);
      const target = down ? (key.black ? PRESS.black : PRESS.white) : 0;
      if (Math.abs(key.angle - target) > 0.0001) {
        key.angle += (target - key.angle) * (down ? kDown : kUp);
        key.pivot.rotation.x = key.angle;
      }
      if (!down && key.glow > 0) key.glow = Math.max(0, key.glow - dt * 2.4);
      if (key.flash > 0) key.flash = Math.max(0, key.flash - dt * 1.6);
      key.knownT += ((key.known ? 1 : 0) - key.knownT) * Math.min(1, dt * 3);

      // Apparition des nouvelles touches
      if (key.appear < 1) {
        if (key.appearDelay > 0) key.appearDelay -= dt;
        else key.appear = Math.min(1, key.appear + dt * 2.2);
        const e = ease(key.appear);
        key.pivot.scale.set(1, Math.max(0.001, e), Math.max(0.001, 0.4 + 0.6 * e));
        key.pivot.visible = key.appear > 0.001 || key.appearDelay <= 0;
      }

      const hl = this.highlights.get(midi);
      const m = key.mat;
      m.color.copy(key.base);
      if (light) {
        // Esquisse : la touche pas apprise est du papier cerne de crayon ; apprise, elle s'encre
        m.color.lerp(key.black ? EBONY : IVORY, key.knownT);
        key.edgeMat.color.copy(GRAPHITE).lerp(INK, key.knownT);
        key.edgeMat.opacity = 0.8 + key.knownT * 0.15;
        // Apprise, la touche garde un trait d'encre sur son bord (rouge pour les do)
        key.memory.material.opacity = key.knownT * 0.85;
      } else {
        key.edgeMat.opacity = 0;
        key.memory.material.opacity = key.knownT * 0.85;
      }
      // La touche a jouer : un lavis de la couleur du crayon, et son contour trace dans cette couleur
      if (hl) {
        m.color.lerp(hl, (key.black ? 0.55 : 0.42) + 0.12 * pulse);
        key.edgeMat.color.copy(hl);
        key.edgeMat.opacity = 0.75 + 0.25 * pulse;
      }
      // Sous le doigt, la touche s'assombrit a peine (l'ombre de la main)
      if (key.glow > 0) m.color.multiplyScalar(1 - 0.12 * Math.min(1, key.glow));
      // Juste / faux : la touche prend un instant la couleur de l'annotation
      if (key.flashColor && key.flash > 0) m.color.lerp(key.flashColor, Math.min(0.78, key.flash * 0.6));
      m.emissive.setRGB(0, 0, 0);
      if (key.label) {
        const show = this.labelsOn && key.knownT > 0.01;
        key.label.visible = show;
        key.label.material.opacity = key.knownT;
        const pop = key.flash > 1 ? 1 + (key.flash - 1) * 0.35 : 1;
        key.label.scale.setScalar(pop);
      }
    }

    // Numero du doigt qui flotte
    for (const s of this.fingers) {
      s.userData.t += dt;
      const top = this.keyTop(s.userData.midi, isBlack(s.userData.midi) ? 0.7 : 0.82);
      if (!top) continue;
      s.position.set(top.x, top.y + 1.4 + Math.sin(s.userData.t * 4) * 0.18, top.z);
      s.quaternion.copy(this.camera.quaternion);
      const sc = Math.min(1, s.userData.t * 5);
      s.material.opacity = sc;
    }

    this.grand?.update(dt, t);

    // Ambiance (glisse en douceur quand l'instrument change)
    const a = this.atmo;
    const kA = Math.min(1, dt * 1.5);
    this.grid.material.opacity = 0;
    this.warm.intensity += (a.warm - this.warm.intensity) * kA;
    this.rim.intensity += (a.rim - this.rim.intensity) * kA;
    this.fill.intensity += (a.fill - this.fill.intensity) * kA;
    // Une lumiere eteinte coute quand meme sur chaque pixel : on la retire vraiment
    for (const l of [this.warm, this.rim, this.fill]) {
      const on = l.intensity > 0.5;
      if (l.visible !== on) l.visible = on;
    }
    this.renderer.toneMappingExposure += (a.exposure - this.renderer.toneMappingExposure) * kA;
    this.bloom.bloom.threshold += (a.bloom - this.bloom.bloom.threshold) * kA;

    // Camera : rejoint son cadre en douceur, respire a peine
    if (this.autoCamera && this.camBase) {
      const kc = 1 - Math.exp(-dt * 3.2);
      this.camBase.lerp(this.camGoal, kc);
      this.camTarget.lerp(this.camGoalTarget, kc);
      // La camera ne respire que dans les vues de spectacle : quand on joue, les touches restent sous le doigt
      const sway = this.view === 'teacher' || this.view === 'grand' ? 1 : 0;
      this.camera.position.set(this.camBase.x + Math.sin(t * 0.3) * 0.4 * sway, this.camBase.y + Math.sin(t * 0.4) * 0.18 * sway, this.camBase.z);
      // Vue de dessus : le haut de l'ecran est le fond du clavier (pas de roulis quand on regarde a la verticale)
      const overhead = this.view === 'hands' || this.view === 'top';
      this.camera.up.set(0, overhead ? 0.2 : 1, overhead ? -1 : 0).normalize();
      this.camera.lookAt(this.camTarget);
    }
    this.frameHooks.forEach((fn) => fn(dt, t));
    if (bloomAllowed()) this.bloom.render();
    else this.renderer.render(this.scene, this.camera);
  }

  detached() {
    this.renderer.setAnimationLoop(null);
  }

  dispose() {
    this.releaseAll();
    this.hideFinger();
    this.io.disconnect();
    this.ro.disconnect();
    this.unq();
    const el = this.renderer.domElement;
    if (this._onDown) {
      el.removeEventListener('pointerdown', this._onDown);
      el.removeEventListener('pointermove', this._onMove);
      el.removeEventListener('pointerup', this._onUp);
      el.removeEventListener('pointercancel', this._onUp);
      el.removeEventListener('lostpointercapture', this._onUp);
    }
    detach(this);
    this.bloom.dispose();
    this.#clearBody();
    for (const k of this.keys.values()) {
      k.mat.dispose();
      k.edgeMat.dispose();
      k.label?.material.dispose();
      k.memory.material.dispose();
    }
    this.scene.traverse((o) => {
      if (o.geometry && !Object.values(GEO || {}).includes(o.geometry)) o.geometry.dispose();
    });
  }
}
