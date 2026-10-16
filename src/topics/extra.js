page({ id: 'qbank', mod: 'home', title: 'Question bank (all 126)', kw: 'assignment practice quiz questions wrong redo', render(body) {
  H(body, `<h1>Assignment question bank</h1><p class="lede">All weekly assignment questions (W1-W12) with reasons. Answers are marked wrong/right and remembered in this browser.</p>`);
  const tt = {}; PAGES.forEach(p => { if (p.topic) tt[p.id] = p.title; });
  QBANK.concat(window.AIQ || [], window.MOCKQ || []).forEach(q => q.topicTitle = tt[q.topic] || q.topic);
  const bar = h('div', { class: 'calc' }), inputs = h('div', { class: 'inputs' }); bar.append(inputs);
  const wk = h('select', { class: 'sel', 'aria-label': 'week' }, h('option', { value: '' }, 'All weeks'), ...Array.from({ length: 12 }, (_, i) => h('option', { value: i + 1 }, 'Week ' + (i + 1))));
  const tp = h('select', { class: 'sel', 'aria-label': 'topic' }, h('option', { value: '' }, 'All topics'), ...Object.keys(tt).map(k => h('option', { value: k }, tt[k].slice(0, 46))));
  const ty = h('select', { class: 'sel', 'aria-label': 'type' }, h('option', { value: '' }, 'All types'), h('option', { value: 'mcq' }, 'Single answer'), h('option', { value: 'msq' }, 'Multiple select'), h('option', { value: 'nat' }, 'Numerical'));
  const src = h('select', { class: 'sel', 'aria-label': 'source' }, h('option', { value: 'a' }, 'Assignments (126)'), h('option', { value: 'ai' }, 'NPTEL AI mock papers (150)'), h('option', { value: 'n' }, 'New exam-style (61)'));
  const stt = h('select', { class: 'sel', 'aria-label': 'status' }, h('option', { value: '' }, 'Any status'), h('option', { value: 'new' }, 'Not tried yet'), h('option', { value: 'wrong' }, 'Wrong so far (redo)'), h('option', { value: 'right' }, 'Correct'));
  [['Source', src], ['Week', wk], ['Topic', tp], ['Type', ty], ['Status', stt]].forEach(([l, e]) => inputs.append(h('label', {}, l, e)));
  body.append(bar); const info = h('p', { class: 'cap' }), list = h('div'), more = h('button', { class: 'btn', onclick: () => { shown += 12; draw(); } }, 'Show 12 more'); body.append(info, list, more);
  let shown = 12, cur = [];
  const pool = () => src.value === 'ai' ? (window.AIQ || []) : src.value === 'n' ? (window.MOCKQ || []) : QBANK;
  const filt = () => pool().filter(q => (!wk.value || q.wk == wk.value) && (!tp.value || q.topic === tp.value) && (!ty.value || q.type === ty.value) && (!stt.value || (stt.value === 'new' ? QPROG[q.id] === undefined : stt.value === 'wrong' ? QPROG[q.id] === 0 : QPROG[q.id] === 1)));
  function draw() { list.innerHTML = ''; cur = cur.length ? cur : filt(); cur.slice(0, shown).forEach(q => list.append(renderQuestion(q, { showTopic: true }))); more.hidden = shown >= cur.length; const a = Object.keys(QPROG).length, ok = Object.values(QPROG).filter(x => x === 1).length; info.textContent = `${cur.length} questions match. Overall: ${a}/${QBANK.length} tried, ${ok} correct.`; }
  const reset = () => { shown = 12; cur = filt(); draw(); }; [src, wk, tp, ty, stt].forEach(e => e.addEventListener('change', reset));
  const row = h('div', { class: 'nextprev', style: 'margin:10px 0' }, h('button', { class: 'btn primary', onclick: () => { cur = QBANK.slice().sort(() => Math.random() - .5).slice(0, 10); shown = 10; draw(); info.textContent = 'Random 10-question mock. ' + info.textContent; } }, 'Random 10-question mock'), h('button', { class: 'btn', onclick: () => { stt.value = 'wrong'; reset(); } }, 'Redo my wrong answers'), h('button', { class: 'btn', onclick: () => { try { localStorage.removeItem('ci:q'); } catch (e) {} Object.keys(QPROG).forEach(k => delete QPROG[k]); reset(); } }, 'Reset my progress'));
  body.insertBefore(row, bar); reset();
} });

page({ id: 'formulas', mod: 'home', title: 'Formula sheet & cheat sheet', kw: 'formula equations summary revision cheat', render(body) {
  H(body, `<h1>Formula sheet</h1><p class="lede">Everything numeric that the assignments used, in one place. Tap a topic name to open its page. Read this on the morning of the exam.</p>`);
  const G = (t, id, rows) => H(body, `<h2>${t} <button class="btn" style="font-size:.8rem;padding:3px 9px" data-go="${id}">open topic</button></h2>${TBL(['Quantity', 'Formula', 'Check value'], rows)}`);
  G('Rectifier', 'rectifier', [['Half-wave average', 'Vpk/π', '310 V peak → 98.7 V'], ['Full-wave average', '2Vpk/π', ''], ['Diode VRRM', 'Vpk', '310 V']]);
  G('Boost PFC', 'boost-pfc', [['Duty', 'd = 1 − |vs|/Vo', '265 V rms, Vo 500 → dmin 0.25'], ['Peak current', 'Ipk = √2·P/Vrms', ''], ['Inductor', 'L = Vo/(4·ΔImax·fsw)', 'W2Q8: 1.1 kW, 230 V, 450 V, 60 kHz, ΔI = 10 % of Ipk → 2.77 mH'], ['Ripple max at', '|vs| = Vo/2', '200 V'], ['Bipolar bridge', 'd = (1 + vs/Vo)/2', '']]);
  G('PFC stresses', 'pfc-stress', [['RMS of switch', 'Io·√D', '20 A, D = 0.3 → 10.95 A'], ['DC-link ripple', 'ΔVpp = P/(2π·f·Vo·C)', '3.3 kW, 400 V, 2.2 mF → 11.9 V'], ['Ripple frequency', '2 × line (1-φ)', '100 Hz; 3-φ → fsw']]);
  G('Control', 'pfc-control', [['Current-loop BW', '≫ 2fline and ≲ fsw/10', '80 kHz → 500 Hz … 8 kHz'], ['Gv(s)', '(Vs,pk/2Vo)·R/(1+sRC)', ''], ['States / inputs', 'iL, vc / d, vs', '']]);
  G('Flyback PFC', 'dcm-flyback', [['Output', 'Vo = (Vpk/n)·d/(1−d)', '230 V, d 0.12, n 0.6 → 73.9 V']]);
  G('SPWM', 'pwm', [['Fundamental peak / RMS', 'm·Vdc/2 ;  m·Vdc/(2√2)', ''], ['DC reference', 'Vavg = (vm/Vc)·Vdc', '4/5 × 200 = 160 V']]);
  G('3-phase VSC', 'vsc3', [['Inductor', 'L = √(Vc² − Vs²)/(ωIpk)', '22 kW, 400 V, 750 V, m 0.9 → 6.03 mH'], ['Ipk', '2P/(3Vs,pk)', '44.9 A'], ['Vc,pk', 'm·Vdc/2', '337.5 V']]);
  G('dq control', 'dq-control', [['PF (d on voltage)', 'id/√(id²+iq²)', 'id 8, iq 10 → 0.625'], ['PF (q on voltage)', 'iq/√(id²+iq²)', 'iq = 2id → 0.894'], ['PI zero', 'Kp/Ki = L/R', '12 mH/10 mΩ = 1.2 s']]);
  G('Forward / bridges', 'forward', [['Vo', 'n·Vin·D', '400 V, 5:2, D 0.2 → 32 V'], ['Dmax', '1/(1+Nd/Np)', 'ND = 3NP → 25 µs @10 kHz'], ['Switch stress (demag)', 'Vin(1 + Np/Nd)', ''], ['Full-bridge L', 'Vo(1−D)/(2·fsw·ΔI)', '5 mH'], ['Push-pull stress', '2Vin', '']]);
  G('Switching', 'softsw', [['Linear overlap loss', 'V·I·t/6', '200 V, 60 A, 200 ns → 400 µJ'], ['Dead-time dv/dt', 'Io/(2·Coss)', '10 A, 1 nF → 5 V/ns']]);
  G('PSFB', 'psfb', [['Output', 'n·Vin·(1 − φ/180°)', '72° → 0.6'], ['Leading dead time', '2·Coss·Vin/(n·Io)', '8 ns'], ['Duty loss', '4·Llkg·Io·fs/(n·Vin)', '10 µH for 5 %'], ['Lagging resonance', 'Ltot = 1/(ωr²·C)', '25.4 µH → extra 20.4 µH']]);
  G('DAB', 'dab', [['Power', 'Vin·Vo′·δ(π−δ)/(2π²·fs·L)', '60°, 200 V, 400 V′, 10 µH, 100 kHz → 8.89 kW'], ['Pmax', 'Vin·Vo′/(8·fs·L)', '500 W'], ['δ for P = x·Pmax', '(1 − √(1−x))/2 × 180°', '0.2 → 9.5°']]);
  G('Magnetics', 'magnetics', [['Core area', 'Ac = V·t/(N·ΔBpp)', '200'], ['Optimum ΔB (β = 2)', '(a/b)^¼', ''], ['Gapped inductor', 'L ≈ μ0N²Ac/lg', '']]);
  G('AC Type-2', 'ac-type2', [['Duty → current', '0.6 × D(%) for 10-85 %', '36 A → 60 % ; 48 A → 800 µs'], ['PP voltage', '5·(R5∥R6)/(R4 + R5∥R6)', '300 Ω → 2.30 V'], ['CP state C', '12·Rv/(1k + Rv)', '881 Ω → 5.6 V'], ['States', 'A12 B9 C6 D3 E0 F−12', '']]);
  G('CCS2', 'ccs2', [['SLAC', '3 × start atten, 10 sounds, 58 groups', 'lowest attenuation wins'], ['Pre-charge', 'I limit 2 A, ΔV &lt; 20 V', 'contactors in C2']]);
  G('CAN / OCPP', 'dc001-can', [['IDs', '2.0A 2¹¹, 2.0B 2²⁹', ''], ['Addresses', 'charger 0x56 (86), BMS 0xF4 (244)', ''], ['Priority', 'top 3 bits of 29-bit ID', '0x18 → 6'], ['OCPP-J types', 'CALL 2, CALLRESULT 3, CALLERROR 4', '']]);
  $$('[data-go]', body).forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
} });
