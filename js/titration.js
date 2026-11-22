/* Lab Visuals: titration simulator UI (bench canvas, burette, trial table, answer check) */
(function () {
  'use strict';
  const C = globalThis.Chem, L = C.Lab, T = C.Titr, $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const level = (window.LevelInfo && LevelInfo.level) || 'bsc';
  const q = new URLSearchParams(location.search);
  const TOL = { indicator: 0.02, indicator2: 0.03, conductometric: 0.06, potentiometric: 0.04 };
  const cv = $('bench'), g = cv.getContext('2d');
  const S = { exp: null, sess: null, V: 0, colour: null, shown: null, trials: [], pts: [], opts: {}, recorded: {}, run: 0, flash: 0, drip: 0, t: 0, graded: false };

  const list = T.forLevel(level);
  const hexRgb = (h) => C.hex2rgb ? C.hex2rgb(h) : [200, 230, 245];
  const WATER = '#cfe6f5';

  function pick(id) {
    const e = (list.find((x) => x.id === id)) || list[0];
    S.exp = e; S.sess = e.make(L.rng((Math.random() * 1e9) | 0)); S.V = 0; S.trials = []; S.pts = []; S.recorded = {}; S.graded = false;
    S.opts = { ph: e.mode === 'indicator2', mo: false, ind: (e.indicators && e.indicators[0]) || null, heat: false, starch: false, meter: false };
    S.shown = null; S.colour = null; refresh(true);
    history.replaceState(null, '', '?level=' + level + '&exp=' + e.id);
  }
  function fresh() { // new trial, same unknown
    S.V = 0; S.recorded = {}; S.pts = []; S.colour = null; S.shown = null;
    if (S.exp.mode === 'indicator2') { S.opts.ph = true; S.opts.mo = false; }
    refresh(false);
  }
  const ctx = () => ({ ind: S.opts.ind, ph: S.opts.ph, mo: S.opts.mo, starch: S.opts.starch, heated: S.opts.heat });
  const cur = () => S.sess.state(S.V, ctx());
  const reading = () => Math.round(S.V / 0.05) * 0.05;

  function add(dv) {
    if (S.V >= 50) return;
    S.V = Math.min(50, S.V + dv); S.drip = 1;
    const st = cur();
    if (st.flash) S.flash = 1;
    if (S.exp.mode === 'conductometric' || S.exp.mode === 'potentiometric') {
      const y = S.exp.mode === 'conductometric' ? st.kappa : st.E + (S.sess.noiseV ? L.gauss(Math.random) * S.sess.noiseV : 0);
      S.pts.push([+S.V.toFixed(3), y]);
    } else if (S.opts.meter) S.pts.push([+S.V.toFixed(3), st.pH]);
    refresh(false);
  }

  // ------------------------------------------------------------ rendering of the bench
  function size() { const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth || 760, h = Math.round(w * 0.6); if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.height = h + 'px'; } return { w, h, dpr }; }
  const rgbStr = (c, a) => { const r = hexRgb(c); return 'rgba(' + r[0] + ',' + r[1] + ',' + r[2] + ',' + (a == null ? 1 : a) + ')'; };
  function lerpHex(a, b, t) { return C.mix(a, b, t); }
  function draw(now) {
    const { w, h, dpr } = size(); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const dt = 0.016; S.t += dt;
    // smooth the colour shown in the flask
    const target = cur().colour || WATER;
    S.shown = S.shown ? lerpHex(S.shown, target, 0.18) : target;
    S.flash = Math.max(0, S.flash - dt * 0.9); S.drip = Math.max(0, S.drip - dt * 2.2);
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#22123b'); bg.addColorStop(1, '#120a22'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const cx = w * 0.5, bx = cx, bTop = h * 0.05, bBot = h * 0.52, bw = Math.max(20, w * 0.045);
    // stand
    g.fillStyle = '#35204f'; g.fillRect(bx + bw * 3.2, bTop, 7, h * 0.88); g.fillRect(bx + bw * 3.2 - w * 0.12, h * 0.93, w * 0.24, 9);
    g.fillRect(bx + bw * 0.7, bTop + h * 0.1, bw * 2.6, 6);
    // burette tube
    const tubeTop = bTop, tubeBot = bBot, tubeH = tubeBot - tubeTop;
    g.fillStyle = 'rgba(255,255,255,.09)'; g.fillRect(bx - bw / 2, tubeTop, bw, tubeH);
    const lvl = 1 - (S.V / 50);   // fraction of tube still filled (0 mL at the top)
    const liqTop = tubeTop + tubeH * (1 - lvl);
    g.fillStyle = S.sess.titrantColour ? rgbStr(S.sess.titrantColour, 0.85) : 'rgba(190,225,245,.5)';
    g.fillRect(bx - bw / 2 + 2, tubeTop + tubeH * (S.V / 50) * 0 + tubeH * (S.V / 50) * 0, bw - 4, 0);
    g.fillRect(bx - bw / 2 + 2, tubeTop + tubeH * (S.V / 50), bw - 4, tubeH * (1 - S.V / 50));
    // meniscus
    g.fillStyle = 'rgba(255,255,255,.55)'; g.fillRect(bx - bw / 2 + 2, tubeTop + tubeH * (S.V / 50) - 1, bw - 4, 2);
    // graduations
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.fillStyle = 'rgba(240,230,255,.85)'; g.font = Math.max(9, w * 0.014) + 'px Hanken Grotesk, sans-serif'; g.textAlign = 'right';
    for (let v = 0; v <= 50; v += 1) { const y = tubeTop + tubeH * (v / 50), big = v % 10 === 0, mid = v % 5 === 0; g.beginPath(); g.moveTo(bx - bw / 2, y); g.lineTo(bx - bw / 2 - (big ? 12 : mid ? 8 : 4), y); g.stroke(); if (v % 5 === 0) g.fillText(String(v), bx - bw / 2 - 15, y + 3); }
    g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 2; g.strokeRect(bx - bw / 2, tubeTop, bw, tubeH); g.lineWidth = 1;
    // stopcock and tip
    const tipY = tubeBot + h * 0.07;
    g.fillStyle = '#c9b8e6'; g.fillRect(bx - bw * 0.2, tubeBot, bw * 0.4, h * 0.07);
    g.fillStyle = '#ffcb83'; g.save(); g.translate(bx, tubeBot + h * 0.03); g.rotate(S.run ? 0 : Math.PI / 2); g.fillRect(-bw * 0.9, -3, bw * 1.8, 6); g.restore();
    g.fillStyle = '#c9b8e6'; g.beginPath(); g.moveTo(bx - bw * 0.2, tipY); g.lineTo(bx + bw * 0.2, tipY); g.lineTo(bx, tipY + h * 0.04); g.fill();
    // drop / stream
    const fy = h * 0.8;
    if (S.run || S.drip > 0) {
      g.fillStyle = S.sess.titrantColour ? rgbStr(S.sess.titrantColour, 0.9) : 'rgba(200,230,250,.8)';
      if (S.run) g.fillRect(bx - 1.5, tipY + h * 0.04, 3, fy - tipY - h * 0.1);
      else { const dy = tipY + h * 0.04 + (1 - S.drip) * (fy - tipY - h * 0.12); g.beginPath(); g.arc(bx, dy, 3.5, 0, 6.283); g.fill(); }
    }
    // conical flask
    const fw = w * 0.2, fh = h * 0.3, fcx = bx, top = fy - fh, neckW = fw * 0.3;
    const liqH = fh * 0.42, sw = Math.sin(S.t * 5) * (S.run ? 3 : 1);
    const path = () => { g.beginPath(); g.moveTo(fcx - neckW / 2, top); g.lineTo(fcx - neckW / 2, top + fh * 0.32); g.lineTo(fcx - fw / 2, fy); g.lineTo(fcx + fw / 2, fy); g.lineTo(fcx + neckW / 2, top + fh * 0.32); g.lineTo(fcx + neckW / 2, top); };
    g.save(); path(); g.clip();
    const ly = fy - liqH + sw * 0.4;
    const col = S.shown || WATER;
    const lg = g.createLinearGradient(0, ly, 0, fy); lg.addColorStop(0, rgbStr(col, 0.92)); lg.addColorStop(1, rgbStr(lerpHex(col, '#000000', 0.25), 0.96));
    g.fillStyle = lg; g.beginPath(); g.moveTo(fcx - fw, ly); for (let x = -fw; x <= fw; x += 6) g.lineTo(fcx + x, ly + Math.sin(S.t * 5 + x * 0.1) * (S.run ? 2.5 : 0.8)); g.lineTo(fcx + fw, fy + 4); g.lineTo(fcx - fw, fy + 4); g.fill();
    if (S.flash > 0 && cur().flash) { const r = g.createRadialGradient(fcx, ly + 6, 2, fcx, ly + 6, fw * 0.55); r.addColorStop(0, 'rgba(216,75,196,' + S.flash * 0.95 + ')'); r.addColorStop(1, 'rgba(216,75,196,0)'); g.fillStyle = r; g.fillRect(fcx - fw, ly - 10, fw * 2, liqH + 20); }
    g.restore();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; path(); g.stroke(); g.lineWidth = 1;
    // heater flame
    if (S.exp.needsHeat) {
      g.fillStyle = '#3a2b57'; g.fillRect(fcx - fw * 0.7, fy + 2, fw * 1.4, 8);
      if (S.opts.heat) { for (let i = 0; i < 7; i++) { const fx = fcx - fw * 0.45 + (i / 6) * fw * 0.9, fl = 10 + Math.sin(S.t * 14 + i * 2) * 4; const fg = g.createLinearGradient(0, fy + 2, 0, fy - fl); fg.addColorStop(0, 'rgba(255,170,60,.0)'); fg.addColorStop(1, 'rgba(80,140,255,.8)'); g.fillStyle = 'rgba(70,130,255,.55)'; g.beginPath(); g.ellipse(fx, fy + 2 + 6, 3, fl, 0, 0, 6.283); g.fill(); } }
    }
    // pH meter
    if (S.opts.meter || S.exp.mode === 'potentiometric' || S.exp.mode === 'conductometric') {
      const st = cur(), lab = S.exp.mode === 'conductometric' ? st.kappa.toFixed(2) + ' mS/cm' : S.exp.mode === 'potentiometric' ? (st.E).toFixed(3) + ' V' : 'pH ' + st.pH.toFixed(2);
      g.fillStyle = '#0d0618'; g.strokeStyle = 'rgba(206,114,245,.7)'; const mw = Math.min(w * 0.3, 190), mh = 44, mx = w - mw - 12, my = 12;
      g.beginPath(); g.roundRect ? g.roundRect(mx, my, mw, mh, 10) : g.rect(mx, my, mw, mh); g.fill(); g.stroke();
      g.fillStyle = '#7cf0b4'; g.font = '700 ' + Math.max(15, w * 0.026) + 'px ui-monospace, Menlo, monospace'; g.textAlign = 'center'; g.fillText(lab, mx + mw / 2, my + 29);
      g.strokeStyle = 'rgba(206,114,245,.7)'; g.beginPath(); g.moveTo(mx + 14, my + mh); g.lineTo(fcx + fw * 0.12, top + 8); g.lineTo(fcx + fw * 0.12, fy - 10); g.stroke();
    }
    // label
    g.fillStyle = 'rgba(235,225,250,.8)'; g.textAlign = 'left'; g.font = Math.max(10, w * 0.016) + 'px Hanken Grotesk, sans-serif';
    g.fillText('Burette: ' + S.sess.titrant, 12, h - 28); g.fillText('Flask: ' + S.sess.flask, 12, h - 10);
    requestAnimationFrame(draw);
  }

  // ------------------------------------------------------------ controls
  function readouts() {
    const st = cur();
    $('readouts').innerHTML = '<div class="big-read"><span>Burette reading</span><b>' + reading().toFixed(2) + ' mL</b></div>' +
      '<div class="big-read"><span>Trials recorded</span><b>' + S.trials.length + '</b></div>' +
      (S.opts.meter && S.exp.mode.startsWith('indicator') ? '<div class="big-read"><span>pH meter</span><b>' + st.pH.toFixed(2) + '</b></div>' : '');
  }
  function optBtns() {
    const e = S.exp, o = [];
    const b = (id, label, on) => '<button type="button" class="btn-sm" data-opt="' + id + '" aria-pressed="' + !!on + '">' + label + '</button>';
    if (e.mode === 'indicator' && e.indicators && e.indicators.length > 1) e.indicators.forEach((i) => o.push('<button type="button" class="btn-sm" data-ind="' + i + '" aria-pressed="' + (S.opts.ind === i) + '">' + (i === 'phph' ? 'Phenolphthalein' : 'Methyl orange') + '</button>'));
    if (e.mode === 'indicator2') { o.push(b('ph', 'Phenolphthalein', S.opts.ph)); o.push(b('mo', 'Methyl orange', S.opts.mo)); }
    if (e.needsHeat) o.push(b('heat', 'Heat to 60–70 °C', S.opts.heat));
    if (e.needsStarch) o.push(b('starch', 'Add starch', S.opts.starch));
    if (e.mode.startsWith('indicator')) o.push(b('meter', 'pH meter', S.opts.meter));
    $('opts').innerHTML = o.join('');
  }
  function actions() {
    const e = S.exp; let h = '';
    if (e.mode === 'indicator') h += '<button type="button" class="btn-sm primary" id="rec">Record titre</button>';
    else if (e.mode === 'indicator2') {
      h += '<button type="button" class="btn-sm primary" id="rec1">Record 1st end point</button><button type="button" class="btn-sm primary" id="rec2">Record 2nd end point</button>';
    } else h += '<button type="button" class="btn-sm primary" id="analyse">Analyse the curve</button>';
    h += '<button type="button" class="btn-sm" id="newTrial">' + (e.mode === 'indicator' || e.mode === 'indicator2' ? 'Refill and new trial' : 'Start again') + '</button><button type="button" class="btn-sm" id="newUnknown">New unknown</button>';
    $('actions').innerHTML = h;
  }

  function trialsUI() {
    const e = S.exp;
    if (e.mode === 'indicator') {
      if (!S.trials.length) { $('trialsBox').innerHTML = ''; return; }
      const t = S.trials, last = t.slice(-2);
      const conc = t.length >= 2 && Math.abs(last[0] - last[1]) <= 0.101;
      const rows = t.map((v, i) => '<tr class="' + (conc && i >= t.length - 2 ? 'good' : '') + '"><td>Trial ' + (i + 1) + '</td><td>0.00</td><td>' + v.toFixed(2) + '</td><td>' + v.toFixed(2) + '</td></tr>').join('');
      $('trialsBox').innerHTML = '<h4 class="lbl-sum" style="padding-top:14px">Observation table</h4><table class="data-table"><thead><tr><th>Trial</th><th>Initial / mL</th><th>Final / mL</th><th>Titre / mL</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        (conc ? '<div class="callout ok">Concordant: your last two titres agree within 0.1 mL. Mean titre = <b>' + ((last[0] + last[1]) / 2).toFixed(2) + ' mL</b>.</div>' : '<div class="callout">' + (t.length < 2 ? 'The first trial is a rough one. Repeat more carefully near the end point (use single drops).' : 'Not concordant yet. Repeat until two titres agree within 0.1 mL.') + '</div>');
    } else if (e.mode === 'indicator2') {
      const r = S.trials;
      if (!r.length) { $('trialsBox').innerHTML = ''; return; }
      const rows = r.map((x, i) => '<tr><td>Trial ' + (i + 1) + '</td><td>' + x[0].toFixed(2) + '</td><td>' + x[1].toFixed(2) + '</td></tr>').join('');
      const l = r.slice(-2), conc = r.length >= 2 && Math.abs(l[0][0] - l[1][0]) <= 0.101 && Math.abs(l[0][1] - l[1][1]) <= 0.151;
      $('trialsBox').innerHTML = '<h4 class="lbl-sum" style="padding-top:14px">Observation table</h4><table class="data-table"><thead><tr><th>Trial</th><th>V₁ (phenolphthalein) / mL</th><th>V₂ total (methyl orange) / mL</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        (conc ? '<div class="callout ok">Concordant. Mean V₁ = <b>' + ((l[0][0] + l[1][0]) / 2).toFixed(2) + '</b> mL, V₂ = <b>' + ((l[0][1] + l[1][1]) / 2).toFixed(2) + '</b> mL.</div>' : '<div class="callout">Repeat until two trials agree.</div>');
    } else {
      $('trialsBox').innerHTML = S.pts.length ? '<h4 class="lbl-sum" style="padding-top:14px">Observation table <small>(' + S.pts.length + ' readings)</small></h4><div style="max-height:210px;overflow:auto"><table class="data-table"><thead><tr><th>V / mL</th><th>' + (e.mode === 'conductometric' ? 'κ / mS cm⁻¹' : 'E vs SCE / V') + '</th></tr></thead><tbody>' + S.pts.map((p) => '<tr><td>' + p[0].toFixed(2) + '</td><td>' + (e.mode === 'conductometric' ? p[1].toFixed(3) : p[1].toFixed(3)) + '</td></tr>').join('') + '</tbody></table></div>' : '';
    }
  }

  function chart() {
    const e = S.exp, box = $('chartBox');
    const show = e.mode === 'conductometric' || e.mode === 'potentiometric' || (S.opts.meter && S.pts.length);
    box.hidden = !show; if (!show) return;
    $('chartTitle').textContent = e.mode === 'conductometric' ? 'Conductivity vs volume of NaOH' : e.mode === 'potentiometric' ? 'Cell potential vs volume of titrant' : 'pH vs volume of titrant';
    const series = [{ pts: S.pts.slice().sort((a, b) => a[0] - b[0]), color: '#ce72f5', dots: true, line: S.opts.meter || e.mode === 'potentiometric' }];
    const vl = [];
    if (S.graded && S.analysis) S.analysis.forEach((a) => vl.push({ x: a, label: a.toFixed(1) + ' mL', color: '#7cf0b4' }));
    Chart.draw($('chart'), { series, xmin: 0, xmax: S.sess.vmax, xLabel: 'volume added / mL', yLabel: e.mode === 'conductometric' ? 'κ / mS cm⁻¹' : e.mode === 'potentiometric' ? 'E / V' : 'pH', vlines: vl, ymin: e.mode.startsWith('indicator') ? 0 : undefined, ymax: e.mode.startsWith('indicator') ? 14 : undefined });
  }

  function answerUI(meas) {
    const e = S.exp, s = S.sess;
    if (!meas) { $('answerBox').innerHTML = ''; return; }
    const fields = s.report.map((r, i) => '<div class="field"><label for="ans' + i + '">' + esc(r.label) + ' <output>' + esc(r.unit) + '</output></label><input type="number" step="any" id="ans' + i + '" inputmode="decimal" placeholder="your answer"></div>').join('');
    $('answerBox').innerHTML = '<h4 class="lbl-sum" style="padding-top:14px">Your calculation</h4><p class="sub" style="margin:0 0 6px">Calculate from your own readings, then check.</p><div class="answer-form">' + fields + '<button type="button" class="btn-sm primary" id="check">Check</button><button type="button" class="btn-sm" id="worked">Show worked solution</button></div><div id="verdict"></div><div id="workedOut"></div>';
    $('check').onclick = () => {
      const r = s.solve(meas), out = [];
      s.report.forEach((rep, i) => {
        const v = parseFloat($('ans' + i).value);
        if (!isFinite(v)) { out.push('<div class="callout warn">' + esc(rep.label) + ': enter a number first.</div>'); return; }
        const tol = rep.tol || TOL[e.mode] || 0.03, err = rep.abs ? Math.abs(v - rep.truth) : (Math.abs(v - rep.truth) / Math.abs(rep.truth)) * 100;
        const good = rep.abs ? err <= tol : err <= tol * 100;
        out.push('<div class="callout ' + (good ? 'ok' : 'bad') + '"><b>' + esc(rep.label) + ':</b> you gave ' + v + ', the prepared value is ' + rep.truth.toFixed(rep.dp) + ' ' + esc(rep.unit) + ' (' + (rep.abs ? 'difference ' + err.toFixed(3) + ' V' : 'error ' + err.toFixed(1) + ' %') + '). ' + (good ? 'Within the acceptable range.' : 'Outside the acceptable range. Check your titre, the mole ratio and the units, or use “Show worked solution”.') + '</div>');
      });
      $('verdict').innerHTML = out.join('');
    };
    $('worked').onclick = () => { const r = s.solve(meas); $('workedOut').innerHTML = '<div class="work-lines">' + r.lines.map(esc).join('<br>') + '</div>'; };
  }

  // ------------------------------------------------------------ analysis
  function meanTrials() {
    const e = S.exp, t = S.trials;
    if (e.mode === 'indicator') { if (t.length < 2) return t.length ? { t: t[t.length - 1] } : null; const l = t.slice(-2); return { t: (l[0] + l[1]) / 2 }; }
    if (e.mode === 'indicator2') { if (!t.length) return null; const l = t.slice(-2); return { t1: l.reduce((a, b) => a + b[0], 0) / l.length, t2: l.reduce((a, b) => a + b[1], 0) / l.length }; }
    return null;
  }
  function interp(pts, x) { for (let i = 1; i < pts.length; i++) if (pts[i - 1][0] <= x && pts[i][0] >= x) { const a = pts[i - 1], b = pts[i], f = (x - a[0]) / (b[0] - a[0] || 1); return a[1] + f * (b[1] - a[1]); } return NaN; }
  function analyse() {
    const e = S.exp, pts = S.pts.slice().sort((a, b) => a[0] - b[0]), m = $('msg');
    if (pts.length < 8) { m.innerHTML = '<div class="callout warn">Take at least 8 readings first, and go well past the end point.</div>'; return; }
    if (e.mode === 'potentiometric') {
      let best = -1, bi = -1;
      for (let i = 1; i < pts.length; i++) { const d = (pts[i][1] - pts[i - 1][1]) / (pts[i][0] - pts[i - 1][0]); if (d > best) { best = d; bi = i; } }
      const veq = (pts[bi][0] + pts[bi - 1][0]) / 2;
      if (best < 0.03) { m.innerHTML = '<div class="callout warn">No sharp jump yet. Keep adding titrant past the end point.</div>'; return; }
      const meas = { veq, eHalf: interp(pts, veq / 2), eEq: interp(pts, veq) };
      if (e.id === 'potent-agcl') { meas.eEq = (pts[bi][1] + pts[bi - 1][1]) / 2; }
      if (isNaN(meas.eHalf)) { m.innerHTML = '<div class="callout warn">Your readings do not cover half the end-point volume. Start again with small steps from the beginning.</div>'; return; }
      S.graded = true; S.analysis = [veq]; S.meas = meas;
      m.innerHTML = '<div class="callout ok">Largest ΔE/ΔV (' + best.toFixed(2) + ' V per mL) lies between ' + pts[bi - 1][0].toFixed(2) + ' and ' + pts[bi][0].toFixed(2) + ' mL. End point ≈ <b>' + veq.toFixed(2) + ' mL</b>. Smaller steps around it give a sharper value.</div>';
      answerUI(meas); chart(); return;
    }
    const nb = e.id === 'conduct-mix' ? 2 : 1;
    const need = (nb + 1) * 3;
    if (pts.length < need + 3) { m.innerHTML = '<div class="callout warn">Add more readings: you need points on every straight section of the graph.</div>'; return; }
    const f = T.fitBreaks(pts.map((p) => p[0]), pts.map((p) => p[1]), nb);
    if (!f) { m.innerHTML = '<div class="callout warn">Could not fit straight lines through these readings. Take more points after the end point.</div>'; return; }
    S.graded = true; S.analysis = f.breaks;
    const meas = nb === 2 ? { v1: f.breaks[0], v2: f.breaks[1] } : { v: f.breaks[0] };
    S.meas = meas;
    m.innerHTML = '<div class="callout ok">Straight-line fits meet at <b>' + f.breaks.map((b) => b.toFixed(2)).join(' mL</b> and <b>') + ' mL</b>. Those are your end points.</div>';
    answerUI(meas); chart();
  }

  // ------------------------------------------------------------ wiring
  function refresh(full) {
    if (full) {
      const e = S.exp;
      $('expTitle').textContent = e.title; $('expSub').textContent = e.short + (e.unis.length ? ' · ' + e.unis.join(', ') + ' syllabus' : '');
      $('steps').innerHTML = e.steps.map((s) => '<li>' + esc(s) + '</li>').join('');
      $('expList').querySelectorAll('.exp-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === e.id)));
      actions(); $('msg').innerHTML = ''; $('answerBox').innerHTML = ''; S.analysis = null;
    }
    optBtns(); readouts(); trialsUI(); chart();
  }

  function init() {
    if (!list.length) return;
    $('expCount').textContent = '(' + list.length + ')';
    $('expList').innerHTML = list.map((e) => '<button type="button" class="exp-btn" data-id="' + e.id + '" aria-pressed="false"><b>' + esc(e.title) + '</b><span>' + esc(e.short) + (e.unis.length ? ' · ' + e.unis.join(' ') : '') + '</span></button>').join('');
    const nl = T.EXPS.length - list.length;
    if (nl > 0) { const n = $('levelNote'); n.hidden = false; n.innerHTML = nl + ' more titrations (iodometry, EDTA, conductometric, potentiometric…) open at the <a href="bsc.html?level=bsc" style="color:var(--pink)">BSc / BS level</a>.'; }
    const lk = $('crumbLevel'); const LV = window.LevelInfo && LevelInfo.LV[level]; if (lk && LV) { lk.textContent = LV.name; lk.href = LV.page + '?level=' + level; }
    if (innerWidth < 900) $('expDetails').open = false;
    $('expList').addEventListener('click', (e) => { const b = e.target.closest('.exp-btn'); if (b) { pick(b.dataset.id); if (innerWidth < 900) { $('expDetails').open = false; $('work').scrollIntoView({ behavior: 'smooth' }); } } });
    $('dose').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) add(parseFloat(b.dataset.v)); });
    const hold = $('hold'); let timer = null;
    const stop = () => { S.run = 0; clearInterval(timer); timer = null; };
    const go = (ev) => { ev.preventDefault(); if (timer) return; S.run = 1; timer = setInterval(() => add(0.1), 80); };
    hold.addEventListener('pointerdown', go); ['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach((n) => hold.addEventListener(n, stop));
    hold.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); add(0.5); } });
    $('opts').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return;
      if (b.dataset.ind) S.opts.ind = b.dataset.ind;
      else if (b.dataset.opt) { const k = b.dataset.opt; S.opts[k] = !S.opts[k]; if (k === 'meter' && S.opts.meter) S.pts = []; if (k === 'meter' && !S.opts.meter) S.pts = S.pts.filter(() => false); }
      refresh(false);
    });
    $('actions').addEventListener('click', (e) => {
      const b = e.target.closest('button'); if (!b) return; const m = $('msg');
      if (b.id === 'newTrial') { fresh(); m.innerHTML = ''; }
      else if (b.id === 'newUnknown') pick(S.exp.id);
      else if (b.id === 'rec') {
        const v = reading();
        if (v < 0.5) { m.innerHTML = '<div class="callout warn">Add titrant first.</div>'; return; }
        S.trials.push(v); m.innerHTML = '<div class="callout">Titre recorded: ' + v.toFixed(2) + ' mL. Press “Refill and new trial” to repeat.</div>';
        const mm = meanTrials(); if (S.trials.length >= 2 && Math.abs(S.trials[S.trials.length - 1] - S.trials[S.trials.length - 2]) <= 0.101) answerUI(mm); else answerUI(S.trials.length ? mm : null);
        refresh(false);
      } else if (b.id === 'rec1') { S.recorded.v1 = reading(); m.innerHTML = '<div class="callout">First end point recorded at ' + S.recorded.v1.toFixed(2) + ' mL. Now add methyl orange and continue.</div>'; if (!S.opts.mo) { S.opts.mo = true; } refresh(false); }
      else if (b.id === 'rec2') {
        if (S.recorded.v1 == null) { m.innerHTML = '<div class="callout warn">Record the first end point first.</div>'; return; }
        S.trials.push([S.recorded.v1, reading()]); S.recorded = {}; m.innerHTML = '<div class="callout">Trial recorded. Press “Refill and new trial” to repeat.</div>'; answerUI(meanTrials()); refresh(false);
      } else if (b.id === 'analyse') analyse();
    });
    // keyboard shortcuts for the dose buttons
    addEventListener('keydown', (e) => { if (e.target.matches('input, select, textarea')) return; if (e.key === 'd') add(0.05); else if (e.key === 'm') add(0.5); else if (e.key === 'M') add(1); });
    addEventListener('resize', () => chart());
    pick(q.get('exp') || list[0].id);
    requestAnimationFrame(draw);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
