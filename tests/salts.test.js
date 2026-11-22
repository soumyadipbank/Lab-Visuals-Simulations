/* Run: node tests/salts.test.js : every radical must be identifiable from the reagent shelf, and generated samples must be valid */
const path = require('path');
require(path.join(__dirname, '../js/data.js'));
require(path.join(__dirname, '../js/labcalc.js'));
require(path.join(__dirname, '../js/salts.js'));
const S = globalThis.Chem.Salts, L = globalThis.Chem.Lab;
let problems = 0; const ok = (n, c) => { if (!c) { problems++; console.log('PROBLEM: ' + n); } };
const sig = (ion, group) => S.TESTS.filter((t) => t.g === group || t.g === 'Preliminary').map((t) => ((S.OBS[t.id] || {})[ion] || { t: '-' }).t).join('|');
const check = (list, group) => { const seen = {}; list.forEach(([id]) => { const s = sig(id, group); ok('ion ' + id + ' has at least one distinctive test', s.replace(/[-|]/g, '').length > 0); if (seen[s]) ok('ions ' + id + ' and ' + seen[s] + ' cannot be told apart', false); seen[s] = id; }); };
// anions are identified with anion and preliminary tests, cations with cation and preliminary tests
check(S.CATIONS, 'Cations'); check(S.ANIONS, 'Anions');
S.TESTS.forEach((t) => ok('NONE text for ' + t.id, !!S.NONE[t.id]));
for (let n = 1; n <= 4; n++) for (let i = 1; i <= 300; i++) {
  const s = S.generate(n, L.rng(n * 1000 + i)), want = { 1: 2, 2: 2, 3: 3, 4: 4 }[n];
  ok('size n=' + n, s.cats.length + s.ans.length === want);
  ok('compatible', s.cats.every((c) => s.ans.every((a) => S.compatible(c, a))));
  ok('unique', new Set(s.cats).size === s.cats.length && new Set(s.ans).size === s.ans.length);
  S.TESTS.forEach((t) => { const r = S.observe(s, t.id, L.rng(i)); ok('obs ' + t.id, r.items.length > 0 && r.items.every((x) => x.t)); });
  if (s.cats.includes('Na') && s.cats.includes('K')) ok('Na masks K flame', S.observe(s, 'flame').items.every((x) => !/lilac/.test(x.t)));
}
console.log(problems ? problems + ' problem(s)' : 'Salt analysis tests passed.');
process.exit(problems ? 1 : 0);
