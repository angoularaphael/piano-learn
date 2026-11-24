// Les notes qui arrivent : chaque note est une barre de lumiere qui glisse vers sa touche.
// Sa longueur, c'est sa duree. Main droite en cyan, main gauche en violet.
// Quand la barre touche le clavier, c'est le moment de jouer.
import * as THREE from 'three';
import { isBlack } from './notes.js';
import { STRIKE_Z, WHITE } from './piano3d.js';

const COLORS = {
  R: new THREE.Color('#3ef2ff'),
  L: new THREE.Color('#a98bff'),
};
const LANE_Y = WHITE.h / 2 + 0.12;
const AHEAD = 90;   // distance visible devant le clavier

export class Highway {
  constructor(piano, { speed = 5 } = {}) {
    this.piano = piano;
    this.speed = speed;            // unites par temps
    this.now = 0;
    this.group = new THREE.Group();
    piano.root.add(this.group);
    this.events = [];
    this.state = [];               // par note : 0 a venir, 1 jouee, 2 ratee
    this.bars = null;
    this.caps = null;
    this.geo = new THREE.BoxGeometry(1, 1, 1);
    this.mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.92, depthWrite: false });
    this.capMat = new THREE.MeshBasicMaterial({ color: '#ffffff', depthWrite: false });
    this.#buildLane();
    this.unhook = piano.onFrame(() => this.#update());
  }

  // La piste : un sol sombre, une ligne par do, et la ligne de frappe devant les touches
  #buildLane() {
    const W = this.piano.width + 1;
    const lane = new THREE.Mesh(
      new THREE.PlaneGeometry(W, AHEAD),
      new THREE.MeshBasicMaterial({ color: '#060918', transparent: true, opacity: 0.82, depthWrite: false })
    );
    lane.rotation.x = -Math.PI / 2;
    lane.position.set(0, LANE_Y - 0.13, STRIKE_Z - AHEAD / 2 - 0.2);
    this.group.add(lane);
    this.lane = lane;

    const pts = [];
    for (let m = this.piano.low; m <= this.piano.high; m++) {
      if (m % 12 !== 0 && m % 12 !== 5) continue;
      const x = this.piano.keyX(m) - 0.5;
      pts.push(x, LANE_Y - 0.12, STRIKE_Z - 0.3, x, LANE_Y - 0.12, STRIKE_Z - AHEAD);
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    this.lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: '#2b3a7a', transparent: true, opacity: 0.55, depthWrite: false }));
    this.group.add(this.lines);

    this.strike = new THREE.Mesh(
      new THREE.BoxGeometry(W, 0.05, 0.08),
      new THREE.MeshBasicMaterial({ color: new THREE.Color('#3ef2ff').multiplyScalar(2.4) })
    );
    this.strike.position.set(0, LANE_Y - 0.1, STRIKE_Z - 0.25);
    this.group.add(this.strike);
  }

  // Charge les notes d'une partition (js/score.js), pour les mains voulues
  load(score, hands = 'RL') {
    this.events = score.events.filter((e) => hands.includes(e.hand)).map((e) => ({ ...e }));
    this.state = this.events.map(() => 0);
    this.bars?.dispose?.();
    if (this.bars) { this.group.remove(this.bars, this.caps); }
    const n = Math.max(1, this.events.length);
    this.bars = new THREE.InstancedMesh(this.geo, this.mat, n);
    this.caps = new THREE.InstancedMesh(this.geo, this.capMat, n);
    this.bars.frustumCulled = false;
    this.caps.frustumCulled = false;
    this.bars.renderOrder = 4;
    this.caps.renderOrder = 5;
    const c = new THREE.Color();
    this.events.forEach((e, i) => {
      c.copy(COLORS[e.hand] || COLORS.R);
      if (isBlack(e.midi)) c.multiplyScalar(0.72);
      this.bars.setColorAt(i, c.clone().multiplyScalar(1.15));
      this.caps.setColorAt(i, c.clone().multiplyScalar(2.6));
    });
    this.group.add(this.bars, this.caps);
    this.#update();
  }

  setTime(beat) {
    this.now = beat;
  }

  mark(i, ok) {
    this.state[i] = ok ? 1 : 2;
  }

  #update() {
    if (!this.bars) return;
    const m4 = new THREE.Matrix4();
    const hidden = new THREE.Matrix4().makeScale(0, 0, 0);
    const pos = new THREE.Vector3();
    const q = new THREE.Quaternion();
    const scl = new THREE.Vector3();
    const sp = this.speed;
    const c = new THREE.Color();
    let colorDirty = false;
    this.events.forEach((e, i) => {
      const near = STRIKE_Z - (e.start - this.now) * sp;
      const far = STRIKE_Z - (e.start + e.dur - this.now) * sp + 0.22;
      const nearC = Math.min(near, STRIKE_Z - 0.25);
      if (far >= STRIKE_Z - 0.25 || nearC < STRIKE_Z - AHEAD || nearC <= far) {
        this.bars.setMatrixAt(i, hidden);
        this.caps.setMatrixAt(i, hidden);
        return;
      }
      const black = isBlack(e.midi);
      const x = this.piano.keyX(e.midi);
      const w = black ? 0.5 : 0.8;
      const len = nearC - far;
      pos.set(x, LANE_Y + (black ? 0.08 : 0), (nearC + far) / 2);
      scl.set(w, 0.22, len);
      m4.compose(pos, q, scl);
      this.bars.setMatrixAt(i, m4);
      pos.set(x, LANE_Y + (black ? 0.08 : 0) + 0.02, nearC - 0.06);
      scl.set(w + 0.04, 0.26, 0.12);
      m4.compose(pos, q, scl);
      this.caps.setMatrixAt(i, m4);
      // Note jouee : la barre devient verte ; ratee : elle s'eteint
      if (this.state[i] && !e._painted) {
        c.set(this.state[i] === 1 ? '#3dffa8' : '#3a3f5c');
        this.bars.setColorAt(i, c.clone().multiplyScalar(this.state[i] === 1 ? 1.3 : 1));
        this.caps.setColorAt(i, c.clone().multiplyScalar(this.state[i] === 1 ? 2.6 : 1));
        e._painted = true;
        colorDirty = true;
      }
    });
    this.bars.instanceMatrix.needsUpdate = true;
    this.caps.instanceMatrix.needsUpdate = true;
    if (colorDirty) {
      this.bars.instanceColor.needsUpdate = true;
      this.caps.instanceColor.needsUpdate = true;
    }
  }

  dispose() {
    this.unhook?.();
    this.piano.root.remove(this.group);
    this.group.traverse((o) => {
      if (o.geometry && o.geometry !== this.geo) o.geometry.dispose();
      if (o.material && o.material !== this.mat && o.material !== this.capMat) o.material.dispose();
    });
    this.bars?.dispose();
    this.caps?.dispose();
    this.geo.dispose();
    this.mat.dispose();
    this.capMat.dispose();
  }
}
