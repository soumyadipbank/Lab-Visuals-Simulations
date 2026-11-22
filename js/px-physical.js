/* Lab Visuals: physical chemistry practicals for the bench. Constants are textbook values near 25 C (approximate, labelled in the theory). */
(function () {
  'use strict';
  const C = globalThis.Chem, L = C.Lab, K = PX.draw, N = PX.noise, R = PX.round;
  const T0 = 298.15;

  // ================================================================ Ostwald's dilution law
  const KA_AC = 1.75e-5, LAM0_AC = 390.7, KW_COND = 2.0;   // S cm2/mol, water uS/cm
  PX.add({
    id: 'ostwald', area: 'Electrochemistry & conductance', title: 'Ka of acetic acid: Ostwald’s dilution law', short: 'Conductance of a weak acid at several dilutions',
    steps: ['Measure the conductivity of the distilled water first (it is subtracted from every reading).', 'Start with 0.100 M acetic acid. Measure κ, then halve the concentration (dilute 25 mL to 50 mL) and measure again. Go down to about 0.003 M.', 'Molar conductivity Λ = 1000 κ / c (κ in S cm⁻¹, c in mol L⁻¹). For a weak electrolyte Λ₀ cannot be found by extrapolating Λ to zero concentration, so it comes from Kohlrausch’s law: Λ₀(CH₃COOH) = Λ₀(HCl) + Λ₀(CH₃COONa) − Λ₀(NaCl) = 426.2 + 91.0 − 126.5 = 390.7 S cm² mol⁻¹ at 25 °C.', 'For each dilution α = Λ/Λ₀ and K_a = c α² / (1 − α) (Ostwald’s dilution law). K_a should be constant while α grows on dilution. The plot of 1/Λ against cΛ (slope 1/(K_a Λ₀²)) checks the law.'],
    controls: [{ id: 'c', label: 'Concentration', type: 'select', val: '0.1', opts: [['0', 'distilled water'], ['0.1', '0.1000 M'], ['0.05', '0.0500 M'], ['0.025', '0.0250 M'], ['0.0125', '0.0125 M'], ['0.00625', '0.00625 M'], ['0.003125', '0.003125 M']] }],
    begin: () => ({ Ka: KA_AC * (1 + N(0.02)), L0: LAM0_AC }),
    kappa: (s, c) => { if (!c) return KW_COND; const a = (-s.Ka + Math.sqrt(s.Ka * s.Ka + 4 * s.Ka * c)) / (2 * c); return a * c * s.L0 * 1000 + KW_COND; },  // uS/cm
    measure(s, c) { const conc = parseFloat(c.c), k = this.kappa(s, conc) * (1 + N(0.004)); return { row: { c: conc, k: Number(k.toFixed(conc ? 1 : 2)) }, anim: { dur: 1.2 } }; },
    cols: [{ k: 'c', label: 'c / mol L⁻¹', dp: 5 }, { k: 'k', label: 'κ / µS cm⁻¹', dp: 1 }],
    sortRows: (a, b) => b.c - a.c,
    analyse(rows, s) {
      const w = rows.find((r) => r.c === 0); if (!w) return { err: 'Measure the distilled water first, so that its conductivity can be subtracted.' };
      const d = rows.filter((r) => r.c > 0); if (d.length < 4) return { err: 'Measure at least 4 concentrations.' };
      const L0 = LAM0_AC, pts = d.map((r) => { const kap = (r.k - w.k) * 1e-6, lam = (1000 * kap) / r.c, a = lam / L0; return { c: r.c, lam, a, Ka: (r.c * a * a) / (1 - a), x: r.c * lam, y: 1 / lam }; });
      const Ka = pts.reduce((t, p) => t + p.Ka, 0) / pts.length, f = L.linreg(pts.map((p) => p.x), pts.map((p) => p.y)), xm = Math.max(...pts.map((p) => p.x)) * 1.1;
      return { summary: `Molar conductivities (water subtracted), Λ / S cm² mol⁻¹: ` + pts.map((p) => `${p.c} M → <b>${p.lam.toFixed(2)}</b>`).join(', ') + `. With Λ₀ = 390.7 S cm² mol⁻¹ (Kohlrausch) work out α and K<sub>a</sub> for each, and their mean. (Ostwald plot shown: slope ${f.m.toExponential(3)}, intercept ${f.b.toExponential(3)}.)`, meas: { Ka },
        chart: { title: 'Ostwald plot: 1/Λ against cΛ (slope = 1/(K_a Λ₀²))', series: [{ pts: [[0, f.b], [xm, f.m * xm + f.b]], color: '#7cf0b4', line: true }, { pts: pts.map((p) => [p.x, p.y]), color: '#ce72f5', dots: true }], xmin: 0, xmax: xm, ymin: 0, xLabel: 'cΛ / S cm² L⁻¹', yLabel: '1/Λ / mol S⁻¹ cm⁻²' },
        lines: [`κ(water) = ${w.k} µS/cm subtracted; Λ₀ = 390.7 S cm² mol⁻¹ (Kohlrausch)`].concat(pts.map((p) => `c = ${p.c} M: Λ = ${p.lam.toFixed(2)}, α = ${p.a.toFixed(4)}, K_a = c α²/(1 − α) = ${p.Ka.toExponential(3)}`), [`mean K_a = ${Ka.toExponential(3)}; from the slope of the Ostwald plot K_a = 1/(slope × Λ₀²) = ${(1 / (f.m * L0 * L0)).toExponential(3)}`, 'Extrapolating 1/Λ to cΛ = 0 to get Λ₀ is very sensitive to small errors, which is why Λ₀ of a weak electrolyte is taken from Kohlrausch’s law.']) };
    },
    report: (s) => [{ id: 'ka', label: 'K_a of acetic acid', unit: '× 10⁻⁵', truth: s.Ka / 1e-5, dp: 2, tol: 0.06 }],
    readouts: (s, c, S) => [['Cell', 'κ meter'], ['Last reading', S.last ? S.last.k + ' µS/cm' : '—']],
    draw(g, w, h, s, c, S) {
      const conc = parseFloat(c.c), k = this.kappa(s, conc);
      K.beaker(g, w * 0.4, h * 0.9, w * 0.2, h * 0.55, '#d9ecf5', 0.62); K.cell(g, w * 0.5, h * 0.18, h * 0.88);
      K.display(g, w, S.anim ? '…' : (S.last ? S.last.k.toFixed(1) : '0.0') + ' µS/cm', w - Math.min(w * 0.32, 210) - 12, 12);
      g.strokeStyle = 'rgba(206,114,245,.7)'; g.beginPath(); g.moveTo(w * 0.5, h * 0.18); g.lineTo(w - 120, 58); g.stroke();
      K.caption(conc ? conc + ' M acetic acid' : 'distilled water');
      // ions drawn more sparsely at high dilution but a larger fraction dissociated
      const a = conc ? (-s.Ka + Math.sqrt(s.Ka * s.Ka + 4 * s.Ka * conc)) / (2 * conc) : 0;

    },
  });

  // ================================================================ pK of an indicator (bromocresol green)
  const PK_BCG = 4.68;
  const bcg = { acid: { 444: 0.62, 515: 0.21, 617: 0.02 }, base: { 444: 0.12, 515: 0.21, 617: 1.05 } };   // absorbances at the total indicator concentration used
  PX.add({
    id: 'indicator-pk', area: 'Colorimetry', title: 'pK of bromocresol green (colorimetric)', short: 'Absorbance of the indicator in buffers of known pH',
    steps: ['Bromocresol green (HIn) is yellow; its anion In⁻ is blue. The same amount of indicator is added to each solution.', 'Measure the fully acid form (0.1 M HCl) and the fully basic form (0.01 M NaOH) first, then acetate buffers of known pH.', 'Use 617 nm, where only In⁻ absorbs strongly. At 515 nm (isosbestic point) the absorbance does not change with pH.', 'pK_a = pH + log[(A_In − A) / (A − A_HIn)]. Plotting log[(A − A_HIn)/(A_In − A)] against pH gives a line of slope 1 crossing zero at pH = pK_a.'],
    controls: [{ id: 'sol', label: 'Solution', type: 'select', val: '4.6', opts: [['acid', '0.1 M HCl (all HIn)'], ['base', '0.01 M NaOH (all In⁻)'], ['3.8', 'buffer pH 3.80'], ['4.2', 'buffer pH 4.20'], ['4.6', 'buffer pH 4.60'], ['5.0', 'buffer pH 5.00'], ['5.4', 'buffer pH 5.40'], ['5.8', 'buffer pH 5.80']] }, { id: 'lam', label: 'Wavelength', type: 'select', val: '617', opts: [['444', '444 nm (HIn peak)'], ['515', '515 nm (isosbestic)'], ['617', '617 nm (In⁻ peak)']] }],
    begin: () => ({ pK: PK_BCG + N(0.03) }),
    frac: (s, sol) => (sol === 'acid' ? 0 : sol === 'base' ? 1 : 1 / (1 + Math.pow(10, s.pK - parseFloat(sol)))),
    measure(s, c) { const f = this.frac(s, c.sol), l = c.lam, A = bcg.acid[l] * (1 - f) + bcg.base[l] * f + N(0.003); return { row: { sol: c.sol, lam: +l, A: Number(Math.max(0, A).toFixed(3)) } }; },
    cols: [{ label: 'Solution', f: (r) => (r.sol === 'acid' ? 'HCl (HIn)' : r.sol === 'base' ? 'NaOH (In⁻)' : 'pH ' + r.sol) }, { k: 'lam', label: 'λ / nm', dp: 0 }, { k: 'A', label: 'A', dp: 3 }],
    analyse(rows) {
      const at = rows.filter((r) => r.lam === 617), a = at.find((r) => r.sol === 'acid'), b = at.find((r) => r.sol === 'base');
      if (!a || !b) return { err: 'At 617 nm, measure the HCl and NaOH solutions too: they give A(HIn) and A(In⁻).' };
      const bu = at.filter((r) => r.sol !== 'acid' && r.sol !== 'base' && r.A > a.A + 0.02 && r.A < b.A - 0.02); if (bu.length < 3) return { err: 'Measure at least 3 buffers at 617 nm.' };
      const pts = bu.map((r) => [parseFloat(r.sol), Math.log10((r.A - a.A) / (b.A - r.A))]), f = L.linreg(pts.map((p) => p[0]), pts.map((p) => p[1])), pK = -f.b / f.m;
      return { summary: `Best straight line: <b>log([In⁻]/[HIn]) = ${f.m.toFixed(3)} pH ${f.b < 0 ? '−' : '+'} ${Math.abs(f.b).toFixed(3)}</b> (slope should be close to 1). The pK<sub>a</sub> is the pH where the line crosses zero.`, meas: { pK },
        chart: { title: 'log[In⁻]/[HIn] against pH', series: [{ pts: [[3.6, f.m * 3.6 + f.b], [6, f.m * 6 + f.b]], color: '#7cf0b4', line: true }, { pts, color: '#ce72f5', dots: true }], xmin: 3.6, xmax: 6, xLabel: 'pH', yLabel: 'log [In⁻]/[HIn]', hlines: [{ y: 0 }] },
        lines: [`A(HIn) = ${a.A.toFixed(3)}, A(In⁻) = ${b.A.toFixed(3)} at 617 nm`].concat(bu.map((r) => `pH ${r.sol}: [In⁻]/[HIn] = (A − A_HIn)/(A_In − A) = ${((r.A - a.A) / (b.A - r.A)).toFixed(3)} → pK = ${(parseFloat(r.sol) - Math.log10((r.A - a.A) / (b.A - r.A))).toFixed(2)}`), [`line: log ratio = ${f.m.toFixed(3)} pH ${f.b >= 0 ? '+' : '−'} ${Math.abs(f.b).toFixed(3)}; crosses zero at pH = ${pK.toFixed(2)} = pK_a`]) };
    },
    report: (s) => [{ id: 'pk', label: 'pK_a of bromocresol green', unit: '', truth: s.pK, dp: 2, abs: true, tol: 0.08 }],
    draw(g, w, h, s, c, S) {
      const f = this.frac(s, c.sol), col = C.absMix('#e6c72c', '#2f6fd6', f);
      K.tube(g, w * 0.5, h * 0.12, h * 0.9, Math.max(34, w * 0.07), col, 0.7);
      const wl = +c.lam, beam = wl === 444 ? '#5b7cff' : wl === 515 ? '#3fdc6a' : '#ff8a3a';
      g.fillStyle = K.rgba(beam, 0.8); g.fillRect(w * 0.15, h * 0.62, w * 0.3, 4); g.fillStyle = K.rgba(beam, 0.35); g.fillRect(w * 0.55, h * 0.62, w * 0.25, 4);
      K.display(g, w, 'A ' + (S.last ? S.last.A.toFixed(3) : '—'), w - Math.min(w * 0.32, 210) - 12, 12);
      K.caption((c.sol === 'acid' ? 'all HIn (yellow)' : c.sol === 'base' ? 'all In⁻ (blue)' : 'buffer pH ' + c.sol) + ' · ' + wl + ' nm');
    },
  });

  // ================================================================ pH of a buffer by colour matching
  const IND = { mr: { name: 'methyl red', pK: 5.0, a: '#e0303a', b: '#f2c230', range: '4.4–6.2' }, btb: { name: 'bromothymol blue', pK: 7.1, a: '#e6c72c', b: '#2a55c8', range: '6.0–7.6' }, pr: { name: 'phenol red', pK: 7.9, a: '#f0c12c', b: '#d0204a', range: '6.8–8.4' } };
  const indCol = (ind, pH) => C.absMix(IND[ind].a, IND[ind].b, 1 / (1 + Math.pow(10, IND[ind].pK - pH)));
  const STD = []; for (let p = 4.6; p <= 8.21; p += 0.2) STD.push(Number(p.toFixed(1)));
  PX.add({
    id: 'buffer-ph', area: 'Colorimetry', title: 'pH of an unknown buffer by colour matching', short: 'Compare with standard buffers and the right indicator',
    steps: ['Choose an indicator whose colour changes in the right pH region (look at the unknown first: if it is at one extreme colour, the indicator is unsuitable).', 'Put the same number of drops of indicator into the unknown and into standard buffers of known pH.', 'Compare tubes side by side against a white background. The unknown has the pH of the standard it matches (or lies between two neighbours).', 'Each indicator only works within about ±1 unit of its pK: methyl red 4.4–6.2, bromothymol blue 6.0–7.6, phenol red 6.8–8.4.'],
    controls: [{ id: 'ind', label: 'Indicator', type: 'select', val: 'btb', opts: Object.keys(IND).map((k) => [k, IND[k].name + ' (' + IND[k].range + ')']) }, { id: 'std', label: 'Standard buffer to compare', type: 'select', val: '7', opts: STD.map((p) => [String(p), 'pH ' + p.toFixed(1)]) }],
    begin: () => ({ pH: Number((5.0 + Math.random() * 2.9).toFixed(2)) }),
    measureLabel: 'Record this comparison',
    measure(s, c) { return { row: { ind: IND[c.ind].name, std: +c.std } , msg: 'Noted. Judge by eye: is the unknown (left) more like the acid colour, the base colour, or the same as the standard (right)?' }; },
    cols: [{ k: 'ind', label: 'Indicator' }, { k: 'std', label: 'Standard pH compared', dp: 1 }],
    analyse(rows, s) { if (rows.length < 2) return { err: 'Compare with at least two standards before you decide.' }; return { summary: 'Enter the pH you judge the unknown to have.', meas: {}, lines: ['The best estimate is the pH of the standard that matches, or halfway between two neighbours that bracket the unknown.', 'A visual match is usually good to about ±0.2 pH unit, and only near the middle of the indicator’s range.'] }; },
    analyseLabel: 'I have decided',
    report: (s) => [{ id: 'ph', label: 'pH of the unknown buffer', unit: '', truth: s.pH, dp: 2, abs: true, tol: 0.25 }],
    draw(g, w, h, s, c) {
      const tw = Math.max(40, w * 0.09);
      K.tube(g, w * 0.33, h * 0.1, h * 0.86, tw, indCol(c.ind, s.pH), 0.7); K.tube(g, w * 0.67, h * 0.1, h * 0.86, tw, indCol(c.ind, +c.std), 0.7);
      K.label(g, w, 'unknown', w * 0.33, h * 0.96, null, 'center'); K.label(g, w, 'standard pH ' + Number(c.std).toFixed(1), w * 0.67, h * 0.96, null, 'center');
      K.caption('Indicator: ' + IND[c.ind].name + '. Left: unknown buffer; right: standard pH ' + Number(c.std).toFixed(1) + '.');
    },
  });

  // ================================================================ viscosity (Ostwald viscometer)
  const LIQ = { water: { name: 'water', eta: 0.890, rho: 0.997, B: 1960 }, ethanol: { name: 'ethanol', eta: 1.074, rho: 0.785, B: 1690 }, methanol: { name: 'methanol', eta: 0.544, rho: 0.787, B: 1240 }, acetone: { name: 'acetone', eta: 0.306, rho: 0.785, B: 780 }, gly20: { name: '20 % glycerol (w/w)', eta: 1.54, rho: 1.045, B: 2150 }, gly40: { name: '40 % glycerol (w/w)', eta: 3.18, rho: 1.096, B: 2450 }, suc10: { name: '10 % sucrose (w/w)', eta: 1.17, rho: 1.036, B: 2050 } };
  const ETA_W = [[20, 1.002], [25, 0.890], [30, 0.797], [35, 0.719], [40, 0.653]];   // mPa s, water (literature)
  const etaAt = (l, T) => (l === 'water' ? PX.interp(ETA_W, T) : LIQ[l].eta * Math.exp(LIQ[l].B * (1 / (T + 273.15) - 1 / T0)));
  PX.add({
    id: 'viscosity', area: 'Physical properties & equilibria', title: 'Viscosity with an Ostwald viscometer', short: 'Relative viscosity from flow times', aspect: 0.55,
    steps: ['Clean, dry viscometer clamped vertically in a thermostat. Pipette in a fixed volume of liquid.', 'Suck the liquid above the upper mark, release, and time its fall from the upper mark to the lower mark.', 'Repeat with water at the same temperature. Take the mean of concordant times.', 'Poiseuille: for the same viscometer and volume, η₁/η₂ = ρ₁t₁ / ρ₂t₂. So η = η_water × (ρ t)/(ρ_water t_water). Densities (g mL⁻¹, 25 °C): water 0.997, ethanol 0.785, methanol 0.787, acetone 0.785, 20 % glycerol 1.045, 40 % glycerol 1.096, 10 % sucrose 1.036. η(water) / mPa s: 1.002 (20 °C), 0.890 (25 °C), 0.797 (30 °C), 0.719 (35 °C), 0.653 (40 °C). Densities change little over this range and are taken as constant.', 'Time each liquid at least twice and use the mean of concordant times.'],
    controls: [{ id: 'liq', label: 'Liquid', type: 'select', val: 'water', opts: Object.keys(LIQ).map((k) => [k, LIQ[k].name]) }, { id: 'T', label: 'Thermostat', min: 20, max: 40, step: 5, val: 25, unit: '°C' }],
    begin: () => { const keys = Object.keys(LIQ).filter((k) => k !== 'water'); return { target: keys[Math.floor(Math.random() * keys.length)], Kv: 100 / (0.890 / 0.997) }; },
    measureLabel: 'Time the flow',
    measure(s, c) { const t = (s.Kv * etaAt(c.liq, c.T)) / LIQ[c.liq].rho + N(0.15); return { row: { liq: c.liq, name: LIQ[c.liq].name, T: c.T, t: Number(t.toFixed(1)) }, anim: { dur: 2.5, kind: 'flow' }, msg: 'Flow time ' + t.toFixed(1) + ' s (' + LIQ[c.liq].name + ', ' + c.T + ' °C).' }; },
    cols: [{ k: 'name', label: 'Liquid' }, { k: 'T', label: 'T / °C', dp: 0 }, { k: 't', label: 'flow time / s', dp: 1 }],
    analyse(rows, s) {
      const tgt = rows.filter((r) => r.liq === s.target), T = tgt.length ? tgt[tgt.length - 1].T : null;
      if (tgt.length < 2) return { err: 'Time your assigned liquid (' + LIQ[s.target].name + ') at least twice at the same temperature.' };
      const tw = rows.filter((r) => r.liq === 'water' && r.T === T); if (!tw.length) return { err: 'Time water at the same temperature (' + T + ' °C) as well.' };
      const mt = tgt.filter((r) => r.T === T).reduce((a, r) => a + r.t, 0) / tgt.filter((r) => r.T === T).length, mw = tw.reduce((a, r) => a + r.t, 0) / tw.length;
      const ew = etaAt('water', T), eta = (ew * LIQ[s.target].rho * mt) / (LIQ.water.rho * mw);
      return { summary: `Mean flow times at ${T} °C: ${LIQ[s.target].name} <b>${mt.toFixed(1)} s</b>, water <b>${mw.toFixed(1)} s</b>. Now calculate η.`, meas: { eta, T }, lines: [`mean t(${LIQ[s.target].name}) = ${mt.toFixed(1)} s, mean t(water) = ${mw.toFixed(1)} s at ${T} °C`, `η(water, ${T} °C) = ${ew.toFixed(3)} mPa s`, `η = ${ew.toFixed(3)} × (${LIQ[s.target].rho} × ${mt.toFixed(1)}) / (${LIQ.water.rho} × ${mw.toFixed(1)}) = ${eta.toFixed(3)} mPa s`] };
    },
    report: (s, a) => [{ id: 'eta', label: 'Viscosity of ' + LIQ[s.target].name + (a && a.meas ? ' at ' + a.meas.T + ' °C' : ''), unit: 'mPa s', truth: etaAt(s.target, a && a.meas ? a.meas.T : 25), dp: 3, tol: 0.04 }],
    readouts: (s) => [['Your liquid', LIQ[s.target].name], ['Reference', 'water']],
    draw(g, w, h, s, c, S) {
      const x = w * 0.45, top = h * 0.08, bot = h * 0.9, col = c.liq === 'water' ? '#cfe6f5' : c.liq.startsWith('gly') ? '#e8eef2' : '#dfe9f0';
      g.strokeStyle = TH.line(.65); g.lineWidth = 3;
      g.beginPath(); g.moveTo(x, top); g.lineTo(x, h * 0.36 - h * 0.065); g.stroke();                  // upper tube
      const bw2 = Math.max(10, h * 0.05), bh2 = h * 0.065;
      g.beginPath(); g.ellipse(x, h * 0.36, bw2, bh2, 0, 0, 6.283); g.stroke();                         // bulb between the marks
      g.beginPath(); g.moveTo(x, h * 0.36 + h * 0.065); g.lineTo(x, h * 0.7); g.stroke();              // capillary
      g.beginPath(); g.moveTo(x, h * 0.7); g.quadraticCurveTo(x, bot, x + w * 0.08, bot); g.quadraticCurveTo(x + w * 0.16, bot, x + w * 0.16, h * 0.7); g.lineTo(x + w * 0.16, top + 20); g.stroke(); g.lineWidth = 1;
      g.fillStyle = TH.light ? 'rgba(196,110,0,.9)' : 'rgba(255,203,131,.9)'; g.fillRect(x - bw2 - 8, h * 0.36 - bh2 - 2, 2 * bw2 + 16, 2); g.fillRect(x - bw2 - 8, h * 0.36 + bh2 + 1, 2 * bw2 + 16, 2);
      const a = S.anim && S.anim.kind === 'flow' ? Math.min(1, S.anim.t / 2.5) : 1;
      const lvl = h * 0.36 - bh2 - 2 + a * (2 * bh2 + 3);
      g.fillStyle = K.rgba(col, 0.85); g.beginPath(); g.ellipse(x, h * 0.36, bw2 - 2, bh2 - 2, 0, 0, 6.283); g.save(); g.clip(); g.fillRect(x - bw2, lvl, 2 * bw2, h); g.restore();
      g.fillRect(x - 2, Math.max(lvl, h * 0.36 + bh2), 4, h * 0.7 - Math.max(lvl, h * 0.36 + bh2)); g.fillRect(x + w * 0.16 - 3, h * 0.55, 6, h * 0.3);
      K.thermo(g, w * 0.78, h * 0.15, h * 0.75, c.T, 10, 50); K.label(g, w, c.T + ' °C', w * 0.78, h * 0.12, null, 'center');
      K.display(g, w, (S.anim && S.anim.kind === 'flow' ? (S.last.t * a).toFixed(1) : S.last ? S.last.t.toFixed(1) : '0.0') + ' s', 12, 12, Math.min(w * 0.28, 170));
      K.caption(LIQ[c.liq].name);
    },
  });

  // ================================================================ surface tension (stalagmometer, drop-number method)
  const ST = { water: { name: 'water', g: 71.97, rho: 0.997, dg: -0.155 }, ethanol: { name: 'ethanol', g: 21.97, rho: 0.785, dg: -0.083 }, methanol: { name: 'methanol', g: 22.07, rho: 0.787, dg: -0.077 }, acetone: { name: 'acetone', g: 23.0, rho: 0.785, dg: -0.112 }, chcl3: { name: 'chloroform', g: 26.7, rho: 1.479, dg: -0.130 }, hexane: { name: 'n-hexane', g: 17.9, rho: 0.655, dg: -0.102 } };
  const gamma = (l, T) => ST[l].g + ST[l].dg * (T - 25);
  PX.add({
    id: 'surface-tension', area: 'Physical properties & equilibria', title: 'Surface tension with a stalagmometer', short: 'Drop-number method, relative to water', aspect: 0.55,
    steps: ['Fill the stalagmometer above the upper mark and let the liquid drip slowly from the flat tip. Count the drops while the meniscus falls from the upper to the lower mark (estimate the fraction of the last drop).', 'Repeat with water, the reference, at the same temperature.', 'A drop falls when its weight overcomes the surface tension holding it to the tip (Tate’s law: mg ∝ γ). For the same volume, n drops each of mass ρV/n: γ ∝ ρ/n.', 'γ = γ_water × (n_water ρ) / (n ρ_water). γ(water) / mN m⁻¹: 72.75 (20 °C), 71.97 (25 °C), 71.20 (30 °C). Densities (g mL⁻¹, taken as constant): water 0.997, ethanol 0.785, methanol 0.787, acetone 0.785, chloroform 1.479, n-hexane 0.655.'],
    controls: [{ id: 'liq', label: 'Liquid', type: 'select', val: 'water', opts: Object.keys(ST).map((k) => [k, ST[k].name]) }, { id: 'T', label: 'Temperature', min: 20, max: 35, step: 5, val: 25, unit: '°C' }],
    begin: () => { const keys = Object.keys(ST).filter((k) => k !== 'water'); return { target: keys[Math.floor(Math.random() * keys.length)], n0: 28.4 }; },
    measureLabel: 'Count the drops',
    measure(s, c) { const n = s.n0 * (ST[c.liq].rho / 0.997) * (71.97 / gamma(c.liq, c.T)) + N(0.25); /* Tate: n ∝ ρ/γ */ return { row: { liq: c.liq, name: ST[c.liq].name, T: c.T, n: Number(n.toFixed(1)) }, anim: { dur: 3, kind: 'drops', n }, msg: 'Counted ' + n.toFixed(1) + ' drops.' }; },
    cols: [{ k: 'name', label: 'Liquid' }, { k: 'T', label: 'T / °C', dp: 0 }, { k: 'n', label: 'number of drops', dp: 1 }],
    analyse(rows, s) {
      const tg = rows.filter((r) => r.liq === s.target); if (!tg.length) return { err: 'Count the drops for your liquid (' + ST[s.target].name + ').' };
      const T = tg[tg.length - 1].T, tw = rows.filter((r) => r.liq === 'water' && r.T === T); if (!tw.length) return { err: 'Count water at the same temperature too.' };
      const n = tg.filter((r) => r.T === T).reduce((a, r) => a + r.n, 0) / tg.filter((r) => r.T === T).length, nw = tw.reduce((a, r) => a + r.n, 0) / tw.length;
      const gw = gamma('water', T), gx = (gw * nw * ST[s.target].rho) / (n * ST.water.rho);
      return { summary: `Mean drop numbers at ${T} °C: ${ST[s.target].name} <b>${n.toFixed(1)}</b>, water <b>${nw.toFixed(1)}</b>. Now calculate γ.`, meas: { T }, lines: [`n(${ST[s.target].name}) = ${n.toFixed(1)}, n(water) = ${nw.toFixed(1)}`, `γ(water, ${T} °C) = ${gw.toFixed(2)} mN m⁻¹`, `γ = ${gw.toFixed(2)} × (${nw.toFixed(1)} × ${ST[s.target].rho}) / (${n.toFixed(1)} × ${ST.water.rho}) = ${gx.toFixed(1)} mN m⁻¹`] };
    },
    report: (s, a) => [{ id: 'g', label: 'Surface tension of ' + ST[s.target].name, unit: 'mN m⁻¹', truth: gamma(s.target, a && a.meas ? a.meas.T : 25), dp: 1, tol: 0.05 }],
    readouts: (s) => [['Your liquid', ST[s.target].name], ['Reference', 'water']],
    draw(g, w, h, s, c, S) {
      const x = w * 0.45; g.strokeStyle = TH.line(.65); g.lineWidth = 3;
      const ew = Math.max(12, h * 0.07), eh = h * 0.12; g.beginPath(); g.moveTo(x, h * 0.05); g.lineTo(x, h * 0.32 - eh); g.stroke(); g.beginPath(); g.ellipse(x, h * 0.32, ew, eh, 0, 0, 6.283); g.stroke(); g.beginPath(); g.moveTo(x, h * 0.32 + eh); g.lineTo(x, h * 0.62); g.stroke(); g.lineWidth = 1;
      g.fillStyle = TH.light ? 'rgba(196,110,0,.9)' : 'rgba(255,203,131,.9)'; g.fillRect(x - ew - 8, h * 0.32 - eh - 6, 2 * ew + 16, 2); g.fillRect(x - ew - 8, h * 0.32 + eh + 4, 2 * ew + 16, 2);   /* upper and lower marks */
      g.fillStyle = TH.metal; g.fillRect(x - 9, h * 0.62, 18, 6);
      const an = S.anim && S.anim.kind === 'drops' ? S.anim : null, f = an ? Math.min(1, an.t / 3) : 0;
      g.fillStyle = K.rgba('#cfe6f5', 0.85); g.beginPath(); g.ellipse(x, h * 0.32, ew - 2, eh - 2, 0, 0, 6.283); g.save(); g.clip(); g.fillRect(x - ew, h * 0.32 - eh + f * 2 * eh, 2 * ew, h); g.restore();
      if (an) { const ph = (an.t * 6) % 1, r = 3 + ph * 5; g.beginPath(); g.ellipse(x, h * 0.68 + r, r * 0.9, r, 0, 0, 6.283); g.fill(); if (ph > 0.6) { g.beginPath(); g.arc(x, h * 0.68 + 12 + (ph - 0.6) * h * 0.6, 4, 0, 6.283); g.fill(); } }
      K.beaker(g, x - 40, h * 0.97, 80, h * 0.12, '#cfe6f5', 0.4);
      K.display(g, w, (an ? Math.floor(an.n * f) : S.last ? S.last.n.toFixed(1) : 0) + ' drops', w - Math.min(w * 0.3, 190) - 12, 12, Math.min(w * 0.3, 190));
      K.caption(ST[c.liq].name + ', ' + c.T + ' °C');
    },
  });

  // ================================================================ solubility product of potassium hydrogen tartrate
  const KSP_KHT = 1.10e-3, DH_KHT = 50000;
  let kspF = 1;   // this sample's factor (a different batch of KHTa / water each time)
  const kspAt = (T) => KSP_KHT * kspF * Math.exp((-DH_KHT / 8.314) * (1 / (T + 273.15) - 1 / T0));
  const solub = (T, cK) => { const k = kspAt(T); return (-cK + Math.sqrt(cK * cK + 4 * k)) / 2; };
  PX.add({
    id: 'ksp-khta', area: 'Physical properties & equilibria', title: 'Solubility product of potassium hydrogen tartrate', short: 'Common-ion effect and temperature',
    steps: ['Shake excess solid KHC₄H₄O₆ (KHTa) with water or with KCl solution at a fixed temperature until saturated (about 30 min), then filter at that temperature.', 'Titrate 25.0 mL of the filtrate with 0.0500 M NaOH (phenolphthalein). HTa⁻ is a monoprotic acid here: HTa⁻ + OH⁻ → Ta²⁻ + H₂O.', 'Solubility s = c(NaOH) × V / 25.0. With added KCl (c_K), K_sp = [K⁺][HTa⁻] = s (s + c_K).', 'Repeat at other temperatures: ln K_sp against 1/T has slope −ΔH_sol/R.'],
    controls: [{ id: 'k', label: 'KCl added', type: 'select', val: '0', opts: [['0', 'none (water)'], ['0.01', '0.010 M KCl'], ['0.02', '0.020 M KCl'], ['0.04', '0.040 M KCl']] }, { id: 'T', label: 'Temperature', min: 20, max: 40, step: 5, val: 25, unit: '°C' }],
    begin: () => { kspF = 1 + N(0.04); return { f: kspF }; },
    measureLabel: 'Saturate, filter and titrate',
    measure(s, c) { const sol = solub(c.T, +c.k), V = R((sol * 25) / 0.05 + N(0.05), 0.05); return { row: { k: +c.k, T: c.T, V: Number(V.toFixed(2)) }, msg: 'Titre: ' + V.toFixed(2) + ' mL of 0.0500 M NaOH for 25.0 mL of saturated solution.' }; },
    cols: [{ k: 'k', label: '[KCl] / M', dp: 3 }, { k: 'T', label: 'T / °C', dp: 0 }, { k: 'V', label: 'NaOH titre / mL', dp: 2 }],
    analyse(rows) {
      const r25 = rows.filter((r) => r.T === 25); if (!r25.length) return { err: 'Do at least one titration at 25 °C.' };
      const ksp = (r) => { const s = (0.05 * r.V) / 25; return s * (s + r.k); };
      const k25 = r25.reduce((a, r) => a + ksp(r), 0) / r25.length, Ts = [...new Set(rows.filter((r) => r.k === 0).map((r) => r.T))];
      const lines = rows.map((r) => `${r.T} °C, KCl ${r.k} M: s = 0.0500 × ${r.V.toFixed(2)} / 25.0 = ${((0.05 * r.V) / 25).toFixed(4)} M, K_sp = s(s + ${r.k}) = ${ksp(r).toExponential(3)}`);
      let chart = null, dH = null;
      if (Ts.length >= 3) {
        const pts = Ts.map((T) => { const rs = rows.filter((r) => r.k === 0 && r.T === T); return [1 / (T + 273.15), Math.log(rs.reduce((a, r) => a + (0.05 * r.V) / 25, 0) / rs.length)]; }), f = L.linreg(pts.map((p) => p[0]), pts.map((p) => p[1]));
        dH = (-2 * f.m * 8.314) / 1000; lines.push(`ln s vs 1/T: slope ${f.m.toFixed(0)} K = −ΔH/(2R) → ΔH_sol = −2 × 8.314 × (${f.m.toFixed(0)}) = ${dH.toFixed(1)} kJ/mol`);
        chart = { title: 'ln s against 1/T (no KCl)', series: [{ pts, color: '#ce72f5', dots: true }, { pts: pts.map((p) => [p[0], f.m * p[0] + f.b]), color: '#7cf0b4', line: true }], xmin: Math.min(...pts.map((p) => p[0])) * 0.998, xmax: Math.max(...pts.map((p) => p[0])) * 1.002, xLabel: '1/T / K⁻¹', yLabel: 'ln (s / M)' };
      }
      return { summary: 'Mean titres: ' + [...new Set(rows.map((r) => r.T + '|' + r.k))].map((key) => { const [T, k] = key.split('|'), rr = rows.filter((r) => r.T === +T && r.k === +k); return `${T} °C, KCl ${k} M: <b>${(rr.reduce((a, r) => a + r.V, 0) / rr.length).toFixed(2)} mL</b>`; }).join('; ') + '. Calculate s and K<sub>sp</sub>' + (dH != null ? '; the plot of ln s against 1/T (no KCl) has slope −ΔH/(2R), because K<sub>sp</sub> = s² there.' : '. Measure at three temperatures without KCl for ΔH.'), meas: { k25, dH }, chart, lines };
    },
    report: (s, a) => [{ id: 'k', label: 'K_sp at 25 °C', unit: '× 10⁻³', truth: (KSP_KHT * s.f) / 1e-3, dp: 2, tol: 0.08 }].concat(a && a.meas && a.meas.dH != null ? [{ id: 'h', label: 'ΔH of solution', unit: 'kJ/mol', truth: DH_KHT / 1000, dp: 0, tol: 0.15 }] : []),
    draw(g, w, h, s, c, S) {
      K.beaker(g, w * 0.35, h * 0.92, w * 0.28, h * 0.5, '#e2eef4', 0.6);
      for (let i = 0; i < 26; i++) { g.fillStyle = 'rgba(250,250,250,.9)'; g.fillRect(w * 0.37 + ((i * 37) % (w * 0.24)), h * 0.88 - (i % 3) * 4, 5, 4); }
      K.thermo(g, w * 0.75, h * 0.15, h * 0.75, c.T, 10, 50); K.label(g, w, c.T + ' °C', w * 0.75, h * 0.12, null, 'center');
      K.caption('saturated KHTa' + (+c.k ? ' in ' + c.k + ' M KCl' : ' in water') + ' with excess solid');
      K.display(g, w, S.last ? S.last.V.toFixed(2) + ' mL' : '— mL', 12, 12, Math.min(w * 0.28, 170));
    },
  });

  // ================================================================ critical micelle concentration of SDS (conductometric)
  PX.add({
    id: 'cmc', area: 'Physical properties & equilibria', title: 'Critical micelle concentration of SDS', short: 'Conductivity against concentration: find the break',
    steps: ['Make SDS (sodium dodecyl sulfate) solutions from about 1 to 20 mM by diluting a stock, and measure the conductivity of each at 25 °C.', 'Below the CMC each SDS adds a Na⁺ and a DS⁻ ion. Above it, new surfactant goes into micelles: the large micelle moves slowly and binds many Na⁺ counter-ions, so κ rises much more slowly.', 'Plot κ against c. The CMC is where the two straight lines cross.', 'The ratio of the slopes, S₂/S₁, estimates the fraction of counter-ions that stay free (1 − β).'],
    controls: [{ id: 'c', label: 'SDS concentration', min: 1, max: 20, step: 0.5, val: 2, unit: 'mM', dp: 1 }, { id: 'T', label: 'Temperature', min: 15, max: 40, step: 5, val: 25, unit: '°C' }],
    begin: () => ({ cmc25: 8.2 * (1 + N(0.02)), s1: 72, s2: 28 }),
    cmc: (s, T) => s.cmc25 * (1 + 0.0006 * (T - 25) * (T - 25)),
    kap: (s, c, T) => { const cm = PX.byId.cmc.cmc(s, T), f = 1 + 0.021 * (T - 25); return (2 + (c < cm ? s.s1 * c : s.s1 * cm + s.s2 * (c - cm))) * f; },
    measure(s, c) { const k = this.kap(s, c.c, c.T) * (1 + N(0.004)); return { row: { c: c.c, T: c.T, k: Number(k.toFixed(1)) } }; },
    cols: [{ k: 'c', label: 'c / mM', dp: 1 }, { k: 'T', label: 'T / °C', dp: 0 }, { k: 'k', label: 'κ / µS cm⁻¹', dp: 1 }],
    sortRows: (a, b) => a.c - b.c,
    analyse(rows) {
      const cnt = {}; rows.forEach((x) => (cnt[x.T] = (cnt[x.T] || 0) + 1)); const T = rows.length ? +Object.keys(cnt).sort((p, q) => cnt[q] - cnt[p])[0] : 25, r = rows.filter((x) => x.T === T).sort((a, b) => a.c - b.c);
      if (r.length < 8) return { err: 'Measure at least 8 concentrations (at the same temperature), spread over 1–20 mM.' };
      const f = PX.twoLines(r.map((x) => x.c), r.map((x) => x.k));
      if (f && (f.f2.m / f.f1.m > 0.8 || r.filter((x) => x.c < f.x).length < 3 || r.filter((x) => x.c > f.x).length < 3)) return { err: 'No clear break in your data yet: you need at least 3 points well below and 3 well above the change of slope. Spread your concentrations over 1–20 mM.' };
      if (!f) return { err: 'Could not find two straight lines. Add more points on both sides of the break.' };
      const xm = 21;
      return { summary: `Two straight lines through your points (${T} °C), with c in mM: below the break <b>κ = ${f.f1.m.toFixed(2)} c + ${f.f1.b.toFixed(1)}</b>; above it <b>κ = ${f.f2.m.toFixed(2)} c + ${f.f2.b.toFixed(1)}</b>. The CMC is where they cross.`, meas: { cmc: f.x, T },
        chart: { title: 'κ against [SDS]', series: [{ pts: [[0, f.f1.b], [f.x, f.f1.m * f.x + f.f1.b]], color: '#7cf0b4', line: true }, { pts: [[f.x, f.f2.m * f.x + f.f2.b], [xm, f.f2.m * xm + f.f2.b]], color: '#7cf0b4', line: true }, { pts: r.map((x) => [x.c, x.k]), color: '#ce72f5', dots: true }], xmin: 0, xmax: xm, xLabel: '[SDS] / mM', yLabel: 'κ / µS cm⁻¹', },
        lines: [`below CMC: κ = ${f.f1.m.toFixed(1)} c + ${f.f1.b.toFixed(1)}`, `above CMC: κ = ${f.f2.m.toFixed(1)} c + ${f.f2.b.toFixed(1)}`, `lines cross at c = ${f.x.toFixed(2)} mM = CMC`, `degree of counter-ion binding β ≈ 1 − S₂/S₁ = ${(1 - f.f2.m / f.f1.m).toFixed(2)}`] };
    },
    report: (s, a) => [{ id: 'cmc', label: 'CMC of SDS' + (a && a.meas ? ' at ' + a.meas.T + ' °C' : ''), unit: 'mM', truth: PX.byId.cmc.cmc(s, a && a.meas ? a.meas.T : 25), dp: 2, tol: 0.06 }],
    draw(g, w, h, s, c, S) {
      K.beaker(g, w * 0.36, h * 0.9, w * 0.26, h * 0.6, '#dbeaf3', 0.65); K.cell(g, w * 0.49, h * 0.15, h * 0.88);
      const above = false;   /* micelles are not visible in a real cell: no hint where the CMC is */
      for (let i = 0; i < 18; i++) { const x = w * 0.38 + ((i * 53) % (w * 0.22)), y = h * 0.6 + ((i * 31) % (h * 0.25)); g.fillStyle = 'rgba(206,114,245,.8)'; if (above && i % 3 === 0) { for (let j = 0; j < 10; j++) { const a = (j / 10) * 6.283; g.fillRect(x + Math.cos(a) * 9, y + Math.sin(a) * 9, 2, 2); } } else { g.fillRect(x, y, 2, 7); } }
      K.display(g, w, (S.last ? S.last.k.toFixed(1) : '—') + ' µS/cm', w - Math.min(w * 0.32, 210) - 12, 12);
      K.caption(c.c.toFixed(1) + ' mM SDS, ' + c.T + ' °C');
    },
  });

  // ================================================================ phenol-water mutual solubility
  // miscibility temperature (C) against wt % phenol, from literature data; UCST 66.8 C near 34 %
  const BIN = [[8.4, 20], [9.2, 30], [10.0, 40], [11.8, 50], [14.0, 56], [16.8, 60], [22, 64], [28, 66.2], [34, 66.8], [40, 66.4], [44, 66], [50, 64], [55, 60], [59, 56], [62.6, 50], [66, 40], [69, 30], [72, 20]];
  const tMis = (w) => (w < 8.4 || w > 72 ? null : PX.interp(BIN, w));
  PX.add({
    id: 'phenol-water', area: 'Physical properties & equilibria', title: 'Phenol–water phase diagram', short: 'Miscibility temperatures and the critical solution temperature', aspect: 0.55,
    steps: ['Weigh phenol into a boiling tube and add water to give a known weight %. (Phenol is corrosive and toxic: gloves, no skin contact.)', 'Heat slowly in a water bath with stirring. Note the temperature at which the turbidity just disappears (one phase).', 'Let it cool and note the temperature at which turbidity reappears. Take the mean as the miscibility temperature.', 'Repeat for about 10 compositions from 10 to 70 %. Plot T against composition: the maximum is the upper critical solution temperature (UCST).'],
    controls: [{ id: 'w', label: 'Phenol in the mixture', min: 5, max: 80, step: 2.5, val: 30, unit: '% w/w', dp: 1 }],
    begin: () => ({ dT: N(0.3) }),
    measureLabel: 'Heat, then cool',
    measure(s, c) {
      const tm = tMis(c.w);
      if (tm == null) return { msg: 'At ' + c.w + ' % the mixture is one clear phase at every temperature from room temperature up: phenol and water are fully miscible at this composition. Try between about 10 and 70 %.', kind: 'warn' };
      const t1 = tm + s.dT + 0.4 + N(0.15), t2 = tm + s.dT - 0.4 + N(0.15);
      return { row: { w: c.w, t1: Number(t1.toFixed(1)), t2: Number(t2.toFixed(1)), t: Number(((t1 + t2) / 2).toFixed(1)) }, anim: { dur: 3.2, kind: 'heat', tm }, msg: 'Clear at ' + t1.toFixed(1) + ' °C on heating; turbid again at ' + t2.toFixed(1) + ' °C on cooling.' };
    },
    cols: [{ k: 'w', label: 'phenol / % w/w', dp: 1 }, { k: 't1', label: 'clears at / °C', dp: 1 }, { k: 't2', label: 'turbid at / °C', dp: 1 }, { k: 't', label: 'mean / °C', dp: 1 }],
    sortRows: (a, b) => a.w - b.w,
    analyse(rows) {
      if (rows.length < 7) return { err: 'Measure at least 7 compositions spread across 10–70 %.' };
      const r = rows.slice().sort((a, b) => a.w - b.w), top = r.reduce((a, b) => (b.t > a.t ? b : a));
      // fit a parabola through the points near the top for the maximum
      const near = r.filter((x) => x.t > top.t - 4); let ucst = top.t, wc = top.w;
      if (near.length >= 3) { const X = near.map((x) => [1, x.w, x.w * x.w]), b = L.ols(X, near.map((x) => x.t)); if (b && b[2] < 0) { wc = -b[1] / (2 * b[2]); ucst = b[0] + b[1] * wc + b[2] * wc * wc; } }
      return { summary: 'Your phase diagram is plotted. Read the highest point of the curve: its temperature is the UCST and its composition is the critical composition.', meas: { ucst, wc },
        chart: { title: 'Phase diagram: temperature against composition', series: [{ pts: r.map((x) => [x.w, x.t]), color: '#ce72f5', dots: true, line: true }], xmin: 0, xmax: 80, ymin: 10, ymax: 75, xLabel: 'phenol / % w/w', yLabel: 'T / °C' },
        lines: ['Inside the curve (below it): two liquid layers (one rich in water, one rich in phenol). Outside: one phase.', `highest miscibility temperature from a parabola through the top points = ${ucst.toFixed(1)} °C at ${wc.toFixed(1)} % phenol`, 'Above the UCST phenol and water mix in all proportions.'] };
    },
    report: (s) => [{ id: 'u', label: 'Critical solution temperature', unit: '°C', truth: 66.8 + s.dT, dp: 1, abs: true, tol: 1.5 }, { id: 'w', label: 'Critical composition', unit: '% phenol', truth: 34, dp: 0, abs: true, tol: 5 }],
    draw(g, w, h, s, c, S) {
      const tm = tMis(c.w), an = S.anim && S.anim.kind === 'heat' ? S.anim : null;
      let T = 25; if (an) { const f = an.t / an.dur; T = f < 0.5 ? 25 + (an.tm + 4 - 25) * (f / 0.5) : an.tm + 4 - 8 * ((f - 0.5) / 0.5); }
      const turbid = tm != null && T < tm + s.dT ? 1 : 0;
      K.beaker(g, w * 0.3, h * 0.95, w * 0.4, h * 0.55, '#7fb0d8', 0.7);
      K.tube(g, w * 0.5, h * 0.1, h * 0.88, Math.max(36, w * 0.08), '#f1ece0', 0.45, { turbid });
      K.thermo(g, w * 0.82, h * 0.12, h * 0.75, T, 10, 80); K.label(g, w, T.toFixed(1) + ' °C', w * 0.82, h * 0.09, null, 'center');
      K.caption(c.w.toFixed(1) + ' % phenol: ' + (tm == null ? 'one phase' : turbid ? 'two phases (turbid)' : 'one phase (clear)'));
    },
  });

  // ================================================================ distribution law: Cu2+ + NH3
  const KD = 0.040;
  PX.add({
    id: 'distribution', area: 'Physical properties & equilibria', title: 'Distribution law: formula of the copper–ammine complex', short: 'NH₃ between water and chloroform',
    steps: ['Part 1: shake 25 mL aqueous NH₃ with 25 mL CHCl₃ in a stoppered bottle at constant temperature until equilibrium. Titrate 10.0 mL of the CHCl₃ layer (with water added) with 0.0200 M HCl and 5.0 mL of the aqueous layer with 0.500 M HCl (methyl orange). K_D = [NH₃]org / [NH₃]aq.', 'Part 2: repeat with the aqueous layer also containing 0.0500 M CuSO₄. Ammonia bound in [Cu(NH₃)ₙ]²⁺ cannot enter the CHCl₃, but the titration of the aqueous layer measures free + bound NH₃.', 'Free aqueous NH₃ = [NH₃]org / K_D. Bound = total aqueous − free. n = bound / [Cu²⁺].'],
    controls: [{ id: 'cu', label: 'Aqueous layer', type: 'select', val: '0', opts: [['0', 'Part 1: NH₃ only'], ['0.05', 'Part 2: NH₃ + 0.0500 M CuSO₄']] }, { id: 'n0', label: 'NH₃ added (initial, aqueous)', min: 0.6, max: 1.4, step: 0.1, val: 1, unit: 'M', dp: 1 }],
    begin: () => ({ KD: KD * (1 + N(0.03)) }),
    measureLabel: 'Shake, separate and titrate both layers',
    measure(s, c) {
      const cu = +c.cu, free = (c.n0 - 4 * cu) / (1 + s.KD), org = s.KD * free, aqT = free + 4 * cu;
      const Vo = R((org * 10) / 0.02 + N(0.04), 0.05), Va = R((aqT * 5) / 0.5 + N(0.04), 0.05);
      return { row: { cu, n0: c.n0, Vo: Number(Vo.toFixed(2)), Va: Number(Va.toFixed(2)) }, anim: { dur: 2, kind: 'shake' } };
    },
    cols: [{ label: 'Cu²⁺ / M', f: (r) => r.cu.toFixed(4) }, { k: 'n0', label: 'NH₃ added / M', dp: 1 }, { k: 'Vo', label: 'org. layer titre (10 mL, 0.02 M HCl) / mL', dp: 2 }, { k: 'Va', label: 'aq. layer titre (5 mL, 0.5 M HCl) / mL', dp: 2 }],
    analyse(rows) {
      const p1 = rows.filter((r) => r.cu === 0), p2 = rows.filter((r) => r.cu > 0); if (!p1.length || !p2.length) return { err: 'Do both parts: NH₃ alone, and NH₃ with CuSO₄.' };
      const kd = p1.reduce((a, r) => a + ((r.Vo * 0.02) / 10) / ((r.Va * 0.5) / 5), 0) / p1.length;
      const ns = p2.map((r) => { const org = (r.Vo * 0.02) / 10, free = org / kd, tot = (r.Va * 0.5) / 5; return (tot - free) / r.cu; }), n = ns.reduce((a, b) => a + b, 0) / ns.length;
      return { summary: 'Mean titres: ' + [['NH₃ only', p1], ['with Cu²⁺', p2]].map(([t, rr]) => `${t}: organic layer <b>${(rr.reduce((a, r) => a + r.Vo, 0) / rr.length).toFixed(2)} mL</b>, aqueous layer <b>${(rr.reduce((a, r) => a + r.Va, 0) / rr.length).toFixed(2)} mL</b>`).join('; ') + '. Now calculate K<sub>D</sub> and n.', meas: { kd, n },
        lines: p1.map((r) => `Part 1: [NH₃]org = 0.02 × ${r.Vo} / 10 = ${((r.Vo * 0.02) / 10).toFixed(5)} M; [NH₃]aq = 0.5 × ${r.Va} / 5 = ${((r.Va * 0.5) / 5).toFixed(4)} M`).concat([`K_D = ${kd.toFixed(4)}`], p2.map((r, i) => { const org = (r.Vo * 0.02) / 10, free = org / kd, tot = (r.Va * 0.5) / 5; return `Part 2: free aq NH₃ = ${org.toFixed(5)} / ${kd.toFixed(4)} = ${free.toFixed(4)} M; total aq = ${tot.toFixed(4)} M; bound = ${(tot - free).toFixed(4)} M; n = bound / 0.0500 = ${ns[i].toFixed(2)}`; })) };
    },
    report: (s) => [{ id: 'kd', label: 'Distribution coefficient K_D (CHCl₃/water)', unit: '', truth: s.KD, dp: 4, tol: 0.08 }, { id: 'n', label: 'n in [Cu(NH₃)ₙ]²⁺', unit: '', truth: 4, dp: 0, abs: true, tol: 0.35 }],
    draw(g, w, h, s, c, S) {
      const x = w * 0.5, top = h * 0.08, an = S.anim && S.anim.kind === 'shake' ? S.anim : null, wob = an ? Math.sin(an.t * 30) * 6 * (1 - an.t / an.dur) : 0;
      g.save(); g.translate(x + wob, 0);
      g.beginPath(); g.moveTo(-12, top); g.lineTo(-12, top + 20); g.quadraticCurveTo(-w * 0.12, h * 0.3, -w * 0.08, h * 0.62); g.lineTo(-6, h * 0.78); g.lineTo(6, h * 0.78); g.lineTo(w * 0.08, h * 0.62); g.quadraticCurveTo(w * 0.12, h * 0.3, 12, top + 20); g.lineTo(12, top); g.closePath();
      g.save(); g.clip(); g.fillStyle = K.rgba(+c.cu ? '#2b4fd1' : '#d6e9f6', 0.85); g.fillRect(-w, h * 0.3, 2 * w, h * 0.22); g.fillStyle = K.rgba('#eef0f6', 0.9); g.fillRect(-w, h * 0.52, 2 * w, h); g.restore();
      g.strokeStyle = TH.line(.65); g.lineWidth = 2; g.stroke(); g.lineWidth = 1; g.fillStyle = TH.metal; g.fillRect(-3, h * 0.78, 6, h * 0.12); g.restore();
      K.label(g, w, 'aqueous (top)', x + w * 0.14, h * 0.42); K.label(g, w, 'CHCl₃ (bottom)', x + w * 0.14, h * 0.6);
      K.caption('Upper layer: water' + (+c.cu ? ' with deep-blue [Cu(NH₃)₄]²⁺' : '') + '. Lower layer: chloroform (denser, 1.48 g/mL).');
    },
  });
})();
