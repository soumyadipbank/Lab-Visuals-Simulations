# Lab Visuals: Chemical Reaction Simulator

See what happens when chemicals react: colour changes, precipitates, gases, heat released or absorbed, balanced equations, and a particle-level animation. Built for Class 11 / 12 and Bachelors (BSc / BS) chemistry. The site opens on a level picker with two choices, and each level gets its own lab.

**Live site:** `https://soumyadipbank.github.io/Lab-Visuals-Simulations/` (after enabling Pages, see below)

## Pages
| Page | What it is |
|---|---|
| `index.html` | Level gate: Class 11 / 12 or Bachelors (BSc / BS) |
| `school.html` | Class 11 / 12: guided experiments that open the Reaction Lab pre-loaded, plus simulators (`class11.html` and `class12.html` redirect here) |
| `bsc.html` | Bachelors: searchable list of practical experiments with the interactive labs |
| `lab.html` | Free-play Reaction Lab (any chemicals) |
| `titration.html` | 25 titrations (including two-part and back titrations) with an animated burette (drops form, fall and swirl in): acid-base, KMnO4, K2Cr2O7, iodometric, EDTA, conductometric, potentiometric |
| `kinetics.html` | Two clock reactions, H2O2 decomposition, ester hydrolysis, saponification (conductometric and titrimetric), sucrose inversion |
| `practicals.html` | Practical bench: 18 physical, inorganic, organic and computing practicals (conductance, viscosity, surface tension, Ksp, CMC, phase diagram, distribution law, gravimetry, preparations, organic analysis, chromatography, NMR/IR, spreadsheets) |
| `calorimetry.html` | Heat of neutralisation and of solution with cooling correction |
| `colorimetry.html` | Beer-Lambert law, lambda max scan, calibration line |
| `salt-analysis.html` | Qualitative analysis of unknown salts and mixtures |

Every experiment ends with "The science": principle, reactions, why the method is done that way, the calculation, and sources of error (`js/theory.js`).

## Reaction Lab features
- 59 chemicals (acids, bases, salts, metals, oxidisers, oxides, gases, organics, indicators, a Bunsen flame). Pick up to four.
- Every pair is simulated, including "no reaction" with the reason why.
- Beaker view (colour, precipitate, bubbles, fumes, flames, thermometer) and particle view (ions colliding, spectator ions).
- Live temperature graph and energy profile diagram.
- Balanced molecular, ionic and net ionic equations, generated automatically.
- ΔH from Hess's law using standard enthalpies of formation; E° and Ksp in Bachelors mode.
- Predict-first mode, "which reagent is in excess" for titration-style colour changes, shareable links (`?mix=agno3,nacl`).

## Run locally
No build step. Open `index.html`, or `python3 -m http.server`.

## Tests
Run `node tests/verify.js` (reaction engine), `node tests/labcalc.test.js` (simulator maths), `node tests/titrations.test.js`, `node tests/salts.test.js` and `node tests/site.test.js` (links between pages) and `node tests/theory.test.js` (every experiment has its explanation). The titration and salt tests check that every experiment can be solved from its own observations.

## Deploy to GitHub Pages
Merge to `main`, then in the repo go to Settings > Pages > Source: **GitHub Actions**. The included workflow tests and deploys on every push to `main`.

## How it works
`js/data.js` ions, solubility, thermodynamic tables. `js/engine.js` rule engine (precipitation, neutralisation, displacement, acid + carbonate, ...) plus an equation balancer. `js/curated.js` hand-written special reactions. `js/sim.js` canvas drawing. `js/app.js` interface.

## Syllabus note
The Bachelors experiment list was collected from published undergraduate chemistry practical syllabi. The Class 11 / 12 list follows typical school practicals, not one board's syllabus.

## Colour model
Solution colours combine by absorbance (Beer-Lambert), not by averaging RGB: absorbances of dyes add, so blue + yellow gives green, and a colour fading during a reaction follows the concentration of the coloured species. Indicator colours follow the fraction of the indicator in its coloured form (phenolphthalein pKa 9.4, methyl orange pKa 3.46).

## Accuracy note
This is a teaching model. Temperature changes assume 0.05 mol in 100 mL and are illustrative. Please report chemistry errors as issues.
