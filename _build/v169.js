/* ================================================================
   v169 THE LOOK: SKY DEPTH (2026-11-23)
   MLow's painted panorama stays exactly as it is (the eye, the painted clouds, the skyline). In front of it, a
   real layer of cumulus now sits over the harbour between 400 and 900 metres out: forty eight soft clouds, each a
   volume of noise lit from the sun's real direction (bright tops and sun sides, grey blue bellies, a silver rim
   when the sun is behind them, peach and rose at golden hour, moonlit grey at night), drifting slowly on the wind
   so they slide past the painting and give the sky parallax and depth. Clear days get a few, scattered skies
   more, rain and fog a low grey deck. ?clouds=0 turns them off.
   ================================================================ */
const CLOUDS = { list: [], k: 0, cover: 0.3 };
window.__CLOUDS = CLOUDS;
(function clouds() {
  if (!LOOK.on || /clouds=0/.test(location.search)) return;
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, fog: false, uniforms: { uT: { value: 0 }, uSun: { value: new V3(0, 1, 0) }, uLit: { value: new THREE.Color(1, 1, 1) }, uShade: { value: new THREE.Color(0.6, 0.65, 0.75) }, uRim: { value: new THREE.Color(1, 0.9, 0.7) }, uCover: { value: 0.3 }, uA: { value: 1 } },
    vertexShader: 'attribute float aSeed; attribute float aOn; varying vec2 vUv; varying float vSeed; varying float vOn; varying vec3 vW; void main(){ vUv = uv; vSeed = aSeed; vOn = aOn; vec4 w = modelMatrix * instanceMatrix * vec4(position, 1.0); vW = w.xyz; gl_Position = projectionMatrix * viewMatrix * w; }',
    fragmentShader: ['uniform float uT, uCover, uA; uniform vec3 uSun, uLit, uShade, uRim; varying vec2 vUv; varying float vSeed; varying float vOn; varying vec3 vW;',
      'float h(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); } float n(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(h(i), h(i + vec2(1, 0)), f.x), mix(h(i + vec2(0, 1)), h(i + vec2(1, 1)), f.x), f.y); }',
      'float fbm(vec2 p){ float s = 0.0, a = 0.5; for (int i = 0; i < 5; i++) { s += n(p) * a; p = p * 2.03 + 1.7; a *= 0.5; } return s; }',
      'void main(){ if (vOn < 0.5) discard; vec2 p = vUv * vec2(3.2, 1.6) + vSeed * 17.0 + vec2(uT * 0.004, 0.0); vec2 c = (vUv - vec2(0.5, 0.42)) * vec2(1.0, 1.9);',
      '  float shape = 1.0 - smoothstep(0.15, 0.62, length(c) + (0.5 - vUv.y) * 0.35 * step(vUv.y, 0.42) * 0.0); float base = smoothstep(0.05, 0.3, vUv.y);',
      '  float den = fbm(p) * 1.25 + fbm(p * 2.2 + 5.0) * 0.35; den = smoothstep(0.55 - uCover * 0.25, 1.05, den * shape * 1.25) * base; if (den < 0.01) discard;',
      '  float top = smoothstep(0.2, 0.9, vUv.y); vec3 v = normalize(vW - cameraPosition); float fwd = pow(max(0.0, dot(v, normalize(uSun))), 6.0); float side = 0.5 + 0.5 * dot(normalize(vec3(uSun.x, 0.0, uSun.z)), normalize(vec3(-v.x, 0.0, -v.z)));',
      '  float lit = clamp(top * 0.65 + side * 0.35 + (1.0 - den) * 0.25, 0.0, 1.0); vec3 col = mix(uShade, uLit, lit) + uRim * fwd * (1.0 - den) * 1.6;',
      '  gl_FragColor = vec4(col, den * uA); }'].join('\n') });
  const N = 48, geo = new THREE.PlaneGeometry(1, 1); const seed = new Float32Array(N), on = new Float32Array(N); for (let i = 0; i < N; i++) { seed[i] = Math.random(); on[i] = 1; }
  geo.setAttribute('aSeed', new THREE.InstancedBufferAttribute(seed, 1)); geo.setAttribute('aOn', new THREE.InstancedBufferAttribute(on, 1));
  const mesh = new THREE.InstancedMesh(geo, mat, N); mesh.frustumCulled = false; mesh.renderOrder = -5; scene.add(mesh); CLOUDS.mesh = mesh; CLOUDS.mat = mat; CLOUDS.on = on;
  for (let i = 0; i < N; i++) { const a = i / N * PI * 2 + Math.random() * 0.12, R = 420 + Math.random() * 480, w = 140 + Math.random() * 180; CLOUDS.list.push({ a, R, y: 110 + Math.random() * 150 + R * 0.06, w, h: w * (0.42 + Math.random() * 0.2), rank: Math.random() }); }
})();
const _co = new THREE.Object3D();
function cloudsFrame(dt) {
  if (!CLOUDS.mesh) return; const W = WX.override || WX.cur, cover = W === 'CLEAR' ? 0.22 : W === 'SCATTERED' ? 0.55 : W === 'RAIN' || W === 'SNOW' ? 0.95 : W === 'HARBOR FOG' ? 0.7 : 0.45; CLOUDS.cover += (cover - CLOUDS.cover) * Math.min(1, dt * 0.2);
  const u = CLOUDS.mat.uniforms; u.uT.value += dt; u.uCover.value = CLOUDS.cover; u.uSun.value.copy(SKY.el > -4 ? SKY.sunDir : SKY.moonDir);
  const night = L.lamps || 0, gold = SKY.w ? SKY.w.x + SKY.w.y : 0, s = L.sun;
  u.uLit.value.setRGB(1, 1, 1).lerp(_cl1.setRGB(1, 0.78 + 0.1 * s.g, 0.62), gold * 0.8).lerp(_cl1.setRGB(0.32, 0.36, 0.48), night); u.uShade.value.copy(L.sky).multiplyScalar(0.62).lerp(_cl1.setRGB(0.07, 0.09, 0.15), night); if (gold > 0.2) u.uShade.value.lerp(_cl1.setRGB(0.55, 0.42, 0.5), gold * 0.4);
  u.uRim.value.copy(s).multiplyScalar(1 - night * 0.7); const dark = W === 'RAIN' || W === 'SNOW' ? 0.55 : 1; u.uLit.value.multiplyScalar(dark); u.uA.value = 0.92;
  const c = camera.position, drift = u.uT.value * 0.0016;
  CLOUDS.list.forEach((q, i) => { const a = q.a + drift, x = Math.sin(a) * q.R, z = Math.cos(a) * q.R; _co.position.set(c.x * 0.3 + x, q.y, c.z * 0.3 + z); _co.lookAt(c.x, q.y, c.z); _co.scale.set(q.w * (0.9 + CLOUDS.cover * 0.4), q.h * (0.85 + CLOUDS.cover * 0.5), 1); _co.updateMatrix(); CLOUDS.mesh.setMatrixAt(i, _co.matrix); CLOUDS.on[i] = q.rank < 0.25 + CLOUDS.cover * 0.85 ? 1 : 0; });
  CLOUDS.mesh.instanceMatrix.needsUpdate = true; CLOUDS.mesh.geometry.attributes.aOn.needsUpdate = true;
}
const _cl1 = new THREE.Color();
window.__FRAMES.push(dt => { try { cloudsFrame(dt); } catch (e) { if (!CLOUDS.err) { CLOUDS.err = e; console.warn('v169 clouds', e); } } });
