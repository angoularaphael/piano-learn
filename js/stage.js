// Un seul moteur 3D pour tout le site.
// Le canvas passe d'une page a l'autre : pas de nouveau contexte WebGL, pas de shaders a recompiler,
// donc pas de saccade quand on change de page. La resolution s'adapte toute seule a la machine
// pour garder une image fluide (et donc une touche qui repond tout de suite).
import * as THREE from 'three';

let renderer = null;
let owner = null;
const quality = {
  bloom: true,
  max: 1,
  ratio: 1,
  frames: [],
  lastChange: 0,
  listeners: new Set(),
};

export function getRenderer() {
  if (renderer) return renderer;
  renderer = new THREE.WebGLRenderer({ antialias: true, powerPreference: 'high-performance', alpha: false });
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  const el = renderer.domElement;
  el.className = 'gl';
  el.setAttribute('aria-hidden', 'true');
  // Rien ne doit voler le doigt au clavier : pas de menu, pas de loupe, pas de selection
  el.addEventListener('contextmenu', (e) => e.preventDefault());
  const small = Math.min(window.innerWidth, window.innerHeight) < 600;
  quality.max = Math.min(window.devicePixelRatio || 1, small ? 2 : 2);
  quality.ratio = Math.min(quality.max, small ? 1.5 : 1.75);
  renderer.setPixelRatio(quality.ratio);
  return renderer;
}

// Une scene prend le canvas : elle le place dans son conteneur et devient la seule a dessiner
export function attach(container, who) {
  const r = getRenderer();
  if (owner && owner !== who) owner.detached?.();
  owner = who;
  r.setAnimationLoop(null);
  container.appendChild(r.domElement);
  quality.frames.length = 0;
  return r;
}

export function detach(who) {
  if (owner !== who || !renderer) return;
  renderer.setAnimationLoop(null);
  renderer.domElement.remove();
  owner = null;
}

// A appeler a chaque image avec la duree de l'image : baisse ou remonte la resolution
export function measureFrame(ms) {
  if (!renderer) return;
  // Image tres en retard = onglet en arriere-plan ou fenetre cachee, pas une machine lente
  if (ms > 100 || document.hidden) return;
  const f = quality.frames;
  f.push(ms);
  if (f.length < 45) return;
  const sorted = [...f].sort((a, b) => a - b);
  const median = sorted[Math.floor(sorted.length / 2)];
  f.length = 0;
  const now = performance.now();
  if (now - quality.lastChange < 1500) return;
  let next = quality.ratio;
  // Deja au plus bas et toujours lent : on coupe le halo lumineux (le plus gourmand)
  if (median > 24 && quality.ratio <= 0.75 && quality.bloom) { quality.bloom = false; quality.lastChange = now; return; }
  if (median > 21) next = Math.max(0.75, quality.ratio - 0.25);
  else if (median < 13 && quality.ratio < quality.max) next = Math.min(quality.max, quality.ratio + 0.125);
  if (next !== quality.ratio) {
    quality.ratio = next;
    quality.lastChange = now;
    renderer.setPixelRatio(next);
    quality.listeners.forEach((fn) => fn(next));
  }
}

export function onQualityChange(fn) {
  quality.listeners.add(fn);
  return () => quality.listeners.delete(fn);
}

export function bloomAllowed() {
  return quality.bloom;
}

// Prefere-t-on une version allegee ? (petit ecran tactile ou economie d'energie demandee)
export function lowPower() {
  const coarse = window.matchMedia('(pointer: coarse)').matches;
  const small = Math.min(window.innerWidth, window.innerHeight) < 500;
  return (coarse && small) || navigator.connection?.saveData === true;
}
