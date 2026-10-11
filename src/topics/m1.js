/* ===== Module 1: charging basics ===== */
page({ id: 'ev-system', mod: 'm1', wk: 1, stars: 1, topic: true, title: 'EV charging system & battery basics', kw: 'bms cccv battery c-rate soc', lede: 'What a charger actually does to a Li-ion battery: constant current first, constant voltage later, with the BMS in charge.',
  render(body) {
    H(body, `<h2>The big picture</h2><p>An EV charger is a <b>controlled power source</b>: it turns grid AC into DC at the voltage and current the battery asks for. The battery's own computer, the ${HOT('BMS (Battery Management System)')}, is the <b>master</b>: it measures cell voltages and temperatures and tells the charger how much current/voltage it may deliver. The charger is the <b>slave</b>.</p>
    <p>Li-ion cells are charged with the ${HOT('CC-CV (constant current, constant voltage)')} method:</p><ol class="steps"><li><div><b>CC stage:</b> the charger holds the current at the allowed level; cell voltage rises. Most energy (≈ 70-80 % SOC) goes in here.</div></li><li><div><b>CV stage:</b> when cell voltage reaches its maximum (≈ 4.2 V/cell for NMC), the charger holds the voltage and the current <b>tapers</b> automatically as the cell fills.</div></li><li><div><b>Termination:</b> charging stops when the current falls to a small cut-off (about C/20 to C/10).</div></li></ol>`);
    const L = lab(body, 'CC-CV charging of one cell', 'Move the C-rate: a higher C-rate reaches the voltage limit sooner and spends less time in CC.');
    const sc = L.scope({ xmin: 0, xmax: 120, ymin: 0, ymax: 4.5, xl: 'minutes', yl: 'cell V', xt: 6, yt: 3, h: 250 }); L.legend([['cell voltage (V)', '--ch-v'], ['current (× C-rate/1C, scaled)', '--ch-i']]);
    const ro = L.readout();
    const v = controls(L.body, [{ k: 'c', label: 'Charge rate', min: .25, max: 3, step: .05, v: 1, unit: 'C', d: 2 }, { k: 'tau', label: 'CV taper time constant', min: 5, max: 40, step: 1, v: 18, unit: 'min', d: 0 }], upd);
    function upd() {
      // simple model: open-circuit v(soc) + I*R
      const R = 0.04, C = v.c, dt = .5; let soc = 0, I = C, t = 0, tcv = null; const X = [], Vv = [], Ii = [];
      const Voc = s => 3.0 + 1.0 * s + .2 * Math.pow(s, 6) - .0 * s; // ~3.0..4.2
      for (; t <= 120; t += dt) {
        let V = Voc(soc) + I * R;
        if (tcv === null && V >= 4.2) tcv = t;
        if (tcv !== null) { I = C * Math.exp(-(t - tcv) / v.tau); V = 4.2; }
        if (I < 0.05) I = 0.0;
        X.push(t); Vv.push(I === 0 ? Voc(soc) : V); Ii.push(I / Math.max(C, 1) * 1.4 + 0); soc = Math.min(1, soc + I / 60 * dt);
        if (I === 0 && tcv) { for (let k = t + dt; k <= 120; k += dt) { X.push(k); Vv.push(4.2); Ii.push(0); } break; }
      }
      sc.draw([{ x: X, y: Vv, c: '--ch-v' }, { x: X, y: Ii.map(y => y * 1.2), c: '--ch-i', fill: true }], { h: [{ y: 4.2, c: '--bad', t: '4.2 V limit' }], v: tcv ? [{ x: tcv, c: '--ch-d', t: 'CC → CV' }] : [] });
      ro([['C-rate', C.toFixed(2) + ' C'], ['CC → CV at', tcv ? tcv.toFixed(0) + ' min' : '>120 min'], ['Pack 75 kWh, power at 1C', (75 * C).toFixed(0) + ' kW']]);
    }
    upd();
    H(body, MUST(
      `${HOT('BMS is the master')}: it requests voltage/current; the EVSE only supplies. The BMS lives in the vehicle, never in the charger (W1Q5).`,
      `CC first (current constant, voltage rises) then CV (voltage constant, current tapers).`,
      `C-rate = charging current ÷ rated capacity (1C of a 100 Ah pack = 100 A). Power = V × I.`,
      `Fast charging is limited by cell temperature and lithium plating, not just by the charger rating.`
    ));
  } });

page({ id: 'charger-arch', mod: 'm1', wk: 1, stars: 2, topic: true, title: 'AC vs DC charger architecture', kw: 'evse onboard charger obc rectifier', lede: 'Where is the power electronics: in the car (AC charging) or in the station (DC charging)?',
  render(body) {
    H(body, `<p>${HOT('AC EVSE = smart switch only', 'W1Q6')}. It contains interlocks (contactor/relay), sensors (residual current, temperature), energy metering and a controller. The rectifier, PFC and DC-DC stage are inside the vehicle (the <b>on-board charger, OBC</b>).</p>
    <p>${HOT('DC EVSE = full charger', 'W1Q5')}: rectifier with PFC, isolated DC-DC converter, interlocks, metering and controller. DC goes straight into the battery pack; the OBC is bypassed. Power can be 50-350 kW because the size/cost of the converter is in the station, not in the car.</p>`);
    const L = lab(body, 'Block diagram: where does the conversion happen?', 'Switch between AC and DC charging. Blue blocks are in the station, orange blocks are in the vehicle.');
    const host = h('div'); L.add(host);
    const draw = (m) => {
      const blk = (x, y, w, t, car, on) => `<rect class="box" x="${x}" y="${y}" width="${w}" height="52" rx="8" style="${on ? 'fill:' + (car ? 'color-mix(in srgb,var(--ch-i) 28%,var(--surface))' : 'color-mix(in srgb,var(--ch-v) 28%,var(--surface))') : 'opacity:.45'}"/><text class="tx" x="${x + w / 2}" y="${y + 31}" text-anchor="middle">${t}</text>`;
      const ac = m === 'ac';
      host.innerHTML = `<svg class="svgfig" viewBox="0 0 760 210" role="img" aria-label="${ac ? 'AC' : 'DC'} charging block diagram">
      <rect x="8" y="14" width="${ac ? 250 : 400}" height="130" rx="12" fill="none" stroke="var(--ch-v)" stroke-width="2" stroke-dasharray="6 5"/><text class="tx2" x="18" y="32">EVSE (charging station)</text>
      <rect x="${ac ? 280 : 430}" y="14" width="${ac ? 470 : 320}" height="130" rx="12" fill="none" stroke="var(--ch-i)" stroke-width="2" stroke-dasharray="6 5"/><text class="tx2" x="${ac ? 290 : 440}" y="32">Electric vehicle</text>
      ${blk(20, 50, 80, 'Grid AC', false, true)}
      ${ac ? blk(120, 50, 120, 'Interlock + meter', false, true) : blk(120, 50, 130, 'Rectifier + PFC', false, true) + blk(262, 50, 140, 'Isolated DC-DC', false, true)}
      ${ac ? blk(300, 50, 130, 'Rectifier + PFC', true, true) + blk(442, 50, 120, 'DC-DC', true, true) + blk(574, 50, 80, 'Battery', true, true) + blk(664, 50, 76, 'BMS', true, true) : blk(450, 50, 130, 'Contactor / disc.', true, true) + blk(600, 50, 90, 'Battery', true, true) + `<rect class="box" x="450" y="104" width="90" height="34" rx="8" style="fill:color-mix(in srgb,var(--ch-i) 28%,var(--surface))"/><text class="tx" x="495" y="126" text-anchor="middle">BMS</text>`}
      <path class="ln on" d="M100 76H120"/>${ac ? '<path class="ln on" d="M240 76H300M430 76H442M562 76H574"/>' : '<path class="ln on" d="M250 76H262M402 76H450M580 76H600"/>'}
      <text class="tx2" x="${ac ? 8 : 8}" y="176">${ac ? 'Cable carries AC (1-φ or 3-φ). Power limited by the on-board charger: typically 3.3-22 kW.' : 'Cable carries DC at battery voltage. Power set by the station: 50-350 kW. OBC bypassed.'}</text>
      <text class="tx2" x="8" y="194">${ac ? 'Communication: PWM on the CP pin (SAE J1772) → current limit.' : 'Communication: PLC (CCS) or CAN (CHAdeMO, GB/T, BEVC-DC001) between BMS and station.'}</text></svg>`;
    };
    segmented(L.body, [['ac', 'AC charging'], ['dc', 'DC fast charging']], 'ac', draw); draw('ac');
    H(body, `<div class="card"><b>Want the full chain with waveforms?</b> <button class="btn primary" onclick="go('simulator')">Open the end-to-end charger simulator</button></div>`);
    H(body, `<h2>Charger power-stage chain (what you will design in the next modules)</h2>${TBL(['Stage', 'Job', 'Typical topology (this course)'], [['AC-DC with PFC', 'Make DC from AC <b>and</b> draw sinusoidal current in phase with voltage', 'Boost PFC, totem-pole PFC (1-φ); 3-phase active rectifier (VSC)'], ['Isolated DC-DC', 'Galvanic isolation, voltage matching, regulation', 'Forward, push-pull, half/full bridge, PSFB, DAB, LLC'], ['Control', 'Current/voltage loops, protection, communication', 'Average current control, dq control, CAN/PLC']])}
    ${MUST(`${HOT('AC EVSE: no rectifier')}. DC EVSE: rectifier + isolated DC-DC + interlocks. BMS is never in the EVSE.`, `Mode-4 charging = DC EVSE; Mode-3 = AC EVSE with control pilot; Mode-2 = cable with in-cable control box (RCD); Mode-1 = plain socket.`, `Isolation (transformer) is needed in the charger for safety and to match voltage levels.`)}`);
  } });

page({ id: 'standards', mod: 'm1', wk: 1, stars: 2, topic: true, title: 'Charging standards, modes & connectors (3D)', kw: 'ccs1 ccs2 chademo gbt type 1 type 2 type 6 type 7 connector mode level', lede: 'Names, modes and pin layouts. Spin the connectors and learn which pins exist.',
  render(body) {
    H(body, `<h2>Charging modes (IEC 61851-1)</h2>${TBL(['Mode', 'What it is', 'Protection / signalling'], [['Mode 1', 'Plain household socket, cable with no control box', 'None (legacy, banned in many places)'], [HOT('Mode 2', 'W1Q4'), 'Socket + <b>in-cable control &amp; protection device</b> (ICCPD)', 'RCD + CP pilot in the control box'], ['Mode 3', 'Dedicated AC EVSE (wall box)', 'CP/PP signalling, EVSE decides current'], ['Mode 4', 'Dedicated DC EVSE (fast charger)', 'High-level comms (PLC/CAN), off-board charger']])}
    <h2>Which standard uses which communication?</h2>${TBL(['System', 'Power', 'Communication', 'Notes'], [['AC Type-1 / Type-2', 'AC 1-φ / 3-φ', HOT('PWM on CP (SAE J1772)', 'W1Q9'), 'Type-1: 1-φ only. Type-2: up to 3-φ 43 kW AC'], ['CCS1 / CCS2', 'AC + DC', HOT('PLC (HomePlug Green PHY)', 'W10Q9'), 'Combined Charging System: AC pins + 2 DC pins in one inlet'], ['CHAdeMO', 'DC', HOT('CAN', 'W1Q3'), 'DC only'], ['GB/T 27930 (DC)', 'DC', 'CAN', 'China; separate AC inlet (GB/T 20234.2)'], ['BEVC-DC001', 'DC (light EV, India)', 'CAN', 'Bharat EV Charger spec'], ['Type-6 / Type-7 (IS 17017)', 'LEV', 'CAN', 'Type-7: AC + DC in one inlet, single-phase only']])}
    <p class="cap">${HOT('3-phase AC is possible only on Type-2 family and GB/T AC inlets', 'W1Q2')}; CCS1 (Type-1 base) and Type-7 are single-phase.</p>
    <h2>3D connector pin viewer</h2>`);
    const L = lab(body, 'Vehicle inlet pin layouts (schematic, not to scale)', 'Choose a connector. Big pins carry power; small pins are for control. Tap a pin name to light it up.');
    const CON = {
      'CCS1': { shell: 'round', top: [['L1', 'ac', -.5, .95], ['L2/N', 'ac', .5, .95], ['PE', 'pe', 0, .35], ['CP', 'sig', -.72, .25], ['PP', 'sig', .72, .25]], dc: [['DC+', 'dc', -.55, -.95], ['DC−', 'dc', .55, -.95]], note: 'Type-1 (SAE J1772) round top + 2 DC pins. 1-φ AC only. PLC for DC.' },
      'CCS2': { shell: 'type2', top: [['L1', 'ac', -.55, 1.05], ['L2', 'ac', .55, 1.05], ['L3', 'ac', -.9, .35], ['N', 'ac', .9, .35], ['PE', 'pe', 0, .6], ['CP', 'sig', -.35, .1], ['PP', 'sig', .35, .1]], dc: [['DC+', 'dc', -.6, -.95], ['DC−', 'dc', .6, -.95]], note: 'Type-2 (IEC 62196-2) top + 2 DC pins. 3-φ AC or DC. PLC on CP.' },
      'Type 2': { shell: 'type2', top: [['L1', 'ac', -.55, 1.05], ['L2', 'ac', .55, 1.05], ['L3', 'ac', -.9, .35], ['N', 'ac', .9, .35], ['PE', 'pe', 0, .6], ['CP', 'sig', -.35, .1], ['PP', 'sig', .35, .1]], dc: [], note: 'AC only, 1-φ or 3-φ, 7 pins. Signalling by CP PWM + PP cable coding.' },
      'CHAdeMO': { shell: 'round', top: [['DC+', 'dc', -.7, .7], ['DC−', 'dc', .7, .7], ['PE', 'pe', 0, -.1]], dc: [['CAN-H', 'sig', -.55, -.8], ['CAN-L', 'sig', -.15, -.8], ['Start/Stop', 'sig', .25, -.8], ['Enable/Prox', 'sig', .65, -.8]], note: 'DC only, CAN communication, separate inlet from the AC one (no combined AC part).' },
      'GB/T DC': { shell: 'round', top: [['DC+', 'dc', -.7, .7], ['DC−', 'dc', .7, .7], ['PE', 'pe', 0, .1]], dc: [['S+', 'sig', -.65, -.5], ['S−', 'sig', -.2, -.5], ['CC1', 'sig', .25, -.5], ['CC2', 'sig', .7, -.5], ['A+', 'sig', -.4, -1], ['A−', 'sig', .4, -1]], note: 'GB/T 20234.3, CAN (S+/S−), CC1/CC2 connection confirm, A+/A− 12 V aux supply.' },
      'GB/T AC': { shell: 'round', top: [['L1', 'ac', -.55, 1.0], ['L2', 'ac', .55, 1.0], ['L3', 'ac', -.9, .3], ['N', 'ac', .9, .3], ['PE', 'pe', 0, .55], ['CC', 'sig', -.35, -.2], ['CP', 'sig', .35, -.2]], dc: [], note: 'GB/T 20234.2: 7 pins (L1-L3, N, PE, CC, CP). 3-φ capable.' }
    };
    const chips = h('div', { class: 'legendbox' }); const info = h('p', { class: 'cap' });
    let cur = 'CCS2', sel = null, api, pinMeshes = [], group;
    const colOf = { ac: '--ch-i', dc: '--ch-d', pe: '--good', sig: '--ch-v' };
    const buildCon = () => {
      if (!api) return; const T = api.T; if (group) { api.pivot.remove(group); group.traverse(o => { o.geometry && o.geometry.dispose(); }); }
      group = new T.Group(); pinMeshes = []; const c = CON[cur];
      const shell = new T.Mesh(new T.CylinderGeometry(1.7, 1.7, .6, 48, 1, true), new T.MeshStandardMaterial({ color: 0x5b6672, side: T.DoubleSide, metalness: .2, roughness: .6 }));
      shell.rotation.x = Math.PI / 2; group.add(shell);
      const back = new T.Mesh(new T.CircleGeometry(1.7, 48), new T.MeshStandardMaterial({ color: 0x2a3138 })); back.position.z = -.3; group.add(back);
      const ring = new T.Mesh(new T.TorusGeometry(1.7, .06, 12, 64), new T.MeshStandardMaterial({ color: 0x9aa7b5 })); ring.position.z = .3; group.add(ring);
      if (c.shell === 'type2') { const cut = new T.Mesh(new T.BoxGeometry(3.4, .5, .62), new T.MeshStandardMaterial({ color: 0x2a3138 })); cut.position.set(0, -1.52, 0); group.add(cut); }
      [...c.top, ...c.dc].forEach(([n, k, x, y]) => {
        const big = k === 'ac' || k === 'dc' || k === 'pe'; const r = big ? (k === 'dc' ? .26 : .2) : .11;
        const m = new T.Mesh(new T.CylinderGeometry(r, r, .55, 24), new T.MeshStandardMaterial({ color: api.col(colOf[k]), emissive: 0x000000, metalness: .3, roughness: .4 }));
        m.rotation.x = Math.PI / 2; m.position.set(x, y * 1.2 / 1.0 * .9, .02); m.userData = { n, k }; group.add(m); pinMeshes.push(m);
      });
      api.pivot.add(group); paintSel();
    };
    const paintSel = () => pinMeshes.forEach(m => { m.material.emissive.setHex(m.userData.n === sel ? 0xffffff : 0); m.scale.set(m.userData.n === sel ? 1.4 : 1, 1, 1); m.scale.y = m.userData.n === sel ? 1.2 : 1; });
    const list = () => {
      const c = CON[cur]; chips.innerHTML = '';
      [...c.top, ...c.dc].forEach(([n, k]) => chips.append(h('button', { class: 'btn', style: `border-left:5px solid var(${colOf[k]})`, onclick: () => { sel = sel === n ? null : n; paintSel(); } }, n)));
      info.textContent = c.note;
    };
    segmented(L.body, Object.keys(CON).map(k => [k, k]), cur, k => { cur = k; sel = null; list(); buildCon(); });
    L.add(chips); L.add(info);
    L.body.append(h('div', { class: 'legend', html: '<span style="--c:var(--ch-i)">AC power (L/N)</span><span style="--c:var(--ch-d)">DC power</span><span style="--c:var(--good)">PE (earth)</span><span style="--c:var(--ch-v)">signal</span>' }));
    api = Three.mount(L.body, { label: 'inlet, front view', cam: [0, 0, 6.5], setup: () => { } });
    if (api.T) { buildCon(); } list();
    H(body, MUST(
      `${HOT('CCS = AC (Type-1/2) pins + 2 DC pins', 'W1Q1')}. CCS1 → Type-1 base (round, 1-φ), CCS2 → Type-2 base (3-φ capable).`,
      `${HOT('CAN: CHAdeMO, GB/T DC, BEVC-DC001, Type-6, Type-7', 'W1Q3')}. ${HOT('PLC: CCS1/CCS2')}. ${HOT('PWM only: AC Type-1/2')}.`,
      `${HOT('Mode-2 = socket + in-cable protection box', 'W1Q4')}; Mode-3 = AC wall box; Mode-4 = DC charger.`,
      `Type-7 = light-EV connector with AC and DC in one inlet (single-phase).`
    ));
  } });
