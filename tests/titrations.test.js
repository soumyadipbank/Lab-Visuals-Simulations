/* Run: node tests/titrations.test.js : every titration must be solvable to within a few percent from its own end point */
const path = require('path');
require(path.join(__dirname, '../js/data.js'));
require(path.join(__dirname, '../js/colour.js'));
require(path.join(__dirname, '../js/labcalc.js'));
require(path.join(__dirname, '../js/titrations.js'));
const C = globalThis.Chem, L = C.Lab, T = C.Titr;
let problems = 0;
const ok = (n, c) => { if (!c) { problems++; console.log('PROBLEM: ' + n); } };
ok('has 25 experiments', T.EXPS.length === 25);
for (const e of T.EXPS) {
  for (let seed = 1; seed <= 5; seed++) {
    const s = e.make(L.rng(seed * 77));
    const parts = s.parts || [s];
    const veq = s.parts ? s.parts.map((p) => p.veq) : [].concat(s.veq);
    parts.forEach((p, i) => { [0, p.veq * 0.5, p.veq * 0.98, p.veq * 1.02, p.vmax].forEach((v) => { const st = p.state(v, { starch: true, heated: true, formol: true }); ok(e.id + ' part ' + i + ' state', st && typeof st === 'object'); }); { const vv = [].concat(p.veq); ok(e.id + ' part ' + i + ' end point before vmax', p.vmax > Math.max(...vv) + 3 && Math.min(...vv) > 2); } });
    // the end-point colour must differ clearly from just before it (for indicator titrations)
    if (e.mode === 'indicator') parts.forEach((p, i) => { const ctx = { starch: true, heated: true, formol: true }, a = p.state(p.veq - 0.2, ctx).colour || '#cfe6f5', b = p.state(p.veq + 0.15, ctx).colour || '#cfe6f5'; const A = C.hex2rgb(a), B = C.hex2rgb(b); ok(e.id + ' part ' + i + ' visible end point (' + a + ' -> ' + b + ')', Math.hypot(A[0] - B[0], A[1] - B[1], A[2] - B[2]) > 20); });
    const m = {};
    if (e.mode === 'indicator') m.t = s.parts ? veq : veq[0];
    else if (e.mode === 'indicator2') { m.t1 = veq[0]; m.t2 = veq[1]; }
    else if (e.mode === 'conductometric') { m.v = veq[0]; m.v1 = veq[0]; m.v2 = veq[1]; }
    else { m.veq = veq[0]; m.eHalf = s.curve(veq[0] / 2); m.eEq = s.curve(veq[0]); }
    const r = s.solve(m);
    for (const rep of s.report) {
      const got = r.values[rep.id], tol = rep.tol || 0.02;
      const bad = rep.abs ? Math.abs(got - rep.truth) > tol : Math.abs(got - rep.truth) / Math.abs(rep.truth) > tol;
      if (bad) { problems++; console.log(`PROBLEM: ${e.id} seed ${seed} ${rep.id}: got ${got}, truth ${rep.truth}`); }
    }
    
  }
}
// fitBreaks recovers two breaks of a V-shaped conductometric curve
{
  const s = T.byId['conduct-mix'].make(L.rng(5)), xs = [], ys = [];
  for (let v = 0; v <= 44; v += 1) { xs.push(v); ys.push((s.curve(v) * (100 + v)) / 100); }   // dilution-corrected, as in the page
  const f = T.fitBreaks(xs, ys, 2), veq = s.veq;
  ok('fitBreaks', f && Math.abs(f.breaks[0] - veq[0]) / veq[0] < 0.03 && Math.abs(f.breaks[1] - veq[1]) / veq[1] < 0.03);
  if (f) console.log('conduct breaks', f.breaks.map((x) => x.toFixed(2)), 'true', veq.map((x) => x.toFixed(2)));
}
// potentiometric end point found from the largest |dE/dV| (the Ag electrode potential falls)
for (const id of ['potent-mohr', 'potent-agcl']) {
  const s = T.byId[id].make(L.rng(3)), pts = []; for (let v = 0.5; v <= s.vmax; v += 0.5) pts.push([v, s.curve(v)]);
  let best = -1, bi = -1; for (let i = 1; i < pts.length; i++) { const d = Math.abs((pts[i][1] - pts[i - 1][1]) / 0.5); if (d > best) { best = d; bi = i; } }
  const ve = (pts[bi][0] + pts[bi - 1][0]) / 2; ok(id + ' end point from |dE/dV| (' + ve + ' vs ' + s.veq.toFixed(2) + ')', Math.abs(ve - s.veq) <= 0.5 && best > 0.03);
}
console.log(problems ? problems + ' problem(s)' : 'Titration tests passed.');
process.exit(problems ? 1 : 0);
