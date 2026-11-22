/* Lab Visuals: one shared model for the colour of the liquid before and after a reaction.
   Both colours are computed the same way (same dilution), so a mixture that stays blue is
   reported as "no colour change", and pale blue -> deep blue is reported as a real change. */
(function () {
  'use strict';
  const C = globalThis.Chem;
  const { CH, ION } = C;
  const WATER = '#cfe6f5';
  C.WATER = WATER;

  // how strongly each colour tints water (extinction): permanganate and complexes are intense,
  // 0.1 M copper(II) or iron(II) are only pale
  const K = { '#2f7fd8': 0.6, '#d9a13a': 0.7, '#b9dbb0': 0.7, '#9b1fa8': 1.8, '#f28c28': 1.5, '#c58a2a': 1.4, '#ece9dc': 0.35 };
  const kOf = (hex) => K[(hex || '').toLowerCase()] || 1;
  const ionHex = new Set(Object.values(ION).map((i) => i.col).filter(Boolean).map((h) => h.toLowerCase()));
  const chroma = (hex) => { const [r, g, b] = C.hex2rgb(hex); return (Math.max(r, g, b) - Math.min(r, g, b)) / 255 + 0.05; };
  const dist = (a, b) => { const A = C.hex2rgb(a), B = C.hex2rgb(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
  const vol = (id) => (id === 'h2o' ? 1.4 : 1);

  const isLiquid = (id, res) => {
    const c = CH[id];
    if (!c || id === 'heat' || c.group === 'indicator' || c.metal) return false;
    if (c.phase !== 'aq' && c.phase !== 'l') return false;
    if (res && res.solidIds && res.solidIds.includes(id)) return false;
    return true;
  };

  C.liquidColours = function (ids, res, ph0, ph1) {
    const fx = (res && res.fx) || {};
    const liq = ids.filter((i) => isLiquid(i, res));
    const total = liq.reduce((a, i) => a + vol(i), 0);

    // colour of the starting mixture: absorbances of the dyes add (Beer-Lambert), each diluted by volume
    let tot = 0;
    const dyes = [];
    liq.forEach((i) => {
      const col = CH[i].color;
      if (!col) return;
      const s = (vol(i) / total) * kOf(col);
      tot += s; dyes.push([col, s]);
    });
    const scale = tot > 1.2 ? 1.2 / tot : 1;
    let c0 = WATER;
    dyes.forEach(([col, s]) => { c0 = C.absAdd(c0, col, Math.min(1, s * scale)); });

    // colour after the reaction
    const concRef = total ? 1 / total : 1;  // one reagent volume diluted into the beaker
    let c1;
    if (fx.liq1 === undefined) c1 = c0;
    else if (fx.liq1 === null) c1 = WATER;
    else if (ionHex.has(fx.liq1.toLowerCase())) c1 = C.absMix(WATER, fx.liq1, Math.min(1, kOf(fx.liq1) * concRef));  // an ion colour: dilute it like the reagents
    else c1 = fx.liq1;                                                                                              // a hand-set colour is shown as given

    // indicator drops tint the liquid; a colourless indicator form must not erase the colour that is already there
    const ind = ids.find((i) => CH[i] && CH[i].group === 'indicator');
    let indActive = false, indColor1 = null;
    if (ind) {
      indActive = true;
      const id0 = C.indColor(ind, ph0 == null ? 7 : ph0), id1 = C.indColor(ind, ph1 == null ? 7 : ph1);
      indColor1 = id1;
      const tint = (base, dye) => (dye ? C.absAdd(base, dye, dist(base, WATER) < 30 ? 0.9 : 0.6) : base);
      c0 = tint(c0, id0);
      c1 = tint(c1, id1);
    }
    return { c0, c1, indActive, indColor1 };
  };

  C.colourName = (hex) => C.colorWord(hex);
  // a change is reported only if the colour names differ AND the colours are clearly apart
  C.colourChanged = (a, b) => !!a && !!b && dist(a, b) > 35 && C.colorWord(a) !== C.colorWord(b);
})();
