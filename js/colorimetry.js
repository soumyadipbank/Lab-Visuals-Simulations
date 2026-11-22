/* Lab Visuals: colorimetry / spectrophotometry simulator (Beer-Lambert law) */
(function () {
  'use strict';
  const C = globalThis.Chem, L = C.Lab, $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const level = (window.LevelInfo && LevelInfo.level) || 'bsc', rank = { '11': 1, '12': 1, school: 1, bsc: 2 };
  const q = new URLSearchParams(location.search);
  const cv = $('bench'), g = cv.getContext('2d');
  const STOCK = 1.0e-3, FLASK = 50;
  const EXPS = [
    { id: 'kmno4', level: '12', sp: 'KMnO4', title: 'Beer’s law with KMnO₄', short: 'Calibration line and an unknown', unis: [], hint: 'purple, absorbs green light', unk: [0.5e-4, 1.6e-4] },
    { id: 'k2cr2o7', level: 'bsc', sp: 'K2Cr2O7', title: 'Beer’s law with K₂Cr₂O₇', short: 'A different λmax and a different ε', unis: [], hint: 'orange, absorbs blue and violet light', extra: 'Make all K₂Cr₂O₇ solutions (stock, standards and unknown) in dilute acid (e.g. 0.005 M H₂SO₄): in neutral water the Cr₂O₇²⁻ / HCrO₄⁻ / CrO₄²⁻ balance shifts on dilution and Beer’s law appears to fail.', unk: [0.5e-4, 1.6e-4] },
  ];
  const list = EXPS.filter((e) => rank[level] >= rank[e.level]);
  const S = { exp: null, lam: 400, rows: [], unk: null, unkC: 0, scan: null, analysis: null, cur: { label: 'blank', c: 0 }, shownA: 0 };
  const STEPS = ['Use the stock solution (1.00 × 10⁻³ M). Each standard is made by diluting a measured volume of stock to 50.0 mL, so c = V × 1.00 × 10⁻³ / 50.0.', 'Press “Scan the spectrum” to run the middle standard across 300–700 nm, and read the wavelength of maximum absorbance (λmax). Measure at λmax: the line is steepest and most sensitive there.', 'Measure at least 4 standards (5 or more is better) (try 1 to 10 mL of stock), then the unknown, with the wavelength set to λmax. Stay below A ≈ 1.5: very dark solutions deviate from Beer’s law.', 'Press “Fit the line”. The slope is ε l, and the unknown concentration is read from the line.'];

  function wl2rgb(w) { let r = 0, g2 = 0, b = 0; if (w >= 380 && w < 440) { r = -(w - 440) / 60; b = 1; } else if (w < 490) { g2 = (w - 440) / 50; b = 1; } else if (w < 510) { g2 = 1; b = -(w - 510) / 20; } else if (w < 580) { r = (w - 510) / 70; g2 = 1; } else if (w < 645) { r = 1; g2 = -(w - 645) / 65; } else if (w <= 700) r = 1; const f = w < 420 ? 0.35 + (0.65 * (w - 380)) / 40 : w > 680 ? 0.35 + (0.65 * (700 - w)) / 20 : 1; if (w < 380 || w > 700) return [150, 120, 190]; return [r, g2, b].map((x) => Math.round(255 * Math.pow(Math.max(0, x) * Math.max(0.35, f), 0.8))); }
  const meas = (c, lam) => L.absorbance(S.exp.sp, c, lam, Math.random);

  function pick(id) {
    S.exp = list.find((x) => x.id === id) || list[0]; const e = S.exp;
    S.rows = []; S.analysis = null; S.scan = null; S.lam = 400; S.cur = { label: 'blank', c: 0 };
    S.unkC = Math.round((e.unk[0] + Math.random() * (e.unk[1] - e.unk[0])) / 1e-6) * 1e-6;
    $('expTitle').textContent = e.title; $('expSub').textContent = e.short;
    $('steps').innerHTML = STEPS.concat(e.extra ? [e.extra] : []).map((s) => '<li>' + esc(s) + '</li>').join('');
    $('expList').querySelectorAll('.exp-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === e.id)));
    $('chartBox').hidden = true; $('answerBox').innerHTML = ''; $('msg').innerHTML = '';
    $('params').innerHTML = '<div class="field"><label for="lam">Wavelength <output id="lamO">' + S.lam + ' nm</output></label><input type="range" id="lam" min="300" max="700" step="1" value="' + S.lam + '"></div><div class="field"><span class="lbl">Standard: volume of stock in a 50 mL flask</span><div class="btn-row" id="vols">' + [1, 2, 3, 4, 5, 6, 8, 10].map((v) => '<button type="button" class="btn-sm" data-v="' + v + '">' + v + ' mL</button>').join('') + '</div></div>';
    $('params').oninput = (ev) => { if (ev.target.id === 'lam') { S.lam = +ev.target.value; $('lamO').textContent = S.lam + ' nm'; } };
    $('params').onclick = (ev) => { const b = ev.target.closest('[data-v]'); if (!b) return; const v = +b.dataset.v, c = (v * STOCK) / FLASK; S.cur = { label: v + ' mL standard', c }; const A = meas(c, S.lam); S.rows.push({ kind: 'std', c, A, lam: S.lam, label: v + ' mL' }); S.shownA = A; render(); };
    $('actions').innerHTML = '<button type="button" class="btn-sm" id="blank">Measure blank</button><button type="button" class="btn-sm" id="unk">Measure the unknown</button><button type="button" class="btn-sm primary" id="scan">Scan the spectrum</button><button type="button" class="btn-sm primary" id="fit">Fit the line</button><button type="button" class="btn-sm" id="clear">Clear</button>';
    history.replaceState(null, '', '?level=' + level + '&exp=' + e.id); render();
    if (window.Theory) Theory.mount(e.id);
  }
  function render() {
    $('readouts').innerHTML = '<div class="big-read"><span>Wavelength</span><b>' + S.lam + ' nm</b></div><div class="big-read"><span>Absorbance</span><b>' + S.shownA.toFixed(3) + '</b></div><div class="big-read"><span>Cuvette</span><b style="font-size:1.1rem">' + esc(S.cur.label) + '</b></div>';
    const r = S.rows;
    $('trialsBox').innerHTML = r.length ? '<h4 class="lbl-sum" style="padding-top:14px">Observation table</h4><div style="max-height:220px;overflow:auto"><table class="data-table"><thead><tr><th>Sample</th><th>λ / nm</th><th>c / 10⁻⁴ M</th><th>A</th></tr></thead><tbody>' + r.map((x) => '<tr><td>' + esc(x.label) + '</td><td>' + x.lam + '</td><td>' + (x.kind === 'unk' ? '?' : (x.c / 1e-4).toFixed(2)) + '</td><td>' + x.A.toFixed(3) + '</td></tr>').join('') + '</tbody></table></div>' : '';
  }
  function scan() {
    const c = (5 * STOCK) / FLASK, pts = []; for (let w = 300; w <= 700; w += 5) pts.push([w, meas(c, w)]);
    S.scan = pts; $('chartBox').hidden = false; $('chartTitle').textContent = 'Absorption spectrum of the 5 mL standard';
    Chart.draw($('chart'), { series: [{ pts, color: '#ce72f5', line: true, dots: false }], xmin: 300, xmax: 700, xLabel: 'wavelength / nm', yLabel: 'absorbance', ymin: 0 });
    $('msg').innerHTML = '<div class="callout">Look for the highest peak, then set the wavelength slider there. (Spectrum tip: use the tallest peak that lies in your instrument’s range.)</div>';
  }
  function fit() {
    const m = $('msg'), lm = L.lambdaMax(S.exp.sp), unk = S.rows.filter((x) => x.kind === 'unk').pop(), lastStd = S.rows.filter((x) => x.kind === 'std').pop(), refLam = unk ? unk.lam : lastStd ? lastStd.lam : null, std = S.rows.filter((x) => x.kind === 'std' && Math.abs(x.lam - refLam) < 1);   /* standards measured at the same wavelength as the unknown */
    if (std.length < 4) { m.innerHTML = '<div class="callout warn">Measure at least 4 standards at the same wavelength.</div>'; return; }
    const lam = std[0].lam, f = L.linreg(std.map((x) => x.c), std.map((x) => x.A));
    if (!unk || Math.abs(unk.lam - lam) > 1) { m.innerHTML = '<div class="callout warn">Measure the unknown at the same wavelength as the standards (' + lam + ' nm).</div>'; return; }
    const cx = (unk.A - f.b) / f.m, eps = f.m;
    S.analysis = { eps, cx, lam, lines: [`Fit of A against c at ${lam} nm: A = ${f.m.toFixed(0)} c + ${f.b.toFixed(4)}  (r² = ${f.r2.toFixed(4)})`, `ε = slope / l = ${f.m.toFixed(0)} L mol⁻¹ cm⁻¹ (l = 1 cm)`, `unknown: c = (A − intercept) / slope = (${unk.A.toFixed(3)} − ${f.b.toFixed(4)}) / ${f.m.toFixed(0)} = ${(cx / 1e-4).toFixed(2)} × 10⁻⁴ M`] };
    const off = Math.abs(lam - lm) > 15 ? ' Your wavelength is ' + Math.abs(lam - lm).toFixed(0) + ' nm away from λmax: the slope is lower than it could be.' : '';
    m.innerHTML = '<div class="callout ok">Best straight line through your standards: <b>A = ' + f.m.toFixed(0) + ' c ' + (f.b < 0 ? '− ' : '+ ') + Math.abs(f.b).toFixed(4) + '</b> (c in mol L⁻¹, r² = ' + f.r2.toFixed(4) + '). From it, find ε (path length 1 cm) and the concentration of the unknown (A = ' + unk.A.toFixed(3) + ').' + off + '</div>';
    $('chartBox').hidden = false; $('chartTitle').textContent = 'Calibration line at ' + lam + ' nm';
    const xmax = Math.max(...std.map((x) => x.c), cx) * 1.15;
    Chart.draw($('chart'), { series: [{ pts: [[0, f.b], [xmax, f.m * xmax + f.b]], color: '#7cf0b4', line: true }, { pts: std.map((x) => [x.c, x.A]), color: '#ce72f5', dots: true }, { pts: [[0, unk.A]], color: '#ffcb83', dots: true, r: 5 }], xmin: 0, xmax, ymin: 0, xLabel: 'c / mol L⁻¹', yLabel: 'absorbance', hlines: [{ y: unk.A }] });
    $('answerBox').innerHTML = '<h4 class="lbl-sum" style="padding-top:14px">Your result</h4><div class="answer-form"><div class="field"><label for="ans0">Unknown concentration <output>× 10⁻⁴ M</output></label><input type="number" step="any" id="ans0" inputmode="decimal"></div><div class="field"><label for="ans1">ε at your wavelength <output>L mol⁻¹ cm⁻¹</output></label><input type="number" step="any" id="ans1" inputmode="decimal"></div><button type="button" class="btn-sm primary" id="check">Check</button><button type="button" class="btn-sm" id="worked" hidden>Show working</button></div><div id="verdict"></div><div id="workedOut"></div>';
    let tries = 0, revealed = false;
    $('check').onclick = () => {
      const a = parseFloat($('ans0').value), b = parseFloat($('ans1').value), t0 = S.unkC / 1e-4, t1 = L.epsAt(S.exp.sp, lam), out = [];
      if (!isFinite(a) || !isFinite(b)) { $('verdict').innerHTML = '<div class="callout warn">Enter both values first.</div>'; return; }
      tries++; const ea = (Math.abs(a - t0) / t0) * 100, eb = (Math.abs(b - t1) / t1) * 100; revealed = revealed || (ea <= 5 && eb <= 8) || tries >= 3;
      const one = (lbl, v, tr, e, tol, dp, unit) => '<div class="callout ' + (e <= tol ? 'ok' : 'bad') + '"><b>' + lbl + ':</b> ' + (e <= tol ? 'within the accepted range.' : 'outside the accepted range: check the slope, the units (× 10⁻⁴ M) and the intercept.') + (revealed ? ' The true value is ' + tr.toFixed(dp) + ' ' + unit + ' (your error ' + e.toFixed(1) + ' %).' : '') + '</div>';
      $('verdict').innerHTML = one('Unknown concentration', a, t0, ea, 5, 2, '× 10⁻⁴ M') + one('ε', b, t1, eb, 8, 0, 'L mol⁻¹ cm⁻¹') + (revealed ? '' : '<div class="callout">' + (3 - tries) + ' more tr' + (3 - tries === 1 ? 'y' : 'ies') + ' before the answers are shown.</div>');
      if (revealed) $('worked').hidden = false;
    };
    $('worked').onclick = () => { $('workedOut').innerHTML = '<div class="work-lines">' + S.analysis.lines.map(esc).join('<br>') + '</div>'; };
  }

  function size() { const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth || 760, h = Math.round(w * 0.45); if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.height = h + 'px'; } return { w, h, dpr }; }
  function frame() {
    const { w, h, dpr } = size(); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#22123b'); bg.addColorStop(1, '#120a22'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const my = h * 0.5, rgb = wl2rgb(S.lam), sp = S.exp.sp, c = S.cur.c, A = L.absorbance(sp, c, S.lam, null), T = Math.pow(10, -A);
    // lamp and monochromator
    g.fillStyle = '#ffe9a8'; g.beginPath(); g.arc(w * 0.08, my, 14, 0, 6.283); g.fill();
    g.fillStyle = '#3a2b57'; g.fillRect(w * 0.18, my - 38, 56, 76); g.fillStyle = 'rgba(255,255,255,.7)'; g.font = '11px Hanken Grotesk, sans-serif'; g.textAlign = 'center'; g.fillText('prism', w * 0.18 + 28, my + 54);
    // beams
    const grad1 = g.createLinearGradient(w * 0.08, 0, w * 0.18, 0); grad1.addColorStop(0, 'rgba(255,240,200,.8)'); grad1.addColorStop(1, 'rgba(255,240,200,.3)'); g.fillStyle = grad1; g.fillRect(w * 0.08, my - 3, w * 0.1, 6);
    const cx0 = w * 0.5, cw = 54;
    g.fillStyle = 'rgba(' + rgb.join(',') + ',.95)'; g.fillRect(w * 0.18 + 56, my - 3, cx0 - cw / 2 - w * 0.18 - 56, 6);
    // cuvette
    const sc = C.hex2rgb(L.SPECIES[sp].color), dil = Math.min(1, 1 - Math.pow(10, -(L.epsAt(sp, L.lambdaMax(sp)) * c) * 0.9)) * 0.95;
    g.fillStyle = 'rgba(255,255,255,.12)'; g.fillRect(cx0 - cw / 2, my - 52, cw, 104); g.fillStyle = c > 0 ? 'rgba(' + sc.join(',') + ',' + (0.12 + dil * 0.85).toFixed(2) + ')' : 'rgba(200,230,245,.25)'; g.fillRect(cx0 - cw / 2 + 3, my - 36, cw - 6, 86);
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.strokeRect(cx0 - cw / 2, my - 52, cw, 104);
    // transmitted beam fades with absorbance
    g.fillStyle = 'rgba(' + rgb.join(',') + ',' + Math.max(0.03, T * 0.95).toFixed(3) + ')'; g.fillRect(cx0 + cw / 2, my - 3, w * 0.8 - cx0 - cw / 2, 6);
    // detector
    g.fillStyle = '#0d0618'; g.strokeStyle = 'rgba(206,114,245,.7)'; g.fillRect(w * 0.8, my - 40, w * 0.17, 80); g.strokeRect(w * 0.8, my - 40, w * 0.17, 80);
    g.fillStyle = '#7cf0b4'; g.font = '700 ' + Math.max(9, Math.min(w * 0.028, (w * 0.17 - 8) / 4.6)) + 'px ui-monospace, Menlo, monospace'; g.textAlign = 'center'; g.fillText(S.shownA.toFixed(3), w * 0.885, my + 8);   /* absorbance, fitted to the detector box */
    g.fillStyle = 'rgba(235,225,250,.8)'; g.font = Math.max(10, w * 0.016) + 'px Hanken Grotesk, sans-serif'; g.fillText(S.lam + ' nm', w * 0.885, my - 22); g.fillText('A', w * 0.885, my + 26); g.fillText('light source', w * 0.08, my + 34); g.fillText('sample (1 cm)', cx0, my + 72); g.fillText('detector', w * 0.885, my + 56);
    requestAnimationFrame(frame);
  }

  function init() {
    $('expCount').textContent = '(' + list.length + ')';
    $('expList').innerHTML = list.map((e) => '<button type="button" class="exp-btn" data-id="' + e.id + '" aria-pressed="false"><b>' + e.title + '</b><span>' + e.short + '</span></button>').join('');
    const nl = EXPS.length - list.length; if (nl > 0) { const n = $('levelNote'); n.hidden = false; n.innerHTML = nl + ' more experiment opens at the <a href="bsc.html?level=bsc" style="color:var(--pink)">Bachelors (BSc / BS) level</a>.'; }
    const LV = window.LevelInfo && LevelInfo.LV[level], lk = $('crumbLevel'); if (lk && LV) { lk.textContent = LV.name; lk.href = LV.page + '?level=' + level; }
    if (innerWidth < 900) $('expDetails').open = false;
    $('expList').addEventListener('click', (ev) => { const b = ev.target.closest('.exp-btn'); if (b) { pick(b.dataset.id); if (innerWidth < 900) { $('expDetails').open = false; $('work').scrollIntoView({ behavior: 'smooth' }); } } });
    $('actions').addEventListener('click', (ev) => {
      const b = ev.target.closest('button'); if (!b) return;
      if (b.id === 'blank') { S.cur = { label: 'blank (water)', c: 0 }; S.shownA = meas(0, S.lam); S.rows.push({ kind: 'blank', c: 0, A: S.shownA, lam: S.lam, label: 'blank' }); render(); }
      else if (b.id === 'unk') { S.cur = { label: 'unknown', c: S.unkC }; S.shownA = meas(S.unkC, S.lam); S.rows.push({ kind: 'unk', c: S.unkC, A: S.shownA, lam: S.lam, label: 'unknown' }); render(); }
      else if (b.id === 'scan') scan(); else if (b.id === 'fit') fit();
      else if (b.id === 'clear') { S.rows = []; S.analysis = null; S.shownA = 0; S.cur = { label: 'blank', c: 0 }; $('chartBox').hidden = true; $('answerBox').innerHTML = ''; $('msg').innerHTML = ''; render(); }
    });
    pick(q.get('exp') || list[0].id); requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
