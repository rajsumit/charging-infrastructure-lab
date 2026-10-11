/* ===== Module 3: three-phase AC-DC & PWM ===== */
page({ id: 'pwm', mod: 'm3', wk: 5, stars: 2, topic: true, title: 'Sinusoidal PWM (SPWM) of a half-bridge', kw: 'spwm pwm modulation index carrier harmonics pole voltage', lede: 'How a DC-link and two switches synthesise a sine: compare a sine (modulating) with a triangle (carrier).',
  render(body) {
    H(body, `<p>A half-bridge (one <b>pole</b>) has S1 on top and S2 below, with output "A" between them. The pole voltage v<sub>AO</sub> (O = fictitious DC-link midpoint) is either +Vdc/2 or −Vdc/2. Rule: ${HOT('S1 ON when modulating signal > carrier')}. The <b>average</b> of the pole voltage over one carrier cycle follows the modulating signal; that is the whole idea of PWM.</p>${F('Modulation index  m = Vm / Vc  (peak of modulating ÷ peak of carrier)')}${F('Fundamental peak = m · Vdc/2      RMS = m·Vdc / (2√2)', 'W5Q4')}`);
    const L = lab(body, 'SPWM generator and spectrum', 'Raise m for a larger fundamental. Raise mf (carrier ÷ fundamental) and the harmonics move far away from the fundamental, so a smaller filter is enough.');
    const s1 = L.scope({ xmin: 0, xmax: 20, ymin: -1.2, ymax: 1.2, yt: 4, xt: 4, xl: 'ms', yl: 'carrier/ref', h: 170 }); L.legend([['carrier', '--ch-b'], ['modulating wave', '--ch-i']]);
    const s2 = L.scope({ xmin: 0, xmax: 20, ymin: -1.3, ymax: 1.3, yt: 2, xt: 4, xl: 'ms', yl: 'vAO / (Vdc/2)', h: 130 }); L.legend([['pole voltage ±Vdc/2', '--ch-v']]);
    const s3 = L.scope({ xmin: 0, xmax: 60, ymin: 0, ymax: 1.1, yt: 4, xt: 6, xl: 'harmonic order (× 50 Hz)', yl: 'amplitude', h: 150 }); const ro = L.readout();
    const v = controls(L.body, [{ k: 'm', label: 'Modulation index m', min: 0.1, max: 1, step: .05, v: .8, d: 2 }, { k: 'mf', label: 'Frequency ratio mf', min: 9, max: 39, step: 2, v: 21, d: 0 }], u);
    function u() {
      const N = 4000, X = [], c = [], r = [], o = []; const Vdc2 = 1;
      for (let k = 0; k <= N; k++) { const t = k / N; X.push(t * 20); const ca = tri(t * v.mf - .25), rf = v.m * Math.sin(T2 * t); c.push(ca); r.push(rf); o.push(rf > ca ? 1 : -1); }
      s1.draw([{ x: X, y: c, c: '--ch-b', w: 1.2 }, { x: X, y: r, c: '--ch-i', w: 2.4 }]); s2.draw([{ x: X, y: o, c: '--ch-v', w: 1.5 }]);
      // DFT
      const H_ = 60, amp = []; for (let n = 1; n <= H_; n++) { let a = 0, b = 0; for (let k = 0; k < N; k++) { const th = T2 * n * k / N; a += o[k] * Math.cos(th); b += o[k] * Math.sin(th); } amp.push(2 * Math.hypot(a, b) / N); }
      s3.draw(amp.map((a, i) => ({ x: [i + 1, i + 1], y: [0, a], c: i === 0 ? '--ch-i' : '--ch-v', w: 3 })), { v: [{ x: v.mf, c: '--hot', t: 'mf' }, { x: 2 * v.mf, c: '--hot', t: '2mf' }] });
      ro([['Fundamental (measured)', amp[0].toFixed(2) + ' × Vdc/2'], ['Theory m', v.m.toFixed(2)], ['Carrier group at', 'h = ' + v.mf + ', ' + 2 * v.mf], ['1st side-bands', 'mf ± 2, ±4 (i=1, j even)']]);
    }
    u();
    H(body, `<h2>DC modulating signal = DC output</h2><p>If the modulating wave is held constant, the average pole voltage is constant: <b>V<sub>avg</sub> = D·Vdc</b> with D = Vm/Vc for a carrier from 0 to Vc. ${HOT('Vm = 4 V, carrier 0-5 V, Vdc = 200 V → D = 0.8 → 160 V', 'W5Q8')}. (For a bipolar ±Vc carrier, D = (1 + Vm/Vc)/2.)</p>`);
    calc(body, 'Calculator: average pole voltage (0 … Vc carrier)', [{ k: 'vm', l: 'Modulating level', v: 4, u: 'V' }, { k: 'vc', l: 'Carrier peak', v: 5, u: 'V' }, { k: 'vdc', l: 'Vdc', v: 200, u: 'V' }], x => [['Duty', (x.vm / x.vc).toFixed(2)], ['Vavg', (x.vm / x.vc * x.vdc).toFixed(1) + ' V']]);
    H(body, `<h2>Harmonics</h2><p>Harmonics appear as <b>sidebands around the carrier and its multiples</b>: h = i·mf ± j (in units of the fundamental). The lecture's rule: <i>i odd → j even; i even → j odd</i>. Harmonic content falls roughly as 1/order. Raising the carrier frequency pushes harmonics up so the filter can be smaller.</p><p class="cap">W5Q5 (10 kHz carrier, 50 Hz fundamental): official key is A, B, C = 10050, 10150, 20100 Hz. This is opposite to the lecture rule above (which would give 10100). Remember the key for that exact question only; see the explanation under it.</p>
    ${MUST(`${HOT('Fundamental peak = m·Vdc/2; RMS = m·Vdc/(2√2)', 'W5Q4')}`, `Average pole voltage is proportional to the modulating signal (W5Q8).`, `m ≤ 1 = linear range; maximum line-line RMS in SPWM = 0.612·m·Vdc.`, `Modulating frequency must be ≪ carrier (mf large).`)}`);
  } });

page({ id: 'vsc3', mod: 'm3', wk: 5, stars: 3, topic: true, title: '3-phase AC-DC converter (VSC): phasors & inductor', kw: 'three phase active rectifier voltage source converter phasor inductance power flow unity pf', lede: 'The grid-side inductor is the "bridge" between two voltage sources. Power flows from the leading phasor to the lagging one.',
  render(body) {
    H(body, `<p>A 3-phase AC-DC converter is six switches (three half-bridge poles) on a DC link, connected to the grid through an inductor L per phase. Per phase: grid voltage <b>Vs</b> — L — converter voltage <b>Vc</b> = pole voltage of the converter. The phasor equation is ${F('Vs − Vc = jωL · I')}</p>
    <ul><li>${HOT('AC → DC (rectifier): the converter voltage must LAG the source voltage', 'W5Q1')}; DC → AC (inverter): it must lead.</li><li>Power flows from the <b>leading</b> to the <b>lagging</b> source: P = (3/2)·Vs·Vc·sin δ / (ωL) (peak values).</li><li>At unity PF the inductor voltage is perpendicular to Vs, so ${F('|Vc|² = |Vs|² + (ωL·I)²')}</li></ul>`);
    const L = lab(body, 'Phasor diagram (per phase)', 'Blue = grid voltage Vs, purple = converter voltage Vc, orange = inductor drop jωL·I, green = line current I (drawn small). Switch mode to see how the lag/lead flips.');
    const host = h('div'); L.add(host); let mode = 'rect';
    const draw = () => {
      const Vs = 100, XI = +$('#xi')?.value || 45; const sgn = mode === 'rect' ? 1 : -1; // Vc = Vs - j X I (rect, I in phase) ; inverter: I opposite -> Vc = Vs + jXI
      const cx = 60, cy = 110, k = 2.2; const vsx = cx + Vs * k, vcx = vsx, vcy = cy + sgn * XI * k; const ang = Math.atan2(sgn * XI, Vs) * 180 / Math.PI;
      host.innerHTML = `<svg class="svgfig" viewBox="0 0 480 230" role="img" aria-label="phasor diagram"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" fill="context-stroke"/></marker></defs>
      <line x1="${cx}" y1="${cy}" x2="${vsx}" y2="${cy}" style="stroke:var(--ch-v);stroke-width:4" marker-end="url(#ah)"/><text class="tx" x="${vsx + 6}" y="${cy + 4}" fill="var(--ch-v)">Vs</text>
      <line x1="${cx}" y1="${cy}" x2="${vcx}" y2="${vcy}" style="stroke:var(--ch-b);stroke-width:4" marker-end="url(#ah)"/><text class="tx" x="${vcx + 8}" y="${vcy + (sgn > 0 ? 14 : -4)}" fill="var(--ch-b)">Vc</text>
      <line x1="${vcx}" y1="${vcy}" x2="${vsx}" y2="${cy}" style="stroke:var(--ch-i);stroke-width:3;stroke-dasharray:6 4" marker-end="url(#ah)"/><text class="tx2" x="${vsx - 70}" y="${(cy + vcy) / 2 + 4}">jωL·I</text>
      <line x1="${cx}" y1="${cy}" x2="${cx + (sgn > 0 ? 1 : -1) * 70}" y2="${cy}" style="stroke:var(--ch-d);stroke-width:2.5;opacity:.0"/>
      <text class="tx" x="14" y="${cy - 100}">δ = ${(-ang).toFixed(1)}° (Vc ${sgn > 0 ? 'lags' : 'leads'} Vs)</text><text class="tx2" x="14" y="${cy - 80}">${sgn > 0 ? 'Rectifier: I in phase with Vs (unity PF), power AC → DC' : 'Inverter: I opposite to Vs, power DC → AC'}</text>
      <text class="tx2" x="14" y="222">|Vc| = ${Math.hypot(Vs, XI).toFixed(1)}  (= √(Vs² + (ωLI)²) → larger than Vs: DC link must exceed grid peak)</text></svg>`;
    };
    const xi = h('input', { type: 'range', id: 'xi', min: 5, max: 90, value: 45, 'aria-label': 'inductor drop', oninput: draw });
    segmented(L.body, [['rect', 'Rectifier (AC → DC)'], ['inv', 'Inverter (DC → AC)']], 'rect', m => { mode = m; draw(); });
    L.add(h('div', { class: 'ctl' }, h('label', {}, 'Inductor drop ωL·I'), xi, h('output', {}, '5-90 % of Vs'))); draw();
    H(body, `<h2>3-phase power is constant (no 100 Hz ripple)</h2><p>For balanced unity-PF currents, instantaneous power p = va·ia + vb·ib + vc·ic = (3/2)·Vpk·Ipk = <b>constant</b>. Therefore ${HOT('the DC-link ripple has no 2×line component, only switching-frequency ripple (so dominant ripple = fsw = 5 kHz in W5Q3)', 'W5Q3')}, and the DC capacitor can be far smaller than in the single-phase PFC.</p>`);
    const L2 = lab(body, 'Single-phase vs 3-phase instantaneous power', 'Same total average power. One pulsates at 100 Hz, the other is flat.');
    const sc = L2.scope({ xmin: 0, xmax: 40, ymin: -1.2, ymax: 3.2, yt: 4, xt: 4, xl: 'ms', yl: 'power (pu)', h: 220 }); L2.legend([['phase voltages (3-φ)', '--ch-b'], ['1-φ power p(t)', '--ch-i'], ['3-φ total power', '--ch-d']]);
    sc.draw([0, 1, 2].map(k => ({ fn: t => Math.sin(T2 * 50 * t / 1000 - k * T2 / 3), c: '--ch-b', w: 1, dash: [3, 3] })).concat([{ fn: t => 1 - Math.cos(T2 * 100 * t / 1000), c: '--ch-i', w: 2.4 }, { fn: t => 1, c: '--ch-d', w: 3, n: 4 }]));
    H(body, `<h2>Inductor sizing (W5Q2)</h2><ol class="steps"><li><div>Modulation index m = Vm/Vc (e.g. 2.7 V / 3 V = 0.9). Converter peak phase voltage Vc = m·Vdc/2.</div></li><li><div>Grid peak phase voltage Vs = √2·VLL/√3.</div></li><li><div>Peak current at unity PF: Ipk = 2P/(3·Vs).</div></li><li><div>Inductor drop ωL·Ipk = √(Vc² − Vs²), so L = √(Vc² − Vs²)/(2π·f·Ipk).</div></li></ol>`);
    calc(body, 'Calculator: grid inductor of a 3-phase active rectifier', [{ k: 'V', l: 'Line-line rms', v: 400, u: 'V' }, { k: 'Vdc', l: 'DC link', v: 750, u: 'V' }, { k: 'm', l: 'Modulation index', v: .9, u: '' }, { k: 'P', l: 'Power', v: 22000, u: 'W' }], x => { const r = C.vscL(x.V, x.Vdc, x.m, x.P); return [['Vs (peak, phase)', r.Vs.toFixed(1) + ' V'], ['Vc (peak, phase)', r.Vc.toFixed(1) + ' V'], ['Ipk', r.Ipk.toFixed(1) + ' A'], ['L per phase', (r.L * 1e3).toFixed(2) + ' mH']]; }, 'W5Q2 → 6.03 mH (the course uses π = 3 in this question, so any value ≈ 6 mH is accepted).');
    H(body, MUST(`${HOT('AC→DC: Vconv lags Vs; DC→AC: leads', 'W5Q1')}. Power goes from leading to lagging.`, `${F('L = √(Vc² − Vs²) / (ω·Ipk) ;  Ipk = 2P/(3Vs)')}`, `3-phase: constant power → only fsw ripple on the DC link (no 100 Hz).`, `DC link must be higher than the grid line-line peak (boost-type converter), e.g. 750 V for 400 V mains.`));
  } });

page({ id: 'dq-control', mod: 'm3', wk: 6, stars: 3, topic: true, title: 'dq control, PLL & PI design (3D)', kw: 'dq transformation park clarke pll pi controller decoupling power factor id iq', lede: 'Rotate your point of view with the grid and sinusoids become DC values that a plain PI controller can track.',
  render(body) {
    H(body, `<h2>abc → αβ → dq</h2><ul><li><b>abc → αβ (Clarke)</b>: three dependent sinusoids (va+vb+vc = 0) become two orthogonal ones. Still sinusoidal at 60 Hz (stationary frame). ${HOT('Result: still 60 Hz AC', 'W6Q7')}</li><li><b>αβ → dq (Park)</b>: rotate the axes at the grid angle θ (from a PLL). For balanced voltages, vd and vq become <b>DC</b>.</li><li>Independent variables: αβ and dq are orthogonal pairs, so their components are independent. The cross-coupling ωL terms are a dynamic coupling in the model, cancelled by feed-forward decoupling ${HOT('', 'W6Q5')}.</li></ul>`);
    const L = lab(body, '3D: space vector in the stationary frame vs the rotating (dq) frame', 'Vertical axis = time (past is lower). In the stationary view the vector draws a helix; in the rotating view the frame turns with it and the trace is a straight vertical line (DC). Use the angle error to see what a PLL error does.');
    let mode = 'stat'; const v = controls(L.body, [{ k: 'eps', label: 'PLL angle error ε', min: -60, max: 60, step: 1, v: 0, unit: '°', d: 0 }], () => { });
    segmented(L.body, [['stat', 'Stationary αβ'], ['rot', 'Rotating dq']], 'stat', m => { mode = m; });
    const N = 150; let arrow, trail, dax, qax, aax, bax;
    const api = Three.mount(L.body, { label: mode === 'stat' ? 'αβ' : 'dq', cam: [0, 0, 7.5], auto: false, setup: (a) => {
      const T = a.T; const mk = (dir, col, len, hl) => { const ah = new T.ArrowHelper(new T.Vector3(...dir), new T.Vector3(0, 0, 0), len, a.col(col).getHex(), hl || .25, .14); a.pivot.add(ah); return ah; };
      aax = mk([1, 0, 0], '--muted', 2.1); bax = mk([0, 0, -1], '--muted', 2.1); mk([0, 1, 0], '--muted', 1.2);
      dax = mk([1, 0, 0], '--ch-v', 2.0); qax = mk([0, 0, -1], '--ch-d', 2.0); arrow = mk([1, 0, 0], '--ch-i', 1.6, .3);
      const g = new T.BufferGeometry(); g.setAttribute('position', new T.BufferAttribute(new Float32Array(N * 3), 3)); trail = new T.Line(g, new T.LineBasicMaterial({ color: a.col('--ch-i') })); a.pivot.add(trail);
      a.pivot.rotation.x = .5; a.pivot.position.y = 1.0;
    }, tick: (t, a) => {
      const w = 2.2, eps = v.eps * Math.PI / 180, R = 1.6, T = a.T; const th = w * t + eps; // d-axis angle
      const P = trail.geometry.attributes.position; const stat = mode === 'stat';
      for (let k = 0; k < N; k++) { const tau = t - (N - 1 - k) * .04; const ang = stat ? w * tau : -eps; const y = -(N - 1 - k) * .04 * .5; P.setXYZ(k, R * Math.cos(ang), y, -R * Math.sin(ang)); }
      P.needsUpdate = true;
      const setDir = (ah, ang) => ah.setDirection(new T.Vector3(Math.cos(ang), 0, -Math.sin(ang)));
      if (stat) { setDir(aax, 0); setDir(bax, Math.PI / 2); setDir(dax, th); setDir(qax, th + Math.PI / 2); setDir(arrow, w * t); }
      else { setDir(dax, 0); setDir(qax, Math.PI / 2); setDir(aax, -th); setDir(bax, -th + Math.PI / 2); setDir(arrow, -eps); }
    } });
    H(body, `<p class="cap">Blue = d axis, green = q axis, grey = α/β axes, orange = voltage vector. With ε = 0 the vector sits exactly on the d-axis: vd = Vpk, vq = 0. That is exactly what the PLL enforces.</p>`);
    const L2 = lab(body, 'Waveforms: abc and dq', 'Balanced abc sinusoids become constant vd and vq. With a PLL error ε, vq ≠ 0: the PLL drives vq to zero.');
    const sc = L2.scope({ xmin: 0, xmax: 40, ymin: -1.3, ymax: 1.3, yt: 4, xt: 4, xl: 'ms', yl: 'pu', h: 220 }); L2.legend([['va', '--ch-b'], ['vb', '--ch-x'], ['vc', '--ch-i'], ['vd', '--ch-v'], ['vq', '--ch-d']]); const ro = L2.readout();
    const w2 = controls(L2.body, [{ k: 'e', label: 'PLL angle error ε', min: -60, max: 60, step: 1, v: 0, unit: '°', d: 0 }], u2);
    function u2() { const e = w2.e * Math.PI / 180; sc.draw([0, 1, 2].map(k => ({ fn: t => Math.sin(T2 * 50 * t / 1000 - k * T2 / 3), c: ['--ch-b', '--ch-x', '--ch-i'][k], w: 1.2, n: 300 })).concat([{ fn: t => Math.cos(e), c: '--ch-v', w: 3, n: 3 }, { fn: t => -Math.sin(e), c: '--ch-d', w: 3, n: 3 }])); ro([['vd', Math.cos(e).toFixed(2) + ' pu'], ['vq', (-Math.sin(e)).toFixed(2) + ' pu']]); }
    u2();
    H(body, `<h2>Power factor from id, iq (very likely asked)</h2><p>Whichever axis the <b>voltage</b> is aligned to carries the active current; the other axis carries reactive current.</p>${F('d-axis ∥ Vs:  PF = id / √(id²+iq²)   (iq = 0 ⇒ unity PF)', 'W6Q2')}${F('q-axis ∥ Vs:  PF = iq / √(id²+iq²)', 'W6Q3')}<p>${HOT('Aligning the current with the q-axis while d is on the voltage gives zero PF (purely reactive)', 'W6Q4')}.</p>`);
    const cc = lab(body, 'Calculator: power factor from dq currents', 'W6Q2: id = 8, iq = 10, d on voltage → 0.625.  W6Q3: iq = 2·id, q on voltage → 0.894.'); const ro3 = cc.readout(); const inp = {}; const row = h('div', { class: 'calc' }); const mkI = (k, l, val) => { const i = h('input', { type: 'number', step: 'any', value: val }); const lb = h('label', {}, l, i); i.addEventListener('input', run); inp[k] = i; return lb; }; const sel = h('select', { class: 'sel', 'aria-label': 'aligned axis', onchange: run }, h('option', { value: 'd' }, 'd-axis'), h('option', { value: 'q' }, 'q-axis'));
    row.append(h('div', { class: 'inputs' }, mkI('id', 'id (A)', 8), mkI('iq', 'iq (A)', 10), h('label', {}, 'Voltage aligned to', sel))); cc.body.insertBefore(row, ro3 && cc.body.children[1]);
    function run() { const id = +inp.id.value, iq = +inp.iq.value, m = Math.hypot(id, iq), a = sel.value === 'd' ? id : iq; ro3([['|i|', m.toFixed(2) + ' A'], ['Power factor', (a / m).toFixed(3)], ['Reactive part', (sel.value === 'd' ? iq : id) + ' A']]); } run();
    H(body, `<h2>Controller structure</h2><p>${HOT('Outer DC-link voltage loop', '')} (slow) → sets id* (active power). iq* = 0 for unity PF (or ≠ 0 to supply reactive power). Two inner PI current loops (fast) with <b>decoupling</b> (±ωL·id, ±ωL·iq) and grid-voltage feed-forward → dq reference voltages → inverse transform → SPWM. The PLL supplies θ and locks vq to 0.</p>
    <h2>PI design by pole-zero cancellation</h2><p>Plant (L with series resistance R): G(s) = 1/(R + sL), pole at R/L. PI = Kp + Ki/s = Kp(1 + Ki/(Kp s)) has a zero at s = −Ki/Kp. ${HOT('Cancel the plant pole: Ki/Kp = R/L, i.e. Kp/Ki = L/R', 'W6Q9')}.</p>`);
    calc(body, 'Calculator: PI zero placement', [{ k: 'L', l: 'L', v: 12, u: 'mH' }, { k: 'R', l: 'R', v: 10, u: 'mΩ' }], x => [['Kp/Ki = L/R', (x.L / x.R).toFixed(3) + ' s'], ['Plant pole R/L', (x.R / x.L).toFixed(4) + ' rad/s']], 'W6Q9: 12 mH / 10 mΩ = 1.2 s.');
    H(body, `<p>${HOT('Time constants: Ts = L/R (plant) is huge (≥ 100 ms) compared to the converter delay Td ≈ 1.5·Tsw (tens of µs): Ts ≫ Td', 'W6Q10')}. So after cancelling the slow plant pole, the loop is shaped only by Td and the integrator, and the bandwidth is set by Td.</p>
    ${MUST(`Balanced abc → dq gives DC; αβ is still AC (W6Q7).`, `Which axis is on the voltage? That axis carries the active current (W6Q2-Q4).`, `${F('Kp/Ki = L/R')}  (pole-zero cancellation)`, `iq* = 0 → unity PF. Decoupling cancels the ωL cross terms. The PLL keeps vq = 0.`)}`);
  } });
