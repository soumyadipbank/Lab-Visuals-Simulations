/* Lab Visuals: numerical models behind the simulators (pure functions, unit-tested in tests/labcalc.test.js).
   All constants are textbook-approximate (25 C) and are labelled as such in the interface. */
(function () {
  'use strict';
  const C = (globalThis.Chem = globalThis.Chem || {});
  const L = (C.Lab = {});
  const KW = 1e-14, R = 8.314, F = 96485;

  // ------------------------------------------------------------ random numbers
  L.rng = function (seed) {
    let a = (seed >>> 0) || 1;
    return function () { a |= 0; a = (a + 0x6d2b79f5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
  };
  L.gauss = (rnd) => Math.sqrt(-2 * Math.log(rnd() || 1e-12)) * Math.cos(2 * Math.PI * rnd());
  L.between = (rnd, a, b, step) => { const v = a + rnd() * (b - a); return step ? Math.round(v / step) * step : v; };

  L.linreg = function (xs, ys) {
    const n = xs.length;
    if (n < 2) return null;
    const mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
    let sxx = 0, sxy = 0, syy = 0;
    for (let i = 0; i < n; i++) { sxx += (xs[i] - mx) ** 2; sxy += (xs[i] - mx) * (ys[i] - my); syy += (ys[i] - my) ** 2; }
    if (sxx === 0) return null;
    const m = sxy / sxx, b = my - m * mx;
    return { m, b, r2: syy === 0 ? 1 : (sxy * sxy) / (sxx * syy) };
  };

  // ------------------------------------------------------------ acid-base equilibria
  // fraction of each species of H_nA (index j = number of protons lost)
  L.alphas = function (pK, h) {
    const n = pK.length, K = pK.map((p) => Math.pow(10, -p));
    const t = []; let prod = 1;
    for (let j = 0; j <= n; j++) { if (j > 0) prod *= K[j - 1]; t.push(prod * Math.pow(h, n - j)); }
    const D = t.reduce((a, b) => a + b, 0);
    return t.map((x) => x / D);
  };
  // flask: {V0 mL, Na0 M, Cl0 M, fams:[{C M, pK:[..], lam:[..]}]} (concentrations in the flask solution of volume V0)
  // titrant: {kind:'base'|'acid', C M}.  Charge balance solved for pH by bisection.
  L.acidBase = function (flask, titrant, Vt) {
    const V = flask.V0 + Vt, f = flask.V0 / V;
    const Na = ((flask.Na0 || 0) * flask.V0 + (titrant.kind === 'base' ? titrant.C * Vt : 0)) / V;
    const Cl = ((flask.Cl0 || 0) * flask.V0 + (titrant.kind === 'acid' ? titrant.C * Vt : 0)) / V;
    const fams = flask.fams.map((x) => ({ C: x.C * f, pK: x.pK, lam: x.lam }));
    const g = (pH) => {
      const h = Math.pow(10, -pH);
      let neg = 0;
      for (const x of fams) { const a = L.alphas(x.pK, h); for (let j = 1; j < a.length; j++) neg += x.C * j * a[j]; }
      return h + Na - KW / h - Cl - neg;
    };
    let lo = -1, hi = 15;
    for (let i = 0; i < 60; i++) { const mid = (lo + hi) / 2; if (g(mid) > 0) lo = mid; else hi = mid; }
    const pH = (lo + hi) / 2, h = Math.pow(10, -pH);
    // conductivity in mS/cm (c in mol/L times lambda in S cm2/mol)
    let kappa = h * 349.8 + (KW / h) * 198.6 + Na * 50.1 + Cl * 76.3;
    for (const x of fams) { const a = L.alphas(x.pK, h); for (let j = 1; j < a.length; j++) kappa += x.C * a[j] * (x.lam ? x.lam[j] : 0); }
    return { pH, h, kappa, Na, Cl, V };
  };
  L.FAM = {
    acetic: { pK: [4.76], lam: [0, 40.9] },
    oxalic: { pK: [1.25, 4.27], lam: [0, 40.2, 148.4] },
    carbonate: { pK: [6.35, 10.33], lam: [0, 44.5, 138.6] },
  };

  // ------------------------------------------------------------ potentiometry
  const E_SCE = 0.244;
  // Fe(II) titrated with K2Cr2O7; returns the measured cell potential against a saturated calomel electrode
  L.potMohr = function (Vt, V0, CFe, CCr) {
    const E1 = 0.771, E2 = 1.25;                           // Fe3+/Fe2+ and effective Cr2O7(2-)/Cr3+ couples
    const Veq = (CFe * V0) / (6 * CCr);
    let E;
    if (Vt <= 1e-9) E = E1 + 0.0592 * Math.log10(1e-4 / 1);
    else if (Vt < Veq) { const f = Math.min(1 - 1e-9, (6 * CCr * Vt) / (CFe * V0)); E = E1 + 0.0592 * Math.log10(f / (1 - f)); }
    else if (Math.abs(Vt - Veq) < 1e-9) E = (E1 + 6 * E2) / 7;
    else { const V = V0 + Vt; E = E2 + (0.0592 / 6) * Math.log10(((Vt - Veq) * V) / (4 * CCr * Veq * Veq)); }
    return { E: E - E_SCE, Veq, Ehalf: E1 - E_SCE };
  };
  L.KSP_AGCL = 1.8e-10;
  // AgNO3 titrated with KCl, silver electrode vs SCE
  L.potAgCl = function (Vt, V0, CAg, CCl, ksp) {
    ksp = ksp || L.KSP_AGCL;
    const V = V0 + Vt, d = (CAg * V0 - CCl * Vt) / V;       // [Ag+] - [Cl-]
    const ag = (d + Math.sqrt(d * d + 4 * ksp)) / 2;
    return { E: 0.799 + 0.0592 * Math.log10(ag) - E_SCE, ag, Veq: (CAg * V0) / CCl };
  };

  // ------------------------------------------------------------ kinetics
  const T0 = 298.15;
  L.arrhenius = (k25, Ea, TC) => k25 * Math.exp((-Ea / R) * (1 / (TC + 273.15) - 1 / T0));
  // H2O2 + 2I- + 2H+ -> I2 + 2H2O (rate = k [H2O2][I-]); clock with thiosulfate: t = [S2O3]/(2 rate)
  L.CLOCK = { k25: 0.0115, Ea: 56000 };
  L.clock = function (cPerox, cKI, cThio, TC) {
    const k = L.arrhenius(L.CLOCK.k25, L.CLOCK.Ea, TC);
    const rate = k * cPerox * cKI;                         // initial rate of I2 formation, M/s
    return { k, rate, t: cThio / (2 * rate) };
  };
  // methyl acetate + H2O -> acetic acid + methanol, catalysed by H+ (first order in ester)
  L.ESTER = { kH25: 1.1e-4, Ea: 68000 };
  L.esterK = (cH, TC) => L.arrhenius(L.ESTER.kH25, L.ESTER.Ea, TC) * cH;     // s^-1
  // H2O2 decomposition catalysed by I- or Fe3+ (first order); k per M of catalyst at 25 C in min^-1
  L.H2O2 = { KI: { k25: 2.0, Ea: 50000 }, FeCl3: { k25: 0.4, Ea: 45000 } };
  L.h2o2K = (cat, cCat, TC) => L.arrhenius(L.H2O2[cat].k25, L.H2O2[cat].Ea, TC) * cCat; // min^-1
  // ethyl acetate + NaOH, second order, k = 0.11 M^-1 s^-1 at 25 C
  L.SAPON = { k25: 0.11, Ea: 47000, lamNa: 50.1, lamOH: 198.6, lamOAc: 40.9 };
  L.saponK = (TC) => L.arrhenius(L.SAPON.k25, L.SAPON.Ea, TC);
  L.saponKappa = function (a, k, tSec) {                   // equimolar a (M) after mixing
    const x = (a * a * k * tSec) / (1 + a * k * tSec);     // mol/L reacted
    return (a - x) * (L.SAPON.lamNa + L.SAPON.lamOH) + x * (L.SAPON.lamNa + L.SAPON.lamOAc);
  };

  // ------------------------------------------------------------ colorimetry
  // normalised absorption bands; eps = epsMax * shape(lambda)
  const gauss = (x, m, s) => Math.exp(-(((x - m) / s) ** 2));
  L.SPECIES = {
    KMnO4: { name: 'KMnO₄', color: '#9b1fa8', eps: 2420, shape: (x) => gauss(x, 525, 14) + gauss(x, 546, 12) * 0.85 + gauss(x, 507, 13) * 0.45 + gauss(x, 310, 40) * 0.12 },
    K2Cr2O7: { name: 'K₂Cr₂O₇', color: '#f28c28', eps: 3150, shape: (x) => gauss(x, 350, 38) + gauss(x, 257, 25) * 1.25 + gauss(x, 440, 45) * 0.12 },
  };
  const peak = {};
  L.lambdaMax = function (sp) {                              // wavelength of maximum absorbance in the visible/near-UV window 300-700 nm
    if (!peak[sp]) { let best = 300, bv = -1; for (let x = 300; x <= 700; x++) { const v = L.SPECIES[sp].shape(x); if (v > bv) { bv = v; best = x; } } peak[sp] = { l: best, v: bv }; }
    return peak[sp].l;
  };
  // molar absorptivity at wavelength x (epsMax is the value at the band maximum)
  L.epsAt = (sp, x) => { L.lambdaMax(sp); return (L.SPECIES[sp].eps * L.SPECIES[sp].shape(x)) / peak[sp].v; };
  // measured absorbance with a little stray light (non-linear at high A) and reading noise
  L.absorbance = function (sp, conc, lambda, rnd, stray) {
    const A = L.epsAt(sp, lambda) * conc * 1;              // 1 cm cell
    const s = stray == null ? 0.006 : stray;
    const meas = -Math.log10(Math.pow(10, -A) + s);
    return Math.max(0, meas + (rnd ? L.gauss(rnd) * 0.004 : 0));
  };

  // ------------------------------------------------------------ calorimetry
  // dT/dt = dTrise/dt - kLoss (T - Tamb); the reaction heat is released with a short time constant while stirring
  L.calorimeter = function (T0c, dT, tauMix, kLoss, tAmb, tMax, dt) {
    const out = [[0, T0c]];
    let T = T0c, t = 0;
    dt = dt || 1;
    while (t < tMax) {
      const rise = (dT / tauMix) * Math.exp(-t / tauMix);
      T += (rise - kLoss * (T - tAmb)) * dt; t += dt;
      out.push([t, T]);
    }
    return out;
  };
  L.dHfromCal = (mTotalG, c, W, dT, nMol) => -((mTotalG * c + W * c) * dT) / (nMol * 1000);   // kJ/mol (c in J/gK)
})();
