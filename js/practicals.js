/* Lab Visuals: the practical bench. A small framework for "set conditions -> take a reading -> analyse -> check" experiments.
   Experiment modules register themselves with PX.add({...}); js/practicals-init.js builds the page.
   A measure-type experiment defines: controls, begin(rnd) (hidden true values), measure(sess, c) -> row, cols, analyse(rows, sess),
   report(sess) and draw(g, w, h, sess, c, t). A custom experiment defines custom(api) and builds its own interface. */
(function () {
  'use strict';
  const C = globalThis.Chem, L = C.Lab;
  const PX = (globalThis.PX = { list: [], byId: {}, AREAS: [] });
  PX.add = (e) => { PX.list.push(e); PX.byId[e.id] = e; if (!PX.AREAS.includes(e.area)) PX.AREAS.push(e.area); };
  PX.esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  PX.noise = (sd) => L.gauss(Math.random) * sd;
  PX.round = (x, step) => Math.round(x / step) * step;
  PX.interp = (pts, x) => {                     // linear interpolation in a sorted [[x, y]] table
    if (x <= pts[0][0]) return pts[0][1];
    for (let i = 1; i < pts.length; i++) if (x <= pts[i][0]) { const a = pts[i - 1], b = pts[i]; return a[1] + ((x - a[0]) / (b[0] - a[0])) * (b[1] - a[1]); }
    return pts[pts.length - 1][1];
  };
  // two straight lines meeting at a break (used for CMC); returns {x, f1, f2}
  PX.twoLines = (xs, ys) => {
    let best = null;
    for (let c = 3; c <= xs.length - 3; c++) {
      const f1 = L.linreg(xs.slice(0, c), ys.slice(0, c)), f2 = L.linreg(xs.slice(c), ys.slice(c));
      if (!f1 || !f2) continue;
      let e = 0; for (let i = 0; i < xs.length; i++) { const f = i < c ? f1 : f2; e += (ys[i] - (f.m * xs[i] + f.b)) ** 2; }
      if (!best || e < best.e) best = { e, f1, f2 };
    }
    if (!best) return null;
    return { x: (best.f2.b - best.f1.b) / (best.f1.m - best.f2.m), f1: best.f1, f2: best.f2 };
  };

  // ------------------------------------------------------------ small drawing kit for the apparatus pictures
  const K = (PX.draw = {});
  // status text shown as a caption under the drawing (wraps on phones instead of overlapping the apparatus)
  K.caption = (txt) => { if (txt) PX._cap = (PX._cap ? PX._cap + ' · ' : '') + txt; };
  K.bg = (g, w, h) => { const b = g.createLinearGradient(0, 0, 0, h); b.addColorStop(0, '#22123b'); b.addColorStop(1, '#120a22'); g.fillStyle = b; g.fillRect(0, 0, w, h); };
  K.rgba = (hex, a) => { const r = C.hex2rgb(hex); return 'rgba(' + r[0] + ',' + r[1] + ',' + r[2] + ',' + a + ')'; };
  K.label = (g, w, txt, x, y, size, align) => { g.fillStyle = 'rgba(235,225,250,.85)'; g.font = (size || Math.max(10, w * 0.016)) + 'px Hanken Grotesk, sans-serif'; g.textAlign = align || 'left'; g.fillText(txt, x, y); };
  K.display = (g, w, txt, x, y, ww) => {
    ww = ww || Math.min(w * 0.32, 210); g.fillStyle = '#0d0618'; g.strokeStyle = 'rgba(206,114,245,.7)';
    g.beginPath(); if (g.roundRect) g.roundRect(x, y, ww, 46, 10); else g.rect(x, y, ww, 46); g.fill(); g.stroke();
    g.fillStyle = '#7cf0b4'; g.font = '700 ' + Math.max(15, w * 0.026) + 'px ui-monospace, Menlo, monospace'; g.textAlign = 'center'; g.fillText(txt, x + ww / 2, y + 30);
  };
  K.beaker = (g, x, y, bw, bh, col, level) => {            // x,y = bottom-left
    g.save(); g.beginPath(); g.rect(x, y - bh, bw, bh); g.clip();
    g.fillStyle = K.rgba(col || '#cfe6f5', 0.88); g.fillRect(x, y - bh * (level == null ? 0.6 : level), bw, bh);
    g.restore(); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; g.beginPath(); g.moveTo(x - 4, y - bh); g.lineTo(x, y - bh + 4); g.lineTo(x, y); g.lineTo(x + bw, y); g.lineTo(x + bw, y - bh); g.stroke(); g.lineWidth = 1;
  };
  K.tube = (g, cx, top, bot, tw, col, level, opts) => {      // test tube
    opts = opts || {};
    const path = () => { g.beginPath(); g.moveTo(cx - tw / 2, top); g.lineTo(cx - tw / 2, bot - tw / 2); g.arc(cx, bot - tw / 2, tw / 2, Math.PI, 0, true); g.lineTo(cx + tw / 2, top); };
    g.save(); path(); g.clip(); const ly = bot - (bot - top) * (level == null ? 0.6 : level);
    g.fillStyle = K.rgba(col || '#cfe6f5', 0.9); g.fillRect(cx - tw, ly, tw * 2, bot);
    if (opts.turbid) { g.fillStyle = 'rgba(245,245,250,' + 0.75 * opts.turbid + ')'; g.fillRect(cx - tw, ly, tw * 2, bot); }
    if (opts.lower) { g.fillStyle = K.rgba(opts.lower, 0.9); g.fillRect(cx - tw, bot - (bot - top) * opts.lowerLevel, tw * 2, bot); }
    g.restore(); g.strokeStyle = 'rgba(255,255,255,.6)'; g.lineWidth = 2; path(); g.stroke(); g.lineWidth = 1;
  };
  K.thermo = (g, x, top, bot, T, tmin, tmax) => {
    g.fillStyle = 'rgba(255,255,255,.9)'; g.fillRect(x - 4, top, 8, bot - top);
    const f = Math.max(0.04, Math.min(1, (T - tmin) / (tmax - tmin))); g.fillStyle = '#e53935'; g.fillRect(x - 2, bot - (bot - top) * f, 4, (bot - top) * f);
    g.beginPath(); g.arc(x, bot + 4, 7, 0, 6.283); g.fill();
  };
  K.cell = (g, cx, top, bot) => {                          // conductivity cell dipping into a beaker
    g.fillStyle = '#c9b8e6'; g.fillRect(cx - 5, top, 10, bot - top - 20);
    g.fillStyle = '#9aa6b8'; g.fillRect(cx - 12, bot - 22, 24, 18); g.fillStyle = '#4b4f5a'; g.fillRect(cx - 9, bot - 20, 3, 14); g.fillRect(cx + 6, bot - 20, 3, 14);
  };
})();
