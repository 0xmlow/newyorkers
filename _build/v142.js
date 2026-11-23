/* ================================================================
   v142 SUN SHAFTS (2026-11-23)
   Crepuscular rays. When the sun is low and in front of you, light streams past the edges of everything between
   you and it: through the trees, round the water tower, between the buildings, out of the gaps in a crowd. The
   pass marches from every pixel toward the sun across the depth the ambient occlusion already draws, collecting
   open sky, so the shafts start exactly where something stops blocking the sun and nowhere else. Strongest in
   the golden hour on a clear day, gone in fog, rain and at night. Desktop only (it needs the depth pass). It
   supersedes v37's brightness only rays, which stay as the fallback when ambient occlusion is off (?ao=0).
   ================================================================ */
const SHAFT = { pass: null, k: 0 };
window.__SHAFT = SHAFT;
function shaftSetup() {
  if (SHAFT.pass || !POST.comp || !AO.on || !AO.depth || !THREE.ShaderPass || /rays=0/.test(location.search)) return;
  const pass = new THREE.ShaderPass({ uniforms: { tDiffuse: { value: null }, tDepth: { value: AO.depth.depthTexture }, uSun: { value: new THREE.Vector2(0.5, 0.5) }, uK: { value: 0 }, uCol: { value: new THREE.Color(1, 0.85, 0.6) }, uAsp: { value: 1.6 } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: [
      'uniform sampler2D tDiffuse, tDepth; uniform vec2 uSun; uniform float uK, uAsp; uniform vec3 uCol; varying vec2 vUv;',
      'void main(){ vec4 c = texture2D(tDiffuse, vUv); if (uK < 0.002) { gl_FragColor = c; return; }',
      '  vec2 d = (vUv - uSun) * (0.92 / 40.0); vec2 uv = vUv; float acc = 0.0, w = 1.0; float j = fract(sin(dot(gl_FragCoord.xy, vec2(12.9898, 78.233))) * 43758.5453); uv -= d * j;',
      '  for (int i = 0; i < 40; i++) { uv -= d; vec2 q = clamp(uv, 0.001, 0.999); float sky = step(0.99999, texture2D(tDepth, q).x); float l = dot(texture2D(tDiffuse, q).rgb, vec3(0.3, 0.59, 0.11)); acc += sky * smoothstep(0.35, 1.2, l) * w; w *= 0.962; }',
      '  acc /= 40.0; float r = length((vUv - uSun) * vec2(uAsp, 1.0)); float fall = 0.35 + 0.65 * (1.0 - smoothstep(0.0, 1.1, r));',
      '  gl_FragColor = vec4(c.rgb + uCol * acc * uK * fall, c.a); }'].join('\n') });
  const bi = POST.comp.passes.indexOf(POST.bloom); POST.comp.passes.splice(bi >= 0 ? bi : 1, 0, pass); SHAFT.pass = pass;
  const prevG = window.__GRADE; window.__GRADE = g => { if (prevG) prevG(g); try { _shs.copy(SKY.sunDir).multiplyScalar(1000).add(camera.position).project(camera); pass.uniforms.uSun.value.set(_shs.x * 0.5 + 0.5, _shs.y * 0.5 + 0.5); } catch (e) { } };
}
const _shs = new V3();
function shaftFrame(dt) {
  shaftSetup(); if (!SHAFT.pass) return; const u = SHAFT.pass.uniforms;
  _shs.copy(SKY.sunDir).multiplyScalar(1000).add(camera.position).project(camera); const onScreen = _shs.z < 1 && Math.abs(_shs.x) < 1.6 && Math.abs(_shs.y) < 1.6;
  const el = SKY.el, elK = el < -1 ? 0 : el < 4 ? (el + 1) / 5 : el < 30 ? 1 - (el - 4) / 26 * 0.7 : 0.3, W = WX.override || WX.cur;
  const clear = (W === 'CLEAR' ? 1 : W === 'SCATTERED' ? 0.8 : 0.15) * (1 - Math.max(WX.fog || 0, WX.wet || 0, WX.snow || 0));
  const edge = onScreen ? 1 - Math.max(0, Math.max(Math.abs(_shs.x), Math.abs(_shs.y)) - 1) / 0.6 : 0, want = elK * clear * Math.max(0, edge) * 0.9;
  SHAFT.k += (want - SHAFT.k) * Math.min(1, dt * 3); try { if (RAYS.pass) { RAYS.pass.uniforms.uK.value = 0; RAYS.pass.enabled = false; } } catch (e) { } u.uK.value = SHAFT.k; SHAFT.pass.enabled = SHAFT.k > 0.002 && AO.on;
  u.uSun.value.set(_shs.x * 0.5 + 0.5, _shs.y * 0.5 + 0.5); u.uAsp.value = innerWidth / Math.max(1, innerHeight); u.tDepth.value = AO.depth.depthTexture;
  if (L.sun) { const s = L.sun, m = Math.max(s.r, s.g, s.b, 1e-3); u.uCol.value.setRGB(s.r / m, s.g / m * 0.92, s.b / m * 0.8); }
}
window.__FRAMES.push(dt => { try { shaftFrame(dt); } catch (e) { if (!SHAFT.err) { SHAFT.err = e; console.warn('v142 sun shafts', e); } } });
