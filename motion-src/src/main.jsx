// Site motion layer: Lenis smooth scroll, GSAP scroll effects, Vanta backgrounds and React Bits islands.
// Loaded as a module on every page. The HTML underneath stays complete, so a failed load leaves a working page.
import React, { useLayoutEffect, useRef } from 'react';
import { createRoot } from 'react-dom/client';
import Lenis from 'lenis';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitText from './rb/SplitText.jsx';
import CountUp from './rb/CountUp.jsx';
import Magnet from './rb/Magnet.jsx';
import ScrollVelocity from './rb/ScrollVelocity.jsx';

gsap.registerPlugin(ScrollTrigger);

const root = document.documentElement;
const calm = matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = matchMedia('(hover: hover) and (pointer: fine)').matches;
root.classList.add('motion-ready');

// ---------- Lenis: smooth scroll driven by the GSAP ticker ----------
if (!calm) {
  const bar = document.querySelector('.bar');
  const lenis = new Lenis({ lerp: 0.11, anchors: { offset: bar ? -bar.offsetHeight - 12 : 0 } });
  lenis.on('scroll', ScrollTrigger.update);
  gsap.ticker.add((time) => lenis.raf(time * 1000));
  gsap.ticker.lagSmoothing(0);
  window.__lenis = lenis;
}

// ---------- GSAP: scroll-linked moves ----------
if (!calm) {
  const memo = document.querySelector('.memo');
  if (memo) {
    gsap.to(memo, {
      y: () => innerHeight * 0.12, scale: 0.86, ease: 'none',
      scrollTrigger: { trigger: '.hero', start: 'top top', end: 'bottom top', scrub: true },
    });
  }
  const card = document.querySelector('.exhibit__card');
  if (card && !card.closest('.exhibit--short')) {
    gsap.to(card, { y: 60, ease: 'none', scrollTrigger: { trigger: card.parentElement, start: 'top top', end: 'bottom top', scrub: true } });
  }
  const film = document.getElementById('floor');
  if (film) {
    gsap.fromTo(film, { scale: 1.18 }, { scale: 1, ease: 'none', scrollTrigger: { trigger: film.closest('section'), start: 'top bottom', end: 'bottom top', scrub: true } });
  }
  const sheet = document.querySelector('.cv__sheet');
  if (sheet) {
    gsap.fromTo(sheet, { rotate: -2.2 }, { rotate: -0.8, ease: 'none', scrollTrigger: { trigger: sheet, start: 'top bottom', end: 'top 40%', scrub: true } });
  }
}

// ---------- Vanta: one effect per place, built on screen, torn down off screen ----------
const webgl = (() => { try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; } })();
const navy = 0x121a30, red = 0xff5a4a, paper = 0xe7e5df;
const places = [
  { sel: '.hero__room', effect: 'net', opts: { color: red, backgroundColor: navy, points: 9, maxDistance: 22, spacing: 17, showDots: true } },
  { sel: '.exhibit__room', effect: 'net', opts: { color: red, backgroundColor: navy, points: 8, maxDistance: 20, spacing: 18, showDots: true } },
  { sel: '.ledger', effect: 'dots', bleed: true, opts: { color: red, color2: paper, backgroundColor: navy, size: 2.4, spacing: 34, showLines: false } },
  { sel: '.contact', effect: 'waves', bleed: true, opts: { color: 0x0b1122, shininess: 8, waveHeight: 12, waveSpeed: 0.5, zoom: 0.85 } },
];
if (!calm && webgl) {
  let vanta = null;
  const load = () => (vanta ||= import('./vanta.js'));
  for (const place of places) {
    const host = document.querySelector(place.sel);
    if (!host) continue;
    const layer = document.createElement('div');
    layer.className = 'vanta-layer' + (place.bleed ? ' vanta-layer--bleed' : '');
    layer.setAttribute('aria-hidden', 'true');
    if (place.bleed) host.classList.add('has-vanta');
    host.append(layer);
    let fx = null, want = false;
    new IntersectionObserver(async ([e]) => {
      want = e.isIntersecting;
      if (want && !fx) {
        const make = (await load()).default[place.effect];
        if (want && !fx) { fx = make({ el: layer, mouseControls: finePointer, touchControls: false, gyroControls: false, scale: 1, scaleMobile: 1, ...place.opts }); layer.classList.add('is-on'); }
      } else if (!want && fx) { fx.destroy(); fx = null; layer.classList.remove('is-on'); }
    }, { rootMargin: '120px 0px' }).observe(host);
  }
}

// ---------- React Bits islands ----------
const mount = (host, node) => createRoot(host).render(node);

// SplitText on the page title and section headings; aria-label keeps the heading's accessible name
const headings = [...document.querySelectorAll('.memo h1, main .head, section > .head, .exhibit__head h2, .cv h2, .tools h2, .letter h2:not(.sr-only), .exhibit__title')];
for (const el of new Set(headings)) {
  if (el.classList.contains('sr-only')) continue;
  const isTitle = el.matches('.memo h1, .exhibit__title');
  if (el.children.length && !isTitle) continue;
  // child spans (the name's two halves) carry no space between them in the markup
  const text = (el.children.length ? [...el.children].map((c) => c.textContent).join(' ') : el.textContent).replace(/\s+/g, ' ').trim();
  if (!text) continue;
  const host = Object.assign(document.createElement('span'), { className: 'rb-split' });
  // letters split one by one read badly, so the title is named by its label; split words stay readable as they are
  if (isTitle) { host.setAttribute('aria-hidden', 'true'); el.setAttribute('aria-label', text); }
  el.replaceChildren(host);
  // SplitText runs this heading's entrance; the page's own fade would hide it a second time
  el.removeAttribute('data-reveal');
  el.classList.add('is-in');
  mount(host, <SplitText text={text} tag="span" textAlign="inherit" splitType={isTitle ? 'words, chars' : 'words'} delay={isTitle ? 32 : 70} duration={1} effect="rise" hoverEffect="lift" trigger={isTitle ? 'load' : 'view'} rootMargin="-40px" aria={isTitle ? 'auto' : 'none'} />);
}

// CountUp on the ledger figures
for (const el of document.querySelectorAll('.ledger .fig')) {
  const value = el.textContent.trim();
  const to = Number(value.replace(/,/g, ''));
  if (!Number.isFinite(to)) continue;
  if (calm) continue;
  el.textContent = '';
  mount(el, <CountUp to={to} separator={value.includes(',') ? ',' : ''} duration={1.6} />);
}

// Magnet on the main buttons, for mouse and trackpad only
const Adopt = ({ node }) => {
  const ref = useRef(null);
  useLayoutEffect(() => { ref.current.append(node); }, [node]);
  return <span ref={ref} className="magnet__slot" />;
};
if (finePointer && !calm) {
  for (const el of document.querySelectorAll('.memo__foot .btn, .cv__acts .btn, .coupon .btn, .tear .btn, .bar__action')) {
    const host = document.createElement('span');
    host.className = 'magnet-host';
    el.before(host);
    mount(host, <Magnet padding={70} magnetStrength={5} maxOffset={12} wrapperClassName="magnet" innerClassName="magnet__inner"><Adopt node={el} /></Magnet>);
  }
}

// ScrollVelocity strip of the patterns and the rulebooks
const strip = document.getElementById('velocity');
if (strip && !calm) {
  mount(strip, (
    <ScrollVelocity
      texts={['Spoofing · Layering · Wash trading · Marking the close · Front-running · Pre-arranged trades', 'CFTC · NFA · SEC · FINRA · CME Group · Cboe · ICE · Nasdaq SMARTS']}
      velocity={36}
      numCopies={4}
      outlineAlternate
      gap={24}
      parallaxClassName="velocity__row"
      scrollerClassName="velocity__track"
    />
  ));
}

// ---------- Cult UI and Watermelon UI islands, with their scoped utility styles ----------
const islandStyles = document.createElement('link');
islandStyles.rel = 'stylesheet';
islandStyles.href = new URL('./islands.css', import.meta.url).href;
document.head.append(islandStyles);
import('./islands.jsx');

ScrollTrigger.refresh();
addEventListener('load', () => ScrollTrigger.refresh());
