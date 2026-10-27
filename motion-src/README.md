# Motion layer source

Builds `assets/motion/` (Lenis, GSAP + ScrollTrigger, Vanta, and four React Bits components: SplitText, CountUp, Magnet, ScrollVelocity).

```sh
cd motion-src
npm ci
npx esbuild src/main.jsx --bundle --splitting --format=esm --minify --target=es2022 --jsx=automatic \
  --outdir=out --entry-names=main '--chunk-names=chunk-[hash]' --legal-comments=eof
rm -f ../assets/motion/*.js && cp out/*.js ../assets/motion/
```

React Bits components in `src/rb/` are by David Haz, MIT + Commons Clause (see `src/rb/LICENSE.md`).
