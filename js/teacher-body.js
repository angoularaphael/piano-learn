// Le prof, fait maison : un mannequin de porcelaine au visage d'ecran.
// - Son squelette est construit ici, avec les noms d'os qu'attend la pose procedurale (teacher.js).
// - Tout le corps tient en un seul maillage anime, donc une seule passe de rendu : chaque piece
//   suit son os sans se deformer, comme un mannequin d'artiste.
// - Le doigt qui joue se teinte comme trempe dans l'encre, dans la couleur de sa main (vermillon a
//   droite, bleu a gauche) : les deux crayons du prof, les memes que les doigtes poses sur les touches.
// - Le collier de laiton rougit sur chaque temps quand il joue ; les oreilles rougissent quand il
//   t'ecoute (le rouge de l'enregistrement). Le visage est dessine a l'encre sur la porcelaine
//   (yeux qui clignent, suivent la touche, sourient, s'inquietent).
// Reperes : metres, personnage tourne vers +Z, sa main gauche du cote +X (convention des
// squelettes de personnages). teacher.js le met a l'echelle du piano et le retourne vers le clavier.
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { mergeGeometries } from 'three/addons/utils/BufferGeometryUtils.js';
import { PAL } from './palette.js';

export const FINGERS = ['Thumb', 'Index', 'Middle', 'Ring', 'Pinky'];
export const HAND_COLOR = { Right: new THREE.Color(PAL.right), Left: new THREE.Color(PAL.left) };
// Canaux d'encre du corps (couleur + dose, 0 a 1) : 1-5 doigts de la main gauche, 6-10 main droite,
// 11 collier, 12 oreilles
export const GLOW = { finger: (side, i) => (side === 'Left' ? 1 : 6) + i, collar: 11, ears: 12, count: 13 };

const PORCELAIN = new THREE.Color('#f7f2ea');
const GRAPHITE = new THREE.Color('#2b2520');
const BRASS = new THREE.Color(PAL.brass);

// ---------- Squelette ----------
// Doigts : decalage de chaque articulation par rapport a la precedente (cote gauche, x vers l'exterieur)
const FINGER_SEGS = {
  Thumb: [[0.022, -0.014, 0.026], [0.026, -0.008, 0.024], [0.026, -0.005, 0.014], [0.023, -0.003, 0.008]],
  Index: [[0.088, 0.002, 0.031], [0.041, -0.001, 0.002], [0.025, -0.001, 0.001], [0.021, -0.001, 0]],
  Middle: [[0.091, 0.003, 0.01], [0.045, -0.001, 0], [0.028, -0.001, 0], [0.022, -0.001, 0]],
  Ring: [[0.087, 0.002, -0.011], [0.042, -0.001, -0.002], [0.026, -0.001, -0.001], [0.021, -0.001, 0]],
  Pinky: [[0.079, 0, -0.031], [0.033, -0.001, -0.003], [0.02, -0.001, -0.001], [0.018, -0.001, 0]],
};
// Rayon des phalanges (base, bout)
const FINGER_R = { Thumb: [0.0122, 0.0094], Index: [0.0095, 0.0075], Middle: [0.0098, 0.0077], Ring: [0.0093, 0.0073], Pinky: [0.0083, 0.0065] };

function skeletonDef() {
  const J = new Map();
  const add = (name, parent, p) => J.set(name, { name, parent, p });
  const rel = (name, parent, dx, dy, dz) => add(name, parent, J.get(parent).p.clone().add(new THREE.Vector3(dx, dy, dz)));
  add('Hips', null, new THREE.Vector3(0, 0.98, 0));
  rel('Spine', 'Hips', 0, 0.08, -0.005);
  rel('Spine1', 'Spine', 0, 0.12, -0.005);
  rel('Spine2', 'Spine1', 0, 0.12, 0);
  rel('Neck', 'Spine2', 0, 0.17, 0);
  rel('Head', 'Neck', 0, 0.068, 0.012);
  rel('HeadTop_End', 'Head', 0, 0.225, 0);
  for (const [S, s] of [['Left', 1], ['Right', -1]]) {
    rel(`${S}Shoulder`, 'Spine2', s * 0.045, 0.12, -0.01);
    rel(`${S}Arm`, `${S}Shoulder`, s * 0.13, 0.005, -0.005);
    rel(`${S}ForeArm`, `${S}Arm`, s * 0.28, 0, 0);
    rel(`${S}Hand`, `${S}ForeArm`, s * 0.245, 0, 0);
    for (const [f, segs] of Object.entries(FINGER_SEGS)) {
      let parent = `${S}Hand`;
      segs.forEach(([dx, dy, dz], k) => {
        const n = `${S}Hand${f}${k + 1}`;
        rel(n, parent, s * dx, dy, dz);
        parent = n;
      });
    }
    rel(`${S}UpLeg`, 'Hips', s * 0.095, -0.05, 0);
    rel(`${S}Leg`, `${S}UpLeg`, 0, -0.42, 0.005);
    rel(`${S}Foot`, `${S}Leg`, 0, -0.42, -0.025);
    rel(`${S}ToeBase`, `${S}Foot`, 0, -0.075, 0.13);
    rel(`${S}Toe_End`, `${S}ToeBase`, 0, 0, 0.065);
  }
  return J;
}

// ---------- Pieces ----------
const UP = new THREE.Vector3(0, 1, 0);

// Gelule effilee de a vers b (rayon r0 en a, r1 en b)
function limb(a, b, r0, r1, radial = 14, cap = 5) {
  const len = a.distanceTo(b);
  const pts = [];
  for (let i = 0; i <= cap; i++) {
    const t = -Math.PI / 2 + (i / cap) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(1e-5, r0 * Math.cos(t)), r0 * Math.sin(t)));
  }
  for (let i = 0; i <= cap; i++) {
    const t = (i / cap) * (Math.PI / 2);
    pts.push(new THREE.Vector2(Math.max(1e-5, r1 * Math.cos(t)), len + r1 * Math.sin(t)));
  }
  const g = new THREE.LatheGeometry(pts, radial);
  const q = new THREE.Quaternion().setFromUnitVectors(UP, b.clone().sub(a).normalize());
  g.applyMatrix4(new THREE.Matrix4().compose(a, q, new THREE.Vector3(1, 1, 1)));
  return g;
}

const ball = (c, r, seg = 12) => new THREE.SphereGeometry(r, seg, Math.max(6, Math.round(seg * 0.7))).translate(c.x, c.y, c.z);
const egg = (c, rx, ry, rz, seg = 28) => new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7)).scale(rx, ry, rz).translate(c.x, c.y, c.z);
const box = (c, w, h, d, r) => new RoundedBoxGeometry(w, h, d, 3, r).translate(c.x, c.y, c.z);

// Volume tourne a partir d'un profil [y, rayon] (de bas en haut), aplati en profondeur
function turned(c, profile, depth, radial = 40) {
  const pts = profile.map(([y, r]) => new THREE.Vector2(Math.max(1e-5, r), y));
  const g = new THREE.LatheGeometry(pts, radial);
  g.scale(1, 1, depth);
  g.computeVertexNormals();
  return g.translate(c.x, c.y, c.z);
}

// Tete : un oeuf dont le menton s'affine
const HEAD = { rx: 0.096, ry: 0.115, rz: 0.104, chin: 0.2 };
function headPoint(v, grow = 1) {
  const k = v.y < 0 ? 1 + HEAD.chin * v.y : 1;   // v.y dans [-1, 1]
  return new THREE.Vector3(v.x * HEAD.rx * k * grow, v.y * HEAD.ry * grow, v.z * HEAD.rz * k * grow);
}
function headGeometry(c, seg = 40) {
  const g = new THREE.SphereGeometry(1, seg, Math.round(seg * 0.7));
  const pos = g.attributes.position;
  const v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) {
    v.fromBufferAttribute(pos, i);
    const p = headPoint(v);
    pos.setXYZ(i, p.x, p.y, p.z);
  }
  g.computeVertexNormals();
  return g.translate(c.x, c.y, c.z);
}

// Visiere : un ecran en squircle pose sur le visage (meme courbure que la tete, un cheveu au-dessus)
const VISOR = { phi: 0.82, theta: 1.41, dtheta: 0.41, n: 4.2 };
function visorGeometry(segX = 48, segY = 24) {
  const pos = [];
  const uv = [];
  const idx = [];
  for (let j = 0; j <= segY; j++) {
    for (let i = 0; i <= segX; i++) {
      let x = -1 + (2 * i) / segX;
      let y = -1 + (2 * j) / segY;
      // Le carre de la grille devient un squircle : chaque point glisse le long de son rayon
      const m = Math.max(Math.abs(x), Math.abs(y));
      if (m > 1e-6) {
        const dx = x / m;
        const dy = y / m;
        const k = (Math.abs(dx) ** VISOR.n + Math.abs(dy) ** VISOR.n) ** (-1 / VISOR.n);
        x *= k;
        y *= k;
      }
      const phi = Math.PI / 2 + x * VISOR.phi;
      const theta = VISOR.theta - y * VISOR.dtheta;
      const unit = new THREE.Vector3(-Math.cos(phi) * Math.sin(theta), Math.cos(theta), Math.sin(phi) * Math.sin(theta));
      const p = headPoint(unit, 1.016);
      pos.push(p.x, p.y, p.z);
      uv.push((x + 1) / 2, (y + 1) / 2);
    }
  }
  for (let j = 0; j < segY; j++) {
    for (let i = 0; i < segX; i++) {
      const a = j * (segX + 1) + i;
      const b = a + 1;
      const c = a + segX + 1;
      const d = c + 1;
      idx.push(a, b, d, a, d, c);
    }
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2));
  g.setIndex(idx);
  g.computeVertexNormals();
  return g;
}

// ---------- Materiau : porcelaine, articulations graphite, encre par canal ----------
// Chaque canal porte une couleur et une dose : la piece se teinte (melange de la couleur de base vers
// l'encre), elle ne s'allume pas. uInkGlow ajoute un peu de lumiere propre, pour la salle de concert.
function bodyMaterial(uniforms) {
  const mat = new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 0.42, metalness: 0.02 });
  mat.onBeforeCompile = (shader) => {
    shader.uniforms.uGlow = uniforms.uGlow;
    shader.uniforms.uRim = uniforms.uRim;
    shader.uniforms.uInkGlow = uniforms.uInkGlow;
    shader.vertexShader = shader.vertexShader
      .replace('#include <common>', `#include <common>
attribute float aGlow;
attribute float aGlowK;
uniform vec4 uGlow[${GLOW.count}];
varying vec4 vInk;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vec4 ink = uGlow[int(aGlow + 0.5)];
vInk = vec4(ink.rgb, ink.a * aGlowK);`);
    shader.fragmentShader = shader.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec4 vInk;
uniform vec3 uRim;
uniform float uInkGlow;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
diffuseColor.rgb = mix(diffuseColor.rgb, vInk.rgb, clamp(vInk.a, 0.0, 1.0));`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
totalEmissiveRadiance += vInk.rgb * clamp(vInk.a, 0.0, 1.0) * uInkGlow;
float rimF = 1.0 - clamp(dot(normal, normalize(vViewPosition)), 0.0, 1.0);
totalEmissiveRadiance += uRim * rimF * rimF * rimF;`);
  };
  mat.customProgramCacheKey = () => 'prof-porcelaine';
  return mat;
}

// ---------- Visage ----------
// Un visage dessine a l'encre sur la porcelaine, comme un croquis de carnet. Le canevas est
// transparent : seule l'encre se pose sur la tete. Un reflet de papier laisse en reserve donne vie
// au regard ; deux touches de crayon rouge aux joues quand il est content.
const INK = '#1c1814';
const PAPER = '#f7f2ea';
const BLUSH = 'rgba(192,57,31,0.2)';

class Face {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.width = 256;
    this.canvas.height = 128;
    this.g = this.canvas.getContext('2d');
    this.tex = new THREE.CanvasTexture(this.canvas);
    this.tex.colorSpace = THREE.SRGBColorSpace;
    this.expr = 'idle';
    this.until = 0;
    this.time = 0;
    this.blink = 0;
    this.nextBlink = 1.5 + Math.random() * 2.5;
    this.key = '';
  }

  // Expression passagere (en secondes), puis retour a l'expression de fond
  feel(expr, seconds = 1.6) {
    this.expr = expr;
    this.until = this.time + seconds;
  }

  update(dt, lx, ly, base = 'idle') {
    this.time += dt;
    if (this.time > this.until) this.expr = base;
    // Clignement toutes les 2 a 5 secondes (jamais pendant un sourire)
    this.nextBlink -= dt;
    if (this.nextBlink <= 0) {
      this.blink += dt / 0.15;
      if (this.blink >= 1) { this.blink = 0; this.nextBlink = 2 + Math.random() * 3.2; }
    }
    const b = this.expr === 'happy' ? 0 : Math.sin(Math.min(1, this.blink) * Math.PI);
    const key = `${this.expr}|${Math.round(b * 4)}|${Math.round(lx)}|${Math.round(ly)}`;
    if (key === this.key) return;
    this.key = key;
    this.#draw(this.expr, b, lx, ly);
    this.tex.needsUpdate = true;
  }

  #draw(expr, blink, lx, ly) {
    const g = this.g;
    g.clearRect(0, 0, 256, 128);
    g.save();
    // La visiere est un peu moins large que le canevas : on etire a peine pour garder des yeux ronds
    g.translate(128, 0);
    g.scale(1.08, 1);
    g.translate(-128, 0);
    g.lineCap = 'round';
    g.lineJoin = 'round';
    const cy = 58 + ly;
    if (expr === 'happy') {
      g.fillStyle = BLUSH;
      for (const s of [-1, 1]) {
        g.beginPath();
        g.ellipse(128 + s * 56 + lx * 0.6, cy + 24, 16, 8, 0, 0, Math.PI * 2);
        g.fill();
      }
    }
    g.fillStyle = INK;
    g.strokeStyle = INK;
    [128 - 36 + lx, 128 + 36 + lx].forEach((x, k) => {
      const inner = k === 0 ? 1 : -1; // cote du nez
      if (expr === 'happy') {
        g.lineWidth = 7;
        g.beginPath();
        g.arc(x, cy + 9, 13, Math.PI * 1.14, Math.PI * 1.86);
        g.stroke();
        return;
      }
      let w = 26;
      let h = 36;
      if (expr === 'focus') { w = 28; h = 17; }
      if (expr === 'wow') { w = 31; h = 33; }
      if (expr === 'sorry') { w = 22; h = 28; }
      h = Math.max(2.6, h * (1 - blink));
      g.beginPath();
      g.ellipse(x, cy, w / 2, h / 2, 0, 0, Math.PI * 2);
      g.fill();
      if (h > 10) {
        // Le reflet : un point de papier laisse en reserve, du cote de la lumiere
        g.fillStyle = PAPER;
        g.beginPath();
        g.arc(x + w * 0.17, cy - h * 0.2, Math.min(w, h) * 0.17, 0, Math.PI * 2);
        g.fill();
        g.fillStyle = INK;
      }
      if (expr === 'focus') {
        // Paupiere appliquee : un trait courbe juste au-dessus
        g.lineWidth = 3.6;
        g.beginPath();
        g.moveTo(x - 16, cy - 11);
        g.quadraticCurveTo(x, cy - 16, x + 16, cy - 11);
        g.stroke();
      }
      if (expr === 'sorry') {
        // Sourcils inquiets : le bout cote nez remonte
        g.lineWidth = 4.2;
        g.beginPath();
        g.moveTo(x - 15 * inner, cy - 20);
        g.lineTo(x + 11 * inner, cy - 28);
        g.stroke();
      }
    });
    if (expr === 'happy') {
      g.lineWidth = 4.6;
      g.beginPath();
      g.arc(128 + lx, 82 + ly, 14, Math.PI * 0.18, Math.PI * 0.82);
      g.stroke();
    }
    if (expr === 'wow') {
      g.lineWidth = 4;
      g.beginPath();
      g.ellipse(128 + lx, 97 + ly, 5, 6.5, 0, 0, Math.PI * 2);
      g.stroke();
    }
    if (expr === 'sorry') {
      g.lineWidth = 3.6;
      g.beginPath();
      g.arc(128 + lx, 104 + ly, 10, Math.PI * 1.22, Math.PI * 1.78);
      g.stroke();
    }
    g.restore();
  }
}

// ---------- Assemblage ----------
export function buildTeacherBody() {
  const def = skeletonDef();
  const bones = {};
  for (const j of def.values()) {
    const b = new THREE.Bone();
    b.name = j.name;
    b.position.copy(j.p).sub(j.parent ? def.get(j.parent).p : new THREE.Vector3());
    bones[j.name] = b;
    if (j.parent) bones[j.parent].add(b);
  }
  const group = new THREE.Group();
  group.add(bones.Hips);
  group.updateMatrixWorld(true);
  const list = Object.values(bones);
  const index = new Map(list.map((b, i) => [b.name, i]));
  const P = (n) => def.get(n).p;
  const at = (n, dx, dy, dz) => P(n).clone().add(new THREE.Vector3(dx, dy, dz));

  const parts = [];
  const part = (geo, bone, color, glow = 0, k = 1) => parts.push({ geo, bone, color, glow, k });

  // Tronc : poitrine en V, taille graphite, bassin
  part(turned(at('Spine2', 0, 0, 0.004), [[-0.118, 0], [-0.116, 0.1], [-0.07, 0.124], [0, 0.147], [0.06, 0.163], [0.1, 0.167], [0.13, 0.156], [0.152, 0.126], [0.166, 0.08], [0.172, 0]], 0.64), 'Spine2', PORCELAIN);
  part(egg(at('Spine', 0, 0.055, 0), 0.104, 0.08, 0.074), 'Spine', GRAPHITE);
  part(turned(at('Hips', 0, 0, 0.004), [[-0.106, 0], [-0.092, 0.098], [-0.06, 0.14], [-0.02, 0.152], [0.03, 0.141], [0.068, 0.112], [0.088, 0.066], [0.094, 0]], 0.72), 'Hips', PORCELAIN);
  part(new THREE.TorusGeometry(0.05, 0.0085, 12, 48).rotateX(Math.PI / 2).translate(0, P('Neck').y + 0.004, P('Neck').z), 'Spine2', BRASS, GLOW.collar);
  part(limb(P('Neck'), P('Head'), 0.04, 0.036), 'Neck', GRAPHITE);
  // Tete et oreilles : un anneau qui rougit quand il ecoute
  const headC = at('Head', 0, 0.112, 0.008);
  part(headGeometry(headC), 'Head', PORCELAIN);
  for (const s of [1, -1]) {
    const ear = new THREE.Vector3(headC.x + s * 0.094, headC.y - 0.004, headC.z - 0.01);
    part(new THREE.CylinderGeometry(0.025, 0.027, 0.016, 28).rotateZ(Math.PI / 2).translate(ear.x, ear.y, ear.z), 'Head', GRAPHITE);
    part(new THREE.TorusGeometry(0.021, 0.0042, 8, 36).rotateY(Math.PI / 2).translate(ear.x + s * 0.0085, ear.y, ear.z), 'Head', PORCELAIN, GLOW.ears);
  }

  for (const [S, s] of [['Left', 1], ['Right', -1]]) {
    // Bras : l'epaule de porcelaine coiffe la rotule
    part(ball(P(`${S}Arm`), 0.048, 16), `${S}Arm`, GRAPHITE);
    part(egg(at(`${S}Arm`, s * 0.012, 0.012, 0), 0.057, 0.053, 0.056, 24), `${S}Arm`, PORCELAIN);
    part(limb(P(`${S}Arm`), P(`${S}ForeArm`), 0.052, 0.043), `${S}Arm`, PORCELAIN);
    part(ball(P(`${S}ForeArm`), 0.041, 14), `${S}ForeArm`, GRAPHITE);
    part(limb(P(`${S}ForeArm`), P(`${S}Hand`), 0.042, 0.031), `${S}ForeArm`, PORCELAIN);
    {
      const cuff = P(`${S}ForeArm`).clone().lerp(P(`${S}Hand`), 0.86);
      part(new THREE.TorusGeometry(0.031, 0.0055, 8, 32).rotateY(Math.PI / 2).translate(cuff.x, cuff.y, cuff.z), `${S}ForeArm`, GRAPHITE);
    }
    part(ball(P(`${S}Hand`), 0.026, 12), `${S}Hand`, GRAPHITE);
    // Paume
    part(box(at(`${S}Hand`, s * 0.05, 0.002, 0), 0.094, 0.031, 0.08, 0.0145), `${S}Hand`, PORCELAIN);
    // Doigts : articulation graphite a la base, bout lumineux
    FINGERS.forEach((f, i) => {
      const [r0, r1] = FINGER_R[f];
      const j = (k) => P(`${S}Hand${f}${k}`);
      const dr = (r0 - r1) / 3;
      part(ball(j(f === 'Thumb' ? 2 : 1), r0 * 1.14, 10), `${S}Hand${f}${f === 'Thumb' ? 2 : 1}`, GRAPHITE);
      for (let k = 1; k <= 3; k++) {
        part(limb(j(k), j(k + 1), r0 - dr * (k - 1), r0 - dr * k, 12, 4), `${S}Hand${f}${k}`, PORCELAIN, GLOW.finger(S, i), [0.35, 0.6, 1][k - 1]);
      }
    });
    // Jambes
    part(ball(P(`${S}UpLeg`), 0.066, 16), `${S}UpLeg`, GRAPHITE);
    part(limb(P(`${S}UpLeg`), P(`${S}Leg`), 0.074, 0.054), `${S}UpLeg`, PORCELAIN);
    part(ball(P(`${S}Leg`), 0.05, 14), `${S}Leg`, GRAPHITE);
    part(limb(P(`${S}Leg`), P(`${S}Foot`), 0.052, 0.036), `${S}Leg`, PORCELAIN);
    part(ball(P(`${S}Foot`), 0.035, 12), `${S}Foot`, GRAPHITE);
    part(box(at(`${S}Foot`, 0, -0.052, 0.06), 0.088, 0.058, 0.225, 0.022), `${S}Foot`, PORCELAIN);
  }

  // Un seul maillage : chaque sommet suit entierement l'os de sa piece
  const geos = parts.map(({ geo, bone, color, glow, k }) => {
    geo.deleteAttribute('uv');
    if (!geo.index) geo.setIndex([...Array(geo.attributes.position.count).keys()]);
    const n = geo.attributes.position.count;
    const col = new Float32Array(n * 3);
    const si = new Uint16Array(n * 4);
    const sw = new Float32Array(n * 4);
    const gl = new Float32Array(n);
    const gk = new Float32Array(n).fill(k);
    const bi = index.get(bone);
    for (let v = 0; v < n; v++) {
      col[v * 3] = color.r; col[v * 3 + 1] = color.g; col[v * 3 + 2] = color.b;
      si[v * 4] = bi;
      sw[v * 4] = 1;
      gl[v] = glow;
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.setAttribute('skinIndex', new THREE.BufferAttribute(si, 4));
    geo.setAttribute('skinWeight', new THREE.BufferAttribute(sw, 4));
    geo.setAttribute('aGlow', new THREE.BufferAttribute(gl, 1));
    geo.setAttribute('aGlowK', new THREE.BufferAttribute(gk, 1));
    return geo;
  });
  const geometry = mergeGeometries(geos);
  geos.forEach((g) => g.dispose());

  const uniforms = {
    // Vector4() vaut (0, 0, 0, 1) par defaut : la dose d'encre doit partir de zero
    uGlow: { value: Array.from({ length: GLOW.count }, () => new THREE.Vector4(0, 0, 0, 0)) },
    uRim: { value: new THREE.Vector3(0, 0, 0) },
    uInkGlow: { value: 0 },
  };
  const mesh = new THREE.SkinnedMesh(geometry, bodyMaterial(uniforms));
  mesh.frustumCulled = false;
  group.add(mesh);
  const skeleton = new THREE.Skeleton(list);
  mesh.bind(skeleton);

  // Le visage : une decalcomanie d'encre posee a fleur de porcelaine (le canevas est transparent)
  const face = new Face();
  const visor = new THREE.Mesh(visorGeometry(), new THREE.MeshStandardMaterial({
    map: face.tex, transparent: true, depthWrite: false, roughness: 0.5, metalness: 0,
    polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
  }));
  visor.userData.noShadow = true;
  visor.position.copy(headC).sub(P('Head'));
  visor.frustumCulled = false;
  bones.Head.add(visor);

  group.userData.body = { bones, mesh, visor, face, uniforms };
  return group;
}
