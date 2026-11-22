/* Lab Visuals: qualitative analysis UI */
(function () {
  'use strict';
  const C = globalThis.Chem, L = C.Lab, SA = C.Salts, $ = (id) => document.getElementById(id);
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  const level = (window.LevelInfo && LevelInfo.level) || 'bsc';
  const q = new URLSearchParams(location.search);
  const allowed = level === 'bsc' ? [1, 2, 3, 4] : [1, 2];
  const cv = $('bench'), g = cv.getContext('2d');
  const S = { n: 1, sample: null, log: [], cur: null, curT: 0, tt: 0, done: false };

  function newSample() {
    S.sample = SA.generate(S.n, Math.random); S.log = []; S.cur = null; S.done = false;
    $('result').innerHTML = ''; $('current').innerHTML = ''; $('tubeSub').textContent = 'Pick a test from the shelf.';
    document.querySelectorAll('#catChips input,#anChips input').forEach((i) => (i.checked = false));
    $('sampleInfo').textContent = SA.LEVELS[S.n].label + ': ' + (S.n === 1 ? 'contains one cation and one anion from the common school list.' : S.n === 2 ? 'contains one cation and one anion.' : S.n === 3 ? 'contains three radicals in total.' : 'contains two cations and two anions.');
    shelf(); notebook(); history.replaceState(null, '', '?level=' + level + '&n=' + S.n);
  }
  function shelf() {
    const tests = SA.TESTS; let h = '', grp = '';
    tests.forEach((t) => {
      if (t.g !== grp) { grp = t.g; h += '<p class="lbl" style="margin:10px 0 4px;font-size:.74rem;letter-spacing:.1em;color:var(--faint);text-transform:uppercase;font-weight:700">' + grp + '</p>'; }
      const used = S.log.some((x) => x.id === t.id);
      h += '<button type="button" class="exp-btn" data-t="' + t.id + '" aria-pressed="' + used + '" style="min-height:40px;padding:8px 12px;margin-bottom:6px;width:100%"><b style="font-size:.88rem">' + t.label + '</b></button>';
    });
    $('shelf').innerHTML = h;
  }
  function notebook() {
    $('nbCount').textContent = '(' + S.log.length + ' tests)';
    $('notebook').innerHTML = S.log.length ? S.log.map((x) => { const t = SA.TESTS.find((y) => y.id === x.id); return '<div class="o"><b>' + esc(t.label) + '</b><br>' + x.items.map((i) => esc(i.t)).join('<br>') + '</div>'; }).join('') : '<p class="sub" style="margin:0">Nothing yet.</p>';
  }
  function run(id) {
    const t = SA.TESTS.find((x) => x.id === id), r = SA.observe(S.sample, id, Math.random);
    S.cur = { id, tube: r.tube, items: r.items }; S.curT = 0;
    if (!S.log.some((x) => x.id === id)) S.log.push({ id, items: r.items });
    $('tubeSub').textContent = t.label; $('current').innerHTML = '<div class="callout"><b>How:</b> ' + esc(t.how) + '<br><b>Observation:</b> ' + r.items.map((i) => esc(i.t)).join(' ') + '</div>';
    shelf(); notebook();
  }

  function chips() {
    const mk = (arr, name) => arr.map((x) => '<label><input type="checkbox" name="' + name + '" value="' + x[0] + '"><span>' + x[1] + '</span></label>').join('');
    $('catChips').innerHTML = mk(SA.CATIONS, 'cat'); $('anChips').innerHTML = mk(SA.ANIONS, 'an');
    let r = '';
    SA.TESTS.forEach((t) => { const rows = Object.keys(SA.OBS[t.id]).map((ion) => '<tr><td>' + SA.sym[ion] + '</td><td style="text-align:left">' + esc(SA.OBS[t.id][ion].t) + '</td></tr>').join(''); r += '<h4 style="margin:12px 0 2px;font-size:.9rem">' + esc(t.label) + '</h4><table class="data-table"><tbody>' + rows + '</tbody></table>'; });
    $('ref').innerHTML = r;
  }
  function submit(show) {
    const cats = [...document.querySelectorAll('#catChips input:checked')].map((i) => i.value), ans = [...document.querySelectorAll('#anChips input:checked')].map((i) => i.value);
    const truth = S.sample.cats.concat(S.sample.ans), got = cats.concat(ans);
    const right = got.filter((x) => truth.includes(x)), wrong = got.filter((x) => !truth.includes(x)), missed = truth.filter((x) => !got.includes(x));
    const sym = (a) => a.map((x) => SA.sym[x] + ' (' + SA.name[x] + ')').join(', ') || 'none';
    let h = '';
    if (!show) { if (!got.length) { $('result').innerHTML = '<div class="callout warn">Tick at least one radical first.</div>'; return; }
      h += '<div class="callout ' + (!wrong.length && !missed.length ? 'ok' : 'bad') + '">' + (!wrong.length && !missed.length ? 'Correct. All radicals identified in ' + S.log.length + ' tests.' : right.length + ' of ' + truth.length + ' radicals correct.') + '</div>';
      if (right.length) h += '<div class="callout ok"><b>Correct:</b> ' + sym(right) + '</div>';
      if (wrong.length) h += '<div class="callout bad"><b>Not present:</b> ' + sym(wrong) + '. Re-read the tests that made you think so.</div>';
      if (missed.length) h += '<div class="callout warn"><b>' + missed.length + ' radical' + (missed.length > 1 ? 's' : '') + ' still missing.</b> Try tests you have not used yet' + (S.n >= 3 ? ' (the flame test through cobalt glass can reveal potassium hidden by sodium)' : '') + '.</div>';
    }
    if (show || (!wrong.length && !missed.length)) {
      S.done = true;
      h += '<div class="callout"><b>The sample contained:</b> ' + sym(truth) + '.</div>';
      h += '<div class="work-lines">' + truth.map((ion) => { const tests = SA.TESTS.filter((t) => (SA.OBS[t.id] || {})[ion]).map((t) => t.label); return SA.sym[ion] + ' is shown by: ' + tests.join('; '); }).join('<br>') + '</div>';
    }
    $('result').innerHTML = h;
  }

  function size() { const dpr = Math.min(window.devicePixelRatio || 1, 2), w = cv.clientWidth || 760, h = Math.round(w * 0.42); if (cv.width !== Math.round(w * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.height = h + 'px'; } return { w, h, dpr }; }
  function frame() {
    const { w, h, dpr } = size(); g.setTransform(dpr, 0, 0, dpr, 0, 0); S.tt += 0.016; S.curT = Math.min(1, S.curT + 0.016 / 1.2);
    TH.bg(g, w, h);
    const tb = S.cur ? S.cur.tube : {}, id = S.cur ? S.cur.id : '', flame = id === 'flame' || id === 'flameCo';
    const cx = w * 0.5, tw = Math.min(w * 0.14, 90), top = h * 0.12, bot = h * 0.88, t = S.curT;
    // base liquid colour
    let liq = '#cfe6f5'; if (tb.liq) liq = C.mix('#cfe6f5', tb.liq, t);
    const ph = 0.55, ly = bot - (bot - top) * ph;
    if (flame) {
      const fcol = tb.fume || '#6aa2ff'; g.fillStyle = TH.stand; g.fillRect(cx - 14, bot - 12, 28, 16);
      for (let i = 0; i < 3; i++) { const fh = (70 + i * 10) * (0.85 + 0.15 * Math.sin(S.tt * 12 + i * 2)); const gr = g.createRadialGradient(cx, bot - 12 - fh * 0.4, 4, cx, bot - 12 - fh * 0.4, fh * 0.9); gr.addColorStop(0, 'rgba(255,255,255,.85)'); gr.addColorStop(0.4, C.hex2rgb(fcol) && 'rgba(' + C.hex2rgb(fcol).join(',') + ',' + (0.35 + 0.5 * t) + ')'); gr.addColorStop(1, 'rgba(0,0,0,0)'); g.fillStyle = gr; g.beginPath(); g.ellipse(cx, bot - 12 - fh * 0.5, 16 + i * 6, fh * 0.55, 0, 0, 6.283); g.fill(); }
    } else {
      const path = () => { g.beginPath(); g.moveTo(cx - tw / 2, top); g.lineTo(cx - tw / 2, bot - tw / 2); g.arc(cx, bot - tw / 2, tw / 2, Math.PI, 0, true); g.lineTo(cx + tw / 2, top); };
      g.save(); path(); g.clip();
      g.fillStyle = 'rgba(' + C.hex2rgb(liq).join(',') + ',.9)'; g.fillRect(cx - tw, ly, tw * 2, h);
      if (tb.layer) { g.fillStyle = 'rgba(' + C.hex2rgb(tb.layer).join(',') + ',' + (0.9 * t) + ')'; g.fillRect(cx - tw, bot - (bot - top) * 0.25, tw * 2, h); }
      if (tb.ppt) { const a = t; g.fillStyle = 'rgba(' + C.hex2rgb(tb.ppt).join(',') + ',' + (0.55 * a) + ')'; g.fillRect(cx - tw, ly, tw * 2, h); g.fillStyle = 'rgba(' + C.hex2rgb(tb.ppt).join(',') + ',' + (0.95 * a) + ')'; g.fillRect(cx - tw, bot - (bot - top) * 0.2 * a - 4, tw * 2, h); }
      if (tb.ring) { g.fillStyle = 'rgba(' + C.hex2rgb(tb.ring).join(',') + ',' + (0.95 * t) + ')'; g.fillRect(cx - tw, ly + 14, tw * 2, 10); }
      g.restore(); g.strokeStyle = TH.line(.6); g.lineWidth = 2; path(); g.stroke(); g.lineWidth = 1;
      if (tb.gas) { for (let i = 0; i < 12; i++) { const p = (S.tt * 0.7 + i * 0.173) % 1, bx = cx + Math.sin(i * 5.1) * tw * 0.3, by = bot - 14 - p * (bot - ly - 20); g.fillStyle = 'rgba(255,255,255,' + (0.6 * (1 - p)) + ')'; g.beginPath(); g.arc(bx, by, 2 + (i % 3), 0, 6.283); g.fill(); } }
      if (tb.fume) { for (let i = 0; i < 6; i++) { const p = (S.tt * 0.3 + i * 0.17) % 1, fy = top - p * 60; g.fillStyle = 'rgba(' + C.hex2rgb(tb.fume).join(',') + ',' + (0.4 * (1 - p) * t) + ')'; g.beginPath(); g.arc(cx + Math.sin(i * 3 + S.tt) * 10, fy, 12 + p * 14, 0, 6.283); g.fill(); } }
    }
    g.fillStyle = TH.text(.8); g.font = Math.max(11, w * 0.017) + 'px Hanken Grotesk, sans-serif'; g.textAlign = 'left'; g.fillText(S.cur ? SA.TESTS.find((x) => x.id === id).label : 'Unknown sample ready', 12, h - 12);
    requestAnimationFrame(frame);
  }

  function init() {
    let n = parseInt(q.get('n'), 10); if (!allowed.includes(n)) n = level === 'bsc' ? 3 : 1; S.n = n;
    $('lvl').innerHTML = allowed.map((k) => '<option value="' + k + '"' + (k === n ? ' selected' : '') + '>' + SA.LEVELS[k].label + '</option>').join('');
    $('lvl').onchange = (e) => { S.n = +e.target.value; newSample(); };
    const LV = window.LevelInfo && LevelInfo.LV[level], lk = $('crumbLevel'); if (lk && LV) { lk.textContent = LV.name; lk.href = LV.page + '?level=' + level; }
    chips();
    $('shelf').addEventListener('click', (e) => { const b = e.target.closest('[data-t]'); if (b) { run(b.dataset.t); if (innerWidth < 900) $('work').scrollIntoView({ behavior: 'smooth' }); } });
    $('newSample').onclick = newSample; $('submit').onclick = () => submit(false); $('giveup').onclick = () => submit(true);
    newSample(); requestAnimationFrame(frame);
    if (window.Theory) Theory.mount('salt-analysis');
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', init); else init();
})();
