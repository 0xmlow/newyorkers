/* ================================================================
   v132 SKYTYPING (2026-11-23)
   On clear days between ten and four, every eight minutes or so, seven small planes fly in line abreast high
   over the harbour to the south and type a word in the sky the way skytypers really do it: each plane is one
   row of a five by seven dot matrix and puffs smoke on cue, so a whole word appears in one pass, letter by letter
   as they cross. The puffs swell and drift on the wind and are gone in two minutes. Read one and it counts.
   Type SKYWRITER to order one.
   ================================================================ */
const SKYT = { on: false, x: 0, words: ['GM', 'WAGMI', 'N3W YORK', 'LFG', '420', 'MLOW', 'SER', 'LOOK UP'], wi: 0, cols: [], next: 120, last: -999, watch: 0, force: 0, DX: 7, DY: 7, Z: 300, Y0: 108, V: 34 };
window.__SKYT = SKYT;
const SKYT_FONT = { G: '.###.#...##....#.####...##...#.###.', M: '#...###.###.#.##.#.##...##...##...#', W: '#...##...##...##.#.##.#.###.###...#', A: '.###.#...##...#######...##...##...#', I: '.###...#....#....#....#....#...###.', N: '#...###..##.#.##..###...##...##...#', 3: '####.....#....#.###.....#....#####.', Y: '#...##...#.#.#...#....#....#....#..', O: '.###.#...##...##...##...##...#.###.', R: '####.#...##...#####.#.#..#..#.#...#', K: '#...##..#.#.#..##...#.#..#..#.#...#', L: '#....#....#....#....#....#....#####', F: '######....#....####.#....#....#....', 4: '...#...##..#.#.#..#.#####...#....#.', 2: '.###.#...#....#...#...#...#...#####', 0: '.###.#..###.#.##.#.##.#.###..#.###.', S: '.#####....#.....###.....#....#####.', E: '######....#....####.#....#....#####', U: '#...##...##...##...##...##...#.###.', P: '####.#...##...#####.#....#....#....' };
(function skytyping() {
  const N = 520, geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute(new Float32Array(N * 3), 3)); geo.setAttribute('aBirth', new THREE.Float32BufferAttribute(new Float32Array(N).fill(-1), 1)); geo.setAttribute('aSeed', new THREE.Float32BufferAttribute(Float32Array.from({ length: N }, () => Math.random()), 1));
  const mat = new THREE.ShaderMaterial({ transparent: true, depthWrite: false, uniforms: { uT: { value: 0 }, uScale: { value: 400 }, uCol: { value: new THREE.Color(1, 1, 1) } },
    vertexShader: 'attribute float aBirth, aSeed; uniform float uT, uScale; varying float vA; varying float vS; void main(){ float age = uT - aBirth; vS = aSeed; if (aBirth < 0.0 || age < 0.0) { vA = 0.0; gl_PointSize = 0.0; gl_Position = vec4(2.0); return; }' +
      ' vec3 p = position + vec3(age * 0.35, age * 0.04, 0.0); vec4 mv = modelViewMatrix * vec4(p, 1.0); float size = 7.5 + age * 0.1 + aSeed * 1.2; gl_PointSize = size * uScale / -mv.z; vA = smoothstep(0.0, 0.6, age) * (1.0 - smoothstep(60.0, 120.0, age)); gl_Position = projectionMatrix * mv; }',
    fragmentShader: 'uniform vec3 uCol; varying float vA; varying float vS; void main(){ vec2 q = gl_PointCoord - 0.5; float r = length(q); float n = sin(q.x * 18.0 + vS * 30.0) * sin(q.y * 15.0 + vS * 11.0) * 0.06; float a = smoothstep(0.5, 0.18, r + n) * vA; if (a < 0.01) discard; gl_FragColor = vec4(uCol * (0.9 + 0.1 * (0.5 - q.y)), min(1.0, a * 1.15)); }' });
  const pts = new THREE.Points(geo, mat); pts.frustumCulled = false; scene.add(pts); SKYT.pts = pts; SKYT.mat = mat; SKYT.N = N; SKYT.k = 0;
  const white = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.5 }), red = new THREE.MeshStandardMaterial({ color: 0xb3121b, roughness: 0.5 });
  SKYT.planes = []; for (let r = 0; r < 7; r++) { const g = new THREE.Group(); const f = new THREE.Mesh(new THREE.CylinderGeometry(0.45, 0.3, 7, 8), white); f.rotation.z = PI / 2; g.add(f); const w = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.15, 10), red); g.add(w); const t = new THREE.Mesh(new THREE.BoxGeometry(1, 1.6, 0.15), red); t.position.set(3.2, 0.7, 0); g.add(t); g.visible = false; scene.add(g); SKYT.planes.push(g); }
})();
const skytSecret = secret('skywriter', () => { toast('SEVEN PLANES, ONE WORD, TWO MINUTES, THEN GONE. THE MOST EXPENSIVE THING ANYONE ON THE ISLAND SAW TODAY.', 'blue'); });
EGGS.SKYWRITER = () => { SKYT.force = 1; SKYT.next = 0; toast('YOU HEAR PROPELLERS SOMEWHERE HIGH OVER THE HARBOUR.'); };
function skytStart() { const w = SKYT.words[SKYT.wi++ % SKYT.words.length]; SKYT.cols = []; for (const ch of w) { if (ch === ' ') { SKYT.cols.push(0, 0, 0); continue; } const g = SKYT_FONT[ch]; if (!g) continue; for (let c = 0; c < 5; c++) { let bits = 0; for (let r = 0; r < 7; r++) if (g[r * 5 + c] === '#') bits |= 1 << (6 - r); SKYT.cols.push(bits); } SKYT.cols.push(0); }
  SKYT.W = SKYT.cols.length * SKYT.DX; SKYT.x0 = SKYT.W / 2; SKYT.x = SKYT.x0 + 160; SKYT.ci = 0; SKYT.on = true; SKYT.planes.forEach(p => p.visible = true); SKYT.word = w; }
function skytFrame(dt) {
  const T = (SKYT.T = (SKYT.T || 0) + dt); SKYT.mat.uniforms.uT.value = T; SKYT.mat.uniforms.uScale.value = renderer.domElement.height * 0.5 / Math.tan(camera.fov * PI / 360);
  const c = L.sun || { r: 1, g: 1, b: 1 }; SKYT.mat.uniforms.uCol.value.setRGB(0.75 + 0.25 * Math.min(1, c.r), 0.75 + 0.25 * Math.min(1, c.g), 0.78 + 0.22 * Math.min(1, c.b)).multiplyScalar(0.55 + 0.45 * (1 - (L.lamps || 0)));
  const h = nycTime(TIME.utc).hours, W = WX.override || WX.cur;
  if (!SKYT.on) { SKYT.next -= dt; if (SKYT.next <= 0) { SKYT.next = 420 + Math.random() * 180; if (SKYT.force || (h >= 10 && h < 16 && (W === 'CLEAR' || W === 'SCATTERED'))) { SKYT.force = 0; skytStart(); } } }
  else { SKYT.x -= SKYT.V * dt; const a = SKYT.pts.geometry.attributes;
    while (SKYT.ci < SKYT.cols.length && SKYT.x <= SKYT.x0 - SKYT.ci * SKYT.DX) { const bits = SKYT.cols[SKYT.ci], cx = SKYT.x0 - SKYT.ci * SKYT.DX;
      for (let r = 0; r < 7; r++) if (bits & (1 << (6 - r))) { const i = SKYT.k++ % SKYT.N; a.position.setXYZ(i, cx, SKYT.Y0 + (6 - r) * SKYT.DY, SKYT.Z); a.aBirth.setX(i, T); }
      SKYT.ci++; a.position.needsUpdate = true; a.aBirth.needsUpdate = true; SKYT.last = T; }
    SKYT.planes.forEach((p, r) => { p.position.set(SKYT.x + 3, SKYT.Y0 + (6 - r) * SKYT.DY, SKYT.Z); });
    if (SKYT.x < -SKYT.x0 - 200) { SKYT.on = false; SKYT.planes.forEach(p => p.visible = false); } }
  const age = T - SKYT.last; if (age > 2 && age < 70 && !SKYT.on) { const cx = new V3(0, SKYT.Y0 + 21, SKYT.Z).sub(camera.position).normalize(), f = new V3(0, 0, -1).applyQuaternion(camera.quaternion); if (cx.dot(f) > 0.9) { SKYT.watch += dt; if (SKYT.watch > 3) skytSecret(); } }
}
window.__FRAMES.push(dt => { try { skytFrame(dt); } catch (e) { if (!SKYT.err) { SKYT.err = e; console.warn('v132 skytyping', e); } } });
