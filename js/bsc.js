/* Lab Visuals: Bachelors (BSc / BS) hub, the searchable map of practical experiments */
(function () {
  'use strict';
  const S = globalThis.Syllabus;
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const st = { area: 'all', q: '' };

  function stats() {
    document.getElementById('stats').innerHTML = '<div><b>' + S.EXPERIMENTS.length + '</b><span>total reactions</span></div>';
  }

  function filters() {
    const chip = (key, val, label) => '<button type="button" class="chipbtn" data-k="' + key + '" data-v="' + esc(val) + '" aria-pressed="' + (st[key] === val) + '">' + esc(label) + '</button>';
    document.getElementById('filters').innerHTML =
      '<input type="search" id="q" placeholder="Search experiments: titration, kinetics, EDTA…" value="' + esc(st.q) + '" aria-label="Search experiments">' +
      '<div class="row"><b>Area</b>' + chip('area', 'all', 'All') + S.AREAS.map((a) => chip('area', a, a)).join('') + '</div>';
  }

  function list() {
    const q = st.q.trim().toLowerCase();
    const items = S.EXPERIMENTS.filter((e) =>
      (st.area === 'all' || e.area === st.area) &&
      (!q || (e.title + ' ' + e.note + ' ' + e.area).toLowerCase().includes(q)));
    let h = '';
    S.AREAS.forEach((a) => {
      const g = items.filter((e) => e.area === a);
      if (!g.length) return;
      h += '<div class="syl-group"><h3>' + esc(a) + ' <small>' + g.length + ' experiment' + (g.length > 1 ? 's' : '') + '</small></h3>';
      g.forEach((e) => {
        const tags = '<span class="go-arrow" aria-hidden="true">→</span>';
        const inner = '<div><div class="t">' + esc(e.title) + '</div>' + (e.note ? '<div class="n">' + esc(e.note) + '</div>' : '') + '</div><div class="tags">' + tags + '</div>';
        h += e.sim ? '<a class="syl-row live" href="' + esc(e.sim + (e.sim.includes('?') ? '&' : '?') + 'level=bsc') + '">' + inner + '</a>' : '<div class="syl-row">' + inner + '</div>';
      });
      h += '</div>';
    });
    document.getElementById('syl').innerHTML = h || '<p class="sub">Nothing matches. Try clearing a filter.</p>';
  }

  function init() {
    stats(); filters(); list();
    document.getElementById('filters').addEventListener('click', (e) => {
      const b = e.target.closest('.chipbtn'); if (!b) return;
      st[b.dataset.k] = b.dataset.v; filters(); list();
      const q = document.getElementById('q'); if (q) q.value = st.q;
    });
    document.getElementById('filters').addEventListener('input', (e) => { if (e.target.id === 'q') { st.q = e.target.value; list(); } });
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
