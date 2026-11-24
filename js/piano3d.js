// Piano 3D jouable (souris, tactile, clavier d'ordinateur)
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { isBlack, noteName } from './notes.js';
import { noteOn, noteOff } from './audio.js';

const WHITE = { w: 0.94, h: 0.6, l: 6 };
const BLACK = { w: 0.56, h: 0.5, l: 3.8 };
const PRESS_ANGLE = { white: 0.07, black: 0.08 };
const PRESS_TINT = new THREE.Color('#9cc3b6');

const labelCache = new Map();
function labelTexture(text, mark) {
  const key = text + (mark ? '*' : '');
  if (labelCache.has(key)) return labelCache.get(key);
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d');
  g.fillStyle = '#6b655c';
  g.font = '600 46px system-ui, sans-serif';
  g.textAlign = 'center';
  g.textBaseline = 'middle';
  g.fillText(text, 64, 56);
  if (mark) {
    g.fillStyle = '#c9a227';
    g.beginPath();
    g.arc(64, 104, 12, 0, Math.PI * 2);
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
    this.onNoteOn = opts.onNoteOn || null;
    this.onNoteOff = opts.onNoteOff || null;

    this.keys = new Map();        // midi -> { pivot, mesh, mat, base, black, angle }
    this.pressed = new Set();
    this.highlights = new Map();  // midi -> THREE.Color
    this.pointers = new Map();    // pointerId -> midi
    this.view = 'front';

    this.#setup();
    this.#buildKeys();
    this.#buildBody();
    this.#bindPointer();
    this.resize();

    this.clock = new THREE.Clock();
    this.renderer.setAnimationLoop(() => this.#tick());
  }

  #setup() {
    const r = new THREE.WebGLRenderer({ antialias: true, alpha: false });
    r.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    r.outputColorSpace = THREE.SRGBColorSpace;
    r.toneMapping = THREE.ACESFilmicToneMapping;
    r.toneMappingExposure = 1.05;
    r.shadowMap.enabled = true;
    r.shadowMap.type = THREE.PCFSoftShadowMap;
    this.container.appendChild(r.domElement);
    this.renderer = r;

    const scene = new THREE.Scene();
    scene.background = new THREE.Color('#e9e2d6');
    const pmrem = new THREE.PMREMGenerator(r);
    scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environmentIntensity = 0.45;
    this.scene = scene;

    this.camera = new THREE.PerspectiveCamera(32, 1, 0.1, 200);

    scene.add(new THREE.HemisphereLight('#fff8ee', '#8a7a66', 0.9));
    const sun = new THREE.DirectionalLight('#ffffff', 2.2);
    sun.position.set(-8, 18, 12);
    sun.castShadow = true;
    sun.shadow.mapSize.set(2048, 2048);
    sun.shadow.camera.left = -16;
    sun.shadow.camera.right = 16;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    sun.shadow.bias = -0.0005;
    sun.shadow.radius = 4;
    scene.add(sun);

    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(200, 200),
      new THREE.MeshStandardMaterial({ color: '#d9cfbf', roughness: 0.95 })
    );
    floor.rotation.x = -Math.PI / 2;
    floor.position.y = -6;
    floor.receiveShadow = true;
    scene.add(floor);

    this.root = new THREE.Group();
    scene.add(this.root);
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
      const base = new THREE.Color(p.black ? '#141414' : '#f7f4ec');
      const mat = new THREE.MeshPhysicalMaterial({
        color: base.clone(),
        roughness: p.black ? 0.28 : 0.32,
        clearcoat: p.black ? 0.8 : 0.35,
        clearcoatRoughness: 0.2,
        emissive: new THREE.Color('#000000'),
      });
      const mesh = new THREE.Mesh(p.black ? blackGeo : whiteGeo, mat);
      if (p.black) {
        mesh.position.set(0, WHITE.h / 2 + BLACK.h / 2 - 0.12, BLACK.l / 2);
      } else {
        mesh.position.set(0, 0, WHITE.l / 2);
      }
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
        label.position.set(0, WHITE.h / 2 + 0.002, WHITE.l - 0.75);
        pivot.add(label);
        this.labels.push(label);
      }

      this.root.add(pivot);
      this.keyMeshes.push(mesh);
      this.keys.set(p.midi, { pivot, mesh, mat, base, black: p.black, angle: 0 });
    }
  }

  #buildBody() {
    const W = this.width;
    const lacquer = new THREE.MeshPhysicalMaterial({ color: '#121110', roughness: 0.18, clearcoat: 1, clearcoatRoughness: 0.08 });
    const felt = new THREE.MeshStandardMaterial({ color: '#7a1f2b', roughness: 1 });
    const add = (geo, mat, x, y, z) => {
      const m = new THREE.Mesh(geo, mat);
      m.position.set(x, y, z);
      m.castShadow = true;
      m.receiveShadow = true;
      this.root.add(m);
      return m;
    };

    // Lit des touches
    add(new THREE.BoxGeometry(W + 0.4, 0.5, WHITE.l + 0.6), lacquer, 0, -0.62, 0.1);
    // Bande de feutre au fond des touches
    add(new THREE.BoxGeometry(W + 0.2, 0.7, 0.12), felt, 0, 0.2, -WHITE.l / 2 - 0.06);
    // Joues sur les cotes
    const cheek = new RoundedBoxGeometry(0.9, 1.6, WHITE.l + 1.4, 3, 0.12);
    add(cheek, lacquer, -(W / 2 + 0.65), -0.1, 0.3);
    add(cheek, lacquer, W / 2 + 0.65, -0.1, 0.3);
    // Meuble du piano droit
    add(new RoundedBoxGeometry(W + 2.2, 8, 2.6, 4, 0.15), lacquer, 0, 3.4, -WHITE.l / 2 - 1.42);
    // Pupitre
    const desk = add(new RoundedBoxGeometry(W * 0.55, 2.2, 0.15, 2, 0.05), lacquer, 0, 2.2, -WHITE.l / 2 - 0.15);
    desk.rotation.x = -0.18;
    // Pieds
    const leg = new RoundedBoxGeometry(0.8, 5.4, 1, 3, 0.12);
    add(leg, lacquer, -(W / 2 + 0.65), -3.6, 2.4);
    add(leg, lacquer, W / 2 + 0.65, -3.6, 2.4);
    add(new RoundedBoxGeometry(W + 2.2, 5.6, 2.4, 3, 0.12), lacquer, 0, -3.5, -WHITE.l / 2 - 1.3);
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
      el.setPointerCapture(e.pointerId);
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

  press(midi, velocity = 0.8) {
    if (!this.keys.has(midi) || this.pressed.has(midi)) return;
    this.pressed.add(midi);
    this.#paint(midi);
    if (this.sound) noteOn(midi, velocity);
    this.onNoteOn?.(midi);
  }

  release(midi) {
    if (!this.pressed.has(midi)) return;
    this.pressed.delete(midi);
    this.#paint(midi);
    if (this.sound) noteOff(midi);
    this.onNoteOff?.(midi);
  }

  releaseAll() {
    [...this.pressed].forEach((m) => this.release(m));
  }

  // Le prof (ou une lecon) peut jouer une note pendant une duree donnee
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
    const isDown = this.pressed.has(midi);
    k.mat.color.copy(k.base);
    k.mat.emissive.set('#000000');
    if (hl) {
      k.mat.color.lerp(hl, k.black ? 0.7 : 0.6);
      k.mat.emissive.copy(hl).multiplyScalar(k.black ? 0.35 : 0.15);
    } else if (isDown) {
      k.mat.color.lerp(PRESS_TINT, k.black ? 0.35 : 0.45);
    }
  }

  setLabelsVisible(v) {
    this.labels.forEach((l) => { l.visible = v; });
  }

  setView(view) {
    this.view = view;
    this.resize();
  }

  // Cadre la camera pour que tout le clavier rentre dans l'ecran
  resize() {
    const w = this.container.clientWidth || 1;
    const h = this.container.clientHeight || 1;
    this.renderer.setSize(w, h, false);
    const cam = this.camera;
    cam.aspect = w / h;

    const vfov = THREE.MathUtils.degToRad(cam.fov);
    const hfov = 2 * Math.atan(Math.tan(vfov / 2) * cam.aspect);
    const fitW = this.width + 5;
    const dist = Math.max((fitW / 2) / Math.tan(hfov / 2), 9);

    const dir = this.view === 'top'
      ? new THREE.Vector3(0, 1, 0.12).normalize()
      : new THREE.Vector3(0, 0.82, 1).normalize();
    const target = new THREE.Vector3(0, 0, this.view === 'top' ? 0.6 : 0.2);
    cam.position.copy(target).addScaledVector(dir, dist);
    cam.lookAt(target);
    cam.updateProjectionMatrix();
  }

  #tick() {
    const dt = Math.min(this.clock.getDelta(), 0.05);
    const k = 1 - Math.exp(-dt * 40);
    for (const [midi, key] of this.keys) {
      const target = this.pressed.has(midi) ? (key.black ? PRESS_ANGLE.black : PRESS_ANGLE.white) : 0;
      if (Math.abs(key.angle - target) > 0.0001) {
        key.angle += (target - key.angle) * k;
        key.pivot.rotation.x = key.angle;
      }
    }
    this.renderer.render(this.scene, this.camera);
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
    this.scene.traverse((o) => {
      o.geometry?.dispose();
      if (o.material) [].concat(o.material).forEach((m) => m.dispose());
    });
    this.renderer.dispose();
    el.remove();
  }
}
