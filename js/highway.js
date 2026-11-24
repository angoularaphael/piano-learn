// Les notes qui arrivent, comme sur le rouleau d'un piano mecanique (pianola) : une bande de papier
// defile vers le clavier, chaque note y est un trait de la couleur du crayon (vermillon a droite,
// bleu a gauche) dont la longueur est la duree. Quand le trait atteint la barre de laiton, on joue.
import * as THREE from 'three';
import { isBlack } from './notes.js';
import { STRIKE_Z, WHITE } from './piano3d.js';
import { PAL } from './palette.js';

const LANE_Y = WHITE.h / 2 + 0.12;
const AHEAD = 90;   // distance visible devant le clavier

export class Highway {
  constructor(piano, { speed = 5 } = {}) {
    this.piano = piano;
    this.colors = { R: new THREE.Color(PAL.right), L: new THREE.Color(PAL.left) };
    this.speed = speed;            // unites par temps
    this.now = 0;
    this.group = new THREE.Group();
    piano.root.add(this.group);
    this.events = [];
    this.state = [];               // par note : 0 a venir, 1 jouee, 2 ratee
    this.bars = null;
    this.caps = null;
    this.geo = new THREE.BoxGeometry(1, 1, 1);
    // Le rouleau se pose par-dessus la caisse : au piano a queue, le pupitre et le couvercle le cacheraient
    this.mat = new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0.9, depthWrite: false, depthTest: false, toneMapped: false });
    this.capMat = new THREE.MeshBasicMaterial({ color: '#ffffff', depthWrite: false, depthTest: false, toneMapped: false });
    this.#buildLane();
    this.unhook = piano.onFrame(() => this.#update());
  }

  // Le rouleau : une bande de papier, un trait par do et par fa, la barre de laiton devant les touches
  #buildLane() {
    const W = this.piano.width + 1;
    const lane = new THREE.Mesh(
      new THREE.PlaneGeometry(W, AHEAD),
      // Dans la passe transparente, apres les cordes du piano a queue : rien ne transparait a travers
      new THREE.MeshBasicMaterial({ color: PAL.paperHi, transparent: true, opacity: 1, depthWrite: false, depthTest: false, toneMapped: false })
    );
    lane.renderOrder = 1;
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
    this.lines = new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color: PAL.ink, transparent: true, opacity: 0.16, depthWrite: false, depthTest: false }));
    this.lines.renderOrder = 2;
    this.group.add(this.lines);
    // Les bords du rouleau
    const edge = new THREE.MeshBasicMaterial({ color: PAL.ink, transparent: true, opacity: 0.5, depthWrite: false, depthTest: false });
    for (const sx of [-1, 1]) {
      const b = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.01, AHEAD), edge);
      b.position.set(sx * W / 2, LANE_Y - 0.12, STRIKE_Z - AHEAD / 2 - 0.2);
      this.group.add(b);
    }

    // La barre de lecture, en laiton, comme celle d'un pianola
    this.strike = new THREE.Mesh(
      new THREE.BoxGeometry(W + 0.4, 0.12, 0.16),
      new THREE.MeshStandardMaterial({ color: PAL.brass, roughness: 0.32, metalness: 0.85, transparent: true, opacity: 1, depthTest: false })
    );
    this.strike.renderOrder = 6;
    this.strike.position.set(0, LANE_Y - 0.08, STRIKE_Z - 0.25);
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
      c.copy(this.colors[e.hand] || this.colors.R);
      // Les touches noires : le meme crayon, appuye plus fort
      if (isBlack(e.midi)) c.multiplyScalar(0.7);
      this.bars.setColorAt(i, c);
      this.caps.setColorAt(i, c.clone().multiplyScalar(0.55));
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
      pos.set(x, LANE_Y + (black ? 0.04 : 0) - 0.05, (nearC + far) / 2);
      scl.set(w, 0.08, len);
      m4.compose(pos, q, scl);
      this.bars.setMatrixAt(i, m4);
      pos.set(x, LANE_Y + (black ? 0.04 : 0) - 0.04, nearC - 0.06);
      scl.set(w, 0.1, 0.14);
      m4.compose(pos, q, scl);
      this.caps.setMatrixAt(i, m4);
      // Note jouee : le trait passe au vert ; ratee : il reste en gris de crayon
      if (this.state[i] && !e._painted) {
        c.set(this.state[i] === 1 ? PAL.ok : PAL.graphite);
        this.bars.setColorAt(i, c);
        this.caps.setColorAt(i, c.clone().multiplyScalar(this.state[i] === 1 ? 0.7 : 0.85));
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
