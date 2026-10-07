/* ================================================================
   v4: the show. Bloom and grade, gulls, boats, the gm blimp, and camera rails (tour mode and the film)
   ================================================================ */

/* --- post chain: bloom that wakes up at night, a quiet grade, a vignette, a whisper of grain --- */
const POST = { on: false, comp: null, bloom: null, grade: null };
function setupPost() {
  if (!THREE.EffectComposer || !THREE.UnrealBloomPass || !THREE.GammaCorrectionShader) return;
  try {
    const sz = renderer.getSize(new THREE.Vector2()), comp = new THREE.EffectComposer(renderer);
    comp.addPass(new THREE.RenderPass(scene, camera));
    const bloom = new THREE.UnrealBloomPass(new THREE.Vector2(sz.x, sz.y), 0.4, 0.55, 0.88); comp.addPass(bloom);
    const grade = new THREE.ShaderPass({
      uniforms: { tDiffuse: { value: null }, uVig: { value: 0.28 }, uSat: { value: 1.08 }, uTime: { value: 0 }, uGrain: { value: 0.018 } },
      vertexShader: 'varying vec2 vUv; void main(){ vUv = uv; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }',
      fragmentShader: 'uniform sampler2D tDiffuse; uniform float uVig, uSat, uTime, uGrain; varying vec2 vUv;\nfloat h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }\nvoid main(){ vec4 c = texture2D(tDiffuse, vUv); float l = dot(c.rgb, vec3(0.2126, 0.7152, 0.0722)); c.rgb = mix(vec3(l), c.rgb, uSat); vec2 d = vUv - 0.5; c.rgb *= 1.0 - uVig * dot(d, d) * 2.2; c.rgb += (h(vUv * 997.0 + uTime) - 0.5) * uGrain * (0.3 + l); gl_FragColor = c; }'
    }); comp.addPass(grade);
    comp.addPass(new THREE.ShaderPass(THREE.GammaCorrectionShader));
    POST.comp = comp; POST.bloom = bloom; POST.grade = grade; POST.on = true; panoMat.uniforms.uLin.value = 1;
  } catch (e) { POST.on = false; panoMat.uniforms.uLin.value = 0; }
}
function renderFrame() {
  if (POST.on) { POST.grade.uniforms.uTime.value = (T * 60) % 1000; POST.bloom.strength = 0.28 + 0.62 * L.lamps; POST.bloom.threshold = 0.9 - 0.18 * L.lamps; POST.comp.render(); }
  else renderer.render(scene, camera);
}

/* --- gulls: forty birds circling the harbour on lazy figure eights, wings beating --- */
const GULLS = (function () {
  const n = 40, wing = new THREE.BufferGeometry();
  wing.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.25, -0.9, 0.12, 0, 0, 0, -0.25, 0, 0, 0.25, 0.9, 0.12, 0, 0, 0, -0.25], 3)); wing.computeVertexNormals();
  const mesh = new THREE.InstancedMesh(wing, new THREE.MeshStandardMaterial({ color: 0xf4f4f0, roughness: 0.8, side: THREE.DoubleSide }), n); mesh.frustumCulled = false; scene.add(mesh);
  const b = Array.from({ length: n }, (_, i) => ({ cx: (rnd() - 0.5) * 260, cz: 40 + rnd() * 220, r: 18 + rnd() * 40, y: 18 + rnd() * 40, sp: 0.15 + rnd() * 0.25, ph: rnd() * 6.28, s: 0.9 + rnd() * 0.7 }));
  return { mesh, b };
})();
/* --- sailboats and the Staten Island style ferry loop --- */
const BOATS = (function () {
  const list = [];
  for (let i = 0; i < 6; i++) {
    const g = new THREE.Group(), hull = new THREE.Mesh(new THREE.BoxGeometry(1.6, 0.8, 5.5), cm(i % 2 ? 0xf0efea : 0x1b2a4a)); hull.position.y = 0.3; g.add(hull);
    const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 7, 6), MAT.white); mast.position.y = 3.8; g.add(mast);
    const sail = new THREE.Mesh(new THREE.BufferGeometry().setAttribute('position', new THREE.Float32BufferAttribute([0, 0.8, -2.2, 0, 7, -0.1, 0, 0.8, 1.6], 3)), new THREE.MeshStandardMaterial({ color: i === 2 ? 0x2962ff : i === 4 ? 0xff6b00 : 0xfafaf5, side: THREE.DoubleSide, roughness: 0.7 }));
    sail.geometry.computeVertexNormals(); g.add(sail); g.traverse(o => o.castShadow = true); scene.add(g);
    list.push({ g, r: 180 + i * 22, a: i * 1.1, v: (i % 2 ? 1 : -1) * (0.012 + rnd() * 0.01) });
  }
  return list;
})();
/* --- the gm blimp: an eye on its nose, a banner that says what the island says --- */
const BLIMP = (function () {
  const g = new THREE.Group(), env = new THREE.Mesh(new THREE.SphereGeometry(1, 32, 18), new THREE.MeshStandardMaterial({ color: 0xe9ecef, roughness: 0.45, metalness: 0.15 }));
  env.scale.set(5, 5, 17); g.add(env);
  [[0, 5, -14, 0], [0, -5, -14, 0], [5, 0, -14, PI / 2], [-5, 0, -14, PI / 2]].forEach(([x, y, z, r]) => { const f = new THREE.Mesh(new THREE.BoxGeometry(0.3, 4, 4), MAT.blue); f.position.set(x * 0.7, y * 0.7, z); f.rotation.z = r; g.add(f); });
  const gond = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.6, 6), MAT.ink); gond.position.y = -5.6; g.add(gond);
  const eye = new THREE.Mesh(new THREE.CircleGeometry(2.2, 32), new THREE.MeshBasicMaterial({ map: tex('assets/eye.png'), transparent: true, toneMapped: false })); eye.position.set(0, 0, 17.05); g.add(eye);
  const bt = signTex([{ t: 'gm', s: 0.62, f: 'Georgia,serif', b: false }, { t: 'MEME ISLAND · POPULATION 527 CARDS', s: 0.16 }], 1024, 384, '#2962FF', '#FFFFFF');
  [-1, 1].forEach(sd => { const p = new THREE.Mesh(new THREE.PlaneGeometry(16, 6), new THREE.MeshBasicMaterial({ map: bt, toneMapped: false })); p.position.set(sd * 5.05, 0, 0); p.rotation.y = sd * PI / 2; g.add(p); });
  g.traverse(o => o.castShadow = true); scene.add(g); return { g, a: 0 };
})();
function updateLife(dt, t) {
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler();
  GULLS.b.forEach((b, i) => { const a = t * b.sp + b.ph, x = b.cx + Math.sin(a) * b.r, z = b.cz + Math.sin(a * 2) * b.r * 0.5, y = b.y + Math.sin(a * 3) * 2, flap = Math.sin(t * 9 + i) * 0.5;
    const dx = Math.cos(a) * b.r, dz = Math.cos(a * 2) * b.r; q.setFromEuler(e.set(0, Math.atan2(dx, dz), flap * 0.3)); m.compose(_p.set(x, y, z), q, _s.set(b.s, b.s * (1 + flap), b.s)); GULLS.mesh.setMatrixAt(i, m); });
  GULLS.mesh.instanceMatrix.needsUpdate = true;
  BOATS.forEach(b => { b.a += b.v * dt; const x = Math.cos(b.a) * b.r, z = Math.sin(b.a) * b.r * 0.8 + 60; b.g.position.set(x, Math.sin(t * 1.3 + b.r) * 0.15, z); b.g.rotation.y = Math.atan2(-Math.sin(b.a) * b.v, Math.cos(b.a) * b.v * 0.8); b.g.rotation.z = Math.sin(t + b.r) * 0.05; });
  BLIMP.a += dt * 0.045; const ba = BLIMP.a; BLIMP.g.position.set(Math.cos(ba) * 150, 78 + Math.sin(t * 0.4) * 2, Math.sin(ba) * 150 + 20); BLIMP.g.rotation.y = -ba;
}

/* --- camera rails: catmull rom through keyed positions and look points. C runs the island tour --- */
const RAIL = { on: false, t: 0, dur: 1, pos: null, look: null, fov: null, ease: true, done: null };
function cr3(ps, t) {
  const n = ps.length - 1; if (n < 1) return ps[0];
  const f = Math.min(n - 1e-6, Math.max(0, t * n)), i = Math.floor(f), u = f - i, p0 = ps[Math.max(0, i - 1)], p1 = ps[i], p2 = ps[i + 1], p3 = ps[Math.min(n, i + 2)];
  return [0, 1, 2].map(k => 0.5 * ((2 * p1[k]) + (-p0[k] + p2[k]) * u + (2 * p0[k] - 5 * p1[k] + 4 * p2[k] - p3[k]) * u * u + (-p0[k] + 3 * p1[k] - 3 * p2[k] + p3[k]) * u * u * u));
}
function playRail(r) { Object.assign(RAIL, { on: true, t: 0, dur: r.dur || 8, pos: r.pos, look: r.look, fov: r.fov || null, ease: r.ease !== false, done: r.done || null }); }
function applyRail(dt) {
  if (!RAIL.on) return; RAIL.t += dt; const lin = Math.min(1, RAIL.t / RAIL.dur), u = RAIL.ease ? lin * lin * (3 - 2 * lin) : lin;
  const p = cr3(RAIL.pos, u), l = cr3(RAIL.look, u); camera.position.set(p[0], p[1], p[2]); camera.up.set(0, 1, 0); camera.lookAt(l[0], l[1], l[2]);
  if (RAIL.fov) { camera.fov = RAIL.fov[0] + (RAIL.fov[1] - RAIL.fov[0]) * u; camera.updateProjectionMatrix(); }
  P.x = p[0]; P.z = p[2];
  if (lin >= 1) { RAIL.on = false; if (RAIL.fov) { camera.fov = 68; camera.updateProjectionMatrix(); } const d = RAIL.done; RAIL.done = null; if (d) d(); }
}
/* the island tour: every scene, in order; the film is cut from these same rails */
const TOUR = [
  { name: 'arrivals', dur: 10, pos: [[70, 34, 270], [24, 14, 205], [0, 3.6, 172]], look: [[0, 12, 110], [0, 8, 110], [0, 6, 118]] },
  { name: 'great wave', dur: 9, pos: [[-6, 4, 182], [-12, 9, 140], [-50, 7, 132]], look: [[-30, 10, 156], [-30, 11, 156], [-30, 9, 156]] },
  { name: 'floor mountain', dur: 10, pos: [[0, 3.2, 32], [0, 6.4, 13], [4, 10.5, 1]], look: [[0, 4.5, 0], [0, 6, -12], [0, 5, -34]] },
  { name: 'sculpture rows', dur: 9, pos: [[-38, 5, -28], [0, 7, -24], [38, 5, -28]], look: [[-26, 7, -42], [0, 6, -44], [26, 7, -42]] },
  { name: 'factory', dur: 8, pos: [[0, 3, -36], [0, 4, -50], [9, 5, -58]], look: [[0, 3.5, -64], [0, 2.5, -66], [-6, 2, -66]] },
  { name: 'brain', dur: 9, pos: [[22, 3, -22], [33, 3.4, -33], [42, 4.4, -42]], look: [[44, 7, -44], [44, 6, -44], [52, 6, -52]] },
  { name: 'lighthouse', dur: 11, pos: [[0, 2, -94], [4, 22, -100], [16, 55, -108]], look: [[0, 12, -126], [0, 34, -126], [0, 49, -126]] },
  { name: 'vault', dur: 8, pos: [[0, 2.6, -112], [0, 2.6, -120], [0, 2.7, -125]], look: [[0, 2.7, -130], [0, 2.7, -130], [0, 2.8, -131]] },
  { name: 'open metaverse portal', dur: 7, pos: [[30, 3.2, -60], [30, 4.2, -74], [30, 4.4, -79.4]], look: [[30, 4.2, -80], [30, 4.4, -82], [30, 4.4, -84]] },
  { name: 'wagmi wheel', dur: 10, pos: [[28, 6, 26], [40, 20, -6], [50, 34, -24]], look: [[62, 18, 0], [62, 20, 0], [62, 22, 0]] },
  { name: 'survive bunker', dur: 9, ease: false, pos: [[18, 1.9, 44], [44, 1.9, 44], [66, 1.9, 44]], look: [[30, 2.6, 44], [56, 2.6, 44], [78, 2.6, 44]] },
  { name: 'survive row', dur: 7, pos: [[16, 6, 74], [44, 8, 78], [72, 6, 74]], look: [[28, 6, 61], [44, 6, 61], [60, 6, 61]] },
  { name: 'bank', dur: 8, pos: [[-34, 4, 16], [-44, 4, 6], [-53, 3, 1]], look: [[-46, 6, 12], [-60, 6, 0], [-68, 4, -4]] },
  { name: 'summer.jpg', dur: 8, pos: [[-24, 4, 70], [-44, 7, 70], [-64, 4, 68]], look: [[-34, 5, 52], [-44, 6, 46], [-54, 5, 52]] },
  { name: 'census walk', dur: 9, ease: false, pos: [[3, 2.2, 44], [3, 2.2, 64], [3, 2.2, 84]], look: [[-12, 3, 50], [-12, 3, 66], [-12, 3, 86]] },
  { name: 'bodega', dur: 6, pos: [[2, 2.2, 62], [8, 2.2, 66], [12, 2.2, 66]], look: [[17, 2.6, 66], [20, 2.4, 66], [22, 2.2, 63]] },
  { name: 'gm beach', dur: 8, pos: [[-34, 3, 112], [0, 4, 108], [34, 3, 112]], look: [[-20, 4, 124], [0, 5, 124], [20, 4, 124]] },
  { name: 'colossus', dur: 10, pos: [[18, 6, 196], [36, 38, 214], [84, 34, 236]], look: [[58, 30, 262], [58, 44, 262], [58, 50, 262]] },
  { name: 'aerial', dur: 14, ease: false, pos: [[0, 120, 190], [170, 110, 60], [150, 100, -140], [-60, 110, -190], [-190, 120, 20], [-60, 120, 190]], look: [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]] }
];
let tourIdx = -1;
function nextTour() { tourIdx = (tourIdx + 1) % TOUR.length; const r = TOUR[tourIdx]; if (r.name === 'vault' && !state.vault) openVault(); playRail(Object.assign({}, r, { done: () => { if (tourIdx >= 0) nextTour(); } })); toast('TOUR: ' + Q(r.name.toUpperCase()) + '. ANY MOVE KEY TO GET OFF.', 'blue'); }
function stopTour() { tourIdx = -1; RAIL.on = false; RAIL.done = null; teleport(camera.position.x, camera.position.z, P.yaw); }
