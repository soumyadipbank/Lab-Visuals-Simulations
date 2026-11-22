/* Lab Visuals: BSc hub, the searchable syllabus map */
(function () {
  'use strict';
  const S = globalThis.Syllabus;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const st = { uni: 'all', status: 'all', area: 'all', q: '' };

  function stats() {
    const total = S.EXPERIMENTS.length, live = S.LIVE;
    const byU = (u) => S.EXPERIMENTS.filter((e) => e.unis.includes(u)).length;
    const liveByU = (u) => S.EXPERIMENTS.filter((e) => e.unis.includes(u) && e.status === 'live').length;
    document.getElementById('stats').innerHTML =
      '<div><b>' + total + '</b><span>experiment groups mapped</span></div>' +
      '<div><b>' + live + '</b><span>interactive now</span></div>' +
      S.SOURCES.map((s) => '<div><b>' + liveByU(s.id) + '/' + byU(s.id) + '</b><span>' + s.id + ' live</span></div>').join('');
  }

  function filters() {
    const chip = (key, val, label) => '<button type="button" class="chipbtn" data-k="' + key + '" data-v="' + esc(val) + '" aria-pressed="' + (st[key] === val) + '">' + esc(label) + '</button>';
    document.getElementById('filters').innerHTML =
      '<input type="search" id="q" placeholder="Search experiments: titration, kinetics, EDTA…" value="' + esc(st.q) + '" aria-label="Search experiments">' +
      '<div class="row"><b>University</b>' + chip('uni', 'all', 'All') + S.SOURCES.map((s) => chip('uni', s.id, s.id + ' · ' + s.name.replace('University of ', '').replace('West Bengal State University', 'West Bengal State'))).join('') + '</div>' +
      '<div class="row"><b>Status</b>' + chip('status', 'all', 'All') + chip('status', 'live', 'Live now') + chip('status', 'soon', 'Planned') + '</div>' +
      '<div class="row"><b>Area</b>' + chip('area', 'all', 'All') + S.AREAS.map((a) => chip('area', a, a)).join('') + '</div>';
  }

  function list() {
    const q = st.q.trim().toLowerCase();
    const items = S.EXPERIMENTS.filter((e) =>
      (st.uni === 'all' || e.unis.includes(st.uni)) && (st.status === 'all' || e.status === st.status) && (st.area === 'all' || e.area === st.area) &&
      (!q || (e.title + ' ' + e.note + ' ' + e.area).toLowerCase().includes(q)));
    let h = '';
    S.AREAS.forEach((a) => {
      const g = items.filter((e) => e.area === a);
      if (!g.length) return;
      const live = g.filter((e) => e.status === 'live').length;
      h += '<div class="syl-group"><h3>' + esc(a) + ' <small>' + live + ' live · ' + (g.length - live) + ' planned</small></h3>';
      g.forEach((e) => {
        const tags = e.unis.map((u) => '<span class="pill-tag uni">' + u + '</span>').join('') + '<span class="pill-tag ' + e.status + '">' + (e.status === 'live' ? 'Live' : 'Planned') + '</span>';
        const inner = '<div><div class="t">' + esc(e.title) + '</div>' + (e.note ? '<div class="n">' + esc(e.note) + '</div>' : '') + '</div><div class="tags">' + tags + '</div>';
        h += e.sim ? '<a class="syl-row live" href="' + esc(e.sim + (e.sim.includes('?') ? '&' : '?') + 'level=bsc') + '">' + inner + '</a>' : '<div class="syl-row">' + inner + '</div>';
      });
      h += '</div>';
    });
    document.getElementById('syl').innerHTML = h || '<p class="sub">Nothing matches. Try clearing a filter.</p>';
  }

  function sources() {
    document.getElementById('sources').innerHTML = S.SOURCES.map((s) => '<li><b>' + esc(s.id) + '</b> · ' + esc(s.name) + ': <a href="' + esc(s.url) + '" target="_blank" rel="noopener">' + esc(s.doc) + '</a></li>').join('');
  }

  function init() {
    stats(); filters(); list(); sources();
    document.getElementById('filters').addEventListener('click', (e) => {
      const b = e.target.closest('.chipbtn'); if (!b) return;
      st[b.dataset.k] = b.dataset.v; filters(); list();
      const q = document.getElementById('q'); if (q) q.value = st.q;
    });
    document.getElementById('filters').addEventListener('input', (e) => { if (e.target.id === 'q') { st.q = e.target.value; list(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
