// Installer le site comme une application : plein ecran sur la tablette posee au pupitre, et hors ligne.
let deferred = null;
const listeners = new Set();
const emit = () => listeners.forEach((fn) => fn());

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  deferred = e;
  emit();
});
window.addEventListener('appinstalled', () => {
  deferred = null;
  emit();
});

// Active le fonctionnement hors ligne (https, ou localhost pendant le developpement)
export function registerOffline() {
  if (!('serviceWorker' in navigator)) return;
  const local = ['localhost', '127.0.0.1'].includes(location.hostname);
  if (location.protocol !== 'https:' && !local) return;
  navigator.serviceWorker.register('./sw.js').then(() => emit()).catch(() => {});
  navigator.serviceWorker.addEventListener?.('controllerchange', emit);
}

export const canInstall = () => !!deferred;
export const isInstalled = () => window.matchMedia('(display-mode: standalone)').matches || navigator.standalone === true;
export const isIOS = () => /iphone|ipad|ipod/i.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);

export async function install() {
  if (!deferred) return false;
  deferred.prompt();
  const { outcome } = await deferred.userChoice;
  deferred = null;
  emit();
  return outcome === 'accepted';
}

export async function offlineReady() {
  if (!('serviceWorker' in navigator)) return false;
  const reg = await navigator.serviceWorker.getRegistration();
  return !!reg?.active;
}

export function onInstallChange(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}
