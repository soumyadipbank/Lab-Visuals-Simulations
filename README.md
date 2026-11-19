# Lab Visuals: Chemical Reaction Simulator

See what happens when chemicals react: colour changes, precipitates, gases, heat released or absorbed, balanced equations, and a particle-level animation. Built for Class 11-12 and undergraduate chemistry.

**Live site:** `https://soumyadipbank.github.io/Lab-Visuals-Simulations/` (after enabling Pages, see below)

## Features
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
`node tests/verify.js` checks atom and charge balance of every hand-written equation and runs every pair and many triples through the engine.

## Deploy to GitHub Pages
Merge to `main`, then in the repo go to Settings > Pages > Source: **GitHub Actions**. The included workflow tests and deploys on every push to `main`.

## How it works
`js/data.js` ions, solubility, thermodynamic tables. `js/engine.js` rule engine (precipitation, neutralisation, displacement, acid + carbonate, ...) plus an equation balancer. `js/curated.js` hand-written special reactions. `js/sim.js` canvas drawing. `js/app.js` interface.

## Accuracy note
This is a teaching model. Temperature changes assume 0.05 mol in 100 mL and are illustrative. Please report chemistry errors as issues.
