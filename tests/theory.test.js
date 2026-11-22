/* Run: node tests/theory.test.js : every experiment on every lab page must have its scientific explanation */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
globalThis.window = {};
['data.js', 'labcalc.js', 'titrations.js', 'salts.js', 'practicals.js', 'px-physical.js', 'px-inorganic.js', 'px-organic.js', 'theory.js'].forEach((f) => require(path.join(root, 'js', f)));
const DB = globalThis.Theory.DB;
let problems = 0; const ok = (n, c) => { if (!c) { problems++; console.log('PROBLEM: ' + n); } };
const ids = [];
globalThis.Chem.Titr.EXPS.forEach((e) => ids.push(e.id));
globalThis.PX.list.forEach((e) => ids.push(e.id));
for (const f of ['kinetics.js', 'calorimetry.js', 'colorimetry.js']) { const t = fs.readFileSync(path.join(root, 'js', f), 'utf8'); for (const m of t.matchAll(/\{\s*id: '([a-z0-9-]+)', level:/g)) ids.push(m[1]); }
ids.push('salt-analysis');
ids.forEach((id) => { ok('explanation for ' + id, !!DB[id]); if (DB[id]) ok(id + ' has a principle and reactions or reasons', DB[id].p && DB[id].p.length && ((DB[id].eq && DB[id].eq.length) || (DB[id].why && DB[id].why.length))); });
ok('no duplicate experiment ids', new Set(ids).size === ids.length);
// the bench experiments must be internally consistent
globalThis.PX.list.forEach((e) => { ok(e.id + ' has steps', (typeof e.steps === 'function' ? e.steps({}) : e.steps).length >= 2); ok(e.id + ' is measure-type or custom', !!(e.custom || (e.measure && e.cols))); });
console.log(ids.length + ' experiments checked');
console.log(problems ? problems + ' problem(s)' : 'Theory tests passed.');
process.exit(problems ? 1 : 0);
