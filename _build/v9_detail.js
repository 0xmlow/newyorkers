/* ================================================================
   v9 DETAIL  ·  2026-11-21
   What v5 to v8 left: one lumpy white "stone" stood in for every rock, disc and basin on the island; every card's back
   was a flat black slab; the TAP poured a blue tube into a blue disc; the factory was an empty shed. Here the Colossus
   sits on a real sea rock (Poly Haven seaside_rock, projected on three axes so it never stretches, dark and glossy at
   the waterline), the 2030 stones are rough cut stepping stones, the discs and the basin are concrete and sandstone,
   every card has a framer's back (black frame, kraft paper dust cover, a label, a hanging wire), the TAP runs real
   water with a splash, and the factory has steel roof trusses, hanging lamps and painted floor lines.
   ================================================================ */
const DET = { splash: null, stream: null, poolW: null };
const v9hash = (x, y, z) => { const s = Math.sin(x * 127.1 + y * 311.7 + z * 74.7) * 43758.5453; return s - Math.floor(s); };
function v9noise(x, y, z) {
  const i = Math.floor(x), j = Math.floor(y), k = Math.floor(z), fx = x - i, fy = y - j, fz = z - k, u = fx * fx * (3 - 2 * fx), v = fy * fy * (3 - 2 * fy), w = fz * fz * (3 - 2 * fz);
  const L = (a, b, t) => a + (b - a) * t, h = v9hash;
  return L(L(L(h(i, j, k), h(i + 1, j, k), u), L(h(i, j + 1, k), h(i + 1, j + 1, k), u), v), L(L(h(i, j, k + 1), h(i + 1, j, k + 1), u), L(h(i, j + 1, k + 1), h(i + 1, j + 1, k + 1), u), v), w);
}
const v9fbm = (x, y, z) => v9noise(x, y, z) * 0.55 + v9noise(x * 2.1, y * 2.1, z * 2.1) * 0.28 + v9noise(x * 4.3, y * 4.3, z * 4.3) * 0.17;

/* ---- 1. rock: triplanar colour and roughness, wet and dark below a line ---- */
function v9Rock(name, rep, tint, wetY) {
  const m = phSet(new THREE.MeshStandardMaterial(), name, 1, { color: tint, ns: 1.3 });
  m.onBeforeCompile = sh => {
    sh.uniforms.uRep = { value: rep }; sh.uniforms.uWet = { value: wetY };
    sh.vertexShader = 'varying vec3 vRW; varying vec3 vRN;\n' + sh.vertexShader.replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvRW = (modelMatrix * vec4(transformed, 1.0)).xyz; vRN = normalize(mat3(modelMatrix) * objectNormal);');
    sh.fragmentShader = 'varying vec3 vRW; varying vec3 vRN; uniform float uRep, uWet;\n' + sh.fragmentShader
      .replace('#include <map_fragment>', `vec3 tw = pow(abs(vRN), vec3(4.0)); tw /= (tw.x + tw.y + tw.z);
        vec4 tc = texture2D(map, vRW.zy * uRep) * tw.x + texture2D(map, vRW.xz * uRep) * tw.y + texture2D(map, vRW.xy * uRep) * tw.z;
        float wet = (1.0 - smoothstep(uWet - 0.2, uWet + 0.9, vRW.y)) * 0.7;
        tc = mapTexelToLinear(tc); diffuseColor *= vec4(tc.rgb * (1.0 - 0.45 * wet), 1.0);`)
      .replace('#include <roughnessmap_fragment>', `float roughnessFactor = roughness;
        float tr = texture2D(roughnessMap, vRW.zy * uRep).g * tw.x + texture2D(roughnessMap, vRW.xz * uRep).g * tw.y + texture2D(roughnessMap, vRW.xy * uRep).g * tw.z;
        roughnessFactor *= mix(tr, 0.25, wet);`);
  };
  m.customProgramCacheKey = () => 'mi-rock-' + name + rep + wetY;
  return m;
}
DET.rock = v9Rock('seaside_rock', 0.11, 0xffffff, 0.6); DET.rock.color.setRGB(1.55, 1.5, 1.4);
DET.step = v9Rock('rock_boulder_dry', 0.35, 0xe6dfd2, -0.4);
function v9Lump(geo, amp, freq, keepTop) {
  const p = geo.attributes.position, v = new V3();
  for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i); const n = v9fbm(v.x * freq + 10, v.y * freq + 3, v.z * freq + 7) - 0.5;
    if (keepTop !== undefined && v.y > keepTop - 0.01) { p.setY(i, v.y + n * 0.04); const r = Math.hypot(v.x, v.z); if (r > 0.01) { const k = 1 + n * amp * 0.6 / r; p.setX(i, v.x * k); p.setZ(i, v.z * k); } continue; }
    const len = v.length() || 1; v.multiplyScalar(1 + n * amp / len * (keepTop !== undefined ? 0.6 : 1)); p.setXYZ(i, v.x, v.y, v.z); }
  geo.computeVertexNormals(); return geo;
}
// three's polyhedra are non indexed, so computeVertexNormals gives facets: average the normals of coincident vertices
function v9Smooth(geo) {
  geo.computeVertexNormals(); const p = geo.attributes.position, n = geo.attributes.normal, acc = {}, key = i => Math.round(p.getX(i) * 100) + ',' + Math.round(p.getY(i) * 100) + ',' + Math.round(p.getZ(i) * 100);
  for (let i = 0; i < p.count; i++) { const k = key(i), a = acc[k] || (acc[k] = [0, 0, 0]); a[0] += n.getX(i); a[1] += n.getY(i); a[2] += n.getZ(i); }
  for (let i = 0; i < p.count; i++) { const a = acc[key(i)], l = Math.hypot(a[0], a[1], a[2]) || 1; n.setXYZ(i, a[0] / l, a[1] / l, a[2] / l); }
  n.needsUpdate = true; return geo;
}
(function () {
  const near = (o, x, z, r) => Math.hypot(o.position.x - x, o.position.z - z) < r;
  scene.children.slice().forEach(o => {
    if (!o.isMesh || o.isInstancedMesh || o.material !== MAT.stone) return;
    // the Colossus rock: a craggy sea rock instead of a faceted dodecahedron
    if (o.geometry.type === 'DodecahedronGeometry') {
      const g = v9Lump(v9Lump(new THREE.IcosahedronGeometry(26, 14), 14, 0.05), 4, 0.16); const p = g.attributes.position;
      for (let i = 0; i < p.count; i++) { const y = p.getY(i); if (y > 10) p.setY(i, 10 + (y - 10) * 0.35); }   // a worn shelf under the plinth
      v9Smooth(g); o.geometry = g; o.material = DET.rock; o.castShadow = o.receiveShadow = true; return;
    }
    // the 2030 stepping stones
    if (o.geometry.type === 'CylinderGeometry' && Math.abs(o.position.x) < 0.1 && o.position.z > 180 && o.position.z < 225) {
      const g = new THREE.CylinderGeometry(1.9, 2.25, 1.2, 28, 4); v9Lump(g, 0.55, 1.4 + o.position.z * 0.001, 0.6); o.geometry = g; o.material = DET.step; o.rotation.y = o.position.z; o.castShadow = o.receiveShadow = true; return;
    }
    // the TAP basin: sandstone, with a coping
    if (o.geometry.type === 'CylinderGeometry' && near(o, -36, 66, 1)) {
      o.material = ARCH.stone.clone(); o.material.side = THREE.DoubleSide;
      const cop = new THREE.Mesh(new THREE.TorusGeometry(5.15, 0.32, 10, 64), ARCH.cap); cop.rotation.x = PI / 2; cop.position.set(o.position.x, o.position.y + 0.5, o.position.z); cop.castShadow = cop.receiveShadow = true; scene.add(cop); return;
    }
    // discs and platforms (brain, wagmi, lighthouse): poured concrete, not rock
    if (o.geometry.type === 'CylinderGeometry' || (o.geometry.type === 'BoxGeometry' && near(o, LH.x, LH.z + 1.5, 2))) { o.material = ARCH.cap; worldUV(o.geometry, 3); }
  });
  // a few boulders round the Colossus rock's waterline
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); const bg = v9Smooth(v9Lump(new THREE.IcosahedronGeometry(1, 5), 0.45, 1.3));
  const bm = new THREE.InstancedMesh(bg, DET.rock, 26); for (let i = 0; i < 26; i++) { const a = i / 26 * PI * 2 + v9hash(i, 1, 2), r = 33 + v9hash(i, 3, 4) * 6, s = 1.4 + v9hash(i, 5, 6) * 3.2;
    q.setFromEuler(e.set(i, i * 2.3, i * 0.7)); m.compose(new V3(58 + Math.cos(a) * r * 1.3, -0.4 + s * 0.15, 262 + Math.sin(a) * r * 1.05), q, new V3(s, s * 0.7, s * 1.1)); bm.setMatrixAt(i, m); }
  bm.castShadow = bm.receiveShadow = true; scene.add(bm);
})();

/* ---- 2. a framer's back on every card: black frame, kraft dust cover, a label, a wire ---- */
(function () {
  const cv = document.createElement('canvas'); cv.width = cv.height = 512; const c = cv.getContext('2d'); if (!c || !c.fillRect) return;
  c.fillStyle = '#121212'; c.fillRect(0, 0, 512, 512);
  c.fillStyle = '#8e7350'; c.fillRect(30, 30, 452, 452);
  for (let i = 0; i < 2600; i++) { const x = v9hash(i, 1, 0) * 452 + 30, y = v9hash(i, 2, 0) * 452 + 30; c.fillStyle = `rgba(${v9hash(i, 3, 0) > 0.5 ? '80,55,30' : '205,175,130'},${0.08 + v9hash(i, 4, 0) * 0.12})`; c.fillRect(x, y, 1 + v9hash(i, 5, 0) * 9, 1); }
  c.strokeStyle = 'rgba(60,40,20,0.35)'; c.lineWidth = 2; c.strokeRect(36, 36, 440, 440);
  c.fillStyle = '#f2eee4'; c.fillRect(300, 380, 150, 62); c.fillStyle = '#2962ff'; c.fillRect(300, 380, 150, 8);
  c.fillStyle = 'rgba(30,30,30,0.7)'; for (let k = 0; k < 4; k++) c.fillRect(310, 398 + k * 10, 80 + (k % 2) * 40, 3);
  if (c.beginPath) { c.strokeStyle = '#8c8f91'; c.lineWidth = 3; c.beginPath(); c.moveTo(70, 150); c.quadraticCurveTo(256, 95, 442, 150); c.stroke();
  c.fillStyle = '#c0b49a'; [[70, 150], [442, 150]].forEach(([x, y]) => { c.beginPath(); c.arc(x, y, 7, 0, PI * 2); c.fill(); }); }
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
  MAT.frame = new THREE.MeshStandardMaterial({ map: t, roughness: 0.75, metalness: 0 }); if (frameMesh) frameMesh.material = MAT.frame;   // cards are built after this file runs
})();

/* ---- 3. the TAP runs water ---- */
(function () {
  if (typeof TAP === 'undefined' || !TAP.stream) return;
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256; const c = cv.getContext('2d');
  if (c && c.fillRect) { c.fillStyle = '#8fe0ee'; c.fillRect(0, 0, 64, 256); for (let i = 0; i < 160; i++) { c.fillStyle = `rgba(255,255,255,${0.15 + v9hash(i, 7, 1) * 0.5})`; c.fillRect(v9hash(i, 8, 1) * 64, v9hash(i, 9, 1) * 256, 1 + v9hash(i, 6, 1) * 3, 10 + v9hash(i, 5, 1) * 40); } }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(2, 1.5); t.encoding = THREE.sRGBEncoding;
  const sm = new THREE.MeshStandardMaterial({ map: t, transparent: true, opacity: 0.82, roughness: 0.05, metalness: 0.2, emissive: 0x0c3a44, emissiveIntensity: 0.5, depthWrite: false });
  TAP.stream.material = sm; DET.stream = t; DET.tap = TAP;
  // the pool takes the sea's ripples
  scene.children.forEach(o => { if (o.isMesh && o.material === MAT.pool && o.geometry.type === 'CircleGeometry' && Math.hypot(o.position.x + 36, o.position.z - 66) < 1) {
    const pm = new THREE.MeshStandardMaterial({ color: 0x4fb9cc, roughness: 0.04, metalness: 0.3, transparent: true, opacity: 0.86, normalMap: MAT.water.normalMap, normalScale: new THREE.Vector2(0.6, 0.6) });
    o.material = pm; DET.poolW = pm; } });
  // splash: droplets thrown up where the stream lands, and a foam ring
  const sp = TAP.stream.position, N = 70, g = new THREE.BufferGeometry(), p = new Float32Array(N * 3); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const pts = new THREE.Points(g, new THREE.PointsMaterial({ color: 0xf2fbff, size: 0.16, transparent: true, opacity: 0.85, depthWrite: false })); pts.frustumCulled = false; scene.add(pts);
  const ring = new THREE.Mesh(new THREE.RingGeometry(0.4, 0.9, 32), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false })); ring.rotation.x = -PI / 2; ring.position.set(sp.x, sp.y - 3.05, sp.z); scene.add(ring);
  DET.splash = { pts, ring, base: new V3(sp.x, sp.y - 3.1, sp.z), D: Array.from({ length: N }, (_, i) => ({ t: v9hash(i, 1, 9), a: v9hash(i, 2, 9) * PI * 2, v: 1.5 + v9hash(i, 3, 9) * 2.5, s: 0.6 + v9hash(i, 4, 9) * 1.2 })) };
})();

/* ---- 4. the factory: steel trusses under the sawtooth, hanging lamps, painted floor lines ---- */
(function () {
  const cx = 0, cz = -64, w = 32, d = 28, h = 9, g = ground(cx, cz) + 0.02;
  const steel = new THREE.MeshStandardMaterial({ color: 0x5b6168, roughness: 0.5, metalness: 0.8 });
  const parts = [], m = new THREE.Matrix4(), q = new THREE.Quaternion(), up = new V3(0, 1, 0);
  const bar = (a, b, r) => { const d2 = b.clone().sub(a), len = d2.length(); q.setFromUnitVectors(up, d2.clone().normalize()); m.compose(a.clone().add(b).multiplyScalar(0.5), q, new V3(r, len, r)); parts.push(m.clone()); };
  const TZ = [-11, -5.5, 0, 5.5, 11];
  TZ.forEach(dz => { const z = cz + dz, y0 = g + h - 0.5, y1 = g + h + 0.6; bar(new V3(cx - w / 2, y0, z), new V3(cx + w / 2, y0, z), 0.16); bar(new V3(cx - w / 2, y1, z), new V3(cx + w / 2, y1, z), 0.14);
    for (let i = 0; i <= 16; i++) { const x = cx - w / 2 + i * w / 16; bar(new V3(x, y0, z), new V3(x, y1, z), 0.06); if (i < 16) bar(new V3(x, i % 2 ? y1 : y0, z), new V3(x + w / 16, i % 2 ? y0 : y1, z), 0.06); } });
  [-12, 0, 12].forEach(x => bar(new V3(cx + x, g + h - 0.5, cz - d / 2), new V3(cx + x, g + h - 0.5, cz + d / 2), 0.12));
  const im = new THREE.InstancedMesh(new THREE.CylinderGeometry(1, 1, 1, 6), steel, parts.length); parts.forEach((pm, i) => im.setMatrixAt(i, pm)); im.castShadow = true; scene.add(im);
  // lamps: three to a truss, hung so their shades sit under the chord
  TZ.forEach(dz => [-10, 0, 10].forEach(x => { prop('hanging_industrial_lamp', cx + x, cz + dz, 0, g + h - 0.5 - 1.36, 1, false); const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 8, 6), MAT.bulb); b.position.set(cx + x, g + h - 0.5 - 1.3, cz + dz); scene.add(b); }));
  PROP_FILES.push('hanging_industrial_lamp');
  // floor: safety lines round the belt and a hatched box at the lever
  const yl = new THREE.MeshStandardMaterial({ color: 0xe8b923, roughness: 0.7, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 });
  const zc = cz - 2, X = 14.6, Z = 4.6, y = g + 0.16;
  [[0, -Z, 2 * X, 0.14], [0, Z, 2 * X, 0.14], [-X, 0, 0.14, 2 * Z], [X, 0, 0.14, 2 * Z]].forEach(([x, z, sx, sz]) => { const s = new THREE.Mesh(new THREE.PlaneGeometry(sx, sz), yl); s.rotation.x = -PI / 2; s.position.set(cx + x, y, zc + z); s.receiveShadow = true; scene.add(s); });
  const lx = cx + 9, lz = cz + d / 2 - 3; for (let i = 0; i < 7; i++) { const s = new THREE.Mesh(new THREE.PlaneGeometry(0.16, 3.4), yl); s.rotation.set(-PI / 2, 0, PI / 4); s.position.set(lx - 1.4 + i * 0.47, y, lz); scene.add(s); }
})();

function detFrame(dt) {
  if (DET.stream) DET.stream.offset.y += dt * 1.6;
  if (DET.poolW && DET.poolW.normalMap) { DET.poolW.normalMap.offset.set(T * 0.03, T * 0.021); }
  const S = DET.splash; if (S) { const on = TAP.on; S.pts.visible = S.ring.visible = on;
    if (on) { const a = S.pts.geometry.attributes.position; S.D.forEach((d, i) => { d.t += dt * d.s; if (d.t > 1) d.t -= 1; const tt = d.t * 0.7; a.setXYZ(i, S.base.x + Math.cos(d.a) * d.v * tt, S.base.y + d.v * tt - 4.9 * tt * tt * 1.6, S.base.z + Math.sin(d.a) * d.v * tt); }); a.needsUpdate = true;
      const k = (T * 1.4) % 1; S.ring.scale.setScalar(1 + k * 2.2); S.ring.material.opacity = 0.5 * (1 - k); } }
}
window.__DET = DET;
