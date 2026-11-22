/* Lab Visuals: Class 11 and Class 12 hub pages. Each card opens the Reaction Lab with the chemicals pre-selected,
   or one of the simulators. The lists follow typical school practicals, not one specific board's syllabus. */
(function () {
  'use strict';
  const lab = (lv, ids) => 'lab.html?level=' + lv + '&mix=' + ids.join(',');
  const sim = (lv, page, q) => page + '?level=' + lv + (q ? '&' + q : '');

  const DATA = {
    '11': {
      title: 'Class <em>11</em> lab',
      lead: 'Start with what chemicals actually do: neutralise, precipitate, fizz, displace and change temperature. Pick a card to set up the experiment, then press Mix.',
      next: { label: 'Ready for more? Class 12 adds redox, complex ions and rates.', href: 'class12.html?level=12' },
      sections: [
        { h: 'Acids, bases and indicators', sub: 'Colour tells you the pH. Try the “which is in excess?” buttons under the equation.', items: [
          { t: 'Neutralisation with phenolphthalein', d: 'HCl + NaOH. The mixture is colourless at the exact end point and turns pink only with a little excess base.', tag: 'Acid–base', mix: ['hcl', 'naoh', 'phph'] },
          { t: 'Methyl orange: acid and base', d: 'Red in acid, yellow in base. Compare it with phenolphthalein.', tag: 'Indicators', mix: ['hcl', 'mo'] },
          { t: 'Universal indicator on vinegar', d: 'A weak acid gives a different colour from HCl.', tag: 'Indicators', mix: ['ch3cooh', 'ui'] },
          { t: 'Universal indicator on ammonia', d: 'A weak base is blue-violet.', tag: 'Indicators', mix: ['nh3', 'ui'] },
        ] },
        { h: 'Reactions that make a solid', sub: 'Mix two clear solutions and a solid appears: precipitation.', items: [
          { t: 'Silver chloride', d: 'AgNO₃ + NaCl gives a white curdy precipitate: the test for chloride.', tag: 'Precipitation', mix: ['agno3', 'nacl'] },
          { t: 'Test for sulfate', d: 'BaCl₂ + Na₂SO₄ gives white BaSO₄ that does not dissolve in acid.', tag: 'Precipitation', mix: ['bacl2', 'na2so4'] },
          { t: 'Golden rain', d: 'Pb(NO₃)₂ + KI gives bright yellow PbI₂.', tag: 'Precipitation', mix: ['pbno32', 'ki'] },
          { t: 'Copper hydroxide', d: 'CuSO₄ + NaOH gives a pale blue gelatinous precipitate.', tag: 'Precipitation', mix: ['cuso4h', 'naoh'] },
        ] },
        { h: 'Reactions that make a gas', sub: 'Bubbles mean a gas. Each result tells you how to test it.', items: [
          { t: 'Baking soda + vinegar', d: 'CO₂ fizzes out. Notice the temperature falls slightly.', tag: 'Gas', mix: ['nahco3', 'ch3cooh'] },
          { t: 'Marble chips + HCl', d: 'CaCO₃ + acid gives CO₂, the lab method for making the gas.', tag: 'Gas', mix: ['caco3', 'hcl'] },
          { t: 'Limewater test for CO₂', d: 'Ca(OH)₂ turns milky when CO₂ is passed through.', tag: 'Gas test', mix: ['caoh2', 'co2'] },
          { t: 'Magnesium + hydrochloric acid', d: 'H₂ gas (squeaky pop) and a warm tube.', tag: 'Gas', mix: ['mg', 'hcl'] },
        ] },
        { h: 'Metals: who is more reactive?', sub: 'A more reactive metal pushes a less reactive one out of solution.', items: [
          { t: 'Zinc in copper sulfate', d: 'The blue colour fades as copper deposits on the zinc.', tag: 'Displacement', mix: ['zn', 'cuso4h'] },
          { t: 'Iron in copper sulfate', d: 'Reddish-brown copper coats the iron; the solution turns pale green.', tag: 'Displacement', mix: ['fe', 'cuso4h'] },
          { t: 'Copper in silver nitrate: silver tree', d: 'Silver crystals grow on the copper; the solution turns blue.', tag: 'Displacement', mix: ['cu', 'agno3'] },
          { t: 'Sodium in water (teacher demo only)', d: 'A violent reaction. Add phenolphthalein to see the alkali form.', tag: 'Reactivity', mix: ['na', 'h2o', 'phph'] },
        ] },
        { h: 'Heat in chemistry', sub: 'Some reactions release heat (exothermic) and some absorb it (endothermic).', items: [
          { t: 'Cold pack', d: 'NH₄NO₃ dissolving in water absorbs heat: the thermometer falls.', tag: 'Endothermic', mix: ['nh4no3', 'h2o'] },
          { t: 'Hot pack', d: 'CaCl₂ dissolving in water releases heat.', tag: 'Exothermic', mix: ['cacl2', 'h2o'] },
          { t: 'Measure the heat of neutralisation', d: 'Use a calorimeter, take temperature readings and calculate ΔH.', tag: 'Calorimetry', href: sim('11', 'calorimetry.html', 'exp=neutral') },
        ] },
        { h: 'Measure and identify', sub: 'Your first quantitative and analytical experiments.', items: [
          { t: 'Your first titration: HCl vs NaOH', d: 'Use the burette, pick an indicator, find the end point and calculate the strength.', tag: 'Titration', href: sim('11', 'titration.html', 'exp=hcl-naoh') },
          { t: 'Standardise NaOH with oxalic acid', d: 'The classic school titration with phenolphthalein.', tag: 'Titration', href: sim('11', 'titration.html', 'exp=naoh-oxalic') },
          { t: 'Identify an unknown salt', d: 'Test with reagents and work out which cation and anion it contains.', tag: 'Salt analysis', href: sim('11', 'salt-analysis.html', 'n=1') },
        ] },
      ],
    },
    '12': {
      title: 'Class <em>12</em> lab',
      lead: 'Redox titrations, complex ions, equilibria and your first look at reaction rates. Each card opens a ready-made experiment.',
      next: { label: 'Heading to university? BSc / BS opens the full practical lab.', href: 'bsc.html?level=bsc' },
      sections: [
        { h: 'Redox', sub: 'Electron transfer, shown by colour.', items: [
          { t: 'Permanganate + iron(II)', d: 'Purple MnO₄⁻ is decolourised by Fe²⁺ in acid.', tag: 'Redox', mix: ['kmno4', 'feso4', 'h2so4'] },
          { t: 'Dichromate + iron(II)', d: 'Orange Cr₂O₇²⁻ turns green as Cr³⁺ forms.', tag: 'Redox', mix: ['k2cr2o7', 'feso4', 'h2so4'] },
          { t: 'Starch–iodine', d: 'H₂O₂ oxidises iodide to iodine; starch turns blue-black.', tag: 'Redox', mix: ['h2o2', 'ki', 'h2so4', 'starch'] },
          { t: 'Displacement and the activity series', d: 'Zinc, iron and copper compared in copper sulfate and silver nitrate.', tag: 'Electrochemistry', mix: ['cu', 'agno3'] },
        ] },
        { h: 'Complex ions and equilibria', sub: 'Colours change when ligands bind and when equilibria shift.', items: [
          { t: 'Copper(II) and ammonia', d: 'Pale blue precipitate, then an inky deep-blue complex.', tag: 'Complexes', mix: ['cuso4h', 'nh3'] },
          { t: 'Iron(III) thiocyanate', d: 'A blood-red complex: the classic Le Chatelier demonstration.', tag: 'Equilibrium', mix: ['fecl3', 'kscn'] },
          { t: 'Chromate ⇌ dichromate', d: 'Orange turns yellow in alkali; acid reverses it.', tag: 'Equilibrium', mix: ['k2cr2o7', 'naoh'] },
          { t: 'Amphoteric aluminium', d: 'Al dissolves in NaOH, releasing hydrogen.', tag: 'Chemistry of metals', mix: ['al', 'naoh'] },
        ] },
        { h: 'Catalysis and rates', sub: 'How fast, and what controls it.', items: [
          { t: 'Elephant toothpaste', d: 'MnO₂ catalyses H₂O₂ decomposition. The catalyst is not used up.', tag: 'Catalysis', mix: ['h2o2', 'mno2'] },
          { t: 'The iodine clock: H₂O₂ + KI', d: 'Time how long the blue colour takes and see how concentration and temperature change the rate.', tag: 'Kinetics', href: sim('12', 'kinetics.html', 'exp=clock') },
          { t: 'Rusting (time-lapse)', d: 'Iron, water and oxygen: slow electrochemical corrosion.', tag: 'Electrochemistry', mix: ['fe', 'h2o', 'o2'] },
        ] },
        { h: 'Titrations', sub: 'Quantitative analysis with real end points.', items: [
          { t: 'Standardise NaOH with oxalic acid', d: 'Phenolphthalein end point.', tag: 'Acid–base', href: sim('12', 'titration.html', 'exp=naoh-oxalic') },
          { t: 'Acetic acid in vinegar', d: 'A weak acid against a strong base.', tag: 'Acid–base', href: sim('12', 'titration.html', 'exp=vinegar') },
          { t: 'Standardise KMnO₄ with oxalic acid', d: 'KMnO₄ is its own indicator.', tag: 'Redox', href: sim('12', 'titration.html', 'exp=kmno4-oxalic') },
          { t: 'Iron(II) in Mohr’s salt with KMnO₄', d: 'Estimate the Fe²⁺ concentration.', tag: 'Redox', href: sim('12', 'titration.html', 'exp=mohr-kmno4') },
        ] },
        { h: 'Thermochemistry and analysis', sub: '', items: [
          { t: 'Heat of neutralisation', d: 'Strong acid with strong base in a calorimeter.', tag: 'Calorimetry', href: sim('12', 'calorimetry.html', 'exp=neutral') },
          { t: 'Salt analysis: two radicals', d: 'Identify an unknown salt mixture from reagent tests.', tag: 'Salt analysis', href: sim('12', 'salt-analysis.html', 'n=2') },
        ] },
      ],
    },
  };

  function esc(s) { return String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c])); }

  function render() {
    const lv = document.body.dataset.level;
    const d = DATA[lv];
    if (!d) return;
    const root = document.getElementById('levelRoot');
    let h = '<div class="wrap"><section class="page-head"><p class="crumbs"><a href="index.html">Home</a> / Class ' + lv + '</p><h1>' + d.title + '</h1><p class="lead">' + d.lead + '</p>' +
      '<div class="btn-row" style="margin-top:18px"><a class="btn-glow" href="' + lab(lv, []).replace('&mix=', '') + '">Open the free-play Reaction Lab</a>' +
      '<a class="btn-ghost" href="index.html" style="text-decoration:none;display:inline-block">Change level</a></div></section>';
    d.sections.forEach((s) => {
      h += '<section class="section reveal"><h2>' + esc(s.h) + '</h2>' + (s.sub ? '<p class="sub">' + esc(s.sub) + '</p>' : '') + '<div class="cards">';
      s.items.forEach((it) => {
        const href = it.href || lab(lv, it.mix);
        h += '<a class="xcard" href="' + href + '"><div class="meta"><span class="pill-tag">' + esc(it.tag) + '</span></div><h3>' + esc(it.t) + '</h3><p>' + esc(it.d) + '</p><span class="go">' + (it.href ? 'Open simulator' : 'Set up and mix') + '</span></a>';
      });
      h += '</div></section>';
    });
    h += '<p class="note-box"><b>About this list:</b> these cards follow typical school practicals and are not matched to one specific board syllabus. ' + esc('Your teacher and your lab manual decide what you will be examined on.') + '</p>';
    h += '<p style="margin:26px 0 0"><a class="btn-ghost" href="' + d.next.href + '" style="text-decoration:none;display:inline-block">' + esc(d.next.label) + ' →</a></p></div>';
    root.innerHTML = h;
  }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', render); else render();
})();
