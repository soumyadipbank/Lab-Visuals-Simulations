/* Lab Visuals: builds the practical bench page from the PX registry (measure-type and custom experiments). */
(function () {
  'use strict';
  const C = globalThis.Chem, L = C.Lab, $ = (id) => document.getElementById(id), esc = PX.esc;
  const q = new URLSearchParams(location.search);
  const cv = $('bench'), g = cv.getContext('2d');
  const S = { exp: null, sess: null, c: {}, rows: [], t: 0, anim: null, last: null };

  // ------------------------------------------------------------ shared helpers available to custom experiments
  const api = {
    S, $, esc,
    msg: (html, kind) => { $('msg').innerHTML = html ? '<div class="callout ' + (kind || '') + '">' + html + '</div>' : ''; },
    chart: (title, opts) => { if (!opts) { $('chartBox').hidden = true; return; } $('chartBox').hidden = false; $('chartTitle').textContent = title; Chart.draw($('chart'), opts); },
    table: (title, cols, rows) => {
      $('trialsBox').innerHTML = rows.length ? '<h4 class="lbl-sum" style="padding-top:14px">' + esc(title) + '</h4><div style="max-height:260px;overflow:auto"><table class="data-table"><thead><tr>' + cols.map((c) => '<th>' + c.label + '</th>').join('') + '</tr></thead><tbody>' +
        rows.map((r) => '<tr>' + cols.map((c) => { const v = typeof c.f === 'function' ? c.f(r) : r[c.k]; return '<td>' + (typeof v === 'number' ? v.toFixed(c.dp == null ? 2 : c.dp) : esc(v == null ? '' : v)) + '</td>'; }).join('') + '</tr>').join('') + '</tbody></table></div>' : '';
    },
    // answer form: report = [{id,label,unit,truth,dp,tol,abs}], work = lines shown by "Show working"
    answer: (report, work) => {
      if (!report) { $('answerBox').innerHTML = ''; return; }
      $('answerBox').innerHTML = '<h4 class="lbl-sum" style="padding-top:14px">Your result</h4><p class="sub" style="margin:0 0 6px">Work it out from your own readings, then check.</p><div class="answer-form">' +
        report.map((r, i) => '<div class="field"><label for="ans' + i + '">' + esc(r.label) + ' <output>' + esc(r.unit || '') + '</output></label><input type="' + (r.text ? 'text' : 'number') + '" step="any" id="ans' + i + '" inputmode="' + (r.text ? 'text' : 'decimal') + '" placeholder="your answer"></div>').join('') +
        '<button type="button" class="btn-sm primary" id="check">Check</button>' + (work ? '<button type="button" class="btn-sm" id="worked">Show working</button>' : '') + '</div><div id="verdict"></div><div id="workedOut"></div>';
      $('check').onclick = () => {
        $('verdict').innerHTML = report.map((r, i) => {
          const raw = $('ans' + i).value.trim();
          if (r.text) { const ok = r.accept(raw); return '<div class="callout ' + (ok ? 'ok' : 'bad') + '"><b>' + esc(r.label) + ':</b> ' + (ok ? 'correct.' : 'not quite. The answer is ' + esc(r.truthText) + '.') + '</div>'; }
          const v = parseFloat(raw); if (!isFinite(v)) return '<div class="callout warn">' + esc(r.label) + ': enter a number first.</div>';
          const err = r.abs ? Math.abs(v - r.truth) : (Math.abs(v - r.truth) / Math.abs(r.truth)) * 100, ok = r.abs ? err <= r.tol : err <= r.tol * 100;
          return '<div class="callout ' + (ok ? 'ok' : 'bad') + '"><b>' + esc(r.label) + ':</b> you gave ' + v + ', the true value in this model is ' + r.truth.toFixed(r.dp) + ' ' + esc(r.unit || '') + (r.abs ? '' : ' (error ' + err.toFixed(1) + ' %)') + '. ' + (ok ? 'Within the expected range.' : 'Outside the expected range: check the readings, the formula and the units, or use “Show working”.') + '</div>';
        }).join('');
      };
      if (work) $('worked').onclick = () => { const lines = typeof work === 'function' ? work() : work; $('workedOut').innerHTML = '<div class="work-lines">' + lines.map(esc).join('<br>') + '</div>'; };
    },
    readouts: (items) => { $('readouts').innerHTML = items.map(([k, v]) => '<div class="big-read"><span>' + k + '</span><b>' + v + '</b></div>').join(''); },
    custom: (html) => { $('custom').innerHTML = html || ''; },
    redraw: () => {},
  };
  PX.api = api;

  // ------------------------------------------------------------ measure-type experiments
  function controlsUI() {
    const e = S.exp; let h = '<div class="two-col">';
    (e.controls || []).forEach((k) => {
      if (k.type === 'select') h += '<div class="field"><label for="c_' + k.id + '">' + k.label + '</label><select id="c_' + k.id + '">' + k.opts.map((o) => '<option value="' + esc(o[0]) + '"' + (String(S.c[k.id]) === String(o[0]) ? ' selected' : '') + '>' + esc(o[1]) + '</option>').join('') + '</select></div>';
      else h += '<div class="field"><label for="c_' + k.id + '">' + k.label + ' <output id="o_' + k.id + '">' + fmtC(k, S.c[k.id]) + '</output></label><input type="range" id="c_' + k.id + '" min="' + k.min + '" max="' + k.max + '" step="' + k.step + '" value="' + S.c[k.id] + '"></div>';
    });
    $('params').innerHTML = h + '</div>';
  }
  const fmtC = (k, v) => (k.fmt ? k.fmt(v) : Number(v).toFixed(k.dp || 0) + (k.unit ? ' ' + k.unit : ''));
  function actionsUI() {
    const e = S.exp;
    $('actions').innerHTML = (e.buttons || [{ id: 'measure', label: e.measureLabel || 'Take a reading', primary: true }]).map((b) => '<button type="button" class="btn-sm' + (b.primary ? ' primary' : '') + '" data-act="' + b.id + '">' + b.label + '</button>').join('') +
      (e.analyse ? '<button type="button" class="btn-sm" data-act="analyse">' + (e.analyseLabel || 'Analyse my data') + '</button>' : '') + '<button type="button" class="btn-sm" data-act="clear">Clear data</button><button type="button" class="btn-sm" data-act="new">New sample</button>';
  }
  function tableUI() { api.table('Observation table', S.exp.cols, S.rows); }
  function doAct(id) {
    const e = S.exp;
    if (id === 'clear') { S.rows = []; S.last = null; tableUI(); api.msg(''); api.chart(); api.answer(null); return; }
    if (id === 'new') { pick(e.id); return; }
    if (id === 'analyse') {
      const a = e.analyse.call(e, S.rows, S.sess, S.c);
      if (a.err) { api.msg(esc(a.err), 'warn'); return; }
      api.msg(a.summary, 'ok');
      if (a.chart) api.chart(a.chart.title || 'Plot', a.chart);
      api.answer(e.report.call(e, S.sess, a), a.lines);
      return;
    }
    const fn = id === 'measure' ? e.measure : (e.buttons.find((b) => b.id === id) || {}).run;
    const out = fn.call(e, S.sess, S.c, S);
    if (out && out.row) { S.rows.push(out.row); if (e.sortRows) S.rows.sort(e.sortRows); S.last = out.row; tableUI(); }
    if (out && out.anim) S.anim = { t: 0, ...out.anim };
    api.msg(out && out.msg ? out.msg : '', out && out.kind);
    if (e.readouts) api.readouts(e.readouts.call(e, S.sess, S.c, S));
  }

  // ------------------------------------------------------------ page
  function pick(id) {
    const e = PX.byId[id] || PX.list[0]; S.exp = e; S.rows = []; S.last = null; S.anim = null;
    S.sess = e.begin ? e.begin(Math.random) : {};
    S.c = {}; (e.controls || []).forEach((k) => (S.c[k.id] = k.val));
    $('expTitle').textContent = e.title; $('expSub').textContent = e.short;
    $('steps').innerHTML = (typeof e.steps === 'function' ? e.steps(S.sess) : e.steps).map((s) => '<li>' + s + '</li>').join('');
    $('expList').querySelectorAll('.exp-btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === e.id)));
    api.msg(''); api.chart(); api.answer(null); api.custom(''); $('trialsBox').innerHTML = ''; $('readouts').innerHTML = ''; $('params').innerHTML = ''; $('actions').innerHTML = '';
    $('params').oninput = null; $('actions').onclick = null; S.g = S.p = S.ss = S.o = null;
    $('bench').parentElement.hidden = !!e.noCanvas;
    if (e.custom) e.custom(api, S);
    else { controlsUI(); actionsUI(); if (e.readouts) api.readouts(e.readouts.call(e, S.sess, S.c, S)); }
    if (window.Theory) Theory.mount(e.id);
    history.replaceState(null, '', '?level=bsc&exp=' + e.id);
  }

  function size() { const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth || 760, h = Math.round(w * (S.exp && S.exp.aspect || 0.5)); if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.height = h + 'px'; } return { w, h, dpr }; }
  let lastT = 0;
  function frame(now) {
    const dt = Math.min(0.05, lastT ? (now - lastT) / 1000 : 0.016); lastT = now; S.t += dt;
    if (S.anim) { S.anim.t += dt; if (S.anim.dur && S.anim.t > S.anim.dur) S.anim = null; }
    if (S.exp && !S.exp.noCanvas && S.exp.draw) {
      const { w, h, dpr } = size(); g.setTransform(dpr, 0, 0, dpr, 0, 0); PX.draw.bg(g, w, h);
      try { S.exp.draw(g, w, h, S.sess, S.c, S); } catch (err) { console.error(err); }
    }
    requestAnimationFrame(frame);
  }

  function init() {
    const list = PX.list;
    $('expCount').textContent = '(' + list.length + ')';
    $('expList').innerHTML = PX.AREAS.map((a) => '<p class="lbl" style="margin:12px 0 4px;font-size:.72rem;letter-spacing:.1em;color:var(--faint);text-transform:uppercase;font-weight:700">' + esc(a) + '</p>' +
      list.filter((e) => e.area === a).map((e) => '<button type="button" class="exp-btn" data-id="' + e.id + '" aria-pressed="false"><b>' + esc(e.title) + '</b><span>' + esc(e.short) + '</span></button>').join('')).join('');
    const lk = $('crumbLevel'); if (lk) { lk.textContent = 'Bachelors'; lk.href = 'bsc.html?level=bsc'; }
    if (innerWidth < 900) $('expDetails').open = false;
    $('expList').addEventListener('click', (ev) => { const b = ev.target.closest('.exp-btn'); if (b) { pick(b.dataset.id); if (innerWidth < 900) { $('expDetails').open = false; $('work').scrollIntoView({ behavior: 'smooth' }); } } });
    $('params').addEventListener('input', (ev) => {
      const id = ev.target.id.slice(2), k = (S.exp.controls || []).find((x) => x.id === id); if (!k) return;
      S.c[id] = k.type === 'select' ? ev.target.value : parseFloat(ev.target.value);
      const o = $('o_' + id); if (o) o.textContent = fmtC(k, S.c[id]);
      if (S.exp.onControl) S.exp.onControl(S.sess, S.c, S, id);
      if (S.exp.readouts) api.readouts(S.exp.readouts.call(S.exp, S.sess, S.c, S));
    });
    $('actions').addEventListener('click', (ev) => { const b = ev.target.closest('[data-act]'); if (b && !S.exp.custom) doAct(b.dataset.act); });
    addEventListener('resize', () => { if (S.exp && S.exp.onResize) S.exp.onResize(api, S); });
    pick(q.get('exp') || list[0].id);
    if (q.has('debug')) window.__px = S;
    requestAnimationFrame(frame);
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
