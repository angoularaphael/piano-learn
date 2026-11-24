// Piano 3D neon jouable (souris, tactile, clavier d'ordinateur)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { isBlack, noteName } from './notes.js';
import { noteOn, noteOff } from './audio.js';
import { NoteFX } from './note-fx.js';
import { createBloom } from './bloom.js';

export const WHITE = { w: 0.94, h: 0.6, l: 6 };
export const BLACK = { w: 0.56, h: 0.5, l: 3.8 };
const PRESS_ANGLE = { white: 0.07, black: 0.08 };
const CYAN = new THREE.Color('#3ef2ff');
const VIOLET = new THREE.Color('#8b5cff');
const PINK = new THREE.Color('#ff4fd8');

const labelCache = new Map();
function labelTexture(text, mark) {
  const key = text + (mark ? '*' : '');
  if (labelCache.has(key)) return labelCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#5a6a92';
  g.font = '700 40px Unbounded, system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 64, 56);
  if (mark) {
    g.fillStyle = '#ff4fd8';
    g.shadowColor = '#ff4fd8';
    g.shadowBlur = 12;
    g.beginPath();
    g.arc(64, 104, 10, 0, Math.PI * 2);
    g.fill();
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  labelCache.set(key, tex);
  return tex;
}

export class Piano3D {
  constructor(container, opts = {}) {
    this.container = container;
    this.low = opts.low ?? 48;
    this.high = opts.high ?? 84;
    this.sound = opts.sound ?? true;
    this.interactive = opts.interactive ?? true;
    this.autoCamera = opts.autoCamera ?? true;
    this.onNoteOn = opts.onNoteOn || null;
    this.onNoteOff = opts.onNoteOff || null;

    this.keys = new Map();
    this.pressed = new Set();
    this.highlights = new Map();
    this.pointers = new Map();
    this.frameHooks = new Set();
    this.view = opts.view ?? 'front';
    this.floorY = opts.floorY ?? -6;

    this.#setup();
    this.#buildKeys();
    this.#buildBody();
    this.fx = new NoteFX(this.root, { speed: 8, grow: 12, maxHeight: 30, sparkSize: 0.4 });
    this.#bindPointer();
    this.resize();

    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.#tick());
  }

  #setup() {
    const mobile = window.innerWidth < 760;
    const r = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
    r.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(r.domElement);
    this.renderer = r;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#05060d');
    scene.fog = new THREE.FogExp2('#05060d', 0.012);
    const pmrem = new THREE.PMREMGenerator(r);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.25;
    this.scene = scene;

    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 500);

    scene.add(new THREE.HemisphereLight('#9fb4ff', '#1a1030', 0.7));
    const sun = new THREE.DirectionalLight('#ffffff', 1.6);
    sun.position.set(-8, 22, 14);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    Object.assign(sun.shadow.camera, { left: -22, right: 22, top: 22, bottom: -22, far: 80 });
    sun.shadow.bias = -0.0005;
    scene.add(sun);
    const cyanLight = new THREE.PointLight('#3ef2ff', 120, 40, 1.8);
    cyanLight.position.set(-14, 6, 6);
    scene.add(cyanLight);
    const violetLight = new THREE.PointLight('#8b5cff', 140, 45, 1.8);
    violetLight.position.set(14, 7, 2);
    scene.add(violetLight);

    // Sol sombre avec grille lumineuse
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(400, 400),
      new THREE.MeshStandardMaterial({ color: '#070912', roughness: 0.35, metalness: 0.6 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = this.floorY;
    floor.receiveShadow = true;
    scene.add(floor);
    const grid = new THREE.GridHelper(400, 200, '#3ef2ff', '#141a3a');
    grid.position.y = this.floorY + 0.01;
    grid.material.transparent = true;
    grid.material.opacity = 0.22;
    scene.add(grid);
    this.grid = grid;

    this.root = new THREE.Group();
    scene.add(this.root);

    this.bloom = createBloom(r, scene, this.camera, { strength: 0.9, radius: 0.55, threshold: 0.92 });
  }

  #buildKeys() {
    const whiteGeo = new RoundedBoxGeometry(WHITE.w, WHITE.h, WHITE.l, 3, 0.06);
    const blackGeo = new RoundedBoxGeometry(BLACK.w, BLACK.h, BLACK.l, 3, 0.07);
    const labelGeo = new THREE.PlaneGeometry(0.78, 0.78);

    let whiteIndex = -1;
    const positions = [];
    for (let m = this.low; m <= this.high; m++) {
      if (!isBlack(m)) whiteIndex++;
      positions.push({ midi: m, black: isBlack(m), x: isBlack(m) ? whiteIndex + 0.5 : whiteIndex });
    }
    this.whiteCount = whiteIndex + 1;
    const offset = (this.whiteCount - 1) / 2;
    this.width = this.whiteCount;

    this.keyMeshes = [];
    this.labels = [];
    for (const p of positions) {
      const pivot = new THREE.Group();
      pivot.position.set(p.x - offset, 0, -WHITE.l / 2);
      const base = new THREE.Color(p.black ? '#0b0c14' : '#d9dfee');
      const mat = new THREE.MeshPhysicalMaterial({
        color: base.clone(),
        roughness: p.black ? 0.22 : 0.3,
        metalness: p.black ? 0.3 : 0,
        clearcoat: 1,
        clearcoatRoughness: 0.15,
        emissive: new THREE.Color('#000000'),
      });
      const mesh = new THREE.Mesh(p.black ? blackGeo : whiteGeo, mat);
      if (p.black) mesh.position.set(0, WHITE.h / 2 + BLACK.h / 2 - 0.12, BLACK.l / 2);
      else mesh.position.set(0, 0, WHITE.l / 2);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData.midi = p.midi;
      pivot.add(mesh);

      if (!p.black) {
        const label = new THREE.Mesh(
          labelGeo,
          new THREE.MeshBasicMaterial({ map: labelTexture(noteName(p.midi), p.midi === 60), transparent: true, depthWrite: false })
        );
        label.rotation.x = -Math.PI / 2;
        label.position.set(0, WHITE.h / 2 + 0.003, WHITE.l - 0.75);
        pivot.add(label);
        this.labels.push(label);
      }

      this.root.add(pivot);
      this.keyMeshes.push(mesh);
      this.keys.set(p.midi, { pivot, mesh, mat, base, black: p.black, angle: 0, x: p.x - offset, glow: 0 });
    }
  }

  #buildBody() {
    const W = this.width;
    const body = new THREE.MeshPhysicalMaterial({ color: '#07080f', roughness: 0.15, metalness: 0.5, clearcoat: 1, clearcoatRoughness: 0.05 });
    const neon = (c, k = 3) => new THREE.MeshBasicMaterial({ color: new THREE.Color(c).multiplyScalar(k) });
    const add = (geo, mat, x, y, z, shadow = true) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = shadow;
      m.receiveShadow = shadow;
      this.root.add(m);
      return m;
    };

    add(new RoundedBoxGeometry(W + 0.6, 0.6, WHITE.l + 0.8, 3, 0.1), body, 0, -0.68, 0.1);
    add(new THREE.BoxGeometry(W + 0.2, 0.7, 0.14), new THREE.MeshStandardMaterial({ color: '#1a0f2e', roughness: 1 }), 0, 0.2, -WHITE.l / 2 - 0.07);
    const cheek = new RoundedBoxGeometry(0.9, 1.7, WHITE.l + 1.6, 3, 0.15);
    add(cheek, body, -(W / 2 + 0.7), -0.1, 0.3);
    add(cheek, body, W / 2 + 0.7, -0.1, 0.3);
    // Arriere du clavier, bas et fin
    add(new RoundedBoxGeometry(W + 2.3, 2.2, 2.4, 3, 0.2), body, 0, 0.35, -WHITE.l / 2 - 1.25);
    // Bandes LED
    add(new THREE.BoxGeometry(W + 2.2, 0.05, 0.05), neon('#3ef2ff'), 0, -0.98, WHITE.l / 2 + 0.52, false);
    add(new THREE.BoxGeometry(W + 2.2, 0.05, 0.05), neon('#8b5cff'), 0, 1.47, -WHITE.l / 2 - 0.04, false);
    add(new THREE.BoxGeometry(0.05, 1.5, 0.05), neon('#3ef2ff', 2), -(W / 2 + 0.7), -0.1, WHITE.l / 2 + 1.12, false);
    add(new THREE.BoxGeometry(0.05, 1.5, 0.05), neon('#3ef2ff', 2), W / 2 + 0.7, -0.1, WHITE.l / 2 + 1.12, false);
    // Pied central style colonne lumineuse
    const footY = (this.floorY - 1) / 2;
    const foot = add(new RoundedBoxGeometry(W * 0.5, Math.abs(this.floorY) - 1, 1.4, 3, 0.2), body, 0, footY, -WHITE.l / 2 - 1.1);
    foot.castShadow = true;
    add(new THREE.BoxGeometry(0.06, Math.abs(this.floorY) - 1.2, 0.06), neon('#8b5cff', 2.5), 0, footY, -WHITE.l / 2 - 0.38, false);
    // Halo au sol
    const halo = new THREE.Mesh(
      new THREE.CircleGeometry(W * 0.6, 64),
      new THREE.MeshBasicMaterial({ color: '#3ef2ff', transparent: true, opacity: 0.035, blending: THREE.AdditiveBlending, depthWrite: false })
    );
    halo.rotation.x = -Math.PI / 2;
    halo.scale.set(1, 0.35, 1);
    halo.position.set(0, this.floorY + 0.02, 0);
    this.root.add(halo);
  }

  #bindPointer() {
    if (!this.interactive) return;
    const el = this.renderer.domElement;
    const ray = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const hit = (e) => {
      const rect = el.getBoundingClientRect();
      ndc.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      ray.setFromCamera(ndc, this.camera);
      const hits = ray.intersectObjects(this.keyMeshes, false);
      return hits.length ? hits[0].object.userData.midi : null;
    };
    this._onDown = (e) => {
      const midi = hit(e);
      if (midi == null) return;
      e.preventDefault();
      try { el.setPointerCapture(e.pointerId); } catch (err) { /* evenement simule */ }
      this.pointers.set(e.pointerId, midi);
      this.press(midi);
    };
    this._onMove = (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      const midi = hit(e);
      const prev = this.pointers.get(e.pointerId);
      if (midi === prev) return;
      if (prev != null) this.release(prev);
      this.pointers.set(e.pointerId, midi);
      if (midi != null) this.press(midi);
    };
    this._onUp = (e) => {
      if (!this.pointers.has(e.pointerId)) return;
      const midi = this.pointers.get(e.pointerId);
      this.pointers.delete(e.pointerId);
      if (midi != null) this.release(midi);
    };
    el.addEventListener('pointerdown', this._onDown);
    el.addEventListener('pointermove', this._onMove);
    el.addEventListener('pointerup', this._onUp);
    el.addEventListener('pointercancel', this._onUp);
  }

  colorFor(midi) {
    return isBlack(midi) ? VIOLET : midi % 12 === 0 ? PINK : CYAN;
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

  press(midi, velocity = 0.8) {
    const k = this.keys.get(midi);
    if (!k || this.pressed.has(midi)) return;
    this.pressed.add(midi);
    k.glow = 1;
    this.#paint(midi);
    const p = new THREE.Vector3(k.x, k.black ? 0.8 : 0.32, k.black ? -WHITE.l / 2 + 0.2 : -WHITE.l / 2 + 0.25);
    this.fx.start(midi, p, this.colorFor(midi), k.black ? 0.5 : 0.85);
    if (this.sound) noteOn(midi, velocity);
    this.onNoteOn?.(midi);
  }

  release(midi) {
    if (!this.pressed.has(midi)) return;
    this.pressed.delete(midi);
    this.fx.end(midi);
    this.#paint(midi);
    if (this.sound) noteOff(midi);
    this.onNoteOff?.(midi);
  }

  releaseAll() {
    [...this.pressed].forEach((m) => this.release(m));
  }

  tap(midi, ms = 400) {
    this.press(midi);
    setTimeout(() => this.release(midi), ms);
  }

  highlight(midi, color) {
    if (!this.keys.has(midi)) return;
    if (color) this.highlights.set(midi, new THREE.Color(color));
    else this.highlights.delete(midi);
    this.#paint(midi);
  }

  clearHighlights() {
    const list = [...this.highlights.keys()];
    this.highlights.clear();
    list.forEach((m) => this.#paint(m));
  }

  #paint(midi) {
    const k = this.keys.get(midi);
    const hl = this.highlights.get(midi);
    k.mat.color.copy(k.base);
    if (hl) k.mat.color.lerp(hl, k.black ? 0.6 : 0.55);
  }

  setLabelsVisible(v) {
    this.labels.forEach((l) => { l.visible = v; });
  }

  setView(view) {
    this.view = view;
    this.resize();
  }

  onFrame(fn) {
    this.frameHooks.add(fn);
    return () => this.frameHooks.delete(fn);
  }

  resize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    this.bloom.setSize(w, h);
    const cam = this.camera;
    cam.aspect = w / h;
    if (this.autoCamera) {
      const vfov = THREE.MathUtils.degToRad(cam.fov);
      const hfov = 2 * Math.atan(Math.tan(vfov / 2) * cam.aspect);
      const fitW = this.width + 5;
      const dist = Math.max((fitW / 2) / Math.tan(hfov / 2), 12);
      const VIEWS = {
        front: { dir: [0, 0.78, 1], target: [0, 1.2, 0], k: 1 },
        top: { dir: [0, 1, 0.12], target: [0, 0, 0.6], k: 1 },
        // Face au prof, en hauteur, legerement de cote
        teacher: { dir: [-34, 42, -58], target: [0, 0, 10], fixed: 80 },
        // Vue de l'eleve, au-dessus des mains du prof
        hands: { dir: [0, 1, 0.16], target: [0, 0, -0.5], k: 0.95 },
      };
      const v = VIEWS[this.view] || VIEWS.front;
      const dir = new THREE.Vector3(...v.dir).normalize();
      this.camTarget = new THREE.Vector3(...v.target);
      const d = v.fixed ? v.fixed * (cam.aspect < 1 ? 1.5 : cam.aspect < 1.4 ? 1.15 : 1) : dist * v.k;
      this.camBase = this.camTarget.clone().addScaledVector(dir, d);
      cam.position.copy(this.camBase);
      cam.lookAt(this.camTarget);
    }
    cam.updateProjectionMatrix();
  }

  #tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const t = this.clock.elapsedTime;
    const k = 1 - Math.exp(-dt * 40);
    for (const [midi, key] of this.keys) {
      const down = this.pressed.has(midi);
      const target = down ? (key.black ? PRESS_ANGLE.black : PRESS_ANGLE.white) : 0;
      if (Math.abs(key.angle - target) > 0.0001) {
        key.angle += (target - key.angle) * k;
        key.pivot.rotation.x = key.angle;
      }
      if (!down && key.glow > 0) key.glow = Math.max(0, key.glow - dt * 2.5);
      const c = this.colorFor(midi);
      key.mat.emissive.copy(c).multiplyScalar(key.glow * (key.black ? 2.5 : 1.4));
    }
    this.fx.update(dt);
    this.grid.material.opacity = 0.18 + Math.sin(t * 1.5) * 0.04;
    // Respiration legere de la camera
    if (this.autoCamera && this.camBase) {
      this.camera.position.set(this.camBase.x + Math.sin(t * 0.3) * 0.6, this.camBase.y + Math.sin(t * 0.4) * 0.25, this.camBase.z);
      this.camera.lookAt(this.camTarget);
    }
    this.frameHooks.forEach((fn) => fn(dt, t));
    this.bloom.render();
  }

  dispose() {
    this.releaseAll();
    this.renderer.setAnimationLoop(null);
    const el = this.renderer.domElement;
    if (this._onDown) {
      el.removeEventListener('pointerdown', this._onDown);
      el.removeEventListener('pointermove', this._onMove);
      el.removeEventListener('pointerup', this._onUp);
      el.removeEventListener('pointercancel', this._onUp);
    }
    this.fx.dispose();
    this.bloom.dispose();
    this.scene.traverse((o) => {
      o.geometry?.dispose();
      if (o.material) [].concat(o.material).forEach((m) => m.dispose());
    });
    this.renderer.dispose();
    el.remove();
  }
}
