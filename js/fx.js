/* Lab Visuals: page-level interaction polish (cursor glow, spotlight, tilt, magnetic buttons, progress, counters). */
(function () {
  'use strict';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
  const fine = matchMedia('(hover: hover) and (pointer: fine)').matches;
  const $ = (s) => document.querySelector(s);

  // ---------- scroll progress bar and header state
  const bar = $('#progress');
  function onScroll() {
    const h = document.documentElement;
    const max = h.scrollHeight - h.clientHeight || 1;
    if (bar) bar.style.transform = 'scaleX(' + Math.min(1, h.scrollTop / max) + ')';
    document.body.classList.toggle('scrolled', h.scrollTop > 40);
  }
  addEventListener('scroll', onScroll, { passive: true });
  onScroll();

  // ---------- soft light that follows the cursor
  const glow = $('#cursorGlow');
  if (glow && fine && !reduce) {
    let x = innerWidth / 2, y = innerHeight / 2, tx = x, ty = y;
    addEventListener('pointermove', (e) => { tx = e.clientX; ty = e.clientY; glow.classList.add('on'); }, { passive: true });
    document.addEventListener('pointerleave', () => glow.classList.remove('on'));
    (function loop() {
      x += (tx - x) * 0.14; y += (ty - y) * 0.14;
      glow.style.transform = 'translate3d(' + x + 'px,' + y + 'px,0)';
      requestAnimationFrame(loop);
    })();
  }

  // ---------- spotlight on cards that follows the pointer
  document.addEventListener('pointermove', (e) => {
    const el = e.target.closest && e.target.closest('.chem, .feat, .fact, .tray-item');
    if (!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', e.clientX - r.left + 'px');
    el.style.setProperty('--my', e.clientY - r.top + 'px');
  }, { passive: true });

  // ---------- 3D tilt on feature cards
  if (fine && !reduce) {
    document.querySelectorAll('.feat').forEach((el) => {
      el.addEventListener('pointerenter', () => el.classList.add('tilting'));
      el.addEventListener('pointermove', (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        el.style.transform = 'perspective(800px) rotateX(' + (-py * 9).toFixed(2) + 'deg) rotateY(' + (px * 11).toFixed(2) + 'deg) translateY(-5px)';
      });
      el.addEventListener('pointerleave', () => { el.style.transform = ''; setTimeout(() => el.classList.remove('tilting'), 250); });
    });

    // ---------- magnetic buttons
    const mag = '.btn-glow, .btn-ghost, .nav a.pill, .controls button.primary, .btn';
    document.addEventListener('pointermove', (e) => {
      document.querySelectorAll(mag).forEach((b) => {
        const r = b.getBoundingClientRect();
        const cx = r.left + r.width / 2, cy = r.top + r.height / 2;
        const dx = e.clientX - cx, dy = e.clientY - cy, d = Math.hypot(dx, dy);
        if (d < 90 + r.width / 2) b.style.transform = 'translate(' + (dx * 0.18).toFixed(1) + 'px,' + (dy * 0.28).toFixed(1) + 'px)';
        else if (b.style.transform) b.style.transform = '';
      });
    }, { passive: true });
  }

  // ---------- animated counters
  const counters = document.querySelectorAll('[data-count]');
  function run(el) {
    const end = +el.dataset.count, suf = el.dataset.suffix || '';
    if (reduce) { el.textContent = end + suf; return; }
    const t0 = performance.now(), dur = 1500;
    (function tick(now) {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      el.textContent = Math.round(end * e) + suf;
      if (k < 1) requestAnimationFrame(tick);
    })(t0);
  }
  if ('IntersectionObserver' in window) {
    const io = new IntersectionObserver((es) => es.forEach((e) => { if (e.isIntersecting) { run(e.target); io.unobserve(e.target); } }), { threshold: 0.6 });
    counters.forEach((c) => { c.textContent = '0' + (c.dataset.suffix || ''); io.observe(c); });
  } else counters.forEach(run);

  // ---------- header link highlights
  const links = { lab: document.querySelector('.nav a[href="#lab"]'), how: document.querySelector('.nav a[href="#how"]') };
  if ('IntersectionObserver' in window) {
    const sIO = new IntersectionObserver((es) => es.forEach((e) => {
      const l = links[e.target.id];
      if (l && !l.classList.contains('pill')) l.classList.toggle('active', e.isIntersecting);
    }), { threshold: 0.25 });
    ['lab', 'how'].forEach((id) => { const s = document.getElementById(id); if (s) sIO.observe(s); });
  }
})();
