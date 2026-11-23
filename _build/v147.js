/* ================================================================
   v147 DUST IN THE LIGHT (2026-11-23)
   When the sun is low and clear, the air around you is full of things you only see against the light: dust,
   pollen, the odd seed fluff, drifting and turning in a few metres of air. They light up when they sit between
   you and the sun (forward scattering, like the real thing) and vanish when you turn your back on it. A cloud of
   five hundred points that travels with you; phones get two hundred.
   ================================================================ */
const MOTES = { n: isMobile ? 200 : 500, k: 0, T: 0 };
window.__MOTES = MOTES;
(function motes() {
  const N = MOTES.n, pos = new Float32Array(N * 3), seed = new Float32Array(N); for (let i = 0; i < N; i++) { pos[i * 3] = Math.random(); pos[i * 3 + 1] = Math.random(); pos[i * 3 + 2] = Math.random(); seed[i] = Math.random(); }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aSeed', new THREE.BufferAttribute(seed, 1));
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, uniforms: { uT: { value: 0 }, uCam: { value: new V3() }, uSun: { value: new V3(0, 1, 0) }, uK: { value: 0 }, uCol: { value: new THREE.Color(1, 0.85, 0.6) }, uScale: { value: 400 } },
    vertexShader: 'attribute float aSeed; uniform float uT, uScale; uniform vec3 uCam, uSun; varying float vA; void main(){ vec3 box = vec3(9.0, 5.0, 9.0);' +
      ' vec3 p = position * box + vec3(sin(uT * 0.13 + aSeed * 40.0), sin(uT * 0.07 + aSeed * 17.0) * 0.6 - uT * 0.015, cos(uT * 0.11 + aSeed * 23.0)) * 0.9;' +
      ' p = mod(p - uCam + box * 0.5, box) + uCam - box * 0.5; vec4 mv = viewMatrix * vec4(p, 1.0); vec3 v = normalize(p - uCam); float fw = pow(max(0.0, dot(v, uSun)), 6.0);' +
      ' float tw = 0.6 + 0.4 * sin(uT * (1.5 + aSeed * 3.0) + aSeed * 60.0); float near = smoothstep(0.3, 1.2, -mv.z) * (1.0 - smoothstep(3.5, 6.0, -mv.z)); vA = fw * tw * near; gl_PointSize = (0.012 + aSeed * 0.02) * uScale / max(0.3, -mv.z); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform float uK; uniform vec3 uCol; varying float vA; void main(){ float r = length(gl_PointCoord - 0.5); float a = smoothstep(0.5, 0.0, r) * vA * uK; if (a < 0.003) discard; gl_FragColor = vec4(uCol * a, 1.0); }' });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts); MOTES.pts = pts; MOTES.mat = mat;
})();
function motesFrame(dt) {
  const W = WX.override || WX.cur, clear = W === 'CLEAR' ? 1 : W === 'SCATTERED' ? 0.6 : 0, el = SKY.el, elK = el < 0 ? 0 : el < 3 ? el / 3 : Math.max(0.15, 1 - (el - 3) / 35);
  MOTES.k += (clear * elK - MOTES.k) * Math.min(1, dt); MOTES.pts.visible = MOTES.k > 0.01; if (!MOTES.pts.visible) return; MOTES.T += dt; const u = MOTES.mat.uniforms;
  u.uT.value = MOTES.T; u.uCam.value.copy(camera.position); u.uSun.value.copy(SKY.sunDir).normalize(); u.uK.value = MOTES.k * 1.6; u.uScale.value = renderer.domElement.height * 0.5 / Math.tan(camera.fov * PI / 360);
  if (L.sun) { const s = L.sun, m = Math.max(s.r, s.g, s.b, 1e-3); u.uCol.value.setRGB(s.r / m, s.g / m * 0.9, s.b / m * 0.75); }
}
window.__FRAMES.push(dt => { try { motesFrame(dt); } catch (e) { if (!MOTES.err) { MOTES.err = e; console.warn('v147 motes', e); } } });
