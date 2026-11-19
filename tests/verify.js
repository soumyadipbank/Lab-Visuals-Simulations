/* Run: node tests/verify.js
   1. every hand-written equation is balanced for atoms and charge
   2. every pair (and a sample of triples) of chemicals resolves without error
   3. every engine-built equation balanced, every ΔH finite */
const path = require('path');
require(path.join(__dirname, '../js/data.js'));
require(path.join(__dirname, '../js/engine.js'));
require(path.join(__dirname, '../js/curated.js'));
const C = globalThis.Chem;

let problems = 0;
const bad = (msg) => { problems++; console.log('PROBLEM:', msg); };

// 1. curated equations
const seen = new Set();
Object.entries(C.CUR).forEach(([key, r]) => {
  if (seen.has(r)) return;
  seen.add(r);
  ['mol', 'net'].forEach((k) => {
    const eq = r.equation[k];
    if (!eq) return;
    const b = C.checkEq(eq);
    if (b.length) bad(`curated ${key} ${k} unbalanced (${b.join(',')}): ${eq}`);
  });
});
console.log('curated reactions checked:', seen.size);

// 2 & 3. all pairs
const ids = Object.keys(C.CH).filter((i) => C.CH[i].group !== 'indicator');
let reacting = 0, none = 0, total = 0;
const stats = {};
for (let i = 0; i < ids.length; i++) for (let j = i + 1; j < ids.length; j++) {
  total++;
  let r;
  try { r = C.resolve([ids[i], ids[j]]); } catch (e) { bad(`${ids[i]}+${ids[j]} threw ${e.stack}`); continue; }
  if (r.reacts) {
    reacting++;
    stats[r.kind] = (stats[r.kind] || 0) + 1;
    if (!r.balanced) bad(`${ids[i]}+${ids[j]} could not balance: ${r.equation.mol}`);
    ['mol', 'net'].forEach((k) => {
      const eq = r.equation[k];
      if (!eq) return;
      const b = C.checkEq(eq);
      if (b.length) bad(`${ids[i]}+${ids[j]} ${k} unbalanced (${b.join(',')}): ${eq}`);
    });
    if (r.dh != null && !isFinite(r.dh)) bad(`${ids[i]}+${ids[j]} bad dh`);
    if (!r.obs || !r.obs.length) bad(`${ids[i]}+${ids[j]} no observations`);
    if (!r.why || !r.why.length) bad(`${ids[i]}+${ids[j]} no explanation`);
  } else none++;
}
console.log(`pairs: ${total}, reacting: ${reacting}, no reaction: ${none}`);
console.log('by kind:', stats);

// indicators and triples
const sample = [
  ['hcl', 'naoh', 'phph'], ['hcl', 'naoh', 'mo'], ['cuso4h', 'zn', 'agno3'], ['kmno4', 'h2so4', 'feso4'],
  ['na', 'h2o', 'phph'], ['hcl', 'mg', 'ui'], ['nacl', 'agno3', 'ki'], ['baoh2', 'h2so4', 'phph'],
  ['h2o2', 'h2so4', 'ki', 'starch'], ['cuso4h', 'nh3'], ['al', 'fe2o3', 'heat'], ['fe', 'h2o', 'o2'],
];
sample.forEach((s) => { const r = C.resolve(s); if (!r) bad('resolve returned nothing ' + s); });

// all triples must not throw
let triples = 0;
for (let i = 0; i < ids.length; i += 3) for (let j = i + 1; j < ids.length; j += 2) for (let k = j + 1; k < ids.length; k += 5) {
  triples++;
  try { C.resolve([ids[i], ids[j], ids[k]]); } catch (e) { bad(`triple ${ids[i]},${ids[j]},${ids[k]} threw ${e.stack}`); }
}
console.log('triples run:', triples);

// every chemical's formula is parseable
Object.values(C.CH).forEach((c) => {
  if (c.f && c.group !== 'indicator' && c.id !== 'starch' && c.id !== 'heat') {
    try { C.parseFormula(c.f); } catch (e) { bad('formula ' + c.id + ' ' + c.f); }
  }
});

if (process.argv[2] === '-v') {
  const show = (ids) => { const r = C.resolve(ids); console.log('\n==', ids.join(' + '), '\n', JSON.stringify({ eq: r.equation, net: r.equation && r.equation.net, dh: r.dh, dT: r.dT, types: r.types, obs: r.obs, reason: r.reason }, null, 1)); };
  process.argv.slice(3).forEach((a) => show(a.split(',')));
}
console.log(problems ? `\n${problems} problem(s)` : '\nAll checks passed.');
process.exit(problems ? 1 : 0);
