// Les couleurs de l'edition, pour le code (3D, canevas) : les memes que dans css/style.css.
// Le crayon bicolore du prof : vermillon pour la main droite, bleu pour la main gauche.
export const PAL = {
  paper: '#f3eee3',
  paperHi: '#f8f4ec',
  studio: '#e7e1d4',     // le fond du studio ou pose le piano
  ink: '#1c1814',
  graphite: '#57524c',   // une note fausse : un trait de crayon gris, pas une alarme
  right: '#c0391f',
  left: '#2a4b9b',
  ok: '#2c7445',
  brass: '#9b7633',
  night: '#14110e',
};
export const handColor = (hand) => (hand === 'L' || hand === 'Left' || hand === 'gauche' ? PAL.left : PAL.right);
