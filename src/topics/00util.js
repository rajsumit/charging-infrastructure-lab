const H = (body, html) => body.insertAdjacentHTML('beforeend', html);
const MUST = (...li) => `<div class="must"><h4>★ Must remember</h4><ul>${li.map(x => `<li>${x}</li>`).join('')}</ul></div>`;
const F = (t, tag) => `<div class="formula">${t}${tag ? `<span class="tag">${tag}</span>` : ''}</div>`;
const HOT = (t, q) => `<mark class="hot"${q ? ` data-q="${q}"` : ''}>${t}</mark>`;
const TBL = (head, rows) => `<div class="tblwrap"><table><thead><tr>${head.map(x => `<th>${x}</th>`).join('')}</tr></thead><tbody>${rows.map(r => `<tr>${r.map(x => `<td>${x}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`;
const CARD = (t, html) => `<div class="card"><h3>${t}</h3>${html}</div>`;
const T2 = 2 * Math.PI;
const rng = (n, f) => Array.from({ length: n }, (_, i) => f(i));
/* square/PWM helper: returns 1/0 */
const tri = (t) => { const x = t - Math.floor(t); return x < .5 ? 4 * x - 1 : 3 - 4 * x; };
