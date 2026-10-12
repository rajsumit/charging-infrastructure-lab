/* ===== Module 2: single-phase AC-DC with PFC ===== */
page({ id: 'rectifier', mod: 'm2', wk: 1, stars: 2, topic: true, title: 'Single-phase diode rectifier & capacitor filter', kw: 'half wave full wave bridge average vrrm ripple capacitor', lede: 'The simplest AC-DC converter, and the reason power-factor correction exists: a capacitor makes the grid current spiky.',
  render(body) {
    H(body, `<h2>Averages you must know</h2>${F('Half-wave:  Vavg = Vpk / π ,   Vrms = Vpk / 2', 'W1Q7')}${F('Full-wave:  Vavg = 2·Vpk / π ,   Vrms = Vpk / √2')}${F('Diode reverse voltage (VRRM) = Vpk  (half-wave with R load, and each diode of a bridge)', 'W1Q8')}
    <p>${HOT('Always use the peak from the figure', 'W1Q7')}: a 220 V rms source has Vpk = 311 V; if the diagram prints "310 sin ωt" use 310. Frequency (50 or 60 Hz) does not change the average.</p>`);
    const L = lab(body, 'Rectifier lab: half-wave, bridge, with and without a capacitor', 'Add a capacitor and watch the input current collapse into narrow pulses. Narrow pulses mean high peak current, high THD and poor power factor, so the next topics add PFC.');
    const s1 = L.scope({ xmin: 0, xmax: 60, ymin: -400, ymax: 400, yt: 4, xt: 6, xl: 'ms', yl: 'volts', h: 210 });
    L.legend([['source vs', '--ch-b'], ['output vo', '--ch-v']]);
    const s2 = L.scope({ xmin: 0, xmax: 60, ymin: -1, ymax: 1, yt: 2, xt: 6, xl: 'ms', yl: 'i (norm.)', h: 130 }); L.legend([['source current (normalised)', '--ch-i']]);
    const ro = L.readout(); let mode = 'full';
    segmented(L.body, [['half', 'Half-wave (1 diode)'], ['full', 'Full bridge (4 diodes)']], 'full', m => { mode = m; upd(); });
    const v = controls(L.body, [{ k: 'vpk', label: 'Peak voltage', min: 100, max: 400, step: 5, v: 325, unit: 'V', d: 0 }, { k: 'C', label: 'Filter capacitor', min: 0, max: 2000, step: 10, v: 470, unit: 'µF', d: 0 }, { k: 'R', label: 'Load resistance', min: 20, max: 400, step: 5, v: 100, unit: 'Ω', d: 0 }], upd);
    function upd() {
      const dt = 0.05, N = 60 / dt, X = [], vs = [], vo = [], ii = []; let vc = 0; const C = v.C * 1e-6, R = v.R; let sum = 0, mn = 1e9, mx = -1e9, cnt = 0, ipk = 1e-9;
      const raw = [];
      for (let k = 0; k <= N; k++) {
        const t = k * dt, s = v.vpk * Math.sin(T2 * 50 * t / 1000); const vin = mode === 'full' ? Math.abs(s) : Math.max(s, 0);
        let i = 0, out;
        if (C === 0) { out = vin; i = vin / R * Math.sign(s); }
        else if (vin > vc) { const nv = vin; i = (C * (nv - vc) / (dt * 1e-3) + nv / R) * (s >= 0 ? 1 : -1); vc = nv; out = vc; }
        else { vc -= vc / (R * C) * dt * 1e-3; out = vc; }
        X.push(t); vs.push(s); vo.push(out); raw.push(i); ipk = Math.max(ipk, Math.abs(i));
        if (t > 30) { sum += out; cnt++; mn = Math.min(mn, out); mx = Math.max(mx, out); }
      }
      s1.draw([{ x: X, y: vs, c: '--ch-b', w: 1.6, dash: [4, 3] }, { x: X, y: vo, c: '--ch-v', w: 2.4 }]);
      s2.draw([{ x: X, y: raw.map(a => a / ipk), c: '--ch-i', fill: true }]);
      const avg = sum / cnt;
      ro([['Vo average', avg.toFixed(0) + ' V'], ['Ripple (pk-pk)', (mx - mn).toFixed(1) + ' V'], ['Peak source current', ipk.toFixed(1) + ' A'], ['Theory (no C)', (mode === 'full' ? 2 * v.vpk / Math.PI : v.vpk / Math.PI).toFixed(0) + ' V']]);
    }
    upd();
    H(body, `<h2>Why the capacitor hurts the grid</h2><p>The bridge only conducts when |vs| &gt; vc, i.e. near the voltage peak. All the charge must be delivered in that short window, so current is a narrow, tall pulse. The line current is rich in 3rd, 5th, 7th harmonics. Result: ${HOT('power factor ≈ 0.5-0.7 even though the load is resistive')}.</p>
    <h3>Capacitor sizing (conduction-time method)</h3>${F('Iavg = P / Vavg ;   ΔV = Iavg · t_discharge / C   →   C = Iavg · t_dis / ΔV')}
    <p>The discharge time is almost the whole half-cycle (10 ms for a 50 Hz bridge) minus the short conduction angle.</p>`);
    calc(body, 'Calculator: filter capacitor for a bridge rectifier', [{ k: 'Vr', l: 'Mains rms', v: 230, u: 'V' }, { k: 'f', l: 'Line frequency', v: 50, u: 'Hz' }, { k: 'P', l: 'Power', v: 500, u: 'W' }, { k: 'rip', l: 'Allowed ripple', v: 5, u: '% of Vpk' }], (x) => { const r = C.capFilter(x.Vr, x.f, x.P, x.rip / 100); return [['Vpk', r.Vpk.toFixed(1) + ' V'], ['Vmin', r.Vmin.toFixed(1) + ' V'], ['Iavg', r.Iavg.toFixed(2) + ' A'], ['t discharge', (r.tdis * 1e3).toFixed(2) + ' ms'], ['C min', (r.Cmin * 1e6).toFixed(0) + ' µF']]; });
    H(body, MUST(`${HOT('Half-wave Vavg = Vpk/π; full-wave 2Vpk/π', 'W1Q7')}. Diode VRRM = Vpk.`, `Capacitor-input rectifier = narrow current pulses = low PF, high THD. That is the motivation for PFC.`, `A resistive load gives unity PF for a plain rectifier without C; the problem appears with C.`));
  } });

page({ id: 'boost-pfc', mod: 'm2', wk: 2, stars: 3, topic: true, title: 'Boost PFC: duty ratio, inductor & ripple', kw: 'boost pfc duty ratio inductor ripple ccm d(t)', lede: 'The most heavily examined topic of Week 2. If you understand one picture, make it d(t) = 1 − |vs|/Vo.',
  render(body) {
    H(body, `<h2>Idea in 30 seconds</h2><p>Put a boost converter after the diode bridge and control its <b>input current</b> to be a sine in phase with the voltage. The converter then looks like a resistor to the grid (PF ≈ 1), and the DC link is boosted above the grid peak (typically 380-450 V for 230 V mains).</p>
    <ol class="steps"><li><div>The bridge rectifies: input to the boost stage is |vs| = Vpk|sin ωt|.</div></li><li><div>Switch S1 on for <b>d·Ts</b>: inductor sees +|vs| and its current rises. Off for (1−d)Ts: inductor sees |vs|−Vo (negative) and current falls.</div></li><li><div>Volt-second balance gives ${HOT('d(t) = 1 − |vs(t)| / Vo', 'W2Q1')}. d is smallest at the voltage peak, 1 at the zero crossing.</div></li><li><div>A current loop varies d so that average iL follows |vs|: iL,avg = Ipk|sin ωt|, with ${F('Ipk = √2 · P / Vrms')}</div></li></ol>`);
    const L = lab(body, 'Line-cycle view: |vs| and duty ratio d(t)', 'The source voltage and duty ratio for one line cycle. Raise Vo: more headroom, lower d at the peak. Lower Vo below Vpk and the boost stage can no longer work (d would be negative).');
    const sA = L.scope({ xmin: 0, xmax: 20, ymin: 0, ymax: 500, yt: 5, xt: 4, xl: 'ms', yl: 'volts', h: 190 }); L.legend([['|vs|', '--ch-b'], ['Vo', '--ch-v']]);
    const sB = L.scope({ xmin: 0, xmax: 20, ymin: 0, ymax: 1, yt: 4, xt: 4, xl: "ms", yl: "duty d", h: 170 }); L.legend([['d(t) = 1 − |vs|/Vo', '--ch-i']]);
    const ro = L.readout();
    const v = controls(L.body, [{ k: 'Vr', label: 'Grid rms', min: 180, max: 265, step: 1, v: 230, unit: 'V', d: 0 }, { k: 'Vo', label: 'DC link Vo', min: 300, max: 500, step: 5, v: 400, unit: 'V', d: 0 }], u1);
    function u1() {
      const Vpk = v.Vr * Math.SQRT2; const f = t => Math.abs(Vpk * Math.sin(T2 * 50 * t / 1000));
      sA.draw([{ fn: f, c: '--ch-b', w: 2.4, fill: true }], { h: [{ y: v.Vo, c: '--ch-v', t: 'Vo' }] });
      sB.draw([{ fn: t => Math.max(0, 1 - f(t) / v.Vo), c: '--ch-i', w: 2.4, fill: true, fillTo: 0 }]);
      ro([['Vpk', Vpk.toFixed(0) + ' V'], ['d at peak (min)', Vpk < v.Vo ? (1 - Vpk / v.Vo).toFixed(3) : 'invalid'], ['d at zero cross', '1.00'], ['Vo > Vpk ?', Vpk < v.Vo ? 'yes ✔' : 'NO ✘']]);
    }
    u1();
    const L2 = lab(body, 'Inside one switching cycle: inductor current ripple', 'Pick where in the line cycle you are (θ). The inductor current is a triangle ripple around its line-frequency average. The ripple height changes along the cycle and is largest when |vs| = Vo/2.');
    const sI = L2.scope({ xmin: 0, xmax: 150, ymin: 0, ymax: 30, yt: 3, xt: 5, xl: 'µs', yl: 'iL (A)', h: 190 }); const sG = L2.scope({ xmin: 0, xmax: 150, ymin: -.2, ymax: 1.3, yt: 1, xt: 5, xl: 'µs', yl: 'gate', h: 90, yfmt: v => v === 0 || v === 1 ? v : '' });
    const sR = L2.scope({ xmin: 0, xmax: 325, ymin: 0, ymax: 1.1, yt: 4, xt: 5, xl: '|vs| (V)', yl: 'ripple / max', h: 150 }); L2.legend([['ripple ΔI ∝ |vs|(1−|vs|/Vo)', '--ch-d']]);
    const ro2 = L2.readout();
    const w = controls(L2.body, [{ k: 'th', label: 'Position in half-cycle θ', min: 5, max: 175, step: 1, v: 90, unit: '°', d: 0 }, { k: 'L', label: 'Inductance', min: 100, max: 1500, step: 10, v: 400, unit: 'µH', d: 0 }, { k: 'fs', label: 'Switching frequency', min: 20, max: 150, step: 5, v: 70, unit: 'kHz', d: 0 }], u2);
    function u2() {
      const Vpk = 325.3, Vo = 400, P = 3300, Ipk = Math.SQRT2 * P / 230, s = Math.sin(w.th * Math.PI / 180), vs = Vpk * s, d = 1 - vs / Vo, T = 1e3 / w.fs; // µs
      const Iav = Ipk * s, dI = vs * d / (w.L * 1e-6 * w.fs * 1e3); const X = [], Y = [], G = [], Gx = [];
      const p = (t, y) => { X.push(t); Y.push(y); };
      for (let k = 0; k < 3; k++) { const t0 = k * T; p(t0, Iav - dI / 2); p(t0 + d * T, Iav + dI / 2); p(t0 + T, Iav - dI / 2); Gx.push(t0, t0 + d * T, t0 + d * T, t0 + T); G.push(1, 1, 0, 0); }
      sI.set({ xmax: 3 * T, ymax: Math.max(10, Math.ceil((Iav + dI / 2) * 1.15 / 5) * 5) }); sG.set({ xmax: 3 * T });
      sI.draw([{ x: X, y: Y, c: '--ch-i', w: 2.4 }], { h: [{ y: Iav, c: '--ch-b', t: 'average = Ipk·sin θ' }] }); sG.draw([{ x: Gx, y: G, c: '--ch-x', step: false, w: 2 }]);
      sR.draw([{ fn: x => 4 * (x / Vo) * (1 - x / Vo), c: '--ch-d', w: 2.4, fill: true }], { v: [{ x: Vo / 2, c: '--hot', t: 'Vo/2 = 200 V' }, { x: vs, c: '--ch-i' }] });
      ro2([['|vs| now', vs.toFixed(0) + ' V'], ['duty d', d.toFixed(3)], ['avg iL', Iav.toFixed(1) + ' A'], ['ripple ΔI', dI.toFixed(2) + ' A'], ['max ripple Vo/(4L·fs)', (Vo / (4 * w.L * 1e-6 * w.fs * 1e3)).toFixed(2) + ' A']]);
    }
    u2();
    H(body, `<h2>Sizing the inductor</h2>${F('ΔI(t) = |vs|·d(t) / (L·fsw)  →  max at |vs| = Vo/2:   ΔImax = Vo / (4·L·fsw)', 'W2Q4')}${F('L = Vo / (4 · ΔImax · fsw)      with ΔImax = r · Ipk,   Ipk = √2 · P / Vrms', 'W2Q8')}`);
    calc(body, 'Calculator: boost PFC inductor (like W2Q8)', [{ k: 'P', l: 'Power', v: 3300, u: 'W' }, { k: 'Vr', l: 'Grid rms', v: 230, u: 'V' }, { k: 'Vo', l: 'Vo', v: 400, u: 'V' }, { k: 'r', l: 'Ripple of Ipk', v: 20, u: '%' }, { k: 'fs', l: 'fsw', v: 20, u: 'kHz' }], x => { const Ipk = C.boostIpk(x.P, x.Vr), dI = x.r / 100 * Ipk; return [['Ipk', Ipk.toFixed(2) + ' A'], ['ΔImax', dI.toFixed(2) + ' A'], ['L', (C.boostL(x.Vo, dI, x.fs * 1e3) * 1e3).toFixed(2) + ' mH'], ['dmin', (1 - x.Vr * Math.SQRT2 / x.Vo).toFixed(3)]]; }, 'Try the W2Q8 numbers: P = 1100, Vr = 230, Vo = 450, r = 10 %, fs = 60 kHz → about 2.77 mH (ripple = % of peak input current).');
    H(body, `<h2>Four-switch (full-bridge) version</h2><p>If the diode bridge is replaced by a full bridge of switches switched in pairs (S1+S4 for d, S2+S3 for 1−d) the signed source voltage obeys vs = (2d−1)Vo, so ${HOT('d = (1 + vs/Vo)/2 and S1/S4 conduct longer than S2/S3', 'W2Q2')}. At vs = 0, d = 0.5.</p>
    <h2>Typical trap questions</h2><ul><li>${HOT('d takes the same value 4 times per line cycle', 'W2Q3')} (2 per half-cycle, two half-cycles).</li><li>Minimum duty occurs at the <b>highest</b> peak: for a 265 V rms input and Vo = 500 V, dmin = 1 − 375/500 = ${HOT('0.25', 'W2Q10')}.</li><li>During the on-time the inductor sees +|vs|, not Vo.</li></ul>`);
    H(body, MUST(`${F('d(t) = 1 − |vs|/Vo')}`, `${F('L = Vo / (4·ΔImax·fsw)')}`, `${F('Ipk = √2·P/Vrms ;  dmin = 1 − Vpk/Vo')}`, `Ripple is maximum where |vs| = Vo/2, <b>not</b> at the peak.`, `Vo must be larger than the grid peak (boost converter).`));
  } });

page({ id: 'pfc-stress', mod: 'm2', wk: 3, stars: 3, topic: true, title: 'PFC stresses: RMS currents & 100 Hz ripple', kw: 'rms current switch stress capacitor ripple 100 hz double line frequency', lede: 'Two quick-fire question types: "RMS current of the switch" and "what is the dominant ripple frequency / ripple volts".',
  render(body) {
    H(body, `<h2>1 · RMS current of a switch</h2><p>If a switch carries a (nearly) constant current Io for a fraction D of the period and zero otherwise:</p>${F('Irms = Io · √D', 'W3Q2')}<p>${HOT('D is the switch\'s own conduction fraction', 'W3Q3')}. In a full bridge with S1/S4 on for 30 µs and S2/S3 for 20 µs (T = 50 µs): D(S1) = 0.6, Irms = 10 × √0.6 = 7.75 A. In a boost PFC, S1 conducts d(t) and S2 conducts (1−d(t)); the RMS² is the average over a half line cycle of (fraction) × iL².</p>`);
    calc(body, 'Calculator: RMS of a switch with constant current', [{ k: 'Io', l: 'Current', v: 20, u: 'A' }, { k: 'ton', l: 'On time', v: 30, u: 'µs' }, { k: 'T', l: 'Period', v: 100, u: 'µs' }], x => [['D', (x.ton / x.T).toFixed(3)], ['Irms', C.rmsBuckSwitch(x.Io, x.ton / x.T).toFixed(2) + ' A']]);
    H(body, `<h2>2 · Why PFC needs a big capacitor: power pulsates at 2×line</h2><p>With unity PF, v = V sin ωt, i = I sin ωt, so p = V·I·sin²ωt = <b>(VI/2)(1 − cos 2ωt)</b>. Input power swings between 0 and VI at <b>100 Hz</b> (for 50 Hz), but the load wants constant power. The DC-link capacitor absorbs the difference, so its voltage ripples at 100 Hz. ${HOT('This is true for ANY single-phase PFC, whatever fsw is (10 kHz, 70 kHz …)', 'W3Q4')}${HOT('', 'W4Q3')}.</p>${F('ΔVpp = P / (2π · fline · Vo · C)', 'W3Q5')}`);
    const L = lab(body, 'Single-phase power pulsation and DC-link ripple', 'Increase the capacitor and the 100 Hz ripple shrinks. Compare with the 3-phase case (flat power) in the later module.');
    const s1 = L.scope({ xmin: 0, xmax: 40, ymin: 0, ymax: 7000, yt: 4, xt: 4, xl: 'ms', yl: 'power W', h: 170 }); L.legend([['input power p(t)', '--ch-i'], ['load power', '--ch-d']]);
    const s2 = L.scope({ xmin: 0, xmax: 40, ymin: 380, ymax: 420, yt: 4, xt: 4, xl: 'ms', yl: 'vo (V)', h: 170 }); L.legend([['DC link voltage', '--ch-v']]); const ro = L.readout();
    const v = controls(L.body, [{ k: 'P', label: 'Power', min: 500, max: 7000, step: 100, v: 3300, unit: 'W', d: 0 }, { k: 'Cm', label: 'DC-link capacitance', min: .2, max: 6, step: .1, v: 2.2, unit: 'mF', d: 1 }, { k: 'Vo', label: 'Vo', min: 350, max: 450, step: 10, v: 400, unit: 'V', d: 0 }], u);
    function u() {
      const dpp = C.dblLineRipple(v.P, 50, v.Vo, v.Cm * 1e-3);
      s1.draw([{ fn: t => v.P * (1 - Math.cos(T2 * 100 * t / 1000)), c: '--ch-i', w: 2.4 }], { h: [{ y: v.P, c: '--ch-d', t: 'P (average)' }] });
      s2.set({ ymin: v.Vo - 25, ymax: v.Vo + 25 }); s2.draw([{ fn: t => v.Vo + dpp / 2 * Math.sin(T2 * 100 * t / 1000), c: '--ch-v', w: 2.4 }]);
      ro([['Pulsation frequency', '100 Hz'], ['Ripple Vpp', dpp.toFixed(2) + ' V'], ['Ripple % of Vo', (dpp / v.Vo * 100).toFixed(1) + ' %'], ['W3Q5 check', '≈ 11.9 V @3.3 kW, 2.2 mF']]);
    }
    u();
    H(body, `<p class="cap">Capacitor sizing trade: electrolytic caps are large and short-lived, and 100 Hz ripple pushes designers to bigger C, or to active ripple-cancelling circuits.</p>${MUST(`${HOT('Dominant output ripple of a single-phase PFC = 2 × line frequency (100/120 Hz)')}, independent of fsw.`, `${F('Irms = Io·√D')}${F('ΔVpp = P/(2π·f·Vo·C)')}`, `3-phase PFC has constant instantaneous power → no 100 Hz ripple → much smaller capacitor (dominant ripple at fsw).`)}`);
  } });

page({ id: 'pfc-control', mod: 'm2', wk: 3, stars: 3, topic: true, title: 'PFC control: dual loop & small-signal model', kw: 'average current control small signal state space transfer function bandwidth gv gi', lede: 'Concept-only: which variables are states/inputs, what the loops do, and how fast each should be.',
  render(body) {
    H(body, `<h2>Average current control (the standard PFC controller)</h2><div class="grid2">${CARD('Outer voltage loop (slow)', '<p>Measures Vo, compares with Vref, a PI regulator outputs the <b>amplitude</b> of the current reference. Bandwidth is kept <b>below 100 Hz</b> (typically 10-20 Hz) so it does not react to the 100 Hz ripple. If it were fast, it would distort the reference and raise THD.</p>')}${CARD('Inner current loop (fast)', '<p>Multiplies amplitude by the shape of |vs| to get iref = Iamp·|sin ωt|; a PI makes iL follow it by adjusting d. Bandwidth: well above 2×line but <b>≲ fsw/10</b> so it ignores switching ripple.</p>')}</div>
    <p>${HOT('Current-loop bandwidth: 500 Hz to 8 kHz for fsw = 80 kHz', 'W4Q7')}.</p>`);
    const L = lab(body, 'Where should the loop bandwidths sit?', 'Slide the switching frequency. Green zone = good range for the inner current loop. Voltage loop must stay far below.');
    const sc = L.scope({ xmin: 0, xmax: 5, ymin: 0, ymax: 1, yt: 1, xt: 5, xl: 'frequency', yl: '', h: 140, xfmt: x => { const f = Math.pow(10, x); return f >= 1e3 ? (f / 1e3).toFixed(0) + 'k' : f.toFixed(0); }, yfmt: () => '' }); const ro = L.readout();
    const v = controls(L.body, [{ k: 'fs', label: 'Switching frequency', min: 20, max: 150, step: 5, v: 80, unit: 'kHz', d: 0 }], u);
    function u() {
      const lo = Math.log10(500), hi = Math.log10(v.fs * 1e3 / 10), l2 = Math.log10(100);
      sc.draw([{ x: [lo, hi], y: [.6, .6], c: '--ch-d', w: 10 }, { x: [0, Math.log10(20)], y: [.6, .6], c: '--ch-v', w: 10 }], { v: [{ x: l2, c: '--bad', t: '2·fline = 100 Hz' }, { x: Math.log10(v.fs * 1e3), c: '--ch-i', t: 'fsw' }], t: [{ x: (lo + hi) / 2, y: .3, s: 'current loop', a: 'center', c: '--ch-d' }, { x: .2, y: .3, s: 'voltage loop', a: 'left', c: '--ch-v' }] });
      ro([['Current-loop range', '500 Hz to ' + (v.fs / 10).toFixed(1) + ' kHz'], ['Voltage loop', '< 20 Hz (below 100 Hz)']]);
    }
    u();
    H(body, `<h2>Small-signal modelling: the order of steps (W3Q1)</h2><ol class="steps"><li><div>Write the switching circuit equations (switch on / off).</div></li><li><div>Average over a switching period → <b>average large-signal model</b>.</div></li><li><div>Introduce perturbations: x = X + x̃ (this is the step where "perturbation is introduced").</div></li><li><div>Neglect products of two small terms → <b>linearise</b>.</div></li><li><div>Laplace transform → transfer functions Gi(s), Gv(s).</div></li></ol>
    <p>${HOT('Validity (W3Q8)')}: switching frequency ≫ line frequency (so averaging is fair) and perturbations ≪ operating point (so linearisation is fair).</p>
    <h2>State-space of the boost PFC</h2>${F('ẋ = A·x + B·u ,   y = C·x')}<div class="grid2">${CARD('Variables', `<p>States x = [iL , vc]ᵀ (energy-storage elements: inductor and capacitor) ${HOT('', 'W3Q9')}</p><p>Inputs u = [d , vs]ᵀ ${HOT('', 'W3Q10')}</p>`)}${CARD('Matrix sizes (2 states, 1 output)', `<p>${HOT('A = 2×2, B = 2×1, C = 1×2', 'W3Q7')} (as the course treats the input vector)</p>`)}</div>
    <h2>Plant transfer functions (concept)</h2>${F('Gi(s) = ĩL(s)/d̃(s)  :  duty → inductor current (inner loop plant)')}${F('Gv(s) = ṽo(s)/ĩL(s) = [Vs,pk·R /(2Vo)] / (1 + s·R·C)', 'W4Q8')}<p>${HOT('Gv is a single-pole low-pass with the load pole at 1/(RC)')}; DC gain Vs,pk·R/(2Vo) comes from power balance Vs,pk·Ipk/2 = Vo·Io.</p>`);
    const L3 = lab(body, 'Gv(s) magnitude: the voltage-loop plant', 'The pole 1/(2πRC) is very low (a few Hz) because C is large. That is why the voltage loop is slow.');
    const sg = L3.scope({ xmin: 0, xmax: 3, ymin: -40, ymax: 40, yt: 4, xt: 3, xl: 'Hz', yl: 'dB', h: 190, xfmt: x => Math.pow(10, x).toFixed(0) }); const ro3 = L3.readout();
    const w = controls(L3.body, [{ k: 'P', label: 'Power', min: 500, max: 7000, step: 100, v: 3300, unit: 'W', d: 0 }, { k: 'Cm', label: 'DC-link C', min: .2, max: 6, step: .1, v: 2.2, unit: 'mF', d: 1 }], u3);
    function u3() { const Vo = 400, R = Vo * Vo / w.P, Vpk = 325, C0 = w.Cm * 1e-3, g = Vpk * R / (2 * Vo); sg.draw([{ fn: x => { const f = Math.pow(10, x), wr = T2 * f * R * C0; return 20 * Math.log10(g / Math.sqrt(1 + wr * wr)); }, c: '--ch-v', w: 2.4 }], { v: [{ x: Math.log10(1 / (T2 * R * C0)), c: '--hot', t: 'pole' }] }); ro3([['R = Vo²/P', R.toFixed(1) + ' Ω'], ['DC gain', g.toFixed(1) + ' Ω (' + (20 * Math.log10(g)).toFixed(1) + ' dB)'], ['Pole', (1 / (T2 * R * C0)).toFixed(2) + ' Hz']]); }
    u3();
    H(body, MUST(`States = <b>iL, vc</b>; inputs = <b>d, vs</b>.`, `Order: perturb → neglect product of small terms → Laplace.`, `Voltage loop slow (&lt;100 Hz), current loop fast (500 Hz … fsw/10). ${HOT('Rule: high gain at 2·fline, BW ≲ fsw/10')}.`, `Gv = (Vs,pk/2Vo)·R/(1+sRC).`));
  } });

page({ id: 'bridgeless', mod: 'm2', wk: 4, stars: 3, topic: true, title: 'Bridgeless & totem-pole PFC', kw: 'totem pole bridgeless pfc polarity devices conduct', lede: 'Remove the diode bridge: fewer devices in the current path, higher efficiency. The key skill is knowing which device does what in each half-cycle.',
  render(body) {
    H(body, `<p>A conventional boost PFC has <b>3 devices</b> in the current path (2 bridge diodes + switch or boost diode). A bridgeless/totem-pole PFC has only <b>2</b> ${HOT('', 'W4Q6')}, so conduction loss drops. Totem-pole: one <b>HF leg</b> (S1, S2 at fsw, GaN/SiC) and one <b>line leg</b> (S3, S4 at 50 Hz, or slow diodes).</p>`);
    const L = lab(body, 'Totem-pole PFC: current path', 'Pick the line polarity and whether the boost switch is ON (inductor charging) or OFF (energy to load). Bright switches conduct.');
    const host = h('div'); let half = 'pos', st = 'chg';
    const P = { pos_chg: 'M40 60 V20 H250 V115 H330 V190 H130 V115 H40', pos_del: 'M40 60 V20 H250 V115 H330 V40 H520 V190 H130 V115 H40', neg_chg: 'M40 115 H130 V40 H330 V115 H250 V20 H40 V60', neg_del: 'M40 115 H130 V40 H520 V190 H330 V115 H250 V20 H40 V60' };
    const ON = { pos_chg: ['S2', 'S4'], pos_del: ['S1', 'S4'], neg_chg: ['S1', 'S3'], neg_del: ['S2', 'S3'] };
    const draw = () => {
      const key = half + '_' + st, on = ON[key];
      const sw = (n, x, y) => `<rect x="${x - 15}" y="${y - 22}" width="30" height="44" rx="6" style="fill:${on.includes(n) ? 'color-mix(in srgb,var(--ch-i) 45%,var(--surface))' : 'var(--surface2)'};stroke:var(--ink);stroke-width:${on.includes(n) ? 2.5 : 1}"/><text class="tx" x="${x}" y="${y + 4}" text-anchor="middle" style="font-weight:700">${n}</text>`;
      host.innerHTML = `<svg class="svgfig" viewBox="0 0 600 235" role="img" aria-label="totem pole PFC"><g class="ln" style="stroke-width:1.6"><path d="M40 60 V20 H250 V115 H330 M130 115 H40 M130 40 H520 M130 190 H520 M130 40 V190 M330 40 V190 M520 40 V190"/></g>
      <path d="${P[key]}" fill="none" style="stroke:var(--ch-i);stroke-width:4.5;stroke-linejoin:round;opacity:.9"/>
      <circle cx="40" cy="88" r="20" fill="var(--surface)" stroke="var(--ink)" stroke-width="2"/><text x="40" y="92" text-anchor="middle" class="tx">~</text>
      <rect x="250" y="106" width="60" height="18" rx="4" style="fill:var(--surface);stroke:var(--ink);stroke-width:2"/><text class="tx2" x="280" y="148" text-anchor="middle">L</text>
      ${sw('S3', 130, 77)}${sw('S4', 130, 152)}${sw('S1', 330, 77)}${sw('S2', 330, 152)}
      <rect x="500" y="100" width="40" height="30" rx="4" style="fill:var(--surface2);stroke:var(--ink)"/><text class="tx2" x="520" y="120" text-anchor="middle">load</text>
      <text class="tx2" x="130" y="14" text-anchor="middle">line leg (50 Hz)</text><text class="tx2" x="330" y="14" text-anchor="middle">HF leg (fsw)</text>
      <text class="tx2" x="40" y="136" text-anchor="middle">source</text></svg>`;
      $('#tpi', L.body).innerHTML = half === 'pos' ? `<b>Positive half</b>: S4 stays ON (line frequency). <b>S2 is the boost switch</b>: ON → inductor charges through S2+S4; OFF → current goes through S1 (acts as the diode) to the load. S2 conducts <b>d(t)</b>, S1 conducts (1−d).` : `<b>Negative half</b>: S3 stays ON. <b>S1 is the boost switch</b> now, and S2 is the freewheeling (rectifying) switch. S2 now conducts <b>(1−d)</b>.`;
    };
    L.body.append(h('div', { id: 'tpi', class: 'cap' }));
    segmented(L.body, [['pos', 'vs > 0'], ['neg', 'vs < 0']], 'pos', k => { half = k; draw(); });
    segmented(L.body, [['chg', 'Boost switch ON'], ['del', 'Boost switch OFF']], 'chg', k => { st = k; draw(); });
    L.add(host); draw();
    H(body, `<h2>What the assignment asked</h2><ul><li>${HOT('S2 RMS: in one half it is the boost switch (d), in the other the rectifying switch (1−d)', 'W4Q1')}, so the RMS integral has d in one half-cycle and (1−d) in the other.</li><li>${HOT('Duty at the negative peak = 1 − Vpk/Vo = 0.187', 'W4Q2')} (230 V, Vo = 400 V): same law as boost PFC.</li><li>${HOT('Output ripple is still 100 Hz', 'W4Q3')}, even at 70 kHz switching.</li><li>${HOT('No diode bridge; L and C sizing the same as boost PFC', 'W4Q4')}.</li><li>Two-diode bridgeless (D1/D2 on top, S1/S2 at bottom): ${HOT('each switch is modulated in only one half-cycle', 'W4Q5')}; D1 conducts for vs&gt;0, D2 for vs&lt;0 ${HOT('', 'W4Q10')}.</li></ul>
    ${TBL(['', 'Conventional boost PFC', 'Totem-pole'], [['Devices in path', '3 (2 diodes + 1)', '2'], ['Hard-switching devices', '1 switch + boost diode', '2 fast switches (GaN/SiC, ZVS-friendly in CrM)'], ['Needs ZCD / current sensing for polarity', 'No', 'Yes: line-polarity detection (ZCD) to steer S3/S4'], ['DC-link ripple', '100 Hz', '100 Hz']])}
    ${MUST(`Totem-pole = 2 devices conduct (vs 3).`, `Roles of S1/S2 <b>swap each half-cycle</b>; line leg flips at the zero crossing (ZCD).`, `Same formulas: d = 1 − |vs|/Vo, L = Vo/(4ΔIfsw), ΔVpp = P/(2πfVoC).`, `Dual-loop average current control: current loop BW 500 Hz … fsw/10.`)}`);
  } });

page({ id: 'dcm-flyback', mod: 'm2', wk: 4, stars: 2, topic: true, title: 'DCM operation & flyback PFC', kw: 'dcm discontinuous flyback pfc isolated voltage follower', lede: 'Let the inductor current fall to zero every cycle and the converter becomes its own current shaper, which is cheap but peaky.',
  render(body) {
    H(body, `<p>In ${HOT('DCM (discontinuous conduction mode)')} the inductor current returns to zero before the next switching period. With <b>constant duty</b>, the peak current is ipk = |vs|·d·Ts/L, i.e. <b>proportional to the instantaneous input voltage</b>, so the average input current also follows |vs|. The converter is a <b>voltage follower</b>: ${HOT('only a single voltage loop is needed, no current loop', 'W4Q9')}.</p>`);
    const L = lab(body, 'CCM vs DCM inductor current (boost, fixed duty)', 'Reduce L until the current touches zero: that is the CCM/DCM boundary. Notice how DCM raises the peak for the same average.');
    const sc = L.scope({ xmin: 0, xmax: 60, ymin: 0, ymax: 30, yt: 3, xt: 6, xl: 'µs', yl: 'iL (A)', h: 220 }); const ro = L.readout();
    const v = controls(L.body, [{ k: 'vs', label: 'Input |vs|', min: 20, max: 325, step: 5, v: 150, unit: 'V', d: 0 }, { k: 'd', label: 'Duty d', min: .1, max: .8, step: .01, v: .4, d: 2 }, { k: 'L', label: 'Inductance', min: 20, max: 800, step: 10, v: 200, unit: 'µH', d: 0 }], u);
    function u() {
      const Vo = 400, fs = 50e3, T = 1e6 / fs; let i = 0; const X = [], Y = []; let sum = 0, n = 0, pk = 0, dcm = false;
      for (let k = 0; k < 3.01 * 1e3; k++) { const t = k * T / 1e3; const ph = (t % T) / T; let di; if (ph < v.d) di = v.vs / (v.L * 1e-6); else di = (v.vs - Vo) / (v.L * 1e-6); i += di * (T / 1e3) * 1e-6; if (i < 0) { i = 0; if (ph >= v.d) dcm = true; } X.push(t); Y.push(i); if (t > T) { sum += i; n++; pk = Math.max(pk, i); } if (t >= 60) break; }
      sc.set({ xmax: 3 * T, ymax: Math.max(10, Math.ceil(pk * 1.2 / 5) * 5) }); sc.draw([{ x: X, y: Y, c: '--ch-i', w: 2.4, fill: true }]);
      const ccmD = 1 - v.vs / Vo; ro([['Mode', dcm ? 'DCM' : 'CCM'], ['Average iL', (sum / n).toFixed(2) + ' A'], ['Peak iL', pk.toFixed(1) + ' A'], ['CCM would need d', ccmD.toFixed(2)]]);
    }
    u();
    H(body, `${TBL(['', 'CCM', 'DCM'], [['Control', 'Current loop + voltage loop', 'Single voltage loop is enough'], ['Peak / RMS current', 'Low', 'Higher (≈ 2× average peak)'], ['THD / PF', 'Best', 'Slightly worse'], ['Power range', 'High power (kW)', 'Low power (&lt; ~300 W)'], ['Diode reverse recovery', 'Serious (hard turn-off)', 'None (current zero at turn-off)']])}
    <h2>Flyback PFC (single-stage isolated PFC)</h2><p>A flyback converter after the bridge does PFC and isolation in one stage: when S1 is on, the primary magnetises; when off, the energy goes to the secondary. With turns ratio n and duty d at the input peak:</p>${F('Vo = (Vs,pk / n) · d / (1 − d)', 'W5Q7')}`);
    calc(body, 'Calculator: flyback PFC output voltage', [{ k: 'V', l: 'Grid rms', v: 230, u: 'V' }, { k: 'd', l: 'Duty at peak', v: .12, u: '' }, { k: 'n', l: 'n', v: .6, u: '' }], x => [['Vs,pk', (x.V * Math.SQRT2).toFixed(1) + ' V'], ['Vo', C.flybackPFC_Vo(x.V * Math.SQRT2, x.d, x.n).toFixed(1) + ' V']], 'W5Q7: 230 V, d = 0.12, n = 0.6 → ≈ 73.9 V.');
    H(body, `<p class="cap">Heads-up: for W5Q9 (240 V, Vo = 400 V, n = 2) the answer key is 0.64-0.67 while this formula gives 0.70, so the course defines n or the peak differently there. For the exam, remember the key value for that exact question; the method (volt-second balance at the input peak) is what matters.</p>
    <p>${HOT('Isolated-stage PFC question (W5Q6): d is 1 at |vs|=0 and falls as |vs| rises', 'W5Q6')} - write the inductor volt-seconds for each interval and equate to zero.</p>
    ${MUST(`DCM: iL,pk ∝ |vs| (voltage follower), single loop, higher peak/RMS, higher THD.`, `Flyback PFC: Vo = (Vpk/n)·d/(1−d).`, `Use DCM at low power, CCM at high power.`)}`);
  } });
