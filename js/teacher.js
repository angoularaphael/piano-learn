// Le prof 3D : un robot assis au piano qui joue avec les bons doigts.
// Pose procedurale : on part de la pose de repos a chaque image, on assoit le
// corps, puis on place poignets et doigts sur les touches (IK en espace monde).
import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { isBlack } from './notes.js';

const MODEL_URL = 'https://cdn.jsdelivr.net/gh/mrdoob/three.js@r170/examples/models/gltf/Xbot.glb';
const M = 42.5; // unites du piano par metre (1 touche blanche = 2,35 cm)

const FINGERS = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];

const _a = new THREE.Vector3();
const _b = new THREE.Vector3();
const _c = new THREE.Vector3();
const _q = new THREE.Quaternion();
const _wq = new THREE.Quaternion();
const _pq = new THREE.Quaternion();

function wpos(bone, out = new THREE.Vector3()) {
  return bone.getWorldPosition(out);
}

// Applique une rotation exprimee en espace monde a un os
function rotateWorld(bone, qDelta) {
  bone.getWorldQuaternion(_wq);
  _wq.premultiply(qDelta);
  bone.parent.getWorldQuaternion(_pq);
  bone.quaternion.copy(_pq.invert().multiply(_wq));
  bone.updateMatrixWorld(true);
}

// Oriente un os pour que la direction os -> enfant suive dir (monde)
function pointBone(bone, child, dir, amount = 1) {
  wpos(bone, _a);
  wpos(child, _b).sub(_a).normalize();
  _q.setFromUnitVectors(_b, _c.copy(dir).normalize());
  if (amount < 1) _q.slerp(new THREE.Quaternion(), 1 - amount);
  rotateWorld(bone, _q);
}

// Oriente un os avec deux directions : avant (vers childA) et cote (de sideFrom vers sideTo)
function orientBone(bone, childA, fwd, sideFrom, sideTo, side) {
  pointBone(bone, childA, fwd);
  wpos(bone, _a);
  const f = wpos(childA, new THREE.Vector3()).sub(_a).normalize();
  const s = wpos(sideTo, new THREE.Vector3()).sub(wpos(sideFrom, new THREE.Vector3()));
  s.addScaledVector(f, -s.dot(f)).normalize();
  const want = side.clone().addScaledVector(f, -side.dot(f)).normalize();
  const angle = Math.atan2(_c.crossVectors(s, want).dot(f), s.dot(want));
  _q.setFromAxisAngle(f, angle);
  rotateWorld(bone, _q);
}

// CCD : amene l'effecteur sur la cible en tournant les maillons (du plus proche au plus loin)
function ccd(links, effector, target, iterations = 12, maxStep = 0.6) {
  for (let it = 0; it < iterations; it++) {
    for (const link of links) {
      wpos(link, _a);
      wpos(effector, _b).sub(_a);
      _c.copy(target).sub(_a);
      if (_b.lengthSq() < 1e-8 || _c.lengthSq() < 1e-8) continue;
      _b.normalize(); _c.normalize();
      _q.setFromUnitVectors(_b, _c);
      const ang = 2 * Math.acos(Math.min(1, Math.abs(_q.w)));
      if (ang > maxStep) _q.slerp(new THREE.Quaternion(), 1 - maxStep / ang);
      rotateWorld(link, _q);
    }
    if (wpos(effector, _b).distanceTo(target) < 0.05) break;
  }
}

export class Teacher {
  static async load(piano) {
    const gltf = await new GLTFLoader().loadAsync(MODEL_URL);
    return new Teacher(piano, gltf.scene);
  }

  constructor(piano, model) {
    this.piano = piano;
    this.model = model;
    this.time = 0;
    this.nodT = 0;
    this.shakeT = 0;
    this.look = new THREE.Vector3(0, 0, 0);
    this.lookTarget = new THREE.Vector3(0, 0, 0);

    // Materiaux : coque sombre et articulations lumineuses
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = true;
      o.receiveShadow = true;
      o.frustumCulled = false;
      if (o.material.name.includes('Joints')) {
        o.material = new THREE.MeshPhysicalMaterial({ color: '#0e1430', emissive: new THREE.Color('#3ef2ff'), emissiveIntensity: 0.22, roughness: 0.3, metalness: 0.4, clearcoat: 1 });
      } else {
        o.material = new THREE.MeshPhysicalMaterial({ color: '#c9d2ea', metalness: 0.15, roughness: 0.35, clearcoat: 1, clearcoatRoughness: 0.1, iridescence: 0.6, iridescenceIOR: 1.4 });
      }
    });

    this.bones = {};
    model.traverse((o) => { if (o.isBone) this.bones[o.name.replace('mixamorig', '')] = o; });
    this.rest = new Map();
    Object.values(this.bones).forEach((b) => this.rest.set(b, b.quaternion.clone()));

    // Assis face au piano, entre les deux mains
    model.scale.setScalar(M);
    model.rotation.y = Math.PI;
    piano.root.add(model);
    model.updateMatrixWorld(true);
    const hips = wpos(this.bones.Hips, new THREE.Vector3());
    this.hipsTarget = new THREE.Vector3(0, -6.6, 21.5);
    model.position.add(this.hipsTarget.clone().sub(hips));
    model.updateMatrixWorld(true);
    this.restHips = this.bones.Hips.position.clone();

    // Banc
    const floorY = piano.floorY;
    const seatY = this.hipsTarget.y - 3.6;
    const benchMat = new THREE.MeshPhysicalMaterial({ color: '#07080f', roughness: 0.2, metalness: 0.5, clearcoat: 1 });
    const bench = new THREE.Group();
    const top = new THREE.Mesh(new THREE.BoxGeometry(26, 2, 14), benchMat);
    top.position.y = seatY - 1;
    const legH = seatY - 2 - floorY;
    [[-11, -5], [11, -5], [-11, 5], [11, 5]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(1.2, legH, 1.2), benchMat);
      leg.position.set(x, floorY + legH / 2, z);
      bench.add(leg);
    });
    const led = new THREE.Mesh(new THREE.BoxGeometry(26.2, 0.15, 0.15), new THREE.MeshBasicMaterial({ color: new THREE.Color('#8b5cff').multiplyScalar(3) }));
    led.position.set(0, seatY - 2, -7.05);
    bench.add(top, led);
    bench.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    bench.position.set(0, 0, this.hipsTarget.z + 1.5);
    piano.root.add(bench);
    this.bench = bench;

    // Eclairage du prof : douche de lumiere devant, liseré violet derriere
    const spot = new THREE.SpotLight('#dfe8ff', 900, 160, 0.5, 0.6, 1.4);
    spot.position.set(-20, 70, -30);
    spot.target.position.set(0, 0, 16);
    const rim = new THREE.PointLight('#8b5cff', 260, 70, 1.6);
    rim.position.set(14, 30, 40);
    bench.add(spot, spot.target, rim);
    spot.position.z -= bench.position.z;
    spot.target.position.z -= bench.position.z;
    rim.position.z -= bench.position.z;

    // Etat des mains : position du poignet et appui de chaque doigt
    const mk = (side) => ({
      side,
      base: side === 'Right' ? 60 : 48,     // note sous le pouce (droite) ou l'auriculaire (gauche)
      wrist: new THREE.Vector3(),
      wristTarget: new THREE.Vector3(),
      press: [0, 0, 0, 0, 0],
      pressTarget: [0, 0, 0, 0, 0],
      fingerKey: [null, null, null, null, null],
      active: false,
    });
    this.hands = { Right: mk('Right'), Left: mk('Left') };
    this.#placeHand(this.hands.Right, 60, true);
    this.#placeHand(this.hands.Left, 48, true);

    this.unhook = piano.onFrame((dt) => this.update(dt));
  }

  // ---------- Placement des mains ----------
  // Une main couvre 5 touches blanches a partir de base
  #whiteKeysFrom(base, count) {
    const out = [];
    let m = base;
    while (out.length < count) {
      if (!isBlack(m)) out.push(m);
      m++;
    }
    return out;
  }

  #placeHand(hand, base, instant = false) {
    hand.base = base;
    const whites = this.#whiteKeysFrom(base, 5);
    // Doigt i (pouce = 0) : a droite le pouce est sur la touche la plus grave, a gauche sur la plus aigue
    hand.fingerKey = FINGERS.map((_, i) => (hand.side === 'Right' ? whites[i] : whites[4 - i]));
    const mid = this.piano.keyTop(whites[2], 0.7);
    if (!mid) return;
    hand.wristTarget.set(mid.x + (hand.side === 'Right' ? -0.6 : 0.6), mid.y + 2.6, mid.z + 6.2);
    if (instant) hand.wrist.copy(hand.wristTarget);
  }

  // Choisit la main et le doigt pour une note, et deplace la main si besoin
  #fingerFor(midi) {
    const handName = midi >= 60 ? 'Right' : 'Left';
    const hand = this.hands[handName];
    let f = hand.fingerKey.indexOf(midi);
    if (f === -1 && isBlack(midi)) {
      // Touche noire : le doigt de la touche blanche juste en dessous, ou au-dessus
      f = hand.fingerKey.indexOf(midi - 1);
      if (f === -1) f = hand.fingerKey.indexOf(midi + 1);
      if (f === 0 && hand.side === 'Right') f = 1; // le pouce evite les touches noires
    }
    if (f === -1) {
      // La note sort de la position : on deplace la main
      let base = midi;
      if (isBlack(base)) base -= 1;
      if (handName === 'Right') {
        if (midi < hand.base) base = isBlack(midi) ? midi - 1 : midi;
        else { base = this.#whiteKeysFrom(midi, 1)[0]; for (let k = 0; k < 4; k++) { base--; while (isBlack(base)) base--; } }
      } else {
        if (midi > hand.base + 7) { base = midi; for (let k = 0; k < 4; k++) { base--; while (isBlack(base)) base--; } }
        else base = isBlack(midi) ? midi - 1 : midi;
      }
      this.#placeHand(hand, Math.max(this.piano.low, base));
      f = hand.fingerKey.indexOf(isBlack(midi) ? midi - 1 : midi);
      if (f === -1) f = 2;
    }
    return { hand, finger: f };
  }

  // ---------- Jeu ----------
  // Joue une note : la main se place, le doigt descend, la touche sonne
  playNote(midi, ms = 450) {
    const { hand, finger } = this.#fingerFor(midi);
    hand.active = true;
    hand.fingerKey[finger] = midi;
    hand.pressTarget[finger] = 1;
    this.lookTarget.copy(this.piano.keyTop(midi) || this.lookTarget);
    const travel = hand.wrist.distanceTo(hand.wristTarget) > 0.5 ? 180 : 90;
    setTimeout(() => this.piano.press(midi), travel);
    setTimeout(() => {
      this.piano.release(midi);
      hand.pressTarget[finger] = 0;
    }, travel + ms);
    return travel + ms;
  }

  async playSequence(notes, { tempo = 90, onNote } = {}) {
    this.stopped = false;
    const beat = 60000 / tempo;
    for (let i = 0; i < notes.length; i++) {
      if (this.stopped) return false;
      const [midi, beats = 1] = notes[i];
      onNote?.(i, midi);
      if (midi != null) this.playNote(midi, beats * beat * 0.85);
      await new Promise((r) => setTimeout(r, beats * beat));
    }
    return !this.stopped;
  }

  stop() {
    this.stopped = true;
  }

  nod() { this.nodT = 1; }
  shake() { this.shakeT = 1; }

  // ---------- Pose a chaque image ----------
  update(dt) {
    this.time += dt;
    const b = this.bones;
    const t = this.time;

    // Repos
    for (const [bone, q] of this.rest) bone.quaternion.copy(q);
    b.Hips.position.copy(this.restHips);
    b.Hips.position.y += Math.sin(t * 1.6) * 0.002; // respiration
    this.model.updateMatrixWorld(true);

    const fwd = new THREE.Vector3(0, 0, -1);
    const V = (x, y, z) => new THREE.Vector3(x, y, z);

    // Jambes : cuisses vers l'avant, tibias vers le bas
    pointBone(b.LeftUpLeg, b.LeftLeg, V(-0.18, -0.12, -1));
    pointBone(b.RightUpLeg, b.RightLeg, V(0.18, -0.12, -1));
    pointBone(b.LeftLeg, b.LeftFoot, V(-0.05, -1, -0.25));
    pointBone(b.RightLeg, b.RightFoot, V(0.05, -1, -0.25));
    pointBone(b.LeftFoot, b.LeftToeBase, V(0, -0.35, -1));
    pointBone(b.RightFoot, b.RightToeBase, V(0, -0.35, -1));

    // Buste penche vers le clavier, avec respiration
    const breathe = Math.sin(t * 1.6) * 0.015;
    pointBone(b.Spine, b.Spine1, V(0, 1, -0.12 - breathe));
    pointBone(b.Spine1, b.Spine2, V(0, 1, -0.14));
    pointBone(b.Spine2, b.Neck, V(0, 1, -0.12));

    // Tete : regarde la touche jouee, hoche ou secoue la tete
    this.look.lerp(this.lookTarget, 1 - Math.exp(-dt * 4));
    const head = wpos(b.Head, new THREE.Vector3());
    const lookDir = this.piano.root.localToWorld(this.look.clone()).sub(head).normalize();
    const neckDir = lookDir.clone().lerp(V(0, 1, 0), 0.55).normalize();
    if (this.nodT > 0) { this.nodT = Math.max(0, this.nodT - dt * 1.4); neckDir.z -= Math.sin(this.nodT * Math.PI * 4) * 0.25; }
    if (this.shakeT > 0) { this.shakeT = Math.max(0, this.shakeT - dt * 1.2); neckDir.x += Math.sin(this.shakeT * Math.PI * 6) * 0.3; }
    pointBone(b.Neck, b.Head, neckDir);
    pointBone(b.Head, b.HeadTop_End, neckDir.clone().lerp(lookDir, 0.3).normalize());

    // Mains
    for (const hand of Object.values(this.hands)) this.#poseHand(hand, dt);
  }

  #poseHand(hand, dt) {
    const b = this.bones;
    const S = hand.side;
    const sgn = S === 'Right' ? 1 : -1;
    const root = this.piano.root;

    hand.wrist.lerp(hand.wristTarget, 1 - Math.exp(-dt * 14));
    for (let i = 0; i < 5; i++) {
      const target = hand.pressTarget[i];
      hand.press[i] += (target - hand.press[i]) * (1 - Math.exp(-dt * (target ? 30 : 16)));
    }

    // Pose de depart des bras (coude vers l'exterieur et vers le bas)
    pointBone(b[`${S}Shoulder`], b[`${S}Arm`], new THREE.Vector3(sgn, -0.1, -0.15), 0.6);
    pointBone(b[`${S}Arm`], b[`${S}ForeArm`], new THREE.Vector3(sgn * 0.45, -0.85, -0.25));
    pointBone(b[`${S}ForeArm`], b[`${S}Hand`], new THREE.Vector3(-sgn * 0.1, -0.1, -1));

    // Poignet sur sa cible
    const wristWorld = root.localToWorld(hand.wrist.clone());
    ccd([b[`${S}ForeArm`], b[`${S}Arm`]], b[`${S}Hand`], wristWorld, 14);

    // Main a plat, doigts vers le clavier
    const side = new THREE.Vector3(S === 'Right' ? 1 : -1, 0, 0);
    orientBone(b[`${S}Hand`], b[`${S}HandMiddle1`], new THREE.Vector3(0, -0.28, -1), b[`${S}HandIndex1`], b[`${S}HandPinky1`], side);

    // Doigts : arrondis au-dessus des touches, celui qui joue descend sur la sienne
    FINGERS.forEach((name, i) => {
      const f1 = b[`${S}Hand${name}1`], f2 = b[`${S}Hand${name}2`], f3 = b[`${S}Hand${name}3`], f4 = b[`${S}Hand${name}4`];
      if (name === 'Thumb') {
        pointBone(f1, f2, new THREE.Vector3(-sgn * 0.5, -0.5, -0.8));
        pointBone(f2, f3, new THREE.Vector3(-sgn * 0.15, -0.6, -1));
        pointBone(f3, f4, new THREE.Vector3(0, -0.9, -1));
      } else {
        pointBone(f1, f2, new THREE.Vector3(0, -0.35, -1));
        pointBone(f2, f3, new THREE.Vector3(0, -1, -0.9));
        pointBone(f3, f4, new THREE.Vector3(0, -1.6, -0.5));
      }
      const midi = hand.fingerKey[i];
      if (midi == null) return;
      const top = this.piano.keyTop(midi, isBlack(midi) ? 0.75 : 0.8);
      if (!top) return;
      const p = hand.press[i];
      top.y += 0.9 * (1 - p) - 0.35 * p;
      const tgt = root.localToWorld(top);
      const tip = wpos(f4, new THREE.Vector3());
      // Les doigts au repos ne vont pas plus bas que leur hauteur naturelle
      if (p < 0.02 && tip.y > tgt.y) return;
      ccd([f3, f2, f1], f4, tgt, 6, 0.5);
    });
  }

  dispose() {
    this.unhook?.();
    this.piano.root.remove(this.model);
    this.piano.root.remove(this.bench);
    this.bench.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
    this.model.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
  }
}
