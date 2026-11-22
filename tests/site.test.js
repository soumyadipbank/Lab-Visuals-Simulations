/* Run: node tests/site.test.js : every link to a simulator experiment must point to a page and experiment id that exist */
const fs = require('fs'), path = require('path'), root = path.join(__dirname, '..');
let problems = 0; const ok = (n, c) => { if (!c) { problems++; console.log('PROBLEM: ' + n); } };
const src = (f) => fs.readFileSync(path.join(root, f), 'utf8');
const SCRIPT = { 'titration.html': ['js/titrations.js'], 'kinetics.html': ['js/kinetics.js'], 'calorimetry.html': ['js/calorimetry.js'], 'colorimetry.html': ['js/colorimetry.js'], 'practicals.html': ['js/px-physical.js', 'js/px-inorganic.js', 'js/px-organic.js'] };
const re = /([a-z0-9-]+\.html)\?([^'"`\s)]*)/g;
for (const f of ['js/syllabus.js', 'js/levelpages.js', 'bsc.html']) {
  const t = src(f); let m;
  while ((m = re.exec(t))) {
    ok(f + ' links to missing page ' + m[1], fs.existsSync(path.join(root, m[1])));
    const e = /exp=([a-z0-9-]+)/.exec(m[2]);
    if (e && SCRIPT[m[1]]) ok(f + ': ' + m[1] + ' has no experiment ' + e[1], SCRIPT[m[1]].some((js) => src(js).includes("id: '" + e[1] + "'") || src(js).includes("'" + e[1] + "'")));
  }
}
for (const p of ['index.html', 'lab.html', 'school.html', 'bsc.html', 'titration.html', 'kinetics.html', 'practicals.html', 'calorimetry.html', 'colorimetry.html', 'salt-analysis.html']) {
  ok(p + ' exists', fs.existsSync(path.join(root, p)));
  const t = src(p); const s = [...t.matchAll(/<script src="([^"]+)"/g)].map((x) => x[1]);
  s.forEach((x) => ok(p + ' script ' + x, fs.existsSync(path.join(root, x))));
}
// no university names anywhere on the site
for (const p of fs.readdirSync(root).filter((x) => x.endsWith('.html')).concat(fs.readdirSync(path.join(root, 'js')).map((x) => 'js/' + x))) {
  const t = src(p);
  ok(p + ' mentions a university by name', !/Calcutta|Burdwan|West Bengal|WBSU|'CU'|'BU'|caluniv|wbsu/.test(t));
}
// guard against code accidentally hidden behind a // comment on the same line (this caused two real bugs)
for (const p of fs.readdirSync(path.join(root, 'js')).map((x) => 'js/' + x)) {
  src(p).split('\n').forEach((line, i) => {
    if (/https?:\/\//.test(line)) return;
    const m = line.match(/;\s*\/\/(.*)$/); if (!m) return;
    ok(p + ':' + (i + 1) + ' has code after a // comment', !/;\s*(g|ctx|return|S|st|const|let|if)\b|\)\s*;\s*\w+\s*\(/.test(m[1]));
  });
}
console.log(problems ? problems + ' problem(s)' : 'Site link tests passed.');
process.exit(problems ? 1 : 0);
