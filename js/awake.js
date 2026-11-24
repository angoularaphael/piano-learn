// L'ecran reste allume pendant une lecon : la tablette posee sur le pupitre ne s'eteint pas en plein morceau.
let sentinel = null;
let wanted = false;

export async function keepAwake(on) {
  wanted = on;
  if (!('wakeLock' in navigator)) return;
  try {
    if (on && !sentinel) {
      sentinel = await navigator.wakeLock.request('screen');
      sentinel.addEventListener('release', () => { sentinel = null; });
    } else if (!on && sentinel) {
      await sentinel.release();
      sentinel = null;
    }
  } catch (e) { /* refuse (batterie faible, onglet cache) : rien de grave */ }
}

// Le verrou saute quand on change d'onglet : on le reprend au retour
document.addEventListener('visibilitychange', () => {
  if (wanted && document.visibilityState === 'visible') keepAwake(true);
});
