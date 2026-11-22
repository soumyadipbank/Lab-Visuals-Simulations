/* Lab Visuals: titration experiment definitions (no DOM; tested in tests/titrations.test.js).
   Each experiment's make(rnd) builds a fresh session with a hidden unknown, a state(V) function that gives
   the flask colour / pH / conductivity / potential at any added volume, and a solve() that does the student's calculation. */
(function () {
  'use strict';
  const C = globalThis.Chem, L = C.Lab;
  const WATER = '#cfe6f5';
  const mixc = (a, b, t) => C.absMix(a, b, t);           // concentration-weighted (Beer-Lambert) colour change
  const dye = (col, s) => C.absAdd(WATER, col, Math.max(0, s));
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const rnd4 = (x) => Number(x.toFixed(4));
  const T = (C.Titr = { EXPS: [], byId: {} });
  const def = (d) => { T.EXPS.push(d); T.byId[d.id] = d; };
  // colour of excess permanganate: one drop (about 1.5e-5 M in the flask) is a faint but clear pink
  const pink = (excessM) => { const s = Math.min(1.2, Math.pow(Math.max(0, excessM) / 4e-4, 0.6)); return s > 0.05 ? dye('#9b1fa8', s) : null; };

  const ABSTEPS = (extra, second) => ['Rinse the burette with the titrant and fill it. Note the initial reading.', second || 'Pipette the aliquot into a conical flask and add the indicator.'].concat(extra);
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
    id: 'naoh-oxalic', level: '11', mode: 'indicator', title: 'Standardise NaOH with oxalic acid', short: 'Primary standard against an unknown base', unis: [], indicators: ['phph'],
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
    id: 'vinegar', level: '11', mode: 'indicator', title: 'Acetic acid in vinegar', short: 'Weak acid vs strong base', unis: [], indicators: ['phph'],
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
  twoEnd('carb-bicarb', 'Na₂CO₃ and NaHCO₃ in a mixture', 'Two indicators, two end points', [], function (rnd) {
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
  twoEnd('naoh-carb', 'NaOH and Na₂CO₃ in a mixture', 'Two end points with HCl', [], function (rnd) {
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
    steps: ABSTEPS([kind === 'oxalic' ? 'Add dilute H₂SO₄ to the oxalic acid and heat to 60–70 °C (use the Heat switch). In the cold the reaction is so slow that the pink lingers and gives a false, early end point.' : 'Add dilute H₂SO₄ to the flask. No external indicator is needed: KMnO₄ is its own indicator.', 'Add KMnO₄ slowly. Each drop is decolourised, at first slowly. The end point is the first faint pink that lasts about 30 seconds.', REPEAT], 'Pipette the aliquot into a conical flask. No indicator is needed: KMnO₄ is its own indicator.'),
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
            const tint = kind === 'mohr' ? mixc(dye('#b9dbb0', 0.35), dye('#e6c66c', 0.4), x) : null;   // pale green Fe2+ turns pale yellow Fe3+
            // cold oxalic acid reacts very slowly: the pink lingers long before the true end point (a false end point)
            if (kind === 'oxalic' && !(ctx && ctx.heated) && Vt > 0.3) return { colour: pink((cm * Math.min(Vt, 1.5) * 0.6) / (V0 + Vt + 20)), flash: { c: '#d84bc4', slow: true } };
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
  mn('kmno4-oxalic', '12', 'Standardise KMnO₄ with oxalic acid', 'Self-indicating redox titration', [], '', 'oxalic');
  mn('mohr-kmno4', '12', 'Fe(II) in Mohr’s salt with KMnO₄', 'Estimate Fe²⁺ with a standard oxidant', [], '', 'mohr');
  mn('h2o2-kmno4', 'bsc', 'Strength of a H₂O₂ sample', 'Hydrogen peroxide with KMnO₄', [], '', 'h2o2');

  def({
    id: 'fe-dichromate', level: 'bsc', mode: 'indicator', title: 'Fe(II) with K₂Cr₂O₇', short: 'Internal indicator: diphenylamine', unis: [], indicators: [],
    steps: ABSTEPS(['The flask holds 25.0 mL of Fe²⁺ solution (unknown) with dilute H₂SO₄, H₃PO₄ and diphenylamine indicator.', 'Add K₂Cr₂O₇ until the green turns to a sharp blue-violet.', REPEAT], 'Pipette the aliquot into a conical flask.'),
    make(rnd) {
      const C0 = rnd4(L.between(rnd, 0.04, 0.09, 0.0025)), V0 = 25, Cd = 0.016667, veq = (C0 * V0) / (6 * Cd);
      return {
        aliquot: V0, titrant: '0.01667 M K₂Cr₂O₇ (standard, 0.1 N)', flask: '25.0 mL Fe²⁺ (unknown) + acids + diphenylamine', titrantColour: '#f28c28', veq, vmax: 40,
        state: (Vt) => {
          const x = Vt / veq;
          if (x < 1) return { colour: dye('#5f9a5f', 0.12 + 0.55 * x), flash: null };          // green Cr3+ builds up
          const t = clamp((Vt - veq) / 0.15, 0, 1);
          return { colour: C.absAdd(dye('#5f9a5f', 0.67), '#4b2c9a', 0.35 + 0.65 * t), flash: null };   // oxidised diphenylamine: violet-blue
        },
        curve: null, yLabel: '',
        report: [{ id: 'c', label: 'Concentration of Fe²⁺', unit: 'M', truth: C0, dp: 4 }],
        solve: (m) => { const x = (6 * Cd * m.t) / V0; return { values: { c: x }, lines: ['Cr₂O₇²⁻ + 6Fe²⁺ + 14H⁺ → 2Cr³⁺ + 6Fe³⁺ + 7H₂O (1 : 6)', 'M(Fe²⁺) = 6 × M(K₂Cr₂O₇) × V(K₂Cr₂O₇) / V(Fe²⁺)', `= 6 × 0.016667 × ${m.t.toFixed(2)} / ${V0}`, `= ${x.toFixed(4)} M`] }; },
      };
    },
  });

  def({
    id: 'iodo-cu', level: 'bsc', mode: 'indicator', title: 'Iodometric estimation of Cu(II)', short: 'Na₂S₂O₃ against liberated iodine, starch', unis: [], indicators: [], needsStarch: true,
    steps: ABSTEPS(['The flask holds 25.0 mL of Cu²⁺ solution (unknown) treated with excess KI: brown iodine forms and white CuI precipitates (2Cu²⁺ + 4I⁻ → 2CuI + I₂).', 'Titrate with 0.1000 M Na₂S₂O₃ until the brown fades to pale yellow.', 'Add starch (blue-black) and continue drop by drop until the blue just disappears. Near the end add about 1 g KSCN: it converts CuI to CuSCN and releases iodine adsorbed on the precipitate, giving a sharper end point.', REPEAT], 'Pipette the aliquot into a conical flask. Do not add starch yet: it is added near the end point.'),
    make(rnd) {
      const C0 = rnd4(L.between(rnd, 0.04, 0.09, 0.0025)), V0 = 25, Ct = 0.1, veq = (C0 * V0) / Ct;
      return {
        aliquot: V0, titrant: '0.1000 M Na₂S₂O₃ (standard)', flask: '25.0 mL Cu²⁺ (unknown) + excess KI', titrantColour: null, veq, vmax: 40,
        state: (Vt, ctx) => {
          const f = Math.max(0, 1 - Vt / veq);
          // white CuI suspension; brown I3- fades to straw yellow; starch-iodine is blue-black until the last trace of I2 is gone
          if (ctx && ctx.starch) return { colour: f > 0.002 ? C.absAdd('#efe6cf', '#0f1238', Math.min(1.3, f * 9), '#efe6cf') : '#efe6cf', flash: null };
          return { colour: C.absAdd('#efe6cf', '#7a3d12', Math.min(1.1, f * 1.1), '#efe6cf'), flash: null };
        },
        curve: null, yLabel: '',
        report: [{ id: 'c', label: 'Concentration of Cu²⁺', unit: 'M', truth: C0, dp: 4 }, { id: 'g', label: 'Copper (63.55 g/mol)', unit: 'g/L', truth: C0 * 63.55, dp: 3 }],
        solve: (m) => { const x = (Ct * m.t) / V0; return { values: { c: x, g: x * 63.55 }, lines: ['2Cu²⁺ + 4I⁻ → 2CuI + I₂;  I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻', 'Net: 1 Cu²⁺ ≡ 1 S₂O₃²⁻', `M(Cu²⁺) = 0.1000 × ${m.t.toFixed(2)} / ${V0} = ${x.toFixed(4)} M`, `Copper = ${x.toFixed(4)} × 63.55 = ${(x * 63.55).toFixed(3)} g/L`] }; },
      };
    },
  });

  def({
    id: 'edta-hardness', level: 'bsc', mode: 'indicator', title: 'Total hardness of water (EDTA)', short: 'Eriochrome Black T, pH 10 buffer', unis: [], indicators: [],
    steps: ABSTEPS(['The flask holds 50.0 mL of the water sample with NH₃/NH₄Cl buffer (pH 10) and a few drops of Eriochrome Black T: wine red (Ca²⁺/Mg²⁺–EBT complex).', 'Titrate with 0.01000 M EDTA until the colour changes sharply from wine red through purple to pure blue.', REPEAT], 'Pipette the aliquot into a conical flask.'),
    make(rnd) {
      const H = Math.round(L.between(rnd, 80, 400, 5)), V0 = 50, Ce = 0.01;
      const vEq = ((H / 100.09) * (V0 / 1000)) / Ce;   // mL: (mmol/L × L) / (mmol/mL)
      return {
        aliquot: V0, titrant: '0.01000 M EDTA (standard)', flask: '50.0 mL water sample + buffer + EBT', titrantColour: null, veq: vEq, vmax: 40,
        // fraction of the indicator still bound to Ca2+/Mg2+ falls sharply in the last few percent: wine red -> purple -> blue
        state: (Vt) => { const f = Math.max(0, 1 - Vt / vEq), t = clamp(f / 0.04, 0, 1); return { colour: mixc('#3f78d8', '#9b1f4a', Math.pow(t, 0.5)), flash: null }; },
        curve: null, yLabel: '',
        report: [{ id: 'h', label: 'Total hardness', unit: 'mg/L as CaCO₃', truth: H, dp: 0 }],
        solve: (m) => { const x = (m.t * Ce * 100.09 * 1000) / V0; return { values: { h: x }, lines: ['EDTA binds Ca²⁺ and Mg²⁺ 1 : 1', 'mmol EDTA = mmol (Ca²⁺ + Mg²⁺) in 50.0 mL', `Hardness = ${m.t.toFixed(2)} × 0.01000 × 100.09 × 1000 / 50.0`, `= ${x.toFixed(0)} mg/L as CaCO₃`] }; },
      };
    },
  });

  // ---------------------------------------------------------------- conductometric
  def({
    id: 'conduct-mix', level: 'bsc', mode: 'conductometric', title: 'Conductometric: HCl + CH₃COOH vs NaOH', short: 'Strong + weak acid mixture, two breaks', unis: [],
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
    id: 'conduct-weak', level: 'bsc', mode: 'conductometric', title: 'Conductometric: CH₃COOH vs NaOH', short: 'Weak acid, strong base', unis: [],
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
    id: 'potent-mohr', level: 'bsc', mode: 'potentiometric', title: 'Potentiometric: Mohr’s salt vs K₂Cr₂O₇', short: 'End point and E° of Fe³⁺/Fe²⁺', unis: [],
    steps: ['Pipette 25.0 mL of Fe²⁺ solution (unknown) into the beaker with dilute H₂SO₄. Dip in the platinum electrode and a calomel reference (SCE, E = +0.244 V).', 'Add 0.01667 M K₂Cr₂O₇ in steps; the cell potential is recorded each time. Use smaller steps near the end point.', 'Plot E against V and ΔE/ΔV against V. The end point is where ΔE/ΔV is greatest.', 'At half the end-point volume the Fe²⁺ : Fe³⁺ ratio is 1 : 1, so E(SHE) = E(measured) + 0.244 V is the formal potential E°′ of the Fe³⁺/Fe²⁺ couple in this medium (about 0.68 V in 1 M H₂SO₄; the standard potential E° = 0.771 V applies only at unit activities, without sulfate complexing).'],
    make(rnd) {
      const C0 = rnd4(L.between(rnd, 0.04, 0.09, 0.0025)), V0 = 25, Cd = 0.016667, veq = (C0 * V0) / (6 * Cd);
      return {
        aliquot: V0, titrant: '0.01667 M K₂Cr₂O₇ (standard)', flask: '25.0 mL Fe²⁺ (unknown) + H₂SO₄', titrantColour: '#f28c28', veq, vmax: 40, noiseV: 0.001,
        state: (Vt) => ({ E: L.potMohr(Vt, V0, C0, Cd).E, colour: Vt < veq ? dye('#5f9a5f', 0.08 + 0.5 * (Vt / veq)) : C.absAdd(dye('#5f9a5f', 0.58), '#f28c28', Math.min(0.8, (Vt - veq) * 0.25)) }),   /* green Cr³⁺ builds up; excess dichromate adds orange */
        curve: (V) => L.potMohr(V, V0, C0, Cd).E, yLabel: 'E vs SCE / V',
        report: [{ id: 'e0', label: 'Formal potential E°′ of Fe³⁺/Fe²⁺ in this medium (vs SHE)', unit: 'V', truth: L.FE_FORMAL, dp: 3, tol: 0.02, abs: true }, { id: 'c', label: 'Concentration of Fe²⁺', unit: 'M', truth: C0, dp: 4 }],
        solve: (m) => { const e0 = m.eHalf + 0.244, x = (6 * Cd * m.veq) / V0; return { values: { e0, c: x }, lines: [`End point V = ${m.veq.toFixed(2)} mL (maximum ΔE/ΔV)`, `E(SCE) at V/2 = ${m.eHalf.toFixed(3)} V → E°′ = ${m.eHalf.toFixed(3)} + 0.244 = ${e0.toFixed(3)} V (SHE)`, `M(Fe²⁺) = 6 × 0.016667 × ${m.veq.toFixed(2)} / ${V0} = ${x.toFixed(4)} M`] }; },
      };
    },
  });
  def({
    id: 'potent-agcl', level: 'bsc', mode: 'potentiometric', title: 'Potentiometric: AgNO₃ vs KCl', short: 'Concentration of Ag⁺ and K_sp of AgCl', unis: [],
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


  // ================================================================ more volumetric practicals (multi-part experiments)
  // shared colour models
  const permState = (Vt, veq, cm, V0, ctx, needHeat, tint) => {        // KMnO4 titrant: decolourised until the end point, then pink
    if (Vt < veq && needHeat && !(ctx && ctx.heated) && Vt > 0.3) return { colour: pink((cm * Math.min(Vt, 1.5) * 0.6) / (V0 + Vt + 20)), flash: { c: '#d84bc4', slow: true } };   /* cold: false end point */
    if (Vt < veq) return { colour: tint ? tint(Vt / veq) : null, flash: Vt > 0 ? { c: '#d84bc4', slow: needHeat && !(ctx && ctx.heated) && Vt < 2 } : null };
    return { colour: pink((cm * (Vt - veq)) / (V0 + Vt + 20)), flash: null };
  };
  const dichrState = (Vt, veq) => {                                     // K2Cr2O7 with diphenylamine
    const x = Vt / veq;
    if (x < 1) return { colour: dye('#5f9a5f', 0.12 + 0.55 * x), flash: null };
    return { colour: C.absAdd(dye('#5f9a5f', 0.67), '#4b2c9a', 0.35 + 0.65 * clamp((Vt - veq) / 0.15, 0, 1)), flash: null };
  };
  const iodState = (f, ctx, base) => {                                  // iodine being removed by thiosulfate (f = fraction of I2 left)
    base = base || WATER; f = Math.max(0, f);
    if (ctx && ctx.starch) return { colour: f > 0.002 ? C.absAdd(base, '#0f1238', Math.min(1.3, f * 9), base) : base, flash: null };
    return { colour: C.absAdd(base, '#7a3d12', Math.min(1.1, f * 1.1), base), flash: null };
  };
  const STARCH_STEPS = ['Titrate with thiosulfate until the brown iodine fades to pale straw yellow.', 'Then add starch (blue-black) and continue drop by drop until the blue just disappears.'];

  def({
    id: 'oxalate-mix', level: 'bsc', mode: 'indicator', title: 'Oxalic acid and sodium oxalate in a mixture', short: 'Two titrations: NaOH, then KMnO₄', indicators: [],
    steps: ['Part A: pipette 20.0 mL of the mixture, add phenolphthalein and titrate with 0.1000 M NaOH. Only the oxalic acid (2 H⁺ per molecule) reacts.', 'Part B: pipette another 20.0 mL, add dilute H₂SO₄, heat to 60–70 °C and titrate with 0.0200 M KMnO₄. This oxidises all the oxalate, from both the acid and the salt.', 'Switch between the parts with the Part buttons. ' + REPEAT],
    make(rnd) {
      const c1 = rnd4(L.between(rnd, 0.02, 0.04, 0.001)), c2 = rnd4(L.between(rnd, 0.015, 0.035, 0.001)), V0 = 20, Cb = 0.1, Cm = 0.02;
      const fl = { V0, Na0: 2 * c2, fams: [{ C: c1 + c2, ...L.FAM.oxalic }] }, tt = { kind: 'base', C: Cb };
      const vA = (2 * c1 * V0) / Cb, vB = ((2 / 5) * (c1 + c2) * V0) / Cm;
      return {
        parts: [
          { label: 'A: NaOH (acid only)', titrant: '0.1000 M NaOH (standard)', flask: '20.0 mL mixture + phenolphthalein', titrantColour: null, veq: vA, vmax: 45, state: (Vt) => { const r = L.acidBase(fl, tt, Vt); return { pH: r.pH, colour: C.indColor('phph', r.pH) }; } },
          { label: 'B: KMnO₄ (all oxalate)', titrant: '0.0200 M KMnO₄ (standard)', flask: '20.0 mL mixture + dil. H₂SO₄', titrantColour: '#a21caf', veq: vB, vmax: 45, needsHeat: true, state: (Vt, ctx) => permState(Vt, vB, Cm, V0, ctx, true) },
        ],
        report: [{ id: 'c1', label: 'H₂C₂O₄ (oxalic acid)', unit: 'M', truth: c1, dp: 4, tol: 0.03 }, { id: 'c2', label: 'Na₂C₂O₄ (sodium oxalate)', unit: 'M', truth: c2, dp: 4, tol: 0.05 }],
        solve: (m) => { const [a, b] = m.t, x = (Cb * a) / (2 * V0), tot = (5 * Cm * b) / (2 * V0); return { values: { c1: x, c2: tot - x }, lines: ['Part A: H₂C₂O₄ + 2NaOH → Na₂C₂O₄ + 2H₂O', `[H₂C₂O₄] = 0.1000 × ${a.toFixed(2)} / (2 × 20.0) = ${x.toFixed(4)} M`, 'Part B: 2MnO₄⁻ + 5C₂O₄²⁻ + 16H⁺ → 2Mn²⁺ + 10CO₂ + 8H₂O', `total oxalate = 5 × 0.0200 × ${b.toFixed(2)} / (2 × 20.0) = ${tot.toFixed(4)} M`, `[Na₂C₂O₄] = total − acid = ${tot.toFixed(4)} − ${x.toFixed(4)} = ${(tot - x).toFixed(4)} M`] }; },
      };
    },
  });

  def({
    id: 'fe-mix', level: 'bsc', mode: 'indicator', title: 'Fe(II) and Fe(III) in a mixture (K₂Cr₂O₇)', short: 'Direct titration, then after SnCl₂ reduction', indicators: [],
    steps: ['Part A: 25.0 mL of the mixture with dilute H₂SO₄, H₃PO₄ and diphenylamine. K₂Cr₂O₇ oxidises only the Fe²⁺ already present.', 'Part B: another 25.0 mL is heated with conc. HCl and SnCl₂ added dropwise until the yellow colour of Fe³⁺ just disappears (all iron now Fe²⁺). The slight excess of Sn²⁺ is destroyed with HgCl₂ (silky white Hg₂Cl₂). Then titrate as in Part A: this gives the total iron.', 'Fe³⁺ = total − Fe²⁺. ' + REPEAT],
    make(rnd) {
      const c2 = rnd4(L.between(rnd, 0.03, 0.06, 0.001)), c3 = rnd4(L.between(rnd, 0.02, 0.05, 0.001)), V0 = 25, Cd = 0.016667;
      const vA = (c2 * V0) / (6 * Cd), vB = ((c2 + c3) * V0) / (6 * Cd);
      return {
        parts: [
          { label: 'A: direct (Fe²⁺ only)', titrant: '0.01667 M K₂Cr₂O₇ (0.1 N)', flask: '25.0 mL mixture + acids + diphenylamine', titrantColour: '#f28c28', veq: vA, vmax: 45, state: (Vt) => dichrState(Vt, vA) },
          { label: 'B: after SnCl₂ (total Fe)', titrant: '0.01667 M K₂Cr₂O₇ (0.1 N)', flask: '25.0 mL mixture reduced with SnCl₂ + HgCl₂ + diphenylamine', titrantColour: '#f28c28', veq: vB, vmax: 45, state: (Vt) => { const r = dichrState(Vt, vB); if (Vt < vB) r.colour = C.absAdd(r.colour, '#f2f2f2', 0.25); return r; } },
        ],
        report: [{ id: 'c2', label: 'Fe²⁺', unit: 'M', truth: c2, dp: 4, tol: 0.03 }, { id: 'c3', label: 'Fe³⁺', unit: 'M', truth: c3, dp: 4, tol: 0.05 }],
        solve: (m) => { const [a, b] = m.t, f2 = (6 * Cd * a) / V0, tot = (6 * Cd * b) / V0; return { values: { c2: f2, c3: tot - f2 }, lines: ['Cr₂O₇²⁻ + 6Fe²⁺ + 14H⁺ → 2Cr³⁺ + 6Fe³⁺ + 7H₂O (1 : 6)', `Fe²⁺ = 6 × 0.016667 × ${a.toFixed(2)} / 25.0 = ${f2.toFixed(4)} M`, `total Fe (after 2Fe³⁺ + Sn²⁺ → 2Fe²⁺ + Sn⁴⁺) = 6 × 0.016667 × ${b.toFixed(2)} / 25.0 = ${tot.toFixed(4)} M`, `Fe³⁺ = ${tot.toFixed(4)} − ${f2.toFixed(4)} = ${(tot - f2).toFixed(4)} M`] }; },
      };
    },
  });

  def({
    id: 'edta-camg', level: 'bsc', mode: 'indicator', title: 'Ca²⁺ and Mg²⁺ in a mixture (EDTA)', short: 'Total at pH 10, then Ca alone at pH 12', indicators: [],
    steps: ['Part A: 25.0 mL of the mixture, NH₃/NH₄Cl buffer (pH 10) and Eriochrome Black T (wine red). EDTA takes Ca²⁺ and Mg²⁺: end point pure blue.', 'Part B: another 25.0 mL made strongly alkaline (pH 12–13) with NaOH. Mg²⁺ precipitates as Mg(OH)₂ and is not titrated. With murexide indicator (pink with Ca²⁺) EDTA titrates Ca²⁺ only: end point violet.', 'Mg²⁺ = total − Ca²⁺. ' + REPEAT],
    make(rnd) {
      const ca = rnd4(L.between(rnd, 0.004, 0.008, 0.0002)), mg = rnd4(L.between(rnd, 0.002, 0.005, 0.0002)), V0 = 25, Ce = 0.01;
      const vA = ((ca + mg) * V0) / Ce, vB = (ca * V0) / Ce;
      return {
        parts: [
          { label: 'A: pH 10, EBT (Ca + Mg)', titrant: '0.01000 M EDTA (standard)', flask: '25.0 mL mixture + pH 10 buffer + EBT', titrantColour: null, veq: vA, vmax: 45, state: (Vt) => { const f = Math.max(0, 1 - Vt / vA), t = clamp(f / 0.04, 0, 1); return { colour: mixc('#3f78d8', '#9b1f4a', Math.pow(t, 0.5)) }; } },
          { label: 'B: pH 12, murexide (Ca only)', titrant: '0.01000 M EDTA (standard)', flask: '25.0 mL mixture + NaOH (Mg(OH)₂ precipitated) + murexide', titrantColour: null, veq: vB, vmax: 45, state: (Vt) => { const f = Math.max(0, 1 - Vt / vB), t = clamp(f / 0.05, 0, 1); return { colour: C.absAdd(mixc('#7b3fb0', '#e0457a', Math.pow(t, 0.5)), '#eeeeee', 0.25) }; } },
        ],
        report: [{ id: 'ca', label: 'Ca²⁺', unit: 'M', truth: ca, dp: 5, tol: 0.03 }, { id: 'mg', label: 'Mg²⁺', unit: 'M', truth: mg, dp: 5, tol: 0.06 }],
        solve: (m) => { const [a, b] = m.t, tot = (Ce * a) / V0, c = (Ce * b) / V0; return { values: { ca: c, mg: tot - c }, lines: ['M²⁺ + H₂Y²⁻ → MY²⁻ + 2H⁺ (1 : 1 for every metal ion)', `Ca²⁺ + Mg²⁺ = 0.01000 × ${a.toFixed(2)} / 25.0 = ${tot.toFixed(5)} M`, `Ca²⁺ = 0.01000 × ${b.toFixed(2)} / 25.0 = ${c.toFixed(5)} M`, `Mg²⁺ = ${tot.toFixed(5)} − ${c.toFixed(5)} = ${(tot - c).toFixed(5)} M`] }; },
      };
    },
  });

  def({
    id: 'fe-cu-mix', level: 'bsc', mode: 'indicator', title: 'Binary mixture: Fe(III) and Cu(II)', short: 'Cu iodometrically, Fe with K₂Cr₂O₇', indicators: [],
    steps: ['Part A (copper): 25.0 mL of the mixture, NH₄HF₂ added to mask Fe³⁺ as colourless [FeF₆]³⁻ (otherwise Fe³⁺ would also oxidise iodide), then excess KI. Titrate the iodine set free by Cu²⁺ with 0.1000 M Na₂S₂O₃, starch near the end.', 'Part B (iron): 25.0 mL treated with excess NH₃: Fe(OH)₃ precipitates while copper stays in solution as deep-blue [Cu(NH₃)₄]²⁺. The washed precipitate is dissolved in HCl, reduced with SnCl₂ (excess removed with HgCl₂) and titrated with 0.01667 M K₂Cr₂O₇ (diphenylamine).', REPEAT],
    make(rnd) {
      const cu = rnd4(L.between(rnd, 0.03, 0.06, 0.001)), fe = rnd4(L.between(rnd, 0.03, 0.06, 0.001)), V0 = 25, Ct = 0.1, Cd = 0.016667;
      const vA = (cu * V0) / Ct, vB = (fe * V0) / (6 * Cd), cream = '#efe6cf';
      return {
        parts: [
          { label: 'A: copper (iodometric)', titrant: '0.1000 M Na₂S₂O₃ (standard)', flask: '25.0 mL mixture + NH₄HF₂ + excess KI', titrantColour: null, veq: vA, vmax: 45, needsStarch: true, state: (Vt, ctx) => iodState(1 - Vt / vA, ctx, cream) },
          { label: 'B: iron (dichromate)', titrant: '0.01667 M K₂Cr₂O₇ (0.1 N)', flask: 'Fe(OH)₃ from 25.0 mL, dissolved, reduced with SnCl₂', titrantColour: '#f28c28', veq: vB, vmax: 45, state: (Vt) => dichrState(Vt, vB) },
        ],
        report: [{ id: 'cu', label: 'Copper', unit: 'g/L', truth: cu * 63.55, dp: 3, tol: 0.03 }, { id: 'fe', label: 'Iron', unit: 'g/L', truth: fe * 55.85, dp: 3, tol: 0.03 }],
        solve: (m) => { const [a, b] = m.t, xc = (Ct * a) / V0, xf = (6 * Cd * b) / V0; return { values: { cu: xc * 63.55, fe: xf * 55.85 }, lines: ['2Cu²⁺ + 4I⁻ → 2CuI + I₂; I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻ (1 Cu ≡ 1 S₂O₃²⁻)', `Cu²⁺ = 0.1000 × ${a.toFixed(2)} / 25.0 = ${xc.toFixed(4)} M → ${(xc * 63.55).toFixed(3)} g/L`, 'Cr₂O₇²⁻ + 6Fe²⁺ + 14H⁺ → 2Cr³⁺ + 6Fe³⁺ + 7H₂O (1 : 6)', `Fe = 6 × 0.016667 × ${b.toFixed(2)} / 25.0 = ${xf.toFixed(4)} M → ${(xf * 55.85).toFixed(3)} g/L`] }; },
      };
    },
  });

  def({
    id: 'brass', level: 'bsc', mode: 'indicator', title: 'Copper in brass (iodometric)', short: 'Industrial material: % Cu in an alloy', indicators: [], needsStarch: true,
    steps: [],   // filled in make() because the sample mass is random
    make(rnd) {
      const W = Number(L.between(rnd, 0.48, 0.52, 0.0001).toFixed(4)), pc = Number(L.between(rnd, 58, 72, 0.1).toFixed(1)), Ct = 0.05;
      const nAli = (W * pc / 100 / 63.55) / 4, vA = (nAli * 1000) / Ct;
      this.steps = [`${W.toFixed(4)} g of brass turnings were dissolved in 1 : 1 HNO₃, boiled to expel nitrogen oxides, neutralised with Na₂CO₃ until a faint precipitate, cleared with acetic acid and made up to 100.0 mL.`, 'Pipette 25.0 mL, add excess KI (zinc does not react). Titrate the liberated iodine with 0.0500 M Na₂S₂O₃.', ...STARCH_STEPS, 'Near the end point add about 1 g KSCN to release iodine adsorbed on the CuI.', REPEAT];
      return {
        aliquot: 25, titrant: '0.0500 M Na₂S₂O₃ (standard)', flask: `25.0 mL of brass solution (${W.toFixed(4)} g in 100 mL) + excess KI`, titrantColour: null, veq: vA, vmax: 45,
        state: (Vt, ctx) => iodState(1 - Vt / vA, ctx, '#efe6cf'),
        report: [{ id: 'p', label: 'Copper in the brass', unit: '% w/w', truth: pc, dp: 1, tol: 0.03 }],
        solve: (m) => { const n = (Ct * m.t) / 1000, p = (n * 4 * 63.55 / W) * 100; return { values: { p }, lines: ['2Cu²⁺ + 4I⁻ → 2CuI + I₂; I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻ (1 Cu ≡ 1 S₂O₃²⁻)', `Cu in 25 mL = 0.0500 × ${m.t.toFixed(2)} / 1000 = ${n.toExponential(4)} mol`, `Cu in the sample (×4) = ${(n * 4 * 63.55).toFixed(4)} g`, `% Cu = ${(n * 4 * 63.55).toFixed(4)} / ${W.toFixed(4)} × 100 = ${p.toFixed(1)} %`] }; },
      };
    },
  });

  def({
    id: 'winkler', level: 'bsc', mode: 'indicator', title: 'Dissolved oxygen in water (Winkler)', short: 'Iodometric estimation of O₂', indicators: [], needsStarch: true,
    steps: ['A 300 mL BOD bottle was filled with the water without trapping air. 2 mL MnSO₄ and 2 mL alkaline KI–azide were added under the surface: the O₂ oxidises Mn(OH)₂ to a brown MnO(OH)₂ precipitate (oxygen is “fixed”).', 'After settling, 2 mL conc. H₂SO₄ dissolves the precipitate; Mn(III/IV) oxidises iodide to iodine, an amount equivalent to the oxygen.', 'Titrate 200 mL with 0.0250 M Na₂S₂O₃. (Strictly, 200 mL titrated contains the oxygen of 200 × 300/(300 − 4) = 202.7 mL of sample, because 4 mL of reagents displaced sample from the bottle; this 1.4 % correction is ignored here, as in many routine procedures.)', ...STARCH_STEPS, REPEAT],
    make(rnd) {
      const DO = Number(L.between(rnd, 5.5, 9.0, 0.05).toFixed(2)), Ct = 0.025, V0 = 200, vA = (DO * V0) / (Ct * 8000);
      return {
        aliquot: V0, titrant: '0.0250 M Na₂S₂O₃ (standard)', flask: '200 mL of the fixed and acidified sample', titrantColour: null, veq: vA, vmax: 25,
        state: (Vt, ctx) => iodState((1 - Vt / vA) * 0.45, ctx),
        report: [{ id: 'do', label: 'Dissolved oxygen', unit: 'mg/L', truth: DO, dp: 2, tol: 0.03 }],
        solve: (m) => { const d = (m.t * Ct * 8000) / V0; return { values: { do: d }, lines: ['O₂ + 2Mn(OH)₂ → 2MnO(OH)₂;  MnO(OH)₂ + 2I⁻ + 4H⁺ → Mn²⁺ + I₂ + 3H₂O;  I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻', 'so 1 O₂ ≡ 2 I₂ ≡ 4 S₂O₃²⁻, i.e. 1 mol S₂O₃²⁻ ≡ 8 g O₂', `DO = ${m.t.toFixed(2)} × 0.0250 × 8000 / 200 = ${d.toFixed(2)} mg/L`] }; },
      };
    },
  });

  def({
    id: 'vitc', level: 'bsc', mode: 'indicator', title: 'Vitamin C in a tablet (iodimetry)', short: 'Direct titration with standard iodine', indicators: [],
    steps: ['One tablet (label: 500 mg ascorbic acid) was dissolved in freshly boiled, cooled water with a little dilute H₂SO₄ and made up to 250.0 mL.', 'Pipette 25.0 mL, add 2 mL starch. Titrate with 0.0100 M I₂ (in KI). Each drop of iodine is reduced at once, so the flask stays colourless.', 'The end point is the first blue colour that lasts 30 seconds. ' + REPEAT],
    make(rnd) {
      const mg = Number(L.between(rnd, 430, 540, 1).toFixed(0)), Ci = 0.01, nAli = mg / 1000 / 176.12 / 10, vA = (nAli * 1000) / Ci;
      return {
        aliquot: 25, titrant: '0.0100 M I₂ in KI (standard)', flask: '25.0 mL tablet solution + starch', titrantColour: '#a0521c', veq: vA, vmax: 45,
        state: (Vt) => Vt < vA ? { colour: null, flash: Vt > 0 ? { c: '#2a2f7a' } : null } : { colour: dye('#14153a', Math.min(1.2, Math.pow((Ci * (Vt - vA)) / (25 + Vt) / 2e-4, 0.6))), flash: null },
        report: [{ id: 'mg', label: 'Ascorbic acid per tablet', unit: 'mg', truth: mg, dp: 0, tol: 0.03 }],
        solve: (m) => { const n = (Ci * m.t) / 1000, x = n * 10 * 176.12 * 1000; return { values: { mg: x }, lines: ['C₆H₈O₆ + I₂ → C₆H₆O₆ + 2I⁻ + 2H⁺ (1 : 1; ascorbic acid → dehydroascorbic acid)', `ascorbic acid in 25 mL = 0.0100 × ${m.t.toFixed(2)} / 1000 = ${n.toExponential(4)} mol`, `per tablet (× 250/25) = ${(n * 10).toExponential(4)} mol × 176.12 g/mol = ${x.toFixed(0)} mg`] }; },
      };
    },
  });

  const OILS = [['coconut oil', 255], ['groundnut oil', 191], ['mustard oil', 174], ['castor oil', 181], ['sunflower oil', 190]];
  def({
    id: 'sap-value', level: 'bsc', mode: 'indicator', title: 'Saponification value of an oil', short: 'Back titration with a blank', indicators: [],
    steps: [],
    make(rnd) {
      const oil = OILS[Math.floor(rnd() * OILS.length)], SV = oil[1] + Math.round(L.between(rnd, -4, 4, 1)), W = Number(L.between(rnd, 1.6, 2.2, 0.0001).toFixed(4));
      const cK = rnd4(L.between(rnd, 0.48, 0.52, 0.001)), Ca = 0.5, V0 = 25;
      const used = (SV * W) / 56.1 / 1000;  // mol KOH used by the oil
      const blank = { V0, Na0: cK, fams: [] }, samp = { V0, Na0: cK, fams: [{ C: used / (V0 / 1000), pK: [4.8], lam: [0, 30] }] }, tt = { kind: 'acid', C: Ca };
      const vB = (cK * V0) / Ca, vS = (cK * V0 / 1000 - used) * 1000 / Ca;
      const st = (fl) => (Vt) => { const r = L.acidBase(fl, tt, Vt); return { pH: r.pH, colour: C.indColor('phph', r.pH) }; };
      this.steps = [`Part B (sample): ${W.toFixed(4)} g of the oil was refluxed for 30 min with 25.0 mL of about 0.5 M alcoholic KOH, until no oily drops remained (the fat is completely saponified to glycerol and potassium soaps).`, 'Part A (blank): 25.0 mL of the same alcoholic KOH refluxed alone. This measures exactly how much KOH was added, so its concentration need not be known.', 'Titrate the hot solution with 0.5000 M HCl and phenolphthalein until the pink just disappears. Do both parts.', 'SV = mg KOH needed to saponify 1 g of the oil.'];
      return {
        parts: [
          { label: 'A: blank', titrant: '0.5000 M HCl (standard)', flask: '25.0 mL alcoholic KOH (refluxed) + phenolphthalein', titrantColour: null, veq: vB, vmax: 45, state: st(blank) },
          { label: 'B: oil sample', titrant: '0.5000 M HCl (standard)', flask: `${W.toFixed(4)} g oil + 25.0 mL alcoholic KOH (refluxed)`, titrantColour: null, veq: vS, vmax: 45, state: (Vt) => { const r = st(samp)(Vt); r.colour = r.colour ? C.absAdd(r.colour, '#efe2a6', 0.3) : dye('#efe2a6', 0.3); return r; } },
        ],
        report: [{ id: 'sv', label: 'Saponification value', unit: 'mg KOH/g', truth: SV, dp: 0, tol: 0.04 }],
        oilName: oil[0],
        solve: (m) => { const [b, s2] = m.t, sv = (56.1 * (b - s2) * Ca) / W; const near = OILS.slice().sort((x, y) => Math.abs(x[1] - sv) - Math.abs(y[1] - sv))[0]; return { values: { sv }, lines: ['Triglyceride + 3KOH → glycerol + 3 RCOO⁻K⁺', `KOH used by the oil = (blank − sample) = ${b.toFixed(2)} − ${s2.toFixed(2)} = ${(b - s2).toFixed(2)} mL of 0.5000 M HCl`, `SV = 56.1 × ${(b - s2).toFixed(2)} × 0.5000 / ${W.toFixed(4)} = ${sv.toFixed(0)} mg KOH/g`, `closest typical value: ${near[0]} (about ${near[1]}). A high SV means short fatty-acid chains (small molar mass).`] }; },
      };
    },
  });

  def({
    id: 'glycine', level: 'bsc', mode: 'indicator', title: 'Glycine by formol titration (Sørensen)', short: 'Quantitative organic estimation', indicators: [],
    steps: ['Pipette 25.0 mL glycine solution and add phenolphthalein. Glycine exists as the zwitterion ⁺H₃N–CH₂–COO⁻; its –NH₃⁺ group (pK 9.6) is too weak an acid for a sharp end point.', 'Add 10 mL of formalin that was neutralised beforehand to faint pink (use the button). Formaldehyde converts –NH₂ to –N(CH₂OH)₂, so the nitrogen holds its proton far less firmly (the pK drops to about 6.5). The proton becomes titratable.', 'Titrate with 0.1000 M NaOH to a distinct, permanent pink (pH ≈ 9). Try it once without formalin to see why it is needed. ' + REPEAT],
    make(rnd) {
      const c = rnd4(L.between(rnd, 0.04, 0.08, 0.001)), V0 = 25, Cb = 0.1, vA = (c * V0) / Cb, tt = { kind: 'base', C: Cb };
      const withF = { V0: V0 + 10, fams: [{ C: (c * V0) / (V0 + 10), pK: [6.5], lam: [0, 30] }] }, noF = { V0, fams: [{ C: c, pK: [9.6], lam: [0, 30] }] };
      return {
        aliquot: V0, titrant: '0.1000 M NaOH (standard)', flask: '25.0 mL glycine solution + phenolphthalein', titrantColour: null, veq: vA, vmax: 40, needsFormol: true,
        state: (Vt, ctx) => { const r = L.acidBase(ctx && ctx.formol ? withF : noF, tt, Vt); return { pH: r.pH, colour: C.indColor('phph', r.pH) }; },
        report: [{ id: 'g', label: 'Glycine', unit: 'g/L', truth: c * 75.07, dp: 2, tol: 0.05 }],
        solve: (m) => { const x = (Cb * m.t) / V0; return { values: { g: x * 75.07 }, lines: ['⁺H₃N–CH₂–COO⁻ + 2HCHO → (HOCH₂)₂N–CH₂–COO⁻ + H⁺;  H⁺ + OH⁻ → H₂O (1 : 1)', `glycine = 0.1000 × ${m.t.toFixed(2)} / 25.0 = ${x.toFixed(4)} M`, `= ${x.toFixed(4)} × 75.07 = ${(x * 75.07).toFixed(2)} g/L`] }; },
      };
    },
  });

  def({
    id: 'glucose', level: 'bsc', mode: 'indicator', title: 'Glucose by iodometry (back titration)', short: 'Quantitative organic estimation with a blank', indicators: [],
    steps: ['Part B (sample): 25.0 mL glucose solution + 25.0 mL of about 0.05 M I₂ + 1 M NaOH added slowly; stand 10 min in the dark. Hypoiodite (IO⁻) oxidises the aldehyde group to the gluconate. Then acidify with dilute H₂SO₄ to release the unused iodine.', 'Part A (blank): the same with 25.0 mL water instead of glucose.', 'Titrate the iodine in each with 0.1000 M Na₂S₂O₃.', ...STARCH_STEPS, 'Glucose ≡ the iodine used = blank − sample.'],
    make(rnd) {
      const cg = rnd4(L.between(rnd, 0.01, 0.02, 0.0002)), cI = rnd4(L.between(rnd, 0.048, 0.052, 0.0005)), Ct = 0.1, V0 = 25;
      const vB = (2 * cI * V0) / Ct, vS = (2 * (cI - cg) * V0) / Ct;
      return {
        parts: [
          { label: 'A: blank', titrant: '0.1000 M Na₂S₂O₃ (standard)', flask: '25.0 mL I₂ + NaOH + water, acidified', titrantColour: null, veq: vB, vmax: 45, needsStarch: true, state: (Vt, ctx) => iodState(1 - Vt / vB, ctx) },
          { label: 'B: glucose sample', titrant: '0.1000 M Na₂S₂O₃ (standard)', flask: '25.0 mL I₂ + NaOH + 25.0 mL glucose, acidified', titrantColour: null, veq: vS, vmax: 45, needsStarch: true, state: (Vt, ctx) => iodState((1 - Vt / vS) * (vS / vB), ctx) },
        ],
        report: [{ id: 'g', label: 'Glucose', unit: 'g/L', truth: cg * 180.16, dp: 2, tol: 0.04 }],
        solve: (m) => { const [b, s2] = m.t, n = ((b - s2) * Ct) / 2 / 1000, gl = (n / (V0 / 1000)) * 180.16; return { values: { g: gl }, lines: ['RCHO + I₂ + 3OH⁻ → RCOO⁻ + 2I⁻ + 2H₂O (1 glucose ≡ 1 I₂);  I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻', `I₂ used by glucose ≡ (${b.toFixed(2)} − ${s2.toFixed(2)}) mL × 0.1000 M / 2 = ${(n * 1000).toFixed(4)} mmol`, `glucose = ${(n * 1000).toFixed(4)} mmol in 25.0 mL = ${(n / 0.025).toFixed(4)} M = ${gl.toFixed(2)} g/L`] }; },
      };
    },
  });

  const RANK = { '11': 1, '12': 1, school: 1, bsc: 2 };
  T.forLevel = (lv) => T.EXPS.filter((e) => (RANK[lv] || 2) >= RANK[e.level]);

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
