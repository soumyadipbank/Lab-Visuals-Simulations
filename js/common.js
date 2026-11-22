/* Lab Visuals: shared page shell (header, footer, level memory). Include first on every page. */
(function () {
  'use strict';
  const LV = {
    '11': { name: 'Class 11', page: 'class11.html' },
    '12': { name: 'Class 12', page: 'class12.html' },
    bsc: { name: 'BSc / BS', page: 'bsc.html' },
  };
  const RANK = { '11': 1, '12': 2, bsc: 3 };
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };
  const q = new URLSearchParams(location.search);
  let level = q.get('level');
  if (!LV[level]) level = store.get('lv-level');
  if (!LV[level]) level = null;
  if (LV[q.get('level')]) store.set('lv-level', q.get('level'));

  window.LevelInfo = {
    level, LV, RANK,
    set(l) { if (LV[l]) store.set('lv-level', l); },
    // is a content item (min level) visible at the current level? No level chosen = show everything.
    allows(min) { return !level || RANK[level] >= RANK[min || '11']; },
    withLevel(url) { return level ? url + (url.includes('?') ? '&' : '?') + 'level=' + level : url; },
  };

  const here = location.pathname.split('/').pop() || 'index.html';
  const NAV = [['index.html', 'Home'], ['class11.html', 'Class 11'], ['class12.html', 'Class 12'], ['bsc.html', 'BSc / BS'], ['lab.html', 'Reaction Lab']];
  const navHTML = NAV.map(([h, t]) => '<a href="' + h + '"' + (h === here ? ' aria-current="page" class="active"' : '') + '>' + t + '</a>').join('');
  const header = '<header class="top">' +
    '<a class="brand" href="index.html" aria-label="Lab Visuals home"><svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9565ff"/><stop offset=".6" stop-color="#ce72f5"/><stop offset="1" stop-color="#fea6d0"/></linearGradient></defs><rect width="64" height="64" rx="18" fill="url(#lg)"/><path d="M26 10h12v4h-3v14l12 20c2 4-1 8-5 8H22c-4 0-7-4-5-8l12-20V14h-3z" fill="#160923"/><path d="M23 42h22l4 7c1 2-.5 4-2.5 4h-25c-2 0-3.500-2-2.500-4z" fill="#ffcb83"/></svg><span>Lab Visuals</span></a>' +
    '<div class="top-right">' +
    (level ? '<a class="level-chip" href="index.html" title="Change level">' + LV[level].name + ' <span>change</span></a>' : '') +
    '<button type="button" class="menu-btn" id="menuBtn" aria-label="Menu" aria-expanded="false">☰</button>' +
    '<nav class="nav" id="mainNav" aria-label="Main">' + navHTML + '</nav></div></header>';

  const footer = '<footer class="foot">' +
    '<aside class="contact" aria-labelledby="contactH"><div><h4 id="contactH">Spotted an error or have a suggestion?</h4><p>Chemistry mistakes, missing experiments, ideas for new features: I read every message.</p></div>' +
    '<a class="btn-glow" id="mailBtn" href="mailto:soumyadipbank1@gmail.com?subject=Lab%20Visuals%20feedback&amp;body=Hi%20Soumyadip%2C%0A%0A%28Describe%20the%20error%20or%20suggestion.%20If%20it%20is%20about%20an%20experiment%2C%20mention%20which%20page%20and%20what%20you%20did.%29%0A">✉ Write to me</a></aside>' +
    '<p class="credit">Made by <strong>Soumyadip</strong></p>' +
    '<p class="small"><a href="https://github.com/soumyadipbank/Lab-Visuals-Simulations">Source on GitHub</a> · MIT licence</p>' +
    '<p class="disclaimer"><b>Lab Visuals</b> is a teaching model, not a substitute for a real laboratory. Values are textbook-approximate and simulated measurements include random error on purpose. Never repeat hazardous experiments (alkali metals, thermite, concentrated acids, lead and chromium salts) without a teacher, a fume cupboard and eye protection.</p></footer>';

  const prog = '<div id="progress" aria-hidden="true"></div><div id="cursorGlow" aria-hidden="true"></div>';

  function mount() {
    const h = document.getElementById('siteHeader');
    if (h) h.outerHTML = header;
    const f = document.getElementById('siteFooter');
    if (f) f.outerHTML = footer;
    if (!document.getElementById('progress')) document.body.insertAdjacentHTML('afterbegin', prog);
    const btn = document.getElementById('menuBtn'), nav = document.getElementById('mainNav');
    if (btn && nav) {
      btn.addEventListener('click', () => { const o = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', String(o)); });
      nav.addEventListener('click', (e) => { if (e.target.tagName === 'A') nav.classList.remove('open'); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
