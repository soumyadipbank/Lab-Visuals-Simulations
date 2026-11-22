/* Lab Visuals: titration simulator UI (bench canvas, burette, trial table, answer check) */
(function () {
  'use strict';
  const C = globalThis.Chem, L = C.Lab, T = C.Titr, $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const level = (window.LevelInfo && LevelInfo.level) || 'bsc';
  const q = new URLSearchParams(location.search);
  const TOL = { indicator: 0.02, indicator2: 0.05, conductometric: 0.06, potentiometric: 0.04 };
  const cv = $('bench'), g = cv.getContext('2d');
  // V = volume asked for, Vd = volume that has left the burette (the reading), Vf = volume that has reached the flask
  const S = { exp: null, sess: null, V: 0, Vd: 0, Vf: 0, queue: 0, drops: [], blooms: [], ripples: [], bead: 0, emitT: 0, marks: [], shown: null, trials: [], pts: [], opts: {}, recorded: {}, run: 0, t: 0, graded: false, lastRead: '' };

  const list = T.forLevel(level);
  const hexRgb = (h) => C.hex2rgb(h);
  const WATER = '#cfe6f5';
  const DROP = 0.05;                 // mL per drop
  const GEO = {};                    // bench geometry, updated every frame

  function clearFlow() { S.V = 0; S.Vd = 0; S.Vf = 0; S.queue = 0; S.drops = []; S.blooms = []; S.ripples = []; S.bead = 0; S.marks = []; S.run = 0; }
  function pick(id) {
    const e = (list.find((x) => x.id === id)) || list[0];
    S.exp = e; S.sess = e.make(L.rng((Math.random() * 1e9) | 0)); clearFlow(); S.pts = []; S.recorded = {}; S.graded = false;
    S.pi = 0; S.trialsBy = (S.sess.parts || [0]).map(() => []); S.trials = S.trialsBy[0];
    S.opts = { ph: e.mode === 'indicator2', mo: false, ind: (e.indicators && e.indicators[0]) || null, heat: false, starch: false, meter: false, formol: false };
    S.shown = null; refresh(true);
    history.replaceState(null, '', '?level=' + level + '&exp=' + e.id);
  }
  function fresh() { // new trial, same unknown
    clearFlow(); S.recorded = {}; S.pts = []; S.shown = null; S.opts.heat = false; S.opts.starch = false; S.opts.formol = false; S.opts.meter = false; S.graded = false; S.analysis = null;
    if (S.exp.mode === 'indicator2') { S.opts.ph = true; S.opts.mo = false; }
    refresh(false);
  }
  const ctx = () => ({ ind: S.opts.ind, ph: S.opts.ph, mo: S.opts.mo, starch: S.opts.starch, heated: S.opts.heat, formol: S.opts.formol });
  // a multi-part experiment (e.g. blank + sample, or two different titrations) keeps one session per part
  const P = () => (S.sess.parts ? S.sess.parts[S.pi] : S.sess);
  const cur = () => P().state(S.Vf, ctx());
  const reading = () => Math.round(S.Vd / 0.05) * 0.05;
  const busy = () => S.queue > 1e-9 || S.drops.length > 0 || S.run;

  function add(dv) {
    const room = 50 - S.V; if (room <= 0) return;
    dv = Math.min(dv, room); S.V += dv; S.queue += dv; S.marks.push(S.V);
  }
  // a reading is logged once all the titrant of one addition has reached the flask
  function logPoint() {
    const st = cur(), e = S.exp;
    if (e.mode === 'conductometric' || e.mode === 'potentiometric') {
      const y = e.mode === 'conductometric' ? st.kappa : st.E + (P().noiseV ? L.gauss(Math.random) * P().noiseV : 0);
      S.pts.push([+S.Vf.toFixed(3), y]);
    } else if (S.opts.meter && st.pH != null) S.pts.push([+S.Vf.toFixed(3), st.pH]);
    refresh(false);
  }
  const cdist = (a, b) => { if (!a || !b) return a || b ? 99 : 0; const A = hexRgb(a), B = hexRgb(b); return Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]); };
  // titrant arriving: the spot where it lands is briefly richer in titrant than the bulk, so near the end point
  // the indicator changes colour there first and the colour swirls away (slowly, the closer you are)
  function land(vol, x) {
    const before = cur();
    S.Vf = Math.min(S.Vd, S.Vf + vol);
    const bulk = cur(), local = P().state(S.Vf + 1.2, ctx());
    S.ripples.push({ x, r: 2, a: 1 });
    let col = null, life = 0.7;
    if (bulk.flash) { col = bulk.flash.c; life = bulk.flash.slow ? 2.2 : 0.9; }
    else if (cdist(local.colour, bulk.colour) > 14) { col = local.colour || WATER; const near = 1 - Math.min(1, Math.abs(cdist(local.colour, bulk.colour) - 14) / 200); life = 0.6 + near * 0.9; }
    if (col && S.blooms.length < 18) S.blooms.push({ x, col, age: 0, life });
    return before;
  }
  function physics(dt) {
    const G = GEO; if (!G.tipY) return;
    // hold-to-run: the stopcock is fully open, a steady stream
    if (S.run && S.V < 50) { const v = Math.min(1.4 * dt, 50 - S.V); S.V += v; S.Vd += v; S.Vf = S.Vd; S.emitT += dt; if (S.emitT > 0.12) { S.emitT = 0; S.ripples.push({ x: G.cx + (Math.random() - 0.5) * 4, r: 2, a: 0.8 }); land(0, G.cx); } }
    else if (S.queue > 1e-9) {
      if (S.queue > 0.6) {              // a large addition runs out as a stream, the last few drops fall one by one
        const v = Math.min(S.queue - 0.3, 3.5 * dt); S.queue -= v; S.Vd += v; S.Vf += v; S.stream = 1; S.emitT += dt;
        if (S.emitT > 0.1) { S.emitT = 0; S.ripples.push({ x: G.cx, r: 2, a: 0.8 }); land(0, G.cx); }
      } else {                          // the last part falls drop by drop: a bead swells at the tip and breaks away
        S.stream = 0;
        S.bead = Math.min(1, S.bead + dt * (5 + S.queue * 14));   // drops come faster while the stopcock is opened wider
        if (S.bead >= 1) { const v = Math.min(DROP, S.queue); S.queue -= v; S.Vd += v; S.bead = 0; S.drops.push({ x: G.cx + (Math.random() - 0.5) * 1.5, y: G.tipY + 4, vy: 40, vol: v }); if (S.queue < 1e-9) S.queue = 0; }
      }
    } else { S.stream = 0; S.bead = Math.max(0, S.bead - dt * 4); }
    for (let i = S.drops.length - 1; i >= 0; i--) {
      const d = S.drops[i]; d.vy += 1700 * dt; d.y += d.vy * dt;
      if (d.y >= G.surfY) { S.drops.splice(i, 1); land(d.vol, d.x); }
    }
    S.ripples.forEach((r) => { r.r += dt * 60; r.a -= dt * 1.6; }); S.ripples = S.ripples.filter((r) => r.a > 0);
    S.blooms.forEach((b) => (b.age += dt)); S.blooms = S.blooms.filter((b) => b.age < b.life);
    if (!busy() && S.Vf < S.Vd) S.Vf = S.Vd;
    while (S.marks.length && S.Vf >= S.marks[0] - 1e-6) { S.marks.shift(); logPoint(); }
    const rd = reading().toFixed(2); if (rd !== S.lastRead) { S.lastRead = rd; readouts(); }
  }

  // ------------------------------------------------------------ rendering of the bench
  function size() { const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth || 760, h = Math.round(w * 0.6); if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.height = h + 'px'; } return { w, h, dpr }; }
  const rgbStr = (c, a) => { const r = hexRgb(c); return 'rgba(' + r[0] + ',' + r[1] + ',' + r[2] + ',' + (a == null ? 1 : a) + ')'; };
  let lastT = 0;
  function draw(now) {
    const { w, h, dpr } = size(); g.setTransform(dpr, 0, 0, dpr, 0, 0);
    const dt = Math.min(0.05, lastT ? (now - lastT) / 1000 : 0.016); lastT = now; S.t += dt;
    physics(dt);
    // the bulk colour follows the flask contents with a short mixing lag (swirling)
    const target = cur().colour || WATER;
    S.shown = S.shown ? C.absMix(S.shown, target, Math.min(1, dt * 6)) : target;
    const bg = g.createLinearGradient(0, 0, 0, h); bg.addColorStop(0, '#22123b'); bg.addColorStop(1, '#120a22'); g.fillStyle = bg; g.fillRect(0, 0, w, h);
    const cx = w * 0.5, bx = cx, bTop = h * 0.05, bBot = h * 0.5, bw = Math.max(20, w * 0.045);
    const tcol = P().titrantColour;
    // stand
    g.fillStyle = '#35204f'; g.fillRect(bx + bw * 3.2, bTop, 7, h * 0.88); g.fillRect(bx + bw * 3.2 - w * 0.12, h * 0.93, w * 0.24, 9);
    g.fillRect(bx + bw * 0.7, bTop + h * 0.1, bw * 2.6, 6);
    // burette tube with liquid that falls as titrant leaves
    const tubeTop = bTop, tubeBot = bBot, tubeH = tubeBot - tubeTop, lev = tubeTop + tubeH * (S.Vd / 50);
    g.fillStyle = 'rgba(255,255,255,.09)'; g.fillRect(bx - bw / 2, tubeTop, bw, tubeH);
    g.fillStyle = tcol ? rgbStr(tcol, 0.85) : 'rgba(190,225,245,.5)';
    g.fillRect(bx - bw / 2 + 2, lev, bw - 4, tubeBot - lev);
    g.fillStyle = 'rgba(255,255,255,.6)'; g.beginPath(); g.ellipse(bx, lev + 1, bw / 2 - 2, 2.2, 0, 0, Math.PI); g.fill();   // meniscus
    g.strokeStyle = 'rgba(255,255,255,.6)'; g.fillStyle = 'rgba(240,230,255,.85)'; g.font = Math.max(9, w * 0.014) + 'px Hanken Grotesk, sans-serif'; g.textAlign = 'right';
    for (let v = 0; v <= 50; v += 1) { const y = tubeTop + tubeH * (v / 50), big = v % 10 === 0, mid = v % 5 === 0; g.beginPath(); g.moveTo(bx - bw / 2, y); g.lineTo(bx - bw / 2 - (big ? 12 : mid ? 8 : 4), y); g.stroke(); if (mid) g.fillText(String(v), bx - bw / 2 - 15, y + 3); }
    g.strokeStyle = 'rgba(255,255,255,.45)'; g.lineWidth = 2; g.strokeRect(bx - bw / 2, tubeTop, bw, tubeH); g.lineWidth = 1;
    // stopcock (turns open while titrant flows) and jet
    const flowing = S.run || S.stream || S.queue > 0, scY = tubeBot + h * 0.03, tipY = tubeBot + h * 0.11;
    g.fillStyle = '#c9b8e6'; g.fillRect(bx - bw * 0.2, tubeBot, bw * 0.4, h * 0.07);
    g.fillStyle = '#ffcb83'; g.save(); g.translate(bx, scY); g.rotate(flowing ? (S.run || S.stream ? Math.PI / 2 : Math.PI / 6) : 0); g.fillRect(-bw * 0.9, -3, bw * 1.8, 6); g.restore();   // handle in line with the jet = open
    g.fillStyle = '#c9b8e6'; g.beginPath(); g.moveTo(bx - bw * 0.2, tubeBot + h * 0.07); g.lineTo(bx + bw * 0.2, tubeBot + h * 0.07); g.lineTo(bx + 2, tipY); g.lineTo(bx - 2, tipY); g.fill();
    // conical flask
    const fy = h * 0.92, fw = w * 0.22, fh = h * 0.3, fcx = bx, top = fy - fh, neckW = fw * 0.3, liqH = fh * 0.42;
    const swirl = S.t * 4, ly = fy - liqH;
    GEO.cx = bx; GEO.tipY = tipY; GEO.surfY = ly;
    const dropCol = tcol ? rgbStr(tcol, 0.95) : 'rgba(215,238,252,.9)';
    // bead hanging at the tip, falling drops, stream
    if (S.bead > 0.05) { const r = 1.5 + S.bead * 3.2; g.fillStyle = dropCol; g.beginPath(); g.ellipse(bx, tipY + r * 0.9, r * 0.85, r, 0, 0, 6.283); g.fill(); g.fillStyle = 'rgba(255,255,255,.7)'; g.beginPath(); g.arc(bx - r * 0.3, tipY + r * 0.6, r * 0.25, 0, 6.283); g.fill(); }
    S.drops.forEach((d) => { const st = Math.min(2.2, 1 + d.vy / 900); g.fillStyle = dropCol; g.beginPath(); g.ellipse(d.x, d.y, 3.2 / Math.sqrt(st), 3.2 * st, 0, 0, 6.283); g.fill(); g.fillStyle = 'rgba(255,255,255,.75)'; g.beginPath(); g.arc(d.x - 1, d.y - 1.5, 0.9, 0, 6.283); g.fill(); });
    if (S.run || S.stream) { const wob = Math.sin(S.t * 40) * 0.6; g.fillStyle = dropCol; g.fillRect(bx - 1.6 + wob, tipY, 3.2, ly - tipY); }
    const path = () => { g.beginPath(); g.moveTo(fcx - neckW / 2, top); g.lineTo(fcx - neckW / 2, top + fh * 0.32); g.lineTo(fcx - fw / 2, fy); g.lineTo(fcx + fw / 2, fy); g.lineTo(fcx + neckW / 2, top + fh * 0.32); g.lineTo(fcx + neckW / 2, top); };
    g.save(); path(); g.clip();
    const col = S.shown || WATER;
    const lg = g.createLinearGradient(0, ly, 0, fy); lg.addColorStop(0, rgbStr(col, 0.9)); lg.addColorStop(1, rgbStr(C.absAdd(col, '#9fb8c8', 0.35), 0.97));
    g.fillStyle = lg; g.beginPath(); g.moveTo(fcx - fw, ly); for (let x = -fw; x <= fw; x += 6) g.lineTo(fcx + x, ly + Math.sin(swirl + x * 0.09) * 1.2); g.lineTo(fcx + fw, fy + 4); g.lineTo(fcx - fw, fy + 4); g.fill();
    // local colour where titrant lands, drawn into the swirl
    S.blooms.forEach((b) => {
      const k = b.age / b.life, rad = 8 + k * fw * 0.45, ox = Math.sin(swirl * 0.7 + b.x) * k * fw * 0.12, oy = ly + 6 + k * liqH * 0.35;
      const rg = g.createRadialGradient(b.x + ox, oy, 1, b.x + ox, oy, rad);
      rg.addColorStop(0, rgbStr(b.col, 0.85 * (1 - k))); rg.addColorStop(1, rgbStr(b.col, 0));
      g.fillStyle = rg; g.beginPath(); g.ellipse(b.x + ox, oy, rad * 1.3, rad * 0.8, 0, 0, 6.283); g.fill();
    });
    // ripples on the surface
    g.strokeStyle = 'rgba(255,255,255,.6)';
    S.ripples.forEach((r) => { g.globalAlpha = Math.max(0, r.a); g.beginPath(); g.ellipse(r.x, ly + 1, r.r, r.r * 0.22, 0, 0, 6.283); g.stroke(); });
    g.globalAlpha = 1; g.restore();
    g.strokeStyle = 'rgba(255,255,255,.55)'; g.lineWidth = 2; path(); g.stroke(); g.lineWidth = 1;
    // heater flame
    if (S.exp.needsHeat || P().needsHeat) {
      g.fillStyle = '#3a2b57'; g.fillRect(fcx - fw * 0.7, fy + 2, fw * 1.4, 6);
      if (S.opts.heat) for (let i = 0; i < 7; i++) { const fx2 = fcx - fw * 0.45 + (i / 6) * fw * 0.9, fl = 8 + Math.sin(S.t * 14 + i * 2) * 3; g.fillStyle = 'rgba(70,130,255,.55)'; g.beginPath(); g.ellipse(fx2, fy + 4, 3, fl, 0, 0, 6.283); g.fill(); }
    }
    // meter
    if ((S.opts.meter && cur().pH != null) || S.exp.mode === 'potentiometric' || S.exp.mode === 'conductometric') {
      const st = cur(), lab = S.exp.mode === 'conductometric' ? st.kappa.toFixed(2) + ' mS/cm' : S.exp.mode === 'potentiometric' ? (st.E).toFixed(3) + ' V' : 'pH ' + st.pH.toFixed(2);
      g.fillStyle = '#0d0618'; g.strokeStyle = 'rgba(206,114,245,.7)'; const mw = Math.min(w * 0.3, 190), mh = 44, mx = w - mw - 12, my = 12;
      g.beginPath(); if (g.roundRect) g.roundRect(mx, my, mw, mh, 10); else g.rect(mx, my, mw, mh); g.fill(); g.stroke();
      g.fillStyle = '#7cf0b4'; g.font = '700 ' + Math.max(15, w * 0.026) + 'px ui-monospace, Menlo, monospace'; g.textAlign = 'center'; g.fillText(lab, mx + mw / 2, my + 29);
      g.strokeStyle = 'rgba(206,114,245,.7)'; g.beginPath(); g.moveTo(mx + 14, my + mh); g.lineTo(fcx + fw * 0.14, top + 8); g.lineTo(fcx + fw * 0.14, fy - 10); g.stroke();
    }
    g.fillStyle = 'rgba(235,225,250,.8)'; g.textAlign = 'left'; g.font = Math.max(10, w * 0.016) + 'px Hanken Grotesk, sans-serif';
    const capTxt = 'Burette: ' + P().titrant + ' · Flask: ' + P().flask, cap = $('benchCap'); if (cap && cap.textContent !== capTxt) cap.textContent = capTxt;
    requestAnimationFrame(draw);
  }

  // ------------------------------------------------------------ controls
  function readouts() {
    const st = cur();
    $('readouts').innerHTML = '<div class="big-read"><span>Burette reading</span><b>' + reading().toFixed(2) + ' mL</b></div>' +
      '<div class="big-read"><span>Trials recorded</span><b>' + S.trials.length + '</b></div>' +
      (S.opts.meter && st.pH != null ? '<div class="big-read"><span>pH meter</span><b>' + st.pH.toFixed(2) + '</b></div>' : '');
  }
  function partTabs() {
    const ps = S.sess.parts, el = $('parts');
    if (!ps) { el.innerHTML = ''; el.hidden = true; return; }
    el.hidden = false;
    el.innerHTML = '<span class="lbl" style="font-size:.74rem;letter-spacing:.1em;text-transform:uppercase;color:var(--faint);font-weight:700;align-self:center">Part</span>' +
      ps.map((p, i) => '<button type="button" class="btn-sm" data-part="' + i + '" aria-pressed="' + (i === S.pi) + '">' + esc(p.label) + (S.trialsBy[i].length ? ' ✓' : '') + '</button>').join('');
  }
  function optBtns() {
    const e = S.exp, o = [];
    const b = (id, label, on) => '<button type="button" class="btn-sm" data-opt="' + id + '" aria-pressed="' + !!on + '">' + label + '</button>';
    if (e.mode === 'indicator' && e.indicators && e.indicators.length > 1) e.indicators.forEach((i) => o.push('<button type="button" class="btn-sm" data-ind="' + i + '" aria-pressed="' + (S.opts.ind === i) + '">' + (i === 'phph' ? 'Phenolphthalein' : 'Methyl orange') + '</button>'));
    if (e.mode === 'indicator2') { o.push(b('ph', 'Phenolphthalein', S.opts.ph)); o.push(b('mo', 'Methyl orange', S.opts.mo)); }
    if (e.needsHeat || P().needsHeat) o.push(b('heat', 'Heat to 60–70 °C', S.opts.heat));
    if (e.needsStarch || P().needsStarch) o.push(b('starch', 'Add starch', S.opts.starch));
    if (P().needsFormol) o.push(b('formol', 'Add neutralised formalin', S.opts.formol));
    if (e.mode.startsWith('indicator') && P().state(0, ctx()).pH != null) o.push(b('meter', 'pH meter', S.opts.meter));   /* only for acid–base titrations */
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
      $('trialsBox').innerHTML = '<h4 class="lbl-sum" style="padding-top:14px">Observation table' + (S.sess.parts ? ': ' + esc(P().label) : '') + '</h4><table class="data-table"><thead><tr><th>Trial</th><th>Initial / mL</th><th>Final / mL</th><th>Titre / mL</th></tr></thead><tbody>' + rows + '</tbody></table>' +
        (S.sess.parts ? '<p class="sub" style="margin:4px 0">' + S.sess.parts.map((p, i) => esc(p.label) + ': ' + (S.trialsBy[i].length ? meanOf(S.trialsBy[i]).toFixed(2) + ' mL' : 'not done yet')).join(' · ') + '</p>' : '') +
        (conc ? '<div class="callout ok">Concordant: your last two titres agree within 0.1 mL. Mean titre = <b>' + ((last[0] + last[1]) / 2).toFixed(2) + ' mL</b>.</div>' : '<div class="callout">' + (t.length < 2 ? 'The first trial is a rough one. Repeat more carefully near the end point (use single drops).' : 'Not concordant yet. Repeat until two titres agree within 0.1 mL.') + '</div>');
    } else if (e.mode === 'indicator2') {
      const r = S.trials;
      if (!r.length) { $('trialsBox').innerHTML = ''; return; }
      const rows = r.map((x, i) => '<tr><td>Trial ' + (i + 1) + '</td><td>' + x[0].toFixed(2) + '</td><td>' + x[1].toFixed(2) + '</td></tr>').join('');
      const l = r.slice(-2), conc = r.length >= 2 && Math.abs(l[0][0] - l[1][0]) <= 0.101 && Math.abs(l[0][1] - l[1][1]) <= 0.101;
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
    Chart.draw($('chart'), { series, xmin: 0, xmax: P().vmax, xLabel: 'volume added / mL', yLabel: e.mode === 'conductometric' ? 'κ / mS cm⁻¹' : e.mode === 'potentiometric' ? 'E / V' : 'pH', vlines: vl, ymin: e.mode.startsWith('indicator') ? 0 : undefined, ymax: e.mode.startsWith('indicator') ? 14 : undefined });
  }

  function answerUI(meas) {
    const e = S.exp, s = S.sess;
    if (!meas) { $('answerBox').innerHTML = ''; return; }
    const fields = s.report.map((r, i) => '<div class="field"><label for="ans' + i + '">' + esc(r.label) + ' <output>' + esc(r.unit) + '</output></label><input type="number" step="any" id="ans' + i + '" inputmode="decimal" placeholder="your answer"></div>').join('');
    $('answerBox').innerHTML = '<h4 class="lbl-sum" style="padding-top:14px">Your calculation</h4><p class="sub" style="margin:0 0 6px">Calculate from your own readings, then check.</p><div class="answer-form">' + fields + '<button type="button" class="btn-sm primary" id="check">Check</button><button type="button" class="btn-sm" id="worked">Show worked solution</button></div><div id="verdict"></div><div id="workedOut"></div>';
    let tries = 0, revealed = false; $('worked').hidden = true;
    $('check').onclick = () => {
      const vals = s.report.map((rep, i) => parseFloat($('ans' + i).value));
      if (vals.some((v) => !isFinite(v))) { $('verdict').innerHTML = '<div class="callout warn">Enter every value first.</div>'; return; }
      tries++;
      const res = s.report.map((rep, i) => { const tol = rep.tol || TOL[e.mode] || 0.03, err = rep.abs ? Math.abs(vals[i] - rep.truth) : (Math.abs(vals[i] - rep.truth) / Math.abs(rep.truth)) * 100; return { rep, err, good: rep.abs ? err <= tol : err <= tol * 100 }; });
      revealed = revealed || res.every((x) => x.good) || tries >= 3;
      $('verdict').innerHTML = res.map((x) => '<div class="callout ' + (x.good ? 'ok' : 'bad') + '"><b>' + esc(x.rep.label) + ':</b> ' + (x.good ? 'within the acceptable range.' : 'outside the acceptable range. Check your titre, the mole ratio and the units.') + (revealed ? ' The prepared value is ' + x.rep.truth.toFixed(x.rep.dp) + (x.rep.unit ? ' ' + esc(x.rep.unit) : '') + (x.rep.abs ? '' : ' (your error ' + x.err.toFixed(1) + ' %)') + '.' : '') + '</div>').join('') +
        (revealed ? '' : '<div class="callout">' + (3 - tries) + ' more tr' + (3 - tries === 1 ? 'y' : 'ies') + ' before the answer and the worked solution are shown.</div>');
      if (revealed) $('worked').hidden = false;
    };
    $('worked').onclick = () => { const r = s.solve(meas); $('workedOut').innerHTML = '<div class="work-lines">' + r.lines.map(esc).join('<br>') + '</div>'; };
  }

  // ------------------------------------------------------------ analysis
  const meanOf = (t) => (t.length < 2 ? t[t.length - 1] : (t[t.length - 1] + t[t.length - 2]) / 2);
  function meanTrials() {
    const e = S.exp, t = S.trials;
    if (S.sess.parts) return S.trialsBy.every((x) => x.length) ? { t: S.trialsBy.map(meanOf) } : null;
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
      for (let i = 1; i < pts.length; i++) { const d = Math.abs((pts[i][1] - pts[i - 1][1]) / (pts[i][0] - pts[i - 1][0])); if (d > best) { best = d; bi = i; } }   /* the potential may rise (Fe²⁺/Cr₂O₇²⁻) or fall (Ag⁺/Cl⁻) */
      const veq = (pts[bi][0] + pts[bi - 1][0]) / 2;
      if (best < 0.03) { m.innerHTML = '<div class="callout warn">No sharp jump yet. Keep adding titrant past the end point.</div>'; return; }
      const meas = { veq, eHalf: interp(pts, veq / 2), eEq: interp(pts, veq) };
      if (e.id === 'potent-agcl') { meas.eEq = (pts[bi][1] + pts[bi - 1][1]) / 2; }
      if (isNaN(meas.eHalf)) { m.innerHTML = '<div class="callout warn">Your readings do not cover half the end-point volume. Start again with small steps from the beginning.</div>'; return; }
      S.graded = true; S.analysis = [veq]; S.meas = meas;
      m.innerHTML = '<div class="callout ok">Largest |ΔE/ΔV| (' + best.toFixed(2) + ' V per mL) lies between ' + pts[bi - 1][0].toFixed(2) + ' and ' + pts[bi][0].toFixed(2) + ' mL. End point ≈ <b>' + veq.toFixed(2) + ' mL</b>. Smaller steps around it give a sharper value.</div>';
      answerUI(meas); chart(); return;
    }
    const nb = e.id === 'conduct-mix' ? 2 : 1;
    const need = (nb + 1) * 3;
    if (pts.length < need + 3) { m.innerHTML = '<div class="callout warn">Add more readings: you need points on every straight section of the graph.</div>'; return; }
    const V0c = P().cellV || 100, kc = pts.map((p) => (p[1] * (V0c + p[0])) / V0c);   /* dilution correction κ′ = κ (V₀ + v)/V₀ keeps the branches straight */
    const f = T.fitBreaks(pts.map((p) => p[0]), kc, nb);
    if (!f) { m.innerHTML = '<div class="callout warn">Could not fit straight lines through these readings. Take more points after the end point.</div>'; return; }
    S.graded = true; S.analysis = f.breaks;
    const meas = nb === 2 ? { v1: f.breaks[0], v2: f.breaks[1] } : { v: f.breaks[0] };
    S.meas = meas;
    m.innerHTML = '<div class="callout ok">After correcting for dilution (κ′ = κ(V₀ + v)/V₀, V₀ = ' + V0c + ' mL), straight-line fits meet at <b>' + f.breaks.map((b) => b.toFixed(2)).join(' mL</b> and <b>') + ' mL</b>. Those are your end points.</div>';
    answerUI(meas); chart();
  }

  // ------------------------------------------------------------ wiring
  function refresh(full) {
    if (full) {
      const e = S.exp;
      $('expTitle').textContent = e.title; $('expSub').textContent = e.short;
      $('steps').innerHTML = e.steps.map((s) => '<li>' + esc(s) + '</li>').join('');
      $('expList').querySelectorAll('.exp-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === e.id)));
      actions(); $('msg').innerHTML = ''; $('answerBox').innerHTML = ''; S.analysis = null;
      if (window.Theory) Theory.mount(e.id);
    }
    partTabs(); optBtns(); readouts(); trialsUI(); chart();
  }

  function init() {
    if (!list.length) return;
    $('expCount').textContent = '(' + list.length + ')';
    $('expList').innerHTML = list.map((e) => '<button type="button" class="exp-btn" data-id="' + e.id + '" aria-pressed="false"><b>' + esc(e.title) + '</b><span>' + esc(e.short) + '</span></button>').join('');
    const nl = T.EXPS.length - list.length;
    if (nl > 0) { const n = $('levelNote'); n.hidden = false; n.innerHTML = nl + ' more titrations (iodometry, EDTA, conductometric, potentiometric…) open at the <a href="bsc.html?level=bsc" style="color:var(--pink)">Bachelors (BSc / BS) level</a>.'; }
    const lk = $('crumbLevel'); const LV = window.LevelInfo && LevelInfo.LV[level]; if (lk && LV) { lk.textContent = LV.name; lk.href = LV.page + '?level=' + level; }
    if (innerWidth < 900) $('expDetails').open = false;
    $('expList').addEventListener('click', (e) => { const b = e.target.closest('.exp-btn'); if (b) { pick(b.dataset.id); if (innerWidth < 900) { $('expDetails').open = false; $('work').scrollIntoView({ behavior: 'smooth' }); } } });
    $('dose').addEventListener('click', (e) => { const b = e.target.closest('[data-v]'); if (b) add(parseFloat(b.dataset.v)); });
    const hold = $('hold');
    const stop = () => { if (S.run) { S.run = 0; S.marks.push(S.V); } };
    const go = (ev) => { ev.preventDefault(); S.run = 1; };
    hold.addEventListener('pointerdown', go); ['pointerup', 'pointerleave', 'pointercancel', 'blur'].forEach((n) => hold.addEventListener(n, stop));
    hold.addEventListener('keydown', (e) => { if (e.key === ' ' || e.key === 'Enter') { e.preventDefault(); add(0.5); } });
    $('parts').addEventListener('click', (e) => {
      const b = e.target.closest('[data-part]'); if (!b) return;
      S.trialsBy[S.pi] = S.trials; S.pi = +b.dataset.part; S.trials = S.trialsBy[S.pi];
      fresh(); $('msg').innerHTML = '<div class="callout">' + esc(P().label) + ': ' + esc(P().flask) + '. Burette: ' + esc(P().titrant) + '.</div>';
    });
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
        const mm = meanTrials();
        if (S.sess.parts) { answerUI(mm); if (!mm) m.innerHTML += '<div class="callout">Now do the other part of the experiment (buttons above the burette controls).</div>'; }
        else if (S.trials.length >= 2 && Math.abs(S.trials[S.trials.length - 1] - S.trials[S.trials.length - 2]) <= 0.101) answerUI(mm); else answerUI(S.trials.length ? mm : null);
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
    if (q.has('debug')) window.__titr = S;   // used by the automated screenshot tests
    requestAnimationFrame(draw);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
