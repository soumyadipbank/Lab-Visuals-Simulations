/* Lab Visuals: qualitative analysis data and sample generator (no DOM; tested in tests/salts.test.js).
   Observations are the standard textbook results for each radical. */
(function () {
  'use strict';
  const C = (globalThis.Chem = globalThis.Chem || {});
  const S = (C.Salts = {});

  S.CATIONS = [
    ['Na', 'Na⁺', 'sodium'], ['K', 'K⁺', 'potassium'], ['NH4', 'NH₄⁺', 'ammonium'], ['Ca', 'Ca²⁺', 'calcium'], ['Ba', 'Ba²⁺', 'barium'], ['Mg', 'Mg²⁺', 'magnesium'], ['Cu', 'Cu²⁺', 'copper(II)'],
    ['Fe3', 'Fe³⁺', 'iron(III)'], ['Fe2', 'Fe²⁺', 'iron(II)'], ['Zn', 'Zn²⁺', 'zinc'], ['Al', 'Al³⁺', 'aluminium'], ['Mn', 'Mn²⁺', 'manganese(II)'], ['Ni', 'Ni²⁺', 'nickel(II)'], ['Co', 'Co²⁺', 'cobalt(II)'],
  ];
  S.ANIONS = [['Cl', 'Cl⁻', 'chloride'], ['Br', 'Br⁻', 'bromide'], ['I', 'I⁻', 'iodide'], ['NO3', 'NO₃⁻', 'nitrate'], ['SO4', 'SO₄²⁻', 'sulfate'], ['CO3', 'CO₃²⁻', 'carbonate'], ['S', 'S²⁻', 'sulfide']];
  S.name = {}; S.sym = {};
  S.CATIONS.concat(S.ANIONS).forEach((x) => { S.sym[x[0]] = x[1]; S.name[x[0]] = x[2]; });

  S.TESTS = [
    { id: 'look', g: 'Preliminary', label: 'Colour of the solution', how: 'Dissolve a little of the salt in water and look.' },
    { id: 'flame', g: 'Preliminary', label: 'Flame test', how: 'Nichrome wire dipped in conc. HCl, then in the salt, held in a flame.' },
    { id: 'flameCo', g: 'Preliminary', label: 'Flame test through blue cobalt glass', how: 'Cobalt glass absorbs the yellow of sodium.' },
    { id: 'dilHCl', g: 'Anions', label: 'Dilute HCl on the solid', how: 'A little salt with dilute HCl, warm gently.' },
    { id: 'concH2SO4', g: 'Anions', label: 'Conc. H₂SO₄ on the solid', how: 'Warm a little salt with a few drops of conc. H₂SO₄ in a dry tube. (Teacher or fume cupboard only.)' },
    { id: 'cu', g: 'Anions', label: 'Conc. H₂SO₄ + copper turnings', how: 'Heat the salt with conc. H₂SO₄ and copper turnings.' },
    { id: 'bacl2', g: 'Anions', label: 'BaCl₂ solution', how: 'Add BaCl₂ to the neutral solution, then dilute HCl.' },
    { id: 'agno3', g: 'Anions', label: 'AgNO₃ + dilute HNO₃', how: 'Acidify the solution with dilute HNO₃, then add AgNO₃. Test the precipitate with NH₃.' },
    { id: 'brown', g: 'Anions', label: 'Brown ring test', how: 'Add fresh FeSO₄, then pour conc. H₂SO₄ slowly down the side of the tube.' },
    { id: 'cl2', g: 'Anions', label: 'Chlorine water + CHCl₃', how: 'Add chlorine water and CHCl₃ to the solution and shake.' },
    { id: 'naoh', g: 'Cations', label: 'NaOH solution (dropwise, then excess)', how: 'Add NaOH slowly, then in excess.' },
    { id: 'naohw', g: 'Cations', label: 'NaOH, warmed', how: 'Warm the salt with NaOH. Test the gas with moist red litmus.' },
    { id: 'nh3', g: 'Cations', label: 'Ammonia solution (dropwise, then excess)', how: 'Add NH₃ slowly, then in excess.' },
    { id: 'kscn', g: 'Cations', label: 'KSCN solution', how: 'Add KSCN to the solution.' },
    { id: 'k4', g: 'Cations', label: 'K₄[Fe(CN)₆] (ferrocyanide)', how: 'Add potassium hexacyanoferrate(II).' },
    { id: 'k3', g: 'Cations', label: 'K₃[Fe(CN)₆] (ferricyanide)', how: 'Add potassium hexacyanoferrate(III).' },
    { id: 'k2cro4', g: 'Cations', label: 'K₂CrO₄ + acetic acid', how: 'Add potassium chromate to the solution acidified with acetic acid.' },
    { id: 'h2so4', g: 'Cations', label: 'Dilute H₂SO₄', how: 'Add dilute sulfuric acid to the solution.' },
    { id: 'dmg', g: 'Cations', label: 'Dimethylglyoxime + NH₃', how: 'Make the solution ammoniacal, then add dimethylglyoxime.' },
  ];
  S.NONE = { look: 'Colourless solution.', flame: 'No characteristic flame colour.', flameCo: 'No characteristic flame colour.', dilHCl: 'No visible change.', concH2SO4: 'No visible change.', cu: 'No brown fumes.', bacl2: 'No precipitate.', agno3: 'No precipitate.', brown: 'No brown ring.', cl2: 'The CHCl₃ layer stays colourless.', naoh: 'No visible change.', naohw: 'No gas with a pungent smell.', nh3: 'No visible change.', kscn: 'No visible change.', k4: 'No visible change.', k3: 'No visible change.', k2cro4: 'No precipitate.', h2so4: 'No precipitate.', dmg: 'No precipitate or colour.' };

  const o = (t, x) => Object.assign({ t }, x || {});
  const W = '#f4f4f4';
  S.OBS = {
    look: {
      Cu: o('Blue solution.', { liq: '#7fc6ea', word: 'blue' }), Fe3: o('Yellow-brown solution.', { liq: '#d9a441', word: 'yellow-brown' }), Fe2: o('Pale green solution.', { liq: '#b7d8a8', word: 'pale green' }),
      Mn: o('Very pale pink solution (nearly colourless).', { liq: '#f3dde3', word: 'very pale pink' }), Ni: o('Green solution.', { liq: '#9bd48a', word: 'green' }), Co: o('Pink solution.', { liq: '#e9a3b5', word: 'pink' }),
    },
    flame: { Na: o('Persistent golden-yellow flame.', { fume: '#ffd24a' }), K: o('Fleeting lilac flame.', { fume: '#c6a2ff' }), Ca: o('Brick-red flame.', { fume: '#e0553a' }), Ba: o('Apple-green flame.', { fume: '#9ad65a' }), Cu: o('Blue-green flame.', { fume: '#4fc4b0' }) },
    flameCo: { K: o('Crimson-violet flame (the sodium yellow is cut out).', { fume: '#c63d7c' }) },
    dilHCl: { CO3: o('Brisk effervescence: a colourless, odourless gas that turns lime water milky.', { gas: 1 }), S: o('Colourless gas with a rotten-egg smell; it blackens lead acetate paper.', { gas: 1 }) },
    concH2SO4: {
      Cl: o('Colourless pungent gas that fumes in moist air; dense white fumes with a rod dipped in ammonia.', { gas: 1, fume: '#eeeeee' }), Br: o('Reddish-brown vapours with pungent fumes.', { gas: 1, fume: '#a0451c' }), I: o('Violet vapours and a dark solid.', { gas: 1, fume: '#6a2f8f' }),
      NO3: o('Colourless pungent fumes of nitric acid on heating.', { gas: 1 }), CO3: o('Brisk effervescence of a colourless, odourless gas.', { gas: 1 }), S: o('Rotten-egg smell (H₂S) and a pale yellow deposit of sulfur.', { gas: 1 }),
    },
    cu: { NO3: o('Brown fumes (NO₂) and the solution turns blue.', { gas: 1, fume: '#8a4b1d', liq: '#4aa8d8' }) },
    bacl2: { SO4: o('White precipitate, insoluble in dilute HCl.', { ppt: W }), CO3: o('White precipitate that dissolves in dilute HCl with effervescence.', { ppt: W }) },
    agno3: {
      Cl: o('White curdy precipitate, soluble in dilute NH₃ solution.', { ppt: '#f7f7f7' }), Br: o('Pale-yellow precipitate, only sparingly soluble in NH₃ solution.', { ppt: '#efe6a0' }), I: o('Yellow precipitate, insoluble in NH₃ solution.', { ppt: '#f2d531' }),
      S: o('Black precipitate.', { ppt: '#1b1b1b' }), CO3: o('Effervescence on acidifying (CO₂); no precipitate remains.', { gas: 1 }),
    },
    brown: { NO3: o('A brown ring forms at the junction of the two liquids.', { ring: '#8a4b1d' }) },
    cl2: { Br: o('The CHCl₃ layer turns orange-brown.', { layer: '#d2691e' }), I: o('The CHCl₃ layer turns violet.', { layer: '#7a2fb0' }) },
    naoh: {
      Cu: o('Pale blue gelatinous precipitate, insoluble in excess.', { ppt: '#7ab8e8' }), Fe3: o('Reddish-brown precipitate, insoluble in excess.', { ppt: '#9a4a1f' }), Fe2: o('Dirty-green precipitate that turns brown on standing in air.', { ppt: '#6f9a6b' }),
      Zn: o('White precipitate that dissolves in excess NaOH.', { ppt: W }), Al: o('White gelatinous precipitate that dissolves in excess NaOH.', { ppt: W }), Mn: o('White precipitate that turns brown in air.', { ppt: '#efe9e2' }),
      Ni: o('Apple-green precipitate, insoluble in excess.', { ppt: '#7fc66a' }), Co: o('Blue precipitate that turns pink on standing.', { ppt: '#4a63d6' }), Mg: o('White precipitate, insoluble in excess.', { ppt: W }),
      Ca: o('Slight white precipitate (only from fairly concentrated solution), insoluble in excess.', { ppt: '#f4f4f4' }),
    },
    naohw: { NH4: o('A pungent gas is evolved: it turns moist red litmus blue and gives dense white fumes with HCl.', { gas: 1 }) },
    nh3: {
      Cu: o('Pale blue precipitate that dissolves in excess to a deep-blue solution.', { ppt: '#7ab8e8', liq: '#2b4fd1' }), Fe3: o('Reddish-brown precipitate, insoluble in excess.', { ppt: '#9a4a1f' }), Fe2: o('Dirty-green precipitate, insoluble in excess.', { ppt: '#6f9a6b' }),
      Zn: o('White precipitate that dissolves in excess ammonia.', { ppt: W }), Al: o('White gelatinous precipitate, insoluble in excess.', { ppt: W }), Mn: o('Off-white precipitate that turns brown in air.', { ppt: '#efe9e2' }),
      Ni: o('Green precipitate that dissolves in excess to a blue solution.', { ppt: '#7fc66a' }), Co: o('Blue precipitate that dissolves in excess to a brownish-pink solution.', { ppt: '#4a63d6' }), Mg: o('White precipitate, insoluble in excess.', { ppt: W }),
    },
    kscn: { Fe3: o('Blood-red colouration.', { liq: '#b3121f' }) },
    k4: {
      Fe3: o('Deep Prussian-blue precipitate.', { ppt: '#1a3a8f' }), Fe2: o('Pale blue (white to pale blue) precipitate.', { ppt: '#9ec0e8' }), Cu: o('Chocolate-brown precipitate.', { ppt: '#6e3b1f' }), Zn: o('White to bluish-white precipitate.', { ppt: W }),
      Mn: o('White to pale pink precipitate.', { ppt: '#f3e4ea' }), Ni: o('Pale green precipitate.', { ppt: '#bfe0b3' }), Co: o('Green precipitate.', { ppt: '#6ba37a' }),
    },
    k3: {
      Fe2: o('Deep blue precipitate (Turnbull’s blue).', { ppt: '#1d3fa6' }), Fe3: o('Brown-green colouration; no precipitate.', { liq: '#8a6f2a' }), Cu: o('Green precipitate.', { ppt: '#6fa86f' }), Zn: o('Yellow-brown precipitate.', { ppt: '#c9a030' }),
      Mn: o('Brown precipitate.', { ppt: '#7b4a2a' }), Ni: o('Yellowish-brown precipitate.', { ppt: '#b58a2a' }), Co: o('Reddish-brown precipitate.', { ppt: '#8a3d2a' }),
    },
    k2cro4: { Ba: o('Yellow precipitate, insoluble in acetic acid.', { ppt: '#e8d23a' }) },
    h2so4: { Ba: o('White precipitate.', { ppt: W }) },
    dmg: { Ni: o('Bright cherry-red precipitate.', { ppt: '#d12a4f' }), Fe2: o('Red-brown colouration (no precipitate).', { liq: '#a6452a' }) },
  };

  // pairs that cannot sit together in a soluble salt mixture (insoluble, hydrolysed or redox-incompatible)
  const BAD = { Ba: ['SO4', 'CO3'], Ca: ['SO4', 'CO3', 'S'], Mg: ['CO3', 'S'], Cu: ['CO3', 'S', 'I'], Fe3: ['CO3', 'S', 'I'], Fe2: ['CO3', 'S'], Zn: ['CO3', 'S'], Al: ['CO3', 'S'], Mn: ['CO3', 'S'], Ni: ['CO3', 'S'], Co: ['CO3', 'S'] };
  S.compatible = (cat, an) => !(BAD[cat] || []).includes(an);
  S.POOL1 = { cat: ['Na', 'K', 'NH4', 'Ca', 'Cu', 'Fe3', 'Zn', 'Fe2'], an: ['Cl', 'SO4', 'CO3', 'NO3'] };
  S.POOL = { cat: S.CATIONS.map((x) => x[0]), an: S.ANIONS.map((x) => x[0]) };
  S.LEVELS = { 1: { cat: 1, an: 1, pool: 1, label: 'Simple salt, common ions' }, 2: { cat: 1, an: 1, pool: 2, label: 'Simple salt, wider choice of ions' }, 3: { cat: 0, an: 0, pool: 2, label: 'Mixture of 3 radicals' }, 4: { cat: 2, an: 2, pool: 2, label: 'Mixture of 4 radicals' } };

  // rnd: function giving [0,1)
  S.generate = function (n, rnd) {
    const L = S.LEVELS[n] || S.LEVELS[1], pool = L.pool === 1 ? S.POOL1 : S.POOL;
    const pick = (arr) => arr[Math.floor(rnd() * arr.length)];
    for (let tries = 0; tries < 500; tries++) {
      let nc = L.cat, na = L.an;
      if (n === 3) { if (rnd() < 0.5) { nc = 2; na = 1; } else { nc = 1; na = 2; } }
      const cats = [], ans = [];
      while (cats.length < nc) { const c = pick(pool.cat); if (!cats.includes(c)) cats.push(c); }
      while (ans.length < na) { const a = pick(pool.an); if (!ans.includes(a)) ans.push(a); }
      if (cats.includes('Fe2') && cats.includes('Fe3')) continue;
      if (cats.some((c) => ans.some((a) => !S.compatible(c, a)))) continue;
      return { cats, ans };
    }
    return { cats: ['Cu'], ans: ['SO4'] };
  };

  // for mixtures: what each cation's hydroxide does, so that one tube gives one combined observation
  // [colour, dissolves in excess?, what else is seen]
  const PPT = {
    naoh: { Cu: ['pale blue', 0, ''], Fe3: ['reddish-brown', 0, ''], Fe2: ['dirty-green', 0, 'part of it turns brown on standing in air'], Zn: ['white', 1, ''], Al: ['white', 1, ''], Mn: ['white', 0, 'part of it turns brown in air'], Ni: ['apple-green', 0, ''], Co: ['blue', 0, 'part of it turns pink on standing'], Mg: ['white', 0, ''], Ca: ['white', 0, ''] },
    nh3: { Cu: ['pale blue', 1, 'the solution turns deep blue'], Fe3: ['reddish-brown', 0, ''], Fe2: ['dirty-green', 0, ''], Zn: ['white', 1, ''], Al: ['white', 0, ''], Mn: ['off-white', 0, 'part of it turns brown in air'], Ni: ['green', 1, 'the solution turns blue'], Co: ['blue', 1, 'the solution turns brownish-pink'], Mg: ['white', 0, ''] },
  };
  const uniq = (a) => [...new Set(a)];
  const and = (a) => (a.length < 2 ? a[0] : a.slice(0, -1).join(', ') + ' and ' + a[a.length - 1]);
  function mergePpt(test, ions) {
    const info = ions.map((i) => PPT[test][i]), cols = uniq(info.map((x) => x[0])), stay = info.filter((x) => !x[1]), notes0 = uniq(info.map((x) => x[2]).filter(Boolean)), sol = notes0.filter((x) => x.startsWith('the solution')), notes = notes0.filter((x) => !x.startsWith('the solution')).concat(sol.length ? [sol.find((x) => x.includes('deep')) || sol[0]] : []);   /* one solution colour: the most intense */
    let t = 'A ' + (cols.length > 1 ? 'mixed ' + and(cols) : cols[0]) + ' precipitate forms. In excess ' + (stay.length === 0 ? 'it dissolves completely' : stay.length === info.length ? 'it does not dissolve' : 'part of it dissolves; a ' + and(uniq(stay.map((x) => x[0]))) + ' residue remains') + '.';
    if (notes.length) t += ' Also, ' + and(notes) + '.';
    return t;
  }
  // a single colour word for a mixed solution colour
  function tintWord(hex) {
    const [r, g, b] = C.hex2rgb(hex).map((v) => v / 255), mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
    let h = 0; if (d > 0.02) { if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4; h *= 60; if (h < 0) h += 360; }
    const n = h < 20 || h >= 330 ? 'pinkish-red' : h < 50 ? 'yellow-brown' : h < 75 ? 'yellow' : h < 100 ? 'yellowish-green' : h < 150 ? 'green' : h < 185 ? 'bluish-green' : h < 215 ? 'greenish-blue' : h < 250 ? 'blue' : h < 290 ? 'violet' : 'pink';
    return (mx + mn) / 2 > 0.8 ? 'pale ' + n : n;
  }

  // observations for a sample and a test id (one combined observation per tube for mixtures)
  S.observe = function (sample, testId, rnd) {
    const ions = sample.cats.concat(sample.ans), tab = S.OBS[testId] || {}, out = [];
    ions.forEach((ion) => {
      if (!tab[ion]) return;
      if (testId === 'flame' && ion === 'K' && sample.cats.includes('Na')) return;   // sodium masks potassium
      out.push(tab[ion]);
    });
    if (rnd && out.length > 1) for (let i = out.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [out[i], out[j]] = [out[j], out[i]]; }
    if (testId === 'look' && out.length) { const liq = out.reduce((c, x, i) => (i ? C.absMix(c, x.liq, 0.5) : x.liq), null); return { items: [o(out.length === 1 ? out[0].t : 'The solution is ' + tintWord(liq) + '.', { liq })], tube: { liq } }; }
    const resp = sample.cats.filter((i) => tab[i]);
    if ((testId === 'naoh' || testId === 'nh3') && resp.length > 1) {
      const tube = {}; out.forEach((x) => { if (x.ppt && !tube.ppt) tube.ppt = x.ppt; if (x.liq && !tube.liq) tube.liq = x.liq; });
      return { items: [o(mergePpt(testId, resp))].concat(out.filter((x) => !sample.cats.some((c) => tab[c] === x))), tube };
    }
    if (!out.length) return { items: [o(S.NONE[testId] || 'No visible change.')], tube: {} };
    const tube = {};
    out.forEach((x) => { if (x.ppt && !tube.ppt) tube.ppt = x.ppt; if (x.liq && !tube.liq) tube.liq = x.liq; if (x.gas) tube.gas = 1; if (x.fume && !tube.fume) tube.fume = x.fume; if (x.ring) tube.ring = x.ring; if (x.layer) tube.layer = x.layer; });
    return { items: out, tube };
  };
})();
