/* Lab Visuals: landing hero animation (glowing orbit of atoms, rising bubbles, light rays) and page polish. */
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  // ---------------------------------------------------------- loader and reveal-on-scroll
  const loader = document.getElementById('loader');
  const t0 = performance.now();
  function hideLoader() {
    if (!loader) return;
    const wait = Math.max(0, (reduce ? 0 : 1300) - (performance.now() - t0));
    setTimeout(() => { loader.classList.add('done'); document.body.classList.add('ready'); setTimeout(() => loader.remove(), 900); }, wait);
  }
  if (document.readyState === 'complete') hideLoader(); else window.addEventListener('load', hideLoader);
  setTimeout(hideLoader, 4000);

  const io = 'IntersectionObserver' in window ? new IntersectionObserver((es) => {
    es.forEach((e) => { if (e.isIntersecting) { e.target.classList.add('in'); io.unobserve(e.target); } });
  }, { threshold: 0.12, rootMargin: '0px 0px -6% 0px' }) : null;
  document.querySelectorAll('.reveal').forEach((el, i) => {
    el.style.setProperty('--d', (i % 5) * 70 + 'ms');
    if (io) io.observe(el); else el.classList.add('in');
  });

  // ---------------------------------------------------------- hero canvas
  const cv = document.getElementById('heroCanvas');
  if (!cv) return;
  const ctx = cv.getContext('2d');
  const PAL = ['#9565ff', '#ce72f5', '#fea6d0', '#ffcb83', '#7bf583', '#7a7ceb'];
  const LABELS = ['H₂O', 'Ag⁺', 'Cl⁻', 'ΔH', 'CO₂', 'Cu²⁺', 'OH⁻', 'Na⁺', 'SO₄²⁻', 'pH', 'e⁻', 'Fe³⁺'];
  let W = 0, H = 0, dpr = 1, running = true, visible = true;
  const mouse = { x: 0, y: 0, tx: 0, ty: 0 };
  const rnd = (a, b) => a + Math.random() * (b - a);

  const LITE = Math.min(innerWidth, innerHeight) < 700 || (navigator.hardwareConcurrency || 8) <= 4;
  const rings = [0, 1, 2, 3].slice(0, LITE ? 3 : 4).map((i) => ({ rx: 0.9 + i * 0.42, ry: 0.34 + i * 0.13, tilt: -0.5 + i * 0.35, speed: (i % 2 ? -1 : 1) * (0.16 + i * 0.05), dots: 5 + i * 3 }));
  rings.forEach((r) => { r.items = Array.from({ length: r.dots }, (_, k) => ({ a: (k / r.dots) * 6.283 + rnd(0, 0.4), c: PAL[Math.floor(rnd(0, PAL.length))], s: rnd(2.2, 5.2) })); });
  const bubbles = Array.from({ length: LITE ? 22 : 46 }, () => ({ x: Math.random(), y: Math.random(), r: rnd(2, 9), v: rnd(0.012, 0.04), ph: rnd(0, 6.3), c: PAL[Math.floor(rnd(0, PAL.length))] }));
  const sparks = []; let pulse = 0; const pt = { x: -999, y: -999, in: false };
  const tags = LABELS.slice(0, LITE ? 6 : LABELS.length).map((t) => ({ t, x: Math.random(), y: Math.random(), v: rnd(0.004, 0.012), ph: rnd(0, 6.3), s: rnd(15, 28) }));

  function resize() {
    dpr = Math.min(window.devicePixelRatio || 1, LITE ? 1.5 : 2);
    const r = cv.getBoundingClientRect();
    W = r.width; H = r.height;
    cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr);
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  }
  let lt = false;   // light theme: normal blending and softer glows (additive light vanishes on a white page)
  function glow(x, y, r, color, a) {
    if (lt) a *= 0.5;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, hexA(color, a)); g.addColorStop(1, hexA(color, 0));
    ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2);
  }
  function hexA(h, a) { const n = parseInt(h.slice(1), 16); return 'rgba(' + (n >> 16) + ',' + ((n >> 8) & 255) + ',' + (n & 255) + ',' + a + ')'; }

  function frame(ms) {
    if (!running) return;
    const t = ms / 1000;
    lt = !!(window.TH && TH.light);
    mouse.x += (mouse.tx - mouse.x) * 0.05; mouse.y += (mouse.ty - mouse.y) * 0.05;
    ctx.clearRect(0, 0, W, H);
    ctx.globalCompositeOperation = 'source-over';
    const narrow = W < 800;
    const cx = (narrow ? W * 0.5 : W * 0.7) + mouse.x * 26, cy = (narrow ? H * 0.8 : H * 0.48) + mouse.y * 16;
    pulse *= 0.94;
    const R = Math.min(W, H) * (narrow ? 0.13 : 0.2) * (1 + 0.16 * pulse);

    ctx.globalCompositeOperation = lt ? 'source-over' : 'lighter';
    // drifting colour fields
    glow(W * (0.2 + 0.06 * Math.sin(t * 0.21)), H * (0.75 + 0.05 * Math.cos(t * 0.17)), Math.max(W, H) * 0.5, '#5d3b9b', 0.55);
    glow(cx + Math.sin(t * 0.3) * 40, cy + Math.cos(t * 0.26) * 30, Math.max(W, H) * 0.55, '#9565ff', 0.32);
    glow(W * 0.9, H * 0.1, Math.max(W, H) * 0.35, '#ce72f5', 0.18);
    glow(W * 0.45 + Math.sin(t * 0.2) * 60, H * 1.0, Math.max(W, H) * 0.35, '#fea6d0', 0.10);

    // light rays
    const NR = LITE ? 9 : 16;
    for (let i = 0; i < NR; i++) {
      const a = (i / NR) * 6.283 + t * 0.04, len = R * (3.2 + 1.2 * Math.sin(t * 0.7 + i * 1.7));
      const g = ctx.createLinearGradient(cx, cy, cx + Math.cos(a) * len, cy + Math.sin(a) * len);
      g.addColorStop(0, lt ? 'rgba(149,101,255,.2)' : 'rgba(246,232,255,.22)'); g.addColorStop(1, 'rgba(206,114,245,0)');
      ctx.strokeStyle = g; ctx.lineWidth = 1 + (i % 3);
      ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx + Math.cos(a) * len, cy + Math.sin(a) * len); ctx.stroke();
    }

    // central orb
    glow(cx, cy, R * 2.4, '#ce72f5', 0.5);
    glow(cx, cy, R * 1.3, '#fea6d0', 0.55);
    const og = ctx.createRadialGradient(cx - R * 0.25, cy - R * 0.3, R * 0.05, cx, cy, R);
    og.addColorStop(0, 'rgba(255,255,255,.95)'); og.addColorStop(0.35, 'rgba(246,200,255,.8)'); og.addColorStop(1, 'rgba(149,101,255,.0)');
    ctx.fillStyle = og; ctx.beginPath(); ctx.arc(cx, cy, R, 0, 6.283); ctx.fill();

    // orbits with glowing atoms
    rings.forEach((rg, ri) => {
      const rx = rg.rx * R * 1.55, ry = rg.ry * R * 1.55, tilt = rg.tilt + Math.sin(t * 0.1 + ri) * 0.06;
      ctx.save(); ctx.translate(cx, cy); ctx.rotate(tilt);
      ctx.strokeStyle = 'rgba(206,114,245,' + (0.26 - ri * 0.03) + ')'; ctx.lineWidth = 1;
      ctx.beginPath(); ctx.ellipse(0, 0, rx, ry, 0, 0, 6.283); ctx.stroke();
      rg.items.forEach((d) => {
        const a = d.a + t * rg.speed;
        const x = Math.cos(a) * rx, y = Math.sin(a) * ry;
        glow(x, y, d.s * 5, d.c, 0.5);
        ctx.fillStyle = d.c; ctx.beginPath(); ctx.arc(x, y, d.s, 0, 6.283); ctx.fill();
      });
      ctx.restore();
    });

    // rising bubbles
    ctx.globalCompositeOperation = 'source-over';
    bubbles.forEach((b) => {
      b.y -= b.v * 0.016; if (b.y < -0.05) { b.y = 1.05; b.x = Math.random(); }
      let x = b.x * W + Math.sin(t * 0.8 + b.ph) * 14, y = b.y * H;
      if (pt.in) {
        const dx = pt.x - x, dy = pt.y - y, dd = Math.hypot(dx, dy), k = dd < 200 ? 0.45 * (1 - dd / 200) : 0;
        b.ox = (b.ox || 0) + (dx * k - (b.ox || 0)) * 0.1; b.oy = (b.oy || 0) + (dy * k - (b.oy || 0)) * 0.1;
      } else { b.ox = (b.ox || 0) * 0.92; b.oy = (b.oy || 0) * 0.92; }
      x += b.ox || 0; y += b.oy || 0;
      ctx.strokeStyle = hexA(b.c, 0.5); ctx.fillStyle = hexA(b.c, 0.08); ctx.lineWidth = 1;
      ctx.beginPath(); ctx.arc(x, y, b.r, 0, 6.283); ctx.fill(); ctx.stroke();
    });
    // sparks from the cursor
    ctx.globalCompositeOperation = lt ? 'source-over' : 'lighter';
    for (let i = sparks.length - 1; i >= 0; i--) {
      const s = sparks[i];
      s.x += s.vx; s.y += s.vy; s.vx *= 0.96; s.vy *= 0.96; s.vy += 0.012; s.life -= 0.016;
      if (s.life <= 0) { sparks.splice(i, 1); continue; }
      glow(s.x, s.y, s.r * 6, s.c, 0.55 * s.life);
      ctx.fillStyle = hexA(s.c, s.life); ctx.beginPath(); ctx.arc(s.x, s.y, s.r * s.life + 0.5, 0, 6.283); ctx.fill();
    }
    ctx.globalCompositeOperation = 'source-over';
    // floating formulas
    ctx.font = 'italic 400 22px "Instrument Serif", Georgia, serif'; ctx.textAlign = 'center';
    tags.forEach((g) => {
      g.y -= g.v * 0.016; if (g.y < -0.05) { g.y = 1.05; g.x = Math.random(); }
      const a = 0.1 + 0.1 * Math.sin(t * 0.6 + g.ph);
      ctx.fillStyle = lt ? 'rgba(80,40,140,' + (a * 1.4) + ')' : 'rgba(246,232,255,' + a + ')'; ctx.font = 'italic 400 ' + g.s + 'px "Instrument Serif", Georgia, serif';
      ctx.fillText(g.t, g.x * W, g.y * H);
    });
    if (!reduce) requestAnimationFrame(frame);
  }

  function start() { running = true; requestAnimationFrame(frame); }
  resize();
  new ResizeObserver(() => { resize(); if (reduce) frame(1000); }).observe(cv.parentElement);
  function addSparks(n, burst) {
    for (let i = 0; i < n; i++) {
      const a = rnd(0, 6.283), sp = burst ? rnd(1.5, 6) : rnd(0.2, 1.2);
      sparks.push({ x: pt.x, y: pt.y, vx: Math.cos(a) * sp, vy: Math.sin(a) * sp - (burst ? 0 : 0.3), r: rnd(1.4, 3.6), life: rnd(0.7, 1.2), c: PAL[Math.floor(rnd(0, PAL.length))] });
    }
  }
  window.addEventListener('mousemove', (e) => {
    mouse.tx = e.clientX / window.innerWidth - 0.5; mouse.ty = e.clientY / window.innerHeight - 0.5;
    const r = cv.getBoundingClientRect();
    pt.x = e.clientX - r.left; pt.y = e.clientY - r.top; pt.in = pt.y >= 0 && pt.y <= r.height;
    if (pt.in && !reduce && Math.random() < 0.7) addSparks(1, false);
  }, { passive: true });
  cv.parentElement.addEventListener('pointerdown', (e) => {
    if (e.target.closest('a, button')) return;
    const r = cv.getBoundingClientRect();
    pt.x = e.clientX - r.left; pt.y = e.clientY - r.top;
    addSparks(34, true); pulse = 1;
  });
  if ('IntersectionObserver' in window) {
    new IntersectionObserver((es) => {
      const v = es[0].isIntersecting;
      if (v && !visible) { visible = true; if (!reduce) start(); }
      if (!v) { visible = false; running = false; }
    }).observe(cv.parentElement);
  }
  if (reduce) { running = true; frame(1500); } else start();   // reduced motion: one still frame
  window.addEventListener('lv-theme', () => { if (reduce) frame(1500); });
})();
