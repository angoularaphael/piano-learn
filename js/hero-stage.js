// L'ouverture de l'accueil : un clavier de concert qui flotte dans la nuit, ondule et joue tout seul le
// debut de la Lettre a Elise. Chaque touche jouee s'allume d'or et lance une colonne de lumiere, des
// poussieres derivent comme dans le faisceau d'un projecteur. Passer la souris (ou le doigt) sur les
// touches les fait jouer, avec le son des qu'on a touche la page une fois.
// Les couleurs viennent de la palette : la nuit et l'or (Nuit), ou le gris clair et l'orange (Clair).
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js';
import { isBlack } from './notes.js';
import { noteOn, noteOff } from './audio.js';
import { NoteFX } from './note-fx.js';
import { createBloom } from './bloom.js';
import { attach, detach, measureFrame, bloomAllowed } from './stage.js';
import { PAL, THEMES, themeId } from './palette.js';

// Debut de la Lettre a Elise, en boucle
const MELODY = [
  [76, 1], [75, 1], [76, 1], [75, 1], [76, 1], [71, 1], [74, 1], [72, 1], [69, 3],
  [60, 1], [64, 1], [69, 1], [71, 3], [64, 1], [68, 1], [71, 1], [72, 3],
  [64, 1], [76, 1], [75, 1], [76, 1], [75, 1], [76, 1], [71, 1], [74, 1], [72, 1], [69, 3],
  [60, 1], [64, 1], [69, 1], [71, 3], [64, 1], [72, 1], [71, 1], [69, 4],
];

const IVORY = '#f4efe4';
const EBONY = '#0e0d0c';

export function createHeroStage(container, { unfold = false } = {}) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.innerWidth < 760;
  const dark = THEMES[themeId()].dark;
  const accent = new THREE.Color(PAL.right);
  const owner = { detached() { renderer?.setAnimationLoop(null); } };

  let renderer;
  try {
    renderer = attach(container, owner);
  } catch (e) {
    return { dispose() {}, unfold() {} };
  }
  renderer.toneMappingExposure = 1;
  renderer.shadowMap.enabled = false;

  const scene = new THREE.Scene();
  scene.background = new THREE.Color(PAL.paper);
  scene.fog = new THREE.FogExp2(PAL.paper, dark ? 0.026 : 0.022);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);
  camera.position.set(0, 7, 22);

  // ---------- Lumieres ----------
  // Nuit : clair de lune froid, une lampe chaude au-dessus des touches, un liseré d'or derriere.
  // Clair : un studio lumineux.
  if (dark) {
    scene.add(new THREE.HemisphereLight('#9fb2d6', '#05080f', 0.55));
    // Sans halo (telephone), la lampe eclaire un peu plus pour garder l'ivoire lumineux
    const key = new THREE.SpotLight('#fff0dc', mobile ? 340 : 240, 90, 0.62, 0.9, 1.35);
    key.position.set(-6, 20, 12);
    key.target.position.set(2, 0, -1);
    scene.add(key, key.target);
    const rim = new THREE.PointLight(PAL.right, 45, 60, 1.6);
    rim.position.set(12, 5, -8);
    scene.add(rim);
  } else {
    scene.add(new THREE.HemisphereLight('#ffffff', '#c9c8c3', 1.25));
    const sun = new THREE.DirectionalLight('#fffaf2', 1.4);
    sun.position.set(-8, 20, 14);
    scene.add(sun);
  }

  // ---------- Clavier ----------
  const board = new THREE.Group();
  board.rotation.set(0.32, -0.42, 0.06);
  board.position.set(5, 0.5, -2);
  scene.add(board);

  const LOW = 36, HIGH = 96;
  const whiteGeo = new RoundedBoxGeometry(0.92, 0.5, 5.6, 2, 0.06);
  const blackGeo = new RoundedBoxGeometry(0.55, 0.5, 3.5, 2, 0.07);
  const keys = new Map();
  let wi = -1;
  const list = [];
  for (let m = LOW; m <= HIGH; m++) {
    if (!isBlack(m)) wi++;
    list.push({ m, x: isBlack(m) ? wi + 0.5 : wi });
  }
  const off = wi / 2;
  const keyMeshes = [];
  for (const { m, x } of list) {
    const black = isBlack(m);
    const g = new THREE.Group();
    g.position.set(x - off, black ? 0.42 : 0, black ? -1.05 : 0);
    // De vraies touches : ivoire satine, ebene laquee ; elles s'allument a la couleur d'action quand elles jouent
    const mat = new THREE.MeshStandardMaterial({
      color: black ? EBONY : IVORY, roughness: black ? 0.2 : 0.34, metalness: black ? 0.08 : 0,
      emissive: new THREE.Color('#000'), emissiveIntensity: 1,
    });
    const mesh = new THREE.Mesh(black ? blackGeo : whiteGeo, mat);
    mesh.userData.midi = m;
    g.add(mesh);
    board.add(g);
    keyMeshes.push(mesh);
    keys.set(m, { g, mat, black, x: x - off, glow: 0, depth: 0, held: false, appear: 1, delay: 0 });
  }
  // Le clavier se deploie a partir du do du milieu
  const c4 = keys.get(60).x;
  function startUnfold() {
    for (const k of keys.values()) {
      k.appear = 0;
      k.delay = Math.abs(k.x - c4) * 0.035;
    }
  }
  if (unfold && !reduced) startUnfold();

  // Le liteau de laiton sous les touches, et le feutre rouge derriere, comme sur un vrai piano
  const rail = new THREE.Mesh(
    new THREE.BoxGeometry(wi + 2.2, 0.12, 0.12),
    new THREE.MeshStandardMaterial({ color: PAL.brass, roughness: 0.3, metalness: 0.85, emissive: new THREE.Color(PAL.brass), emissiveIntensity: dark ? 0.35 : 0 }),
  );
  rail.position.set(0, -0.32, 2.9);
  board.add(rail);
  const felt = new THREE.Mesh(new THREE.BoxGeometry(wi + 1.4, 0.34, 0.2), new THREE.MeshStandardMaterial({ color: '#5c1418', roughness: 1 }));
  felt.position.set(0, 0.1, -2.95);
  board.add(felt);

  const fx = new NoteFX(board, { speed: 7, grow: 12, maxHeight: 11, sparkSize: 0.2, intensity: dark ? 0.55 : 0.45, additive: dark });

  // ---------- Poussieres dans la lumiere ----------
  const N = mobile ? 900 : 2200;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 120;
    pos[i * 3 + 1] = (Math.random() - 0.3) * 60;
    pos[i * 3 + 2] = (Math.random() - 0.8) * 90;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial(dark
    ? { color: '#e9d7ae', size: 0.11, transparent: true, opacity: 0.6, blending: THREE.AdditiveBlending, depthWrite: false }
    : { color: PAL.ink, size: 0.07, transparent: true, opacity: 0.22, depthWrite: false }));
  scene.add(dust);

  const bloom = !mobile && dark && bloomAllowed() ? createBloom(renderer, scene, camera, { strength: 0.75, radius: 0.45, threshold: 0.88 }) : null;

  // ---------- Jeu des touches ----------
  let soundOn = false;
  const tmp = new THREE.Vector3();

  function press(m, withSound) {
    const k = keys.get(m);
    if (!k || k.held) return;
    k.held = true;
    k.glow = 1;
    tmp.set(k.x, k.black ? 0.7 : 0.3, k.black ? -2.2 : -1.6);
    fx.start(m, tmp, accent, k.black ? 0.35 : 0.55);
    if (withSound && soundOn) noteOn(m, 0.6);
  }
  function release(m, withSound) {
    const k = keys.get(m);
    if (!k || !k.held) return;
    k.held = false;
    fx.end(m);
    if (withSound && soundOn) noteOff(m);
  }

  // Melodie automatique
  let mi = 0;
  let timer = null;
  const BEAT = 260;
  function nextNote() {
    const [m, len] = MELODY[mi];
    mi = (mi + 1) % MELODY.length;
    press(m, false);
    setTimeout(() => release(m, false), len * BEAT * 0.85);
    timer = setTimeout(nextNote, len * BEAT + (mi === 0 ? 1200 : 0));
  }
  if (!reduced) timer = setTimeout(nextNote, 900);

  // Survol : la touche sous la souris joue
  const ray = new THREE.Raycaster();
  const ndc = new THREE.Vector2();
  const mouse = { x: 0, y: 0, sx: 0, sy: 0 };
  let hovered = null;
  const el = renderer.domElement;
  function onMove(e) {
    const r = el.getBoundingClientRect();
    ndc.x = ((e.clientX - r.left) / r.width) * 2 - 1;
    ndc.y = -((e.clientY - r.top) / r.height) * 2 + 1;
    mouse.x = ndc.x; mouse.y = ndc.y;
    ray.setFromCamera(ndc, camera);
    const hit = ray.intersectObjects(keyMeshes, false)[0];
    const m = hit ? hit.object.userData.midi : null;
    if (m !== hovered) {
      if (hovered != null) release(hovered, true);
      hovered = m;
      if (m != null) press(m, true);
    }
  }
  function onLeave() { if (hovered != null) release(hovered, true); hovered = null; }
  function onDown(e) { soundOn = true; onMove(e); }
  el.addEventListener('pointermove', onMove);
  el.addEventListener('pointerleave', onLeave);
  el.addEventListener('pointerdown', onDown);

  // ---------- Taille et boucle ----------
  function resize() {
    const w = container.clientWidth || 1, h = container.clientHeight || 1;
    renderer.setSize(w, h, false);
    bloom?.setSize(w, h);
    camera.aspect = w / h;
    camera.fov = w / h < 1 ? 60 : 42;
    camera.updateProjectionMatrix();
  }
  const ro = new ResizeObserver(resize);
  ro.observe(container);
  resize();

  let visible = true;
  const vio = new IntersectionObserver(([e]) => { visible = e.isIntersecting; });
  vio.observe(container);

  const clock = new THREE.Clock();
  let t = 0;
  const frame = (raw) => {
    measureFrame(raw * 1000);
    const dt = Math.min(raw, 0.05);
    t += reduced ? 0 : dt;

    for (const k of keys.values()) {
      const wave = Math.sin(k.x * 0.16 - t * 1.1) * 0.9 + Math.sin(k.x * 0.05 + t * 0.4) * 0.6;
      k.depth += ((k.held ? -0.28 : 0) - k.depth) * Math.min(1, dt * 18);
      if (k.appear < 1) {
        if (k.delay > 0) k.delay -= dt;
        else k.appear = Math.min(1, k.appear + dt * 2.6);
        const e = 1 - Math.pow(1 - k.appear, 3);
        k.g.scale.set(1, Math.max(0.001, e), Math.max(0.001, e));
      }
      k.g.position.y = (k.black ? 0.42 : 0) + wave + k.depth + (1 - k.appear) * 1.5;
      k.g.rotation.x = k.held ? 0.06 : 0;
      k.glow = k.held ? 1 : Math.max(0, k.glow - dt * 1.8);
      // Seule la touche qui joue brille (assez pour passer le seuil du halo), les autres restent de l'ivoire
      k.mat.emissive.copy(accent).multiplyScalar(k.glow * (dark ? (k.black ? 1.6 : 1.15) : 0.4));
    }
    // Les colonnes suivent la vague de leur touche
    for (const [m, col] of fx.held) {
      const k = keys.get(m);
      col.position.y = k.g.position.y + (k.black ? 0.3 : 0.25);
    }
    fx.update(dt);

    dust.rotation.y = t * 0.01;
    mouse.sx += (mouse.x - mouse.sx) * 0.05;
    mouse.sy += (mouse.y - mouse.sy) * 0.05;
    const scroll = Math.min(window.scrollY / window.innerHeight, 1);
    camera.position.set(mouse.sx * 2.5, 7 + mouse.sy * 1.5 + scroll * 4, 22 - scroll * 6);
    camera.lookAt(0, -2.5 - scroll * 2, 0);
    board.rotation.y = -0.42 + Math.sin(t * 0.2) * 0.05;

    if (bloom) bloom.render(); else renderer.render(scene, camera);
  };
  renderer.setAnimationLoop(() => {
    const raw = clock.getDelta();
    if (!visible || document.hidden) return;
    frame(raw);
  });
  // ?debug : faire avancer la scene a la main (l'onglet de test tourne au ralenti)
  if (location.search.includes('debug')) {
    window.__stage = { renderer, advance(seconds) { for (let i = 0; i < seconds * 30; i++) frame(1 / 30); }, press, release };
  }

  return {
    unfold() { if (!reduced) startUnfold(); },
    dispose() {
      clearTimeout(timer);
      renderer.setAnimationLoop(null);
      detach(owner);
      ro.disconnect();
      vio.disconnect();
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('pointerdown', onDown);
      if (hovered != null) release(hovered, true);
      fx.dispose();
      bloom?.dispose();
      scene.traverse((o) => { o.geometry?.dispose(); if (o.material) [].concat(o.material).forEach((m) => m.dispose()); });
    },
  };
}
