/* Lab Visuals: organic chemistry practicals for the bench (custom experiments).
   Observations are the standard textbook results; melting/boiling points are literature values (±1 °C reading error). */
(function () {
  'use strict';
  const C = globalThis.Chem, L = C.Lab, K = PX.draw, N = PX.noise, esc = PX.esc;
  const btn = (id, label, primary, extra) => '<button type="button" class="btn-sm' + (primary ? ' primary' : '') + '" data-a="' + id + '"' + (extra || '') + '>' + label + '</button>';
  const sel = (id, label, opts, val) => '<div class="field"><label for="' + id + '">' + label + '</label><select id="' + id + '">' + opts.map((o) => '<option value="' + o[0] + '"' + (o[0] === val ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select></div>';
  const pick = (a) => a[Math.floor(Math.random() * a.length)];

  // ================================================================ identification of an organic compound
  // sol: [water, 5% NaOH, 5% NaHCO3, 5% HCl] as 's' soluble, 'p' partly/sparingly, 'i' insoluble, 'e' soluble with effervescence
  const ORG = {
    benzoic: { name: 'benzoic acid', state: 'White crystalline flakes; faint odour.', mp: 122, el: '', sol: 'pspi', t: { nahco3: 'Brisk effervescence (CO₂): a carboxylic acid.', fecl3: 'Buff (flesh-coloured) precipitate of iron(III) benzoate (after neutralising).' } },
    salicylic: { name: 'salicylic acid', state: 'White needles; odourless.', mp: 159, el: '', sol: 'pspi', t: { nahco3: 'Effervescence (CO₂): a carboxylic acid.', fecl3: 'Intense violet colour: a phenolic –OH.', br2: 'Bromine water decolourised; white precipitate.', kmno4: 'Decolourised slowly.', can: 'Brown precipitate (phenolic –OH).' } },
    oxalic: { name: 'oxalic acid dihydrate', state: 'Colourless crystals; odourless.', mp: 101, el: '', sol: 'ssss', t: { nahco3: 'Brisk effervescence (CO₂).', kmno4: 'Decolourised slowly (fast on warming with acid, with effervescence of CO₂).' } },
    cinnamic: { name: 'cinnamic acid', state: 'White crystals; faint balsamic odour.', mp: 133, el: '', sol: 'pspi', t: { fecl3: 'Buff precipitate (iron(III) salt of the carboxylic acid, after neutralising).', nahco3: 'Effervescence (CO₂): a carboxylic acid.', br2: 'Bromine water decolourised without a precipitate: C=C addition.', kmno4: 'Cold alkaline KMnO₄ decolourised, brown MnO₂ (Baeyer test): unsaturation.' } },
    phenol: { name: 'phenol', state: 'Colourless to pinkish deliquescent crystals; characteristic “carbolic” odour.', mp: 41, el: '', sol: 'psii', t: { fecl3: 'Violet colour: a phenol.', br2: 'Bromine water decolourised at once; white precipitate of 2,4,6-tribromophenol.', can: 'Brown/green-brown precipitate (phenol).', kmno4: 'Decolourised.', phthalein: 'Pink-red in NaOH: phenolphthalein formed.' } },
    naphthol: { name: 'β-naphthol (2-naphthol)', state: 'White to pinkish flakes; faint phenolic odour.', mp: 123, el: '', sol: 'isii', t: { fecl3: 'Green colour, then a white turbidity.', br2: 'Bromine water decolourised.', can: 'Brown precipitate (phenol).', kmno4: 'Decolourised.' } },
    resorcinol: { name: 'resorcinol', state: 'White crystals, turning pinkish; odourless.', mp: 110, el: '', sol: 'ssss', t: { fecl3: 'Blue-violet colour: a phenol.', br2: 'Bromine water decolourised; white precipitate.', can: 'Brown precipitate (phenol).', kmno4: 'Decolourised.', phthalein: 'Intense green fluorescence in NaOH: fluorescein formed (resorcinol).' } },
    acetanilide: { name: 'acetanilide', state: 'White shiny flakes; odourless.', mp: 114, el: 'N', sol: 'piii', t: { naohheat: 'No ammonia. On prolonged boiling, oily drops and the smell of aniline (amide hydrolysis to aniline + acetate).' } },
    benzamide: { name: 'benzamide', state: 'White crystals; odourless.', mp: 128, el: 'N', sol: 'piii', t: { naohheat: 'Ammonia evolved on warming (turns red litmus blue): a primary amide.' } },
    urea: { name: 'urea', state: 'White crystals; odourless.', mp: 133, el: 'N', sol: 'ssss', t: { naohheat: 'Ammonia evolved on warming.', biuret: 'Heated dry, then CuSO₄ + NaOH: violet colour (biuret).' } },
    glucose: { name: 'glucose', state: 'White crystalline powder; sweet taste (do not taste in the lab).', mp: 146, el: '', sol: 'ssss', t: { molisch: 'Violet ring at the junction (carbohydrate).', fehling: 'Red precipitate of Cu₂O: a reducing sugar.', tollens: 'Silver mirror.', kmno4: 'Decolourised.' }, note: 'chars on strong heating' },
    naphthalene: { name: 'naphthalene', state: 'White shiny flakes; strong mothball odour; sublimes.', mp: 80, el: '', sol: 'iiii', t: {} },
    dnb: { name: 'm-dinitrobenzene', state: 'Pale yellow needles; odourless.', mp: 90, el: 'N', sol: 'iiii', t: { nitro: 'Zn/NH₄Cl, then Tollens: grey-black precipitate (Mulliken–Barker): a nitro group. With acetone and NaOH: violet colour (Janovsky, typical of m-dinitro compounds).' } },
    sulfanilic: { name: 'sulfanilic acid', state: 'White to greyish crystals; odourless.', mp: 288, el: 'NS', sol: 'pspi', t: { nahco3: 'Slow effervescence: an acidic –SO₃H group.', azo: 'Diazotised, then coupled with alkaline β-naphthol: orange-red dye (a primary aromatic amine).' } },
    acetone: { name: 'acetone', liquid: true, state: 'Colourless mobile liquid; sweet, pungent odour.', bp: 56, el: '', sol: 'ssss', t: { dnp: 'Yellow-orange precipitate (2,4-DNP derivative): a carbonyl.', iodoform: 'Yellow precipitate of CHI₃ with an antiseptic smell: CH₃CO– group.' } },
    ethanol: { name: 'ethanol', liquid: true, state: 'Colourless liquid; characteristic spirit odour.', bp: 78, el: '', sol: 'ssss', t: { iodoform: 'Yellow precipitate of CHI₃: CH₃CH(OH)– group.', can: 'Red colour with ceric ammonium nitrate: an alcohol.' } },
    benzaldehyde: { name: 'benzaldehyde', liquid: true, state: 'Colourless to pale yellow oily liquid; bitter-almond odour.', bp: 178, el: '', sol: 'iiii', t: { dnp: 'Orange-red precipitate: a carbonyl.', tollens: 'Silver mirror: an aldehyde.', kmno4: 'Decolourised.' } },
    acetophenone: { name: 'acetophenone', liquid: true, state: 'Colourless liquid (solidifies at 20 °C); sweet, orange-blossom odour.', bp: 202, el: '', sol: 'iiii', t: { dnp: 'Orange precipitate: a carbonyl.', iodoform: 'Yellow precipitate of CHI₃: a methyl ketone.' } },
    aniline: { name: 'aniline', liquid: true, state: 'Colourless oily liquid that darkens to brown on standing; fishy amine odour.', bp: 184, el: 'N', sol: 'piis', t: { azo: 'Diazotised at 0–5 °C, then coupled with alkaline β-naphthol: brilliant orange-red dye (primary aromatic amine).', br2: 'Bromine water decolourised; white precipitate of 2,4,6-tribromoaniline.', carbylamine: 'Warmed with CHCl₃ and alcoholic KOH: offensive smell of phenyl isocyanide (primary amine). (Do in a fume cupboard.)', kmno4: 'Decolourised.' } },
    chlorobenzene: { name: 'chlorobenzene', liquid: true, state: 'Colourless liquid; faint almond-like odour; heavier than water.', bp: 132, el: 'Cl', sol: 'iiii', t: {} },
    nitrobenzene: { name: 'nitrobenzene', liquid: true, state: 'Pale yellow oily liquid; bitter-almond odour; heavier than water.', bp: 211, el: 'N', sol: 'iiii', t: { nitro: 'Zn/NH₄Cl, then Tollens: grey-black precipitate (Mulliken–Barker): a nitro group.' } },
  };
  // compounds that contain oxygen (for the element summary)
  const ORGO = { benzoic: 1, salicylic: 1, oxalic: 1, cinnamic: 1, phenol: 1, naphthol: 1, resorcinol: 1, acetanilide: 1, benzamide: 1, urea: 1, glucose: 1, dnb: 1, sulfanilic: 1, acetone: 1, ethanol: 1, benzaldehyde: 1, acetophenone: 1, nitrobenzene: 1 };
  const OT = [
    ['look', 'Preliminary', 'Appearance and odour'], ['mpbp', 'Preliminary', 'Melting or boiling point'], ['sol', 'Preliminary', 'Solubility (water, NaOH, NaHCO₃, HCl)'], ['lass', 'Preliminary', 'Lassaigne’s test (N, S, halogens)'],
    ['nahco3', 'Functional groups', 'NaHCO₃ solution'], ['fecl3', 'Functional groups', 'Neutral FeCl₃'], ['br2', 'Functional groups', 'Bromine water'], ['kmno4', 'Functional groups', 'Dilute KMnO₄ (Baeyer)'],
    ['dnp', 'Functional groups', '2,4-Dinitrophenylhydrazine'], ['tollens', 'Functional groups', 'Tollens’ reagent'], ['fehling', 'Functional groups', 'Fehling’s solution'], ['iodoform', 'Functional groups', 'Iodoform test (I₂ + NaOH)'],
    ['can', 'Functional groups', 'Ceric ammonium nitrate'], ['naohheat', 'Functional groups', 'Warm with NaOH (amide test)'], ['azo', 'Functional groups', 'Diazotisation + β-naphthol (azo dye)'], ['carbylamine', 'Functional groups', 'Carbylamine test'],
    ['nitro', 'Functional groups', 'Mulliken–Barker (nitro)'], ['molisch', 'Functional groups', 'Molisch’s test'], ['biuret', 'Functional groups', 'Biuret test'], ['phthalein', 'Functional groups', 'Phthalein test'],
  ];
  const NEG = { nahco3: 'No effervescence.', fecl3: 'No characteristic colour.', br2: 'Bromine colour remains.', kmno4: 'Purple colour remains.', dnp: 'No precipitate.', tollens: 'No silver mirror.', fehling: 'Blue colour remains; no red precipitate.', iodoform: 'No yellow precipitate.', can: 'No colour change (stays yellow).', naohheat: 'No ammonia evolved.', azo: 'No dye formed.', carbylamine: 'No offensive odour.', nitro: 'No black precipitate.', molisch: 'No violet ring.', biuret: 'No violet colour.', phthalein: 'No characteristic colour or fluorescence.' };
  const SOLW = { s: 'soluble', p: 'sparingly soluble', i: 'insoluble', e: 'soluble with effervescence' };
  function orgObserve(id, test) {
    const o = ORG[id];
    if (test === 'look') return o.state;
    if (test === 'mpbp') return o.liquid ? 'Boils at ' + (o.bp - 0.5 + Math.random()).toFixed(0) + '–' + (o.bp + 1).toFixed(0) + ' °C.' : o.mp > 250 ? 'Does not melt below 280 °C; darkens and decomposes.' : 'Melts sharply at ' + (o.mp - 1).toFixed(0) + '–' + o.mp.toFixed(0) + ' °C.' + (o.note ? ' (' + o.note + ')' : '');
    if (test === 'sol') { const t = ['water', '5 % NaOH', '5 % NaHCO₃', '5 % HCl'], s = o.sol.split(''); if (o.t.nahco3 && s[2] === 's') s[2] = 'e'; return t.map((x, i) => x + ': ' + SOLW[s[i]]).join('; ') + '.' + (s[0] === 's' ? ' (Soluble in water, so solubility in the acid and base solutions says nothing about acidity: use the NaHCO₃ effervescence and functional-group tests.)' : ''); }
    if (test === 'lass') { const e = o.el; return 'Nitrogen: ' + (e.includes('N') ? 'Prussian-blue colour (present)' : 'no blue colour (absent)') + '. Sulfur: ' + (e.includes('S') ? 'violet with sodium nitroprusside; black PbS with lead acetate (present)' : 'no violet colour (absent)') + '. Halogen: ' + (e.includes('Cl') ? 'white precipitate with AgNO₃ after boiling with HNO₃, soluble in NH₃ (chlorine present)' : 'no precipitate with AgNO₃ (absent)') + '.'; }
    return o.t[test] || NEG[test];
  }
  PX.add({
    id: 'organic-id', area: 'Organic chemistry', title: 'Identify an organic compound', short: 'Lassaigne’s test, solubility, functional groups, mp/bp', noCanvas: true,
    steps: ['Start with the preliminary tests: appearance and odour, melting or boiling point, and solubility in water, NaOH, NaHCO₃ and HCl. Solubility classifies the compound: acids dissolve in NaOH (strong acids also in NaHCO₃), bases in HCl, neutral compounds in neither.', 'Lassaigne’s test: fuse with sodium so that N, S and halogens become NaCN, Na₂S and NaX, which are tested in the aqueous extract.', 'Then do only the functional-group tests that make sense for what you have found.', 'Finally compare your observations and the melting or boiling point with the candidates and name the compound.'],
    custom(api, S) {
      const st = (S.o = { id: pick(Object.keys(ORG)), log: [] });
      const render = () => {
        let grp = '', h = '';
        OT.forEach(([id, g, label]) => { if (g !== grp) { grp = g; h += '<p class="lbl" style="margin:8px 0 4px;width:100%;font-size:.72rem;letter-spacing:.1em;color:var(--faint);text-transform:uppercase;font-weight:700">' + g + '</p>'; } h += btn(id, label, false, st.log.some((x) => x.id === id) ? ' aria-pressed="true"' : ''); });
        api.$('actions').innerHTML = h + '<p style="width:100%;margin:6px 0 0"></p>' + btn('new', 'New unknown');
        api.table('Notebook (' + st.log.length + ' tests)', [{ k: 'label', label: 'Test' }, { k: 'obs', label: 'Observation' }], st.log);
      };
      api.$('actions').onclick = (ev) => {
        const b = ev.target.closest('[data-a]'); if (!b) return;
        if (b.dataset.a === 'new') { st.id = pick(Object.keys(ORG)); st.log = []; render(); api.msg(''); return; }
        const t = OT.find((x) => x[0] === b.dataset.a), obs = orgObserve(st.id, t[0]);
        if (!st.log.some((x) => x.id === t[0])) st.log.push({ id: t[0], label: t[2], obs });
        api.msg('<b>' + esc(t[2]) + ':</b> ' + esc(obs)); render();
      };
      const names = Object.keys(ORG).map((k) => ORG[k].name).sort();
      api.custom('<h4 class="lbl-sum" style="padding-top:14px">Your conclusion</h4><div class="answer-form">' + sel('oN', 'The compound is', [['', 'choose…']].concat(names.map((n) => [n, n])), '') + '<button type="button" class="btn-sm primary" id="oCheck">Check</button></div><div id="oVerdict"></div>');
      api.$('oCheck').onclick = () => {
        const v = api.$('oN').value, o = ORG[st.id]; if (!v) return;
        const ok = v === o.name, keyTests = Object.keys(o.t).map((k) => OT.find((x) => x[0] === k)[2] + ': ' + o.t[k]);
        api.$('oVerdict').innerHTML = '<div class="callout ' + (ok ? 'ok' : 'bad') + '">' + (ok ? 'Correct: ' : 'Not quite. It was ') + '<b>' + esc(o.name) + '</b>' + (o.liquid ? ' (b.p. ' + o.bp + ' °C)' : o.mp > 250 ? '' : ' (m.p. ' + o.mp + ' °C)') + '.</div><div class="work-lines">' + ['Elements: ' + ['C', 'H'].concat(ORGO[st.id] ? ['O'] : [], o.el.split('').filter(Boolean)).join(', '), 'Solubility: ' + orgObserve(st.id, 'sol')].concat(keyTests.length ? keyTests : ['No functional-group test is positive: a neutral hydrocarbon or aryl halide; the m.p./b.p. and Lassaigne’s test decide.']).map(esc).join('<br>') + '</div>';
      };
      render();
    },
  });

  // ================================================================ melting and boiling points
  const MPS = { benzoic: ['benzoic acid', 122], naphthol: ['β-naphthol', 123], urea: ['urea', 133], cinnamic: ['cinnamic acid', 133] };
  const BPS = { acetone: ['acetone', 56], methanol: ['methanol', 65], ethanol: ['ethanol', 78], chlorobenzene: ['chlorobenzene', 132] };
  const SYN = { benzoic: ['benzoicacid', 'benzenecarboxylicacid'], naphthol: ['βnaphthol', 'betanaphthol', 'bnaphthol', '2naphthol', 'naphthalen2ol', '2hydroxynaphthalene'], urea: ['urea', 'carbamide'], cinnamic: ['cinnamicacid', '3phenylpropenoicacid', '3phenylprop2enoicacid', 'transcinnamicacid'], acetone: ['acetone', 'propanone', 'dimethylketone'], methanol: ['methanol', 'methylalcohol'], ethanol: ['ethanol', 'ethylalcohol'], chlorobenzene: ['chlorobenzene', 'phenylchloride'] };
  const nameOK = (v, key) => { const t = v.toLowerCase().replace(/[^a-zβ0-9]/g, ''); return SYN[key].some((x) => t === x || t === x.replace('acid', '')); };
  PX.add({
    id: 'mp-bp', area: 'Organic chemistry', title: 'Melting point and boiling point', short: 'Capillary melting point, mixed m.p., Siwoloboff b.p.', aspect: 0.55,
    steps: ['Melting point: a little dry, powdered sample in a capillary sealed at one end, tied to the thermometer bulb in a Thiele tube (liquid paraffin). Heat quickly to about 15 °C below the expected m.p., then only 1–2 °C per minute.', 'Record the temperature when the first liquid appears and when the last solid disappears. A pure compound melts sharply (within 1–2 °C); impurities lower and broaden the range.', 'Mixed melting point: mix the unknown with an authentic sample. If they are the same compound the m.p. is unchanged; if different, it is depressed and broad.', 'Boiling point (Siwoloboff): a few drops in a fusion tube with an inverted capillary. Heat until a rapid stream of bubbles leaves the capillary, stop heating, and record the temperature at which bubbling stops and the liquid is sucked into the capillary: there the vapour pressure equals the atmospheric pressure.'],
    custom(api, S) {
      const st = (S.m = { mode: 'mp', unk: pick(Object.keys(MPS)), unkL: pick(Object.keys(BPS)), sample: 'unk', rate: 2, T: 95, run: 0, rec: [], phase: 0, heating: false, cool: false });
      const truthMp = () => { const u = MPS[st.unk][1]; if (st.sample === 'unk') return [u - 0.6, u + 0.4]; const same = st.sample === st.unk; return same ? [u - 0.6, u + 0.4] : [u - 11, u - 5]; };
      const render = () => {
        const sampleOpts = st.mode === 'mp' ? [['unk', 'unknown'], ...Object.keys(MPS).map((k) => [k, 'unknown + authentic ' + MPS[k][0] + ' (1 : 1)'])] : [['unkL', 'unknown liquid']];
        api.$('params').innerHTML = '<div class="two-col">' + sel('mMode', 'Measurement', [['mp', 'Melting point (Thiele tube)'], ['bp', 'Boiling point (Siwoloboff)']], st.mode) + sel('mS', 'Sample', sampleOpts, st.mode === 'mp' ? st.sample : 'unkL') + (st.mode === 'mp' ? sel('mR', 'Heating rate near the m.p.', [['2', '2 °C per minute (correct)'], ['10', '10 °C per minute (too fast)']], String(st.rate)) : '') + '</div>';
        api.$('actions').innerHTML = st.mode === 'mp' ? btn('heat', st.heating ? 'Pause heating' : 'Heat', true) + btn('start', 'First liquid appears') + btn('end', 'All melted') + btn('reset', 'New capillary') : btn('heat', st.heating ? 'Stop heating' : 'Heat', true) + btn('bpRec', 'Liquid enters the capillary') + btn('reset', 'Start again');
        api.table('Readings', [{ k: 'what', label: 'Sample' }, { k: 'r', label: 'Observed' }], st.rec);
        api.readouts([['Thermometer', st.T.toFixed(1) + ' °C'], ['Possible unknowns', st.mode === 'mp' ? Object.values(MPS).map((x) => x[0]).join(', ') : Object.values(BPS).map((x) => x[0] + ' (' + x[1] + ')').join(', ')]]);
      };
      const reset = () => { st.T = st.mode === 'mp' ? 95 : 40; st.heating = false; st.cool = false; st.phase = 0; st.s0 = null; render(); };
      api.$('params').oninput = (ev) => { if (ev.target.id === 'mMode') { st.mode = ev.target.value; reset(); } if (ev.target.id === 'mS') { st.sample = ev.target.value; reset(); } if (ev.target.id === 'mR') st.rate = +ev.target.value; };
      api.$('actions').onclick = (ev) => {
        const b = ev.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a;
        if (a === 'reset') { reset(); api.msg(''); return; }
        if (a === 'heat') { if (st.mode === 'bp' && st.heating) { st.heating = false; st.cool = true; } else st.heating = !st.heating; render(); return; }
        const label = st.mode === 'mp' ? (st.sample === 'unk' ? 'unknown' : 'unknown + ' + MPS[st.sample][0]) : 'unknown liquid';
        if (a === 'start') { st.s0 = st.T; api.msg('First liquid noted at ' + st.T.toFixed(1) + ' °C.'); }
        if (a === 'end') { if (st.s0 == null) { api.msg('Note the start of melting first.', 'warn'); return; } st.rec.push({ what: label + (st.rate === 10 ? ' (fast heating)' : ''), r: st.s0.toFixed(1) + '–' + st.T.toFixed(1) + ' °C' }); st.heating = false; api.msg('Melting range ' + st.s0.toFixed(1) + '–' + st.T.toFixed(1) + ' °C recorded.'); st.s0 = null; }
        if (a === 'bpRec') { st.rec.push({ what: label, r: 'b.p. ' + st.T.toFixed(1) + ' °C' }); api.msg('Boiling point ' + st.T.toFixed(1) + ' °C recorded.'); }
        render(); answer();
      };
      const answer = () => {
        if (st.mode === 'mp') api.answer([{ id: 'n', label: 'The unknown solid is', text: true, accept: (v) => nameOK(v, st.unk), truthText: MPS[st.unk][0] + ' (m.p. ' + MPS[st.unk][1] + ' °C)' }], ['Two candidates melt at almost the same temperature, so the melting point alone cannot decide.', 'Mixed with the authentic sample of the same compound the m.p. is unchanged; mixed with the other it is lowered by several degrees and the range is broad (the second compound acts as an impurity).']);
        else api.answer([{ id: 'n', label: 'The unknown liquid is', text: true, accept: (v) => nameOK(v, st.unkL), truthText: BPS[st.unkL][0] + ' (b.p. ' + BPS[st.unkL][1] + ' °C)' }], ['The candidates boil at 56 (acetone), 65 (methanol), 78 (ethanol) and 132 °C (chlorobenzene): a careful Siwoloboff reading (±1 °C) separates them.', 'Liquids with boiling points within a few degrees of each other (e.g. ethyl acetate 77 °C and ethanol 78 °C) cannot be told apart this way: a chemical test is then needed.']);
      };
      S.mpTick = (dt) => {
        if (st.mode === 'mp') {
          if (st.heating) { const rate = st.T < MPS[st.unk][1] - 15 ? 60 : st.rate; st.T += (rate / 60) * dt * 20; }   // shown twenty times faster than real time
          if (st.heating && st.T > 160) st.heating = false;
        } else {
          const bp = BPS[st.unkL][1];
          if (st.heating) st.T += 0.8 * dt * 5; else if (st.cool) st.T -= 0.3 * dt * 5;
          if (st.T > bp + 25) st.heating = false;
          if (st.T < 25) st.cool = false;
        }
        if (Math.random() < 0.1) api.readouts([['Thermometer', st.T.toFixed(1) + ' °C'], ['Possible unknowns', st.mode === 'mp' ? Object.values(MPS).map((x) => x[0]).join(', ') : Object.values(BPS).map((x) => x[0] + ' (' + x[1] + ')').join(', ')]]);
      };
      S.mpState = () => {
        if (st.mode === 'mp') { const [a, b] = truthMp(), lag = 0.3 * (st.T < MPS[st.unk][1] - 15 ? 0 : st.rate), Ts = st.T - lag; return { melt: Math.max(0, Math.min(1, (Ts - a) / (b - a))) }; }
        const bp = BPS[st.unkL][1]; return { bubbles: st.T > bp ? Math.min(1, (st.T - bp) / 4) : 0, entered: !st.heating && st.cool && st.T < bp };
      };
      reset(); answer();
    },
    draw(g, w, h, s, c, S) {
      const st = S.m; if (!st) return; const dt = Math.min(0.1, S.t - (st.lt || S.t)); st.lt = S.t; S.mpTick && S.mpTick(dt); const ms = S.mpState();
      // Thiele tube outline
      g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 3; g.beginPath(); g.moveTo(w * 0.42, h * 0.08); g.lineTo(w * 0.42, h * 0.82); g.quadraticCurveTo(w * 0.42, h * 0.95, w * 0.5, h * 0.95); g.quadraticCurveTo(w * 0.62, h * 0.95, w * 0.62, h * 0.7); g.lineTo(w * 0.62, h * 0.45); g.quadraticCurveTo(w * 0.62, h * 0.32, w * 0.54, h * 0.32); g.stroke(); g.lineWidth = 1;
      g.fillStyle = 'rgba(240,220,160,.25)'; g.fillRect(w * 0.425, h * 0.3, w * 0.04, h * 0.6);
      K.thermo(g, w * 0.445, h * 0.06, h * 0.72, st.T, 20, 220);
      if (st.mode === 'mp') {
        g.strokeStyle = 'rgba(255,255,255,.7)'; g.strokeRect(w * 0.47, h * 0.52, 6, h * 0.22);
        const m = ms.melt; g.fillStyle = m >= 1 ? 'rgba(235,235,225,.6)' : 'rgba(250,250,250,.95)'; g.fillRect(w * 0.47 + 1, h * 0.66, 4, h * 0.07);
        if (m > 0 && m < 1) { g.fillStyle = 'rgba(200,225,250,.8)'; g.fillRect(w * 0.47 + 1, h * 0.73 - h * 0.07 * m, 4, h * 0.07 * m); }
        K.label(g, w, m <= 0 ? 'solid' : m >= 1 ? 'clear liquid' : 'melting…', w * 0.52, h * 0.7);
      } else {
        g.strokeStyle = 'rgba(255,255,255,.7)'; g.strokeRect(w * 0.47, h * 0.5, 10, h * 0.24); g.fillStyle = 'rgba(200,225,250,.7)'; g.fillRect(w * 0.47 + 1, h * 0.62, 8, h * 0.12);
        g.strokeRect(w * 0.47 + 3, h * 0.52, 4, h * 0.2); if (ms.entered) { g.fillStyle = 'rgba(200,225,250,.9)'; g.fillRect(w * 0.47 + 4, h * 0.6, 2, h * 0.12); }
        for (let i = 0; i < 8 * ms.bubbles; i++) { const p = (S.t * 2 + i * 0.13) % 1; g.fillStyle = 'rgba(255,255,255,.8)'; g.beginPath(); g.arc(w * 0.47 + 5, h * 0.72 - p * h * 0.1, 1.6, 0, 6.283); g.fill(); }
        K.label(g, w, ms.entered ? 'bubbling stopped: liquid enters the capillary' : ms.bubbles > 0 ? 'stream of bubbles' : '', w * 0.52, h * 0.7);
      }
      K.display(g, w, st.T.toFixed(1) + ' °C', 12, 12, Math.min(w * 0.28, 170));
      if (st.heating) { for (let i = 0; i < 4; i++) { g.fillStyle = 'rgba(80,140,255,.6)'; g.beginPath(); g.ellipse(w * 0.6 + i * 6, h * 0.98, 3, 8 + Math.sin(S.t * 14 + i) * 3, 0, 0, 6.283); g.fill(); } }
    },
  });

  // ================================================================ separation of a binary mixture
  const SEP = {
    benzoic: { name: 'benzoic acid', kind: 'acid', mp: 122 }, naphthol: { name: 'β-naphthol', kind: 'phenol', mp: 123 }, toluidine: { name: 'p-toluidine', kind: 'base', mp: 44 }, naphthalene: { name: 'naphthalene', kind: 'neutral', mp: 80 },
  };
  const MIXES = [['benzoic', 'naphthalene'], ['naphthol', 'naphthalene'], ['toluidine', 'naphthalene'], ['benzoic', 'naphthol']];
  const extracts = { nahco3: ['acid'], naoh: ['acid', 'phenol'], hcl: ['base'] };
  const RNAME = { nahco3: '5 % NaHCO₃', naoh: '5 % NaOH', hcl: '5 % HCl' };
  PX.add({
    id: 'separation', area: 'Organic chemistry', title: 'Separation of a binary mixture', short: 'Acid–base extraction, recovery, purity by m.p.', aspect: 0.5,
    steps: ['1.00 g of the mixture is dissolved in 30 mL diethyl ether in a separating funnel.', 'Shake with an aqueous reagent and run off the lower aqueous layer. A carboxylic acid (pK_a ≈ 4) is turned into its water-soluble salt by NaHCO₃ or NaOH; a phenol (pK_a ≈ 10) only by NaOH; an amine (pK_aH ≈ 5) by HCl. Neutral compounds stay in the ether.', 'Recover each compound: acidify the NaHCO₃/NaOH extract (or basify the HCl extract) so the free compound precipitates; filter and dry. Evaporate the ether for the neutral compound.', 'Check purity by melting point. Choose the reagent so that each extract contains only one compound.'],
    custom(api, S) {
      const st = (S.sp = {});
      const setup = () => { const m = pick(MIXES); st.a = m[0]; st.b = m[1]; st.fa = Number((0.35 + Math.random() * 0.3).toFixed(2)); st.ether = { [st.a]: st.fa, [st.b]: 1 - st.fa }; st.ext = []; st.out = []; render(); api.msg(''); api.answer(null); };
      const render = () => {
        api.$('actions').innerHTML = Object.keys(RNAME).map((r) => btn('x_' + r, 'Shake with ' + RNAME[r] + ', run off'), false).join('') + st.ext.map((e, i) => btn('r_' + i, 'Recover from extract ' + (i + 1) + ' (' + (e.r === 'hcl' ? 'add NaOH' : 'add HCl') + ')', false, e.done ? ' disabled' : '')).join('') + btn('evap', 'Evaporate the ether layer', false, st.evap ? ' disabled' : '') + btn('reset', 'New mixture');
        api.table('Products', [{ k: 'src', label: 'From' }, { k: 'm', label: 'mass / g', dp: 3 }, { k: 'mp', label: 'melting point' }], st.out);
        api.readouts([['Mixture', '1.00 g, two components'], ['Ether layer', Object.keys(st.ether).filter((k) => st.ether[k] > 0.005).length + ' compound(s) left']]);
      };
      const mpOf = (parts) => { const ks = Object.keys(parts).filter((k) => parts[k] > 0.002), tot = ks.reduce((a, k) => a + parts[k], 0); if (ks.length === 1) return SEP[ks[0]].mp - 1 + '–' + SEP[ks[0]].mp + ' °C (sharp)'; const main = ks.reduce((a, k) => (parts[k] > parts[a] ? k : a)), imp = 1 - parts[main] / tot; return (SEP[main].mp - 3 - imp * 40).toFixed(0) + '–' + (SEP[main].mp - 1 - imp * 15).toFixed(0) + ' °C (low, broad: impure)'; };
      api.$('actions').onclick = (ev) => {
        const b = ev.target.closest('[data-a]'); if (!b || b.disabled) return; const a = b.dataset.a;
        if (a === 'reset') { st.evap = false; setup(); return; }
        if (a.startsWith('x_')) {
          const r = a.slice(2), took = {}; let any = false;
          Object.keys(st.ether).forEach((k) => { if (extracts[r].includes(SEP[k].kind) && st.ether[k] > 0) { const x = st.ether[k] * 0.93; took[k] = x; st.ether[k] -= x; any = true; } });
          st.ext.push({ r, parts: took, done: false }); S.anim = { t: 0, dur: 1.6, kind: 'shake' };
          api.msg('Extract ' + st.ext.length + ' (' + RNAME[r] + ') collected. ' + (any ? 'Something has passed into the aqueous layer.' : 'Nothing in the ether layer reacts with ' + RNAME[r] + ', so the extract contains no organic compound.'), any ? '' : 'warn');
        }
        if (a.startsWith('r_')) { const e = st.ext[+a.slice(2)], tot = Object.values(e.parts).reduce((x, y) => x + y, 0); e.done = true; if (tot < 0.005) { api.msg('Nothing precipitates: this extract contained no organic compound.', 'warn'); } else { const m = tot * (0.9 + Math.random() * 0.05); st.out.push({ src: 'extract ' + (+a.slice(2) + 1) + ' (' + RNAME[e.r] + ')', m, mp: mpOf(e.parts), parts: e.parts }); api.msg('A solid precipitated, was filtered and dried.'); } }
        if (a === 'evap') { st.evap = true; const tot = Object.values(st.ether).reduce((x, y) => x + y, 0); st.out.push({ src: 'ether layer (neutral)', m: tot * 0.94, mp: mpOf(st.ether), parts: { ...st.ether } }); api.msg('The ether was evaporated (no flames nearby: ether is extremely flammable).'); }
        render();
        if (st.out.length >= 2) {
          const ka = SEP[st.a].name;
          api.answer([{ id: 'p', label: 'Percentage of ' + ka + ' in the mixture (from your recovered masses)', unit: '% w/w', truth: st.fa * 100, dp: 0, abs: true, tol: 6 }], () => [`The mixture was ${SEP[st.a].name} (${SEP[st.a].kind}) + ${SEP[st.b].name} (${SEP[st.b].kind}).`, `Correct choice: ${SEP[st.a].kind === 'acid' && SEP[st.b].kind === 'phenol' ? 'NaHCO₃ (takes only the carboxylic acid; NaOH would take both)' : SEP[st.a].kind === 'base' ? 'HCl (takes the amine)' : SEP[st.a].kind === 'phenol' ? 'NaOH (a phenol is too weak an acid for NaHCO₃)' : 'NaHCO₃ or NaOH'}.`, `% = mass of ${ka} / total mass recovered × 100 (some is always lost; using the sum of recovered masses corrects for this).`]);
        }
      };
      setup();
    },
    draw(g, w, h, s, c, S) {
      const st = S.sp; if (!st) return; const an = S.anim && S.anim.kind === 'shake' ? S.anim : null, wob = an ? Math.sin(an.t * 30) * 6 * (1 - an.t / an.dur) : 0, x = w * 0.42 + wob, top = h * 0.08;
      g.save(); g.translate(x, 0);
      g.beginPath(); g.moveTo(-10, top); g.lineTo(-10, top + 18); g.quadraticCurveTo(-w * 0.11, h * 0.32, -w * 0.07, h * 0.62); g.lineTo(-5, h * 0.78); g.lineTo(5, h * 0.78); g.lineTo(w * 0.07, h * 0.62); g.quadraticCurveTo(w * 0.11, h * 0.32, 10, top + 18); g.lineTo(10, top); g.closePath();
      g.save(); g.clip(); g.fillStyle = K.rgba('#f4eedd', 0.8); g.fillRect(-w, h * 0.28, 2 * w, h * 0.22); g.fillStyle = K.rgba('#cfe6f5', 0.85); g.fillRect(-w, h * 0.5, 2 * w, h); g.restore();
      g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.stroke(); g.lineWidth = 1; g.fillStyle = '#c9b8e6'; g.fillRect(-3, h * 0.78, 6, h * 0.12); g.restore();
      K.label(g, w, 'ether layer (top, ρ 0.71)', x + w * 0.12, h * 0.4); K.label(g, w, 'aqueous layer (bottom)', x + w * 0.12, h * 0.6);
      st.ext.forEach((e, i) => { K.beaker(g, w * 0.66 + i * w * 0.07, h * 0.95, w * 0.05, h * 0.18, '#cfe6f5', 0.6); K.label(g, w, String(i + 1), w * 0.685 + i * w * 0.07, h * 0.74, null, 'center'); });
    },
  });

  // ================================================================ organic preparations
  const OPREP = {
    acetanilide: { name: 'Acetanilide (acetylation of aniline)', start: 'aniline', Ms: 93.13, rho: 1.022, unitIn: 'mL', Mp: 135.17, mp: 114, m0: 5.0,
      eq: 'C₆H₅NH₂ + (CH₃CO)₂O → C₆H₅NHCOCH₃ + CH₃COOH',
      steps: ['Mix the aniline with glacial acetic acid', 'Add acetic anhydride slowly with shaking (exothermic)', 'Warm on a water bath for 15 min', 'Pour into ice-cold water with stirring: white solid', 'Filter at the pump and wash with cold water', 'Recrystallise from hot water and dry'], cond: [['c1', 'Recrystallisation', [['ok', 'from hot water (charcoal if coloured)'], ['skip', 'skip: dry the crude product']]]], eff: { skip: [1.08, -5, 'Crude acetanilide still contains acetic acid and oxidised aniline: heavier, coloured, low m.p.'] } },
    pnitro: { name: 'p-Nitroacetanilide (nitration)', start: 'acetanilide', Ms: 135.17, unitIn: 'g', Mp: 180.16, mp: 215, m0: 3.0,
      eq: 'C₆H₅NHCOCH₃ + HNO₃ → p-O₂N–C₆H₄NHCOCH₃ + H₂O (H₂SO₄ forms the NO₂⁺ electrophile)',
      steps: ['Dissolve acetanilide in glacial acetic acid, then add conc. H₂SO₄', 'Cool the flask in ice to below 5 °C', 'Add the cold nitrating mixture (conc. HNO₃ + conc. H₂SO₄) dropwise', 'Stand at room temperature for 30 min', 'Pour onto crushed ice: pale yellow solid', 'Filter, wash well with cold water, recrystallise from ethanol'], cond: [['c1', 'Temperature during addition', [['ok', 'kept below 10 °C'], ['hot', 'allowed to rise to 40 °C']]]], eff: { hot: [0.7, -25, 'Above about 10 °C more ortho-isomer and dinitration products form and some amide is hydrolysed: low yield, low m.p.'] } },
    pbromo: { name: 'p-Bromoacetanilide (bromination)', start: 'acetanilide', Ms: 135.17, unitIn: 'g', Mp: 214.06, mp: 168, m0: 3.0,
      eq: 'C₆H₅NHCOCH₃ + Br₂ → p-Br–C₆H₄NHCOCH₃ + HBr',
      steps: ['Dissolve acetanilide in glacial acetic acid', 'Add bromine in acetic acid dropwise with shaking (fume cupboard)', 'Stand 15 min at room temperature', 'Pour into water; add a little NaHSO₃ to remove excess bromine', 'Filter and wash with water', 'Recrystallise from ethanol and dry'], cond: [['c1', 'Bromine', [['ok', 'one equivalent'], ['ex', 'large excess']]]], eff: { ex: [1.0, -8, 'Excess bromine gives some dibromination; the product is yellowish and melts low.'] } },
    aspirin: { name: 'Aspirin (acetylation of salicylic acid)', start: 'salicylic acid', Ms: 138.12, unitIn: 'g', Mp: 180.16, mp: 135, m0: 2.0,
      eq: 'HOC₆H₄COOH + (CH₃CO)₂O → CH₃COOC₆H₄COOH + CH₃COOH',
      steps: ['Mix salicylic acid with acetic anhydride', 'Add 2–3 drops of conc. H₂SO₄ (catalyst)', 'Warm at 60 °C for 15 min', 'Add cold water to destroy excess anhydride, cool in ice', 'Filter and wash with ice-cold water', 'Recrystallise (ethanol/water) and dry; test with FeCl₃'], cond: [['c1', 'Drying', [['ok', 'in air / desiccator'], ['oven', 'in an oven at 110 °C, moist']]]], eff: { oven: [0.85, -10, 'Moist aspirin hydrolyses back to salicylic acid when heated: lower yield, and FeCl₃ now gives a violet colour.'] } },
    benzoicacid: { name: 'Benzoic acid (hydrolysis of ethyl benzoate)', start: 'ethyl benzoate', Ms: 150.17, rho: 1.045, unitIn: 'mL', Mp: 122.12, mp: 122, m0: 3.0,
      eq: 'C₆H₅COOC₂H₅ + NaOH → C₆H₅COONa + C₂H₅OH; C₆H₅COONa + HCl → C₆H₅COOH + NaCl',
      steps: ['Reflux the ester with 10 % NaOH for 45 min (until no oily drops remain)', 'Cool the solution', 'Acidify with conc. HCl: white benzoic acid precipitates', 'Cool in ice', 'Filter and wash with cold water', 'Recrystallise from hot water and dry'], cond: [['c1', 'Acidification', [['ok', 'until acidic to Congo red'], ['part', 'only until neutral']]]], eff: { part: [0.5, 0, 'At pH 7 most benzoic acid (pK_a 4.2) stays in solution as benzoate: the solution must be clearly acidic.'] } },
    sudan: { name: '1-Phenylazo-2-naphthol (diazo coupling)', start: 'aniline', Ms: 93.13, rho: 1.022, unitIn: 'mL', Mp: 248.28, mp: 131, m0: 2.0,
      eq: 'C₆H₅NH₂ + HNO₂ + HCl → C₆H₅N₂⁺Cl⁻ + 2H₂O; then + β-naphthol (in NaOH) → C₆H₅–N=N–C₁₀H₆OH',
      steps: ['Dissolve aniline in dilute HCl and cool to 0–5 °C', 'Add cold NaNO₂ solution dropwise (keep below 5 °C): benzenediazonium chloride', 'Dissolve β-naphthol in NaOH and cool in ice', 'Add the diazonium solution slowly to the naphthol solution with stirring: orange-red precipitate', 'Filter and wash with water', 'Recrystallise from ethanol and dry'], cond: [['c1', 'Diazotisation temperature', [['ok', '0–5 °C'], ['warm', 'room temperature (25 °C)']]]], eff: { warm: [0.45, -15, 'Above 5 °C the diazonium salt decomposes to phenol and N₂: little dye forms, and it is contaminated.'] } },
  };
  PX.add({
    id: 'organic-prep', area: 'Organic chemistry', title: 'Organic preparations', short: 'Acetylation, nitration, bromination, hydrolysis, diazo coupling', aspect: 0.42,
    steps: ['Choose a preparation and the amount of starting material.', 'Carry out the steps in order (the buttons are shuffled) and choose the conditions. Conditions matter: a wrong temperature or a skipped recrystallisation changes the yield and the purity.', 'Theoretical yield from the limiting reagent and the equation; % yield = actual / theoretical × 100.', 'Check purity by melting point against the literature value.'],
    custom(api, S) {
      const st = (S.op = { k: 'acetanilide', amt: null });
      const setup = () => { const d = OPREP[st.k]; st.amt = st.amt || d.m0; st.done = []; st.cond = {}; d.cond.forEach((c) => (st.cond[c[0]] = 'ok')); st.order = d.steps.map((x, i) => i).sort(() => Math.random() - 0.5); st.final = null; render(); api.msg(''); api.answer(null); };
      const render = () => {
        const d = OPREP[st.k];
        api.$('params').innerHTML = '<div class="two-col">' + sel('opK', 'Preparation', Object.keys(OPREP).map((k) => [k, OPREP[k].name]), st.k) + '<div class="field"><label for="opA">Amount of ' + d.start + ' <output>' + d.unitIn + '</output></label><input type="number" id="opA" step="0.1" min="0.5" max="20" value="' + st.amt + '"></div>' + d.cond.map((c) => sel('opC_' + c[0], c[1], c[2], st.cond[c[0]])).join('') + '</div><p class="sub">' + esc(d.eq) + '</p>';
        api.$('actions').innerHTML = st.order.map((i) => btn('s' + i, d.steps[i], false, st.done.includes(i) ? ' disabled' : '')).join('') + btn('reset', 'Start again');
        api.table('Procedure followed', [{ k: 'n', label: '#', dp: 0 }, { k: 'w', label: 'Step' }], st.done.map((i, n) => ({ n: n + 1, w: d.steps[i] })));
      };
      api.$('params').oninput = (ev) => { const id = ev.target.id; if (id === 'opK') { st.k = ev.target.value; st.amt = OPREP[st.k].m0; setup(); } else if (id === 'opA') { const v = parseFloat(ev.target.value); if (v > 0) st.amt = v; } else if (id.startsWith('opC_')) st.cond[id.slice(4)] = ev.target.value; };
      api.$('actions').onclick = (ev) => {
        const b = ev.target.closest('[data-a]'); if (!b || b.disabled) return; const d = OPREP[st.k], a = b.dataset.a;
        if (a === 'reset') { setup(); return; }
        const i = +a.slice(1); if (i !== st.done.length) { api.msg('Not yet: think about what has to happen before “' + esc(d.steps[i]) + '”.', 'warn'); return; }
        st.done.push(i); S.anim = { t: 0, dur: 1.2 };
        if (st.done.length === d.steps.length) {
          const mol = d.unitIn === 'mL' ? (st.amt * d.rho) / d.Ms : st.amt / d.Ms, theo = mol * d.Mp;
          let f = 0.68 + Math.random() * 0.15, dmp = 0; const notes = [];
          Object.keys(st.cond).forEach((k) => { const e = d.eff[st.cond[k]]; if (e) { f *= e[0]; dmp += e[1]; notes.push(e[2]); } });
          const actual = Number((theo * f).toFixed(3)), mpA = d.mp + dmp - 1, mpB = d.mp + dmp + (dmp ? 3 : 0);
          st.final = { theo, actual };
          api.msg('Product: <b>' + actual.toFixed(3) + ' g</b>, m.p. ' + mpA + '–' + mpB + ' °C (literature ' + d.mp + ' °C).' + (notes.length ? '<br>' + notes.map(esc).join(' ') : ' Sharp m.p.: the product is pure.'), notes.length ? 'warn' : 'ok');
          api.answer([{ id: 'th', label: 'Theoretical yield', unit: 'g', truth: theo, dp: 3, tol: 0.02 }, { id: 'py', label: 'Percentage yield', unit: '%', truth: (actual / theo) * 100, dp: 1, abs: true, tol: 1 }],
            [d.eq, (d.unitIn === 'mL' ? `${st.amt} mL × ${d.rho} g/mL = ${(st.amt * d.rho).toFixed(3)} g; ` : '') + `moles of ${d.start} = ${mol.toFixed(5)} mol (limiting reagent, 1 : 1)`, `theoretical = ${mol.toFixed(5)} × ${d.Mp} = ${theo.toFixed(3)} g`, `% yield = ${actual.toFixed(3)} / ${theo.toFixed(3)} × 100 = ${((actual / theo) * 100).toFixed(1)} %`]);
        } else api.msg('Done: ' + esc(d.steps[i]) + '.');
        render();
      };
      setup();
    },
    draw(g, w, h, s, c, S) {
      const st = S.op; if (!st) return; const d = OPREP[st.k], n = st.done ? st.done.length : 0;
      const prod = { acetanilide: '#f6f6f2', pnitro: '#f0e6a8', pbromo: '#f4f2ea', aspirin: '#f8f8f8', benzoicacid: '#fafafa', sudan: '#e0602a' }[st.k];
      K.beaker(g, w * 0.36, h * 0.9, w * 0.28, h * 0.7, n >= 4 ? '#e8eef2' : '#efe9d8', 0.5);
      if (n >= 4) for (let i = 0; i < 34; i++) { g.fillStyle = K.rgba(prod, 0.95); g.fillRect(w * 0.38 + ((i * 43) % (w * 0.24)), h * 0.86 - (i % 4) * 4, 5, 3); }
      K.label(g, w, d.name + ' · step ' + n + ' of ' + d.steps.length, 12, 20);
    },
  });

  // ================================================================ chromatography: TLC and column
  const TLC = { aspirin: { name: 'aspirin', k1: 1.0, acid: true }, paracetamol: { name: 'paracetamol', k1: 1.9 }, caffeine: { name: 'caffeine', k1: 5.0 } };
  const ELU = { h1: ['hexane : ethyl acetate 1 : 1', 0.5, 1], h3: ['hexane : ethyl acetate 1 : 3', 0.75, 1], ea: ['ethyl acetate', 1, 1], eam: ['ethyl acetate : methanol 9 : 1', 1, 0.22] };
  const kOf = (c, e) => TLC[c].k1 * Math.pow(10, 1.8 * (1 - ELU[e][1])) * ELU[e][2];
  PX.add({
    id: 'tlc', area: 'Organic chemistry', title: 'TLC and column chromatography', short: 'Analgesic tablet: Rf values and identification', aspect: 0.6,
    steps: ['Spot the standards (aspirin, paracetamol, caffeine) and the dissolved tablet 1 cm from the bottom of a silica gel plate.', 'Develop in a closed tank with the chosen eluent until the solvent front is about 1 cm from the top. Mark the front with a pencil, dry, and view under UV light (254 nm): the colourless compounds show as dark spots on the green fluorescent background.', 'Measure with the ruler beside the plate (0 = start line): click or tap the centre of each spot and the solvent front to place the measuring line (↑ ↓ keys fine-tune it), and note each distance.', 'R_f = distance moved by the spot / distance moved by the solvent front. Polar compounds bind more strongly to the polar silica and move less; a more polar eluent moves everything further.', 'A little acetic acid in the eluent stops aspirin (a carboxylic acid) from streaking. A column works on the same principle: the least strongly held compound comes off first.'],
    custom(api, S) {
      const st = (S.tl = { e: 'ea', acid: false, run: 0, devd: false, mode: 'tlc' });
      const setup = () => { const ks = Object.keys(TLC); st.tab = ks.filter(() => Math.random() < 0.6); if (!st.tab.length) st.tab = [pick(ks)]; st.jit = {}; ks.forEach((k) => (st.jit[k] = N(0.015))); st.devd = false; st.run = 0; st.uv = false; st.my = null; st.meas = []; render(); api.msg(''); api.answer(null); api.table('', [], []); };
      st.rf = (k) => (1 / (1 + kOf(k, st.e))) * (1 + (st.jit ? st.jit[k] : 0));
      // measuring line: click or tap on the plate, or use the arrow keys, to line it up with a spot centre or the solvent front
      const cvs = api.$('bench');
      if (!cvs._tlcBound) {
        cvs._tlcBound = true; cvs.tabIndex = 0;
        const setY = (ev) => { const S2 = api.S; if (!S2.exp || S2.exp.id !== 'tlc' || !S2.tl || S2.tl.mode !== 'tlc') return; const r = cvs.getBoundingClientRect(); S2.tl.my = ev.clientY - r.top; };
        cvs.addEventListener('pointerdown', (ev) => { setY(ev); if (api.S.tl && api.S.tl.uv) { try { cvs.setPointerCapture(ev.pointerId); } catch (e) { /* ignore */ } } });
        cvs.addEventListener('pointermove', (ev) => { if (cvs.hasPointerCapture && cvs.hasPointerCapture(ev.pointerId)) setY(ev); });
        cvs.addEventListener('keydown', (ev) => { const S2 = api.S; if (!S2.exp || S2.exp.id !== 'tlc' || !S2.tl || S2.tl.geo == null) return; const G = S2.tl.geo; if (S2.tl.my == null) S2.tl.my = G.start; if (ev.key === 'ArrowUp') { S2.tl.my -= G.cm * 0.05; ev.preventDefault(); } if (ev.key === 'ArrowDown') { S2.tl.my += G.cm * 0.05; ev.preventDefault(); } });
      }
      const render = () => {
        api.$('params').innerHTML = '<div class="two-col">' + sel('tM', 'Technique', [['tlc', 'Thin-layer chromatography'], ['col', 'Column chromatography (same tablet)']], st.mode) + sel('tE', 'Eluent', Object.keys(ELU).map((k) => [k, ELU[k][0]]), st.e) + sel('tA', 'Additive', [['0', 'none'], ['1', '1 % acetic acid']], st.acid ? '1' : '0') + '</div>';
        const what = [['front', 'solvent front'], ['A', 'spot A (aspirin standard)'], ['P', 'spot P (paracetamol standard)'], ['C', 'spot C (caffeine standard)'], ['t1', 'tablet spot 1'], ['t2', 'tablet spot 2'], ['t3', 'tablet spot 3']];
        api.$('actions').innerHTML = (st.mode === 'tlc' ? btn('dev', 'Develop the plate', true) + btn('uv', 'View under UV light (254 nm)') +
          (st.uv ? '<span style="display:inline-flex;gap:6px;align-items:center;flex-wrap:wrap"><select id="tW" aria-label="What the measuring line is on" style="min-height:44px;border-radius:12px;padding:8px 10px;background:rgba(10,3,22,.55);color:inherit;border:1px solid var(--line)">' + what.map((x) => '<option value="' + x[0] + '">' + x[1] + '</option>').join('') + '</select>' + btn('note', 'Note this distance') + '</span>' : '') : btn('col', 'Run the column', true)) + btn('reset', 'New tablet');
      };
      const newPlate = () => { st.devd = false; st.run = 0; st.uv = false; st.my = null; st.meas = []; api.answer(null); api.table('', [], []); api.msg(''); render(); };   /* a new eluent needs a new plate */
      api.$('params').oninput = (ev) => { if (ev.target.id === 'tE') { st.e = ev.target.value; newPlate(); } if (ev.target.id === 'tA') { st.acid = ev.target.value === '1'; newPlate(); } if (ev.target.id === 'tM') { st.mode = ev.target.value; newPlate(); } };
      api.$('actions').onclick = (ev) => {
        const b = ev.target.closest('[data-a]'); if (!b) return; const a = b.dataset.a;
        if (a === 'reset') { setup(); return; }
        if (a === 'dev') { st.uv = false; st.my = null; st.meas = []; api.answer(null); api.table('', [], []); st.run = 0.001; st.devd = true; render(); api.msg('Developing…'); }
        if (a === 'col') { st.run = 0.001; api.msg('Eluting: watch the bands. The compound held least strongly by the silica comes off first.'); }
        if (a === 'uv') {
          if (!st.devd || st.run < 1) { api.msg('Develop the plate fully first, then mark the solvent front.', 'warn'); return; }
          st.uv = true; render();
          const good = Object.keys(TLC).every((k) => { const rf = st.rf(k); return rf > 0.1 && rf < 0.9; });
          api.msg('Under UV the plate glows green and the compounds show as dark spots. Use the ruler: 0 is the start line. Click or tap the centre of each spot (or the solvent front) to place the measuring line, fine-tune with the ↑ ↓ keys, then press “Note this distance”. R<sub>f</sub> = spot distance / front distance.' + (good ? '' : '<br><b>Note:</b> some spots are very close to the start or the front: try a different eluent so that R<sub>f</sub> lies between 0.2 and 0.8.') + (!st.acid ? '<br>The aspirin spot is streaked: adding acetic acid to the eluent sharpens it.' : ''), good ? 'ok' : 'warn');
          api.answer([{ id: 'r', label: 'R_f of caffeine in this eluent', unit: '', truth: st.rf('caffeine'), dp: 2, abs: true, tol: 0.03 }, { id: 'c', label: 'Components of the tablet (names, comma-separated)', text: true, accept: (v) => { const s2 = v.toLowerCase().replace(/\b(no|not|without)\s+\w+/g, ''), syn = { aspirin: ['aspirin', 'acetylsalicylic'], paracetamol: ['paracetamol', 'acetaminophen', '4-acetamidophenol'], caffeine: ['caffeine'] }; return Object.keys(TLC).every((k) => syn[k].some((n) => s2.includes(n)) === st.tab.includes(k)); }, truthText: st.tab.map((k) => TLC[k].name).join(', ') }],
            () => ['solvent front = 8.00 cm from the start line', ...Object.keys(TLC).map((k) => `${TLC[k].name}: spot at ${(8 * st.rf(k)).toFixed(2)} cm → R_f = ${(8 * st.rf(k)).toFixed(2)} / 8.00 = ${st.rf(k).toFixed(2)}`), 'Each tablet spot is matched to the standard with the same R_f (same eluent, same plate). Co-spotting (tablet + standard in one lane) confirms it: a single spot means the same compound.', 'Order of R_f on silica here: aspirin > paracetamol > caffeine.']);
        }
        if (a === 'note') {
          if (st.my == null || !st.geo) { api.msg('Click or tap on the plate first to place the measuring line.', 'warn'); return; }
          const d = Math.max(0, Math.round(((st.geo.start - st.my) / st.geo.cm) / 0.05) * 0.05), sel2 = api.$('tW'), lab = sel2.options[sel2.selectedIndex].text;
          st.meas = st.meas.filter((x) => x.what !== lab); st.meas.push({ what: lab, d });
          api.table('Your measurements (from the start line)', [{ k: 'what', label: 'Mark' }, { k: 'd', label: 'distance / cm', dp: 2 }], st.meas);
        }
      };
      setup();
    },
    draw(g, w, h, s, c, S) {
      const st = S.tl; if (!st) return; const dt = Math.min(0.1, S.t - (st.lt || S.t)); st.lt = S.t; if (st.run > 0 && st.run < 1) st.run = Math.min(1, st.run + dt * 0.4);
      if (st.mode === 'tlc') {
        const px = w * 0.32, pw = Math.min(w * 0.36, 300), pt = h * 0.05, pb = h * 0.95, start = pb - h * 0.08, frontFull = pt + h * 0.06, cm = (start - frontFull) / 8, frontY = start - (start - frontFull) * st.run;
        st.geo = { start, cm };
        g.canvas.style.touchAction = st.uv ? 'none' : '';   // while measuring, a finger drags the line instead of scrolling the page
        // plate: white silica before UV; under 254 nm the fluorescent indicator glows green and the compounds quench it (dark spots)
        g.fillStyle = st.uv ? '#86d98f' : '#eef1ee'; g.fillRect(px, pt, pw, pb - pt);
        if (st.run > 0 && st.run < 1) { g.fillStyle = 'rgba(120,180,255,.2)'; g.fillRect(px, frontY, pw, start + 6 - frontY); }
        g.strokeStyle = 'rgba(40,40,40,.65)'; g.beginPath(); g.moveTo(px, start); g.lineTo(px + pw, start); g.stroke();
        if (st.run >= 1) { g.setLineDash([4, 3]); g.beginPath(); g.moveTo(px, frontY); g.lineTo(px + pw, frontY); g.stroke(); g.setLineDash([]); g.fillStyle = '#333'; g.font = '10px Hanken Grotesk, sans-serif'; g.textAlign = 'right'; g.fillText('front', px + pw - 4, frontY - 4); }
        const lanes = Object.keys(TLC).map((k) => [k]).concat([st.tab]), labels = ['A', 'P', 'C', 'tablet'];
        lanes.forEach((ks, i) => {
          const lx = px + pw * (0.14 + i * 0.24);
          g.fillStyle = 'rgba(60,60,60,.5)'; g.beginPath(); g.arc(lx, start, 1.6, 0, 6.283); g.fill();          // pencil dot where it was spotted
          if (st.uv && st.run >= 1) ks.forEach((k) => { const y = start - cm * 8 * st.rf(k); g.fillStyle = 'rgba(40,30,55,.85)'; if (TLC[k].acid && !st.acid) { g.globalAlpha = 0.45; g.fillRect(lx - 5, y, 10, Math.min(start - y, 40)); g.globalAlpha = 1; } g.beginPath(); g.ellipse(lx, y, 6, 4, 0, 0, 6.283); g.fill(); });
          g.fillStyle = '#333'; g.font = '11px Hanken Grotesk, sans-serif'; g.textAlign = 'center'; g.fillText(labels[i], lx, pb - 4);
        });
        // ruler: 0 at the start line, mm divisions
        const rx = px - 40; g.fillStyle = '#f4ecd2'; g.fillRect(rx, frontFull - cm * 0.6, 34, start - frontFull + cm * 1.0);
        g.strokeStyle = '#2b2b2b'; g.fillStyle = '#2b2b2b'; g.font = '10px Hanken Grotesk, sans-serif'; g.textAlign = 'left';
        for (let mm = 0; mm <= 85; mm++) { const y = start - (mm / 10) * cm, len = mm % 10 === 0 ? 14 : mm % 5 === 0 ? 10 : 6; if (cm < 25 && mm % 10 && mm % 5 && cm < 18) continue; g.beginPath(); g.moveTo(rx + 34, y); g.lineTo(rx + 34 - len, y); g.stroke(); if (mm % 10 === 0) g.fillText(String(mm / 10), rx + 3, y + 3); }
        g.save(); g.translate(rx + 9, frontFull - cm * 0.35); g.fillText('cm', -6, 0); g.restore();
        // measuring line
        if (st.my != null && st.uv) {
          const y = Math.max(frontFull - cm * 0.5, Math.min(start + 2, st.my)), d = Math.max(0, Math.round(((start - y) / cm) / 0.05) * 0.05);
          g.strokeStyle = '#e0336b'; g.lineWidth = 1.5; g.beginPath(); g.moveTo(rx, y); g.lineTo(px + pw + 8, y); g.stroke(); g.lineWidth = 1;
          if (px + pw + 124 <= w) K.display(g, w, d.toFixed(2) + ' cm', px + pw + 14, Math.max(8, y - 23), 110); else K.caption('Measuring line: ' + d.toFixed(2) + ' cm from the start line');
        }
        if (w >= 620) { K.label(g, w, 'A aspirin · P paracetamol · C caffeine', px + pw + 14, h * 0.1); K.label(g, w, ELU[st.e][0] + (st.acid ? ' + AcOH' : ''), px + pw + 14, h * 0.1 + 18); }
      } else {
        const cx = w * 0.45, top = h * 0.05, bot = h * 0.9; g.fillStyle = '#e8e4d8'; g.fillRect(cx - 18, top + 20, 36, bot - top - 40); g.strokeStyle = 'rgba(255,255,255,.6)'; g.strokeRect(cx - 18, top, 36, bot - top);
        const cols = { aspirin: '#9c6ad8', paracetamol: '#d86a9c', caffeine: '#6a9cd8' };
        st.tab.forEach((k) => { const v = 1 / (1 + kOf(k, st.e)), y = top + 30 + (bot - top - 60) * Math.min(1.2, st.run * 2.4 * v); if (y < bot - 20) { g.fillStyle = K.rgba(cols[k], 0.85); g.fillRect(cx - 17, y, 34, 10); } });
        K.label(g, w, st.tab.length + ' band' + (st.tab.length > 1 ? 's' : '') + ' (coloured here for clarity)', w * 0.58, h * 0.2);
        K.caption('The band that moves fastest is the one held least strongly by the silica; collect fractions and check each by TLC against the standards.');
      }
    },
  });

  // ================================================================ 1H NMR and IR interpretation
  const SPEC = {
    ethanol: { name: 'ethanol', f: 'C₂H₆O', C: 2, H: 6, nmr: [[1.22, 't', 3, 'CH₃ next to CH₂ (n + 1 = 3)'], [3.69, 'q', 2, 'CH₂ on oxygen: deshielded; next to CH₃ (quartet)'], [2.6, 'br s', 1, 'O–H: broad, position varies, exchanges with D₂O']], ir: [[3350, 0.9, 120, 'broad O–H stretch (hydrogen bonded)'], [2970, 0.6, 30, 'sp³ C–H stretch'], [1050, 0.8, 25, 'C–O stretch']] },
    ethylacetate: { name: 'ethyl acetate', f: 'C₄H₈O₂', C: 4, H: 8, nmr: [[1.26, 't', 3, 'CH₃ of the ethyl group'], [2.05, 's', 3, 'CH₃ on C=O: no neighbours, singlet'], [4.12, 'q', 2, 'OCH₂: strongly deshielded by the ester oxygen']], ir: [[2985, 0.5, 30, 'sp³ C–H'], [1742, 1, 18, 'ester C=O stretch (higher than ketones)'], [1240, 0.9, 30, 'C–O stretch of the ester']] },
    acetone: { name: 'acetone', f: 'C₃H₆O', C: 3, H: 6, nmr: [[2.17, 's', 6, 'two equivalent CH₃ next to C=O: one singlet']], ir: [[3000, 0.4, 30, 'C–H'], [1715, 1, 18, 'ketone C=O stretch'], [1220, 0.6, 25, 'C–C(=O)–C stretch']] },
    toluene: { name: 'toluene', f: 'C₇H₈', C: 7, H: 8, nmr: [[2.35, 's', 3, 'Ar–CH₃ (benzylic)'], [7.2, 'm', 5, 'five aromatic H (ring current deshields them)']], ir: [[3030, 0.3, 25, 'aromatic C–H (above 3000)'], [2920, 0.5, 25, 'sp³ C–H'], [1605, 0.6, 12, 'aromatic C=C'], [1495, 0.7, 12, 'aromatic C=C'], [730, 0.9, 15, 'C–H bend, monosubstituted ring']] },
    acetophenone: { name: 'acetophenone', f: 'C₈H₈O', C: 8, H: 8, nmr: [[2.6, 's', 3, 'CH₃ on C=O'], [7.45, 't', 2, 'meta H (appears as a triplet: two ortho-type neighbours)'], [7.56, 't', 1, 'para H (triplet)'], [7.96, 'd', 2, 'ortho H: deshielded by the C=O']], ir: [[3060, 0.25, 25, 'aromatic C–H (weak)'], [2925, 0.2, 25, 'C–H of CH₃'], [1685, 1, 18, 'conjugated ketone C=O (lower than 1715)'], [1600, 0.6, 12, 'aromatic C=C'], [1265, 0.8, 25, 'C–C(=O)']] },
    benzaldehyde: { name: 'benzaldehyde', f: 'C₇H₆O', C: 7, H: 6, nmr: [[10.0, 's', 1, 'CHO: aldehyde H, very deshielded'], [7.52, 't', 2, 'meta H (triplet)'], [7.62, 't', 1, 'para H (triplet)'], [7.87, 'd', 2, 'ortho H']], ir: [[3060, 0.25, 25, 'aromatic C–H (weak)'], [2820, 0.3, 15, 'aldehyde C–H (Fermi doublet, medium)'], [2730, 0.3, 15, 'aldehyde C–H (Fermi doublet, medium)'], [1700, 1, 18, 'conjugated aldehyde C=O']] },
    propanoic: { name: 'propanoic acid', f: 'C₃H₆O₂', C: 3, H: 6, nmr: [[1.16, 't', 3, 'CH₃'], [2.38, 'q', 2, 'CH₂ next to C=O'], [11.7, 'br s', 1, 'COOH: very deshielded, broad']], ir: [[3000, 0.9, 380, 'very broad O–H of a hydrogen-bonded acid dimer (2500–3300)'], [1715, 1, 20, 'acid C=O'], [1240, 0.7, 30, 'C–O']] },
    ipa: { name: '2-propanol', f: 'C₃H₈O', C: 3, H: 8, nmr: [[1.2, 'd', 6, 'two CH₃ split by one CH (doublet)'], [4.02, 'sept', 1, 'CH–O: six neighbours → septet'], [2.2, 'br s', 1, 'O–H']], ir: [[3350, 0.9, 120, 'broad O–H'], [2970, 0.6, 30, 'C–H'], [1130, 0.8, 25, 'C–O (secondary alcohol)']] },
    butanone: { name: 'butanone', f: 'C₄H₈O', C: 4, H: 8, nmr: [[1.06, 't', 3, 'CH₃ of the ethyl group'], [2.14, 's', 3, 'CH₃ on C=O'], [2.44, 'q', 2, 'CH₂ on C=O']], ir: [[2980, 0.5, 30, 'C–H'], [1715, 1, 18, 'ketone C=O'], [1170, 0.6, 25, 'C–C(=O)']] },
    ether: { name: 'diethyl ether', f: 'C₄H₁₀O', C: 4, H: 10, nmr: [[1.21, 't', 6, 'two equivalent CH₃'], [3.48, 'q', 4, 'two equivalent OCH₂']], ir: [[2975, 0.7, 30, 'C–H'], [1120, 1, 25, 'strong C–O–C stretch; no O–H and no C=O']] },
  };
  const MULT = { s: [1], d: [1, 1], t: [1, 2, 1], q: [1, 3, 3, 1], sept: [1, 6, 15, 20, 15, 6, 1], m: [1, 2, 3, 2, 1], 'br s': [1] };
  PX.add({
    id: 'nmr-ir', area: 'Spectra & computing', title: 'Interpreting ¹H NMR and IR spectra', short: 'Work out the structure from two spectra and the formula', aspect: 0.75,
    steps: ['Start with the molecular formula: the degree of unsaturation DBE = C − H/2 + N/2 + 1 counts rings plus π bonds (4 or more suggests a benzene ring).', 'IR: look for the big diagnostic bands: broad O–H near 3300 (alcohol) or 2500–3300 (acid); C=O near 1700 (ester ≈ 1740, ketone ≈ 1715, conjugated ≈ 1685–1700); aldehyde C–H pair near 2720/2820; aromatic C–H above 3000.', '¹H NMR: the number of signals = number of kinds of H; the integral gives the relative number of H; the chemical shift shows the environment (alkyl 0.9–1.5, next to C=O 2–2.6, on O 3.3–4.2, aromatic 6.5–8, aldehyde 9.5–10, acid 10–12); the splitting (n + 1 rule) gives the number of neighbouring H.', 'Choose the structure and check the explanation of every peak.'],
    custom(api, S) {
      const st = (S.nm = { id: pick(Object.keys(SPEC)) });
      const render = () => {
        const d = SPEC[st.id];
        api.$('actions').innerHTML = btn('new', 'New unknown', true);
        api.readouts([['Molecular formula', d.f], ['IR bands to check', '3600–2500 · 1750–1680 · 1300–1000 cm⁻¹']]);
        const MN = { s: 'singlet', d: 'doublet', t: 'triplet', q: 'quartet', sept: 'septet', m: 'multiplet', 'br s': 'broad singlet' };
        api.table('¹H NMR peak list (read from the expanded spectrum)', [{ label: 'δ / ppm', f: (p) => p[0].toFixed(2) }, { label: 'multiplicity', f: (p) => MN[p[1]] }, { label: 'integration', f: (p) => p[2] + 'H' }], d.nmr.slice().sort((a, b) => b[0] - a[0]));
        api.custom('<h4 class="lbl-sum" style="padding-top:14px">Your answer</h4><div class="answer-form">' + sel('nmA', 'The compound is', [['', 'choose…']].concat(Object.keys(SPEC).map((k) => [k, SPEC[k].name])), '') + '<button type="button" class="btn-sm primary" id="nmC">Check</button></div><div id="nmV"></div>');
        api.$('nmC').onclick = () => {
          const v = api.$('nmA').value; if (!v) return; const ok = v === st.id;
          api.$('nmV').innerHTML = '<div class="callout ' + (ok ? 'ok' : 'bad') + '">' + (ok ? 'Correct: ' : 'Not this time. It is ') + '<b>' + esc(d.name) + '</b> (' + d.f + ').</div><div class="work-lines">' + ['DBE = ' + d.C + ' − ' + d.H + '/2 + 1 = ' + (d.C - d.H / 2 + 1)].concat(d.nmr.map((p) => `δ ${p[0].toFixed(2)} (${p[1]}, ${p[2]}H): ${p[3]}`), d.ir.map((p) => `IR ${p[0]} cm⁻¹: ${p[3]}`)).map(esc).join('<br>') + '</div>';
        };
      };
      api.$('actions').onclick = (ev) => { if (ev.target.closest('[data-a="new"]')) { st.id = pick(Object.keys(SPEC)); render(); } };
      render();
    },
    draw(g, w, h, s, c, S) {
      const st = S.nm; if (!st) return; const d = SPEC[st.id];
      // 1H NMR, 400 MHz: 12 -> 0 ppm, Lorentzian lines with first-order multiplets (J = 7 Hz)
      const L1 = 40, R1 = w - 16, T1 = 24, B1 = h * 0.46, X = (ppm) => R1 - ((ppm + 0.3) / 12.8) * (R1 - L1);
      g.fillStyle = 'rgba(235,225,250,.85)'; g.font = '12px Hanken Grotesk, sans-serif'; g.textAlign = 'left'; g.fillText('¹H NMR (400 MHz, CDCl₃)', L1, 16);
      g.strokeStyle = 'rgba(255,255,255,.25)'; g.beginPath(); g.moveTo(L1, B1); g.lineTo(R1, B1); g.stroke();
      g.textAlign = 'center'; g.font = '10px Hanken Grotesk, sans-serif'; for (let p = 0; p <= 12; p++) { g.fillText(String(p), X(p), B1 + 12); }
      g.fillText('δ / ppm', (L1 + R1) / 2, B1 + 24);
      // lines narrower than a pixel would be drawn at random heights, so every line is at least ~1 px wide;
      // heights then follow the number of protons (broad O–H / COOH signals are lower and wider, as in real spectra)
      const ppx = 12.8 / (R1 - L1), lines = [];
      const MOFF = [-2.6, -1.4, -0.5, 0.3, 1.1, 2.4];   /* a multiplet: unevenly spaced lines, not a clean n + 1 pattern */
      d.nmr.forEach((p) => { const pat = p[1] === 'm' ? [1, 2, 3, 3, 2, 1] : MULT[p[1]], tot = pat.reduce((a, b) => a + b, 0), J = 7 / 400, wdt = Math.max(p[1].startsWith('br') ? 0.06 : 0.004, ppx * 0.9); pat.forEach((r, i) => lines.push([p[0] + (p[1] === 'm' ? MOFF[i] : i - (pat.length - 1) / 2) * J, (p[2] * r) / tot, wdt])); });
      const yAt = (ppm) => lines.reduce((a, l) => a + (l[1] * (ppx * 0.9 / l[2])) / (1 + ((ppm - l[0]) / l[2]) ** 2), 0);
      const pk = (p) => { let m = 0; for (let k = -6; k <= 6; k++) m = Math.max(m, yAt(p[0] + k * 0.002)); return m; };
      const maxY = Math.max(...d.nmr.map(pk)) * 1.05, H = B1 - T1 - 48, Y = (v) => B1 - (v / maxY) * H;
      g.strokeStyle = '#ce72f5'; g.lineWidth = 1.2; g.beginPath();
      for (let x = L1; x <= R1; x++) { let v = 0; for (let k = 0; k < 4; k++) v = Math.max(v, yAt(((R1 - x - k / 4) / (R1 - L1)) * 12.8 - 0.3)); x === L1 ? g.moveTo(x, Y(v)) : g.lineTo(x, Y(v)); }
      g.stroke(); g.lineWidth = 1;
      // integral trace (steps proportional to the number of H), as printed on a real spectrum
      const totH = d.nmr.reduce((a, p) => a + p[2], 0), IH = H * 0.45, ib = B1 - 6;
      g.strokeStyle = 'rgba(124,240,180,.75)'; g.beginPath();
      for (let x = L1; x <= R1; x++) { const ppm = ((R1 - x) / (R1 - L1)) * 12.8 - 0.3; let cum = 0; d.nmr.forEach((p) => { const wd = p[1].startsWith('br') ? 0.08 : 0.03 + 0.012 * MULT[p[1]].length; cum += p[2] * (0.5 + Math.atan((p[0] - ppm) / wd) / Math.PI); }); const y = ib - (cum / totH) * IH; x === L1 ? g.moveTo(x, y) : g.lineTo(x, y); }
      g.stroke();
      // labels: one row above the spectrum, spread sideways so they never overlap, each joined to its own peak
      g.font = '11px Hanken Grotesk, sans-serif'; g.textAlign = 'center';
      const lab = d.nmr.map((p) => ({ px: X(p[0]), top: Y(pk(p)), t: p[2] + 'H' })).sort((a, b) => a.px - b.px), rowY = T1 + 12;
      lab.forEach((l) => { l.w = g.measureText(l.t).width + 8; l.x = l.px; });
      for (let pass = 0; pass < 30; pass++) {          // push apart, then keep each cluster centred on its peaks
        let moved = false;
        for (let k = 1; k < lab.length; k++) { const need = (lab[k - 1].w + lab[k].w) / 2 + 3, gap = lab[k].x - lab[k - 1].x; if (gap < need) { const sh = (need - gap) / 2; lab[k - 1].x -= sh; lab[k].x += sh; moved = true; } }
        lab.forEach((l) => { l.x = Math.max(L1 + l.w / 2, Math.min(R1 - l.w / 2, l.x)); });
        if (!moved) break;
      }
      lab.forEach((l) => {
        g.strokeStyle = 'rgba(124,240,180,.55)'; g.beginPath(); g.moveTo(l.x, rowY + 3); g.lineTo(l.x, rowY + 9); g.lineTo(l.px, Math.min(l.top - 3, rowY + 22)); g.lineTo(l.px, l.top - 3); g.stroke();
        g.fillStyle = '#0d0618'; g.fillRect(l.x - l.w / 2, rowY - 10, l.w, 13); g.fillStyle = '#7cf0b4'; g.fillText(l.t, l.x, rowY);
      });
      // IR: 4000 -> 500 cm-1, % transmittance
      const T2 = Math.max(h * 0.58, B1 + 46), B2 = h - 26, X2 = (nu) => R1 - ((nu - 500) / 3500) * (R1 - L1);
      g.fillStyle = 'rgba(235,225,250,.85)'; g.font = '12px Hanken Grotesk, sans-serif'; g.textAlign = 'left'; g.save(); g.translate(12, (T2 + B2) / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.font = '10px Hanken Grotesk, sans-serif'; g.fillText('% T', 0, 0); g.restore(); g.textAlign = 'left'; g.font = '12px Hanken Grotesk, sans-serif'; g.fillText('IR (liquid film)', L1, T2 - 8);
      g.strokeStyle = 'rgba(255,255,255,.25)'; g.strokeRect(L1, T2, R1 - L1, B2 - T2);
      g.textAlign = 'center'; g.font = '10px Hanken Grotesk, sans-serif'; for (let nu = 4000; nu >= 500; nu -= 500) g.fillText(String(nu), X2(nu), B2 + 12); g.fillText('wavenumber / cm⁻¹', (L1 + R1) / 2, B2 + 24);
      const tr = (nu) => { let a = 0.04 + 0.006 * Math.sin(nu / 37) + 0.005 * Math.sin(nu / 11.3 + 1) + 0.004 * Math.sin(nu / 5.7); d.ir.forEach((b) => (a += b[1] / (1 + ((nu - b[0]) / b[2]) ** 2))); (d.fp || (d.fp = (() => { const r = L.rng([...st.id].reduce((x, ch) => x * 31 + ch.charCodeAt(0), 7)); const out = [[1460, 0.3, 12]].concat(d.nmr.some((p) => p[2] % 3 === 0 && p[0] < 2.7) ? [[1375, 0.22, 10]] : []); /* CH₃ umbrella bend only when there is a CH₃ */ for (let k = 0; k < 5; k++) out.push([620 + r() * 780, 0.1 + r() * 0.25, 6 + r() * 10]); return out; })())).forEach((b) => (a += b[1] / (1 + ((nu - b[0]) / b[2]) ** 2))); return Math.pow(10, -Math.min(2, a)); };   // C–H bends near 1460/1375 plus compound-specific fingerprint bands
      g.strokeStyle = '#7cb8f0'; g.beginPath(); for (let x = L1; x <= R1; x++) { const nu = 500 + ((R1 - x) / (R1 - L1)) * 3500, y = T2 + 4 + (1 - tr(nu)) * (B2 - T2 - 8); x === L1 ? g.moveTo(x, y) : g.lineTo(x, y); } g.stroke();
    },
  });
})();
