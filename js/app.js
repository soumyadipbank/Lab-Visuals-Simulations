/* Lab Visuals: user interface */
(function () {
  'use strict';
  const C = globalThis.Chem;
  const CH = C.CH;
  const $ = (s, r) => (r || document).querySelector(s);
  const $$ = (s, r) => Array.from((r || document).querySelectorAll(s));
  const MAX = 4;

  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  function fmt(s) {
    let h = esc(s);
    h = h.replace(/([A-Za-z)\]])(\d+)/g, '$1<sub>$2</sub>');
    h = h.replace(/\^(\d*[+-])/g, (m, c) => '<sup>' + c.replace('-', '−') + '</sup>');
    h = h.replace(/\((s|aq|l|g)\)/g, '<span class="st">($1)</span>');
    return h;
  }
  const num = (x) => (x > 0 ? '+' : x < 0 ? '−' : '') + Math.abs(x).toString().replace(/^(\d+)$/, '$1');
  const store = {
    get(k, d) { try { return localStorage.getItem(k) || d; } catch (e) { return d; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ }
    },
  };

  // [title, chemicals, minimum level]: '11' and '12' = everyone (Grade 11 / 12), bsc = Bachelors only
  const PRESETS_ALL = [
    ['Silver chloride', ['agno3', 'nacl'], '11'], ['Sulfate test', ['bacl2', 'na2so4'], '11'], ['Neutralisation', ['hcl', 'naoh', 'phph'], '11'],
    ['Zn in CuSO₄', ['zn', 'cuso4h'], '11'], ['Mg in HCl', ['mg', 'hcl'], '11'], ['Na in water', ['na', 'h2o', 'phph'], '11'],
    ['Baking soda + vinegar', ['nahco3', 'ch3cooh'], '11'], ['Limewater test', ['caoh2', 'co2'], '11'], ['Cold pack', ['nh4no3', 'h2o'], '11'], ['Hot pack', ['cacl2', 'h2o'], '11'],
    ['Golden rain', ['pbno32', 'ki'], '11'], ['Silver tree', ['cu', 'agno3'], '12'],
    ['Elephant toothpaste', ['h2o2', 'mno2'], '12'], ['Ammonia + Cu²⁺', ['cuso4h', 'nh3'], '12'], ['Blood-red complex', ['fecl3', 'kscn'], '12'],
    ['KMnO₄ + Fe²⁺', ['kmno4', 'feso4', 'h2so4'], '12'], ['Starch–iodine', ['h2o2', 'ki', 'h2so4', 'starch'], '12'], ['Chromate ⇌ dichromate', ['k2cr2o7', 'naoh'], '12'],
    ['Cu + HNO₃', ['cu', 'hno3'], '12'], ['Al in NaOH', ['al', 'naoh'], '12'], ['Rusting', ['fe', 'h2o', 'o2'], '12'], ['Thiosulfate + HCl', ['na2s2o3', 'hcl'], '12'],
    ['Breathalyser', ['k2cr2o7', 'ethanol', 'h2so4'], 'bsc'], ['Endothermic: Ba(OH)₂ + NH₄Cl', ['baoh2', 'nh4cl'], 'bsc'], ['Burning Mg', ['mg', 'heat'], 'bsc'], ['Thermite', ['al', 'fe2o3', 'heat'], 'bsc'],
    ['Sugar + conc. H₂SO₄', ['sugar', 'h2so4c'], 'bsc'], ['Limestone kiln', ['caco3', 'heat'], 'bsc'], ['Blue vitriol, heated', ['cuso4h', 'heat'], 'bsc'],
  ];
  const lvlApi = window.LevelInfo || { allows: () => true };
  const PRESETS = PRESETS_ALL.filter((p) => lvlApi.allows(p[2]));

  const state = { sel: [], group: 'all', q: '', predict: false, pred: {}, revealed: true, res: null, doneHandled: false, phIdx: null };
  let sim = null;

  // ------------------------------------------------------------ chemical picker
  const hazLabel = ['Low', 'Caution', 'Hazard', 'Danger'];
  function dotColor(c) {
    if (c.color) return c.color;
    if (c.phase === 'g') return '#dfe6ed';
    if (c.id === 'heat') return '#ff8a3d';
    return '#e8f3fb';
  }
  function renderGroups() {
    $('#groupChips').innerHTML = C.GROUPS.map(([k, l]) => '<button type="button" data-g="' + k + '" aria-pressed="' + (state.group === k) + '">' + l + '</button>').join('');
  }
  function renderGrid() {
    const q = state.q.trim().toLowerCase();
    const list = Object.values(CH).filter((c) => (state.group === 'all' || c.group === state.group) &&
      (!q || c.name.toLowerCase().includes(q) || c.f.toLowerCase().includes(q) || c.id.includes(q)));
    const full = state.sel.length >= MAX;
    $('#chemGrid').innerHTML = list.length ? list.map((c) => {
      const on = state.sel.includes(c.id);
      const ord = on ? '<i class="ord">' + (state.sel.indexOf(c.id) + 1) + '</i>' : '';
      const sq = c.phase === 's' || c.metal ? ' sq' : '';
      const tag = c.id === 'heat' ? 'heat source' : c.phase === 's' ? 'solid' : c.phase === 'g' ? 'gas' : c.conc ? 'conc. liquid' : c.phase === 'l' ? 'liquid' : c.group === 'indicator' ? 'indicator' : 'solution';
      return '<button type="button" class="chem" draggable="true" data-id="' + c.id + '" aria-pressed="' + on + '"' + (!on && full ? ' disabled' : '') + ' title="' + esc(c.name + ': ' + c.look) + '">' +
        '<i class="dot' + sq + '" style="background:' + dotColor(c) + ';color:' + dotColor(c) + '"></i><b>' + fmt(c.f) + '</b><span>' + esc(c.name.replace(/ \(.*\)/, '')) + (c.conc ? ' (conc.)' : '') + '</span><span>' + tag + '</span>' + ord + '</button>';
    }).join('') : '<div class="chem-empty">No chemical matches “' + esc(state.q) + '”.</div>';
  }
  function renderTray() {
    $('#selCount').textContent = state.sel.length + ' of ' + MAX;
    if (!state.sel.length) { $('#tray').innerHTML = '<div class="tray-empty">Pick two or more chemicals below (or try a quick experiment).</div>'; return; }
    $('#tray').innerHTML = state.sel.map((id, i) => {
      const c = CH[id];
      return '<div class="tray-item"><span class="n">' + (i + 1) + '</span><div class="t"><b>' + fmt(c.f) + ' · ' + esc(c.name) +
        '<span class="haz haz-' + c.haz[0] + '">' + hazLabel[c.haz[0]] + '</span></b><span>' + esc(c.look) + '</span></div>' +
        '<button type="button" class="x" data-rm="' + id + '" aria-label="Remove ' + esc(c.name) + '">×</button></div>';
    }).join('') + (state.sel.length > 1 ? '<button type="button" class="ghost" id="clearBtn" style="justify-self:start">Clear all</button>' : '');
  }
  function renderPresets() {
    $('#presets').innerHTML = PRESETS.map(([t], i) => '<button type="button" data-p="' + i + '">' + t + '</button>').join('');
  }

  // ------------------------------------------------------------ selection -> simulation
  function setSelection(ids, opts) {
    state.sel = ids.slice(0, MAX);
    state.phIdx = null; state.pred = {}; state.doneHandled = false;
    state.revealed = !state.predict;
    onSelectionChange(opts);
  }
  function onSelectionChange(opts) {
    renderGrid(); renderTray();
    const ids = state.sel;
    let res;
    if (!ids.length) {
      res = { reacts: false, single: true, blank: true, fx: {}, dh: null, dT: 0, heat: 'none', ph1: 7, ph0: 7, micro: null, obs: [], why: [], deep: [], safety: [], types: [], ids: [], rest: [], indicators: [] };
    } else res = C.resolve(ids);
    state.res = res;
    if (res.phChoices) { state.phIdx = res.phChoicesDefault != null ? res.phChoicesDefault : 1; }
    sim.load(ids, res, {});
    if (res.phChoices) sim.setPH(res.phChoices[state.phIdx].ph);
    renderResults();
    updateURL();
    setMsg();
    renderLegend();
    updateBar();
    $('#mixBtn').disabled = !ids.length;
    if (opts && opts.autoplay) sim.play();
  }
  function updateURL() {
    try {
      const u = new URL(location.href);
      if (state.sel.length) u.searchParams.set('mix', state.sel.join(',')); else u.searchParams.delete('mix');
      history.replaceState(null, '', u);
    } catch (e) { /* file:// and similar */ }
  }
  function setMsg() {
    const m = $('#stageMsg');
    m.classList.remove('clickable');
    if (state.sel.length && state.res && state.res.reacts !== false && sim.phase === 'done' && sim.t > sim.tEnd + 1) { m.textContent = 'Reaction complete. Tap here for the explanation ↓'; m.classList.add('show', 'clickable'); return; }
    if (!state.sel.length) { m.textContent = 'Choose chemicals on the left to set up your experiment.'; m.classList.add('show'); }
    else if (sim.t < 0.01 && !sim.running) { m.textContent = state.sel.length === 1 ? 'Press Pour to add it to the beaker, or pick another chemical.' : 'Everything is on the bench. Press Mix to begin.'; m.classList.add('show'); }
    else m.classList.remove('show');
  }

  // key for the particle view, shown as HTML on phones (the canvas legend is too small to read there)
  function renderLegend() {
    const box = $('#mLegend');
    if (!box) return;
    if (sim.view !== 'micro' || !sim.legend || !sim.legend.length) { box.innerHTML = ''; box.classList.remove('on'); return; }
    box.classList.add('on');
    box.innerHTML = '<b>Key</b>' + sim.legend.map((e) => '<span><i style="background:' + e.color + ';border-radius:' + (e.ph === 's' ? '3px' : '50%') + '"></i>' + esc(C.uni(e.label)) + ' <em>' + e.role + (e.ph === 's' ? ', solid' : e.ph === 'g' ? ', gas' : '') + '</em></span>').join('') +
      '<small>Spectator ions are there before and after: they do not take part in the reaction.</small>';
  }

  // ------------------------------------------------------------ results rendering
  const dist = (a, b) => { const A = C.hex2rgb(a), B = C.hex2rgb(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
  function eqSide(res) {
    try { return C.parseEq(res.equation.mol); } catch (e) { return { left: [], right: [] }; }
  }
  function getFacts(res) {
    const f = {};
    const fx = res.fx || {};
    const eq = res.equation ? eqSide(res) : { left: [], right: [] };
    f.c0 = sim.c0; f.c1 = sim.c1;
    f.liqChanged = C.colourChanged(sim.c0, sim.c1);
    const solidChem = (res.ids || []).map((i) => CH[i]).find((c) => c && (c.metal || (c.phase === 's' && c.color)));
    f.s0 = fx.solidFrom || (solidChem && solidChem.color) || null; f.s1 = fx.solidEnd || null;
    f.solidChanged = !!(f.s0 && f.s1 && C.colourChanged(f.s0, f.s1));
    f.colourChange = f.liqChanged || f.solidChanged;
    f.solids = eq.right.filter((t) => t.ph === 's').map((t) => t.f);
    f.ppt = !!fx.ppt;
    f.gases = eq.right.filter((t) => t.ph === 'g' && t.f !== 'H2O').map((t) => t.f);
    f.gas = !!(fx.gas && fx.gas.rate > 0.05 && res.reacts) || !!(fx.fumes && fx.fumes.amount > 0.3 && res.reacts);
    f.hot = res.dh != null && res.dh < -1 && res.reacts;
    f.cold = res.dh != null && res.dh > 1 && res.reacts;
    f.none = !res.reacts;
    return f;
  }
  function swatch(hex) { return '<span class="sw" style="background:' + hex + '"></span>'; }
  function pptName(res) {
    const sp = res.species && res.species.prod.find((s) => s.ph === 's' && s.ppt);
    if (sp) return sp.ppt.name;
    return null;
  }

  function equationCard(res) {
    if (!res.reacts) return '';
    const q = res.equation;
    const arrowRepl = (s) => {
      const eq = s.includes('⇌');
      const cond = res.condition ? '<sub class="cond"> ' + fmt(res.condition) + ' </sub>' : '';
      return fmt(s).replace(eq ? '⇌' : '→', '<span class="arrow">' + (eq ? '⇌' : '→') + '</span>' + cond);
    };
    let h = '<div class="card"><h4>Balanced equation' + (res.balanced === false ? ' (could not auto-balance)' : '') + '</h4><div class="eq">';
    h += '<div class="row"><span class="lbl">Molecular</span>' + arrowRepl(q.mol) + '</div>';
    if (q.ionic) h += '<div class="row"><span class="lbl">Ionic</span>' + arrowRepl(q.ionic) + '</div>';
    if (q.net) h += '<div class="row"><span class="lbl">Net ionic</span>' + arrowRepl(q.net) + '</div>';
    h += '</div>';
    if (q.net && q.ionic) h += '<p class="eq-note">Ions that appear unchanged on both sides of the ionic equation are <b>spectator ions</b>; they are cancelled to leave the net ionic equation.</p>';
    h += '</div>';
    return h;
  }

  function factsHTML(res) {
    const f = getFacts(res);
    const parts = [];
    // colour: only claim a change when the two colours are really different
    const nm = (hex) => cap(C.colourName(hex));
    let col;
    if (f.liqChanged) {
      col = '<div class="v">' + swatch(f.c0) + '<span class="sw-arrow">→</span>' + swatch(f.c1) + ' Colour changes</div><div class="s">' + esc(nm(f.c0) + ' → ' + C.colourName(f.c1) + (C.colourName(f.c1) === 'colourless' ? '' : ' solution')) + (f.solidChanged ? '. The solid also changes colour (' + esc(C.colourName(f.s0) + ' → ' + C.colourName(f.s1)) + ').' : '') + '</div>';
    } else if (f.solidChanged) {
      col = '<div class="v">' + swatch(f.s0) + '<span class="sw-arrow">→</span>' + swatch(f.s1) + ' The solid changes colour</div><div class="s">' + esc(nm(f.s0) + ' → ' + C.colourName(f.s1)) + '. The solution colour stays the same.</div>';
    } else {
      col = '<div class="v">' + swatch(f.c1) + ' No colour change</div><div class="s">' + esc(nm(f.c1)) + (C.colourName(f.c1) === 'colourless' ? '' : ' solution') + ' before and after.</div>';
    }
    parts.push(['Colour', col]);
    // precipitate
    if (f.ppt) {
      const nm = pptName(res) || (f.solids.length ? f.solids.map((s) => fmt(s)).join(', ') : C.colorWord(res.fx.ppt.color) + ' solid');
      const sol = f.solids.length ? f.solids.map((s) => fmt(s)).join(', ') : '';
      parts.push(['Precipitate', '<div class="v">' + swatch(res.fx.ppt.color) + ' ' + (sol || esc(nm)) + '</div><div class="s">' + esc(cap(C.colorWord(res.fx.ppt.color))) + (pptName(res) ? ' ' + esc(pptName(res)) : '') + (res.fx.ppt.redissolve ? ' (forms, then re-dissolves)' : '') + '</div>']);
    } else parts.push(['Precipitate', '<div class="v">None</div><div class="s">No new solid forms.</div>']);
    // gas
    if (f.gas || f.gases.length) {
      const g = f.gases.length ? f.gases : (res.fx.gas && res.fx.gas.label ? [res.fx.gas.label] : []);
      const names = g.map((x) => { const k = x === 'NH3' ? 'NH3' : x; return fmt(x) + (C.GAS[k] ? ' (' + C.GAS[k].name + ')' : ''); }).join(', ');
      const test = g.length && C.GAS[g[0]] ? C.GAS[g[0]].test : '';
      parts.push(['Gas', '<div class="v">' + names + '</div><div class="s">' + esc(test) + '</div>']);
    } else parts.push(['Gas', '<div class="v">None</div><div class="s">No bubbles of gas.</div>']);
    // heat
    if (!res.reacts) parts.push(['Heat', '<div class="v">No change</div><div class="s">Temperature stays at about 25 °C.</div>']);
    else if (res.dh == null) parts.push(['Heat', '<div class="v">Small / not tabulated</div><div class="s">' + esc(res.dhNote || 'No ΔH value in our data for this reaction.') + '</div>']);
    else {
      const T = Math.abs(res.dT).toFixed(1);
      const exo = res.dh < -1, endo = res.dh > 1;
      parts.push(['Heat', '<div class="v">' + (exo ? '🔥 Exothermic: heat released' : endo ? '❄ Endothermic: heat absorbed' : 'About thermoneutral') + '</div><div class="s">ΔH = ' + num(res.dh) + ' kJ' + (exo ? ' → warms by about ' + T + ' °C' : endo ? ' → cools by about ' + T + ' °C' : '') + '<br><i>(0.05 mol reacting in 100 mL: 50 mL of each 1 M solution)</i></div>']);
    }
    // pH
    const ph = sim.ph1;
    if (ph != null && (state.res.reacts || (state.res.rest || []).some((i) => ['acid', 'base'].includes(CH[i].group)))) {
      parts.push(['pH of the mixture', '<div class="v">≈ ' + (Math.round(ph * 10) / 10) + '</div><div class="s">' + (ph < 6.5 ? 'Acidic' : ph > 7.5 ? 'Basic (alkaline)' : 'Neutral') + (state.res.indicators && state.res.indicators.length ? '. ' + esc(C.INDICATOR_INFO[state.res.indicators[0]]) : '') + '</div>']);
    }
    return '<div class="facts">' + parts.map(([h, b]) => '<div class="fact"><h4>' + h + '</h4>' + b + '</div>').join('') + '</div>';
  }
  const cap = (s) => (s ? s[0].toUpperCase() + s.slice(1) : s);

  function hessTable(res) {
    if (!res.hess) return '';
    const rows = (arr) => arr.map((r) => '<tr><td>' + fmt(r.t) + '</td><td>' + num(r.v) + ' kJ</td></tr>').join('');
    const sp = res.hess.lines.prod.reduce((a, r) => a + r.v, 0), sr = res.hess.lines.react.reduce((a, r) => a + r.v, 0);
    return '<table class="hess"><tr><th>Products: ΔfH°</th><th></th></tr>' + rows(res.hess.lines.prod) +
      '<tr><td><i>Σ products</i></td><td>' + num(Math.round(sp * 10) / 10) + ' kJ</td></tr>' +
      '<tr><th>Reactants: ΔfH°</th><th></th></tr>' + rows(res.hess.lines.react) +
      '<tr><td><i>Σ reactants</i></td><td>' + num(Math.round(sr * 10) / 10) + ' kJ</td></tr>' +
      '<tr class="sum"><td>ΔH° = Σ products − Σ reactants</td><td>' + num(res.hess.dh) + ' kJ</td></tr></table>' +
      (res.hess.dh !== res.dh ? '<p class="eq-note">Tables give ' + num(res.hess.dh) + ' kJ here; textbooks quote ' + num(res.dh) + ' kJ per ' + 'mole of water for strong acid + strong base (small differences come from the data set and concentration used).</p>' : '');
  }

  function safetyHTML(res) {
    const items = [];
    (res.ids || []).forEach((id) => {
      const c = CH[id];
      if (c.haz[0] >= 1) items.push('<li><b>' + esc(c.name) + '</b><span class="haz haz-' + c.haz[0] + '">' + hazLabel[c.haz[0]] + '</span> ' + esc(c.haz[1]) + '</li>');
    });
    (res.safety || []).forEach((s) => items.push('<li>⚠ ' + esc(s) + '</li>'));
    if (!items.length) return '';
    return '<div class="card warn-card"><h4>Lab safety</h4><ul class="safety">' + items.join('') + '</ul></div>';
  }

  const PRED = [
    ['colour', 'Colour changes'], ['ppt', 'A solid forms (precipitate)'], ['gas', 'Gas is given off'],
    ['hot', 'Gets hotter'], ['cold', 'Gets colder'], ['none', 'No reaction at all'],
  ];
  function predictCard(res, revealed) {
    if (!revealed) {
      return '<div class="card"><h4>Your prediction</h4><p>Before you mix, tick everything you expect to happen. Then press <b>Mix</b>.</p><div class="predict-grid">' +
        PRED.map(([k, l]) => '<label><input type="checkbox" data-pred="' + k + '"' + (state.pred[k] ? ' checked' : '') + '> ' + l + '</label>').join('') +
        '</div><p style="margin-top:10px"><button type="button" class="btn" id="revealBtn">Reveal the answer now</button></p></div>';
    }
    const f = getFacts(res);
    const truth = { colour: f.colourChange, ppt: f.ppt, gas: f.gas, hot: f.hot, cold: f.cold, none: f.none };
    const msgMiss = {
      colour: 'The colour does change here.', ppt: 'A solid does form here.', gas: 'Gas is given off.', hot: 'The mixture gets hotter (exothermic).', cold: 'The mixture gets colder (endothermic).', none: 'In fact a reaction does occur.',
    };
    const msgWrong = {
      colour: 'No colour change happens here.', ppt: 'No solid forms.', gas: 'No gas is given off.', hot: 'It does not warm up' + (f.cold ? ': it actually gets colder.' : '.'), cold: 'It does not get colder' + (f.hot ? ': it actually warms up.' : '.'), none: 'This one does react.',
    };
    let ok = 0;
    const rows = PRED.map(([k, l]) => {
      const p = !!state.pred[k], t = !!truth[k];
      if (p === t) { ok++; return '<div class="good">✔ ' + l + ': ' + (t ? 'correct, it happens.' : 'correct, it does not happen.') + '</div>'; }
      return '<div class="miss">✘ ' + l + ': ' + (p ? 'you predicted this, but ' + msgWrong[k] : 'you did not predict this. ' + msgMiss[k]) + '</div>';
    });
    const any = Object.values(state.pred).some(Boolean);
    return '<div class="card"><h4>Your prediction: ' + ok + ' of ' + PRED.length + ' correct' + (any ? '' : ' (you did not tick anything)') + '</h4><div class="score">' + rows.join('') + '</div>' +
      '<p class="eq-note">Where you went wrong is where the learning is. Read the explanation below, then change a chemical and try again.</p></div>';
  }

  function renderResults() {
    const res = state.res, box = $('#resBody');
    if (!res || res.blank) {
      box.innerHTML = '<div class="empty"><big>🧪</big><b>Choose two or more chemicals to begin.</b><p>Try a quick experiment from the list, or pick your own. Every combination is simulated: reactions, “no reaction” and why.</p></div>';
      return;
    }
    const names = res.ids.map((id) => esc(CH[id].name.replace(/ \(.*\)/, ''))).join(' + ');
    const showAll = state.revealed || !state.predict;
    let h = '<div class="res-head"><h3>' + (res.title ? esc(res.title) : names) + '</h3></div>';
    if (res.title) h += '<p class="fine" style="margin:0">' + names + '</p>';
    if (!showAll) {
      h += predictCard(res, false);
      box.innerHTML = h; return;
    }
    // tags
    const tags = [];
    if (res.single) tags.push('<span class="tag">Single chemical</span>');
    else tags.push(res.reacts ? '<span class="tag ok">✔ Reaction occurs</span>' : '<span class="tag no">✘ No reaction</span>');
    (res.types || []).forEach((t) => { if (t !== 'No reaction' && t !== 'Single chemical') tags.push('<span class="tag' + (t === 'Exothermic' ? ' exo' : t === 'Endothermic' ? ' endo' : '') + '">' + esc(t) + '</span>'); });
    if (res.heat === 'exo' && !(res.types || []).includes('Exothermic')) tags.push('<span class="tag exo">Exothermic</span>');
    if (res.heat === 'endo' && !(res.types || []).includes('Endothermic')) tags.push('<span class="tag endo">Endothermic</span>');
    h += '<div class="tags">' + tags.join('') + '</div>';
    if (state.predict) h += predictCard(res, true);
    if (!res.reacts && res.reason && !res.single) h += '<div class="card"><h4>Why nothing happens</h4><p>' + esc(res.reason) + '</p></div>';
    h += equationCard(res);
    if (res.phChoices) {
      h += '<div class="card"><h4>Amounts: which one is in excess?</h4><div class="excess" role="group" aria-label="Which reagent is in excess">' +
        res.phChoices.map((c, i) => '<button type="button" data-ph="' + i + '" aria-pressed="' + (state.phIdx === i) + '">' + c.label + ' (pH ≈ ' + c.ph + ')</button>').join('') + '</div>' +
        '<p class="eq-note">The end point depends on the amounts. With an indicator in the beaker, watch how the colour follows the pH.</p></div>';
    }
    if (!res.single) h += factsHTML(res);
    // observations
    const obs = (res.obs || []);
    if (obs.length) {
      h += '<div class="card"><h4>What you would observe</h4><ul class="obs" id="obsList">' + obs.map((o, i) => '<li data-th="' + (i / Math.max(1, obs.length)).toFixed(2) + '">' + esc(o) + '</li>').join('') + '</ul></div>';
    }
    if (res.partial) {
      h += '<div class="card partial"><h4>More than two chemicals</h4><p>Reacting pair shown: ' + res.partial.used.map((i) => '<code>' + esc(CH[i].name.replace(/ \(.*\)/, '')) + '</code>').join(' + ') + '.' +
        (res.partial.unused.length ? ' Not reacting with them in our model: ' + res.partial.unused.map((i) => '<code>' + esc(CH[i].name.replace(/ \(.*\)/, '')) + '</code>').join(', ') + '.' : '') + '</p>' +
        (res.partial.others.length ? '<p>Other reactions possible in the mixture:</p><ul>' + res.partial.others.map((o) => '<li>' + fmt(o.eq) + '</li>').join('') + '</ul>' : '') +
        '<p class="eq-note">Real mixtures of several reagents can react in sequence; this is an approximation. Remove a chemical to see each reaction on its own.</p></div>';
    }
    if (res.why && res.why.length) h += '<div class="card"><h4>' + (res.reacts ? 'Why does this happen?' : 'Explanation') + '</h4>' + res.why.map((t) => '<p>' + esc(t) + '</p>').join('') + '</div>';
    if (res.hints && res.hints.length) {
      h += '<div class="card hint-card"><h4>Want to see a reaction?</h4><p>These chemicals do not react by themselves, but a reaction does happen if you add:</p>' +
        res.hints.map((x) => '<button type="button" data-add="' + x.add + '">+ ' + esc(CH[x.add].name.replace(/ \(.*\)/, '')) + '</button>').join('') + '</div>';
    }
    // deeper explanation
    const deepBits = [];
    if (res.hess) deepBits.push(hessTable(res));
    if (res.dh != null && res.dhSource) deepBits.push('<p class="eq-note">ΔH source: ' + esc(res.dhSource) + (res.dhNote ? '; ' + esc(res.dhNote) : '') + '.</p>');
    else if (res.dhNote) deepBits.push('<p class="eq-note">' + esc(res.dhNote) + '</p>');
    (res.deep || []).forEach((t) => deepBits.push('<p>' + esc(t) + '</p>'));
    if (deepBits.length) h += '<details class="card deep"><summary>Go deeper: the numbers behind it</summary>' + deepBits.join('') + '</details>';
    h += safetyHTML(res);
    box.innerHTML = h;
    updateObs();
  }
  function updateObs() {
    const items = $$('#obsList li');
    if (!items.length) return;
    const p = sim.p || 0, done = sim.phase === 'done';
    items.forEach((li) => li.classList.toggle('seen', done || sim.t >= sim.tPour && p >= +li.dataset.th * 0.85 || (!state.res.reacts && sim.t > 0.5)));
  }

  // sticky bar on small screens so you do not have to scroll back up to the stage
  function updateBar() {
    const bar = $('#mobileBar'); if (!bar) return;
    const n = state.sel.length;
    bar.classList.toggle('show', n > 0 && !stageInView());
    $('#mobileBarText').textContent = n + (n === 1 ? ' chemical' : ' chemicals') + ' ready';
  }
  function stageInView() {
    const r = $('#stage').getBoundingClientRect();
    return r.top < innerHeight * 0.55 && r.bottom > innerHeight * 0.3;
  }

  // ------------------------------------------------------------ per-frame updates
  let lastSig = '';
  function onFrame(s) {
    const T = s.T == null ? 25 : s.T;
    const sig = [T.toFixed(1), Math.round((s.p || 0) * 100), s.running, s.phase, Math.round(s.t * 5)].join('|');
    if (sig === lastSig) return;
    lastSig = sig;
    const rt = $('#rdTemp');
    rt.textContent = (T > 150 ? Math.round(T) : T.toFixed(1)) + ' °C';
    rt.className = T > 27 ? 'hot' : T < 23 ? 'cold' : '';
    const res = state.res;
    if (res && !res.blank) {
      $('#rdHeat').textContent = !res.reacts ? 'No change' : res.heat === 'exo' ? 'Released 🔥' : res.heat === 'endo' ? 'Absorbed ❄' : res.heat === 'neutral' ? 'About none' : 'Small';
      $('#rdDH').textContent = res.dh == null ? '–' : num(res.dh) + ' kJ';
    } else { $('#rdHeat').textContent = '–'; $('#rdDH').textContent = '–'; }
    $('#rdProg').textContent = res && res.reacts !== false ? Math.round((s.p || 0) * 100) + '%' : '–';
    const sc = $('#scrub');
    if (document.activeElement !== sc) sc.value = Math.round((s.t / s.tTotal) * 1000);
    const mb = $('#mixBtn');
    const mbar = $('#mobileBarBtn');
    if (mbar) mbar.textContent = s.running ? '⏸ Pause' : s.t >= s.tTotal - 0.01 ? '↻ Replay' : s.t > 0.01 ? '▶ Resume' : '▶ Mix';
    mb.textContent = s.running ? '⏸ Pause' : s.t >= s.tTotal - 0.01 ? '↻ Replay' : s.t > 0.01 ? '▶ Resume' : (state.res && state.res.single ? '▶ Pour' : '▶ Mix');
    updateObs();
    setMsg();
    if (state.predict && !state.revealed && s.phase === 'done' && !state.doneHandled) { state.doneHandled = true; state.revealed = true; renderResults(); }
  }

  // ------------------------------------------------------------ events
  function bind() {
    $('#chemGrid').addEventListener('click', (e) => {
      const b = e.target.closest('.chem'); if (!b || b.disabled) return;
      const id = b.dataset.id;
      const i = state.sel.indexOf(id);
      if (i >= 0) state.sel.splice(i, 1); else if (state.sel.length < MAX) state.sel.push(id);
      setSelection(state.sel);
    });
    $('#tray').addEventListener('click', (e) => {
      const x = e.target.closest('[data-rm]');
      if (x) { setSelection(state.sel.filter((i) => i !== x.dataset.rm)); return; }
      if (e.target.id === 'clearBtn') setSelection([]);
    });
    $('#presets').addEventListener('click', (e) => {
      const b = e.target.closest('[data-p]'); if (!b) return;
      setSelection(PRESETS[+b.dataset.p][1]);
      $('#stage').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    $('#surpriseBtn').addEventListener('click', () => {
      const p = PRESETS[Math.floor(Math.random() * PRESETS.length)];
      setSelection(p[1]);
      $('#stage').scrollIntoView({ behavior: 'smooth', block: 'center' });
    });
    $('#groupChips').addEventListener('click', (e) => {
      const b = e.target.closest('[data-g]'); if (!b) return;
      state.group = b.dataset.g; renderGroups(); renderGrid();
    });
    const rb = $('#heroRandom');
    if (rb) rb.addEventListener('click', () => {
      const p = PRESETS[Math.floor(Math.random() * PRESETS.length)];
      setSelection(p[1]);
      $('#lab').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
    $('#search').addEventListener('input', (e) => { state.q = e.target.value; renderGrid(); });
    $('#mixBtn').addEventListener('click', () => {
      if (sim.running) sim.pause();
      else { if (sim.t >= sim.tTotal - 0.01) sim.restart(); sim.play(); }
      lastSig = ''; onFrame(sim);
    });
    $('#resetBtn').addEventListener('click', () => { sim.restart(); state.doneHandled = false; if (state.predict) { state.revealed = false; renderResults(); } lastSig = ''; onFrame(sim); });
    $('#speed').addEventListener('input', (e) => { sim.userSpeed = +e.target.value; $('#speedOut').textContent = e.target.value + '×'; });
    $('#scrub').addEventListener('input', (e) => { sim.pause(); sim.seek((+e.target.value / 1000) * sim.tTotal); lastSig = ''; onFrame(sim); });
    const setView = (v) => {
      sim.setView(v);
      $$('[data-view]').forEach((x) => x.setAttribute('aria-pressed', String(x.dataset.view === v)));
      renderLegend();
    };
    $$('[data-view]').forEach((b) => b.addEventListener('click', () => setView(b.dataset.view)));
    // drag a chemical onto the beaker
    $('#chemGrid').addEventListener('dragstart', (e) => {
      const b = e.target.closest('.chem'); if (!b) return;
      e.dataTransfer.setData('text/plain', b.dataset.id); e.dataTransfer.effectAllowed = 'copy';
    });
    const zone = $('.canvas-wrap');
    ['dragenter', 'dragover'].forEach((ev) => zone.addEventListener(ev, (e) => { e.preventDefault(); zone.classList.add('drop'); }));
    zone.addEventListener('dragleave', () => zone.classList.remove('drop'));
    zone.addEventListener('drop', (e) => {
      e.preventDefault(); zone.classList.remove('drop');
      const id = e.dataTransfer.getData('text/plain');
      if (!CH[id] || state.sel.includes(id)) return;
      if (state.sel.length >= MAX) { const m = $('#stageMsg'); m.textContent = 'The bench holds four chemicals. Remove one first.'; m.classList.add('show'); return; }
      setSelection(state.sel.concat(id));
    });
    let barTick = false;
    addEventListener('scroll', () => { if (!barTick) { barTick = true; requestAnimationFrame(() => { barTick = false; updateBar(); }); } }, { passive: true });
    $('#mobileBarBtn').addEventListener('click', () => {
      if (!stageInView()) {
        $('#stage').scrollIntoView({ behavior: 'smooth', block: 'start' });
        if (!sim.running) setTimeout(() => $('#mixBtn').click(), 650);
      } else $('#mixBtn').click();
    });
    $('#stageMsg').addEventListener('click', () => { if ($('#stageMsg').classList.contains('clickable')) $('#results').scrollIntoView({ behavior: 'smooth', block: 'start' }); });
    // keyboard shortcuts
    document.addEventListener('keydown', (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea') return;
      const k = e.key.toLowerCase();
      if (k === ' ') { if (tag === 'button') return; e.preventDefault(); $('#mixBtn').click(); }
      else if (k === 'r') $('#resetBtn').click();
      else if (k === 'p') setView(sim.view === 'micro' ? 'beaker' : 'micro');
    });
    $('#predictMode').addEventListener('change', (e) => {
      state.predict = e.target.checked; state.revealed = !state.predict; state.doneHandled = false;
      renderResults();
    });
    $('#resBody').addEventListener('change', (e) => {
      const k = e.target.dataset && e.target.dataset.pred;
      if (k) state.pred[k] = e.target.checked;
    });
    $('#resBody').addEventListener('click', (e) => {
      const ph = e.target.closest('[data-ph]');
      if (ph) {
        state.phIdx = +ph.dataset.ph; sim.setPH(state.res.phChoices[state.phIdx].ph);
        $$('[data-ph]').forEach((b) => b.setAttribute('aria-pressed', String(+b.dataset.ph === state.phIdx)));
        const old = $('.facts'); if (old) old.outerHTML = factsHTML(state.res);
        return;
      }
      const add = e.target.closest('[data-add]');
      if (add && state.sel.length < MAX) { setSelection(state.sel.concat(add.dataset.add)); return; }
      if (add) { setSelection(state.sel.slice(0, MAX - 1).concat(add.dataset.add)); return; }
      if (e.target.id === 'revealBtn') { state.revealed = true; renderResults(); }
    });
  }

  // ------------------------------------------------------------ start
  function init() {
    sim = new C.Sim({ beaker: $('#beaker'), temp: $('#temp'), energy: $('#energy') });
    sim.onFrame = onFrame;
    sim.dark = true;
    renderGroups(); renderPresets(); renderGrid(); renderTray();
    bind();
    let start = ['agno3', 'nacl'];
    try {
      const m = new URL(location.href).searchParams.get('mix');
      if (m) { const ids = m.split(',').filter((i) => CH[i]); if (ids.length) start = ids; }
    } catch (e) { /* ignore */ }
    setSelection(start);
    window.LabVisuals = { state, sim, setSelection };
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
