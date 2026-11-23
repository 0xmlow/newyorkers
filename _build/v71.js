/* ================================================================
   v71 THE GLOWING SEA (2026-11-22), apply-mlow-impermanent-vision, Whisper
   After dark the harbour round the island lights up where it moves: plankton in the surf line flashing cyan, a few
   hot pink, brightest where the waves break and in the wakes of the ships, fading in and out like breath. It sits
   on the water from the shore out about twelve metres. PLANKTON (or BIOLUMINESCENCE) lights it any hour.
   ================================================================ */
const GLOW = { N: isMobile ? 1400 : 3600, k: 0, until: 0, t: 0 };
window.__GLOW = GLOW;
(function glowingSea() {
  const N = GLOW.N, pos = new Float32Array(N * 3), ph = new Float32Array(N), col = new Float32Array(N * 3);
  for (let i = 0; i < N; i++) { const a = Math.random() * PI * 2, r = SHORE + 0.5 + Math.pow(Math.random(), 1.8) * 12; pos[i * 3] = Math.cos(a) * r; pos[i * 3 + 1] = 0.32; pos[i * 3 + 2] = Math.sin(a) * r; ph[i] = Math.random() * 100;
    const pink = Math.random() < 0.07; col[i * 3] = pink ? 1 : 0.03; col[i * 3 + 1] = pink ? 0.25 : 0.87; col[i * 3 + 2] = pink ? 0.64 : 1; }
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.BufferAttribute(pos, 3)); geo.setAttribute('aPh', new THREE.BufferAttribute(ph, 1)); geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
  const mat = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uK: { value: 0 }, map: { value: LIFE.soft }, uScale: { value: innerHeight * 0.5 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'attribute float aPh; attribute vec3 color; uniform float uT, uK, uScale; varying vec3 vC; varying float vA; void main(){ vec3 p = position; float r = length(p.xz); float wave = sin(r * 0.9 - uT * 1.3 + aPh * 0.05);' +
      ' p.y += wave * 0.12; float surf = smoothstep(0.4, 1.0, wave) * (1.0 - smoothstep(137.5, 150.0, r) * 0.6); float tw = 0.5 + 0.5 * sin(uT * (1.5 + fract(aPh) * 3.0) + aPh); vA = uK * (0.4 + 0.6 * surf) * (0.35 + 0.65 * tw); vC = color;' +
      ' vec4 mv = modelViewMatrix * vec4(p, 1.0); gl_PointSize = min(64.0, (0.55 + surf * 0.7) * uScale / max(1.0, -mv.z)); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform sampler2D map; varying vec3 vC; varying float vA; void main(){ float a = texture2D(map, gl_PointCoord).a * vA; if (a < 0.01) discard; gl_FragColor = vec4(vC * a * 2.4, a); }' });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; pts.renderOrder = 2; pts.visible = false; scene.add(pts); GLOW.pts = pts; GLOW.mat = mat;
  // wake sparkle that follows the ships
  const wn = 220, wp = new Float32Array(wn * 3).fill(-999), wg = new THREE.BufferGeometry(); wg.setAttribute('position', new THREE.BufferAttribute(wp, 3));
  const wake = new THREE.Points(wg, new THREE.PointsMaterial({ color: 0x22e6ff, size: 0.5, map: LIFE.soft, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, toneMapped: false })); wake.frustumCulled = false; scene.add(wake); GLOW.wake = wake; GLOW.wd = [];
  for (let i = 0; i < wn; i++) GLOW.wd.push({ t: 9, x: 0, z: 0 }); GLOW.wc = 0;
})();
const glowSecret = secret('plankton', () => { GLOW.until = GLOW.t + 90; toast('THE HARBOUR LIGHTS UP WHERE IT MOVES. NOBODY IN THIS CITY BELIEVES YOU.', 'blue'); }, ['plankton', 'bioluminescence', 'glow']);
function glowFrame(dt) {
  GLOW.t += dt; const night = Math.min(1, Math.max(0, ((L.lamps || 0) - 0.3) * 2)), want = Math.max(night, GLOW.until > GLOW.t ? 1 : 0); GLOW.k += (want - GLOW.k) * Math.min(1, dt * 0.5);
  const on = GLOW.k > 0.01; GLOW.pts.visible = on; GLOW.wake.visible = on; if (!on) return;
  GLOW.mat.uniforms.uT.value = GLOW.t; GLOW.mat.uniforms.uK.value = GLOW.k; GLOW.mat.uniforms.uScale.value = innerHeight * 0.5;
  // seeing it from the beach at night counts too
  if (night > 0.5 && Math.hypot(P.x, P.z) > SHORE - 14) { GLOW.seen = (GLOW.seen || 0) + dt; if (GLOW.seen > 4) glowSecret(); }
  if (window.__SHIPS) SHIPS.list.forEach(s => { if (Math.random() < dt * 30) { const d = GLOW.wd[GLOW.wc]; GLOW.wc = (GLOW.wc + 1) % GLOW.wd.length; const a = s.g.rotation.y; d.t = 0; d.x = s.g.position.x - Math.cos(a) * (8 + Math.random() * 30) + (Math.random() - 0.5) * 6; d.z = s.g.position.z + Math.sin(a) * (8 + Math.random() * 30) + (Math.random() - 0.5) * 6; } });
  const wp = GLOW.wake.geometry.attributes.position.array; GLOW.wd.forEach((d, i) => { d.t += dt; if (d.t > 6) { wp[i * 3 + 1] = -999; return; } wp[i * 3] = d.x; wp[i * 3 + 1] = 0.15; wp[i * 3 + 2] = d.z; });
  GLOW.wake.geometry.attributes.position.needsUpdate = true; GLOW.wake.material.opacity = 0.8 * GLOW.k;
}
window.__FRAMES.push(dt => { try { glowFrame(dt); } catch (e) { if (!GLOW.err) { GLOW.err = e; console.warn('v71 glow', e); } } });
