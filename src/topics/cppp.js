/* ===== CP & PP: car meets charger (animated story + live circuit) ===== */
function cpppMovie(parent) {
  const R6 = { 13: 1500, 20: 680, 32: 220, 63: 100 }, SPOT = 430, OUT = -380;
  const par = (a, b) => a * b / (a + b);
  let E, raf, last = 0, playing = false, speed = 1, script = [];
  const L = lab(parent, 'Car meets charger: CP & PP, step by step', 'An EV pulls up to a 32 A Type-2 wallbox with a tethered cable. Press <b>Play the story</b>, or drive the car yourself with the controls below. Everything is computed from the real circuit: change a resistor and the voltages move.');
  /* ------------------------------------------------------------------ controls */
  const top = h('div', { class: 'nextprev', style: 'margin:0 0 8px;justify-content:flex-start' }); L.add(top);
  const pb = h('button', { class: 'btn primary', onclick: () => { if (!E.story) startStory(); else { playing = !playing; pb.textContent = playing ? '❚❚ Pause' : '▶ Resume'; } } }, '▶ Play the story');
  top.append(pb, h('button', { class: 'btn', onclick: () => { reset(); } }, '⟲ Reset'));
  segmented(top, [['.5', '½×'], ['1', '1×'], ['2', '2×']], '1', k => speed = +k);
  const STEPS = [[0, 'Idle: state A'], [.5, 'Car arrives'], [6.6, 'Plug in: PP'], [8.3, 'CP: +9 V (B1)'], [9.6, 'EVSE PWM (B2)'], [11.5, 'Car ready: S2 → C2'], [13, 'Contactor, current'], [21, 'EVSE lowers offer'], [26, 'Stop: back to B'], [29.5, 'Unplug: A'], [31.5, 'Car leaves']];
  const chips = h('div', { class: 'seg ivseg' }); L.add(chips);
  STEPS.forEach(([t, n], i) => chips.append(h('button', { onclick: () => seek(t + .05) }, (i + 1) + '. ' + n)));
  /* ------------------------------------------------------------------ scene */
  const scene = h('div', { class: 'cpscene' }); L.add(scene);
  scene.innerHTML = `<svg viewBox="0 0 1000 290" class="scn" role="img" aria-label="EV and wallbox">
   <rect class="sky" x="0" y="0" width="1000" height="250"/><rect class="gr" x="0" y="250" width="1000" height="40"/>
   <line class="bay" x1="400" y1="252" x2="400" y2="288"/><line class="bay" x1="790" y1="252" x2="790" y2="288"/><text class="bayt" x="595" y="276" text-anchor="middle">EV CHARGING ONLY</text>
   <g id="evse"><rect class="post" x="883" y="150" width="16" height="100"/><rect class="box" x="848" y="62" width="88" height="128" rx="10"/><rect class="scr" x="858" y="74" width="68" height="46" rx="4"/>
     <text id="scrA" class="scrA" x="892" y="98" text-anchor="middle">A</text><text id="scrB" class="scrB" x="892" y="113" text-anchor="middle">idle</text>
     <circle id="led" cx="892" cy="137" r="7"/><rect class="hol" x="840" y="150" width="10" height="26" rx="3"/><text class="lbl" x="892" y="208" text-anchor="middle">32 A wallbox</text></g>
   <path id="cable" class="cab" d=""/>
   <g id="parts"></g>
   <g id="car"><path class="body" d="M0 226L0 186Q3 166 30 160L86 152Q116 116 152 112L214 112Q246 114 272 150L296 158Q306 163 306 186L306 226Z"/>
     <path class="win" d="M104 150L152 121L210 121L238 150Z"/><line class="win2" x1="170" y1="121" x2="170" y2="150"/>
     <rect class="socb" x="120" y="176" width="90" height="10" rx="3"/><rect id="socf" class="socf" x="120" y="176" width="40" height="10" rx="3"/><text id="soct" class="soct" x="165" y="200" text-anchor="middle">45 %</text>
     <rect id="port" class="port" x="282" y="164" width="16" height="18" rx="4"/><circle id="portLed" cx="290" cy="158" r="4"/>
     <g id="w1" transform="translate(62 228)"><circle class="tyre" r="23"/><circle class="hub" r="10"/><g class="spk"><line x1="-10" y1="0" x2="10" y2="0"/><line x1="0" y1="-10" x2="0" y2="10"/></g></g>
     <g id="w2" transform="translate(246 228)"><circle class="tyre" r="23"/><circle class="hub" r="10"/><g class="spk"><line x1="-10" y1="0" x2="10" y2="0"/><line x1="0" y1="-10" x2="0" y2="10"/></g></g></g>
   <g id="plug"><rect class="plg" x="-4" y="-10" width="30" height="20" rx="5"/><rect class="plg" x="22" y="-6" width="12" height="12" rx="3"/></g>
   <g id="bubE" class="bub"><rect rx="8"/><text x="0" y="0"></text></g><g id="bubC" class="bub car"><rect rx="8"/><text x="0" y="0"></text></g>
  </svg>`;
  const S$ = id => scene.querySelector('#' + id);
  const nar = L.add(h('div', { class: 'narr' }));
  /* ------------------------------------------------------------------ circuit */
  const cBox = h('div', { class: 'svgwrap' }); L.add(cBox);
  const P = SCH.part.bind(SCH), W = SCH.wire, D = SCH.dot, T = SCH.text;
  cBox.innerHTML = `<svg class="sch cpc" viewBox="0 0 1000 300" role="img" aria-label="CP and PP equivalent circuit">
   <g id="flows"></g>
   <g id="eside">
    <rect class="zone" x="12" y="6" width="304" height="286" rx="10"/><text class="zl" x="22" y="286">EVSE (wallbox)</text>
    <rect class="zone cab2" x="318" y="6" width="150" height="286" rx="10"/><text class="zl" x="393" y="286" text-anchor="middle">tethered cable</text>
    <rect class="zone" x="470" y="6" width="92" height="286" rx="10"/><text class="zl" x="516" y="286" text-anchor="middle">plug</text>
    ${W([[30, 24], [200, 24]])}<g id="K">${P({ k: 'S', a: [200, 24], b: [256, 24] })}</g>${W([[256, 24], [560, 24]])}${T([110, 16], 'L / N power', 'tx s')}${T([228, 48], 'contactor', 'tx s')}
    ${P({ k: 'GEN', a: [70, 120], b: [70, 250], l: '±12 V', side: 1 })}${T([96, 214], '1 kHz', 'tx s', 'start')}
    ${W([[70, 250], [110, 250]])}${P({ k: 'R', a: [110, 250], b: [170, 250], l: 'R1 1 kΩ' })}${W([[170, 250], [560, 250]])}${D([220, 250])}
    ${W([[40, 120], [560, 120]])}${SCH.gnd([40, 120])}${D([70, 120])}
    ${P({ k: 'R', a: [520, 60], b: [520, 120], l: 'R6', side: -1, lid: 'r6l' })}${W([[520, 60], [560, 60]])}${D([520, 120])}
    ${[24, 60, 120, 250].map(y => `<circle class="pin" cx="560" cy="${y}" r="4"/>`).join('')}
    ${T([200, 92], 'PE', 'tx s')}${T([270, 244], 'CP', 'tx s')}${T([540, 54], 'PP', 'tx s')}
    <g class="tag" transform="translate(220 270)"><rect x="-48" y="-12" width="96" height="22" rx="6"/><text id="tE" y="4" text-anchor="middle">CP 12 V</text></g>
   </g>
   <rect class="zone" x="586" y="6" width="408" height="286" rx="10"/><text class="zl" x="980" y="286" text-anchor="end">vehicle inlet + controller</text>
   ${[24, 60, 120, 250].map(y => `<circle class="pin" cx="600" cy="${y}" r="4"/>`).join('')}
   ${W([[600, 24], [985, 24]])}${T([900, 16], '→ on-board charger', 'tx s')}
   ${W([[600, 60], [700, 60]])}${D([650, 60])}${P({ k: 'R', a: [650, 60], b: [650, 120], l: 'R5 4.7 kΩ', side: 1 })}${P({ k: 'R', a: [700, 60], b: [780, 60], l: 'R4 330 Ω' })}${W([[780, 60], [850, 60]])}${P({ k: 'V', a: [850, 120], b: [850, 60], l: '+5 V', side: 1 })}
   ${W([[600, 120], [985, 120]])}${D([650, 120])}${D([760, 120])}${D([850, 120])}${SCH.gnd([985, 120])}${T([960, 112], 'chassis', 'tx s', 'end')}
   ${W([[600, 250], [650, 250]])}${P({ k: 'D', a: [650, 250], b: [705, 250], l: 'diode' })}${W([[705, 250], [880, 250]])}${D([760, 250])}${D([628, 250])}
   ${P({ k: 'R', a: [760, 250], b: [760, 120], l: '2.74 kΩ', side: 1 })}
   <g id="S2">${P({ k: 'S', a: [880, 250], b: [880, 196], l: 'S2', side: 1 })}</g>${P({ k: 'R', a: [880, 196], b: [880, 120], l: '1.3 kΩ', side: 1, lid: 'rsl' })}
   <g class="tag" transform="translate(690 160)"><rect x="-70" y="-12" width="140" height="22" rx="6"/><text id="tP" y="4" text-anchor="middle">PP —</text></g>
   <g class="tag" transform="translate(640 278)"><rect x="-56" y="-12" width="112" height="22" rx="6"/><text id="tV" y="4" text-anchor="middle">car CP —</text></g>
  </svg>`;
  const C$ = id => cBox.querySelector('#' + id);
  const ro = L.readout();
  /* strip chart + CP scope */
  const strip = h('canvas', { class: 'lanes' }); L.add(strip);
  const g2 = h('div', { class: 'grid2' }); L.add(g2);
  const scW = h('div'); g2.append(scW); const scCv = h('canvas', { class: 'scope' }); scW.append(h('div', { class: 'cap' }, 'CP pin on an oscilloscope (real time, 3 ms)'), scCv); const cpS = new Scope(scCv, { xmin: 0, xmax: 3, ymin: -14, ymax: 14, xt: 6, yt: 4, xl: 'ms', yl: 'CP (V)', h: 180 });
  const logW = h('div'); g2.append(logW); logW.append(h('div', { class: 'cap' }, 'Event log (newest first)')); const logBox = h('ol', { class: 'evlog' }); logW.append(logBox);
  /* free-play controls */
  const fp = h('div', { class: 'card', style: 'margin-top:10px' }); L.add(fp);
  fp.append(h('h4', { class: 'evh' }, 'Play it yourself'));
  const r1 = h('div', { class: 'evrow' }), r2 = h('div', { class: 'evrow' }), r3 = h('div', { class: 'evrow' }); fp.append(r1, r2, h('h4', { class: 'evh' }, 'What if …'), r3);
  const act = (l, fn) => h('button', { class: 'btn', onclick: () => { stopStory(); fn(); } }, l);
  r1.append(act('Drive in', () => drive(SPOT)), act('Plug in', () => plug(1)), act('Car: start charging', () => { E.want = true; log('car', 'Driver presses "charge now"'); }), act('Car: stop charging', () => { E.want = false; log('car', 'Driver stops charging'); }), act('Unplug', () => plug(0)), act('Drive away', () => drive(OUT)));
  const sel = (lbl, opts, cur, fn) => { const s = h('select', { class: 'sel', 'aria-label': lbl }, opts.map(([v, t]) => h('option', { value: v, selected: v == cur }, t))); s.addEventListener('change', () => { stopStory(); fn(+s.value); }); return h('label', { class: 'mini' }, lbl + ' ', s); };
  const offSel = sel('EVSE offers', [[6, '6 A (10 %)'], [10, '10 A'], [16, '16 A'], [20, '20 A'], [32, '32 A'], [48, '48 A (80 %)'], [63, '63 A']], 32, v => { E.offer = v; log('evse', `Load management: offer ${v} A → PWM ${C.ampToDuty(v).toFixed(1)} %`); });
  const cabSel = sel('Cable (R6)', [[13, '13 A · 1.5 kΩ'], [20, '20 A · 680 Ω'], [32, '32 A · 220 Ω'], [63, '63 A · 100 Ω']], 32, v => { E.cable = v; log('car', `Different cable: R6 = ${R6[v]} Ω (${v} A rating)`); });
  r2.append(offSel, cabSel);
  const tg = (l, key, tip) => { const b = h('button', { class: 'btn fbtn', 'aria-pressed': 'false', title: tip, onclick: () => { stopStory(); E[key] = !E[key]; b.setAttribute('aria-pressed', E[key]); log('fault', (E[key] ? 'Injected: ' : 'Removed: ') + l + ' — ' + tip, E[key] ? 'w' : 'i'); if (key === 'noDiode' && !E.noDiode) E.diodeErr = false; } }, '⚡ ' + l); return b; };
  r3.append(tg('Car needs ventilation (state D)', 'vent', 'S2 switches 270 Ω instead of 1.3 kΩ → CP high ≈ +3 V'), tg('CP shorted to PE (state E)', 'cpShort', 'CP pulled to 0 V → EVSE must stop'), tg('Vehicle diode missing', 'noDiode', 'Negative half no longer stays at −12 V → EVSE detects a fake/faulty vehicle'), tg('EVSE internal fault (state F)', 'evseF', 'EVSE drives CP to a steady −12 V = not available'));
  /* ------------------------------------------------------------------ model */
  function init() { return { t: 0, carX: OUT, carTgt: OUT, plugT: 0, plugTgt: 0, plugged: false, want: false, S2: false, vent: false, offer: 32, cable: 32, cpShort: false, noDiode: false, evseF: false, diodeErr: false, pwm: false, K: false, I: 0, soc: .45, tm: {}, log: [], hist: [], bub: { evse: ['', 0], car: ['', 0] }, story: false, lastLetter: 'A', ppWas: false, n: 0 }; }
  function log(who, txt, lv = 'i') { E.n++; E.log.unshift({ t: E.t, who, txt, lv, n: E.n }); if (who === 'evse' || who === 'car') E.bub[who] = [txt.replace(/<[^>]+>/g, '').replace(/^EVSE:? ?/, '').slice(0, 58) + (txt.replace(/<[^>]+>/g, '').length > 58 ? '…' : ''), E.t]; }
  const after = (key, dt, fn) => { if (E.tm[key] == null) E.tm[key] = E.t + dt; else if (E.t >= E.tm[key]) { E.tm[key] = null; fn(); } };
  const clr = key => E.tm[key] = null;
  function drive(x) { if (E.plugged || E.plugT > 0) { log('car', 'Drive-away blocked: PP says a plug is still inserted', 'w'); return; } E.carTgt = x; log('car', x === SPOT ? 'Driving into the bay' : 'Driving away'); }
  function plug(v) { if (v && Math.abs(E.carX - SPOT) > 1) { log('car', 'Park the car in the bay first', 'w'); return; } if (!v && E.I > .5) log('car', 'Plug being removed during charging: PP changes first, car drops current to 0 at once', 'w'); E.plugTgt = v; if (!v) { E.plugged = false; log('driver', 'Driver pulls the plug out of the inlet'); } else log('driver', 'Driver takes the plug from the holster'); }
  function circuit() {
    const pl = E.plugged, Rs = E.S2 ? (E.vent ? 270 : 1300) : Infinity, Rv = pl ? (isFinite(Rs) ? par(2740, Rs) : 2740) : Infinity;
    let hi, lo; const gen = E.evseF ? [-12, -12] : E.pwm ? [12, -12] : [12, 12];
    const vAt = g => { if (pl && E.cpShort) return 0; if (!pl) return g; if (g > 0) return E.noDiode ? 12 * Rv / (1000 + Rv) : .7 + 11.3 * Rv / (1000 + Rv); return E.noDiode ? -12 * Rv / (1000 + Rv) : g; };
    hi = vAt(gen[0]); lo = vAt(gen[1]);
    const vPP = pl ? 5 * par(4700, R6[E.cable]) / (330 + par(4700, R6[E.cable])) : 5 * 4700 / 5030;
    const letter = E.evseF ? 'F' : hi > 10.5 ? 'A' : hi > 7.5 ? 'B' : hi > 4.5 ? 'C' : hi > 1.5 ? 'D' : hi > -1.5 ? 'E' : 'F';
    const duty = E.pwm && !E.evseF ? C.ampToDuty(E.offer) : 0;
    return { hi, lo, vPP, letter, duty, Rv, pwmSeen: E.pwm && !E.evseF && pl && !E.cpShort };
  }
  const ppCable = v => v < .5 ? '—' : v > 4.3 ? 'no plug' : v > 3.5 ? '13 A' : v > 2.6 ? '20 A' : v > 1.5 ? '32 A' : '63 A';
  function step(dt) {
    E.t += dt;
    // motion
    const dx = E.carTgt - E.carX; if (Math.abs(dx) > .5) { const v = Math.min(190, Math.abs(dx) * 1.6 + 25); E.carX += Math.sign(dx) * Math.min(Math.abs(dx), v * dt); if (Math.abs(E.carTgt - E.carX) <= .5) { E.carX = E.carTgt; if (E.carX === SPOT) log('car', 'Parked. Charge port opens'); } }
    if (E.plugT !== E.plugTgt) { E.plugT = E.plugTgt > E.plugT ? Math.min(1, E.plugT + dt / 1.6) : Math.max(0, E.plugT - dt / 1.6); if (E.plugT === 1 && E.plugTgt === 1) { E.plugged = true; } if (E.plugT === 0 && E.plugTgt === 0) log('driver', 'Plug back in the holster'); }
    const c = circuit();
    // vehicle PP logic
    if (E.plugged && !E.ppWas) { log('car', `PP: R6 = ${R6[E.cable]} Ω now in parallel with R5 → V<sub>PP</sub> falls 4.67 V → <b>${c.vPP.toFixed(2)} V</b>. Car: "plug inserted, cable rated ${E.cable} A". Drive-away inhibited.`); E.ppWas = true; }
    if (!E.plugged && E.ppWas) { E.ppWas = false; E.I = 0; if (E.S2) { E.S2 = false; } log('car', 'PP: V<sub>PP</sub> back to 4.67 V → "no plug". Drive-away allowed again.'); }
    // EVSE logic
    if (c.letter !== E.lastLetter) { const m = { A: '+12 V: no vehicle (state A)', B: `+${c.hi.toFixed(1)} V: vehicle connected, not ready (state B)`, C: `+${c.hi.toFixed(1)} V: vehicle ready (state C)`, D: `+${c.hi.toFixed(1)} V: ready, ventilation required (state D)`, E: '0 V: CP short / no power (state E)', F: '−12 V: EVSE not available (state F)' }[c.letter]; log('evse', 'EVSE measures CP high level ' + m); E.lastLetter = c.letter; }
    if (E.evseF) { E.pwm = false; E.K = false; }
    else if (c.letter === 'A' || c.letter === 'E') { if (E.pwm) log('evse', c.letter === 'A' ? 'EVSE: vehicle gone → PWM off, CP back to steady +12 V' : 'EVSE: state E → PWM off, contactor open', c.letter === 'E' ? 'w' : 'i'); if (E.K) log('evse', 'EVSE opens the contactor'); E.pwm = false; E.K = false; clr('pwm'); clr('k'); }
    else {
      if (E.pwm && c.lo > -10.5) { if (!E.diodeErr) log('evse', `EVSE: negative level only ${c.lo.toFixed(1)} V (should be −12 V) → <b>diode missing</b> → fault, no charging`, 'f'); E.diodeErr = true; E.pwm = false; E.K = false; }
      if (c.letter === 'B') { if (E.K) { E.K = false; log('evse', 'EVSE: back to state B → opens contactor'); } clr('k'); if (!E.pwm && !E.diodeErr) after('pwm', 1.2, () => { E.pwm = true; log('evse', `EVSE starts 1 kHz PWM, duty <b>${C.ampToDuty(E.offer).toFixed(1)} %</b> = "you may draw up to ${E.offer} A" (state B2)`); }); }
      if ((c.letter === 'C' || c.letter === 'D') && E.pwm && !E.K) after('k', .4, () => { E.K = true; log('evse', `EVSE sees state ${c.letter} with valid PWM → <b>closes the AC contactor</b>. Power is on the cable.`); });
    }
    // vehicle CP logic
    const Iset = Math.min(E.offer, E.cable, 32);
    if (E.want && c.pwmSeen && E.plugged && !E.S2) after('s2', 1, () => { E.S2 = true; log('car', `Car reads duty ${c.duty.toFixed(1)} % → ${E.offer} A; cable ${E.cable} A; OBC 32 A → limit <b>${Iset} A</b>. Closes <b>S2</b>: 1.3 kΩ in parallel → CP high +9 → +6 V`); });
    if (!(E.want && c.pwmSeen && E.plugged)) clr('s2');
    if (E.S2 && (!E.want || !c.pwmSeen || !E.plugged)) { if (E.I > .3) E.I = Math.max(0, E.I - 14 * dt); else { E.I = 0; E.S2 = false; log('car', (c.pwmSeen ? 'Current at 0 → car opens S2 → CP back to +9 V' : 'PWM gone → car stops drawing current and opens S2'), c.pwmSeen ? 'i' : 'w'); } }
    else { const tgt = E.K && E.S2 ? Iset : 0; E.I = tgt > E.I ? Math.min(tgt, E.I + 6 * dt) : Math.max(tgt, E.I - 12 * dt); if (!E.K) E.I = 0; }
    if (E.I > 0) E.soc = Math.min(1, E.soc + E.I / 32 * .004 * dt);
    // story script
    while (script.length && script[0][0] <= E.t) script.shift()[1]();
    if (E.story && E.t > 36) { E.story = false; playing = false; pb.textContent = '▶ Play the story'; }
    E.c = c;
  }
  const story = () => [[.3, () => log('story', 'Story: the wallbox is idle. CP sits at a steady +12 V (state A).')], [.5, () => drive(SPOT)], [6.6, () => plug(1)], [11.5, () => { E.want = true; log('car', 'Driver taps "charge now" (or the car starts on plug-in)'); }], [21, () => { E.offer = 16; offSel.querySelector('select').value = 16; log('evse', 'Load management: the site is busy → offer 16 A → PWM <b>26.7 %</b>. The car must follow within seconds.'); }], [26, () => { E.want = false; log('car', 'Charging target reached → car ramps current to zero first'); }], [29.5, () => plug(0)], [31.5, () => drive(OUT)]];
  function reset() { stopStory(); E = init(); script = []; offSel.querySelector('select').value = 32; cabSel.querySelector('select').value = 32; $$('.fbtn', r3).forEach(b => b.setAttribute('aria-pressed', 'false')); log('story', 'Ready. Press Play the story, or use the controls.'); E.c = circuit(); draw(true); }
  function startStory() { reset(); E.story = true; script = story(); playing = true; pb.textContent = '❚❚ Pause'; }
  function stopStory() { if (E && E.story) { E.story = false; script = []; } playing = true; pb.textContent = '▶ Play the story'; }
  function seek(t) { reset(); E.story = true; script = story(); while (E.t < t) { step(.02); sample(); } playing = true; pb.textContent = '❚❚ Pause'; draw(true); }
  function sample() { if (!E.hist.length || E.t - E.hist[E.hist.length - 1].t >= .1) E.hist.push({ t: E.t, hi: E.c.hi, lo: E.c.lo, pwm: E.pwm && !E.evseF, vpp: E.carX > OUT + 5 ? E.c.vPP : null, I: E.I, K: E.K, S2: E.S2, L: E.c.letter }); if (E.hist.length > 900) E.hist.shift(); }
  /* ------------------------------------------------------------------ drawing */
  function cablePath(px, py) { return `M900 190C900 262 ${px + 70} 262 ${px + 32} ${py}`; }
  function bubble(id, txt, x, y, age) { const g = S$(id); if (!txt || age > 4.5) { g.style.opacity = 0; return; } g.style.opacity = Math.max(0, Math.min(1, (4.5 - age) * 1.5)); const t = g.querySelector('text'), r = g.querySelector('rect'); t.textContent = txt; const w = Math.min(440, txt.length * 6.4 + 20); r.setAttribute('x', -w / 2); r.setAttribute('y', -15); r.setAttribute('width', w); r.setAttribute('height', 24); t.setAttribute('text-anchor', 'middle'); t.setAttribute('y', 2); g.setAttribute('transform', `translate(${Math.max(w / 2 + 6, Math.min(994 - w / 2, x))} ${y})`); }
  function draw(full, real) {
    const c = E.c || circuit(), car = S$('car');
    car.setAttribute('transform', `translate(${E.carX} 0)`);
    const rot = E.carX / 23 * 57.3; ['w1', 'w2'].forEach(w => S$(w).querySelector('.spk').setAttribute('transform', `rotate(${rot})`));
    S$('socf').setAttribute('width', 90 * E.soc); S$('soct').textContent = (E.soc * 100).toFixed(0) + ' %' + (E.I > .5 ? ' ⚡ ' + E.I.toFixed(0) + ' A' : '');
    const hx = 846, hy = 163, px0 = E.carX + 298, py0 = 173, k = E.plugT, arc = Math.sin(Math.PI * k) * 46;
    const px = hx + (px0 - hx) * k, py = hy + (py0 - hy) * k - arc;
    S$('plug').setAttribute('transform', `translate(${px} ${py})`); S$('cable').setAttribute('d', cablePath(px, py));
    const st = E.evseF ? 'F' : c.letter, lab2 = { A: 'idle', B: E.pwm ? 'PWM on' : 'connected', C: 'charging', D: 'charging·vent', E: 'ERROR', F: 'FAULT' }[st];
    S$('scrA').textContent = st + (E.pwm && (st === 'B' || st === 'C' || st === 'D') ? '2' : (st === 'B' || st === 'C') ? '1' : ''); S$('scrB').textContent = E.pwm ? `${E.offer} A max` : lab2;
    S$('led').setAttribute('class', 'led ' + (st === 'E' || st === 'F' || E.diodeErr ? 'bad' : E.K ? 'chg' : E.plugged ? 'con' : 'idle'));
    S$('portLed').setAttribute('class', 'led ' + (E.I > .5 ? 'chg' : E.plugged ? 'con' : 'off'));
    // energy particles
    const pg = S$('parts'); if (E.I > .5) { const path = S$('cable'), Ln = path.getTotalLength(); let s = ''; for (let i = 0; i < 6; i++) { const p = path.getPointAtLength(((real || 0) * 90 + i * Ln / 6) % Ln); s += `<circle class="ep" cx="${p.x}" cy="${p.y}" r="4"/>`; } pg.innerHTML = s; } else pg.innerHTML = '';
    bubble('bubE', E.bub.evse[0], 760, 36, E.t - E.bub.evse[1]); bubble('bubC', E.bub.car[0], E.carX + 160, 92, E.t - E.bub.car[1]);
    // circuit
    C$('eside').setAttribute('transform', `translate(${-44 * (1 - E.plugT)} 0)`); C$('eside').style.opacity = .55 + .45 * E.plugT;
    C$('K').firstChild.classList.toggle('closed', E.K); C$('S2').firstChild.classList.toggle('closed', E.S2);
    C$('r6l').textContent = `R6 ${R6[E.cable]} Ω`; C$('rsl').textContent = E.vent ? '270 Ω (D)' : '1.3 kΩ';
    const slow = ((real || 0) * .5) % 1, dty = c.duty / 100, highHalf = E.evseF ? false : E.pwm ? slow < dty : true, vNow = highHalf ? c.hi : c.lo;
    C$('tE').textContent = `CP ${vNow >= 0 ? '+' : ''}${vNow.toFixed(1)} V${E.pwm ? (highHalf ? ' (high)' : ' (low)') : ''}`;
    C$('tP').textContent = E.carX > OUT + 5 ? `V_PP ${c.vPP.toFixed(2)} V · ${ppCable(c.vPP)}` : 'PP —';
    const vCar = E.plugged ? (E.cpShort ? 0 : highHalf ? Math.max(0, c.hi - (E.noDiode ? 0 : .7)) : (E.noDiode ? c.lo : 0)) : 0;
    C$('tV').textContent = E.plugged ? `car side ${vCar.toFixed(1)} V` : 'car CP —';
    let f = '';
    if (E.plugged && !E.cpShort) {
      if (highHalf && c.hi > 0) { f += SCH.flow([[70, 250], [560, 250], [600, 250], [760, 250], [760, 120], [70, 120]], '--ch-v'); if (E.S2) f += SCH.flow([[760, 250], [880, 250], [880, 120], [760, 120]], '--ch-v'); }
      else if (!highHalf && E.noDiode) f += SCH.flow([[70, 120], [760, 120], [760, 250], [70, 250]], '--bad');
      f += SCH.flow([[850, 60], [650, 60], [650, 120], [850, 120]], '--ch-d') + SCH.flow([[650, 60], [520, 60], [520, 120], [650, 120]], '--ch-d');
    }
    if (E.I > .5) f += SCH.flow([[30, 24], [985, 24]], '--ch-i', '', 'pw');
    C$('flows').innerHTML = f;
    ro([['CP state', st + (E.pwm ? '2' : '')], ['CP high / low', `${c.hi.toFixed(1)} / ${c.lo.toFixed(1)} V`], ['PWM duty → offer', E.pwm ? `${c.duty.toFixed(1)} % → ${E.offer} A` : 'off'], ['V_PP → cable', E.carX > OUT + 5 ? `${c.vPP.toFixed(2)} V → ${ppCable(c.vPP)}` : '—'], ['S2 · contactor', `${E.S2 ? 'closed' : 'open'} · ${E.K ? 'closed' : 'open'}`], ['Charging current', E.I.toFixed(1) + ' A']]);
    // CP scope
    const X = [], Y = []; for (let i = 0; i < 3; i++) { if (E.pwm && !E.evseF) { X.push(i, i + dty, i + dty, i + 1); Y.push(c.hi, c.hi, c.lo, c.lo); } else { X.push(i, i + 1); Y.push(c.hi, c.hi); } }
    cpS.draw([{ x: X, y: Y, c: '--ch-v', w: 2.6 }], { h: [{ y: 0, c: '--muted' }], t: [{ x: 2.95, y: Math.min(12.5, c.hi + 1.8), s: st + (E.pwm ? '2' : ''), a: 'right', c: '--ink' }] });
    // narration + log
    const e = E.log[0]; nar.innerHTML = e ? `<span class="who ${e.who}">${{ evse: 'EVSE', car: 'VEHICLE', driver: 'DRIVER', fault: 'WHAT-IF', story: 'STORY' }[e.who]}</span> ${e.txt}` : '';
    if (full || E.log.length !== draw.nlog) { logBox.innerHTML = E.log.slice(0, 40).map(x => `<li class="${x.lv}"><span class="n">${x.n}</span><span class="t">${x.t.toFixed(1)} s</span><span>${x.txt}</span></li>`).join(''); draw.nlog = E.log.length; }
    drawStrip();
    let ci = -1; STEPS.forEach(([t], i) => { if (E.story && E.t >= t) ci = i; }); $$('button', chips).forEach((b, i) => b.setAttribute('aria-pressed', i === ci));
  }
  function drawStrip() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2), Wc = strip.clientWidth || 700, Hc = 196; if (strip.width !== Math.round(Wc * dpr)) { strip.width = Math.round(Wc * dpr); strip.height = Hc * dpr; strip.style.height = Hc + 'px'; }
    const g = strip.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, Wc, Hc);
    const L0 = Wc < 520 ? 58 : 84, R0 = 10, win = 36, t1 = Math.max(win, E.t), t0 = t1 - win, X = t => L0 + (t - t0) / win * (Wc - L0 - R0), mono = css('--f-mono'), mut = css('--muted'), H2 = E.hist;
    g.font = `600 10px ${mono}`; g.textBaseline = 'middle';
    const lane = (y, hgt, name, min, max, refs, fnLine, col, band) => {
      const Y = v => y + hgt - (v - min) / (max - min) * hgt; g.fillStyle = mut; g.textAlign = 'left'; g.fillText(name, 4, y + hgt / 2);
      g.strokeStyle = css('--grid'); g.lineWidth = 1; refs.forEach(([v, t]) => { g.beginPath(); g.moveTo(L0, Y(v)); g.lineTo(Wc - R0, Y(v)); g.stroke(); g.fillStyle = mut; g.textAlign = 'right'; g.font = `600 8.5px ${mono}`; g.fillText(t, L0 - 3, Y(v)); g.font = `600 10px ${mono}`; });
      if (band) { g.fillStyle = col; g.globalAlpha = .25; for (let i = 1; i < H2.length; i++) { const a = H2[i - 1]; if (a.pwm) g.fillRect(X(a.t), Y(a.hi), X(H2[i].t) - X(a.t) + .5, Y(a.lo) - Y(a.hi)); } g.globalAlpha = 1; }
      g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); let started = false; H2.forEach(p => { const v = fnLine(p); if (v == null) { started = false; return; } started ? g.lineTo(X(p.t), Y(v)) : g.moveTo(X(p.t), Y(v)); started = true; }); g.stroke();
      if (band) { g.beginPath(); started = false; H2.forEach(p => { started ? g.lineTo(X(p.t), Y(p.lo)) : g.moveTo(X(p.t), Y(p.lo)); started = true; }); g.stroke(); }
    };
    lane(8, 70, 'CP', -13, 13, [[12, '12'], [9, '9'], [6, '6'], [3, '3'], [0, '0'], [-12, '−12']], p => p.hi, css('--ch-v'), true);
    lane(92, 42, 'V_PP', 0, 5, [[4.67, '4.67'], [1.94, '1.94'], [0, '0']], p => p.vpp, css('--ch-d'));
    lane(144, 34, 'I (A)', 0, 64, [[32, '32'], [0, '0']], p => p.I, css('--ch-i'));
    g.strokeStyle = css('--grid'); g.fillStyle = mut; g.textAlign = 'center'; for (let s = Math.ceil(t0 / 5) * 5; s <= t1; s += 5) { const x = X(s); g.beginPath(); g.moveTo(x, 4); g.lineTo(x, 182); g.stroke(); g.fillText(s + ' s', x, 190); }
    // state letters along the top
    let lastL = ''; H2.forEach(p => { const lt = p.L + (p.pwm ? '2' : ''); if (lt !== lastL) { g.fillStyle = css('--ink'); g.font = `700 9.5px ${mono}`; g.textAlign = 'left'; g.fillText(lt, X(p.t) + 2, 12); g.font = `600 10px ${mono}`; lastL = lt; } });
  }
  function frame(ts) {
    raf = requestAnimationFrame(frame); const dt = Math.min(.1, (ts - (last || ts)) / 1000); last = ts;
    if (playing) { let s = dt * speed; while (s > 1e-6) { const d = Math.min(.02, s); step(d); s -= d; } sample(); }
    draw(false, ts / 1000);
  }
  E = init(); reset(); playing = true;
  raf = requestAnimationFrame(frame); onLeave(() => cancelAnimationFrame(raf));
  window.addEventListener('resize', drawStrip); onLeave(() => window.removeEventListener('resize', drawStrip));
  L.add(h('p', { class: 'cap', html: 'Circuit values: EVSE ±12 V through R1 = 1 kΩ; vehicle diode, 2.74 kΩ always, 1.3 kΩ (or 270 Ω for ventilation) switched by S2; PP: +5 V, R4 = 330 Ω, R5 = 4.7 kΩ in the vehicle, R6 in the plug (course model, IEC 61851-1 / IEC 62196). CP levels shown include a 0.7 V diode drop, which is why they land on the nominal 9 / 6 / 3 V; the course question W10Q5 ignores the diode and gets 5.62 V. The dots in the circuit show current during the <i>positive</i> half of the PWM, slowed down ~500×: during the −12 V half the diode blocks and no current flows in the vehicle resistors. Timings are illustrative.' }));
  return L;
}
page({ id: 'cp-pp-movie', mod: 'home', title: 'Car meets charger: CP & PP', kw: 'cp pp control pilot proximity pilot animation car plug resistor r6 s2 state a b c d e f pwm duty', render(body) {
  H(body, `<div class="crumb"><span>Animated story</span><span class="pill hot">W10 · 9 assignment Qs</span></div><h1>Car meets charger: CP &amp; PP in motion</h1><p class="lede">Watch what the two signal pins do from the moment a car pulls in until it drives away: which resistor changes which voltage, who measures it, and what each side decides.</p>`);
  cpppMovie(body);
  H(body, `<div class="nextprev" style="justify-content:flex-start"><button class="btn primary" onclick="go('ac-type2')">Topic page: AC Type-2 (formulas + assignment Qs) →</button></div>`);
} });
embed('ac-type2', box => { H(box, '<h2>See it happen: car meets charger</h2>'); cpppMovie(box); });
