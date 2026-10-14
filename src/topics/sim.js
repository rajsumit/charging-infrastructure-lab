/* ===== End-to-end charger simulator ===== */
page({ id: 'simulator', mod: 'home', title: 'Charger simulator (end to end)', kw: 'simulation ac charger dc charger block diagram chain stages onboard charger evse battery', render(body) {
  H(body, `<div class="crumb"><span>Whole-system view</span><span class="pill hot">★ Ties every module together</span></div><h1>Charger simulator: grid to battery</h1><p class="lede">Pick an AC or DC charger, set the battery state of charge, and follow the power through every stage. <b>Click any block</b> to see what it does, its waveform right now, and the course topic behind it.</p>`);
  const MODES = {
    ac1: { name: 'AC, single-phase (Mode 3, 7.4 kW)', Pmax: 7400, ph: 1, Vll: 230, Ns: 96, link: 400, C: 2e-3, Imax: 32, dc: false },
    ac3: { name: 'AC, three-phase (Mode 3, 11 kW)', Pmax: 11000, ph: 3, Vll: 400, Ns: 96, link: 700, C: 0.4e-3, Imax: 16, dc: false },
    dc: { name: 'DC fast charger (Mode 4, CCS2, 150 kW)', Pmax: 150000, ph: 3, Vll: 400, Ns: 192, link: 850, C: 1e-3, Imax: 0, dc: true }
  };
  let mode = 'ac3', sel = 'pfc', soc = .35, topo = 'psfb', pfcOn = true, playing = null;
  const Voc = s => 3.0 + 1.0 * s + .2 * Math.pow(s, 6);
  function state() {
    const M = MODES[mode], Vb = M.Ns * Voc(soc), Icc = M.Pmax / (M.Ns * 3.9); let I = Icc, ph = 'CC';
    if (soc > .8) { I = Icc * Math.exp(-(soc - .8) / .07); ph = 'CV'; } if (soc >= .995) { I = 0; ph = 'done'; }
    let P = Math.min(M.Pmax, Vb * I); I = Vb ? P / Vb : 0;
    const e = { evse: .999, pfc: .985, dcdc: M.dc ? .98 : .975, out: .998 };
    const eta = e.evse * e.pfc * e.dcdc * e.out, Pin = P / eta;
    const Iline = M.ph === 3 ? Pin / (Math.sqrt(3) * M.Vll) : Pin / M.Vll;
    return { M, Vb, I, P, Pin, Iline, ph, e, eta, Pdc: P / e.out, Pdcdc_in: P / (e.dcdc * e.out), Ppfc_in: Pin * e.evse };
  }
  const kW = w => w >= 1e4 ? (w / 1e3).toFixed(1) + ' kW' : w >= 1e3 ? (w / 1e3).toFixed(2) + ' kW' : w.toFixed(0) + ' W';
  const SC = (series, ax, extra) => ({ series, ax, extra });
  const t = (n, f) => rng(n + 1, i => f(i / n));
  /* signals ------------------------------------------------------------ */
  const sigGrid = (s, withPfc = true) => { const M = s.M, ax = { xmin: 0, xmax: 40, ymin: -1.3, ymax: 1.3, xl: 'ms', yl: 'pu', xt: 4, yt: 4 }; const X = t(400, f => f * 40), th = x => T2 * 50 * x / 1000; const ser = [];
    (M.ph === 3 ? [0, 1, 2] : [0]).forEach(k => ser.push({ x: X, y: X.map(x => Math.sin(th(x) - k * T2 / 3)), c: '--ch-b', w: k ? 1 : 2, dash: k ? [4, 3] : null }));
    const cur = withPfc ? (x => Math.sin(th(x))) : (x => { const a = ((th(x) % Math.PI) + Math.PI) % Math.PI; return Math.sign(Math.sin(th(x))) * 4 * Math.exp(-Math.pow((a - Math.PI / 2) / .28, 2)); });
    ser.push({ x: X, y: X.map(cur), c: '--ch-i', w: 2.6 }); if (!withPfc) ax.ymax = 4.5, ax.ymin = -4.5; return SC(ser, ax); };
  const sigLink = s => { const M = s.M; if (M.ph === 1) { const dv = C.dblLineRipple(s.Pdcdc_in, 50, M.link, M.C); return SC([{ fn: x => M.link + dv / 2 * Math.sin(T2 * 100 * x / 1000), c: '--ch-v', w: 2.6 }], { xmin: 0, xmax: 40, ymin: M.link - Math.max(dv, 4), ymax: M.link + Math.max(dv, 4), xl: 'ms', yl: 'Vdc (V)', xt: 4, yt: 4 }, { h: [{ y: M.link, c: '--muted', t: 'Vdc' }] }); }
    const r = M.link * .006; return SC([{ fn: x => M.link + r * tri(x * 20), c: '--ch-v', w: 2.6, n: 400 }], { xmin: 0, xmax: .2, ymin: M.link - 12, ymax: M.link + 12, xl: 'ms', yl: 'Vdc (V)', xt: 4, yt: 4 }, { h: [{ y: M.link, c: '--muted', t: 'Vdc' }] }); };
  const sq = ph => { const x = ((ph % 1) + 1) % 1; return x < .5 ? 1 : -1; };
  const sigDcdc = s => { const M = s.M, N = 600, X = t(N, f => f * 30), ax = { xmin: 0, xmax: 30, ymin: -1.3, ymax: 1.3, xl: 'µs (3 periods at 100 kHz)', yl: 'pu', xt: 6, yt: 4 };
    if (topo === 'psfb') { const phi = Math.max(0, Math.min(175, 180 * (1 - s.Vb / (1.12 * M.Ns * 4.2)))); const sh = (180 - phi) / 360; return SC([{ x: X, y: X.map(x => (sq(x / 10) - sq(x / 10 - sh)) / 2), c: '--ch-b', w: 2.4, fill: true }], ax, { t: [{ x: 15, y: 1.15, s: `phase shift φ = ${phi.toFixed(0)}°  → Vo/(nVin) = ${(1 - phi / 180).toFixed(2)}`, a: 'center', c: '--ink' }] }); }
    const x0 = Math.min(.95, s.P / (M.Pmax * 2)), dl = C.dabDeltaForFrac(Math.min(.99, x0 * 2)) / 360 * 1, Y = [], Z = [], Ii = []; let acc = 0; X.forEach((x, i) => { const vp = sq(x / 10), vs = sq(x / 10 - dl); Y.push(vp); Z.push(vs * .8); acc += (vp - vs * .8) * 30 / N; Ii.push(acc); }); const m = Ii.reduce((a, b) => a + b, 0) / Ii.length, mx = Math.max(...Ii.map(v => Math.abs(v - m))) || 1;
    return SC([{ x: X, y: Y, c: '--ch-v', w: 2 }, { x: X, y: Z, c: '--ch-b', w: 2, dash: [5, 3] }, { x: X, y: Ii.map(v => (v - m) / mx), c: '--ch-i', w: 2.4 }], ax, { t: [{ x: 15, y: 1.15, s: `DAB single phase shift δ = ${(dl * 360).toFixed(0)}°`, a: 'center', c: '--ink' }] }); };
  const sigCP = s => { const M = s.M, d = M.dc ? 5 : C.ampToDuty(M.Imax); const hi = s.ph === 'done' ? 9 : 6; const X = [], Y = []; for (let k = 0; k < 3; k++) { X.push(k, k + d / 100, k + d / 100, k + 1); Y.push(hi, hi, -12, -12); }
    return SC([{ x: X, y: Y, c: '--ch-v', w: 2.6, step: true }], { xmin: 0, xmax: 3, ymin: -14, ymax: 14, xl: 'ms (1 kHz)', yl: 'CP (V)', xt: 6, yt: 4 }, { t: [{ x: 1.5, y: 10.5, s: M.dc ? '5 % duty → digital (PLC) communication' : `${d.toFixed(0)} % duty → ${M.Imax} A available`, a: 'center', c: '--ink' }] }); };
  const sigBatt = s => { const M = s.M, X = t(200, f => .05 + f * .95), P = [], V = [], I = []; X.forEach(x => { const old = soc; soc = x; const q = state(); soc = old; P.push(q.P / M.Pmax); V.push(q.Vb / (M.Ns * 4.2)); I.push(q.I / (M.Pmax / (M.Ns * 3.9))); });
    return SC([{ x: X.map(v => v * 100), y: V, c: '--ch-v', w: 2.4 }, { x: X.map(v => v * 100), y: I, c: '--ch-i', w: 2.4 }, { x: X.map(v => v * 100), y: P, c: '--ch-d', w: 2, dash: [5, 3] }], { xmin: 5, xmax: 100, ymin: 0, ymax: 1.15, xl: 'SOC %', yl: 'pu', xt: 5, yt: 4 }, { v: [{ x: soc * 100, c: '--hot', t: 'now' }] }); };
  const sigOut = s => { const ax = { xmin: 0, xmax: 40, ymin: 0, ymax: 1.2, xl: 'ms', yl: 'pu', xt: 4, yt: 4 }; const r = .008; return SC([{ fn: x => s.Vb / (s.M.Ns * 4.2) + r * tri(x * 2.5), c: '--ch-v', w: 2.4, n: 400 }, { fn: x => s.I / (s.M.Pmax / (s.M.Ns * 3.9)) * .95 + r * -tri(x * 2.5), c: '--ch-i', w: 2.4, n: 400 }], ax); };
  /* stage catalogue ---------------------------------------------------- */
  const Qn = id => questionsFor(id).length;
  const ST = {
    grid: { n: 'Grid input', sub: 'LV mains', topic: 'rectifier', io: s => kW(s.Pin), sig: s => sigGrid(s, true), d: s => `<p>${s.M.ph === 3 ? '3-phase 400 V (line-line), 50 Hz' : 'Single-phase 230 V, 50 Hz'}. Input line current ≈ <b>${s.Iline.toFixed(1)} A</b> per phase at unity PF for ${kW(s.Pin)} drawn.</p><p>Power drawn from the grid = battery power ÷ total efficiency (${(s.eta * 100).toFixed(1)} %). A single-phase source delivers pulsating power at 100 Hz; a 3-phase source delivers constant power.</p>` },
    evse: { n: 'AC EVSE', sub: 'smart switch', topic: 'charger-arch', io: s => kW(s.Ppfc_in), sig: sigCP, d: s => `<p>An AC EVSE contains <b>no power conversion</b>: contactor/relay, residual-current protection (RCD + DC fault detection), energy meter, controller, and the CP/PP signalling interface. It tells the car how much current it may draw using the CP duty cycle.</p><p>The waveform shows the <b>control pilot</b>: ±12 V at 1 kHz, duty ${C.ampToDuty(s.M.Imax).toFixed(0)} % = ${s.M.Imax} A. Level +6 V = vehicle ready (state C).</p>` },
    prot: { n: 'AC input & protection', sub: 'breaker, meter, filter', topic: 'charger-arch', io: s => kW(s.Pin), sig: s => sigGrid(s, true), d: s => `<p>Input breaker/contactor, surge protection, EMI filter and energy meter in front of the power modules. A 150 kW charger is built from several power modules (e.g. 3 × 50 kW) sharing one cabinet; each draws about ${s.Iline.toFixed(0)} A in total per phase at this power.</p>` },
    cable: { n: 'Cable & connector', sub: s => s.M.dc ? 'CCS2 + PLC' : 'Type 2 plug', topic: 'ac-type2', io: s => kW(s.P), sig: sigCP, d: s => s.M.dc ? `<p>CCS2 connector: DC+ / DC− power pins, PE, CP and PP. <b>PLC (HomePlug Green PHY)</b> rides on CP and a <b>5 % PWM</b> announces digital communication. Sequence: SLAC → SLAAC → SDP → ISO 15118 session → cable check → pre-charge (&lt; 2 A, ΔV &lt; 20 V) → contactors close in state C2.</p>` : `<p>Type-2 cable: L1-L3, N, PE, CP and PP. The resistor R6 in the plug tells the car the cable rating via PP (e.g. 220 Ω → 32 A, 100 Ω → 63 A). CP duty sets the maximum current.</p>` },
    pfc: { n: s => s.M.dc ? 'Active rectifier (PFC)' : 'OBC: PFC stage', sub: s => s.M.ph === 3 ? '3-φ VSC / boost' : 'boost / totem-pole', topic: 'boost-pfc', io: s => kW(s.Pdcdc_in / s.e.pfc), sig: s => sigGrid(s, pfcOn), d: s => (s.M.ph === 3 ? `<p>A 3-phase active rectifier (six-switch VSC) with grid inductors and dq control (PLL, iq* = 0 for unity PF). The DC link must be higher than the grid line-line peak: here ${s.M.link} V for ${s.M.Vll} V mains.</p>` : `<p>Boost or totem-pole PFC: current loop makes iL follow |vs|, duty d = 1 − |vs|/Vo, L = Vo/(4·ΔI·fsw).</p>`) + `<p>Toggle PFC off below to see what a plain diode bridge + capacitor does to the line current (narrow pulses, poor PF).</p>`, ctl: (p, redraw) => segmented(p, [['on', 'PFC on'], ['off', 'PFC off (diode + C)']], pfcOn ? 'on' : 'off', k => { pfcOn = k === 'on'; redraw(); }) },
    dclink: { n: 'DC link', sub: s => s.M.link + ' V', topic: 'pfc-stress', io: s => kW(s.Pdcdc_in), sig: sigLink, d: s => s.M.ph === 1 ? `<p>Single-phase input power pulsates at <b>100 Hz</b> but the battery wants constant power, so the DC-link capacitor (${(s.M.C * 1e3).toFixed(1)} mF) absorbs it: ΔVpp = P/(2π·f·Vo·C) = <b>${C.dblLineRipple(s.Pdcdc_in, 50, s.M.link, s.M.C).toFixed(1)} V</b>.</p>` : `<p>Balanced 3-phase power is constant, so there is <b>no 100 Hz ripple</b>; only small switching-frequency ripple remains. That is why 3-phase chargers need a much smaller DC-link capacitor.</p>` },
    dcdc: { n: 'Isolated DC-DC', sub: 'PSFB / DAB + HF transformer', topic: 'psfb', io: s => kW(s.P / s.e.out), sig: sigDcdc, d: s => `<p>The galvanic-isolation and voltage-matching stage. <b>PSFB</b>: Vo/Vin = n(1 − φ/180°); leading leg ZVS from Llkg + Lo/n², lagging leg only Llkg. <b>DAB</b>: P = Vin·Vo′·δ(π−δ)/(2π²·fs·L), bidirectional (V2G).</p><p>As SOC rises the battery voltage rises, so the PSFB phase shift φ falls (more of the half-cycle is active).</p>`, ctl: (p, redraw) => segmented(p, [['psfb', 'PSFB'], ['dab', 'DAB']], topo, k => { topo = k; redraw(); }) },
    out: { n: 'Output filter & contactors', sub: s => s.M.dc ? 'LC, DC contactors, IMD' : 'LC, relay, fuse', topic: 'ccs2', io: s => kW(s.P), sig: sigOut, d: s => `<p>Rectifier and LC filter smooth the HF output; contactors connect the battery only after <b>pre-charge</b>, fuses protect, and ${s.M.dc ? 'the charger monitors insulation (IMD) before and during charging.' : 'the vehicle monitors isolation.'}</p>` },
    batt: { n: 'Battery + BMS', sub: s => s.M.Ns + 's pack', topic: 'ev-system', io: s => kW(s.P), sig: sigBatt, d: s => `<p>The <b>BMS is the master</b>: it requests voltage and current. Phase now: <b>${s.ph}</b>. CC-CV: constant current until ${(4.2).toFixed(1)} V/cell, then constant voltage while current tapers; stop at a small cut-off current. Pack ${s.Vb.toFixed(0)} V, ${s.I.toFixed(1)} A.</p>` }
  };
  const CHAINS = { ac1: [['EVSE', 'zone', ['grid', 'evse', 'cable']], ['Vehicle (on-board charger)', 'ev', ['pfc', 'dclink', 'dcdc', 'out', 'batt']]] };
  CHAINS.ac3 = CHAINS.ac1; CHAINS.dc = [['Charging station (DC EVSE)', 'zone', ['grid', 'prot', 'pfc', 'dclink', 'dcdc', 'out', 'cable']], ['Vehicle', 'ev', ['batt']]];
  const COMM = { ac1: 'CP PWM (SAE J1772)', ac3: 'CP PWM (SAE J1772)', dc: 'PLC / ISO 15118 · OCPP to cloud' };
  /* page widgets ------------------------------------------------------- */
  body.append(h('div', { class: 'nextprev', style: 'margin:0 0 8px;justify-content:flex-start' }, h('button', { class: 'btn', onclick: () => go('charger3d') }, 'Open the 3D exploded view of this charger →')));
  const top = h('div', { class: 'card' }); body.append(top);
  segmented(top, Object.keys(MODES).map(k => [k, MODES[k].name]), mode, k => { mode = k; sel = ST[sel] && ((CHAINS[k].flatMap(z => z[2])).includes(sel)) ? sel : 'pfc'; refresh(); });
  const slide = h('input', { type: 'range', min: 5, max: 100, value: 35, 'aria-label': 'state of charge' }), out = h('output'), pl = h('button', { class: 'btn', onclick: () => { if (playing) { clearInterval(playing); playing = null; pl.textContent = '▶ Charge'; } else { pl.textContent = '❚❚ Pause'; playing = setInterval(() => { slide.value = +slide.value + 1; if (+slide.value >= 100) { clearInterval(playing); playing = null; pl.textContent = '▶ Charge'; } slide.dispatchEvent(new Event('input')); }, 250); } } }, '▶ Charge');
  onLeave(() => { if (playing) clearInterval(playing); });
  top.append(h('div', { class: 'ctl', style: 'margin-top:10px' }, h('label', {}, 'Battery state of charge'), slide, out), h('div', { class: 'nextprev', style: 'margin-top:6px' }, pl, h('span', { class: 'cap' }, 'Press Charge to watch CC → CV unfold: power, phase shift and ripple all change.')));
  slide.addEventListener('input', () => { soc = +slide.value / 100; refresh(); });
  const chain = h('div', { class: 'chain' }), ro = h('div'); body.append(chain);
  const readout = h('div', { class: 'readout' }); body.append(readout);
  const detail = h('div', { class: 'lab' }); body.append(detail);
  const cp = lab(body, 'Where the energy goes: end-to-end efficiency chain', 'Each stage loses a few percent, which is why high-power chargers need liquid cooling.'); const eff = h('div', { class: 'heat' }); cp.add(eff);
  function resolve(v, s) { return typeof v === 'function' ? v(s) : v; }
  let sc = null, scCv, extraHost;
  function refresh() {
    const s = state(), M = s.M; out.textContent = (soc * 100).toFixed(0) + ' %';
    chain.innerHTML = ''; const list = CHAINS[mode]; let first = true;
    list.forEach(([title, cls, ids], zi) => { if (zi) chain.append(h('div', { class: 'arr', style: 'align-self:center' })); const z = h('div', { class: 'zone ' + (cls === 'ev' ? 'ev' : '') }, h('h4', {}, title));
      ids.forEach((id, i) => { if (i) z.append(h('div', { class: 'arr' + (s.P > 0 ? '' : ' off') })); const g = ST[id]; z.append(h('button', { class: 'blk', 'aria-pressed': id === sel, onclick: () => { sel = id; refresh(); }, title: 'click for details' }, h('b', {}, resolve(g.n, s)), h('small', {}, resolve(g.sub, s)), h('div', { class: 'pw' }, g.io(s)))); }); chain.append(z); });
    chain.append(h('div', { style: 'flex-basis:100%;font:600 .78rem var(--f-mono);color:var(--muted)' }, 'Communication: ' + COMM[mode] + ' · ' + (M.dc ? 'BMS ⇄ station controller (SECC)' : 'EVSE ⇄ vehicle via CP/PP')));
    readout.innerHTML = [['Battery', s.Vb.toFixed(0) + ' V · ' + s.I.toFixed(0) + ' A'], ['Charge phase', s.ph], ['Battery power', kW(s.P)], ['Grid power', kW(s.Pin)], ['Line current', s.Iline.toFixed(1) + ' A / phase'], ['Overall efficiency', (s.eta * 100).toFixed(1) + ' %']].map(i => `<div><small>${i[0]}</small><b>${i[1]}</b></div>`).join('');
    const g = ST[sel]; detail.innerHTML = ''; detail.append(h('header', {}, h('i'), 'Selected stage: ' + resolve(g.n, s)));
    const bd = h('div', { class: 'body' }); detail.append(bd); bd.append(h('div', { html: g.d(s) }));
    if (g.ctl) { const cc = h('div'); bd.append(cc); g.ctl(cc, refresh); }
    const sg = g.sig(s), cv = h('canvas', { class: 'scope' }); bd.append(cv); const S = new Scope(cv, Object.assign({ h: 230 }, sg.ax)); S.draw(sg.series, sg.extra);
    if (sel === 'batt') bd.append(h('div', { class: 'legend', html: '<span style="--c:var(--ch-v)">cell voltage</span><span style="--c:var(--ch-i)">current</span><span style="--c:var(--ch-d)">power</span>' }));
    const q = Qn(g.topic); bd.append(h('div', { class: 'nextprev', style: 'margin:0' }, h('button', { class: 'btn primary', onclick: () => go(g.topic) }, 'Open the topic page' + (q ? ` (${q} assignment Qs)` : ' →'))));
    const E = [['EVSE / input', s.e.evse], ['PFC / rectifier', s.e.pfc], ['Isolated DC-DC', s.e.dcdc], ['Output stage', s.e.out]]; let P = s.Pin; eff.innerHTML = E.map(([n, e]) => { const l = P * (1 - e); P *= e; return `<div class="heatrow"><span>${n}</span><div class="bar"><i style="width:${e * 100}%"></i></div><b style="min-width:7em">${(e * 100).toFixed(1)} % · ${kW(l)} lost</b></div>`; }).join('');
  }
  refresh();
  H(body, `<h2>How to read this</h2><ol class="steps"><li><div><b>AC charger:</b> the station is only a smart switch. All the conversion (PFC → DC link → isolated DC-DC) is in the vehicle's on-board charger, so power is small (3.7-22 kW).</div></li><li><div><b>DC charger:</b> the same chain is moved into the station, which allows 50-350 kW. The car only closes its contactor and its BMS says how much voltage/current it wants.</div></li><li><div><b>Both:</b> the BMS is the master; the charger follows its CC-CV request. Compare AC 1-φ vs 3-φ at the <b>DC link</b>: 100 Hz ripple disappears with 3 phases.</div></li></ol><p class="cap">Simplified, steady-state model for learning: efficiencies are typical values and the PSFB/DAB waveforms are idealised.</p>`);
} });
