/* Lab Visuals: titration experiment definitions (no DOM; tested in tests/titrations.test.js).
   Each experiment's make(rnd) builds a fresh session with a hidden unknown, a state(V) function that gives
   the flask colour / pH / conductivity / potential at any added volume, and a solve() that does the student's calculation. */
(function () {
  'use strict';
  const C = globalThis.Chem, L = C.Lab;
  const WATER = '#cfe6f5';
  const mixc = (a, b, t) => C.mix(a, b, Math.max(0, Math.min(1, t)));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd4 = (x) => Number(x.toFixed(4));
  const T = (C.Titr = { EXPS: [], byId: {} });
  const def = (d) => { T.EXPS.push(d); T.byId[d.id] = d; };
  const pink = (excessM) => { const t = 1 - Math.exp(-excessM / 1.2e-5); return t > 0.03 ? mixc(WATER, '#d84bc4', t) : null; };

  const ABSTEPS = (extra) => ['Rinse the burette with the titrant and fill it. Note the initial reading.', 'Pipette the aliquot into a conical flask and add the indicator.'].concat(extra);
  const REPEAT = 'Repeat until two titres agree within 0.1 mL (concordant), then use their mean.';

  // ---------------------------------------------------------------- acid-base, indicator
  def({
    id: 'hcl-naoh', level: '11', mode: 'indicator', title: 'HCl vs NaOH', short: 'Your first titration: strong acid, strong base', unis: [], indicators: ['phph', 'mo'],
    steps: ABSTEPS(['Add NaOH from the burette, swirling, until the indicator just changes colour (the end point).', REPEAT]),
    make(rnd) {
      const c = rnd4(L.between(rnd, 0.05, 0.15, 0.0025)), V0 = 25, Cb = 0.1;
      const fl = { V0, Cl0: c, fams: [] }, tt = { kind: 'base', C: Cb };
      return {
        aliquot: V0, titrant: '0.1000 M NaOH (standard)', flask: '25.0 mL HCl of unknown strength', titrantColour: null, veq: (c * V0) / Cb, vmax: 40,
        state: (Vt, ctx) => { const r = L.acidBase(fl, tt, Vt); return { pH: r.pH, colour: C.indColor((ctx && ctx.ind) || 'phph', r.pH) }; },
        curve: (V) => L.acidBase(fl, tt, V).pH, yLabel: 'pH',
        report: [{ id: 'c', label: 'Concentration of HCl', unit: 'M', truth: c, dp: 4 }],
        solve: (m) => { const x = (Cb * m.t) / V0; return { values: { c: x }, lines: ['HCl + NaOH → NaCl + H₂O (1 : 1)', 'M(HCl) = M(NaOH) × V(NaOH) / V(HCl)', `= 0.1000 × ${m.t.toFixed(2)} / ${V0}`, `= ${x.toFixed(4)} M`] }; },
      };
    },
  });

  def({
    id: 'naoh-oxalic', level: '11', mode: 'indicator', title: 'Standardise NaOH with oxalic acid', short: 'Primary standard against an unknown base', unis: ['CU'], indicators: ['phph'],
    steps: ABSTEPS(['The flask holds 20.0 mL of standard 0.0500 M oxalic acid. The burette holds NaOH of unknown strength.', 'Titrate until one drop turns the solution permanently faint pink (phenolphthalein).', REPEAT]),
    make(rnd) {
      const Cn = rnd4(L.between(rnd, 0.08, 0.12, 0.0025)), V0 = 20, Co = 0.05;
      const fl = { V0, fams: [{ C: Co, ...L.FAM.oxalic }] }, tt = { kind: 'base', C: Cn };
      return {
        aliquot: V0, titrant: 'NaOH of unknown strength (about 0.1 M)', flask: '20.0 mL of standard 0.0500 M oxalic acid', titrantColour: null, veq: (2 * Co * V0) / Cn, vmax: 40,
        state: (Vt) => { const r = L.acidBase(fl, tt, Vt); return { pH: r.pH, colour: C.indColor('phph', r.pH) }; },
        curve: (V) => L.acidBase(fl, tt, V).pH, yLabel: 'pH',
        report: [{ id: 'c', label: 'Concentration of NaOH', unit: 'M', truth: Cn, dp: 4 }],
        solve: (m) => { const x = (2 * Co * V0) / m.t; return { values: { c: x }, lines: ['H₂C₂O₄ + 2NaOH → Na₂C₂O₄ + 2H₂O (1 : 2)', 'M(NaOH) = 2 × M(acid) × V(acid) / V(NaOH)', `= 2 × 0.0500 × ${V0} / ${m.t.toFixed(2)}`, `= ${x.toFixed(4)} M`] }; },
      };
    },
  });

  def({
    id: 'vinegar', level: '11', mode: 'indicator', title: 'Acetic acid in vinegar', short: 'Weak acid vs strong base', unis: ['CU'], indicators: ['phph'],
    steps: ABSTEPS(['The vinegar was diluted 10-fold: 10.0 mL made up to 100 mL. The flask holds 25.0 mL of this.', 'The burette holds standard 0.1000 M NaOH. Titrate to the first permanent faint pink.', REPEAT]),
    make(rnd) {
      const orig = rnd4(L.between(rnd, 0.7, 1.05, 0.01)), V0 = 25, Cb = 0.1, Cd = orig / 10;
      const fl = { V0, fams: [{ C: Cd, ...L.FAM.acetic }] }, tt = { kind: 'base', C: Cb };
      return {
        aliquot: V0, titrant: '0.1000 M NaOH (standard)', flask: '25.0 mL of 10-fold diluted vinegar', titrantColour: null, veq: (Cd * V0) / Cb, vmax: 40,
        state: (Vt) => { const r = L.acidBase(fl, tt, Vt); return { pH: r.pH, colour: C.indColor('phph', r.pH) }; },
        curve: (V) => L.acidBase(fl, tt, V).pH, yLabel: 'pH',
        report: [{ id: 'w', label: 'Acetic acid in the vinegar', unit: '% w/v', truth: orig * 6.005, dp: 2 }],
        solve: (m) => { const cd = (Cb * m.t) / V0, o = cd * 10, w = o * 6.005; return { values: { w }, lines: ['CH₃COOH + NaOH → CH₃COONa + H₂O (1 : 1)', `Diluted vinegar: M = 0.1000 × ${m.t.toFixed(2)} / ${V0} = ${cd.toFixed(4)} M`, `Original vinegar (×10): ${o.toFixed(3)} M`, `Mass: ${o.toFixed(3)} × 60.05 g/L = ${(o * 60.05).toFixed(1)} g/L = ${w.toFixed(2)} g per 100 mL (% w/v)`] }; },
      };
    },
  });

  // two end points with HCl: phenolphthalein then methyl orange
  const twoEnd = (id, title, short, unis, mk) => def({
    id, level: 'bsc', mode: 'indicator2', title, short, unis, indicators: ['phph', 'mo'],
    steps: ['Pipette 25.0 mL of the mixture into the flask and add phenolphthalein (pink).', 'Titrate with standard 0.1000 M HCl until the pink just disappears: first end point (V₁).', 'Add methyl orange (yellow) and continue until it turns orange: second end point (V₂, total volume from the start).', REPEAT],
    make: mk,
  });
  twoEnd('carb-bicarb', 'Na₂CO₃ and NaHCO₃ in a mixture', 'Two indicators, two end points', ['CU', 'WBSU', 'BU'], function (rnd) {
    const c1 = rnd4(L.between(rnd, 0.02, 0.05, 0.0025)), c2 = rnd4(L.between(rnd, 0.02, 0.05, 0.0025)), V0 = 25, Ca = 0.1;
    const fl = { V0, Na0: 2 * c1 + c2, fams: [{ C: c1 + c2, ...L.FAM.carbonate }] }, tt = { kind: 'acid', C: Ca };
    const v1 = (c1 * V0) / Ca, v2 = v1 + ((c1 + c2) * V0) / Ca;
    return {
      aliquot: V0, titrant: '0.1000 M HCl (standard)', flask: '25.0 mL of Na₂CO₃ + NaHCO₃ mixture', titrantColour: null, veq: [v1, v2], vmax: 45,
      state: (Vt, ctx) => { const r = L.acidBase(fl, tt, Vt); let col = null; if (ctx && ctx.ph && r.pH > 8.2) col = C.indColor('phph', r.pH); else if (ctx && ctx.mo) col = C.indColor('mo', r.pH); return { pH: r.pH, colour: col }; },
      curve: (V) => L.acidBase(fl, tt, V).pH, yLabel: 'pH',
      report: [{ id: 'c1', label: 'Na₂CO₃', unit: 'M', truth: c1, dp: 4 }, { id: 'c2', label: 'NaHCO₃', unit: 'M', truth: c2, dp: 4 }],
      solve: (m) => { const a = (Ca * m.t1) / V0, b = (Ca * (m.t2 - 2 * m.t1)) / V0; return { values: { c1: a, c2: b }, lines: ['First end point (phenolphthalein): CO₃²⁻ + H⁺ → HCO₃⁻', 'Second end point (methyl orange): HCO₃⁻ + H⁺ → H₂CO₃', `Na₂CO₃ = 0.1000 × ${m.t1.toFixed(2)} / ${V0} = ${a.toFixed(4)} M`, `NaHCO₃ = 0.1000 × (${m.t2.toFixed(2)} − 2 × ${m.t1.toFixed(2)}) / ${V0} = ${b.toFixed(4)} M`] }; },
    };
  });
  twoEnd('naoh-carb', 'NaOH and Na₂CO₃ in a mixture', 'Two end points with HCl', ['WBSU'], function (rnd) {
    const c1 = rnd4(L.between(rnd, 0.02, 0.05, 0.0025)), c2 = rnd4(L.between(rnd, 0.02, 0.04, 0.0025)), V0 = 25, Ca = 0.1;
    const fl = { V0, Na0: c1 + 2 * c2, fams: [{ C: c2, ...L.FAM.carbonate }] }, tt = { kind: 'acid', C: Ca };
    const v1 = ((c1 + c2) * V0) / Ca, v2 = v1 + (c2 * V0) / Ca;
    return {
      aliquot: V0, titrant: '0.1000 M HCl (standard)', flask: '25.0 mL of NaOH + Na₂CO₃ mixture', titrantColour: null, veq: [v1, v2], vmax: 45,
      state: (Vt, ctx) => { const r = L.acidBase(fl, tt, Vt); let col = null; if (ctx && ctx.ph && r.pH > 8.2) col = C.indColor('phph', r.pH); else if (ctx && ctx.mo) col = C.indColor('mo', r.pH); return { pH: r.pH, colour: col }; },
      curve: (V) => L.acidBase(fl, tt, V).pH, yLabel: 'pH',
      report: [{ id: 'c1', label: 'NaOH', unit: 'M', truth: c1, dp: 4 }, { id: 'c2', label: 'Na₂CO₃', unit: 'M', truth: c2, dp: 4 }],
      solve: (m) => { const b = (Ca * (m.t2 - m.t1)) / V0, a = (Ca * (2 * m.t1 - m.t2)) / V0; return { values: { c1: a, c2: b }, lines: ['First end point: NaOH fully neutralised and CO₃²⁻ → HCO₃⁻ (V₁)', 'Second end point: HCO₃⁻ → H₂CO₃ (V₂ − V₁ is for Na₂CO₃ alone)', `Na₂CO₃ = 0.1000 × (${m.t2.toFixed(2)} − ${m.t1.toFixed(2)}) / ${V0} = ${b.toFixed(4)} M`, `NaOH = 0.1000 × (2 × ${m.t1.toFixed(2)} − ${m.t2.toFixed(2)}) / ${V0} = ${a.toFixed(4)} M`] }; },
    };
  });

  // ---------------------------------------------------------------- redox
  const mn = (id, level, title, short, unis, flaskTxt, kind) => def({
    id, level, mode: 'indicator', title, short, unis, indicators: [], needsHeat: kind === 'oxalic',
    steps: ABSTEPS([kind === 'oxalic' ? 'Add dilute H₂SO₄ to the oxalic acid and heat to 60–70 °C (use the Heat switch). Do not add indicator: KMnO₄ is its own indicator.' : 'Add dilute H₂SO₄ to the flask. No external indicator is needed: KMnO₄ is its own indicator.', 'Add KMnO₄ slowly. Each drop is decolourised, at first slowly. The end point is the first faint pink that lasts about 30 seconds.', REPEAT]),
    make(rnd) {
      let V0, C0, Cm, veq, rep, solve, titrantLabel, flaskLabel;
      if (kind === 'oxalic') {
        Cm = rnd4(L.between(rnd, 0.016, 0.024, 0.0005)); V0 = 20; C0 = 0.05; veq = (2 / 5) * C0 * V0 / Cm;
        titrantLabel = 'KMnO₄ of unknown strength (about 0.02 M)'; flaskLabel = '20.0 mL of standard 0.0500 M oxalic acid + H₂SO₄, 60–70 °C';
        rep = [{ id: 'c', label: 'Concentration of KMnO₄', unit: 'M', truth: Cm, dp: 4 }];
        solve = (m) => { const x = (2 * C0 * V0) / (5 * m.t); return { values: { c: x }, lines: ['2MnO₄⁻ + 5H₂C₂O₄ + 6H⁺ → 2Mn²⁺ + 10CO₂ + 8H₂O (2 : 5)', 'M(KMnO₄) = 2 × M(oxalic) × V(oxalic) / (5 × V(KMnO₄))', `= 2 × 0.0500 × ${V0} / (5 × ${m.t.toFixed(2)})`, `= ${x.toFixed(4)} M`] }; };
      } else if (kind === 'mohr') {
        Cm = 0.02; V0 = 25; C0 = rnd4(L.between(rnd, 0.04, 0.09, 0.0025)); veq = (C0 * V0) / (5 * Cm);
        titrantLabel = '0.0200 M KMnO₄ (standard)'; flaskLabel = '25.0 mL of Mohr’s salt solution (Fe²⁺ unknown) + H₂SO₄';
        rep = [{ id: 'c', label: 'Concentration of Fe²⁺', unit: 'M', truth: C0, dp: 4 }, { id: 'g', label: 'Mohr’s salt (M = 392.1)', unit: 'g/L', truth: C0 * 392.14, dp: 2 }];
        solve = (m) => { const x = (5 * Cm * m.t) / V0; return { values: { c: x, g: x * 392.14 }, lines: ['MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O (1 : 5)', 'M(Fe²⁺) = 5 × M(KMnO₄) × V(KMnO₄) / V(Fe²⁺)', `= 5 × 0.0200 × ${m.t.toFixed(2)} / ${V0} = ${x.toFixed(4)} M`, `Mohr’s salt = ${x.toFixed(4)} × 392.14 = ${(x * 392.14).toFixed(2)} g/L`] }; };
      } else { // h2o2
        Cm = 0.02; V0 = 10; const orig = rnd4(L.between(rnd, 0.6, 1.0, 0.01)); C0 = orig / 10; veq = (2 / 5) * C0 * V0 / Cm;
        titrantLabel = '0.0200 M KMnO₄ (standard)'; flaskLabel = '10.0 mL of 10-fold diluted H₂O₂ + H₂SO₄';
        rep = [{ id: 'm', label: 'H₂O₂ in the original sample', unit: 'M', truth: orig, dp: 3 }, { id: 'vs', label: 'Volume strength', unit: 'vol', truth: orig * 11.2, dp: 1 }];
        solve = (m) => { const cd = (5 * Cm * m.t) / (2 * V0), o = cd * 10; return { values: { m: o, vs: o * 11.2 }, lines: ['2MnO₄⁻ + 5H₂O₂ + 6H⁺ → 2Mn²⁺ + 5O₂ + 8H₂O (2 : 5)', `Diluted: M = 5 × 0.0200 × ${m.t.toFixed(2)} / (2 × ${V0}) = ${cd.toFixed(4)} M`, `Original (×10): ${o.toFixed(3)} M = ${(o * 34.01 / 10).toFixed(2)} % w/v`, `Volume strength = molarity × 11.2 = ${(o * 11.2).toFixed(1)} vol`] }; };
      }
      const cm = Cm;
      return {
        aliquot: V0, titrant: titrantLabel, flask: flaskLabel, titrantColour: '#a21caf', veq, vmax: 40, kind: 'permanganate',
        state: (Vt, ctx) => {
          const x = Vt / veq;
          if (x < 1) {
            const tint = kind === 'mohr' ? mixc(WATER, '#e6c66c', 0.5 * x) : null;
            return { colour: tint, flash: Vt > 0 ? { c: '#d84bc4', slow: ctx && !ctx.heated && kind === 'oxalic' && Vt < 2 } : null };
          }
          const exc = (cm * (Vt - veq)) / (V0 + Vt + 20);
          return { colour: pink(exc), flash: null };
        },
        curve: null, yLabel: '',
        report: rep, solve,
      };
    },
  });
  mn('kmno4-oxalic', '12', 'Standardise KMnO₄ with oxalic acid', 'Self-indicating redox titration', ['CU', 'BU'], '', 'oxalic');
  mn('mohr-kmno4', '12', 'Fe(II) in Mohr’s salt with KMnO₄', 'Estimate Fe²⁺ with a standard oxidant', ['CU', 'WBSU', 'BU'], '', 'mohr');
  mn('h2o2-kmno4', 'bsc', 'Strength of a H₂O₂ sample', 'Hydrogen peroxide with KMnO₄', ['BU'], '', 'h2o2');

  def({
    id: 'fe-dichromate', level: 'bsc', mode: 'indicator', title: 'Fe(II) with K₂Cr₂O₇', short: 'Internal indicator: diphenylamine', unis: ['WBSU', 'BU'], indicators: [],
    steps: ABSTEPS(['The flask holds 25.0 mL of Fe²⁺ solution (unknown) with dilute H₂SO₄, H₃PO₄ and diphenylamine indicator.', 'Add K₂Cr₂O₇ until the green turns to a sharp blue-violet.', REPEAT]),
    make(rnd) {
      const C0 = rnd4(L.between(rnd, 0.04, 0.09, 0.0025)), V0 = 25, Cd = 0.016667, veq = (C0 * V0) / (6 * Cd);
      return {
        aliquot: V0, titrant: '0.01667 M K₂Cr₂O₇ (standard, 0.1 N)', flask: '25.0 mL Fe²⁺ (unknown) + acids + diphenylamine', titrantColour: '#f28c28', veq, vmax: 40,
        state: (Vt) => {
          const x = Vt / veq;
          if (x < 1) return { colour: mixc('#cfe6f5', '#5f9a5f', 0.15 + 0.7 * x), flash: null };
          const t = clamp((Vt - veq) / 0.15, 0, 1);
          return { colour: mixc('#6d4aa0', '#3b1a78', t * 0.7), flash: null };
        },
        curve: null, yLabel: '',
        report: [{ id: 'c', label: 'Concentration of Fe²⁺', unit: 'M', truth: C0, dp: 4 }],
        solve: (m) => { const x = (6 * Cd * m.t) / V0; return { values: { c: x }, lines: ['Cr₂O₇²⁻ + 6Fe²⁺ + 14H⁺ → 2Cr³⁺ + 6Fe³⁺ + 7H₂O (1 : 6)', 'M(Fe²⁺) = 6 × M(K₂Cr₂O₇) × V(K₂Cr₂O₇) / V(Fe²⁺)', `= 6 × 0.016667 × ${m.t.toFixed(2)} / ${V0}`, `= ${x.toFixed(4)} M`] }; },
      };
    },
  });

  def({
    id: 'iodo-cu', level: 'bsc', mode: 'indicator', title: 'Iodometric estimation of Cu(II)', short: 'Na₂S₂O₃ against liberated iodine, starch', unis: ['WBSU', 'BU'], indicators: [], needsStarch: true,
    steps: ABSTEPS(['The flask holds 25.0 mL of Cu²⁺ solution (unknown) treated with excess KI: brown iodine forms and white CuI precipitates (2Cu²⁺ + 4I⁻ → 2CuI + I₂).', 'Titrate with 0.1000 M Na₂S₂O₃ until the brown fades to pale yellow.', 'Add starch (blue-black) and continue drop by drop until the blue just disappears.', REPEAT]),
    make(rnd) {
      const C0 = rnd4(L.between(rnd, 0.04, 0.09, 0.0025)), V0 = 25, Ct = 0.1, veq = (C0 * V0) / Ct;
      return {
        aliquot: V0, titrant: '0.1000 M Na₂S₂O₃ (standard)', flask: '25.0 mL Cu²⁺ (unknown) + excess KI', titrantColour: null, veq, vmax: 40,
        state: (Vt, ctx) => {
          const f = Math.max(0, 1 - Vt / veq);
          if (ctx && ctx.starch) return { colour: f > 0.004 ? mixc('#efe6cf', '#0f1238', Math.min(1, f * 4)) : '#efe6cf', flash: null };
          return { colour: mixc('#f1e8cc', '#7a3d12', f), flash: null };
        },
        curve: null, yLabel: '',
        report: [{ id: 'c', label: 'Concentration of Cu²⁺', unit: 'M', truth: C0, dp: 4 }, { id: 'g', label: 'Copper (63.55 g/mol)', unit: 'g/L', truth: C0 * 63.55, dp: 3 }],
        solve: (m) => { const x = (Ct * m.t) / V0; return { values: { c: x, g: x * 63.55 }, lines: ['2Cu²⁺ + 4I⁻ → 2CuI + I₂;  I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻', 'Net: 1 Cu²⁺ ≡ 1 S₂O₃²⁻', `M(Cu²⁺) = 0.1000 × ${m.t.toFixed(2)} / ${V0} = ${x.toFixed(4)} M`, `Copper = ${x.toFixed(4)} × 63.55 = ${(x * 63.55).toFixed(3)} g/L`] }; },
      };
    },
  });

  def({
    id: 'edta-hardness', level: 'bsc', mode: 'indicator', title: 'Total hardness of water (EDTA)', short: 'Eriochrome Black T, pH 10 buffer', unis: ['CU', 'WBSU', 'BU'], indicators: [],
    steps: ABSTEPS(['The flask holds 50.0 mL of the water sample with NH₃/NH₄Cl buffer (pH 10) and a few drops of Eriochrome Black T: wine red (Ca²⁺/Mg²⁺–EBT complex).', 'Titrate with 0.01000 M EDTA until the colour changes sharply from wine red through purple to pure blue.', REPEAT]),
    make(rnd) {
      const H = Math.round(L.between(rnd, 80, 400, 5)), V0 = 50, Ce = 0.01;
      const vEq = ((H / 100.09) * (V0 / 1000)) / Ce;   // mL: (mmol/L × L) / (mmol/mL)
      return {
        aliquot: V0, titrant: '0.01000 M EDTA (standard)', flask: '50.0 mL water sample + buffer + EBT', titrantColour: null, veq: vEq, vmax: 40,
        state: (Vt) => { const f = Math.max(0, 1 - Vt / vEq), t = clamp(f / 0.07, 0, 1); return { colour: f < 0.003 ? '#2f6fd6' : mixc('#2f6fd6', '#a3192b', Math.pow(t, 0.6)), flash: null }; },
        curve: null, yLabel: '',
        report: [{ id: 'h', label: 'Total hardness', unit: 'mg/L as CaCO₃', truth: H, dp: 0 }],
        solve: (m) => { const x = (m.t * Ce * 100.09 * 1000) / V0; return { values: { h: x }, lines: ['EDTA binds Ca²⁺ and Mg²⁺ 1 : 1', 'mmol EDTA = mmol (Ca²⁺ + Mg²⁺) in 50.0 mL', `Hardness = ${m.t.toFixed(2)} × 0.01000 × 100.09 × 1000 / 50.0`, `= ${x.toFixed(0)} mg/L as CaCO₃`] }; },
      };
    },
  });

  // ---------------------------------------------------------------- conductometric
  def({
    id: 'conduct-mix', level: 'bsc', mode: 'conductometric', title: 'Conductometric: HCl + CH₃COOH vs NaOH', short: 'Strong + weak acid mixture, two breaks', unis: ['CU', 'WBSU'],
    steps: ['Pipette 25.0 mL of the acid mixture into the cell and add distilled water to 100 mL.', 'Add 0.1000 M NaOH in small steps. After each addition the cell reading is recorded automatically.', 'Plot conductivity against volume. The lines meet at two end points: strong acid first, then the weak acid.', 'Use the analysis button to fit the straight lines and read both end points.'],
    make(rnd) {
      const c1 = rnd4(L.between(rnd, 0.03, 0.07, 0.0025)), c2 = rnd4(L.between(rnd, 0.03, 0.07, 0.0025)), V0 = 100, Cb = 0.1, al = 25;
      const f = al / V0, fl = { V0, Cl0: c1 * f, fams: [{ C: c2 * f, ...L.FAM.acetic }] }, tt = { kind: 'base', C: Cb };
      const v1 = (c1 * al) / Cb, v2 = ((c1 + c2) * al) / Cb;
      return {
        aliquot: al, cellV: V0, titrant: '0.1000 M NaOH (standard)', flask: '25.0 mL acid mixture in 100 mL of water', titrantColour: null, veq: [v1, v2], vmax: 45,
        state: (Vt) => { const r = L.acidBase(fl, tt, Vt); return { kappa: r.kappa, pH: r.pH, colour: null }; },
        curve: (V) => L.acidBase(fl, tt, V).kappa, yLabel: 'conductivity / mS cm⁻¹',
        report: [{ id: 'c1', label: 'HCl in the mixture', unit: 'M', truth: c1, dp: 4 }, { id: 'c2', label: 'CH₃COOH in the mixture', unit: 'M', truth: c2, dp: 4 }],
        solve: (m) => { const a = (Cb * m.v1) / al, b = (Cb * (m.v2 - m.v1)) / al; return { values: { c1: a, c2: b }, lines: [`Strong acid: V₁ = ${m.v1.toFixed(2)} mL → HCl = 0.1000 × ${m.v1.toFixed(2)} / ${al} = ${a.toFixed(4)} M`, `Weak acid: V₂ − V₁ = ${(m.v2 - m.v1).toFixed(2)} mL → CH₃COOH = ${b.toFixed(4)} M`] }; },
      };
    },
  });
  def({
    id: 'conduct-weak', level: 'bsc', mode: 'conductometric', title: 'Conductometric: CH₃COOH vs NaOH', short: 'Weak acid, strong base', unis: ['WBSU', 'BU'],
    steps: ['Pipette 25.0 mL of acetic acid solution (unknown) into the cell and add water to 100 mL.', 'Add 0.1000 M NaOH in steps; readings are recorded automatically.', 'The conductivity rises slowly (acetate ions form), then steeply once excess NaOH is present.', 'Analyse: the two lines meet at the end point.'],
    make(rnd) {
      const c = rnd4(L.between(rnd, 0.04, 0.1, 0.0025)), V0 = 100, Cb = 0.1, al = 25, f = al / V0;
      const fl = { V0, fams: [{ C: c * f, ...L.FAM.acetic }] }, tt = { kind: 'base', C: Cb };
      return {
        aliquot: al, cellV: V0, titrant: '0.1000 M NaOH (standard)', flask: '25.0 mL acetic acid in 100 mL of water', titrantColour: null, veq: (c * al) / Cb, vmax: 40,
        state: (Vt) => { const r = L.acidBase(fl, tt, Vt); return { kappa: r.kappa, pH: r.pH, colour: null }; },
        curve: (V) => L.acidBase(fl, tt, V).kappa, yLabel: 'conductivity / mS cm⁻¹',
        report: [{ id: 'c', label: 'Concentration of CH₃COOH', unit: 'M', truth: c, dp: 4 }],
        solve: (m) => { const x = (Cb * m.v) / al; return { values: { c: x }, lines: [`End point V = ${m.v.toFixed(2)} mL`, `M(CH₃COOH) = 0.1000 × ${m.v.toFixed(2)} / ${al} = ${x.toFixed(4)} M`] }; },
      };
    },
  });

  // ---------------------------------------------------------------- potentiometric
  def({
    id: 'potent-mohr', level: 'bsc', mode: 'potentiometric', title: 'Potentiometric: Mohr’s salt vs K₂Cr₂O₇', short: 'End point and E° of Fe³⁺/Fe²⁺', unis: ['CU', 'WBSU', 'BU'],
    steps: ['Pipette 25.0 mL of Fe²⁺ solution (unknown) into the beaker with dilute H₂SO₄. Dip in the platinum electrode and a calomel reference (SCE, E = +0.244 V).', 'Add 0.01667 M K₂Cr₂O₇ in steps; the cell potential is recorded each time. Use smaller steps near the end point.', 'Plot E against V and ΔE/ΔV against V. The end point is where ΔE/ΔV is greatest.', 'At half the end-point volume the Fe²⁺ : Fe³⁺ ratio is 1 : 1, so E(SHE) = E(measured) + 0.244 V is E° of the Fe³⁺/Fe²⁺ couple.'],
    make(rnd) {
      const C0 = rnd4(L.between(rnd, 0.04, 0.09, 0.0025)), V0 = 25, Cd = 0.016667, veq = (C0 * V0) / (6 * Cd);
      return {
        aliquot: V0, titrant: '0.01667 M K₂Cr₂O₇ (standard)', flask: '25.0 mL Fe²⁺ (unknown) + H₂SO₄', titrantColour: '#f28c28', veq, vmax: 40, noiseV: 0.001,
        state: (Vt) => ({ E: L.potMohr(Vt, V0, C0, Cd).E, colour: mixc('#cfe6f5', '#b9dbb0', Math.max(0, 1 - Vt / veq) * 0.6) }),
        curve: (V) => L.potMohr(V, V0, C0, Cd).E, yLabel: 'E vs SCE / V',
        report: [{ id: 'e0', label: 'E° of Fe³⁺/Fe²⁺ (vs SHE)', unit: 'V', truth: 0.771, dp: 3, tol: 0.02, abs: true }, { id: 'c', label: 'Concentration of Fe²⁺', unit: 'M', truth: C0, dp: 4 }],
        solve: (m) => { const e0 = m.eHalf + 0.244, x = (6 * Cd * m.veq) / V0; return { values: { e0, c: x }, lines: [`End point V = ${m.veq.toFixed(2)} mL (maximum ΔE/ΔV)`, `E(SCE) at V/2 = ${m.eHalf.toFixed(3)} V → E° = ${m.eHalf.toFixed(3)} + 0.244 = ${e0.toFixed(3)} V (SHE)`, `M(Fe²⁺) = 6 × 0.016667 × ${m.veq.toFixed(2)} / ${V0} = ${x.toFixed(4)} M`] }; },
      };
    },
  });
  def({
    id: 'potent-agcl', level: 'bsc', mode: 'potentiometric', title: 'Potentiometric: AgNO₃ vs KCl', short: 'Concentration of Ag⁺ and K_sp of AgCl', unis: ['CU', 'WBSU'],
    steps: ['Pipette 25.0 mL of AgNO₃ solution (unknown) into the beaker. Dip in a silver electrode and a calomel reference (SCE, +0.244 V).', 'Add 0.05000 M KCl in steps; the cell potential is recorded each time. Use small steps near the end point.', 'The end point is where ΔE/ΔV is greatest. At the end point [Ag⁺] = [Cl⁻] = √K_sp.', 'E(Ag) = E° + 0.0592 log [Ag⁺], with E°(Ag⁺/Ag) = +0.799 V (SHE).'],
    make(rnd) {
      const C0 = rnd4(L.between(rnd, 0.02, 0.06, 0.0025)), V0 = 25, Ck = 0.05, veq = (C0 * V0) / Ck;
      return {
        aliquot: V0, titrant: '0.05000 M KCl (standard)', flask: '25.0 mL AgNO₃ (unknown)', titrantColour: null, veq, vmax: 45, noiseV: 0.001,
        state: (Vt) => ({ E: L.potAgCl(Vt, V0, C0, Ck).E, colour: Vt >= veq * 0.02 ? mixc('#cfe6f5', '#f5f5f5', clamp(Vt / veq, 0, 1) * 0.55) : null }),
        curve: (V) => L.potAgCl(V, V0, C0, Ck).E, yLabel: 'E vs SCE / V',
        report: [{ id: 'c', label: 'Concentration of AgNO₃', unit: 'M', truth: C0, dp: 4 }, { id: 'ksp', label: 'K_sp of AgCl (× 10⁻¹⁰)', unit: '', truth: 1.8, dp: 2, tol: 0.35 }],
        solve: (m) => { const x = (Ck * m.veq) / V0, ag = Math.pow(10, (m.eEq + 0.244 - 0.799) / 0.0592), ksp = ag * ag; return { values: { c: x, ksp: ksp / 1e-10 }, lines: [`End point V = ${m.veq.toFixed(2)} mL`, `M(AgNO₃) = 0.05000 × ${m.veq.toFixed(2)} / ${V0} = ${x.toFixed(4)} M`, `E at the end point = ${m.eEq.toFixed(3)} V (SCE) → E(SHE) = ${(m.eEq + 0.244).toFixed(3)} V`, `[Ag⁺] = 10^((${(m.eEq + 0.244).toFixed(3)} − 0.799)/0.0592) = ${ag.toExponential(2)} M`, `K_sp = [Ag⁺]² = ${ksp.toExponential(2)}`] }; },
      };
    },
  });

  T.forLevel = (lv) => T.EXPS.filter((e) => ({ '11': 1, '12': 2, bsc: 3 }[lv] >= ({ '11': 1, '12': 2, bsc: 3 }[e.level])));

  // ---------------------------------------------------------------- analysis helpers shared with the page
  // piecewise-linear fit with n breaks (n+1 segments); returns break positions as line intersections
  T.fitBreaks = function (xs, ys, nBreaks) {
    const n = xs.length, minSeg = 3;
    if (n < (nBreaks + 1) * minSeg) return null;
    const sse = (a, b) => { const f = L.linreg(xs.slice(a, b), ys.slice(a, b)); if (!f) return { e: 1e18, f: null }; let e = 0; for (let i = a; i < b; i++) e += (ys[i] - (f.m * xs[i] + f.b)) ** 2; return { e, f }; };
    let best = null;
    const rec = (start, left, cuts) => {
      if (left === 0) {
        const segs = [], bounds = [0].concat(cuts, [n]);
        let tot = 0;
        for (let k = 0; k < bounds.length - 1; k++) { const s = sse(bounds[k], bounds[k + 1]); tot += s.e; segs.push(s.f); }
        if (!best || tot < best.tot) best = { tot, segs, cuts: cuts.slice() };
        return;
      }
      for (let c = start + minSeg; c <= n - minSeg * left; c++) { cuts.push(c); rec(c, left - 1, cuts); cuts.pop(); }
    };
    rec(0, nBreaks, []);
    if (!best || best.segs.some((s) => !s)) return null;
    const out = [];
    for (let k = 0; k < best.segs.length - 1; k++) { const a = best.segs[k], b = best.segs[k + 1]; out.push((b.b - a.b) / (a.m - b.m)); }
    return { breaks: out, segs: best.segs, cuts: best.cuts };
  };
})();
