/* ===== Full timed mock exam + results analysis ===== */
page({ id: 'mock-exam', mod: 'home', title: 'Timed mock exam (3 h)', kw: 'mock test exam timed full paper practice result analysis score', render(body) {
  const KEY = 'mock', HKEY = 'mockhist';
  const ALL = {}; (window.QBANK || []).concat(window.MOCKQ || [], window.AIQ || []).forEach(q => ALL[q.id] = q);
  /* runtime view of a question inside a paper: numerical→MCQ conversion and option shuffles are stored in the paper */
  const QM = (m, id) => { const q = ALL[id], g = m && m.gen && m.gen[id], p = m && m.perm && m.perm[id]; if (g) return Object.assign({}, q, { type: 'mcq', opts: g.opts, ans: [g.ans], why: g.why, conv: true }); if (p) return Object.assign({}, q, { opts: p.map(i => q.opts[i]), ans: q.ans.map(a => p.indexOf(a)) }); return q; };
  const Q = id => QM(M, id);
  const TT = {}; PAGES.forEach(p => { if (p.topic) TT[p.id] = p.title.replace(/:.*$/, ''); });
  const ASSIGN_W = {}; (window.QBANK || []).forEach(q => ASSIGN_W[q.topic] = (ASSIGN_W[q.topic] || 0) + 1);
  let M = store.get(KEY, null), tick = null, tShow = 0;
  const save = () => store.set(KEY, M);
  const fmtT = s => { s = Math.max(0, Math.round(s)); const hh = Math.floor(s / 3600), mm = Math.floor(s % 3600 / 60), ss = s % 60; return (hh ? hh + ':' : '') + String(mm).padStart(2, '0') + ':' + String(ss).padStart(2, '0'); };
  const left = () => M.dur - (Date.now() - M.start) / 1000;
  onLeave(() => { if (tick) clearInterval(tick); document.body.classList.remove('exam-on'); if (M && !M.done) { flushTime(); save(); } });
  /* ---------------------------------------------------------- paper */
  function makePaper(n, mix) {
    const hist = store.get(HKEY, []), seen = new Set(hist.flatMap(x => x.qs || []));
    const byWk = w => ({ a: QBANK.filter(q => q.wk === w), f: MOCKQ.filter(q => q.wk === w) });
    const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const fresh1st = a => shuffle(a).sort((x, y) => seen.has(x.id) - seen.has(y.id));
    const base = Math.floor(n / 12), extra = n - base * 12, heavy = [11, 8, 10, 12, 7, 9, 2, 3, 4, 5, 6, 1]; const quota = {}; for (let w = 1; w <= 12; w++) quota[w] = base; for (let i = 0; i < extra; i++) quota[heavy[i % 12]]++;
    let out = [];
    for (let w = 1; w <= 12; w++) {
      const { a, f } = byWk(w); let pick = [];
      if (mix === 'assign') pick = fresh1st(a).slice(0, quota[w]);
      else if (mix === 'fresh') { pick = fresh1st(f).slice(0, quota[w]); if (pick.length < quota[w]) pick = pick.concat(fresh1st(a).slice(0, quota[w] - pick.length)); }
      else { const nf = Math.ceil(quota[w] / 2); pick = fresh1st(f).slice(0, nf); pick = pick.concat(fresh1st(a).slice(0, quota[w] - pick.length)); }
      out = out.concat(pick);
    }
    return { qs: shuffle(out).map(q => q.id) };
  }
  /* numerical → 4-option MCQ: correct value, the known slips, then rms/peak, ×2 and ×10 variants */
  function natToMcq(q) {
    const m = (q.lo + q.hi) / 2, unit = (q.show || '').replace(/^[≈~\s]*[-+]?[\d.,]+\s*/, '').trim(), sig = Math.max(2, Math.min(4, (((q.show || '').match(/[\d.]+/) || [''])[0].replace('.', '').replace(/^0+/, '')).length || 3));
    const f = v => { const a = Math.abs(v); const t = a >= 100 ? v.toFixed(Math.max(0, sig - 3)) : a >= 10 ? v.toFixed(Math.max(0, sig - 2)) : a >= 1 ? v.toFixed(Math.max(1, sig - 1)) : v.toPrecision(Math.max(2, sig)); return String(+t) + (unit ? ' ' + unit : ''); };
    const right = q.show ? q.show.replace(/^≈\s*/, '') : f(m);
    const cands = (q.trap || []).map(([v, why]) => [v, 'Typical slip: ' + why + '.']).concat([[m * Math.SQRT2, 'Off by √2: rms vs peak mix-up.'], [m / Math.SQRT2, 'Off by √2: rms vs peak mix-up.'], [m * 2, 'Off by a factor of 2: peak vs peak-to-peak, half vs full period.'], [m / 2, 'Off by a factor of 2: peak vs peak-to-peak, half vs full period.'], [m * 10, 'Off by a power of ten: unit slip.'], [m / 10, 'Off by a power of ten: unit slip.'], [m * 1.25, 'Close but wrong: rounding or a wrong constant.'], [m * .8, 'Close but wrong: rounding or a wrong constant.']]);
    const nt = (q.trap || []).length, sh = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; }; const ordered = cands.slice(0, nt).concat(sh(cands.slice(nt))).filter(([v]) => !(q.hi <= 1 && v > 1));
    const picked = []; ordered.forEach(([v, why]) => { if (picked.length < 3 && v > 0 && Math.abs(v / m - 1) > .12 && picked.every(p => Math.abs(v / p[0] - 1) > .1) && (v < q.lo * .97 || v > q.hi * 1.03)) picked.push([v, why]); });
    const all = [[m, null, right]].concat(picked.map(([v, w]) => [v, w, f(v)])).sort((a, b) => a[0] - b[0]);
    return { opts: all.map(x => x[2]), ans: all.findIndex(x => x[1] === null), why: all.map(x => x[1]) };
  }
  /* NPTEL pattern (as reported): 50 single-answer MCQs in 3 sections — 10 basics, 15 assignment-style, 25 in-depth / numerical */
  function makeNptel() {
    const hist = store.get(HKEY, []), seen = new Set(hist.flatMap(x => x.qs || []));
    const shuffle = a => { a = a.slice(); for (let i = a.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [a[i], a[j]] = [a[j], a[i]]; } return a; };
    const pref = a => shuffle(a).sort((x, y) => seen.has(x.id) - seen.has(y.id));
    const used = new Set(), grp = new Set(), take = (pool, n) => { const out = []; for (const q of pref(pool)) { if (out.length >= n) break; if (used.has(q.id) || (q.grp && grp.has(q.grp))) continue; used.add(q.id); if (q.grp) grp.add(q.grp); out.push(q); } return out; };
    const AI = window.AIQ || [], A = QBANK, F = MOCKQ;
    const s1 = take(AI.filter(q => q.diff === 'Easy'), 7).concat(take(F.filter(q => q.type === 'mcq'), 3));
    const s2 = take(A.filter(q => q.type === 'mcq'), 9).concat(take(AI.filter(q => q.diff === 'Medium'), 6));
    const nat = A.filter(q => q.type === 'nat').concat(F.filter(q => q.type === 'nat'));
    const s3 = take(AI.filter(q => q.diff === 'Hard'), 10).concat(take(nat, 15));
    const gen = {}, perm = {};
    s3.concat(s1, s2).forEach(q => { if (q.type === 'nat') gen[q.id] = natToMcq(q); else if (q.ai) perm[q.id] = shuffle([0, 1, 2, 3]); });
    const S1 = shuffle(s1), S2 = shuffle(s2), S3 = shuffle(s3);
    return { qs: S1.concat(S2, S3).map(q => q.id), gen, perm, sec: [['Section 1 · Basics', 0, 10], ['Section 2 · Assignment-style', 10, 25], ['Section 3 · In-depth & numerical', 25, 50]] };
  }
  function startExam(n, mins, mix) { const P = mix === 'nptel' ? makeNptel() : makePaper(n, mix); M = Object.assign({ v: 2, start: Date.now(), dur: mins * 60, ans: {}, mark: {}, vis: {}, t: {}, chg: {}, first: {}, cur: 0, done: false, mix }, P); save(); render(); }
  /* ---------------------------------------------------------- grading */
  const norm = (q, a) => a == null || a === '' || (Array.isArray(a) && !a.length) ? null : a;
  function isRight(q, a) { if (norm(q, a) == null) return false; if (q.type === 'nat') { const v = parseFloat(String(a).replace(',', '.')); return !isNaN(v) && v >= q.lo - 1e-9 && v <= q.hi + 1e-9; } if (q.type === 'mcq') return q.ans[0] === a; const A = new Set(q.ans); return a.length === A.size && a.every(x => A.has(x)); }
  const ansTxt = (q, a) => norm(q, a) == null ? '—' : q.type === 'nat' ? String(a) : q.type === 'mcq' ? String.fromCharCode(65 + a) : a.map(i => String.fromCharCode(65 + i)).join(', ');
  const keyTxt = q => q.type === 'nat' ? `${q.lo} to ${q.hi}${q.show ? ' (≈ ' + q.show + ')' : ''}` : q.ans.map(i => String.fromCharCode(65 + i)).join(', ');
  /* ---------------------------------------------------------- start screen */
  function startScreen() {
    body.innerHTML = '';
    H(body, `<div class="crumb"><span>Exam simulation</span><span class="pill hot">Same format as the proctored exam</span></div><h1>Timed mock exam</h1><p class="lede">A full paper with a countdown, question palette, mark-for-review and auto-submit, like the NPTEL exam screen. When you submit you get a results analysis: where to focus, which mistakes were avoidable, and which areas only need revision.</p>`);
    const hist = store.get(HKEY, []);
    if (M && !M.done && left() > 0) { const c = h('div', { class: 'card', style: 'border-left:5px solid var(--hot)' }); c.innerHTML = `<h3>Exam in progress</h3><p>${Object.keys(M.ans).length} of ${M.qs.length} answered · ${fmtT(left())} left. The clock kept running while you were away, as in the real exam.</p>`; c.append(h('button', { class: 'btn primary', onclick: () => render() }, 'Resume exam'), ' ', h('button', { class: 'btn', onclick: () => { M.done = true; finish(); } }, 'Submit it now')); body.append(c); }
    else if (M && !M.done) { M.done = true; finish(true); return; }
    const card = h('div', { class: 'card' }); body.append(card);
    card.innerHTML = `<h3>Exam settings</h3>`;
    const inputs = h('div', { class: 'calc' }), row = h('div', { class: 'inputs' }); inputs.append(row); card.append(inputs);
    const nSel = h('select', { class: 'sel' }, [[50, '50 questions (full paper)'], [25, '25 questions (half paper)'], [12, '12 questions (one per week, quick check)']].map(([v, t]) => h('option', { value: v }, t)));
    const tSel = h('select', { class: 'sel' }, [[180, '180 minutes (real)'], [90, '90 minutes'], [45, '45 minutes'], [20, '20 minutes']].map(([v, t]) => h('option', { value: v }, t)));
    const mSel = h('select', { class: 'sel' }, [['nptel', 'NPTEL pattern: 50 MCQ in 3 sections (recommended)'], ['mixed', 'Mixed MCQ/MSQ/numerical: half assignment, half new'], ['fresh', 'New questions only (first choice)'], ['assign', 'Assignment questions only']].map(([v, t]) => h('option', { value: v }, t)));
    nSel.addEventListener('change', () => { tSel.value = { 50: 180, 25: 90, 12: 45 }[nSel.value]; if (mSel.value === 'nptel' && nSel.value !== '50') mSel.value = 'mixed'; }); mSel.addEventListener('change', () => { if (mSel.value === 'nptel') { nSel.value = '50'; tSel.value = '180'; } });
    row.append(h('label', {}, 'Length', nSel), h('label', {}, 'Time', tSel), h('label', {}, 'Questions', mSel));
    card.append(h('button', { class: 'btn primary', style: 'margin-top:12px', onclick: () => startExam(+nSel.value, +tSel.value, mSel.value) }, '▶ Start the exam'));
    H(body, `<h2>Rules of this mock</h2><ul>
      <li><b>NPTEL pattern</b> (default): 50 single-answer MCQs, Section 1 = 10 basics, Section 2 = 15 assignment-style, Section 3 = 25 in-depth / numerical, no negative marking. Numericals appear as 4-option MCQs whose wrong options are the typical slips (rms vs peak, ×2, ×10, the trap values). Questions come from the 150 NPTEL AI-mock questions (options re-shuffled; in those papers the key was almost always B or C), the 126 assignment questions and 61 new ones.</li>
      <li><b>Mixed format</b>: single-answer MCQ, multiple-select MSQ and numerical-answer questions, every week covered (≈ 4 per week in a 50-question paper, a few extra from the heaviest weeks). 61 new questions written in the assignment style + the 126 assignment questions.</li>
      <li><b>Marking here</b>: every question carries equal marks, MSQ is all-or-nothing, numerical answers are accepted inside a range, no negative marking. Your score is also shown out of 75 (the exam's weight in the final grade).</li>
      <li><b>Timer</b>: keeps running if you close the page (like the real exam). It auto-submits at zero. Use <i>Mark for review</i> to come back later; marked + answered questions are graded.</li>
      <li><b>Allowed</b>: pen, paper and a calculator. Close the other tabs.</li></ul>
      <p class="cap">The real paper's exact number of questions and marking is set per course and shown in the exam instructions; NPTEL papers are 3 hours. Read the instructions on the day and follow them. Format summary: <a href="https://www.careers360.com/courses-certifications/articles/nptel-exam-pattern" target="_blank" rel="noopener">Careers360 NPTEL exam pattern</a>; pass rule: NPTEL FAQ.</p>`);
    if (hist.length) { H(body, '<h2>Your previous attempts</h2>'); const t = h('div', { class: 'heat' }); body.append(t); hist.slice().reverse().forEach((x, i) => { const r = h('div', { class: 'heatrow' }, h('button', { onclick: () => { M = x.full; analysis(); } }, `${new Date(x.date).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })} · ${x.n} Q`), h('div', { class: 'bar' }, h('i', { style: `width:${x.pct}%;background:${x.pct >= 60 ? 'var(--good)' : x.pct >= 40 ? 'var(--warn)' : 'var(--bad)'}` })), h('b', {}, x.pct.toFixed(0) + ' %')); t.append(r); }); body.append(h('button', { class: 'btn', style: 'margin-top:8px', onclick: () => { store.set(HKEY, []); startScreen(); } }, 'Clear attempt history')); }
  }
  /* ---------------------------------------------------------- exam screen */
  let qBox, pal, timerEl, cnt;
  function flushTime() { if (!M || M.done || !tShow) return; const id = M.qs[M.cur]; M.t[id] = (M.t[id] || 0) + (Date.now() - tShow) / 1000; tShow = Date.now(); }
  function render() {
    if (M.done) return analysis();
    body.innerHTML = ''; document.body.classList.add('exam-on');
    const bar = h('div', { class: 'exbar' }); timerEl = h('b', { class: 'extimer' }); cnt = h('span', { class: 'excnt' });
    bar.append(h('span', { class: 'exname' }, 'Charging Infrastructure · Mock'), cnt, h('span', { class: 'extl' }, 'Time left ', timerEl));
    const wrap = h('div', { class: 'exwrap' }); qBox = h('div', { class: 'exq' }); pal = h('div', { class: 'expal' }); wrap.append(qBox, pal); body.append(bar, wrap);
    show(M.cur);
    if (tick) clearInterval(tick); tick = setInterval(() => { const l = left(); timerEl.textContent = fmtT(l); timerEl.classList.toggle('low', l < 600); if (l <= 0) { clearInterval(tick); flushTime(); M.done = true; save(); finish(true); } else if (Math.round(l) % 5 === 0) { flushTime(); save(); } }, 500);
    timerEl.textContent = fmtT(left());
  }
  function status(id) { const a = norm(Q(id), M.ans[id]) != null, m = M.mark[id]; return m ? (a ? 'am' : 'm') : a ? 'a' : M.vis[id] ? 'na' : 'nv'; }
  function drawPal() {
    pal.innerHTML = '';
    const counts = { a: 0, na: 0, nv: 0, m: 0, am: 0 }; M.qs.forEach(id => counts[status(id)]++);
    pal.append(h('div', { class: 'pallegend', html: `<span class="pq a">${counts.a}</span>Answered <span class="pq na">${counts.na}</span>Not answered <span class="pq nv">${counts.nv}</span>Not visited <span class="pq m">${counts.m}</span>Marked <span class="pq am">${counts.am}</span>Answered &amp; marked` }));
    const g = h('div', { class: 'palgrid' }); M.qs.forEach((id, i) => { const sc = (M.sec || []).find(x => x[1] === i); if (sc) g.append(h('div', { class: 'palsec' }, sc[0])); g.append(h('button', { class: 'pq ' + status(id) + (i === M.cur ? ' cur' : ''), 'aria-label': 'question ' + (i + 1), onclick: () => go2(i) }, String(i + 1))); }); pal.append(g);
    pal.append(h('button', { class: 'btn primary', style: 'width:100%;margin-top:12px', onclick: () => confirmSubmit() }, 'Submit exam'));
    cnt.textContent = `Q ${M.cur + 1} / ${M.qs.length} · answered ${counts.a + counts.am}`;
  }
  function go2(i) { flushTime(); M.cur = i; save(); show(i); }
  function setAns(id, v) { const q = Q(id); if (!(id in M.first) && norm(q, v) != null) M.first[id] = v; const prev = M.ans[id]; if (prev != null && JSON.stringify(prev) !== JSON.stringify(v)) M.chg[id] = (M.chg[id] || 0) + 1; M.ans[id] = v; save(); drawPal(); }
  function show(i) {
    const id = M.qs[i], q = Q(id); M.vis[id] = 1; tShow = Date.now(); save();
    qBox.innerHTML = '';
    const kind = q.type === 'nat' ? 'Numerical answer' : q.type === 'msq' ? 'Multiple select: one or more correct' : 'Single correct answer';
    const secN = (M.sec || []).find(x => i >= x[1] && i < x[2]); qBox.append(h('div', { class: 'qh' }, secN ? h('span', { class: 'pill' }, secN[0]) : null, h('span', { class: 'pill hot' }, 'Question ' + (i + 1)), h('span', { class: 'pill' }, kind)));
    qBox.append(h('div', { class: 'qt', html: q.text })); if (q.img) qBox.append(h('img', { src: q.img, alt: 'figure', class: 'exfig' }));
    const a = M.ans[id];
    if (q.type === 'nat') { const inp = h('input', { type: 'text', inputmode: 'decimal', class: 'sel', style: 'max-width:240px', placeholder: 'type your answer', value: a == null ? '' : a, 'aria-label': 'numerical answer' }); inp.addEventListener('input', () => setAns(id, inp.value.trim())); qBox.append(h('div', { class: 'nat' }, inp)); setTimeout(() => inp.focus(), 30); }
    else { const box = h('div'); q.opts.forEach((t, k) => { const checked = q.type === 'msq' ? (a || []).includes(k) : a === k; const inp = h('input', { type: q.type === 'msq' ? 'checkbox' : 'radio', name: 'mq', id: 'mo' + k, checked }); inp.addEventListener('change', () => { if (q.type === 'msq') { const s = $$('input', box).map((x, j) => x.checked ? j : -1).filter(j => j >= 0); setAns(id, s); } else setAns(id, k); $$('.opt', box).forEach((o, j) => o.classList.toggle('sel', $$('input', box)[j].checked)); }); box.append(h('label', { class: 'opt q' + (checked ? ' sel' : ''), for: 'mo' + k }, inp, h('span', { html: `<b>${String.fromCharCode(65 + k)}.</b> ${t}` }))); }); qBox.append(box); }
    const nav = h('div', { class: 'exnav' });
    nav.append(h('button', { class: 'btn', disabled: i === 0, onclick: () => go2(i - 1) }, '← Previous'), h('button', { class: 'btn', onclick: () => { setAns(id, q.type === 'msq' ? [] : null); show(i); } }, 'Clear response'), h('button', { class: 'btn mk', onclick: () => { M.mark[id] = !M.mark[id]; save(); if (i < M.qs.length - 1) go2(i + 1); else drawPal(); } }, M.mark[id] ? 'Unmark & next' : 'Mark for review & next'), h('button', { class: 'btn primary', onclick: () => { if (i < M.qs.length - 1) go2(i + 1); else confirmSubmit(); } }, i < M.qs.length - 1 ? 'Save & next →' : 'Save & finish'));
    qBox.append(nav);
    drawPal();
  }
  function confirmSubmit() {
    flushTime(); save();
    const c = { a: 0, na: 0, nv: 0, m: 0, am: 0 }; M.qs.forEach(id => c[status(id)]++);
    qBox.innerHTML = ''; const d = h('div', { class: 'card', style: 'border-left:5px solid var(--hot)' });
    d.innerHTML = `<h3>Submit the exam?</h3><p>Answered: <b>${c.a + c.am}</b> · Not answered: <b>${c.na + c.nv}</b> · Marked for review: <b>${c.m + c.am}</b> · Time left: <b>${fmtT(left())}</b></p>${c.na + c.nv ? '<p class="cap">There is no negative marking in this mock: a guess on every blank question can only help.</p>' : ''}`;
    d.append(h('button', { class: 'btn primary', onclick: () => { M.done = true; M.end = Date.now(); clearInterval(tick); save(); finish(); } }, 'Yes, submit'), ' ', h('button', { class: 'btn', onclick: () => show(M.cur) }, 'Back to the paper'));
    qBox.append(d);
  }
  function finish(auto) {
    document.body.classList.remove('exam-on'); if (!M.end) M.end = Math.min(Date.now(), M.start + M.dur * 1000); M.auto = !!auto; save();
    const R = grade(M), hist = store.get(HKEY, []); if (!hist.some(x => x.start === M.start)) { hist.push({ date: M.end, start: M.start, n: M.qs.length, pct: R.pct, qs: M.qs, full: M }); store.set(HKEY, hist.slice(-12)); }
    analysis();
  }
  /* ---------------------------------------------------------- analysis */
  function grade(m) {
    const rows = m.qs.map(id => { const q = QM(m, id), a = m.ans[id]; return { id, q, a, ok: isRight(q, a), blank: norm(q, a) == null, t: m.t[id] || 0, first: m.first[id], chg: m.chg[id] || 0 }; });
    const ok = rows.filter(r => r.ok).length; return { rows, ok, n: rows.length, pct: ok / rows.length * 100 };
  }
  function diagnose(r, topicAcc, medT) {
    const q = r.q, out = [];
    if (r.blank) return [['blank', 'Left blank. With no negative marking, always enter your best guess.']];
    if (r.ok) return [];
    if (r.first != null && isRight(q, r.first)) out.push(['silly', `You first answered <b>${ansTxt(q, r.first)}</b> (correct) and then changed it. Trust your first worked answer unless you find a concrete error.`]);
    if (q.type === 'nat') {
      const v = parseFloat(String(r.a).replace(',', '.')), m = (q.lo + q.hi) / 2;
      if (isNaN(v)) out.push(['silly', 'The answer is not a number. Type digits only (no units).']);
      else {
        const rr = v / m, near = (x, tol = .03) => Math.abs(rr / x - 1) < tol;
        (q.trap || []).forEach(([tv, why]) => { if (Math.abs(v / tv - 1) < .03) out.push(['silly', 'Typical slip: ' + why + '.']); });
        if (!out.some(o => o[1].startsWith('Typical')) ) {
          if (Math.abs(rr - 1) < .1) out.push(['silly', `Very close (${v} vs ${q.show || m}): rounding or precision. Keep 3-4 significant figures until the last step and use exact constants (√2, π).`]);
          else if ([10, 100, 1000, 1e6, .1, .01, .001, 1e-6].some(x => near(x))) out.push(['silly', 'Off by a power of ten: a unit slip (ms ↔ µs, mH ↔ H, kW ↔ W, % ↔ fraction). Check the unit asked for.']);
          else if (near(Math.SQRT2) || near(1 / Math.SQRT2)) out.push(['silly', 'Off by √2: rms vs peak mix-up.']);
          else if (near(2) || near(.5)) out.push(['silly', 'Off by a factor of 2: peak vs peak-to-peak, half vs full period, or one vs two capacitors.']);
          else if (near(180 / Math.PI) || near(Math.PI / 180)) out.push(['silly', 'Degrees vs radians mix-up.']);
          else if (near(-1)) out.push(['silly', 'Sign error.']);
        }
      }
    }
    if (q.conv && q.why && q.why[r.a]) out.push(['silly', q.why[r.a]]);
    if (q.type === 'msq' && Array.isArray(r.a)) { const A = new Set(q.ans), S = new Set(r.a), miss = q.ans.filter(x => !S.has(x)), extra = r.a.filter(x => !A.has(x)); if (miss.length + extra.length === 1) out.push(['silly', miss.length ? `Missed one correct option (${String.fromCharCode(65 + miss[0])}). In MSQ judge every option on its own.` : `Ticked one extra option (${String.fromCharCode(65 + extra[0])}). Only tick what you can justify.`]); }
    if (r.t > 0 && r.t < Math.min(25, medT * .35)) out.push(['silly', `Answered in ${Math.round(r.t)} s: rushed. Re-read the question stem (axis, unit, "true/false").`]);
    if (!out.length && (topicAcc[q.topic] || 0) >= .75) out.push(['silly', 'A slip in a topic you otherwise know well: re-read this one.']);
    if (!out.length) out.push(['gap', 'Concept gap: re-learn from the topic page.']);
    return out;
  }
  function analysis() {
    if (tick) clearInterval(tick); document.body.classList.remove('exam-on');
    const R = grade(M), med = (() => { const t = R.rows.map(r => r.t).filter(x => x > 0).sort((a, b) => a - b); return t.length ? t[Math.floor(t.length / 2)] : 60; })();
    const byT = {}; R.rows.forEach(r => { const k = r.q.topic, o = byT[k] = byT[k] || { n: 0, ok: 0, t: 0, blank: 0, wk: r.q.wk }; o.n++; o.ok += r.ok; o.t += r.t; o.blank += r.blank; });
    const acc = {}; Object.keys(byT).forEach(k => acc[k] = byT[k].ok / byT[k].n);
    R.rows.forEach(r => r.dx = diagnose(r, acc, med));
    const silly = R.rows.filter(r => r.dx.some(d => d[0] === 'silly')), blanks = R.rows.filter(r => r.blank), gaps = R.rows.filter(r => !r.ok && !r.blank && !r.dx.some(d => d[0] === 'silly'));
    const used = ((M.end || Date.now()) - M.start) / 1000, of75 = R.pct * .75;
    body.innerHTML = '';
    H(body, `<div class="crumb"><span>Mock exam result</span><span class="pill">${new Date(M.end || Date.now()).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' })}</span>${M.auto ? '<span class="pill hot">auto-submitted at time-out</span>' : ''}</div><h1>Your result: ${R.ok} / ${R.n}</h1>`);
    const verdict = R.pct >= 60 ? ['good', 'Comfortably above the pass line. Use the analysis to push higher.'] : R.pct >= 40 ? ['warn', 'Above the 40 % exam threshold, but with little margin. Fix the silly mistakes first; they are the cheapest marks.'] : ['bad', 'Below the 40 % exam threshold. Concentrate on the "Easy marks" topics and the focus list below before anything else.'];
    H(body, `<div class="readout"><div><small>score</small><b>${R.pct.toFixed(1)} %</b></div><div><small>as exam marks</small><b>${of75.toFixed(1)} / 75</b></div><div><small>pass line (exam)</small><b>30 / 75</b></div><div><small>avoidable mistakes</small><b>${silly.length + blanks.length}</b></div><div><small>time used</small><b>${fmtT(used)} / ${fmtT(M.dur)}</b></div><div><small>median per question</small><b>${Math.round(med)} s</b></div></div><p class="ivtxt" style="border-left-color:var(--${verdict[0] === 'good' ? 'good' : verdict[0] === 'warn' ? 'warn' : 'bad'})">${verdict[1]}${silly.length + blanks.length ? ` Fixing only the avoidable ones would give <b>${((R.ok + silly.length + blanks.length) / R.n * 100).toFixed(0)} %</b>.` : ''}</p>`);
    // focus / middle / strong
    const T = Object.entries(byT).map(([k, o]) => Object.assign({ k, acc: o.ok / o.n, lost: o.n - o.ok, w: ASSIGN_W[k] || 1 }, o));
    const focus = T.filter(o => o.acc < .6).sort((a, b) => b.lost * b.w - a.lost * a.w), mid = T.filter(o => o.acc >= .6 && o.acc < .8), strong = T.filter(o => o.acc >= .8 && o.n >= 1).sort((a, b) => b.n - a.n);
    const chip = o => `<button class="tchip" data-go="${o.k}"><b>${TT[o.k] || o.k}</b><small>W${o.wk} · ${o.ok}/${o.n} right${o.blank ? ` · ${o.blank} blank` : ''} · ${ASSIGN_W[o.k] || 0} assignment Qs in this topic</small></button>`;
    H(body, `<h2>1 · Focus here first (biggest gains)</h2><p class="cap">Topics under 60 % in this paper, ordered by marks lost × how often the topic appears in the assignments. Open the topic, do its assignment questions, then retake.</p><div class="tchips">${focus.length ? focus.map(chip).join('') : '<p>No weak topics in this paper. 🎯</p>'}</div>`);
    if (mid.length) H(body, `<h3>Nearly there (60-79 %): do a few more questions</h3><div class="tchips">${mid.map(chip).join('')}</div>`);
    H(body, `<h2>2 · Silly mistakes you could have avoided</h2><p class="cap">Detected automatically: close-but-off numbers, unit and factor slips, rms/peak mix-ups, MSQs with exactly one wrong tick, changed correct answers, rushed answers, and blanks.</p>`);
    const sl = h('div'); body.append(sl);
    if (!silly.length && !blanks.length) sl.innerHTML = '<p>None. Clean paper.</p>';
    silly.concat(blanks).forEach(r => sl.append(reviewCard(r, true)));
    H(body, `<h2>3 · Strong areas: revision only</h2><p class="cap">80 % or better. Skim the Revision sheet for these; do not spend new study time here.</p><div class="tchips">${strong.length ? strong.map(chip).join('') : '<p>None yet. Take another paper after revising.</p>'}</div>`);
    // time
    const slow = R.rows.filter(r => r.t > Math.max(2.2 * med, 150)).sort((a, b) => b.t - a.t).slice(0, 6);
    H(body, `<h2>4 · Time management</h2><p>Average ${fmtT(used / R.n)} per question, ${R.n - blanks.length} answered${M.auto ? ', paper auto-submitted at zero' : `, ${fmtT(Math.max(0, M.dur - used))} left at submit`}.${slow.length ? ' These took much longer than your median; in the exam, mark them and come back:' : ''}</p>${slow.length ? '<ul>' + slow.map(r => `<li>Q${M.qs.indexOf(r.id) + 1} (${TT[r.q.topic] || r.q.topic}): ${fmtT(r.t)} – ${r.ok ? 'right' : 'wrong'}</li>`).join('') + '</ul>' : ''}`);
    // week table
    const W = {}; R.rows.forEach(r => { const o = W[r.q.wk] = W[r.q.wk] || { n: 0, ok: 0 }; o.n++; o.ok += r.ok; });
    if (M.sec) { H(body, '<h2>Score by section</h2>'); const hs = h('div', { class: 'heat' }); body.append(hs); M.sec.forEach(([nm, a, b]) => { const rr = R.rows.slice(a, b), ok = rr.filter(r => r.ok).length, p = ok / rr.length * 100; hs.append(h('div', { class: 'heatrow' }, h('span', {}, nm), h('div', { class: 'bar' }, h('i', { style: `width:${p}%;background:${p >= 80 ? 'var(--good)' : p >= 60 ? 'var(--warn)' : 'var(--bad)'}` })), h('b', {}, `${ok}/${rr.length}`))); }); }
    H(body, '<h2>5 · Score by week</h2>'); const heat = h('div', { class: 'heat' }); body.append(heat);
    Object.keys(W).sort((a, b) => a - b).forEach(w => { const o = W[w], p = o.ok / o.n * 100; heat.append(h('div', { class: 'heatrow' }, h('span', {}, 'Week ' + w), h('div', { class: 'bar' }, h('i', { style: `width:${p}%;background:${p >= 80 ? 'var(--good)' : p >= 60 ? 'var(--warn)' : 'var(--bad)'}` })), h('b', {}, `${o.ok}/${o.n}`))); });
    // review
    H(body, '<h2>6 · Review every question</h2>');
    const fl = h('div', { class: 'seg', style: 'margin-bottom:10px' }); body.append(fl); const list = h('div'); body.append(list);
    const drawList = f => { list.innerHTML = ''; R.rows.filter(r => f === 'all' || (f === 'wrong' ? !r.ok : r.ok)).forEach(r => list.append(reviewCard(r))); };
    segmented(fl, [['wrong', 'Wrong / blank'], ['all', 'All'], ['right', 'Right']], 'wrong', drawList); drawList('wrong');
    body.append(h('div', { class: 'nextprev' }, h('button', { class: 'btn primary', onclick: () => { M = null; store.set(KEY, null); startScreen(); } }, 'New paper'), h('button', { class: 'btn', onclick: () => go('revision-sheet') }, 'Revision sheet'), h('button', { class: 'btn', onclick: () => go('easy-marks') }, 'Easy marks')));
    $$('[data-go]', body).forEach(b => b.addEventListener('click', () => go(b.dataset.go)));
    $('#main').scrollTop = 0;
  }
  function reviewCard(r, compact) {
    const q = r.q, i = M.qs.indexOf(r.id), c = h('div', { class: 'q rv ' + (r.ok ? 'ok' : r.blank ? 'bl' : 'no') });
    c.append(h('div', { class: 'qh' }, h('span', { class: 'pill ' + (r.ok ? '' : 'hot') }, `Q${i + 1} · ${r.ok ? '✔ right' : r.blank ? '— blank' : '✘ wrong'}`), h('span', { class: 'pill' }, (q.ai ? 'NPTEL AI mock ' + q.ai + ' · ' : q.fresh ? 'New · ' : 'Assignment ' + q.id + ' · ') + 'W' + q.wk), h('span', { class: 'pill' }, TT[q.topic] || q.topic), h('span', { class: 'pill' }, fmtT(r.t))));
    c.append(h('div', { class: 'qt', html: q.text }));
    if (q.img && !compact) c.append(h('img', { src: q.img, alt: 'figure', loading: 'lazy' }));
    if (q.type !== 'nat' && !compact) c.append(h('ol', { class: 'rvopts', type: 'A', html: q.opts.map((t, k) => `<li class="${q.ans.includes(k) ? 'k' : ''}${(q.type === 'msq' ? (r.a || []).includes(k) : r.a === k) ? ' y' : ''}">${t}</li>`).join('') }));
    c.append(h('div', { class: 'rvans', html: `Your answer: <b>${ansTxt(q, r.a)}</b> · Correct: <b>${keyTxt(q)}</b>` }));
    (r.dx || []).forEach(([k, t]) => c.append(h('div', { class: 'dx ' + k, html: (k === 'silly' ? '⚠ ' : k === 'blank' ? '○ ' : '◆ ') + t })));
    c.append(h('details', {}, h('summary', {}, 'Explanation'), h('div', { class: 'exp', html: q.exp || '' }), h('button', { class: 'btn', style: 'margin-top:6px', onclick: () => go(q.topic) }, 'Open topic page →')));
    return c;
  }
  /* ---------------------------------------------------------- boot */
  startScreen();
} });
