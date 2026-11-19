// Surveillance pattern replays: one engine, data from patterns-data.js.
(() => {
  const P = window.PATTERNS;
  const root = document.getElementById('lab');
  if (!P || !root) return;
  root.hidden = false;
  const $ = (s) => root.querySelector(s);
  const picker = document.getElementById('picker');
  const svg = $('#chart');
  const ladderWrap = $('#pladder');
  const ladderBody = $('#pladder tbody');
  const tape = $('#tape tbody');
  const stepsEl = $('#psteps');
  const scrub = $('#pscrub');
  const board = $('#pboard');
  const playBtn = $('#pplay');
  const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
  let pat = null, cur = 0, timer = null;

  // picker, grouped by family
  const fams = [...new Set(P.map((p) => p.fam))];
  picker.innerHTML = fams.map((f) => `<div class="pick__grp" role="group" aria-label="${esc(f)}"><p class="pick__fam">${esc(f)}</p><div class="pick__row">${
    P.filter((p) => p.fam === f).map((p) => `<button type="button" class="pick__btn" data-id="${p.id}" aria-pressed="false">${esc(p.name)}</button>`).join('')
  }</div></div>`).join('');
  picker.addEventListener('click', (e) => {
    const b = e.target.closest('.pick__btn');
    if (!b) return;
    select(b.dataset.id, true);
  });

  const fmt = (v) => v.toLocaleString('en-US', { minimumFractionDigits: pat.dp, maximumFractionDigits: pat.dp });
  const val = (pt) => (Array.isArray(pt) ? pt[0] : pt);

  function select(id, focusStage) {
    stop();
    pat = P.find((p) => p.id === id) || P[0];
    picker.querySelectorAll('.pick__btn').forEach((b) => b.setAttribute('aria-pressed', String(b.dataset.id === pat.id)));
    $('#pname').textContent = pat.name;
    $('#psum').textContent = pat.sum;
    $('#pinst').textContent = pat.inst;
    $('#plaw').innerHTML = pat.law.map((l) => `<li>${esc(l)}</li>`).join('');
    $('#pflags').innerHTML = pat.flags.map((l) => `<li>${esc(l)}</li>`).join('');
    $('#pwork').innerHTML = pat.work.map((l) => `<li>${esc(l)}</li>`).join('');
    $('#pdata').innerHTML = pat.data.map((l) => `<li>${esc(l)}</li>`).join('');
    const G = (window.GUARDS || {})[pat.id] || [];
    $('#pguard').innerHTML = G.map(([c, l, h]) => `<tr data-l="${esc(l)}"><td>${esc(c)}</td><td><span>${esc(l)}</span></td><td>${esc(h)}</td></tr>`).join('');
    root.querySelector('.pguard').hidden = !G.length;
    $('#palert b').textContent = 'Alert: ' + pat.alert[0];
    $('#palert span').textContent = pat.alert[1];
    stepsEl.innerHTML = pat.steps.map((s, i) => `<li><button type="button" class="pstep" data-i="${i}"><b>${esc(s.h)}</b><span>${esc(s.p)}</span></button></li>`).join('');
    scrub.max = pat.steps.length - 1;
    ladderWrap.hidden = !pat.steps.some((s) => s.L);
    // fixed scales for the whole replay
    const all = pat.steps.flatMap((s) => s.px || []).map(val);
    pat._n = all.length; pat._lo = Math.min(...all); pat._hi = Math.max(...all);
    $('#prange').textContent = `Range ${fmt(pat._lo)} to ${fmt(pat._hi)}`;
    if (history.replaceState) history.replaceState(null, '', '#' + pat.id);
    cur = -1; show(0);
    if (focusStage && matchMedia('(max-width: 900px)').matches) board.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function drawChart(pts) {
    const W = 640, H = 220, L = 8, R = 8, T = 14, B = 14;
    const pad = (pat._hi - pat._lo) * 0.12 || 1;
    const lo = pat._lo - pad, hi = pat._hi + pad;
    const x = (i) => L + (pat._n > 1 ? i / (pat._n - 1) : 0) * (W - L - R);
    const y = (v) => T + (1 - (v - lo) / (hi - lo)) * (H - T - B);
    const line = pts.map((p, i) => `${x(i).toFixed(1)},${y(val(p)).toFixed(1)}`).join(' ');
    const marks = pts.map((p, i) => (Array.isArray(p) ? `<circle cx="${x(i).toFixed(1)}" cy="${y(p[0]).toFixed(1)}" r="6" class="ch__x"/>` : '')).join('');
    const lastV = val(pts[pts.length - 1]);
    const ly = y(lastV);
    svg.innerHTML =
      `<polyline points="${line}" class="ch__line"/>` + marks +
      `<circle cx="${x(pts.length - 1).toFixed(1)}" cy="${ly.toFixed(1)}" r="4" class="ch__now"/>`;
    svg.setAttribute('aria-label', `${pat.inst}: price path to ${fmt(lastV)}. Red dots are trades by the account under review.`);
    return lastV;
  }

  function drawLadder(rows) {
    if (!rows) return;
    const max = Math.max(...rows.map((r) => Math.max(r[1], r[2])), 1);
    ladderBody.innerHTML = rows.map(([p, b, a, xb = 0, xa = 0, note = '']) => {
      const w = (n) => (n / max * 100).toFixed(1) + '%';
      return `<tr><td><div class="pc pc--bid"><span class="pq${xb ? ' is-x' : ''}">${b || ''}</span><span class="pb"><i class="own" style="width:${w(b - xb)}"></i><i class="x" style="width:${w(xb)}"></i></span></div></td>` +
        `<td class="ppx">${fmt(p)}</td>` +
        `<td><div class="pc pc--ask"><span class="pb"><i class="own" style="width:${w(a - xa)}"></i><i class="x" style="width:${w(xa)}"></i></span><span class="pq${xa ? ' is-x' : ''}">${a || ''}</span>${note ? `<span class="pnote">${esc(note)}</span>` : ''}</div></td></tr>`;
    }).join('');
  }

  function show(i) {
    i = Math.max(0, Math.min(pat.steps.length - 1, i));
    if (i === cur) return;
    cur = i;
    const upto = pat.steps.slice(0, i + 1);
    const pts = upto.flatMap((s) => s.px || []);
    const lastV = drawChart(pts);
    const first = val(pts[0]);
    $('#plast').textContent = fmt(lastV);
    const d = lastV - first;
    const chg = $('#pchg');
    chg.textContent = Math.abs(d) < 1e-9 ? '' : (d < 0 ? 'down ' : 'up ') + fmt(Math.abs(d));
    chg.className = d < 0 ? 'dn' : d > 0 ? 'up' : '';
    let L = null;
    for (const s of upto) if (s.L) L = s.L;
    drawLadder(L);
    const ev = upto.flatMap((s) => s.ev || []).slice(-7).reverse();
    tape.innerHTML = ev.map(([t, a, e, x]) => `<tr${x ? ' class="is-x"' : ''}><td>${esc(t)}</td><td>${esc(a)}</td><td>${esc(e)}</td></tr>`).join('');
    const last = i === pat.steps.length - 1;
    board.classList.toggle('is-alert', last);
    scrub.value = i;
    scrub.setAttribute('aria-valuetext', `Step ${i + 1} of ${pat.steps.length}: ${pat.steps[i].h}`);
    stepsEl.querySelectorAll('.pstep').forEach((b, k) => { b.classList.toggle('is-on', k === i); if (k === i) b.setAttribute('aria-current', 'step'); else b.removeAttribute('aria-current'); });
    $('#pcount').textContent = `Step ${i + 1} of ${pat.steps.length}`;
  }

  function stop() { clearInterval(timer); timer = null; playBtn.textContent = 'Play'; }
  stepsEl.addEventListener('click', (e) => { const b = e.target.closest('.pstep'); if (b) { stop(); show(+b.dataset.i); } });
  $('#pprev').onclick = () => { stop(); show(cur - 1); };
  $('#pnext').onclick = () => { stop(); show(cur + 1); };
  playBtn.onclick = () => {
    if (timer) return stop();
    if (cur >= pat.steps.length - 1) show(0);
    playBtn.textContent = 'Pause';
    timer = setInterval(() => { if (cur >= pat.steps.length - 1) return stop(); show(cur + 1); }, 1800);
  };
  scrub.oninput = () => { stop(); show(+scrub.value); };

  // index rows link into the replay
  document.querySelectorAll('[data-open]').forEach((a) => a.addEventListener('click', (e) => {
    e.preventDefault(); select(a.dataset.open); root.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }));

  const fromHash = location.hash.slice(1);
  select(P.some((p) => p.id === fromHash) ? fromHash : 'spoofing');
  addEventListener('hashchange', () => { const h = location.hash.slice(1); if (P.some((p) => p.id === h) && h !== pat.id) select(h); });
})();
