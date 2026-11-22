/* Lab Visuals: shared page shell (header, footer, level memory). Include first on every page. */
(function () {
  'use strict';
  const LV = {
    school: { name: 'Grade 11 / 12', page: 'school.html' },
    bsc: { name: 'Bachelors', page: 'bsc.html' },
  };
  const RANK = { '11': 1, '12': 1, school: 1, bsc: 2 };
  const norm = (l) => (l === '11' || l === '12' ? 'school' : l);   // old links and saved choices
  const store = {
    get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } },
    set(k, v) { try { localStorage.setItem(k, v); } catch (e) { /* ignore */ } },
  };
  const q = new URLSearchParams(location.search);
  let level = norm(q.get('level'));
  if (!LV[level]) level = norm(store.get('lv-level'));
  if (!LV[level]) level = null;
  if (LV[norm(q.get('level'))]) store.set('lv-level', norm(q.get('level')));

  window.LevelInfo = {
    level, LV, RANK,
    set(l) { l = norm(l); if (LV[l]) store.set('lv-level', l); },
    // is a content item (min level) visible at the current level? No level chosen = show everything.
    allows(min) { return !level || RANK[level] >= RANK[min || 'school']; },
    withLevel(url) { return level ? url + (url.includes('?') ? '&' : '?') + 'level=' + level : url; },
  };

  const here = location.pathname.split('/').pop() || 'index.html';
  const NAV = [['index.html', 'Home'], ['school.html', 'Grade 11 / 12'], ['bsc.html', 'Bachelors'], ['lab.html', 'Reaction Lab']];
  const navHTML = NAV.map(([h, t]) => '<a href="' + h + '"' + (h === here ? ' aria-current="page" class="active"' : '') + '>' + t + '</a>').join('');
  const header = '<header class="top">' +
    '<a class="brand" href="index.html" aria-label="Lab Visuals home"><svg class="logo" viewBox="0 0 64 64" aria-hidden="true"><defs><linearGradient id="lg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#9565ff"/><stop offset=".6" stop-color="#ce72f5"/><stop offset="1" stop-color="#fea6d0"/></linearGradient></defs><rect width="64" height="64" rx="18" fill="url(#lg)"/><path d="M26 10h12v4h-3v14l12 20c2 4-1 8-5 8H22c-4 0-7-4-5-8l12-20V14h-3z" fill="#160923"/><path d="M23 42h22l4 7c1 2-.5 4-2.5 4h-25c-2 0-3.500-2-2.500-4z" fill="#ffcb83"/></svg><span>Lab Visuals</span></a>' +
    '<div class="top-right">' +
    (level ? '<a class="level-chip" href="index.html" title="Change level">' + LV[level].name + ' <span>change</span></a>' : '') +
    '<button type="button" class="theme-btn" id="themeBtn" aria-label="Switch to light mode" title="Light / dark mode">' +
    '<svg class="i-sun" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="4.5" fill="currentColor"/><g stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M12 2v2.5M12 19.5V22M2 12h2.5M19.5 12H22M4.9 4.9l1.8 1.8M17.3 17.3l1.8 1.8M4.9 19.1l1.8-1.8M17.3 6.7l1.8-1.8"/></g></svg>' +
    '<svg class="i-moon" viewBox="0 0 24 24" aria-hidden="true"><path d="M20 14.6A8.5 8.5 0 0 1 9.4 4a8.5 8.5 0 1 0 10.6 10.6z" fill="currentColor"/></svg></button>' +
    '<button type="button" class="menu-btn" id="menuBtn" aria-label="Menu" aria-expanded="false">☰</button>' +
    '<nav class="nav" id="mainNav" aria-label="Main">' + navHTML + '</nav></div></header>';

  const footer = '<footer class="foot">' +
    '<aside class="contact" aria-labelledby="contactH"><div><h4 id="contactH">Spotted an error or have a suggestion?</h4><p>Mistakes, missing experiments or ideas: I read every message.</p></div>' +
    '<a class="btn-glow" id="mailBtn" href="mailto:soumyadipbank1@gmail.com?subject=Lab%20Visuals%20feedback&amp;body=Hi%20Soumyadip%2C%0A%0A%28Describe%20the%20error%20or%20suggestion.%20If%20it%20is%20about%20an%20experiment%2C%20mention%20which%20page%20and%20what%20you%20did.%29%0A">✉ Write to me</a></aside>' +
    '<p class="credit">Made by <strong>Soumyadip</strong></p>' +
    '<p class="insta"><a id="instaLink" class="social" href="https://www.instagram.com/soumyadipbank/" target="_blank" rel="noopener" aria-label="Soumyadip on Instagram (@soumyadipbank)"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="4.2" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="17.4" cy="6.6" r="1.2" fill="currentColor"/></svg>@soumyadipbank</a><a class="social" href="https://www.linkedin.com/in/soumyadipbank/" target="_blank" rel="noopener" aria-label="Soumyadip on LinkedIn (soumyadipbank)"><svg viewBox="0 0 24 24" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="3" fill="none" stroke="currentColor" stroke-width="2"/><rect x="7" y="10" width="2.2" height="7" fill="currentColor"/><circle cx="8.1" cy="7.3" r="1.3" fill="currentColor"/><path d="M11.5 17v-7h2.1v1c.5-.8 1.4-1.2 2.4-1.2 1.8 0 2.8 1.1 2.8 3.2V17h-2.2v-3.7c0-1-.4-1.6-1.3-1.6s-1.6.6-1.6 1.7V17z" fill="currentColor"/></svg>soumyadipbank</a></p>' +
    '<p class="small"><a href="https://github.com/soumyadipbank/Lab-Visuals-Simulations">Source on GitHub</a> · MIT licence</p>' +
    '<p class="disclaimer"><b>Lab Visuals</b> is a teaching model, not a substitute for a real laboratory. Values are textbook-approximate and simulated measurements include random error on purpose. Never repeat hazardous experiments (alkali metals, thermite, concentrated acids, lead and chromium salts) without a teacher, a fume cupboard and eye protection.</p></footer>';

  const prog = '<div id="progress" aria-hidden="true"></div><div id="cursorGlow" aria-hidden="true"></div>';

  function mount() {
    const h = document.getElementById('siteHeader');
    if (h) h.outerHTML = header;
    const f = document.getElementById('siteFooter');
    if (f) f.outerHTML = footer;
    if (!document.getElementById('progress')) document.body.insertAdjacentHTML('afterbegin', prog);
    if (/Android|iPhone|iPad|iPod/i.test(navigator.userAgent)) document.querySelectorAll('.foot .social').forEach((l) => l.removeAttribute('target'));   // phones: instagram.com / linkedin.com links then open the apps
    const tb = document.getElementById('themeBtn');
    if (tb && window.TH) {
      const label = () => tb.setAttribute('aria-label', TH.light ? 'Switch to dark mode' : 'Switch to light mode');
      label(); tb.addEventListener('click', () => { TH.toggle(); label(); });
    }
    const btn = document.getElementById('menuBtn'), nav = document.getElementById('mainNav');
    if (btn && nav) {
      btn.addEventListener('click', () => { const o = nav.classList.toggle('open'); btn.setAttribute('aria-expanded', String(o)); });
      nav.addEventListener('click', (e) => { if (e.target.tagName === 'A') nav.classList.remove('open'); });
    }
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', mount); else mount();
})();
