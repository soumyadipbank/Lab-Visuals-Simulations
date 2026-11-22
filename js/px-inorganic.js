/* Lab Visuals: inorganic preparations, gravimetry and spreadsheet computations for the bench (custom experiments). */
(function () {
  'use strict';
  const C = globalThis.Chem, L = C.Lab, K = PX.draw, N = PX.noise, esc = PX.esc;
  const btn = (id, label, primary, extra) => '<button type="button" class="btn-sm' + (primary ? ' primary' : '') + '" data-a="' + id + '"' + (extra || '') + '>' + label + '</button>';
  const sel = (id, label, opts, val) => '<div class="field"><label for="' + id + '">' + label + '</label><select id="' + id + '">' + opts.map((o) => '<option value="' + o[0] + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select></div>';

  // ================================================================ gravimetry
  const GRAV = {
    ni: { name: 'Ni(II) as Ni(DMG)₂', ppt: 'nickel dimethylglyoximate', col: '#d12a4f', Mp: 288.91, Ma: 58.69, sample: 'sol', unit: 'g/L Ni', dry: 'Dry at 110–120 °C', cru: 'sintered-glass crucible (porosity G4)',
      conds: [['ph', 'Medium', [['ok', 'slightly ammoniacal (pH 7–9)'], ['acid', 'acidic (pH 2)']]], ['ex', 'DMG added', [['ok', 'slight excess of 1 % alcoholic DMG'], ['big', 'large excess of alcoholic DMG']]], ['t', 'Temperature', [['ok', 'hot, 70–80 °C, then cool'], ['boil', 'boiling for a long time']]]],
      effect: { acid: [-0.6, 'In acid the DMG stays protonated, so most nickel is not precipitated (the result is far too low).'], big: [0.03, 'A large excess of DMG crystallises from the alcohol-water mixture with the precipitate (result too high).'], boil: [-0.025, 'Long boiling evaporates the alcohol and some of the complex is lost or decomposed.'] } },
    cl: { name: 'Chloride as AgCl', ppt: 'silver chloride', col: '#f2f2f2', Mp: 143.32, Ma: 35.45, sample: 'solid', unit: '% Cl', dry: 'Dry at 130–150 °C', cru: 'sintered-glass crucible (porosity G4)',
      conds: [['acid', 'Acidify with', [['ok', 'dilute HNO₃'], ['none', 'nothing (neutral solution)']]], ['light', 'Light', [['ok', 'work in subdued light'], ['sun', 'leave in bright daylight']]], ['dig', 'Before filtering', [['ok', 'heat to coagulate, stand in the dark'], ['now', 'filter immediately (colloidal)']]]],
      effect: { none: [0.012, 'In neutral solution other anions (carbonate, phosphate) also precipitate with Ag⁺ (result too high).'], sun: [0.015, 'Light decomposes AgCl. While excess Ag⁺ is still present (before filtering) the chlorine released forms more AgCl and the result is high; after filtering, mass is lost instead. Either way the solid turns violet-grey and the result is wrong.'], now: [-0.025, 'Colloidal AgCl passes through the filter (result too low).'] } },
    so4: { name: 'Sulfate as BaSO₄', ppt: 'barium sulfate', col: '#fafafa', Mp: 233.39, Ma: 96.06, sample: 'solid', unit: '% SO₄', dry: 'Ignite at 800 °C', cru: 'porcelain crucible; the precipitate is collected on ashless filter paper, which is charred off before ignition (sintered glass cannot stand 800 °C)',
      conds: [['acid', 'Solution', [['ok', 'hot, slightly acid (dilute HCl)'], ['cold', 'cold and neutral']]], ['add', 'BaCl₂ addition', [['ok', 'hot, dropwise with stirring'], ['fast', 'all at once']]], ['dig', 'Digestion', [['ok', 'keep hot for 1 h (digest)'], ['now', 'filter immediately']]]],
      effect: { cold: [0.02, 'From cold neutral solution BaCO₃/Ba₃(PO₄)₂ can co-precipitate and fine crystals form (results high and hard to filter).'], fast: [0.02, 'Fast addition gives high supersaturation: tiny crystals that trap (occlude) BaCl₂ (result high).'], now: [-0.025, 'Without digestion the fine particles do not grow and some pass through the filter (result low).'] } },
  };
  PX.add({
    id: 'gravimetry', area: 'Inorganic preparations & gravimetry', title: 'Gravimetric estimation (Ni–DMG, chloride, sulfate)', short: 'Precipitate, filter, dry to constant mass, calculate', aspect: 0.45,
    steps: ['Choose the estimation and the conditions. Correct conditions give a pure, filterable precipitate of known composition; wrong ones cause errors that you will see in the result.', 'Heat the empty crucible (sintered glass for Ni–DMG and AgCl; porcelain for BaSO₄, which is ignited), cool it in a desiccator and weigh. Repeat until two weighings agree within 0.0003 g (constant mass).', 'Precipitate, filter through the crucible and wash. Dry (or ignite), cool and weigh, again until constant mass.', 'Analyte = mass of precipitate × gravimetric factor (M_analyte / M_precipitate).'],
    begin: () => ({}),
    custom(api, S) {
      const st = (S.g = { a: 'ni', cond: {}, crucible: Number((18 + Math.random() * 6).toFixed(4)), w: [], stage: 0, n: 0 });
      const setup = () => {
        const d = GRAV[st.a]; st.cond = {}; d.conds.forEach((c) => (st.cond[c[0]] = 'ok'));
        st.trueAmt = d.sample === 'sol' ? Number((1.2 + Math.random() * 1.4).toFixed(3)) : Number((30 + Math.random() * 25).toFixed(2)); // g/L Ni or % analyte
        st.sm = d.sample === 'sol' ? 25.0 : Number((0.28 + Math.random() * 0.12).toFixed(4));
        st.w = []; st.stage = 0; st.n = 0; st.pptMass = null;
        render();
      };
      const render = () => {
        const d = GRAV[st.a];
        $p('params').innerHTML = '<div class="two-col">' + sel('gA', 'Estimation', Object.keys(GRAV).map((k) => [k, GRAV[k].name]), st.a) + d.conds.map((c) => sel('gC_' + c[0], c[1], c[2], st.cond[c[0]])).join('') + '</div><p class="sub">Sample: ' + (d.sample === 'sol' ? '25.0 mL of the Ni²⁺ solution' : st.sm.toFixed(4) + ' g of the salt') + '. ' + d.dry + ' in a ' + d.cru + '.</p>';
        $p('actions').innerHTML = btn('cru', 'Heat, cool, weigh empty crucible', st.stage === 0, st.stage !== 0 ? ' disabled' : '') + btn('ppt', 'Precipitate, filter, wash', st.stage === 1, st.stage !== 1 ? ' disabled' : '') + btn('dry', d.dry.split(' ')[0] + ', cool, weigh', st.stage === 2, st.stage !== 2 ? ' disabled' : '') + btn('reset', 'Start again');
        api.table('Weighings', [{ k: 'what', label: 'Weighing' }, { k: 'm', label: 'mass / g', dp: 4 }], st.w);
        api.readouts([['Sample', d.sample === 'sol' ? '25.0 mL' : st.sm.toFixed(4) + ' g'], ['Precipitate', d.ppt]]);
      };
      const $p = api.$;
      const constant = (stage) => { const r = st.w.filter((x) => x.stage === stage); return r.length >= 2 && Math.abs(r[r.length - 1].m - r[r.length - 2].m) <= 0.0003; };
      const finish = () => {
        const d = GRAV[st.a], massPpt = st.w.filter((x) => x.stage === 2).pop().m - st.w.filter((x) => x.stage === 0).pop().m, f = d.Ma / d.Mp;
        const work = () => [`mass of ${d.ppt} = ${massPpt.toFixed(4)} g`, `gravimetric factor = ${d.Ma} / ${d.Mp} = ${f.toFixed(4)}`, d.sample === 'sol' ? `Ni in 25.0 mL = ${massPpt.toFixed(4)} × ${f.toFixed(4)} = ${(massPpt * f).toFixed(4)} g → ${((massPpt * f) / 0.025).toFixed(3)} g/L` : `analyte = ${massPpt.toFixed(4)} × ${f.toFixed(4)} = ${(massPpt * f).toFixed(4)} g → ${((massPpt * f) / st.sm * 100).toFixed(2)} % of ${st.sm.toFixed(4)} g`];
        const used = st.used || st.cond, errs = Object.keys(used).filter((k) => used[k] !== 'ok').map((k) => d.effect[used[k]][1]);
        api.msg('Constant mass reached. Precipitate = ' + massPpt.toFixed(4) + ' g.' + (errs.length ? '<br><b>Conditions used:</b> ' + errs.join(' ') : ' The conditions were correct.'), errs.length ? 'warn' : 'ok');
        api.answer([{ id: 'x', label: d.sample === 'sol' ? 'Nickel in the solution' : d.unit.replace('% ', '') + ' in the sample', unit: d.unit, truth: st.trueAmt, dp: d.sample === 'sol' ? 3 : 2, tol: 0.008 }], work);
      };
      api.$('params').oninput = (ev) => { if (ev.target.id === 'gA') { st.a = ev.target.value; setup(); } else if (ev.target.id.startsWith('gC_')) { st.cond[ev.target.id.slice(3)] = ev.target.value; } };
      api.$('actions').onclick = (ev) => {
        const b = ev.target.closest('[data-a]'); if (!b || b.disabled) return; const d = GRAV[st.a];
        if (b.dataset.a === 'reset') { setup(); api.msg(''); api.answer(null); return; }
        if (b.dataset.a === 'cru') { const n = st.w.filter((x) => x.stage === 0).length; const m = st.crucible + 0.0015 * Math.pow(0.18, n) + N(0.00008); st.w.push({ stage: 0, what: 'empty crucible, heating ' + (n + 1), m }); if (constant(0)) { st.stage = 1; api.msg('Constant mass: the crucible is ready.', 'ok'); } else api.msg('Not yet constant: heat, cool and weigh again.'); }
        if (b.dataset.a === 'ppt') {
          st.used = { ...st.cond }; let rel = 0; Object.keys(st.used).forEach((k) => { if (st.used[k] !== 'ok') rel += d.effect[st.used[k]][0]; });
          const analyteG = d.sample === 'sol' ? st.trueAmt * 0.025 : (st.trueAmt / 100) * st.sm;
          st.pptMass = (analyteG / (d.Ma / d.Mp)) * (1 + rel) * (1 - 0.002 * Math.random()); st.stage = 2; S.anim = { t: 0, dur: 2.5, kind: 'ppt' };
          api.msg('The ' + d.ppt + ' was precipitated, collected in the crucible and washed.');
        }
        if (b.dataset.a === 'dry') { const n = st.w.filter((x) => x.stage === 2).length; const m = st.crucible + st.pptMass + 0.012 * Math.pow(0.15, n) + N(0.00008); st.w.push({ stage: 2, what: 'crucible + precipitate, ' + (n + 1), m }); if (constant(2)) { st.stage = 3; finish(); } else api.msg('Not yet constant mass: water is still being lost. Heat, cool and weigh again.'); }
        render();
      };
      setup();
    },
    draw(g, w, h, s, c, S) {
      const st = S.g; if (!st) return; const d = GRAV[st.a];
      // balance
      g.fillStyle = TH.stand; g.fillRect(w * 0.08, h * 0.75, w * 0.3, h * 0.12); g.fillStyle = '#0d0618'; g.fillRect(w * 0.1, h * 0.775, w * 0.26, h * 0.07);
      const last = st.w.length ? st.w[st.w.length - 1].m.toFixed(4) + ' g' : '0.0000 g'; g.fillStyle = '#7cf0b4'; g.font = '700 ' + Math.min(Math.max(10, w * 0.022), (w * 0.26) / 6.5) + 'px ui-monospace, monospace'; g.textAlign = 'center'; g.fillText(last, w * 0.23, h * 0.825);
      // crucible on the balance
      g.fillStyle = '#d6d0c4'; g.beginPath(); g.moveTo(w * 0.18, h * 0.55); g.lineTo(w * 0.28, h * 0.55); g.lineTo(w * 0.26, h * 0.74); g.lineTo(w * 0.2, h * 0.74); g.fill();
      if (st.stage >= 2) { g.fillStyle = d.col; g.fillRect(w * 0.205, h * 0.68, w * 0.05, h * 0.05); }
      // precipitation beaker
      const an = S.anim && S.anim.kind === 'ppt' ? Math.min(1, S.anim.t / S.anim.dur) : st.stage >= 2 ? 1 : 0;
      K.beaker(g, w * 0.55, h * 0.88, w * 0.22, h * 0.55, st.a === 'ni' ? '#a8d8a0' : '#dbe9f2', 0.6);
      if (an > 0) for (let i = 0; i < 40 * an; i++) { g.fillStyle = K.rgba(d.col, 0.9); g.fillRect(w * 0.56 + ((i * 47) % (w * 0.2)), h * 0.86 - (i % 4) * 3 - (1 - an) * h * 0.2 * ((i % 7) / 7), 4, 3); }
      K.label(g, w, d.name, 12, 20);
    },
  });

  // ================================================================ preparation of coordination complexes
  const PREP = {
    cuam: { name: 'Tetraamminecopper(II) sulfate monohydrate', f: '[Cu(NH₃)₄]SO₄·H₂O', start: 'CuSO₄·5H₂O', Ms: 249.69, Mp: 245.75, m0: 2.5, cols: ['#7fb8ee', '#7fb8ee', '#2b4fd1', '#2b4fd1', '#1f3ab0', '#1f3ab0'],
      steps: ['Dissolve the CuSO₄·5H₂O in the minimum of water (about 4 mL)', 'Add conc. NH₃ dropwise: a pale blue precipitate forms, then dissolves to a deep-blue solution', 'Add 8 mL ethanol slowly down the side (it forms a layer)', 'Stand in ice for 30 min: dark blue crystals form', 'Filter with suction and wash with a little ethanol', 'Dry in air on filter paper and weigh'],
      traps: [['heat', 'Dry the crystals in an oven at 110 °C', 0.35, 'Heating drives off NH₃: the deep-blue complex decomposes back to a pale blue/green copper salt.'], ['water', 'Wash the crystals with water', 0.3, 'The complex is very soluble in water: washing with water dissolves much of the product. Ethanol is used because it does not dissolve it.']] },
    feox: { name: 'Potassium trioxalatoferrate(III) trihydrate', f: 'K₃[Fe(C₂O₄)₃]·3H₂O', start: 'Fe(NH₄)₂(SO₄)₂·6H₂O', Ms: 392.14, Mp: 491.24, m0: 5.0, cols: ['#d8e6c8', '#e6cf47', '#7a4a1e', '#7fd16a', '#5fcf55', '#5fcf55'], cryst: 5,
      steps: ['Dissolve the ferrous ammonium sulfate in warm water with a few drops of dilute H₂SO₄', 'Add oxalic acid solution and heat: yellow FeC₂O₄ precipitates; decant and wash', 'Add K₂C₂O₄ solution, warm to 40 °C, add 3 % H₂O₂ slowly (Fe²⁺ → Fe³⁺; some brown Fe(OH)₃ forms)', 'Boil briefly, add more oxalic acid until the solution becomes clear bright green', 'Add ethanol, cool in the dark: green crystals form', 'Filter, wash with ethanol, dry in the dark and weigh'],
      traps: [['light', 'Leave the crystals in sunlight to dry', 0.25, 'The complex is photosensitive: light reduces Fe(III) to Fe(II) and oxidises oxalate to CO₂ (the basis of ferrioxalate actinometry). The crystals turn yellow-brown.'], ['hot', 'Add the H₂O₂ to a boiling solution', 0.2, 'H₂O₂ decomposes at high temperature before it can oxidise the iron, so oxidation is incomplete.']] },
    niam: { name: 'Hexaamminenickel(II) chloride', f: '[Ni(NH₃)₆]Cl₂', start: 'NiCl₂·6H₂O', Ms: 237.69, Mp: 231.78, m0: 2.5, cols: ['#7fcf7a', '#7fcf7a', '#8f6ad8', '#8f6ad8', '#7b5bd0', '#7b5bd0'],
      steps: ['Dissolve the NiCl₂·6H₂O in the minimum of water', 'Add conc. NH₃ slowly with stirring: the green solution turns blue-violet', 'Add a cold NH₃/NH₄Cl solution (common ion: lowers the solubility)', 'Cool in ice for 15 min: violet crystals form', 'Filter, wash with conc. NH₃, then ethanol', 'Dry in air and weigh'],
      traps: [['water', 'Wash the crystals with water', 0.35, 'Water dissolves the complex and, without excess NH₃, it begins to lose ammonia ligands.'], ['heat', 'Dry in an oven at 110 °C', 0.3, 'The complex loses NH₃ on heating and turns green.']] },
    cuacac: { name: 'Bis(acetylacetonato)copper(II)', f: 'Cu(acac)₂', start: 'CuSO₄·5H₂O', Ms: 249.69, Mp: 261.76, m0: 2.0, cols: ['#7fb8ee', '#7fb8ee', '#6a8ec8', '#6a8ec8', '#5a78b0', '#5a78b0'],
      steps: ['Dissolve the CuSO₄·5H₂O in water', 'Add acetylacetone dissolved in methanol', 'Add sodium acetate solution slowly with stirring (it removes the H⁺ released, so acac⁻ can bind)', 'Stir 15 min and cool: blue-grey crystals separate', 'Filter and wash with water', 'Dry in air and weigh'],
      traps: [['acid', 'Skip the sodium acetate', 0.6, 'Without a base the H⁺ released (Cu²⁺ + 2Hacac → Cu(acac)₂ + 2H⁺) keeps the equilibrium to the left: little product forms.']] },
  };
  PX.add({
    id: 'complex-prep', area: 'Inorganic preparations & gravimetry', title: 'Preparation of coordination complexes', short: 'Do the steps in order, find the % yield', aspect: 0.42,
    steps: ['Choose a complex and the mass of starting material.', 'Do the steps in the correct order (the buttons are shuffled). Avoid the traps: each one is a common mistake.', 'Theoretical yield = moles of the limiting reagent × molar mass of the product (all four preparations are 1 : 1 in the metal).', '% yield = actual mass / theoretical mass × 100.'],
    custom(api, S) {
      const st = (S.p = { k: 'cuam', done: [], pen: 1, notes: [], m: null, eff: 0.72 + Math.random() * 0.14 });
      const setup = () => { const d = PREP[st.k]; st.done = []; st.pen = 1; st.notes = []; st.m = st.m || d.m0; st.order = d.steps.map((x, i) => i).sort(() => Math.random() - 0.5); st.final = null; render(); api.msg(''); api.answer(null); };
      const render = () => {
        const d = PREP[st.k];
        api.$('params').innerHTML = '<div class="two-col">' + sel('cK', 'Complex', Object.keys(PREP).map((k) => [k, PREP[k].f + ': ' + PREP[k].name]), st.k) + '<div class="field"><label for="cM">Mass of ' + d.start + ' <output>g</output></label><input type="number" id="cM" step="0.01" min="0.5" max="10" value="' + st.m + '"></div></div>';
        api.$('actions').innerHTML = st.order.map((i) => btn('s' + i, d.steps[i], false, st.done.includes(i) ? ' disabled' : '')).join('') + d.traps.map((t) => btn('t_' + t[0], '⚠ ' + t[1])).join('') + btn('reset', 'Start again');
        api.table('Procedure followed', [{ k: 'n', label: '#', dp: 0 }, { k: 'what', label: 'Step' }], st.done.map((i, n) => ({ n: n + 1, what: d.steps[i] })).concat(st.notes.map((t) => ({ n: '', what: '⚠ ' + t }))));
        api.readouts([['Starting material', st.m + ' g ' + d.start], ['Product', d.f]]);
      };
      api.$('params').oninput = (ev) => { if (ev.target.id === 'cK') { st.k = ev.target.value; st.m = PREP[st.k].m0; setup(); } else if (ev.target.id === 'cM') { const v = parseFloat(ev.target.value); if (v > 0) { st.m = v; api.readouts([['Starting material', st.m + ' g ' + PREP[st.k].start], ['Product', PREP[st.k].f]]); } } };
      api.$('actions').onclick = (ev) => {
        const b = ev.target.closest('[data-a]'); if (!b || b.disabled) return; const d = PREP[st.k], a = b.dataset.a;
        if (a === 'reset') { setup(); return; }
        if (a.startsWith('t_')) { const t = d.traps.find((x) => x[0] === a.slice(2)); if (!st.notes.includes(t[3])) { st.notes.push(t[3]); st.pen *= 1 - t[2]; } api.msg('⚠ ' + t[3], 'bad'); render(); return; }
        const i = +a.slice(1);
        if (i !== st.done.length) { api.msg('Not yet: “' + esc(d.steps[i]) + '” comes later. Think about what must happen first.', 'warn'); st.pen *= 0.97; return; }
        st.done.push(i); S.anim = { t: 0, dur: 1.5 };
        if (st.done.length === d.steps.length) {
          const theo = (st.m / d.Ms) * d.Mp, actual = Number((theo * st.eff * st.pen).toFixed(3));
          st.final = { theo, actual };
          api.msg('Product weighed: <b>' + actual.toFixed(3) + ' g</b> of ' + d.f + '. Calculate the theoretical and the percentage yield.', 'ok');
          api.answer([{ id: 'th', label: 'Theoretical yield', unit: 'g', truth: theo, dp: 3, tol: 0.02 }, { id: 'py', label: 'Percentage yield', unit: '%', truth: (actual / theo) * 100, dp: 1, abs: true, tol: 1.0 }],
            [`moles of ${d.start} = ${st.m} / ${d.Ms} = ${(st.m / d.Ms).toFixed(5)} mol`, `1 : 1 → moles of ${d.f} = ${(st.m / d.Ms).toFixed(5)} mol`, `theoretical = ${(st.m / d.Ms).toFixed(5)} × ${d.Mp} = ${theo.toFixed(3)} g`, `% yield = ${actual.toFixed(3)} / ${theo.toFixed(3)} × 100 = ${((actual / theo) * 100).toFixed(1)} %`]);
        } else api.msg('Done: ' + esc(d.steps[i]) + '.');
        render();
      };
      setup();
    },
    draw(g, w, h, s, c, S) {
      const st = S.p; if (!st) return; const d = PREP[st.k], n = st.done.length, col = n ? d.cols[Math.min(n, d.cols.length) - 1] : '#dfe9f2';
      K.beaker(g, w * 0.35, h * 0.9, w * 0.3, h * 0.7, col, 0.55);
      if (n >= (d.cryst || 4)) for (let i = 0; i < 30; i++) { g.fillStyle = K.rgba(d.cols[5], 0.95); g.save(); g.translate(w * 0.37 + ((i * 41) % (w * 0.26)), h * 0.86 - (i % 3) * 5); g.rotate(i); g.fillRect(-4, -2, 8, 4); g.restore(); }
      K.label(g, w, d.f + ' · step ' + n + ' of ' + d.steps.length, 12, 20);
      if (st.final) K.label(g, w, 'product: ' + st.final.actual.toFixed(3) + ' g', 12, 40);
    },
  });

  // ================================================================ spreadsheet computations
  PX.add({
    id: 'spreadsheet', area: 'Spectra & computing', title: 'Spreadsheet computations', short: 'Titration curve derivatives; Michaelis–Menten kinetics', noCanvas: true,
    steps: ['Every number in the table is produced by the formula shown in its column heading, exactly as you would type it into a spreadsheet (row n refers to the cells of that row).', 'Titration: the first derivative ΔpH/ΔV peaks at the end point; the second derivative changes sign there. Half the end-point volume gives pH = pK_a.', 'Michaelis–Menten: v = V_max[S]/(K_m + [S]). The Lineweaver–Burk plot 1/v = (K_m/V_max)(1/[S]) + 1/V_max is a straight line: intercept 1/V_max, slope K_m/V_max.'],
    custom(api, S) {
      const st = (S.ss = { task: 'titr' });
      const make = () => {
        if (st.task === 'titr') {
          const c = Number((0.08 + Math.random() * 0.04).toFixed(4)), fl = { V0: 25, fams: [{ C: c, ...L.FAM.acetic }] }, tt = { kind: 'base', C: 0.1 }, ve = (c * 25) / 0.1, Vs = [];
          for (let v = 0; v <= 40; v += v > ve - 2 && v < ve + 2 ? 0.2 : 1) Vs.push(Number(v.toFixed(1)));
          st.rows = Vs.map((v) => ({ V: v, pH: Number((L.acidBase(fl, tt, v).pH + N(0.01)).toFixed(2)) }));
          for (let i = 1; i < st.rows.length; i++) { const a = st.rows[i - 1], b = st.rows[i]; b.Vm = (a.V + b.V) / 2; b.d1 = (b.pH - a.pH) / (b.V - a.V); }
          for (let i = 2; i < st.rows.length; i++) { const a = st.rows[i - 1], b = st.rows[i]; b.Vm2 = (a.Vm + b.Vm) / 2; b.d2 = (b.d1 - a.d1) / (b.Vm - a.Vm); }
          st.truth = { ve, pKa: 4.76, c };
        } else {
          const Km = Number((2 + Math.random() * 6).toFixed(2)), Vm = Number((0.6 + Math.random() * 0.9).toFixed(3)), Ss = [0.5, 1, 2, 4, 8, 16, 32];
          st.rows = Ss.map((x) => { const v = ((Vm * x) / (Km + x)) * (1 + N(0.015)); return { S: x, v: Number(v.toFixed(4)), iS: 1 / x, iv: 1 / v }; });
          st.truth = { Km, Vm };
        }
        render();
      };
      const render = () => {
        api.$('params').innerHTML = '<div class="two-col">' + sel('ssT', 'Worksheet', [['titr', 'A: weak acid titration curve and derivatives'], ['mm', 'B: Michaelis–Menten enzyme kinetics']], st.task) + '</div>';
        api.$('actions').innerHTML = btn('new', 'New data set', true);
        if (st.task === 'titr') {
          api.table('Worksheet A (25.0 mL acetic acid of unknown strength vs 0.1000 M NaOH)', [{ k: 'V', label: 'B: V / mL', dp: 1 }, { k: 'pH', label: 'C: pH', dp: 2 }, { label: 'D: V̄ =(Bn+Bn−1)/2', f: (r) => (r.Vm == null ? '' : r.Vm.toFixed(2)) }, { label: 'E: ΔpH/ΔV =(Cn−Cn−1)/(Bn−Bn−1)', f: (r) => (r.d1 == null ? '' : r.d1.toFixed(3)) }, { label: 'F: V̿ =(Dn+Dn−1)/2', f: (r) => (r.Vm2 == null ? '' : r.Vm2.toFixed(2)) }, { label: 'G: Δ²pH/ΔV² =(En−En−1)/(Dn−Dn−1)', f: (r) => (r.d2 == null ? '' : r.d2.toFixed(2)) }], st.rows);
          const d1 = st.rows.filter((r) => r.d1 != null);
          api.chart('pH (purple) and first derivative (green, scaled) against V', { series: [{ pts: st.rows.map((r) => [r.V, r.pH]), color: '#ce72f5', line: true, dots: true, r: 2 }, { pts: d1.map((r) => [r.Vm, (r.d1 / Math.max(...d1.map((x) => x.d1))) * 13]), color: '#7cf0b4', line: true }], xmin: 0, xmax: 40, ymin: 0, ymax: 14, xLabel: 'V(NaOH) / mL', yLabel: 'pH' });
          const best = d1.reduce((a, b) => (b.d1 > a.d1 ? b : a));
          api.answer([{ id: 've', label: 'End-point volume', unit: 'mL', truth: st.truth.ve, dp: 2, abs: true, tol: 0.25 }, { id: 'pk', label: 'pK_a of acetic acid (pH at half the end point)', unit: '', truth: st.truth.pKa, dp: 2, abs: true, tol: 0.12 }, { id: 'c', label: 'Concentration of the acid', unit: 'M', truth: st.truth.c, dp: 4, tol: 0.02 }],
            () => [`largest ΔpH/ΔV = ${best.d1.toFixed(2)} at V̄ = ${best.Vm.toFixed(2)} mL → end point`, `half end point = ${(best.Vm / 2).toFixed(2)} mL, where pH = pK_a (Henderson: [HA] = [A⁻])`, `c = 0.1000 × ${best.Vm.toFixed(2)} / 25.0 = ${((0.1 * best.Vm) / 25).toFixed(4)} M`]);
        } else {
          api.table('Worksheet B (initial rates of an enzyme reaction)', [{ k: 'S', label: 'B: [S] / mM', dp: 1 }, { k: 'v', label: 'C: v / µmol min⁻¹', dp: 4 }, { label: 'D: 1/[S] =1/Bn', f: (r) => r.iS.toFixed(4) }, { label: 'E: 1/v =1/Cn', f: (r) => r.iv.toFixed(3) }], st.rows);
          const f = L.linreg(st.rows.map((r) => r.iS), st.rows.map((r) => r.iv)), xm = 2.1;
          api.chart('Lineweaver–Burk: 1/v against 1/[S]', { series: [{ pts: [[0, f.b], [xm, f.m * xm + f.b]], color: '#7cf0b4', line: true }, { pts: st.rows.map((r) => [r.iS, r.iv]), color: '#ce72f5', dots: true }], xmin: 0, xmax: xm, ymin: 0, xLabel: '1/[S] / mM⁻¹', yLabel: '1/v / min µmol⁻¹' });
          api.answer([{ id: 'vm', label: 'V_max', unit: 'µmol min⁻¹', truth: st.truth.Vm, dp: 3, tol: 0.08 }, { id: 'km', label: 'K_m', unit: 'mM', truth: st.truth.Km, dp: 2, tol: 0.1 }],
            () => [`=SLOPE(E2:E8, D2:D8) = ${f.m.toFixed(4)};  =INTERCEPT(E2:E8, D2:D8) = ${f.b.toFixed(4)}`, `V_max = 1 / intercept = ${(1 / f.b).toFixed(3)} µmol/min`, `K_m = slope × V_max = ${(f.m / f.b).toFixed(2)} mM`, 'Note: the double-reciprocal plot gives the low-[S] points (largest 1/[S]) the most weight; a non-linear fit of v against [S] is statistically better.']);
        }
      };
      api.$('params').oninput = (ev) => { if (ev.target.id === 'ssT') { st.task = ev.target.value; make(); } };
      api.$('actions').onclick = (ev) => { const b = ev.target.closest('[data-a]'); if (b && b.dataset.a === 'new') make(); };
      make();
    },
  });
})();
