/* Lab Visuals: the science behind every experiment, shown under each simulator.
   Each entry: p (principle, paragraphs), eq (reactions), why (key points of method), calc (how the result is worked out), err (errors and precautions). */
(function () {
  'use strict';
  const T = (globalThis.Theory = { DB: {} });
  const add = (ids, e) => [].concat(ids).forEach((id) => (T.DB[id] = e));

  // ================================================================ acid-base titrations
  add('hcl-naoh', {
    p: ['A strong acid and a strong base are both fully ionised, so the reaction in the flask is simply H⁺ + OH⁻ → H₂O. At the equivalence point the moles of OH⁻ added equal the moles of H⁺ present, and the solution contains only NaCl and water, pH 7.', 'Near the equivalence point the pH changes extremely quickly: for 0.1 M solutions a single drop moves it from about pH 4 to pH 10. Any indicator that changes colour inside that jump (phenolphthalein, 8.2–10; methyl orange, 3.1–4.4) marks the end point to within a drop.'],
    eq: ['HCl(aq) + NaOH(aq) → NaCl(aq) + H₂O(l)', 'net: H⁺(aq) + OH⁻(aq) → H₂O(l)'],
    why: ['An indicator is itself a weak acid HIn whose two forms have different colours; it changes colour over about pK ± 1.', 'Rinse the burette with the titrant (water would dilute it) and the pipette with the sample; the conical flask may be wet, because water does not change the moles present.', 'The first titration is a rough one; later ones go drop by drop near the end point until two agree within 0.1 mL.'],
    calc: ['M₁V₁ = M₂V₂ for a 1 : 1 reaction: M(HCl) = M(NaOH) × V(NaOH) / V(HCl).'],
    err: ['Parallax when reading the burette (read the bottom of the meniscus at eye level).', 'NaOH absorbs CO₂ from air, forming carbonate; this is why NaOH is standardised against a primary standard such as oxalic acid.'],
  });
  add('naoh-oxalic', {
    p: ['NaOH cannot be weighed accurately (it is hygroscopic and absorbs CO₂), so its exact concentration is found by titrating it against a primary standard: a pure, stable solid that can be weighed exactly. Oxalic acid dihydrate, H₂C₂O₄·2H₂O (M = 126.07), is such a standard.', 'Oxalic acid is diprotic (pK₁ 1.25, pK₂ 4.27). Both protons are titrated before the end point, which lies near pH 8.5 because the product, oxalate, is a weak base.'],
    eq: ['H₂C₂O₄ + 2NaOH → Na₂C₂O₄ + 2H₂O'],
    why: ['Phenolphthalein (8.2–10) is used, not methyl orange: the end point is slightly alkaline, and methyl orange would change colour after only part of the acid had reacted.', 'The pink must persist for about 30 s; it fades slowly afterwards as CO₂ from air is absorbed.'],
    calc: ['moles NaOH = 2 × moles oxalic acid, so M(NaOH) = 2 × M(acid) × V(acid) / V(NaOH).', 'Normality form: N₁V₁ = N₂V₂ with N(oxalic acid) = 2 × molarity.'],
    err: ['Carbonate in the NaOH reacts only partly at the phenolphthalein end point and makes the end point drift.', 'Oxalic acid must be the dihydrate, not partly dried.'],
  });
  add('vinegar', {
    p: ['Vinegar is mostly a 4–8 % solution of acetic acid, a weak acid (K_a = 1.75 × 10⁻⁵, pK_a 4.76). It is diluted ten times so that the titre falls in a convenient range.', 'Because acetate is a weak base, the solution at the equivalence point is alkaline (pH ≈ 8.7). The pH jump is smaller than for a strong acid and lies wholly in the alkaline region.'],
    eq: ['CH₃COOH + NaOH → CH₃COONa + H₂O', 'at equivalence: CH₃COO⁻ + H₂O ⇌ CH₃COOH + OH⁻ (pH > 7)'],
    why: ['Phenolphthalein is the right indicator; methyl orange would change colour far too early (around pH 4, half way to the end point).', 'Halfway to the end point [CH₃COOH] = [CH₃COO⁻], so pH = pK_a (Henderson–Hasselbalch): a pH meter shows this as a flat buffer region.'],
    calc: ['M(diluted) = M(NaOH) × V(NaOH) / V(aliquot); M(vinegar) = 10 × M(diluted); g/100 mL = M × 60.05 / 10.'],
    err: ['Coloured vinegar hides the end point: use white vinegar or dilute further.', 'Other acids in vinegar are counted as acetic acid.'],
  });
  add('carb-bicarb', {
    p: ['Carbonate is a diprotic base: CO₃²⁻ takes one proton to become HCO₃⁻ (equivalence near pH 8.3) and a second to become H₂CO₃ (CO₂ + H₂O, equivalence near pH 3.9).', 'With two indicators in sequence the two steps can be read separately: phenolphthalein loses its colour at the first, methyl orange turns from yellow to orange at the second.'],
    eq: ['V₁ (phenolphthalein): CO₃²⁻ + H⁺ → HCO₃⁻', 'V₂ − V₁ (methyl orange): HCO₃⁻ + H⁺ → H₂CO₃ (→ CO₂ + H₂O)'],
    why: ['The HCO₃⁻ titrated in the second stage comes from two sources: the original bicarbonate and the bicarbonate made from carbonate in the first stage.', 'Near the second end point, boiling out CO₂ sharpens the methyl orange change.'],
    calc: ['Na₂CO₃ ≡ V₁; NaHCO₃ ≡ (V₂ − V₁) − V₁ = V₂ − 2V₁ (both against the same HCl).'],
    err: ['Going past the first end point too quickly (local excess of acid) converts some HCO₃⁻ to CO₂ early: titrate slowly with swirling.', 'Loss of CO₂ from the solution before the first end point.'],
  });
  add('naoh-carb', {
    p: ['NaOH and Na₂CO₃ often occur together because NaOH absorbs CO₂ from the air. At the phenolphthalein end point all the OH⁻ has been neutralised and all CO₃²⁻ has been converted to HCO₃⁻. Only HCO₃⁻ is titrated between the first and second end points.'],
    eq: ['V₁: OH⁻ + H⁺ → H₂O and CO₃²⁻ + H⁺ → HCO₃⁻', 'V₂ − V₁: HCO₃⁻ + H⁺ → H₂CO₃'],
    why: ['The second stage measures carbonate alone, so carbonate ≡ V₂ − V₁ and NaOH ≡ V₁ − (V₂ − V₁) = 2V₁ − V₂.', 'If V₂ − V₁ > V₁ the mixture must be carbonate + bicarbonate instead; if V₂ − V₁ = V₁ it is pure carbonate.'],
    calc: ['Na₂CO₃ = M(HCl)(V₂ − V₁)/V; NaOH = M(HCl)(2V₁ − V₂)/V.'],
    err: ['Absorption of more CO₂ during the titration changes the ratio: keep the flask covered and titrate without delay.'],
  });

  // ================================================================ redox titrations
  const PERM = ['Permanganate is a powerful oxidant in acid: MnO₄⁻ + 8H⁺ + 5e⁻ → Mn²⁺ + 4H₂O (E° = +1.51 V). It is intensely purple while Mn²⁺ is nearly colourless, so it acts as its own indicator: the end point is the first permanent faint pink from one drop of excess.', 'The acid must be sulfuric acid. HCl would be oxidised to Cl₂, and HNO₃ is itself an oxidant. Insufficient acid gives brown MnO₂ instead of Mn²⁺.'];
  add('kmno4-oxalic', {
    p: PERM.concat(['KMnO₄ is not a primary standard: it contains MnO₂ and decomposes slowly, so it is standardised against oxalic acid (or sodium oxalate).', 'The reaction is slow at room temperature and is catalysed by its own product, Mn²⁺ (autocatalysis). It is therefore done at 60–70 °C: the first drops decolourise slowly, then the reaction speeds up.']),
    eq: ['2MnO₄⁻ + 5H₂C₂O₄ + 6H⁺ → 2Mn²⁺ + 10CO₂ + 8H₂O'],
    why: ['Heating below 60 °C makes the end point sluggish; boiling decomposes oxalic acid.', 'A brown precipitate means too little acid (MnO₂ forming): add more H₂SO₄.'],
    calc: ['moles MnO₄⁻ = (2/5) moles oxalic acid; M(KMnO₄) = 2 M(ox) V(ox) / (5 V(KMnO₄)).'],
    err: ['Read the top of the meniscus: KMnO₄ is too dark to see the bottom.', 'Standardise freshly: KMnO₄ slowly decomposes, faster in light.'],
  });
  add('mohr-kmno4', {
    p: PERM.concat(['Mohr’s salt, ferrous ammonium sulfate FeSO₄·(NH₄)₂SO₄·6H₂O, is a stable source of Fe²⁺ (air oxidises plain FeSO₄). Each Fe²⁺ gives up one electron, so five Fe²⁺ react with each MnO₄⁻.']),
    eq: ['MnO₄⁻ + 5Fe²⁺ + 8H⁺ → Mn²⁺ + 5Fe³⁺ + 4H₂O'],
    why: ['No heating is needed: the Fe²⁺ reaction is fast.', 'The solution turns very pale yellow as Fe³⁺ forms; the pink end point is easily seen over it.'],
    calc: ['M(Fe²⁺) = 5 M(KMnO₄) V(KMnO₄) / V(Fe²⁺); Mohr’s salt (g/L) = M × 392.14.'],
    err: ['Fe²⁺ solutions oxidise in air: prepare with dilute H₂SO₄ and use promptly.'],
  });
  add('h2o2-kmno4', {
    p: PERM.concat(['Here H₂O₂ acts as a reducing agent: it gives up two electrons and is oxidised to O₂. The strength of commercial H₂O₂ is often quoted as “volume strength”: the litres of O₂ (at STP) that 1 L of the solution releases on decomposition (2H₂O₂ → 2H₂O + O₂). 1 M H₂O₂ gives 11.2 volumes.']),
    eq: ['2MnO₄⁻ + 5H₂O₂ + 6H⁺ → 2Mn²⁺ + 5O₂ + 8H₂O'],
    why: ['The sample is diluted ten times so that the titre is convenient.', 'Effervescence (O₂) is seen as each drop reacts.'],
    calc: ['M(H₂O₂, diluted) = 5 M(KMnO₄) V / (2 × aliquot); original = 10 × that; volume strength = 11.2 × M.'],
    err: ['Commercial H₂O₂ contains stabilisers (e.g. acetanilide) that may react slowly with permanganate.'],
  });
  add('fe-dichromate', {
    p: ['Potassium dichromate is a primary standard (pure, stable, can be weighed directly). In acid Cr₂O₇²⁻ + 14H⁺ + 6e⁻ → 2Cr³⁺ + 7H₂O (E° = +1.33 V). Unlike permanganate it does not oxidise chloride, so HCl solutions can be titrated.', 'Its own colour change (orange → green Cr³⁺) is not sharp enough, so an internal redox indicator is added: diphenylamine (or sodium diphenylamine sulfonate), which is oxidised to an intense violet-blue form once all the Fe²⁺ is gone.'],
    eq: ['Cr₂O₇²⁻ + 6Fe²⁺ + 14H⁺ → 2Cr³⁺ + 6Fe³⁺ + 7H₂O'],
    why: ['H₃PO₄ (or NaF) is added to complex the Fe³⁺ formed. This lowers the Fe³⁺/Fe²⁺ potential, so the indicator is not oxidised before the end point, and it removes the yellow colour of Fe³⁺.', 'The green colour of Cr³⁺ builds up during the titration; at the end point it turns violet-blue sharply.'],
    calc: ['M(Fe²⁺) = 6 M(K₂Cr₂O₇) V(K₂Cr₂O₇) / V(Fe²⁺).'],
    err: ['Without phosphoric acid the end point comes early.', 'Too little indicator gives a faint end point; too much consumes dichromate.'],
  });
  add('iodo-cu', {
    p: ['Iodometry: an oxidant is allowed to react with excess iodide, and the iodine set free is titrated with sodium thiosulfate. Cu²⁺ oxidises I⁻ because the product CuI is so insoluble (K_sp ≈ 1 × 10⁻¹²) that it pulls the reaction forward, even though E°(Cu²⁺/Cu⁺) = 0.15 V is below E°(I₂/I⁻) = 0.54 V.', 'Iodine is held in solution as I₃⁻ (brown). Starch forms an intensely blue-black complex with I₃⁻, which makes the last traces of iodine visible.'],
    eq: ['2Cu²⁺ + 4I⁻ → 2CuI(s) + I₂', 'I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻'],
    why: ['Starch is added only near the end point (pale straw colour): with a lot of iodine the starch complex dissociates slowly and the end point comes late.', 'The solution must be weakly acidic (acetic acid): in strong acid iodide is oxidised by air, in alkali thiosulfate is oxidised to sulfate.', 'Near the end, KSCN is often added: it converts CuI to CuSCN and releases iodine adsorbed on the precipitate.'],
    calc: ['1 Cu²⁺ ≡ ½ I₂ ≡ 1 S₂O₃²⁻, so M(Cu²⁺) = M(thio) × V(thio) / V(Cu²⁺).'],
    err: ['Loss of volatile iodine: titrate promptly in a cool flask.', 'Fe³⁺ also oxidises iodide and must be masked (fluoride) if present.'],
  });
  add('edta-hardness', {
    p: ['Hardness is caused by dissolved Ca²⁺ and Mg²⁺. EDTA (as Na₂H₂Y) is a hexadentate ligand that binds every metal ion 1 : 1, forming very stable chelates (log K: CaY²⁻ 10.7, MgY²⁻ 8.7).', 'Eriochrome Black T (EBT) is a metal indicator: at pH 10 the free dye is blue, its Mg²⁺/Ca²⁺ complex is wine red. EDTA binds the metals more strongly, so at the end point it takes the last metal from the indicator and the colour turns blue.'],
    eq: ['Ca²⁺ + H₂Y²⁻ → CaY²⁻ + 2H⁺', 'MgIn⁻ (wine red) + H₂Y²⁻ → MgY²⁻ + HIn²⁻ (blue) + H⁺'],
    why: ['The NH₃/NH₄Cl buffer keeps pH 10: the H⁺ released would otherwise lower the pH and weaken the complexes; above pH 11 Mg(OH)₂ would precipitate.', 'Near the end point add EDTA slowly: the metal–indicator exchange is not instantaneous.'],
    calc: ['hardness (mg/L as CaCO₃) = V(EDTA) × M(EDTA) × 100.09 × 1000 / V(sample).'],
    err: ['Cu²⁺ and Fe³⁺ block (poison) EBT; they are masked with cyanide or triethanolamine.', 'Old EBT solution gives a dull end point.'],
  });
  add('oxalate-mix', {
    p: ['Two different titrations measure two different things. The acid–base titration with NaOH counts only the acidic protons, which come from oxalic acid alone (2 per molecule). The redox titration with KMnO₄ oxidises every oxalate unit, whether it came from the acid or from the salt.', 'Subtracting gives the sodium oxalate. This “two methods on one sample” approach is used for many mixtures.'],
    eq: ['A: H₂C₂O₄ + 2OH⁻ → C₂O₄²⁻ + 2H₂O', 'B: 2MnO₄⁻ + 5C₂O₄²⁻ + 16H⁺ → 2Mn²⁺ + 10CO₂ + 8H₂O'],
    why: ['In part A the oxalate already present is a weak base, but it does not interfere: the phenolphthalein end point (pH ≈ 8.5) is reached when the added OH⁻ equals the acidic H⁺.', 'Part B needs 60–70 °C and dilute H₂SO₄, as in the standardisation of KMnO₄.'],
    calc: ['[H₂C₂O₄] = M(NaOH) V_A / (2 V); total oxalate = 5 M(KMnO₄) V_B / (2 V); [Na₂C₂O₄] = total − [H₂C₂O₄].'],
    err: ['Errors in both titrations add up in the difference: the smaller component is the least accurate.'],
  });
  add('fe-mix', {
    p: ['Dichromate oxidises only Fe²⁺. To find the Fe³⁺ as well, a second portion is first reduced completely to Fe²⁺ with tin(II) chloride in hot HCl. The excess Sn²⁺ would also react with dichromate, so it is destroyed with HgCl₂, which is reduced to insoluble, silky white Hg₂Cl₂ that does not react further.'],
    eq: ['2Fe³⁺ + Sn²⁺ → 2Fe²⁺ + Sn⁴⁺', 'Sn²⁺ + 2HgCl₂ → Sn⁴⁺ + Hg₂Cl₂(s) + 2Cl⁻', 'Cr₂O₇²⁻ + 6Fe²⁺ + 14H⁺ → 2Cr³⁺ + 6Fe³⁺ + 7H₂O'],
    why: ['SnCl₂ is added dropwise until the yellow of Fe³⁺ just disappears, then one drop more: a large excess reduces HgCl₂ to black mercury, and the sample must be discarded.', 'The HgCl₂ is added quickly in one portion for the same reason.'],
    calc: ['Fe²⁺ = 6 M(Cr₂O₇²⁻) V_A / V; total Fe = 6 M V_B / V; Fe³⁺ = total − Fe²⁺.'],
    err: ['A grey or black precipitate after adding HgCl₂ means too much SnCl₂ (metallic Hg): repeat.', 'Mercury salts are toxic: modern methods use TiCl₃ or a Jones reductor instead.'],
  });
  add('edta-camg', {
    p: ['EDTA titrates Ca²⁺ and Mg²⁺ together at pH 10. To find calcium alone the pH is raised to 12–13 with NaOH: Mg²⁺ precipitates as Mg(OH)₂ (K_sp ≈ 6 × 10⁻¹²) and is no longer titrated, while Ca(OH)₂ remains in solution at these concentrations.', 'EBT cannot be used at pH 12, so murexide (or Patton–Reeder indicator) is used: pink with Ca²⁺, violet when free.'],
    eq: ['pH 10: Ca²⁺ + Mg²⁺ both react with H₂Y²⁻ (1 : 1)', 'pH 12: Mg²⁺ + 2OH⁻ → Mg(OH)₂(s); only Ca²⁺ + Y⁴⁻ → CaY²⁻'],
    why: ['Add the NaOH and titrate promptly: the Mg(OH)₂ precipitate can adsorb some Ca²⁺, and the solution absorbs CO₂ (CaCO₃).'],
    calc: ['(Ca + Mg) = M(EDTA) V_A / V; Ca = M(EDTA) V_B / V; Mg = difference.'],
    err: ['Murexide solutions decompose within a day: use the solid ground with NaCl.'],
  });
  add('fe-cu-mix', {
    p: ['In a mixture each metal must be determined without interference from the other. Fe³⁺ would also oxidise iodide, so for copper it is masked: fluoride (from NH₄HF₂) forms the very stable, colourless [FeF₆]³⁻, whose Fe³⁺/Fe²⁺ potential is too low to oxidise I⁻. NH₄HF₂ also buffers the solution near pH 3.5.', 'For iron, the metals are separated: excess ammonia precipitates Fe(OH)₃ while Cu²⁺ stays in solution as [Cu(NH₃)₄]²⁺. The precipitate is dissolved in HCl, reduced with SnCl₂ and titrated with dichromate.'],
    eq: ['Fe³⁺ + 6F⁻ → [FeF₆]³⁻', '2Cu²⁺ + 4I⁻ → 2CuI + I₂; I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻', 'Fe³⁺ + 3NH₃ + 3H₂O → Fe(OH)₃ + 3NH₄⁺; Cu²⁺ + 4NH₃ → [Cu(NH₃)₄]²⁺'],
    why: ['Masking (forming a stable complex) and separation (precipitation) are the two standard ways to remove an interference.'],
    calc: ['Cu (g/L) = M(thio) V_A / V × 63.55; Fe (g/L) = 6 M(Cr₂O₇²⁻) V_B / V × 55.85.'],
    err: ['Wash the Fe(OH)₃ precipitate with dilute ammonia until the washings are no longer blue, or copper is carried into the iron result.'],
  });
  add('brass', {
    p: ['Brass is a copper–zinc alloy (typically 55–70 % Cu). After dissolving in nitric acid, copper is determined iodometrically; Zn²⁺ does not oxidise iodide and does not interfere.', 'Nitrogen oxides from the HNO₃ would oxidise iodide and give high results, so they are boiled off (or destroyed with urea). Excess acid is neutralised and the solution made weakly acidic with acetic acid.'],
    eq: ['3Cu + 8HNO₃ → 3Cu(NO₃)₂ + 2NO + 4H₂O', '2Cu²⁺ + 4I⁻ → 2CuI + I₂; I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻'],
    why: ['Zinc in the same solution can be found afterwards by EDTA, after masking copper (e.g. with thiosulfate).'],
    calc: ['% Cu = M(thio) × V × (100/25) × 63.55 / (1000 × mass of brass) × 100.'],
    err: ['Incomplete removal of NOx gives a returning blue end point (air/NO re-oxidises iodide).'],
  });
  add('winkler', {
    p: ['Dissolved oxygen (DO) is measured by first “fixing” it as a manganese precipitate, then converting that into an equivalent amount of iodine. In alkaline solution Mn(OH)₂ is oxidised by O₂ to brown MnO(OH)₂. On acidification this oxidises iodide to iodine, which is titrated with thiosulfate.', 'Azide in the alkaline iodide destroys nitrite, which would otherwise also liberate iodine.'],
    eq: ['2Mn²⁺ + 4OH⁻ + O₂ → 2MnO(OH)₂', 'MnO(OH)₂ + 2I⁻ + 4H⁺ → Mn²⁺ + I₂ + 3H₂O', 'I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻', 'overall: 1 O₂ ≡ 4 S₂O₃²⁻'],
    why: ['The bottle is filled completely and reagents are added under the surface, so no air is trapped.', 'Clean water at 25 °C saturated with air holds about 8 mg/L O₂; values below about 5 mg/L stress fish.'],
    calc: ['DO (mg/L) = V(thio) × M(thio) × 8000 / V(sample) (8000 = ¼ × 32 g/mol × 1000 mg/g).'],
    err: ['Air bubbles in the bottle give high results; delayed fixing allows biological consumption of O₂.'],
  });
  add('vitc', {
    p: ['Ascorbic acid (vitamin C) is a strong reducing agent. Iodine oxidises it rapidly and quantitatively to dehydroascorbic acid. This is iodimetry: the titrant is iodine itself (as I₃⁻ in KI).', 'As long as ascorbic acid remains, each drop of iodine is reduced immediately and the starch stays colourless; the first excess of iodine turns the starch blue-black.'],
    eq: ['C₆H₈O₆ + I₂ → C₆H₆O₆ + 2H⁺ + 2I⁻'],
    why: ['Freshly boiled water and dilute acid are used because ascorbic acid is oxidised by dissolved oxygen, faster in neutral or alkaline solution.', 'Starch can be added at the start here, because the iodine never accumulates before the end point.'],
    calc: ['moles of ascorbic acid = M(I₂) × V(I₂); mg per tablet = moles × 176.12 × 1000 × (250/25).'],
    err: ['Delay between dissolving and titrating lowers the result.', 'Other reducing substances in the tablet are counted as vitamin C.'],
  });
  add('sap-value', {
    p: ['Fats and oils are triglycerides. Boiling with alcoholic KOH saponifies them: each triglyceride consumes three KOH, giving glycerol and potassium soaps.', 'The saponification value (SV) is the mg of KOH needed to saponify 1 g of fat. Since 1 g contains fewer molecules when the fatty-acid chains are long, a high SV means short chains (coconut oil ≈ 255; most seed oils 170–195).'],
    eq: ['(RCOO)₃C₃H₅ + 3KOH → 3RCOO⁻K⁺ + C₃H₅(OH)₃', 'excess KOH + HCl → KCl + H₂O'],
    why: ['This is a back titration: the KOH is added in excess and what is left is titrated. The blank (same KOH, no oil) gives the total KOH, so its exact concentration need not be known.', 'Phenolphthalein end point: the soaps (salts of weak acids, pK ≈ 4.8) are not titrated before pH 8.2.'],
    calc: ['SV = 56.1 × (V_blank − V_sample) × M(HCl) / mass of oil (g).', 'Mean molar mass of the fat ≈ 3 × 56.1 × 1000 / SV.'],
    err: ['Incomplete saponification (too short a reflux) gives a low SV.', 'Alcoholic KOH absorbs CO₂: run the blank at the same time as the sample.'],
  });
  add('glycine', {
    p: ['Amino acids are zwitterions (⁺H₃N–CH₂–COO⁻). The –NH₃⁺ group is a very weak acid (pK ≈ 9.6) and gives no sharp end point.', 'Sørensen’s formol titration adds formaldehyde, which reacts with the free –NH₂ to form N-methylol derivatives. The nitrogen now holds its proton much less firmly (pK ≈ 6.5), so the protons released can be titrated sharply with NaOH to phenolphthalein.'],
    eq: ['⁺H₃N–CH₂–COO⁻ ⇌ H₂N–CH₂–COO⁻ + H⁺', 'H₂N–CH₂–COO⁻ + 2HCHO → (HOCH₂)₂N–CH₂–COO⁻ (removes the base, pulls the equilibrium to the right)'],
    why: ['The formalin is neutralised to phenolphthalein beforehand, because commercial formalin contains formic acid.', 'Without formalin the pink appears gradually long before the equivalence point: compare the two runs.'],
    calc: ['moles of amino groups = M(NaOH) × V(NaOH); glycine (g/L) = M × 75.07.'],
    err: ['Ammonium salts also react with formaldehyde and are counted.'],
  });
  add('glucose', {
    p: ['Glucose is a reducing sugar: its aldehyde group (in the open-chain form) is oxidised to a carboxylate. In alkaline solution iodine forms hypoiodite (IO⁻), which oxidises the aldehyde. Ketoses such as fructose react only slowly under these conditions.', 'Excess iodine is used and the remainder is titrated with thiosulfate after acidifying (a back titration). A blank with water gives the total iodine.'],
    eq: ['I₂ + 2OH⁻ → IO⁻ + I⁻ + H₂O', 'RCHO + IO⁻ + OH⁻ → RCOO⁻ + I⁻ + H₂O (net: 1 glucose ≡ 1 I₂)', 'after acidifying: IO⁻ + I⁻ + 2H⁺ → I₂ + H₂O; I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻'],
    why: ['The NaOH is added slowly and the mixture kept below room temperature: too much alkali or heat over-oxidises the sugar and gives high results.'],
    calc: ['moles of glucose = (V_blank − V_sample) × M(thio) / 2; g/L = moles / volume × 180.16.'],
    err: ['Loss of iodine during the standing period; keep stoppered and in the dark.'],
  });

  // ================================================================ instrumental titrations
  add('conduct-mix', {
    p: ['Conductometric titrations follow the conductivity κ of the solution, which depends on how many ions are present and how fast they move. H⁺ (349.8 S cm² mol⁻¹) and OH⁻ (198.6) are far more mobile than other ions (Na⁺ 50.1, CH₃COO⁻ 40.9), because they move by proton hopping through hydrogen bonds (the Grotthuss mechanism).', 'With a mixture of HCl and CH₃COOH, NaOH first neutralises the strong acid: fast H⁺ is replaced by slow Na⁺ and κ falls steeply. Then the weak acid reacts, making Na⁺ and CH₃COO⁻ from almost un-ionised acid, so κ rises gently. After both end points, excess OH⁻ makes κ rise steeply.'],
    eq: ['H⁺ + Cl⁻ + Na⁺ + OH⁻ → Na⁺ + Cl⁻ + H₂O', 'CH₃COOH + Na⁺ + OH⁻ → Na⁺ + CH₃COO⁻ + H₂O'],
    why: ['The cell solution is diluted (here to 100 mL) and the titrant is concentrated, so that the volume change is small and the straight lines stay straight.', 'Readings near the end points are curved; the end points come from the intersection of straight lines drawn through points away from them. No indicator is needed, and coloured or turbid solutions can be titrated.'],
    calc: ['V₁ (first break) ≡ HCl; V₂ − V₁ ≡ CH₃COOH; M = M(NaOH) × V / V(aliquot).'],
    err: ['Temperature changes κ by about 2 % per °C: keep the cell at constant temperature.'],
  });
  add('conduct-weak', {
    p: ['At the start acetic acid is only slightly ionised, so κ is low. NaOH converts it to sodium acetate, a fully ionised salt, so κ rises slowly (the first small dip comes from suppressing the few H⁺ ions). After the end point, highly mobile OH⁻ accumulates and κ rises much more steeply.'],
    eq: ['CH₃COOH + OH⁻ → CH₃COO⁻ + H₂O'],
    why: ['Using NH₃ instead of NaOH as titrant gives a flat line after the end point (NH₃ is hardly ionised) and an even sharper break.'],
    calc: ['End point from the intersection of the two straight lines; M(acid) = M(NaOH) V_e / V.'],
    err: ['Hydrolysis of acetate rounds the curve near the end point, so use points well away from it.'],
  });
  add('potent-mohr', {
    p: ['Potentiometry measures the potential of an indicator electrode (here platinum) against a reference electrode (saturated calomel, +0.244 V vs SHE). Platinum takes up the potential of the Fe³⁺/Fe²⁺ couple in solution, given by the Nernst equation: E = E° + 0.0592 log([Fe³⁺]/[Fe²⁺]).', 'Before the end point the potential rises slowly as the ratio changes. At the end point it jumps by several hundred mV to the potential set by the Cr₂O₇²⁻/Cr³⁺ couple.'],
    eq: ['Cr₂O₇²⁻ + 6Fe²⁺ + 14H⁺ → 2Cr³⁺ + 6Fe³⁺ + 7H₂O', 'E(cell) = E(Pt) − E(SCE)'],
    why: ['The end point is the steepest point, located from the maximum of ΔE/ΔV (or where Δ²E/ΔV² = 0). Small additions near it improve the accuracy.', 'At half the end-point volume [Fe³⁺] = [Fe²⁺], so the log term is zero and E(Pt) = E° (formal potential of Fe³⁺/Fe²⁺ in this medium).'],
    calc: ['M(Fe²⁺) = 6 M(K₂Cr₂O₇) V_e / V; E° = E(cell at V_e/2) + 0.244 V.'],
    err: ['A dirty Pt electrode responds slowly: wait for steady readings.', 'The measured value is a formal potential, which depends on the acid and its concentration (≈ 0.68–0.77 V).'],
  });
  add('potent-agcl', {
    p: ['A silver electrode responds to [Ag⁺]: E = E°(Ag⁺/Ag) + 0.0592 log[Ag⁺], with E° = +0.799 V. As Cl⁻ precipitates AgCl, [Ag⁺] falls slowly at first and then by several powers of ten at the equivalence point, where the potential drops sharply.', 'At the equivalence point the solution is just saturated AgCl, so [Ag⁺] = [Cl⁻] = √K_sp. Measuring E there gives K_sp.'],
    eq: ['Ag⁺ + Cl⁻ → AgCl(s)', 'K_sp = [Ag⁺][Cl⁻] ≈ 1.8 × 10⁻¹⁰ (25 °C)'],
    why: ['A salt bridge with KNO₃ (not KCl) is used to connect the calomel electrode, because chloride leaking into the cell would precipitate AgCl.'],
    calc: ['M(Ag⁺) = M(KCl) V_e / V; [Ag⁺] at V_e = 10^((E(cell) + 0.244 − 0.799)/0.0592); K_sp = [Ag⁺]².'],
    err: ['Adsorption of ions on the AgCl precipitate and activity effects make the K_sp from this method approximate.'],
  });

  // ================================================================ kinetics
  add('clock', {
    p: ['In the iodine clock, H₂O₂ slowly oxidises iodide in acid. A small, fixed amount of thiosulfate is also present: it reduces every I₂ back to I⁻ as fast as it is formed. Only when the thiosulfate is used up does free iodine appear and react with starch: the solution turns blue-black suddenly.', 'The time t is the time needed to make a fixed amount of I₂ (half the moles of thiosulfate), so the initial rate is proportional to 1/t. Because only a little of the reactants is consumed, their concentrations stay close to the starting values: this is the initial-rate method.'],
    eq: ['H₂O₂ + 2I⁻ + 2H⁺ → I₂ + 2H₂O (slow, rate-determining)', 'I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻ (fast)', 'rate = k[H₂O₂]ᵐ[I⁻]ⁿ; rate = [S₂O₃²⁻]₀ / (2t)'],
    why: ['Change one concentration at a time: if doubling [H₂O₂] halves t, the reaction is first order in H₂O₂.', 'Arrhenius: k = A e^(−Eₐ/RT). A plot of ln(1/t) against 1/T has slope −Eₐ/R.', 'The mechanism (H₂O₂ + I⁻ → H₂O + IO⁻, slow; then fast steps) explains why the reaction is first order in each reactant.'],
    calc: ['m = Δlog(rate)/Δlog[H₂O₂] at constant [I⁻] and T; n likewise; Eₐ = −R × slope of ln(rate) against 1/T.'],
    err: ['Temperature must be constant within each set: k changes by about 7 % per °C here.', 'Start the stopwatch at the moment of mixing and judge the first blue consistently.'],
  });
  add('persulfate', {
    p: ['Peroxodisulfate oxidises iodide in a slow reaction between two negative ions. As in the H₂O₂ clock, a fixed small amount of thiosulfate delays the appearance of iodine; the time to the blue colour measures the initial rate.', 'Because both reactants are anions that repel each other, the rate increases with the ionic strength of the solution (the primary kinetic salt effect, Brønsted–Bjerrum): ions of opposite charge around them screen the repulsion. Real experiments keep the ionic strength constant with an inert salt.'],
    eq: ['S₂O₈²⁻ + 2I⁻ → 2SO₄²⁻ + I₂ (slow)', 'I₂ + 2S₂O₃²⁻ → 2I⁻ + S₄O₆²⁻ (fast)', 'rate = k[S₂O₈²⁻][I⁻]'],
    why: ['Traces of Fe²⁺/Cu²⁺ catalyse the reaction strongly, so clean glassware and pure water are needed.', 'log k is predicted to rise linearly with √I with slope ≈ 1.02 z_A z_B (= +4.1 here) in dilute solution.'],
    calc: ['Orders from log–log plots at constant other conditions; Eₐ from ln(rate) against 1/T.'],
    err: ['Changing [KI] also changes the ionic strength; compensate with KNO₃.'],
  });
  add('h2o2', {
    p: ['Hydrogen peroxide is thermodynamically unstable but decomposes slowly unless catalysed. Iodide is a homogeneous catalyst: it is oxidised to IO⁻, which is then reduced back by another H₂O₂. Fe³⁺ catalyses the reaction through a redox cycle in the same way.', 'The rate is proportional to [H₂O₂] (first order) at a fixed catalyst concentration, and the observed rate constant is proportional to the catalyst concentration.'],
    eq: ['2H₂O₂ → 2H₂O + O₂', 'H₂O₂ + I⁻ → H₂O + IO⁻ (slow); H₂O₂ + IO⁻ → H₂O + O₂ + I⁻ (fast)', 'ln[H₂O₂]ₜ = ln[H₂O₂]₀ − kt'],
    why: ['The H₂O₂ left at each time is found by titrating a sample with KMnO₄ in acid; the titre is proportional to [H₂O₂], so ln V against t is a straight line.', 'Samples are quenched in cold dilute H₂SO₄, which stops the catalysed reaction before titration.', 'A first-order half-life is independent of the starting concentration: t½ = 0.693/k.'],
    calc: ['k = −slope of ln V against t.'],
    err: ['Take samples at accurately known times; run the KMnO₄ titrations quickly.'],
  });
  add('ester', {
    p: ['Methyl acetate is hydrolysed slowly by water, and H⁺ catalyses the reaction. The rate is k[ester][H₂O][H⁺]; water is in huge excess and H⁺ is not consumed, so both are constant and the reaction is pseudo-first-order: rate = k′[ester].', 'The progress is followed by titrating samples with NaOH. The titre counts both the catalyst HCl (constant) and the acetic acid formed (increasing).'],
    eq: ['CH₃COOCH₃ + H₂O ⇌ CH₃COOH + CH₃OH (H⁺ catalysed)', 'k = (2.303/t) log[(V∞ − V₀)/(V∞ − Vₜ)]'],
    why: ['V₀ corresponds to the HCl alone; V∞ (after complete hydrolysis, by heating) to HCl + all the acid that can form; V∞ − Vₜ is proportional to the ester left.', 'Samples are run into ice-cold water: cooling and dilution practically stop the reaction until titration.'],
    calc: ['k from the slope of ln(V∞ − Vₜ) against t, or as the mean of single values.'],
    err: ['If V∞ is found by heating too strongly, some methyl acetate (b.p. 57 °C) evaporates and V∞ is too low.'],
  });
  add('sapon', {
    p: ['Ethyl acetate reacts with hydroxide in a second-order reaction (first order in each). With equal starting concentrations a, the integrated law is 1/(a − x) − 1/a = kt, or x/[a(a − x)] = kt.', 'The reaction replaces fast OH⁻ ions (198.6 S cm² mol⁻¹) by slow acetate ions (40.9), so the conductivity falls as the reaction proceeds. κ changes linearly with the extent x.'],
    eq: ['CH₃COOC₂H₅ + OH⁻ → CH₃COO⁻ + C₂H₅OH', 'f = (κ₀ − κₜ)/(κ₀ − κ∞) = x/a; f/(1 − f) = k a t'],
    why: ['κ₀ is the conductivity of NaOH at concentration a; κ∞ that of sodium acetate at concentration a.', 'The half-life of a second-order reaction depends on the starting concentration: t½ = 1/(ka).'],
    calc: ['k = slope / a, where the slope is that of f/(1 − f) against t.'],
    err: ['CO₂ from the air removes OH⁻; use fresh, CO₂-free NaOH.', 'Mixing time and temperature control are critical in the first minutes.'],
  });
  add('ester-naoh', {
    p: ['The same second-order saponification as in the conductometric experiment, followed here by titration. Each sample is run into a known excess of HCl, which neutralises the remaining OH⁻ at once and so stops the reaction; the unused HCl is then back-titrated with NaOH.', 'With equal starting concentrations a, 1/(a − x) = 1/a + kt: a straight line of slope k.'],
    eq: ['CH₃COOC₂H₅ + OH⁻ → CH₃COO⁻ + C₂H₅OH', 'quench: OH⁻ (remaining) + H⁺ (excess) → H₂O; back titration: H⁺ (left) + OH⁻ → H₂O'],
    why: ['The larger the back-titre, the less OH⁻ was left in the sample, i.e. the further the reaction had gone.', 'A plot of ln(a − x) against t would curve: only the second-order plot is straight, which is how the order is shown.'],
    calc: ['(a − x) = (V(HCl) M(HCl) − V(back) M(NaOH)) / V(sample); k = slope of 1/(a − x) against t (M⁻¹ min⁻¹).'],
    err: ['Note the time when the sample is run into the acid, not when the pipette is filled.'],
  });
  add('sucrose', {
    p: ['Sucrose is hydrolysed by acid into glucose and fructose (“invert sugar”). The reaction is first order in sucrose (water is in excess and H⁺ is a catalyst), with k proportional to [H⁺].', 'It is followed with a polarimeter: all three sugars are optically active. Sucrose has [α] = +66.5°, glucose +52.7°, fructose −92.4°, so the rotation falls from positive to negative as the reaction proceeds (hence the name “inversion”). The angle is a linear function of the concentrations.'],
    eq: ['C₁₂H₂₂O₁₁ + H₂O → C₆H₁₂O₆ (glucose) + C₆H₁₂O₆ (fructose)', 'ln(αₜ − α∞) = ln(α₀ − α∞) − kt'],
    why: ['α∞ is measured after complete inversion (warming), because the reaction takes hours at room temperature.', 'Specific rotation [α] = α / (l × c), with l in dm and c in g/mL; it depends on wavelength (sodium D line) and temperature.', 'The activation energy is high (≈ 108 kJ/mol), so k is very temperature sensitive.'],
    calc: ['k = −slope of ln(αₜ − α∞) against t.'],
    err: ['Air bubbles in the polarimeter tube; temperature drift; mutarotation of the products is fast enough to ignore here.'],
  });

  // ================================================================ calorimetry
  const CAL = ['A calorimeter is an insulated vessel. The heat released or absorbed by the reaction changes the temperature of the solution and of the calorimeter itself. The calorimeter’s heat capacity is expressed as its water equivalent W (the mass of water with the same heat capacity), found by mixing hot and cold water.', 'Heat is lost to the surroundings even in a good calorimeter. Extrapolating the cooling curve back to the moment of mixing gives the temperature change that would have occurred with no loss.'];
  add('neutral', {
    p: CAL.concat(['For any strong acid with any strong base the heat of neutralisation is almost the same, about −57.3 kJ per mole of water, because the only reaction is H⁺ + OH⁻ → H₂O; the other ions are spectators.']),
    eq: ['H⁺(aq) + OH⁻(aq) → H₂O(l)   ΔH ≈ −57.3 kJ/mol'],
    why: ['Both solutions must start at the same temperature; readings before mixing give the baseline.', 'Equal volumes of 1 M acid and base give 0.050 mol of water from 50 mL each.'],
    calc: ['q = (m c + W c) ΔT; ΔH = −q / n(water).'],
    err: ['Assuming the solution has the specific heat and density of water introduces a small error (≈ 1–2 %).'],
  });
  add('weak', {
    p: CAL.concat(['With a weak acid, part of the energy goes into ionising the acid (CH₃COOH → H⁺ + CH₃COO⁻ is endothermic by about +2 kJ/mol), so the heat of neutralisation is a little less negative than −57.3 kJ/mol. The difference gives the enthalpy of ionisation.']),
    eq: ['CH₃COOH + OH⁻ → CH₃COO⁻ + H₂O   ΔH ≈ −55.2 kJ/mol', 'ΔH(ionisation) = ΔH(weak) − ΔH(strong)'],
    why: ['Use the same calorimeter and the same volumes as for HCl, so that the comparison is fair.'],
    calc: ['ΔH = −(m c + W c) ΔT / n; ΔH(ion) ≈ ΔH(CH₃COOH) − ΔH(HCl).'],
    err: ['The difference of two similar numbers is uncertain: repeat both measurements.'],
  });
  add('solution', {
    p: CAL.concat(['Dissolving a salt involves breaking up the lattice (endothermic) and hydrating the ions (exothermic). The balance decides the sign: NH₄NO₃ and KNO₃ cool the water (ΔH > 0), while anhydrous CaCl₂ and NaOH warm it (ΔH < 0).']),
    eq: ['ΔH(solution) = ΔH(lattice dissociation) + ΔH(hydration)', 'NH₄NO₃(s) → NH₄⁺(aq) + NO₃⁻(aq)   ΔH ≈ +25.7 kJ/mol'],
    why: ['The solid must be dry, finely powdered and added quickly, so that it dissolves fast compared with heat exchange.', 'Integral heat of solution depends a little on the final concentration.'],
    calc: ['ΔH = −(m c + W c) ΔT / n(salt); a fall in temperature gives a positive ΔH.'],
    err: ['Slow dissolving smears out the temperature change; the extrapolation corrects for part of this.'],
  });

  // ================================================================ colorimetry
  const BEER = ['When light passes through a coloured solution, each thin layer absorbs the same fraction of the light reaching it. This gives the Beer–Lambert law: A = log(I₀/I) = ε c l, where A is absorbance, ε the molar absorptivity (L mol⁻¹ cm⁻¹), c the concentration and l the path length.', 'A solution looks coloured because it absorbs the complementary colour: purple KMnO₄ absorbs green (λmax ≈ 525 nm); orange K₂Cr₂O₇ absorbs blue/violet and near-UV (≈ 350 nm, with a weaker band near 440 nm).'];
  add(['kmno4', 'k2cr2o7'], {
    p: BEER.concat(['Measuring at λmax gives the steepest calibration line (best sensitivity) and the least error from small wavelength shifts, because the absorption curve is flat at its top.']),
    eq: ['A = ε c l', 'unknown: c = (A − intercept) / slope'],
    why: ['The blank (solvent) sets A = 0 and corrects for the cell and the solvent.', 'At high absorbance (above about 1.5) very little light reaches the detector, stray light becomes important and the line bends: Beer’s law fails. Dilute the unknown into the range of the standards.'],
    calc: ['ε = slope of A against c (for l = 1 cm); c(unknown) from the calibration line.'],
    err: ['Fingerprints and bubbles on the cuvette; using different cuvettes for standards and samples.', 'KMnO₄ standards decompose slowly in light: prepare freshly.'],
  });
  add('salt-analysis', {
    p: ['Qualitative inorganic analysis identifies the ions in a salt from characteristic reactions: colours, precipitates, gases and flame colours. Each test depends on a specific property: low solubility (K_sp), complex formation, acid–base or redox behaviour.', 'Anions are usually tested first with dilute and concentrated H₂SO₄ (gases), then with specific reagents (BaCl₂ for sulfate, AgNO₃ for halides, the brown-ring test for nitrate). Cations are separated into groups by precipitating reagents (dilute HCl; H₂S in acid; NH₄Cl/NH₄OH; H₂S in base; (NH₄)₂CO₃) and then confirmed.'],
    eq: ['Ag⁺ + Cl⁻ → AgCl (white, soluble in NH₃ as [Ag(NH₃)₂]⁺)', 'Ba²⁺ + SO₄²⁻ → BaSO₄ (white, insoluble in HCl)', 'Fe³⁺ + SCN⁻ → [Fe(SCN)]²⁺ (blood red)', 'Cu²⁺ + 4NH₃ → [Cu(NH₃)₄]²⁺ (deep blue)', 'NO₃⁻ + 3Fe²⁺ + 4H⁺ → NO + 3Fe³⁺ + 2H₂O; Fe²⁺ + NO → [Fe(H₂O)₅NO]²⁺ (brown ring)'],
    why: ['Amphoteric hydroxides (Zn, Al) dissolve in excess NaOH; ammine complexes (Cu, Ni, Zn, Co) dissolve in excess NH₃: these excess tests separate cations that give similar precipitates.', 'Flame colours come from electrons excited in the flame falling back to lower levels; each element emits its own wavelengths. Cobalt glass absorbs the intense yellow of sodium so that the lilac of potassium can be seen.', 'In a mixture, one ion can hide or imitate another; this is why group separation and confirmatory tests are used.'],
    calc: [],
    err: ['Always test the reagents with a blank; use small amounts; carry out the concentrated-acid tests in a fume cupboard.'],
  });

  // ================================================================ bench: physical
  add('ostwald', {
    p: ['A weak electrolyte HA is only partly dissociated: HA ⇌ H⁺ + A⁻. Its molar conductivity Λ is proportional to the fraction α that is ionised: α = Λ/Λ₀, where Λ₀ is the molar conductivity at infinite dilution (complete ionisation, no interionic effects).', 'Ostwald’s dilution law combines this with the equilibrium constant: K_a = cα²/(1 − α). As the solution is diluted, α increases (Le Chatelier: more particles on dilution) while K_a stays constant.'],
    eq: ['Λ = 1000 κ / c (S cm² mol⁻¹)', 'K_a = cα²/(1 − α) = cΛ² / [Λ₀(Λ₀ − Λ)]', '1/Λ = 1/Λ₀ + cΛ/(K_a Λ₀²)'],
    why: ['Λ₀ of a weak electrolyte cannot be found by extrapolation (Λ rises steeply at low c), so Kohlrausch’s law of independent ionic migration is used: Λ₀(CH₃COOH) = Λ₀(HCl) + Λ₀(CH₃COONa) − Λ₀(NaCl).', 'The conductivity of the water itself (from dissolved CO₂) is subtracted from every reading.'],
    calc: ['α = Λ/Λ₀; K_a = cα²/(1 − α) at each concentration; take the mean.'],
    err: ['Concentration (not activity) is used, so K_a drifts slightly with c; the most dilute solutions are most sensitive to impurities.'],
  });
  add('indicator-pk', {
    p: ['An acid–base indicator is a weak acid whose two forms absorb at different wavelengths: HIn ⇌ H⁺ + In⁻. Bromocresol green is yellow as HIn (λmax ≈ 444 nm) and blue as In⁻ (λmax ≈ 617 nm).', 'At a fixed total indicator concentration the absorbance is a weighted sum of the two forms. Measuring A in buffers of known pH, and in solutions where the indicator is wholly HIn or wholly In⁻, gives the ratio [In⁻]/[HIn] directly.'],
    eq: ['[In⁻]/[HIn] = (A − A_HIn)/(A_In − A)', 'pH = pK_a + log([In⁻]/[HIn]) (Henderson–Hasselbalch)'],
    why: ['At an isosbestic point (≈ 515 nm here) both forms absorb equally, so A is independent of pH. Its presence shows that only two species are involved.', 'Buffers within about ±1 unit of the pK_a give ratios that can be measured accurately.'],
    calc: ['pK_a from each buffer, or as the pH where log ratio = 0 on the plot.'],
    err: ['Ionic strength changes the apparent pK_a slightly; the buffer pH must be accurately known (check with a pH meter).'],
  });
  add('buffer-ph', {
    p: ['An indicator’s colour depends on the ratio [In⁻]/[HIn], which is fixed by the pH. Two solutions with the same indicator concentration and the same colour therefore have the same pH. Comparison with a series of standard buffers of known pH gives the pH of the unknown.', 'An indicator only changes colour over about pK_a ± 1. Outside that range it shows one extreme colour whatever the pH, so the right indicator must be chosen first.'],
    eq: ['pH = pK_In + log([In⁻]/[HIn])'],
    why: ['Use the same tubes, the same volume and the same number of drops of indicator in all tubes, and look against a white background.', 'Phosphate (pH 5.8–8.0) and acetate (pH 3.6–5.6) buffers are typical standards.'],
    calc: ['pH(unknown) = pH of the matching standard (or between two neighbours).'],
    err: ['Colour matching by eye is subjective (about ±0.2 pH); coloured or turbid samples cannot be matched.'],
  });
  add('viscosity', {
    p: ['Viscosity is a liquid’s resistance to flow, arising from intermolecular attractions (hydrogen bonding in water, ethanol and glycerol). In an Ostwald viscometer a fixed volume flows through a capillary under its own weight. Poiseuille’s law gives the flow time as proportional to η/ρ (the kinematic viscosity).', 'Comparing with water in the same viscometer cancels the dimensions of the capillary: η₁/η₂ = ρ₁t₁/ρ₂t₂.'],
    eq: ['η = π r⁴ P t / (8 V l)  (Poiseuille), with P ∝ ρ g h', 'η = η_water × (ρ t) / (ρ_water t_water)'],
    why: ['The viscometer must be vertical, clean and in a thermostat: viscosity falls steeply with temperature (about 2 % per °C for water), following η = A e^(E/RT).', 'The same volume of liquid must be used each time, so the driving head is the same.'],
    calc: ['Relative viscosity η/η_water from the times and densities; absolute viscosity using η_water at that temperature.'],
    err: ['Dust in the capillary; timing errors are relatively large for fast liquids (acetone), so use a narrower capillary for them.'],
  });
  add('surface-tension', {
    p: ['Molecules at the surface are pulled inward by their neighbours, so the surface behaves like a stretched skin: the energy per unit area is the surface tension γ. A drop hanging from a tip falls when its weight exceeds the force holding it, which is proportional to γ (Tate’s law: m g ∝ 2π r γ).', 'For a fixed volume V of liquid, the number of drops n is inversely proportional to the mass of each drop, so γ ∝ ρ/n. Comparing with water cancels the tip dimensions.'],
    eq: ['γ₁/γ₂ = (ρ₁ n₂)/(ρ₂ n₁)', 'γ = γ_water × (n_water ρ) / (n ρ_water)'],
    why: ['Water has a very high γ (72 mN/m) because of its hydrogen bonding; organic liquids are much lower (18–27 mN/m). γ decreases as temperature rises.', 'Drops must form slowly (not faster than about one per second) so that each is in equilibrium.'],
    calc: ['γ from the drop numbers and densities, relative to water at the same temperature.'],
    err: ['A dirty tip, or a liquid that does not wet the tip, changes the drop size.'],
  });
  add('ksp-khta', {
    p: ['Potassium hydrogen tartrate (KHC₄H₄O₆) is sparingly soluble: KHTa(s) ⇌ K⁺ + HTa⁻, K_sp = [K⁺][HTa⁻]. The dissolved HTa⁻ is a weak acid that can be titrated with NaOH, which gives the solubility s.', 'Adding K⁺ (as KCl) lowers the solubility, as Le Chatelier predicts (the common-ion effect): K_sp = s(s + c_K) stays constant.'],
    eq: ['KHC₄H₄O₆(s) ⇌ K⁺ + HC₄H₄O₆⁻', 'HC₄H₄O₆⁻ + OH⁻ → C₄H₄O₆²⁻ + H₂O', 'ln K_sp = −ΔH/RT + ΔS/R (van ’t Hoff)'],
    why: ['The solution must really be saturated (excess solid, enough time, constant temperature) and filtered at the same temperature, or solid will crystallise out or dissolve.', 'The solubility rises with temperature because dissolving is endothermic.'],
    calc: ['s = M(NaOH) V / V(aliquot); K_sp = s(s + c_KCl); ΔH = −R × slope of ln K_sp against 1/T.'],
    err: ['Concentrations are used instead of activities; with the ionic strength involved, the “concentration K_sp” is larger than the thermodynamic value.'],
  });
  add('cmc', {
    p: ['Surfactants such as sodium dodecyl sulfate (SDS) have a polar head and a long hydrocarbon tail. At low concentration they are separate ions. Above the critical micelle concentration (CMC) extra surfactant forms micelles: clusters of about 60 ions with the tails inside, away from water (driven by the hydrophobic effect, mainly an entropy gain of the water).', 'Many properties change at the CMC: surface tension stops falling, light scattering rises, dyes are solubilised. Conductivity rises more slowly above the CMC because a micelle is large and slow and binds many of its Na⁺ counter-ions.'],
    eq: ['n DS⁻ + (n − p) Na⁺ ⇌ micelle (charge −p)', 'β = 1 − S₂/S₁ (degree of counter-ion binding)'],
    why: ['The CMC of SDS is about 8.2 mM at 25 °C; it is lowered by added salt (which screens the head-group repulsion) and passes through a shallow minimum with temperature.'],
    calc: ['CMC = intersection of the two straight lines of κ against c.'],
    err: ['Impurities such as dodecanol (from hydrolysis of SDS) lower and blur the CMC.'],
  });
  add('phenol-water', {
    p: ['Phenol and water are only partially miscible at room temperature: a mixture of intermediate composition separates into a water-rich layer and a phenol-rich layer (turbid when shaken). As the temperature rises the two layers become more alike, and above the upper critical solution temperature (UCST, ≈ 66.8 °C at about 34 % phenol) they mix in all proportions.', 'The curve of miscibility temperature against composition is the boundary between the one-phase and two-phase regions of the phase diagram. A tie line at any temperature below the UCST joins the compositions of the two coexisting layers.'],
    eq: ['Phase rule (condensed system, constant pressure): F = C − P + 1 = 2 − 2 + 1 = 1 in the two-phase region'],
    why: ['Heating and cooling through the transition and taking the mean removes the lag of the thermometer.', 'Small amounts of impurity change the UCST markedly (e.g. dissolved NaCl raises it): the method is used to test the purity of phenol.'],
    calc: ['UCST = maximum of the curve; critical composition = composition at the maximum.'],
    err: ['Phenol is corrosive and toxic through the skin: handle with gloves.'],
  });
  add('distribution', {
    p: ['Nernst’s distribution law: at constant temperature a solute that has the same molecular form in two immiscible solvents distributes between them in a constant ratio, K_D = c(org)/c(aq).', 'In the second part Cu²⁺ is added to the water. Ammonia bound in the complex [Cu(NH₃)ₙ]²⁺ cannot pass into chloroform; only free NH₃ distributes. The organic layer therefore reports the free aqueous ammonia, while titration of the aqueous layer gives free + bound. The difference, divided by [Cu²⁺], gives n.'],
    eq: ['K_D = [NH₃]CHCl₃ / [NH₃]free, aq', 'Cu²⁺ + nNH₃ ⇌ [Cu(NH₃)ₙ]²⁺; n = ([NH₃]total, aq − [NH₃]CHCl₃/K_D) / [Cu²⁺]'],
    why: ['A large excess of ammonia makes almost all the copper exist as the highest complex, so n comes out close to 4.', 'Both layers must reach equilibrium at constant temperature (shake well, then let them separate completely).'],
    calc: ['K_D from part 1; free NH₃ in part 2 from the organic layer and K_D; n = bound / [Cu²⁺].'],
    err: ['Loss of volatile NH₃; traces of the other layer in the pipette (take the lower CHCl₃ layer with the pipette tip closed).'],
  });

  // ================================================================ bench: inorganic and computing
  add('gravimetry', {
    p: ['In gravimetric analysis the analyte is converted to a pure compound of known composition, which is weighed. The ideal precipitate is very insoluble, easy to filter (large crystals) and stable on drying.', 'Large crystals form when the relative supersaturation (Q − S)/S is kept low (von Weimarn): precipitate from hot, dilute solution, add the reagent slowly with stirring, and digest (keep hot) so that small crystals dissolve and large ones grow (Ostwald ripening).'],
    eq: ['Ni²⁺ + 2 DMGH → Ni(DMG)₂(s) + 2H⁺ (red, square planar)', 'Ag⁺ + Cl⁻ → AgCl(s)', 'Ba²⁺ + SO₄²⁻ → BaSO₄(s)', 'mass of analyte = mass of precipitate × M(analyte)/M(precipitate)'],
    why: ['Ni–DMG needs a slightly ammoniacal solution to take up the H⁺ released; DMG is added as an alcoholic solution and in only slight excess, as it is sparingly soluble in water.', 'AgCl is protected from light, which decomposes it; BaSO₄ is digested to obtain filterable crystals and minimise occlusion.', 'Heating to constant mass ensures that all water (and volatile impurities) has gone.'],
    calc: ['Gravimetric factors: Ni/Ni(DMG)₂ = 0.2032; Cl/AgCl = 0.2474; SO₄/BaSO₄ = 0.4116.'],
    err: ['Co-precipitation (occlusion, surface adsorption) and losses through the filter; cool in a desiccator before weighing.'],
  });
  add('complex-prep', {
    p: ['A coordination complex forms when ligands (Lewis bases) donate electron pairs to a metal ion (a Lewis acid). Ligands that bind more strongly replace weaker ones: NH₃ displaces water from Cu²⁺ and Ni²⁺; oxalate (a bidentate chelating ligand) binds Fe³⁺ very strongly through two oxygens.', 'Colours come from d–d transitions: the ligand field splits the metal d orbitals and light of the matching energy is absorbed. Stronger-field ligands (NH₃ > H₂O) raise the splitting, which is why [Cu(NH₃)₄]²⁺ is a deeper, more violet blue than [Cu(H₂O)₆]²⁺.'],
    eq: ['[Cu(H₂O)₆]²⁺ + 4NH₃ → [Cu(NH₃)₄(H₂O)₂]²⁺ + 4H₂O', 'Fe³⁺ + 3C₂O₄²⁻ → [Fe(C₂O₄)₃]³⁻', 'Ni²⁺ + 6NH₃ → [Ni(NH₃)₆]²⁺', 'Cu²⁺ + 2Hacac → Cu(acac)₂ + 2H⁺'],
    why: ['Ethanol is added to lower the solubility of ionic complexes in water and crystallise them.', 'Products are dried at room temperature: ammine complexes lose NH₃ on heating; ferrioxalate is light-sensitive (photoreduction of Fe³⁺ by oxalate).', 'Chelates are especially stable (the chelate effect, mainly entropic).'],
    calc: ['theoretical yield = moles of the metal salt × M(product); % yield = actual / theoretical × 100.'],
    err: ['Product lost in the mother liquor and on washing; incomplete drying gives a falsely high yield.'],
  });
  add('spreadsheet', {
    p: ['A spreadsheet is a fast way to process experimental data: each column is a formula applied to every row. Derivative plots of titration data locate end points much more precisely than the S-shaped curve itself: the first derivative (ΔpH/ΔV) has a maximum and the second derivative crosses zero at the end point.', 'The Michaelis–Menten equation describes enzyme kinetics: v = V_max[S]/(K_m + [S]). K_m is the substrate concentration at which v = V_max/2; it reflects how tightly the enzyme binds the substrate. The double-reciprocal (Lineweaver–Burk) form makes it linear.'],
    eq: ['first derivative at V̄ = (V₁ + V₂)/2: ΔpH/ΔV = (pH₂ − pH₁)/(V₂ − V₁)', '1/v = (K_m/V_max)(1/[S]) + 1/V_max'],
    why: ['At half the end-point volume pH = pK_a of the weak acid, which the same worksheet gives directly.', 'The Lineweaver–Burk plot is easy to compute but distorts errors (small v → large 1/v); a non-linear least-squares fit (e.g. with Solver) is better.'],
    calc: ['V_max = 1/intercept; K_m = slope/intercept.'],
    err: ['Derivatives amplify noise: use small, evenly spaced additions near the end point.'],
  });

  // ================================================================ bench: organic
  add('organic-id', {
    p: ['A systematic scheme identifies an organic compound with a few well-chosen tests: physical constants (m.p. or b.p.), elements present (Lassaigne’s test), solubility class, and functional-group tests.', 'Lassaigne’s test: fusing the compound with sodium converts covalently bound N, S and halogens into ions (CN⁻, S²⁻, X⁻) that can be tested in water. CN⁻ with Fe²⁺/Fe³⁺ gives Prussian blue; S²⁻ gives a violet colour with nitroprusside; X⁻ gives silver halide with AgNO₃ (after boiling with HNO₃ to remove CN⁻ and S²⁻).'],
    eq: ['Na + C, N → NaCN; 6CN⁻ + Fe²⁺ → [Fe(CN)₆]⁴⁻; 3[Fe(CN)₆]⁴⁻ + 4Fe³⁺ → Fe₄[Fe(CN)₆]₃ (Prussian blue)', 'RCOOH + NaHCO₃ → RCOONa + H₂O + CO₂ (only acids stronger than H₂CO₃, pK_a < 6.4)', 'R₂C=O + 2,4-DNP → hydrazone (yellow/orange/red precipitate)', 'CH₃CO–R + 3I₂ + 4OH⁻ → CHI₃ (yellow) + RCOO⁻ + 3I⁻ + 3H₂O'],
    why: ['Solubility classes: soluble in NaOH but not NaHCO₃ means a weak acid such as a phenol; soluble in NaHCO₃ means a carboxylic (or sulfonic) acid; soluble in dilute HCl means an amine.', 'Tollens’ and Fehling’s reagents are mild oxidants: aldehydes reduce Tollens’ (silver mirror); only aliphatic aldehydes and reducing sugars reduce Fehling’s.', 'Neutral FeCl₃ gives violet/blue/green complexes with phenols (an enol-type –OH on the ring).', 'The diazotisation–coupling test is specific for primary aromatic amines: ArNH₂ + HNO₂ → ArN₂⁺, which couples with β-naphthol to an azo dye.'],
    calc: [],
    err: ['Always do a blank with the reagents; use small amounts; confirm the final identity by a derivative’s melting point.'],
  });
  add('mp-bp', {
    p: ['A pure crystalline compound melts sharply at a characteristic temperature. Impurities lower and broaden the melting range, because the impurity lowers the chemical potential of the liquid (freezing-point depression, a colligative effect) and melting starts at the eutectic temperature.', 'A mixed melting point therefore identifies a compound: mixed with an authentic sample of itself the m.p. is unchanged; mixed with a different compound it falls.', 'The boiling point is the temperature at which the vapour pressure equals the external pressure. In Siwoloboff’s method the inverted capillary traps vapour; when cooling, the bubbling stops and liquid enters the capillary at the moment the vapour pressure falls just below atmospheric pressure.'],
    eq: ['ΔT_f = K_f × m (depression proportional to the amount of impurity)', 'b.p.: p_vap(T_b) = p_atm (Clausius–Clapeyron: ln p = −ΔH_vap/RT + C)'],
    why: ['Heating must be slow (1–2 °C/min) near the m.p.: the thermometer and the sample lag behind the bath, so fast heating gives readings that are too high.', 'Boiling points depend on pressure (about 0.04 °C per mmHg near 1 atm): record the barometric pressure.'],
    calc: [],
    err: ['Too much sample, or a wet sample; thermometer stem not immersed (stem correction).'],
  });
  add('separation', {
    p: ['Acid–base extraction separates compounds by turning one of them into a water-soluble ion. An organic compound dissolved in ether stays there if it is neutral, but a carboxylic acid reacts with aqueous NaHCO₃ or NaOH to form a carboxylate ion that moves into the water. A phenol is too weak an acid to react with NaHCO₃ but reacts with NaOH. An amine reacts with dilute HCl to form an ammonium ion.', 'Reversing the reaction (acidifying the carboxylate or phenoxide solution, or basifying the ammonium solution) gives back the neutral compound, which precipitates or can be extracted.'],
    eq: ['RCOOH + HCO₃⁻ → RCOO⁻ + H₂O + CO₂ (pK_a 4 < 6.4: goes)', 'ArOH + HCO₃⁻ ⇌ no reaction (pK_a 10 > 6.4); ArOH + OH⁻ → ArO⁻ + H₂O', 'ArNH₂ + H⁺ → ArNH₃⁺'],
    why: ['The choice of base follows the pK_a values: to separate a carboxylic acid from a phenol, NaHCO₃ must be used; NaOH would take both.', 'Two or three extractions with smaller volumes remove more than one large extraction (the distribution law).', 'Release CO₂ pressure from the funnel often; ether is very flammable.'],
    calc: ['% of each component = mass recovered / total recovered × 100; purity checked by m.p.'],
    err: ['Emulsions; incomplete extraction; product lost by solubility in water (cool before filtering).'],
  });
  add('organic-prep', {
    p: ['Each preparation is a classic reaction type. Acetylation: the lone pair of the amine (or phenol) oxygen attacks acetic anhydride (nucleophilic acyl substitution). Nitration and bromination are electrophilic aromatic substitutions: the NHCOCH₃ group activates the ring and directs ortho/para, and its bulk favours the para product.', 'Acetylating aniline first moderates its reactivity (bromine water would give 2,4,6-tribromoaniline) and protects the amine from oxidation by nitric acid. Diazotisation (ArNH₂ + HNO₂ at 0–5 °C) gives a diazonium ion, a weak electrophile that couples with an activated ring such as the naphthoxide ion to form an azo dye.'],
    eq: ['HNO₃ + 2H₂SO₄ → NO₂⁺ + H₃O⁺ + 2HSO₄⁻ (the electrophile)', 'ArN₂⁺ + ArʹO⁻ → Ar–N=N–ArʹO⁻ (coupling)', 'ester + OH⁻ → carboxylate + alcohol (saponification), then acidify'],
    why: ['Temperature control is essential: nitration above about 10 °C gives more by-products; diazonium salts decompose above 5 °C to phenols and N₂.', 'Recrystallisation purifies: the product is dissolved in the minimum of hot solvent and crystallises on cooling, while impurities stay in solution.', 'The melting point of the dried product shows its purity.'],
    calc: ['theoretical yield = moles of limiting reagent × M(product) (1 : 1 here); % yield = actual/theoretical × 100.'],
    err: ['Losses on filtration and recrystallisation are normal (yields of 60–85 % are good); a wet product gives a falsely high yield and a low m.p.'],
  });
  add('tlc', {
    p: ['Chromatography separates compounds by how they distribute between a stationary phase (polar silica gel) and a mobile phase (the eluent). A compound that is adsorbed more strongly spends more time on the silica and moves more slowly.', 'On silica, polar compounds that can hydrogen-bond (–OH, –NH, –COOH) are held strongly and have low R_f; a more polar eluent competes for the adsorption sites and moves every compound further.'],
    eq: ['R_f = distance moved by the compound / distance moved by the solvent front', 'R_f = 1/(1 + k), where k is the retention factor'],
    why: ['The R_f of a compound is characteristic only for a given stationary phase, eluent and conditions: run the standards on the same plate as the unknown.', 'Acetic acid in the eluent keeps a carboxylic acid un-ionised, so it does not streak.', 'Column chromatography uses the same principle on a larger scale: compounds elute in order of increasing retention, and fractions are checked by TLC.'],
    calc: ['R_f for each spot; identical R_f values (and co-spotting) indicate the same compound.'],
    err: ['Spots too large or the spotting line below the solvent level; the tank not saturated with vapour.'],
  });
  add('nmr-ir', {
    p: ['IR spectroscopy measures the absorption of infrared light by bond vibrations. Each bond type absorbs in a typical range: O–H 3200–3600 (broad when hydrogen-bonded), C–H 2850–3100, C=O 1680–1750, C–O 1000–1300 cm⁻¹. The frequency rises with bond strength and falls with the mass of the atoms (ν ∝ √(k/μ)).', '¹H NMR spectroscopy measures the radio-frequency absorption of protons in a magnetic field. Electron-withdrawing groups and aromatic ring currents deshield protons, moving their signals to higher chemical shift δ. The area of each signal is proportional to the number of protons, and coupling to n equivalent neighbouring protons splits a signal into n + 1 lines.'],
    eq: ['DBE = C − H/2 + N/2 + 1', 'δ (ppm) = (ν − ν_TMS) / ν_spectrometer × 10⁶', 'n neighbours → n + 1 lines (intensities from Pascal’s triangle)'],
    why: ['Conjugation lowers the C=O frequency (acetophenone ≈ 1685 cm⁻¹ against 1715 for acetone) because it gives the C=O some single-bond character.', 'O–H protons exchange quickly, so they usually appear as broad singlets that do not couple; they disappear on shaking with D₂O.'],
    calc: [],
    err: ['Solvent peaks (CHCl₃ at 7.26 ppm, water ≈ 1.6 ppm in CDCl₃) and IR bands from moisture or CO₂ must not be mistaken for the sample.'],
  });

  // ================================================================ renderer
  const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  T.mount = function (id) {
    const host = document.getElementById('work'); if (!host) return;
    let sec = document.getElementById('theory');
    const e = T.DB[id];
    if (!e) { if (sec) sec.remove(); return; }
    if (!sec) { sec = document.createElement('section'); sec.id = 'theory'; sec.className = 'theory'; host.appendChild(sec); }
    const lv = window.LevelInfo && LevelInfo.level, open = lv !== 'school';
    const list = (h, a) => (a && a.length ? '<h4>' + h + '</h4><ul>' + a.map((x) => '<li>' + esc(x) + '</li>').join('') + '</ul>' : '');
    sec.innerHTML = '<details' + (open ? ' open' : '') + '><summary><span class="th-tag">The science</span> How this experiment works</summary>' +
      (e.p || []).map((x) => '<p>' + esc(x) + '</p>').join('') +
      (e.eq && e.eq.length ? '<h4>Reactions and equations</h4><div class="work-lines">' + e.eq.map(esc).join('<br>') + '</div>' : '') +
      list('Why the method is done this way', e.why) + list('Calculation', e.calc) + list('Sources of error and precautions', e.err) + '</details>';
  };
  T.has = (id) => !!T.DB[id];
})();
