/* ===== Charger states, signals and fault injection ===== */
page({ id: 'charger-states', mod: 'home', title: 'Charger states & fault injection', kw: 'state machine standby precharge charge fault hvil insulation imd rcd cp state e pp unplug derating can timeout ccs2 sequence cable check welding detection emergency stop', render(body) {
  H(body, `<div class="crumb"><span>Whole-system view</span><span class="pill hot">Beyond the syllabus: how a real charger behaves</span></div><h1>Charger states, live signals and fault injection</h1>
  <p class="lede">Run a charging session, then break it. The state machine on the left reacts to the plug, the pilot signal, the vehicle's request and to faults you inject. Every signal is recorded on a 20-second logic-analyser trace, and the log explains <b>why</b> each transition happened.</p>
  <p class="cap">The <b>CP/PP levels, CCS2 message sequence, pre-charge limits and Ω/V insulation rule</b> follow IEC 61851-1/-23, ISO 15118/DIN 70121 and the course. The <b>on-board-charger internal states, timings and thresholds are a generic illustration</b> (every OEM names and tunes them differently); times are slowed down so you can watch them.</p>`);
  let kind = 'ac', speed = 1, S, hist, logL, timers, tmr = null, evN = 0;
  /* ------------------------------------------------ common helpers */
  const LOG = (txt, lv = 'i') => { evN++; logL.unshift({ t: S.t, txt, lv, n: evN }); S.marks.push({ t: S.t, n: evN, lv }); renderLog(); };
  const after = (dt, fn) => timers.push({ at: S.t + dt, fn });
  const slew = (x, tgt, rate, dt) => x < tgt ? Math.min(tgt, x + rate * dt) : Math.max(tgt, x - rate * dt);
  const Voc = s => 96 * (3.0 + 1.0 * s + .2 * Math.pow(s, 6)), VocDC = s => 2 * Voc(s);
  /* ================================================= AC ON-BOARD CHARGER ============ */
  const AC = {
    states: { OFF: [120, 40], STANDBY: [120, 150], PRECHARGE: [270, 150], 'RAMP UP': [420, 150], CHARGE: [578, 150], 'RAMP DOWN': [578, 255], FAULT: [345, 262] },
    edges: [['OFF', 'STANDBY', 'plug / PP valid'], ['STANDBY', 'OFF', 'unplug'], ['STANDBY', 'PRECHARGE', 'request + CP PWM'], ['PRECHARGE', 'RAMP UP', 'v_dc ≥ 90 %'], ['RAMP UP', 'CHARGE', 'output matched'], ['CHARGE', 'RAMP DOWN', 'stop / full'], ['RAMP DOWN', 'STANDBY', 'I = 0'], ['PRECHARGE', 'FAULT', ''], ['CHARGE', 'FAULT', 'fault'], ['FAULT', 'STANDBY', 'reset']],
    init() { return { t: 0, st: 'OFF', plug: false, req: false, evsePWM: false, evseOK: true, cpShort: false, offer: 32, S2: false, K: false, grid: true, pre: false, byp: false, outR: false, pfc: false, vdc: 0, i: 0, temp: 35, cool: true, can: true, hvil: true, iso: true, preBroken: false, dump: false, soc: .45, fault: '', latched: false, why: '', tSt: 0, tK: null, tPWM: null, canLost: null, fast: false, marks: [] }; },
    cp() { if (!S.plug) return { hi: S.grid ? 12 : 0, lo: S.grid ? 12 : 0, d: 0, L: S.grid ? 'A' : 'E' }; if (S.cpShort || !S.grid) return { hi: 0, lo: 0, d: 0, L: 'E' }; const hi = S.S2 ? 6 : 9; return S.evsePWM ? { hi, lo: -12, d: C.ampToDuty(S.offer), L: (S.S2 ? 'C' : 'B') + '2' } : { hi, lo: hi, d: 0, L: (S.S2 ? 'C' : 'B') + '1' }; },
    go(st, why, lv) { if (S.st === st) return; S.st = st; S.tSt = S.t; S.why = why || ''; LOG(`→ <b>${st}</b>${why ? ': ' + why : ''}`, lv || (st === 'FAULT' ? 'f' : 'i')); },
    fault(msg, latched = true) { S.i = 0; S.pfc = false; S.outR = false; S.byp = false; S.pre = false; S.S2 = false; S.fault = msg; S.latched = latched; AC.go('FAULT', msg + (latched ? ' (latched: fix it, then Reset)' : ' (auto-recovers)'), 'f'); },
    step(dt) {
      const cp = AC.cp(), Vb = Voc(S.soc), Vac = 230 * Math.SQRT2, active = ['PRECHARGE', 'RAMP UP', 'CHARGE', 'RAMP DOWN'].includes(S.st);
      /* --- EVSE (station) behaviour --- */
      if (S.plug && S.evseOK && !S.cpShort && S.grid) { if (!S.evsePWM && S.tPWM == null) { S.tPWM = S.t + 1; } if (!S.evsePWM && S.tPWM != null && S.t >= S.tPWM) { S.evsePWM = true; LOG(`EVSE: CP state B1 → <b>B2</b>, PWM ${C.ampToDuty(S.offer).toFixed(0)} % = ${S.offer} A available`); } }
      else { if (S.evsePWM && !S.plug) LOG('EVSE: plug removed → CP back to +12 V (state A)'); else if (S.evsePWM) LOG(!S.grid ? 'EVSE: no utility power → CP 0 V (<b>state E</b>), contactor open' : S.cpShort ? 'EVSE: CP at 0 V = <b>state E</b> (CP shorted to PE) → stops PWM, opens contactor' : 'EVSE: not available → stops PWM, opens contactor', 'w'); S.evsePWM = false; S.tPWM = null; }
      const wantK = S.evsePWM && cp.hi === 6;
      if (wantK && !S.K) { if (S.tK == null) S.tK = S.t + .3; else if (S.t >= S.tK) { S.K = true; LOG('EVSE: CP = <b>C2</b> (+6 V) → AC contactor closes'); } }
      if (!wantK) { if (S.K) LOG('EVSE: AC contactor opens', 'i'); S.K = false; S.tK = null; }
      const acIn = S.K && S.grid;
      /* --- physics --- */
      if (acIn && S.pre && !S.byp) S.vdc += ((S.preBroken ? 25 : Vac) - S.vdc) * dt / .25;
      else if (acIn && S.byp && S.pfc) S.vdc = slew(S.vdc, 400, 220, dt);
      else S.vdc = Math.max(0, S.vdc - S.vdc * dt / (S.st === 'FAULT' || S.st === 'STANDBY' || S.st === 'OFF' ? .35 : 1.2));
      if (S.dump && S.outR) S.vdc = Math.min(520, S.vdc + 900 * dt);
      const Imax = 7400 * .93 / Vb, Iac = S.offer * 230 * .93 / Vb, derate = S.temp < 75 ? 1 : Math.max(0, (90 - S.temp) / 15);
      let tgt = 0;
      if (S.st === 'CHARGE') { tgt = Math.min(Imax, Iac) * derate; if (S.soc > .8) tgt *= Math.max(.06, Math.exp(-(S.soc - .8) / .07)); }
      S.i = S.st === 'FAULT' || !acIn && S.st !== 'RAMP DOWN' ? 0 : slew(S.i, tgt, S.fast ? 2000 : (S.st === 'RAMP DOWN' ? 40 : 12), dt);
      if (S.st === 'CHARGE') S.soc = Math.min(1, S.soc + S.i / Imax * .006 * dt);
      const heat = S.i / Imax; S.temp = S.cool ? S.temp + ((38 + 30 * heat) - S.temp) * dt / 6 : S.temp + (1.2 + 3 * heat) * dt;
      /* --- OBC state machine --- */
      const fl = !S.hvil ? 'HVIL loop open (a HV connector or cover is open)' : !S.iso ? 'Insulation fault: HV-to-chassis resistance too low' : S.vdc > 470 ? 'Output / DC-link over-voltage (load dump)' : S.temp > 90 ? 'Over-temperature (> 90 °C)' : '';
      if (fl && S.st !== 'FAULT' && (active || S.st === 'STANDBY')) { if (fl.startsWith('Over-t')) AC.fault(fl, false); else AC.fault(fl, true); }
      if (S.can) S.canLost = null; else if (S.canLost == null) S.canLost = S.t;
      switch (S.st) {
        case 'OFF': if (S.plug) AC.go('STANDBY', 'PP resistor detected → OBC wakes up, self-test'); break;
        case 'STANDBY':
          S.S2 = false; S.pre = S.byp = S.pfc = S.outR = false;
          if (!S.plug) { if (S.t - S.tSt > .5) AC.go('OFF', 'plug removed → sleep'); break; }
          if (S.req && S.evsePWM && S.can && S.hvil && S.iso && S.temp < 70 && S.t - S.tSt > .6) { S.S2 = true; AC.go('PRECHARGE', 'charge requested, CP PWM valid, checks passed → EV closes S2'); }
          break;
        case 'PRECHARGE':
          S.S2 = true; if (S.K && !S.pre && !S.byp) { S.pre = true; S.tPre = S.t; LOG('OBC: pre-charge relay closes (inrush limited by resistor)'); }
          if (!S.evsePWM) { AC.go('STANDBY', 'CP PWM lost'); break; }
          if (S.pre && S.vdc > .9 * Vac) { S.byp = true; S.pre = false; LOG('OBC: bypass relay closes, pre-charge resistor shorted'); S.pfc = true; AC.go('RAMP UP', 'DC link pre-charged to ' + S.vdc.toFixed(0) + ' V'); }
          else if (S.pre && S.t - S.tPre > 2.5) AC.fault('Pre-charge timeout: DC link stuck at ' + S.vdc.toFixed(0) + ' V', true);
          if (!S.req) AC.go('RAMP DOWN', 'request withdrawn');
          break;
        case 'RAMP UP':
          if (!acIn) { AC.go('STANDBY', 'AC input lost during start-up'); break; }
          if (S.vdc > 395 && !S.outR) { S.outR = true; LOG(`OBC: PFC at 400 V; DC-DC soft-starts, output relay closes at |V<sub>out</sub> − V<sub>bat</sub>| &lt; 5 V`); AC.go('CHARGE', 'power stage running'); }
          break;
        case 'CHARGE':
          if (!acIn) { S.i = 0; S.pfc = false; S.outR = false; S.byp = false; AC.go('STANDBY', S.grid ? 'AC contactor opened by EVSE' : 'grid outage: AC under-voltage → stop, wait for grid', 'w'); break; }
          if (!S.req) { AC.go('RAMP DOWN', 'stop requested by vehicle (HCU/BMS)'); break; }
          if (S.soc >= .995) { S.req = false; AC.go('RAMP DOWN', 'battery full (CV current below cut-off)'); break; }
          if (S.canLost != null && S.t - S.canLost > .5) { AC.go('RAMP DOWN', 'CAN timeout: no command from HCU for 0.5 s', 'w'); break; }
          if (S.temp >= 75 && !S.derLog) { S.derLog = 1; LOG('Thermal derating: current limited linearly 75 → 90 °C', 'w'); } if (S.temp < 72) S.derLog = 0;
          break;
        case 'RAMP DOWN':
          if (S.i < .3) { S.i = 0; S.outR = false; S.pfc = false; S.byp = false; S.S2 = false; S.fast = false; LOG('OBC: output relay opens, EV opens S2 (CP back to +9 V)'); AC.go('STANDBY', 'current at zero'); }
          break;
        case 'FAULT':
          S.S2 = false; S.i = 0;
          if (!S.latched && S.temp < 65) { S.fault = ''; AC.go('STANDBY', 'temperature back below 65 °C → recover'); }
          break;
      }
      if (S.cpShort && active) { S.i = 0; }
    },
    lanes: [
      { n: 'State', k: 'state' },
      { n: 'CP pin', k: 'cp' },
      { n: 'PP / plug', k: 'dig', f: s => s.plug, c: '--ch-x' },
      { n: 'S2 (EV)', k: 'dig', f: s => s.S2, c: '--ch-b' },
      { n: 'AC contactor', k: 'dig', f: s => s.K, c: '--ch-v' },
      { n: 'Pre-charge rly', k: 'dig', f: s => s.pre, c: '--warn' },
      { n: 'Bypass rly', k: 'dig', f: s => s.byp, c: '--ch-d' },
      { n: 'Output rly', k: 'dig', f: s => s.outR, c: '--ch-d' },
      { n: 'DC link', k: 'ana', f: s => s.vdc, min: 0, max: 520, u: 'V', c: '--ch-v', ref: [[325, '√2·230'], [400, '400']] },
      { n: 'I to battery', k: 'ana', f: s => s.i, min: 0, max: 22, u: 'A', c: '--ch-i' },
      { n: 'Temperature', k: 'ana', f: s => s.temp, min: 20, max: 100, u: '°C', c: '--bad', ref: [[75, 'derate'], [90, 'trip']] }
    ],
    events: [
      ['plug', 'Plug in', () => { if (!S.plug) { S.plug = true; LOG('Cable plugged: PP resistor 220 Ω → 32 A cable'); } }],
      ['req', 'Request charge (HCU)', () => { S.req = true; LOG('HCU/BMS: charge request = 1'); }],
      ['stop', 'Stop charge', () => { S.req = false; LOG('HCU/BMS: charge request = 0'); }],
      ['unplug', 'Unplug', () => { if (!S.plug) return; if (['PRECHARGE', 'RAMP UP', 'CHARGE'].includes(S.st)) { LOG('Plug release pressed: PP changes → OBC forces current to 0 before the pins separate', 'w'); S.req = false; S.fast = true; AC.go('RAMP DOWN', 'PP change detected'); after(.4, () => { S.plug = false; LOG('Plug removed'); }); } else { S.plug = false; S.req = false; LOG('Plug removed'); } }],
      ['offer', 'EVSE lowers offer to 16 A', () => { S.offer = S.offer === 32 ? 16 : 32; LOG(`EVSE changes PWM to ${C.ampToDuty(S.offer).toFixed(1)} % → ${S.offer} A (load management)`); }]
    ],
    faults: [
      ['hvil', 'HVIL open', s => !s.hvil, v => { S.hvil = !v; LOG(v ? 'Injected: HVIL loop broken' : 'HVIL loop restored', v ? 'f' : 'i'); }, 'Interlock wire through every HV connector. Open loop → gates blocked and relays opened within milliseconds, latched.'],
      ['iso', 'Insulation fault', s => !s.iso, v => { S.iso = !v; LOG(v ? 'Injected: HV+ to chassis resistance drops (IMD alarm)' : 'Insulation restored', v ? 'f' : 'i'); }, 'Vehicle insulation monitor sees low R between HV and chassis → shock risk → shutdown, latched.'],
      ['rcd', 'RCD trip (EVSE)', s => !s.evseOK, v => { S.evseOK = !v; LOG(v ? 'Injected: residual current > 30 mA AC / 6 mA DC → EVSE RCD trips' : 'EVSE reset by operator', v ? 'f' : 'i'); }, 'Protection is in the station. The OBC only sees its AC input disappear.'],
      ['cpE', 'CP short to PE', s => s.cpShort, v => { S.cpShort = v; LOG(v ? 'Injected: CP shorted to PE (0 V)' : 'CP short removed', v ? 'f' : 'i'); }, 'CP at 0 V is state E. The EVSE must stop and open its contactor.'],
      ['grid', 'Grid outage', s => !s.grid, v => { S.grid = !v; LOG(v ? 'Injected: grid outage' : 'Grid restored: charging resumes automatically if still requested', v ? 'w' : 'i'); }, 'Not a fault of the charger: it stops, waits and restarts by itself.'],
      ['cool', 'Coolant pump failure', s => !s.cool, v => { S.cool = !v; LOG(v ? 'Injected: coolant flow lost, heatsink heating up' : 'Cooling restored', v ? 'w' : 'i'); }, 'Watch the temperature: derating from 75 °C, trip at 90 °C, recovery below 65 °C.'],
      ['can', 'CAN timeout', s => !s.can, v => { S.can = !v; LOG(v ? 'Injected: HCU messages stop arriving' : 'CAN messages back', v ? 'w' : 'i'); }, 'No valid command for longer than the timeout → controlled stop, not a hard trip.'],
      ['pre', 'Broken pre-charge resistor', s => s.preBroken, v => { S.preBroken = v; LOG(v ? 'Injected: pre-charge path open' : 'Pre-charge path repaired', v ? 'w' : 'i'); }, 'DC link never reaches its threshold → pre-charge timeout fault. Try it before requesting charge.'],
      ['dump', 'Battery contactor opens (load dump)', s => s.dump, v => { S.dump = v; LOG(v ? 'Injected: HV battery disconnected under load' : 'Battery reconnected', v ? 'f' : 'i'); }, 'The output loses its load, energy in the inductors pumps the voltage up → over-voltage trip.']
    ],
    reset() { if (S.st === 'FAULT' && S.latched) { const still = !S.hvil || !S.iso || S.vdc > 470 || S.dump; if (still) { LOG('Reset refused: fault condition still present', 'w'); return; } S.fault = ''; S.latched = false; AC.go('STANDBY', 'latched fault cleared by reset'); } },
    script: [[0, 'plug'], [2, 'req'], [16, 'stop'], [19, 'unplug']],
    info: {
      OFF: ['Sleeping, only wake-up circuits powered.', 'Wake sources: PP (plug inserted), CP edge, CAN wake-up, ignition.', 'PP valid → STANDBY.'],
      STANDBY: ['Awake, all relays open, power stage off. Reads PP (cable rating), CP (state, duty → current), HVIL, insulation, temperatures, CAN.', 'Conditions to start: charge request from HCU/BMS, CP in B2 with valid duty, no faults, temperature OK.', 'Start → PRECHARGE (EV closes S2) · unplug → OFF.'],
      PRECHARGE: ['EV closed S2 → CP = +6 V (C2) → EVSE closes its contactor. The DC-link capacitor charges through a resistor to ≈ √2·230 = 325 V so the inrush current stays small.', 'Watches: v<sub>dc</sub> rising, timeout.', 'v<sub>dc</sub> ≥ 90 % of peak → bypass relay closes → RAMP UP · timeout → FAULT.'],
      'RAMP UP': ['PFC starts and boosts the DC link to 400 V, then the DC-DC soft-starts and matches the battery voltage before the output relay closes.', 'Watches: v<sub>dc</sub> regulation, output-voltage match.', 'Matched → CHARGE.'],
      CHARGE: ['Power flows. Current limit = min(CP offer, OBC rating, BMS CC/CV request, thermal derating).', 'Watches: HVIL, insulation, over-voltage, temperature, CAN timeout, CP/PP, AC input.', 'Stop / full / CAN timeout → RAMP DOWN · hard fault → FAULT · AC lost → STANDBY.'],
      'RAMP DOWN': ['Current is ramped to zero before any relay opens (relays must not break DC current). Then S2 opens and the EVSE opens its contactor.', 'Watches: current = 0.', '→ STANDBY.'],
      FAULT: ['Gates blocked, all relays open, S2 open. The fault is stored with a diagnostic code.', 'Latched faults (HVIL, insulation, over-voltage, pre-charge) need the cause removed and a reset. Over-temperature recovers by itself.', 'Reset / recovery → STANDBY.']
    }
  };
  /* ================================================= DC FAST CHARGING (CCS2) ============ */
  const SEQ = ['A', 'B1', 'SLAC', 'SDP + TLS', 'Session & auth', 'ChargeParam', 'CableCheck', 'PreCharge', 'CurrentDemand', 'PowerDelivery stop', 'WeldingDetection', 'SessionStop', 'ABORT'];
  const DUR = { SLAC: 1.6, 'SDP + TLS': .8, 'Session & auth': 1.2, ChargeParam: .7, CableCheck: 2.2, WeldingDetection: 1.2, SessionStop: .6 };
  const DC = {
    states: Object.fromEntries(SEQ.map((n, i) => n === 'ABORT' ? [n, [375, 270]] : [n, i < 6 ? [62 + i * 125, 45] : [687 - (i - 6) * 125, 160]])),
    edges: SEQ.slice(0, 11).map((n, i) => [n, SEQ[i + 1], '']).concat([['SessionStop', 'B1', ''], ['CurrentDemand', 'ABORT', 'fault'], ['CableCheck', 'ABORT', ''], ['PreCharge', 'ABORT', '']]),
    init() { return { t: 0, st: 'A', plug: false, pwm5: false, plc: false, S2: false, v: 0, i: 0, evK: false, imd: 5000, temp: 35, soc: .3, isoBad: false, plcLost: false, estop: false, welded: false, preFail: false, req: false, tSt: 0, why: '', fault: '', marks: [], vEV: 0 }; },
    go(st, why, lv) { if (S.st === st) return; S.st = st; S.tSt = S.t; S.why = why || ''; LOG(`→ <b>${st}</b>${why ? ': ' + why : ''}`, lv || (st === 'ABORT' ? 'f' : 'i')); },
    abort(msg) { S.i = 0; S.fault = msg; S.req = false; DC.go('ABORT', msg, 'f'); after(.4, () => { S.evK = false; LOG('EV opens its DC contactors (current already zero)', 'w'); }); },
    cp() { if (!S.plug) return { hi: 12, lo: 12, d: 0, L: 'A' }; const hi = S.S2 ? 6 : 9; return S.pwm5 ? { hi, lo: -12, d: 5, L: (S.S2 ? 'C' : 'B') + '2' } : { hi, lo: hi, d: 0, L: (S.S2 ? 'C' : 'B') + '1' }; },
    step(dt) {
      const Vb = VocDC(S.soc), el = S.t - S.tSt, Ibat = Math.min(300, 150000 / Math.max(Vb, 1));
      S.imd = S.isoBad ? 40 : 5000; // kΩ, 800 V system → 100 Ω/V = 80 kΩ
      if (!S.estop) S.estopHit = false; if (S.estop && !S.estopHit && !['A', 'B1', 'ABORT', 'SessionStop', 'WeldingDetection'].includes(S.st)) { S.estopHit = true; S.i = 0; S.v = 0; DC.abort('Emergency stop pressed at the station: output disabled immediately'); }
      if (S.plcLost && S.plc) { S.plc = false; LOG('PLC link lost (no V2G message within timeout)', 'w'); if (['CurrentDemand', 'PreCharge', 'CableCheck'].includes(S.st)) DC.abort('Communication timeout: EVSE shuts down output'); }
      switch (S.st) {
        case 'A': S.v = 0; if (S.plug) DC.go('B1', 'plug detected: CP +9 V (no PWM yet)'); break;
        case 'B1': if (!S.plug) { DC.go('A', 'unplugged'); break; } if (el > .8 && !S.plcLost && !S.estop && !S.done) { S.pwm5 = true; DC.go('SLAC', 'EVSE sets <b>5 % PWM</b> = digital communication; state B2. SLAC starts'); } break;
        case 'SLAC': if (S.plcLost) { if (el > 3) DC.abort('SLAC failed: no matching response'); break; } if (el > DUR.SLAC) { S.plc = true; LOG('SLAC: 3 × CM_START_ATTEN_CHAR, 10 M-SOUNDs × 58 groups → lowest attenuation EVSE chosen, logical link set'); DC.go('SDP + TLS', 'IPv6 link-local (SLAAC), UDP SDP request → SECC IP/port, TCP (+ TLS) socket'); } break;
        case 'SDP + TLS': if (el > DUR['SDP + TLS']) DC.go('Session & auth', 'SupportedAppProtocol, SessionSetup, ServiceDiscovery, Authorization (EIM/PnC)'); break;
        case 'Session & auth': if (el > DUR['Session & auth']) DC.go('ChargeParam', 'ChargeParameterDiscovery: EV max V/I, EVSE limits exchanged'); break;
        case 'ChargeParam': if (el > DUR.ChargeParam) { S.S2 = true; DC.go('CableCheck', 'EV closes S2 → CP +6 V (C2). EVSE tests insulation of the cable at elevated voltage'); } break;
        case 'CableCheck': S.v = el < 1.4 ? Math.min(500, S.v + 700 * dt) : slew(S.v, 0, 900, dt);
          if (el > .8 && S.imd < 80) { DC.abort(`CableCheck failed: insulation ${S.imd} kΩ &lt; 100 Ω/V × 800 V = 80 kΩ`); break; }
          if (el > DUR.CableCheck) DC.go('PreCharge', 'insulation OK. EVSE matches battery voltage with I ≤ 2 A'); break;
        case 'PreCharge': S.v = slew(S.v, S.preFail ? Vb - 60 : Vb, 450, dt); S.i = Math.min(2, S.i + 4 * dt);
          if (Math.abs(S.v - Vb) < 20 && el > .6) { S.evK = true; S.i = 0; LOG(`|V<sub>EVSE</sub> − V<sub>bat</sub>| = ${Math.abs(S.v - Vb).toFixed(0)} V &lt; 20 V → EV closes its DC contactors`); DC.go('CurrentDemand', 'PowerDelivery(start). EV sends CurrentDemandReq every ~100 ms'); S.req = true; }
          else if (el > 3) DC.abort('PreCharge timeout: EVSE could not reach the battery voltage within 20 V'); break;
        case 'CurrentDemand': { S.v = Vb + S.i * .02; let tgt = Ibat; if (S.soc > .8) tgt *= Math.max(.05, Math.exp(-(S.soc - .8) / .07)); if (S.temp > 80) tgt *= Math.max(.2, (95 - S.temp) / 15);
          S.i = slew(S.i, S.req ? tgt : 0, 150, dt); S.soc = Math.min(1, S.soc + S.i / 300 * .01 * dt); S.temp += ((40 + 45 * (S.i / 300) ** 2 * (S.hot ? 2.2 : 1)) - S.temp) * dt / 4;
          if (S.imd < 80) { DC.abort('Insulation fault during charging → emergency shutdown'); break; }
          if (S.soc >= .99) S.req = false;
          if (!S.req) DC.go('PowerDelivery stop', S.soc >= .99 ? 'target SOC reached' : 'stop requested'); break; }
        case 'PowerDelivery stop': S.i = slew(S.i, 0, 400, dt); if (S.i === 0) { S.evK = false; DC.go('WeldingDetection', 'current zero → EV opens contactors, then checks that the inlet voltage collapses'); } break;
        case 'WeldingDetection': S.v = S.welded ? Vb : slew(S.v, 0, 600, dt); if (el > DUR.WeldingDetection) { if (S.welded) { DC.abort('WeldingDetection: inlet still at ' + Vb.toFixed(0) + ' V → an EV contactor is <b>welded</b>. Error stored; the vehicle must not treat the inlet as dead'); break; } DC.go('SessionStop', 'SessionStopReq, TCP closed'); } break;
        case 'SessionStop': if (el > DUR.SessionStop) { S.S2 = false; S.pwm5 = false; S.plc = false; S.done = true; DC.go('B1', 'EV opens S2, EVSE stops PWM. Safe to unplug'); } break;
        case 'ABORT': S.i = 0; S.v = S.welded && S.fault.startsWith('Welding') ? Vb : slew(S.v, 0, 600, dt); if (el > 1.2 && S.S2) { S.S2 = false; S.pwm5 = false; LOG('EV opens S2; session ended with error code'); } if (!S.plug) DC.go('A', 'unplugged after error'); break;
      }
      if (S.st !== 'CurrentDemand') S.temp += (35 - S.temp) * dt / 8;
    },
    lanes: [
      { n: 'State', k: 'state' },
      { n: 'CP pin', k: 'cp' },
      { n: 'PLC link', k: 'dig', f: s => s.plc, c: '--ch-x' },
      { n: 'S2 (EV)', k: 'dig', f: s => s.S2, c: '--ch-b' },
      { n: 'EV contactors', k: 'dig', f: s => s.evK, c: '--ch-d' },
      { n: 'EVSE V out', k: 'ana', f: s => s.v, min: 0, max: 900, u: 'V', c: '--ch-v', ref: [[500, 'cable check']] },
      { n: 'Current', k: 'ana', f: s => s.i, min: 0, max: 320, u: 'A', c: '--ch-i' },
      { n: 'Insulation', k: 'ana', f: s => Math.min(s.imd, 400), min: 0, max: 400, u: 'kΩ', c: '--ch-x', ref: [[80, '100 Ω/V']] },
      { n: 'Connector T', k: 'ana', f: s => s.temp, min: 20, max: 100, u: '°C', c: '--bad', ref: [[80, 'derate']] }
    ],
    events: [
      ['plug', 'Plug in', () => { if (!S.plug) { S.plug = true; LOG('CCS2 connector plugged, latched'); } }],
      ['stop', 'Stop (EV request)', () => { if (S.st === 'CurrentDemand') { S.req = false; LOG('EV: ChargeProgress = Stop'); } }],
      ['unplug', 'Unplug', () => { if (!S.plug) return; if (!['A', 'B1', 'ABORT'].includes(S.st)) { LOG('Connector is locked during the session: stop first', 'w'); return; } S.plug = false; S.S2 = false; S.pwm5 = false; S.done = false; LOG('Connector removed'); }]
    ],
    faults: [
      ['iso', 'Insulation fault', s => s.isoBad, v => { S.isoBad = v; LOG(v ? 'Injected: DC+ to PE insulation 40 kΩ' : 'Insulation restored', v ? 'f' : 'i'); }, 'Inject before CableCheck → session never energises. Inject during charging → emergency shutdown.'],
      ['plc', 'PLC comms lost', s => s.plcLost, v => { S.plcLost = v; if (!v && S.plug && ['B1'].includes(S.st)) LOG('PLC available again'); else if (v) LOG('Injected: PLC modem stops responding', 'w'); }, 'Without CurrentDemand messages the EVSE must stop output: no blind charging.'],
      ['estop', 'Emergency stop', s => s.estop, v => { S.estop = v; if (v) LOG('Injected: mushroom button pressed', 'f'); }, 'Hardware path: output off immediately, no handshake.'],
      ['pre', 'EVSE cannot match voltage', s => s.preFail, v => { S.preFail = v; LOG(v ? 'Injected: EVSE voltage regulation limited (60 V short)' : 'Regulation fixed', v ? 'w' : 'i'); }, 'ΔV never falls below 20 V → PreCharge timeout. Contactors never close on a big voltage step.'],
      ['weld', 'Welded EV contactor', s => s.welded, v => { S.welded = v; LOG(v ? 'Injected: one EV contactor will stay closed' : 'Contactor replaced', v ? 'f' : 'i'); }, 'Only visible at the end: WeldingDetection sees battery voltage on the inlet.'],
      ['hot', 'Hot connector pin', s => s.hot, v => { S.hot = v; LOG(v ? 'Injected: high contact resistance in a DC pin' : 'Pin cleaned', v ? 'w' : 'i'); }, 'Pin temperature sensors in the connector → current derating instead of a trip.']
    ],
    reset() { if (S.st === 'ABORT') { LOG('Unplug and plug again to start a new session', 'i'); } },
    script: [[0, 'plug'], [21, 'stop'], [27.5, 'unplug']],
    info: {
      A: ['Unplugged. CP at +12 V.', '', 'Plug → B1.'],
      B1: ['Plugged, CP +9 V. EVSE not yet signalling.', '', 'EVSE sets 5 % PWM → B2 / SLAC.'],
      SLAC: ['<b>Data-link layer.</b> Signal Level Attenuation Characterization: the EV sounds all EVSEs on the shared cable bundle and joins the one with the lowest attenuation.', '3 START_ATTEN_CHAR, 10 M-SOUND, 58 groups.', '→ SDP.'],
      'SDP + TLS': ['<b>Network/transport/application.</b> SLAAC gives the IPv6 address; SDP (UDP) finds the SECC; a TCP (optionally TLS) connection opens.', '', '→ session.'],
      'Session & auth': ['<b>Application layer (EXI-encoded).</b> Protocol agreed, session ID, services, payment: external ID or Plug & Charge certificates.', '', '→ ChargeParameterDiscovery.'],
      ChargeParam: ['Limits exchanged: EV max voltage/current, EVSE max/min voltage/current/power.', '', 'EV closes S2 → C2 → CableCheck.'],
      CableCheck: ['EVSE raises its output (here 500 V) and measures insulation to PE with its IMD. Must be above the Ω/V threshold (IEC 61851-23).', 'Insulation, output voltage.', 'OK → PreCharge · fail → abort.'],
      PreCharge: ['EVSE regulates its output to the battery voltage with the current limited to 2 A. EV closes its contactors only when the difference is below 20 V.', 'ΔV, timeout.', 'ΔV < 20 V → contactors close → CurrentDemand.'],
      CurrentDemand: ['Charging. The EV (BMS) is the master: it sends target current/voltage ~10 times per second; the EVSE follows within its limits.', 'Insulation, communication, temperatures, emergency stop.', 'Stop → PowerDelivery stop · fault → ABORT.'],
      'PowerDelivery stop': ['EVSE ramps current to zero; only then may the EV open its contactors.', '', '→ WeldingDetection.'],
      WeldingDetection: ['With contactors open, the inlet voltage must collapse. If it stays at battery voltage a contactor is welded.', '', '→ SessionStop.'],
      SessionStop: ['Session closed, TCP/TLS closed, EV opens S2, PWM off.', '', 'Unplug allowed.'],
      ABORT: ['Error stop: output off, contactors opened at zero current, error code reported.', '', 'Unplug → A.']
    }
  };
  /* ------------------------------------------------ UI */
  const M = () => kind === 'ac' ? AC : DC;
  const top = h('div', { class: 'card' }); body.append(top);
  segmented(top, [['ac', 'AC on-board charger (Type-2, Mode 3)'], ['dc', 'DC fast charging (CCS2, Mode 4)']], kind, k => { kind = k; reset(); });
  const btnRow = h('div', { class: 'evrow' }), faultRow = h('div', { class: 'evrow' }), ctlRow = h('div', { class: 'evrow' });
  top.append(h('h4', { class: 'evh' }, 'Driver / vehicle actions'), btnRow, h('h4', { class: 'evh' }, 'Inject a fault (tap again to remove)'), faultRow, ctlRow);
  const grid = h('div', { class: 'stgrid' }); body.append(grid);
  const diag = h('div', { class: 'card stdiag' }), infoC = h('div', { class: 'card stinfo' }); grid.append(diag, infoC);
  const la = lab(body, 'Logic analyser: last 20 s', 'Numbered markers match the event log. Analogue lanes show the live value on the right.');
  const cvL = h('canvas', { class: 'lanes' }); la.add(cvL);
  const grid2 = h('div', { class: 'grid2' }); body.append(grid2);
  const cpLab = lab(grid2, 'CP pin right now (oscilloscope, 3 ms)', ''); const cpS = cpLab.scope({ xmin: 0, xmax: 3, ymin: -14, ymax: 14, xt: 6, yt: 4, xl: 'ms (1 kHz)', yl: 'CP (V)', h: 190 }); const cpTxt = cpLab.add(h('p', { class: 'cap' }));
  const logLab = lab(grid2, 'Event log (newest first)', ''); const logBox = logLab.add(h('ol', { class: 'evlog' }));
  function renderLog() { logBox.innerHTML = logL.slice(0, 60).map(e => `<li class="${e.lv}"><span class="n">${e.n}</span><span class="t">${e.t.toFixed(1)} s</span><span>${e.txt}</span></li>`).join(''); }
  function buildButtons() {
    btnRow.innerHTML = ''; faultRow.innerHTML = ''; ctlRow.innerHTML = '';
    M().events.forEach(([id, l, fn]) => btnRow.append(h('button', { class: 'btn', onclick: () => { fn(); paint(); } }, l)));
    M().faults.forEach(([id, l, get, set, tip]) => { const b = h('button', { class: 'btn fbtn', title: tip, 'aria-pressed': 'false', onclick: () => { const on = b.getAttribute('aria-pressed') !== 'true'; b.setAttribute('aria-pressed', on); set(on); tipP.innerHTML = `<b>${l}:</b> ${tip}`; paint(); } }, '⚡ ' + l); faultRow.append(b); });
    const tipP = h('p', { class: 'cap', style: 'flex-basis:100%;margin:2px 0 0' }, 'Hover or tap a fault to read what it simulates.'); faultRow.append(tipP);
    ctlRow.append(h('button', { class: 'btn primary', onclick: () => runScript() }, '▶ Run a normal session'), h('button', { class: 'btn', onclick: () => { M().reset(); paint(); } }, kind === 'ac' ? 'Reset latched fault' : 'Acknowledge error'), h('button', { class: 'btn', onclick: () => reset() }, '⟲ Restart simulation'));
    segmented(ctlRow, [['.5', '½×'], ['1', '1×'], ['2', '2×']], String(speed), k => speed = +k);
  }
  function runScript() { reset(); const sc = M().script; sc.forEach(([dt, id]) => after(dt, () => { const e = M().events.find(x => x[0] === id); if (e) e[2](); })); }
  /* state diagram (SVG) */
  function drawDiag() {
    const m = M(), W = kind === 'ac' ? 660 : 750, Hh = kind === 'ac' ? 300 : 310, bw = kind === 'ac' ? 112 : 114, bh = 36;
    const edges = m.edges.map(([a, b, l]) => { const [x1, y1] = m.states[a], [x2, y2] = m.states[b]; const dx = x2 - x1, dy = y2 - y1, L = Math.hypot(dx, dy) || 1; const cx = Math.min(bw / 2, Math.abs(dy) > 1 && Math.abs(dx) < bw ? 999 : bw / 2) ; const ox = dx / L, oy = dy / L; const kx = Math.abs(ox) * bw / 2 + Math.abs(oy) * bh / 2 + 4; const off = (a === 'STANDBY' && b === 'OFF') || (a === 'OFF' && b === 'STANDBY') ? (a === 'OFF' ? -14 : 14) : 0; const sx = x1 + ox * kx + off, sy = y1 + oy * kx, ex = x2 - ox * kx + off, ey = y2 - oy * kx; const hot = S.lastEdge && S.lastEdge[0] === a && S.lastEdge[1] === b; return `<line x1="${sx}" y1="${sy}" x2="${ex}" y2="${ey}" class="se${hot ? ' hot' : ''}" marker-end="url(#ah${hot ? 'h' : ''})"/>${l ? `<text x="${(sx + ex) / 2 + (Math.abs(dy) > Math.abs(dx) ? (off < 0 ? -6 : 6) : 0)}" y="${Math.abs(dy) > Math.abs(dx) ? (sy + ey) / 2 - 5 : (sy + ey) / 2 - 24}" class="sl" text-anchor="${Math.abs(dy) > Math.abs(dx) ? (off < 0 ? 'end' : 'start') : 'middle'}">${l}</text>` : ''}`; }).join('');
    const nodes = Object.entries(m.states).map(([n, [x, y]]) => `<g class="sn${S.st === n ? ' on' : ''}${n === 'FAULT' || n === 'ABORT' ? ' bad' : ''}"><rect x="${x - bw / 2}" y="${y - bh / 2}" width="${bw}" height="${bh}" rx="9"/><text x="${x}" y="${y + 4}" text-anchor="middle">${n}</text></g>`).join('');
    const cp = m.cp();
    diag.innerHTML = `<div class="sthead"><b>State: ${S.st}</b><span class="pill">CP ${cp.L} · ${cp.hi > 0 ? '+' : ''}${cp.hi} V${cp.d ? ' PWM ' + cp.d.toFixed(0) + ' %' : ''}</span><span class="pill">t = ${S.t.toFixed(1)} s</span><span class="pill">SOC ${(S.soc * 100).toFixed(0)} %</span></div><div class="svgwrap"><svg viewBox="0 0 ${W} ${Hh}" class="stsvg ${kind}" role="img" aria-label="state diagram"><defs><marker id="ah" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="ahp"/></marker><marker id="ahh" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10z" class="ahh"/></marker></defs>${edges}${nodes}</svg></div>`;
    const I = m.info[S.st] || ['', '', ''];
    infoC.innerHTML = `<h3>${S.st}</h3><p>${I[0]}</p>${I[1] ? `<p><b>Checks:</b> ${I[1]}</p>` : ''}<p><b>Next:</b> ${I[2]}</p>${S.why ? `<p class="cap">Last transition: ${S.why}</p>` : ''}${S.fault ? `<p class="fl">Active fault: ${S.fault}</p>` : ''}`;
  }
  /* lanes */
  const STC = st => (st === 'FAULT' || st === 'ABORT') ? css('--bad') : ['CHARGE', 'CurrentDemand'].includes(st) ? css('--good') : ['OFF', 'A'].includes(st) ? css('--line') : css('--ch-v');
  function drawLanes() {
    const lanes = M().lanes, dpr = Math.min(window.devicePixelRatio || 1, 2), Wc = cvL.clientWidth || 700, LH = { state: 26, cp: 46, dig: 20, ana: 40 };
    const Hc = lanes.reduce((s, l) => s + LH[l.k] + 6, 0) + 18; if (cvL.width !== Math.round(Wc * dpr) || cvL.height !== Math.round(Hc * dpr)) { cvL.width = Math.round(Wc * dpr); cvL.height = Math.round(Hc * dpr); cvL.style.height = Hc + 'px'; }
    const g = cvL.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, Wc, Hc);
    const L0 = Wc < 520 ? 74 : 104, R0 = Wc < 520 ? 44 : 62, win = 20, t1 = Math.max(win, S.t), t0 = t1 - win, X = t => L0 + (t - t0) / win * (Wc - L0 - R0);
    const mono = css('--f-mono'), mut = css('--muted'), ink = css('--ink'), grid = css('--grid'); g.font = `600 ${Wc < 520 ? 9.5 : 10.5}px ${mono}`;
    const H2 = hist.filter(p => p.t >= t0 - .1);
    let y = 4;
    lanes.forEach((ln, li) => {
      const hh = LH[ln.k]; g.fillStyle = li % 2 ? css('--surface2') : 'transparent'; if (li % 2) g.fillRect(0, y - 2, Wc, hh + 4);
      g.fillStyle = mut; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(ln.n, 4, y + hh / 2);
      if (ln.k === 'state') { let i = 0; while (i < H2.length) { let j = i; while (j + 1 < H2.length && H2[j + 1].st === H2[i].st) j++; const xa = X(H2[i].t), xb = X(H2[j].t + .05); g.fillStyle = STC(H2[i].st); g.globalAlpha = .85; g.fillRect(xa, y, Math.max(1, xb - xa), hh); g.globalAlpha = 1; if (xb - xa > g.measureText(H2[i].st).width + 6) { g.fillStyle = ['OFF', 'A'].includes(H2[i].st) ? ink : '#fff'; g.textAlign = 'center'; g.fillText(H2[i].st, (xa + xb) / 2, y + hh / 2); } i = j + 1; } }
      else if (ln.k === 'cp') { const Y = v => y + (1 - (v + 13) / 26) * hh; g.strokeStyle = grid; [12, 9, 6, 0, -12].forEach(v => { g.beginPath(); g.moveTo(L0, Y(v)); g.lineTo(Wc - R0, Y(v)); g.stroke(); }); g.fillStyle = mut; g.textAlign = 'right'; g.font = `600 8.5px ${mono}`; [12, 6, -12].forEach(v => g.fillText(v, L0 - 3, Y(v))); g.font = `600 ${Wc < 520 ? 9.5 : 10.5}px ${mono}`;
        const col = css('--ch-v'); for (let i = 1; i < H2.length; i++) { const a = H2[i - 1], b = H2[i], xa = X(a.t), xb = X(b.t); if (a.cp.lo !== a.cp.hi) { g.fillStyle = col; g.globalAlpha = .28; g.fillRect(xa, Y(a.cp.hi), xb - xa + .5, Y(a.cp.lo) - Y(a.cp.hi)); g.globalAlpha = 1; } }
        g.strokeStyle = col; g.lineWidth = 2; g.beginPath(); H2.forEach((p, i) => { const x = X(p.t); i ? (g.lineTo(x, Y(H2[i - 1].cp.hi)), g.lineTo(x, Y(p.cp.hi))) : g.moveTo(x, Y(p.cp.hi)); }); g.stroke(); g.beginPath(); H2.forEach((p, i) => { const x = X(p.t); i ? (g.lineTo(x, Y(H2[i - 1].cp.lo)), g.lineTo(x, Y(p.cp.lo))) : g.moveTo(x, Y(p.cp.lo)); }); g.stroke(); g.lineWidth = 1;
        const last = H2[H2.length - 1]; if (last) { g.fillStyle = ink; g.textAlign = 'left'; g.fillText(last.cp.L, Wc - R0 + 4, y + hh / 2); } }
      else if (ln.k === 'dig') { const col = css(ln.c); g.strokeStyle = col; g.fillStyle = col; g.lineWidth = 2; g.beginPath(); H2.forEach((p, i) => { const v = ln.f(p) ? y + 2 : y + hh - 2, x = X(p.t); if (i) g.lineTo(x, H2[i - 1]._y); else g.moveTo(x, v); g.lineTo(x, v); p._y = v; }); g.stroke(); g.globalAlpha = .18; for (let i = 1; i < H2.length; i++) if (ln.f(H2[i - 1])) g.fillRect(X(H2[i - 1].t), y + 2, X(H2[i].t) - X(H2[i - 1].t) + .5, hh - 4); g.globalAlpha = 1; g.lineWidth = 1; const last = H2[H2.length - 1]; if (last) { g.fillStyle = ink; g.textAlign = 'left'; g.fillText(ln.f(last) ? 'ON' : 'off', Wc - R0 + 4, y + hh / 2); } }
      else { const Y = v => y + hh - 2 - (Math.max(ln.min, Math.min(ln.max, v)) - ln.min) / (ln.max - ln.min) * (hh - 4); (ln.ref || []).forEach(([v, t], ri) => { g.strokeStyle = mut; g.setLineDash([3, 3]); g.beginPath(); g.moveTo(L0, Y(v)); g.lineTo(Wc - R0, Y(v)); g.stroke(); g.setLineDash([]); g.fillStyle = mut; g.textAlign = 'left'; g.font = `600 8.5px ${mono}`; g.fillText(t, L0 + 2 + ri * 62, Y(v) - 5); g.font = `600 ${Wc < 520 ? 9.5 : 10.5}px ${mono}`; });
        g.strokeStyle = css(ln.c); g.lineWidth = 2; g.beginPath(); H2.forEach((p, i) => { const x = X(p.t), v = Y(ln.f(p)); i ? g.lineTo(x, v) : g.moveTo(x, v); }); g.stroke(); g.lineWidth = 1; const last = H2[H2.length - 1]; if (last) { g.fillStyle = ink; g.textAlign = 'left'; const v = ln.f(last); g.fillText((v >= 100 ? v.toFixed(0) : v.toFixed(1)) + ' ' + ln.u, Wc - R0 + 4, y + hh / 2); } }
      y += hh + 6;
    });
    g.strokeStyle = grid; for (let s = Math.ceil(t0 / 5) * 5; s <= t1; s += 5) { const x = X(s); g.beginPath(); g.moveTo(x, 0); g.lineTo(x, y); g.stroke(); g.fillStyle = mut; g.textAlign = 'center'; g.textBaseline = 'top'; g.fillText(s + ' s', x, y + 2); }
    S.marks.filter(m => m.t >= t0).forEach(m => { const x = X(m.t); g.strokeStyle = m.lv === 'f' ? css('--bad') : m.lv === 'w' ? css('--warn') : mut; g.setLineDash([2, 3]); g.beginPath(); g.moveTo(x, 0); g.lineTo(x, y); g.stroke(); g.setLineDash([]); g.fillStyle = g.strokeStyle; g.textAlign = 'center'; g.textBaseline = 'top'; g.font = `700 9px ${mono}`; g.fillText(m.n, x, y + 2 + 11); g.font = `600 ${Wc < 520 ? 9.5 : 10.5}px ${mono}`; });
  }
  function drawCP() {
    const cp = M().cp(), Xs = [], Ys = []; for (let k = 0; k < 3; k++) { const d = cp.lo !== cp.hi ? cp.d / 100 : 1; Xs.push(k, k + d, k + d, k + 1); Ys.push(cp.hi, cp.hi, cp.lo, cp.lo); }
    cpS.draw([{ x: Xs, y: Ys, c: '--ch-v', w: 2.6 }], { h: [[12, 'A'], [9, 'B'], [6, 'C'], [0, 'E']].map(([y, t]) => ({ y, c: '--grid' })), t: [{ x: 2.95, y: cp.hi + 1.6, s: cp.L, a: 'right', c: '--ink' }] });
    const st = { A: 'A: +12 V, no vehicle', B1: 'B1: +9 V DC, vehicle detected, EVSE not offering', B2: `B2: +9 V / −12 V PWM ${cp.d.toFixed(0)} %`, C1: 'C1: +6 V, vehicle ready, EVSE not offering', C2: `C2: +6 V / −12 V PWM ${cp.d.toFixed(0)} %, power allowed`, E: 'E: 0 V, CP shorted or EVSE unpowered' }[cp.L] || cp.L;
    cpTxt.innerHTML = st + (cp.d && cp.d !== 5 ? ` → I<sub>max</sub> = 0.6 × ${cp.d.toFixed(1)} = <b>${(cp.d * .6).toFixed(0)} A</b>` : cp.d === 5 ? ' → <b>digital communication (PLC)</b>' : '');
  }
  function paint() { drawDiag(); drawLanes(); drawCP(); }
  let prevSt = '';
  function tick() {
    const dt = .05 * speed; const sub = 4;
    for (let k = 0; k < sub; k++) {
      S.t += dt / sub; timers = timers.filter(tm => { if (tm.at <= S.t) { tm.fn(); return false; } return true; });
      const before = S.st; M().step(dt / sub); if (S.st !== before) S.lastEdge = [before, S.st];
    }
    hist.push(Object.assign({ cp: M().cp() }, S, { marks: null })); if (hist.length > 1200) hist.splice(0, hist.length - 1200);
    if (S.st !== prevSt || (S.t * 20 | 0) % 4 === 0) drawDiag(); prevSt = S.st;
    drawLanes(); drawCP();
  }
  function reset() { S = M().init(); hist = []; logL = []; timers = []; evN = 0; buildButtons(); renderLog(); LOG(kind === 'ac' ? 'Simulation start: vehicle parked, cable not plugged' : 'Simulation start: DC station idle'); paint(); }
  reset();
  tmr = setInterval(tick, 50); onLeave(() => clearInterval(tmr));
  const rs = () => drawLanes(); window.addEventListener('resize', rs); window.addEventListener('themechange', () => paint()); onLeave(() => window.removeEventListener('resize', rs));
  H(body, `<h2>Try these experiments</h2><ol class="steps">
  <li><div><b>Normal session.</b> Press <i>Run a normal session</i>. Follow CP: +12 V (A) → +9 V (B1) → PWM (B2) → +6 V PWM (C2). Note the order: S2 closes, then the EVSE contactor, then pre-charge, bypass, PFC, output relay, current. Stopping runs in reverse, and <b>current reaches zero before any relay opens</b>.</div></li>
  <li><div><b>Hard fault vs soft stop.</b> During charging inject <i>HVIL open</i> (current drops instantly, FAULT is latched, Reset is refused until you remove the fault) and compare with <i>CAN timeout</i> (controlled ramp-down, back to STANDBY).</div></li>
  <li><div><b>Who protects what.</b> <i>RCD trip</i> and <i>CP short</i> are detected by the <b>station</b>; the OBC just loses its AC input. <i>Insulation fault</i> and <i>HVIL</i> are detected by the <b>vehicle</b>.</div></li>
  <li><div><b>Derating.</b> Inject <i>Coolant pump failure</i> while charging: current falls linearly from 75 °C and trips at 90 °C, then recovers by itself below 65 °C if you restore cooling.</div></li>
  <li><div><b>DC: why CableCheck and PreCharge exist.</b> Inject <i>Insulation fault</i> before plugging in: the session stops at CableCheck and the battery is never connected. Inject <i>EVSE cannot match voltage</i>: the contactors never close on a large ΔV (W11Q10, W11Q13).</div></li>
  <li><div><b>Welded contactor.</b> Inject it during a DC session and stop: only WeldingDetection finds it, which is why that step comes after every session.</div></li></ol>
  <p class="cap">Sources: IEC 61851-1 (CP states and duty-to-current mapping), IEC 62196 (PP resistor coding), IEC 61851-23 (DC EVSE insulation monitoring, Ω/V thresholds), ISO 15118-2 / DIN SPEC 70121 (SLAC, SDP, message sequence: CableCheck, PreCharge, PowerDelivery, CurrentDemand, WeldingDetection, SessionStop), IEC 62955 (6 mA DC residual-current detection), course weeks 10-11 (pre-charge 2 A / 20 V). OBC states and all timings are illustrative.</p>`);
} });
