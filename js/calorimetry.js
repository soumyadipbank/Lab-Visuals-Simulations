/* Lab Visuals: calorimetry simulator (heat of neutralisation, heat of solution, cooling correction) */
(function () {
  'use strict';
  const C = globalThis.Chem, L = C.Lab, $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const level = (window.LevelInfo && LevelInfo.level) || 'bsc', rank = { '11': 1, '12': 1, school: 1, bsc: 2 };
  const q = new URLSearchParams(location.search);
  const cv = $('bench'), g = cv.getContext('2d');
  const CP = 4.18, TM = 120;   // J/(g K), mixing time in s

  const EXPS = [
    { id: 'neutral', level: '11', title: 'Heat of neutralisation: HCl + NaOH', short: 'Strong acid with strong base', unis: [], kind: 'neut', sys: { acid: '1.0 M HCl', base: '1.0 M NaOH' }, dH: -57.3, n: 0.05, m: 100,
      steps: ['The calorimeter holds 50.0 mL of 1.0 M HCl. A second beaker holds 50.0 mL of 1.0 M NaOH at the same temperature.', 'Read the temperature every 30 s for 2 minutes. At t = 120 s press “Mix”. Keep stirring and read every 30 s until 15 minutes.', 'Plot T against t. Extend the pre-mixing line and the cooling line after mixing back to t = 120 s. The gap is the corrected ΔT.', 'ΔH = −(m c + W c) ΔT / n, with m = 100 g, c = 4.18 J g⁻¹ K⁻¹, W = water equivalent of the calorimeter, n = 0.0500 mol of water formed.'] },
    { id: 'weak', level: 'bsc', title: 'Heat of neutralisation: CH₃COOH + NaOH', short: 'Weak acid: part of the heat goes into ionisation', unis: [], kind: 'neut', sys: { acid: '1.0 M CH₃COOH', base: '1.0 M NaOH' }, dH: -55.2, n: 0.05, m: 100,
      steps: ['Same procedure as for HCl, but with 1.0 M acetic acid. Acetic acid is only partly ionised, so some energy is used to ionise it.', 'Find ΔH, then compare with the strong acid value (about −57 kJ/mol). The difference is the enthalpy of ionisation of acetic acid.'] },
    { id: 'solution', level: 'bsc', title: 'Heat of solution (choose a salt)', short: 'Dissolving can absorb or release heat', unis: [], kind: 'sol', n: 0, m: 0,
      salts: [['NH4NO3', 'NH₄NO₃ (5.00 g)', 25.7, 5.0, 80.04], ['KNO3', 'KNO₃ (5.00 g)', 34.9, 5.0, 101.1], ['NaOH', 'NaOH (2.00 g)', -44.5, 2.0, 40.0], ['CaCl2', 'anhydrous CaCl₂ (3.00 g)', -81.3, 3.0, 110.98]],
      steps: ['The calorimeter holds 100.0 mL of water. Weigh the solid and keep it ready.', 'Read the temperature for 2 minutes, then at t = 120 s add the solid and stir. Read every 30 s to 15 minutes.', 'Extrapolate the cooling line back to t = 120 s as before. ΔH of solution = −(m c + W c) ΔT / n (a positive answer means the solution cooled).'] },
  ];
  const list = EXPS.filter((e) => rank[level] >= rank[e.level]);
  const S = { exp: null, salt: 0, W: 12, model: null, t: 0, rows: [], mixed: false, analysis: null, tt: 0 };

  function setup() {
    const e = S.exp, W = Math.round((8 + Math.random() * 8) * 10) / 10; S.W = W;
    let dH = e.dH, n = e.n, m = e.m;
    if (e.kind === 'sol') { const s = e.salts[S.salt]; dH = s[2]; n = s[3] / s[4]; m = 100 + s[3]; }
    const dT = (-dH * n * 1000) / (m * CP + S.W * CP);
    S.model = { dH, n, m, dT, T0: 24.6 + Math.round(Math.random() * 8) / 10, kLoss: 0.0007 + Math.random() * 0.0005 };
    S.model.curve = L.calorimeter(S.model.T0, dT, 12, S.model.kLoss, S.model.T0 - 0.0, 1200, 1);
  }
  const tempAt = (t) => { const m = S.model; if (t < TM) return m.T0 + Math.sin(t / 40) * 0.01; const c = m.curve[Math.round(t - TM)]; return c ? c[1] : m.curve[m.curve.length - 1][1]; };
  const reading = (t) => Math.round((tempAt(t) + L.gauss(Math.random) * 0.03) * 10) / 10;

  function pick(id) {
    S.exp = list.find((x) => x.id === id) || list[0]; S.salt = 0; S.rows = []; S.t = 0; S.mixed = false; S.analysis = null; setup();
    const e = S.exp; $('expTitle').textContent = e.title; $('expSub').textContent = e.short;
    $('steps').innerHTML = e.steps.map((s) => '<li>' + esc(s) + '</li>').join('');
    $('expList').querySelectorAll('.exp-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === e.id)));
    $('chartBox').hidden = true; $('answerBox').innerHTML = ''; $('msg').innerHTML = '';
    let p = ''; if (e.kind === 'sol') p = '<div class="field"><label for="saltSel">Solid</label><select id="saltSel">' + e.salts.map((s, i) => '<option value="' + i + '">' + s[1] + '</option>').join('') + '</select></div>';
    p += '<p class="sub" style="margin:4px 0">Water equivalent of the calorimeter: <b>' + S.W.toFixed(1) + ' g</b> (given for this calorimeter).</p>';
    $('params').innerHTML = p; if ($('saltSel')) $('saltSel').onchange = (ev) => { S.salt = +ev.target.value; S.rows = []; S.t = 0; S.mixed = false; S.analysis = null; setup(); render(); $('chartBox').hidden = true; $('answerBox').innerHTML = ''; };
    history.replaceState(null, '', '?level=' + level + '&exp=' + e.id); render();
    if (window.Theory) Theory.mount(e.id);
  }
  function render() {
    const e = S.exp;
    $('readouts').innerHTML = '<div class="big-read"><span>Time</span><b>' + S.t + ' s</b></div><div class="big-read"><span>Thermometer</span><b>' + (S.rows.length ? S.rows[S.rows.length - 1].T.toFixed(1) : tempReadout()) + ' °C</b></div><div class="big-read"><span>Readings</span><b>' + S.rows.length + '</b></div>';
    const done = S.t >= 900;
    $('actions').innerHTML = '<button type="button" class="btn-sm primary" id="read"' + (done ? ' disabled' : '') + '>Read thermometer (+30 s)</button>' + (S.mixed ? '' : '<button type="button" class="btn-sm" id="mix"' + (S.t < TM ? ' disabled title="Take readings until t = 120 s first"' : '') + '>' + (e.kind === 'sol' ? 'Add the solid now' : 'Mix now') + '</button>') + '<button type="button" class="btn-sm" id="auto">Auto-run to 15 min</button><button type="button" class="btn-sm" id="analyse">Plot and extrapolate</button><button type="button" class="btn-sm" id="again">Start again</button>';
    const r = S.rows;
    $('trialsBox').innerHTML = r.length ? '<h4 class="lbl-sum" style="padding-top:14px">Observation table</h4><div style="max-height:220px;overflow:auto"><table class="data-table"><thead><tr><th>t / s</th><th>T / °C</th></tr></thead><tbody>' + r.map((x) => '<tr><td>' + x.t + '</td><td>' + x.T.toFixed(1) + '</td></tr>').join('') + '</tbody></table></div>' : '';
  }
  const tempReadout = () => (S.model ? S.model.T0.toFixed(1) : '—');
  function step() {
    if (S.t >= 900) return;
    if (S.t >= TM && !S.mixed) { $('msg').innerHTML = '<div class="callout warn">You passed t = 120 s without mixing. Press “Mix now”: the temperature changes only after mixing.</div>'; return; }
    S.rows.push({ t: S.t, T: reading(S.t) }); S.t += 30; $('msg').innerHTML = '';
  }
  function analyse() {
    const m = $('msg'), r = S.rows, pre = r.filter((x) => x.t < TM), post = r.filter((x) => x.t >= TM + 90);
    if (pre.length < 3 || post.length < 4) { m.innerHTML = '<div class="callout warn">Take readings before mixing (at least 3) and for several minutes after (at least 4 readings from 210 s on).</div>'; return; }
    const f1 = L.linreg(pre.map((x) => x.t), pre.map((x) => x.T)), f2 = L.linreg(post.map((x) => x.t), post.map((x) => x.T));
    const Ta = f1.m * TM + f1.b, Tb = f2.m * TM + f2.b, dT = Tb - Ta, M = S.model, e = S.exp;
    const kJ = (-(M.m * CP + S.W * CP) * dT) / (M.n * 1000);
    const raw = r.length ? (Math.max(...r.map((x) => x.T)) - Math.min(...pre.map((x) => x.T))) : 0;
    S.analysis = { dT, kJ, lines: [`T before mixing, extrapolated to 120 s = ${Ta.toFixed(2)} °C`, `T after mixing, cooling line extrapolated back to 120 s = ${Tb.toFixed(2)} °C`, `corrected ΔT = ${dT.toFixed(2)} K (the highest reading alone would give ${raw.toFixed(2)} K, which is too small because heat was already being lost)`, `heat = (${M.m} × 4.18 + ${S.W.toFixed(1)} × 4.18) × ${dT.toFixed(2)} = ${((M.m * CP + S.W * CP) * Math.abs(dT)).toFixed(0)} J`, `n = ${M.n.toFixed(4)} mol → ΔH = ${kJ.toFixed(1)} kJ/mol`] };
    m.innerHTML = '<div class="callout ok">Corrected ΔT = <b>' + dT.toFixed(2) + ' K</b>. Now calculate ΔH yourself and check it.</div>';
    $('chartBox').hidden = false; $('chartTitle').textContent = 'Temperature against time';
    Chart.draw($('chart'), { series: [{ pts: r.map((x) => [x.t, x.T]), color: '#ce72f5', dots: true, line: true }, { pts: [[0, f1.b], [TM, Ta]], color: '#7cf0b4', line: true }, { pts: [[TM, Tb], [900, f2.m * 900 + f2.b]], color: '#7cf0b4', line: true }], xmin: 0, xmax: 900, xLabel: 't / s', yLabel: 'T / °C', vlines: [{ x: TM, label: 'mixing', color: '#ffcb83' }] });
    const truth = M.dH;
    $('answerBox').innerHTML = '<h4 class="lbl-sum" style="padding-top:14px">Your result</h4><div class="answer-form"><div class="field"><label for="ans0">ΔH <output>kJ/mol</output></label><input type="number" step="any" id="ans0" inputmode="decimal" placeholder="with sign"></div><button type="button" class="btn-sm primary" id="check">Check</button><button type="button" class="btn-sm" id="worked">Show working</button></div><div id="verdict"></div><div id="workedOut"></div>';
    $('check').onclick = () => {
      const v = parseFloat($('ans0').value), vd = $('verdict'); if (!isFinite(v)) { vd.innerHTML = '<div class="callout warn">Enter a number first.</div>'; return; }
      const err = (Math.abs(v - truth) / Math.abs(truth)) * 100;
      let msg = (e.kind === 'sol' ? '' : '') + 'you gave ' + v + ', the value in this model is ' + truth.toFixed(1) + ' kJ/mol (error ' + err.toFixed(1) + ' %). ';
      if (err <= 6) msg += 'Good, within the expected scatter.'; else if (Math.sign(v) !== Math.sign(truth)) msg += 'The sign is wrong: ' + (truth < 0 ? 'the temperature rose, so heat was released and ΔH is negative.' : 'the temperature fell, so heat was absorbed and ΔH is positive.'); else msg += 'Check ΔT (did you extrapolate?), the total mass and the number of moles.';
      vd.innerHTML = '<div class="callout ' + (err <= 6 ? 'ok' : 'bad') + '">' + msg + '</div>';
    };
    $('worked').onclick = () => { $('workedOut').innerHTML = '<div class="work-lines">' + S.analysis.lines.map(esc).join('<br>') + '</div>'; };
  }

  function size() { const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth || 760, h = Math.round(w * 0.5); if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.height = h + 'px'; } return { w, h, dpr }; }
  function frame() {
    const { w, h, dpr } = size(); g.setTransform(dpr, 0, 0, dpr, 0, 0); S.tt += 0.016;
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#22123b'); bg.addColorStop(1, '#120a22'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const T = S.model ? tempAt(S.t) : 25, dT = S.model ? T - S.model.T0 : 0, e = S.exp;
    // outer cup
    const cx = w * 0.5, cy = h * 0.88, cw = w * 0.26, ch = h * 0.55;
    g.fillStyle = 'rgba(240,235,250,.12)'; g.strokeStyle = 'rgba(255,255,255,.5)'; g.lineWidth = 2; g.beginPath(); g.moveTo(cx - cw / 2 - 10, cy - ch - 8); g.lineTo(cx - cw / 2, cy); g.lineTo(cx + cw / 2, cy); g.lineTo(cx + cw / 2 + 10, cy - ch - 8); g.stroke(); g.lineWidth = 1;
    // liquid colour reflects temperature
    const hot = Math.max(-1, Math.min(1, dT / 5)), col = hot >= 0 ? C.mix('#cfe6f5', '#ff9a6a', hot) : C.mix('#cfe6f5', '#6ab6ff', -hot), rg = C.hex2rgb(col);
    g.fillStyle = 'rgba(' + rg.join(',') + ',.85)'; g.beginPath(); g.moveTo(cx - cw / 2 - 6, cy - ch * 0.75); g.lineTo(cx - cw / 2 + 2, cy - 2); g.lineTo(cx + cw / 2 - 2, cy - 2); g.lineTo(cx + cw / 2 + 6, cy - ch * 0.75); g.fill();
    // stirrer swirl after mixing
    if (S.mixed && S.t < TM + 120) { g.strokeStyle = 'rgba(255,255,255,.35)'; g.beginPath(); g.ellipse(cx, cy - ch * 0.5, cw * 0.3, 8, 0, 0, 6.283); g.stroke(); }
    // thermometer
    const tx = cx + cw * 0.18, tTop = cy - ch - h * 0.12, tBot = cy - 14; g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(tx - 5, tTop, 10, tBot - tTop);
    const frac = Math.max(0.05, Math.min(1, (T - 15) / 25)); g.fillStyle = '#e53935'; g.fillRect(tx - 2.5, tBot - (tBot - tTop) * frac, 5, (tBot - tTop) * frac); g.beginPath(); g.arc(tx, tBot + 2, 8, 0, 6.283); g.fill();
    // digital display
    g.fillStyle = '#0d0618'; g.strokeStyle = 'rgba(206,114,245,.7)'; const sw = Math.min(w * 0.3, 200); g.beginPath(); g.roundRect ? g.roundRect(12, 12, sw, 52, 12) : g.rect(12, 12, sw, 52); g.fill(); g.stroke();
    g.fillStyle = '#7cf0b4'; g.font = '700 ' + Math.max(18, w * 0.03) + 'px ui-monospace, Menlo, monospace'; g.textAlign = 'center'; g.fillText(T.toFixed(1) + ' °C', 12 + sw / 2, 46);
    g.fillStyle = 'rgba(235,225,250,.8)'; g.textAlign = 'left'; g.font = Math.max(10, w * 0.016) + 'px Hanken Grotesk, sans-serif';
    g.fillText(S.mixed ? 'Mixed at t = 120 s, stirring' : (S.t >= TM ? 'Ready to mix' : 'Before mixing: taking baseline readings'), 12, h - 12);
    requestAnimationFrame(frame);
  }

  function init() {
    $('expCount').textContent = '(' + list.length + ')';
    $('expList').innerHTML = list.map((e) => '<button type="button" class="exp-btn" data-id="' + e.id + '" aria-pressed="false"><b>' + e.title + '</b><span>' + e.short + '</span></button>').join('');
    const nl = EXPS.length - list.length; if (nl > 0) { const n = $('levelNote'); n.hidden = false; n.innerHTML = nl + ' more calorimetry experiments open at the <a href="bsc.html?level=bsc" style="color:var(--pink)">Bachelors (BSc / BS) level</a>.'; }
    const LV = window.LevelInfo && LevelInfo.LV[level], lk = $('crumbLevel'); if (lk && LV) { lk.textContent = LV.name; lk.href = LV.page + '?level=' + level; }
    if (innerWidth < 900) $('expDetails').open = false;
    $('expList').addEventListener('click', (ev) => { const b = ev.target.closest('.exp-btn'); if (b) { pick(b.dataset.id); if (innerWidth < 900) { $('expDetails').open = false; $('work').scrollIntoView({ behavior: 'smooth' }); } } });
    $('actions').addEventListener('click', (ev) => {
      const b = ev.target.closest('button'); if (!b || b.disabled) return;
      if (b.id === 'read') { step(); render(); }
      else if (b.id === 'mix') { S.mixed = true; render(); $('msg').innerHTML = '<div class="callout">Mixed. Keep taking readings.</div>'; }
      else if (b.id === 'auto') { if (S.t < TM) { while (S.t < TM) step(); } S.mixed = true; while (S.t < 900) step(); render(); }
      else if (b.id === 'analyse') analyse();
      else if (b.id === 'again') pick(S.exp.id);
    });
    pick(q.get('exp') || list[0].id); requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
