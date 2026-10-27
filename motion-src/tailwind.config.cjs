// Utilities for the Cult UI and Watermelon islands only: scoped under .tw, no preflight,
// so nothing here can restyle the rest of the site.
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  important: '.tw',
  darkMode: 'class',
  corePlugins: { preflight: false },
  theme: {
    extend: {
      fontFamily: { mono: ['ui-monospace', 'SF Mono', 'Menlo', 'Consolas', 'monospace'] },
      keyframes: { 'caret-blink': { '0%,70%,100%': { opacity: '1' }, '20%,50%': { opacity: '0' } } },
      animation: { 'caret-blink': 'caret-blink 1.25s ease-out infinite' },
      colors: {
        background: '#0d1117',
        foreground: '#e6edf3',
        muted: { DEFAULT: '#161b22', foreground: '#8b949e' },
        primary: { DEFAULT: '#ff5a4a', foreground: '#121a30' },
        border: '#30363d',
      },
    },
  },
};
