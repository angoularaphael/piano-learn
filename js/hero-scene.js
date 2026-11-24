// Scene d'accueil : un clavier neon qui ondule dans l'espace et joue tout seul.
// Passer la souris (ou le doigt) sur les touches les fait jouer.
import * as THREE from 'three';
import { isBlack } from './notes.js';
import { noteOn, noteOff } from './audio.js';
import { NoteFX } from './note-fx.js';
import { createBloom } from './bloom.js';

const CYAN = new THREE.Color('#3ef2ff');
const VIOLET = new THREE.Color('#8b5cff');
const PINK = new THREE.Color('#ff4fd8');

// Debut de la Lettre a Elise, en boucle
const MELODY = [
  [76, 1], [75, 1], [76, 1], [75, 1], [76, 1], [71, 1], [74, 1], [72, 1], [69, 3],
  [60, 1], [64, 1], [69, 1], [71, 3], [64, 1], [68, 1], [71, 1], [72, 3],
  [64, 1], [76, 1], [75, 1], [76, 1], [75, 1], [76, 1], [71, 1], [74, 1], [72, 1], [69, 3],
  [60, 1], [64, 1], [69, 1], [71, 3], [64, 1], [72, 1], [71, 1], [69, 4],
];

export function createHeroScene(container) {
  const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const mobile = window.innerWidth < 760;

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance' });
  } catch (e) {
    return { dispose() {} };
  }
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, mobile ? 1.5 : 2));
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  container.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  scene.background = new THREE.Color('#04050b');
  scene.fog = new THREE.FogExp2('#04050b', 0.028);

  const camera = new THREE.PerspectiveCamera(42, 1, 0.1, 300);
  camera.position.set(0, 7, 22);

  scene.add(new THREE.AmbientLight('#4058ff', 0.6));
  const key = new THREE.PointLight('#3ef2ff', 60, 60, 1.6);
  key.position.set(-6, 10, 8);
  scene.add(key);
  const rim = new THREE.PointLight('#8b5cff', 80, 70, 1.6);
  rim.position.set(10, 6, -6);
  scene.add(rim);

  // ---------- Clavier ----------
  const board = new THREE.Group();
  board.rotation.set(0.32, -0.42, 0.06);
  board.position.set(5, 0.5, -2);
  scene.add(board);

  const LOW = 36, HIGH = 96;
  const whiteGeo = new THREE.BoxGeometry(0.92, 0.5, 5.6);
  const blackGeo = new THREE.BoxGeometry(0.55, 0.5, 3.5);
  const whiteEdges = new THREE.EdgesGeometry(whiteGeo);
  const blackEdges = new THREE.EdgesGeometry(blackGeo);
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
    const mat = new THREE.MeshStandardMaterial({
      color: black ? '#06070f' : '#10142b', metalness: 0.7, roughness: 0.25,
      emissive: new THREE.Color('#000'), emissiveIntensity: 1,
    });
    const mesh = new THREE.Mesh(black ? blackGeo : whiteGeo, mat);
    mesh.userData.midi = m;
    g.add(mesh);
    const lineMat = new THREE.LineBasicMaterial({
      color: black ? VIOLET : CYAN, transparent: true, opacity: black ? 0.55 : 0.4,
      blending: THREE.AdditiveBlending, depthWrite: false,
    });
    g.add(new THREE.LineSegments(black ? blackEdges : whiteEdges, lineMat));
    board.add(g);
    keyMeshes.push(mesh);
    keys.set(m, { g, mat, lineMat, black, x: x - off, glow: 0, depth: 0, held: false, baseLine: black ? 0.55 : 0.4 });
  }

  // Ligne lumineuse sous le clavier
  const strip = new THREE.Mesh(
    new THREE.BoxGeometry(wi + 2, 0.06, 0.06),
    new THREE.MeshBasicMaterial({ color: CYAN.clone().multiplyScalar(1.5) })
  );
  strip.position.set(0, -0.3, 2.85);
  board.add(strip);

  const fx = new NoteFX(board, { speed: 7, grow: 14, maxHeight: 14, sparkSize: 0.25, intensity: 0.7 });

  // ---------- Poussiere d'etoiles ----------
  const N = mobile ? 900 : 2200;
  const pos = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) {
    pos[i * 3] = (Math.random() - 0.5) * 120;
    pos[i * 3 + 1] = (Math.random() - 0.3) * 60;
    pos[i * 3 + 2] = (Math.random() - 0.8) * 90;
  }
  const dustGeo = new THREE.BufferGeometry();
  dustGeo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const dust = new THREE.Points(dustGeo, new THREE.PointsMaterial({
    color: '#9fb4ff', size: 0.12, transparent: true, opacity: 0.7, blending: THREE.AdditiveBlending, depthWrite: false,
  }));
  scene.add(dust);

  // Sol en grille
  const grid = new THREE.GridHelper(240, 120, '#3ef2ff', '#1b2350');
  grid.position.y = -9;
  grid.material.transparent = true;
  grid.material.opacity = 0.25;
  scene.add(grid);

  const bloom = mobile ? null : createBloom(renderer, scene, camera, { strength: 0.85, radius: 0.45, threshold: 0.55 });

  // ---------- Jeu des touches ----------
  let soundOn = false;
  const colorFor = (m) => (isBlack(m) ? VIOLET : m % 12 === 0 ? PINK : CYAN);
  const tmp = new THREE.Vector3();

  function press(m, withSound) {
    const k = keys.get(m);
    if (!k || k.held) return;
    k.held = true;
    k.glow = 1;
    tmp.set(k.x, k.black ? 0.7 : 0.3, k.black ? -2.2 : -1.6);
    fx.start(m, tmp, colorFor(m), k.black ? 0.35 : 0.55);
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
  renderer.setAnimationLoop(() => {
    if (!visible || document.hidden) return;
    const dt = Math.min(clock.getDelta(), 0.05);
    t += reduced ? 0 : dt;

    for (const [m, k] of keys) {
      const wave = Math.sin(k.x * 0.16 - t * 1.1) * 0.9 + Math.sin(k.x * 0.05 + t * 0.4) * 0.6;
      k.depth += ((k.held ? -0.28 : 0) - k.depth) * Math.min(1, dt * 18);
      k.g.position.y = (k.black ? 0.42 : 0) + wave + k.depth;
      k.g.rotation.x = k.held ? 0.06 : 0;
      k.glow = k.held ? 1 : Math.max(0, k.glow - dt * 1.8);
      const c = colorFor(m);
      k.mat.emissive.copy(c).multiplyScalar(k.glow * 0.9);
      k.lineMat.opacity = k.baseLine + k.glow * 0.6;
    }
    // Les colonnes suivent la vague de leur touche
    for (const [m, col] of fx.held) {
      const k = keys.get(m);
      col.position.y = k.g.position.y + (k.black ? 0.3 : 0.25);
    }
    fx.update(dt);

    dust.rotation.y = t * 0.01;
    grid.position.z = (t * 2) % 2;
    mouse.sx += (mouse.x - mouse.sx) * 0.05;
    mouse.sy += (mouse.y - mouse.sy) * 0.05;
    const scroll = Math.min(window.scrollY / window.innerHeight, 1);
    camera.position.set(mouse.sx * 2.5, 7 + mouse.sy * 1.5 + scroll * 4, 22 - scroll * 6);
    camera.lookAt(0, -2.5 - scroll * 2, 0);
    board.rotation.y = -0.42 + Math.sin(t * 0.2) * 0.05;

    if (bloom) bloom.render(); else renderer.render(scene, camera);
  });

  return {
    dispose() {
      clearTimeout(timer);
      renderer.setAnimationLoop(null);
      ro.disconnect();
      vio.disconnect();
      el.removeEventListener('pointermove', onMove);
      el.removeEventListener('pointerleave', onLeave);
      el.removeEventListener('pointerdown', onDown);
      if (hovered != null) release(hovered, true);
      fx.dispose();
      bloom?.dispose();
      scene.traverse((o) => { o.geometry?.dispose(); if (o.material) [].concat(o.material).forEach((m) => m.dispose()); });
      renderer.dispose();
      el.remove();
    },
  };
}
