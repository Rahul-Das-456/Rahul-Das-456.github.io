# Motion layer source

Builds `assets/motion/`: Lenis, GSAP + ScrollTrigger, Vanta, React Bits (SplitText, CountUp, Magnet,
ScrollVelocity), Cult UI (LightBoard, TerminalAnimation) and Watermelon UI (RunActionButton, CopyConfirm).

```sh
cd motion-src
npm ci
npx esbuild src/main.jsx --bundle --splitting --format=esm --minify --target=es2022 --jsx=automatic \
  --outdir=out --entry-names=main '--chunk-names=chunk-[hash]' --legal-comments=eof
npx tailwindcss -c tailwind.config.cjs -i src/islands.css -o out/islands.css --minify
find ../assets/motion -name "*.js" -delete && cp out/* ../assets/motion/
```

Tailwind only styles the Cult UI and Watermelon islands: utilities are scoped under `.tw` with preflight off.

Licences: React Bits by David Haz, MIT + Commons Clause (`src/rb/LICENSE.md`); Cult UI, MIT (`src/cult/LICENSE.md`);
Watermelon UI, MIT (`src/wm/LICENSE.md`). The components are adapted to this site's palette and layout.
