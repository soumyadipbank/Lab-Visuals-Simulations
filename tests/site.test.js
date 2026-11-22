/* Run: node tests/site.test.js : every link to a simulator experiment must point to a page and experiment id that exist */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
let problems = 0; const ok = (n, c) => { if (!c) { problems++; console.log('PROBLEM: ' + n); } };
const src = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const SCRIPT = { 'titration.html': 'js/titrations.js', 'kinetics.html': 'js/kinetics.js', 'calorimetry.html': 'js/calorimetry.js', 'colorimetry.html': 'js/colorimetry.js' };
const re = /([a-z0-9-]+\.html)\?([^'"`\s)]*)/g;
for (const f of ['js/syllabus.js', 'js/levelpages.js', 'bsc.html']) {
  const t = src(f); let m;
  while ((m = re.exec(t))) {
    ok(f + ' links to missing page ' + m[1], fs.existsSync(path.join(root, m[1])));
    const e = /exp=([a-z0-9-]+)/.exec(m[2]);
    if (e && SCRIPT[m[1]]) ok(f + ': ' + m[1] + ' has no experiment ' + e[1], src(SCRIPT[m[1]]).includes("id: '" + e[1] + "'") || src(SCRIPT[m[1]]).includes("'" + e[1] + "'"));
  }
}
for (const p of ['index.html', 'lab.html', 'class11.html', 'class12.html', 'bsc.html', 'titration.html', 'kinetics.html', 'calorimetry.html', 'colorimetry.html', 'salt-analysis.html']) {
  ok(p + ' exists', fs.existsSync(path.join(root, p)));
  const t = src(p); const s = [...t.matchAll(/<script src="([^"]+)"/g)].map((x) => x[1]);
  s.forEach((x) => ok(p + ' script ' + x, fs.existsSync(path.join(root, x))));
}
console.log(problems ? problems + ' problem(s)' : 'Site link tests passed.');
process.exit(problems ? 1 : 0);
