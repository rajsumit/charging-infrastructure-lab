/* ===== Complete revision sheet ===== */
page({ id: 'revision-sheet', mod: 'home', title: 'Revision sheet (read before exam)', kw: 'revision summary cheat sheet last day formulas facts traps checklist', render(body) {
  const read = store.get('revread', {});
  H(body, `<div class="crumb"><span>Last-day revision</span><span class="pill hot">≈ 45 min read</span></div><h1>Complete revision sheet</h1><p class="lede">Everything the 12 weeks test, condensed: the fact, the formula with a worked check number, and the trap. Read it once before today's mock and once on exam morning. Tick each block as you finish it.</p>`);
  const S = (id, title, wk, facts, forms, traps) => {
    const done = !!read[id];
    const sec = h('section', { class: 'rev' + (done ? ' done' : ''), id: 'rv-' + id });
    sec.innerHTML = `<header><h2>${title}</h2><span class="pill">${wk}</span></header>
      <div class="revgrid"><div><h4>Know</h4><ul>${facts.map(x => `<li>${x}</li>`).join('')}</ul></div>
      ${forms.length ? `<div><h4>Formulas · check value</h4><table class="revt">${forms.map(([a, b, c]) => `<tr><td>${a}</td><td class="f">${b}</td><td class="c">${c || ''}</td></tr>`).join('')}</table></div>` : ''}</div>
      ${traps.length ? `<div class="trap"><b>Traps:</b> ${traps.join(' · ')}</div>` : ''}`;
    const b = h('button', { class: 'btn' + (done ? '' : ' primary'), onclick: () => { read[id] = !read[id]; store.set('revread', read); sec.classList.toggle('done', !!read[id]); b.textContent = read[id] ? '✔ Read' : 'Mark as read'; b.classList.toggle('primary', !read[id]); prog(); } }, done ? '✔ Read' : 'Mark as read');
    sec.querySelector('header').append(b); body.append(sec);
  };
  const pr = h('div', { class: 'readout', style: 'margin:12px 0' }); body.append(pr);
  const prog = () => { const n = $$('.rev', body).length, d = $$('.rev.done', body).length; pr.innerHTML = `<div><small>blocks read</small><b>${d} / ${n}</b></div><div><small>exam</small><b>Sat 17 Oct</b></div>`; };
  H(body, `<div class="card" style="border-left:5px solid var(--hot)"><h3>Exam-day checklist</h3><ul>
    <li><b>Reported pattern (16 Oct sitting):</b> 50 questions, 80-90 % assignment-type with changed numbers/wording, typed numerical answers, no negative marking. Know the method, not the remembered answer.</li>
    <li>Hall ticket + original photo ID. Reach early; the centre shuts the gate at the reporting time.</li>
    <li>Calculator if permitted by the instructions; know √2 = 1.414, √3 = 1.732, 1/π = 0.318, 2π·50 = 314.</li>
    <li>Read the on-screen instructions: number of questions, marks, MSQ rule, answer-range rule.</li>
    <li>Pass 1: all recall questions (CP/PP, OSI layers, CAN, OCPP, modes, ripple frequency). Pass 2: one-line numericals. Pass 3: long numericals. Mark and move if stuck > 3 min.</li>
    <li>No blanks at the end (unless the instructions announce negative marking).</li></ul></div>
    <div class="card" style="border-left:5px solid var(--bad)"><h3>Silly-mistake checklist (read twice)</h3><ul>
    <li><b>rms vs peak</b>: V<sub>pk</sub> = √2 × 230 = 325.3 V; I<sub>pk</sub> = √2·P/V<sub>rms</sub>.</li>
    <li><b>Units asked</b>: mH vs µH, µs vs ms, kW vs W, % vs fraction, degrees vs radians (DAB formula needs δ in radians).</li>
    <li><b>Formula direction</b>: boost d = 1 − |v<sub>s</sub>|/V<sub>o</sub> (not |v<sub>s</sub>|/V<sub>o</sub>); PSFB V<sub>o</sub>/V<sub>in</sub> = n(<b>1 − φ/180</b>); duty from current = I/0.6 (divide).</li>
    <li><b>Peak-to-peak vs peak</b>: ΔV<sub>pp</sub> = P/(2πfV<sub>o</sub>C) is already peak-to-peak.</li>
    <li><b>Turns ratio</b>: n = N<sub>s</sub>/N<sub>p</sub> unless the question says otherwise.</li>
    <li><b>MSQ</b>: judge each option independently; one wrong tick loses the whole question.</li>
    <li><b>"Which axis is on the voltage?"</b> decides whether i<sub>d</sub> or i<sub>q</sub> is the active current.</li>
    <li>Keep 4 significant figures until the final step.</li></ul></div>`);
  prog();
  S('lec', 'Lecture details the NPTEL mock papers ask (not in the assignments)', 'all weeks', [
    'EVSE = Electric Vehicle <b>Supply</b> Equipment · OCPP = <b>Open Charge Point</b> Protocol · SPS = <b>Single Phase Shift</b>.',
    'High f<sub>sw</sub> → smaller L, C and transformer. HF transformer = small + isolation (safety).',
    'Rectifier with R load: source current sinusoidal, in phase. With C: peaky pulses. V<sub>RRM</sub> = max repetitive reverse voltage.',
    'Boost PFC control variable = <b>duty d</b>. Voltage-loop <b>saturation block</b> caps the current reference (protects devices). Current loop: high gain at 2f<sub>line</sub>, BW ≪ f<sub>sw</sub>, good margins.',
    'Double-line ripple: input power P(1 − cos2ωt) vs constant load power. Energy equivalence: C<sub>min</sub> = ΔP<sub>max</sub>·T<sub>d</sub>/(2V<sub>o</sub>ΔV<sub>o</sub>).',
    '3-φ: cos2ωt terms cancel → constant power → small C. Size C by ripple current from switching harmonics: I<sub>C,rms</sub> = √(I<sub>rms</sub>² − I<sub>avg</sub>²) = I<sub>s,pk</sub>√((3/π)·M·(5/4) − (9/16)M²) (as in the mock key).',
    'dq: AC → DC quantities; d-axis on voltage ⇒ V<sub>sq</sub> = 0. ωL cross-coupling terms must be compensated. PI zero = plant pole (R<sub>s</sub>/L); K<sub>PC</sub> from a 2nd-order damping target; K factor from power balance.',
    'Totem pole: slow leg at line frequency → no reverse-recovery loss. <b>Zero-crossing distortion</b>: switch timing near v<sub>s</sub> = 0; if S1 turns on while S4 is on, v<sub>L</sub> ≈ −V<sub>o</sub> → negative current spike.',
    'DCM: current hits zero each cycle; no multiplier; higher THD (triangular pulses). DCM flyback PFC looks resistive. L<sub>crit,min</sub> at min R<sub>L</sub> and min V<sub>s,pk</sub> (mock key).',
    'Forward: one quadrant of B-H + lossy reset → poor core use. Full bridge applies V<sub>in</sub> (half bridge V<sub>in</sub>/2); full-bridge switch stress V<sub>in</sub> (push-pull 2V<sub>in</sub>). Output ripple at 2f<sub>sw</sub>: pattern repeats every T<sub>s</sub>/2.',
    'ZVS: voltage driven to zero before current rises. Dead time: no shoot-through + time to swing C<sub>oss</sub>. Load-current direction picks the ZVS switch. Leading leg energy from the output inductor; lagging leg only from leakage (light load: no ZVS).',
    'PSFB output set by phase shift. <b>D-loss</b> reduces effective duty, depends on i<sub>L</sub> and V<sub>in</sub>; small-signal model adds controlled sources for d̃<sub>i</sub>, d̃<sub>v</sub>.',
    'DAB: bidirectional; keep the current symmetrical (no DC offset) to avoid flux walking/saturation.',
    'Magnetics: B-H = B vs H. Air gap ↑ saturation current. Steinmetz: eddy ∝ f²ΔB². Core loss ↑ and copper loss ↓ with ΔB → optimum. Two-level optimisation: window split γ<sub>j</sub>, then ΔB. Loss too high → next bigger core. Filter inductor: small ripple → negligible core loss. Inductor core selection: A<sub>c</sub>²W<sub>A</sub>/MLT ≥ ρL²I<sub>max</sub>²/(B<sub>max</sub>²·R·k<sub>u</sub>).',
    'CCS2: SLAC binds the EV to the EVSE it is plugged into; <b>BCB toggle</b> resolves ambiguous attenuation; <b>EVSEProcessing</b> = Ongoing/Finished; SLAAC = network layer.',
    'OCPP-J (JSON over one WebSocket) is lighter and more scalable than OCPP-S (SOAP/XML); BootNotification = [2, "id", "BootNotification", {chargePointVendor, chargePointModel}]. BEVC-DC001 uses CAN; the PGN identifies the parameter group.'], [], [
    'in the NPTEL AI mocks the key was B or C in 143 of 150 questions; do not rely on that in the real exam']);
  S('m1', 'Module 1 · EV charging basics, standards, rectifier', 'W1', [
    'BMS (in the vehicle) is the master; the charger only supplies.', 'CC then CV: in CV the current tapers.',
    '<b>Mode 1</b> plain socket · <b>Mode 2</b> socket + in-cable box (ICCPD) · <b>Mode 3</b> AC wall box with CP · <b>Mode 4</b> DC charger.',
    '<b>AC EVSE</b> = contactor, RCD, meter, CP/PP controller, interlocks: no converter. <b>DC EVSE</b> = rectifier + isolated DC-DC + interlocks.',
    'CCS1 = Type-1 + 2 DC pins; CCS2 = Type-2 + 2 DC pins (3-φ AC capable). GB/T AC is also 3-φ.',
    '<b>CAN</b>: CHAdeMO, GB/T DC, BEVC-DC001, Type-6/7. <b>PLC</b>: CCS. <b>PWM only</b>: AC Type-1/2 (SAE J1772 signalling).',
    'Capacitor-input rectifier → narrow current pulses → poor PF → the reason for PFC.'], [
    ['Half-wave avg', 'V<sub>m</sub>/π', '310 V pk → 98.7 V'], ['Full-wave avg', '2V<sub>m</sub>/π', '120 V rms → 108 V'], ['Diode PIV', 'V<sub>m</sub>', '310 V'], ['Rect. + C (W2Q9)', 'C = I·t<sub>dis</sub>/ΔV, t<sub>dis</sub> = (π/2 + asin(V<sub>min</sub>/V<sub>m</sub>))/ω', '220 V, 200 W, 10 % → 186 µF']], [
    'The BMS is never inside the EVSE', 'diode PIV is V<sub>m</sub>, not 2V<sub>m</sub>, for the bridge']);
  S('m2a', 'Module 2a · Boost PFC (the base of everything)', 'W2', [
    'Switch on: v<sub>L</sub> = |v<sub>s</sub>|, i<sub>L</sub> rises. Off: v<sub>L</sub> = |v<sub>s</sub>| − V<sub>o</sub>, i<sub>L</sub> falls.',
    'V<sub>o</sub> must exceed the grid peak (boost).', 'Duty is largest at the zero crossing (→ 1) and smallest at the peak.',
    'Ripple is largest where |v<sub>s</sub>| = V<sub>o</sub>/2 (d = 0.5), not at the peak.', 'Bipolar 4-switch PFC: d = (1 + |v<sub>s</sub>|/V<sub>o</sub>)/2 (W2Q2).'], [
    ['Duty', 'd = 1 − |v<sub>s</sub>|/V<sub>o</sub>', '230 V → 400 V: d<sub>pk</sub> = 0.187'], ['d<sub>min</sub>', '1 − √2·V<sub>max,rms</sub>/V<sub>o</sub>', '265 V, 500 V → 0.25'], ['Peak current', 'I<sub>pk</sub> = √2·P/V<sub>rms</sub>', '1.1 kW, 230 V → 6.76 A'], ['Inductor', 'L = V<sub>o</sub>/(4·ΔI·f<sub>sw</sub>)', '1.1 kW, 450 V, 60 kHz, 10 % → 2.77 mH']], [
    'ΔI is a % of the <b>peak</b> input current', 'd formula is 1 − ratio']);
  S('m2b', 'Module 2b · PFC stresses, control, bridgeless, DCM/flyback', 'W3-W5', [
    'Single-phase PFC output ripple = <b>2 × line</b> (100/120 Hz) whatever f<sub>sw</sub>. 3-phase: no 100 Hz, ripple at f<sub>sw</sub>.',
    'State variables: i<sub>L</sub>, v<sub>C</sub>; inputs: d, v<sub>s</sub>. A is 2 × 2. Small-signal: perturb the averaged large-signal model, drop products of small terms.',
    'Voltage loop slow (≈ 10-20 Hz, ≪ 100 Hz); current loop 500 Hz … f<sub>sw</sub>/10.',
    'Totem-pole: 2 devices conduct (boost PFC: 3); slow leg at line frequency; needs ≥ 2 fast switches; same inductor sizing.',
    'Bridgeless (D1/D2 top, S1/S2 bottom): D1 conducts for v<sub>s</sub> &gt; 0, D2 for v<sub>s</sub> &lt; 0.',
    'DCM: i<sub>L</sub> hits zero each period, peak follows v<sub>s</sub> automatically, single loop, smaller L, higher peak stress.'], [
    ['Switch RMS', 'I<sub>o</sub>√D', '20 A, D 0.3 → 10.95 A'], ['DC-link ripple', 'ΔV<sub>pp</sub> = P/(2π f V<sub>o</sub> C)', '3.3 kW, 400 V, 2.2 mF → 11.9 V'], ['G<sub>v</sub>(s)', '(V<sub>s,pk</sub>/2V<sub>o</sub>)·R/(RCs + 1)', ''], ['Flyback PFC', 'V<sub>o</sub> = (V<sub>pk</sub>/n)·d/(1−d)', '230 V, d 0.12, n 0.6 → 73.9 V']], [
    'ripple frequency is 2f<sub>line</sub>, not f<sub>sw</sub> (1-φ)', 'current-loop BW is above the line frequency']);
  S('m3', 'Module 3 · SPWM, 3-phase VSC, dq control', 'W5-W6', [
    'Average pole voltage ∝ modulating signal (W5Q8: 4/5 × 200 = 160 V).', 'm<sub>f</sub> = f<sub>carrier</sub>/f<sub>1</sub>; harmonics cluster around m<sub>f</sub> and its multiples.',
    'AC→DC power: converter phasor <b>lags</b> the grid; DC→AC: <b>leads</b> (power flows leading → lagging).', 'DC link must exceed the line-line peak (750 V for 400 V mains).',
    'abc (balanced) → αβ: sinusoids at line frequency; → dq: constants. d and q are independent.', 'The axis aligned with the voltage carries the active current. i<sub>q</sub>* = 0 (d on voltage) → unity PF.', 'Current on the axis 90° from the voltage → zero-PF (reactive) current.'], [
    ['Fundamental (half-bridge)', 'peak m·V<sub>dc</sub>/2 · rms m·V<sub>dc</sub>/(2√2)', '600 V, m 0.8 → 169.7 V rms'], ['VSC inductor', 'L = √(V<sub>c</sub>² − V<sub>s</sub>²)/(ω I<sub>pk</sub>)', '22 kW, 400 V, 750 V, m 0.9 → 6.03 mH'], ['I<sub>pk</sub>', '2P/(3V<sub>s,pk</sub>)', '44.9 A'], ['PF (d on V)', 'i<sub>d</sub>/√(i<sub>d</sub>² + i<sub>q</sub>²)', 'i<sub>d</sub> 8, i<sub>q</sub> 10 → 0.625'], ['PI cancel', 'K<sub>p</sub>/K<sub>i</sub> = L/R', '12 mH/10 mΩ → 1.2'], ['Time constants', 'T<sub>s</sub> = L/R &gt; T<sub>d</sub>', '']], [
    'check which axis is aligned (W6Q2 vs W6Q3)', 'use phase (not line) voltage peak in the VSC formula']);
  S('m4a', 'Module 4a · Forward, push-pull, bridges, switching loss', 'W6-W7', [
    'Forward: flux 0 → B<sub>max</sub> (one quadrant); bridges/push-pull: −B<sub>max</sub> → +B<sub>max</sub>.', 'Reset winding N<sub>d</sub>: core reset energy returns to V<sub>in</sub> through D3.',
    'Switch stress: forward with N<sub>d</sub> = N<sub>p</sub> → 2V<sub>in</sub>; dual-switch forward → V<sub>in</sub>; push-pull → 2V<sub>in</sub>; half/full bridge → V<sub>in</sub>. General: V<sub>in</sub>(1 + N<sub>p</sub>/N<sub>d</sub>). W7Q3 (1:2:3): key = option “⅔ V<sub>in</sub>” (physics gives 4/3 V<sub>in</sub>; pick the key option).',
    'ZVS ↔ turn-on loss removed; ZCS ↔ turn-off loss removed. Load-current direction decides which switch gets ZVS. Dead time prevents shoot-through.'], [
    ['Forward V<sub>o</sub>', 'n·D·V<sub>in</sub>', '400 V, 5:2, 10/50 µs → 32 V'], ['D<sub>max</sub>', '1/(1 + N<sub>d</sub>/N<sub>p</sub>)', 'N<sub>d</sub> = 3N<sub>p</sub>, 10 kHz → 25 µs'], ['Push-pull V<sub>o</sub> (key)', 'n·D·V<sub>in</sub>', '50 V, 5/2, 0.4 → 50 V'], ['Full-bridge L', 'V<sub>o</sub>(1−D)/(2 f ΔI)', '5 mH'], ['Overlap loss', 'E = V·I·t/6', '200 V, 60 A, 200 ns → 400 µJ'], ['Dead-time dv/dt', 'I<sub>o</sub>/(2C<sub>oss</sub>)', '10 A, 1 nF each → 5 V/ns']], [
    'two capacitances share the current (2C)', 'stress with demag winding is V<sub>in</sub>(1 + N<sub>p</sub>/N<sub>d</sub>)']);
  S('m4b', 'Module 4b · PSFB, DAB, magnetics', 'W8-W10', [
    'PSFB: each switch ≈ 50 % duty; output set by the phase between legs. 180° → 0 output.',
    'Leading leg: energy ½(L<sub>lkg</sub> + L/n²)I² → easy ZVS. Lagging leg: ½L<sub>lkg</sub>I² only → loses ZVS first. Extra L<sub>r</sub> widens ZVS but increases duty loss.',
    'DAB: two active bridges, bidirectional; power flows from the leading bridge; flat-top current when the reflected voltages are equal (3:1 transformer → V<sub>o</sub> = V<sub>in</sub>/3, W9Q9).',
    'Air gap: more ampere-turns before saturation, L set by the gap (independent of µ<sub>r</sub>).', 'Core loss ∝ f<sup>α</sup>ΔB<sup>β</sup>: lowest-frequency curve has the lowest loss (f1).'], [
    ['PSFB', 'V<sub>o</sub>/V<sub>in</sub> = n(1 − φ/180°)', '72° → 0.6'], ['Leading dead time', '2C<sub>oss</sub>V<sub>in</sub>/(nI<sub>o</sub>)', '200 V, 100 pF, 5 A → 8 ns'], ['Duty loss', '4L<sub>lkg</sub>I<sub>o</sub>f<sub>s</sub>/(nV<sub>in</sub>)', '5 % → 10 µH'], ['Lagging-leg resonance', 'L<sub>tot</sub> = 1/(ω<sub>r</sub>²C)', 'W8Q8: 25.4 µH − 5 µH → 20.4 µH extra'], ['DAB power', 'V<sub>in</sub>V<sub>o</sub>′δ(π−δ)/(2π² f<sub>s</sub>L)', '60°, 200/400 V′, 10 µH → 8.89 kW'], ['DAB P<sub>max</sub>', 'V<sub>in</sub>V<sub>o</sub>′/(8 f<sub>s</sub> L)', '400·100/(8·100k·100µ) = 0.5 kW'], ['δ for x·P<sub>max</sub>', 'δ/π = (1 − √(1−x))/2', '0.2 → 9.5°'], ['Core area', 'A<sub>c</sub> = λ/(N·ΔB<sub>pp</sub>)', 'W9Q3 → 200'], ['Optimum ΔB (β = 2)', '(a/b)<sup>1/4</sup>', '']], [
    'refer V<sub>o</sub> to the primary (V<sub>o</sub>′ = V<sub>o</sub>/n) before the DAB formula', 'δ in radians inside δ(π − δ)']);
  S('m5a', 'Module 5a · AC Type-2: CP and PP', 'W10', [
    'CP: ±12 V, 1 kHz, from EVSE through 1 kΩ. <b>A +12</b> · <b>B +9</b> · <b>C +6</b> · <b>D +3</b> · <b>E 0</b> · <b>F −12</b>.',
    'Vehicle: diode + 2.74 kΩ; S2 adds 1.3 kΩ (C) or 270 Ω (D). EVSE → EV: duty (max current). EV → EVSE: voltage level.',
    'PP: R6 in the plug tells the car "plug inserted" and the cable rating; blocks drive-away.', 'Type-2 plug in a CCS2 inlet: duty 10-85 % values are valid (30 %, 60 %); 5 % means digital comms.'], [
    ['Duty → current', 'I = 0.6·D (10-85 %) · I = 2.5(D − 64) (85-96 %)', '36 A → 60 %; 48 A → 80 % → 800 µs'], ['PP voltage', '5·(R5∥R6)/(R4 + R5∥R6), R4 330, R5 4.7k', '300 Ω → 2.30 V; 220 → 1.94; 680 → 3.21'], ['CP level', '12·R<sub>v</sub>/(1 k + R<sub>v</sub>)', '2.74k∥1.3k → 5.62 V'], ['R6 table', '1.5 kΩ 13 A · 680 Ω 20 A · 220 Ω 32 A · 100 Ω 63 A', '']], [
    'duty = I/0.6 (divide)', 'on-time = D × 1000 µs at 1 kHz']);
  S('m5b', 'Module 5b · CCS2 / PLC / SLAC', 'W10-W11', [
    'PLC (HomePlug Green PHY) on <b>CP-PE</b>, 5 % PWM. SLAC in <b>B2</b>; contactors close in <b>C2</b>.',
    'Layers: SLAC = <b>data link</b> · SLAAC = <b>network</b> · SDP = <b>application</b> (UDP) · EXI = <b>presentation</b> · "fast, reliable, safer" = <b>transport</b>.',
    'SLAC: 3 × CM_START_ATTEN_CHAR, 10 M-SOUND, <b>58</b> groups; <b>lowest attenuation</b> wins.',
    'Sequence: SLAC → SLAAC → SDP → TCP/TLS → session/auth → ChargeParameter → (C2) CableCheck → PreCharge → PowerDelivery → CurrentDemand → stop → WeldingDetection → SessionStop.',
    'Pre-charge: current limit <b>2 A</b>; EV closes contactors when ΔV &lt; <b>20 V</b>.'], [], [
    'SLAC ≠ SLAAC', 'attenuation: lowest wins (not highest)']);
  S('m5c', 'Module 5c · CAN, BEVC-DC001 / GB/T, OCPP', 'W11-W12', [
    'CAN 2.0A 11-bit (2¹¹) · 2.0B 29-bit (2²⁹). Dominant 0, <b>lowest ID wins</b>. 120 Ω at each end (60 Ω measured).',
    'BEVC-DC001 fixed addresses: charger <b>0x56</b>, BMS <b>0xF4</b>.',
    '29-bit ID = priority(3) | R | DP | PF(8) | PS = DA(8) | SA(8). 0x<b>18</b>1056F4: priority 6, PGN 0x001000, DA 0x56, SA 0xF4.',
    'Data: physical = raw × resolution + offset; multi-byte as in W12Q8 (0x019A × 0.01 = 4.10 V).',
    'OCPP-J: [2, id, action, payload] CALL · [3, id, payload] CALLRESULT · [4, id, code, text, details] CALLERROR. ID echoed. JSON over WebSocket. BootNotification first.',
    'ISO 15118: EV ↔ EVSE · OCPP: EVSE ↔ back-end · OCPI: roaming.'], [], [
    'priority = top 3 bits of the 29-bit ID (0x18 → 110 → 6)', 'PGN uses PF (byte 2) with PS = 00 when PF &lt; 0xF0']);
  H(body, `<div class="nextprev"><button class="btn primary" onclick="go('mock-exam')">Take the timed mock →</button><button class="btn" onclick="go('easy-marks')">Easy marks</button><button class="btn" onclick="go('formulas')">Formula sheet</button></div>`);
  prog();
} });
