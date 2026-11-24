// Accord attendu : on cherche dans le spectre la fondamentale de CHACUNE de ses notes.
// - Une note seule ou une partie de l'accord ne suffit pas : chaque note doit avoir son propre pic.
// - Un pic n'est pas compte s'il n'est qu'une harmonique (x2, x3) d'une note plus grave qui n'est pas
//   dans l'accord : c'est ce qui empeche un do grave seul, ou deux notes graves, de passer pour un accord.
// - L'accord peut etre joue tel qu'ecrit, ou une octave plus bas (jamais plus haut : les harmoniques
//   des notes jouees tombent justement une octave plus haut).
// db : spectre en decibels (AnalyserNode), binHz : largeur d'une case, tuning : ecart du piano en cents.
export function chordPresent(db, binHz, midis, tuning = 0, margin = 18) {
  const lo = Math.max(1, Math.floor(55 / binHz));
  const hi = Math.min(db.length - 1, Math.ceil(2200 / binHz));
  let ref = -Infinity;
  for (let k = lo; k <= hi; k++) if (db[k] > ref) ref = db[k];
  if (!(ref > -85)) return false;
  const peak = (f) => {
    const a = Math.max(1, Math.floor((f * 0.976) / binHz));
    const b = Math.min(db.length - 1, Math.ceil((f * 1.024) / binHz));
    let m = -Infinity;
    for (let k = a; k <= b; k++) if (db[k] > m) m = db[k];
    return m;
  };
  const freq = (m) => 440 * 2 ** ((m - 69 + tuning / 100) / 12);
  return [0, -12].some((shift) => {
    const fs = midis.map((m) => freq(m + shift));
    const inChord = (f) => fs.some((g) => Math.abs(g / f - 1) < 0.03);
    return fs.every((f) => {
      const p = peak(f);
      if (p <= ref - margin) return false;
      // Harmonique d'une note plus grave, absente de l'accord ? Alors ce pic ne prouve rien.
      return ![2, 3].some((d) => { const sub = f / d; return sub > 50 && !inChord(sub) && peak(sub) > p - 3; });
    });
  });
}
