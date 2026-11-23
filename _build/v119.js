/* ================================================================
   v119 PROJECTION MAPPING (2026-11-23), apply-mlow-impermanent-vision, Melt
   After dark a projector on a tripod across the way throws light onto the walk up's blank south wall: liquid contour
   lines (cyan, every fifth hot pink) flow up the brick and wrap round the windows, paint drips run down from the
   cornice, the whole wall breathes, and every half minute the lines part and a Meme card blooms in the middle and
   melts away again. A faint beam stands in the air between the lens and the wall.
   ================================================================ */
const PROJ = { t: 0, k: 0, card: null, n: 0 };
window.__PROJ = PROJ;
(function projection() {
  const x0 = BROWN_AT.x, zf = BROWN_AT.z + 4 + 0.03, g0 = BROWN.g0, W = 7, H = BROWN.H;
  const m = new THREE.ShaderMaterial({ uniforms: { uT: { value: 0 }, uK: { value: 0 }, uOpen: { value: 0 } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
    fragmentShader: 'uniform float uT, uK, uOpen; varying vec2 vUv; float h(float n){ return fract(sin(n*12.9898)*43758.5453); }' +
      ' void main(){ vec2 p = vUv * vec2(7.0, 13.0); float warp = sin(p.y * 0.9 + uT * 0.7) * 0.6 + sin(p.x * 1.3 - uT * 0.5) * 0.4; vec2 c = vec2(3.5, 6.5); float r = length((p - c) * vec2(1.0, 0.8));' +
      ' float f = p.y * 1.6 + warp * 1.4 - uT * 0.9 + uOpen * 6.0 / (0.6 + r); float iso = abs(fract(f) - 0.5); float line = smoothstep(0.09, 0.0, 0.5 - iso); vec3 col = mod(floor(f), 5.0) < 0.5 ? vec3(1.0, 0.25, 0.64) : vec3(0.03, 0.87, 1.0);' +
      ' float col_i = floor(vUv.x * 40.0); float drip = step(h(col_i), 0.18) * smoothstep(1.0 - fract(uT * 0.05 + h(col_i + 3.0)) , 1.0, vUv.y) * step(abs(fract(vUv.x * 40.0) - 0.5), 0.12);' +
      ' float hole = smoothstep(1.6, 2.4, r) + (1.0 - uOpen); float edge = smoothstep(0.0, 0.06, vUv.x) * smoothstep(1.0, 0.94, vUv.x) * smoothstep(0.0, 0.04, vUv.y);' +
      ' vec3 o = (col * line * 0.9 * min(1.0, hole) + vec3(0.94, 0.91, 0.85) * drip * 0.5 + vec3(0.04, 0.06, 0.16) * 0.6) * uK * edge; gl_FragColor = vec4(o, 1.0); }' });
  const plane = new THREE.Mesh(new THREE.PlaneGeometry(W, H), m); plane.position.set(x0, g0 + H / 2, zf); scene.add(plane); PROJ.m = m; PROJ.plane = plane;
  // the projector and its beam
  const px = x0, pz = zf + 10, pg = ground(px, pz); const tri = new THREE.Group(); tri.position.set(px, pg, pz); scene.add(tri);
  const black = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.5, metalness: 0.4 }); [0, 2.1, 4.2].forEach(a => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 1.7, 6), black); l.position.set(Math.cos(a) * 0.35, 0.8, Math.sin(a) * 0.35); l.rotation.set(Math.sin(a) * 0.2, 0, -Math.cos(a) * 0.2); tri.add(l); });
  const box = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.25, 0.5), black); box.position.y = 1.7; tri.add(box); const lens = new THREE.Mesh(new THREE.CircleGeometry(0.07, 14), new THREE.MeshBasicMaterial({ color: 0xbfefff, toneMapped: false })); lens.position.set(0, 1.7, -0.26); lens.rotation.y = PI; tri.add(lens);
  post(px, pz, 0.4, -5, 2);
  const bg = new THREE.ConeGeometry(1, 1, 24, 1, true); bg.translate(0, -0.5, 0); bg.rotateX(-PI / 2);
  const beam = new THREE.Mesh(bg, new THREE.MeshBasicMaterial({ color: 0x9fe8ff, transparent: true, opacity: 0, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false }));
  beam.position.set(px, pg + 1.7, pz); const dist = 10; beam.scale.set(W / 2, H / 2 * 0.95, dist); beam.lookAt(x0, g0 + H / 2, zf); scene.add(beam); PROJ.beam = beam;
  PROJ.cardSlot = new THREE.Group(); PROJ.cardSlot.position.set(x0, g0 + H / 2, zf + 0.01); scene.add(PROJ.cardSlot);
})();
const projSecret = secret('projection', () => { }, []);
function projFrame(dt) {
  const night = Math.min(1, Math.max(0, ((L.lamps || 0) - 0.3) * 2)); PROJ.k += (night - PROJ.k) * Math.min(1, dt); const on = PROJ.k > 0.02; PROJ.plane.visible = PROJ.beam.visible = on; PROJ.cardSlot.visible = on; if (!on) return;
  PROJ.t += dt; const cyc = PROJ.t % 30, open = cyc < 20 ? 0 : Math.sin((cyc - 20) / 10 * PI); PROJ.m.uniforms.uT.value = PROJ.t; PROJ.m.uniforms.uK.value = PROJ.k; PROJ.m.uniforms.uOpen.value = open; PROJ.beam.material.opacity = 0.035 * PROJ.k;
  if (cyc < 20.05 && cyc > 19.95 || !PROJ.card) { if (PROJ.card) { PROJ.cardSlot.remove(PROJ.card); } PROJ.card = memeMesh(MEME_NS[(PROJ.n++ * 97 + 13) % MEME_NS.length], 3.2, {}); if (PROJ.card) { PROJ.card.material = new THREE.MeshBasicMaterial({ map: PROJ.card.material.map, transparent: true, opacity: 0, blending: THREE.AdditiveBlending, depthWrite: false, toneMapped: false }); PROJ.cardSlot.add(PROJ.card); } }
  if (PROJ.card) PROJ.card.material.opacity = open * 0.85 * PROJ.k;
  if (open > 0.8 && Math.hypot(P.x - BROWN_AT.x, P.z - (BROWN_AT.z + 10)) < 12) projSecret();
}
window.__FRAMES.push(dt => { try { projFrame(dt); } catch (e) { if (!PROJ.err) { PROJ.err = e; console.warn('v119 projection', e); } } });
