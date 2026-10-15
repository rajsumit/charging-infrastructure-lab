/* ===== core helpers ===== */
const $ = (s, r = document) => r.querySelector(s);
const $$ = (s, r = document) => Array.from(r.querySelectorAll(s));
function h(tag, attrs, ...kids) {
  const e = document.createElement(tag);
  for (const k in (attrs || {})) {
    const v = attrs[k];
    if (k === 'class') e.className = v; else if (k === 'html') e.innerHTML = v;
    else if (k.startsWith('on')) e.addEventListener(k.slice(2), v); else if (v !== false && v != null) e.setAttribute(k, v === true ? '' : v);
  }
  kids.flat().forEach(c => c != null && e.append(c.nodeType ? c : document.createTextNode(c)));
  return e;
}
const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
const fmt = (x, d = 2) => (Math.abs(x) >= 1e4 || (Math.abs(x) < 1e-2 && x !== 0)) ? x.toExponential(2) : (+x.toFixed(d)).toString();
const store = {
  get(k, d) { try { const v = localStorage.getItem('ci:' + k); return v ? JSON.parse(v) : d; } catch (e) { return d; } },
  set(k, v) { try { localStorage.setItem('ci:' + k, JSON.stringify(v)); } catch (e) {} }
};
const LAB_STOPS = []; // cleanup callbacks run on route change
function onLeave(fn) { LAB_STOPS.push(fn); }

/* ===== theme ===== */
const Theme = {
  mode: store.get('theme', 'auto'),
  apply() {
    const r = document.documentElement;
    if (this.mode === 'auto') r.removeAttribute('data-theme'); else r.setAttribute('data-theme', this.mode);
    window.dispatchEvent(new Event('themechange'));
  },
  cycle() { this.mode = ({ auto: 'light', light: 'dark', dark: 'auto' })[this.mode]; store.set('theme', this.mode); this.apply(); return this.mode; }
};

/* ===== oscilloscope-style plotter ===== */
class Scope {
  constructor(cv, o) {
    this.cv = cv; this.o = Object.assign({ xmin: 0, xmax: 1, ymin: -1, ymax: 1, xt: 5, yt: 4, xl: '', yl: '', h: 230, pad: [46, 14, 28, 12], xfmt: null, yfmt: null }, o);
    this.last = null;
    this._rs = () => this.draw(this.last && this.last.s, this.last && this.last.x);
    window.addEventListener('themechange', this._rs); window.addEventListener('resize', this._rs);
    onLeave(() => { window.removeEventListener('themechange', this._rs); window.removeEventListener('resize', this._rs); });
  }
  set(o) { Object.assign(this.o, o); }
  draw(series, extra) {
    this.last = { s: series, x: extra };
    const cv = this.cv, o = this.o, dpr = Math.min(window.devicePixelRatio || 1, 2);
    const W = cv.clientWidth || 600, H = o.h;
    if (cv.width !== Math.round(W * dpr) || cv.height !== Math.round(H * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); cv.style.height = H + 'px'; }
    const g = cv.getContext('2d'); g.setTransform(dpr, 0, 0, dpr, 0, 0); g.clearRect(0, 0, W, H);
    const [pl, pr, pb, pt] = o.pad; const iw = W - pl - pr, ih = H - pb - pt;
    const X = x => pl + (x - o.xmin) / (o.xmax - o.xmin) * iw, Y = y => pt + (1 - (y - o.ymin) / (o.ymax - o.ymin)) * ih;
    this.X = X; this.Y = Y;
    const grid = css('--grid'), mut = css('--muted'), ink = css('--ink');
    g.font = '600 10.5px ' + css('--f-mono'); g.lineWidth = 1;
    const nice = (lo, hi, n) => { const st = (hi - lo) / n; return Array.from({ length: n + 1 }, (_, i) => lo + st * i); };
    g.strokeStyle = grid; g.fillStyle = mut; g.textBaseline = 'middle';
    nice(o.ymin, o.ymax, o.yt).forEach(v => { const y = Y(v); g.beginPath(); g.moveTo(pl, y); g.lineTo(W - pr, y); g.stroke(); g.textAlign = 'right'; g.fillText(o.yfmt ? o.yfmt(v) : fmt(v, 1), pl - 6, y); });
    g.textBaseline = 'top'; g.textAlign = 'center';
    nice(o.xmin, o.xmax, o.xt).forEach(v => { const x = X(v); g.beginPath(); g.moveTo(x, pt); g.lineTo(x, H - pb); g.stroke(); g.fillText(o.xfmt ? o.xfmt(v) : fmt(v, 1), x, H - pb + 5); });
    if (o.ymin < 0 && o.ymax > 0) { g.strokeStyle = mut; g.beginPath(); g.moveTo(pl, Y(0)); g.lineTo(W - pr, Y(0)); g.stroke(); }
    g.save(); g.beginPath(); g.rect(pl, pt - 2, iw, ih + 4); g.clip();
    (series || []).forEach(s => {
      const col = s.c && s.c.startsWith('--') ? css(s.c) : (s.c || ink);
      let xs = s.x, ys = s.y;
      if (s.fn) { const N = s.n || 400; xs = []; ys = []; for (let i = 0; i <= N; i++) { const x = o.xmin + (o.xmax - o.xmin) * i / N; xs.push(x); ys.push(s.fn(x)); } }
      g.beginPath(); g.lineWidth = s.w || 2; g.strokeStyle = col; g.setLineDash(s.dash || []); g.lineJoin = 'round';
      for (let i = 0; i < xs.length; i++) {
        if (s.step && i > 0) g.lineTo(X(xs[i]), Y(ys[i - 1]));
        i ? g.lineTo(X(xs[i]), Y(ys[i])) : g.moveTo(X(xs[i]), Y(ys[i]));
      }
      g.stroke(); g.setLineDash([]);
      if (s.fill) { g.lineTo(X(xs[xs.length - 1]), Y(s.fillTo || 0)); g.lineTo(X(xs[0]), Y(s.fillTo || 0)); g.closePath(); g.globalAlpha = .16; g.fillStyle = col; g.fill(); g.globalAlpha = 1; }
    });
    ((extra && extra.h) || []).forEach(l => { g.strokeStyle = l.c && l.c.startsWith('--') ? css(l.c) : (l.c || mut); g.setLineDash([5, 4]); g.lineWidth = 1.4; g.beginPath(); g.moveTo(pl, Y(l.y)); g.lineTo(W - pr, Y(l.y)); g.stroke(); g.setLineDash([]); if (l.t) { g.fillStyle = g.strokeStyle; g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText(l.t, W - pr - 4, Y(l.y) - 2); } });
    ((extra && extra.v) || []).forEach(l => { g.strokeStyle = l.c && l.c.startsWith('--') ? css(l.c) : (l.c || mut); g.setLineDash([5, 4]); g.lineWidth = 1.4; g.beginPath(); g.moveTo(X(l.x), pt); g.lineTo(X(l.x), H - pb); g.stroke(); g.setLineDash([]); if (l.t) { g.fillStyle = g.strokeStyle; g.textAlign = 'left'; g.textBaseline = 'top'; g.fillText(l.t, X(l.x) + 4, pt + 2); } });
    ((extra && extra.t) || []).forEach(l => { g.fillStyle = l.c && l.c.startsWith('--') ? css(l.c) : (l.c || ink); g.textAlign = l.a || 'left'; g.textBaseline = 'middle'; g.font = '700 11.5px ' + css('--f-mono'); g.fillText(l.s, X(l.x), Y(l.y)); });
    g.restore();
    g.fillStyle = mut; g.font = '600 10.5px ' + css('--f-mono');
    if (o.xl) { g.textAlign = 'right'; g.textBaseline = 'bottom'; g.fillText(o.xl, W - pr, H - 1); }
    if (o.yl) { g.save(); g.translate(11, pt + ih / 2); g.rotate(-Math.PI / 2); g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(o.yl, 0, 0); g.restore(); }
  }
}
/* build a lab card; returns {root, body, scope(opts) -> Scope, legend(items)} */
function lab(parent, title, caption) {
  const body = h('div', { class: 'body' });
  const root = h('section', { class: 'lab' }, h('header', {}, h('i'), title), body);
  if (caption) body.append(h('p', { class: 'cap', html: caption }));
  parent.append(root);
  return {
    root, body,
    scope(o) { const cv = h('canvas', { class: 'scope' }); body.append(cv); return new Scope(cv, o); },
    legend(items) { body.append(h('div', { class: 'legend', html: items.map(i => `<span style="--c:var(${i[1]})">${i[0]}</span>`).join('') })); },
    readout() { const r = h('div', { class: 'readout' }); body.append(r); return (items) => { r.innerHTML = items.map(i => `<div><small>${i[0]}</small><b>${i[1]}</b></div>`).join(''); }; },
    add(el) { body.append(el); return el; }
  };
}
/* sliders: specs [{k,label,min,max,step,v,unit,d}] -> {vals} ; calls onchange(vals) */
function controls(parent, specs, onchange) {
  const vals = {}, wrap = h('div', { class: 'ctls' }); parent.append(wrap);
  specs.forEach((s, i) => {
    vals[s.k] = s.v; const id = 'c' + Math.random().toString(36).slice(2, 8);
    const out = h('output', { for: id }), inp = h('input', { type: 'range', id, min: s.min, max: s.max, step: s.step || 1, value: s.v, 'aria-label': s.label });
    const upd = () => { vals[s.k] = +inp.value; out.textContent = (s.fmt ? s.fmt(+inp.value) : fmt(+inp.value, s.d == null ? 2 : s.d)) + (s.unit ? ' ' + s.unit : ''); };
    inp.addEventListener('input', () => { upd(); onchange(vals); }); upd();
    wrap.append(h('div', { class: 'ctl' }, h('label', { for: id }, s.label), inp, out));
  });
  return vals;
}
function segmented(parent, items, cur, onpick) {
  const seg = h('div', { class: 'seg', role: 'group' });
  items.forEach(([k, label]) => { const b = h('button', { 'aria-pressed': k === cur, onclick: () => { $$('button', seg).forEach(x => x.setAttribute('aria-pressed', 'false')); b.setAttribute('aria-pressed', 'true'); onpick(k); } }, label); seg.append(b); });
  parent.append(seg); return seg;
}
/* calculator: fields [{k,l,v,u,opts?}] ; out(v) -> [[label,value]] */
function calc(parent, title, fields, out, note) {
  const L = lab(parent, title, note); const vals = {};
  const inputs = h('div', { class: 'inputs' }); const res = L.readout();
  fields.forEach(f => {
    vals[f.k] = f.v; const id = 'f' + Math.random().toString(36).slice(2, 8);
    const inp = f.opts ? h('select', { id }, f.opts.map(o => h('option', { value: o[0], selected: o[0] == f.v }, o[1]))) : h('input', { id, type: 'number', step: 'any', value: f.v, inputmode: 'decimal' });
    inp.addEventListener('input', () => { vals[f.k] = +inp.value; run(); });
    inputs.append(h('label', { for: id }, f.l + (f.u ? ' (' + f.u + ')' : ''), inp));
  });
  L.body.insertBefore(inputs, L.body.children[1] || null);
  const run = () => { try { res(out(vals)); } catch (e) { res([['error', String(e)]]); } }; run();
  return L;
}

/* ===== three.js helper ===== */
const Three = {
  mount(parent, { label, hint = 'drag to rotate · scroll to zoom', setup, tick, cam = [0, 0.6, 6], auto = true, zr = [2.5, 14], aspect, bg }) {
    const box = h('div', { class: 'three' }); parent.append(box);
    if (!window.THREE) { box.append(h('p', { class: 'cap', style: 'padding:20px' }, '3D view needs the three.js library (internet connection). The text explanation above still applies.')); return {}; }
    const T = window.THREE, renderer = new T.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2)); box.append(renderer.domElement);
    if (label) box.append(h('div', { class: 'label3' }, label)); box.append(h('div', { class: 'hint' }, hint));
    const scene = new T.Scene(), camera = new T.PerspectiveCamera(40, 16 / 10, .1, 100); camera.position.set(...cam);
    scene.add(new T.AmbientLight(0xffffff, .75)); const dl = new T.DirectionalLight(0xffffff, .9); dl.position.set(3, 5, 6); scene.add(dl);
    const pivot = new T.Group(); scene.add(pivot);
    const api = { T, scene, camera, pivot, col: (v) => new T.Color(css(v)), renderer, box };
    setup(api);
    let drag = false, lx = 0, ly = 0, userMoved = !auto, raf, alive = true, visible = true, t0 = performance.now();
    const el = renderer.domElement;
    el.addEventListener('pointerdown', e => { drag = true; lx = e.clientX; ly = e.clientY; userMoved = true; el.setPointerCapture(e.pointerId); box.style.cursor = 'grabbing'; });
    el.addEventListener('pointerup', () => { drag = false; box.style.cursor = 'grab'; });
    el.addEventListener('pointermove', e => { if (!drag) return; pivot.rotation.y += (e.clientX - lx) * .01; pivot.rotation.x = Math.max(-1.4, Math.min(1.4, pivot.rotation.x + (e.clientY - ly) * .01)); lx = e.clientX; ly = e.clientY; });
    el.addEventListener('wheel', e => { e.preventDefault(); camera.position.z = Math.max(zr[0], Math.min(zr[1], camera.position.z * (1 + e.deltaY * .0015))); }, { passive: false });
    const resize = () => { const w = box.clientWidth, hh = box.clientHeight; if (!w) return; renderer.setSize(w, hh, false); camera.aspect = w / hh; camera.updateProjectionMatrix(); };
    const ro = new ResizeObserver(resize); ro.observe(box);
    const io = new IntersectionObserver(es => { visible = es[0].isIntersecting; }); io.observe(box);
    const loop = () => { if (!alive) return; raf = requestAnimationFrame(loop); if (!visible) return; const t = (performance.now() - t0) / 1000; if (!userMoved) pivot.rotation.y = Math.sin(t * .5) * .6; if (tick) tick(t, api); renderer.render(scene, camera); };
    resize(); loop();
    onLeave(() => { alive = false; cancelAnimationFrame(raf); ro.disconnect(); io.disconnect(); renderer.dispose(); });
    return api;
  }
};

/* ===== question bank rendering ===== */
const QPROG = store.get('q', {});
function qStatus(id) { return QPROG[id]; }
function recordQ(id, ok) { QPROG[id] = ok ? 1 : 0; store.set('q', QPROG); window.dispatchEvent(new Event('qprog')); }
function renderQuestion(q, opts = {}) {
  const box = h('div', { class: 'q', id: 'q-' + q.id });
  const kind = q.type === 'nat' ? 'Numerical' : q.type === 'msq' ? 'Select all that apply' : 'Single answer';
  box.append(h('div', { class: 'qh' }, h('span', { class: 'pill hot' }, 'WEEK ' + q.wk + ' · Q' + q.n), h('span', { class: 'pill' }, kind), opts.showTopic && q.topicTitle ? h('span', { class: 'pill' }, q.topicTitle) : null));
  box.append(h('div', { class: 'qt', html: q.text }));
  if (q.img) box.append(h('img', { src: q.img, alt: 'Figure for question ' + q.n, loading: 'lazy' }));
  let chosen = new Set(), answered = false, natIn;
  const fb = h('div'), optsEl = h('div');
  const reveal = (given) => {
    if (answered) return; answered = true;
    let ok;
    if (q.type === 'nat') { const v = parseFloat(natIn.value); ok = !isNaN(v) && v >= q.lo && v <= q.hi; }
    else { const A = new Set(q.ans); ok = A.size === chosen.size && [...A].every(x => chosen.has(x)); $$('.opt', optsEl).forEach((o, i) => { if (A.has(i)) o.classList.add('right'); else if (chosen.has(i)) o.classList.add('wrong'); $('input', o).disabled = true; }); }
    recordQ(q.id, ok);
    const ansTxt = q.type === 'nat' ? `Accepted range ${q.lo} to ${q.hi}` + (q.show ? ` (≈ ${q.show})` : '') : 'Correct: ' + q.ans.map(i => String.fromCharCode(65 + i)).join(', ');
    fb.innerHTML = `<div class="verdict ${ok ? 'ok' : 'no'}">${ok ? '✔ CORRECT' : '✘ NOT QUITE'} — ${ansTxt}</div><div class="exp">${q.exp || ''}</div>`;
    if (btn) btn.hidden = true;
  };
  let btn;
  if (q.type === 'nat') {
    natIn = h('input', { type: 'number', step: 'any', 'aria-label': 'your answer', placeholder: 'your answer', inputmode: 'decimal' });
    btn = h('button', { class: 'btn primary', onclick: () => reveal() }, 'Check');
    box.append(h('div', { class: 'nat' }, natIn, btn));
  } else {
    q.opts.forEach((t, i) => {
      const inp = h('input', { type: q.type === 'msq' ? 'checkbox' : 'radio', name: 'q' + q.id, id: `o${q.id}_${i}` });
      const o = h('label', { class: 'opt', for: inp.id }, inp, h('span', { html: `<b>${String.fromCharCode(65 + i)}.</b> ${t}` }));
      inp.addEventListener('change', () => {
        if (answered) return;
        if (q.type === 'msq') { inp.checked ? chosen.add(i) : chosen.delete(i); o.classList.toggle('sel', inp.checked); }
        else { chosen = new Set([i]); $$('.opt', optsEl).forEach(x => x.classList.remove('sel')); o.classList.add('sel'); reveal(); }
      });
      optsEl.append(o);
    });
    box.append(optsEl);
    if (q.type === 'msq') { btn = h('button', { class: 'btn primary', onclick: () => reveal() }, 'Check answer'); box.append(btn); }
  }
  box.append(h('button', { class: 'btn', style: 'margin-top:8px', onclick: () => { if (!answered) { if (q.type === 'nat' && !natIn.value) natIn.value = ''; showOnly(); } } }, 'Just show the answer'));
  function showOnly() {
    answered = true;
    if (q.type !== 'nat') { const A = new Set(q.ans); $$('.opt', optsEl).forEach((o, i) => { if (A.has(i)) o.classList.add('right'); $('input', o).disabled = true; }); }
    const ansTxt = q.type === 'nat' ? `Accepted range ${q.lo} to ${q.hi}` + (q.show ? ` (≈ ${q.show})` : '') : 'Correct: ' + q.ans.map(i => String.fromCharCode(65 + i)).join(', ');
    fb.innerHTML = `<div class="verdict ok">${ansTxt}</div><div class="exp">${q.exp || ''}</div>`; if (btn) btn.hidden = true;
  }
  box.append(fb);
  return box;
}
function questionsFor(topicId) { return (window.QBANK || []).filter(q => q.topic === topicId); }

/* ===== registry + router ===== */
const PAGES = [];
const EMBED = {}; const embed = (id, fn) => (EMBED[id] = EMBED[id] || []).push(fn);
const MODULES = {
  home: 'Start here', m1: '1 · Charging basics', m2: '2 · Single-phase PFC', m3: '3 · Three-phase AC-DC', m4: '4 · Isolated DC-DC', m5: '5 · Protocols & stations'
};
function page(p) { PAGES.push(p); }
const done = store.get('done', {});
function stars(n) { return '★'.repeat(n) + '☆'.repeat(3 - n); }
const IMPORT = ['', 'Good to know', 'Likely asked', 'Must know'];
function topicHeader(p) {
  const nq = questionsFor(p.id).length;
  return `<div class="crumb"><span>${MODULES[p.mod]}</span><span class="pill">WEEK ${p.wk}</span><span class="pill hot">${stars(p.stars)} ${IMPORT[p.stars]}</span>${nq ? `<span class="pill">${nq} assignment Qs</span>` : ''}</div><h1>${p.title}</h1>${p.lede ? `<p class="lede">${p.lede}</p>` : ''}`;
}
function renderPage(id) {
  while (LAB_STOPS.length) { try { LAB_STOPS.pop()(); } catch (e) {} }
  const p = PAGES.find(x => x.id === id) || PAGES[0];
  const root = $('#page'); root.innerHTML = '';
  if (p.topic) root.insertAdjacentHTML('beforeend', topicHeader(p));
  const body = h('div'); root.append(body);
  p.render(body, p);
  (EMBED[p.id] || []).forEach(fn => { const box = h('div', { class: 'embed' }); const first = body.querySelector('.lab'); first ? body.insertBefore(box, first) : body.append(box); fn(box); });
  if (p.topic) {
    const qs = questionsFor(p.id);
    if (qs.length) {
      root.append(h('h2', { id: 'practice' }, 'Assignment questions on this topic'));
      root.append(h('p', { class: 'cap' }, 'These came from the course assignments, so questions like them are the most likely to reappear. Answer first, then read the reason.'));
      qs.forEach(q => root.append(renderQuestion(q)));
    }
    const i = PAGES.indexOf(p), topics = PAGES.filter(x => x.topic), ti = topics.indexOf(p);
    const mk = h('button', { class: 'btn' + (done[p.id] ? '' : ' primary'), onclick: (e) => { done[p.id] = !done[p.id]; store.set('done', done); e.target.textContent = done[p.id] ? '✔ Studied (tap to undo)' : 'Mark as studied'; e.target.classList.toggle('primary', !done[p.id]); buildNav(); } }, done[p.id] ? '✔ Studied (tap to undo)' : 'Mark as studied');
    root.append(h('div', { class: 'nextprev' }, ti > 0 ? h('button', { class: 'btn', onclick: () => go(topics[ti - 1].id) }, '← ' + topics[ti - 1].title) : h('span'), mk, ti < topics.length - 1 ? h('button', { class: 'btn', onclick: () => go(topics[ti + 1].id) }, topics[ti + 1].title + ' →') : h('span')));
  }
  document.title = 'Charging Infrastructure Lab';
  $('#main').scrollTop = 0;
  $$('.navitem').forEach(b => b.getAttribute('data-id') === p.id ? b.setAttribute('aria-current', 'page') : b.removeAttribute('aria-current'));
  closeRail();
}
function go(id) { if (location.hash !== '#' + id) location.hash = id; else renderPage(id); }
function buildNav() {
  const nav = $('#nav'); const q = ($('#search').value || '').toLowerCase().trim(); nav.innerHTML = '';
  let lastMod = null;
  PAGES.forEach(p => {
    if (q && !(p.title + ' ' + (p.kw || '') + ' ' + MODULES[p.mod]).toLowerCase().includes(q)) return;
    if (p.mod !== lastMod) { nav.append(h('div', { class: 'navmod' }, MODULES[p.mod])); lastMod = p.mod; }
    nav.append(h('button', { class: 'navitem', 'data-id': p.id, onclick: () => go(p.id), 'aria-current': (location.hash.slice(1) || 'home') === p.id ? 'page' : null },
      p.wk ? h('span', { class: 'wk' }, 'W' + p.wk) : null, h('span', {}, p.title), done[p.id] ? h('span', { class: 'done', title: 'studied' }) : (p.stars ? h('span', { class: 'stars', title: IMPORT[p.stars] }, '★'.repeat(p.stars)) : null)));
  });
}
function closeRail() { $('#rail').classList.remove('open'); const s = $('.scrim'); if (s) s.remove(); }
function openRail() { $('#rail').classList.add('open'); document.body.append(h('div', { class: 'scrim', onclick: closeRail })); }
function boot() {
  Theme.apply(); buildNav();
  $('#search').addEventListener('input', buildNav);
  $$('.themebtn').forEach(b => b.addEventListener('click', () => { const m = Theme.cycle(); $$('.themebtn').forEach(x => x.textContent = 'Theme: ' + m); }));
  $$('.themebtn').forEach(x => x.textContent = 'Theme: ' + Theme.mode);
  $('#menu').addEventListener('click', openRail);
  window.addEventListener('hashchange', () => renderPage(location.hash.slice(1) || 'home'));
  renderPage(location.hash.slice(1) || 'home');
}
