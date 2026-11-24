// Les fiches de theorie : une idee par fiche, ouverte au palier ou tu en as besoin.
// Chaque fiche : un dessin, trois paragraphes, un exemple ecrit sur la portee que tu peux ecouter
// (les notes s'allument quand elles sonnent), et la regle a retenir.
import { FICHES } from './data/theorie.js';
import { PALIERS, currentPalier } from './data/paliers.js';
import { getState } from './progress.js';
import { parseScore } from './score.js';
import { Sheet } from './sheet.js';
import { noteOn, noteOff, getContext } from './audio.js';
import { L, t, lang } from './i18n.js';
import { fr, esc } from './text.js';

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---------- Dessins ----------
const WHITE_NAMES = lang() === 'en' ? ['C', 'D', 'E', 'F', 'G', 'A', 'B'] : ['do', 'ré', 'mi', 'fa', 'sol', 'la', 'si'];

function drawKeyboard() {
  const W = 30;
  const H = 120;
  let s = `<svg class="th-art th-kb" viewBox="0 0 ${14 * W + 2} ${H + 34}" aria-hidden="true">`;
  for (let i = 0; i < 14; i++) {
    s += `<rect class="w ${i % 7 === 0 ? 'c' : ''}" x="${1 + i * W}" y="1" width="${W - 2}" height="${H}" rx="4"/>`;
    s += `<text x="${1 + i * W + W / 2}" y="${H - 10}">${WHITE_NAMES[i % 7]}</text>`;
  }
  [0, 1, 3, 4, 5].forEach((k) => [0, 7].forEach((o) => {
    const x = 1 + (k + o + 1) * W - W * 0.32;
    s += `<rect class="b ${k < 2 ? 'two' : 'three'}" x="${x}" y="1" width="${W * 0.64}" height="${H * 0.6}" rx="3"/>`;
  }));
  s += `<text class="cap" x="${1 + 1.5 * W}" y="${H + 26}">${t('2 noires')}</text><text class="cap" x="${1 + 5 * W}" y="${H + 26}">${t('3 noires')}</text>`;
  return `${s}</svg>`;
}

function drawStaff() {
  const top = 30;
  const S = 14;
  const lines = [0, 1, 2, 3, 4].map((i) => `<line x1="10" x2="430" y1="${top + i * S}" y2="${top + i * S}"/>`).join('');
  // Notes sur les lignes (mi sol si re fa) puis dans les interlignes (fa la do mi), cle de sol
  const en = lang() === 'en';
  const onLines = en ? ['E', 'G', 'B', 'D', 'F'] : ['mi', 'sol', 'si', 'ré', 'fa'];
  const inSpaces = en ? ['F', 'A', 'C', 'E'] : ['fa', 'la', 'do', 'mi'];
  let notes = '';
  onLines.forEach((n, i) => {
    const x = 90 + i * 34;
    const y = top + 4 * S - i * S;
    notes += `<ellipse class="hd" cx="${x}" cy="${y}" rx="7.4" ry="5.4" transform="rotate(-20 ${x} ${y})"/><text x="${x}" y="${top + 4 * S + 30}">${n}</text>`;
  });
  inSpaces.forEach((n, i) => {
    const x = 290 + i * 34;
    const y = top + 4 * S - S / 2 - i * S;
    notes += `<ellipse class="hd sp" cx="${x}" cy="${y}" rx="7.4" ry="5.4" transform="rotate(-20 ${x} ${y})"/><text x="${x}" y="${top + 4 * S + 30}">${n}</text>`;
  });
  return `<svg class="th-art th-staff" viewBox="0 0 440 ${top + 4 * S + 44}" aria-hidden="true">${lines}
    <text class="clef" x="14" y="${top + 4 * S + 10}">\u{1D11E}</text>${notes}
    <text class="cap" x="158" y="16">${t('sur les lignes')}</text><text class="cap" x="340" y="16">${t('dans les interlignes')}</text></svg>`;
}

function drawRhythm() {
  // Une ronde = 2 blanches = 4 noires = 8 croches
  const rows = [[1, t('ronde'), 4], [2, t('blanche'), 2], [4, t('noire'), 1], [8, t('croche'), 0.5]];
  const width = 440;
  let s = `<svg class="th-art th-rhythm" viewBox="0 0 ${width} 250" aria-hidden="true">`;
  rows.forEach(([n, name, beats], r) => {
    const y = 34 + r * 56;
    for (let i = 0; i < n; i++) {
      const x = 120 + ((i + 0.5) * (width - 140)) / n;
      const hollow = beats >= 2;
      s += `<ellipse class="hd ${hollow ? 'hollow' : ''}" cx="${x}" cy="${y}" rx="8" ry="5.8" transform="rotate(-20 ${x} ${y})"/>`;
      if (beats < 4) s += `<line class="st" x1="${x + 7}" y1="${y}" x2="${x + 7}" y2="${y - 34}"/>`;
      if (beats === 0.5) s += `<path class="fl" d="M ${x + 7} ${y - 34} c 1 6 9 7 8 15 c 3 -7 -3 -12 -8 -14 z"/>`;
    }
    s += `<text class="nm" x="10" y="${y + 5}">${name}</text><text class="cap" x="10" y="${y + 21}">${beats > 1 ? t('{n} temps', { n: beats }) : beats === 1 ? t('1 temps') : t('½ temps')}</text>`;
  });
  return `${s}</svg>`;
}

function drawHands() {
  const hand = (cx, mirror, cls) => {
    const m = mirror ? -1 : 1;
    const fingers = [
      { n: 1, x: -46, y: 20, h: 44, a: -38 },
      { n: 2, x: -22, y: -18, h: 66, a: -8 },
      { n: 3, x: 0, y: -24, h: 72, a: 0 },
      { n: 4, x: 22, y: -18, h: 66, a: 6 },
      { n: 5, x: 42, y: -4, h: 52, a: 14 },
    ];
    let g = `<g class="hand ${cls}" transform="translate(${cx} 120) scale(${m} 1)">`;
    g += '<rect class="palm" x="-40" y="0" width="86" height="86" rx="30"/>';
    fingers.forEach((f) => {
      g += `<g transform="translate(${f.x} ${f.y}) rotate(${f.a})"><rect class="fg" x="-9" y="${-f.h + 20}" width="18" height="${f.h}" rx="9"/>
        <text transform="scale(${m} 1)" x="0" y="${-f.h + 40}">${f.n}</text></g>`;
    });
    return `${g}</g>`;
  };
  return `<svg class="th-art th-hands" viewBox="0 0 440 230" aria-hidden="true">${hand(120, true, 'left')}${hand(320, false, 'right')}
    <text class="cap" x="120" y="226">${t('main gauche')}</text><text class="cap" x="320" y="226">${t('main droite')}</text></svg>`;
}

const ART = { clavier: drawKeyboard, portee: drawStaff, rythme: drawRhythm, mains: drawHands };

const open = (f, cur) => f.palier <= cur;

// ---------- La liste ----------
export function renderTheoryList(app, subnav = '') {
  const cur = currentPalier(getState());
  const byPalier = PALIERS.map((p) => ({ p, cards: FICHES.filter((f) => f.palier === p.id) })).filter((x) => x.cards.length);
  app.innerHTML = `
    ${subnav}
    <div class="page-head">
      <div class="eyebrow" data-reveal>${t('La théorie')}</div>
      <h1 data-split>${t('Comprendre <span class="grad-text">ce que tu joues</span>')}</h1>
      <p class="lead" data-reveal>${fr(t('Une idée par fiche, quand tu en as besoin. {n} fiches ouvertes sur {total} ; les autres arrivent avec les paliers.', { n: FICHES.filter((f) => open(f, cur)).length, total: FICHES.length }))}</p>
    </div>
    ${byPalier.map(({ p, cards }) => `
      <section class="th-group" data-reveal>
        <h2 class="th-group-title"><span>${t('Palier {n}', { n: p.id })}</span> ${esc(p.titre)}</h2>
        <div class="grid th-grid">
          ${cards.map((f) => (open(f, cur)
            ? `<a class="card th-card" href="#/theorie/${f.id}"><h3>${esc(L(f.titre))}</h3><p class="hint">${fr(esc(L(f.resume)))}</p></a>`
            : `<div class="card th-card locked" aria-disabled="true"><h3>${esc(L(f.titre))}</h3><p class="hint">${t('Palier {n}', { n: f.palier })}</p></div>`)).join('')}
        </div>
      </section>`).join('')}`;
  return () => {};
}

// ---------- Une fiche ----------
export function renderTheoryCard(app, id) {
  const cur = currentPalier(getState());
  const i = FICHES.findIndex((f) => f.id === id);
  const f = FICHES[i];
  if (!f || !open(f, cur)) {
    app.innerHTML = `<div class="page-head"><h1>${f ? t('Cette fiche arrive plus tard') : t('Fiche introuvable')}</h1><p class="lead">${fr(f ? t('Elle s’ouvre au palier {n}.', { n: f.palier }) : '')}</p><a class="btn" href="#/theorie">${t('Toutes les fiches')}</a></div>`;
    return () => {};
  }
  const prev = FICHES.slice(0, i).reverse().find((x) => open(x, cur));
  const next = FICHES.slice(i + 1).find((x) => open(x, cur));
  const score = f.exemple ? parseScore(f.exemple) : null;
  app.innerHTML = `
    <div class="lesson-head">
      <p class="crumbs" data-reveal><a href="#/theorie">${t('La théorie')}</a><i></i><span>${t('Palier {n}', { n: f.palier })}</span></p>
      <h1 data-split class="lesson-title">${esc(L(f.titre))}</h1>
      <p class="lead" data-reveal>${fr(esc(L(f.resume)))}</p>
    </div>
    <article class="th-sheet" data-reveal style="--d:120ms">
      ${f.illustration && ART[f.illustration] ? `<figure class="th-figure">${ART[f.illustration]()}</figure>` : ''}
      <div class="th-body">${L(f.corps).map((para) => `<p>${fr(esc(para))}</p>`).join('')}</div>
      ${score ? `
        <div class="th-example">
          <div class="th-example-head"><span class="eyebrow">${t('L’exemple')}</span><button class="btn small" id="th-play">${t('Écouter')}</button></div>
          <div class="lesson-sheet" id="th-staff"></div>
        </div>` : ''}
      <aside class="th-keep"><span class="eyebrow">${t('À retenir')}</span><p>${fr(esc(L(f.retenir)))}</p></aside>
    </article>
    <nav class="th-nav">
      ${prev ? `<a class="btn ghost" href="#/theorie/${prev.id}">← ${esc(L(prev.titre))}</a>` : '<span></span>'}
      ${next ? `<a class="btn ghost" href="#/theorie/${next.id}">${esc(L(next.titre))} →</a>` : ''}
    </nav>`;

  let alive = true;
  let playing = false;
  let sheet = null;
  if (score) {
    sheet = new Sheet(app.querySelector('#th-staff'), score, { mode: 'static', ppb: 46 });
    const btn = app.querySelector('#th-play');
    btn.addEventListener('click', async () => {
      if (playing) { playing = false; return; }
      getContext().resume?.();
      playing = true;
      btn.textContent = t('Arrêter');
      sheet.reset();
      const beat = 60000 / 84;
      const t0 = performance.now();
      for (const st of score.steps) {
        const wait = t0 + st.start * beat - performance.now();
        if (wait > 0) await sleep(wait);
        if (!alive || !playing) break;
        sheet.focus(st.notes.map((n) => score.events.indexOf(n)));
        st.notes.forEach((n) => {
          noteOn(n.midi, 0.72);
          setTimeout(() => noteOff(n.midi), Math.max(150, n.dur * beat * 0.9));
        });
      }
      await sleep(600);
      if (!alive) return;
      sheet.focus([]);
      playing = false;
      btn.textContent = t('Écouter');
    });
  }
  return () => { alive = false; playing = false; sheet?.dispose(); };
}
