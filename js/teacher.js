// Le prof 3D : une vraie personne assise au piano, qui joue avec les bons doigts (teacher-model.js).
// Pose procedurale : on part de la pose de repos a chaque image, on assoit le corps, puis on place
// poignets et doigts sur les touches (IK en espace monde, independante du squelette). Il regarde la touche
// jouee, ou l'eleve quand il lui parle ; ses yeux finissent le geste de la tete ; son visage cligne,
// sourit quand c'est juste, s'inquiete quand c'est faux, se concentre quand il joue, remue les levres
// quand il parle (voix du prof).
import * as THREE from 'three';
import { isBlack } from './notes.js';
import { loadTeacherModel, FINGERS, MOODS } from './teacher-model.js';

const M = 42.5; // unites du piano par metre (1 touche blanche = 2,35 cm)

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

// Tourne un vecteur autour d'un axe (unitaire)
const _rq = new THREE.Quaternion();
function turn(v, axis, angle) {
  return v.clone().applyQuaternion(_rq.setFromAxisAngle(axis, angle));
}
// Angle signe de a vers b autour de l'axe n (a, b perpendiculaires a n)
function signedAngle(a, b, n) {
  return Math.atan2(_c.crossVectors(a, b).dot(n), a.dot(b));
}

// La courbe d'un doigt de pianiste, pour un degre de flexion c (0 = tendu, 1 = tres replie) :
// articulation de la base, du milieu, du bout (radians). Le bout plie un peu moins que le milieu.
const curl = (c) => [-0.05 + 0.75 * c, 0.25 + 1.0 * c, 0.15 + 0.6 * c];
const CURL_NATURAL = 0.45;   // une main posee sur le clavier
const CURL_REST = 0.6;       // une main posee sur la cuisse
const CURL_MAX = 0.85;
const HAND_PITCH = 0.1;      // le dos de la main descend a peine vers les doigts

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

// Regard droit devant (vers le clavier) pour un lacet et un tangage donnes, en espace monde
function gazeBasis(yaw, pitch, out = new THREE.Quaternion()) {
  const face = new THREE.Vector3(Math.sin(yaw) * Math.cos(pitch), Math.sin(pitch), -Math.cos(yaw) * Math.cos(pitch));
  const side = new THREE.Vector3(0, 1, 0).cross(face).normalize();
  const up = face.clone().cross(side).normalize();
  return out.setFromRotationMatrix(new THREE.Matrix4().makeBasis(side, up, face));
}

// Le prof est charge une seule fois (par choix de prof) et garde pour toutes les lecons
export function preloadTeacher(choice) {
  return loadTeacherModel(choice);
}

export class Teacher {
  static async load(piano, opts) {
    const model = await loadTeacherModel();
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
    this.mood = 'idle';         // humeur passagere (feel), puis retour a l'humeur de fond
    this.moodUntil = 0;
    this.blinkT = 0;
    this.nextBlink = 1.5 + Math.random() * 2;
    this.morph = {};

    const shadows = piano.shadows;
    model.traverse((o) => {
      if (!o.isMesh) return;
      o.castShadow = shadows && !o.userData.noShadow;
      o.receiveShadow = shadows;
    });

    this.body = model.userData.body;
    this.bones = this.body.bones;
    // Pose de repos : celle du fichier (bras ecartes), d'ou repart chaque image
    this.rest = this.body.rest;
    for (const [bone, q] of this.rest) bone.quaternion.copy(q);
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
    // La main du prof, mesuree : paume (poignet -> base du majeur) et phalanges de chaque doigt
    const local = (name) => piano.root.worldToLocal(wpos(this.bones[name], new THREE.Vector3()));
    const dist = (a, b) => local(a).distanceTo(local(b));
    this.palm = dist('RightHand', 'RightHandMiddle1');
    this.phalanx = {};
    for (const f of FINGERS) this.phalanx[f] = [dist(`RightHand${f}1`, `RightHand${f}2`), dist(`RightHand${f}2`, `RightHand${f}3`), dist(`RightHand${f}3`, `RightHand${f}4`)];
    // Ou doit etre le poignet pour que le majeur, a sa courbe naturelle, touche sa touche :
    // en avant (z) et au-dessus (y) du point de contact
    {
      const [a1, a2, a3] = curl(CURL_NATURAL);
      const L = this.phalanx.Middle;
      let ang = HAND_PITCH + a1;
      let h = L[0] * Math.cos(ang);
      let v = L[0] * Math.sin(ang);
      ang += a2; h += L[1] * Math.cos(ang); v += L[1] * Math.sin(ang);
      ang += a3; h += L[2] * Math.cos(ang); v += L[2] * Math.sin(ang);
      this.reach = { z: h + this.palm * Math.cos(HAND_PITCH), y: v + this.palm * Math.sin(HAND_PITCH) };
    }

    // La camera du prof se cadre sur sa vraie taille : entre son visage et ses mains
    const headY = piano.root.worldToLocal(wpos(this.bones.Head, new THREE.Vector3())).y;
    piano.teacherTarget = [0, headY - 7.2, 14];
    if (piano.view === 'teacher') piano.resize();
    // Orientation de la tete et du cou quand il regarde droit devant : on y rapporte chaque regard
    const ahead = gazeBasis(0, 0).invert();
    this.headFix = ahead.clone().multiply(this.bones.Head.getWorldQuaternion(new THREE.Quaternion()));
    this.neckFix = ahead.clone().multiply(this.bones.Neck.getWorldQuaternion(new THREE.Quaternion()));

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

    // Eclairage du prof : une lampe de studio presque blanche (une lumiere chaude rougit la peau)
    const spot = new THREE.SpotLight('#fffaf4', 230, 160, 0.45, 0.8, 1.4);
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
    const mid = this.piano.keyTop(whites[2], 0.8);
    if (!mid) {
      // Les touches de cette main ne sont pas sur le clavier : elle se pose sur le genou
      this.restHand(hand.side, instant);
      return;
    }
    hand.resting = false;
    // Le poignet recule et s'eleve juste assez pour que les doigts arrondis tombent sur leurs touches
    hand.wristTarget.set(mid.x + (hand.side === 'Right' ? -0.3 : 0.3), mid.y + this.reach.y, mid.z + this.reach.z);
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

  // Reactions : hochement + sourire, ou tete qui dit non + sourcils qui encouragent
  nod() { this.nodT = 1; this.feel('happy', 1.9); }
  shake() { this.shakeT = 1; this.feel('sorry', 1.9); }
  feel(expr, seconds = 1.6) {
    if (!MOODS[expr]) return;
    this.mood = expr;
    this.moodUntil = this.time + seconds;
  }

  // Quand le micro t'ecoute, il tend l'oreille : sourcils leves, visage attentif
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
    const want = gazeBasis(yaw, pitch);
    // Le cou prend un tiers du mouvement, la tete le reste
    setWorldQuat(b.Neck, b.Neck.getWorldQuaternion(new THREE.Quaternion()).slerp(want.clone().multiply(this.neckFix), 0.35));
    setWorldQuat(b.Head, want.clone().multiply(this.headFix));

    // Mains
    for (const hand of Object.values(this.hands)) this.#poseHand(hand, dt);

    // Les yeux finissent le geste de la tete : ils tournent vers la cible, dans la limite d'un regard naturel
    const ang = face.angleTo(lookDir);
    if (ang > 1e-3) {
      const qEye = new THREE.Quaternion().setFromUnitVectors(face, lookDir);
      if (ang > 0.42) qEye.slerp(new THREE.Quaternion(), 1 - 0.42 / ang);
      for (const eye of [b.LeftEye, b.RightEye]) if (eye) rotateWorld(eye, qEye);
    }

    this.#face(dt);
  }

  // Le visage : l'humeur du moment, le clignement, les levres quand la voix du prof parle
  #face(dt) {
    const listening = this.ears !== null && this.ears !== undefined;
    const base = listening ? 'listen' : this.playing ? 'focus' : 'idle';
    if (this.time > this.moodUntil) this.mood = base;
    const want = { ...MOODS[this.mood] };
    this.nextBlink -= dt;
    let blink = 0;
    if (this.nextBlink <= 0) {
      this.blinkT += dt / 0.17;
      blink = Math.sin(Math.min(1, this.blinkT) * Math.PI);
      if (this.blinkT >= 1) { this.blinkT = 0; this.nextBlink = 2 + Math.random() * 3.5; }
    }
    want.AK_09_EyeBlinkLeft = Math.max(want.AK_09_EyeBlinkLeft || 0, blink);
    want.AK_10_EyeBlinkRight = Math.max(want.AK_10_EyeBlinkRight || 0, blink);
    if (typeof speechSynthesis !== 'undefined' && speechSynthesis.speaking) {
      // Il parle : la machoire et les levres suivent un rythme de syllabes
      const t = this.time * 10.5;
      const open = Math.max(0, Math.sin(t) * 0.6 + Math.sin(t * 2.3 + 0.7) * 0.4);
      want.AK_25_JawOpen = Math.max(want.AK_25_JawOpen || 0, 0.04 + open * 0.2);
      want.AA_VI_10_aa = open * 0.35;
      want.AA_VI_13_O = Math.max(0, Math.sin(t * 0.61 + 2)) * 0.25;
      want.AA_VI_11_E = Math.max(0, Math.sin(t * 0.83 + 4)) * 0.2;
      want.AA_VI_01_PP = Math.sin(t * 1.7) > 0.9 ? 0.5 : 0;
    }
    const k = 1 - Math.exp(-dt * 10);
    for (const name of this.body.morphNames) {
      const target = want[name] || 0;
      const cur = this.morph[name] || 0;
      const v = name.includes('Blink') ? target : cur + (target - cur) * k;
      if (v === cur) continue;
      this.morph[name] = v;
      this.body.setMorph(name, v);
    }
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

    // Main a plat, a peine inclinee vers les doigts
    const side = new THREE.Vector3(S === 'Right' ? 1 : -1, 0, 0);
    orientBone(b[`${S}Hand`], b[`${S}HandMiddle1`], new THREE.Vector3(0, -Math.tan(HAND_PITCH), -1), b[`${S}HandIndex1`], b[`${S}HandPinky1`], side);

    // Le repere de la main : en avant (poignet -> majeur), sur le cote (index -> auriculaire), paume vers le bas
    const W = wpos(b[`${S}Hand`], new THREE.Vector3());
    const fwdH = wpos(b[`${S}HandMiddle1`], new THREE.Vector3()).sub(W).normalize();
    const sideH = wpos(b[`${S}HandPinky1`], new THREE.Vector3()).sub(wpos(b[`${S}HandIndex1`], new THREE.Vector3()));
    sideH.addScaledVector(fwdH, -sideH.dot(fwdH)).normalize();
    const palmDown = S === 'Right' ? fwdH.clone().cross(sideH) : sideH.clone().cross(fwdH);

    // Le point que vise chaque doigt : sa touche (le doigt qui joue y entre, les autres l'effleurent)
    const targetOf = (i) => {
      if (hand.resting) return null;
      const midi = hand.fingerKey[i];
      if (midi == null) return null;
      const top = this.piano.keyTop(midi, isBlack(midi) ? 0.75 : 0.8);
      if (!top) return null;
      const p = hand.press[i];
      top.y += 0.22 * (1 - p) - 0.3 * p;
      return root.localToWorld(top);
    };

    FINGERS.forEach((name, i) => {
      const j1 = b[`${S}Hand${name}1`], j2 = b[`${S}Hand${name}2`], j3 = b[`${S}Hand${name}3`], tip = b[`${S}Hand${name}4`];
      const L = this.phalanx[name];
      const P1 = wpos(j1, new THREE.Vector3());
      const T = targetOf(i);

      if (name === 'Thumb') {
        // Le pouce : un arc tendu vers sa touche, la base un peu relevee, le bout pose sur le cote
        let dir;
        let beta = 0.35;
        if (T) {
          dir = T.clone().sub(P1);
          const D = dir.length();
          dir.normalize();
          const reach = L[0] + L[2];
          beta = D < L[0] + L[1] + L[2] ? Math.acos(THREE.MathUtils.clamp((D - L[1]) / reach, -1, 1)) : 0;
          beta = Math.min(beta, 0.9);
        } else {
          dir = fwdH.clone().multiplyScalar(0.75).addScaledVector(sideH, -0.35).addScaledVector(palmDown, 0.45).normalize();
        }
        const axis = dir.clone().cross(palmDown).normalize();
        pointBone(j1, j2, turn(dir, axis, -beta));
        pointBone(j2, j3, dir);
        pointBone(j3, tip, turn(dir, axis, beta));
        return;
      }

      // La direction de base du doigt, dans le plan de la paume
      const dRest = wpos(j2, new THREE.Vector3()).sub(P1);
      dRest.addScaledVector(palmDown, -dRest.dot(palmDown)).normalize();
      let d0 = dRest;
      if (T) {
        // Il s'ecarte un peu vers sa touche (dans les limites d'une vraie main)
        const v = T.clone().sub(P1);
        v.addScaledVector(palmDown, -v.dot(palmDown));
        if (v.lengthSq() > 1e-6) {
          const ang = THREE.MathUtils.clamp(signedAngle(dRest, v.normalize(), palmDown), -0.28, 0.28);
          d0 = turn(dRest, palmDown, ang);
        }
      }
      // Il plie comme une charniere, autour de l'axe perpendiculaire au doigt dans le plan de la paume
      const hinge = d0.clone().cross(palmDown).normalize();
      const dirs = (c) => {
        const [a1, a2, a3] = curl(c);
        return [turn(d0, hinge, a1), turn(d0, hinge, a1 + a2), turn(d0, hinge, a1 + a2 + a3)];
      };
      let c = T ? CURL_NATURAL : CURL_REST;
      if (T) {
        // Juste assez plie pour que le bout du doigt arrive a la hauteur de sa cible
        let lo = 0;
        let hi = CURL_MAX;
        for (let k = 0; k < 12; k++) {
          c = (lo + hi) / 2;
          const [d1, d2, d3] = dirs(c);
          const y = P1.y + L[0] * d1.y + L[1] * d2.y + L[2] * d3.y;
          if (y > T.y) lo = c; else hi = c;
        }
      }
      const [d1, d2, d3] = dirs(c);
      pointBone(j1, j2, d1);
      pointBone(j2, j3, d2);
      pointBone(j3, tip, d3);
    });
  }

  dispose() {
    this.piano.teacherTarget = null;
    this.stop();
    this.unhook?.();
    this.piano.root.remove(this.model);
    this.piano.root.remove(this.bench);
    this.bench.traverse((o) => { o.geometry?.dispose(); o.material?.dispose?.(); });
  }
}
