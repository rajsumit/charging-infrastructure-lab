/* ===== 3D end-to-end charger: exploded view, ECU internals ===== */
page({ id: 'charger3d', mod: 'home', title: '3D charger: explode & inspect', kw: '3d exploded view ecu components capacitor inductor transformer ac dc charger', render(body) {
  H(body, `<div class="crumb"><span>Whole-system view</span><span class="pill hot">★ 3D · exploded · clickable</span></div><h1>3D charger: take it apart</h1><p class="lede">The whole AC or DC charger in 3D. <b>Drag</b> to rotate, <b>scroll</b> to zoom, <b>click an ECU</b> to fly inside it, <b>click any component</b> (capacitor, inductor, transformer, power module…) to learn what it does. Use the explode slider to pull everything apart.</p>`);
  const INFO = {
    xfmrLV: ['LV distribution transformer', 'Steps medium voltage down to 400 V three-phase. The charger sees 400 V line-line, 50 Hz (230 V phase).', 'charger-arch'],
    meterU: ['Utility energy meter', 'Revenue meter of the grid connection (the charger has its own billing meter too).', 'stations-ocpp'],
    spd: ['Surge protection device (SPD)', 'Clamps lightning and switching surges on the mains before they reach the electronics.', 'charger-arch'],
    rcd: ['Residual-current device (RCD) with DC detection', 'Trips on leakage current to earth (30 mA AC, 6 mA DC typical) to protect people. Required for Mode 3 AC EVSE.', 'charger-arch'],
    contAC: ['AC contactor / relay', 'Closes only when the CP line shows state C (+6 V, vehicle ready). Opens on stop or fault; weld detection checks it really opened.', 'ac-type2'],
    meterE: ['Energy meter', 'Billing-grade metering. Energy values are reported to the back-end by OCPP MeterValues.', 'stations-ocpp'],
    ctrlAC: ['EVSE controller board', 'Generates the ±12 V, 1 kHz CP PWM (duty = current limit), reads CP/PP levels, and talks OCPP 1.6J over WebSocket to the central system.', 'ac-type2'],
    plug: ['Type-2 plug', 'Seven pins: L1-L3, N, PE, CP, PP. CP carries the PWM signalling; PP encodes the cable rating.', 'ac-type2'],
    r6: ['PP resistor R6', 'The cable rating resistor: 1.5 kΩ → 13 A, 680 Ω → 20 A, 220 Ω → 32 A, 100 Ω → 63 A. The car reads it as a voltage at PP.', 'ac-type2'],
    cableAC: ['Charging cable', 'Copper conductors sized for the rated current; PP resistor tells the car what the cable can carry.', 'ac-type2'],
    emi: ['EMI filter (common-mode choke + X/Y capacitors)', 'Keeps the switching noise of the converter off the mains and keeps mains noise out of the electronics.', 'pfc-stress'],
    sic: ['SiC / GaN power module (half-bridge)', 'The fast switches of the converter. Wide-bandgap devices switch at 50-100+ kHz with low loss. A 3-phase VSC uses six switches; a totem-pole PFC two fast switches plus two line-frequency ones.', 'bridgeless'],
    boostL: ['PFC / grid inductor L', 'Shapes the line current. Single-phase boost: L = Vo/(4·ΔI·fsw). 3-phase VSC: L = √(Vc² − Vs²)/(ω·Ipk) (about 6 mH for 22 kW in W5Q2).', 'boost-pfc'],
    drv: ['Gate-driver board', 'Isolated drivers that turn the control PWM into gate pulses with dead time and desaturation (short-circuit) protection.', 'softsw'],
    mcu: ['Control board (MCU / DSP)', 'Runs the dual-loop average-current control or the dq control with PLL, protection, and CAN/PLC communication with the BMS.', 'pfc-control'],
    curS: ['Current sensor (Hall / shunt)', 'Feeds the fast current loop. Its bandwidth must be well above the current-loop bandwidth (500 Hz … fsw/10).', 'pfc-control'],
    heat: ['Heatsink / cold plate', 'Removes the 1-4 % of power lost as heat. Air cooled for small on-board chargers, liquid cooled at high power.', 'softsw'],
    dcCap: ['DC-link capacitor', 'Single-phase: absorbs the 100 Hz power pulsation, ΔVpp = P/(2π·f·Vo·C), so it is large (mF). Three-phase: only switching ripple, so much smaller. Film capacitors outlive electrolytics.', 'pfc-stress'],
    busbar: ['Laminated busbar', 'Low-inductance copper plates linking capacitors and modules, so switching does not create dangerous voltage spikes.', 'softsw'],
    bleed: ['Bleeder resistor', 'Discharges the DC link to a safe voltage after power-off.', 'pfc-stress'],
    pBr: ['Primary full-bridge', 'The input side of the isolated DC-DC. PSFB: phase shift φ sets Vo/Vin = n(1 − φ/180°). DAB: single phase shift δ sets P = Vin·Vo′·δ(π−δ)/(2π²fsL).', 'psfb'],
    hfT: ['High-frequency transformer', 'Provides galvanic isolation and voltage matching. Ferrite core at 20-100+ kHz. Core area Ac = V·t/(N·ΔBpp); loss is minimal near ΔBopt = (a/b)^¼.', 'magnetics'],
    Lr: ['Resonant / series inductor', 'PSFB: the leakage plus an external Lr gives lagging-leg ZVS. DAB: L sets the power transfer. Often an air-gapped inductor so it does not saturate.', 'dab'],
    rectS: ['Secondary rectifier', 'Diodes (or synchronous SiC switches) turning the HF AC into DC for the output filter.', 'bridges'],
    Lo: ['Output filter inductor Lo', 'Smooths the output current. In a full bridge the ripple is at 2·fsw: L = Vo(1 − D)/(2·fsw·ΔI).', 'bridges'],
    Co: ['Output capacitor Co', 'Holds the DC output voltage steady and filters the remaining ripple.', 'bridges'],
    contDC: ['DC contactors', 'Close only after pre-charge (current < 2 A, voltage difference < 20 V), in state C2. Must break high-voltage DC.', 'ccs2'],
    fuse: ['HV fuse', 'Last-resort protection for the DC path.', 'ccs2'],
    imd: ['Insulation monitoring device (IMD)', 'Checks insulation resistance during the cable check and while charging, to detect leakage in the HV DC system.', 'ccs2'],
    shunt: ['DC current shunt', 'Measures the delivered current for control and for billing.', 'pfc-control'],
    plugDC: ['CCS2 connector', 'Type-2 AC part plus two large DC pins (DC+, DC−). PLC (HomePlug Green PHY) rides on CP; 5 % PWM announces digital communication.', 'ccs2'],
    cableDC: ['Liquid-cooled DC cable', 'High-current cables (350 A and more) use coolant so they stay light enough to handle.', 'ccs2'],
    cells: ['Battery cells / modules', 'Cells in series: about 96 in series ≈ 400 V, 192 ≈ 800 V. NMC cells reach 4.2 V maximum. Charged CC then CV.', 'ev-system'],
    bmsB: ['BMS (Battery Management System)', 'The master of charging: measures every cell voltage and temperature, estimates SOC, and tells the charger what voltage and current it may deliver (CAN / PLC).', 'ev-system'],
    contB: ['Main battery contactors', 'Connect the pack to the HV bus after pre-charge; opened on any fault.', 'ccs2'],
    preR: ['Pre-charge resistor + relay', 'Limits inrush current while the DC link and battery voltages are matched before the main contactors close.', 'ccs2'],
    coolP: ['Battery cooling plate', 'Keeps cells in their temperature window, critical for fast charging.', 'ev-system']
  };
  const STAGE = {
    grid: ['Grid supply', 'The mains: 400 V three-phase (or 230 V single-phase) at 50 Hz.', 'rectifier'], evse: ['AC EVSE (wall box)', 'No power conversion: protection, contactor, meter, and the controller that signals current limits to the car.', 'charger-arch'], prot: ['AC input & protection cabinet', 'Breaker, contactor, EMI filter and meter in front of the power modules.', 'charger-arch'],
    cable: ['Cable & connector', 'Carries power and the CP/PP (and PLC for DC) signals.', 'ac-type2'], pfc: ['PFC / active rectifier ECU', 'Turns AC into a regulated DC link with sinusoidal, in-phase input current (PF ≈ 1).', 'boost-pfc'], dclink: ['DC-link ECU', 'The energy buffer between the AC-DC and DC-DC stages.', 'pfc-stress'],
    dcdc: ['Isolated DC-DC ECU', 'Isolation, voltage matching and regulation using a high-frequency transformer (PSFB or DAB).', 'psfb'], out: ['Output stage', 'Output filter, contactors, fuse and isolation monitoring before the battery.', 'ccs2'], batt: ['Battery pack + BMS', 'The load: the BMS decides how much current/voltage it wants.', 'ev-system']
  };
  const UI = h('div', { class: 'card' }); body.append(UI); let mode = 'ac', exploded = 0, xray = false, flow = true, selStage = null, selPart = null, api = null, world, stageObjs = [], parts = [], fl = [], zones, tgtE = 0, curE = 0, cam = { z: 34, tz: 34, move: false }, tx = 0;
  const info = h('div', { class: 'card', style: 'border-left:5px solid var(--hot)' }); const chips = h('div', { class: 'legendbox' });
  segmented(UI, [['ac', 'AC charger (on-board charger in the car)'], ['dc', 'DC fast charger (off-board)']], mode, k => { mode = k; selStage = null; selPart = null; rebuild(); });
  const ex = h('input', { type: 'range', min: 0, max: 100, value: 0, 'aria-label': 'explode' }); ex.addEventListener('input', () => { tgtE = ex.value / 100; if (api && stageObjs.length) focus(); });
  UI.append(h('div', { class: 'ctl', style: 'margin-top:8px' }, h('label', {}, 'Explode'), ex, h('output', {}, 'pull apart')));
  const xr = h('label', { class: 'btn', style: 'display:inline-flex;gap:6px;align-items:center;cursor:pointer' }, h('input', { type: 'checkbox', onchange: e => { xray = e.target.checked; } }), 'X-ray all housings');
  const fw = h('label', { class: 'btn', style: 'display:inline-flex;gap:6px;align-items:center;cursor:pointer' }, h('input', { type: 'checkbox', checked: true, onchange: e => { flow = e.target.checked; } }), 'Show power flow');
  UI.append(h('div', { class: 'nextprev', style: 'margin-top:8px;justify-content:flex-start;gap:8px' }, xr, fw, h('button', { class: 'btn', onclick: () => { selStage = null; selPart = null; focus(); showInfo(); } }, 'Whole charger')));
  UI.append(chips);
  const L = lab(body, '3D view', 'Blue = station side, orange = vehicle side. Glowing dots = power flow: purple AC, blue DC link, green battery side.');
  /* ---------- geometry kit ---------- */
  const kit = (T) => {
    const M = (c, o) => new T.MeshStandardMaterial(Object.assign({ color: c, metalness: .25, roughness: .55 }, o));
    const box = (w, hh, d, c, o) => new T.Mesh(new T.BoxGeometry(w, hh, d), M(c, o));
    const cyl = (r, hh, c, o, s = 24) => new T.Mesh(new T.CylinderGeometry(r, r, hh, s), M(c, o));
    const G = (...k) => { const g = new T.Group(); k.forEach(x => g.add(x)); return g; };
    const at = (m, x, y, z) => { m.position.set(x, y, z); return m; };
    const rot = (m, x, y, z) => { m.rotation.set(x, y, z); return m; };
    const K = {
      cap: () => G(cyl(.1, .32, 0x1e4fa0), at(cyl(.1, .02, 0xcfd6dd), 0, .17, 0), at(cyl(.025, .06, 0xcfd6dd), -.04, .2, 0), at(cyl(.025, .06, 0xcfd6dd), .04, .2, 0)),
      film: () => G(box(.3, .24, .16, 0xd9822b), at(cyl(.025, .06, 0xcfd6dd), -.08, .15, 0), at(cyl(.025, .06, 0xcfd6dd), .08, .15, 0)),
      ind: () => { const a = new T.Mesh(new T.TorusGeometry(.16, .05, 12, 32), M(0x4a4f57)); a.rotation.x = Math.PI / 2; const c = new T.Mesh(new T.TorusGeometry(.16, .075, 10, 40, 5.2), M(0xc7772e, { metalness: .6 })); c.rotation.x = Math.PI / 2; c.rotation.z = .5; return G(a, c); },
      xfmr: () => G(at(box(.74, .1, .44, 0x4a4f57), 0, -.3, 0), at(box(.74, .1, .44, 0x4a4f57), 0, .3, 0), at(box(.1, .5, .44, 0x4a4f57), -.32, 0, 0), at(box(.1, .5, .44, 0x4a4f57), .32, 0, 0), at(box(.14, .5, .36, 0x4a4f57), 0, 0, 0), at(cyl(.17, .26, 0xc7772e, { metalness: .6 }), 0, .1, 0), at(cyl(.17, .26, 0xb9c2cb, { metalness: .6 }), 0, -.16, 0)),
      mod: () => G(box(.4, .1, .24, 0x23272d), at(box(.36, .02, .06, 0xc23b32), 0, .06, .06), at(cyl(.02, .06, 0xd4af37), -.12, .08, -.06), at(cyl(.02, .06, 0xd4af37), 0, .08, -.06), at(cyl(.02, .06, 0xd4af37), .12, .08, -.06)),
      heat: (w, d) => { const g = G(at(box(w, .05, d, 0xb8c2cc, { metalness: .6 }), 0, 0, 0)); const n = Math.max(5, Math.round(w / .1)); for (let i = 0; i < n; i++) g.add(at(box(.025, .16, d, 0xb8c2cc, { metalness: .6 }), -w / 2 + .05 + i * (w - .1) / (n - 1), -.1, 0)); return g; },
      pcb: (w, d) => { const g = G(box(w, .035, d, 0x1f7a4d)); for (let i = 0; i < 9; i++) g.add(at(box(.07 + (i % 3) * .03, .035, .06 + (i % 2) * .04, 0x1b1d21), -w / 2 + .14 + ((i * 37) % 100) / 100 * (w - .28), .035, -d / 2 + .12 + ((i * 53) % 100) / 100 * (d - .24))); return g; },
      relay: () => G(box(.34, .22, .22, 0x2f6fb5), at(cyl(.06, .08, 0xdddddd), 0, .15, 0)),
      breaker: () => G(box(.2, .3, .16, 0xe5e7ea), at(box(.06, .1, .06, 0x23272d), 0, .18, .1)),
      meter: () => G(box(.34, .3, .12, 0xe5e7ea), at(box(.22, .08, .01, 0x1a2a1f), 0, .06, .066)),
      conn: () => G(rot(cyl(.26, .34, 0x3a3f46), Math.PI / 2, 0, 0), ...[[-.12, .12], [.12, .12], [0, .16], [-.16, -.02], [.16, -.02], [-.08, -.12], [.08, -.12]].map(p => at(rot(cyl(.03, .08, 0xd4af37), Math.PI / 2, 0, 0), p[0], p[1], .2))),
      connDC: () => G(rot(cyl(.28, .34, 0x3a3f46), Math.PI / 2, 0, 0), ...[[-.14, .16], [.14, .16], [0, .0], [-.15, -.12], [.15, -.12]].map((p, i) => at(rot(cyl(i > 2 ? .07 : .03, .08, 0xd4af37), Math.PI / 2, 0, 0), p[0], p[1], .2))),
      cableT: () => rot(cyl(.07, 1.3, 0x20252b), 0, 0, Math.PI / 2),
      res: () => rot(G(cyl(.04, .2, 0xe8e0d0), at(cyl(.045, .02, 0xb23a2a), -.05, 0, 0)), 0, 0, Math.PI / 2),
      cells: () => { const g = new T.Group(); for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) g.add(at(box(.2, .12, .5, 0x3d6b5a), -.5 + i * .21, 0, -.3 + j * .3)); return g; },
      fuseH: () => G(rot(cyl(.05, .26, 0xe8e0d0), 0, 0, Math.PI / 2), at(rot(cyl(.06, .05, 0xb8c2cc), 0, 0, Math.PI / 2), -.14, 0, 0), at(rot(cyl(.06, .05, 0xb8c2cc), 0, 0, Math.PI / 2), .14, 0, 0)),
      shunt: () => G(box(.26, .06, .08, 0xb8c2cc), at(box(.06, .08, .1, 0xc7772e), -.1, .05, 0), at(box(.06, .08, .1, 0xc7772e), .1, .05, 0)),
      bus: (w, d) => box(w, .015, d, 0xc7772e, { metalness: .7 }),
      imdB: () => G(box(.3, .16, .2, 0xd9d4a8), at(box(.2, .04, .01, 0x1a1a1a), 0, .02, .11)),
      pole: () => G(box(.9, .6, .7, 0x6d7782), at(cyl(.07, .5, 0xdddddd), -.2, .5, 0), at(cyl(.07, .5, 0xdddddd), 0, .5, 0), at(cyl(.07, .5, 0xdddddd), .2, .5, 0))
    }; K.box = box; K.cyl = cyl; K.M = M; return K;
  };
  /* ---------- stage definitions ---------- */
  const P = (key, type, x, y, z, layer, a) => ({ key, type, x, y, z, layer, a: a || [] });
  const defs = (m) => { const dc = m === 'dc', S = [];
    S.push({ id: 'grid', zone: 'st', parts: [P('xfmrLV', 'pole', -.25, 0, 0, 0), P('meterU', 'meter', .6, 0, .2, 1)] });
    if (!dc) S.push({ id: 'evse', zone: 'st', parts: [P('spd', 'breaker', -.7, .1, -.45, 1), P('rcd', 'breaker', -.4, .1, -.45, 1), P('contAC', 'relay', -.35, .1, .2, 1), P('meterE', 'meter', .35, .1, -.4, 2), P('ctrlAC', 'pcb', .35, .3, .3, 3, [.9, .6])] });
    else S.push({ id: 'prot', zone: 'st', parts: [P('spd', 'breaker', -.7, .1, -.45, 1), P('rcd', 'breaker', -.4, .1, -.45, 1), P('contAC', 'relay', -.35, .1, .25, 1), P('emi', 'ind', .1, .1, -.3, 2), P('meterE', 'meter', .6, .1, .3, 2)] });
    if (!dc) S.push({ id: 'cable', zone: 'st', parts: [P('plug', 'conn', .7, 0, 0, 2), P('cableAC', 'cableT', -.1, 0, 0, 1), P('r6', 'res', .45, .25, 0, 3)] });
    S.push({ id: 'pfc', zone: dc ? 'st' : 'ev', parts: [P('heat', 'heat', 0, -.2, 0, 0, [1.6, 1.1]), ...(dc ? [P('sic', 'mod', -.5, -.1, -.3, 1), P('sic', 'mod', -.5, -.1, .05, 1), P('sic', 'mod', -.5, -.1, .4, 1)] : [P('sic', 'mod', -.55, -.1, -.2, 1), P('sic', 'mod', -.55, -.1, .25, 1)]), P('boostL', 'ind', .15, .05, -.3, 2), P('boostL', 'ind', .15, .05, .1, 2), ...(dc ? [P('boostL', 'ind', .15, .05, .5, 2)] : []), P('emi', 'film', .6, .1, -.4, 2), P('curS', 'shunt', -.1, .05, .55, 2), P('drv', 'pcb', -.5, .25, 0, 3, [.5, .8]), P('mcu', 'pcb', .3, .45, .25, 4, [.8, .5])] });
    S.push({ id: 'dclink', zone: dc ? 'st' : 'ev', parts: [P('bus', 'bus', 0, -.05, 0, 1, [1.5, 1.0]), ...rng(dc ? 8 : 6, i => P('dcCap', 'cap', -.55 + (i % 4) * .37, .1, -.3 + Math.floor(i / 4) * .55, 2)), P('bleed', 'res', .6, .05, .6, 2)] });
    S.push({ id: 'dcdc', zone: dc ? 'st' : 'ev', parts: [P('heat', 'heat', 0, -.2, 0, 0, [1.7, 1.2]), P('pBr', 'mod', -.6, -.1, -.3, 1), P('pBr', 'mod', -.6, -.1, .15, 1), P('Lr', 'ind', -.2, .05, .5, 2), P('hfT', 'xfmr', .05, .25, -.1, 2), P('rectS', 'mod', .65, -.1, -.3, 1), P('rectS', 'mod', .65, -.1, .15, 1), P('mcu', 'pcb', .3, .6, .4, 4, [.8, .5])] });
    S.push({ id: 'out', zone: dc ? 'st' : 'ev', parts: [P('Lo', 'ind', -.6, .05, -.3, 2), P('Co', 'cap', -.2, .1, -.3, 2), P('Co', 'cap', .0, .1, -.3, 2), P('contDC', 'relay', .5, .1, -.3, 1), P('contDC', 'relay', .5, .1, .15, 1), P('fuse', 'fuseH', -.2, .05, .35, 2), ...(dc ? [P('imd', 'imdB', .1, .1, .45, 3), P('shunt', 'shunt', -.6, .05, .35, 2)] : [])] });
    if (dc) S.push({ id: 'cable', zone: 'st', parts: [P('plugDC', 'connDC', .7, 0, 0, 2), P('cableDC', 'cableT', -.1, 0, 0, 1)] });
    S.push({ id: 'batt', zone: 'ev', big: 1, parts: [P('coolP', 'heat', 0, -.25, 0, 0, [1.9, 1.3]), P('cells', 'cells', -.1, 0, 0, 1), P('bmsB', 'pcb', .45, .3, .45, 3, [.7, .45]), P('contB', 'relay', .7, .1, -.35, 2), P('preR', 'res', .7, .1, .1, 2), P('shunt', 'shunt', -.7, .12, .55, 2)] });
    return S; };
  const SP = 2.35;
  function rebuild() {
    if (!api) return; const T = api.T, K = kit(T);
    if (world) { api.pivot.remove(world); world.traverse(o => { o.geometry && o.geometry.dispose(); }); }
    world = new T.Group(); api.pivot.add(world); stageObjs = []; parts = []; fl = [];
    const D = defs(mode), n = D.length; const lbl = (txt, col) => { const c = document.createElement('canvas'); c.width = 320; c.height = 64; const g = c.getContext('2d'); g.fillStyle = 'rgba(255,255,255,.92)'; g.beginPath(); g.roundRect ? g.roundRect(2, 8, 316, 48, 12) : g.rect(2, 8, 316, 48); g.fill(); g.fillStyle = '#14202E'; g.font = '700 25px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(txt, 160, 33); const s = new T.Sprite(new T.SpriteMaterial({ map: new T.CanvasTexture(c), transparent: true, depthTest: false })); s.scale.set(2.2, .44, 1); s.renderOrder = 9; return s; };
    D.forEach((d, i) => {
      const W = d.big ? 2.2 : 2.0, Hh = d.big ? 1.0 : .9, Dd = d.big ? 1.6 : 1.5, g = new T.Group(); g.userData = { st: d, base: i };
      const shell = new T.Mesh(new T.BoxGeometry(W, Hh + .2, Dd), K.M(d.zone === 'st' ? 0x5b86c7 : 0xd17a3a, { transparent: true, opacity: .92, metalness: .1, roughness: .8 })); shell.position.y = .1; shell.userData = { kind: 'shell', stage: d.id, d }; g.add(shell);
      const base = K.box(W + .06, .06, Dd + .06, 0x39424d); base.position.y = -.4; g.add(base);
      const pl = []; d.parts.forEach(p => { let o; const a = p.a; o = p.type === 'heat' || p.type === 'pcb' || p.type === 'bus' ? K[p.type](a[0], a[1]) : K[p.type](); o.position.set(p.x, p.y, p.z); const info_ = INFO[p.key]; const ref = { kind: 'part', key: p.key, name: info_ ? info_[0] : p.key, stage: d.id, group: o, hx: p.x, hy: p.y, hz: p.z, layer: p.layer }; o.traverse(m => { if (m.isMesh) { m.userData.ref = ref; m.material = m.material.clone(); m.userData.base = m.material.emissive.clone(); } }); g.add(o); pl.push(ref); parts.push(ref); });
      const lb = lbl(STAGE[d.id][0]); lb.position.set(0, 1.35, 0); g.add(lb); g.userData.label = lb; g.userData.shell = shell; g.userData.pl = pl; g.userData.base = base; world.add(g); stageObjs.push(g);
    });
    // zones & flow
    const stN = D.filter(x => x.zone === 'st').length;
    const zmat = c => new T.MeshBasicMaterial({ color: c, transparent: true, opacity: .13, side: T.DoubleSide, depthWrite: false });
    zones = [new T.Mesh(new T.PlaneGeometry(1, 1), zmat(0x3b7be0)), new T.Mesh(new T.PlaneGeometry(1, 1), zmat(0xe0773b))]; zones.forEach(z => { z.rotation.x = -Math.PI / 2; z.position.y = -.5; world.add(z); });
    const zl = [lbl('CHARGING STATION'), lbl('VEHICLE')]; zl.forEach((s, i) => { s.scale.set(2.6, .52, 1); world.add(s); }); zones.lbl = zl; zones.stN = stN;
    const fm = [new T.MeshBasicMaterial({ color: 0xa06bff }), new T.MeshBasicMaterial({ color: 0x3d8bff }), new T.MeshBasicMaterial({ color: 0x25d08a })];
    for (let i = 0; i < 40; i++) { const s = new T.Mesh(new T.SphereGeometry(.07, 10, 10), fm[0]); s.userData.fm = fm; world.add(s); fl.push(s); }
    chips.innerHTML = ''; D.forEach((d, i) => chips.append(h('button', { class: 'btn', onclick: () => { selStage = d.id; selPart = null; focus(); showInfo(); } }, STAGE[d.id][0])));
    layout(1); focus(); showInfo();
  }
  const sx = i => (i - (stageObjs.length - 1) / 2) * SP * (1 + .7 * curE);
  function layout(snap) {
    const e = curE, n = stageObjs.length;
    stageObjs.forEach((g, i) => { g.position.set(sx(i), 0, 0); const sel = selStage === g.userData.st.id; const open = sel || xray || (e > .35 && !selStage); const sh = g.userData.shell; sh.material.opacity += ((open ? .1 : .92) - sh.material.opacity) * (snap ? 1 : .15); sh.userData.pick = !open; g.userData.pl.forEach(r => { const f = e * (sel ? 1.25 : 1); r.group.position.set(r.hx * (1 + .3 * f), r.hy + r.layer * .6 * f, r.hz * (1 + .3 * f)); });
      g.userData.label.position.y = 1.35 + 4 * e * 0 + (sel ? 0 : 0); g.userData.base.position.y = -.4; });
    const st = stageObjs.map((g, i) => [g.userData.st.zone, i]); const a = st.filter(x => x[0] === 'st').map(x => sx(x[1])), b = st.filter(x => x[0] === 'ev').map(x => sx(x[1]));
    const seg = (z, xs, lab_) => { if (!xs.length) { z.visible = false; lab_.visible = false; return; } z.visible = lab_.visible = true; const lo = Math.min(...xs) - 1.2, hi = Math.max(...xs) + 1.2; z.scale.set(hi - lo, 2.6, 1); z.position.set((lo + hi) / 2, -.5, 0); lab_.position.set((lo + hi) / 2, -.2, 1.5); };
    seg(zones[0], a, zones.lbl[0]); seg(zones[1], b, zones.lbl[1]);
  }
  function focus() { const i = selStage ? stageObjs.findIndex(g => g.userData.st.id === selStage) : -1; tx = i >= 0 ? -sx(i) : 0; cam.tz = i >= 0 ? 7.5 + 5 * tgtE : 4 + stageObjs.length * 2.1; cam.move = true; }
  function showInfo(ref) {
    let html;
    if (ref) { const I = INFO[ref.key]; html = `<h3 style="margin-top:0">${I ? I[0] : ref.name}</h3><p>${I ? I[1] : ''}</p>${I ? `<button class="btn primary" onclick="go('${I[2]}')">Open the topic page</button>` : ''} <span class="cap">Part of: ${STAGE[ref.stage][0]}</span>`; }
    else if (selStage) { const S_ = STAGE[selStage]; html = `<h3 style="margin-top:0">${S_[0]}</h3><p>${S_[1]}</p><p class="cap">Now click a component inside it (capacitor, inductor, power module…). Move the Explode slider to separate the layers.</p><button class="btn primary" onclick="go('${S_[2]}')">Open the topic page</button>`; }
    else html = `<h3 style="margin-top:0">Click an ECU or a component</h3><p>${mode === 'ac' ? 'AC charging: the station is just a smart wall box. The power electronics (PFC, DC link, isolated DC-DC) live in the vehicle’s on-board charger.' : 'DC fast charging: PFC, DC link and isolated DC-DC are inside the station; the car only closes its contactor and the BMS requests voltage and current.'}</p>`;
    info.innerHTML = html;
  }
  const hint = h('p', { class: 'cap' }, 'Tip: tap an ECU to open it, tap a part for details, tap empty space to go back.');
  api = Three.mount(L.body, { label: 'AC / DC charger', cam: [0, 0, 24], zr: [3, 52], auto: false, hint: 'drag · scroll · tap parts', setup: a => {
    api = a; a.pivot.rotation.x = .38; a.pivot.rotation.y = -.25; a.scene.children.filter(c => c.isLight).forEach(l => l.intensity *= 1.1);
    const el = a.renderer.domElement, ray = new a.T.Raycaster(), v2 = new a.T.Vector2(); let down = null, hov = null;
    const pick = e => { const r = el.getBoundingClientRect(); v2.set((e.clientX - r.left) / r.width * 2 - 1, -(e.clientY - r.top) / r.height * 2 + 1); ray.setFromCamera(v2, a.camera); const meshes = []; world.traverse(o => { if (o.isMesh && o.userData && (o.userData.ref || (o.userData.kind === 'shell' && o.userData.pick))) meshes.push(o); }); const hit = ray.intersectObjects(meshes, false)[0]; return hit ? hit.object : null; };
    const paint = () => parts.forEach(r => r.group.traverse(m => { if (m.isMesh) m.material.emissive.copy(m.userData.base).add(new a.T.Color(r === selPart ? 0x6a4a00 : r === hov ? 0x1c3a66 : 0x000000)); }));
    el.addEventListener('pointerdown', e => { down = [e.clientX, e.clientY]; });
    el.addEventListener('pointerup', e => { if (!down) return; const moved = Math.hypot(e.clientX - down[0], e.clientY - down[1]) > 5; down = null; if (moved) return; const o = pick(e);
      if (!o) { selPart = null; if (selStage) { selStage = null; focus(); } showInfo(); paint(); return; }
      if (o.userData.kind === 'shell') { selStage = o.userData.stage; selPart = null; focus(); showInfo(); paint(); return; }
      selPart = o.userData.ref; if (selStage !== selPart.stage) { selStage = selPart.stage; focus(); } showInfo(selPart); paint(); });
    el.addEventListener('pointermove', e => { if (down) return; const o = pick(e); const r = o && o.userData.ref ? o.userData.ref : null; el.style.cursor = o ? 'pointer' : 'grab'; if (r !== hov) { hov = r; paint(); } });
    a.box.style.maxHeight = '660px'; a.box.style.aspectRatio = '16/11';
    rebuild();
  }, tick: (t, a) => {
    if (!world) return; curE += (tgtE - curE) * .12; layout();
    world.position.x += (tx - world.position.x) * .1; world.position.y += ((selStage ? -1.5 : -1.0) * curE - world.position.y) * .1;
    if (cam.move) { a.camera.position.z += (cam.tz - a.camera.position.z) * .1; if (Math.abs(cam.tz - a.camera.position.z) < .05) cam.move = false; }
    const xs = stageObjs.map(g => g.position.x), x0 = Math.min(...xs), x1 = Math.max(...xs), D = stageObjs.map(g => g.userData.st.id), ip = xs[D.indexOf('pfc')], id_ = xs[D.indexOf('dcdc')];
    fl.forEach((s, i) => { s.visible = flow; const f = ((i / fl.length) + t * .06) % 1, x = x0 + (x1 - x0) * f; s.position.set(x, -.45, .75); s.material = s.userData.fm[x < ip ? 0 : x < id_ ? 1 : 2]; });
  } });
  body.append(hint, info);
  H(body, `<h2>What to look for</h2><ul><li><b>AC vs DC:</b> in AC mode the ECU row <i>inside the vehicle</i> (orange) holds PFC, DC link and DC-DC; in DC mode they all sit in the station (blue) and the vehicle only has the battery and BMS.</li><li><b>DC-link capacitors:</b> compare the cap bank size here with the 100 Hz ripple formula (single-phase needs mF; three-phase much less).</li><li><b>Magnetics:</b> the boost/grid inductors set current ripple; the HF transformer provides isolation; the resonant inductor creates ZVS (PSFB) or sets power (DAB).</li><li><b>Safety chain:</b> RCD → contactor → IMD → pre-charge → DC contactors. Every one of them appears in the CCS2 sequence.</li></ul><p class="cap">Models are schematic, not manufacturer drawings: sizes and positions are illustrative.</p>`);
} });
