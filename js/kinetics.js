/* Lab Visuals: kinetics simulator (iodine clock, H2O2 decomposition, ester hydrolysis, saponification) */
(function () {
  'use strict';
  const C = globalThis.Chem, L = C.Lab, $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const level = (window.LevelInfo && LevelInfo.level) || 'bsc', rank = { '11': 1, '12': 1, school: 1, bsc: 2 };
  const q = new URLSearchParams(location.search);
  const cv = $('bench'), g = cv.getContext('2d');
  const noise = (sd) => L.gauss(Math.random) * sd;

  const EXPS = [
    {
      id: 'clock', level: '12', title: 'Iodine clock: H₂O₂ + KI', short: 'Orders, rate constant and activation energy', unis: [],
      steps: ['H₂O₂ + 2I⁻ + 2H⁺ → I₂ + 2H₂O is slow. Thiosulfate (fixed at 0.0020 M) removes each I₂ as it forms, so no colour appears until all the thiosulfate is used up. Then the starch turns blue-black.', 'The time t to the sudden blue colour is inversely proportional to the initial rate: rate = [S₂O₃²⁻] / (2t).', 'Vary [H₂O₂] alone, then [KI] alone, then temperature alone. Take at least 6 runs.', 'Press “Fit my runs”: the page fits ln(rate) = ln k + m ln[H₂O₂] + n ln[I⁻] − E<sub>a</sub>/RT to all your runs together. The orders m, n and E<sub>a</sub> come out of it.'],
      params: [{ id: 'hp', label: '[H₂O₂]', min: 0.02, max: 0.1, step: 0.01, val: 0.05, unit: 'M', dp: 2 }, { id: 'ki', label: '[KI]', min: 0.02, max: 0.1, step: 0.01, val: 0.05, unit: 'M', dp: 2 }, { id: 'T', label: 'Temperature', min: 10, max: 50, step: 5, val: 25, unit: '°C', dp: 0 }],
      type: 'clock', cv: { a: 'hp', b: 'ki', la: '[H₂O₂]', lb: '[I⁻]', ta: 'H₂O₂', tb: 'I⁻', thio: 0.002, t: (p) => L.clock(p.hp, p.ki, 0.002, p.T).t, flask: 'H₂O₂ + KI + H₂SO₄ + Na₂S₂O₃ + starch in the flask' },
      report: () => [{ id: 'm', label: 'Order in H₂O₂', unit: '', truth: 1, dp: 0, abs: true, tol: 0.2 }, { id: 'n', label: 'Order in I⁻', unit: '', truth: 1, dp: 0, abs: true, tol: 0.2 }, { id: 'ea', label: 'Activation energy', unit: 'kJ/mol', truth: L.CLOCK.Ea / 1000, dp: 0, tol: 0.12 }],
    },
    {
      id: 'h2o2', level: 'bsc', title: 'H₂O₂ decomposition (KI or FeCl₃)', short: 'First-order rate constant by KMnO₄ titration', unis: [],
      steps: ['A catalyst (KI or FeCl₃) decomposes H₂O₂: 2H₂O₂ → 2H₂O + O₂. Oxygen bubbles off faster when the reaction is faster.', 'Press Start, advance the clock, and take a 5 mL sample at each time. Each sample is quenched and titrated with 0.02 M KMnO₄ (the titre is proportional to the H₂O₂ left).', 'Plot ln(titre) against time. For a first-order reaction this is a straight line with slope −k.'],
      type: 'adv', unit: 'min', steps_t: [1, 5, 10], tmax: 90, col: 't / min', vcol: 'KMnO₄ titre / mL',
      selects: [{ id: 'cat', label: 'Catalyst', opts: [['KI', 'KI'], ['FeCl3', 'FeCl₃']] }],
      params: [{ id: 'c', label: 'Catalyst concentration', min: 0.02, max: 0.1, step: 0.01, val: 0.05, unit: 'M', dp: 2 }, { id: 'T', label: 'Temperature', min: 20, max: 45, step: 5, val: 25, unit: '°C', dp: 0 }],
      begin: (p) => ({ k: L.h2o2K(p.cat, p.c, p.T), V0: 24 + noise(0.08) }),
      sample: (m, t) => Math.max(0.05, Math.round((m.V0 * Math.exp(-m.k * t) + noise(0.06)) / 0.05) * 0.05),
      rate: (m, t) => m.k * Math.exp(-m.k * t) * 6,
      analyse(rows, m) { const r = rows.filter((x) => x.v > 0.3); if (r.length < 4) return { err: 'Take at least 4 samples, spread over a few half-lives.' }; const f = L.linreg(r.map((x) => x.t), r.map((x) => Math.log(x.v))); const k = -f.m; return { meas: { k }, chart: { x: r.map((x) => x.t), y: r.map((x) => Math.log(x.v)), fit: f, xl: 't / min', yl: 'ln (titre / mL)' }, lines: ['ln V = ln V₀ − k t', `slope = ${f.m.toFixed(4)} min⁻¹ (r² = ${f.r2.toFixed(4)})`, `k = ${k.toFixed(4)} min⁻¹`, `half-life = 0.693 / k = ${(Math.LN2 / k).toFixed(1)} min`], summary: `k = ${k.toFixed(4)} min⁻¹, t½ = ${(Math.LN2 / k).toFixed(1)} min (r² = ${f.r2.toFixed(3)})` }; },
      report: (m) => [{ id: 'k', label: 'Rate constant k', unit: 'min⁻¹', truth: m.k, dp: 4, tol: 0.1 }],
      solve: (a) => ({ values: { k: a.meas.k }, lines: a.lines }),
    },
    {
      id: 'ester', level: 'bsc', title: 'Methyl acetate hydrolysis (acid catalysed)', short: 'Pseudo-first-order rate constant', unis: [],
      steps: ['CH₃COOCH₃ + H₂O → CH₃COOH + CH₃OH, catalysed by 0.45 M HCl. Water is in huge excess, so the rate depends only on the ester (pseudo-first-order).', 'At each time withdraw 5 mL, quench in ice and titrate with 0.2000 M NaOH (phenolphthalein). The titre V<sub>t</sub> grows as acetic acid forms.', 'Take V₀ at t = 0. For V<sub>∞</sub> warm the flask to 60 °C for 30 minutes (use the button) so the reaction goes to completion.', 'k = (2.303 / t) log [(V<sub>∞</sub> − V₀) / (V<sub>∞</sub> − V<sub>t</sub>)]. Or plot ln(V<sub>∞</sub> − V<sub>t</sub>) against t.'],
      type: 'adv', unit: 'min', steps_t: [5, 10, 20], tmax: 180, col: 't / min', vcol: 'NaOH titre V<sub>t</sub> / mL', extra: true,
      params: [{ id: 'T', label: 'Temperature', min: 25, max: 45, step: 5, val: 35, unit: '°C', dp: 0 }],
      begin: (p) => { const V0 = 11.25 + noise(0.06); return { k: L.esterK(0.45, p.T) * 60, V0, Vinf: V0 + 7.5, Vinf_read: V0 + 7.5 + noise(0.05) }; },
      sample: (m, t) => Math.round((m.V0 + 7.5 * (1 - Math.exp(-m.k * t)) + noise(0.05)) / 0.05) * 0.05,
      rate: (m, t) => m.k * Math.exp(-m.k * t) * 5,
      analyse(rows, m, S) {
        if (S.vinf == null) return { err: 'Measure V∞ first (heat to completion).' };
        const z = rows.find((x) => x.t === 0); if (!z) return { err: 'Take a sample at t = 0 for V₀.' };
        const r = rows.filter((x) => x.t > 0 && S.vinf - x.v > 0.3); if (r.length < 3) return { err: 'Take at least 3 samples after t = 0.' };
        const ks = r.map((x) => (2.303 / x.t) * Math.log10((S.vinf - z.v) / (S.vinf - x.v))), mean = ks.reduce((a, b) => a + b, 0) / ks.length;
        const f = L.linreg(rows.filter((x) => S.vinf - x.v > 0.3).map((x) => x.t), rows.filter((x) => S.vinf - x.v > 0.3).map((x) => Math.log(S.vinf - x.v)));
        return { meas: { k: -f.m }, chart: { x: rows.filter((x) => S.vinf - x.v > 0.3).map((x) => x.t), y: rows.filter((x) => S.vinf - x.v > 0.3).map((x) => Math.log(S.vinf - x.v)), fit: f, xl: 't / min', yl: 'ln (V∞ − V_t)' }, lines: ks.map((k, i) => `t = ${r[i].t} min: k = (2.303/${r[i].t}) log[(${S.vinf.toFixed(2)} − ${z.v.toFixed(2)}) / (${S.vinf.toFixed(2)} − ${r[i].v.toFixed(2)})] = ${k.toFixed(4)} min⁻¹`).concat([`mean k = ${mean.toFixed(4)} min⁻¹;  slope of the plot gives k = ${(-f.m).toFixed(4)} min⁻¹`, `half-life = 0.693 / k = ${(Math.LN2 / -f.m).toFixed(0)} min`]), summary: `k (from the plot) = ${(-f.m).toFixed(4)} min⁻¹; mean of single values = ${mean.toFixed(4)} min⁻¹` };
      },
      report: (m) => [{ id: 'k', label: 'Rate constant k', unit: 'min⁻¹', truth: m.k, dp: 4, tol: 0.12 }],
      solve: (a) => ({ values: { k: a.meas.k }, lines: a.lines }),
    },
    {
      id: 'sapon', level: 'bsc', title: 'Saponification of ethyl acetate (conductometric)', short: 'Second-order rate constant', unis: [],
      steps: ['CH₃COOEt + NaOH → CH₃COONa + EtOH, with equal starting concentrations a. Fast OH⁻ ions are replaced by slower acetate ions, so the conductivity falls.', 'Take κ₀ at t = 0 (just after mixing), then readings at intervals. κ∞ is calculated: a × (λ<sub>Na</sub> + λ<sub>OAc</sub>).', 'The fraction reacted is f = (κ₀ − κ<sub>t</sub>) / (κ₀ − κ∞). For second-order kinetics f / (1 − f) = k a t. Plot it against t: the slope is k a.'],
      type: 'adv', unit: 's', steps_t: [15, 30, 60], tmax: 1200, col: 't / s', vcol: 'κ / mS cm⁻¹',
      params: [{ id: 'a', label: 'Initial concentration a', min: 0.02, max: 0.06, step: 0.01, val: 0.04, unit: 'M', dp: 2 }, { id: 'T', label: 'Temperature', min: 20, max: 40, step: 5, val: 25, unit: '°C', dp: 0 }],
      begin: (p) => ({ k: L.saponK(p.T), a: p.a }),
      sample: (m, t) => L.saponKappa(m.a, m.k, t) * (1 + noise(0.0015)),
      rate: (m, t) => 0.5,
      analyse(rows, m, S) {
        const z = rows.find((x) => x.t === 0); if (!z) return { err: 'Take κ₀ at t = 0 first.' };
        const kinf = m.a * (L.SAPON.lamNa + L.SAPON.lamOAc);
        const r = rows.filter((x) => x.t > 0).map((x) => { const f = (z.v - x.v) / (z.v - kinf); return { t: x.t, f, y: f / (1 - f) }; }).filter((x) => x.f > 0.02 && x.f < 0.9);
        if (r.length < 4) return { err: 'Take at least 4 readings between about 10 % and 85 % conversion.' };
        const f = L.linreg(r.map((x) => x.t), r.map((x) => x.y)), k = f.m / m.a;
        return { meas: { k }, chart: { x: r.map((x) => x.t), y: r.map((x) => x.y), fit: f, xl: 't / s', yl: 'f / (1 − f)' }, lines: [`κ∞ = ${m.a.toFixed(3)} × (${L.SAPON.lamNa} + ${L.SAPON.lamOAc}) = ${kinf.toFixed(3)} mS/cm`, `slope of f/(1−f) vs t = ${f.m.toExponential(3)} s⁻¹ (r² = ${f.r2.toFixed(4)})`, `k = slope / a = ${f.m.toExponential(3)} / ${m.a.toFixed(3)} = ${k.toFixed(4)} M⁻¹ s⁻¹`], summary: `k = ${k.toFixed(4)} M⁻¹ s⁻¹ (r² = ${f.r2.toFixed(3)})` };
      },
      report: (m) => [{ id: 'k', label: 'Rate constant k', unit: 'M⁻¹ s⁻¹', truth: m.k, dp: 4, tol: 0.12 }],
      solve: (a) => ({ values: { k: a.meas.k }, lines: a.lines }),
    },
    {
      id: 'persulfate', level: 'bsc', title: 'Persulfate–iodide clock: S₂O₈²⁻ + I⁻', short: 'Initial rates: orders and activation energy', unis: [],
      steps: ['S₂O₈²⁻ + 2I⁻ → 2SO₄²⁻ + I₂ is slow. A fixed small amount of thiosulfate (0.0020 M) turns the I₂ back into I⁻ as fast as it forms; when the thiosulfate is used up, the iodine meets the starch and the solution turns blue-black suddenly.', 'The time t measures the initial rate: rate = [S₂O₃²⁻]₀ / (2t).', 'Change [S₂O₈²⁻] alone, then [I⁻] alone, then the temperature alone. Keep the ionic strength constant in a real experiment (make up with K₂SO₄/KNO₃): this ionic reaction is sensitive to it.', 'Press “Fit my runs” to get both orders and E<sub>a</sub>.'],
      params: [{ id: 'ps', label: '[K₂S₂O₈]', min: 0.02, max: 0.1, step: 0.01, val: 0.04, unit: 'M', dp: 2 }, { id: 'ki', label: '[KI]', min: 0.05, max: 0.2, step: 0.01, val: 0.1, unit: 'M', dp: 2 }, { id: 'T', label: 'Temperature', min: 15, max: 45, step: 5, val: 25, unit: '°C', dp: 0 }],
      type: 'clock', cv: { a: 'ps', b: 'ki', la: '[S₂O₈²⁻]', lb: '[I⁻]', ta: 'S₂O₈²⁻', tb: 'I⁻', thio: 0.002, t: (p) => 0.002 / (2 * L.arrhenius(L.PERSULF.k25, L.PERSULF.Ea, p.T) * p.ps * p.ki), flask: 'K₂S₂O₈ + KI + Na₂S₂O₃ + starch in the flask' },
      report: () => [{ id: 'm', label: 'Order in S₂O₈²⁻', unit: '', truth: 1, dp: 0, abs: true, tol: 0.2 }, { id: 'n', label: 'Order in I⁻', unit: '', truth: 1, dp: 0, abs: true, tol: 0.2 }, { id: 'ea', label: 'Activation energy', unit: 'kJ/mol', truth: L.PERSULF.Ea / 1000, dp: 0, tol: 0.12 }],
    },
    {
      id: 'ester-naoh', level: 'bsc', title: 'Ethyl acetate + NaOH (titrimetric, second order)', short: 'Equal concentrations: plot 1/(a − x) against t', unis: [],
      steps: ['Equal volumes of 0.0400 M ethyl acetate and 0.0400 M NaOH are mixed at time zero, so both start at a = 0.0200 M: CH₃COOC₂H₅ + OH⁻ → CH₃COO⁻ + C₂H₅OH.', 'At each time withdraw 10.0 mL and run it into 20.0 mL of 0.0200 M HCl: the acid stops the reaction at once by neutralising the remaining OH⁻.', 'Back-titrate the excess HCl with 0.0200 M NaOH (phenolphthalein). The titre V grows as the reaction uses up OH⁻.', 'Remaining OH⁻: (a − x) = (20.0 − V) × 0.0200 / 10.0. For a second-order reaction with equal concentrations 1/(a − x) = 1/a + k t.'],
      type: 'adv', unit: 'min', steps_t: [2, 5, 10], tmax: 60, col: 't / min', vcol: 'back-titre V / mL',
      params: [{ id: 'T', label: 'Temperature', min: 20, max: 40, step: 5, val: 25, unit: '°C', dp: 0 }],
      begin: (p) => ({ k: L.saponK(p.T) * 60, a: 0.02 }),
      sample: (m, t) => { const x = (m.a * m.a * m.k * t) / (1 + m.a * m.k * t); return Math.round((20 - ((m.a - x) * 10) / 0.02 + noise(0.04)) / 0.05) * 0.05; },
      rate: () => 0,
      analyse(rows, m) {
        const r = rows.filter((x) => 20 - x.v > 0.4); if (r.length < 4) return { err: 'Take at least 4 samples, starting at t = 0.' };
        const ys = r.map((x) => 1 / (((20 - x.v) * 0.02) / 10)), f = L.linreg(r.map((x) => x.t), ys);
        return { meas: { k: f.m }, chart: { x: r.map((x) => x.t), y: ys, fit: f, xl: 't / min', yl: '1 / (a − x)  /  M⁻¹' }, lines: ['(a − x) = (20.0 − V) × 0.0200 / 10.0 for each sample', `slope of 1/(a − x) against t = ${f.m.toFixed(3)} M⁻¹ min⁻¹ (r² = ${f.r2.toFixed(4)})`, `intercept = ${f.b.toFixed(1)} M⁻¹ (should be 1/a = 50)`, `k = ${f.m.toFixed(3)} M⁻¹ min⁻¹ = ${(f.m / 60).toFixed(4)} M⁻¹ s⁻¹`, `half-life = 1/(k a) = ${(1 / (f.m * 0.02)).toFixed(1)} min (it depends on a: a sign of second order)`], summary: `k = ${f.m.toFixed(3)} M⁻¹ min⁻¹ (r² = ${f.r2.toFixed(3)})` };
      },
      report: (m) => [{ id: 'k', label: 'Rate constant k', unit: 'M⁻¹ min⁻¹', truth: m.k, dp: 3, tol: 0.1 }],
      solve: (a) => ({ values: { k: a.meas.k }, lines: a.lines }),
    },
    {
      id: 'sucrose', level: 'bsc', title: 'Inversion of cane sugar (polarimeter)', short: 'First-order rate constant from optical rotation', unis: [],
      steps: ['20% sucrose solution is mixed with an equal volume of HCl at time zero. H⁺ catalyses C₁₂H₂₂O₁₁ + H₂O → glucose + fructose (“invert sugar”). Water is in large excess, so the reaction is pseudo-first-order in sucrose.', 'Sucrose rotates plane-polarised light to the right (+66.5° specific rotation); the product mixture rotates it to the left, because fructose (−92°) outweighs glucose (+52.7°). The rotation therefore falls through zero and becomes negative.', 'Read the angle α at intervals in a 2 dm tube. For α∞, keep a sample at 50–60 °C for about an hour (button), cool and read it.', 'ln(α_t − α∞) = ln(α₀ − α∞) − k t.'],
      type: 'adv', unit: 'min', steps_t: [5, 10, 20], tmax: 240, col: 't / min', vcol: 'rotation α / °', extra: true, infBtn: 'Complete the inversion (get α∞)', infName: 'α∞', infStep: 0.01,
      infMsg: (v) => 'α∞ = ' + v.toFixed(2) + '° (sample kept at 55 °C for 1 h, cooled to the run temperature).',
      params: [{ id: 'h', label: '[HCl] after mixing', min: 0.5, max: 2, step: 0.25, val: 1, unit: 'M', dp: 2 }, { id: 'T', label: 'Temperature', min: 20, max: 40, step: 5, val: 30, unit: '°C', dp: 0 }],
      begin: (p) => { const a0 = 2 * 0.1 * 66.5, ainf = -2 * 0.1 * (360.3 / 342.3) * (92.4 - 52.7) / 2; return { k: L.arrhenius(L.SUCROSE.k25, L.SUCROSE.Ea, p.T) * p.h, a0, ainf, Vinf_read: ainf + noise(0.015) }; },
      sample: (m, t) => Math.round((m.ainf + (m.a0 - m.ainf) * Math.exp(-m.k * t) + noise(0.015)) / 0.01) * 0.01,
      rate: () => 0,
      analyse(rows, m, S) {
        if (S.vinf == null) return { err: 'Measure α∞ first.' };
        const r = rows.filter((x) => x.v - S.vinf > 0.3); if (r.length < 4) return { err: 'Take at least 4 readings, spread over one or two half-lives.' };
        const ys = r.map((x) => Math.log(x.v - S.vinf)), f = L.linreg(r.map((x) => x.t), ys);
        return { meas: { k: -f.m }, chart: { x: r.map((x) => x.t), y: ys, fit: f, xl: 't / min', yl: 'ln (α_t − α∞)' }, lines: [`α∞ = ${S.vinf.toFixed(2)}°`, `slope of ln(α_t − α∞) against t = ${f.m.toFixed(5)} min⁻¹ (r² = ${f.r2.toFixed(4)})`, `k = ${(-f.m).toFixed(5)} min⁻¹;  half-life = 0.693/k = ${(Math.LN2 / -f.m).toFixed(0)} min`, 'Repeat at another [HCl]: k is proportional to [H⁺], which shows that H⁺ is a catalyst.'], summary: `k = ${(-f.m).toFixed(5)} min⁻¹ (r² = ${f.r2.toFixed(3)})` };
      },
      report: (m) => [{ id: 'k', label: 'Rate constant k', unit: 'min⁻¹', truth: m.k, dp: 5, tol: 0.1 }],
      solve: (a) => ({ values: { k: a.meas.k }, lines: a.lines }),
    },
  ];
  const list = EXPS.filter((e) => rank[level] >= rank[e.level]);
  const S = { exp: null, p: {}, model: null, rows: [], t: 0, clock: null, vinf: null, shown: 0, analysis: null, speed: 1, tt: 0, bub: [] };

  function pick(id) {
    const e = list.find((x) => x.id === id) || list[0]; S.exp = e;
    S.p = {}; (e.params || []).forEach((p) => (S.p[p.id] = p.val)); (e.selects || []).forEach((s) => (S.p[s.id] = s.opts[0][0]));
    S.rows = []; S.model = null; S.t = 0; S.vinf = null; S.clock = null; S.analysis = null; S.runs = [];
    $('expTitle').textContent = e.title; $('expSub').textContent = e.short;
    $('steps').innerHTML = e.steps.map((s) => '<li>' + s + '</li>').join('');
    $('expList').querySelectorAll('.exp-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === e.id)));
    $('msg').innerHTML = ''; $('answerBox').innerHTML = ''; $('chartBox').hidden = true;
    paramsUI(); actionsUI(); tableUI(); readouts();
    history.replaceState(null, '', '?level=' + level + '&exp=' + e.id);
    if (window.Theory) Theory.mount(e.id);
  }
  function resetRun() { S.rows = []; S.model = null; S.t = 0; S.vinf = null; S.clock = null; S.analysis = null; $('msg').innerHTML = ''; $('answerBox').innerHTML = ''; $('chartBox').hidden = true; actionsUI(); tableUI(); readouts(); }

  function paramsUI() {
    const e = S.exp; let h = '<div class="two-col">';
    (e.selects || []).forEach((s) => { h += '<div class="field"><label for="p_' + s.id + '">' + s.label + '</label><select id="p_' + s.id + '">' + s.opts.map((o) => '<option value="' + o[0] + '">' + o[1] + '</option>').join('') + '</select></div>'; });
    (e.params || []).forEach((p) => { h += '<div class="field"><label for="p_' + p.id + '">' + p.label + ' <output id="o_' + p.id + '">' + S.p[p.id].toFixed(p.dp) + ' ' + p.unit + '</output></label><input type="range" id="p_' + p.id + '" min="' + p.min + '" max="' + p.max + '" step="' + p.step + '" value="' + S.p[p.id] + '"></div>'; });
    $('params').innerHTML = h + '</div>';
    $('params').oninput = (ev) => { const id = ev.target.id.slice(2), p = (e.params || []).find((x) => x.id === id); if (p) { S.p[id] = parseFloat(ev.target.value); $('o_' + id).textContent = S.p[id].toFixed(p.dp) + ' ' + p.unit; } else S.p[id] = ev.target.value; if (e.type === 'adv' && S.model) resetRun(); };
  }
  function actionsUI() {
    const e = S.exp; let h = '';
    if (e.type === 'clock') h = '<button type="button" class="btn-sm primary" id="mix">Mix and start the stopwatch</button><label class="btn-sm" style="display:inline-flex;gap:8px;align-items:center">Speed <select id="speed" style="background:transparent;color:inherit;border:0"><option value="1">real time</option><option value="10" selected>×10</option><option value="60">×60</option><option value="1000">instant</option></select></label>';
    else {
      h = S.model ? e.steps_t.map((d) => '<button type="button" class="btn-sm" data-adv="' + d + '">+' + d + ' ' + e.unit + '</button>').join('') + '<button type="button" class="btn-sm primary" id="sample">Take a sample now</button>' : '<button type="button" class="btn-sm primary" id="start">Start the reaction</button>';
      if (S.model && e.extra) h += '<button type="button" class="btn-sm" id="inf">' + (e.infBtn || 'Heat to completion (get V∞)') + '</button>';
    }
    h += '<button type="button" class="btn-sm" id="analyse">' + (e.type === 'clock' ? 'Fit my runs' : 'Analyse my data') + '</button><button type="button" class="btn-sm" id="reset">Clear data</button>';
    $('actions').innerHTML = h;
    if ($('speed')) $('speed').value = String(S.speed || 10), $('speed').onchange = (ev) => (S.speed = parseFloat(ev.target.value));
  }
  function readouts() {
    const e = S.exp; let h = '';
    if (e.type === 'clock') h = '<div class="big-read"><span>Stopwatch</span><b>' + (S.clock ? S.clock.t.toFixed(1) : '0.0') + ' s</b></div><div class="big-read"><span>Runs</span><b>' + S.rows.length + '</b></div>';
    else h = '<div class="big-read"><span>Clock</span><b>' + S.t + ' ' + e.unit + '</b></div><div class="big-read"><span>Samples</span><b>' + S.rows.length + '</b></div>' + (S.vinf != null ? '<div class="big-read"><span>' + (e.infName || 'V∞') + '</span><b>' + S.vinf.toFixed(2) + '</b></div>' : '');
    $('readouts').innerHTML = h;
  }
  function tableUI() {
    const e = S.exp, r = S.rows;
    if (!r.length) { $('trialsBox').innerHTML = ''; return; }
    if (e.type === 'clock') $('trialsBox').innerHTML = '<h4 class="lbl-sum" style="padding-top:14px">Observation table</h4><div style="overflow:auto"><table class="data-table"><thead><tr><th>Run</th><th>' + e.cv.la + ' / M</th><th>' + e.cv.lb + ' / M</th><th>T / °C</th><th>t / s</th></tr></thead><tbody>' + r.map((x, i) => '<tr><td>' + (i + 1) + '</td><td>' + x.a.toFixed(3) + '</td><td>' + x.b.toFixed(3) + '</td><td>' + x.T + '</td><td>' + x.t.toFixed(1) + '</td></tr>').join('') + '</tbody></table></div>';
    else $('trialsBox').innerHTML = '<h4 class="lbl-sum" style="padding-top:14px">Observation table</h4><table class="data-table"><thead><tr><th>' + e.col + '</th><th>' + e.vcol + '</th></tr></thead><tbody>' + r.map((x) => '<tr><td>' + x.t + '</td><td>' + x.v.toFixed(e.id === 'sapon' ? 3 : 2) + '</td></tr>').join('') + '</tbody></table>';
  }

  // ------------------------------------------------------------ actions
  function startClock() {
    const p = S.p, cv = S.exp.cv, t = Math.max(1, cv.t(p) * (1 + noise(0.025)) + noise(0.4));
    S.clock = { t: 0, tEnd: t, a: p[cv.a], b: p[cv.b], T: p.T, done: false }; actionsUI(); $('mix').disabled = true; $('msg').innerHTML = '';
  }
  function sampleNow() {
    const e = S.exp, v = e.sample(S.model, S.t);
    if (S.rows.find((x) => x.t === S.t)) { $('msg').innerHTML = '<div class="callout warn">You already took a sample at this time. Advance the clock first.</div>'; return; }
    S.rows.push({ t: S.t, v }); S.rows.sort((a, b) => a.t - b.t); S.shown = 1; tableUI(); readouts(); $('msg').innerHTML = '';
  }
  function analyse() {
    const e = S.exp, m = $('msg');
    if (e.type === 'clock') {
      const r = S.rows; if (r.length < 4) { m.innerHTML = '<div class="callout warn">Do at least 4 runs, changing one thing at a time.</div>'; return; }
      const cv = e.cv, X = r.map((x) => [1, Math.log(x.a), Math.log(x.b), 1 / (x.T + 273.15)]), y = r.map((x) => Math.log(cv.thio / (2 * x.t)));
      const b = L.ols(X, y);
      if (!b) { m.innerHTML = '<div class="callout warn">These runs cannot separate the effects yet. Vary ' + cv.la + ', ' + cv.lb + ' and the temperature (each at least twice) and use at least 4 runs.</div>'; return; }
      const meas = { m: b[1], n: b[2], ea: (-b[3] * 8.314) / 1000 };
      S.analysis = { meas, lines: [`rate = [S₂O₃²⁻]₀ / (2t) for every run (thiosulfate ${cv.thio} M)`, `Fit of ln(rate) = ln A + m ln${cv.la} + n ln${cv.lb} − Eₐ/(R T) to all runs:`, `m (order in ${cv.ta}) = ${b[1].toFixed(2)}`, `n (order in ${cv.tb}) = ${b[2].toFixed(2)}`, `Eₐ = ${meas.ea.toFixed(1)} kJ/mol`] };
      m.innerHTML = '<div class="callout ok">Fit result: order in ' + cv.ta + ' ≈ <b>' + b[1].toFixed(2) + '</b>, order in ' + cv.tb + ' ≈ <b>' + b[2].toFixed(2) + '</b>, E<sub>a</sub> ≈ <b>' + meas.ea.toFixed(0) + ' kJ/mol</b>. Round the orders to the nearest sensible integer. More varied runs reduce the scatter.</div>';
      // chart: rate vs predicted
      const pts = r.map((x, i) => [i + 1, Math.log10(1 / x.t)]);
      $('chartBox').hidden = false; $('chartTitle').textContent = 'log (1/t) for each run'; Chart.draw($('chart'), { series: [{ pts, color: '#ce72f5', dots: true, line: true }], xmin: 0, xmax: r.length + 1, xLabel: 'run number', yLabel: 'log₁₀ (1 / t)' });
      answerUI(S.analysis); return;
    }
    const a = e.analyse(S.rows, S.model, S);
    if (a.err) { m.innerHTML = '<div class="callout warn">' + esc(a.err) + '</div>'; return; }
    S.analysis = a; m.innerHTML = '<div class="callout ok">' + esc(a.summary) + '</div>';
    const f = a.chart.fit, xs = a.chart.x, xmax = Math.max(...xs) * 1.05;
    $('chartBox').hidden = false; $('chartTitle').textContent = a.chart.yl + ' against ' + a.chart.xl;
    Chart.draw($('chart'), { series: [{ pts: [[0, f.b], [xmax, f.m * xmax + f.b]], color: '#7cf0b4', line: true }, { pts: xs.map((x, i) => [x, a.chart.y[i]]), color: '#ce72f5', dots: true }], xmin: 0, xmax, xLabel: a.chart.xl, yLabel: a.chart.yl });
    answerUI(a);
  }
  function answerUI(a) {
    const e = S.exp, rep = e.report(S.model);
    $('answerBox').innerHTML = '<h4 class="lbl-sum" style="padding-top:14px">Your result</h4><p class="sub" style="margin:0 0 6px">Type the value you would report, then check it.</p><div class="answer-form">' + rep.map((r, i) => '<div class="field"><label for="ans' + i + '">' + esc(r.label) + ' <output>' + esc(r.unit) + '</output></label><input type="number" step="any" id="ans' + i + '" inputmode="decimal" placeholder="your answer"></div>').join('') + '<button type="button" class="btn-sm primary" id="check">Check</button><button type="button" class="btn-sm" id="worked">Show working</button></div><div id="verdict"></div><div id="workedOut"></div>';
    $('check').onclick = () => {
      $('verdict').innerHTML = rep.map((r, i) => {
        const v = parseFloat($('ans' + i).value); if (!isFinite(v)) return '<div class="callout warn">' + esc(r.label) + ': enter a number first.</div>';
        const err = r.abs ? Math.abs(v - r.truth) : (Math.abs(v - r.truth) / Math.abs(r.truth)) * 100, good = r.abs ? err <= r.tol : err <= r.tol * 100;
        return '<div class="callout ' + (good ? 'ok' : 'bad') + '"><b>' + esc(r.label) + ':</b> you gave ' + v + ', the true value in this model is ' + r.truth.toFixed(r.dp) + ' ' + esc(r.unit) + (r.abs ? '' : ' (error ' + err.toFixed(1) + ' %)') + '. ' + (good ? 'Well done.' : 'Not within the expected range. Look again at your plot, the units, and whether the readings cover enough of the reaction.') + '</div>';
      }).join('');
    };
    $('worked').onclick = () => { $('workedOut').innerHTML = '<div class="work-lines">' + a.lines.map(esc).join('<br>') + '</div>'; };
  }

  // ------------------------------------------------------------ bench drawing
  function size() { const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth || 760, h = Math.round(w * 0.5); if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.height = h + 'px'; } return { w, h, dpr }; }
  const mixHex = (a, b, t) => C.mix(a, b, Math.max(0, Math.min(1, t)));
  function frame() {
    const { w, h, dpr } = size(); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const dt = 0.016, e = S.exp; S.tt += dt;
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#22123b'); bg.addColorStop(1, '#120a22'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    let col = '#cfe6f5', bubble = 0, label = '';
    if (e.type === 'clock') {
      const c = S.clock;
      if (c && !c.done) { c.t += dt * (S.speed || 10); if (c.t >= c.tEnd) { c.t = c.tEnd; c.done = true; c.flashT = 0; S.rows.push({ a: c.a, b: c.b, T: c.T, t: c.tEnd }); tableUI(); actionsUI(); $('msg').innerHTML = '<div class="callout">Blue-black! Time = ' + c.tEnd.toFixed(1) + ' s. Change one condition and run again.</div>'; } readouts(); }
      if (c) { if (c.done) { c.flashT = (c.flashT || 0) + dt; col = mixHex('#e8efe3', '#101640', c.flashT / 0.8); } else { const f = c.t / c.tEnd; col = mixHex('#f3eecb', '#e9eee6', Math.min(1, f * 6)); bubble = 0; } label = (c.done ? c.tEnd : c.t).toFixed(1) + ' s'; }
      else label = '0.0 s';
    } else if (S.model) {
      bubble = e.rate(S.model, S.t); label = 't = ' + S.t + ' ' + e.unit;
      col = e.id === 'h2o2' ? (S.p.cat === 'FeCl3' ? mixHex('#f2e6c4', '#d9a24a', 0.9) : mixHex('#f1e8cc', '#bd7d2a', 0.45)) : e.id === 'sapon' ? '#d7ebf5' : '#d9ecf3';
    }
    // flask
    const fx = w * 0.5, fy = h * 0.86, fw = w * 0.2, fh = h * 0.66, top = fy - fh, nw = fw * 0.3;
    const path = () => { g.beginPath(); g.moveTo(fx - nw / 2, top); g.lineTo(fx - nw / 2, top + fh * 0.35); g.lineTo(fx - fw / 2, fy); g.lineTo(fx + fw / 2, fy); g.lineTo(fx + nw / 2, top + fh * 0.35); g.lineTo(fx + nw / 2, top); };
    g.save(); path(); g.clip(); const ly = fy - fh * 0.42;
    const lg = g.createLinearGradient(0, ly, 0, fy); const rg = C.hex2rgb(col); lg.addColorStop(0, 'rgba(' + rg.join(',') + ',.92)'); lg.addColorStop(1, 'rgba(' + C.hex2rgb(mixHex(col, '#000000', 0.25)).join(',') + ',.96)');
    g.fillStyle = lg; g.fillRect(fx - fw, ly, fw * 2, fh); g.restore();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; path(); g.stroke(); g.lineWidth = 1;
    // bubbles
    if (bubble > 0.001) { const n = Math.min(14, Math.ceil(bubble * 40)); for (let i = 0; i < n; i++) { const ph = (S.tt * (0.6 + bubble * 3) + i * 0.37) % 1, bx = fx + Math.sin(i * 7.3) * fw * 0.3, by = fy - 8 - ph * (fh * 0.42); g.fillStyle = 'rgba(255,255,255,' + (0.5 * (1 - ph)) + ')'; g.beginPath(); g.arc(bx, by, 2 + (i % 3), 0, 6.283); g.fill(); } }
    // stopwatch
    g.fillStyle = '#0d0618'; g.strokeStyle = 'rgba(206,114,245,.7)'; const sw = Math.min(w * 0.3, 200); g.beginPath(); g.roundRect ? g.roundRect(12, 12, sw, 52, 12) : g.rect(12, 12, sw, 52); g.fill(); g.stroke();
    g.fillStyle = '#7cf0b4'; g.font = '700 ' + Math.max(18, w * 0.03) + 'px ui-monospace, Menlo, monospace'; g.textAlign = 'center'; g.fillText(label || '—', 12 + sw / 2, 46);
    g.fillStyle = 'rgba(235,225,250,.8)'; g.textAlign = 'left'; g.font = Math.max(10, w * 0.016) + 'px Hanken Grotesk, sans-serif';
    const t1 = e.type === 'clock' ? e.cv.flask : S.model ? 'Reaction running: ' + (S.p.T) + ' °C' : 'Press Start to begin';
    g.fillText(t1, 12, h - 12);
    requestAnimationFrame(frame);
  }

  function init() {
    $('expCount').textContent = '(' + list.length + ')';
    $('expList').innerHTML = list.map((e) => '<button type="button" class="exp-btn" data-id="' + e.id + '" aria-pressed="false"><b>' + e.title + '</b><span>' + e.short + '</span></button>').join('');
    const nl = EXPS.length - list.length; if (nl > 0) { const n = $('levelNote'); n.hidden = false; n.innerHTML = nl + ' more kinetics experiments (ester hydrolysis, H₂O₂ decomposition, saponification) open at the <a href="bsc.html?level=bsc" style="color:var(--pink)">Bachelors (BSc / BS) level</a>.'; }
    const LV = window.LevelInfo && LevelInfo.LV[level], lk = $('crumbLevel'); if (lk && LV) { lk.textContent = LV.name; lk.href = LV.page + '?level=' + level; }
    if (innerWidth < 900) $('expDetails').open = false;
    $('expList').addEventListener('click', (ev) => { const b = ev.target.closest('.exp-btn'); if (b) { pick(b.dataset.id); if (innerWidth < 900) { $('expDetails').open = false; $('work').scrollIntoView({ behavior: 'smooth' }); } } });
    $('actions').addEventListener('click', (ev) => {
      const b = ev.target.closest('button'); if (!b) return; const e = S.exp;
      if (b.id === 'mix') startClock();
      else if (b.id === 'start') { S.model = e.begin(S.p); S.t = 0; S.rows = []; S.vinf = null; actionsUI(); readouts(); tableUI(); $('msg').innerHTML = '<div class="callout">Reaction started. Take a sample at t = 0 first.</div>'; }
      else if (b.dataset.adv) { if (S.t + +b.dataset.adv > e.tmax) { $('msg').innerHTML = '<div class="callout warn">That is beyond the end of the experiment (' + e.tmax + ' ' + e.unit + ').</div>'; return; } S.t += +b.dataset.adv; readouts(); }
      else if (b.id === 'sample') sampleNow();
      else if (b.id === 'inf') { S.vinf = Math.round(S.model.Vinf_read / (e.infStep || 0.05)) * (e.infStep || 0.05); readouts(); $('msg').innerHTML = '<div class="callout">' + (e.infMsg ? e.infMsg(S.vinf) : 'V∞ = ' + S.vinf.toFixed(2) + ' mL (after 30 min at 60 °C).') + '</div>'; }
      else if (b.id === 'analyse') analyse();
      else if (b.id === 'reset') { S.rows = []; S.model = null; S.t = 0; S.vinf = null; S.clock = null; resetRun(); }
    });
    pick(q.get('exp') || list[0].id); requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
