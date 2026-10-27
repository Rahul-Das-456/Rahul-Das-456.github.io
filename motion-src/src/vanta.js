// Vanta and three.js, loaded only when a background first comes on screen.
// Vanta's builds read THREE from window when they load, so it is set before they are imported.
import * as THREE from 'three';

window.THREE = THREE;
const [net, dots, waves] = await Promise.all([
  import('vanta/dist/vanta.net.min.js'),
  import('vanta/dist/vanta.dots.min.js'),
  import('vanta/dist/vanta.waves.min.js'),
]);
// the UMD builds arrive wrapped once or twice in { default }
const pick = (m) => { let x = m; while (x && typeof x !== 'function' && x.default) x = x.default; return x; };

export default { net: pick(net), dots: pick(dots), waves: pick(waves) };
