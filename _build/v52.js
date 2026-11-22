/* ================================================================
   v52 MELT (2026-11-22), apply-mlow-impermanent-vision, Melt
   Type MELT (or BRAINMELT) and for twenty seconds the island lets go: the picture runs like wet paint (a slow liquid
   warp, gravity drips sliding down in columns), the colour splits at the edges, darks sink to navy, and contour lines
   follow the light across everything, cyan with every fifth one hot pink. Catching a Watcher looking gives you a
   short one. A last screen pass that is switched off, at no cost, when it is not running.
   ================================================================ */
const MELT = { pass: null, k: 0, t: 0, until: 0, dur: 0 };
window.__MELT = MELT;
function meltSetup() {
  if (MELT.pass || !POST || !POST.comp) return;
  const pass = new THREE.ShaderPass({
    uniforms: { tDiffuse: { value: null }, uK: { value: 0 }, uT: { value: 0 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform float uK, uT; varying vec2 vUv;
      float h(float n){ return fract(sin(n * 12.9898) * 43758.5453); }
      void main(){ float w = uK; vec2 uv = vUv;
        uv.x += (sin(uv.y * 9.0 + uT * 1.3) * 0.010 + sin(uv.y * 23.0 - uT * 2.1) * 0.004) * w;
        uv.y += cos(uv.x * 7.0 - uT * 1.1) * 0.010 * w;
        float col = floor(vUv.x * 160.0), r = h(col); float drip = pow(r, 9.0) * 0.035 * w * (0.55 + 0.45 * sin(uT * 0.6 + r * 6.2831));
        uv.y += drip * (0.3 + 0.7 * vUv.y);
        vec2 off = (vUv - 0.5) * 0.014 * w;
        vec3 c = vec3(texture2D(tDiffuse, clamp(uv + off, 0.001, 0.999)).r, texture2D(tDiffuse, clamp(uv, 0.001, 0.999)).g, texture2D(tDiffuse, clamp(uv - off, 0.001, 0.999)).b);
        float l = dot(c, vec3(0.299, 0.587, 0.114)), band = l * 7.0 + uT * 0.12, iso = abs(fract(band) - 0.5);
        float line = smoothstep(0.065, 0.0, 0.5 - iso);
        vec3 lc = mod(floor(band), 5.0) < 0.5 ? vec3(1.0, 0.25, 0.64) : vec3(0.03, 0.87, 1.0);
        c = mix(c, c * vec3(0.55, 0.68, 1.25) + vec3(0.0, 0.01, 0.07), w * 0.55 * (1.0 - l));
        c = mix(c, lc, line * 0.6 * w);
        gl_FragColor = vec4(c, 1.0); }` });
  pass.enabled = false; POST.comp.addPass(pass); MELT.pass = pass;
}
MELT.go = (secs, quiet) => { meltSetup(); if (!MELT.pass || !POST.on) { if (!quiet) toast('THIS SCREEN IS TOO SENSIBLE TO MELT. TRY A COMPUTER.'); return; } MELT.dur = secs; MELT.until = MELT.t + secs; MELT.start = MELT.t; if (!quiet) toast('THE ISLAND LETS GO OF ITSELF.', 'blue'); };
secret('melt', () => MELT.go(20), ['melt', 'brainmelt', 'impermanent']);
function meltFrame(dt) {
  MELT.t += dt; if (!MELT.pass) { if (MELT.until > 0) meltSetup(); return; }
  const left = MELT.until - MELT.t, since = MELT.t - (MELT.start || 0); let want = 0;
  if (left > 0) want = Math.min(1, since / 3) * Math.min(1, left / 4);
  MELT.k = window.__CALM ? want * 0.35 : want; const on = MELT.k > 0.002 && POST.on; MELT.pass.enabled = on;
  if (on) { MELT.pass.uniforms.uK.value = MELT.k; MELT.pass.uniforms.uT.value = MELT.t; }
}
window.__FRAMES.push(dt => { try { meltFrame(dt); } catch (e) { if (!MELT.err) { MELT.err = e; console.warn('v52 melt', e); } } });
