# Charging Infrastructure Lab

An interactive study site for the NPTEL course **Charging Infrastructure** (IIT Roorkee, Prof. Apurv Kumar Yadav). It explains every topic with live waveforms, calculators and 3D models, highlights what matters for the exam, and includes all 126 weekly assignment questions with reasons.

**Live site:** https://rajsumit.github.io/charging-infrastructure-lab/

## What is inside
- **22 topic pages** in five modules: charging basics and standards, single-phase PFC, three-phase AC-DC and dq control, isolated DC-DC (forward, bridges, PSFB, DAB, magnetics), and protocols (AC Type-2 CP/PP, CCS2 PLC/SLAC, CAN/BEVC-DC001, OCPP).
- **Exam Hub:** exam pattern, heat map of where assignment questions come from, a day-by-day study plan, formula sheet.
- **Question bank:** 126 assignment questions (MCQ / MSQ / numerical with ranges), progress saved in the browser.
- **Charger simulator:** an end-to-end AC and DC charger from grid to battery. Click each stage to see its waveform, efficiency and topic.
- **3D charger:** AC and DC chargers in 3D with an explode slider. Open any ECU and click components (capacitors, inductors, HF transformer, power modules, BMS…) to learn what they do.
- Interactive widgets: CC-CV charging, rectifier + capacitor, boost-PFC duty and ripple, DCM, SPWM spectrum, phasors, dq frame in 3D, PSFB, DAB, loss U-curve, CP/PP simulator, CAN decoder, OCPP message builder and more.

## Run or build locally
No dependencies except Python 3 (build) and a browser.

```bash
python3 build.py          # writes docs/index.html (standalone page) and dist/artifact.html
python3 -m http.server -d docs 8000   # then open http://localhost:8000
node src/verify.js        # checks the formula library against assignment answer keys
```

The 3D views load three.js from cdnjs, so an internet connection is needed for them.

## Project layout
```
src/calc.js       formula library (verified by src/verify.js)
src/core.js       scope plotter, widgets, router, 3D helper
src/qbank*.js     assignment question bank
src/topics/*.js   one file per module, plus home, simulator and 3D view
src/style.css     design tokens, light and dark themes
build.py          bundles everything into one HTML file
docs/             built site (GitHub Pages)
```

## Notes
- Some official answer keys disagree with the lecture rule or physics (W5Q5, W7Q3, W5Q9, W8Q4). Each is flagged in its explanation.
- The simulator and 3D models are schematic teaching aids, not manufacturer drawings.

## Credits and licence
Code and original explanations: MIT (see `LICENSE`). Course questions and figures belong to NPTEL / IIT Roorkee and the instructor; see `CREDITS.md`. Not affiliated with NPTEL.

## Source material
The original NPTEL lecture slides, summary notes, transcripts and weekly assignments are in [`course-material/`](course-material/). See [CREDITS.md](CREDITS.md) for attribution.
