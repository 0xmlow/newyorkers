/* ================================================================
   v141 RAIN ON THE LENS (2026-11-23)
   When it rains, rain lands on the lens: beads that come and go all over the picture and bigger drops that
   slide down in runs leaving a wet trail, each one a little lens that bends the island behind it (real
   refraction from the drop's shape, not a picture of a drop). It builds up as the rain starts and dries off
   after it stops. Desktop and phone; ?lens=0 turns it off.
   ================================================================ */
const LENSR = { k: 0, pass: null };
window.__LENSR = LENSR;
function lensrSetup() {
  if (LENSR.pass || !POST.comp || !THREE.ShaderPass || /lens=0/.test(location.search)) return;
  const pass = new THREE.ShaderPass({ uniforms: { tDiffuse: { value: null }, uT: { value: 0 }, uK: { value: 0 }, uAsp: { value: 1.6 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform sampler2D tDiffuse; uniform float uT, uK, uAsp; varying vec2 vUv;',
      'float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
      'float beads(vec2 uv){ vec2 g = uv * vec2(22.0 * uAsp, 22.0); vec2 id = floor(g), f = fract(g) - 0.5; float h1 = hs(id), h2 = hs(id + 7.3), h3 = hs(id + 3.1);',
      '  vec2 p = (vec2(h1, h2) - 0.5) * 0.55; float life = fract(uT * 0.06 + h3); float on = step(0.45, h1) * smoothstep(0.0, 0.04, life) * smoothstep(1.0, 0.75, life);',
      '  float r = 0.1 + 0.22 * h2; float d = length(f - p); return on * max(0.0, 1.0 - d * d / (r * r)); }',
      'float runs(vec2 uv){ float cols = 7.0 * uAsp; float cx = floor(uv.x * cols); float hc = hs(vec2(cx, 1.7)); if (hc < 0.35) return 0.0; float sp = 0.06 + 0.14 * hc; float cyc = uT * sp + hc * 5.0; float k = floor(cyc);',
      '  float x0 = (cx + 0.2 + 0.6 * hs(vec2(cx, k))) / cols; float py = 1.15 - fract(cyc) * 1.3; float r = 0.010 + 0.008 * hs(vec2(cx, k + 3.0));',
      '  vec2 d = vec2((uv.x - x0) * uAsp + sin(uv.y * 40.0 + cx) * 0.002, uv.y - py); float drop = max(0.0, 1.0 - dot(d, d) / (r * r));',
      '  float trail = (uv.y > py) ? smoothstep(r * 0.55, 0.0, abs(d.x)) * smoothstep(0.3, 0.0, uv.y - py) * 0.35 : 0.0; return drop + trail * (0.6 + 0.4 * sin(uv.y * 300.0)); }',
      'float H(vec2 uv){ return beads(uv) + runs(uv); }',
      'void main(){ if (uK < 0.003) { gl_FragColor = texture2D(tDiffuse, vUv); return; }',
      '  vec2 e = vec2(1.5 / 900.0, 0.0); float h = H(vUv); vec2 grad = vec2(H(vUv + e.xy) - H(vUv - e.xy), H(vUv + e.yx) - H(vUv - e.yx));',
      '  vec2 off = -grad * 0.045 * uK - (h > 0.02 ? (vUv - 0.5) * 0.02 * h * uK : vec2(0.0));',
      '  vec4 c = texture2D(tDiffuse, vUv + off); float rim = smoothstep(0.0, 0.25, h) * (1.0 - smoothstep(0.25, 0.9, h));',
      '  c.rgb = c.rgb * (1.0 - 0.18 * rim * uK) + vec3(0.1) * smoothstep(0.85, 1.0, h) * uK; gl_FragColor = c; }'].join('\n') });
  const gi = POST.comp.passes.indexOf(POST.grade); POST.comp.passes.splice(gi >= 0 ? gi + 1 : POST.comp.passes.length, 0, pass); LENSR.pass = pass;
}
function lensrFrame(dt) {
  lensrSetup(); if (!LENSR.pass) return; const W = WX.override || WX.cur, rain = W === 'RAIN' ? Math.min(1, (WX.wet || 0) * 1.8) : 0;
  LENSR.k += (rain - LENSR.k) * Math.min(1, dt * (rain > LENSR.k ? 0.15 : 0.05)); const u = LENSR.pass.uniforms; u.uT.value += dt; u.uK.value = LENSR.k * (window.__TOUR_ON ? 0.5 : 1); u.uAsp.value = innerWidth / Math.max(1, innerHeight); LENSR.pass.enabled = LENSR.k > 0.003;
}
window.__FRAMES.push(dt => { try { lensrFrame(dt); } catch (e) { if (!LENSR.err) { LENSR.err = e; console.warn('v141 lens rain', e); } } });
