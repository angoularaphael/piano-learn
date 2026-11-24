// Hors ligne : la tablette posee sur le pupitre continue de marcher sans reseau.
// - Le code (pages, scripts, styles, donnees) : le reseau d'abord, la copie gardee si pas de reseau.
// - Les ressources lourdes (3D, sons, polices, icones) : la copie gardee d'abord, elles ne changent pas.
// La liste et la version sont regenerees par tools/precache.py.

// PRECACHE-START
const VERSION = 'pl-app-5f162efbb1';
const PRECACHE = [
  './',
  'css/fonts.css',
  'css/style.css',
  'favicon.svg',
  'fonts/NotoMusic-latin-ext.woff2',
  'fonts/NotoMusic-latin.woff2',
  'fonts/NotoMusic-music.woff2',
  'fonts/SpaceGrotesk-latin-ext.woff2',
  'fonts/SpaceGrotesk-latin.woff2',
  'fonts/Unbounded-latin-ext.woff2',
  'fonts/Unbounded-latin.woff2',
  'icons/apple-touch-icon.png',
  'icons/icon-192.png',
  'icons/icon-512.png',
  'icons/icon-maskable-512.png',
  'index.html',
  'js/app-install.js',
  'js/audio.js',
  'js/awake.js',
  'js/backing.js',
  'js/bilan.js',
  'js/bloom.js',
  'js/certificate.js',
  'js/chord.js',
  'js/concert.js',
  'js/data/badges.js',
  'js/data/curriculum.js',
  'js/data/en/curriculum.js',
  'js/data/en/songs.js',
  'js/data/library.js',
  'js/data/morceaux.js',
  'js/data/paliers-equipe.js',
  'js/data/paliers.js',
  'js/data/songs.js',
  'js/data/theorie.js',
  'js/fx.js',
  'js/grand.js',
  'js/hero-scene.js',
  'js/highway.js',
  'js/instrument.js',
  'js/kbd-ui.js',
  'js/lesson.js',
  'js/listen.js',
  'js/main.js',
  'js/midi.js',
  'js/mount.js',
  'js/note-fx.js',
  'js/notes.js',
  'js/piano3d.js',
  'js/progress.js',
  'js/recorder.js',
  'js/score.js',
  'js/share.js',
  'js/sheet.js',
  'js/staff.js',
  'js/stage.js',
  'js/teacher-body.js',
  'js/teacher.js',
  'js/text.js',
  'js/tutorial.js',
  'js/voice.js',
  'manifest.webmanifest',
  'sounds/piano/A0.mp3',
  'sounds/piano/A1.mp3',
  'sounds/piano/A2.mp3',
  'sounds/piano/A3.mp3',
  'sounds/piano/A4.mp3',
  'sounds/piano/A5.mp3',
  'sounds/piano/A6.mp3',
  'sounds/piano/A7.mp3',
  'sounds/piano/C1.mp3',
  'sounds/piano/C2.mp3',
  'sounds/piano/C3.mp3',
  'sounds/piano/C4.mp3',
  'sounds/piano/C5.mp3',
  'sounds/piano/C6.mp3',
  'sounds/piano/C7.mp3',
  'sounds/piano/C8.mp3',
  'sounds/piano/Ds1.mp3',
  'sounds/piano/Ds2.mp3',
  'sounds/piano/Ds3.mp3',
  'sounds/piano/Ds4.mp3',
  'sounds/piano/Ds5.mp3',
  'sounds/piano/Ds6.mp3',
  'sounds/piano/Ds7.mp3',
  'sounds/piano/Fs1.mp3',
  'sounds/piano/Fs2.mp3',
  'sounds/piano/Fs3.mp3',
  'sounds/piano/Fs4.mp3',
  'sounds/piano/Fs5.mp3',
  'sounds/piano/Fs6.mp3',
  'sounds/piano/Fs7.mp3',
  'vendor/three/addons/environments/RoomEnvironment.js',
  'vendor/three/addons/geometries/RoundedBoxGeometry.js',
  'vendor/three/addons/postprocessing/EffectComposer.js',
  'vendor/three/addons/postprocessing/MaskPass.js',
  'vendor/three/addons/postprocessing/OutputPass.js',
  'vendor/three/addons/postprocessing/Pass.js',
  'vendor/three/addons/postprocessing/RenderPass.js',
  'vendor/three/addons/postprocessing/ShaderPass.js',
  'vendor/three/addons/postprocessing/UnrealBloomPass.js',
  'vendor/three/addons/shaders/CopyShader.js',
  'vendor/three/addons/shaders/LuminosityHighPassShader.js',
  'vendor/three/addons/shaders/OutputShader.js',
  'vendor/three/addons/utils/BufferGeometryUtils.js',
  'vendor/three/three.module.js',
];
// PRECACHE-END

const HEAVY = /\/(vendor|sounds|fonts|icons)\//;

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(VERSION)
      .then((cache) => cache.addAll(PRECACHE))
      .then(() => self.skipWaiting())
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(keys.filter((k) => (k.startsWith('pl-app-') && k !== VERSION) || k === 'pl-piano-v1').map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

function timeout(ms) {
  return new Promise((_, reject) => setTimeout(() => reject(new Error('lent')), ms));
}

async function heavyFirst(request) {
  const hit = await caches.match(request, { ignoreSearch: true });
  if (hit) return hit;
  const response = await fetch(request);
  if (response.ok) (await caches.open(VERSION)).put(request, response.clone());
  return response;
}

async function networkFirst(request) {
  try {
    const response = await Promise.race([fetch(request), timeout(4000)]);
    if (response.ok) (await caches.open(VERSION)).put(request, response.clone());
    return response;
  } catch (e) {
    const hit = await caches.match(request, { ignoreSearch: true });
    if (hit) return hit;
    if (request.mode === 'navigate') {
      const shell = await caches.match('index.html');
      if (shell) return shell;
    }
    throw e;
  }
}

self.addEventListener('fetch', (event) => {
  const { request } = event;
  if (request.method !== 'GET') return;
  const url = new URL(request.url);
  if (url.origin !== self.location.origin) return;
  event.respondWith(HEAVY.test(url.pathname) ? heavyFirst(request) : networkFirst(request));
});
