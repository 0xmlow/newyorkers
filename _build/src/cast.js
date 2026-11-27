// THE GARDEN: the crowd as MLow's NEW YORKERS cast, the same figures the Cycles renders seat (blender/export_web_cast.py):
// ten characters in nine seated poses and fifteen standing, each at two levels. One BatchedMesh per crowd, one draw: every
// person is an instance whose geometry swaps between the baked figure (near) and a decimated one (far) as you walk.
// The capsule crowd stays up until this loads, then hides.
import * as THREE from 'three';

let DATA = null;
export function loadCast(base = 'assets/cast/') {
  if (DATA) return DATA;
  DATA = Promise.all([fetch(base + 'crowd.json').then((r) => r.json()), fetch(base + 'crowd.bin').then((r) => r.arrayBuffer()),
    new THREE.TextureLoader().loadAsync(base + 'atlas.jpg')]).then(([J, buf, tex]) => {
    tex.flipY = false; tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 4; tex.generateMipmaps = true;
    const geos = {};
    for (const g of J.geo) {
      const [op, on, ou, oi] = g.ofs;
      const P = new Int16Array(buf, op, g.v * 3), N = new Int8Array(buf, on, g.v * 3), U = new Uint16Array(buf, ou, g.v * 2), I = new Uint16Array(buf, oi, g.i);
      const geo = new THREE.BufferGeometry();
      const pos = new Float32Array(g.v * 3); for (let k = 0; k < pos.length; k++) pos[k] = P[k] * J.scale;
      geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      geo.setAttribute('normal', new THREE.BufferAttribute(N, 3, true));
      geo.setAttribute('uv', new THREE.BufferAttribute(U, 2, true));
      geo.setIndex(new THREE.BufferAttribute(I, 1));
      (geos[g.name] ||= {})[g.lvl] = geo; geos[g.name].pose = g.pose; geos[g.name].ch = g.ch;
    }
    const mat = new THREE.MeshStandardMaterial({ map: tex, roughness: 0.78, metalness: 0 });
    return { geos, mat };
  });
  return DATA;
}

// the seated mix the Cycles crowd uses (build_garden.py _w): mostly sitting still, some clapping, some leaning in
const W = { sit: 0.30, sitL: 0.08, sitR: 0.08, sit_clap: 0.12, sit_clapL: 0.04, sit_clapR: 0.04, sit_lean: 0.10, sit_leanL: 0.03, sit_leanR: 0.03 };

// list: [x, y, z, yaw] in the walk's space; stand: true for a standing crowd. Returns { mesh, update(camera, t) }.

export async function castCrowd(list, { stand = false, near = 22, focus = null, wave = null, poses = null } = {}) {
  const { geos, mat } = await loadCast();
  const names = Object.keys(geos).filter((n) => (stand ? geos[n].pose === 'stand' : geos[n].pose !== 'stand') && (!poses || poses.includes(geos[n].pose)));
  let nv = 0, ni = 0; for (const n of names) for (const l of ['hi', 'lo']) { nv += geos[n][l].attributes.position.count; ni += geos[n][l].index.count; }
  const bm = new THREE.BatchedMesh(list.length, nv, ni, mat); bm.sortObjects = false; bm.perObjectFrustumCulled = true; bm.frustumCulled = false;
  const id = {}; for (const n of names) id[n] = { hi: bm.addGeometry(geos[n].hi), lo: bm.addGeometry(geos[n].lo), ch: geos[n].ch };
  const wsum = names.reduce((a, n) => a + (stand ? 1 : W[geos[n].pose] || 0.02), 0);
  const pickName = () => { let r = Math.random() * wsum; for (const n of names) { r -= stand ? 1 : W[geos[n].pose] || 0.02; if (r <= 0) return n; } return names[0]; };
  // no two neighbours the same character: a 1.25 m grid of who sits where, least used of eight candidates
  const grid = new Map(), cell = (x, y, z) => `${Math.round(x / 1.25)},${Math.round(y / 0.5)},${Math.round(z / 1.25)}`;
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(0, 0, 0, 'YXZ'), sc = new THREE.Vector3(), p = new THREE.Vector3(), col = new THREE.Color();
  const inst = [];
  for (const s of list) {
    const near_ = new Map(); const c0 = [Math.round(s[0] / 1.25), Math.round(s[1] / 0.5), Math.round(s[2] / 1.25)];
    for (let dx = -1; dx <= 1; dx++) for (let dy = -1; dy <= 1; dy++) for (let dz = -1; dz <= 1; dz++) for (const ch of grid.get(`${c0[0] + dx},${c0[1] + dy},${c0[2] + dz}`) || []) near_.set(ch, (near_.get(ch) || 0) + 1);
    let best = null, bs = 1e9; for (let k = 0; k < 8; k++) { const n = pickName(), sc_ = (near_.get(id[n].ch) || 0) + Math.random() * 0.5; if (sc_ < bs) { bs = sc_; best = n; } }
    const key = cell(s[0], s[1], s[2]); (grid.get(key) || grid.set(key, []).get(key)).push(id[best].ch);
    // turn toward tonight's focus, up to about 30 degrees, as the Cycles crowd does
    let yaw = s[3] + (Math.random() - 0.5) * (stand ? 0.6 : 0.3);
    if (focus) { const yf = Math.atan2(focus[0] - s[0], focus[1] - s[2]); let d = yf - s[3]; d = Math.atan2(Math.sin(d), Math.cos(d)); yaw += THREE.MathUtils.clamp(d * 0.6, -0.55, 0.55); }
    const k = 0.94 + Math.random() * 0.12;
    m4.compose(p.set(s[0], s[1], s[2]), q.setFromEuler(e.set(0, yaw, 0)), sc.set(k, k, k));
    const i = bm.addInstance(id[best].lo); bm.setMatrixAt(i, m4);
    // Astra 7: the bowl is a darker mass than the court
    const b = stand ? 0.8 + Math.random() * 0.22 : 0.66 + Math.random() * 0.26; bm.setColorAt(i, col.setRGB(b, b * (0.97 + Math.random() * 0.06), b * (0.97 + Math.random() * 0.06)));
    inst.push({ i, g: id[best], x: s[0], y: s[1], z: s[2], yaw, k, hi: false, up: 0 });
  }
  let last = -1; const cp = new THREE.Vector3(), n2 = near * near;
  function update(camera, t) {
    // the near ring gets the baked figures; checked a few times a second, not every frame
    if (t - last > 0.25) { last = t; camera.getWorldPosition(cp);
      for (const o of inst) { const dx = o.x - cp.x, dy = o.y - cp.y, dz = o.z - cp.z, h = dx * dx + dy * dy + dz * dz < n2; if (h !== o.hi) { o.hi = h; bm.setGeometryIdAt(o.i, h ? o.g.hi : o.g.lo); } } }
    // the wave: the seated crowd rises in a band that runs round the bowl (the uniforms the capsule shader read)
    if (wave) { const on = wave.uWaveOn.value, w = wave.uWave.value;
      for (const o of inst) { let up = 0;
        if (on > 0) { const th = Math.atan2(o.z, o.x); let dd = th - w + Math.PI; dd = dd - Math.floor(dd / (2 * Math.PI)) * 2 * Math.PI - Math.PI; up = on * Math.exp(-dd * dd * 26); }
        if (Math.abs(up - o.up) > 0.01 || (up === 0 && o.up !== 0)) { o.up = up; m4.compose(p.set(o.x, o.y + up * 0.42, o.z), q.setFromEuler(e.set(-up * 0.15, o.yaw, 0)), sc.set(o.k, o.k, o.k)); bm.setMatrixAt(o.i, m4); } } }
  }
  return { mesh: bm, update, count: inst.length };
}

// the people pass bodies for the jointed game (blender/export_web_players.py): rig offsets, per dress the parts (bone, colour
// key, geometry in the bone's space) and the seven cast flower heads on the crowd atlas
let BODIES = null;
export function loadBodies(base = 'assets/cast/') {
  if (BODIES) return BODIES;
  BODIES = Promise.all([fetch(base + 'bodies.json').then((r) => r.json()), fetch(base + 'bodies.bin').then((r) => r.arrayBuffer()), loadCast(base)]).then(([J, buf, C]) => {
    const geo = (g, uv) => { const G = new THREE.BufferGeometry(); const P = new Int16Array(buf, g.ofs[0], g.v * 3), pos = new Float32Array(g.v * 3); for (let k = 0; k < pos.length; k++) pos[k] = P[k] * g.q;
      G.setAttribute('position', new THREE.BufferAttribute(pos, 3)); G.setAttribute('normal', new THREE.BufferAttribute(new Int8Array(buf, g.ofs[1], g.v * 3), 3, true));
      if (uv) G.setAttribute('uv', new THREE.BufferAttribute(new Uint16Array(buf, g.ofs[2], g.v * 2), 2, true));
      const io = g.ofs[uv ? 3 : 2]; G.setIndex(new THREE.BufferAttribute(g.i32 ? new Uint32Array(buf, io, g.i) : new Uint16Array(buf, io, g.i), 1)); return G; };
    const sets = {}; for (const k in J.sets) sets[k] = J.sets[k].map((p) => ({ bone: p.bone, key: p.key, geo: geo(p, false) }));
    return { rig: J.rig, sets, heads: J.heads.map((h) => geo(h, true)), headMat: C.mat };
  });
  return BODIES;
}
