// Payoff chart layer for the visualizers. Each page's draw() leaves its scales on svg._viz:
// { key, xmin, xmax, ymin, ymax, ML, MT, IW, IH, f(price) -> P&L, s0, mult, unit }
// This fills profit and loss, names them, and adds a crosshair the pointer or arrow keys can move.
(() => {
  const svg = document.getElementById('chart-svg');
  if (!svg) return;
  const box = svg.closest('.chart-box');
  const NS = 'http://www.w3.org/2000/svg';
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

  const readout = document.createElement('div');
  readout.className = 'readout';
  readout.setAttribute('aria-live', 'polite');
  readout.innerHTML = '<p class="readout__at"></p><p class="readout__val num"></p><p class="readout__hint"></p>';
  box.insertBefore(readout, svg);
  const atEl = readout.children[0], valEl = readout.children[1], hintEl = readout.children[2];

  svg.setAttribute('tabindex', '0');
  svg.setAttribute('role', 'slider');
  svg.setAttribute('aria-label', 'Price at expiry. Use the arrow keys to move along the payoff.');

  const el = (tag, attrs) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); return e; };
  const money = (n, dp) => {
    const a = Math.abs(n);
    const d = dp != null ? dp : (a >= 1000 ? 0 : 2);
    return (n > 0.0049 ? '+$' : n < -0.0049 ? '−$' : '$') + a.toLocaleString(undefined, { minimumFractionDigits: d, maximumFractionDigits: d });
  };
  const price = (n) => '$' + n.toLocaleString(undefined, { maximumFractionDigits: n >= 1000 ? 0 : 2 });

  let lastKey = null, cursor = null, layer = null;

  function enhance() {
    const v = svg._viz;
    readout.hidden = !v;
    if (!v) { layer = null; return; }
    const tx = (s) => v.ML + (s - v.xmin) / (v.xmax - v.xmin) * v.IW;
    const ty = (p) => v.MT + (v.ymax - p) / (v.ymax - v.ymin) * v.IH;
    const y0 = ty(0);

    // the page's own soft fills give way to flat ones
    svg.querySelectorAll('path[fill^="rgba("]').forEach((p) => p.remove());

    const N = 480, up = [], down = [];
    let best = { up: null, down: null };
    for (let i = 0; i <= N; i++) {
      const s = v.xmin + (v.xmax - v.xmin) * i / N;
      const p = v.f(s);
      const x = tx(s);
      const yu = ty(Math.min(Math.max(p, 0), v.ymax));
      const yd = ty(Math.max(Math.min(p, 0), v.ymin));
      up.push(x.toFixed(2) + ',' + yu.toFixed(2));
      down.push(x.toFixed(2) + ',' + yd.toFixed(2));
      const edge = x > v.ML + 70 && x < v.ML + v.IW - 70;
      if (edge && (!best.up || y0 - yu > best.up.h)) best.up = { x, h: y0 - yu, y: (y0 + yu) / 2 };
      if (edge && (!best.down || yd - y0 > best.down.h)) best.down = { x, h: yd - y0, y: (y0 + yd) / 2 };
    }
    const close = ' ' + tx(v.xmax).toFixed(2) + ',' + y0.toFixed(2) + ' ' + tx(v.xmin).toFixed(2) + ',' + y0.toFixed(2);
    const anchor = svg.querySelector('.czero') || svg.firstChild;
    const fresh = v.key !== lastKey;
    const fillUp = el('polygon', { points: up.join(' ') + close, class: 'pz-fill-up' + (fresh ? ' pz-anim' : '') });
    const fillDown = el('polygon', { points: down.join(' ') + close, class: 'pz-fill-down' + (fresh ? ' pz-anim' : '') });
    svg.insertBefore(fillUp, anchor);
    svg.insertBefore(fillDown, anchor);
    if (best.up && best.up.h > 46) {
      const t = el('text', { x: best.up.x, y: best.up.y + 10, class: 'pz-word', 'text-anchor': 'middle' }); t.textContent = 'Profit'; svg.insertBefore(t, anchor);
    }
    if (best.down && best.down.h > 46) {
      const t = el('text', { x: best.down.x, y: best.down.y + 10, class: 'pz-word', 'text-anchor': 'middle' }); t.textContent = 'Loss'; svg.insertBefore(t, anchor);
    }
    const line = svg.querySelector('.cpayoff');
    if (line && fresh && !reduce) line.classList.add('pz-anim');
    if (fresh) cursor = null;
    lastKey = v.key;

    // crosshair
    layer = el('g', { class: 'pz-layer', 'aria-hidden': 'true' });
    layer.style.display = 'none';
    layer.appendChild(el('line', { class: 'pz-cross', x1: 0, x2: 0, y1: v.MT, y2: v.MT + v.IH }));
    layer.appendChild(el('circle', { class: 'pz-dot', r: 10, cx: 0, cy: 0 }));
    const tag = el('g', { class: 'pz-tag' });
    tag.appendChild(el('rect', { x: -38, y: v.MT + v.IH + 6, width: 76, height: 24 }));
    const tt = el('text', { x: 0, y: v.MT + v.IH + 23, 'text-anchor': 'middle' });
    tag.appendChild(tt);
    layer.appendChild(tag);
    svg.appendChild(layer);
    show(cursor == null ? null : cursor);
  }

  function show(s) {
    const v = svg._viz;
    if (!v) return;
    const live = s != null;
    const at = live ? Math.min(v.xmax, Math.max(v.xmin, s)) : v.s0;
    const p = v.f(at) * (v.mult || 1);
    atEl.innerHTML = (live ? 'If the price ends at ' : 'At today’s price, ') + '<b>' + price(at) + '</b>';
    valEl.textContent = money(p);
    valEl.className = 'readout__val num ' + (p > 0.0049 ? 'is-up' : p < -0.0049 ? 'is-down' : 'is-flat');
    hintEl.textContent = (v.unit || 'Profit or loss at expiry') + (live ? '' : '. Point at the chart, or focus it and use the arrow keys.');
    svg.setAttribute('aria-valuenow', at.toFixed(2));
    svg.setAttribute('aria-valuetext', price(at) + ', ' + money(p));
    if (!layer) return;
    if (!live) { layer.style.display = 'none'; return; }
    const tx = v.ML + (at - v.xmin) / (v.xmax - v.xmin) * v.IW;
    const pu = v.f(at);
    const ty = v.MT + (v.ymax - Math.min(v.ymax, Math.max(v.ymin, pu))) / (v.ymax - v.ymin) * v.IH;
    layer.style.display = '';
    layer.children[0].setAttribute('x1', tx); layer.children[0].setAttribute('x2', tx);
    const dot = layer.children[1];
    dot.setAttribute('cx', tx); dot.setAttribute('cy', ty);
    dot.setAttribute('class', 'pz-dot ' + (pu > 0.0049 ? 'is-up' : pu < -0.0049 ? 'is-down' : ''));
    const tag = layer.children[2];
    tag.setAttribute('transform', 'translate(' + Math.min(v.ML + v.IW - 38, Math.max(v.ML + 38, tx)) + ',0)');
    tag.lastChild.textContent = price(at);
  }

  function fromEvent(e) {
    const v = svg._viz;
    if (!v) return null;
    const pt = svg.createSVGPoint();
    pt.x = e.clientX; pt.y = e.clientY;
    const m = svg.getScreenCTM();
    if (!m) return null;
    const x = pt.matrixTransform(m.inverse()).x;
    return v.xmin + (x - v.ML) / v.IW * (v.xmax - v.xmin);
  }

  svg.addEventListener('pointermove', (e) => { const s = fromEvent(e); if (s == null) return; cursor = s; show(s); });
  svg.addEventListener('pointerdown', (e) => { const s = fromEvent(e); if (s == null) return; cursor = s; show(s); });
  svg.addEventListener('pointerleave', (e) => { if (e.pointerType === 'mouse') { cursor = null; show(null); } });
  svg.addEventListener('keydown', (e) => {
    const v = svg._viz;
    if (!v) return;
    const step = (v.xmax - v.xmin) / (e.shiftKey ? 20 : 100);
    const start = cursor == null ? v.s0 : cursor;
    let next = null;
    if (e.key === 'ArrowRight' || e.key === 'ArrowUp') next = start + step;
    else if (e.key === 'ArrowLeft' || e.key === 'ArrowDown') next = start - step;
    else if (e.key === 'Home') next = v.xmin;
    else if (e.key === 'End') next = v.xmax;
    else if (e.key === 'Escape') { cursor = null; show(null); return; }
    if (next == null) return;
    e.preventDefault();
    cursor = Math.min(v.xmax, Math.max(v.xmin, next));
    show(cursor);
  });

  const mo = new MutationObserver(() => { mo.disconnect(); enhance(); mo.takeRecords(); mo.observe(svg, { childList: true }); });
  mo.observe(svg, { childList: true });
  if (svg.firstChild) { mo.disconnect(); enhance(); mo.observe(svg, { childList: true }); }
})();
