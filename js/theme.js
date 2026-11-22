/* Lab Visuals: dark / light theme. Loaded in <head> on every page so the saved theme applies before the first paint.
   TH also gives the canvas drawings their colours, so the benches, spectra and charts follow the theme. */
(function () {
  'use strict';
  const KEY = 'lv-theme', root = document.documentElement;
  let saved = null;
  try { saved = localStorage.getItem(KEY); } catch (e) { /* private mode */ }
  if (saved === 'light') {
    root.dataset.theme = 'light';
    const m = document.querySelector('meta[name="theme-color"]'); if (m) m.setAttribute('content', '#f6f2fb');
  }
  const isLight = () => root.dataset.theme === 'light';
  const rgba = (c, a) => 'rgba(' + c + ',' + (+a).toFixed(3) + ')';

  const LIGHT = { '#ce72f5': '#8a2fc0', '#7cf0b4': '#0f8a4a', '#ffcb83': '#a35d00', '#7ab8ff': '#1f63c4', '#fea6d0': '#c2417f',
    '#ff8f6e': '#c94a1f', '#9565ff': '#5b2fd0', '#7bf583': '#15803d', '#ff7a9a': '#c0264f', '#f5c26b': '#a35d00', '#9fd0ff': '#1f63c4' };
  const TH = {
    get light() { return isLight(); },
    set(t) {
      if (t === 'light') root.dataset.theme = 'light'; else delete root.dataset.theme;
      try { localStorage.setItem(KEY, isLight() ? 'light' : 'dark'); } catch (e) { /* ignore */ }
      const m = document.querySelector('meta[name="theme-color"]');
      if (m) m.setAttribute('content', isLight() ? '#f6f2fb' : '#160923');
      window.dispatchEvent(new CustomEvent('lv-theme', { detail: isLight() ? 'light' : 'dark' }));
      window.dispatchEvent(new Event('resize'));   // charts redraw on resize
    },
    toggle() { TH.set(isLight() ? 'dark' : 'light'); },
    pick(dark, light) { return isLight() ? light : dark; },

    // canvas palette. Dark values are the original ones.
    bg(g, w, h) {   // bench / instrument background
      const b = g.createLinearGradient(0, 0, 0, h);
      if (isLight()) { b.addColorStop(0, '#fbfaff'); b.addColorStop(1, '#e7e3f0'); } else { b.addColorStop(0, '#22123b'); b.addColorStop(1, '#120a22'); }
      g.fillStyle = b; g.fillRect(0, 0, w, h);
    },
    line(a) { return isLight() ? rgba('52,42,84', Math.min(1, a * 1.1)) : rgba('255,255,255', a); },   // glass edges, outlines, scales
    tint(a) { return isLight() ? rgba('92,98,140', Math.min(1, a * 1.4)) : rgba('255,255,255', a); },  // faint fills (empty glass, panels)
    text(a) { return isLight() ? rgba('30,20,52', Math.min(1, a + 0.12)) : rgba('235,225,250', a); },  // labels
    grid(a) { return isLight() ? rgba('40,30,70', a * 1.3) : rgba('255,255,255', a); },
    hi(a) { return rgba('255,255,255', a); },   // reflections and highlights stay white in both themes
    get stand() { return isLight() ? '#8c879c' : '#35204f'; },   // retort stands, clamps, bases
    get metal() { return isLight() ? '#b7b0c6' : '#c9b8e6'; },
    get accent() { return isLight() ? '#8a2fc0' : '#ce72f5'; },
    get warm() { return isLight() ? '#a35d00' : '#ffcb83'; },
    get good() { return isLight() ? '#0f8a4a' : '#7cf0b4'; },
    col(c) {   // the pale accent colours used on the dark bench, darkened so they stay readable on white
      if (!isLight() || typeof c !== 'string') return c;
      return LIGHT[c.toLowerCase()] || c;
    },
  };
  window.TH = TH;
})();
