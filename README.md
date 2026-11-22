# Lab Visuals: Chemical Reaction Simulator

See what happens when chemicals react: colour changes, precipitates, gases, heat released or absorbed, balanced equations, and a particle-level animation. Built for Class 11, Class 12 and BSc chemistry. The site opens on a level picker and each level gets its own lab.

**Live site:** `https://soumyadipbank.github.io/Lab-Visuals-Simulations/` (after enabling Pages, see below)

## Pages
| Page | What it is |
|---|---|
| `index.html` | Level gate: Class 11, Class 12 or BSc / BS |
| `class11.html`, `class12.html` | Guided experiments that open the Reaction Lab pre-loaded, plus simulators |
| `bsc.html` | Searchable syllabus map (Calcutta, West Bengal State and Burdwan universities) with the interactive labs |
| `lab.html` | Free-play Reaction Lab (any chemicals) |
| `titration.html` | 15 titrations: acid-base, KMnO4, K2Cr2O7, iodometric, EDTA, conductometric, potentiometric |
| `kinetics.html` | Iodine clock, H2O2 decomposition, ester hydrolysis, saponification |
| `calorimetry.html` | Heat of neutralisation and of solution with cooling correction |
| `colorimetry.html` | Beer-Lambert law, lambda max scan, calibration line |
| `salt-analysis.html` | Qualitative analysis of unknown salts and mixtures |

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
Run `node tests/verify.js` (reaction engine), `node tests/labcalc.test.js` (simulator maths), `node tests/titrations.test.js`, `node tests/salts.test.js` and `node tests/site.test.js` (links between pages). The titration and salt tests check that every experiment can be solved from its own observations.

## Deploy to GitHub Pages
Merge to `main`, then in the repo go to Settings > Pages > Source: **GitHub Actions**. The included workflow tests and deploys on every push to `main`.

## How it works
`js/data.js` ions, solubility, thermodynamic tables. `js/engine.js` rule engine (precipitation, neutralisation, displacement, acid + carbonate, ...) plus an equation balancer. `js/curated.js` hand-written special reactions. `js/sim.js` canvas drawing. `js/app.js` interface.

## Syllabus note
The BSc experiment list was read from the published practical syllabi of the University of Calcutta (CCF 2022), West Bengal State University (CCF) and the University of Burdwan (CBCS Honours and General). Burdwan's newer NEP syllabus was not read. Class 11 and 12 lists are typical school practicals, not one board's syllabus.

## Accuracy note
This is a teaching model. Temperature changes assume 0.05 mol in 100 mL and are illustrative. Please report chemistry errors as issues.
