// Le piano a queue, construit autour du clavier.
// Caisse laquee a la courbe des vrais pianos de concert, couvercle ouvert sur sa bequille,
// cadre dore perce, table d'harmonie en epicea, cordes (filees de cuivre dans les graves)
// qui vibrent quand on joue, etouffoirs qui se levent, pupitre, lyre et trois pedales.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';

const RIM_T = 0.95;      // epaisseur de la ceinture
const RIM_TOP = 3.4;     // hauteur du haut de la caisse
const RIM_BOTTOM = -3.6;

// Contour vu de dessus : x de gauche (graves) a droite (aigus), s = profondeur derriere le clavier
function outline(Wc, L, sStart = 0) {
  const x0 = -Wc / 2;
  const x1 = Wc / 2;
  const s = new THREE.Shape();
  s.moveTo(x0, sStart);
  s.lineTo(x1, sStart);
  s.lineTo(x1, Math.max(sStart, 0.13 * L));
  s.bezierCurveTo(x1, 0.44 * L, x1 - 0.5 * Wc, 0.5 * L, x0 + 0.42 * Wc, 0.79 * L);
  s.bezierCurveTo(x0 + 0.36 * Wc, 0.965 * L, x0 + 0.22 * Wc, L, x0 + 0.11 * Wc, L);
  s.bezierCurveTo(x0 + 0.03 * Wc, L, x0, 0.975 * L, x0, 0.9 * L);
  s.lineTo(x0, sStart);
  return s;
}

// Decale un contour vers l'interieur (pour l'interieur de la ceinture, le cadre)
function inset(points, d) {
  const n = points.length;
  let area = 0;
  for (let i = 0; i < n; i++) {
    const a = points[i], b = points[(i + 1) % n];
    area += a.x * b.y - b.x * a.y;
  }
  const sign = area > 0 ? 1 : -1;
  return points.map((p, i) => {
    const a = points[(i - 1 + n) % n];
    const b = points[(i + 1) % n];
    const tx = b.x - a.x, ty = b.y - a.y;
    const len = Math.hypot(tx, ty) || 1;
    // normale vers l'interieur
    return new THREE.Vector2(p.x - (ty / len) * d * sign, p.y + (tx / len) * d * sign);
  });
}

// Profondeur maximale du contour a une abscisse donnee
function depthAt(points, x) {
  let best = 0;
  for (let i = 0; i < points.length; i++) {
    const a = points[i], b = points[(i + 1) % points.length];
    if ((a.x - x) * (b.x - x) > 0 || a.x === b.x) continue;
    const t = (x - a.x) / (b.x - a.x);
    best = Math.max(best, a.y + (b.y - a.y) * t);
  }
  return best;
}

function grainTexture() {
  const c = document.createElement('canvas');
  c.width = 512; c.height = 512;
  const g = c.getContext('2d');
  g.fillStyle = '#c99a5b';
  g.fillRect(0, 0, 512, 512);
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * 512;
    g.strokeStyle = `rgba(${90 + Math.random() * 40}, ${55 + Math.random() * 25}, 25, ${0.08 + Math.random() * 0.18})`;
    g.lineWidth = 0.6 + Math.random() * 2.2;
    g.beginPath();
    g.moveTo(x, 0);
    for (let y = 0; y <= 512; y += 32) g.lineTo(x + Math.sin(y * 0.02 + i) * 3, y);
    g.stroke();
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.wrapS = t.wrapT = THREE.RepeatWrapping;
  t.repeat.set(3, 3);
  return t;
}

// La plaque du facteur, a la feuille d'or sur l'ebene, gravee en Didone comme les pianos anciens
const PLATE_FONT = '600 60px "Bodoni Moda", "Bodoni 72", Didot, Georgia, serif';

function nameplate(text) {
  const c = document.createElement('canvas');
  c.width = 1024; c.height = 128;
  const g = c.getContext('2d');
  const draw = () => {
    g.fillStyle = '#050507';
    g.fillRect(0, 0, 1024, 128);
    const grd = g.createLinearGradient(0, 30, 0, 100);
    grd.addColorStop(0, '#f6e1a6');
    grd.addColorStop(0.5, '#c9a24a');
    grd.addColorStop(1, '#8a6a26');
    g.fillStyle = grd;
    g.font = PLATE_FONT;
    g.textAlign = 'center';
    g.textBaseline = 'middle';
    g.letterSpacing = '16px';
    g.fillText(text, 512, 66);
  };
  draw();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  // Si la police n'etait pas encore chargee, on regrave la plaque des qu'elle l'est
  if (document.fonts && !document.fonts.check(PLATE_FONT, text)) {
    document.fonts.load(PLATE_FONT, text).then(() => { draw(); t.needsUpdate = true; }).catch(() => {});
  }
  return t;
}

export function buildGrand({ width: W, keyLength = 6, floorY = -30, shadows = true, low, high, keyX }) {
  const group = new THREE.Group();
  const parts = [];
  const disposables = [];
  const Wc = W + 3.4;
  const L = Math.max(40, Wc * 1.78);
  const front = -keyLength / 2 - 0.35;   // z du bord avant de la caisse (derriere les touches)
  const z = (s) => front - s;             // profondeur -> z du piano

  const lacquer = new THREE.MeshPhysicalMaterial({ color: '#040406', roughness: 0.1, metalness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03, envMapIntensity: 1.4 });
  const gold = new THREE.MeshStandardMaterial({ color: '#b48a3c', metalness: 1, roughness: 0.42, envMapIntensity: 1.05 });
  const brass = new THREE.MeshStandardMaterial({ color: '#d4ae5a', metalness: 1, roughness: 0.22, envMapIntensity: 1.8 });
  const felt = new THREE.MeshStandardMaterial({ color: '#141416', roughness: 1 });
  const grain = grainTexture();
  const spruce = new THREE.MeshStandardMaterial({ map: grain, roughness: 0.55, metalness: 0 });
  disposables.push(lacquer, gold, brass, felt, grain, spruce);

  const mesh = (geo, mat, cast = true) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = cast && shadows;
    m.receiveShadow = shadows;
    disposables.push(geo);
    return m;
  };
  const part = (obj) => { group.add(obj); parts.push(obj); return obj; };

  // ---------- Contours ----------
  const outer = outline(Wc, L);
  const outerPts = outer.getSpacedPoints(260);
  outerPts.pop();
  const innerPts = inset(outerPts, RIM_T);
  const platePts = inset(outerPts, RIM_T + 0.7);

  // ---------- Pieds, lyre et pedales ----------
  const casterGeo = new THREE.CylinderGeometry(0.55, 0.55, 0.5, 20);
  disposables.push(casterGeo);
  const legAt = (x, s, top) => {
    const legH = top - floorY - 0.8;
    const g = new THREE.Group();
    const leg = mesh(new THREE.CylinderGeometry(0.95, 0.62, legH, 24), lacquer);
    leg.position.y = top - legH / 2;
    const caster = new THREE.Mesh(casterGeo, brass);
    caster.rotation.z = Math.PI / 2;
    caster.position.y = floorY + 0.55;
    g.add(leg, caster);
    g.position.set(x, 0, z(s));
    return part(g);
  };
  const cheekW = (Wc - W) / 2;
  legAt(-(W / 2 + cheekW / 2), -keyLength / 2 + 0.8, -1.45);
  legAt(W / 2 + cheekW / 2, -keyLength / 2 + 0.8, -1.45);
  legAt(-Wc / 2 + 0.24 * Wc, 0.86 * L, RIM_BOTTOM);

  const lyre = new THREE.Group();
  const postGeo = new THREE.BoxGeometry(0.35, Math.abs(floorY - RIM_BOTTOM) - 3, 0.35);
  [-1.4, 1.4].forEach((x) => {
    const p = mesh(postGeo, lacquer);
    p.position.set(x, (RIM_BOTTOM + floorY + 3) / 2, 0);
    lyre.add(p);
  });
  const box = mesh(new RoundedBoxGeometry(4.6, 1.1, 1.6, 2, 0.2), lacquer);
  box.position.set(0, floorY + 2.4, 0);
  lyre.add(box);
  const pedals = [];
  const pedalGeo = new RoundedBoxGeometry(0.55, 0.22, 2.4, 2, 0.08);
  [-1.25, 0, 1.25].forEach((x) => {
    const pivot = new THREE.Group();
    pivot.position.set(x, floorY + 2.2, 0.6);
    const pedal = mesh(pedalGeo, brass);
    pedal.position.z = 1.2;
    pivot.add(pedal);
    lyre.add(pivot);
    pedals.push(pivot);
  });
  lyre.position.set(0, 0, z(-keyLength / 2 + 1.2));
  part(lyre);

  // ---------- Cadre du clavier : sommier, joues, baguette ----------
  const keybed = mesh(new THREE.BoxGeometry(Wc, 1.1, keyLength + 1.4), lacquer);
  keybed.position.set(0, -0.95, 0.1);
  part(keybed);
  const cheekGeo = new RoundedBoxGeometry(cheekW - 0.06, 1.9, keyLength + 1.2, 3, 0.25);
  disposables.push(cheekGeo);
  [-1, 1].forEach((sgn) => {
    const ch = new THREE.Mesh(cheekGeo, lacquer);
    ch.castShadow = ch.receiveShadow = shadows;
    ch.position.set(sgn * (W / 2 + cheekW / 2), 0.1, 0.25);
    part(ch);
  });
  const slip = mesh(new RoundedBoxGeometry(W + 0.4, 0.95, 0.32, 2, 0.1), lacquer);
  slip.position.set(0, -0.6, keyLength / 2 + 0.45);
  part(slip);

  // ---------- Caisse (ceinture) ----------
  const rimShape = new THREE.Shape(outerPts);
  rimShape.holes.push(new THREE.Path([...innerPts]));
  const rimGeo = new THREE.ExtrudeGeometry(rimShape, { depth: RIM_TOP - RIM_BOTTOM, bevelEnabled: true, bevelThickness: 0.12, bevelSize: 0.12, bevelSegments: 3, curveSegments: 1 });
  const rim = mesh(rimGeo, lacquer);
  rim.rotation.x = -Math.PI / 2;
  rim.position.set(0, RIM_BOTTOM, front);
  part(rim);
  // Fond de caisse
  const bottom = mesh(new THREE.ShapeGeometry(new THREE.Shape(innerPts)), lacquer, false);
  bottom.rotation.x = -Math.PI / 2;
  bottom.position.set(0, RIM_BOTTOM + 0.3, front);
  part(bottom);

  // ---------- Table d'harmonie ----------
  const board = mesh(new THREE.ShapeGeometry(new THREE.Shape(innerPts)), spruce, false);
  board.rotation.x = -Math.PI / 2;
  board.position.set(0, -1.6, front - 0.001);
  part(board);

  // ---------- Cadre dore, perce de grands trous ----------
  const plateShape = new THREE.Shape(platePts);
  const holes = [];
  const innerW = Wc - 2 * RIM_T;
  for (let i = 0; i < 5; i++) {
    const s = L * (0.3 + i * 0.11);
    const t = 0.5 - i * 0.07;
    const x = -Wc / 2 + RIM_T + innerW * t * 0.9;
    const r = Math.max(1.1, Wc * (0.055 - i * 0.006));
    holes.push({ x, s, r });
  }
  holes.forEach(({ x, s, r }) => {
    const h = new THREE.Path();
    h.absellipse(x, s, r, r * 1.35, 0, Math.PI * 2, true);
    plateShape.holes.push(h);
  });
  const plateGeo = new THREE.ExtrudeGeometry(plateShape, { depth: 0.35, bevelEnabled: true, bevelThickness: 0.1, bevelSize: 0.12, bevelSegments: 2, curveSegments: 24 });
  const plate = mesh(plateGeo, gold);
  plate.rotation.x = -Math.PI / 2;
  plate.position.set(0, -1.15, front);
  part(plate);

  // ---------- Cordes ----------
  const notes = [];
  for (let m = low; m <= high; m++) notes.push(m);
  const SEG = 10;
  const strings = [];
  const pos = new Float32Array(notes.length * SEG * 2 * 3);
  const col = new Float32Array(notes.length * SEG * 2 * 3);
  const yStr = -0.2;
  const sFront = 2.4;
  const xSpan = innerW * 0.9;
  notes.forEach((m, i) => {
    const kx = keyX(m) * (xSpan / W);
    const bass = (m - low) / Math.max(1, high - low) < 0.28;
    const xBack = bass ? kx + innerW * 0.16 : kx;
    const sBack = Math.max(sFront + 6, depthAt(innerPts, Math.max(-Wc / 2 + RIM_T + 0.5, Math.min(Wc / 2 - RIM_T - 0.5, xBack))) - 1.6);
    const copper = m < 48;
    const base = copper ? new THREE.Color('#b9773d') : new THREE.Color('#c3c7d2');
    strings.push({ m, a: new THREE.Vector3(kx, yStr, z(sFront)), b: new THREE.Vector3(xBack, yStr, z(sBack)), amp: 0, phase: 0, decay: 1.1, base, hot: 0, i });
  });
  const strGeo = new THREE.BufferGeometry();
  strGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  strGeo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const strMat = new THREE.LineBasicMaterial({ vertexColors: true, transparent: true, opacity: 0.95 });
  const strLines = new THREE.LineSegments(strGeo, strMat);
  strLines.frustumCulled = false;
  disposables.push(strGeo, strMat);
  const tmp = new THREE.Vector3();
  const writeString = (st, time) => {
    const o = st.i * SEG * 6;
    let k = 0;
    for (let j = 0; j < SEG; j++) {
      for (const jj of [j, j + 1]) {
        const u = jj / SEG;
        tmp.lerpVectors(st.a, st.b, u);
        if (st.amp > 0.0005) {
          const shape = Math.sin(Math.PI * u);
          const w = Math.sin(st.phase + time * 46) * st.amp * shape;
          tmp.x += w * 0.6;
          tmp.y += w;
        }
        pos[o + k] = tmp.x; pos[o + k + 1] = tmp.y; pos[o + k + 2] = tmp.z;
        const glow = st.hot;
        col[o + k] = st.base.r + (0.6 - st.base.r) * glow + glow * 1.4;
        col[o + k + 1] = st.base.g + (1 - st.base.g) * glow + glow * 1.4;
        col[o + k + 2] = st.base.b + (1 - st.base.b) * glow + glow * 1.6;
        k += 3;
      }
    }
  };
  strings.forEach((st) => writeString(st, 0));
  const strGroup = new THREE.Group();
  strGroup.add(strLines);
  part(strGroup);

  // ---------- Etouffoirs ----------
  const damperGeo = new THREE.BoxGeometry(0.42, 0.55, 1.1);
  disposables.push(damperGeo);
  const dampers = new THREE.InstancedMesh(damperGeo, felt, strings.length);
  dampers.castShadow = shadows;
  const dm = new THREE.Matrix4();
  const lift = new Float32Array(strings.length);
  const liftTarget = new Float32Array(strings.length);
  const writeDamper = (i) => {
    const st = strings[i];
    tmp.lerpVectors(st.a, st.b, 0.07);
    dm.makeTranslation(tmp.x, yStr + 0.45 + lift[i] * 0.7, tmp.z);
    dampers.setMatrixAt(i, dm);
  };
  strings.forEach((_, i) => writeDamper(i));
  dampers.instanceMatrix.needsUpdate = true;
  part(dampers);

  // ---------- Pupitre et nom ----------
  const desk = new THREE.Group();
  const deskW = Math.min(W * 0.5, 22);
  const panel = mesh(new RoundedBoxGeometry(deskW, 4.2, 0.3, 2, 0.12), lacquer);
  panel.position.y = 2.1;
  const ledge = mesh(new THREE.BoxGeometry(deskW + 0.4, 0.28, 0.8), lacquer);
  ledge.position.set(0, 0.14, 0.4);
  desk.add(panel, ledge);
  desk.rotation.x = -0.38;
  desk.position.set(0, RIM_TOP - 1.1, z(4.6));
  part(desk);

  const fall = new THREE.Group();
  const board2 = mesh(new THREE.BoxGeometry(W + 0.2, 1.5, 0.3), lacquer);
  const nameTex = nameplate('PIANO LEARN');
  disposables.push(nameTex);
  const plateMat = new THREE.MeshBasicMaterial({ map: nameTex, transparent: true });
  disposables.push(plateMat);
  const name = new THREE.Mesh(new THREE.PlaneGeometry(9, 1.125), plateMat);
  disposables.push(name.geometry);
  name.position.set(0, 0.05, 0.16);
  name.renderOrder = 3; // la plaque reste lisible par-dessus le rouleau du pianola
  fall.add(board2, name);
  fall.position.set(0, 0.95, front + 0.12);
  fall.rotation.x = -0.12;
  part(fall);

  // ---------- Couvercle et bequille ----------
  const lidShape = outline(Wc, L, 6);
  const lidGeo = new THREE.ExtrudeGeometry(lidShape, { depth: 0.32, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.1, bevelSegments: 2, curveSegments: 40 });
  disposables.push(lidGeo);
  const lid = new THREE.Mesh(lidGeo, lacquer);
  lid.castShadow = shadows;
  lid.rotation.x = -Math.PI / 2;
  lid.position.set(Wc / 2, 0, 0);   // bord gauche (charniere) sur l'axe du pivot
  const lidPivot = new THREE.Group();
  lidPivot.position.set(-Wc / 2, RIM_TOP + 0.15, front);
  lidPivot.add(lid);
  part(lidPivot);
  const stickLen = 1;
  const stick = mesh(new THREE.CylinderGeometry(0.16, 0.16, stickLen, 10), brass);
  stick.visible = false;
  group.add(stick);
  const LID_OPEN = 0.6;
  const stickBase = new THREE.Vector3(Wc / 2 - 3.2, RIM_TOP, z(0.42 * L));

  let lidAngle = 0;
  let lidTarget = 0;
  let lidDelay = 0;
  function placeStick() {
    // Le haut de la bequille touche le dessous du couvercle
    const hingeX = -Wc / 2;
    const r = stickBase.x - hingeX;
    const top = new THREE.Vector3(hingeX + r * Math.cos(lidAngle), RIM_TOP + 0.15 + r * Math.sin(lidAngle), stickBase.z);
    const mid = top.clone().add(stickBase).multiplyScalar(0.5);
    const len = top.distanceTo(stickBase);
    stick.position.copy(mid);
    stick.scale.set(1, Math.max(0.01, len), 1);
    stick.lookAt(top);
    stick.rotateX(Math.PI / 2);
    stick.visible = lidAngle > 0.08;
  }

  // ---------- Animation ----------
  let pedalDown = 0;
  let pedalTarget = 0;
  const byMidi = new Map(strings.map((s, i) => [s.m, i]));
  let damperDirty = false;

  return {
    group,
    parts,
    length: L,
    width: Wc,
    openLid(delay = 0) { lidDelay = delay; lidTarget = LID_OPEN; },
    setLid(open) { lidTarget = open ? LID_OPEN : 0; lidAngle = lidTarget; lidPivot.rotation.z = lidAngle; placeStick(); },
    strike(midi, velocity = 0.8) {
      const i = byMidi.get(midi);
      if (i == null) return;
      const st = strings[i];
      st.amp = 0.12 + 0.28 * velocity;
      st.phase = Math.random() * 6.28;
      st.decay = 1.2;
      st.hot = 1;
      liftTarget[i] = 1;
    },
    damp(midi) {
      const i = byMidi.get(midi);
      if (i == null) return;
      if (pedalTarget > 0.5) return;
      strings[i].decay = 9;
      liftTarget[i] = 0;
    },
    setPedal(on) {
      pedalTarget = on ? 1 : 0;
      for (let i = 0; i < strings.length; i++) {
        if (on) liftTarget[i] = 1;
        else if (strings[i].hot < 0.05) { liftTarget[i] = 0; strings[i].decay = 9; }
      }
    },
    update(dt, time) {
      if (lidDelay > 0) lidDelay -= dt;
      else if (Math.abs(lidAngle - lidTarget) > 0.0005) {
        lidAngle += (lidTarget - lidAngle) * Math.min(1, dt * 1.6);
        lidPivot.rotation.z = lidAngle;
        placeStick();
      }
      pedalDown += (pedalTarget - pedalDown) * Math.min(1, dt * 18);
      pedals[2].rotation.x = -0.16 * pedalDown;
      let dirty = false;
      for (const st of strings) {
        if (st.amp <= 0.0005 && st.hot <= 0.001) continue;
        st.amp *= Math.exp(-dt * st.decay);
        st.hot = Math.max(0, st.hot - dt * (st.decay > 2 ? 4 : 0.9));
        if (st.amp <= 0.0005) st.amp = 0;
        writeString(st, time);
        dirty = true;
      }
      if (dirty) {
        strGeo.attributes.position.needsUpdate = true;
        strGeo.attributes.color.needsUpdate = true;
      }
      for (let i = 0; i < strings.length; i++) {
        const target = pedalDown > 0.5 ? 1 : liftTarget[i];
        if (Math.abs(lift[i] - target) > 0.002) {
          lift[i] += (target - lift[i]) * Math.min(1, dt * 20);
          writeDamper(i);
          damperDirty = true;
        }
      }
      if (damperDirty) { dampers.instanceMatrix.needsUpdate = true; damperDirty = false; }
    },
    dispose() {
      disposables.forEach((d) => d.dispose?.());
      dampers.dispose();
    },
  };
}
