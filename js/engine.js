/* Lab Visuals: reaction engine.
   Resolves any selection of chemicals into a reaction result (equation, ΔH, observations,
   visual effects). Hand-written special cases live in curated.js; everything else is derived
   from solubility rules, the reactivity series, acid-base rules and Hess's law. */
(function () {
  'use strict';
  const C = globalThis.Chem;
  const { ION, PPT, MOL, METAL, CATION_E, DSOL, GAS, CH } = C;

  const gcd = (a, b) => (b ? gcd(b, a % b) : a);
  const lcm = (a, b) => (a / gcd(a, b)) * b;
  const sci = (x) => {
    if (x === 0) return '0';
    const e = Math.floor(Math.log10(Math.abs(x)));
    const m = x / Math.pow(10, e);
    return (Math.abs(e) < 3 ? x.toPrecision(2) : m.toFixed(1) + '×10^' + e + '^');
  };
  const r1 = (x) => Math.round(x * 10) / 10;

  // ---------------------------------------------------------------- formula parsing and balancing
  function parseFormula(str) {
    str = str.replace(/\^[\d]*[+-]+/, '').replace(/\((s|aq|l|g)\)$/, '');
    const out = {};
    const add = (o, e, n) => { o[e] = (o[e] || 0) + n; };
    str.split('·').forEach((part) => {
      let mult = 1;
      const m = part.match(/^(\d+)(.*)$/);
      if (m) { mult = +m[1]; part = m[2]; }
      const stack = [{}];
      let i = 0;
      while (i < part.length) {
        const ch = part[i];
        if (ch === '(' || ch === '[') { stack.push({}); i++; }
        else if (ch === ')' || ch === ']') {
          i++;
          let n = '';
          while (/\d/.test(part[i] || '')) { n += part[i]; i++; }
          const top = stack.pop();
          const k = n ? +n : 1;
          for (const e in top) add(stack[stack.length - 1], e, top[e] * k);
        } else {
          const m2 = part.slice(i).match(/^([A-Z][a-z]?)(\d*)/);
          if (!m2) throw new Error('Bad formula: ' + str + ' at ' + i);
          add(stack[stack.length - 1], m2[1], m2[2] ? +m2[2] : 1);
          i += m2[0].length;
        }
      }
      for (const e in stack[0]) add(out, e, stack[0][e] * mult);
    });
    return out;
  }

  // Smallest positive integer coefficients, or null if there is no unique solution.
  function balance(reacts, prods) {
    const sp = reacts.concat(prods);
    const n = sp.length;
    const comps = sp.map(parseFormula);
    const els = [...new Set(comps.flatMap((c) => Object.keys(c)))];
    const A = els.map((e) => sp.map((_, j) => (comps[j][e] || 0) * (j < reacts.length ? 1 : -1)));
    const m = A.length;
    let row = 0;
    const piv = [];
    for (let col = 0; col < n && row < m; col++) {
      let best = row;
      for (let r = row; r < m; r++) if (Math.abs(A[r][col]) > Math.abs(A[best][col])) best = r;
      if (Math.abs(A[best][col]) < 1e-9) continue;
      [A[row], A[best]] = [A[best], A[row]];
      const pv = A[row][col];
      A[row] = A[row].map((v) => v / pv);
      for (let r = 0; r < m; r++) {
        if (r !== row) {
          const f = A[r][col];
          if (Math.abs(f) > 1e-12) A[r] = A[r].map((v, k) => v - f * A[row][k]);
        }
      }
      piv.push(col);
      row++;
    }
    const free = [...Array(n).keys()].filter((c) => !piv.includes(c));
    if (free.length > 1) return bruteBalance(comps, els, reacts.length);
    if (free.length !== 1) return null;
    const x = Array(n).fill(0);
    x[free[0]] = 1;
    piv.forEach((c, i) => { x[c] = -A[i][free[0]]; });
    for (let k = 1; k <= 120; k++) {
      const y = x.map((v) => v * k);
      if (y.every((v) => Math.abs(v - Math.round(v)) < 1e-6)) {
        const ints = y.map(Math.round);
        if (!ints.every((v) => v > 0)) return null;
        const g = ints.reduce(gcd);
        return ints.map((v) => v / g);
      }
    }
    return null;
  }

  // under-determined systems (e.g. several sulfur oxidation states): smallest positive solution by search
  function bruteBalance(comps, els, nr) {
    const n = comps.length, max = n > 6 ? 4 : 8;
    const co = Array(n).fill(1);
    let best = null, bestSum = Infinity;
    const ok = () => els.every((e) => {
      let t = 0;
      for (let j = 0; j < n; j++) t += (comps[j][e] || 0) * co[j] * (j < nr ? 1 : -1);
      return t === 0;
    });
    (function rec(i, sum) {
      if (sum >= bestSum) return;
      if (i === n) { if (ok()) { best = co.slice(); bestSum = sum; } return; }
      for (let v = 1; v <= max; v++) { co[i] = v; rec(i + 1, sum + v); }
    })(0, 0);
    return best;
  }

  // parse an equation string such as "2Na(s) + 2H2O(l) → 2NaOH(aq) + H2(g)" (used for checks and particle view)
  function parseEq(str) {
    const arrow = str.includes('⇌') ? '⇌' : '→';
    const [l, r] = str.split(arrow);
    const side = (s) => s.split(' + ').map((t) => {
      t = t.trim();
      const m = t.match(/^(\d*)\s*(.+?)(\((?:s|aq|l|g)\))?$/);
      let formula = m[2];
      let charge = 0;
      const cm = formula.match(/\^(\d*)([+-])$/);
      if (cm) { charge = (cm[1] ? +cm[1] : 1) * (cm[2] === '+' ? 1 : -1); }
      return { co: m[1] ? +m[1] : 1, f: formula.replace(/\^.*$/, ''), full: formula, charge, ph: (m[3] || '').replace(/[()]/g, '') };
    });
    return { left: side(l), right: side(r), arrow };
  }
  function checkEq(str) {
    const { left, right } = parseEq(str);
    const tally = (side) => {
      const a = {};
      let q = 0;
      side.forEach((t) => {
        const c = parseFormula(t.f);
        for (const e in c) a[e] = (a[e] || 0) + c[e] * t.co;
        q += t.charge * t.co;
      });
      return { a, q };
    };
    const L = tally(left), R = tally(right);
    const els = new Set([...Object.keys(L.a), ...Object.keys(R.a)]);
    const bad = [];
    els.forEach((e) => { if ((L.a[e] || 0) !== (R.a[e] || 0)) bad.push(e); });
    if (L.q !== R.q) bad.push('charge');
    return bad;
  }

  // ---------------------------------------------------------------- compounds and species
  function compound(c, a) {
    const Ci = ION[c], Ai = ION[a];
    const l = lcm(Ci.z, Ai.z), nc = l / Ci.z, na = l / Ai.z;
    const part = (I, n) => (I.poly && n > 1 ? '(' + I.f + ')' : I.f) + (n > 1 ? n : '');
    if (a === 'CH3COO' && nc === 1 && na === 1) return { f: 'CH3COO' + Ci.f, nc, na };
    return { f: part(Ci, nc) + part(Ai, na), nc, na };
  }
  // give ionic chemicals their formula
  Object.values(CH).forEach((c) => { if (c.ions && !c.f) c.f = compound(c.ions[0], c.ions[1]).f; });

  function saltSp(c, a) {
    const cp = compound(c, a);
    const p = PPT[c + '|' + a];
    if (p) return { f: p.oxide || cp.f, ph: 's', ions: null, dhf: p.dhf, ppt: p, c, a };
    return { f: cp.f, ph: 'aq', ions: [{ k: c, n: cp.nc }, { k: a, n: cp.na }], dhf: cp.nc * ION[c].dhf + cp.na * ION[a].dhf, c, a };
  }
  function molSp(key, ph) {
    const m = MOL[key];
    return { f: m.f || key, ph: ph || m.ph, ions: null, dhf: m.dhf };
  }
  function metalSp(sym) { return { f: sym, ph: 's', ions: null, dhf: 0 }; }
  function ionsOf(id) {
    const c = CH[id];
    if (c.ions) return c.ions;
    if (id === 'ch3cooh') return ['H', 'CH3COO'];
    if (id === 'nh3') return ['NH4', 'OH'];
    return null;
  }
  function chemSp(id) {
    const c = CH[id];
    if (c.metal) return metalSp(METAL[c.metal].sym);
    if (id === 'ch3cooh') return molSp('CH3COOH');
    if (id === 'nh3') return molSp('NH3aq');
    if (id === 'cuo') return molSp('CuO');
    if (id === 'fe2o3') return molSp('Fe2O3');
    if (id === 'caco3') return { f: 'CaCO3', ph: 's', ions: null, dhf: PPT['Ca|CO3'].dhf };
    if (id === 'h2o') return molSp('H2O');
    if (id === 'o2') return molSp('O2');
    if (id === 'co2') return molSp('CO2');
    if (id === 'h2o2') return { f: 'H2O2', ph: 'aq', ions: null, dhf: -191.2 };
    if (c.ions) {
      const [k, a] = c.ions;
      const cp = compound(k, a);
      return { f: cp.f, ph: 'aq', ions: [{ k, n: cp.nc }, { k: a, n: cp.na }], dhf: cp.nc * ION[k].dhf + cp.na * ION[a].dhf };
    }
    return { f: c.f, ph: c.phase, ions: null, dhf: null };
  }

  // ---------------------------------------------------------------- equation assembly
  const fterm = (co, sp) => (co > 1 ? co : '') + sp.f + '(' + sp.ph + ')';
  function expandIons(list, coefs) {
    const map = new Map();
    list.forEach((sp, i) => {
      const co = coefs[i];
      if (sp.ions && sp.ph === 'aq') {
        sp.ions.forEach((io) => {
          const key = 'i:' + io.k;
          const e = map.get(key) || { n: 0, label: ION[io.k].d + '(aq)', ph: 'aq', ion: true };
          e.n += co * io.n;
          map.set(key, e);
        });
      } else {
        const key = 'm:' + sp.f + '(' + sp.ph + ')';
        const e = map.get(key) || { n: 0, label: sp.f + '(' + sp.ph + ')', ph: sp.ph, ion: false };
        e.n += co;
        map.set(key, e);
      }
    });
    return map;
  }
  const mapStr = (m, cancel) => [...m.values()].filter((e) => e.n > 0).map((e) => (e.n > 1 ? e.n : '') + e.label).join(' + ');

  function netIonic(react, prod, rc, pc) {
    const L = expandIons(react, rc), R = expandIons(prod, pc);
    const spec = [];
    for (const [k, e] of L) {
      const o = R.get(k);
      if (o) { const m = Math.min(e.n, o.n); e.n -= m; o.n -= m; if (e.ion && m > 0) spec.push({ label: e.label.replace('(aq)', ''), n: m }); }
    }
    const lv = [...L.values()].filter((e) => e.n > 0), rv = [...R.values()].filter((e) => e.n > 0);
    return { L, R, spec, lv, rv };
  }

  function hess(react, prod, rc, pc) {
    let s = 0;
    const lines = { prod: [], react: [] };
    for (let i = 0; i < prod.length; i++) {
      if (prod[i].dhf == null) return null;
      s += pc[i] * prod[i].dhf;
      lines.prod.push({ t: fterm(pc[i], prod[i]), v: r1(pc[i] * prod[i].dhf) });
    }
    for (let i = 0; i < react.length; i++) {
      if (react[i].dhf == null) return null;
      s -= rc[i] * react[i].dhf;
      lines.react.push({ t: fterm(rc[i], react[i]), v: r1(rc[i] * react[i].dhf) });
    }
    return { dh: r1(s), lines };
  }

  const colorWord = (hex) => {
    if (!hex) return 'colourless';
    const rgb = C.hex2rgb(hex);
    const W = [207, 230, 245];   // the tint used for clear water
    if (Math.hypot(rgb[0] - W[0], rgb[1] - W[1], rgb[2] - W[2]) < 24) return 'colourless';
    const [r, g, b] = rgb.map((v) => v / 255);
    const mx = Math.max(r, g, b), mn = Math.min(r, g, b), l = (mx + mn) / 2, d = mx - mn;
    if (l > 0.9 && d < 0.1) return 'white';
    if (l < 0.2) return (b > r * 1.5 && b > g * 1.5) ? 'blue-black' : 'black';
    let h = 0;
    if (d > 0.02) {
      if (mx === r) h = ((g - b) / d) % 6; else if (mx === g) h = (b - r) / d + 2; else h = (r - g) / d + 4;
      h *= 60; if (h < 0) h += 360;
    }
    const s = d === 0 ? 0 : d / (1 - Math.abs(2 * l - 1));
    if (s < 0.13) return l > 0.75 ? 'white' : l > 0.4 ? 'grey' : 'dark grey';
    let n;
    if (h >= 340 || h < 8) n = 'red';
    else if (h < 15) n = l < 0.45 ? 'reddish-brown' : 'red';
    else if (h < 34) n = l < 0.5 ? 'brown' : 'orange';
    else if (h < 42) n = 'yellow-brown';
    else if (h < 68) n = 'yellow';
    else if (h < 165) n = 'green';
    else if (h < 200) n = 'turquoise';
    else if (h < 260) n = 'blue';
    else if (h < 305) n = 'purple';
    else n = 'pink';
    if (/brown/.test(n) && n !== 'yellow-brown') return n;
    if (l > 0.84) return 'very pale ' + n;
    if (l > 0.72) return 'pale ' + n;
    if (l > 0.62) return 'light ' + n;
    if (l < 0.3) return 'dark ' + n;
    if (l < 0.46 && s > 0.45) return 'deep ' + n;
    return n;
  };
  C.colorWord = colorWord;

  function solColor(ionKeys) {
    const keys = [...new Set(ionKeys)];
    const cols = [];
    keys.forEach((k) => { if (ION[k].col) cols.push(ION[k].col); });
    if (!cols.length) return null;
    return cols.reduce((a, c, i) => (i === 0 ? c : C.mix(a, c, 0.5)));
  }
  const aqIons = (list) => list.filter((s) => s.ions && s.ph === 'aq').flatMap((s) => s.ions.map((i) => i.k));

  function heatLine(res) {
    if (res.dh == null) return null;
    const T = Math.abs(res.dT).toFixed(1);
    if (res.dh < -1) return 'Temperature rises (exothermic, ΔH = −' + Math.abs(res.dh) + ' kJ per mole of reaction as written). Illustrative rise for 0.05 mol in 100 mL: about ' + T + ' °C.';
    if (res.dh > 1) return 'Temperature falls (endothermic, ΔH = +' + res.dh + ' kJ). The reaction absorbs heat from its surroundings: about ' + T + ' °C drop for 0.05 mol in 100 mL.';
    return 'Almost no temperature change (ΔH = ' + String(res.dh).replace('-', '−') + ' kJ).';
  }

  // Turn species lists into a complete result object.
  function build(react, prod, o) {
    o = o || {};
    const co = balance(react.map((s) => s.f), prod.map((s) => s.f));
    const all = react.concat(prod);
    const coefs = co || all.map(() => 1);
    const rc = coefs.slice(0, react.length), pc = coefs.slice(react.length);
    const ni = netIonic(react, prod, rc, pc);
    const res = Object.assign({ reacts: true, balanced: !!co }, o);
    const arrow = o.arrow || '→';
    res.equation = {
      mol: react.map((s, i) => fterm(rc[i], s)).join(' + ') + ' ' + arrow + ' ' + prod.map((s, i) => fterm(pc[i], s)).join(' + '),
    };
    const hasIons = react.concat(prod).some((s) => s.ions && s.ph === 'aq');
    if (hasIons) {
      res.equation.ionic = mapStr(expandIons(react, rc)) + ' ' + arrow + ' ' + mapStr(expandIons(prod, pc));
      let nl = ni.lv, nr = ni.rv;
      const g = [...nl, ...nr].map((e) => e.n).reduce(gcd, 0) || 1;
      res.equation.net = nl.map((e) => (e.n / g > 1 ? e.n / g : '') + e.label).join(' + ') + ' ' + arrow + ' ' + nr.map((e) => (e.n / g > 1 ? e.n / g : '') + e.label).join(' + ');
      res.micro = {
        react: nl.map((e) => ({ label: e.label.replace(/\((s|aq|l|g)\)$/, ''), n: e.n / g, ph: e.ph })),
        prod: nr.map((e) => ({ label: e.label.replace(/\((s|aq|l|g)\)$/, ''), n: e.n / g, ph: e.ph })),
        spec: ni.spec.map((e) => ({ label: e.label, n: Math.max(1, Math.round(e.n / g)) })),
      };
    } else {
      res.micro = {
        react: react.map((s, i) => ({ label: s.f, n: rc[i], ph: s.ph })),
        prod: prod.map((s, i) => ({ label: s.f, n: pc[i], ph: s.ph })),
        spec: [],
      };
    }
    const h = hess(react, prod, rc, pc);
    if (o.dhPerWater != null) {
      const wi = prod.findIndex((s) => s.f === 'H2O');
      res.dh = r1(o.dhPerWater * pc[wi]);
      res.dhSource = 'textbook value for strong acid + strong base: ' + o.dhPerWater + ' kJ per mole of water formed';
      if (h) res.hess = h;
    } else if (h) { res.dh = h.dh; res.hess = h; res.dhSource = 'Hess\'s law from standard enthalpies of formation'; }
    else { res.dh = null; }
    if (o.dhNull) { res.dh = null; delete res.hess; res.dhSource = null; }
    res.coef = { react: rc, prod: pc };
    res.species = { react, prod };
    finishFx(res);
    return res;
  }

  function finishFx(res) {
    res.fx = res.fx || {};
    if (res.dT == null) res.dT = res.dh == null ? 0 : Math.max(-30, Math.min(80, -res.dh * 0.12));
    res.heat = res.dh == null ? 'unknown' : res.dh < -1 ? 'exo' : res.dh > 1 ? 'endo' : 'neutral';
    const hl = res.noHeatLine ? null : heatLine(res);
    if (hl) res.obs = (res.obs || []).concat(hl);
    res.dhNote = res.dhNote || null;
  }

  // ---------------------------------------------------------------- generic helpers
  const isAcid = (id) => CH[id].group === 'acid';
  const isBase = (id) => CH[id].group === 'base';
  const isSaltLike = (id) => (CH[id].group === 'salt' || CH[id].group === 'oxidiser') && ionsOf(id) && !CH[id].insoluble;
  const isMetal = (id) => !!CH[id].metal;
  const nm = (id) => CH[id].name.replace(/ \(.*\)/, '');
  const both = (fn) => (a, b) => fn(a, b) || fn(b, a);
  const sub = (f) => f; // plain text; formatted in UI

  const DEPOSIT_DESC = {
    Ag: 'shiny grey-white crystals of silver grow on the metal (a "silver tree")',
    Cu: 'a reddish-brown coating of copper forms on the metal',
    Pb: 'grey, feathery crystals of lead grow on the metal',
    Fe2: 'a dark grey deposit of iron forms on the metal',
    Zn: 'grey zinc is deposited on the metal',
    Al: 'silvery aluminium is deposited on the metal',
    Mg: 'silvery magnesium is deposited on the metal',
  };

  function Ecell(metalId, cat) {
    const E1 = CATION_E[cat] ? CATION_E[cat].E : 0;
    return r1((E1 - METAL[CH[metalId].metal].E) * 100) / 100;
  }
  const nElectrons = (a, b) => lcm(ION[a].z, ION[b].z);

  // ================================================================ RULES
  // each returns a result or null

  // ---- dissolving a solid in water
  function rDissolve(x, y) {
    if (y !== 'h2o') return null;
    const c = CH[x];
    if (!(c.group === 'salt' || c.group === 'base' || c.group === 'oxidiser' || x === 'sugar') || c.insoluble || c.weak) return null;
    if (x !== 'sugar' && !ionsOf(x)) return null;
    if (c.phase === 's' && x !== 'sugar' && c.group !== 'salt') return null;
    const dh = DSOL[x] != null ? DSOL[x] : null;
    let eq, ionsTxt;
    if (x === 'sugar') eq = 'C12H22O11(s) → C12H22O11(aq)';
    else {
      const [k, a] = ionsOf(x), cp = compound(k, a);
      const sp0 = chemSp(x);
      const f0 = x === 'cuso4h' ? 'CuSO4·5H2O' : cp.f;
      eq = f0 + '(s) → ' + (cp.nc > 1 ? cp.nc : '') + ION[k].d + '(aq) + ' + (cp.na > 1 ? cp.na : '') + ION[a].d + '(aq)';
      if (x === 'cuso4h') eq = 'CuSO4·5H2O(s) → Cu^2+(aq) + SO4^2-(aq) + 5H2O(l)';
      if (x === 'cacl2') eq = 'CaCl2(s) → Ca^2+(aq) + 2Cl^-(aq)';
    }
    const res = {
      reacts: true, balanced: true, kind: 'dissolution', types: ['Dissolution', dh == null ? 'Physical change' : dh < 0 ? 'Exothermic' : 'Endothermic'],
      equation: { mol: eq }, dh, dhSource: dh == null ? null : 'measured enthalpy of solution (standard values, approximate)',
      noReaction: false, solidIds: [x],
      fx: { solidConsume: 1, liq1: undefined, speed: 0.9, dissolve: true },
      micro: null, obs: [], why: [], deep: [],
      ph1: CH[x].ph,
    };
    const col = CH[x].color;
    const color = col ? colorWord(col) : 'colourless';
    res.obs.push('The solid dissolves in the water to give a ' + color + ' solution. No new substance is formed, so this is a physical process.');
    res.why.push('Dissolving has two energy steps: the ionic lattice must be pulled apart (this costs energy) and the separated ions are surrounded by water molecules (this releases energy). The balance of the two decides whether the beaker gets warm or cold.');
    res.deep.push('ΔH(solution) = −ΔH(lattice enthalpy, i.e. energy to separate the ions) + ΔH(hydration). Even endothermic dissolutions are spontaneous when the entropy gain of the ions scattering through the solution is large enough: ΔG = ΔH − TΔS < 0.');
    if (dh != null && dh > 5) res.why.push('Here the lattice energy is larger than the hydration energy, so heat is taken from the water: this is how an instant cold pack works.');
    if (dh != null && dh < -20) res.why.push('Here the hydration of the ions releases more energy than the lattice needs, so the water heats up: this is how a hot pack works.');
    const [k, a] = ionsOf(x) || [];
    if (k) res.micro = { react: [{ label: 'solid ' + CH[x].f.replace(/·.*/, ''), n: 5, ph: 's' }], prod: [{ label: ION[k].d, n: 5, ph: 'aq' }, { label: ION[a].d, n: 5, ph: 'aq' }], spec: [] };
    res.dhNote = dh == null ? 'The heat of solution of this salt is small; no value in our table.' : null;
    if (x === 'cuso4h') res.fx.liq1 = ION.Cu.col;
    finishFx(res);
    res.fx.liq1 = x === 'sugar' ? null : (c.color || null);   // dissolved sugar is colourless
    if (x === 'kmno4') res.fx.liq1 = '#9b1fa8';
    if (res.dh == null) { res.dT = 0; }
    return res;
  }

  // ---- metal + water
  function rMetalWater(m, y) {
    if (y !== 'h2o' || !isMetal(m)) return null;
    const M = CH[m].metal;
    if (!['na', 'k', 'ca', 'mg'].includes(M)) return null;
    let react = [metalSp(METAL[M].sym), molSp('H2O')], prod;
    if (M === 'na' || M === 'k') prod = [saltSp(METAL[M].ion, 'OH'), molSp('H2')];
    else if (M === 'ca') prod = [saltSp('Ca', 'OH'), molSp('H2')];
    else prod = [saltSp('Mg', 'OH'), molSp('H2')];
    const o = {
      kind: 'metal-water', types: ['Redox', 'Gas evolution', 'Exothermic', 'Displacement'],
      obs: [], why: [], deep: [], safety: [], ph1: 13.5,
      fx: { gas: { color: null, rate: 0.9, label: 'H2' }, deposit: null, speed: 1 },
    };
    const E = METAL[M].E;
    if (M === 'na') {
      o.obs.push('The silvery sodium melts into a shiny ball (it is so exothermic that sodium, m.p. 98 °C, melts) and skates over the water surface, fizzing.');
      o.obs.push('Hydrogen gas streams off. The heat can ignite it with a yellow flame. The solution becomes strongly alkaline (add phenolphthalein: pink).');
      o.fx.burn = { color: '#ffb23d', size: 0.45 }; o.fx.metalFloat = true; o.fx.gas.rate = 1; o.fx.speed = 1.6;
      o.safety.push('Use a piece no bigger than a grain of rice, behind a safety screen. Never touch with fingers.');
    } else if (M === 'k') {
      o.obs.push('Potassium is more reactive than sodium: it melts at once, darts about and the hydrogen ignites spontaneously with a lilac flame, often with a small pop or explosion.');
      o.fx.burn = { color: '#c58bff', size: 0.6 }; o.fx.metalFloat = true; o.fx.gas.rate = 1; o.fx.speed = 2;
      o.safety.push('Potassium can explode in water. Teacher demonstration only, with a safety screen.');
    } else if (M === 'ca') {
      o.ph1 = 12.4;
      o.obs.push('The grey calcium sinks and a steady stream of hydrogen bubbles rises from its surface. The water turns milky white as slightly soluble Ca(OH)₂ forms.');
      o.fx.ppt = { color: '#f2f2f2', amount: 0.45, noSettle: true }; o.fx.gas.rate = 0.75; o.fx.speed = 1.1;
    } else {
      o.ph1 = 10.3;
      o.obs.push('In cold water nothing much happens. Tiny bubbles form very slowly on the ribbon (an oxide layer protects it). Hot water or steam reacts much faster.');
      o.fx.gas.rate = 0.06; o.fx.speed = 0.25; o.timelapse = true;
    }
    o.why.push(M === 'mg' ? 'Magnesium sits above hydrogen in the reactivity series, so it can reduce water, but only slowly because of its protective oxide skin.' : 'Very reactive metals reduce water: they push the electrons into H₂O, releasing H₂ and leaving metal hydroxide. Reactivity increases down Group 1 because the outer electron is lost more easily.');
    o.deep.push('E°(' + METAL[M].sym + (METAL[M].ion === 'Na' || METAL[M].ion === 'K' ? '⁺' : '²⁺') + '/' + METAL[M].sym + ') = ' + E + ' V, much lower than E°(H₂O/H₂, pH 7) = −0.41 V, so ΔG° is very negative. The rate is a different question (kinetics): Mg is thermodynamically able to react but is slowed by a passivating Mg(OH)₂/MgO film.');
    return build(react, prod, o);
  }

  // ---- neutralisation
  function rNeutral(a, b) {
    if (!isAcid(a) || !isBase(b)) return null;
    const [, aa] = ionsOf(a);
    const react = [chemSp(a), chemSp(b)];
    let prod;
    const weakAcid = !!CH[a].weak, weakBase = !!CH[b].weak;
    if (b === 'nh3') prod = [saltSp('NH4', aa)];
    else prod = [saltSp(ionsOf(b)[0], aa), molSp('H2O')];
    const pptSalt = prod[0].ph === 's';
    const o = {
      kind: 'neutralisation', types: ['Acid–base neutralisation', 'Exothermic'], obs: [], why: [], deep: [], safety: [],
      fx: { liq1: undefined, speed: 1.2 },
    };
    if (!weakAcid && !weakBase && !pptSalt) o.dhPerWater = -57.1;
    let eqPH = 7;
    if (weakAcid && !weakBase) eqPH = 8.9; else if (!weakAcid && weakBase) eqPH = 5.3;
    const acidEx = weakAcid ? 3.2 : 1.5, baseEx = weakBase ? 10.5 : 12.5;
    o.phChoices = [
      { label: 'Excess acid', ph: acidEx }, { label: 'Equal moles (equivalence)', ph: pptSalt ? 7 : eqPH }, { label: 'Excess base', ph: baseEx },
    ];
    o.ph1 = o.phChoices[1].ph; o.phChoicesDefault = 1;
    o.obs.push('Both solutions are colourless, so no colour change is visible on its own. An indicator is needed to see the end point (try adding phenolphthalein or methyl orange).');
    if (pptSalt) {
      o.types.push('Precipitation');
      o.fx.ppt = { color: prod[0].ppt.color, amount: 0.9 };
      o.obs.push('A ' + colorWord(prod[0].ppt.color) + ' precipitate of ' + prod[0].ppt.name + ' also forms.');
      o.fx.liq1 = null;
    } else {
      o.fx.liq1 = solColor(aqIons(prod));
    }
    o.why.push(weakAcid || weakBase
      ? 'The H⁺ (or proton-donor) and OH⁻ (or proton-acceptor) react to make water or a salt. Because a weak acid or base is only partly ionised, a little less heat is released than for strong pairs, and the final solution is not exactly neutral.'
      : 'The H⁺ from the acid and the OH⁻ from the base combine to form water. This is the same net reaction for every strong acid and strong base: H⁺(aq) + OH⁻(aq) → H₂O(l). The other ions are spectators and stay dissolved: evaporate the water and the salt crystallises.');
    o.deep.push('The enthalpy of neutralisation is ≈ −57 kJ per mole of water for any strong acid with any strong base because the net ionic equation is identical. For weak electrolytes it is less negative since some energy goes into ionising the weak acid/base (e.g. CH₃COOH ≈ −56, NH₃ + HCl ≈ −52 kJ/mol).');
    if (eqPH !== 7) o.deep.push('At equivalence the pH is ' + eqPH + ' because the salt hydrolyses: ' + (weakAcid ? 'CH₃COO⁻ + H₂O ⇌ CH₃COOH + OH⁻ (basic)' : 'NH₄⁺ + H₂O ⇌ NH₃ + H₃O⁺ (acidic)') + '.');
    if (CH[a].conc) { o.obs.push('The concentrated acid makes this violently hot; real laboratory work always dilutes first.'); o.fx.boil = true; o.safety.push('Concentrated acid plus base spatters. Dilute the acid first.'); }
    return build(react, prod, o);
  }

  // ---- acid + carbonate / hydrogencarbonate / sulfide / thiosulfate
  function rAcidSalt(a, x) {
    if (!isAcid(a) || !ionsOf(x) || (CH[x].group !== 'salt' && x !== 'caco3')) return null;
    const [xc, xa] = ionsOf(x), [, aa] = ionsOf(a);
    const react = [chemSp(x), chemSp(a)];
    const weak = !!CH[a].weak;
    const o = { obs: [], why: [], deep: [], safety: [], fx: { liq1: null, speed: weak ? 0.55 : 1.1 }, ph1: 7 };
    let prod;
    if (xa === 'CO3' || xa === 'HCO3') {
      const salt = saltSp(xc, aa);
      prod = [salt, molSp('CO2'), molSp('H2O')];
      o.kind = 'acid-carbonate'; o.types = ['Gas evolution', 'Acid + carbonate', xa === 'HCO3' ? 'Endothermic' : 'Double displacement'];
      o.fx.gas = { color: null, rate: x === 'caco3' ? 0.55 : 1, label: 'CO2' };
      o.fx.liq1 = salt.ph === 's' ? null : solColor(aqIons(prod));
      if (x === 'caco3') o.fx.solidConsume = 0.7;
      o.obs.push((x === 'caco3' ? 'The marble chips fizz and slowly shrink. ' : 'The mixture fizzes vigorously. ') + 'Bubbles of colourless, odourless CO₂ gas escape; the liquid stays colourless.');
      o.obs.push('Test the gas: ' + GAS.CO2.test);
      if (salt.ph === 's') {
        o.fx.ppt = { color: salt.ppt.color, amount: 0.7, coat: x === 'caco3' };
        o.obs.push('A ' + colorWord(salt.ppt.color) + ' layer of ' + salt.ppt.name + ' forms' + (x === 'caco3' ? ' on the marble, which soon slows the reaction (the coating blocks the acid).' : '.'));
        if (x === 'caco3') o.fx.speed = 0.5;
      }
      o.why.push('Carbonic acid (H₂CO₃) is a very weak, unstable acid. Any stronger acid pushes H⁺ onto the carbonate, and the H₂CO₃ immediately falls apart into water and CO₂ gas. The gas escapes from the solution, which pulls the reaction to completion (Le Chatelier\'s principle).');
      o.deep.push(xa === 'HCO3'
        ? 'HCO₃⁻ + H⁺ → CO₂(g) + H₂O is endothermic (ΔH ≈ +13 kJ/mol) yet spontaneous: the large entropy gain from releasing a gas makes ΔG negative. This is why baking soda with vinegar feels cold.'
        : 'Net ionic: CO₃²⁻(aq) + 2H⁺(aq) → CO₂(g) + H₂O(l). The reaction is nearly thermoneutral; the driving force is the entropy of the escaping gas.');
      if (weak) o.deep.push('Acetic acid is a weak acid (Ka = 1.8×10⁻⁵) but its pKa (4.76) is still lower than pKa₁ of carbonic acid (6.35), so it can still release CO₂, just more slowly.');
    } else if (xa === 'S') {
      prod = [saltSp(xc, aa), molSp('H2S')];
      o.kind = 'acid-sulfide'; o.types = ['Gas evolution', 'Acid + sulfide'];
      o.fx.gas = { color: null, rate: 0.7, label: 'H2S' };
      o.fx.liq1 = solColor(aqIons(prod));
      o.obs.push('Effervescence of H₂S. A strong smell of rotten eggs. ' + GAS.H2S.test);
      o.why.push('Sulfide ions are strongly basic. They grab H⁺ from the acid and become H₂S, a weak acid that escapes as a gas: S²⁻ + 2H⁺ → H₂S(g).');
      o.safety.push('H₂S is as toxic as cyanide at high concentration and quickly deadens the sense of smell. Fume cupboard only.');
    } else if (xa === 'S2O3' && ['hcl', 'h2so4', 'hno3'].includes(a)) {
      prod = [saltSp(xc, aa), molSp('S'), molSp('SO2'), molSp('H2O')];
      o.kind = 'thiosulfate-acid'; o.types = ['Disproportionation', 'Precipitation', 'Gas evolution'];
      o.fx.gas = { color: null, rate: 0.25, label: 'SO2' };
      o.fx.ppt = { color: '#f3ecb0', amount: 0.6, noSettle: true };
      o.fx.liq1 = null; o.fx.speed = 0.7;
      o.obs.push('The clear solution slowly turns milky pale yellow as fine particles of sulfur appear ("disappearing cross" experiment).');
      o.obs.push('A little SO₂ gas is released: sharp, choking smell. ' + GAS.SO2.test);
      o.why.push('Thiosulfate is unstable in acid. S₂O₃²⁻ + 2H⁺ → S + SO₂ + H₂O. One sulfur atom is oxidised (+4 in SO₂) while the other is reduced (0 in S): a disproportionation.');
      o.deep.push('The cloudiness is used to measure reaction rate: time how long until a cross under the beaker disappears, then repeat at different concentrations or temperatures to find the rate law and activation energy.');
      o.dhNull = true; o.dhNote = 'The enthalpy depends on how much SO₂ stays dissolved, so no single value is given.';
    } else return null;
    if (a === 'h2so4' && xc === 'Ca') o.deep.push('CaSO₄ is only slightly soluble, so with H₂SO₄ the reaction stops quickly. Use HCl for a steady supply of CO₂ from marble.');
    return build(react, prod, o);
  }

  // ---- acid + basic oxide
  function rAcidOxide(a, x) {
    if (!isAcid(a) || !['cuo', 'fe2o3'].includes(x)) return null;
    const [, aa] = ionsOf(a);
    const cat = x === 'cuo' ? 'Cu' : 'Fe3';
    const prod = [saltSp(cat, aa), molSp('H2O')];
    const salt = prod[0];
    const col = solColor(aqIons(prod));
    const o = {
      kind: 'acid-oxide', types: ['Acid + basic oxide', 'Neutralisation'], obs: [], why: [], deep: [], safety: [],
      fx: { solidConsume: 1, liq1: col, speed: CH[a].weak ? 0.25 : 0.5 }, ph1: 3,
    };
    o.obs.push('The ' + colorWord(CH[x].color) + ' powder slowly dissolves (gentle warming speeds it up) and the solution turns ' + colorWord(col) + '.');
    o.why.push('Metal oxides are basic: the oxide ions (O²⁻) take H⁺ from the acid to make water, releasing metal ions into solution: ' + (x === 'cuo' ? 'CuO + 2H⁺ → Cu²⁺ + H₂O' : 'Fe₂O₃ + 6H⁺ → 2Fe³⁺ + 3H₂O') + '. This is the same type of reaction as acid + alkali.');
    o.deep.push(x === 'cuo' ? 'Blue/green colour: the hydrated copper(II) ion [Cu(H₂O)₆]²⁺ absorbs red-orange light (d–d transition). In concentrated chloride the colour shifts toward green as [CuCl₄]²⁻ forms.' : 'Fe³⁺ is yellow-brown in solution because of hydrolysis products [Fe(H₂O)₅OH]²⁺ and charge-transfer absorption.');
    return build([chemSp(x), chemSp(a)], prod, o);
  }

  // ---- dilute nitric acid + metals
  const HNO3_TABLE = {
    cu: { cat: 'Cu', gas: 'NO' }, zn: { cat: 'Zn', gas: 'N2O' }, fe: { cat: 'Fe3', gas: 'NO' }, mg: { cat: 'Mg', gas: 'N2O' }, al: { cat: 'Al', gas: 'N2O' },
  };
  function rHNO3Metal(a, m) {
    if (a !== 'hno3' || !isMetal(m)) return null;
    const M = CH[m].metal, t = HNO3_TABLE[M];
    if (!t) return null;
    const prod = [saltSp(t.cat, 'NO3'), molSp(t.gas), molSp('H2O')];
    const col = solColor(aqIons(prod));
    const o = { kind: 'metal-nitric', types: ['Redox', 'Gas evolution', 'Exothermic'], obs: [], why: [], deep: [], safety: [], fx: { liq1: col, speed: 0.8, gas: { color: null, rate: 0.7, label: t.gas }, metalStrip: true }, ph1: 2 };
    if (t.gas === 'NO') {
      o.fx.fumes = { color: '#9a5522', amount: 0.7, late: true };
      o.obs.push('Colourless NO bubbles form and turn brown (NO₂) as they meet oxygen at the mouth of the vessel.');
    } else {
      o.obs.push('Steady effervescence of N₂O (not H₂). The gas is colourless; it relights a glowing splint.');
    }
    if (col) o.obs.push('The solution turns ' + colorWord(col) + ' as ' + C.uni(ION[t.cat].d) + ' ions form.');
    if (M === 'al') { o.obs.push('Reaction starts slowly (Al₂O₃ skin), then speeds up.'); o.fx.speed = 0.55; }
    o.why.push('Nitric acid is an oxidising acid: it is the nitrate ion (NO₃⁻), not H⁺, that is reduced. That is why hydrogen is not released and why even copper, which cannot react with HCl or dilute H₂SO₄, dissolves.');
    o.deep.push('NO₃⁻ + 4H⁺ + 3e⁻ → NO + 2H₂O, E° = +0.96 V, which is greater than E°(Cu²⁺/Cu) = +0.34 V. The product depends on concentration and metal (conc. HNO₃ → NO₂, dilute → NO, very dilute with active metals → N₂O or NH₄⁺).');
    o.safety.push('Nitrogen oxides are toxic. Use a fume cupboard.');
    return build([chemSp(m), chemSp(a)], prod, o);
  }

  // ---- acid + metal
  function rAcidMetal(a, m) {
    if (!isAcid(a) || !isMetal(m) || CH[a].conc) return null;
    const M = CH[m].metal;
    if (METAL[M].E >= 0) return null;
    const [, aa] = ionsOf(a);
    const cat = METAL[M].ion;
    const prod = [saltSp(cat, aa), molSp('H2')];
    const salt = prod[0];
    const weak = !!CH[a].weak;
    const o = { kind: 'metal-acid', types: ['Redox', 'Displacement', 'Gas evolution', 'Exothermic'], obs: [], why: [], deep: [], safety: [], ph1: weak ? 4 : 2, metalStrip: true };
    const rate = { k: 2, na: 1.8, ca: 1.3, mg: 1.1, al: 0.8, zn: 0.7, fe: 0.35 }[M];
    o.fx = { gas: { color: null, rate: Math.min(1, rate * (weak ? 0.5 : 1)), label: 'H2' }, liq1: solColor(aqIons(prod)), speed: rate * (weak ? 0.5 : 1) * 0.9, metalStrip: true };
    const OBS = {
      k: 'Violent reaction: the potassium ignites and may explode. Hydrogen burns with a lilac flame.',
      na: 'Violent, explosive reaction (much faster than with water). Sodium darts about and the hydrogen may ignite.',
      ca: 'Vigorous, steady fizzing as hydrogen bubbles stream off. The calcium dissolves and the beaker warms.',
      mg: 'Rapid fizzing: the magnesium ribbon dissolves in seconds and the beaker becomes noticeably warm.',
      al: 'At first almost nothing happens (the protective Al₂O₃ layer), then steady fizzing starts and the mixture warms.',
      zn: 'A steady stream of hydrogen bubbles forms on the zinc, which gradually shrinks.',
      fe: 'A slow stream of small bubbles; the solution gradually turns pale green as Fe²⁺ forms.',
    };
    o.obs.push(OBS[M] + (weak ? ' (Acetic acid is weak, so it is slower than HCl.)' : ''));
    o.obs.push('Test the gas: ' + GAS.H2.test);
    if (salt.ph === 's') { o.fx.ppt = { color: salt.ppt.color, amount: 0.5, coat: true }; o.fx.speed *= 0.4; o.obs.push('Slightly soluble ' + salt.ppt.name + ' coats the metal and slows the reaction.'); }
    if (['k', 'na'].includes(M)) { o.fx.burn = { color: M === 'k' ? '#c58bff' : '#ffb23d', size: 0.7 }; o.fx.speed = 2; o.safety.push('Alkali metals in acid are explosive. Not for student work.'); }
    o.why.push('Metals above hydrogen in the reactivity series displace H⁺ from acids: ' + METAL[M].sym + ' → ' + C.uni(ION[cat].d) + ' + electrons, and the electrons reduce H⁺ to H₂. Copper, silver and gold are below hydrogen and do not react.');
    const n = ION[cat].z, E = -METAL[M].E;
    o.deep.push('E°cell = E°(H⁺/H₂) − E°(' + METAL[M].sym + 'ⁿ⁺/' + METAL[M].sym + ') = 0 − (' + METAL[M].E + ') = +' + r1(E * 100) / 100 + ' V, so ΔG° = −nFE° = −' + n + ' × 96485 × ' + r1(E * 100) / 100 + ' = ' + (-(n * 96.485 * E)).toFixed(0) + ' kJ per mole of metal (strongly spontaneous).');
    if (M === 'al') o.deep.push('Al is thermodynamically very reactive (E° = −1.66 V) but protected by a thin, tough Al₂O₃ film (passivation). Chloride ions (HCl) break through the film more easily than sulfate or acetate.');
    return build([chemSp(m), chemSp(a)], prod, o);
  }

  // ---- base + ammonium salt
  function rBaseAmmonium(b, x) {
    if (!isBase(b) || CH[b].weak || CH[x].group !== 'salt' || !ionsOf(x) || ionsOf(x)[0] !== 'NH4') return null;
    const [bc] = ionsOf(b), [, xa] = ionsOf(x);
    const prod = [saltSp(bc, xa), molSp('NH3g'), molSp('H2O')];
    const o = {
      kind: 'ammonium-base', types: ['Gas evolution', 'Endothermic', 'Acid–base (proton transfer)'], obs: [], why: [], deep: [], safety: [],
      fx: { gas: { color: null, rate: 0.6, label: 'NH3' }, liq1: null, speed: 0.9, fumes: { color: '#f4f4f4', amount: 0.25 } }, ph1: 11,
    };
    if (prod[0].ph === 's') { o.fx.ppt = { color: prod[0].ppt.color, amount: 0.5 }; }
    o.obs.push('A sharp, pungent smell of ammonia. Gently warm the mixture to speed it up. ' + GAS.NH3.test);
    o.obs.push('The mixture feels cold: this is a famous endothermic reaction (the Ba(OH)₂ + NH₄X demo can freeze a beaker to a wet wooden block).');
    o.why.push('NH₄⁺ is a weak acid and OH⁻ is a strong base. Hydroxide removes a proton: NH₄⁺ + OH⁻ → NH₃ + H₂O. The NH₃ is a gas and escapes, driving the reaction on.');
    o.deep.push('ΔH is positive (≈ +31 kJ per mole of NH₄⁺) from breaking the N–H bond and releasing a gas from solution, but ΔS is strongly positive too, so ΔG = ΔH − TΔS is negative at room temperature. The temperature falls because heat flows into the reaction from the surroundings.');
    o.safety.push('Ammonia gas irritates eyes and lungs: do not sniff directly.');
    return build([chemSp(b), chemSp(x)], prod, o);
  }

  // ---- base + CO2
  function rBaseCO2(b, y) {
    if (y !== 'co2' || !isBase(b) || CH[b].weak) return null;
    const [bc] = ionsOf(b);
    const salt = saltSp(bc, 'CO3');
    const prod = [salt, molSp('H2O')];
    const o = { kind: 'base-co2', types: ['Acid–base (acidic oxide + base)', 'Exothermic'], obs: [], why: [], deep: [], safety: [], fx: { liq1: null, speed: 0.9 }, ph1: 9.5 };
    if (salt.ph === 's') {
      o.types.push('Precipitation');
      o.fx.ppt = { color: salt.ppt.color, amount: 0.9, noSettle: true };
      o.fx.gasIn = true;
      o.obs.push('The clear solution turns milky as fine white ' + salt.ppt.name + ' forms: the standard test for CO₂ ("limewater test").');
      o.obs.push('Keep bubbling in more CO₂ and the milkiness disappears again: CaCO₃ + CO₂ + H₂O → Ca(HCO₃)₂ (soluble).');
    } else {
      o.obs.push('No visible change: sodium (or potassium) carbonate is soluble, so the solution stays clear. CO₂ is absorbed and the pH falls.');
      o.fx.gasIn = true;
    }
    o.why.push('CO₂ is an acidic oxide. It reacts with OH⁻ to form carbonate: CO₂ + 2OH⁻ → CO₃²⁻ + H₂O. With Ca²⁺ or Ba²⁺ the carbonate is insoluble and precipitates.');
    o.deep.push('Overall, CO₂ + OH⁻ ⇌ HCO₃⁻ is the first step; in excess hydroxide the second proton is removed to give CO₃²⁻. With excess CO₂ the carbonate is converted to the soluble hydrogencarbonate. This is also how caves and hard water form.');
    return build([chemSp(b), chemSp(y)], prod, o);
  }

  // ---- metal + salt solutions
  function rMetalSalt(m, s) {
    if (!isMetal(m) || !isSaltLike(s)) return null;
    const M = CH[m].metal, [sc, sa] = ionsOf(s);
    const Mion = METAL[M].ion;
    const active = ['na', 'k', 'ca'].includes(M);
    // oxidising ions of the salt (KMnO4, K2Cr2O7) are not modelled
    if (['MnO4', 'Cr2O7'].includes(sa)) return null;

    if (active) {
      // reacts with the water first
      if (sc === Mion) return null;
      const hy = PPT[sc + '|OH'];
      const react = [metalSp(METAL[M].sym), chemSp(s)];
      let prod;
      if (sc === 'NH4') {
        prod = [saltSp(Mion, sa), molSp('NH3g'), molSp('H2')];
      } else if (hy && !hy.slight) {
        react.push(molSp('H2O'));
        prod = [saltSp(sc, 'OH'), saltSp(Mion, sa), molSp('H2')];
      } else return null;
      const o = { kind: 'active-metal-salt', types: ['Redox', 'Gas evolution', 'Precipitation', 'Exothermic'], obs: [], why: [], deep: [], safety: [], ph1: 11,
        fx: { gas: { color: null, rate: 0.9, label: 'H2' }, speed: M === 'ca' ? 1 : 1.5, metalFloat: M !== 'ca', liq1: null, burn: M === 'k' ? { color: '#c58bff', size: 0.5 } : M === 'na' ? { color: '#ffb23d', size: 0.3 } : null } };
      if (prod[0].ph === 's') o.fx.ppt = { color: prod[0].ppt.color, amount: 0.9 };
      o.obs.push(METAL[M].name[0].toUpperCase() + METAL[M].name.slice(1) + ' does not displace the other metal. It reacts with the water in the solution, fizzing and releasing hydrogen.');
      if (prod[0].ph === 's') o.obs.push('The hydroxide formed then precipitates the metal ions: a ' + colorWord(prod[0].ppt.color) + ' precipitate of ' + prod[0].ppt.name + ' appears.');
      o.why.push('Very reactive metals cannot be used to displace other metals from solution. Water reacts first: 2M + 2H₂O → 2MOH + H₂. The hydroxide then reacts with the dissolved metal ion exactly like in a precipitation reaction.');
      o.safety.push('Reactive metals in solutions are dangerous: sparks, hydrogen flames, spattering.');
      return build(react, prod, o);
    }
    // Fe(III) + metal: reduction of Fe3+ to Fe2+
    if (sc === 'Fe3') {
      if (M === 'fe' || METAL[M].E < 0.77) {
        const prod = M === 'fe' ? [saltSp('Fe2', sa)] : [saltSp(Mion, sa), saltSp('Fe2', sa)];
        const o = { kind: 'metal-fe3', types: ['Redox', 'Exothermic'], obs: [], why: [], deep: [], safety: [], ph1: 3,
          fx: { liq1: solColor(aqIons(prod)), speed: 0.7, metalStrip: true } };
        const c1 = colorWord(ION.Fe3.col), c2 = colorWord(solColor(aqIons(prod)));
        o.obs.push('The yellow-brown colour of Fe³⁺ slowly fades to ' + c2 + ' as Fe³⁺ is reduced to Fe²⁺. The metal slowly dissolves.');
        o.why.push('Fe³⁺ is a good oxidising agent (E° = +0.77 V) and takes electrons from any metal with lower E°. It is reduced only to Fe²⁺ here; with plenty of reactive metal it could go all the way to iron. (Copper dissolved by FeCl₃ is how printed circuit boards are etched.)');
        o.deep.push('E°cell = E°(Fe³⁺/Fe²⁺) − E°(' + METAL[M].sym + ') = 0.77 − (' + METAL[M].E + ') = +' + r1((0.77 - METAL[M].E) * 100) / 100 + ' V.');
        return build([chemSp(m), chemSp(s)], prod, o);
      }
    }
    // simple displacement
    const ce = CATION_E[sc];
    if (!ce || sc === Mion) return null;
    if (!(METAL[M].E < ce.E)) return null;
    const prod = [saltSp(Mion, sa), metalSp(ce.metal)];
    const E = Ecell(m, sc);
    const o = { kind: 'displacement', types: ['Redox', 'Single displacement', 'Exothermic'], obs: [], why: [], deep: [], safety: [], ph1: 6,
      fx: { deposit: { color: ce.color, tree: !!ce.tree, name: ce.name }, liq1: solColor(aqIons(prod)), speed: M === 'mg' ? 1.3 : M === 'al' ? 0.6 : 0.9, metalStrip: true } };
    const before = colorWord(CH[s].color);
    const after = colorWord(o.fx.liq1);
    o.obs.push(DEPOSIT_DESC[sc][0].toUpperCase() + DEPOSIT_DESC[sc].slice(1) + ', while the ' + METAL[M].name + ' slowly dissolves.');
    if (CH[s].color) o.obs.push('The ' + before + ' solution gradually turns ' + after + ' as ' + C.uni(ION[sc].d) + ' ions are used up and ' + C.uni(ION[Mion].d) + ' ions form.');
    else if (o.fx.liq1) o.obs.push('The solution gradually turns ' + after + '.');
    else o.obs.push('The solution stays colourless: both the old and new metal ions are colourless.');
    if (M === 'al') o.obs.push('There may be a delay at first while the protective oxide film on the aluminium is broken down (chloride ions help).');
    o.why.push('A more reactive metal loses electrons more easily, so it pushes a less reactive metal out of its salt solution: ' + METAL[M].sym + ' + ' + C.uni(ION[sc].d) + ' → ' + C.uni(ION[Mion].d) + ' + ' + ce.metal + '. The reactivity series (K > Na > Ca > Mg > Al > Zn > Fe > Pb > H > Cu > Ag) predicts which metal displaces which.');
    const nE = nElectrons(Mion, sc);
    o.deep.push('E°cell = E°(' + C.uni(ION[sc].d) + '/' + ce.metal + ') − E°(' + C.uni(ION[Mion].d) + '/' + METAL[M].sym + ') = ' + ce.E + ' − (' + METAL[M].E + ') = +' + E + ' V. ΔG° = −nFE° = −' + nE + ' × 96485 × ' + E + ' ≈ ' + (-(nE * 96.485 * E)).toFixed(0) + ' kJ (n = electrons transferred for the equation as balanced).');
    return build([chemSp(m), chemSp(s)], prod, o);
  }

  // ---- ammonia solution + metal salt solution
  function rNH3Salt(a, s) {
    if (a !== 'nh3' || !isSaltLike(s)) return null;
    const [sc, sa] = ionsOf(s);
    const hy = PPT[sc + '|OH'];
    if (!hy || hy.slight || sc === 'NH4') return null;
    const react = [chemSp(s), chemSp('nh3'), molSp('H2O')];
    const prod = [saltSp(sc, 'OH'), saltSp('NH4', sa)];
    const EXC = {
      Zn: 'In excess ammonia the precipitate dissolves again as colourless [Zn(NH₃)₄]²⁺.',
      Ag: 'In excess ammonia the brown Ag₂O dissolves to give colourless [Ag(NH₃)₂]⁺ (Tollens\' reagent).',
      Cu: 'In excess ammonia it dissolves to an inky blue [Cu(NH₃)₄]²⁺.',
      Mg: 'Precipitation is only partial because the NH₄⁺ formed suppresses the OH⁻ concentration.',
      Al: 'It does not dissolve in excess ammonia (but does in excess NaOH).',
    };
    const o = { kind: 'ammonia-ppt', types: ['Precipitation', 'Weak base + metal ion', 'Double displacement'], obs: [], why: [], deep: [], safety: [], ph1: 9,
      fx: { ppt: { color: hy.color, amount: 0.9 }, liq1: null, speed: 1 } };
    o.obs.push('A ' + colorWord(hy.color) + ' precipitate of ' + hy.name + ' forms.');
    if (EXC[sc]) o.obs.push(EXC[sc]);
    o.obs.push(hy.note);
    o.why.push('Ammonia solution contains a little OH⁻ (NH₃ + H₂O ⇌ NH₄⁺ + OH⁻). That is enough to precipitate any metal hydroxide that is very insoluble.');
    o.deep.push('Ksp of ' + hy.name + (hy.ksp ? ' ≈ ' + sci(hy.ksp) : '') + ' is so small that even the low OH⁻ concentration in ammonia (about 4×10⁻³ M at 1 M NH₃) pushes Q beyond Ksp.');
    return build(react, prod, o);
  }

  // ---- double displacement (precipitation) between ionic compounds
  const HYDRO = { CO3: true, HCO3: true, S: true };
  function rMeta(x, y) {
    const ix = ionsOf(x), iy = ionsOf(y);
    if (!ix || !iy || CH[x].weak || CH[y].weak || CH[x].insoluble || CH[y].insoluble) return null;
    if ((CH[x].group === 'indicator') || (CH[y].group === 'indicator')) return null;
    const [c1, a1] = ix, [c2, a2] = iy;
    if (c1 === c2 || a1 === a2) return null;
    // complete hydrolysis of Fe3+ / Al3+ with carbonate / sulfide
    const hyd = [[c1, x, a2, y], [c2, y, a1, x]].find(([c, , a]) => C.HYDROLYSIS_CATIONS.includes(c) && HYDRO[a]);
    if (hyd) {
      const [c, cx, a, ax] = hyd;
      const ac = ionsOf(cx)[1], cc = ionsOf(ax)[0];
      const gas = a === 'S' ? molSp('H2S') : molSp('CO2');
      const react = [chemSp(cx), chemSp(ax)];
      if (a !== 'HCO3') react.push(molSp('H2O'));
      const prod = [saltSp(c, 'OH'), gas, saltSp(cc, ac)];
      const o = { kind: 'hydrolysis', dhNull: true, types: ['Precipitation', 'Gas evolution', 'Mutual hydrolysis'], obs: [], why: [], deep: [], safety: [], ph1: 7,
        fx: { ppt: { color: PPT[c + '|OH'].color, amount: 0.9 }, gas: { color: null, rate: 0.6, label: a === 'S' ? 'H2S' : 'CO2' }, liq1: null, speed: 1 } };
      o.obs.push('Both a ' + colorWord(PPT[c + '|OH'].color) + ' precipitate of ' + PPT[c + '|OH'].name + ' and bubbles of ' + (a === 'S' ? 'H₂S' : 'CO₂') + ' appear together.');
      o.why.push('The strongly acidic hydrated ' + C.uni(ION[c].d) + ' ion and the basic ' + C.uni(ION[a].d) + ' ion hydrolyse each other completely: the carbonate (or sulfide) is protonated and escapes as gas, and the metal ends up as its insoluble hydroxide. No ' + (a === 'S' ? 'sulfide' : 'carbonate') + ' of this metal can exist in water.');
      return build(react, prod, o);
    }
    const s1 = saltSp(c1, a2), s2 = saltSp(c2, a1);
    if (s1.ph !== 's' && s2.ph !== 's') return null;
    const ppts = [s1, s2].filter((s) => s.ph === 's');
    // product list: put the precipitate(s) first, then the soluble salt(s)
    const prod = ppts.concat([s1, s2].filter((s) => s.ph !== 's'));
    if (ppts.some((p) => p.ppt.oxide)) prod.push(molSp('H2O'));
    const color = ppts.length === 1 ? ppts[0].ppt.color : C.mix(ppts[0].ppt.color, ppts[1].ppt.color, 0.5);
    const amount = Math.min(...ppts.map((p) => (p.ppt.slight ? 0.45 : 1))) * 0.95;
    const o = { kind: 'precipitation', types: ['Precipitation', 'Double displacement'], obs: [], why: [], deep: [], safety: [], ph1: 7,
      fx: { ppt: { color, amount }, liq1: solColor(aqIons(prod)), speed: 1.1 } };
    const names = ppts.map((p) => p.ppt.name);
    o.obs.push('The two clear solutions mix and a ' + (ppts.length === 1 ? colorWord(color) + ' precipitate of ' + names[0] : 'precipitate of ' + names.join(' and ')) + ' appears at once as the solution turns cloudy; on standing it settles.');
    const before = [x, y].filter((i) => CH[i].phase !== 's').map((i) => CH[i].color).filter(Boolean);   // coloured SOLUTIONS only (white solids do not count)
    if (before.length && !o.fx.liq1) o.obs.push('The colour of the solution fades because the coloured ion is removed in the precipitate.');
    o.fx.liq1 = o.fx.liq1 || null;
    ppts.forEach((p) => { if (p.ppt.note) o.obs.push(p.ppt.note); });
    const net = ppts.map((p) => p.ppt.name).join(', ');
    o.why.push('Two soluble ionic compounds swap partners. When the new combination is insoluble in water, those ions find each other and clump together as a solid (' + net + '), while the other ions stay dissolved as spectators. Memorise the solubility rules: nitrates and Group 1 salts are always soluble; most chlorides are soluble except Ag⁺, Pb²⁺; most sulfates except Ba²⁺, Pb²⁺, (Ca²⁺); most hydroxides, carbonates and sulfides are insoluble except for Group 1 (and NH₄⁺).');
    ppts.forEach((p) => {
      if (p.ppt.ksp) {
        const Q = Math.pow(0.05, (compound(p.c, p.a).nc + compound(p.c, p.a).na));
        o.deep.push('Ksp(' + p.f + ') ≈ ' + sci(p.ppt.ksp) + ' at 25 °C. Mixing equal volumes of 0.1 M solutions gives roughly 0.05 M of each ion, so the ionic product Q ≈ ' + sci(Q) + ', which is ' + (Q > p.ppt.ksp ? sci(Q / p.ppt.ksp) + ' times Ksp: Q > Ksp, so the solid precipitates until Q falls back to Ksp.' : 'below Ksp: no precipitate at this concentration.'));
      }
    });
    if (c1 === 'H' || c2 === 'H') o.types.push('Acid + salt');
    return build([chemSp(x), chemSp(y)], prod, o);
  }

  // ---- bring the rules together for a pair
  const RULES = [
    rDissolve, both(rMetalWater), both(rNeutral), both(rAcidSalt), both(rAcidOxide),
    both(rHNO3Metal), both(rAcidMetal), both(rBaseAmmonium), both(rBaseCO2), both(rMetalSalt),
    both(rNH3Salt), rMeta,
  ];
  // rDissolve & rMeta need order permutations
  function runRules(a, b) {
    for (const rule of RULES) {
      let r = null;
      try { r = rule(a, b) || (rule === rDissolve || rule === rMeta ? rule(b, a) : null); } catch (e) { r = null; console.error('rule error', e); }
      if (r) return r;
    }
    return null;
  }

  // ---------------------------------------------------------------- no-reaction explanations
  function noReact(ids) {
    const [a, b] = ids;
    const A = CH[a], B = CH[b];
    const res = { reacts: false, kind: 'none', types: ['No reaction'], obs: [], why: [], deep: [], safety: [], fx: { liq1: undefined }, dh: null, dT: 0, heat: 'none', reason: '' };
    const names = nm(a) + ' and ' + nm(b);
    const ions = (id) => (ionsOf(id) || []).map((k) => C.uni(ION[k].d));
    const metalId = isMetal(a) ? a : isMetal(b) ? b : null;
    const otherId = metalId === a ? b : a;
    if (metalId) {
      const M = CH[metalId].metal;
      if (otherId === 'h2o') {
        res.reason = METAL[M].sym + ' does not react with cold water.';
        res.why.push(M === 'al' ? 'Aluminium is thermodynamically able to reduce water (E° = −1.66 V) but is protected by an unreactive oxide skin (Al₂O₃). Remove the film and it does react.' : METAL[M].sym + ' is too unreactive to reduce water at room temperature. (Iron rusts only slowly in air + water, and zinc needs steam.)');
      } else if (isAcid(otherId) && CH[otherId].conc) {
        res.reason = 'Concentrated sulfuric acid is an oxidising acid and gives SO₂, not H₂. It is not modelled for this metal without heating.';
        res.why.push('Concentrated H₂SO₄ oxidises metals using the sulfate itself (it is reduced to SO₂), e.g. Cu + 2H₂SO₄ → CuSO₄ + SO₂ + 2H₂O (needs heating). Try adding Heat.');
      } else if (isAcid(otherId)) {
        res.reason = METAL[M].sym + ' is below hydrogen in the reactivity series and cannot displace H⁺.';
        res.why.push('For a metal to react with a non-oxidising acid, E°(M²⁺/M) must be below E°(H⁺/H₂) = 0 V. Copper has E° = +0.34 V, so H⁺ cannot take electrons from it. Use nitric acid (an oxidising acid) to dissolve copper.');
        res.deep.push('E°cell = 0 − (+0.34) = −0.34 V < 0, so ΔG° = −nFE° = +66 kJ per mole of electrons×2: not spontaneous.');
      } else if (isSaltLike(otherId)) {
        const oc = ionsOf(otherId)[0];
        if (oc === METAL[M].ion) {
          res.reason = 'The metal is the same as the metal in the salt: there is nothing to displace.';
          res.why.push('Displacement needs a more reactive metal than the one already in solution. ' + METAL[M].sym + ' in a solution of its own salt just stays as it is.');
        } else if (CATION_E[oc]) {
          res.reason = METAL[M].sym + ' is less reactive than ' + CATION_E[oc].name + ', so it cannot displace it from solution.';
          res.why.push('A metal only displaces another metal from solution if it is higher in the reactivity series (lower E°). E°(' + METAL[M].sym + ') = ' + METAL[M].E + ' V is higher than E°(' + C.uni(ION[oc].d) + '/' + CATION_E[oc].metal + ') = ' + CATION_E[oc].E + ' V, so E°cell would be negative.');
          res.deep.push('E°cell = ' + CATION_E[oc].E + ' − (' + METAL[M].E + ') = ' + r1((CATION_E[oc].E - METAL[M].E) * 100) / 100 + ' V. A negative cell potential means ΔG° > 0.');
        } else {
          res.reason = METAL[M].sym + ' cannot displace ' + C.uni(ION[oc].d) + ' (a much more reactive metal ion).';
          res.why.push('Na⁺, K⁺, Ca²⁺ and Ba²⁺ are among the hardest ions to reduce (E° ≈ −2.7 to −2.9 V). Ordinary metals will not do it.');
        }
      } else res.reason = 'No reaction: nothing for the metal to react with here.';
    } else if (ionsOf(a) && ionsOf(b) && !A.weak && !B.weak && !(isAcid(a) && isAcid(b))) {
      const [c1, a1] = ionsOf(a), [c2, a2] = ionsOf(b);
      if (c1 === c2 || a1 === a2) {
        res.reason = 'Both compounds share an ion (' + (c1 === c2 ? C.uni(ION[c1].d) : C.uni(ION[a1].d)) + ') so swapping partners just gives the same compounds back.';
        res.why.push('In a double-displacement reaction the cations swap anions. Here one ion is common to both compounds, so nothing new can form.');
      } else {
        res.reason = 'All four possible combinations of ions are soluble: no precipitate, gas or water is formed.';
        res.why.push('When you mix the solutions, ' + [c1, a1, c2, a2].map((k) => C.uni(ION[k].d)).join(', ') + ' just mingle in the water. Swapping partners gives ' + saltSp(c1, a2).f + ' and ' + saltSp(c2, a1).f + ', both of which are soluble, so nothing leaves the solution. Those ions are all spectators.');
        res.deep.push('The ionic product Q for each possible new salt stays below its Ksp (or the salt is freely soluble), so no solid is formed. Chemical reaction requires a driving force: an insoluble solid, a gas, a weak electrolyte such as water, or a redox change.');
      }
    } else if (['h2o'].includes(a) || ['h2o'].includes(b)) {
      res.reason = 'It simply mixes with / dissolves in water: no chemical reaction.';
      res.why.push('Mixing with water dilutes the substance. If it was already a solution, the only change is a (small) dilution effect.');
    } else if (isAcid(a) && isAcid(b)) {
      res.reason = 'Two acids do not react with each other.';
      res.why.push('A reaction needs something to accept the protons. Two acids both want to donate H⁺.');
    } else if (isBase(a) && isBase(b)) {
      res.reason = 'Two bases do not react with each other.';
      res.why.push('Both would accept protons; nothing donates them.');
    } else {
      res.reason = 'No reaction is modelled between ' + names + ' under these conditions.';
      res.why.push('Either the chemicals are chemically inert towards each other here, or a catalyst/heat/ignition is needed that was not selected.');
    }
    res.obs.push('No visible change (no colour change, precipitate, gas or temperature change).');
    res.why.unshift(res.reason);
    // spectator particles
    const ionLabels = [];
    [a, b].forEach((id) => { const ii = ionsOf(id); if (ii && !CH[id].weak) ii.forEach((k) => ionLabels.push(ION[k].d)); });
    res.micro = ionLabels.length ? { react: [], prod: [], spec: ionLabels.map((l) => ({ label: l, n: 3 })) } : { react: [], prod: [], spec: [{ label: A.f, n: 4 }, { label: B.f, n: 4 }] };
    res.ph1 = null;
    return res;
  }

  // ---------------------------------------------------------------- top-level
  const CUR = C.CUR = C.CUR || {};
  const keyOf = (ids) => ids.slice().sort().join('+');
  C.keyOf = keyOf;

  function scoreOf(r) {
    let s = 1;
    if (r.fx && r.fx.gas) s += 3;
    if (r.fx && r.fx.ppt) s += 2;
    if (r.dh != null) s += Math.min(3, Math.abs(r.dh) / 150);
    return s;
  }

  function resolveCore(ids) {
    const key = keyOf(ids);
    if (CUR[key]) return clone(CUR[key]);
    if (ids.includes('heat')) {
      // heating a single chemical or a pair that is not in the curated list
      const res = noReact(ids.filter((i) => i !== 'heat').length >= 2 ? ids.filter((i) => i !== 'heat').slice(0, 2) : [ids.find((i) => i !== 'heat') || 'h2o', 'h2o']);
      res.reason = 'Heating this combination does not give a reaction we have modelled.';
      res.why = ['No decomposition or reaction is known for this combination at flame temperatures, or it is not in our data (try another).'];
      res.heatOnly = true;
      res.fx.flame = true;
      res.micro = null;
      return res;
    }
    if (ids.length === 2) {
      const r = runRules(ids[0], ids[1]);
      if (r) return r;
      return noReact(ids);
    }
    // 3 or 4 chemicals not in curated list: find the strongest pair reaction
    const pairs = [];
    for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
      const r = runRules(ids[i], ids[j]);
      if (r) pairs.push({ r, ids: [ids[i], ids[j]] });
    }
    if (!pairs.length) {
      const res = noReact(ids.slice(0, 2));
      res.reason = 'None of the pairs among these chemicals reacts in our model.';
      res.why = ['We checked every pair among your ' + ids.length + ' chemicals. No pair produces a precipitate, gas, new substance or energy change, so the mixture is just a mix of the starting solutions.'];
      res.micro = null;
      return res;
    }
    pairs.sort((p, q) => scoreOf(q.r) - scoreOf(p.r));
    const top = pairs[0];
    const out = top.r;
    out.partial = { used: top.ids, unused: ids.filter((i) => !top.ids.includes(i)), others: pairs.slice(1).map((p) => ({ ids: p.ids, eq: p.r.equation.mol, types: p.r.types })) };
    out.obs = out.obs.concat('Your mixture contains ' + ids.length + ' chemicals. The simulation shows the most noticeable reaction, between ' + top.ids.map(nm).join(' and ') + '.' + (out.partial.others.length ? ' Other reactions in this mixture are listed below.' : ' The others do not react with them in our model.'));
    return out;
  }

  function clone(o) { return JSON.parse(JSON.stringify(o)); }

  function supersetHints(ids) {
    const set = new Set(ids), out = [];
    Object.keys(CUR).forEach((k) => {
      const kids = k.split('+');
      if (kids.length === ids.length + 1 && ids.every((i) => kids.includes(i))) {
        const extra = kids.find((i) => !set.has(i));
        out.push({ add: extra, key: k, title: CUR[k].title || CUR[k].equation.mol });
      }
    });
    return out;
  }

  // phase and pH helpers for indicators
  function initialPH(ids) {
    for (const id of ids) { const p = CH[id].ph; if (CH[id].group !== 'indicator' && p != null && Math.abs(p - 7) > 0.8 && id !== 'heat') return p; }
    return 7;
  }

  // main entry: ids in the order the user selected them
  C.resolve = function (idsIn) {
    const ids = [...new Set(idsIn)];
    if (!ids.length) return { empty: true };
    const indicators = ids.filter((i) => CH[i].group === 'indicator');
    const rest = ids.filter((i) => CH[i].group !== 'indicator');
    let res;
    if (rest.length === 0) {
      res = { reacts: false, single: true, kind: 'indicator', types: ['Indicator'], obs: ['In neutral water the indicator shows its neutral colour. Add an acid or a base to see it change.'], why: [], deep: [], safety: [], fx: { liq1: undefined }, dh: null, dT: 0, heat: 'none', ph1: 7, micro: null };
    } else if (rest.length === 1) {
      const c = CH[rest[0]];
      res = { reacts: false, single: true, kind: 'single', types: ['Single chemical'], obs: [c.look + '.'], why: ['Pick a second chemical to see what happens when they react.'], deep: [], safety: [], fx: { liq1: undefined }, dh: null, dT: 0, heat: 'none', ph1: c.ph, micro: null };
      if (c.group === 'acid' || c.group === 'base') res.obs.push('Typical pH ≈ ' + c.ph + '. Add an indicator to see the colour that goes with that pH.');
    } else {
      res = resolveCore(rest.slice());
      if (!res.reacts && !res.heatOnly) {
        res.hints = supersetHints(rest);
      }
    }
    res.ids = ids;
    res.rest = rest;
    res.indicators = indicators;
    if (res.ph1 == null) res.ph1 = res.reacts ? 7 : initialPH(rest);
    res.ph0 = initialPH(rest);
    res.key = keyOf(rest);
    return res;
  };

  C.fmtEq = function (s) { return s; };
  C.parseFormula = parseFormula; C.balance = balance; C.checkEq = checkEq; C.parseEq = parseEq; C.compound = compound;
  C.ionsOf = ionsOf; C.noReact = noReact; C.colorWord = colorWord; C.solColor = solColor; C.build = build;
  C.saltSp = saltSp; C.molSp = molSp; C.chemSp = chemSp; C.metalSp = metalSp; C.finishFx = finishFx;
})();
