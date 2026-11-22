/* Lab Visuals: practical experiments mapped from the official syllabi.
   Sources read in full (text extracted from the PDFs):
   CU   University of Calcutta, Four-Year B.Sc. Honours Chemistry, Curriculum & Credit Framework 2022 (DSCC-1 to DSCC-15 practicals)
   WBSU West Bengal State University, Chemistry syllabus under CCF (Major, CEMDSC101P to CEMDSC614P)
   BU   University of Burdwan, Chemistry CBCS syllabus: Honours (CC-1, CC-2 ... practicals) and General (CC-1 to DSE practicals)
   A university badge means that university's syllabus names the experiment (or a clear variant of it). */
(function () {
  'use strict';
  const S = (globalThis.Syllabus = {});

  S.SOURCES = [
    { id: 'CU', name: 'University of Calcutta', doc: 'Four-Year B.A./B.Sc. (Honours) Chemistry, Curriculum & Credit Framework 2022', url: 'https://caluniv.ac.in/ccf-ug/files/syllabus/hns-mdc/CHEMISTRY/8-chemistry-CSR-75.pdf' },
    { id: 'WBSU', name: 'West Bengal State University', doc: 'Chemistry syllabus under Curriculum & Credit Framework (Major, 4-year Honours)', url: 'https://wbsu.ac.in/web/wp-content/uploads/2024/12/ChemistryNEP_Syllabus_2024.pdf' },
    { id: 'BU', name: 'University of Burdwan', doc: 'Chemistry syllabus under CBCS (Honours and General)', url: 'https://www.vmbdn.in/images/uploads/Chem_G.pdf' },
  ];

  S.AREAS = [
    'Volumetric analysis', 'Chemical kinetics', 'Thermochemistry', 'Electrochemistry & conductance',
    'Colorimetry', 'Physical properties & equilibria', 'Qualitative inorganic analysis',
    'Inorganic preparations & gravimetry', 'Organic chemistry', 'Spectra & computing',
  ];

  // status: 'live' = interactive simulator now, 'soon' = planned
  const E = [];
  const add = (area, title, unis, sim, note) => E.push({ id: E.length + 1, area, title, unis, sim: sim || null, status: sim ? 'live' : 'soon', note: note || '' });

  // ---- volumetric
  add('Volumetric analysis', 'Standardisation of NaOH against standard oxalic acid', ['CU'], 'titration.html?exp=naoh-oxalic', 'Phenolphthalein; strength of NaOH from the titre.');
  add('Volumetric analysis', 'Estimation of acetic acid in commercial vinegar', ['CU'], 'titration.html?exp=vinegar', 'Weak acid vs strong base.');
  add('Volumetric analysis', 'Estimation of Na₂CO₃ and NaHCO₃ in a mixture', ['CU', 'WBSU', 'BU'], 'titration.html?exp=carb-bicarb', 'Two end points: phenolphthalein, then methyl orange.');
  add('Volumetric analysis', 'Estimation of NaOH and Na₂CO₃ in a mixture', ['WBSU'], 'titration.html?exp=naoh-carb', 'Two end points with HCl.');
  add('Volumetric analysis', 'Oxalate and oxalic acid in a mixture', ['WBSU'], null, '');
  add('Volumetric analysis', 'Standardisation of KMnO₄ with oxalic acid (and estimation of oxalic acid)', ['CU', 'BU'], 'titration.html?exp=kmno4-oxalic', 'Hot, acidic solution; KMnO₄ is its own indicator.');
  add('Volumetric analysis', 'Estimation of Fe(II) (Mohr’s salt) using standard KMnO₄', ['CU', 'WBSU', 'BU'], 'titration.html?exp=mohr-kmno4', '');
  add('Volumetric analysis', 'Estimation of Fe(II) using K₂Cr₂O₇ with an internal indicator', ['WBSU', 'BU'], 'titration.html?exp=fe-dichromate', 'Diphenylamine indicator.');
  add('Volumetric analysis', 'Estimation of Fe(III) using K₂Cr₂O₇; Fe(II) + Fe(III) mixture', ['CU', 'WBSU'], null, '');
  add('Volumetric analysis', 'Iodometric estimation of Cu(II) with Na₂S₂O₃', ['WBSU', 'BU'], 'titration.html?exp=iodo-cu', 'Starch is added near the end point.');
  add('Volumetric analysis', 'Strength of a H₂O₂ sample with KMnO₄', ['BU'], 'titration.html?exp=h2o2-kmno4', '');
  add('Volumetric analysis', 'Total hardness of water by EDTA titration', ['CU', 'WBSU', 'BU'], 'titration.html?exp=edta-hardness', 'Eriochrome Black T, pH 10 buffer.');
  add('Volumetric analysis', 'Ca(II) + Mg(II) mixture; Zn(II) or Mg(II) by EDTA', ['CU', 'WBSU', 'BU'], null, '');
  add('Volumetric analysis', 'Binary mixtures of metal ions (Fe+Cu, Fe+Cr, Fe+Mn, Cr+Mn, Cu+Zn, Cu+Ni)', ['CU', 'WBSU'], null, '');
  add('Volumetric analysis', 'Industrial materials: brass, dolomite, steel, vitamin C, dissolved oxygen, cement, talcum', ['CU', 'WBSU'], null, '');

  // ---- kinetics
  add('Chemical kinetics', 'Clock reaction: H₂O₂ + acidified KI (order and activation energy)', ['CU'], 'kinetics.html?exp=clock', 'Initial-rate method with thiosulfate and starch.');
  add('Chemical kinetics', 'Decomposition of H₂O₂ with a catalyst (KI or FeCl₃)', ['CU', 'WBSU', 'BU'], 'kinetics.html?exp=h2o2', 'First order; aliquots titrated with KMnO₄.');
  add('Chemical kinetics', 'Acid-catalysed hydrolysis of methyl acetate (first order)', ['CU', 'WBSU', 'BU'], 'kinetics.html?exp=ester', 'Aliquots titrated with NaOH.');
  add('Chemical kinetics', 'Saponification of ethyl acetate, followed conductometrically', ['CU', 'WBSU'], 'kinetics.html?exp=sapon', 'Second order.');
  add('Chemical kinetics', 'Ethyl acetate hydrolysis with an equal amount of NaOH (titrimetric)', ['BU'], null, '');
  add('Chemical kinetics', 'Inversion of cane sugar (polarimeter)', ['CU'], null, '');
  add('Chemical kinetics', 'K₂S₂O₈ + KI (initial rate / colorimetric)', ['WBSU', 'BU'], null, '');

  // ---- thermochemistry
  add('Thermochemistry', 'Heat of neutralisation: strong acid + strong base, and weak acid + strong base', ['WBSU'], 'calorimetry.html?exp=neutral', 'Calorimeter, cooling correction, ΔH.');
  add('Thermochemistry', 'Heat of solution (the syllabus names benzoic acid; this lab uses common salts)', ['WBSU'], 'calorimetry.html?exp=solution', 'Dissolving NH₄Cl, NaOH, CaCl₂ and others.');

  // ---- electrochemistry
  add('Electrochemistry & conductance', 'Conductometric titration of a strong + weak acid mixture, or a dibasic acid, vs NaOH', ['CU', 'WBSU'], 'titration.html?exp=conduct-mix', '');
  add('Electrochemistry & conductance', 'Conductometric titration of a weak acid (CH₃COOH) vs NaOH', ['WBSU', 'BU'], 'titration.html?exp=conduct-weak', '');
  add('Electrochemistry & conductance', 'Ionisation constant of a weak acid; Ostwald’s dilution law', ['CU', 'WBSU', 'BU'], null, '');
  add('Electrochemistry & conductance', 'Potentiometric titration of Mohr’s salt vs K₂Cr₂O₇ (E° of Fe³⁺/Fe²⁺)', ['CU', 'WBSU', 'BU'], 'titration.html?exp=potent-mohr', '');
  add('Electrochemistry & conductance', 'Potentiometric titration of AgNO₃ vs KCl (K_sp of AgCl)', ['CU', 'WBSU'], 'titration.html?exp=potent-agcl', '');

  // ---- colorimetry
  add('Colorimetry', 'Verification of Beer’s law for KMnO₄ and K₂Cr₂O₇', ['WBSU'], 'colorimetry.html', 'Dilution series, calibration line, unknown.');
  add('Colorimetry', 'pK of an indicator (bromocresol green) colorimetrically', ['WBSU'], null, '');
  add('Colorimetry', 'pH of an unknown buffer by colour matching', ['BU'], null, '');

  // ---- physical properties
  add('Physical properties & equilibria', 'Viscosity with an Ostwald viscometer', ['CU', 'WBSU', 'BU'], null, '');
  add('Physical properties & equilibria', 'Surface tension with a stalagmometer', ['CU', 'WBSU', 'BU'], null, '');
  add('Physical properties & equilibria', 'Solubility product (PbI₂, KHTa, sparingly soluble salts)', ['CU', 'WBSU', 'BU'], null, '');
  add('Physical properties & equilibria', 'Critical micelle concentration of SDS', ['WBSU'], null, '');
  add('Physical properties & equilibria', 'Phenol–water phase diagram', ['WBSU'], null, '');
  add('Physical properties & equilibria', 'Distribution law: Cu²⁺ + NH₃ complex', ['BU'], null, '');

  // ---- qualitative inorganic
  add('Qualitative inorganic analysis', 'Semi-micro analysis of mixtures of three radicals (acid + basic)', ['CU', 'BU'], 'salt-analysis.html?n=3', 'Reagent tests, flame test, notebook, identify the radicals.');
  add('Qualitative inorganic analysis', 'Analysis of samples containing four radicals (dry, wet and special tests)', ['WBSU'], 'salt-analysis.html?n=4', 'Simplified: the full group-separation scheme is not modelled.');

  // ---- preparations and gravimetry
  add('Inorganic preparations & gravimetry', 'Preparation of coordination complexes (oxalato, ammine, en, acac)', ['CU', 'WBSU', 'BU'], null, '');
  add('Inorganic preparations & gravimetry', 'Gravimetric estimation: Ni(II) with DMG, chloride, sulphate', ['WBSU', 'BU'], null, '');

  // ---- organic
  add('Organic chemistry', 'Identification of a pure solid or liquid organic compound', ['CU', 'WBSU', 'BU'], null, '');
  add('Organic chemistry', 'Qualitative analysis of a single solid organic compound (Lassaigne, solubility, functional groups)', ['CU', 'WBSU', 'BU'], null, '');
  add('Organic chemistry', 'Melting point and boiling point determination', ['WBSU', 'BU'], null, '');
  add('Organic chemistry', 'Separation of a binary mixture; purification and melting point', ['WBSU', 'BU'], null, '');
  add('Organic chemistry', 'Organic preparations (nitration, acetylation, hydrolysis, bromination, diazo coupling…)', ['CU', 'WBSU', 'BU'], null, '');
  add('Organic chemistry', 'Quantitative organic estimations (glycine, glucose, vitamin C, saponification value)', ['WBSU'], null, '');
  add('Organic chemistry', 'TLC, paper and column chromatography', ['CU', 'WBSU'], null, '');

  // ---- spectra and computing
  add('Spectra & computing', 'Interpretation of ¹H NMR and IR spectra', ['CU'], null, '');
  add('Spectra & computing', 'Spreadsheet computations (titration curves, derivatives, Michaelis–Menten, …)', ['CU'], null, '');

  S.EXPERIMENTS = E;
  S.LIVE = E.filter((e) => e.status === 'live').length;
})();
