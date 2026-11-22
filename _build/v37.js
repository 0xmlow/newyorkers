/* ================================================================
   v37 PHOTOREAL, SECOND PASS: LIGHT IN THE AIR (2026-11-22)
   God rays: a screen space pass after the bloom that smears the brightest sky pixels away from the sun's position on
   screen, so light shafts come through the clouds, the Ferris wheel spokes, the El girders and the palms. Strongest
   when the sun is low, gone at night and in fog, off on phones. A faint lens ghost on the far side of the frame.
   ================================================================ */
const RAYS = { pass: null };
window.__RAYS = RAYS;
function raysSetup() {
  if (RAYS.pass || isMobile || !POST || !POST.comp || !POST.on) return;
  const pass = new THREE.ShaderPass({
    uniforms: { tDiffuse: { value: null }, uSun: { value: new THREE.Vector2(0.5, 0.5) }, uK: { value: 0 }, uAsp: { value: 1 }, uTint: { value: new THREE.Color(1, 0.9, 0.75) } },
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: `uniform sampler2D tDiffuse; uniform vec2 uSun; uniform float uK, uAsp; uniform vec3 uTint; varying vec2 vUv;
      void main(){ vec4 base = texture2D(tDiffuse, vUv); if (uK < 0.002) { gl_FragColor = base; return; }
        vec2 d = (vUv - uSun) * (1.0 / 28.0) * 1.0; vec2 uv = vUv; float decay = 1.0, acc = 0.0;
        for (int i = 0; i < 28; i++) { uv -= d; vec3 s = texture2D(tDiffuse, clamp(uv, 0.001, 0.999)).rgb; float l = max(0.0, dot(s, vec3(0.299, 0.587, 0.114)) - 0.5); acc += l * decay; decay *= 0.97; }
        acc /= 28.0; vec2 dd = (vUv - uSun) * vec2(uAsp, 1.0); float fall = 1.0 / (1.0 + dot(dd, dd) * 3.0);
        vec3 col = base.rgb + uTint * acc * uK * 1.8 * fall;
        vec2 g = 1.0 - uSun; vec2 gd = (vUv - g) * vec2(uAsp, 1.0); col += uTint * vec3(0.4, 0.7, 1.0) * smoothstep(0.06, 0.0, length(gd)) * 0.05 * uK;
        gl_FragColor = vec4(col, base.a); }` });
  const idx = POST.comp.passes.indexOf(POST.bloom); POST.comp.insertPass(pass, idx >= 0 ? idx + 1 : 1); RAYS.pass = pass;
}
const _rv = new THREE.Vector3();
function raysFrame() {
  raysSetup(); const p = RAYS.pass; if (!p) return; const u = p.uniforms;
  if (!SKY.sunDir || SKY.el < -2) { u.uK.value = 0; return; }
  _rv.copy(SKY.sunDir).normalize().multiplyScalar(800).add(camera.position).project(camera);
  const onScreen = _rv.z < 1 && Math.abs(_rv.x) < 1.6 && Math.abs(_rv.y) < 1.6; const fwd = new THREE.Vector3(); camera.getWorldDirection(fwd); const facing = fwd.dot(SKY.sunDir.clone().normalize());
  u.uSun.value.set(_rv.x * 0.5 + 0.5, _rv.y * 0.5 + 0.5); u.uAsp.value = innerWidth / Math.max(1, innerHeight);
  const low = 1 - Math.min(1, Math.max(0, (SKY.el - 4) / 40)), clear = 1 - Math.max(WX.fog || 0, WX.wet || 0, WX.snow || 0) * 0.85;
  u.uK.value = onScreen && facing > 0.1 ? Math.min(1, (facing - 0.1) * 1.6) * (0.35 + 0.65 * low) * clear * Math.min(1, (SKY.el + 2) / 6) : 0;
  u.uTint.value.setRGB(1, 0.86 + 0.1 * (1 - low), 0.66 + 0.25 * (1 - low));
}
window.__FRAMES.push(dt => { try { raysFrame(); } catch (e) { if (!RAYS.err) { RAYS.err = e; console.warn('v37 rays', e); } } });
