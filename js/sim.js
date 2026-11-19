/* Lab Visuals: canvas simulation (beaker view, particle view, temperature graph, energy diagram). */
(function () {
  'use strict';
  const C = globalThis.Chem;
  const { CH, ION, MOL } = C;

  const W = 800, H = 500;
  const BX = 300, BW = 200, BTOP = 150, BBOT = 400, BH = BBOT - BTOP, BENCH = 462;
  const rnd = (a, b) => a + Math.random() * (b - a);
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const lerp = (a, b, t) => a + (b - a) * t;
  const smooth = (t) => { t = clamp(t, 0, 1); return t * t * (3 - 2 * t); };
  const WATER = '#cfe6f5';
  const rgba = (hex, a) => { const [r, g, b] = C.hex2rgb(hex); return 'rgba(' + r + ',' + g + ',' + b + ',' + a + ')'; };

  // ---------------------------------------------------------------- label helpers
  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻' };
  const SUB = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' };
  function uni(s) {
    s = s.replace(/\((s|aq|l|g)\)$/, '');
    const m = s.match(/^(.*?)(?:\^(\d*[+-]))?$/);
    let base = m[1].replace(/([A-Za-z\)\]])(\d+)/g, (_, a, d) => a + d.split('').map((c) => SUB[c]).join(''));
    const ch = m[2] ? m[2].split('').map((c) => SUP[c] || c).join('') : '';
    return base + ch;
  }
  C.uni = uni;
  const hashHue = (s) => { let h = 0; for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) % 360; return h; };
  const MOLCOL = { H2O: '#4fc3f7', H2: '#cfd8dc', O2: '#ef5350', CO2: '#9e9e9e', NH3: '#4db6ac', H2S: '#cddc39', SO2: '#ffb74d', NO: '#ffab91', NO2: '#a1521f', N2O: '#b39ddb', Br2: '#a0451c', I2: '#6a1b9a', HCl: '#66bb6a', S: '#f2e25a', C: '#212121' };
  function pcolor(label) {
    const clean = label.replace(/\((s|aq|l|g)\)$/, '').replace(/^solid /, '');
    for (const k in ION) if (ION[k].d === clean) return ION[k].pc;
    if (MOLCOL[clean]) return MOLCOL[clean];
    for (const id in CH) if (CH[id].f === clean && CH[id].color) return CH[id].color;
    const m = clean.match(/^[A-Z][a-z]?/);
    if (m && /^(Cu|Fe|Zn|Mg|Ca|Al|Ag|Pb|Na|K|Ba)$/.test(m[0])) {
      const key = m[0] === 'Fe' ? 'Fe2' : m[0];
      if (ION[key]) return ION[key].pc;
    }
    return 'hsl(' + hashHue(clean) + ',55%,58%)';
  }
  C.pcolor = pcolor;

  // ---------------------------------------------------------------- scenario helpers
  function kindOf(id, res) {
    const c = CH[id];
    if (id === 'heat') return 'heat';
    if (c.group === 'indicator') return 'drop';
    if (c.phase === 'g') return 'gas';
    if (c.metal) return 'metal';
    if ((res && res.solidIds && res.solidIds.includes(id)) || c.phase === 's') return 'solid';
    return 'liquid';
  }
  const VOL = { liquid: 0.36, drop: 0.015, metal: 0, solid: 0, gas: 0, heat: 0 };

  class Sim {
    constructor(cv) {
      this.cv = cv.beaker; this.tcv = cv.temp; this.ecv = cv.energy;
      this.ctx = this.cv.getContext('2d'); this.tctx = this.tcv.getContext('2d'); this.ectx = this.ecv.getContext('2d');
      this.view = 'beaker'; this.userSpeed = 1; this.dark = false;
      this.running = false; this.t = 0; this.last = 0; this.ids = []; this.res = null;
      this.onFrame = null;
      this.resize();
      new ResizeObserver(() => { this.resize(); }).observe(this.cv.parentElement);
      new ResizeObserver(() => { this.resize(); }).observe(this.tcv.parentElement);
      this.loop = this.loop.bind(this);
      requestAnimationFrame(this.loop);
    }

    resize() {
      const dpr = Math.min(window.devicePixelRatio || 1, 2.5);
      [[this.cv, W, H], [this.tcv, 400, 220], [this.ecv, 400, 220]].forEach(([c, lw, lh]) => {
        const r = c.getBoundingClientRect();
        const w = Math.max(10, r.width);
        c.width = Math.round(w * dpr); c.height = Math.round(w * (lh / lw) * dpr);
        c.style.height = (w * (lh / lw)) + 'px';
        c._s = (w * dpr) / lw;
      });
      this.needsDraw = true;
    }

    // ------------------------------------------------------------ load a scenario
    load(ids, res, opts) {
      opts = opts || {};
      this.ids = ids.slice();
      this.res = res;
      this.fx = res.fx || {};
      this.items = ids.map((id) => ({ id, chem: CH[id], kind: kindOf(id, res) }));
      this.pourItems = this.items.filter((i) => i.kind !== 'heat');
      this.hasHeat = this.items.some((i) => i.kind === 'heat');
      this.dry = !!this.fx.dry;
      this.PT = 1.0;
      this.tPour = this.pourItems.length * this.PT + (this.hasHeat ? 0.5 : 0);
      this.D = 11 / Math.max(0.12, this.fx.speed || 1);
      this.tEnd = this.tPour + this.D;
      this.tTotal = this.tEnd + 6;
      this.ph1 = res.ph1; this.ph0 = res.ph0;
      this.computeColors();
      this.buildTemperature();
      this.buildParticles();
      this.buildMicro();
      this.t = 0; this.running = !!opts.autoplay; this.graph = []; this.lastGraph = -1; this.done = false; this.level = 0;
      this.needsDraw = true;
      this.updateState();
    }

    setPH(ph) { this.ph1 = ph; this.computeColors(); this.needsDraw = true; }

    computeColors() {
      const items = this.items, res = this.res, fx = this.fx;
      let r = 0, g = 0, b = 0, wsum = 0;
      items.forEach((it) => {
        const v = VOL[it.kind] ? (it.id === 'h2o' ? 1.4 : 1) * VOL[it.kind] : 0;
        if (v > 0 && it.kind === 'liquid') {
          const col = C.hex2rgb(it.chem.color || WATER);
          r += col[0] * v; g += col[1] * v; b += col[2] * v; wsum += v;
        }
      });
      let c0 = wsum ? C.rgb2hex([r / wsum, g / wsum, b / wsum]) : WATER;
      // concentrated colourful solids dissolving give colour via liq1 only
      const ind = items.filter((i) => i.kind === 'drop');
      let c1;
      if (fx.liq1 === undefined) c1 = c0; else c1 = fx.liq1 || WATER;
      if (ind.length) {
        const id0 = C.indColor(ind[0].id, this.ph0 == null ? 7 : this.ph0);
        const id1 = C.indColor(ind[0].id, this.ph1 == null ? 7 : this.ph1);
        c0 = id0 ? (wsum && c0 !== WATER ? C.mix(c0, id0, 0.55) : id0) : c0;
        c1 = id1 ? (c1 !== WATER ? C.mix(c1, id1, 0.55) : id1) : (fx.liq1 === undefined ? WATER : c1);
        if (!id1 && fx.liq1 === undefined) c1 = WATER;
        this.indActive = true;
        this.indColor1 = id1;
      } else { this.indActive = false; }
      this.c0 = c0; this.c1 = c1;
    }

    buildTemperature() {
      const fx = this.fx, res = this.res;
      this.T0 = 25;
      this.T1 = fx.Tpeak != null ? fx.Tpeak : this.T0 + (res.dT || 0);
      if (fx.boil && fx.Tpeak == null) this.T1 = 100;
      if (this.T1 > 100 && !fx.Tpeak) this.T1 = 100;
      const T = this.T1;
      this.tLo = T < 15 ? Math.floor((T - 10) / 10) * 10 : (T < 25 ? 10 : 0);
      this.tHi = T > 55 ? Math.ceil((T + 12) / 10) * 10 : 60;
      if (T > 150) this.tHi = Math.ceil((T + 20) / 100) * 100;
    }

    temperatureAt(t) {
      const x = (t - this.tPour) / this.D;
      const dT = this.T1 - this.T0;
      if (this.res.reacts === false && !this.hasHeat) return this.T0;
      if (x <= 0) return this.T0 + (this.hasHeat ? 0 : 0);
      if (x < 1) {
        const p = this.progress(t);
        return this.T0 + dT * (1 - Math.exp(-5 * p)) * (1 - 0.15 * p);
      }
      const k = (t - this.tEnd);
      return this.T0 + dT * (0.85 * Math.exp(-0.18 * k) + 0.15 * 0.55 * Math.exp(-0.05 * k) + 0.02);
    }

    progress(t) {
      const x = clamp((t - this.tPour) / this.D, 0, 1);
      if (this.res.reacts === false) return 0;
      return 1 - Math.pow(1 - x, 1.8);
    }

    // ------------------------------------------------------------ particles for the beaker
    buildParticles() {
      const fx = this.fx;
      this.bubbles = []; this.fumes = []; this.sparks = []; this.mist = [];
      this.pptP = [];
      if (fx.ppt) {
        const n = Math.round(140 * clamp(fx.ppt.amount || 0.8, 0.2, 1));
        for (let i = 0; i < n; i++) this.pptP.push({ x: rnd(BX + 12, BX + BW - 12), y: rnd(0, 1), thr: rnd(0.04, 0.75), vy: rnd(14, 30), s: rnd(1.4, 3.4), settled: false, ox: rnd(0, 6.28), sx: 0, sy: 0, started: false });
      }
      this.sedLayer = [];
      for (let i = 0; i < 40; i++) this.sedLayer.push(rnd(0.7, 1.3));
      // solid granules
      this.granules = [];
      this.items.forEach((it, idx) => {
        if (it.kind === 'solid' || (it.kind === 'metal' && (this.dry || !this.fx.metalStrip && !this.fx.metalFloat))) {
          const n = 46;
          for (let i = 0; i < n; i++) this.granules.push({ item: idx, x: rnd(-1, 1), y: Math.random(), r: rnd(2.4, 4.6), c: rnd(0.85, 1.12), vanish: Math.random() });
        }
      });
      // deposit branches (silver/lead trees)
      this.branches = [];
      if (fx.deposit && fx.deposit.tree) {
        for (let i = 0; i < 26; i++) this.branches.push({ y: rnd(0.05, 1), a: rnd(-1.2, 1.2) + (Math.random() < 0.5 ? Math.PI : 0), len: rnd(12, 34), side: Math.random() < 0.5 ? -1 : 1 });
      }
      // foam / column
      this.foam = [];
      if (fx.foam) for (let i = 0; i < 320; i++) this.foam.push({ u: rnd(-1, 1), v: Math.random(), r: rnd(3, 9) });
    }

    // ------------------------------------------------------------ particles for the micro view
    buildMicro() {
      const res = this.res;
      const MX0 = 40, MY0 = 56, MX1 = 560, MY1 = 450;
      this.mbox = [MX0, MY0, MX1, MY1];
      this.mp = [];
      let m = res.micro;
      if (!m || (!m.react.length && !m.prod.length && !m.spec.length)) {
        m = { react: [], prod: [], spec: this.items.filter((i) => i.kind !== 'heat').map((i) => ({ label: i.chem.f, n: 5 })) };
      }
      const totalR = m.react.reduce((a, e) => a + e.n, 0) || 1;
      const k = clamp(Math.round(16 / totalR), 1, 8);
      const mk = (e, role, i, count) => {
        const arr = [];
        for (let j = 0; j < count; j++) {
          arr.push({
            label: e.label, role, ph: e.ph || 'aq', color: pcolor(e.label), r: /\^|^[A-Z][a-z]?$/.test(e.label) ? 11 : 14,
            x: rnd(MX0 + 30, MX1 - 30), y: rnd(MY0 + 30, MY1 - 30), vx: rnd(-40, 40), vy: rnd(-40, 40), thr: 0, vis: role !== 'p', t0: 0, tx: 0, ty: 0, placed: false,
          });
        }
        return arr;
      };
      const R = [], P = [], S = [];
      m.react.forEach((e, i) => R.push(...mk(e, 'r', i, Math.max(1, Math.round(e.n * k)))));
      m.prod.forEach((e, i) => P.push(...mk(e, 'p', i, Math.max(1, Math.round(e.n * k)))));
      m.spec.forEach((e, i) => S.push(...mk(e, 's', i, Math.max(2, Math.round(e.n * Math.max(1, k * 0.8))))));
      // shuffle thresholds
      const thr = (arr) => { const idx = arr.map((_, i) => (i + 0.5) / arr.length); for (let i = idx.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [idx[i], idx[j]] = [idx[j], idx[i]]; } arr.forEach((p, i) => { p.thr = idx[i]; }); };
      thr(R); thr(P);
      // solids (precipitate, solid reactants) sit at the bottom as a lattice
      let gi = 0, ri = 0;
      P.forEach((p) => {
        if (p.ph === 's') { const col = gi % 7, row = Math.floor(gi / 7); p.tx = MX0 + 60 + col * 24 + (row % 2) * 12; p.ty = MY1 - 22 - row * 22; gi++; }
      });
      R.forEach((p) => {
        if (p.ph === 's') { const col = ri % 5, row = Math.floor(ri / 5); p.x = MX0 + 36 + col * 24 + (row % 2) * 12; p.y = MY1 - 22 - row * 22; p.vx = p.vy = 0; p.fixed = true; ri++; }
      });
      this.mp = R.concat(P, S);
      this.microR = R; this.microP = P;
      this.rings = [];
      this.legend = [];
      const seen = new Set();
      m.react.forEach((e) => { if (!seen.has(e.label + 'r')) { seen.add(e.label + 'r'); this.legend.push({ label: e.label, role: 'reactant', color: pcolor(e.label), ph: e.ph }); } });
      m.prod.forEach((e) => { if (!seen.has(e.label + 'p')) { seen.add(e.label + 'p'); this.legend.push({ label: e.label, role: 'product', color: pcolor(e.label), ph: e.ph }); } });
      m.spec.forEach((e) => { if (!seen.has(e.label + 's')) { seen.add(e.label + 's'); this.legend.push({ label: e.label, role: 'spectator', color: pcolor(e.label) }); } });
    }

    // ------------------------------------------------------------ controls
    play() { if (this.t >= this.tTotal - 0.01) this.restart(); this.running = true; }
    pause() { this.running = false; }
    restart() { this.t = 0; this.graph = []; this.lastGraph = -1; this.done = false; this.buildParticles(); this.buildMicro(); this.running = false; this.needsDraw = true; this.updateState(); }
    seek(t) {
      t = clamp(t, 0, this.tTotal);
      if (t < this.t) this.restart();
      const dt = 1 / 30;
      while (this.t < t - 1e-6) { const d = Math.min(dt, t - this.t); this.t += d; this.step(d); }
      this.updateState(); this.needsDraw = true;
    }

    updateState() {
      this.p = this.progress(this.t);
      this.T = this.temperatureAt(this.t);
      this.phase = this.t < this.tPour ? 'pour' : this.t < this.tEnd ? 'react' : 'done';
      if (this.onFrame) this.onFrame(this);
    }

    loop(now) {
      const dt = Math.min(0.05, (now - (this.last || now)) / 1000);
      this.last = now;
      if (this.running && this.res) {
        this.t += dt * this.userSpeed;
        if (this.t >= this.tTotal) { this.t = this.tTotal; this.running = false; this.done = true; }
        this.step(dt * this.userSpeed);
        this.updateState();
        this.needsDraw = true;
      } else if (this.res) {
        this.step(dt * 0.4, true);
        this.needsDraw = true;
      }
      if (this.needsDraw) { this.draw(); this.needsDraw = false; }
      requestAnimationFrame(this.loop);
    }

    // ------------------------------------------------------------ simulation step
    step(dt, idle) {
      const res = this.res, fx = this.fx, p = this.progress(this.t);
      const surf = this.surfaceY();
      // temperature trace
      if (!idle && this.t - this.lastGraph > 0.12) { this.graph.push([this.t, this.temperatureAt(this.t)]); this.lastGraph = this.t; }
      // bubbles
      if (!idle) {
        const gas = fx.gas;
        const env = p <= 0 ? 0 : (p < 0.1 ? p / 0.1 : 1 - (p - 0.1) / 0.9 * 0.82);
        let rate = (gas ? gas.rate : 0) * env;
        if (fx.boil) rate = Math.max(rate, this.phase !== 'pour' ? 0.9 : 0);
        if (fx.consumeLiquid) rate = 0;
        if (res.reacts && rate > 0 && !this.dry) {
          const n = rate * 55 * dt;
          let cnt = Math.floor(n) + (Math.random() < n % 1 ? 1 : 0);
          while (cnt-- > 0) this.spawnBubble(gas || { color: null });
        }
        if (res.reacts && this.dry && gas && gas.rate > 0 && p > 0) {
          const n = gas.rate * env * 30 * dt;
          let cnt = Math.floor(n) + (Math.random() < n % 1 ? 1 : 0);
          while (cnt-- > 0) this.fumes.push({ x: 400 + rnd(-30, 30), y: 340, vy: rnd(-40, -75), vx: rnd(-8, 8), a: 0.5, r: rnd(8, 16), c: gas.color || (gas.steam ? '#e8eef2' : '#d8dde2') });
        }
        // fumes above beaker
        if (fx.fumes && p > 0 && p < 0.95 && !(fx.fumes.late && p < 0.3)) {
          const n = (fx.fumes.amount || 0.5) * 18 * dt;
          let cnt = Math.floor(n) + (Math.random() < n % 1 ? 1 : 0);
          while (cnt-- > 0) this.fumes.push({ x: this.dry ? 400 + rnd(-30, 30) : BX + rnd(20, BW - 20), y: this.dry ? 330 : BTOP - 4, vy: rnd(-26, -50), vx: rnd(-10, 10), a: rnd(0.25, 0.5), r: rnd(10, 22), c: fx.fumes.color });
        }
        if (fx.gas && fx.gas.color && p > 0.02 && p < 0.9 && !this.dry && Math.random() < 0.3 * dt * 60 * fx.gas.rate) {
          this.fumes.push({ x: BX + rnd(20, BW - 20), y: BTOP - 4, vy: rnd(-20, -40), vx: rnd(-8, 8), a: 0.4, r: rnd(10, 20), c: fx.gas.color });
        }
        if (fx.sparks && p > 0.02 && p < 0.9) {
          const n = 70 * dt;
          let cnt = Math.floor(n) + (Math.random() < n % 1 ? 1 : 0);
          while (cnt-- > 0) { const a = rnd(-Math.PI * 0.95, -Math.PI * 0.05); const sp = rnd(80, 220); this.sparks.push({ x: 400 + rnd(-25, 25), y: this.dry ? 345 : surf, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp, life: rnd(0.4, 0.9), c: fx.glow || '#ffd27a' }); }
        }
      }
      // update bubbles
      for (let i = this.bubbles.length - 1; i >= 0; i--) {
        const b = this.bubbles[i];
        b.y -= b.vy * dt; b.x += Math.sin(this.t * 3 + b.ph) * 12 * dt;
        if (b.y < surf) {
          if (Math.random() < 0.35) this.mist.push({ x: b.x, y: surf, vx: rnd(-20, 20), vy: rnd(-40, -20), life: 0.35, c: b.c });
          this.bubbles.splice(i, 1);
        }
      }
      for (let i = this.mist.length - 1; i >= 0; i--) { const m = this.mist[i]; m.x += m.vx * dt; m.y += m.vy * dt; m.vy += 160 * dt; m.life -= dt; if (m.life <= 0) this.mist.splice(i, 1); }
      for (let i = this.fumes.length - 1; i >= 0; i--) { const f = this.fumes[i]; f.x += f.vx * dt; f.y += f.vy * dt; f.r += 10 * dt; f.a -= 0.18 * dt; if (f.a <= 0 || f.y < -20) this.fumes.splice(i, 1); }
      for (let i = this.sparks.length - 1; i >= 0; i--) { const s = this.sparks[i]; s.x += s.vx * dt; s.y += s.vy * dt; s.vy += 300 * dt; s.life -= dt; if (s.life <= 0) this.sparks.splice(i, 1); }
      // precipitate particles
      if (fx.ppt && !idle) {
        const bottom = BBOT - 3 - this.sedHeight();
        this.pptP.forEach((q) => {
          if (p < q.thr) { q.started = false; q.settled = false; return; }
          if (!q.started) { q.started = true; q.y = surf + (BBOT - surf) * rnd(0, 0.55); q.settled = false; }
          if (fx.ppt.noSettle) { q.x += Math.sin(this.t * 1.3 + q.ox) * 6 * dt; q.y += Math.cos(this.t * 1.1 + q.ox) * 5 * dt; q.y = clamp(q.y, surf + 4, BBOT - 6); }
          else if (!q.settled) { q.y += q.vy * dt; if (q.y >= bottom) { q.settled = true; q.y = bottom; } }
        });
      }
      // micro particles
      this.stepMicro(dt, idle);
    }

    spawnBubble(gas) {
      const strip = this.fx.metalStrip && !this.fx.metalFloat;
      let x;
      if (strip) x = 392 + rnd(-8, 22);
      else if (this.granules.length) x = BX + BW / 2 + rnd(-60, 60);
      else x = rnd(BX + 14, BX + BW - 14);
      const y = strip ? rnd(BBOT - 110, BBOT - 10) : BBOT - rnd(4, 14);
      this.bubbles.push({ x, y, vy: rnd(40, 95), r: rnd(1.8, 4.6), ph: rnd(0, 6), c: gas.color });
    }

    sedHeight() {
      if (!this.fx.ppt || this.fx.ppt.noSettle) return 0;
      const n = this.pptP.length || 1;
      const st = this.pptP.filter((q) => q.settled).length;
      let h = (st / n) * 26 * clamp(this.fx.ppt.amount, 0.3, 1);
      if (this.fx.ppt.redissolve) h *= 1 - smooth((this.p - 0.55) / 0.3);
      return h;
    }

    surfaceY() {
      if (this.dry) return BBOT - 20;
      return BBOT - this.level * (BH - 26);
    }

    stepMicro(dt, idle) {
      const [x0, y0, x1, y1] = this.mbox;
      const p = this.p == null ? 0 : this.p;
      const vanished = [];
      this.mp.forEach((q) => {
        if (q.role === 'r') {
          if (!idle && q.vis && p >= q.thr) { q.vis = false; q.gone = this.t; this.rings.push({ x: q.x, y: q.y, t: this.t, c: q.color }); }
          if (idle === undefined) {}
          if (this.t < 0.01) q.vis = true;
          if (!q.vis && p < q.thr) q.vis = true;
        } else if (q.role === 'p') {
          const should = p >= q.thr && this.phase !== 'pour';
          if (should && !q.vis) {
            q.vis = true; q.placed = false;
            const src = this.microR.filter((r) => !r.vis);
            const s = src.length ? src[Math.floor(Math.random() * src.length)] : q;
            q.x = s.x; q.y = s.y; q.vx = rnd(-30, 30); q.vy = rnd(-30, 30);
            this.rings.push({ x: q.x, y: q.y, t: this.t, c: q.color, big: true });
          }
          if (!should) q.vis = false;
        }
        if (!q.vis || q.fixed) return;
        if (q.role === 'p' && q.ph === 's') {
          q.x += (q.tx - q.x) * Math.min(1, dt * 2.2); q.y += (q.ty - q.y) * Math.min(1, dt * 2.2);
          return;
        }
        const g = q.role === 'p' && q.ph === 'g';
        q.vx += rnd(-90, 90) * dt; q.vy += rnd(-90, 90) * dt + (g ? -60 * dt : 0);
        const sp = Math.hypot(q.vx, q.vy), cap = g ? 90 : 55;
        if (sp > cap) { q.vx *= cap / sp; q.vy *= cap / sp; }
        q.x += q.vx * dt; q.y += q.vy * dt;
        if (q.x < x0 + q.r) { q.x = x0 + q.r; q.vx = Math.abs(q.vx); }
        if (q.x > x1 - q.r) { q.x = x1 - q.r; q.vx = -Math.abs(q.vx); }
        if (q.y > y1 - q.r) { q.y = y1 - q.r; q.vy = -Math.abs(q.vy); }
        if (q.y < y0 + q.r) {
          if (g) { q.vis = false; q.escaped = true; q.thr = 2; }
          else { q.y = y0 + q.r; q.vy = Math.abs(q.vy); }
        }
      });
      this.rings = this.rings.filter((r) => this.t - r.t < 0.7 && this.t >= r.t);
    }

    // ============================================================ DRAWING
    draw() {
      if (!this.res) return;
      this.drawMain();
      this.drawTempGraph();
      this.drawEnergy();
    }

    scaleCtx(ctx, cv, lw) { ctx.setTransform(cv._s, 0, 0, cv._s, 0, 0); }

    drawMain() {
      const ctx = this.ctx;
      this.scaleCtx(ctx, this.cv, W);
      ctx.clearRect(0, 0, W, H);
      this.drawBackground(ctx);
      if (this.view === 'micro') this.drawMicro(ctx);
      else this.drawBeakerView(ctx);
    }

    drawBackground(ctx) {
      const d = this.dark;
      const g = ctx.createLinearGradient(0, 0, 0, BENCH);
      g.addColorStop(0, d ? '#1a2230' : '#eef3f8'); g.addColorStop(1, d ? '#202a3a' : '#dfe8f1');
      ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
      if (this.view === 'micro') { return; }
      // bench
      const b = ctx.createLinearGradient(0, BENCH, 0, H);
      b.addColorStop(0, d ? '#3a3f48' : '#b7a58b'); b.addColorStop(1, d ? '#2b2f37' : '#9c8a70');
      ctx.fillStyle = b; ctx.fillRect(0, BENCH, W, H - BENCH);
      ctx.fillStyle = d ? '#4a505b' : '#cdbb9f'; ctx.fillRect(0, BENCH, W, 5);
    }

    // ---------------------------------------------------------- beaker view
    shelfPositions() {
      const n = this.pourItems.length;
      const xs = [];
      const span = Math.min(204, 70 * Math.max(0, n - 1));
      const start = 150 - span / 2;
      for (let i = 0; i < n; i++) xs.push(n === 1 ? 150 : start + (span * i) / (n - 1));
      return xs;
    }

    pourState(i) {
      const t = this.t - i * this.PT;
      if (t < 0) return { u: 0, stage: 'shelf' };
      if (t > this.PT) return { u: 1, stage: 'shelf' };
      return { u: t / this.PT, stage: 'active' };
    }

    drawBeakerView(ctx) {
      const fx = this.fx, res = this.res, d = this.dark;
      const p = this.p;
      // level animation
      let tgt = 0;
      this.pourItems.forEach((it, i) => {
        const ps = this.pourState(i);
        const frac = smooth((ps.u - 0.35) / 0.35);
        const v = it.kind === 'liquid' ? (it.id === 'h2o' ? 1.4 : 1) * VOL.liquid : VOL[it.kind];
        tgt += v * frac;
      });
      if (this.dry) tgt = 0;
      if (fx.consumeLiquid) tgt *= 1 - 0.7 * p;
      this.level = clamp(tgt, 0, 0.82);

      this.drawStand(ctx);
      this.drawBurner(ctx);
      if (this.dry) this.drawCrucible(ctx); else this.drawBeaker(ctx);
      this.drawThermometer(ctx);
      this.drawShelf(ctx);
      this.drawEffectsOver(ctx);
      this.drawTimerBadges(ctx);
    }

    drawStand(ctx) {
      const d = this.dark;
      ctx.strokeStyle = d ? '#7b8594' : '#59616d'; ctx.lineWidth = 4; ctx.lineCap = 'round';
      ctx.beginPath(); ctx.moveTo(322, 408); ctx.lineTo(300, BENCH); ctx.moveTo(478, 408); ctx.lineTo(500, BENCH); ctx.moveTo(400, 408); ctx.lineTo(400, BENCH - 8); ctx.stroke();
      ctx.fillStyle = d ? '#aab3c0' : '#8c95a1'; ctx.fillRect(312, 402, 176, 5);
      ctx.strokeStyle = d ? 'rgba(255,255,255,.18)' : 'rgba(0,0,0,.18)'; ctx.lineWidth = 1;
      for (let x = 318; x < 486; x += 8) { ctx.beginPath(); ctx.moveTo(x, 402); ctx.lineTo(x, 407); ctx.stroke(); }
    }

    drawBurner(ctx) {
      if (!this.hasHeat) return;
      const d = this.dark;
      ctx.fillStyle = d ? '#6b7380' : '#5b6470';
      ctx.fillRect(392, 424, 16, 32);
      ctx.beginPath(); ctx.ellipse(400, 458, 34, 8, 0, 0, 6.3); ctx.fill();
      ctx.fillStyle = d ? '#8a94a3' : '#7a8493'; ctx.fillRect(384, 424, 32, 4);
      const on = this.t >= this.tPour - 0.2 && this.t < this.tTotal - 1;
      if (on) this.flame(ctx, 400, 424, 0.9 + 0.1 * Math.sin(this.t * 9), '#4a8bff', '#ffd27a', 1);
    }

    flame(ctx, x, y, s, c1, c2, a) {
      const wob = Math.sin(this.t * 17 + x) * 3;
      for (let k = 0; k < 2; k++) {
        const h = (k ? 26 : 42) * s, w = (k ? 7 : 12) * s;
        const g = ctx.createLinearGradient(0, y, 0, y - h);
        g.addColorStop(0, rgba(k ? c1 : c2, 0.95 * a)); g.addColorStop(1, rgba(k ? c1 : c2, 0));
        ctx.fillStyle = g;
        ctx.beginPath();
        ctx.moveTo(x - w, y);
        ctx.quadraticCurveTo(x - w * 0.9, y - h * 0.55, x + wob * (k ? 0.3 : 1), y - h);
        ctx.quadraticCurveTo(x + w * 0.9, y - h * 0.55, x + w, y);
        ctx.closePath(); ctx.fill();
      }
    }

    glassPath(ctx) {
      ctx.beginPath();
      ctx.moveTo(BX, BTOP); ctx.lineTo(BX, BBOT - 16); ctx.quadraticCurveTo(BX, BBOT, BX + 16, BBOT);
      ctx.lineTo(BX + BW - 16, BBOT); ctx.quadraticCurveTo(BX + BW, BBOT, BX + BW, BBOT - 16); ctx.lineTo(BX + BW, BTOP);
    }

    liquidColorNow() {
      const p = this.p;
      let c = this.c0;
      if (this.res.reacts !== false || this.indActive) c = C.mix(this.c0, this.c1, smooth(p * 1.25));
      return c;
    }

    drawBeaker(ctx) {
      const fx = this.fx, p = this.p, surf = this.surfaceY();
      const d = this.dark;
      // back glass tint
      ctx.save();
      this.glassPath(ctx); ctx.lineTo(BX, BTOP); ctx.closePath();
      ctx.fillStyle = d ? 'rgba(180,210,240,.06)' : 'rgba(200,225,245,.25)'; ctx.fill();
      ctx.clip();
      // liquid
      if (this.level > 0.005) {
        const col = this.liquidColorNow();
        const g = ctx.createLinearGradient(0, surf, 0, BBOT);
        g.addColorStop(0, rgba(col, 0.72)); g.addColorStop(1, rgba(col, 0.9));
        ctx.fillStyle = g; ctx.fillRect(BX, surf, BW, BBOT - surf);
        // milky cloud for suspended precipitate
        if (fx.ppt) {
          let cloud;
          if (fx.ppt.noSettle) cloud = clamp(fx.ppt.amount, 0, 1) * 0.55 * smooth(p * 2);
          else { const n = this.pptP.length || 1; const susp = this.pptP.filter((q) => q.started && !q.settled).length / n; cloud = susp * 0.7 * clamp(fx.ppt.amount + 0.2, 0, 1); }
          if (fx.ppt.redissolve) cloud *= 1 - smooth((p - 0.55) / 0.3);
          if (cloud > 0.01) { ctx.fillStyle = rgba(fx.ppt.color, cloud); ctx.fillRect(BX, surf, BW, BBOT - surf); }
        }
        // surface shine
        ctx.fillStyle = 'rgba(255,255,255,.35)'; ctx.fillRect(BX, surf, BW, 2);
        ctx.fillStyle = rgba(col, 0.9); ctx.beginPath(); ctx.ellipse(BX + BW / 2, surf, BW / 2, 4, 0, 0, 6.3); ctx.fill();
      }
      // sediment
      const sh = this.sedHeight();
      if (sh > 0.5) {
        ctx.fillStyle = rgba(fx.ppt.color, 0.95);
        ctx.beginPath(); ctx.moveTo(BX, BBOT);
        const n = this.sedLayer.length;
        for (let i = 0; i <= n; i++) { const x = BX + (BW * i) / n; const y = BBOT - 2 - sh * this.sedLayer[Math.min(i, n - 1)] * (0.85 + 0.15 * Math.sin(i * 1.7)); ctx.lineTo(x, y); }
        ctx.lineTo(BX + BW, BBOT); ctx.closePath(); ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,.12)'; ctx.lineWidth = 1; ctx.stroke();
      }
      // suspended ppt particles
      if (fx.ppt) {
        const fade = fx.ppt.redissolve ? 1 - smooth((p - 0.55) / 0.3) : 1;
        ctx.fillStyle = rgba(fx.ppt.color, 0.95 * fade); ctx.strokeStyle = 'rgba(40,60,90,' + (0.22 * fade) + ')'; ctx.lineWidth = 0.8;
        this.pptP.forEach((q) => { if (q.started && !q.settled && fade > 0.02) { ctx.beginPath(); ctx.arc(q.x, q.y, q.s * 1.25, 0, 6.3); ctx.fill(); ctx.stroke(); } });
      }
      // solid granules
      this.drawGranules(ctx);
      // metal pieces
      this.drawMetals(ctx, surf);
      // bubbles
      this.bubbles.forEach((b) => {
        ctx.beginPath(); ctx.arc(b.x, b.y, b.r, 0, 6.3);
        ctx.fillStyle = b.c ? rgba(b.c, 0.55) : 'rgba(255,255,255,.45)'; ctx.fill();
        ctx.strokeStyle = 'rgba(255,255,255,.8)'; ctx.lineWidth = 0.8; ctx.stroke();
      });
      // gas flowing in (CO2 into limewater)
      if (fx.gasIn && this.phase !== 'pour' && p < 0.95) {
        for (let i = 0; i < 6; i++) {
          const k = (this.t * 1.6 + i / 6) % 1;
          ctx.beginPath(); ctx.arc(BX + BW * 0.62 + Math.sin(k * 9 + i) * 4, BBOT - 6 - k * (BBOT - surf - 6), 2.6 + (1 - k), 0, 6.3);
          ctx.fillStyle = 'rgba(255,255,255,.55)'; ctx.fill();
        }
      }
      ctx.restore();
      // boiling shimmer
      if (fx.boil && this.phase !== 'pour') {
        for (let i = 0; i < 3; i++) { ctx.strokeStyle = 'rgba(255,255,255,.35)'; ctx.beginPath(); ctx.arc(BX + 40 + i * 60, surf + 2, 8 + 3 * Math.sin(this.t * 8 + i), Math.PI, 2 * Math.PI); ctx.stroke(); }
      }
      // glass outline and highlights
      ctx.strokeStyle = d ? 'rgba(210,230,250,.75)' : 'rgba(70,100,130,.75)'; ctx.lineWidth = 3; ctx.lineJoin = 'round'; ctx.lineCap = 'round';
      this.glassPath(ctx); ctx.stroke();
      ctx.beginPath(); ctx.moveTo(BX - 8, BTOP - 5); ctx.lineTo(BX + 2, BTOP); ctx.moveTo(BX + BW + 8, BTOP - 5); ctx.lineTo(BX + BW - 2, BTOP); ctx.stroke();
      ctx.strokeStyle = 'rgba(255,255,255,.55)'; ctx.lineWidth = 5;
      ctx.beginPath(); ctx.moveTo(BX + 12, BTOP + 18); ctx.lineTo(BX + 12, BBOT - 40); ctx.stroke();
      // graduation marks
      ctx.strokeStyle = d ? 'rgba(220,235,255,.55)' : 'rgba(40,70,100,.5)'; ctx.lineWidth = 1.5; ctx.fillStyle = ctx.strokeStyle; ctx.font = '10px system-ui, sans-serif'; ctx.textAlign = 'left';
      [[0.25, '50'], [0.5, '100'], [0.75, '150']].forEach(([f, l]) => { const y = BBOT - f * (BH - 26); ctx.beginPath(); ctx.moveTo(BX + BW - 20, y); ctx.lineTo(BX + BW - 4, y); ctx.stroke(); ctx.fillText(l, BX + BW - 42, y + 3); });
    }

    drawGranules(ctx) {
      const fx = this.fx, p = this.p;
      this.granules.forEach((gr) => {
        const it = this.items[gr.item];
        const ps = this.pourState(this.pourItems.indexOf(it));
        const pr = this.pourItems.indexOf(it) < 0 ? 1 : (ps.stage === 'shelf' && ps.u === 0 ? 0 : smooth((ps.u - 0.35) / 0.3));
        if (pr <= 0.01 || gr.vanish > pr + 0.001 && pr < 1) return;
        const consume = fx.solidConsume != null ? fx.solidConsume : 1;
        // consumed granules disappear as the reaction progresses
        if (it.kind === 'solid' || this.dry) {
          if (p * consume > gr.vanish && consume > 0 && this.res.reacts) return;
        }
        let col = it.chem.color || '#cccccc';
        if (fx.solidFrom && (it.kind === 'solid' || it.kind === 'metal')) col = fx.solidFrom;
        if (fx.solidEnd && (it.kind === 'solid' || it.kind === 'metal')) col = C.mix(col, fx.solidEnd, smooth(p * 1.5));
        const base = this.dry ? 396 : BBOT - 3;
        const w = this.dry ? 34 : 82;
        const cx = this.dry ? 400 : BX + BW / 2;
        const pile = this.dry ? 16 : 20;
        const hx = gr.x * w, hy = (1 - Math.abs(gr.x) * 0.7) * gr.y * pile;
        ctx.fillStyle = col; ctx.globalAlpha = 0.95;
        ctx.beginPath(); ctx.arc(cx + hx + (it.kind === 'metal' ? 0 : 0), base - 3 - hy, gr.r * (this.dry ? 1.1 : 1), 0, 6.3); ctx.fill();
        ctx.globalAlpha = 1;
      });
    }

    drawMetals(ctx, surf) {
      const fx = this.fx, p = this.p;
      let k = 0;
      this.items.forEach((it, idx) => {
        if (it.kind !== 'metal' || this.dry) return;
        const pi = this.pourItems.indexOf(it);
        const ps = this.pourState(pi);
        const inBeaker = ps.u > 0.4 || this.t >= (pi + 1) * this.PT;
        if (!inBeaker) return;
        const M = C.METAL[it.chem.metal];
        const consume = this.res.reacts ? 0.75 : 0;
        const fall = smooth((ps.u - 0.4) / 0.2);
        if (fx.metalFloat) {
          const r = 11 * (1 - 0.85 * p * (this.res.reacts ? 1 : 0));
          if (r < 0.8) return;
          const cx = BX + BW / 2 + Math.sin(this.t * 2.1 + k) * 55 * smooth(p * 6) * (1 - p * 0.3);
          const cy = surf - 4 + (1 - fall) * -30 + Math.sin(this.t * 7) * 1.5;
          ctx.beginPath(); ctx.arc(cx, cy, r, 0, 6.3); ctx.fillStyle = M.color; ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.beginPath(); ctx.arc(cx - r * 0.3, cy - r * 0.3, r * 0.3, 0, 6.3); ctx.fill();
          if (fx.burn && p > 0.02 && p < 0.9) this.flame(ctx, cx, cy - r * 0.4, 0.5 + 0.2 * Math.sin(this.t * 11), fx.burn.color, fx.burn.color, 0.8);
        } else if (fx.metalStrip || true) {
          const frac = 1 - consume * p;
          const sx = 380 + k * 34, h = 130 * frac, w = it.chem.metal === 'mg' ? 8 : 15;
          const top = BBOT - 4 - h;
          const y = lerp(top - 100, top, fall);
          ctx.save();
          let col = M.color;
          ctx.fillStyle = col;
          if (it.chem.metal === 'mg') { ctx.strokeStyle = col; ctx.lineWidth = 5; ctx.beginPath(); for (let j = 0; j <= 12; j++) { const yy = y + (h * j) / 12; const xx = sx + 7 + Math.sin(j * 1.1) * 5; if (j === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy); } ctx.stroke(); }
          else { ctx.fillRect(sx, y, w, h + (BBOT - 4 - top - h) * 0); }
          if (fx.deposit && p > 0) {
            ctx.fillStyle = rgba(fx.deposit.color, smooth(p * 1.5) * 0.95);
            if (it.chem.metal === 'mg') { ctx.fillRect(sx + 3, y, 8, h); } else ctx.fillRect(sx - 2, y, w + 4, h);
            ctx.strokeStyle = rgba(fx.deposit.color, smooth(p * 1.5)); ctx.lineWidth = 1.8;
            this.branches.forEach((b) => {
              const grow = clamp(p * 1.4 - b.y * 0.4, 0, 1);
              if (grow <= 0) return;
              const bx = sx + (b.side > 0 ? w : 0), by = y + b.y * h;
              ctx.beginPath(); ctx.moveTo(bx, by);
              const ex = bx + b.side * b.len * grow, ey = by + Math.sin(b.a) * b.len * 0.6 * grow;
              ctx.lineTo(ex, ey); ctx.lineTo(ex + b.side * 5 * grow, ey - 7 * grow); ctx.moveTo(ex, ey); ctx.lineTo(ex + b.side * 5 * grow, ey + 6 * grow); ctx.stroke();
            });
          }
          ctx.fillStyle = 'rgba(255,255,255,.25)'; ctx.fillRect(sx + 2, y, 3, h);
          ctx.restore();
        }
        k++;
      });
      // burning on top for liquids (ethanol)
      if (fx.burn && !fx.metalFloat && this.phase !== 'pour' && p < 0.95) {
        for (let i = 0; i < 5; i++) this.flame(ctx, BX + 40 + i * 30, surf - 1, (0.7 + 0.25 * Math.sin(this.t * 9 + i * 2)) * fx.burn.size * 1.3, fx.burn.color, '#d6ebff', 0.7);
      }
    }

    drawCrucible(ctx) {
      const fx = this.fx, p = this.p, d = this.dark;
      ctx.beginPath(); ctx.moveTo(336, 346); ctx.lineTo(464, 346); ctx.lineTo(440, 398); ctx.lineTo(360, 398); ctx.closePath();
      ctx.fillStyle = d ? '#d5cfc3' : '#ece6da'; ctx.fill(); ctx.strokeStyle = '#a89f8e'; ctx.lineWidth = 3; ctx.stroke();
      ctx.save();
      ctx.beginPath(); ctx.moveTo(340, 350); ctx.lineTo(460, 350); ctx.lineTo(437, 394); ctx.lineTo(363, 394); ctx.closePath(); ctx.clip();
      ctx.fillStyle = 'rgba(0,0,0,.06)'; ctx.fillRect(330, 350, 140, 50);
      this.drawGranules(ctx);
      ctx.restore();
      if (fx.glow && p > 0.1) {
        const g = ctx.createRadialGradient(400, 372, 4, 400, 372, 60);
        g.addColorStop(0, rgba(fx.glow, 0.9 * (1 - p * 0.5))); g.addColorStop(1, rgba(fx.glow, 0));
        ctx.fillStyle = g; ctx.fillRect(330, 310, 140, 120);
      }
      if (fx.burn && p > 0.02 && p < 0.95) this.flame(ctx, 400, 350, 1, fx.burn.color, '#fff', 0.8);
    }

    drawThermometer(ctx) {
      const d = this.dark;
      const x = 590, top = 140, bot = 398;
      ctx.fillStyle = d ? 'rgba(220,235,255,.12)' : 'rgba(255,255,255,.8)';
      ctx.strokeStyle = d ? 'rgba(220,235,255,.7)' : 'rgba(70,100,130,.8)'; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.roundRect(x - 8, top - 6, 16, bot - top - 4, 8); ctx.fill(); ctx.stroke();
      ctx.beginPath(); ctx.arc(x, bot + 8, 14, 0, 6.3); ctx.fill(); ctx.stroke();
      const T = this.T == null ? 25 : this.T;
      const f = clamp((T - this.tLo) / (this.tHi - this.tLo), 0, 1);
      const hot = T > 27, cold = T < 23;
      const col = hot ? '#e53935' : cold ? '#1e88e5' : '#d94b3d';
      ctx.fillStyle = col;
      ctx.beginPath(); ctx.arc(x, bot + 8, 11, 0, 6.3); ctx.fill();
      const mh = (bot - top - 16) * f + 6;
      ctx.fillRect(x - 3, bot - mh, 6, mh);
      ctx.fillStyle = d ? '#c9d3e0' : '#44505f'; ctx.font = '10px system-ui, sans-serif'; ctx.textAlign = 'right';
      const steps = 5;
      for (let i = 0; i <= steps; i++) {
        const v = this.tLo + ((this.tHi - this.tLo) * i) / steps;
        const y = bot - 6 - ((bot - top - 16) * i) / steps;
        ctx.fillRect(x + 10, y - 0.5, 6, 1.2);
        ctx.textAlign = 'left'; ctx.fillText(Math.round(v) + '', x + 19, y + 3);
      }
      // read-out
      ctx.textAlign = 'center'; ctx.font = '600 15px system-ui, sans-serif';
      ctx.fillStyle = hot ? '#e0453a' : cold ? '#3b8be0' : (d ? '#e6edf5' : '#2a3441');
      const arrow = T > this.T0 + 0.6 ? '▲ ' : T < this.T0 - 0.6 ? '▼ ' : '';
      ctx.fillText(arrow + T.toFixed(1) + ' °C', x, top - 16);
    }

    drawShelf(ctx) {
      const xs = this.shelfPositions();
      this.pourItems.forEach((it, i) => {
        const ps = this.pourState(i);
        const sx = xs[i];
        this.drawBottle(ctx, it, sx, ps, i);
      });
      if (this.hasHeat) {
        ctx.fillStyle = this.dark ? '#f5c26b' : '#c5701b'; ctx.font = '600 11px system-ui, sans-serif'; ctx.textAlign = 'center';
        ctx.fillText('Bunsen burner', 400, 482);
      }
    }

    bottleDims(it) {
      switch (it.kind) {
        case 'solid': case 'metal': return { w: 56, h: 62, neck: 18 };
        case 'gas': return { w: 40, h: 110, neck: 12 };
        case 'drop': return { w: 28, h: 50, neck: 10 };
        default: return { w: 46, h: 88, neck: 14 };
      }
    }

    drawBottle(ctx, it, sx, ps, idx) {
      const dm = this.bottleDims(it);
      const shelfY = BENCH - dm.h - 8; // mouth y when standing
      const d = this.dark;
      // pour pose
      const mouthTarget = { x: BX + BW * 0.28, y: BTOP - 38 };
      let mx = sx, my = shelfY, tilt = 0, streaming = false;
      if (ps.stage === 'active') {
        const u = ps.u;
        const mv = u < 0.25 ? smooth(u / 0.25) : u > 0.8 ? 1 - smooth((u - 0.8) / 0.2) : 1;
        const tl = u < 0.25 ? 0 : u < 0.4 ? smooth((u - 0.25) / 0.15) : u < 0.7 ? 1 : 1 - smooth((u - 0.7) / 0.12);
        mx = lerp(sx, mouthTarget.x, mv); my = lerp(shelfY, mouthTarget.y, mv); tilt = tl * (it.kind === 'gas' ? 0.9 : 1.75);
        streaming = u > 0.38 && u < 0.72;
      }
      // content colour
      let col = it.chem.color;
      if (it.kind === 'liquid') col = it.chem.color || WATER;
      ctx.save();
      ctx.translate(mx, my);
      ctx.rotate(tilt);
      // body
      const body = (fill) => { ctx.fillStyle = fill; ctx.strokeStyle = d ? 'rgba(220,235,255,.75)' : 'rgba(70,100,130,.8)'; ctx.lineWidth = 2; };
      body(d ? 'rgba(200,225,250,.12)' : 'rgba(255,255,255,.55)');
      ctx.beginPath();
      ctx.moveTo(-dm.neck / 2, 0); ctx.lineTo(-dm.neck / 2, 8); ctx.lineTo(-dm.w / 2, 16); ctx.lineTo(-dm.w / 2, dm.h - 4); ctx.quadraticCurveTo(-dm.w / 2, dm.h, -dm.w / 2 + 6, dm.h);
      ctx.lineTo(dm.w / 2 - 6, dm.h); ctx.quadraticCurveTo(dm.w / 2, dm.h, dm.w / 2, dm.h - 4); ctx.lineTo(dm.w / 2, 16); ctx.lineTo(dm.neck / 2, 8); ctx.lineTo(dm.neck / 2, 0);
      ctx.fill(); ctx.stroke();
      // contents
      ctx.save(); ctx.clip();
      const fillH = (dm.h - 18) * (it.kind === 'liquid' ? 0.72 : it.kind === 'gas' ? 1 : 0.4);
      if (it.kind === 'liquid') { ctx.fillStyle = rgba(col, 0.8); ctx.fillRect(-dm.w / 2, dm.h - fillH, dm.w, fillH); }
      else if (it.kind === 'drop') { ctx.fillStyle = rgba(col || '#999999', 0.85); ctx.fillRect(-dm.w / 2, dm.h - fillH * 1.1, dm.w, fillH * 1.2); }
      else if (it.kind === 'gas') { ctx.fillStyle = rgba(it.id === 'o2' ? '#ff8a80' : '#b0bec5', 0.18); ctx.fillRect(-dm.w / 2, 10, dm.w, dm.h); }
      else if (it.kind === 'metal') {
        const M = C.METAL[it.chem.metal];
        ctx.fillStyle = M.color;
        for (let j = 0; j < 4; j++) { ctx.save(); ctx.translate(-14 + j * 10, dm.h - 12 - (j % 2) * 3); ctx.rotate(-0.35 + j * 0.25); ctx.fillRect(-3, -14, 6, 26); ctx.restore(); }
        if (it.id === 'na' || it.id === 'k') { ctx.fillStyle = 'rgba(210,190,120,.35)'; ctx.fillRect(-dm.w / 2, dm.h - 24, dm.w, 24); }
      } else {
        ctx.fillStyle = col || '#ddd';
        ctx.beginPath(); ctx.moveTo(-dm.w / 2, dm.h); ctx.quadraticCurveTo(0, dm.h - 26, dm.w / 2, dm.h); ctx.closePath(); ctx.fill();
        ctx.fillStyle = 'rgba(0,0,0,.08)'; for (let j = 0; j < 14; j++) { ctx.fillRect(rnd(-dm.w / 2, dm.w / 2) | 0, dm.h - 4 - ((j * 7) % 14), 2, 2); }
      }
      ctx.restore();
      // label
      if (it.kind !== 'drop') {
        ctx.fillStyle = d ? '#e8eef5' : '#ffffff';
        const lw = dm.w - 8, ly = it.kind === 'gas' ? 40 : 30, lh = 22;
        ctx.globalAlpha = 0.92; ctx.beginPath(); ctx.roundRect(-lw / 2, ly, lw, lh, 4); ctx.fill(); ctx.globalAlpha = 1;
        ctx.strokeStyle = 'rgba(0,0,0,.2)'; ctx.lineWidth = 1; ctx.stroke();
        ctx.fillStyle = '#1d2733'; ctx.textAlign = 'center';
        const lbl = uni(it.chem.f.split('·')[0]);
        let fs = 11;
        ctx.font = '700 ' + fs + 'px system-ui, sans-serif';
        while (fs > 7 && ctx.measureText(lbl).width > lw - 4) { fs -= 0.5; ctx.font = '700 ' + fs + 'px system-ui, sans-serif'; }
        ctx.fillText(lbl, 0, ly + 15);
      }
      // cap
      if (ps.stage !== 'active') { ctx.fillStyle = d ? '#6a7480' : '#5d6874'; ctx.fillRect(-dm.neck / 2 - 2, -6, dm.neck + 4, 6); }
      ctx.restore();
      // name under bottle when on shelf
      if (ps.stage !== 'active' || ps.u < 0.1 || ps.u > 0.9) {
        ctx.fillStyle = d ? '#d6e0ee' : '#3c4756'; ctx.font = '10.5px system-ui, sans-serif'; ctx.textAlign = 'center';
        const lines = nameLines(it.chem.name.replace(/ \(.*\)/, ''), 12);
        lines.forEach((ln, k) => ctx.fillText(ln, sx, BENCH + 15 + k * 12));
      }
      // stream
      if (streaming) {
        const sc = it.kind === 'liquid' ? (col ? rgba(col, 0.85) : 'rgba(150,200,235,.85)') : it.kind === 'gas' ? 'rgba(220,230,240,.55)' : (it.chem.color || '#ccc');
        const mouthX = mx + Math.cos(tilt) * 0 + Math.sin(tilt) * 0, mouthY = my;
        const tx = BX + BW / 2 - 20, ty = this.dry ? 352 : Math.max(this.surfaceY(), BTOP + 10);
        const n = it.kind === 'liquid' ? 16 : 11;
        for (let j = 0; j < n; j++) {
          const f = ((this.t * 2.4 + j / n) % 1);
          const px = lerp(mouthX + 8, tx, f), py = mouthY + 6 + (ty - mouthY - 6) * f * f;
          ctx.beginPath(); ctx.arc(px, py, it.kind === 'liquid' ? 3 : it.kind === 'gas' ? 4 : 2.6, 0, 6.3); ctx.fillStyle = sc; ctx.fill();
        }
      }
    }

    drawEffectsOver(ctx) {
      const fx = this.fx, p = this.p;
      // foam / carbon column rising out of the beaker
      if (fx.foam && p > 0) {
        const lvl = smooth(Math.min(1, p / 0.8)) * (fx.foam.height || 1);
        const carbon = fx.foam.color === '#161616';
        const surf0 = this.dry ? 380 : Math.min(this.surfaceY(), BBOT - 20);
        const colWide = carbon ? 36 : 70;
        const topY = BTOP - 140;
        const maxH = (surf0 - topY) * lvl;
        ctx.save();
        if (carbon) {
          ctx.fillStyle = '#161616';
          ctx.beginPath(); ctx.roundRect(400 - colWide, surf0 - maxH, colWide * 2, maxH + 6, 18); ctx.fill();
        }
        this.foam.forEach((f) => {
          if (f.v > 1) return;
          const y = surf0 - f.v * maxH + Math.sin(this.t * 3 + f.u * 5) * 1.5;
          if (f.v * maxH < 4) return;
          const wdt = colWide + (carbon ? 8 : 0) + Math.sin(f.v * 8) * 5;
          ctx.beginPath(); ctx.arc(400 + f.u * wdt, y, f.r, 0, 6.3);
          ctx.fillStyle = fx.foam.color; ctx.fill();
          ctx.strokeStyle = carbon ? 'rgba(255,255,255,.12)' : 'rgba(120,150,180,.7)'; ctx.lineWidth = 1; ctx.stroke();
        });
        ctx.restore();
      }
      // fumes
      this.fumes.forEach((f) => { ctx.beginPath(); ctx.arc(f.x, f.y, f.r, 0, 6.3); ctx.fillStyle = rgba(f.c || '#dddddd', clamp(f.a, 0, 1) * 0.55); ctx.fill(); });
      this.mist.forEach((m) => { ctx.beginPath(); ctx.arc(m.x, m.y, 1.6, 0, 6.3); ctx.fillStyle = 'rgba(255,255,255,.7)'; ctx.fill(); });
      // flash glow: dim the room a little, then a very bright core
      if (fx.flash && p > 0.02 && p < 0.97) {
        const k = Math.sin(clamp(p, 0, 1) * Math.PI) * (0.8 + 0.2 * Math.sin(this.t * 40));
        const cy = this.dry ? 350 : BTOP + 60;
        if (!this.dark) { ctx.fillStyle = 'rgba(8,12,22,' + (0.42 * k) + ')'; ctx.fillRect(0, 0, W, H); }
        const g = ctx.createRadialGradient(400, cy, 4, 400, cy, 280);
        g.addColorStop(0, rgba('#ffffff', 1 * k * fx.flash.power)); g.addColorStop(0.12, rgba(fx.flash.color, 0.85 * k)); g.addColorStop(0.4, rgba(fx.flash.color, 0.28 * k)); g.addColorStop(1, rgba(fx.flash.color, 0));
        ctx.globalCompositeOperation = 'lighter';
        ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
        ctx.globalCompositeOperation = 'source-over';
      }
      this.sparks.forEach((s) => { ctx.strokeStyle = rgba(s.c, clamp(s.life * 1.6, 0, 1)); ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(s.x, s.y); ctx.lineTo(s.x - s.vx * 0.03, s.y - s.vy * 0.03); ctx.stroke(); });
    }

    drawTimerBadges(ctx) {
      const res = this.res;
      if (res.timelapse) {
        ctx.fillStyle = this.dark ? 'rgba(255,200,120,.2)' : 'rgba(200,110,20,.15)';
        ctx.beginPath(); ctx.roundRect(12, 12, 190, 26, 13); ctx.fill();
        ctx.fillStyle = this.dark ? '#ffd9a0' : '#a85a10'; ctx.font = '600 12px system-ui, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('⏩ Time-lapse (real: days)', 26, 30);
      }
      if (this.phase === 'pour' && this.t > 0) {
        ctx.fillStyle = this.dark ? '#cfe0f4' : '#3b4a5c'; ctx.font = '600 12px system-ui, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('Adding reagents…', 14, 484);
      }
    }

    // ---------------------------------------------------------- particle view
    drawMicro(ctx) {
      const [x0, y0, x1, y1] = this.mbox, d = this.dark, p = this.p;
      ctx.fillStyle = d ? '#101826' : '#fbfdff';
      ctx.strokeStyle = d ? '#3a4a60' : '#b5c4d6'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.roundRect(x0, y0, x1 - x0, y1 - y0, 14); ctx.fill(); ctx.stroke();
      ctx.fillStyle = d ? '#9fb2c8' : '#5a6b7e'; ctx.font = '600 13px system-ui, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Particle view (a tiny region of the mixture, greatly magnified)', x0, y0 - 14);
      // solvent tint
      const col = this.liquidColorNow();
      ctx.save(); ctx.beginPath(); ctx.roundRect(x0, y0, x1 - x0, y1 - y0, 14); ctx.clip();
      ctx.fillStyle = rgba(col, 0.16); ctx.fillRect(x0, y0, x1 - x0, y1 - y0);
      // solvent water molecules (tiny)
      ctx.fillStyle = d ? 'rgba(120,170,230,.18)' : 'rgba(90,150,220,.14)';
      for (let i = 0; i < 60; i++) { const xx = x0 + ((i * 97) % (x1 - x0)), yy = y0 + ((i * 53 + Math.sin(this.t + i) * 4) % (y1 - y0)); ctx.beginPath(); ctx.arc(xx, yy, 3, 0, 6.3); ctx.fill(); }
      // draw particles
      this.mp.forEach((q) => {
        if (!q.vis) return;
        ctx.globalAlpha = q.role === 's' ? 0.75 : 1;
        if (q.ph === 's' && q.role !== 's') {
          ctx.fillStyle = q.color; ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1;
          ctx.beginPath(); ctx.rect(q.x - 10, q.y - 10, 20, 20); ctx.fill(); ctx.stroke();
          ctx.fillStyle = this.labelColor(q.color); ctx.font = '600 9px system-ui, sans-serif'; ctx.textAlign = 'center'; ctx.fillText(uni(q.label).slice(0, 5), q.x, q.y + 3);
        } else {
          const g = ctx.createRadialGradient(q.x - q.r * 0.35, q.y - q.r * 0.35, 1, q.x, q.y, q.r);
          g.addColorStop(0, '#ffffffaa'); g.addColorStop(0.25, q.color); g.addColorStop(1, q.color);
          ctx.fillStyle = q.color; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.3); ctx.fill();
          ctx.fillStyle = 'rgba(255,255,255,.28)'; ctx.beginPath(); ctx.arc(q.x - q.r * 0.3, q.y - q.r * 0.35, q.r * 0.4, 0, 6.3); ctx.fill();
          ctx.strokeStyle = 'rgba(0,0,0,.25)'; ctx.lineWidth = 1; ctx.beginPath(); ctx.arc(q.x, q.y, q.r, 0, 6.3); ctx.stroke();
          const lbl = uni(q.label);
          ctx.fillStyle = this.labelColor(q.color); ctx.font = '700 ' + (lbl.length > 3 ? 8 : 9.5) + 'px system-ui, sans-serif'; ctx.textAlign = 'center';
          ctx.fillText(lbl.length > 6 ? lbl.slice(0, 5) + '…' : lbl, q.x, q.y + 3.2);
        }
        ctx.globalAlpha = 1;
      });
      this.rings.forEach((r) => {
        const k = (this.t - r.t) / 0.7;
        ctx.strokeStyle = rgba('#ffd54a', 1 - k); ctx.lineWidth = 2.5 * (1 - k);
        ctx.beginPath(); ctx.arc(r.x, r.y, 10 + k * (r.big ? 34 : 22), 0, 6.3); ctx.stroke();
      });
      ctx.restore();
      // legend
      let ly = y0 + 6;
      ctx.textAlign = 'left';
      ctx.fillStyle = d ? '#cfe0f4' : '#33414f'; ctx.font = '700 13px system-ui, sans-serif';
      ctx.fillText('Key', 584, ly + 10); ly += 26;
      this.legend.forEach((e) => {
        if (ly > y1 - 6) return;
        if (e.ph === 's') { ctx.fillStyle = e.color; ctx.fillRect(586, ly - 8, 14, 14); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.strokeRect(586, ly - 8, 14, 14); }
        else { ctx.fillStyle = e.color; ctx.beginPath(); ctx.arc(593, ly - 1, 7, 0, 6.3); ctx.fill(); ctx.strokeStyle = 'rgba(0,0,0,.3)'; ctx.stroke(); }
        ctx.fillStyle = d ? '#e4ecf6' : '#26323f'; ctx.font = '600 12px system-ui, sans-serif'; ctx.fillText(uni(e.label), 608, ly + 3);
        ctx.fillStyle = d ? '#8fa2b8' : '#6b7b8d'; ctx.font = '11px system-ui, sans-serif';
        const tag = e.role + (e.ph === 's' ? ' (solid)' : e.ph === 'g' ? ' (gas)' : '');
        ctx.fillText(tag, 608, ly + 16);
        ly += 36;
      });
      if (ly < y1 - 40) {
        ctx.fillStyle = d ? '#8fa2b8' : '#6b7b8d'; ctx.font = '11px system-ui, sans-serif';
        wrapText(ctx, 'Spectator ions do not take part in the reaction: they are there before and after.', 584, ly + 8, 196, 14);
      }
      // progress ring text
      ctx.fillStyle = d ? '#9fb2c8' : '#5a6b7e'; ctx.font = '12px system-ui, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText(this.res.reacts === false ? 'No new substance forms' : 'Reaction progress: ' + Math.round(p * 100) + '%', x0, y1 + 24);
    }

    labelColor(hex) {
      if (!hex || hex[0] !== '#') return '#10202e';
      const [r, g, b] = C.hex2rgb(hex);
      return (r * 0.299 + g * 0.587 + b * 0.114) > 150 ? '#10202e' : '#ffffff';
    }

    // ---------------------------------------------------------- temperature graph
    drawTempGraph() {
      const ctx = this.tctx, cv = this.tcv, d = this.dark;
      ctx.setTransform(cv._s, 0, 0, cv._s, 0, 0);
      ctx.clearRect(0, 0, 400, 220);
      const L = 44, R = 388, T = 20, B = 184;
      ctx.fillStyle = d ? '#9fb2c8' : '#5a6b7e'; ctx.font = '11px system-ui, sans-serif';
      const lo = this.tLo, hi = this.tHi;
      ctx.strokeStyle = d ? 'rgba(255,255,255,.1)' : 'rgba(0,0,0,.08)'; ctx.lineWidth = 1; ctx.textAlign = 'right';
      for (let i = 0; i <= 4; i++) { const y = B - ((B - T) * i) / 4; ctx.beginPath(); ctx.moveTo(L, y); ctx.lineTo(R, y); ctx.stroke(); ctx.fillText(Math.round(lo + ((hi - lo) * i) / 4) + '', L - 6, y + 4); }
      ctx.textAlign = 'center';
      const tt = this.tTotal;
      for (let i = 0; i <= 4; i++) { const x = L + ((R - L) * i) / 4; ctx.fillText(Math.round((tt * i) / 4) + '', x, B + 15); }
      ctx.fillText('time (illustrative seconds)', (L + R) / 2, B + 31);
      ctx.save(); ctx.translate(12, (T + B) / 2); ctx.rotate(-Math.PI / 2); ctx.fillText('Temperature (°C)', 0, 0); ctx.restore();
      // initial T dashed
      const yOf = (v) => B - ((v - lo) / (hi - lo)) * (B - T);
      const xOf = (t) => L + (t / tt) * (R - L);
      ctx.setLineDash([4, 4]); ctx.strokeStyle = d ? 'rgba(255,255,255,.35)' : 'rgba(0,0,0,.3)'; ctx.beginPath(); ctx.moveTo(L, yOf(25)); ctx.lineTo(R, yOf(25)); ctx.stroke(); ctx.setLineDash([]);
      // mixing zone shading
      ctx.fillStyle = d ? 'rgba(120,170,230,.12)' : 'rgba(90,150,220,.1)'; ctx.fillRect(L, T, xOf(this.tPour) - L, B - T);
      ctx.fillStyle = d ? '#9fb2c8' : '#6b7b8d'; ctx.textAlign = 'left'; ctx.font = '10px system-ui, sans-serif'; ctx.fillText('adding', L + 3, T + 11);
      // trace
      if (this.graph.length > 1) {
        const exo = this.T1 >= this.T0;
        ctx.strokeStyle = exo ? '#e5533d' : '#2f86e0'; ctx.lineWidth = 2.6; ctx.lineJoin = 'round';
        ctx.beginPath();
        this.graph.forEach(([t, v], i) => { const x = xOf(t), y = yOf(clamp(v, lo, hi)); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
        ctx.stroke();
        const last = this.graph[this.graph.length - 1];
        ctx.fillStyle = exo ? '#e5533d' : '#2f86e0'; ctx.beginPath(); ctx.arc(xOf(last[0]), yOf(clamp(last[1], lo, hi)), 4.5, 0, 6.3); ctx.fill();
      } else {
        ctx.fillStyle = d ? '#7f90a5' : '#8696a8'; ctx.textAlign = 'center'; ctx.font = '12px system-ui, sans-serif'; ctx.fillText('Press Mix to start recording', (L + R) / 2, (T + B) / 2);
      }
    }

    // ---------------------------------------------------------- energy profile
    drawEnergy() {
      const ctx = this.ectx, cv = this.ecv, d = this.dark, res = this.res;
      ctx.setTransform(cv._s, 0, 0, cv._s, 0, 0);
      ctx.clearRect(0, 0, 400, 220);
      const L = 34, R = 388, yR = 112;
      const dh = res.dh;
      const dy = dh == null ? 0 : clamp(dh * 0.17, -62, 62);
      const yP = yR - dy;  // higher enthalpy is up
      const ea = 54;
      const yTS = Math.min(yR, yP) - ea;
      const f = (x) => {
        const s = smooth((x - 0.32) / 0.36);
        const hump = Math.exp(-Math.pow((x - 0.5) / 0.14, 2));
        return yR + (yP - yR) * s - (yR + (yP - yR) * s - yTS) * hump * (res.reacts === false ? 0 : 1);
      };
      const X = (x) => L + x * (R - L - 30) + 6;
      ctx.fillStyle = d ? '#9fb2c8' : '#5a6b7e'; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'left';
      ctx.save(); ctx.translate(11, 108); ctx.rotate(-Math.PI / 2); ctx.textAlign = 'center'; ctx.fillText('Enthalpy, H', 0, 0); ctx.restore();
      ctx.strokeStyle = d ? 'rgba(255,255,255,.3)' : 'rgba(0,0,0,.3)'; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(L - 2, 18); ctx.lineTo(L - 2, 196); ctx.lineTo(R, 196); ctx.stroke();
      // levels
      ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.moveTo(L, yR); ctx.lineTo(R, yR); ctx.stroke(); ctx.setLineDash([]);
      // catalysed curve
      if (res.catalyst) {
        ctx.strokeStyle = '#2faa8d'; ctx.lineWidth = 2; ctx.setLineDash([5, 4]);
        ctx.beginPath();
        for (let i = 0; i <= 60; i++) { const x = i / 60; const s = smooth((x - 0.32) / 0.36); const hump = Math.exp(-Math.pow((x - 0.5) / 0.14, 2)); const y0 = yR + (yP - yR) * s; const yy = y0 - (y0 - (Math.min(yR, yP) - ea * 0.5)) * hump; if (i === 0) ctx.moveTo(X(x), yy); else ctx.lineTo(X(x), yy); }
        ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = '#2faa8d'; ctx.textAlign = 'left'; ctx.fillText('with catalyst (lower Eₐ)', X(0.55), yTS + 20 + 12);
      }
      const exo = res.heat === 'exo';
      const col = res.dh == null ? (d ? '#9fb2c8' : '#6b7b8d') : exo ? '#e5533d' : res.heat === 'endo' ? '#2f86e0' : '#8a8f98';
      ctx.strokeStyle = col; ctx.lineWidth = 3; ctx.lineJoin = 'round';
      ctx.beginPath();
      for (let i = 0; i <= 80; i++) { const x = i / 80; const y = f(x); if (i === 0) ctx.moveTo(X(x), y); else ctx.lineTo(X(x), y); }
      ctx.stroke();
      // labels
      ctx.fillStyle = d ? '#e6edf5' : '#2a3441'; ctx.font = '600 11.5px system-ui, sans-serif'; ctx.textAlign = 'left';
      ctx.fillText('Reactants', X(0.0), yR + 18);
      ctx.textAlign = 'right'; ctx.fillText('Products', X(1.0) + 20, yP + 20);
      // delta H arrow
      if (res.dh != null && Math.abs(yP - yR) > 3) {
        const ax = X(0.9);
        ctx.strokeStyle = col; ctx.fillStyle = col; ctx.lineWidth = 1.8;
        ctx.beginPath(); ctx.moveTo(ax, yR); ctx.lineTo(ax, yP); ctx.stroke();
        const dirY = yP > yR ? 1 : -1;
        ctx.beginPath(); ctx.moveTo(ax, yP); ctx.lineTo(ax - 4, yP - 7 * dirY); ctx.lineTo(ax + 4, yP - 7 * dirY); ctx.closePath(); ctx.fill();
        ctx.textAlign = 'right'; ctx.font = '700 11.5px system-ui, sans-serif';
        ctx.fillText('ΔH = ' + (res.dh > 0 ? '+' : '−') .replace('−', res.dh < 0 ? '−' : '') + Math.abs(res.dh) + ' kJ', ax - 6, Math.min(yR, yP) - 8);
      } else if (res.dh == null) {
        ctx.textAlign = 'right'; ctx.font = '11px system-ui, sans-serif'; ctx.fillStyle = d ? '#9fb2c8' : '#6b7b8d';
        ctx.fillText('ΔH: not tabulated here (qualitative)', X(1) + 20, 210);
      }
      // Ea
      if (res.reacts !== false) {
        ctx.strokeStyle = d ? '#c9d3e0' : '#44505f'; ctx.lineWidth = 1.2; ctx.setLineDash([3, 3]);
        ctx.beginPath(); ctx.moveTo(X(0.5), yR); ctx.lineTo(X(0.5), yTS); ctx.stroke(); ctx.setLineDash([]);
        ctx.fillStyle = d ? '#c9d3e0' : '#44505f'; ctx.font = '11px system-ui, sans-serif'; ctx.textAlign = 'left';
        ctx.fillText('Eₐ (not to scale)', X(0.5) + 5, yTS + 14);
      }
      // marker
      const p = this.p == null ? 0 : this.p;
      const mx = X(p), my = f(p);
      ctx.fillStyle = '#ffffff'; ctx.strokeStyle = col; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(mx, my, 6, 0, 6.3); ctx.fill(); ctx.stroke();
      ctx.fillStyle = d ? '#9fb2c8' : '#6b7b8d'; ctx.font = '10.5px system-ui, sans-serif'; ctx.textAlign = 'center';
      ctx.fillText('Reaction progress →', (L + R) / 2, 212);
    }
  }

  function nameLines(name, max) {
    if (name.length <= max) return [name];
    const words = name.split(' ');
    let a = '', b = '';
    words.forEach((w) => { if (!b && (a + ' ' + w).trim().length <= max) a = (a + ' ' + w).trim(); else b = (b + ' ' + w).trim(); });
    if (!a) { a = name.slice(0, max - 1) + '…'; b = ''; }
    if (b.length > max) b = b.slice(0, max - 1) + '…';
    return b ? [a, b] : [a];
  }

  function wrapText(ctx, text, x, y, maxW, lh) {
    const words = text.split(' ');
    let line = '';
    words.forEach((w) => {
      const test = line + w + ' ';
      if (ctx.measureText(test).width > maxW && line) { ctx.fillText(line, x, y); line = w + ' '; y += lh; } else line = test;
    });
    ctx.fillText(line, x, y);
  }

  C.Sim = Sim;
})();
