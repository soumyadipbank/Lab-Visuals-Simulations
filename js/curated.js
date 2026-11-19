/* Lab Visuals: hand-written reactions (heating, redox, catalysis, complex ions, conc. H2SO4...).
   Equations are verified for atom and charge balance by tests/verify.js. */
(function () {
  'use strict';
  const C = globalThis.Chem;
  const CUR = (C.CUR = C.CUR || {});

  function cur(idsList, o) {
    const lists = Array.isArray(idsList[0]) ? idsList : [idsList];
    const res = Object.assign({ reacts: true, kind: 'special', types: [], obs: [], why: [], deep: [], safety: [], fx: {}, balanced: true }, o);
    res.equation = { mol: o.eq };
    if (o.net) res.equation.net = o.net;
    if (o.ionic) res.equation.ionic = o.ionic;
    delete res.eq; delete res.net; delete res.ionic;
    const src = o.net || o.eq;
    const pe = C.parseEq(src);
    const map = (t) => ({ label: t.full, n: t.co, ph: t.ph });
    res.micro = o.micro || { react: pe.left.map(map), prod: pe.right.map(map), spec: [] };
    if (res.dh === undefined) res.dh = null;
    res.dhSource = o.dhSource || (res.dh == null ? null : 'standard enthalpies of formation (Hess\'s law)');
    C.finishFx(res);
    lists.forEach((ids) => { CUR[C.keyOf(ids)] = res; });
  }

  // =========================================================== heating (thermal reactions)
  cur(['caco3', 'heat'], {
    title: 'Thermal decomposition of limestone',
    types: ['Thermal decomposition', 'Endothermic'],
    eq: 'CaCO3(s) → CaO(s) + CO2(g)', dh: 178.3,
    fx: { dry: true, flame: true, solidEnd: '#f6f3ec', solidConsume: 0.3, gas: { color: null, rate: 0.35, label: 'CO2' }, speed: 0.7, Tpeak: 900 },
    obs: ['The white marble chips look unchanged, but a colourless gas (CO₂) is given off. Bubble it into limewater: it turns milky.', 'White quicklime (CaO) is left behind. When heated very strongly it glows brilliant white (the old "limelight" of theatres).'],
    why: ['Heat gives the carbonate enough energy to break up: CaCO₃ → CaO + CO₂. The CO₂ escapes as a gas, so the reaction can go to completion. This is the first step in making lime and cement.'],
    deep: ['ΔH° = ΔfH(CaO) + ΔfH(CO₂) − ΔfH(CaCO₃) = (−635.1) + (−393.5) − (−1207.6) = +178.3 kJ/mol. ΔS° ≈ +160 J K⁻¹ mol⁻¹ (a gas forms), so ΔG° = ΔH° − TΔS° becomes negative above T ≈ 178300/160 ≈ 1100 K (about 840 °C). That is why strong heating is needed.'],
    safety: ['Use heat-resistant crucible and tongs; wear eye protection.'],
  });
  cur(['cuso4h', 'heat'], {
    title: 'Dehydration of blue vitriol',
    types: ['Thermal dehydration', 'Endothermic'],
    eq: 'CuSO4·5H2O(s) → CuSO4(s) + 5H2O(g)', dh: 299.3,
    fx: { dry: true, flame: true, solidFrom: '#2f7fd8', solidEnd: '#f2f2ee', solidConsume: 0, gas: { color: null, rate: 0.5, label: 'H2O', steam: true }, speed: 0.7, Tpeak: 250 },
    obs: ['The bright blue crystals crumble and turn into a white powder.', 'Steam is given off and condenses as droplets on cooler glass.', 'Add a few drops of water to the white powder: it turns blue again and gets hot (the reaction is reversible).'],
    why: ['Water of crystallisation is bonded to the Cu²⁺ ion as [Cu(H₂O)₄]²⁺. Heating drives the water off. Without the water ligands the ion absorbs no visible light, so the anhydrous salt is white.'],
    deep: ['Crystal field theory: the d–d transition of Cu²⁺ in an octahedral/square-planar water field absorbs in the red-orange region (blue colour). Anhydrous CuSO₄ has a different coordination environment (sulfate O donors) and a weaker, shifted transition, so it appears white/pale grey. ΔH = −771.4 + 5(−241.8) − (−2279.7) = +299.3 kJ (with vapour; +79 with liquid water).'],
  });
  cur(['heat', 'pbno32'], {
    title: 'Thermal decomposition of lead nitrate',
    types: ['Thermal decomposition', 'Endothermic', 'Redox'],
    eq: '2Pb(NO3)2(s) → 2PbO(s) + 4NO2(g) + O2(g)', dh: 602,
    fx: { dry: true, flame: true, solidFrom: '#f2f2f2', solidEnd: '#e5c321', solidConsume: 0, gas: { color: '#8a4b1d', rate: 0.9, label: 'NO2' }, fumes: { color: '#8a4b1d', amount: 0.9 }, speed: 0.8, Tpeak: 470 },
    obs: ['The white crystals crackle and jump (decrepitation) as they decompose.', 'Dense brown fumes of NO₂ appear. Oxygen is also given off.', 'A yellow solid (PbO) remains: yellow when cold, red-brown when hot.'],
    why: ['Metal nitrates break down on heating. For most heavy metals (Pb, Cu, Zn) the products are metal oxide, brown NO₂ and O₂. Group 1 nitrates give only nitrite + O₂.'],
    deep: ['Nitrogen is reduced (+5 → +4) and oxygen is oxidised (−2 → 0): an internal redox reaction. The more polarising the cation, the lower the decomposition temperature (Fajans\' rules): Pb²⁺ and Cu²⁺ nitrates decompose at 400–500 °C, NaNO₃ above 800 °C.'],
    safety: ['Lead compounds and NO₂ are toxic. Fume cupboard only, and collect all residue.'],
  });
  cur(['heat', 'nahco3'], {
    title: 'Thermal decomposition of baking soda',
    types: ['Thermal decomposition', 'Endothermic'],
    eq: '2NaHCO3(s) → Na2CO3(s) + H2O(g) + CO2(g)', dh: 135.6,
    fx: { dry: true, flame: true, solidEnd: '#f6f3ec', solidConsume: 0.4, gas: { color: null, rate: 0.5, label: 'CO2', steam: true }, speed: 0.8, Tpeak: 200 },
    obs: ['The white powder bubbles slightly and loses mass. Water vapour condenses on cooler glass and CO₂ is released (limewater turns milky).', 'White sodium carbonate (washing soda ash) is left.'],
    why: ['Sodium hydrogencarbonate decomposes at around 100–200 °C: this is how baking powder makes cakes rise (CO₂ gas is trapped in the dough).'],
    deep: ['Unlike Na₂CO₃ (stable above 800 °C), NaHCO₃ contains the less stable HCO₃⁻ ion, which readily loses H₂O and CO₂ (ΔS° is very positive).'],
  });
  cur(['heat', 'nh4cl'], {
    title: 'Sublimation-like dissociation of ammonium chloride',
    types: ['Thermal dissociation', 'Reversible', 'Endothermic'],
    eq: 'NH4Cl(s) → NH3(g) + HCl(g)', dh: 176,
    fx: { dry: true, flame: true, solidEnd: '#f6f3ec', solidConsume: 0.8, gas: { color: null, rate: 0.4, label: 'NH3' }, fumes: { color: '#f2f2f2', amount: 0.8 }, speed: 0.8, Tpeak: 340 },
    obs: ['White fumes rise from the heated solid and a white deposit forms on the cooler upper part of the vessel.', 'On cooling the NH₃ and HCl recombine to NH₄Cl, so it looks like sublimation, which is how NH₄Cl is separated from sand or NaCl.'],
    why: ['Heating splits ammonium chloride into two gases. In the cooler part of the tube they meet again and re-form the solid. It is a reversible reaction, so it looks like the solid "sublimes".'],
    deep: ['NH₄Cl(s) ⇌ NH₃(g) + HCl(g), ΔH = +176 kJ/mol, ΔS = +285 J K⁻¹ mol⁻¹ (two gas molecules from a solid). A true sublimation would give gaseous NH₄Cl; here it is thermal dissociation followed by recombination.'],
  });
  cur([['heat', 'mg'], ['heat', 'mg', 'o2']], {
    title: 'Burning magnesium',
    types: ['Combustion', 'Redox', 'Exothermic'],
    eq: '2Mg(s) + O2(g) → 2MgO(s)', dh: -1203.6,
    fx: { dry: true, flame: true, solidEnd: '#f4f4f0', solidConsume: 0.2, flash: { color: '#ffffff', power: 1 }, sparks: true, speed: 1.3, Tpeak: 2200 },
    obs: ['The magnesium ribbon catches fire and burns with a dazzling white light.', 'A white powder, magnesium oxide, is formed (and a little grey-white Mg₃N₂ from the nitrogen of the air).'],
    why: ['Magnesium is oxidised (Mg → Mg²⁺ + 2e⁻) and oxygen is reduced (O₂ + 4e⁻ → 2O²⁻). The ionic lattice of MgO is extremely stable, so a lot of energy is released as heat and light.'],
    deep: ['ΔfH(MgO) = −601.6 kJ/mol; the very large lattice energy (≈ −3850 kJ/mol, with doubly charged ions) is why the reaction is so exothermic. The white light comes from incandescent MgO particles at over 2000 °C.'],
    safety: ['Never look directly at burning magnesium: the intense light and UV can damage the eyes.'],
  });
  cur([['cu', 'heat'], ['cu', 'heat', 'o2']], {
    title: 'Heating copper in air',
    types: ['Oxidation', 'Redox', 'Exothermic'],
    eq: '2Cu(s) + O2(g) → 2CuO(s)', dh: -314.6,
    fx: { dry: true, flame: true, solidFrom: '#b87333', solidEnd: '#1d1d1d', solidConsume: 0, speed: 0.8, Tpeak: 600 },
    obs: ['The shiny reddish-brown copper slowly turns black as a coating of copper(II) oxide forms.'],
    why: ['Hot copper reacts with oxygen of the air to form black CuO. The black oxide can be reduced back to copper by heating in hydrogen or carbon monoxide.'],
    deep: ['ΔH = 2 × ΔfH(CuO) = 2 × (−157.3) = −314.6 kJ. Above 1000 °C CuO decomposes to red Cu₂O. The oxide layer is slow to grow because Cu²⁺ and electrons must diffuse through it (parabolic oxidation).'],
  });
  cur([['fe', 'heat'], ['fe', 'heat', 'o2']], {
    title: 'Burning iron wool',
    types: ['Combustion', 'Redox', 'Exothermic'],
    eq: '3Fe(s) + 2O2(g) → Fe3O4(s)', dh: -1118.4,
    fx: { dry: true, flame: true, solidFrom: '#8a8d92', solidEnd: '#2a2a33', solidConsume: 0, sparks: true, speed: 1, Tpeak: 1100 },
    obs: ['Fine iron wool glows orange-red and throws off bright sparks (like a sparkler).', 'It turns into a dark blue-black solid, iron(II,III) oxide, and gains mass.'],
    why: ['A bar of iron will not burn, but finely divided iron has a huge surface area, so it burns readily. The mass rises because oxygen from the air is added to the metal.'],
    deep: ['Fe₃O₄ (magnetite) contains Fe²⁺ and Fe³⁺ in a 1:2 ratio. Combustion in pure O₂ is more vigorous. The mass gain demonstrates the conservation of mass (the product includes the oxygen).'],
  });
  cur([['ethanol', 'heat'], ['ethanol', 'heat', 'o2']], {
    title: 'Burning ethanol',
    types: ['Combustion', 'Redox', 'Exothermic'],
    eq: 'C2H5OH(l) + 3O2(g) → 2CO2(g) + 3H2O(l)', dh: -1367,
    fx: { burn: { color: '#69b4ff', size: 0.75 }, liq1: null, speed: 1, Tpeak: 600, consumeLiquid: true },
    obs: ['The ethanol vapour ignites with a pale blue, almost invisible flame. The liquid is gradually used up.', 'Water droplets form on a cold glass held above the flame, and CO₂ can be shown with limewater.'],
    why: ['Combustion is rapid reaction with oxygen. Ethanol carbon is oxidised to CO₂ and its hydrogen to water, releasing a large amount of energy. The blue flame means there is plenty of oxygen so the combustion is clean.'],
    deep: ['ΔcH°(C₂H₅OH, l) = −1367 kJ/mol, so the energy density is about 29.7 kJ/g. Compare with petrol (≈ 46 kJ/g). Ethanol is a fuel in "gasohol" blends and spirit burners.'],
    safety: ['Ethanol is highly flammable: no naked flames near bottles; burn only small amounts in a dish.'],
  });
  cur(['al', 'fe2o3', 'heat'], {
    title: 'The thermite reaction',
    types: ['Redox', 'Displacement', 'Exothermic'],
    eq: '2Al(s) + Fe2O3(s) → Al2O3(s) + 2Fe(l)', dh: -851.5,
    fx: { dry: true, flame: true, solidFrom: '#a2492a', solidEnd: '#4a4a4f', solidConsume: 0, flash: { color: '#ffd9a0', power: 1 }, sparks: true, glow: '#ffb347', speed: 1.1, Tpeak: 2500 },
    obs: ['After ignition (a magnesium fuse is needed) the mixture burns with a dazzling white-orange glow and showers of sparks.', 'Molten iron collects at the bottom (a white-hot liquid at about 2500 °C), with a slag of aluminium oxide above it.'],
    why: ['Aluminium is more reactive than iron, so it takes the oxygen from iron(III) oxide. So much energy is released that the iron produced is molten. It is used to weld railway tracks.'],
    deep: ['ΔH = ΔfH(Al₂O₃) − ΔfH(Fe₂O₃) = −1675.7 − (−824.2) = −851.5 kJ. The reaction has a high activation energy; once started it is self-sustaining. Using E°: Al³⁺/Al (−1.66 V) versus Fe³⁺/Fe (−0.04 V).'],
    safety: ['Thermite throws molten metal and sparks. Only performed outdoors by trained instructors.'],
  });
  cur(['h2o', 'heat'], {
    title: 'Boiling water',
    types: ['Phase change', 'Endothermic'],
    eq: 'H2O(l) → H2O(g)', dh: 40.7, noReactionLabel: 'physical change',
    fx: { boil: true, flame: true, liq1: undefined, speed: 1, Tpeak: 100, gas: { color: null, rate: 0.7, label: 'H2O', steam: true } },
    obs: ['Bubbles of vapour form, the water boils at 100 °C and steam escapes. The temperature stops rising while it boils.'],
    why: ['Heat is used to overcome the hydrogen bonds between water molecules (latent heat of vaporisation), not to raise the temperature. This is a physical change, not a chemical reaction.'],
    deep: ['ΔH(vap) = +40.7 kJ/mol at 100 °C. ΔS(vap) = ΔH/T = 40700/373 = 109 J K⁻¹ mol⁻¹, a good illustration of Trouton\'s rule (≈ 88 J K⁻¹ mol⁻¹, higher here because of hydrogen bonding).'],
  });

  // =========================================================== catalysis / peroxide
  const perox = {
    types: ['Decomposition', 'Catalysis', 'Redox', 'Exothermic'],
    eq: '2H2O2(aq) → 2H2O(l) + O2(g)', dh: -196.4,
    why: ['Hydrogen peroxide is thermodynamically unstable but decomposes very slowly. A catalyst provides an alternative path with a lower activation energy. The catalyst is not used up.'],
    deep: ['Disproportionation: oxygen is both oxidised (−1 → 0 in O₂) and reduced (−1 → −2 in H₂O). ΔH = −98.2 kJ per mole of H₂O₂. The catalyst lowers Eₐ from ≈ 75 kJ/mol (uncatalysed) to ≈ 56 kJ/mol (I⁻) or ≈ 25 kJ/mol (catalase, in living cells).'],
  };
  cur(['h2o2', 'mno2'], Object.assign({}, perox, {
    title: 'Catalytic decomposition of H₂O₂ (MnO₂)',
    catalyst: true,
    fx: { gas: { color: null, rate: 1, label: 'O2' }, solidConsume: 0, speed: 1.4, foam: { color: '#eef3f6', height: 0.5 }, fumes: { color: '#e8eef2', amount: 0.3 }, liq1: undefined },
    obs: ['Vigorous bubbling and frothing as oxygen gas is released; the beaker warms up and some steam appears.', 'The black MnO₂ is unchanged at the end (it is only a catalyst) and can be filtered off and re-used.', 'Test the gas: relights a glowing splint.'],
  }));
  cur(['h2o2', 'ki'], Object.assign({}, perox, {
    title: 'Iodide-catalysed decomposition of H₂O₂',
    catalyst: true,
    fx: { gas: { color: null, rate: 0.55, label: 'O2' }, speed: 1.1, liq1: '#d6a24a' },
    obs: ['The solution bubbles and turns yellow-brown as a little iodine forms during the catalytic cycle.', 'Add a few drops of starch and the colour turns blue-black.'],
    why: perox.why.concat('Iodide acts through a cycle: H₂O₂ + I⁻ → H₂O + IO⁻, then H₂O₂ + IO⁻ → H₂O + O₂ + I⁻. I⁻ is regenerated.'),
  }));
  cur(['fecl3', 'h2o2'], Object.assign({}, perox, {
    title: 'Fe³⁺-catalysed decomposition of H₂O₂',
    catalyst: true,
    fx: { gas: { color: null, rate: 0.45, label: 'O2' }, speed: 1, liq1: '#b5651d' },
    obs: ['The yellow-brown solution turns darker brown and bubbles steadily as O₂ is released.'],
  }));
  cur(['h2o2', 'h2so4', 'ki'], {
    title: 'Oxidation of iodide by hydrogen peroxide (acidic)',
    types: ['Redox'],
    eq: 'H2O2(aq) + 2KI(aq) + H2SO4(aq) → I2(aq) + K2SO4(aq) + 2H2O(l)',
    net: 'H2O2(aq) + 2I^-(aq) + 2H^+(aq) → I2(aq) + 2H2O(l)', dh: -247.4,
    dhNote: 'using ΔfH(H₂O₂, aq) = −191.2 and ΔfH(I₂, aq) = +22.6 kJ/mol',
    fx: { liq1: '#9c5a1c', speed: 1 },
    obs: ['The colourless solution turns yellow, then deep brown as iodine (I₂/I₃⁻) forms. Add starch to see a blue-black colour.'],
    why: ['In acid, H₂O₂ is a good oxidising agent and takes electrons from iodide ions: 2I⁻ → I₂ + 2e⁻. This reaction is the basis of the "iodine clock" experiments.'],
    deep: ['E°(H₂O₂/H₂O) = +1.78 V is far above E°(I₂/I⁻) = +0.54 V, so E°cell = +1.24 V. The rate depends on [H₂O₂][I⁻] (and [H⁺]), the classic rate-law experiment.'],
  });
  cur(['h2o2', 'h2so4', 'ki', 'starch'], {
    title: 'Starch–iodine test for iodine formed from H₂O₂ + I⁻',
    types: ['Redox', 'Complex formation'],
    eq: 'H2O2(aq) + 2KI(aq) + H2SO4(aq) → I2(aq) + K2SO4(aq) + 2H2O(l)',
    net: 'H2O2(aq) + 2I^-(aq) + 2H^+(aq) → I2(aq) + 2H2O(l)', dh: -247.4,
    dhNote: 'using ΔfH(H₂O₂, aq) = −191.2 and ΔfH(I₂, aq) = +22.6 kJ/mol',
    fx: { liq1: '#14153a', speed: 1 },
    obs: ['The solution quickly turns a deep blue-black: the starch–iodine complex.'],
    why: ['H₂O₂ oxidises I⁻ to I₂. Iodine (as I₃⁻) slips into the coil of the starch molecule (amylose) and gives an intense blue-black colour even at very low concentration.'],
    deep: ['The blue-black colour is a charge-transfer band of the I₅⁻ chain lined up inside the amylose helix. Add thiosulfate and the colour disappears (I₂ is reduced back to I⁻): the basis of an "iodine clock".'],
  });
  cur(['h2o2', 'ki', 'starch'], {
    title: 'Slow oxidation of iodide by H₂O₂ with starch',
    types: ['Redox', 'Complex formation'],
    eq: 'H2O2(aq) + 2KI(aq) → I2(aq) + 2KOH(aq)', dh: null,
    fx: { liq1: '#14153a', speed: 0.4 },
    obs: ['In neutral solution the colour change is slow, but the mixture gradually turns blue-black as iodine forms. Add acid and it will go fast.'],
    why: ['The same reaction as with acid, but without acid it is much slower (H⁺ is part of the rate law).'],
  });
  cur(['i2', 'starch'], {
    title: 'Starch–iodine test',
    types: ['Complex formation'],
    eq: 'I2(aq) + I^-(aq) ⇌ I3^-(aq)', dh: null,
    fx: { liq1: '#14153a', speed: 0.8 },
    obs: ['The yellow-brown iodine solution turns an intense blue-black on adding starch.'],
    why: ['Iodine in KI exists as I₃⁻. This ion fits inside the spiral of amylose (a starch component) and the complex absorbs yellow-orange light strongly, so the solution looks blue-black. It is the standard test for starch (or for iodine).'],
    deep: ['The colour disappears on heating (the complex breaks) and returns on cooling. The test is sensitive to about 10⁻⁵ M iodine.'],
  });
  cur(['i2', 'na2s2o3'], {
    title: 'Iodine + thiosulfate (iodometry)',
    types: ['Redox'],
    eq: 'I2(aq) + 2Na2S2O3(aq) → 2NaI(aq) + Na2S4O6(aq)',
    net: 'I2(aq) + 2S2O3^2-(aq) → 2I^-(aq) + S4O6^2-(aq)', dh: null,
    fx: { liq1: null, speed: 1.2 },
    obs: ['The brown iodine solution is instantly decolourised as I₂ is reduced to colourless I⁻.'],
    why: ['Thiosulfate is a mild reducing agent that gives its electrons to iodine, forming tetrathionate. This reaction is the basis of the iodometric titration used to measure oxidising agents like Cu²⁺, ClO⁻ or vitamin C.'],
    deep: ['2S₂O₃²⁻ → S₄O₆²⁻ + 2e⁻ (E° = +0.08 V) and I₂ + 2e⁻ → 2I⁻ (E° = +0.54 V), so E°cell = +0.46 V. The end point is sharpened with starch: the blue colour disappears.'],
  });

  // =========================================================== complexes, equilibria, redox with salts
  cur(['fecl3', 'kscn'], {
    title: 'Blood-red iron(III) thiocyanate complex',
    types: ['Complex formation', 'Equilibrium'],
    eq: 'FeCl3(aq) + KSCN(aq) ⇌ [Fe(SCN)]Cl2(aq) + KCl(aq)',
    net: 'Fe^3+(aq) + SCN^-(aq) ⇌ [Fe(SCN)]^2+(aq)', dh: null,
    fx: { liq1: '#a3141b', speed: 0.9 },
    obs: ['The pale yellow solution immediately turns a deep blood-red as the complex ion forms.', 'Add more Fe³⁺ or SCN⁻ and the colour deepens; add something that removes Fe³⁺ (fluoride, oxalate) and the colour fades.'],
    why: ['Fe³⁺ (a Lewis acid) accepts a lone pair from the thiocyanate ion to form the complex [Fe(SCN)(H₂O)₅]²⁺. The reaction is an equilibrium, so it is the standard demonstration of Le Chatelier\'s principle.'],
    deep: ['K ≈ 10² (very roughly) so the equilibrium mixture contains both free ions and complex. The colour is a ligand-to-metal charge-transfer (LMCT) band, which is intense (ε ≈ 5000 M⁻¹cm⁻¹), so even micromolar concentrations are visible: this is a sensitive test for Fe³⁺.'],
  });
  cur([['cuso4h', 'nh3'], ['cuso4a', 'nh3']], {
    title: 'Deep-blue tetraamminecopper(II)',
    types: ['Complex formation', 'Precipitation then re-dissolution'],
    eq: 'CuSO4(aq) + 4NH3(aq) → [Cu(NH3)4]SO4(aq)',
    net: 'Cu^2+(aq) + 4NH3(aq) → [Cu(NH3)4]^2+(aq)', dh: null,
    fx: { ppt: { color: '#79aef0', amount: 0.8, redissolve: true }, liq1: '#1b3bbf', speed: 1 },
    obs: ['A few drops of ammonia give a pale blue precipitate of Cu(OH)₂.', 'With more ammonia the precipitate dissolves to give an intense, deep (inky) blue solution of [Cu(NH₃)₄]²⁺.'],
    why: ['First the small concentration of OH⁻ in ammonia precipitates Cu(OH)₂. Then excess NH₃ (a better ligand than water) replaces the water ligands and forms the soluble, deep-blue complex ion, which pulls Cu²⁺ out of the precipitate.'],
    deep: ['Cu²⁺ + 2NH₃ + 2H₂O → Cu(OH)₂ + 2NH₄⁺, then Cu(OH)₂ + 4NH₃ → [Cu(NH₃)₄]²⁺ + 2OH⁻. Kf ≈ 1.1×10¹³. NH₃ is a stronger field ligand than H₂O, so the d–d transition moves to higher energy and the colour shifts from pale blue to deep blue.'],
  });
  cur(['cuso4h', 'ki'], {
    title: 'Copper(II) + iodide: CuI and iodine',
    types: ['Redox', 'Precipitation'],
    eq: '2CuSO4(aq) + 4KI(aq) → 2CuI(s) + I2(aq) + 2K2SO4(aq)',
    net: '2Cu^2+(aq) + 4I^-(aq) → 2CuI(s) + I2(aq)', dh: null,
    fx: { ppt: { color: '#e5dac2', amount: 0.8 }, liq1: '#9c5a1c', speed: 1 },
    obs: ['The blue solution turns brown instantly (iodine) and an off-white precipitate of copper(I) iodide forms.', 'Titrate the iodine with thiosulfate to find the amount of copper (iodometry).'],
    why: ['Cu²⁺ is a mild oxidising agent. It takes an electron from iodide to give Cu⁺, and because CuI is so insoluble the reaction is pulled forward. Two iodide ions are oxidised to I₂.'],
    deep: ['E°(Cu²⁺/Cu⁺) = +0.15 V is below E°(I₂/I⁻) = +0.54 V, so the reaction would not go with soluble Cu⁺. With CuI (Ksp ≈ 1.1×10⁻¹²) the effective E°(Cu²⁺/CuI) rises to ≈ +0.86 V, making the reaction spontaneous.'],
  });
  cur(['fecl3', 'ki'], {
    title: 'Iron(III) oxidises iodide',
    types: ['Redox'],
    eq: '2FeCl3(aq) + 2KI(aq) → 2FeCl2(aq) + I2(aq) + 2KCl(aq)',
    net: '2Fe^3+(aq) + 2I^-(aq) → 2Fe^2+(aq) + I2(aq)', dh: null,
    fx: { liq1: '#7a4a1e', speed: 1 },
    obs: ['The yellow-brown solution darkens to deep brown as iodine forms. (Add starch to confirm: blue-black.)'],
    why: ['Fe³⁺ is a stronger oxidising agent than I₂ so it takes electrons from I⁻: 2Fe³⁺ + 2I⁻ → 2Fe²⁺ + I₂.'],
    deep: ['E°cell = E°(Fe³⁺/Fe²⁺) − E°(I₂/I⁻) = 0.77 − 0.54 = +0.23 V, so ΔG° = −2 × 96485 × 0.23 = −44 kJ. This is a useful reminder that a reaction can be spontaneous even when its enthalpy is small or positive: the driving force is mostly entropy here.'],
  });
  cur(['fecl3', 'na2s'], {
    title: 'Iron(III) chloride + sulfide',
    types: ['Redox', 'Precipitation'],
    eq: '2FeCl3(aq) + 3Na2S(aq) → 2FeS(s) + S(s) + 6NaCl(aq)',
    dh: null,
    fx: { ppt: { color: '#1c1c1c', amount: 1 }, liq1: null, speed: 1 },
    obs: ['A black precipitate of FeS forms at once. It contains pale yellow sulfur because Fe³⁺ also oxidises some of the sulfide.'],
    why: ['Fe³⁺ oxidises S²⁻ to sulfur and is itself reduced to Fe²⁺, which then precipitates as black FeS.'],
  });

  // =========================================================== permanganate and dichromate
  cur(['h2o2', 'h2so4', 'kmno4'], {
    title: 'Permanganate and hydrogen peroxide',
    types: ['Redox', 'Gas evolution', 'Exothermic'],
    eq: '2KMnO4(aq) + 5H2O2(aq) + 3H2SO4(aq) → K2SO4(aq) + 2MnSO4(aq) + 5O2(g) + 8H2O(l)',
    net: '2MnO4^-(aq) + 5H2O2(aq) + 6H^+(aq) → 2Mn^2+(aq) + 5O2(g) + 8H2O(l)', dh: -689.2,
    dhNote: 'using ΔfH(MnO₄⁻) = −541.4, Mn²⁺ = −220.8, H₂O₂(aq) = −191.2 kJ/mol',
    fx: { liq1: null, gas: { color: null, rate: 0.85, label: 'O2' }, speed: 1 },
    obs: ['The deep purple colour of MnO₄⁻ disappears and the solution becomes colourless as it is reduced to nearly colourless Mn²⁺.', 'Oxygen gas bubbles out; the mixture warms. The first drops react slowly, then faster because Mn²⁺ catalyses the reaction (autocatalysis).'],
    why: ['In acid, permanganate is a very strong oxidising agent. It takes electrons from H₂O₂ (which acts as a reducing agent here) and is reduced from Mn(VII) (purple) to Mn(II) (pale pink, almost colourless).'],
    deep: ['MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O (E° = +1.51 V); H₂O₂ → O₂ + 2H⁺ + 2e⁻ (E° = +0.70 V). E°cell = +0.81 V. MnO₄⁻ is its own indicator in titrations: the first permanent faint pink colour marks the end point.'],
  });
  cur(['feso4', 'h2so4', 'kmno4'], {
    title: 'Permanganate titration of iron(II)',
    types: ['Redox', 'Exothermic'],
    eq: '2KMnO4(aq) + 10FeSO4(aq) + 8H2SO4(aq) → K2SO4(aq) + 2MnSO4(aq) + 5Fe2(SO4)3(aq) + 8H2O(l)',
    net: 'MnO4^-(aq) + 5Fe^2+(aq) + 8H^+(aq) → Mn^2+(aq) + 5Fe^3+(aq) + 4H2O(l)', dh: -619.6,
    dhNote: 'using ΔfH(MnO₄⁻) = −541.4, Mn²⁺ = −220.8, Fe²⁺ = −89.1, Fe³⁺ = −48.5 kJ/mol',
    fx: { liq1: '#e6c66c', speed: 1.1 },
    obs: ['The purple permanganate is decolourised as soon as it touches the pale green Fe²⁺ solution. The solution turns pale yellow (Fe³⁺).', 'When all the Fe²⁺ is used up, the next drop gives a permanent pink colour: the end point of the titration.'],
    why: ['Acidified permanganate oxidises Fe²⁺ to Fe³⁺ and is itself reduced to Mn²⁺. It needs no external indicator because the purple reagent changes colour itself.'],
    deep: ['E°cell = 1.51 − 0.77 = +0.74 V. n = 5 electrons per MnO₄⁻ so the stoichiometry is 1 MnO₄⁻ : 5 Fe²⁺. Use H₂SO₄ (not HCl) for the acid: Cl⁻ would be oxidised by permanganate.'],
  });
  cur(['feso4', 'h2so4', 'k2cr2o7'], {
    title: 'Dichromate oxidises iron(II)',
    types: ['Redox', 'Exothermic'],
    eq: 'K2Cr2O7(aq) + 6FeSO4(aq) + 7H2SO4(aq) → K2SO4(aq) + Cr2(SO4)3(aq) + 3Fe2(SO4)3(aq) + 7H2O(l)',
    net: 'Cr2O7^2-(aq) + 6Fe^2+(aq) + 14H^+(aq) → 2Cr^3+(aq) + 6Fe^3+(aq) + 7H2O(l)', dh: -778.7,
    dhNote: 'using ΔfH(Cr₂O₇²⁻) = −1490.3 and Cr³⁺ = −256 kJ/mol',
    fx: { liq1: '#4c8f4a', speed: 1.1 },
    obs: ['The orange dichromate solution turns green as Cr³⁺ forms (together with the yellow Fe³⁺).'],
    why: ['In acid, orange dichromate is a strong oxidising agent. It takes electrons from Fe²⁺ and is reduced to green Cr³⁺. The orange-to-green colour change is the classic redox demonstration.'],
    deep: ['Cr₂O₇²⁻ + 14H⁺ + 6e⁻ → 2Cr³⁺ + 7H₂O (E° = +1.33 V); E°cell = 1.33 − 0.77 = +0.56 V. A redox indicator such as diphenylamine is needed in titrations because the colour change is not sharp.'],
  });
  cur(['ethanol', 'h2so4', 'k2cr2o7'], {
    title: 'Breathalyser: dichromate + ethanol',
    types: ['Redox', 'Organic oxidation', 'Exothermic'],
    eq: '2K2Cr2O7(aq) + 3C2H5OH(l) + 8H2SO4(aq) → 2K2SO4(aq) + 2Cr2(SO4)3(aq) + 3CH3COOH(aq) + 11H2O(l)',
    dh: null,
    fx: { liq1: '#4c8f4a', speed: 0.9 },
    obs: ['The orange solution slowly turns green (warming helps) as ethanol is oxidised, first to ethanal and then to ethanoic (acetic) acid; you may smell vinegar.'],
    why: ['Acidified dichromate oxidises primary alcohols: orange Cr₂O₇²⁻ → green Cr³⁺. The early breathalysers used this colour change to detect ethanol in the breath.'],
    deep: ['Overall: Cr(VI) is reduced by 3 electrons each; each ethanol loses 4 electrons (C₂H₅OH → CH₃COOH). Hence 2 Cr₂O₇²⁻ : 3 C₂H₅OH. Under controlled conditions (distil off the aldehyde) the product is ethanal.'],
  });
  cur(['ethanol', 'h2so4', 'kmno4'], {
    title: 'Permanganate oxidises ethanol',
    types: ['Redox', 'Organic oxidation', 'Exothermic'],
    eq: '4KMnO4(aq) + 5C2H5OH(l) + 6H2SO4(aq) → 2K2SO4(aq) + 4MnSO4(aq) + 5CH3COOH(aq) + 11H2O(l)',
    net: '4MnO4^-(aq) + 5C2H5OH(l) + 12H^+(aq) → 4Mn^2+(aq) + 5CH3COOH(aq) + 11H2O(l)', dh: null,
    fx: { liq1: null, speed: 1 },
    obs: ['The purple colour of permanganate fades to colourless as ethanol is oxidised to ethanoic acid.'],
    why: ['Acidified KMnO₄ oxidises primary alcohols all the way to carboxylic acids, and purple MnO₄⁻ is reduced to almost colourless Mn²⁺.'],
  });
  cur(['h2so4', 'ki', 'kmno4'], {
    title: 'Permanganate oxidises iodide',
    types: ['Redox', 'Exothermic'],
    eq: '2KMnO4(aq) + 10KI(aq) + 8H2SO4(aq) → 6K2SO4(aq) + 2MnSO4(aq) + 5I2(aq) + 8H2O(l)',
    net: '2MnO4^-(aq) + 10I^-(aq) + 16H^+(aq) → 2Mn^2+(aq) + 5I2(aq) + 8H2O(l)', dh: null,
    fx: { liq1: '#7a3d12', speed: 1.1 },
    obs: ['The purple solution turns deep brown as iodine is produced (the purple fades away).'],
    why: ['Permanganate is a very powerful oxidising agent; in acid it oxidises iodide ions to iodine and is reduced to Mn²⁺.'],
  });
  cur(['h2so4', 'k2cr2o7', 'ki'], {
    title: 'Dichromate oxidises iodide',
    types: ['Redox', 'Exothermic'],
    eq: 'K2Cr2O7(aq) + 6KI(aq) + 7H2SO4(aq) → 4K2SO4(aq) + Cr2(SO4)3(aq) + 3I2(aq) + 7H2O(l)',
    net: 'Cr2O7^2-(aq) + 6I^-(aq) + 14H^+(aq) → 2Cr^3+(aq) + 3I2(aq) + 7H2O(l)', dh: null,
    fx: { liq1: '#6c5a22', speed: 1 },
    obs: ['The orange solution turns dark olive-brown: green Cr³⁺ mixed with brown iodine.'],
    why: ['Acidified dichromate oxidises iodide to iodine, and orange Cr(VI) is reduced to green Cr(III). The green + brown mixture looks dark olive.'],
  });
  const chromate = (id, eq, net) => cur(['k2cr2o7', id], {
    title: 'Chromate–dichromate equilibrium',
    types: ['Acid–base', 'Equilibrium', 'Colour change'],
    eq, net, dh: null,
    fx: { liq1: '#f2d02a', speed: 1 },
    obs: ['The orange solution turns yellow as dichromate changes into chromate. Add acid and the orange colour returns.'],
    why: ['In alkaline solution the orange dichromate ion changes into the yellow chromate ion: Cr₂O₇²⁻ + 2OH⁻ ⇌ 2CrO₄²⁻ + H₂O. Adding acid reverses it. It is a classic example of Le Chatelier\'s principle with a colour change.'],
    deep: ['Both ions contain Cr(VI) so it is not a redox reaction. It is an acid–base reaction: 2CrO₄²⁻ + 2H⁺ ⇌ Cr₂O₇²⁻ + H₂O (pK ≈ 14.6).'],
  });
  chromate('koh', 'K2Cr2O7(aq) + 2KOH(aq) → 2K2CrO4(aq) + H2O(l)', 'Cr2O7^2-(aq) + 2OH^-(aq) → 2CrO4^2-(aq) + H2O(l)');
  chromate('naoh', 'K2Cr2O7(aq) + 2NaOH(aq) → K2CrO4(aq) + Na2CrO4(aq) + H2O(l)', 'Cr2O7^2-(aq) + 2OH^-(aq) → 2CrO4^2-(aq) + H2O(l)');

  // =========================================================== concentrated sulfuric acid
  cur(['h2so4c', 'sugar'], {
    title: 'Dehydration of sugar by conc. H₂SO₄',
    types: ['Dehydration', 'Exothermic', 'Redox'],
    eq: 'C12H22O11(s) → 12C(s) + 11H2O(l)', dh: -917.7,
    dhNote: 'for the dehydration alone; the strong heating comes mostly from H₂SO₄ taking up the water (≈ −95 kJ/mol)',
    condition: 'conc. H2SO4',
    fx: { foam: { color: '#161616', height: 1 }, fumes: { color: '#e9edf0', amount: 0.9 }, solidFrom: '#f7f3ea', solidEnd: '#161616', solidConsume: 0, speed: 1.1, Tpeak: 150, liq1: undefined },
    obs: ['The white sugar quickly turns yellow, brown, then black.', 'A black porous column of carbon rises out of the beaker like a snake, with a lot of steam and a smell of caramel and burnt sugar.', 'The beaker becomes very hot. Some sulfur dioxide and carbon oxides are also formed.'],
    why: ['Concentrated H₂SO₄ is a powerful dehydrating agent: it takes the H and O out of the sugar in the ratio 2:1 (as water), leaving black carbon. The carbon column puffs up because steam and gases are trapped in it.'],
    deep: ['C₁₂H₂₂O₁₁ = C₁₂(H₂O)₁₁: a "hydrate of carbon". The reaction is thermodynamically driven by the strong exothermic hydration of H₂SO₄ (ΔH ≈ −95 kJ per mol of H₂SO₄). Some carbon is further oxidised: C + 2H₂SO₄ → CO₂ + 2SO₂ + 2H₂O.'],
    safety: ['Concentrated acid, steam, SO₂. Teacher demonstration in a fume cupboard; very hot.'],
  });
  cur(['h2o', 'h2so4c'], {
    title: 'Diluting concentrated sulfuric acid',
    types: ['Dissolution (dilution)', 'Exothermic'],
    eq: 'H2SO4(l) → 2H^+(aq) + SO4^2-(aq)', dh: -95.3,
    fx: { boil: true, fumes: { color: '#e9edf0', amount: 0.4 }, liq1: undefined, speed: 1.2, Tpeak: 90 },
    obs: ['The mixture becomes very hot (it can boil and spatter). Hydration of the ions releases a large amount of heat.'],
    why: ['Water molecules strongly hydrate H⁺ and SO₄²⁻, releasing a lot of energy. Always add acid to water slowly, never water to acid: the dense acid sinks and the heat is spread through the water instead of boiling a small drop of water.'],
    deep: ['ΔH(solution) of H₂SO₄(l) to infinite dilution = −95.3 kJ/mol (to first 2H⁺ + SO₄²⁻). The enthalpy change depends strongly on the final concentration.'],
    safety: ['Always add acid to water, never water to acid.'],
  });
  cur(['h2so4c', 'nacl'], {
    title: 'Making HCl gas from salt',
    types: ['Gas evolution', 'Acid + salt'],
    eq: 'NaCl(s) + H2SO4(l) → NaHSO4(s) + HCl(g)', dh: null,
    fx: { gas: { color: null, rate: 0.5, label: 'HCl' }, fumes: { color: '#e9edf0', amount: 0.8 }, liq1: undefined, speed: 1, solidConsume: 0.7 },
    obs: ['Steamy white fumes of HCl gas appear as it meets moisture in the air. Hold a drop of ammonia solution near: dense white NH₄Cl smoke.'],
    why: ['A strong non-volatile acid displaces a more volatile acid from its salt: HCl is a gas and escapes. Cl⁻ is too weak a reducing agent to be oxidised by H₂SO₄, so only HCl forms (unlike Br⁻ and I⁻).'],
    deep: ['Industrially this is the "salt-cake" method of making HCl and Na₂SO₄. At higher temperature the second step NaHSO₄ + NaCl → Na₂SO₄ + HCl occurs.'],
    safety: ['HCl gas is corrosive and choking. Fume cupboard.'],
  });
  cur(['h2so4c', 'kbr'], {
    title: 'Conc. H₂SO₄ oxidises bromide',
    types: ['Redox', 'Gas evolution'],
    eq: '2KBr(s) + 3H2SO4(l) → 2KHSO4(s) + Br2(g) + SO2(g) + 2H2O(l)', dh: null,
    fx: { gas: { color: '#a0451c', rate: 0.6, label: 'Br2' }, fumes: { color: '#a0451c', amount: 0.8 }, liq1: '#c26a2c', speed: 1, solidConsume: 0.8 },
    obs: ['Red-brown fumes of bromine and a choking smell of SO₂. The mixture turns orange-brown.'],
    why: ['Br⁻ is a stronger reducing agent than Cl⁻. Concentrated H₂SO₄ first makes HBr, then oxidises it to brown Br₂ and itself is reduced to SO₂.'],
    deep: ['The reducing power of the halides increases down the group: Cl⁻ (not oxidised), Br⁻ (→ Br₂, SO₂), I⁻ (→ I₂, mainly S and H₂S). This trend explains why bromine and iodine cannot be made by the salt-cake method.'],
    safety: ['Bromine vapour and SO₂ are toxic. Fume cupboard only.'],
  });
  cur(['h2so4c', 'ki'], {
    title: 'Conc. H₂SO₄ oxidises iodide',
    types: ['Redox', 'Gas evolution'],
    eq: '8KI(s) + 9H2SO4(l) → 8KHSO4(s) + 4I2(s) + H2S(g) + 4H2O(l)', dh: null,
    fx: { gas: { color: null, rate: 0.5, label: 'H2S' }, fumes: { color: '#6a2a8a', amount: 0.8 }, ppt: { color: '#3a2a4a', amount: 0.7 }, liq1: '#4a2c58', speed: 1, solidConsume: 0.8 },
    obs: ['Violet fumes of iodine, a black-purple solid I₂, and the rotten-egg smell of H₂S. Yellow sulfur may also form.'],
    why: ['Iodide is the strongest halide reducing agent. It reduces concentrated H₂SO₄ all the way to H₂S (and S), while being oxidised to I₂.'],
    safety: ['H₂S and iodine vapour are toxic. Fume cupboard only.'],
  });
  cur(['cu', 'h2so4c', 'heat'], {
    title: 'Hot conc. H₂SO₄ + copper',
    types: ['Redox', 'Gas evolution'],
    eq: 'Cu(s) + 2H2SO4(l) → CuSO4(aq) + SO2(g) + 2H2O(l)', dh: null,
    fx: { flame: true, gas: { color: null, rate: 0.6, label: 'SO2' }, liq1: '#2f7fd8', metalStrip: true, speed: 0.7, Tpeak: 180 },
    obs: ['On heating, the copper dissolves, giving a blue solution and a choking gas (SO₂) that turns acidified dichromate paper green.'],
    why: ['Concentrated H₂SO₄ is an oxidising acid: sulfur(VI) is reduced to SO₂. That is why it can dissolve copper, which is unreactive towards dilute acid.'],
  });
  cur(['cuso4a', 'h2o'], {
    title: 'Hydration of anhydrous copper sulfate',
    types: ['Hydration', 'Exothermic'],
    eq: 'CuSO4(s) + 5H2O(l) → CuSO4·5H2O(s)', dh: -79.3,
    fx: { solidFrom: '#f2f2ee', solidEnd: '#2f7fd8', solidConsume: 0, liq1: '#a9c9f2', speed: 1 },
    obs: ['The white powder turns bright blue and the container becomes warm (this is the standard test for water).'],
    why: ['Water molecules bond to the Cu²⁺ ions as ligands, forming the blue hydrated ion [Cu(H₂O)₄]²⁺. The bonding releases heat.'],
    deep: ['ΔH = ΔfH(CuSO₄·5H₂O) − ΔfH(CuSO₄) − 5ΔfH(H₂O, l) = −2279.7 + 771.4 + 1429 = −79.3 kJ.'],
  });
  cur(['fe', 'h2o', 'o2'], {
    title: 'Rusting of iron',
    types: ['Corrosion', 'Redox', 'Exothermic'], timelapse: true,
    eq: '4Fe(s) + 3O2(g) + 6H2O(l) → 4Fe(OH)3(s)', dh: -1577.2,
    fx: { solidFrom: '#8a8d92', solidEnd: '#a6532a', solidConsume: 0, ppt: { color: '#b5522a', amount: 0.45 }, liq1: '#ecd0a8', speed: 0.35 },
    obs: ['In real life, rusting takes days to weeks (this animation is a time-lapse): the bright iron turns reddish-brown and flaky.', 'Both oxygen and water are required; salt in the water speeds it up.'],
    why: ['Iron acts as the anode (Fe → Fe²⁺ + 2e⁻), oxygen is reduced at the cathode (O₂ + 2H₂O + 4e⁻ → 4OH⁻) and the Fe²⁺ is further oxidised to the hydrated Fe(III) oxide we call rust (Fe₂O₃·xH₂O).'],
    deep: ['Rusting is electrochemical corrosion. E°(O₂/OH⁻) = +0.40 V vs E°(Fe²⁺/Fe) = −0.44 V gives E°cell = +0.84 V. Protection: painting, galvanising (Zn is the sacrificial anode), cathodic protection.'],
  });
  cur(['caco3', 'co2', 'h2o'], {
    title: 'Limestone dissolving in carbonated water',
    types: ['Acid–base', 'Dissolution'],
    eq: 'CaCO3(s) + CO2(g) + H2O(l) → Ca(HCO3)2(aq)', dh: -39.9,
    fx: { solidConsume: 0.8, liq1: undefined, speed: 0.35, gas: null },
    obs: ['The insoluble white marble slowly dissolves in the CO₂-saturated water. It is how caves and stalactites form (the reverse reaction deposits CaCO₃).'],
    why: ['CO₂ dissolves in water to give weak carbonic acid, which converts insoluble CaCO₃ into soluble calcium hydrogencarbonate, the cause of temporary hard water.'],
  });
  const amph = (metal, base, eq, label) => cur([metal, base], {
    title: label,
    types: ['Redox', 'Amphoteric metal', 'Gas evolution'],
    eq, dh: null,
    fx: { gas: { color: null, rate: 0.8, label: 'H2' }, metalStrip: true, liq1: null, speed: 0.7 },
    obs: ['The metal dissolves with steady fizzing as hydrogen is released: it behaves as if in an acid, even though the solution is alkaline.', 'Test the gas: a lighted splint gives a squeaky pop.'],
    why: ['Aluminium and zinc are amphoteric: they react with both acids and strong alkalis. In alkali they form soluble hydroxo complexes ([Al(OH)₄]⁻ aluminate, [Zn(OH)₄]²⁻ zincate) and hydrogen.'],
    deep: ['Al + 3H₂O + OH⁻ → [Al(OH)₄]⁻ + 3/2 H₂. Hydroxide removes the protective oxide layer (Al₂O₃ + 2OH⁻ + 3H₂O → 2[Al(OH)₄]⁻) and the metal itself reduces water. Used in drain cleaners (NaOH + Al powder) to produce heat and gas.'],
  });
  amph('al', 'naoh', '2Al(s) + 2NaOH(aq) + 6H2O(l) → 2Na[Al(OH)4](aq) + 3H2(g)', 'Aluminium in sodium hydroxide');
  amph('al', 'koh', '2Al(s) + 2KOH(aq) + 6H2O(l) → 2K[Al(OH)4](aq) + 3H2(g)', 'Aluminium in potassium hydroxide');
  amph('zn', 'naoh', 'Zn(s) + 2NaOH(aq) + 2H2O(l) → Na2[Zn(OH)4](aq) + H2(g)', 'Zinc in sodium hydroxide');
  amph('zn', 'koh', 'Zn(s) + 2KOH(aq) + 2H2O(l) → K2[Zn(OH)4](aq) + H2(g)', 'Zinc in potassium hydroxide');
})();
