/* ================================================================
   v7 ARCHITECTURE  ·  2026-11-21
   After v6 the ground was real and the buildings were still boxes. The cheapest way to make a box a building is to
   give it what time gives a building: dirt at its feet, rain streaks under its edges, a cap on its wall tops and a
   plinth at its base. Every wall on the island gets that here, merged into two draws. Then the worst offenders get
   their own work: the factory in corrugated iron with clerestory windows, a roller shutter, downpipes and a smoking
   chimney; the bunker in board formed concrete; the bank's columns fluted with capitals and bases; the crane as a
   lattice; and every building and street dressed with Poly Haven CC0 props (lamps, AC units, ducts, barrels, crates,
   hydrants, bins, picnic tables, buoys in the harbour).
   ================================================================ */
const ARCH = { props: {}, glass: null, smoke: null, buoys: [], lampHeads: null };

/* ---- 1. surfaces ---- */
phSet(MAT.red, 'corrugated_iron', 1.4, { color: 0xc9765c, rough: 0.85, ns: 1.4 }); MAT.red.metalness = 0.3;
ARCH.bunker = phSet(new THREE.MeshStandardMaterial(), 'concrete_wall_004', 1.1, { ns: 1.2 }); ARCH.bunker.color.setRGB(1.15, 1.12, 1.06);
ARCH.stone = phSet(new THREE.MeshStandardMaterial(), 'white_sandstone_blocks_02', 0.5, { color: 0xf2eadc });
ARCH.shutter = phSet(new THREE.MeshStandardMaterial(), 'painted_metal_shutter', 1, { color: 0x9aa4a8, rough: 0.7, ns: 1.2 }); ARCH.shutter.metalness = 0.4;
ARCH.cap = phSet(new THREE.MeshStandardMaterial(), 'concrete_floor_02', 1, { color: 0xf4f1ea });
ARCH.plinth = phSet(new THREE.MeshStandardMaterial(), 'concrete_wall_004', 1, { color: 0xb9b3a8, ns: 1.3 });
ARCH.steel = new THREE.MeshStandardMaterial({ color: 0x3a3d42, roughness: 0.45, metalness: 0.8 });
ARCH.glass = new THREE.MeshStandardMaterial({ color: 0x8fa6b0, roughness: 0.08, metalness: 0.7, emissive: 0xffc27a, emissiveIntensity: 0.1 });
(function () {
  scene.updateMatrixWorld(true);
  const inB = (o, x0, x1, z0, z1) => o.position.x > x0 && o.position.x < x1 && o.position.z > z0 && o.position.z < z1;
  scene.children.forEach(o => {
    if (!o.isMesh) return;
    if (o.material === MAT.conc && inB(o, 19, 69, 37, 51)) o.material = ARCH.bunker;                       // SURVIVE
    if (o.material === MAT.sandstone || (o.material === MAT.red && inB(o, 30, 90, 230, 300))) {                // the Colossus plinth
      o.material = ARCH.stone; worldUV(o.geometry, 2.4);
    }
  });
})();

// the bodega awning: striped canvas, not a salmon slab
(function () {
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const c = cv.getContext('2d');
  if (c && c.fillRect) { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#f3efe6' : '#c8402c'; c.fillRect(i * 32, 0, 32, 64); } c.fillStyle = 'rgba(0,0,0,0.12)'; for (let y = 0; y < 64; y += 3) c.fillRect(0, y, 256, 1); }
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(1, 3); t.anisotropy = ANISO;
  scene.children.forEach(o => { if (o.isMesh && o.material && o.material.color && o.material.color.getHex() === 0xd93a2a && Math.hypot(o.position.x - 11, o.position.z - 66) < 4) { o.material = new THREE.MeshStandardMaterial({ map: t, roughness: 0.9, side: THREE.DoubleSide }); const v = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.35, o.geometry.parameters.depth), o.material); v.position.set(o.position.x - 1.15, o.position.y - 0.55, o.position.z); scene.add(v); } });
})();

/* ---- 2. weathering: grime at the foot of every wall, streaks under its edges, a slow dirt field ---- */
const WEATHER_GLSL = {
  v: ['varying vec3 vAW; varying vec3 vAN;', 'vAW = (modelMatrix * vec4(transformed, 1.0)).xyz; vAN = normalize(mat3(modelMatrix) * objectNormal);'],
  f: `varying vec3 vAW; varying vec3 vAN; uniform float uWBase, uWStreak;
    float ah(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float an(vec2 p) { vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(ah(i), ah(i + vec2(1.0, 0.0)), f.x), mix(ah(i + vec2(0.0, 1.0)), ah(i + vec2(1.0, 1.0)), f.x), f.y); }`,
  c: `{ float wy = vAW.y - uWBase, side = 1.0 - abs(vAN.y);
      float big = an(vAW.xz * 0.16 + vAW.y * 0.21) * 0.6 + an(vAW.xz * 0.5 - vAW.y * 0.4) * 0.4;
      float grime = (1.0 - smoothstep(0.0, 1.5, wy)) * side;
      float hcoord = (vAW.x + vAW.z) * 2.9;
      float streak = smoothstep(0.58, 0.9, an(vec2(hcoord, vAW.y * 0.07)) * 0.75 + an(vec2(hcoord * 3.1, vAW.y * 0.4)) * 0.25) * side * smoothstep(-0.5, 2.5, wy);
      diffuseColor.rgb *= (1.0 - 0.34 * grime * (0.65 + 0.7 * big)) * (1.0 - 0.18 * streak * uWStreak) * (0.9 + 0.2 * big);
      diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.86, 0.82, 0.7), grime * 0.45); }`
};
function weather(mat, key, streak) {
  const prev = mat.onBeforeCompile && mat.onBeforeCompile.toString().indexOf('[native') < 0 ? mat.onBeforeCompile : null;
  mat.onBeforeCompile = (sh, r) => {
    if (prev) prev(sh, r);
    sh.uniforms.uWBase = { value: 0.6 }; sh.uniforms.uWStreak = { value: streak === undefined ? 1 : streak };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\n' + WEATHER_GLSL.v[0]).replace('#include <project_vertex>', '#include <project_vertex>\n' + WEATHER_GLSL.v[1]);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + WEATHER_GLSL.f).replace('#include <color_fragment>', '#include <color_fragment>\n' + WEATHER_GLSL.c);
  };
  mat.customProgramCacheKey = () => 'mi-weather-' + key; mat.needsUpdate = true;
}
[[MAT.white, 'white'], [MAT.bone, 'bone'], [MAT.conc, 'conc'], [MAT.red, 'red', 0.6], [MAT.brick, 'brick', 0.7], [MAT.lime, 'lime'], [ARCH.bunker, 'bunker'], [ARCH.stone, 'stone'], [ARCH.plinth, 'plinth', 0.4], [ARCH.cap, 'cap', 0.3]].forEach(([m, k, s]) => weather(m, k, s));

/* ---- 3. caps and plinths on every wall, merged into two meshes ---- */
function mergeBoxes(list, mat, uvScale) {
  const pos = [], nrm = [], uv = [], idx = []; let base = 0; const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), n3 = new THREE.Matrix3(), v = new V3(), nn = new V3();
  list.forEach(b => {
    const g = new THREE.BoxGeometry(b.w, b.h, b.d); worldUV(g, uvScale); q.setFromAxisAngle(new V3(0, 1, 0), b.ry); m4.compose(new V3(b.x, b.y, b.z), q, new V3(1, 1, 1)); n3.getNormalMatrix(m4);
    const p = g.attributes.position, n = g.attributes.normal, t = g.attributes.uv;
    for (let i = 0; i < p.count; i++) { v.fromBufferAttribute(p, i).applyMatrix4(m4); pos.push(v.x, v.y, v.z); nn.fromBufferAttribute(n, i).applyMatrix3(n3).normalize(); nrm.push(nn.x, nn.y, nn.z); uv.push(t.getX(i), t.getY(i)); }
    g.index.array.forEach(i => idx.push(i + base)); base += p.count;
  });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('normal', new THREE.Float32BufferAttribute(nrm, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx);
  const mesh = new THREE.Mesh(g, mat); mesh.castShadow = true; mesh.receiveShadow = true; scene.add(mesh); return mesh;
}
(function () {
  const set = new Set([MAT.white, MAT.bone, MAT.conc, MAT.red, MAT.brick, MAT.lime, ARCH.bunker]), caps = [], plinths = [];
  scene.children.forEach(o => {
    if (!o.isMesh || !set.has(o.material) || !o.geometry.parameters || o.geometry.type !== 'BoxGeometry') return;
    if (Math.abs(o.rotation.x) > 0.01 || Math.abs(o.rotation.z) > 0.01) return;
    const { width: w, height: h, depth: d } = o.geometry.parameters, th = Math.min(w, d), len = Math.max(w, d);
    if (h < 2.3 || len < 2.4 || th < 0.2 || th > 2.2) return;
    const top = o.position.y + h / 2, bot = o.position.y - h / 2, ry = o.rotation.y;
    caps.push({ w: w + 0.2, h: 0.22, d: d + 0.2, x: o.position.x, y: top + 0.11, z: o.position.z, ry });
    if (bot < 1.4) plinths.push({ w: w + 0.12, h: 0.55, d: d + 0.12, x: o.position.x, y: bot + 0.275, z: o.position.z, ry });
  });
  if (caps.length) ARCH.caps = mergeBoxes(caps, ARCH.cap, 1.2);
  if (plinths.length) ARCH.plinths = mergeBoxes(plinths, ARCH.plinth, 1.2);
})();

/* ---- 4. the bank: fluted columns, capitals and bases ---- */
(function () {
  const cols = scene.children.filter(o => o.isMesh && o.material === MAT.lime && o.geometry.type === 'CylinderGeometry' && o.geometry.parameters.height > 6);
  cols.forEach(o => {
    const P = o.geometry.parameters, g = new THREE.CylinderGeometry(P.radiusTop, P.radiusBottom, P.height, 72, 8, false), p = g.attributes.position;
    for (let i = 0; i < p.count; i++) { const x = p.getX(i), z = p.getZ(i), a = Math.atan2(z, x), r = Math.hypot(x, z); if (r < 0.01) continue; const f = 1 - 0.045 * Math.pow(Math.max(0, Math.cos(a * 24)), 0.6); p.setX(i, x * f); p.setZ(i, z * f); }
    g.computeVertexNormals(); o.geometry.dispose(); o.geometry = g;
    const y0 = o.position.y - P.height / 2, y1 = o.position.y + P.height / 2;
    [[1.7, 0.3, y0 + 0.15], [1.45, 0.22, y0 + 0.41]].forEach(([s, h, y]) => { const b = box(s, h, s, MAT.lime, o.position.x, y, o.position.z, 0, 0); });
    const ech = new THREE.Mesh(new THREE.CylinderGeometry(P.radiusTop * 1.45, P.radiusTop * 1.02, 0.45, 32), MAT.lime); ech.position.set(o.position.x, y1 - 0.62, o.position.z); ech.castShadow = true; scene.add(ech);
    box(1.6, 0.3, 1.6, MAT.lime, o.position.x, y1 - 0.25, o.position.z, 0, 0);
  });
})();

/* ---- 5. the factory: corrugated iron already, now windows, a shutter, pipes and a chimney that smokes ---- */
(function () {
  const cx = 0, cz = -64, w = 32, d = 28, h = 9, g = ground(cx, cz) + 0.02;
  // clerestory windows on both long walls and the back
  const panes = [], frames = [];
  for (let i = 0; i < 8; i++) { const z = cz - d / 2 + 2.4 + i * 3.25; [-1, 1].forEach(s => { panes.push({ x: cx + s * (w / 2 + 0.27), y: g + 6.4, z, w: 0.04, h: 1.7, d: 2.5 }); frames.push({ x: cx + s * (w / 2 + 0.26), y: g + 6.4, z, w: 0.08, h: 1.95, d: 2.75 }); }); }
  for (let i = 0; i < 9; i++) { const x = cx - w / 2 + 2.6 + i * 3.35; panes.push({ x, y: g + 6.4, z: cz - d / 2 - 0.27, w: 2.5, h: 1.7, d: 0.04 }); frames.push({ x, y: g + 6.4, z: cz - d / 2 - 0.26, w: 2.75, h: 1.95, d: 0.08 }); }
  const toList = (L, pad) => L.map(b => ({ w: b.w, h: b.h, d: b.d, x: b.x, y: b.y, z: b.z, ry: 0 }));
  mergeBoxes(toList(frames), ARCH.steel, 1); mergeBoxes(toList(panes), ARCH.glass, 1);
  // mullions
  const mull = []; panes.forEach(p => { if (p.d > 1) mull.push({ w: 0.07, h: 0.06, d: p.d, x: p.x + Math.sign(p.x) * 0.03, y: p.y, z: p.z, ry: 0 }); else mull.push({ w: p.w, h: 0.06, d: 0.07, x: p.x, y: p.y, z: p.z - 0.03, ry: 0 }); }); mergeBoxes(mull, ARCH.steel, 1);
  // the roller shutter, half up, under the lintel
  const sh = box(w - 10 + 0.4, 1.3, 0.12, ARCH.shutter, cx, g + h - 2.2 - 0.65, cz + d / 2 + 0.05, 0, 1.2); sh.castShadow = true;
  const drum = cyl(0.42, 0.42, w - 10 + 0.6, ARCH.steel, cx, g + h - 2.6, cz + d / 2 - 0.7, 16); drum.rotation.z = PI / 2;
  // downpipes and gutters
  [[-1, -1], [1, -1], [-1, 1], [1, 1]].forEach(([sx, sz]) => { cyl(0.09, 0.09, h + 0.4, ARCH.steel, cx + sx * (w / 2 + 0.35), g + h / 2, cz + sz * (d / 2 + 0.35), 8); });
  [-1, 1].forEach(s => box(0.25, 0.22, d + 0.8, ARCH.steel, cx + s * (w / 2 + 0.38), g + h + 0.05, cz, 0, 0));
  // the chimney, brick, with a steel band, smoking
  const chx = cx + 11, chz = cz - 9, chH = 19;
  const ch = new THREE.Mesh(worldUV(new THREE.CylinderGeometry(0.95, 1.25, chH, 20), 1.4), MAT.brick); ch.position.set(chx, g + chH / 2, chz); ch.castShadow = ch.receiveShadow = true; scene.add(ch);
  [chH - 0.6, chH - 3, chH * 0.55].forEach(y => { const b = new THREE.Mesh(new THREE.CylinderGeometry(1.08, 1.08, 0.28, 20), ARCH.steel); b.position.set(chx, g + y, chz); scene.add(b); });
  ARCH.chimney = { x: chx, y: g + chH + 0.2, z: chz };
  // the yard
  ARCH.yard = [['wooden_barrels_01', cx + 13.5, cz + d / 2 + 3.2, 0.4], ['barrel_03', cx - 13.2, cz + d / 2 + 2.4, 0], ['barrel_03', cx - 12.4, cz + d / 2 + 3.1, 1], ['wooden_crate_01', cx - 14.6, cz + d / 2 + 3.6, 0.3],
    ['wooden_crate_01', cx - 14.5, cz + d / 2 + 3.6, 0.2, 0.42], ['portable_generator', cx + 10.6, cz + d / 2 + 2.4, -0.5], ['trashbag', cx + 15.2, cz + d / 2 + 1.4, 0], ['trashbag', cx + 15.6, cz + d / 2 + 2.0, 1],
    ['exterior_aircon_unit', cx + w / 2 + 1.1, cz - 4, PI / 2], ['exterior_aircon_unit', cx + w / 2 + 1.1, cz + 2, PI / 2], ['modular_airduct_circular_01', cx - w / 2 - 0.9, cz - 3, PI / 2, 3.2]];
  [-1, 1].forEach(s => ARCH.yard.push(['industrial_wall_lamp', cx + s * (w / 2 - 2.5), cz + d / 2 + 0.36, PI, g + h - 3.4]));
})();

/* ---- 6. the crane as a lattice ---- */
(function () {
  if (!crane) return; const cxr = -34, czr = -58, cg = ground(cxr, czr);
  const mast = scene.children.find(o => o.isMesh && o.material === MAT.orange && o.geometry.type === 'BoxGeometry' && o.geometry.parameters.height === 26); if (mast) mast.visible = false;
  const jib = crane.children[0]; if (jib) jib.visible = false;
  const strut = new THREE.CylinderGeometry(0.06, 0.06, 1, 5), mat = MAT.orange, list = [];
  const S = (a, b) => list.push([a, b]);
  const H = 26, half = 0.6, step = 1.3;
  for (let y = 0; y < H; y += step) { const c = [[-half, -half], [half, -half], [half, half], [-half, half]];
    c.forEach((p, i) => { const q = c[(i + 1) % 4]; S(new V3(p[0], y, p[1]), new V3(p[0], y + step, p[1])); S(new V3(p[0], y, p[1]), new V3(q[0], y + step, q[1])); S(new V3(p[0], y, p[1]), new V3(q[0], y, q[1])); }); }
  const off = new V3(cxr, cg, czr), q = new THREE.Quaternion(), up = new V3(0, 1, 0), m = new THREE.Matrix4();
  const jibs = []; const L = 30, jh = 0.9;
  for (let x = -7.5; x < L - 7.5; x += 1.5) { const a = [[0, -jh / 2], [0, jh / 2]];
    jibs.push([new V3(x, -jh / 2, -0.45), new V3(x + 1.5, -jh / 2, -0.45)], [new V3(x, -jh / 2, 0.45), new V3(x + 1.5, -jh / 2, 0.45)], [new V3(x, jh / 2, 0), new V3(x + 1.5, jh / 2, 0)],
      [new V3(x, -jh / 2, -0.45), new V3(x + 1.5, jh / 2, 0)], [new V3(x, -jh / 2, 0.45), new V3(x + 1.5, jh / 2, 0)], [new V3(x, -jh / 2, -0.45), new V3(x, -jh / 2, 0.45)]); }
  const mk = (pairs, parent, origin) => { const im = new THREE.InstancedMesh(strut, mat, pairs.length); pairs.forEach(([a, b], i) => { const d = b.clone().sub(a), len = d.length(); q.setFromUnitVectors(up, d.normalize()); m.compose(a.clone().add(b).multiplyScalar(0.5).add(origin), q, new V3(1, len, 1)); im.setMatrixAt(i, m); }); im.castShadow = true; parent.add(im); return im; };
  mk(list, scene, off); mk(jibs, crane, new V3(9, 0, 0).add(new V3(-9, 0, 0)));
  const cab = new THREE.Mesh(new THREE.BoxGeometry(1.6, 1.4, 1.5), new THREE.MeshStandardMaterial({ color: 0xf2efe6, roughness: 0.5 })); cab.position.set(1.4, -1, 0); crane.add(cab);
})();

/* ---- 7. props: load once, place everywhere ---- */
const PROP_FILES = ['exterior_aircon_unit', 'street_lamp_01', 'metal_trash_can', 'fire_hydrant', 'plastic_crate_01', 'wooden_barrels_01', 'barrel_03', 'utility_box_01', 'power_box_01', 'planter_box_01', 'wooden_picnic_table', 'lifebuoy', 'ocean_buoy', 'wooden_crate_01', 'propane_tank', 'portable_generator', 'old_tyre', 'trashbag', 'modular_airduct_circular_01', 'outdoor_table_chair_set_01', 'industrial_wall_lamp', 'painted_wooden_bench'];
const PROP_PLACE = [];
function prop(id, x, z, ry, y, s, solid) { PROP_PLACE.push({ id, x, z, ry: ry || 0, y: y === undefined ? null : y, s: s || 1, solid }); }
(function plan() {
  // the factory yard
  (ARCH.yard || []).forEach(([id, x, z, ry, y]) => prop(id, x, z, ry, id === 'industrial_wall_lamp' ? y : (y && y < 1 ? ground(x, z) + y : undefined), id === 'modular_airduct_circular_01' ? (y || 1) : 1, id !== 'industrial_wall_lamp'));
  // the bodega: crates, gas, a table outside, bins, an AC unit on the side
  const bx = 17, bz = 66, bw = 10, bd = 14;
  [0, 1, 2].forEach(i => [0, 1].forEach(j => prop('plastic_crate_01', bx - bw / 2 - 0.6, bz + 4.4 + i * 0.6, 0, ground(bx, bz) + 0.14 + j * 0.31, 1, false)));
  prop('propane_tank', bx + bw / 2 + 0.5, bz + 5.4, 0); prop('propane_tank', bx + bw / 2 + 0.5, bz + 5.9, 0); prop('propane_tank', bx + bw / 2 + 0.5, bz + 4.9, 0);
  prop('outdoor_table_chair_set_01', bx - bw / 2 - 2.6, bz - 5.2, 0.4); prop('metal_trash_can', bx - bw / 2 - 0.7, bz - 2.6, PI / 2);
  prop('exterior_aircon_unit', bx + 2, bz + bd / 2 + 0.55, PI); prop('power_box_01', bx + 4, bz - bd / 2 - 0.25, 0, ground(bx, bz) + 1.4, 1, false);
  // the bunker: tyres, barrels, a utility box
  [[23.5, 39], [25, 38.6], [64, 49.2], [62.8, 49.6]].forEach(([x, z], i) => prop(i % 2 ? 'old_tyre' : 'barrel_03', x, z, i));
  prop('utility_box_01', 40, 39.6, PI); prop('utility_box_01', 52, 48.5, 0); prop('old_tyre', 24.4, 38.9, 0, ground(24, 39) + 0.17);
  // the bank: planters on the steps
  [-8, -4, 4, 8].forEach(z => prop('planter_box_01', -66 + 8 + 5.2, z, PI / 2, ground(-58, z) + 0.32 + 0.6));
  // street lamps around the plaza ring and along the four avenues
  for (let i = 0; i < 16; i++) { const a = (i + 0.5) / 16 * 360 + 11.25, [x, z] = P2(a, 44.3); if (!natBlocked(x, z, 0.4)) prop('street_lamp_01', x, z, faceTo(x, z, 0, 0) + PI, undefined, 1, true); }
  [[1, 0], [-1, 0], [0, 1], [0, -1]].forEach(([dx, dz]) => { for (let r = 54; r < 98; r += 14) { const x = dx * r + dz * 3.9, z = dz * r - dx * 3.9; if (!natBlocked(x, z, 0.4)) prop('street_lamp_01', x, z, Math.atan2(-dz, -dx) + PI / 2, undefined, 1, true);
    const hx = dx * (r + 7) - dz * 3.9, hz = dz * (r + 7) + dx * 3.9; if (!natBlocked(hx, hz, 0.4)) prop(r % 28 ? 'metal_trash_can' : 'fire_hydrant', hx, hz, Math.atan2(dx, dz)); } });
  // picnic tables and benches in the open lawn
  let pt = 0; for (let i = 0; i < 300 && pt < 14; i++) { const a = natRnd() * PI * 2, r = 50 + natRnd() * 44, x = Math.cos(a) * r, z = Math.sin(a) * r; if (!natLawn(x, z) || natBlocked(x, z, 1.8)) continue; prop(pt % 2 ? 'wooden_picnic_table' : 'painted_wooden_bench', x, z, natRnd() * PI, undefined, 1, true); pt++; }
  // the pier: lifebuoys on the rail posts; the harbour: buoys that ride the swell
  [138, 156, 174].forEach(z => [-2.9, 2.9].forEach(x => prop('lifebuoy', x, z, x > 0 ? -PI / 2 : PI / 2, 0.56, 1, false)));
  for (let i = 0; i < 12; i++) { const a = (i / 12) * PI * 2 + 0.3, r = 175 + (i % 3) * 30, x = Math.cos(a) * r, z = Math.sin(a) * r; if (Math.abs(x) < 12 && z > 0) continue; ARCH.buoys.push({ x, z, ph: i * 1.7 }); }
})();
function archLoadProps() {
  const L3 = new THREE.GLTFLoader();
  return Promise.all(PROP_FILES.map(id => new Promise(res => L3.load(`assets/ph/ph_${id}.glb`, gl => {
    const parts = []; gl.scene.updateMatrixWorld(true);
    gl.scene.traverse(o => { if (!o.isMesh) return; const m = o.material.clone(); m.envMapIntensity = 0.5; if (m.map) m.map.anisotropy = ANISO; if (m.map && m.map.format === THREE.RGBAFormat) { m.alphaTest = 0.4; m.side = THREE.DoubleSide; m.transparent = false; } const g = o.geometry.clone(); g.applyMatrix4(o.matrixWorld); g.computeBoundingBox(); parts.push({ g, m }); });
    const bb = new THREE.Box3(); parts.forEach(p => bb.union(p.g.boundingBox)); ARCH.props[id] = { parts, h: bb.max.y - bb.min.y, r: Math.max(bb.max.x - bb.min.x, bb.max.z - bb.min.z) / 2 }; res();
  }, undefined, () => res()))));
}
function archBuildProps() {
  const by = {}; PROP_PLACE.forEach(p => { if (ARCH.props[p.id]) (by[p.id] || (by[p.id] = [])).push(p); });
  const m = new THREE.Matrix4(), q = new THREE.Quaternion(); const heads = [];
  Object.keys(by).forEach(id => { const A = ARCH.props[id], L = by[id];
    A.parts.forEach(pt => { const im = new THREE.InstancedMesh(pt.g, pt.m, L.length);
      L.forEach((p, i) => { const y = p.y !== null ? p.y : ground(p.x, p.z); q.setFromAxisAngle(new V3(0, 1, 0), p.ry); m.compose(new V3(p.x, y, p.z), q, new V3(p.s, p.s, p.s)); im.setMatrixAt(i, m); });
      im.castShadow = !isMobile; im.receiveShadow = true; im.frustumCulled = false; scene.add(im); });
    L.forEach(p => { if (p.solid && A.r * p.s > 0.25) post(p.x, p.z, Math.min(A.r * p.s, 1.6)); if (id === 'street_lamp_01') heads.push(new V3(p.x, (p.y !== null ? p.y : ground(p.x, p.z)) + A.h * p.s - 0.35, p.z)); });
  });
  // a lamp glows only at night: one instanced bulb per head, brightness from the island's lamp level
  if (heads.length) { const hm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.16, 10, 8), MAT.bulb, heads.length); heads.forEach((h, i) => { m.makeTranslation(h.x, h.y, h.z); hm.setMatrixAt(i, m); }); scene.add(hm); ARCH.lampHeads = hm; }
  // buoys
  const B = ARCH.props.ocean_buoy; if (B) B.parts.forEach(pt => { const im = new THREE.InstancedMesh(pt.g, pt.m, ARCH.buoys.length); im.frustumCulled = false; im.castShadow = false; scene.add(im); (ARCH.buoyMeshes || (ARCH.buoyMeshes = [])).push(im); });
}
/* ---- 8. smoke from the factory chimney ---- */
(function () {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d');
  if (c && c.createRadialGradient) { const gr = c.createRadialGradient(32, 32, 2, 32, 32, 31); gr.addColorStop(0, 'rgba(235,232,226,0.9)'); gr.addColorStop(0.5, 'rgba(220,216,210,0.45)'); gr.addColorStop(1, 'rgba(210,206,200,0)'); c.fillStyle = gr; c.fillRect(0, 0, 64, 64); }
  const t = new THREE.CanvasTexture(cv); const N = 46, g = new THREE.BufferGeometry(), p = new Float32Array(N * 3); g.setAttribute('position', new THREE.BufferAttribute(p, 3));
  const mat = new THREE.PointsMaterial({ map: t, size: 5, sizeAttenuation: true, transparent: true, opacity: 0.32, depthWrite: false, color: 0xe8e4dc });
  const pts = new THREE.Points(g, mat); pts.frustumCulled = false; scene.add(pts);
  ARCH.smoke = { pts, P: Array.from({ length: N }, (_, i) => ({ t: i / N * 9 })) };
})();
function archFrame(dt) {
  const S = ARCH.smoke, ch = ARCH.chimney;
  if (S && ch) { const a = S.pts.geometry.attributes.position; S.P.forEach((s, i) => { s.t = (s.t + dt) % 9; const k = s.t / 9; a.setXYZ(i, ch.x + k * 9 + Math.sin(T * 0.7 + i) * k * 1.6, ch.y + k * 11 + Math.sin(i) * 0.4, ch.z - k * 4 + Math.cos(T * 0.5 + i * 2) * k * 1.4); }); a.needsUpdate = true; S.pts.material.size = 5 + 3 * Math.min(1, NAT.wind.value - 1); }
  ARCH.glass.emissiveIntensity = 0.08 + 1.4 * L.lamps;
  if (ARCH.buoyMeshes) { const m = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); ARCH.buoyMeshes.forEach(im => { ARCH.buoys.forEach((b, i) => { q.setFromEuler(e.set(Math.sin(T * 0.9 + b.ph) * 0.12, b.ph, Math.cos(T * 0.7 + b.ph) * 0.12)); m.compose(new V3(b.x, -0.55 + Math.sin(T * 0.8 + b.ph) * 0.22, b.z), q, new V3(1, 1, 1)); im.setMatrixAt(i, m); }); im.instanceMatrix.needsUpdate = true; }); }
}
// started a tick later so v8 can add its props to the list first
if (typeof THREE.GLTFLoader === 'function') Promise.resolve().then(archLoadProps).then(() => { try { archBuildProps(); if (typeof landBuild === 'function') landBuild(); } catch (e) { console.warn('MEME ISLAND: props failed,', e.message); } });
window.__ARCH = ARCH;
