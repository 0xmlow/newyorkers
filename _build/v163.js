/* ================================================================
   v163 THE GLITTER PATH (2026-11-23)
   The road of light the sun lays across the water toward you when it is low, and the moon's silver one at
   night: thousands of tiny glints on the swell, packed tight under the light and thinning out to the sides,
   always pointing at wherever you stand (because it is a reflection, it follows your eye). Gold at sunset,
   white at noon when it is short and fierce, silver and fainter by moonlight, gone under cloud. It only shows
   on water: the land hides it.
   ================================================================ */
const GLIT = { k: 0 };
window.__GLIT = GLIT;
(function glitter() {
  const geo = new THREE.PlaneGeometry(1, 1, 1, 1); geo.rotateX(-PI / 2); geo.translate(0, 0, 0.5);
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uT: { value: 0 }, uK: { value: 0 }, uCol: { value: new THREE.Color(1, 0.8, 0.5) }, uW: { value: 0.12 } },
    vertexShader: 'varying vec3 vW; varying vec2 vUv; void main(){ vUv = uv; vec4 w = modelMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: ['uniform float uT, uK, uW; uniform vec3 uCol; varying vec3 vW; varying vec2 vUv;', 'float hs(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }',
      'void main(){ float along = vUv.y; float lat = abs(vUv.x - 0.5) * 2.0; float width = uW * (0.25 + along * 1.6); float core = exp(-pow(lat / max(width, 0.01), 2.0));',
      '  vec2 g = vW.xz * vec2(1.6, 0.9); vec2 id = floor(g); float h = hs(id + floor(uT * 3.0 + hs(id) * 7.0)); vec2 f = fract(g) - 0.5; float spark = smoothstep(0.18, 0.0, length(f * vec2(1.0, 2.2))) * step(1.0 - core * 0.55, h);',
      '  vec2 g2 = vW.xz * vec2(5.0, 2.5); vec2 id2 = floor(g2); float h2 = hs(id2 + floor(uT * 6.0 + hs(id2 + 3.0) * 9.0)); float s2 = smoothstep(0.25, 0.0, length(fract(g2) - 0.5)) * step(1.0 - core * 0.35, h2);',
      '  float fade = smoothstep(0.0, 0.04, along) * (1.0 - smoothstep(0.7, 1.0, along)); float a = (spark * 1.6 + s2 * 0.9 + core * 0.06) * fade * uK; if (a < 0.004) discard; gl_FragColor = vec4(uCol * a, 1.0); }'].join('\n') });
  const m = new THREE.Mesh(geo, mat); m.frustumCulled = false; m.renderOrder = 2; scene.add(m); GLIT.m = m; GLIT.mat = mat;
})();
function glitFrame(dt) {
  const W = WX.override || WX.cur, clear = W === 'CLEAR' ? 1 : W === 'SCATTERED' ? 0.6 : 0; let dir = SKY.sunDir, k = 0, col = GLIT.mat.uniforms.uCol.value, w = 0.12;
  if (SKY.el > -1) { const el = SKY.el; k = clear * (el < 2 ? (el + 1) / 3 : 1) * (el > 50 ? 0.5 : 1); w = 0.04 + Math.min(0.3, el / 120); if (L.sun) { const s = L.sun, m = Math.max(s.r, s.g, s.b, 1e-3); col.setRGB(s.r / m, s.g / m * 0.9, s.b / m * 0.75); } }
  else if (SKY.moonDir && SKY.moonDir.y > 0.03) { dir = SKY.moonDir; k = clear * 0.45 * Math.min(1, SKY.moonDir.y * 5); w = 0.06 + SKY.moonDir.y * 0.2; col.setRGB(0.75, 0.82, 0.95); }
  GLIT.k += (k - GLIT.k) * Math.min(1, dt * 2); GLIT.m.visible = GLIT.k > 0.01; if (!GLIT.m.visible) return; const u = GLIT.mat.uniforms; u.uT.value += dt; u.uK.value = GLIT.k; u.uW.value = w;
  const dx = dir.x, dz = dir.z, l = Math.hypot(dx, dz) || 1, c = camera.position; GLIT.m.position.set(c.x, 0.02, c.z); GLIT.m.rotation.set(0, Math.atan2(dx / l, dz / l), 0); GLIT.m.scale.set(500, 1, 700);
}
window.__FRAMES.push(dt => { try { glitFrame(dt); } catch (e) { if (!GLIT.err) { GLIT.err = e; console.warn('v163 glitter', e); } } });
