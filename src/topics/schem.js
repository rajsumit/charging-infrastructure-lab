/* ===== tiny schematic toolkit (SVG strings) + current-path animator ===== */
const SCH = {
  len: { R: 40, L: 48, C: 16, D: 24, S: 36, V: 38, AC: 38, GEN: 38, BAT: 16 },
  part(p) {
    const [ax, ay] = p.a, [bx, by] = p.b, dx = bx - ax, dy = by - ay, Lt = Math.hypot(dx, dy), ang = Math.atan2(dy, dx) * 180 / Math.PI, cx = (ax + bx) / 2, cy = (ay + by) / 2, n = (this.len[p.k] || 30) / 2, h = Lt / 2;
    const st = `<line x1="${-h}" y1="0" x2="${-n}" y2="0"/><line x1="${n}" y1="0" x2="${h}" y2="0"/>`;
    let b = '';
    switch (p.k) {
      case 'R': b = '<rect x="-20" y="-7" width="40" height="14" rx="2"/>'; break;
      case 'L': b = '<path d="M-24 0a6 6 0 0 1 12 0a6 6 0 0 1 12 0a6 6 0 0 1 12 0a6 6 0 0 1 12 0"/>'; break;
      case 'C': b = '<line x1="-6" y1="-14" x2="-6" y2="14"/><line x1="6" y1="-14" x2="6" y2="14"/>'; break;
      case 'D': b = '<path class="dz" d="M-12 -11L-12 11L10 0Z"/><line x1="11" y1="-11" x2="11" y2="11"/>'; break;
      case 'S': b = '<circle cx="-18" cy="0" r="2.6" class="dz"/><circle cx="18" cy="0" r="2.6"/><line class="lev-c" x1="-18" y1="0" x2="18" y2="0"/><line class="lev-o" x1="-18" y1="0" x2="13.8" y2="-16.9"/>'; break;
      case 'V': b = '<circle r="19"/><line x1="6" y1="0" x2="14" y2="0"/><line x1="10" y1="-4" x2="10" y2="4"/><line x1="-14" y1="0" x2="-6" y2="0"/>'; break;
      case 'AC': b = '<circle r="19"/><path d="M-11 0q5.5-13 11 0t11 0"/>'; break;
      case 'GEN': b = '<circle r="19"/><path d="M-11 6v-12h7v12h7v-12h7"/>'; break;
      case 'BAT': b = '<line x1="6" y1="-15" x2="6" y2="15"/><line x1="-6" y1="-8" x2="-6" y2="8"/>'; break;
    }
    const vert = Math.abs(dy) > Math.abs(dx), sd = p.side || 1;
    const lab = p.l ? (vert ? `<text x="${cx + sd * 25}" y="${cy + 4}" text-anchor="${sd > 0 ? 'start' : 'end'}"${p.lid ? ` id="${p.lid}"` : ''}>${p.l}</text>` : `<text x="${cx}" y="${cy - 17 * sd + (sd < 0 ? 10 : 0)}" text-anchor="middle"${p.lid ? ` id="${p.lid}"` : ''}>${p.l}</text>`) : '';
    return `<g class="pt k-${p.k}${p.on ? ' on' : ''}${p.closed ? ' closed' : ''}"${p.id ? ` data-id="${p.id}"` : ''}><g transform="translate(${cx} ${cy}) rotate(${ang})">${st}${b}</g>${lab}</g>`;
  },
  wire: pts => `<path class="wr" d="M${pts.map(p => p.join(' ')).join('L')}"/>`,
  dot: ([x, y]) => `<circle class="jd" cx="${x}" cy="${y}" r="3.2"/>`,
  gnd: ([x, y]) => `<g class="gd"><line x1="${x}" y1="${y}" x2="${x}" y2="${y + 10}"/><line x1="${x - 11}" y1="${y + 10}" x2="${x + 11}" y2="${y + 10}"/><line x1="${x - 7}" y1="${y + 15}" x2="${x + 7}" y2="${y + 15}"/><line x1="${x - 3}" y1="${y + 20}" x2="${x + 3}" y2="${y + 20}"/></g>`,
  text: ([x, y], t, cls = 'tx', a = 'middle') => `<text class="${cls}" x="${x}" y="${y}" text-anchor="${a}">${t}</text>`,
  flow: (pts, c = '--ch-i', id = '', cls = '') => `<path class="flow ${cls}"${id ? ` id="${id}"` : ''} style="stroke:var(${c})" d="M${pts.map(p => p.join(' ')).join('L')}"/>`,
  core: (x, y1, y2) => `<line class="core" x1="${x - 3}" y1="${y1}" x2="${x - 3}" y2="${y2}"/><line class="core" x1="${x + 3}" y1="${y1}" x2="${x + 3}" y2="${y2}"/>`,
  pdot: ([x, y]) => `<circle class="pdot" cx="${x}" cy="${y}" r="3.4"/>`
};
/* Interval animator: cfg = {title, cap, w, h, draw(onSet) -> svg body, iv:[{n, on:[ids], loops:[[pts, color]], txt, span:[t0,t1]}], wave() -> {ax, s, lg}} */
function circuitAnimator(parent, cfg) {
  const L = lab(parent, cfg.title, cfg.cap);
  const chips = h('div', { class: 'seg ivseg', role: 'group' }); L.add(chips);
  const svgBox = h('div', { class: 'svgwrap' }); L.add(svgBox);
  const txt = L.add(h('div', { class: 'ivtxt' }));
  const sc = cfg.wave ? L.scope(Object.assign({ h: 170 }, cfg.wave().ax)) : null; const lg = cfg.wave ? L.add(h('div', { class: 'legend' })) : null;
  const ctl = h('div', { class: 'nextprev', style: 'margin:6px 0 0;justify-content:flex-start' }); L.add(ctl);
  let k = 0, timer = null;
  const pb = h('button', { class: 'btn primary', onclick: () => { if (timer) stop(); else { pb.textContent = '❚❚ Pause'; timer = setInterval(() => show((k + 1) % cfg.iv.length), cfg.dwell || 2400); } } }, '▶ Auto-play intervals');
  const stop = () => { clearInterval(timer); timer = null; pb.textContent = '▶ Auto-play intervals'; };
  ctl.append(h('button', { class: 'btn', onclick: () => { stop(); show((k - 1 + cfg.iv.length) % cfg.iv.length); } }, '← Prev'), pb, h('button', { class: 'btn', onclick: () => { stop(); show((k + 1) % cfg.iv.length); } }, 'Next →'));
  onLeave(() => timer && clearInterval(timer));
  cfg.iv.forEach((iv, i) => chips.append(h('button', { 'aria-pressed': i === 0, onclick: () => { stop(); show(i); } }, (i + 1) + '. ' + iv.n)));
  function show(i) {
    k = i; const iv = cfg.iv[i];
    $$('button', chips).forEach((b, j) => b.setAttribute('aria-pressed', j === i));
    const on = new Set(iv.on || []);
    svgBox.innerHTML = `<svg class="sch" viewBox="0 0 ${cfg.w} ${cfg.h}" role="img" aria-label="${cfg.title}: ${iv.n}">${cfg.draw(on, iv).replace('<!--FLOW-->', (iv.loops || []).map(([p, c]) => SCH.flow(p, c || '--ch-i')).join(''))}</svg>`;
    txt.innerHTML = `<b>${iv.n}.</b> ${iv.txt}`;
    if (sc) { const w = cfg.wave(), sp = iv.span || []; const ax = w.ax, band = []; (Array.isArray(sp[0]) ? sp : [sp]).forEach(s => s.length && band.push({ x: [s[0], s[0], s[1], s[1]], y: [ax.ymin, ax.ymax, ax.ymax, ax.ymin], c: '--hot', w: .01, fill: true, fillTo: ax.ymin })); sc.draw(band.concat(w.s)); lg.innerHTML = (w.lg || []).map(x => `<span style="--c:var(${x[1]})">${x[0]}</span>`).join('') + '<span style="--c:var(--hot)">this interval</span>'; }
  }
  show(0);
  return L;
}
