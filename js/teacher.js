// Le prof 3D : un mannequin de porcelaine assis au piano, qui joue avec les bons doigts.
// Son corps est fait maison (teacher-body.js). Pose procedurale : on part de la pose de repos
// a chaque image, on assoit le corps, puis on place poignets et doigts sur les touches
// (IK en espace monde). Il regarde la touche jouee, ou l'eleve quand il lui parle.
import * as THREE from 'three';
import { isBlack } from './notes.js';
import { buildTeacherBody, FINGERS, HAND_COLOR, GLOW } from './teacher-body.js';
import { PAL } from './palette.js';

const M = 42.5; // unites du piano par metre (1 touche blanche = 2,35 cm)
const RED = new THREE.Color(PAL.right); // le crayon rouge : le temps qui tombe, l'oreille qui ecoute

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

// Donne a un os une orientation exprimee en espace monde
function setWorldQuat(bone, q) {
  bone.parent.getWorldQuaternion(_pq);
  bone.quaternion.copy(_pq.invert().multiply(q));
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

// Le corps est construit une seule fois et garde pour toutes les lecons
let model = null;
export function preloadTeacher() {
  if (!model) {
    model = buildTeacherBody();
    model.userData.hips = model.userData.body.bones.Hips.position.clone();
  }
  return Promise.resolve(model);
}

export class Teacher {
  static async load(piano, opts) {
    const model = await preloadTeacher();
    return new Teacher(piano, model, opts);
  }

  constructor(piano, model, { main = 'deux' } = {}) {
    this.piano = piano;
    this.model = model;
    this.main = main;
    this.time = 0;
    this.nodT = 0;
    this.shakeT = 0;
    this.look = new THREE.Vector3(0, 0, 0);
    this.lookTarget = new THREE.Vector3(0, 0, 0);
    this.lastActive = -1e9;     // dernier geste au clavier (sinon il regarde l'eleve)
    this.beat = null;           // { t0, ms } pendant qu'il joue : le collier bat la mesure
    this.playing = false;
    this.ears = null;           // niveau du micro quand il t'ecoute (null = il n'ecoute pas)
    this.earLevel = 0;

    const shadows = piano.shadows;
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = shadows && !o.userData.noShadow;
      o.receiveShadow = shadows;
    });

    this.body = model.userData.body;
    this.bones = this.body.bones;
    // Pose de repos : tous les os sont droits (rotation nulle), seule leur position compte
    this.rest = new Map();
    Object.values(this.bones).forEach((b) => {
      b.quaternion.identity();
      this.rest.set(b, new THREE.Quaternion());
    });
    this.bones.Hips.position.copy(model.userData.hips);

    // Assis face au piano, entre les deux mains
    model.position.set(0, 0, 0);
    model.scale.setScalar(M);
    model.rotation.set(0, Math.PI, 0);
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
    // Le banc du piano : ebene vernie comme la caisse, assise de cuir capitonne
    const benchMat = new THREE.MeshStandardMaterial({ color: '#17120f', roughness: 0.32, metalness: 0.05 });
    const leather = new THREE.MeshStandardMaterial({ color: '#2a201b', roughness: 0.68, metalness: 0 });
    const bench = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(26, 1.2, 14), benchMat);
    frame.position.y = seatY - 1.4;
    const top = new THREE.Mesh(new THREE.BoxGeometry(25.2, 1.2, 13.2), leather);
    top.position.y = seatY - 0.4;
    const legH = seatY - 2 - floorY;
    [[-11, -5], [11, -5], [-11, 5], [11, 5]].forEach(([x, z]) => {
      const leg = new THREE.Mesh(new THREE.BoxGeometry(1.2, legH, 1.2), benchMat);
      leg.position.set(x, floorY + legH / 2, z);
      bench.add(leg);
    });
    bench.add(frame, top);
    bench.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
    bench.position.set(0, 0, this.hipsTarget.z + 1.5);
    piano.root.add(bench);
    this.bench = bench;

    // Eclairage du prof : une lampe de studio chaude, au-dessus et devant lui
    const spot = new THREE.SpotLight('#fff1de', 300, 160, 0.45, 0.8, 1.4);
    spot.position.set(-20, 70, -30);
    spot.target.position.set(0, 0, 16);
    bench.add(spot, spot.target);
    spot.position.z -= bench.position.z;
    spot.target.position.z -= bench.position.z;

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
      resting: false,
    });
    this.hands = { Right: mk('Right'), Left: mk('Left') };
    this.#placeHand(this.hands.Right, 60, true);
    this.#placeHand(this.hands.Left, 48, true);
    if (main === 'droite') this.restHand('Left', true);
    if (main === 'gauche') this.restHand('Right', true);

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
    if (!mid) {
      // Les touches de cette main ne sont pas sur le clavier : elle se pose sur le genou
      this.restHand(hand.side, instant);
      return;
    }
    hand.resting = false;
    hand.wristTarget.set(mid.x + (hand.side === 'Right' ? -0.6 : 0.6), mid.y + 2.6, mid.z + 6.2);
    if (instant) hand.wrist.copy(hand.wristTarget);
  }

  // Main au repos, posee sur la cuisse
  restHand(side, instant = false) {
    const hand = this.hands[side];
    hand.resting = true;
    hand.pressTarget = [0, 0, 0, 0, 0];
    const sgn = side === 'Right' ? 1 : -1;
    hand.wristTarget.set(sgn * 6.2, this.hipsTarget.y + 3.4, this.hipsTarget.z - 8.5);
    if (instant) hand.wrist.copy(hand.wristTarget);
  }

  // Place la main pour que tel doigt tombe sur telle note (doigtes de la partition)
  #placeForFinger(hand, midi, finger) {
    const f = finger - 1;
    if (hand.fingerKey[f] === midi && !hand.resting) return;
    const anchor = isBlack(midi) ? midi - 1 : midi;
    if (hand.fingerKey[f] === anchor && !hand.resting) { hand.fingerKey[f] = midi; return; }
    const step = hand.side === 'Right' ? -1 : 1;
    let thumb = anchor;
    for (let i = 0; i < f; i++) { thumb += step; while (isBlack(thumb)) thumb += step; }
    let base = thumb;
    if (hand.side === 'Left') { for (let i = 0; i < 4; i++) { base--; while (isBlack(base)) base--; } }
    this.#placeHand(hand, base);
    hand.fingerKey[f] = midi;
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
  playNote(midi, ms = 450, { hand: handName, finger: fingerNum, velocity = 0.8 } = {}) {
    let hand;
    let finger;
    if (handName && fingerNum) {
      hand = this.hands[handName === 'L' ? 'Left' : 'Right'];
      this.#placeForFinger(hand, midi, fingerNum);
      finger = fingerNum - 1;
    } else {
      ({ hand, finger } = this.#fingerFor(midi));
    }
    hand.active = true;
    hand.resting = false;
    hand.fingerKey[finger] = midi;
    hand.pressTarget[finger] = 1;
    this.lookTarget.copy(this.piano.keyTop(midi) || this.lookTarget);
    this.lastActive = performance.now();
    const travel = hand.wrist.distanceTo(hand.wristTarget) > 0.5 ? 180 : 90;
    setTimeout(() => this.piano.press(midi, velocity, { teacher: true }), travel);
    setTimeout(() => {
      this.piano.release(midi);
      hand.pressTarget[finger] = 0;
    }, travel + ms);
    return travel + ms;
  }

  async playSequence(notes, { tempo = 90, onNote } = {}) {
    let t = 0;
    const steps = [];
    notes.forEach(([midi, beats = 1]) => {
      if (midi != null) steps.push({ start: t, notes: [{ midi, dur: beats, finger: null, hand: midi >= 60 ? 'R' : 'L' }] });
      t += beats;
    });
    return this.playScore(steps, { tempo, onStep: onNote, total: t });
  }

  // Joue une partition (etapes de js/score.js) au tempo voulu
  async playScore(steps, { tempo = 90, onStep, total } = {}) {
    this.stopped = false;
    const beat = 60000 / tempo;
    const t0 = performance.now() + 120;
    this.beat = { t0, ms: beat };
    this.playing = true;
    const done = (v) => { this.beat = null; this.playing = false; return v; };
    for (let i = 0; i < steps.length; i++) {
      const st = steps[i];
      const wait = t0 + st.start * beat - performance.now();
      if (wait > 0) await new Promise((r) => { this.timer = setTimeout(r, wait); });
      if (this.stopped) return done(false);
      onStep?.(i, st);
      st.notes.forEach((n) => this.playNote(n.midi, Math.max(120, n.dur * beat * 0.88 - 90), { hand: n.hand, finger: n.finger }));
    }
    const end = steps.length ? steps[steps.length - 1] : null;
    const last = total ?? (end ? end.start + Math.max(...end.notes.map((n) => n.dur)) : 0);
    const tail = t0 + last * beat - performance.now();
    if (tail > 0) await new Promise((r) => { this.timer = setTimeout(r, tail); });
    if (!this.stopped && this.main === 'droite') this.restHand('Left');
    if (!this.stopped && this.main === 'gauche') this.restHand('Right');
    return done(!this.stopped);
  }

  stop() {
    this.stopped = true;
    clearTimeout(this.timer);
  }

  // Numero du doigt (1 = pouce) pour une note, d'apres la position actuelle des mains
  fingerHint(midi) {
    const hand = this.hands[midi >= 60 ? 'Right' : 'Left'];
    const i = hand.fingerKey.indexOf(midi);
    return i >= 0 ? { finger: i + 1, hand: hand.side === 'Right' ? 'droite' : 'gauche' } : null;
  }

  // Reactions : hochement + sourire, ou tete qui dit non + regard qui encourage
  nod() { this.nodT = 1; this.body.face.feel('happy', 1.9); }
  shake() { this.shakeT = 1; this.body.face.feel('sorry', 1.9); }
  feel(expr, seconds) { this.body.face.feel(expr, seconds); }

  // Ses oreilles rougissent quand le micro t'ecoute, et suivent ce qu'il entend
  listen(on) { this.ears = on ? 0 : null; }
  hear(level) { if (this.ears !== null) this.ears = level; }

  // Suit des yeux la touche que l'eleve vient de jouer
  watch(midi) {
    const top = this.piano.keyTop(midi);
    if (!top) return;
    this.lookTarget.copy(top);
    this.lastActive = performance.now();
  }

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

    // Tete : regarde la touche jouee, ou l'eleve quand il ne se passe rien au clavier
    if (this.piano.view === 'teacher' && performance.now() - this.lastActive > 2600) {
      this.lookTarget.copy(this.piano.camera.position);
      this.piano.root.worldToLocal(this.lookTarget);
    }
    this.look.lerp(this.lookTarget, 1 - Math.exp(-dt * 4));
    pointBone(b.Neck, b.Head, V(0, 1, -0.18));
    const head = wpos(b.Head, new THREE.Vector3());
    const lookDir = this.piano.root.localToWorld(this.look.clone()).sub(head).normalize();
    // Le visage se tourne (lacet) et se penche (tangage) dans des limites naturelles ; les yeux font le reste
    const clamp = THREE.MathUtils.clamp;
    let yaw = clamp(Math.atan2(lookDir.x, -lookDir.z), -1.05, 1.05);
    let pitch = clamp(Math.asin(clamp(lookDir.y, -1, 1)), -0.8, 0.42);
    if (this.nodT > 0) { this.nodT = Math.max(0, this.nodT - dt * 1.4); pitch -= Math.sin(this.nodT * Math.PI * 4) * 0.2; }
    if (this.shakeT > 0) { this.shakeT = Math.max(0, this.shakeT - dt * 1.2); yaw += Math.sin(this.shakeT * Math.PI * 6) * 0.26; }
    const face = V(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
    const side = V(0, 1, 0).cross(face).normalize();
    const up = face.clone().cross(side).normalize();
    const want = new THREE.Quaternion().setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, up, face));
    // Le cou prend un tiers du mouvement, la tete le reste
    setWorldQuat(b.Neck, b.Neck.getWorldQuaternion(new THREE.Quaternion()).slerp(want, 0.35));
    setWorldQuat(b.Head, want);

    // Mains
    for (const hand of Object.values(this.hands)) this.#poseHand(hand, dt);

    // Les yeux finissent le geste de la tete : ce qui reste de l'ecart, vu depuis le visage
    const local = lookDir.applyQuaternion(want.invert());
    const lx = THREE.MathUtils.clamp(local.x * 34, -15, 15);
    const ly = THREE.MathUtils.clamp(-local.y * 30, -12, 14);
    this.body.face.update(dt, lx, ly, this.playing ? 'focus' : 'idle');

    // L'encre : le doigt qui joue prend la couleur de sa main, le collier rougit sur le temps,
    // les oreilles rougissent quand il t'ecoute (le rouge de l'enregistrement)
    const glow = this.body.uniforms.uGlow.value;
    for (const hand of Object.values(this.hands)) {
      const c = HAND_COLOR[hand.side];
      for (let i = 0; i < 5; i++) glow[GLOW.finger(hand.side, i)].set(c.r, c.g, c.b, hand.resting ? 0 : Math.min(1, hand.press[i] * 1.15));
    }
    let pulse = 0;
    if (this.beat) {
      const e = performance.now() - this.beat.t0;
      if (e >= 0) pulse = 0.85 * Math.exp(-((e / this.beat.ms) % 1) * 6);
    }
    glow[GLOW.collar].set(RED.r, RED.g, RED.b, pulse);
    const listening = this.ears !== null && this.ears !== undefined;
    const earWant = listening ? 0.55 + Math.min(1, this.ears * 3) * 0.45 : this.body.face.expr === 'happy' ? 0.3 : 0;
    this.earLevel += (earWant - this.earLevel) * (1 - Math.exp(-dt * 12));
    glow[GLOW.ears].set(RED.r, RED.g, RED.b, this.earLevel);
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
    ccd([b[`${S}ForeArm`], b[`${S}Arm`]], b[`${S}Hand`], wristWorld, 8);

    // Main a plat, doigts vers le clavier
    const side = new THREE.Vector3(S === 'Right' ? 1 : -1, 0, 0);
    orientBone(b[`${S}Hand`], b[`${S}HandMiddle1`], new THREE.Vector3(0, -0.28, -1), b[`${S}HandIndex1`], b[`${S}HandPinky1`], side);

    // Doigts : arrondis au-dessus des touches, celui qui joue descend sur la sienne
    FINGERS.forEach((name, i) => {
      if (hand.resting) {
        const r1 = b[`${S}Hand${name}1`], r2 = b[`${S}Hand${name}2`], r3 = b[`${S}Hand${name}3`], r4 = b[`${S}Hand${name}4`];
        pointBone(r1, r2, new THREE.Vector3(name === 'Thumb' ? -sgn * 0.4 : 0, -0.3, -1));
        pointBone(r2, r3, new THREE.Vector3(0, -0.7, -0.8));
        pointBone(r3, r4, new THREE.Vector3(0, -1, -0.4));
        return;
      }
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
      ccd([f3, f2, f1], f4, tgt, p > 0.02 ? 5 : 2, 0.5);
    });
  }

  dispose() {
    this.stop();
    this.unhook?.();
    this.piano.root.remove(this.model);
    this.piano.root.remove(this.bench);
    this.bench.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
  }
}
