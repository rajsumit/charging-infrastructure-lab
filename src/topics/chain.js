/* ===== Grid-to-battery waveform chain ===== */
page({ id: 'waveform-chain', mod: 'home', title: 'Grid → battery waveforms', kw: 'waveform chain stage by stage power flow ac to dc rectifier pfc dc link psfb dab transformer battery line cycle switching zoom', render(body) {
  H(body, `<div class="crumb"><span>Whole-system view</span><span class="pill hot">★ How AC becomes DC</span></div><h1>Grid → battery, one waveform per stage</h1>
  <p class="lede">The same instant, probed at every stage of the charger. Read top to bottom: the grid sine wave is rectified, shaped by the PFC, stored in the DC link, chopped at high frequency to cross the transformer, rectified again and smoothed into the battery. Drag the <b>line angle</b> (or press play) and watch every stage react.</p>`);
  const MODES = {
    ac1: { name: 'AC OBC, single-phase 7.4 kW', ph: 1, Vrms: 230, P: 7400, Vdc: 400, Cdc: 2e-3, Ns: 96, n: 1.15, dcdc: 'psfb', fpfc: 65e3, Lpfc: 400e-6, fdc: 100e3, Lo: 100e-6 },
    ac3: { name: 'AC OBC, three-phase 11 kW', ph: 3, Vrms: 400, P: 11000, Vdc: 700, Cdc: .4e-3, Ns: 96, n: .65, dcdc: 'psfb', fvsc: 20e3, Lg: 1.5e-3, fdc: 100e3, Lo: 100e-6 },
    dc: { name: 'DC charger, 150 kW (5 × 30 kW modules)', ph: 3, Vrms: 400, P: 150000, Vdc: 800, Cdc: 1e-3, Ns: 192, n: 1, dcdc: 'dab', fvsc: 20e3, Lg: .25e-3, fdc: 100e3, mods: 5 }
  };
  let mode = 'ac1', view = 'line', th = 60, soc = .4, play = null;
  const Voc = s => 3.0 + 1.0 * s + .2 * Math.pow(s, 6), w = T2 * 50;
  const sq = x => (((x % 1) + 1) % 1) < .5 ? 1 : -1, frac = x => ((x % 1) + 1) % 1;
  function base() {
    const M = MODES[mode], Vb = M.Ns * Voc(soc), Pb = soc < .8 ? M.P : M.P * Math.max(.05, Math.exp(-(soc - .8) / .07)), eta = .95, Pin = Pb / eta, Ib = Pb / Vb;
    const Vpk = M.ph === 1 ? M.Vrms * Math.SQRT2 : M.Vrms * Math.SQRT2 / Math.sqrt(3);
    const Ipk = M.ph === 1 ? Math.SQRT2 * Pin / M.Vrms : Math.SQRT2 * Pin / (Math.sqrt(3) * M.Vrms);
    const dV = M.ph === 1 ? Pb / (.95 / .97) / (T2 * 50 * M.Vdc * M.Cdc) : 0; // pk-pk 100 Hz ripple, 1-phase only
    return { M, Vb, Pb, Pin, Ib, Vpk, Ipk, dV };
  }
  const vdcAt = (B, ms) => B.M.Vdc - B.dV / 2 * Math.sin(2 * w * ms / 1e3);
  const phiAt = (B, vdc) => Math.max(0, Math.min(178, 180 * (1 - B.Vb / (B.M.n * vdc))));
  function dabDelta(B) { const M = B.M, P = B.Pb / M.mods, Vs = B.Vb / M.n, L = 14.8e-6, k = P * 2 * Math.PI * Math.PI * M.fdc * L / (M.Vdc * Vs); const d = (Math.PI - Math.sqrt(Math.max(0, Math.PI * Math.PI - 4 * k))) / 2; return { d, L, Vs, P }; }
  const LINE = { xmin: 0, xmax: 40, xl: 'time (ms) · 2 line cycles', xt: 8 };
  const tms = () => th / 360 * 20; // cursor time inside the first cycle
  const cursor = () => [{ x: tms(), c: '--hot', t: '' }, { x: tms() + 20, c: '--hot', t: '' }];
  const X = (n, a, b) => rng(n + 1, i => a + (b - a) * i / n);
  const kfmt = v => Math.abs(v) >= 1000 ? (v / 1000).toFixed(1) + ' k' : v.toFixed(Math.abs(v) < 10 ? 2 : 0) + ' ';
  /* ------------------------------ stage library ------------------------------ */
  const ST = {};
  ST.grid1 = { n: 'Grid (single-phase AC)', r: 'Sine voltage, sine current in phase: unity power factor.', topic: 'boost-pfc',
    read: (B, t) => [['v<sub>s</sub>', (B.Vpk * Math.sin(w * t / 1e3)).toFixed(0) + ' V'], ['i<sub>s</sub>', (B.Ipk * Math.sin(w * t / 1e3)).toFixed(1) + ' A'], ['p(t)', kfmt(2 * B.Pin * Math.sin(w * t / 1e3) ** 2) + 'W']],
    line: B => { const x = X(400, 0, 40); return { s: [{ x, y: x.map(t => B.Vpk * Math.sin(w * t / 1e3)), c: '--ch-v', w: 2.4 }, { x, y: x.map(t => B.Ipk * Math.sin(w * t / 1e3) * B.Vpk / B.Ipk * .7), c: '--ch-i', w: 2.4 }], ax: Object.assign({ ymin: -B.Vpk * 1.15, ymax: B.Vpk * 1.15, yl: 'V', yt: 4 }, LINE), lg: [['v<sub>s</sub> (V)', '--ch-v'], [`i<sub>s</sub> (scaled, ${B.Ipk.toFixed(0)} A pk)`, '--ch-i']] }; },
    zoom: (B, t0) => { const M = B.M, x = X(500, 0, 100), v = B.Vpk * Math.sin(w * t0 / 1e3), i = B.Ipk * Math.sin(w * t0 / 1e3); return { s: [{ x, y: x.map(() => v), c: '--ch-v', w: 2.4 }, { x, y: x.map(u => (i + .03 * B.Ipk * tri(u * 1e-6 * M.fpfc)) * B.Vpk / B.Ipk * .7), c: '--ch-i', w: 2 }], ax: { xmin: 0, xmax: 100, xl: 'µs', xt: 5, ymin: -B.Vpk * 1.15, ymax: B.Vpk * 1.15, yl: 'V', yt: 4 }, lg: [['v<sub>s</sub> (V)', '--ch-v'], ['i<sub>s</sub> (scaled)', '--ch-i']], note: 'Over 100 µs the grid looks like DC. The EMI filter leaves only a tiny trace of the switching ripple in the line current.' }; } };
  ST.bridge = { n: 'EMI filter + diode bridge', r: 'Folds the negative half-cycle up: |v<sub>s</sub>| and |i<sub>s</sub>|. Still not DC.', topic: 'rectifier', ch: 'AC → rectified (unidirectional, still pulsing at 100 Hz)',
    read: (B, t) => [['|v<sub>s</sub>|', Math.abs(B.Vpk * Math.sin(w * t / 1e3)).toFixed(0) + ' V'], ['|i<sub>s</sub>|', Math.abs(B.Ipk * Math.sin(w * t / 1e3)).toFixed(1) + ' A']],
    line: B => { const x = X(400, 0, 40); return { s: [{ x, y: x.map(t => Math.abs(B.Vpk * Math.sin(w * t / 1e3))), c: '--ch-v', w: 2.4 }, { x, y: x.map(t => Math.abs(Math.sin(w * t / 1e3)) * B.Vpk * .7), c: '--ch-i', w: 2.4 }], ax: Object.assign({ ymin: 0, ymax: B.Vpk * 1.15, yl: 'V', yt: 4 }, LINE), lg: [['|v<sub>s</sub>| (V)', '--ch-v'], ['|i<sub>s</sub>| (scaled)', '--ch-i']] }; } };
  ST.boost = { n: 'Boost PFC switch + inductor', r: 'Duty d = 1 − |v<sub>s</sub>|/V<sub>o</sub> changes every switching period so the inductor current follows |v<sub>s</sub>|.', topic: 'boost-pfc', ch: 'Current shaped to a rectified sine; voltage stepped up to the DC link',
    p: (B, t) => { const M = B.M, vs = Math.abs(B.Vpk * Math.sin(w * t / 1e3)), vo = vdcAt(B, t), d = Math.max(0, 1 - vs / vo), iL = Math.abs(B.Ipk * Math.sin(w * t / 1e3)), dI = vs * d / (M.Lpfc * M.fpfc); return { vs, vo, d, iL, dI }; },
    read: (B, t) => { const p = ST.boost.p(B, t); return [['d', p.d.toFixed(2)], ['i<sub>L</sub>', p.iL.toFixed(1) + ' A'], ['ripple Δi<sub>L</sub>', p.dI.toFixed(1) + ' A pp']]; },
    line: B => { const x = X(500, 0, 40), P = x.map(t => ST.boost.p(B, t)), k = 1 / (B.Ipk * 1.15); return { s: [{ x, y: P.map(p => p.d), c: '--ch-b', w: 2.4 }, { x, y: P.map(p => (p.iL + p.dI / 2) * k), c: '--ch-i', w: 1, fill: true, fillTo: 0 }, { x, y: P.map(p => Math.max(0, p.iL - p.dI / 2) * k), c: '--ch-i', w: 1 }, { x, y: P.map(p => p.iL * k), c: '--ch-i', w: 2.2 }], ax: Object.assign({ ymin: 0, ymax: 1.1, yl: 'duty / pu', yt: 4 }, LINE), lg: [['duty d(t)', '--ch-b'], ['i<sub>L</sub> with ripple band (pu)', '--ch-i']] }; },
    zoom: (B, t0) => { const M = B.M, p = ST.boost.p(B, t0), x = X(800, 0, 100), Tn = 1e6 / M.fpfc; return { s: [{ x, y: x.map(u => frac(u / Tn) < p.d ? 0 : p.vo), c: '--ch-v', w: 2, step: false }, { x, y: x.map(u => { const f = frac(u / Tn); const il = f < p.d ? p.iL - p.dI / 2 + p.dI * f / Math.max(p.d, 1e-3) : p.iL + p.dI / 2 - p.dI * (f - p.d) / (1 - p.d); return il / (B.Ipk * 1.15) * p.vo; }), c: '--ch-i', w: 2.2 }], ax: { xmin: 0, xmax: 100, xl: `µs · ${(M.fpfc / 1e3).toFixed(0)} kHz switching`, xt: 5, ymin: -20, ymax: B.M.Vdc * 1.15, yl: 'V', yt: 4 }, lg: [['switch-node voltage (V)', '--ch-v'], ['i<sub>L</sub> (scaled)', '--ch-i']], note: `Switch ON (node at 0 V): i<sub>L</sub> rises with slope |v<sub>s</sub>|/L. OFF (node at V<sub>o</sub>): falls with (|v<sub>s</sub>| − V<sub>o</sub>)/L. Near the zero crossing d → 1; at the crest d is smallest (${(1 - B.Vpk / B.M.Vdc).toFixed(2)}).` }; } };
  ST.grid3 = { n: 'Grid (three-phase AC)', r: 'Three sines 120° apart. Balanced currents in phase with their voltages.', topic: 'vsc3',
    read: (B, t) => [['v<sub>a</sub>', (B.Vpk * Math.sin(w * t / 1e3)).toFixed(0) + ' V'], ['i<sub>a</sub>', (B.Ipk * Math.sin(w * t / 1e3)).toFixed(1) + ' A'], ['p(t)', kfmt(B.Pin) + 'W (constant)']],
    line: B => { const x = X(400, 0, 40), s = []; [0, 1, 2].forEach(k => { s.push({ x, y: x.map(t => B.Vpk * Math.sin(w * t / 1e3 - k * T2 / 3)), c: '--ch-v', w: k ? 1 : 2.2, dash: k ? [4, 3] : null }); s.push({ x, y: x.map(t => .7 * B.Vpk * Math.sin(w * t / 1e3 - k * T2 / 3)), c: '--ch-i', w: k ? 1 : 2.2, dash: k ? [4, 3] : null }); }); return { s, ax: Object.assign({ ymin: -B.Vpk * 1.15, ymax: B.Vpk * 1.15, yl: 'V (phase)', yt: 4 }, LINE), lg: [['v<sub>a,b,c</sub>', '--ch-v'], [`i<sub>a,b,c</sub> (scaled, ${B.Ipk.toFixed(0)} A pk)`, '--ch-i']] }; } };
  ST.vsc = { n: 'Three-phase active rectifier (VSC)', r: 'Six switches with sine PWM. Each leg\'s duty follows its phase; the dq current loop holds i<sub>q</sub> = 0 for unity PF.', topic: 'vsc3', ch: 'Three AC currents → one DC current; constant power, so no 100 Hz in the DC link',
    m: B => B.Vpk / (B.M.Vdc / 2),
    read: (B, t) => { const m = ST.vsc.m(B), a = w * t / 1e3; return [['m', m.toFixed(2)], ['d<sub>a</sub>', (.5 + .5 * m * Math.sin(a)).toFixed(2)], ['d<sub>b</sub>', (.5 + .5 * m * Math.sin(a - T2 / 3)).toFixed(2)], ['d<sub>c</sub>', (.5 + .5 * m * Math.sin(a + T2 / 3)).toFixed(2)]]; },
    line: B => { const x = X(400, 0, 40), m = ST.vsc.m(B); return { s: [0, 1, 2].map(k => ({ x, y: x.map(t => .5 + .5 * m * Math.sin(w * t / 1e3 - k * T2 / 3)), c: ['--ch-v', '--ch-i', '--ch-d'][k], w: 2.2 })), ax: Object.assign({ ymin: 0, ymax: 1.05, yl: 'leg duty', yt: 4 }, LINE), lg: [['d<sub>a</sub>', '--ch-v'], ['d<sub>b</sub>', '--ch-i'], ['d<sub>c</sub>', '--ch-d']] }; },
    zoom: (B, t0) => { const M = B.M, m = ST.vsc.m(B), a = w * t0 / 1e3, x = X(1000, 0, 100), car = u => tri(u * 1e-6 * M.fvsc); const leg = k => u => (m * Math.sin(a - k * T2 / 3) > car(u) ? 1 : 0); return { s: [0, 1, 2].map(k => ({ x, y: x.map(u => (2 - k) * 1.3 + leg(k)(u)), c: ['--ch-v', '--ch-i', '--ch-d'][k], w: 2 })), ax: { xmin: 0, xmax: 100, xl: `µs · ${M.fvsc / 1e3} kHz carrier`, xt: 5, ymin: -.2, ymax: 3.8, yl: 'pole a / b / c', yt: 1, yfmt: () => '' }, lg: [['pole a (0 or V<sub>dc</sub>)', '--ch-v'], ['pole b', '--ch-i'], ['pole c', '--ch-d']], note: 'Each pole switches between 0 and V<sub>dc</sub>. The pulse widths encode the three phase angles of this instant; the grid inductors filter the PWM into sinusoidal currents.' }; } };
  ST.link = { n: 'DC link capacitor', r: 'Energy buffer between the line-frequency side and the HF side.', topic: 'pfc-stress', ch: 'Pulsating power in, constant power out: the capacitor absorbs the difference',
    read: (B, t) => [['v<sub>dc</sub>', vdcAt(B, t).toFixed(1) + ' V'], ['ripple', B.M.ph === 1 ? B.dV.toFixed(1) + ' V pp @ 100 Hz' : '≈ 0 at 100 Hz']],
    line: B => { const x = X(400, 0, 40), V = B.M.Vdc, r = Math.max(B.dV, 8); return { s: [{ x, y: x.map(t => vdcAt(B, t)), c: '--ch-v', w: 2.6 }], ax: Object.assign({ ymin: V - r * 1.2, ymax: V + r * 1.2, yl: 'V', yt: 4 }, LINE), ex: { h: [{ y: V, c: '--muted', t: '' }] }, lg: [['v<sub>dc</sub> (V), zoomed axis', '--ch-v']] }; },
    zoom: (B, t0) => { const x = X(400, 0, 100), v = vdcAt(B, t0); return { s: [{ x, y: x.map(u => v + .4 * tri(u * 1e-6 * 2 * B.M.fdc)), c: '--ch-v', w: 2.4 }], ax: { xmin: 0, xmax: 100, xl: 'µs', xt: 5, ymin: v - 6, ymax: v + 6, yl: 'V', yt: 4 }, note: 'Seen over 100 µs the DC link is flat apart from a fraction of a volt of switching ripple.' }; } };
  const psfbP = (B, t) => { const vdc = vdcAt(B, t), phi = phiAt(B, vdc), De = 1 - phi / 180; return { vdc, phi, De }; };
  ST.inv = { n: 'HF full bridge + transformer (PSFB)', r: 'Chops the DC link into a 100 kHz quasi-square wave. The phase shift φ between the legs sets the output; the transformer isolates and scales by n.', topic: 'psfb', ch: 'DC → high-frequency AC (100 kHz) so a small transformer can isolate',
    read: (B, t) => { const p = psfbP(B, t); return [['φ', p.phi.toFixed(0) + '°'], ['D<sub>eff</sub> = 1 − φ/180', p.De.toFixed(2)], ['n', B.M.n]]; },
    line: B => { const x = X(400, 0, 40), P = x.map(t => psfbP(B, t)); return { s: [{ x, y: P.map(p => p.vdc), c: '--ch-v', w: 1, fill: true, fillTo: 0 }, { x, y: P.map(p => -p.vdc), c: '--ch-v', w: 1, fill: true, fillTo: 0 }, { x, y: P.map(p => p.phi / 180 * B.M.Vdc), c: '--ch-b', w: 2.4 }], ax: Object.assign({ ymin: -B.M.Vdc * 1.15, ymax: B.M.Vdc * 1.15, yl: 'V', yt: 4 }, LINE), lg: [['v<sub>AB</sub> envelope ±v<sub>dc</sub> (100 kHz inside)', '--ch-v'], ['φ (scaled: V<sub>dc</sub> ≡ 180°)', '--ch-b']], note2: B.M.ph === 1 ? 'φ rises and falls at 100 Hz: the DC-DC loop cancels the DC-link ripple so the battery sees a steady voltage.' : '' }; },
    zoom: (B, t0) => { const M = B.M, p = psfbP(B, t0), x = X(1200, 0, 30), T = 1e6 / M.fdc, sh = (180 - p.phi) / 360, Io = B.Ib * M.n, loss = .03; const v = u => p.vdc * (sq(u / T) - sq(u / T - sh)) / 2; const ip = u => { const hp = 2 * frac(u / T), k = Math.floor(hp), f = hp - k, sgn = k ? -1 : 1; return f < loss ? sgn * Io * (-1 + 2 * f / loss) : sgn * Io; }; return { s: [{ x, y: x.map(v), c: '--ch-v', w: 2.2, fill: true }, { x, y: x.map(u => ip(u) / (Io * 1.2) * p.vdc * .8), c: '--ch-i', w: 2 }], ax: { xmin: 0, xmax: 30, xl: 'µs · 3 periods at 100 kHz', xt: 6, ymin: -M.Vdc * 1.15, ymax: M.Vdc * 1.15, yl: 'V', yt: 4 }, lg: [['v<sub>AB</sub> primary (V)', '--ch-v'], [`i<sub>p</sub> (scaled, ≈ ${Io.toFixed(0)} A)`, '--ch-i']], note: `Active for ${(p.De * 100).toFixed(0)} % of each half-period, zero (freewheeling) for the rest. The primary current reverses during the short duty-loss interval set by L<sub>lkg</sub>.` }; } };
  ST.rect = { n: 'Output rectifier + LC filter', r: 'Rectifies the transformer secondary into pulses at 200 kHz; L<sub>o</sub>C<sub>o</sub> averages them.', topic: 'psfb', ch: 'HF AC → DC pulses → smooth DC',
    read: (B, t) => { const p = psfbP(B, t); return [['pulse height n·v<sub>dc</sub>', (B.M.n * p.vdc).toFixed(0) + ' V'], ['average', (B.M.n * p.vdc * p.De).toFixed(0) + ' V']]; },
    line: B => { const x = X(400, 0, 40), P = x.map(t => psfbP(B, t)); return { s: [{ x, y: P.map(p => B.M.n * p.vdc), c: '--ch-x', w: 1, fill: true, fillTo: 0 }, { x, y: P.map(p => B.M.n * p.vdc * p.De), c: '--ch-d', w: 2.6 }], ax: Object.assign({ ymin: 0, ymax: B.M.n * B.M.Vdc * 1.2, yl: 'V', yt: 4 }, LINE), lg: [['rectified pulses (envelope)', '--ch-x'], ['filtered average = V<sub>bat</sub>', '--ch-d']] }; },
    zoom: (B, t0) => { const M = B.M, p = psfbP(B, t0), x = X(1200, 0, 30), T = 1e6 / M.fdc, h2 = T / 2, Vp = M.n * p.vdc, dI = B.Vb * (1 - p.De) / (M.Lo * 2 * M.fdc); const vr = u => frac(u / h2) < p.De ? Vp : 0; const iL = u => { const f = frac(u / h2); return f < p.De ? B.Ib - dI / 2 + dI * f / p.De : B.Ib + dI / 2 - dI * (f - p.De) / (1 - p.De); }; return { s: [{ x, y: x.map(vr), c: '--ch-x', w: 2, fill: true }, { x, y: x.map(u => iL(u) / (B.Ib * 1.3) * Vp * .9), c: '--ch-i', w: 2.2 }, { x, y: x.map(() => B.Vb), c: '--ch-d', w: 2, dash: [5, 3] }], ax: { xmin: 0, xmax: 30, xl: 'µs (pulses at 2 × 100 kHz)', xt: 6, ymin: 0, ymax: Vp * 1.15, yl: 'V', yt: 4 }, lg: [['rectified voltage', '--ch-x'], [`i<sub>Lo</sub> (scaled, ${B.Ib.toFixed(0)} A, ${dI.toFixed(1)} A pp)`, '--ch-i'], ['V<sub>bat</sub>', '--ch-d']], note: 'The filter inductor current ramps up while the pulse is present and down during the gap; its average is the battery current.' }; } };
  ST.dab = { n: 'DAB module (2 active bridges + transformer)', r: 'Both bridges switch square waves; the phase shift δ between them pushes power through the series inductance. Bidirectional (V2G).', topic: 'dab', ch: 'DC → HF AC → DC, isolated, with power set by δ',
    read: B => { const q = dabDelta(B); return [['δ', (q.d * 180 / Math.PI).toFixed(1) + '°'], ['per module', kfmt(q.P) + 'W'], ['V<sub>bat</sub>/n', q.Vs.toFixed(0) + ' V']]; },
    line: B => { const x = X(400, 0, 40), q = dabDelta(B); return { s: [{ x, y: x.map(() => B.M.Vdc), c: '--ch-v', w: 1, fill: true, fillTo: 0 }, { x, y: x.map(() => -B.M.Vdc), c: '--ch-v', w: 1, fill: true, fillTo: 0 }, { x, y: x.map(() => q.d * 180 / Math.PI / 90 * B.M.Vdc), c: '--ch-b', w: 2.4 }], ax: Object.assign({ ymin: -B.M.Vdc * 1.15, ymax: B.M.Vdc * 1.15, yl: 'V', yt: 4 }, LINE), lg: [['v<sub>p</sub> envelope (100 kHz inside)', '--ch-v'], ['δ (scaled: V<sub>dc</sub> ≡ 90°)', '--ch-b']], note2: 'Three-phase input gives constant power, so δ is constant over the line cycle.' }; },
    zoom: B => { const M = B.M, q = dabDelta(B), x = X(1200, 0, 30), T = 1e6 / M.fdc, dl = q.d / T2; const vp = u => M.Vdc * sq(u / T), vs = u => q.Vs * sq(u / T - dl); let acc = 0; const I = x.map((u, i) => { if (i) acc += (vp(u) - vs(u)) / q.L * (x[1] - x[0]) * 1e-6; return acc; }); const per = Math.round(T / (x[1] - x[0])), seg = I.slice(0, per), mn = seg.reduce((a, b) => a + b, 0) / seg.length, Ii = I.map(v => v - mn), pk = Math.max(...Ii.map(Math.abs)); return { s: [{ x, y: x.map(vp), c: '--ch-v', w: 2 }, { x, y: x.map(vs), c: '--ch-b', w: 2, dash: [5, 3] }, { x, y: Ii.map(v => v / pk * M.Vdc * .8), c: '--ch-i', w: 2.4 }], ax: { xmin: 0, xmax: 30, xl: 'µs · 3 periods at 100 kHz', xt: 6, ymin: -M.Vdc * 1.15, ymax: M.Vdc * 1.15, yl: 'V', yt: 4 }, lg: [['v<sub>p</sub> primary bridge', '--ch-v'], ['v<sub>s</sub>′ secondary (referred)', '--ch-b'], [`i<sub>L</sub> (scaled, ${pk.toFixed(0)} A pk)`, '--ch-i']], note: 'Power flows from the leading bridge to the lagging one. Flip the sign of δ and power flows back to the grid (V2G).' }; } };
  ST.dabout = { n: 'Secondary bridge + output filter', r: 'The secondary bridge rectifies (actively) the inductor current; the output capacitors and cable deliver smooth DC.', topic: 'dab', ch: 'HF current → DC current into the battery',
    read: B => [['I<sub>out</sub> total', B.Ib.toFixed(0) + ' A'], ['per module', (B.Ib / B.M.mods).toFixed(0) + ' A']],
    line: B => { const x = X(200, 0, 40); return { s: [{ x, y: x.map(() => B.Vb), c: '--ch-d', w: 2.6 }, { x, y: x.map(() => B.Ib / (B.Ib * 1.3) * B.Vb), c: '--ch-i', w: 2.2 }], ax: Object.assign({ ymin: 0, ymax: B.Vb * 1.25, yl: 'V', yt: 4 }, LINE), lg: [['V<sub>out</sub> (V)', '--ch-d'], [`I<sub>out</sub> (scaled, ${B.Ib.toFixed(0)} A)`, '--ch-i']] }; } };
  ST.batt = { n: 'Battery + BMS', r: 'Sees steady DC. The BMS asks for current (CC) or voltage (CV).', topic: 'ev-system', ch: 'Smooth DC: chemical energy storage',
    read: B => [['V<sub>bat</sub>', B.Vb.toFixed(0) + ' V'], ['I<sub>bat</sub>', B.Ib.toFixed(1) + ' A'], ['P', kfmt(B.Pb) + 'W'], ['phase', soc < .8 ? 'CC' : 'CV']],
    line: B => { const x = X(200, 0, 40); return { s: [{ x, y: x.map(() => B.Vb), c: '--ch-d', w: 2.6 }, { x, y: x.map(() => B.Ib / (B.Ib * 1.3) * B.Vb), c: '--ch-i', w: 2.2 }], ax: Object.assign({ ymin: 0, ymax: B.Vb * 1.25, yl: 'V', yt: 4 }, LINE), lg: [['V<sub>bat</sub> (V)', '--ch-d'], [`I<sub>bat</sub> (scaled, ${B.Ib.toFixed(1)} A)`, '--ch-i']] }; } };
  const CH = { ac1: ['grid1', 'bridge', 'boost', 'link', 'inv', 'rect', 'batt'], ac3: ['grid3', 'vsc', 'link', 'inv', 'rect', 'batt'], dc: ['grid3', 'vsc', 'link', 'dab', 'dabout', 'batt'] };
  const ISO = { ac1: 'inv', ac3: 'inv', dc: 'dab' };
  /* ------------------------------ controls ------------------------------ */
  const top = h('div', { class: 'card' }); body.append(top);
  segmented(top, Object.keys(MODES).map(k => [k, MODES[k].name]), mode, k => { mode = k; draw(); });
  const vrow = h('div', { style: 'margin-top:10px' }); top.append(vrow);
  segmented(vrow, [['line', 'Line-cycle view (40 ms)'], ['zoom', 'Switching zoom at the cursor (µs)']], view, k => { view = k; draw(); });
  const angI = h('input', { type: 'range', min: 0, max: 359, value: th, 'aria-label': 'line angle' }), angO = h('output');
  const socI = h('input', { type: 'range', min: 5, max: 99, value: soc * 100, 'aria-label': 'state of charge' }), socO = h('output');
  const pb = h('button', { class: 'btn primary', onclick: () => { if (play) stop(); else { pb.textContent = '❚❚ Pause'; play = setInterval(() => { th = (th + 4) % 360; angI.value = th; draw(true); }, 70); } } }, '▶ Play line cycle');
  const stop = () => { clearInterval(play); play = null; pb.textContent = '▶ Play line cycle'; };
  onLeave(() => play && clearInterval(play));
  top.append(h('div', { class: 'ctls' }, h('div', { class: 'ctl' }, h('label', {}, 'Line angle (cursor)'), angI, angO), h('div', { class: 'ctl' }, h('label', {}, 'Battery SOC'), socI, socO)), h('div', { class: 'nextprev', style: 'margin:6px 0 0;justify-content:flex-start' }, pb, h('button', { class: 'btn', onclick: () => go('simulator') }, 'Block-diagram simulator'), h('button', { class: 'btn', onclick: () => go('charger-states') }, 'States & faults →')));
  angI.addEventListener('input', () => { th = +angI.value; draw(true); }); socI.addEventListener('input', () => { soc = +socI.value / 100; draw(); });
  const host = h('div', { class: 'wchain' }); body.append(host);
  const pwr = lab(body, 'Power balance over the line cycle', 'Instantaneous power at the grid, into the battery, and the difference that the DC-link capacitor must store and return.');
  const pS = pwr.scope({ h: 200 }); pwr.legend([['p<sub>grid</sub>(t)', '--ch-v'], ['p<sub>battery</sub>', '--ch-d'], ['p<sub>capacitor</sub> = difference', '--ch-i']]); const pNote = pwr.add(h('p', { class: 'cap' }));
  let rows = [];
  function build() {
    host.innerHTML = ''; rows = [];
    const ids = CH[mode];
    ids.forEach((id, i) => {
      const g = ST[id];
      if (i) host.append(h('div', { class: 'wstep' }, h('span', { class: 'warr' }), h('span', { html: id === 'link' && mode !== 'ac1' ? 'Constant three-phase power in and out: the capacitor only absorbs switching ripple' : g.ch || '' }), id === ISO[mode] ? h('span', { class: 'pill hot' }, 'galvanic isolation') : null));
      const cv = h('canvas', { class: 'scope' }), ro = h('div', { class: 'wread' }), lg = h('div', { class: 'legend' }), nt = h('p', { class: 'cap' });
      const card = h('section', { class: 'wrow' }, h('div', { class: 'wside' }, h('div', { class: 'wnum' }, String(i + 1)), h('h3', {}, g.n), h('p', { class: 'cap', html: g.r }), ro, h('button', { class: 'btn', onclick: () => go(g.topic) }, 'Topic page →')), h('div', { class: 'wplot' }, cv, lg, nt));
      host.append(card);
      rows.push({ id, g, S: new Scope(cv, { h: 170 }), ro, lg, nt });
    });
  }
  let lastKey = '';
  function draw(fast) {
    const key = mode + view; if (key !== lastKey) { build(); lastKey = key; }
    const B = base(), t = tms();
    angO.textContent = th + '° · t = ' + t.toFixed(2) + ' ms'; socO.textContent = (soc * 100).toFixed(0) + ' %';
    rows.forEach(r => {
      r.ro.innerHTML = r.g.read(B, t).map(([k, v]) => `<div><small>${k}</small><b>${v}</b></div>`).join('');
      const z = view === 'zoom' && r.g.zoom;
      if (fast && !z && r.drawn) { r.S.draw(r.S.last.s, Object.assign({}, r.S.last.x, { v: cursor() })); return; }
      const d = z ? r.g.zoom(B, t) : r.g.line(B);
      r.S.set(Object.assign({ yfmt: null }, d.ax)); r.S.draw(d.s, Object.assign({}, d.ex || {}, z ? {} : { v: cursor() })); r.drawn = true;
      r.lg.innerHTML = (d.lg || []).map(i => `<span style="--c:var(${i[1]})">${i[0]}</span>`).join('');
      r.nt.innerHTML = view === 'zoom' && !r.g.zoom ? 'No switching inside this stage: the line-cycle view applies at any zoom.' : (z ? d.note || '' : d.note2 || '');
    });
    // power balance
    const x = X(400, 0, 40), M = B.M, pg = t2 => M.ph === 1 ? 2 * B.Pin * Math.sin(w * t2 / 1e3) ** 2 : B.Pin, pmax = (M.ph === 1 ? 2.2 : 1.3) * B.Pin;
    pS.set({ xmin: 0, xmax: 40, xt: 8, xl: 'time (ms)', ymin: M.ph === 1 ? -B.Pin * 1.2 : 0, ymax: pmax, yt: 4, yl: 'kW', yfmt: v => (v / 1000).toFixed(1) });
    pS.draw([{ x, y: x.map(pg), c: '--ch-v', w: 2.4 }, { x, y: x.map(() => B.Pb), c: '--ch-d', w: 2.4 }, { x, y: x.map(t2 => pg(t2) * .97 - B.Pb / (.95 / .97)), c: '--ch-i', w: 2, fill: true }], { v: cursor() });
    pNote.innerHTML = M.ph === 1 ? `Single-phase power is p(t) = 2P·sin²ωt: it swings between 0 and 2P at <b>100 Hz</b>. The capacitor takes the surplus near the crest and releases it near the zero crossing, giving <b>${B.dV.toFixed(1)} V pp</b> ripple on ${M.Vdc} V with ${(M.Cdc * 1e3).toFixed(1)} mF (ΔV<sub>pp</sub> = P/(2π f V<sub>o</sub> C)).` : 'Balanced three-phase power is constant, so the capacitor only handles switching ripple. This is why three-phase and DC chargers need far less DC-link capacitance per kW.';
  }
  draw();
  H(body, `<h2>What each conversion does, in one line</h2>${TBL(['From', 'To', 'Done by', 'Why'], [['AC (50 Hz, bidirectional)', 'rectified, unidirectional', 'diode bridge or active rectifier', 'the DC side needs one polarity'], ['distorted current', 'sinusoidal current, PF ≈ 1', 'PFC current loop (boost / totem-pole / VSC)', 'grid codes (IEC 61000-3-2/-12) and less loss'], ['pulsating power (1-φ)', 'steady DC link', 'DC-link capacitor', 'store the 100 Hz energy swing'], ['DC', '100 kHz AC', 'full bridge (PSFB) / DAB', 'small transformer at high frequency'], ['primary side', 'secondary side', 'HF transformer', 'galvanic isolation and voltage matching'], ['HF AC', 'smooth DC at battery voltage', 'rectifier + LC filter', 'the battery needs DC with low ripple']])}
  <p class="cap">Values are illustrative but realistic: 400 µH boost inductor at 65 kHz, 2 mF DC link, PSFB/DAB at 100 kHz, 96-cell (≈ 400 V) and 192-cell (≈ 800 V) packs. Losses are lumped (η ≈ 95 %). The zoom view freezes the line-frequency quantities at the cursor and shows a few switching periods.</p>`);
} });
