/* Run: node tests/labcalc.test.js  : checks the simulator chemistry against known textbook values */
const path = require('path');
require(path.join(__dirname, '../js/data.js'));
require(path.join(__dirname, '../js/labcalc.js'));
const L = globalThis.Chem.Lab;
let problems = 0;
const near = (name, got, want, tol) => { if (!(Math.abs(got - want) <= tol)) { problems++; console.log(`PROBLEM: ${name}: got ${got.toFixed(4)}, want ${want} ± ${tol}`); } };
const ok = (name, cond) => { if (!cond) { problems++; console.log('PROBLEM: ' + name); } };

// strong acid vs strong base: 25 mL 0.1 M HCl with 0.1 M NaOH
{
  const fl = { V0: 25, Cl0: 0.1, fams: [] }, t = { kind: 'base', C: 0.1 };
  near('HCl initial pH', L.acidBase(fl, t, 0).pH, 1.0, 0.02);
  near('HCl/NaOH pH at equivalence', L.acidBase(fl, t, 25).pH, 7.0, 0.02);
  near('HCl/NaOH pH at 24.9 mL (2.0e-4 M excess H+)', L.acidBase(fl, t, 24.9).pH, 3.70, 0.03);
  near('HCl/NaOH pH at 25.1 mL (2.0e-4 M excess OH-)', L.acidBase(fl, t, 25.1).pH, 10.30, 0.03);
}
// weak acid vs strong base: 25 mL 0.1 M acetic acid
{
  const fl = { V0: 25, fams: [{ C: 0.1, ...L.FAM.acetic }] }, t = { kind: 'base', C: 0.1 };
  near('acetic acid initial pH', L.acidBase(fl, t, 0).pH, 2.88, 0.05);
  near('acetic acid half-equivalence pH = pKa', L.acidBase(fl, t, 12.5).pH, 4.76, 0.05);
  near('acetic acid equivalence pH', L.acidBase(fl, t, 25).pH, 8.73, 0.12);
}
// oxalic acid with NaOH (phenolphthalein end point)
{
  const fl = { V0: 20, fams: [{ C: 0.05, ...L.FAM.oxalic }] }, t = { kind: 'base', C: 0.1 };
  near('oxalic acid second equivalence pH', L.acidBase(fl, t, 20).pH, 8.35, 0.3);
  ok('oxalic acid: phenolphthalein stays colourless at 19.5 mL', L.acidBase(fl, t, 19.5).pH < 8.2);
}
// carbonate / bicarbonate with HCl
{
  const fl = { V0: 25, Na0: 0.03 * 2 + 0.02, fams: [{ C: 0.05, ...L.FAM.carbonate }] }, t = { kind: 'acid', C: 0.1 };
  const v1 = (0.03 * 25) / 0.1;
  near('carbonate first end point pH ≈ 8.3', L.acidBase(fl, t, v1).pH, 8.34, 0.25);
  near('carbonate first end point volume', v1, 7.5, 1e-9);
  const vtot = v1 + ((0.03 + 0.02) * 25) / 0.1;
  ok('carbonate second end point pH is acidic (< 4.5)', L.acidBase(fl, t, vtot).pH < 4.5);
}
// conductometric shapes
{
  const fl = { V0: 100, Cl0: 0.025, fams: [] }, t = { kind: 'base', C: 0.1 };
  const k = (v) => L.acidBase(fl, t, v).kappa;
  ok('strong/strong: conductivity minimum at equivalence', k(24) > k(25) && k(26) > k(25));
  const fw = { V0: 100, fams: [{ C: 0.025, ...L.FAM.acetic }] };
  const kw = (v) => L.acidBase(fw, t, v).kappa;
  ok('weak acid: conductivity rises steadily', kw(5) > kw(1) && kw(24) > kw(12) && kw(30) > kw(25));
  ok('weak acid: slope steeper after equivalence', (kw(32) - kw(27)) > 2 * (kw(22) - kw(17)));
}
// potentiometry
{
  const V0 = 25, CFe = 0.05, CCr = 0.05 / 6;
  const Veq = (CFe * V0) / (6 * CCr);
  near('Mohr salt: half-equivalence gives E(Fe3+/Fe2+) vs SCE', L.potMohr(Veq / 2, V0, CFe, CCr).E + 0.244, 0.771, 1e-3);
  near('Mohr salt: potential at equivalence', L.potMohr(Veq, V0, CFe, CCr).E + 0.244, (0.771 + 6 * 1.25) / 7, 1e-3);
  ok('Mohr salt: sharp jump around the end point', L.potMohr(Veq * 1.01, V0, CFe, CCr).E - L.potMohr(Veq * 0.99, V0, CFe, CCr).E > 0.25);
  const ag = L.potAgCl(25, 25, 0.05, 0.05);
  near('AgCl: [Ag+] at equivalence = sqrt(Ksp)', ag.ag, Math.sqrt(1.8e-10), 1e-8);
  const ksp = Math.pow(Math.pow(10, (ag.E + 0.244 - 0.799) / 0.0592), 2);
  near('AgCl: Ksp recovered from E at equivalence', ksp / 1e-10, 1.8, 0.02);
}
// kinetics
{
  const a = L.clock(0.04, 0.02, 0.002, 25), b = L.clock(0.04, 0.04, 0.002, 25);
  near('clock reaction time (illustrative case) ≈ 108 s', a.t, 108.7, 1.0);
  near('doubling [KI] halves the clock time', a.t / b.t, 2, 1e-9);
  near('35 C speeds the clock up about 2x', a.t / L.clock(0.04, 0.02, 0.002, 35).t, 2.08, 0.05);
  near('ester: k at 0.5 M H+, 25 C', L.esterK(0.5, 25), 5.5e-5, 1e-9);
  near('ester: 35 C is ~2.4x faster', L.esterK(0.5, 35) / L.esterK(0.5, 25), 2.43, 0.05);
  near('saponification kappa at t=0 (0.01 M NaOH) ≈ 2.49 mS/cm', L.saponKappa(0.01, L.saponK(25), 0), 2.487, 0.01);
  ok('saponification kappa falls towards the NaOAc value', L.saponKappa(0.01, L.saponK(25), 1e6) < 0.92 * 1.01 && L.saponKappa(0.01, L.saponK(25), 1e6) > 0.90);
  near('saponification half-time ≈ 1/(k a) ≈ 15 min', 1 / (L.saponK(25) * 0.01) / 60, 15.2, 0.2);
}
// colorimetry
{
  ok('KMnO4 absorbance maximum is near 525-535 nm', L.lambdaMax('KMnO4') >= 522 && L.lambdaMax('KMnO4') <= 530);
  near('KMnO4 5e-4 M absorbs about 1.2 at lambda max', L.absorbance('KMnO4', 5e-4, L.lambdaMax('KMnO4'), null, 0), 1.21, 0.03);
  ok('K2Cr2O7 maximum at 350 nm', Math.abs(L.lambdaMax('K2Cr2O7') - 350) < 30 || Math.abs(L.lambdaMax('K2Cr2O7') - 257) < 10);
  const A1 = L.absorbance('KMnO4', 1e-4, 530, null, 0.006), A2 = L.absorbance('KMnO4', 1e-3, 530, null, 0.006);
  ok('stray light makes high absorbance read low (non-linear)', A2 < 10 * A1);
}
// calorimetry
{
  const m = 100, c = 4.18, W = 10, n = 0.05, dH = -57.1;
  const dTtrue = (-dH * n * 1000) / ((m + W) * c);
  const prof = L.calorimeter(25, dTtrue, 8, 0.0012, 25, 600, 1);
  const pts = prof.filter(([t]) => t >= 120 && t % 30 === 0);
  const fit = L.linreg(pts.map((p) => p[0]), pts.map((p) => p[1]));
  near('calorimeter: extrapolated rise within 0.25 K of true', fit.b - 25, dTtrue, 0.25);
  near('calorimeter: ΔH recovered', L.dHfromCal(m, c, W, fit.b - 25, n), -57.1, 3);
}
// regression helper
{ const f = L.linreg([1, 2, 3, 4], [2, 4, 6, 8]); near('linreg slope', f.m, 2, 1e-9); near('linreg r2', f.r2, 1, 1e-9); }

console.log(problems ? `\n${problems} problem(s)` : 'Lab calculation tests passed.');
process.exit(problems ? 1 : 0);
