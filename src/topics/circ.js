/* ===== Current-path animations for converter topics ===== */
const CIRC = (() => {
  // build an svg body from parts/wires/dots; `on` = set of conducting ids (switches drawn closed)
  const build = (parts, wires, dots, extra = '') => (on) => wires.map(SCH.wire).join('') + '<!--FLOW-->' + parts.map(p => SCH.part(Object.assign({}, p, { on: on.has(p.id), closed: p.k === 'S' && on.has(p.id) }))).join('') + dots.map(SCH.dot).join('') + extra;
  const A = '--ch-i', B = '--ch-d', V = '--ch-v';
  /* 1. bridge rectifier with capacitor ---------------------------------------------------------- */
  const rect = (() => {
    const parts = [{ k: 'AC', a: [70, 190], b: [70, 120], l: 'v_s', side: -1 }, { k: 'D', id: 'D1', a: [230, 120], b: [230, 50], l: 'D1', side: -1 }, { k: 'D', id: 'D2', a: [230, 260], b: [230, 212], l: 'D2', side: -1 }, { k: 'D', id: 'D3', a: [350, 190], b: [350, 50], l: 'D3' }, { k: 'D', id: 'D4', a: [350, 260], b: [350, 190], l: 'D4' }, { k: 'C', id: 'C', a: [460, 260], b: [460, 50], l: 'C' }, { k: 'R', a: [560, 260], b: [560, 50], l: 'load' }];
    const wires = [[[70, 120], [230, 120]], [[70, 190], [350, 190]], [[230, 212], [230, 120]], [[230, 50], [560, 50]], [[230, 260], [560, 260]]];
    const dots = [[230, 120], [350, 190], [460, 50], [460, 260]];
    // simulate one cycle to get conduction spans
    const N = 2000, RC = .045, Vm = 325, X = [], VS = [], VC = [], IS = []; let vc = Vm * .8, spans = { p: [], n: [], h: [] }, cur = null, prev = null;
    for (let i = 0; i <= N * 2; i++) { const t = i / N * .02, vs = Vm * Math.sin(2 * Math.PI * 50 * t), a = Math.abs(vs); let cond = false; if (a >= vc) { const dv = a - vc; vc = a; cond = dv >= 0 && i > 0; } else vc -= vc / RC * (.02 / N); if (i >= N) { const tt = (t - .02) * 1000; X.push(tt); VS.push(vs); VC.push(vc); const ii = cond ? Math.sign(vs) * (1 + 60 * Math.cos(2 * Math.PI * 50 * t) * Math.sign(vs) * .02) : 0; IS.push(cond ? Math.sign(vs) : 0); const k = cond ? (vs > 0 ? 'p' : 'n') : 'h'; if (k !== prev) { if (cur) cur[1] = tt; cur = [tt, tt]; spans[k].push(cur); prev = k; } } }
    if (cur) cur[1] = 20;
    const raw = X.map((t, i) => IS[i] ? IS[i] * (RC * 2 * Math.PI * 50 * Math.cos(2 * Math.PI * 50 * t / 1000) * Math.sign(VS[i]) + Math.abs(Math.sin(2 * Math.PI * 50 * t / 1000))) : 0), mx = Math.max(...raw.map(Math.abs)), isPulse = raw.map(v => v / mx * 340);
    return { title: 'Current path: bridge rectifier + capacitor', cap: 'Diodes only conduct while |v<sub>s</sub>| is above the capacitor voltage, so the line current comes in short pulses near the peaks. That is the poor power factor the PFC stage fixes.', w: 620, h: 290,
      draw: build(parts, wires, dots, SCH.text([140, 280], 'diode bridge', 'tx s')),
      iv: [
        { n: 'v_s > 0: D1 + D4', on: ['D1', 'D4'], loops: [[[[70, 120], [230, 120], [230, 50], [560, 50], [560, 260], [350, 260], [350, 190], [70, 190], [70, 120]], A], [[[460, 50], [460, 260]], B]], span: spans.p, txt: 'Near the positive peak |v<sub>s</sub>| exceeds v<sub>C</sub>: D1 and D4 conduct, feeding the load <b>and</b> recharging C. The current is a narrow, tall pulse.' },
        { n: 'Hold: C feeds the load', on: [], loops: [[[[460, 260], [460, 50], [560, 50], [560, 260], [460, 260]], B]], span: spans.h, txt: 'All four diodes are reverse-biased (v<sub>C</sub> &gt; |v<sub>s</sub>|). The grid supplies nothing; the capacitor discharges into the load, causing the ripple.' },
        { n: 'v_s < 0: D3 + D2', on: ['D3', 'D2'], loops: [[[[70, 190], [350, 190], [350, 50], [560, 50], [560, 260], [230, 260], [230, 120], [70, 120], [70, 190]], A], [[[460, 50], [460, 260]], B]], span: spans.n, txt: 'Negative half: D3 and D2 conduct. The load current still flows top to bottom, which is what "rectified" means. Each diode blocks the peak voltage V<sub>s,pk</sub> when off (W1Q8, W2Q5).' }],
      wave: () => ({ ax: { xmin: 0, xmax: 20, ymin: -380, ymax: 380, xt: 4, yt: 4, xl: 'ms (one 50 Hz cycle)', yl: 'V' }, s: [{ x: X, y: VS, c: V, w: 2 }, { x: X, y: VC, c: B, w: 2.4 }, { x: X, y: isPulse, c: A, w: 2.2 }], lg: [['v<sub>s</sub>', V], ['v<sub>C</sub>', B], ['i<sub>s</sub> (pulses, scaled)', A]] }) };
  })();
  /* 2. boost PFC ---------------------------------------------------------- */
  const boost = (() => {
    const parts = [{ k: 'AC', a: [60, 190], b: [60, 120], l: 'v_s', side: -1 }, { k: 'D', id: 'D1', a: [200, 120], b: [200, 50], l: 'D1', side: -1 }, { k: 'D', id: 'D2', a: [200, 260], b: [200, 212], l: 'D2', side: -1 }, { k: 'D', id: 'D3', a: [300, 190], b: [300, 50], l: 'D3' }, { k: 'D', id: 'D4', a: [300, 260], b: [300, 190], l: 'D4' }, { k: 'L', id: 'L', a: [330, 50], b: [420, 50], l: 'L' }, { k: 'S', id: 'S', a: [450, 50], b: [450, 260], l: 'S' }, { k: 'D', id: 'Do', a: [470, 50], b: [540, 50], l: 'D' }, { k: 'C', a: [600, 260], b: [600, 50], l: 'C' }, { k: 'R', a: [700, 260], b: [700, 50], l: 'load' }];
    const wires = [[[60, 120], [200, 120]], [[60, 190], [300, 190]], [[200, 212], [200, 120]], [[200, 50], [330, 50]], [[420, 50], [470, 50]], [[540, 50], [700, 50]], [[200, 260], [700, 260]]];
    const dots = [[200, 120], [300, 190], [450, 50], [450, 260], [600, 50], [600, 260]];
    const pos = [[60, 120], [200, 120], [200, 50], [450, 50]], neg = [[60, 190], [300, 190], [300, 50], [450, 50]];
    const capFeed = [[[600, 50], [700, 50], [700, 260], [600, 260], [600, 50]], B], capChg = [[[600, 50], [600, 260]], B];
    const d = .4, T = 15, X = rng(601, i => i * 30 / 600), on = t => (t % T) / T < d;
    const iL = t => { const f = (t % T) / T; return f < d ? .6 + .4 * f / d : 1 - .4 * (f - d) / (1 - d); };
    return { title: 'Current path: boost PFC, both half-cycles', cap: 'Same switch, same inductor in both half-cycles; the diode bridge decides which diodes carry the current. Step through the four cases.', w: 740, h: 290,
      draw: build(parts, wires, dots),
      iv: [
        { n: 'v_s > 0, S on', on: ['D1', 'D4', 'S', 'L'], loops: [[pos.concat([[450, 260], [300, 260], [300, 190], [60, 190], [60, 120]]), A], capFeed], span: [[0, 6], [15, 21]], txt: 'S closes: v<sub>L</sub> = |v<sub>s</sub>| (W2Q1), so i<sub>L</sub> <b>rises</b>. The output diode is reverse-biased; C alone feeds the load.' },
        { n: 'v_s > 0, S off', on: ['D1', 'D4', 'L', 'Do'], loops: [[pos.concat([[540, 50], [700, 50], [700, 260], [300, 260], [300, 190], [60, 190], [60, 120]]), A], capChg], span: [[6, 15], [21, 30]], txt: 'S opens: the inductor forces its current through D into C and the load. v<sub>L</sub> = |v<sub>s</sub>| − V<sub>o</sub> &lt; 0, so i<sub>L</sub> <b>falls</b>. Volt-second balance gives d = 1 − |v<sub>s</sub>|/V<sub>o</sub>.' },
        { n: 'v_s < 0, S on', on: ['D3', 'D2', 'S', 'L'], loops: [[neg.concat([[450, 260], [200, 260], [200, 120], [60, 120], [60, 190]]), A], capFeed], span: [[0, 6], [15, 21]], txt: 'Negative half: D3 and D2 now steer the current, but L, S and D see exactly the same thing as in the positive half. Three semiconductors conduct in every interval, which is why bridgeless and totem-pole PFCs were invented.' },
        { n: 'v_s < 0, S off', on: ['D3', 'D2', 'L', 'Do'], loops: [[neg.concat([[540, 50], [700, 50], [700, 260], [200, 260], [200, 120], [60, 120], [60, 190]]), A], capChg], span: [[6, 15], [21, 30]], txt: 'Energy stored in L during the on-time is delivered to the output. Over a line cycle the controller varies d so that the <i>average</i> of i<sub>L</sub> follows |v<sub>s</sub>|.' }],
      dwell: 2200,
      wave: () => ({ ax: { xmin: 0, xmax: 30, ymin: 0, ymax: 1.25, xt: 6, yt: 4, xl: 'µs (two switching periods, d = 0.4)', yl: 'pu' }, s: [{ x: X, y: X.map(t => on(t) ? .05 : 1.15), c: V, w: 2 }, { x: X, y: X.map(iL), c: A, w: 2.6 }], lg: [['switch voltage v<sub>S</sub> (0 or V<sub>o</sub>)', V], ['i<sub>L</sub>', A]] }) };
  })();
  /* 3. forward converter with reset winding ---------------------------------------------------------- */
  const fwd = (() => {
    const parts = [{ k: 'V', a: [60, 250], b: [60, 60], l: 'V_in', side: -1 }, { k: 'L', id: 'Nd', a: [150, 250], b: [150, 160], l: 'N_d', side: -1 }, { k: 'D', id: 'D3', a: [150, 160], b: [150, 60], l: 'D3', side: -1 }, { k: 'L', id: 'Np', a: [230, 60], b: [230, 160], l: 'N_p', side: -1 }, { k: 'S', id: 'S', a: [230, 160], b: [230, 250], l: 'S', side: -1 }, { k: 'L', id: 'Ns', a: [295, 160], b: [295, 60], l: 'N_s' }, { k: 'D', id: 'D1', a: [320, 60], b: [385, 60], l: 'D1' }, { k: 'D', id: 'D2', a: [410, 200], b: [410, 60], l: 'D2' }, { k: 'L', id: 'Lo', a: [430, 60], b: [510, 60], l: 'L_o' }, { k: 'C', a: [570, 200], b: [570, 60], l: 'C_o' }, { k: 'R', a: [660, 200], b: [660, 60], l: 'R' }];
    const wires = [[[60, 60], [230, 60]], [[60, 250], [230, 250]], [[295, 60], [320, 60]], [[385, 60], [430, 60]], [[510, 60], [660, 60]], [[295, 160], [295, 200], [660, 200]]];
    const dots = [[150, 60], [150, 250], [410, 60], [410, 200], [570, 60], [570, 200]];
    const extra = SCH.core(262, 62, 158) + SCH.pdot([238, 70]) + SCH.pdot([287, 70]) + SCH.pdot([158, 240]) + SCH.text([150, 285], 'N_d on the same core', 'tx s') + SCH.text([262, 50], 'transformer', 'tx s');
    const fwl = [[[410, 200], [410, 60], [430, 60], [660, 60], [660, 200], [410, 200]], B];
    const X = rng(501, i => i / 10), vs = t => t < 20 ? 0 : t < 40 ? 2 : 1, im = t => t < 20 ? t / 20 : t < 40 ? 1 - (t - 20) / 20 : 0;
    return { title: 'Current path: forward converter (reset winding N_d = N_p)', cap: 'Three intervals per period. The reset interval is why D<sub>max</sub> = 0.5 for N<sub>d</sub> = N<sub>p</sub> and why the switch sees 2V<sub>in</sub>.', w: 700, h: 300,
      draw: build(parts, wires, dots, extra),
      iv: [
        { n: 'S on: power transfer', on: ['S', 'Np', 'Ns', 'D1', 'Lo'], loops: [[[[60, 60], [230, 60], [230, 250], [60, 250], [60, 60]], A], [[[295, 160], [295, 60], [430, 60], [660, 60], [660, 200], [295, 200], [295, 160]], V]], span: [0, 20], txt: 'V<sub>in</sub> across N<sub>p</sub>; the secondary (same dot polarity) drives current through D1 and L<sub>o</sub> to the load: V<sub>o</sub> = (N<sub>s</sub>/N<sub>p</sub>)·D·V<sub>in</sub>. Magnetising current ramps up: flux goes 0 → B<sub>max</sub> (W6Q1).' },
        { n: 'S off: core reset', on: ['Nd', 'D3', 'D2', 'Lo'], loops: [[[[150, 250], [150, 60], [60, 60], [60, 250], [150, 250]], A], fwl], span: [20, 40], txt: 'The magnetising energy must go somewhere: N<sub>d</sub> drives it back into V<sub>in</sub> through D3. The switch now blocks V<sub>in</sub>(1 + N<sub>p</sub>/N<sub>d</sub>) = 2V<sub>in</sub>. Meanwhile L<sub>o</sub> freewheels through D2.' },
        { n: 'Reset done: idle', on: ['D2', 'Lo'], loops: [fwl], span: [40, 50], txt: 'Flux is back to zero; no winding carries current. Switch voltage falls to V<sub>in</sub>. Only the output inductor keeps freewheeling. If the next turn-on came before this, the core would walk into saturation.' }],
      wave: () => ({ ax: { xmin: 0, xmax: 50, ymin: -.1, ymax: 2.3, xt: 5, yt: 4, xl: 'µs (one period, D = 0.4)', yl: 'pu' }, s: [{ x: X, y: X.map(vs), c: V, w: 2.4 }, { x: X, y: X.map(im), c: A, w: 2.4 }], lg: [['v<sub>S</sub> / V<sub>in</sub>', V], ['magnetising current (pu)', A]] }) };
  })();
  /* 4. phase-shifted full bridge ---------------------------------------------------------- */
  const psfb = (() => {
    const parts = [{ k: 'V', a: [50, 260], b: [50, 40], l: 'V_in', side: 1 }, { k: 'S', id: 'S1', a: [150, 40], b: [150, 120], l: 'S1', side: -1 }, { k: 'S', id: 'S2', a: [150, 120], b: [150, 260], l: 'S2', side: -1 }, { k: 'S', id: 'S3', a: [280, 135], b: [280, 190], l: 'S3', side: -1 }, { k: 'S', id: 'S4', a: [280, 190], b: [280, 260], l: 'S4', side: -1 }, { k: 'L', id: 'Lr', a: [300, 120], b: [360, 120], l: 'L_r' }, { k: 'L', id: 'Np', a: [400, 120], b: [400, 190], l: '', side: -1 }, { k: 'L', id: 'Ns', a: [440, 190], b: [440, 120], l: '' }, { k: 'D', id: 'R1', a: [520, 120], b: [520, 50], l: 'Dr1', side: -1 }, { k: 'D', id: 'R2', a: [520, 280], b: [520, 228], l: 'Dr2', side: -1 }, { k: 'D', id: 'R3', a: [600, 190], b: [600, 50], l: 'Dr3' }, { k: 'D', id: 'R4', a: [600, 280], b: [600, 190], l: 'Dr4' }, { k: 'L', id: 'Lo', a: [630, 50], b: [690, 50], l: 'L_o' }, { k: 'C', a: [720, 280], b: [720, 50], l: 'C_o' }, { k: 'R', a: [780, 280], b: [780, 50], l: 'R' }];
    const wires = [[[50, 40], [280, 40]], [[280, 40], [280, 135]], [[520, 228], [520, 120]], [[50, 260], [280, 260]], [[150, 120], [300, 120]], [[360, 120], [400, 120]], [[280, 190], [400, 190]], [[440, 120], [520, 120]], [[440, 190], [600, 190]], [[520, 50], [630, 50]], [[690, 50], [780, 50]], [[520, 280], [780, 280]]];
    const dots = [[150, 40], [150, 120], [150, 260], [280, 40], [280, 190], [280, 260], [520, 120], [600, 190], [520, 50], [600, 50], [520, 280], [600, 280], [720, 50], [720, 280]];
    const extra = SCH.core(420, 116, 194) + SCH.pdot([408, 128]) + SCH.pdot([432, 128]) + SCH.text([150, 300], 'leg A (lagging)', 'tx s') + SCH.text([280, 300], 'leg B (leading)', 'tx s') + SCH.text([420, 220], 'n = 1', 'tx s');
    const fw = [[[[520, 280], [520, 50], [780, 50], [780, 280], [520, 280]], V], [[[600, 280], [600, 50]], V]];
    const X = rng(401, i => i * 10 / 400), vab = t => t < 3.33 ? 1 : t < 5 ? 0 : t < 8.33 ? -1 : 0, ip = t => { const r = .35; if (t < r) return -1 + 2 * t / r; if (t < 5) return 1 - .06 * (t - r); if (t < 5 + r) return .72 - 1.72 * (t - 5) / r; return -1 + .06 * (t - 5 - r) * 0 - .0; };
    return { title: 'Current path: phase-shifted full bridge, four intervals', cap: 'φ = 60° here, so each active interval lasts (1 − 60/180) = 2/3 of a half-period. Watch which leg changes state at each boundary.', w: 800, h: 310,
      draw: build(parts, wires, dots, extra),
      iv: [
        { n: 'Active +: S1 + S4', on: ['S1', 'S4', 'Lr', 'Np', 'Ns', 'R1', 'R4', 'Lo'], loops: [[[[50, 40], [150, 40], [150, 120], [400, 120], [400, 190], [280, 190], [280, 260], [50, 260], [50, 40]], A], [[[440, 190], [440, 120], [520, 120], [520, 50], [780, 50], [780, 280], [600, 280], [600, 190], [440, 190]], V]], span: [0, 3.33], txt: 'Diagonal pair on: v<sub>AB</sub> = +V<sub>in</sub>. Power flows to the secondary through Dr1 and Dr4. This interval sets V<sub>o</sub> = nV<sub>in</sub>(1 − φ/180°).' },
        { n: 'Freewheel: S1 + S3', on: ['S1', 'S3', 'Lr', 'Np', 'R1', 'R2', 'R3', 'R4', 'Lo'], loops: [[[[150, 120], [400, 120], [400, 190], [280, 190], [280, 40], [150, 40], [150, 120]], A]].concat(fw), span: [3.33, 5], txt: '<b>Leg B (leading)</b> switched: S4 off, S3 on. The primary current, held up by the reflected output inductor, charges/discharges the leg-B capacitances: easy ZVS. Now v<sub>AB</sub> = 0, current circulates through S1 and S3; all four rectifier diodes share L<sub>o</sub> freewheeling.' },
        { n: 'Active −: S2 + S3', on: ['S2', 'S3', 'Lr', 'Np', 'Ns', 'R3', 'R2', 'Lo'], loops: [[[[50, 40], [280, 40], [280, 190], [400, 190], [400, 120], [150, 120], [150, 260], [50, 260], [50, 40]], A], [[[440, 120], [440, 190], [600, 190], [600, 50], [780, 50], [780, 280], [520, 280], [520, 120], [440, 120]], V]], span: [5, 8.33], txt: '<b>Leg A (lagging)</b> switched: S1 off, S2 on. Only L<sub>r</sub> (leakage) energy is available for ZVS because the secondary is shorted by the freewheeling diodes, so this leg loses ZVS first at light load (W8Q1, W8Q2, W8Q7). The current must reverse through L<sub>r</sub>: duty loss.' },
        { n: 'Freewheel: S2 + S4', on: ['S2', 'S4', 'Lr', 'Np', 'R1', 'R2', 'R3', 'R4', 'Lo'], loops: [[[[400, 190], [400, 120], [150, 120], [150, 260], [280, 260], [280, 190], [400, 190]], A]].concat(fw), span: [8.33, 10], txt: 'Leg B switches again (S3 off, S4 on): v<sub>AB</sub> = 0 with current circulating through the bottom switches. Next, leg A turns S2 off and S1 on and the cycle restarts.' }],
      dwell: 2600,
      wave: () => ({ ax: { xmin: 0, xmax: 10, ymin: -1.3, ymax: 1.3, xt: 5, yt: 4, xl: 'µs (one period at 100 kHz, φ = 60°)', yl: 'pu' }, s: [{ x: X, y: X.map(vab), c: V, w: 2.4 }, { x: X, y: X.map(t => { const r = .35; if (t < r) return -.85 + 1.85 * t / r; if (t < 5) return 1 - .3 * (t - r) / 4.65; if (t < 5 + r) return .7 - 1.7 * (t - 5) / r; return -1 + .3 * (t - 5 - r) / 4.65; }), c: A, w: 2.4 }], lg: [['v<sub>AB</sub> / V<sub>in</sub>', V], ['primary current (pu)', A]] }) };
  })();
  /* 5. flyback ---------------------------------------------------------- */
  const fly = (() => {
    const parts = [{ k: 'V', a: [60, 240], b: [60, 50], l: 'v_in', side: -1 }, { k: 'L', id: 'Np', a: [200, 50], b: [200, 150], l: 'N_p', side: -1 }, { k: 'S', id: 'S', a: [200, 150], b: [200, 240], l: 'S', side: -1 }, { k: 'L', id: 'Ns', a: [265, 150], b: [265, 50], l: 'N_s' }, { k: 'D', id: 'D', a: [300, 50], b: [380, 50], l: 'D' }, { k: 'C', a: [470, 240], b: [470, 50], l: 'C_o' }, { k: 'R', a: [560, 240], b: [560, 50], l: 'R' }];
    const wires = [[[60, 50], [200, 50]], [[60, 240], [200, 240]], [[265, 50], [300, 50]], [[380, 50], [560, 50]], [[265, 150], [265, 240], [560, 240]]];
    const dots = [[470, 50], [470, 240]];
    const extra = SCH.core(232, 52, 148) + SCH.pdot([208, 60]) + SCH.pdot([257, 140]) + SCH.text([232, 40], 'coupled inductor', 'tx s');
    const feed = [[[470, 50], [560, 50], [560, 240], [470, 240], [470, 50]], B];
    const X = rng(401, i => i / 20), ipf = t => t < 8 ? t / 8 : 0, isf = t => t >= 8 && t < 15 ? .8 * (1 - (t - 8) / 7) : 0;
    return { title: 'Current path: flyback (DCM)', cap: 'A flyback stores energy in the core when S is on and releases it when S is off. In DCM there is a third interval where both windings are idle. That is what makes the DCM flyback PFC need no current loop (W4Q9).', w: 620, h: 280,
      draw: build(parts, wires, dots, extra),
      iv: [
        { n: 'S on: store energy', on: ['S', 'Np'], loops: [[[[60, 50], [200, 50], [200, 240], [60, 240], [60, 50]], A], feed], span: [0, 8], txt: 'Primary current ramps up from zero; the dots are opposite, so the secondary voltage reverse-biases D. Energy ½L<sub>m</sub>i<sub>pk</sub>² goes into the core gap; C<sub>o</sub> alone feeds the load.' },
        { n: 'S off: release energy', on: ['Ns', 'D'], loops: [[[[265, 240], [265, 150], [265, 50], [560, 50], [560, 240], [265, 240]], V], [[[470, 50], [470, 240]], B]], span: [8, 15], txt: 'S opens; the flux cannot change instantly, so the current transfers to the secondary and flows through D into C<sub>o</sub> and the load, ramping down to zero. The switch sees V<sub>in</sub> + V<sub>o</sub>/n.' },
        { n: 'DCM: both idle', on: [], loops: [feed], span: [15, 20], txt: 'Core empty, both windings carry zero current until the next turn-on. Because each period starts from zero, the peak primary current is set by v<sub>in</sub>·d·T<sub>s</sub>/L, i.e. it follows the input voltage automatically.' }],
      wave: () => ({ ax: { xmin: 0, xmax: 20, ymin: -.05, ymax: 1.15, xt: 4, yt: 4, xl: 'µs (one period)', yl: 'pu' }, s: [{ x: X, y: X.map(ipf), c: A, w: 2.4 }, { x: X, y: X.map(isf), c: V, w: 2.4 }], lg: [['primary current', A], ['secondary current (scaled)', V]] }) };
  })();
  return { rect, boost, fwd, psfb, fly };
})();
embed('rectifier', box => circuitAnimator(box, CIRC.rect));
embed('boost-pfc', box => circuitAnimator(box, CIRC.boost));
embed('forward', box => circuitAnimator(box, CIRC.fwd));
embed('psfb', box => circuitAnimator(box, CIRC.psfb));
embed('dcm-flyback', box => circuitAnimator(box, CIRC.fly));
