/* Lab Visuals: tiny scatter/line chart helper used by the simulators.
   Chart.draw(canvas, { series:[{pts:[[x,y]], color, line:bool, dots:bool, label}], xLabel, yLabel, xmin,xmax,ymin,ymax, vlines:[{x,label,color}], hlines:[{y,..}] }) */
(function () {
  'use strict';
  const nice = (lo, hi, n) => {
    const span = hi - lo || 1, raw = span / n, p = Math.pow(10, Math.floor(Math.log10(raw))), f = raw / p;
    const step = (f < 1.5 ? 1 : f < 3.5 ? 2 : f < 7.5 ? 5 : 10) * p, out = [];
    for (let v = Math.ceil(lo / step - 1e-9) * step; v <= hi + step * 1e-6; v += step) out.push(Math.abs(v) < step * 1e-9 ? 0 : v);
    return { ticks: out, step };
  };
  const fmt = (v, step) => { const d = step >= 1 ? 0 : Math.min(4, Math.ceil(-Math.log10(step))); return Math.abs(v) >= 10000 || (Math.abs(v) < 1e-3 && v !== 0) ? v.toExponential(0) : v.toFixed(d); };
  function size(cv) {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth || 400, h = cv.clientHeight || (cv.height / (cv.width / w)) || 220;
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); }
    return { w, h, dpr };
  }
  function draw(cv, o) {
    const { w, h, dpr } = size(cv), g = cv.getContext('2d');
    g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, w, h);
    const L = 50, R = 12, T = 10, B = 38, pw = w - L - R, ph = h - T - B;
    let xs = [], ys = [];
    (o.series || []).forEach((s) => s.pts.forEach((p) => { if (isFinite(p[0]) && isFinite(p[1])) { xs.push(p[0]); ys.push(p[1]); } }));
    let xmin = o.xmin != null ? o.xmin : 0, xmax = o.xmax != null ? o.xmax : Math.max(1, ...xs);
    let ymin = o.ymin != null ? o.ymin : (ys.length ? Math.min(...ys) : 0), ymax = o.ymax != null ? o.ymax : (ys.length ? Math.max(...ys) : 1);
    if (ymax - ymin < 1e-12) { ymax += 1; ymin -= 1; }
    if (o.ymin == null) { const pad = (ymax - ymin) * 0.06; ymin -= pad; }
    if (o.ymax == null) { const pad = (ymax - ymin) * 0.06; ymax += pad; }
    const X = (x) => L + ((x - xmin) / (xmax - xmin)) * pw, Y = (y) => T + ph - ((y - ymin) / (ymax - ymin)) * ph;
    g.font = '11px Hanken Grotesk, system-ui, sans-serif'; g.lineWidth = 1;
    const nx = nice(xmin, xmax, Math.max(3, Math.floor(pw / 70))), ny = nice(ymin, ymax, Math.max(3, Math.floor(ph / 40)));
    g.strokeStyle = 'rgba(255,255,255,.08)'; g.fillStyle = 'rgba(235,225,250,.7)'; g.textAlign = 'center';
    nx.ticks.forEach((v) => { g.beginPath(); g.moveTo(X(v), T); g.lineTo(X(v), T + ph); g.stroke(); g.fillText(fmt(v, nx.step), X(v), T + ph + 14); });
    g.textAlign = 'right';
    ny.ticks.forEach((v) => { g.beginPath(); g.moveTo(L, Y(v)); g.lineTo(L + pw, Y(v)); g.stroke(); g.fillText(fmt(v, ny.step), L - 6, Y(v) + 4); });
    g.strokeStyle = 'rgba(255,255,255,.35)'; g.strokeRect(L, T, pw, ph);
    g.save(); g.beginPath(); g.rect(L, T, pw, ph); g.clip();
    (o.vlines || []).forEach((v) => { g.strokeStyle = v.color || '#ffcb83'; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(X(v.x), T); g.lineTo(X(v.x), T + ph); g.stroke(); g.setLineDash([]); if (v.label) { g.fillStyle = v.color || '#ffcb83'; g.textAlign = 'left'; g.fillText(v.label, X(v.x) + 4, T + 12); } });
    (o.hlines || []).forEach((v) => { g.strokeStyle = v.color || '#ffcb83'; g.setLineDash([5, 4]); g.beginPath(); g.moveTo(L, Y(v.y)); g.lineTo(L + pw, Y(v.y)); g.stroke(); g.setLineDash([]); });
    (o.series || []).forEach((s) => {
      const c = s.color || '#ce72f5', pts = s.pts.filter((p) => isFinite(p[0]) && isFinite(p[1]));
      if (s.line && pts.length > 1) { g.strokeStyle = c; g.lineWidth = s.width || 2; g.beginPath(); pts.forEach((p, i) => (i ? g.lineTo(X(p[0]), Y(p[1])) : g.moveTo(X(p[0]), Y(p[1])))); g.stroke(); g.lineWidth = 1; }
      if (s.dots) { g.fillStyle = c; pts.forEach((p) => { g.beginPath(); g.arc(X(p[0]), Y(p[1]), s.r || 3.2, 0, 6.283); g.fill(); }); }
    });
    g.restore();
    g.fillStyle = 'rgba(235,225,250,.8)'; g.textAlign = 'center';
    if (o.xLabel) g.fillText(o.xLabel, L + pw / 2, h - 6);
    if (o.yLabel) { g.save(); g.translate(12, T + ph / 2); g.rotate(-Math.PI / 2); g.fillText(o.yLabel, 0, 0); g.restore(); }
    cv._map = { X, Y, xmin, xmax, ymin, ymax, L, T, pw, ph };
  }
  window.Chart = { draw };
})();
