/* ===== Easy marks: low effort, high yield ===== */
page({ id: 'easy-marks', mod: 'home', title: 'Easy marks: do not skip', kw: 'easy marks quick recall scoring revision last day cheat', render(body) {
  H(body, `<div class="crumb"><span>Revision</span><span class="pill hot">Highest marks per minute</span></div><h1>Easy marks: never skip these</h1>
  <p class="lede">These topics need <b>no derivation and almost no maths</b>: a table, a rule or a one-line formula. Each card lists what to memorise and the assignment questions that tested it. Learn a card, then press <b>Drill</b> to answer its questions on the spot.</p>`);
  H(body, `<p class="cap">How this list was made: every one of the 126 assignment questions was sorted by how long it takes to learn the idea behind it. The cards below cover the ones that take under 15 minutes each. Questions whose answer key disagrees with the lecture (for example W5Q5) are left out on purpose.</p>`);
  const E = [
    { t: 'Charging modes and connectors', m: 10, topic: 'standards', q: ['W1Q1', 'W1Q2', 'W1Q3', 'W1Q4', 'W1Q10'], f: [
      `<b>Mode 1</b> plain socket · <b>Mode 2</b> socket + in-cable control &amp; protection box (ICCPD) · <b>Mode 3</b> dedicated AC EVSE · <b>Mode 4</b> DC charger.`,
      `<b>3-phase AC</b> only through inlets with L1-L2-L3-N pins: <b>CCS2 (Type-2 top)</b> and <b>GB/T AC</b>.`,
      `Uses <b>CAN</b>: <b>CHAdeMO</b> and <b>Type-7</b> (light-EV inlet). CCS uses <b>PLC</b>.`,
      `CCS1 = Type-1 (J1772) top + 2 DC pins · CCS2 = Type-2 top + 2 DC pins.`] },
    { t: 'What is inside an AC vs a DC EVSE', m: 5, topic: 'charger-arch', q: ['W1Q5', 'W1Q6'], f: [
      `<b>AC EVSE</b> = smart switch: contactor, RCD, meter, CP/PP controller, safety interlocks. <b>No converter.</b>`,
      `<b>DC EVSE</b> = rectifier + isolated DC-DC + interlocks. The on-board charger is bypassed.`] },
    { t: 'Rectifier one-liners', m: 8, topic: 'rectifier', q: ['W1Q7', 'W1Q8', 'W2Q5'], f: [
      `Half-wave average = V<sub>m</sub>/π · full-wave average = 2V<sub>m</sub>/π.`,
      `Diode peak reverse voltage = <b>V<sub>pk</sub></b> of the source (half-wave and bridge + C).`] },
    { t: 'Which ripple frequency? (3 Qs, one rule)', m: 5, topic: 'pfc-stress', q: ['W3Q4', 'W4Q3', 'W5Q3'], f: [
      `Single-phase PFC (boost or totem-pole) at unity PF: output ripple at <b>2 × line = 100 Hz</b>, whatever the switching frequency.`,
      `Balanced 3-phase at unity PF: input power is constant, so no 100 Hz; the dominant ripple is at the <b>switching frequency</b>.`] },
    { t: 'Boost PFC: the four facts', m: 12, topic: 'boost-pfc', q: ['W2Q1', 'W2Q4', 'W2Q10', 'W2Q8'], f: [
      `Switch on: inductor voltage = <b>|v<sub>s</sub>|</b>.`,
      `d = 1 − |v<sub>s</sub>|/V<sub>o</sub>; d<sub>min</sub> at the highest peak: 1 − √2·V<sub>max</sub>/V<sub>o</sub>.`,
      `Inductor ripple is largest at <b>|v<sub>s</sub>| = V<sub>o</sub>/2</b>.`,
      `L = V<sub>o</sub>/(4·ΔI·f<sub>sw</sub>), with ΔI = ripple % × √2·P/V<sub>rms</sub>.`] },
    { t: 'State-space vocabulary', m: 5, topic: 'pfc-control', q: ['W3Q8', 'W3Q9', 'W3Q10', 'W3Q1'], f: [
      `State variables = <b>inductor current, capacitor voltage</b>. Inputs = <b>duty ratio, input AC voltage</b>.`,
      `Small-signal: f<sub>sw</sub> ≫ f<sub>line</sub>, perturbations ≪ operating point; perturb the <b>average large-signal model</b>.`] },
    { t: 'Totem-pole / bridgeless facts', m: 8, topic: 'bridgeless', q: ['W4Q4', 'W4Q6', 'W4Q10'], f: [
      `Totem-pole: <b>2 devices conduct</b> at any time; needs at least two fast switches; inductor sized like the boost PFC.`,
      `Bridgeless: D1 conducts for v<sub>s</sub> &gt; 0, D2 for v<sub>s</sub> &lt; 0.`] },
    { t: 'dq transformation facts', m: 8, topic: 'dq-control', q: ['W6Q4', 'W6Q5', 'W6Q7', 'W6Q2'], f: [
      `Balanced 3-phase → <b>αβ = sinusoids at line frequency</b>, <b>dq = constants</b>.`,
      `d-axis on the voltage: PF = i<sub>d</sub>/√(i<sub>d</sub>² + i<sub>q</sub>²). Current on the q-axis only → <b>zero-PF</b> current.`] },
    { t: 'Flux swing and voltage stress', m: 8, topic: 'bridges', q: ['W6Q1', 'W7Q8', 'W7Q2', 'W7Q5'], f: [
      `Forward: flux <b>0 → B<sub>max</sub></b> (one quadrant). Full-bridge / push-pull: <b>−B<sub>max</sub> → +B<sub>max</sub></b>.`,
      `Dual-switch forward: stress = <b>V<sub>in</sub></b>. Push-pull: stress = <b>2V<sub>in</sub></b>.`] },
    { t: 'PSFB and DAB one-liners', m: 10, topic: 'psfb', q: ['W8Q6', 'W8Q10', 'W8Q1', 'W8Q2', 'W9Q1'], f: [
      `PSFB: V<sub>o</sub>/V<sub>in</sub> = n(1 − φ/180°) → φ = 180° gives <b>0</b>, 72° gives <b>0.6</b>.`,
      `Leading leg gets ZVS easily (energy from L<sub>lkg</sub> + L/n²); lagging leg has only L<sub>lkg</sub>.`,
      `DAB: <b>two active bridges</b>, <b>bidirectional</b> power (V2G).`] },
    { t: 'Magnetics: two quick ones', m: 4, topic: 'magnetics', q: ['W10Q6', 'W9Q10'], f: [
      `Air gap: more ampere-turns before saturation, inductance set by the gap (independent of µ<sub>r</sub>).`,
      `Core loss rises with frequency → the <b>lowest-frequency line (f1)</b> has the lowest loss.`] },
    { t: 'AC Type-2: CP states and duty', m: 12, topic: 'ac-type2', q: ['W10Q1', 'W10Q2', 'W10Q3', 'W10Q7', 'W10Q8', 'W10Q10', 'W1Q9'], f: [
      `CP: <b>A +12 V</b> unplugged · <b>B +9 V</b> plugged · <b>C +6 V</b> charging · <b>D +3 V</b> vent · <b>E 0 V</b> error · <b>F −12 V</b> EVSE fault.`,
      `I = 0.6 × D (10-85 %) · I = 2.5 × (D − 64) (85-96 %) · 5 % = digital comms. 36 A → 60 %; 48 A → 80 % → <b>800 µs</b> at 1 kHz.`,
      `PP detects the plug and cable rating; CP carries state and current limit (SAE J1772 / IEC 61851).`] },
    { t: 'CCS2: layers and SLAC (biggest free block)', m: 15, topic: 'ccs2', q: ['W10Q9', 'W11Q1', 'W11Q2', 'W11Q3', 'W11Q4', 'W11Q5', 'W11Q6', 'W11Q7', 'W11Q9', 'W11Q10', 'W11Q11', 'W11Q12', 'W11Q13', 'W11Q14'], f: [
      `PLC on <b>CP-PE</b>; SLAC in state <b>B2</b>; contactors close in <b>C2</b>.`,
      `SLAC = <b>data link</b> · SLAAC = <b>network</b> · SDP = <b>application</b> · EXI = <b>presentation</b> · "fast, reliable, safer" = <b>transport</b>.`,
      `3 × START_ATTEN_CHAR, <b>58</b> frequency groups, <b>lowest attenuation</b> wins.`,
      `Pre-charge: current limit <b>2 A</b>, close when ΔV &lt; <b>20 V</b>.`] },
    { t: 'CAN and BEVC-DC001', m: 12, topic: 'dc001-can', q: ['W11Q8', 'W11Q15', 'W12Q1', 'W12Q3', 'W12Q5', 'W12Q6', 'W12Q7'], f: [
      `Termination <b>120 Ω</b>; CAN 2.0B 29-bit ID → <b>2²⁹</b> IDs; <b>lowest ID wins</b> arbitration.`,
      `Fixed addresses: BMS = <b>0xF4</b>, charger = <b>0x56</b>.`,
      `0x<b>18</b>10<b>56</b><b>F4</b>: priority = top 3 bits of 0x18 (000<b>110</b>00) = <b>6</b>; PGN = 0x00<b>10</b>00; destination 0x56 (charger); source 0xF4 (BMS).`] },
    { t: 'OCPP-J message frame', m: 6, topic: 'stations-ocpp', q: ['W12Q2', 'W12Q4', 'W12Q9', 'W12Q10'], f: [
      `[<b>2</b> = CALL, id, action, payload] · [<b>3</b> = CALLRESULT, id, payload] · [<b>4</b> = CALLERROR, id, code, text, details].`,
      `The id is unique per CALL and repeated unchanged in its reply.`] }
  ];
  const byId = Object.fromEntries((window.QBANK || []).map(q => [q.id, q]));
  E.forEach(e => e.q = e.q.filter(id => byId[id]));
  E.sort((a, b) => b.q.length / b.m - a.q.length / a.m);
  const totQ = E.reduce((s, e) => s + e.q.length, 0), totM = E.reduce((s, e) => s + e.m, 0);
  const sum = h('div', { class: 'readout', style: 'margin:12px 0' }); body.append(sum);
  const upd = () => { const ok = E.flatMap(e => e.q).filter(id => QPROG[id] === 1).length; sum.innerHTML = `<div><small>assignment Qs covered</small><b>${totQ} / ${(window.QBANK || []).length}</b></div><div><small>study time</small><b>≈ ${Math.round(totM / 6) / 10} h</b></div><div><small>you got right</small><b>${ok} / ${totQ}</b></div>`; };
  upd(); window.addEventListener('qprog', upd); onLeave(() => window.removeEventListener('qprog', upd));
  H(body, `<p class="cap">Sorted by assignment questions per minute of study, best value first.</p>`);
  E.forEach((e, i) => {
    const c = h('div', { class: 'card easy' });
    const done = () => e.q.filter(id => QPROG[id] === 1).length;
    const badge = h('span', { class: 'pill' });
    const setB = () => badge.textContent = `${done()}/${e.q.length} right`;
    setB(); window.addEventListener('qprog', setB); onLeave(() => window.removeEventListener('qprog', setB));
    c.append(h('div', { class: 'easyh' }, h('span', { class: 'rank' }, String(i + 1)), h('h3', {}, e.t), h('span', { class: 'pill hot' }, `${e.q.length} Qs · ${e.m} min`), badge));
    c.append(h('ul', { html: e.f.map(x => `<li>${x}</li>`).join('') }));
    const drill = h('div');
    const tg = h('button', { class: 'btn primary', onclick: () => { if (drill.childElementCount) { drill.innerHTML = ''; tg.textContent = 'Drill ' + e.q.length + ' questions'; } else { e.q.forEach(id => drill.append(renderQuestion(byId[id], { showTopic: true }))); tg.textContent = 'Hide questions'; } } }, 'Drill ' + e.q.length + ' questions');
    c.append(h('div', { class: 'nextprev', style: 'margin:6px 0 0;justify-content:flex-start' }, tg, h('button', { class: 'btn', onclick: () => go(e.topic) }, 'Open topic page →')), drill);
    body.append(c);
  });
  H(body, `<h2>Exam-day pattern for easy marks</h2><ol class="steps"><li><div>First pass: answer every recall question you recognise from these cards (CP levels, OSI layers, CAN, OCPP, modes). Do not stop on numericals.</div></li><li><div>Second pass: the one-line numericals (duty from current, PSFB ratio, CAN priority, ripple frequency).</div></li><li><div>Last pass: the long numericals (PFC stresses, dead time, DAB power).</div></li></ol>`);
} });
