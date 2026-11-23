/* ================================================================
   v146 THE LENS FLARE (2026-11-23)
   Look toward the sun and the lens answers: a starburst on the sun itself, a thin horizontal streak, and a chain
   of ghosts (small coloured discs and rings) strung through the middle of the picture on the line from the sun
   through the centre, the way light bounces between the elements of a real lens. It only happens when the sun
   is actually visible: the pass checks the depth under the sun's disc, so a branch, a lamp post or a building
   passing in front dims or kills it, and it flickers through leaves. Replaces v37's single lens ghost (switched
   off with v37's rays in v142). Desktop only; ?flare=0 turns it off.
   ================================================================ */
const FLARE = { pass: null, k: 0 };
window.__FLARE = FLARE;
function flareSetup() {
  if (FLARE.pass || !POST.comp || !AO.on || !AO.depth || !THREE.ShaderPass || /flare=0/.test(location.search)) return;
  const pass = new THREE.ShaderPass({ uniforms: { tDiffuse: { value: null }, tDepth: { value: AO.depth.depthTexture }, uSun: { value: new THREE.Vector2(0.5, 0.5) }, uK: { value: 0 }, uCol: { value: new THREE.Color(1, 0.9, 0.75) }, uAsp: { value: 1.6 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform sampler2D tDiffuse, tDepth; uniform vec2 uSun; uniform float uK, uAsp; uniform vec3 uCol; varying vec2 vUv;',
      'vec3 ghost(vec2 p, float r, vec3 c, float ring){ float l = length((vUv - p) * vec2(uAsp, 1.0)); float disc = smoothstep(r, r * 0.55, l) * (1.0 - ring); float rr = smoothstep(r * 0.08, 0.0, abs(l - r)) * ring; return c * (disc * 0.5 + rr); }',
      'void main(){ vec4 c = texture2D(tDiffuse, vUv); if (uK < 0.002) { gl_FragColor = c; return; }',
      '  float vis = 0.0; for (int i = 0; i < 9; i++) { float a = float(i) * 0.698; vec2 o = i == 0 ? vec2(0.0) : vec2(cos(a), sin(a)) * vec2(0.008 / uAsp, 0.008); vis += step(0.99999, texture2D(tDepth, clamp(uSun + o, 0.001, 0.999)).x); } vis /= 9.0;',
      '  float K = uK * vis; if (K < 0.002) { gl_FragColor = c; return; }',
      '  vec2 ax = vec2(0.5) - uSun; vec3 f = vec3(0.0);',
      '  f += ghost(uSun + ax * 0.45, 0.022, vec3(0.35, 0.55, 1.0), 0.0); f += ghost(uSun + ax * 0.75, 0.06, vec3(0.55, 0.3, 0.9), 0.0); f += ghost(uSun + ax * 1.1, 0.018, vec3(1.0, 0.65, 0.3), 0.0);',
      '  f += ghost(uSun + ax * 1.35, 0.1, vec3(0.25, 0.85, 0.6), 1.0) * 0.18; f += ghost(uSun + ax * 1.7, 0.045, vec3(0.9, 0.4, 0.6), 0.0); f += ghost(uSun + ax * 2.15, 0.17, vec3(0.4, 0.6, 1.0), 1.0) * 0.12;',
      '  vec2 d = (vUv - uSun) * vec2(uAsp, 1.0); float l = length(d), a = atan(d.y, d.x);',
      '  float rays = pow(abs(sin(a * 6.0 + 0.3)), 36.0) * 0.6 + pow(abs(sin(a * 9.0 + 1.1)), 60.0) * 0.4; f += uCol * (rays * exp(-l * 8.0) * 1.3 + exp(-l * 26.0) * 0.9);',
      '  f += uCol * exp(-abs(d.y) * 140.0) * exp(-abs(d.x) * 2.6) * 0.3;',
      '  gl_FragColor = vec4(c.rgb + f * K, c.a); }'].join('\n') });
  const bi = POST.comp.passes.indexOf(POST.bloom); POST.comp.passes.splice(bi >= 0 ? bi + 1 : POST.comp.passes.length - 1, 0, pass); FLARE.pass = pass;
  const prevG = window.__GRADE; window.__GRADE = g => { if (prevG) prevG(g); try { _fls.copy(SKY.sunDir).multiplyScalar(1000).add(camera.position).project(camera); pass.uniforms.uSun.value.set(_fls.x * 0.5 + 0.5, _fls.y * 0.5 + 0.5); } catch (e) { } };
}
const _fls = new V3();
function flareFrame(dt) {
  flareSetup(); if (!FLARE.pass) return; const u = FLARE.pass.uniforms; _fls.copy(SKY.sunDir).multiplyScalar(1000).add(camera.position).project(camera);
  const inside = _fls.z < 1 && Math.abs(_fls.x) < 0.98 && Math.abs(_fls.y) < 0.98, W = WX.override || WX.cur;
  const clear = (W === 'CLEAR' ? 1 : W === 'SCATTERED' ? 0.7 : 0) * (1 - Math.max(WX.fog || 0, WX.wet || 0, WX.snow || 0)), el = SKY.el, elK = el < -0.5 ? 0 : Math.min(1, (el + 0.5) / 3);
  const want = inside ? elK * clear * (1 - Math.max(Math.abs(_fls.x), Math.abs(_fls.y)) * 0.6) : 0; FLARE.k += (want - FLARE.k) * Math.min(1, dt * 6);
  u.uK.value = FLARE.k * 0.55; FLARE.pass.enabled = FLARE.k > 0.002 && AO.on; u.uAsp.value = innerWidth / Math.max(1, innerHeight); u.tDepth.value = AO.depth.depthTexture;
  if (L.sun) { const s = L.sun, m = Math.max(s.r, s.g, s.b, 1e-3); u.uCol.value.setRGB(s.r / m, s.g / m * 0.93, s.b / m * 0.82); }
}
window.__FRAMES.push(dt => { try { flareFrame(dt); } catch (e) { if (!FLARE.err) { FLARE.err = e; console.warn('v146 flare', e); } } });
