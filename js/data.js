/* Lab Visuals: chemistry data tables.
   Thermodynamic values are standard enthalpies of formation (kJ/mol, 298 K) from common
   textbook tables (aqueous ions: 1 M standard state). Formulas use ^ for charges (Cu^2+). */
(function () {
  'use strict';
  const C = (globalThis.Chem = globalThis.Chem || {});

  // ---------------------------------------------------------------- ions
  // f: formula used inside compounds, d: display with charge, z: |charge|, poly: needs brackets
  // dhf: standard enthalpy of formation of the aqueous ion, pc: particle colour, col: solution colour
  const ION = {
    H:   { f: 'H',  d: 'H^+',   z: 1, dhf: 0,      pc: '#ef5350' },
    Na:  { f: 'Na', d: 'Na^+',  z: 1, dhf: -240.1, pc: '#7e57c2' },
    K:   { f: 'K',  d: 'K^+',   z: 1, dhf: -252.4, pc: '#ab47bc' },
    Ag:  { f: 'Ag', d: 'Ag^+',  z: 1, dhf: 105.6,  pc: '#b0bec5' },
    Ba:  { f: 'Ba', d: 'Ba^2+', z: 2, dhf: -537.6, pc: '#26a69a' },
    Ca:  { f: 'Ca', d: 'Ca^2+', z: 2, dhf: -542.8, pc: '#66bb6a' },
    Mg:  { f: 'Mg', d: 'Mg^2+', z: 2, dhf: -466.9, pc: '#ffa726' },
    Al:  { f: 'Al', d: 'Al^3+', z: 3, dhf: -531.0, pc: '#bdbdbd' },
    Zn:  { f: 'Zn', d: 'Zn^2+', z: 2, dhf: -153.9, pc: '#8d9eb2' },
    Pb:  { f: 'Pb', d: 'Pb^2+', z: 2, dhf: -1.7,   pc: '#546e7a' },
    Cu:  { f: 'Cu', d: 'Cu^2+', z: 2, dhf: 64.8,   pc: '#1e88e5', col: '#2f7fd8' },
    Fe2: { f: 'Fe', d: 'Fe^2+', z: 2, dhf: -89.1,  pc: '#9ccc65', col: '#b9dbb0' },
    Fe3: { f: 'Fe', d: 'Fe^3+', z: 3, dhf: -48.5,  pc: '#f9a825', col: '#d9a13a' },
    NH4: { f: 'NH4', d: 'NH4^+', z: 1, dhf: -132.5, pc: '#4dd0e1', poly: true },
    Cl:  { f: 'Cl', d: 'Cl^-',  z: 1, dhf: -167.2, pc: '#43a047' },
    Br:  { f: 'Br', d: 'Br^-',  z: 1, dhf: -121.6, pc: '#8d6e63' },
    I:   { f: 'I',  d: 'I^-',   z: 1, dhf: -55.2,  pc: '#7b1fa2' },
    S:   { f: 'S',  d: 'S^2-',  z: 2, dhf: 33.1,   pc: '#455a64' },
    NO3: { f: 'NO3', d: 'NO3^-', z: 1, dhf: -205.0, pc: '#fdd835', poly: true },
    SO4: { f: 'SO4', d: 'SO4^2-', z: 2, dhf: -909.3, pc: '#ffb300', poly: true },
    CO3: { f: 'CO3', d: 'CO3^2-', z: 2, dhf: -677.1, pc: '#8d6e63', poly: true },
    HCO3:{ f: 'HCO3', d: 'HCO3^-', z: 1, dhf: -692.0, pc: '#a1887f', poly: true },
    OH:  { f: 'OH', d: 'OH^-',  z: 1, dhf: -230.0, pc: '#ec407a', poly: true },
    CH3COO: { f: 'CH3COO', d: 'CH3COO^-', z: 1, dhf: -486.0, pc: '#ff8a65', poly: true },
    SCN: { f: 'SCN', d: 'SCN^-', z: 1, dhf: 76.4,   pc: '#00acc1', poly: true },
    S2O3:{ f: 'S2O3', d: 'S2O3^2-', z: 2, dhf: -648.5, pc: '#9e9d24', poly: true },
    MnO4:{ f: 'MnO4', d: 'MnO4^-', z: 1, dhf: -541.4, pc: '#8e24aa', poly: true, col: '#9b1fa8' },
    Cr2O7:{ f: 'Cr2O7', d: 'Cr2O7^2-', z: 2, dhf: -1490.3, pc: '#fb8c00', poly: true, col: '#f28c28' },
  };

  // ---------------------------------------------------------------- insoluble / slightly soluble compounds
  // key "cation|anion". dhf: solid, ksp (25 C, approximate textbook values)
  const PPT = {
    'Ag|Cl':  { color: '#f2f2f2', name: 'silver chloride', dhf: -127.0, ksp: 1.8e-10, note: 'White curdy precipitate. It dissolves in dilute NH3 (as [Ag(NH3)2]+) and darkens in sunlight, which is why it is used in photography.' },
    'Ag|Br':  { color: '#f0e6a8', name: 'silver bromide', dhf: -100.4, ksp: 5.4e-13, note: 'Pale cream precipitate. It dissolves only in concentrated NH3.' },
    'Ag|I':   { color: '#f1dd3c', name: 'silver iodide', dhf: -61.8, ksp: 8.5e-17, note: 'Yellow precipitate. It does not dissolve even in concentrated NH3. The Cl-/Br-/I- sequence is a classic test.' },
    'Ag|CO3': { color: '#eadf9a', name: 'silver carbonate', dhf: -505.8, ksp: 8.5e-12, note: 'Pale yellow solid that turns brown (Ag2O) on warming.' },
    'Ag|S':   { color: '#1b1b1b', name: 'silver sulfide', dhf: -32.6, ksp: 6e-50, note: 'Jet-black precipitate. The same compound tarnishes silver ornaments.' },
    'Ag|SCN': { color: '#f6f6f6', name: 'silver thiocyanate', dhf: null, ksp: 1.0e-12, note: 'White precipitate (used in Volhard titration of Ag+ or Cl-).' },
    'Ag|S2O3':{ color: '#f4f4f4', name: 'silver thiosulfate', dhf: null, ksp: null, note: 'White at first, then yellow, brown and finally black as it decomposes to Ag2S. Excess thiosulfate dissolves it (photographic fixing).' },
    'Ag|OH':  { color: '#7a5230', name: 'silver(I) oxide', dhf: -31.1, ksp: null, oxide: 'Ag2O', note: 'Brown precipitate of Ag2O (AgOH is unstable). It dissolves in excess ammonia to give [Ag(NH3)2]+.' },
    'Ag|SO4': { color: '#f5f5f5', name: 'silver sulfate', dhf: -715.9, ksp: 1.2e-5, slight: true, note: 'Only slightly soluble: forms a thin white precipitate from concentrated solutions.' },
    'Ba|SO4': { color: '#fafafa', name: 'barium sulfate', dhf: -1473.2, ksp: 1.1e-10, note: 'Dense white precipitate that does NOT dissolve in dilute acid: the standard test for sulfate ions (and the "barium meal" used in X-ray imaging).' },
    'Ba|CO3': { color: '#f4f4f4', name: 'barium carbonate', dhf: -1216.3, ksp: 2.6e-9, note: 'White precipitate. Unlike BaSO4 it dissolves in dilute acid with effervescence of CO2.' },
    'Ca|CO3': { color: '#f5f5f0', name: 'calcium carbonate', dhf: -1207.6, ksp: 3.4e-9, note: 'White chalky precipitate, the same compound as limestone, marble and shells.' },
    'Ca|SO4': { color: '#f2f2f0', name: 'calcium sulfate', dhf: -1434.5, ksp: 4.9e-5, slight: true, note: 'Slightly soluble: appears only from fairly concentrated solutions (this is what makes water permanently hard).' },
    'Ca|OH':  { color: '#f2f2f2', name: 'calcium hydroxide', dhf: -986.1, ksp: 5.0e-6, slight: true, note: 'Slightly soluble: gives a cloudy white suspension (milk of lime).' },
    'Mg|OH':  { color: '#f4f4f4', name: 'magnesium hydroxide', dhf: -924.5, ksp: 5.6e-12, note: 'White precipitate (milk of magnesia is a suspension of it). It is NOT amphoteric, so excess NaOH does not dissolve it.' },
    'Al|OH':  { color: '#eeeeee', name: 'aluminium hydroxide', dhf: -1277.0, ksp: 3e-34, note: 'White gelatinous precipitate. It is amphoteric: it dissolves in excess NaOH as [Al(OH)4]-, but not in excess NH3.' },
    'Zn|OH':  { color: '#f2f2f2', name: 'zinc hydroxide', dhf: -641.9, ksp: 3e-17, note: 'White precipitate. It is amphoteric: it dissolves in excess NaOH (zincate) and in excess NH3 (as [Zn(NH3)4]2+).' },
    'Zn|CO3': { color: '#f4f4f4', name: 'zinc carbonate', dhf: -812.8, ksp: 1.5e-10, note: 'White precipitate.' },
    'Zn|S':   { color: '#f3f3e6', name: 'zinc sulfide', dhf: -206.0, ksp: 2e-25, note: 'The only common white sulfide (all other transition-metal sulfides are coloured).' },
    'Pb|OH':  { color: '#f4f4f4', name: 'lead(II) hydroxide', dhf: -515.9, ksp: 1.4e-20, note: 'White precipitate, amphoteric: it dissolves in excess NaOH.' },
    'Pb|Cl':  { color: '#f6f6f6', name: 'lead(II) chloride', dhf: -359.4, ksp: 1.7e-5, note: 'White precipitate that dissolves in hot water and crystallises again on cooling.' },
    'Pb|Br':  { color: '#f3f1e9', name: 'lead(II) bromide', dhf: -278.7, ksp: 6.6e-6, note: 'White precipitate, soluble in hot water.' },
    'Pb|I':   { color: '#f4c20d', name: 'lead(II) iodide', dhf: -175.5, ksp: 9.8e-9, note: 'Brilliant yellow precipitate. Warm the mixture and it dissolves, then cool it: glittering golden crystals ("golden rain") reappear.' },
    'Pb|SO4': { color: '#f6f6f6', name: 'lead(II) sulfate', dhf: -920.0, ksp: 2.5e-8, note: 'Dense white precipitate.' },
    'Pb|CO3': { color: '#f6f6f6', name: 'lead(II) carbonate', dhf: -699.1, ksp: 7.4e-14, note: 'White precipitate ("white lead" pigment is a basic carbonate).' },
    'Pb|S':   { color: '#1a1a1a', name: 'lead(II) sulfide', dhf: -100.4, ksp: 3e-28, note: 'Black precipitate.' },
    'Cu|OH':  { color: '#79aef0', name: 'copper(II) hydroxide', dhf: -449.8, ksp: 2.2e-20, note: 'Pale blue gelatinous precipitate. It turns black (CuO) on heating.' },
    'Cu|CO3': { color: '#74c3a2', name: 'copper(II) carbonate', dhf: null, ksp: 1.4e-10, note: 'Blue-green solid (in reality basic copper carbonate, the green patina of old copper roofs).' },
    'Cu|S':   { color: '#171717', name: 'copper(II) sulfide', dhf: -53.1, ksp: 6e-36, note: 'Black precipitate; so insoluble that it forms even in acid solution.' },
    'Fe2|OH': { color: '#6f9460', name: 'iron(II) hydroxide', dhf: -569.0, ksp: 4.9e-17, note: 'Dirty-green precipitate that turns brown on standing as Fe(II) is oxidised by air.' },
    'Fe2|CO3':{ color: '#b9c7a6', name: 'iron(II) carbonate', dhf: -740.6, ksp: 3.1e-11, note: 'Pale greenish-white solid (the mineral siderite).' },
    'Fe2|S':  { color: '#202020', name: 'iron(II) sulfide', dhf: -100.0, ksp: 6e-18, note: 'Black precipitate.' },
    'Fe3|OH': { color: '#b5522a', name: 'iron(III) hydroxide', dhf: -823.0, ksp: 2.8e-39, note: 'Reddish-brown gelatinous precipitate: the "rust" colour.' },
  };

  // Salts that will hydrolyse completely (cation + carbonate or sulfide): hydroxide + gas
  const HYDROLYSIS_CATIONS = ['Fe3', 'Al'];

  // ---------------------------------------------------------------- small molecules (non-ionic)
  const MOL = {
    H2O: { ph: 'l', dhf: -285.8 },
    CO2: { ph: 'g', dhf: -393.5 },
    H2:  { ph: 'g', dhf: 0 },
    O2:  { ph: 'g', dhf: 0 },
    H2S: { ph: 'g', dhf: -20.6 },
    NH3g:{ f: 'NH3', ph: 'g', dhf: -46.1 },
    NH3aq:{ f: 'NH3', ph: 'aq', dhf: -80.3 },
    CH3COOH:{ ph: 'aq', dhf: -485.8 },
    SO2: { ph: 'g', dhf: -296.8 },
    S:   { ph: 's', dhf: 0 },
    NO:  { ph: 'g', dhf: 90.3 },
    N2O: { ph: 'g', dhf: 82.0 },
    CuO: { ph: 's', dhf: -157.3 },
    Fe2O3:{ ph: 's', dhf: -824.2 },
  };

  // ---------------------------------------------------------------- metals
  // E: standard reduction potential (V) of M^n+/M, ion: ion key of the common cation
  const METAL = {
    k:  { sym: 'K',  ion: 'K',  E: -2.93, color: '#cfd4dc', name: 'potassium' },
    na: { sym: 'Na', ion: 'Na', E: -2.71, color: '#cfd4dc', name: 'sodium' },
    ca: { sym: 'Ca', ion: 'Ca', E: -2.87, color: '#b9bcc2', name: 'calcium' },
    mg: { sym: 'Mg', ion: 'Mg', E: -2.37, color: '#c9ccd2', name: 'magnesium' },
    al: { sym: 'Al', ion: 'Al', E: -1.66, color: '#c7cbd1', name: 'aluminium' },
    zn: { sym: 'Zn', ion: 'Zn', E: -0.76, color: '#9aa8b5', name: 'zinc' },
    fe: { sym: 'Fe', ion: 'Fe2', E: -0.44, color: '#8a8d92', name: 'iron' },
    cu: { sym: 'Cu', ion: 'Cu', E: 0.34,  color: '#b87333', name: 'copper' },
  };
  // reduction potentials for cations that can be displaced (and their deposited metal)
  const CATION_E = {
    Ag: { E: 0.80, color: '#d5dbe0', metal: 'Ag', name: 'silver', tree: true },
    Cu: { E: 0.34, color: '#b5651d', metal: 'Cu', name: 'copper' },
    Pb: { E: -0.13, color: '#8d96a0', metal: 'Pb', name: 'lead', tree: true },
    Fe2:{ E: -0.44, color: '#6b6e73', metal: 'Fe', name: 'iron' },
    Zn: { E: -0.76, color: '#9aa8b5', metal: 'Zn', name: 'zinc' },
    Al: { E: -1.66, color: '#c7cbd1', metal: 'Al', name: 'aluminium' },
    Mg: { E: -2.37, color: '#c9ccd2', metal: 'Mg', name: 'magnesium' },
  };

  // dissolution enthalpies of solids in water (kJ/mol), used when a solid is added to water
  const DSOL = {
    nacl: 3.9, nh4cl: 14.8, nh4no3: 25.7, cacl2: -82.8, naoh: -44.5, koh: -57.6,
    agno3: 22.6, ki: 20.3, kbr: 19.9, na2co3: -26.7, kmno4: 43.6, cuso4h: 11.7,
    bacl2: -13.2, na2so4: -2.3, sugar: 5.9,
  };

  const GAS = {
    H2:  { name: 'hydrogen', color: null, test: 'A lighted splint gives a squeaky "pop".', smell: 'odourless' },
    CO2: { name: 'carbon dioxide', color: null, test: 'Bubbled through limewater it turns the water milky (CaCO3).', smell: 'odourless' },
    O2:  { name: 'oxygen', color: null, test: 'Relights a glowing splint.', smell: 'odourless' },
    NH3: { name: 'ammonia', color: null, test: 'Turns damp red litmus blue; gives dense white fumes of NH4Cl with HCl.', smell: 'sharp, pungent smell' },
    H2S: { name: 'hydrogen sulfide', color: null, test: 'Blackens filter paper soaked in lead(II) acetate (PbS). Rotten-egg smell.', smell: 'rotten eggs (toxic)' },
    SO2: { name: 'sulfur dioxide', color: null, test: 'Turns acidified K2Cr2O7 paper from orange to green; decolourises KMnO4.', smell: 'choking, pungent' },
    NO:  { name: 'nitric oxide', color: null, test: 'Colourless, but turns brown at the mouth of the tube as it meets oxygen (NO2).', smell: 'odourless (NO2 is acrid)' },
    N2O: { name: 'dinitrogen oxide', color: null, test: 'Relights a glowing splint (like O2) but is not brown.', smell: 'faintly sweet' },
    NO2: { name: 'nitrogen dioxide', color: '#8a4b1d', test: 'Brown gas with an acrid smell.', smell: 'acrid, choking (toxic)' },
    H2O: { name: 'steam', color: null, test: 'Condenses to droplets on a cold surface; turns anhydrous CuSO4 blue.', smell: 'odourless' },
    HCl: { name: 'hydrogen chloride', color: null, test: 'Misty fumes in moist air; white smoke of NH4Cl with ammonia.', smell: 'sharp, choking' },
    Br2: { name: 'bromine', color: '#a0451c', test: 'Red-brown vapour that turns starch-iodide paper blue-black.', smell: 'pungent, toxic' },
  };

  // ---------------------------------------------------------------- indicators
  function indColor(id, ph) {
    if (id === 'phph') {          // phenolphthalein, pKa about 9.4: colourless below 8.2, faint pink near 8.5, magenta above 10
      if (ph < 8.2) return null;
      const f = 1 / (1 + Math.pow(10, 9.4 - ph));
      return C.absMix('#cfe6f5', '#e0218a', Math.min(1, 0.12 + f * 1.05));
    }
    if (id === 'mo') {            // methyl orange, pKa 3.46: red below 3.1, orange at the transition, yellow above 4.4
      const f = 1 / (1 + Math.pow(10, 3.46 - ph));
      return C.absMix('#e53935', '#f6c726', f);
    }
    // universal indicator
    const stops = [[1, '#e53935'], [3, '#ef6c35'], [4, '#fb9a2b'], [5, '#f9c22e'], [6, '#d9d62c'], [7, '#5fb957'], [8, '#2faa8d'], [9, '#2f7fd0'], [11, '#4c4fc9'], [13, '#7b2fb0']];
    if (ph <= stops[0][0]) return stops[0][1];
    for (let i = 1; i < stops.length; i++) {
      if (ph <= stops[i][0]) {
        const a = stops[i - 1], b = stops[i];
        return C.mix(a[1], b[1], (ph - a[0]) / (b[0] - a[0]));
      }
    }
    return stops[stops.length - 1][1];
  }
  const INDICATOR_INFO = {
    phph: 'Phenolphthalein is colourless below pH 8.2 and pink above about pH 10.',
    mo: 'Methyl orange is red below pH 3.1 and yellow above pH 4.4 (orange in between).',
    ui: 'Universal indicator is a mixture that changes through red, orange, yellow, green, blue and violet from pH 1 to 13.',
  };

  // ---------------------------------------------------------------- chemicals shown to the user
  const CH = {};
  function chem(id, name, f, group, o) {
    CH[id] = Object.assign({
      id, name, f, group, phase: 'aq', color: null, ph: 7,
      haz: [0, 'Low hazard at classroom concentrations. Wear eye protection as usual.'],
      look: 'Colourless solution',
    }, o);
  }
  const H = {
    corr: [2, 'Corrosive. Causes skin burns and serious eye damage.'],
    corr3: [3, 'Extremely corrosive. Causes severe burns.'],
    irr: [1, 'Irritant to skin and eyes.'],
    tox: [3, 'Toxic if swallowed. Wash hands after use.'],
    ox: [2, 'Oxidiser. Irritant. Stains skin.'],
    flam: [2, 'Highly flammable.'],
  };

  // Acids
  chem('hcl', 'Hydrochloric acid', 'HCl', 'acid', { ions: ['H', 'Cl'], ph: 1, haz: H.corr, look: 'Colourless solution (about 1 M)' });
  chem('h2so4', 'Sulfuric acid (dilute)', 'H2SO4', 'acid', { ions: ['H', 'SO4'], ph: 0.7, haz: H.corr, look: 'Colourless solution (about 1 M)' });
  chem('h2so4c', 'Sulfuric acid (conc.)', 'H2SO4', 'acid', { ions: ['H', 'SO4'], phase: 'l', conc: true, ph: -1, haz: [3, 'Extremely corrosive; dehydrates skin and organic matter. Reacts violently with water: always add acid to water, never the reverse.'], look: 'Dense, oily, colourless liquid (98%)' });
  chem('hno3', 'Nitric acid (dilute)', 'HNO3', 'acid', { ions: ['H', 'NO3'], ph: 0.5, haz: [3, 'Corrosive and oxidising. Stains skin yellow. Dilute HNO3 with metals gives toxic nitrogen oxides: use a fume cupboard.'], look: 'Colourless solution (about 2 M)' });
  chem('ch3cooh', 'Acetic acid (ethanoic)', 'CH3COOH', 'acid', { weak: true, ph: 2.9, haz: [1, 'Irritant at higher concentrations; vinegar is about 0.8 M.'], look: 'Colourless solution with a vinegar smell (1 M)' });
  // Bases
  chem('naoh', 'Sodium hydroxide', 'NaOH', 'base', { ions: ['Na', 'OH'], ph: 13.3, haz: H.corr3, look: 'White pellets or a colourless solution (1 M)' });
  chem('koh', 'Potassium hydroxide', 'KOH', 'base', { ions: ['K', 'OH'], ph: 13.3, haz: H.corr3, look: 'White pellets or a colourless solution (1 M)' });
  chem('baoh2', 'Barium hydroxide', 'Ba(OH)2', 'base', { ions: ['Ba', 'OH'], ph: 12.8, haz: [3, 'Corrosive and toxic if swallowed.'], look: 'Colourless solution (about 0.1 M)' });
  chem('caoh2', 'Limewater', 'Ca(OH)2', 'base', { ions: ['Ca', 'OH'], ph: 12.4, haz: H.irr, look: 'Clear, colourless saturated solution of calcium hydroxide' });
  chem('nh3', 'Ammonia solution', 'NH3', 'base', { weak: true, ph: 11.1, haz: [2, 'Corrosive, with a choking vapour. Use in a well-ventilated space.'], look: 'Colourless solution with a sharp smell (1 M)' });
  // Salts
  function salt(id, name, ions, o) { chem(id, name, null, 'salt', Object.assign({ ions }, o)); }
  salt('nacl', 'Sodium chloride', ['Na', 'Cl'], { look: 'White crystals / colourless solution (0.1 M)' });
  salt('kbr', 'Potassium bromide', ['K', 'Br'], { look: 'White crystals / colourless solution (0.1 M)' });
  salt('ki', 'Potassium iodide', ['K', 'I'], { look: 'White crystals / colourless solution (0.1 M)' });
  salt('kscn', 'Potassium thiocyanate', ['K', 'SCN'], { haz: H.irr, look: 'Colourless solution (0.1 M)' });
  salt('agno3', 'Silver nitrate', ['Ag', 'NO3'], { haz: [2, 'Oxidiser, corrosive; stains skin and clothes black.'], look: 'Colourless solution (0.1 M)' });
  salt('bacl2', 'Barium chloride', ['Ba', 'Cl'], { haz: H.tox, look: 'Colourless solution (0.1 M)' });
  salt('cacl2', 'Calcium chloride', ['Ca', 'Cl'], { look: 'White granules / colourless solution (0.1 M)' });
  salt('cuso4h', 'Copper(II) sulfate (blue vitriol)', ['Cu', 'SO4'], { f: 'CuSO4·5H2O', ph: 4, color: '#2f7fd8', haz: [2, 'Harmful if swallowed; irritant; toxic to aquatic life.'], look: 'Bright blue crystals / blue solution (0.1 M)' });
  salt('fecl3', 'Iron(III) chloride', ['Fe3', 'Cl'], { ph: 2, color: '#d9a13a', haz: H.corr, look: 'Yellow-brown solution (0.1 M)' });
  salt('feso4', 'Iron(II) sulfate', ['Fe2', 'SO4'], { ph: 5, color: '#b9dbb0', haz: H.irr, look: 'Pale green solution (0.1 M)' });
  salt('znso4', 'Zinc sulfate', ['Zn', 'SO4'], { ph: 5.5, haz: H.irr, look: 'Colourless solution (0.1 M)' });
  salt('mgso4', 'Magnesium sulfate', ['Mg', 'SO4'], { look: 'Colourless solution (0.1 M), Epsom salt' });
  salt('al2so43', 'Aluminium sulfate', ['Al', 'SO4'], { ph: 3.5, haz: H.irr, look: 'Colourless solution (0.1 M)' });
  salt('pbno32', 'Lead(II) nitrate', ['Pb', 'NO3'], { haz: [3, 'Toxic and a reproductive hazard. For demonstration use only; collect all waste.'], look: 'Colourless solution (0.1 M)' });
  salt('na2co3', 'Sodium carbonate', ['Na', 'CO3'], { ph: 11.6, haz: H.irr, look: 'Colourless solution (0.1 M), washing soda' });
  salt('nahco3', 'Sodium hydrogencarbonate', ['Na', 'HCO3'], { ph: 8.3, look: 'White powder / colourless solution, baking soda' });
  salt('na2so4', 'Sodium sulfate', ['Na', 'SO4'], { look: 'Colourless solution (0.1 M)' });
  salt('na2s', 'Sodium sulfide', ['Na', 'S'], { ph: 12.5, haz: [2, 'Corrosive; releases toxic H2S gas with acids.'], look: 'Colourless solution (0.1 M), smells slightly of H2S' });
  salt('na2s2o3', 'Sodium thiosulfate', ['Na', 'S2O3'], { look: 'Colourless solution (0.1 M), photographic "hypo"' });
  salt('nh4cl', 'Ammonium chloride', ['NH4', 'Cl'], { ph: 5.3, haz: H.irr, look: 'White crystals / colourless solution (0.1 M)' });
  salt('nh4no3', 'Ammonium nitrate', ['NH4', 'NO3'], { ph: 5.3, haz: [2, 'Oxidiser. Harmful in contact with combustibles.'], look: 'White prills / colourless solution' });
  // Oxidising agents
  salt('kmno4', 'Potassium permanganate', ['K', 'MnO4'], { group: 'oxidiser', color: '#9b1fa8', haz: H.ox, look: 'Dark purple crystals / deep purple solution (0.02 M)' });
  salt('k2cr2o7', 'Potassium dichromate', ['K', 'Cr2O7'], { group: 'oxidiser', color: '#f28c28', haz: [3, 'Toxic, carcinogenic and an oxidiser. Collect all waste.'], look: 'Orange crystals / orange solution (0.02 M)' });
  chem('h2o2', 'Hydrogen peroxide (3%)', 'H2O2', 'oxidiser', { haz: [1, 'Mild irritant at 3%. Higher concentrations are corrosive and oxidising.'], look: 'Colourless solution' });
  // Solids
  chem('caco3', 'Calcium carbonate (marble chips)', 'CaCO3', 'solid', { phase: 's', ions: ['Ca', 'CO3'], insoluble: true, color: '#f1eee6', look: 'White chalky solid, insoluble in water' });
  chem('cuo', 'Copper(II) oxide', 'CuO', 'solid', { phase: 's', color: '#1d1d1d', haz: [1, 'Harmful if swallowed; avoid dust.'], look: 'Black powder, insoluble in water' });
  chem('fe2o3', 'Iron(III) oxide (rust)', 'Fe2O3', 'solid', { phase: 's', color: '#a2492a', look: 'Red-brown powder, insoluble in water' });
  chem('mno2', 'Manganese dioxide', 'MnO2', 'solid', { phase: 's', color: '#262626', haz: [1, 'Harmful if swallowed or inhaled as dust.'], look: 'Black powder, insoluble in water (a catalyst)' });
  chem('cuso4a', 'Copper(II) sulfate (anhydrous)', 'CuSO4', 'solid', { phase: 's', ions: ['Cu', 'SO4'], color: '#f2f2ee', haz: [2, 'Harmful if swallowed; irritant.'], look: 'White powder that turns blue with water' });
  // Metals
  chem('na', 'Sodium', 'Na', 'metal', { phase: 's', metal: 'na', color: '#cfd4dc', haz: [3, 'Reacts violently with water. Handle only with forceps, use pea-sized pieces behind a safety screen.'], look: 'Soft silvery metal, stored under oil' });
  chem('k', 'Potassium', 'K', 'metal', { phase: 's', metal: 'k', color: '#cfd4dc', haz: [3, 'Reacts explosively with water. Demonstration by a teacher only.'], look: 'Soft silvery metal, stored under oil' });
  chem('ca', 'Calcium', 'Ca', 'metal', { phase: 's', metal: 'ca', color: '#b9bcc2', haz: [2, 'Reacts with water to release flammable H2.'], look: 'Grey-silvery metal granules' });
  chem('mg', 'Magnesium', 'Mg', 'metal', { phase: 's', metal: 'mg', color: '#c9ccd2', haz: [1, 'Flammable solid. Burns with a very bright light: do not look directly.'], look: 'Silvery ribbon' });
  chem('al', 'Aluminium', 'Al', 'metal', { phase: 's', metal: 'al', color: '#c7cbd1', look: 'Silvery foil or turnings' });
  chem('zn', 'Zinc', 'Zn', 'metal', { phase: 's', metal: 'zn', color: '#9aa8b5', look: 'Blue-grey granules' });
  chem('fe', 'Iron', 'Fe', 'metal', { phase: 's', metal: 'fe', color: '#8a8d92', look: 'Grey iron filings or nail' });
  chem('cu', 'Copper', 'Cu', 'metal', { phase: 's', metal: 'cu', color: '#b87333', look: 'Reddish-brown metal strip' });
  // Gases
  chem('o2', 'Oxygen', 'O2', 'gas', { phase: 'g', haz: [1, 'Supports combustion; keep away from flames and oils.'], look: 'Colourless, odourless gas' });
  chem('co2', 'Carbon dioxide', 'CO2', 'gas', { phase: 'g', look: 'Colourless, odourless gas' });
  // Organic
  chem('ethanol', 'Ethanol', 'C2H5OH', 'organic', { phase: 'l', haz: H.flam, look: 'Colourless, volatile liquid' });
  chem('sugar', 'Sucrose (table sugar)', 'C12H22O11', 'organic', { phase: 's', color: '#f7f3ea', look: 'White crystalline solid' });
  chem('starch', 'Starch solution', 'starch', 'organic', { color: '#ece9dc', look: 'Slightly cloudy, colourless solution' });
  // Indicators
  chem('phph', 'Phenolphthalein', 'HPh', 'indicator', { look: 'Colourless solution (a few drops)', haz: [1, 'Used as a dilute alcoholic solution; flammable.'] });
  chem('mo', 'Methyl orange', 'MO', 'indicator', { color: '#f6c726', look: 'Orange-yellow solution (a few drops)', haz: [1, 'Harmful if swallowed.'] });
  chem('ui', 'Universal indicator', 'UI', 'indicator', { color: '#5fb957', look: 'Green solution (a few drops)', haz: [1, 'Contains alcohol; flammable.'] });
  // Others
  chem('h2o', 'Water', 'H2O', 'other', { phase: 'l', color: null, look: 'Colourless liquid (distilled)' });
  chem('i2', 'Iodine solution', 'I2', 'other', { color: '#c58a2a', haz: [2, 'Harmful; stains skin and surfaces. Dissolved in KI solution.'], look: 'Yellow-brown solution' });
  chem('heat', 'Heat (Bunsen flame)', 'Δ', 'other', { phase: 'h', haz: [2, 'Burn hazard. Tie back hair, wear eye protection, keep flammables away.'], look: 'A flame heats the mixture from below' });

  C.ION = ION; C.PPT = PPT; C.MOL = MOL; C.METAL = METAL; C.CATION_E = CATION_E; C.DSOL = DSOL;
  C.GAS = GAS; C.CH = CH; C.HYDROLYSIS_CATIONS = HYDROLYSIS_CATIONS;
  C.indColor = indColor; C.INDICATOR_INFO = INDICATOR_INFO;
  C.GROUPS = [
    ['all', 'All'], ['acid', 'Acids'], ['base', 'Bases'], ['salt', 'Salts'], ['metal', 'Metals'],
    ['oxidiser', 'Oxidisers'], ['solid', 'Oxides & solids'], ['gas', 'Gases'], ['organic', 'Organic'],
    ['indicator', 'Indicators'], ['other', 'Other'],
  ];

  // ---------------------------------------------------------------- label helpers
  const SUP = { '0': '⁰', '1': '¹', '2': '²', '3': '³', '4': '⁴', '5': '⁵', '6': '⁶', '7': '⁷', '8': '⁸', '9': '⁹', '+': '⁺', '-': '⁻' };
  const SUB = { '0': '₀', '1': '₁', '2': '₂', '3': '₃', '4': '₄', '5': '₅', '6': '₆', '7': '₇', '8': '₈', '9': '₉' };
  // "Cu^2+" -> "Cu²⁺", "H2O" -> "H₂O"
  C.uni = function (s) {
    s = s.replace(/\((s|aq|l|g)\)$/, '');
    const m = s.match(/^(.*?)(?:\^(\d*[+-]))?$/);
    const base = m[1].replace(/([A-Za-z)\]])(\d+)/g, (_, a, d) => a + d.split('').map((c) => SUB[c]).join(''));
    const ch = m[2] ? m[2].split('').map((c) => SUP[c] || c).join('') : '';
    return base + ch;
  };

  // ---------------------------------------------------------------- colour helpers
  function hex2rgb(h) { h = h.replace('#', ''); return [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)]; }
  function rgb2hex(r) { return '#' + r.map(v => Math.max(0, Math.min(255, Math.round(v))).toString(16).padStart(2, '0')).join(''); }
  C.mix = function (a, b, t) { const A = hex2rgb(a), B = hex2rgb(b); return rgb2hex(A.map((v, i) => v + (B[i] - v) * t)); };
  C.hex2rgb = hex2rgb; C.rgb2hex = rgb2hex;
  // Coloured solutions combine subtractively: each dye absorbs part of the light, and absorbances add
  // (Beer-Lambert). Working in absorbance (-log10 of transmitted light per channel) instead of plain RGB
  // makes blue + yellow give green (not grey) and keeps a fading colour vivid until the dye is nearly gone.
  const absOf = (hex) => hex2rgb(hex).map((v) => -Math.log10(Math.max(3, v) / 255));
  const fromAbs = (a) => rgb2hex(a.map((x) => 255 * Math.pow(10, -x)));
  C.absOf = absOf; C.fromAbs = fromAbs;
  // concentration-weighted interpolation: what you see when species a turns into species b
  C.absMix = function (a, b, t) { t = Math.max(0, Math.min(1, t)); const A = absOf(a), B = absOf(b); return fromAbs(A.map((v, i) => v * (1 - t) + B[i] * t)); };
  // add a dye of strength s (1 = the dye colour itself) to a base solution; ref is the colour of the solvent
  C.absAdd = function (base, dye, s, ref) { const A = absOf(base), D = absOf(dye), R = absOf(ref || '#cfe6f5'); return fromAbs(A.map((v, i) => v + s * (D[i] - R[i]))); };
})();
