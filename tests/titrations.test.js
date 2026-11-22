/* Run: node tests/titrations.test.js : every titration must be solvable to within a few percent from its own end point */
const path = require('path');
require(path.join(__dirname, '../js/data.js'));
require(path.join(__dirname, '../js/colour.js'));
require(path.join(__dirname, '../js/labcalc.js'));
require(path.join(__dirname, '../js/titrations.js'));
const C = globalThis.Chem, L = C.Lab, T = C.Titr;
let problems = 0;
const ok = (n, c) => { if (!c) { problems++; console.log('PROBLEM: ' + n); } };
ok('has 15 experiments', T.EXPS.length === 15);
for (const e of T.EXPS) {
  for (let seed = 1; seed <= 5; seed++) {
    const s = e.make(L.rng(seed * 77));
    const veq = [].concat(s.veq);
    const st = s.state(0, {}); ok(e.id + ' state(0)', st && typeof st === 'object');
    const m = {};
    if (e.mode === 'indicator') m.t = veq[0];
    else if (e.mode === 'indicator2') { m.t1 = veq[0]; m.t2 = veq[1]; }
    else if (e.mode === 'conductometric') { m.v = veq[0]; m.v1 = veq[0]; m.v2 = veq[1]; }
    else { m.veq = veq[0]; m.eHalf = s.curve(veq[0] / 2); m.eEq = s.curve(veq[0]); }
    const r = s.solve(m);
    for (const rep of s.report) {
      const got = r.values[rep.id], tol = rep.tol || 0.02;
      const bad = rep.abs ? Math.abs(got - rep.truth) > tol : Math.abs(got - rep.truth) / Math.abs(rep.truth) > tol;
      if (bad) { problems++; console.log(`PROBLEM: ${e.id} seed ${seed} ${rep.id}: got ${got}, truth ${rep.truth}`); }
    }
    ok(e.id + ' vmax beyond end point', s.vmax > Math.max(...veq) + 3);
  }
}
// fitBreaks recovers two breaks of a V-shaped conductometric curve
{
  const s = T.byId['conduct-mix'].make(L.rng(5)), xs = [], ys = [];
  for (let v = 0; v <= 44; v += 1) { xs.push(v); ys.push(s.curve(v)); }
  const f = T.fitBreaks(xs, ys, 2), veq = s.veq;
  ok('fitBreaks', f && Math.abs(f.breaks[0] - veq[0]) < 2 && Math.abs(f.breaks[1] - veq[1]) < 2);
  if (f) console.log('conduct breaks', f.breaks.map((x) => x.toFixed(2)), 'true', veq.map((x) => x.toFixed(2)));
}
console.log(problems ? problems + ' problem(s)' : 'Titration tests passed.');
process.exit(problems ? 1 : 0);
