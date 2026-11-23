/* ================================================================
   v129 THE PIGEON MAN (2026-11-23)
   An old man in a flat cap by a bench on the west lawn at (-52, -27) with a paper bag of seed. Every few seconds
   he flings a handful in an arc, and his flock (fourteen real rigged pigeons) walks to every seed and pecks it up.
   Now and then something spooks them and the whole flock goes up at once, wheels round twice overhead and
   settles again. Run through them and they all go up. Stand still beside him long enough and one lands on you.
   ================================================================ */
const PIGM = { birds: [], seeds: [], toss: 2, air: 0, still: 0, perch: null, px: 0, pz: 0 };
window.__PIGM = PIGM;
(function pigeonMan() {
  const X = -52, Z = -27, g0 = ground(X, Z); PIGM.X = X; PIGM.Z = Z; PIGM.g0 = g0;
  const wood = new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.8 }), iron = new THREE.MeshStandardMaterial({ color: 0x1b2a22, roughness: 0.5, metalness: 0.6 });
  const bench = new THREE.Group(); bench.position.set(X, g0, Z - 1.2); scene.add(bench);
  for (let i = 0; i < 3; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.04, 0.11), wood); s.position.set(0, 0.45, -0.14 + i * 0.13); bench.add(s); }
  for (let i = 0; i < 2; i++) { const s = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.1, 0.03), wood); s.position.set(0, 0.62 + i * 0.16, -0.25); s.rotation.x = -0.15; bench.add(s); }
  [-0.85, 0.85].forEach(x => { const l = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.45, 0.5), iron); l.position.set(x, 0.22, -0.05); bench.add(l); });
  bench.traverse(q => { if (q.isMesh) q.castShadow = true; }); boxWalls(X, Z - 1.25, 1.95, 0.55, 0, -5, g0 + 0.5);
  const man = person(0x5a4a3a, 0x2a2a2e, SKIN[4], 'writer'); man.g.position.set(X + 1.3, g0 - 0.35, Z - 0.6); man.g.rotation.y = 0.2; PIGM.man = man;
  const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.18, 0.07, 14), new THREE.MeshStandardMaterial({ color: 0x4a4a42, roughness: 0.9 })); cap.position.set(0, 1.98, 0.03); man.g.add(cap);
  const brim = new THREE.Mesh(new THREE.BoxGeometry(0.26, 0.02, 0.12), cap.material); brim.position.set(0, 1.96, 0.18); man.g.add(brim);
  const bag = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.2, 0.1), new THREE.MeshStandardMaterial({ color: 0xb08a5a, roughness: 0.9 })); bag.position.set(-0.3, 1.0, 0.12); man.g.add(bag);
  post(X + 1.3, Z - 0.6, 0.3, -5, g0 + 1.8);
  PIGM.seedMesh = new THREE.InstancedMesh(new THREE.SphereGeometry(0.018, 5, 4), new THREE.MeshStandardMaterial({ color: 0xd8c08a, roughness: 0.9 }), 60); PIGM.seedMesh.count = 0; PIGM.seedMesh.frustumCulled = false; scene.add(PIGM.seedMesh);
  for (let i = 0; i < 14; i++) { const h = CC0.make('pigeon', { h: 0.3, walkSp: 0.35, far: 70, tint: [0xffffff, 0xd8d8d8, 0xb8b8c0, 0xefe9e0][i % 4] }); const a = Math.random() * PI * 2, r = 1 + Math.random() * 2.5;
    PIGM.birds.push({ h, x: X + 1.3 + Math.sin(a) * r, z: Z + 0.6 + Math.cos(a) * r, y: g0, yaw: a, st: 'ground', seed: -1, peck: 0, ph: i * 0.9 }); }
  if (window.__MAP) MAP.places.push(['THE PIGEON MAN', X + 1.3, Z - 0.6, X + 1.3, Z + 2]);
})();
const pigmSecret = secret('pigeonman', () => { toast('A PIGEON LANDS ON YOUR SHOULDER. THE PIGEON MAN NODS AT YOU, ONCE. YOU ARE ONE OF THEM NOW.', 'blue'); });
function pigmFrame(dt) {
  const X = PIGM.X + 1.3, Z = PIGM.Z - 0.6, dP = Math.hypot(P.x - X, P.z - Z); if (dP > 80) return;
  const pv = Math.hypot(P.x - (PIGM.px || P.x), P.z - (PIGM.pz || P.z)) / Math.max(dt, 1e-3); PIGM.px = P.x; PIGM.pz = P.z;
  // he throws
  PIGM.toss -= dt; const arm = PIGM.man.arms[1]; if (PIGM.toss < 0.6) arm.rotation.x = -1.4 * Math.sin(Math.max(0, PIGM.toss) / 0.6 * PI); else arm.rotation.x = -0.2;
  if (PIGM.toss <= 0) { PIGM.toss = 5 + Math.random() * 4; const yaw = PIGM.man.g.rotation.y; for (let i = 0; i < 8 && PIGM.seeds.length < 60; i++) { const a = yaw + (Math.random() - 0.5) * 1.6, d = 1.2 + Math.random() * 2.6; PIGM.seeds.push({ x: X + Math.sin(a) * 0.4, z: Z + Math.cos(a) * 0.4, y: PIGM.g0 + 1.3, vx: Math.sin(a) * d * 1.1, vz: Math.cos(a) * d * 1.1, vy: 1.6, on: false }); } }
  const o = PIGM._o || (PIGM._o = new THREE.Object3D()); PIGM.seeds.forEach(s => { if (s.on) return; s.vy -= 9.8 * dt; s.x += s.vx * dt; s.z += s.vz * dt; s.y += s.vy * dt; if (s.y <= PIGM.g0 + 0.02) { s.y = PIGM.g0 + 0.02; s.on = true; } });
  PIGM.seedMesh.count = PIGM.seeds.length; PIGM.seeds.forEach((s, i) => { o.position.set(s.x, s.y, s.z); o.updateMatrix(); PIGM.seedMesh.setMatrixAt(i, o.matrix); }); PIGM.seedMesh.instanceMatrix.needsUpdate = true;
  // the flock
  const spook = PIGM.air <= 0 && (Math.random() < dt / 70 || (pv > 3 && PIGM.birds.some(b => b.st === 'ground' && Math.hypot(b.x - P.x, b.z - P.z) < 2.5)));
  if (spook) { PIGM.air = 9 + Math.random() * 4; PIGM.birds.forEach(b => { b.st = 'air'; b.t = 0; b.seed = -1; }); }
  PIGM.air -= dt;
  PIGM.birds.forEach((b, i) => { const h = b.h; let tx = b.x, tz = b.z, ty = PIGM.g0, sp = 0;
    if (PIGM.perch === i) { const fx = -Math.sin(P.yaw), fz = -Math.cos(P.yaw), rx = Math.cos(P.yaw), rz = -Math.sin(P.yaw); b.x = P.x + rx * 0.32 + fx * 0.12; b.z = P.z + rz * 0.32 + fz * 0.12; b.y = P.y + 1.42; b.yaw = P.yaw + PI; h.force = 'idle'; h.root.position.set(b.x, b.y, b.z); h.root.rotation.y = b.yaw; if (pv > 0.5) { PIGM.perch = null; b.st = "land"; b.lx = X + 1; b.lz = Z + 1.5; } return; }
    if (b.st === 'air') { b.t += dt; const a = b.t * 0.9 + i * 0.45, r = 5 + (i % 4) * 0.8; tx = X + Math.cos(a) * r; tz = Z + 2 + Math.sin(a) * r; ty = PIGM.g0 + 4.5 + Math.sin(b.t + i) * 0.8;
      if (PIGM.air <= 0) { const la = Math.random() * PI * 2, lr = 1.2 + Math.random() * 2.6; b.lx = X + Math.sin(la) * lr; b.lz = Z + 1.2 + Math.cos(la) * lr; b.st = 'land'; }
      const k = Math.min(1, dt * 2.5); b.x += (tx - b.x) * k; b.z += (tz - b.z) * k; b.y += (ty - b.y) * k; h.force = 'jump'; }
    else if (b.st === 'land') { const dx = b.lx - b.x, dz = b.lz - b.z, dd = Math.hypot(dx, dz), k = Math.min(1, dt * 2); b.x += dx * k; b.z += dz * k; b.y += (PIGM.g0 - b.y) * k; h.force = 'jump'; if (dd < 0.15 && b.y - PIGM.g0 < 0.05) { b.st = 'ground'; b.y = PIGM.g0; } }
    else { h.force = null; if (b.seed < 0 || !PIGM.seeds[b.seed] || !PIGM.seeds[b.seed].on) { b.seed = -1; let best = 9; PIGM.seeds.forEach((s, k) => { if (!s.on) return; const d = Math.hypot(s.x - b.x, s.z - b.z); if (d < best) { best = d; b.seed = k; } }); }
      if (b.seed >= 0) { const s = PIGM.seeds[b.seed], dx = s.x - b.x, dz = s.z - b.z, dd = Math.hypot(dx, dz); if (dd > 0.12) { b.x += dx / dd * Math.min(dd, 0.45 * dt); b.z += dz / dd * Math.min(dd, 0.45 * dt); } else { b.peck += dt; h.force = 'peck'; if (b.peck > 1.1) { b.peck = 0; PIGM.seeds.splice(b.seed, 1); b.seed = -1; PIGM.birds.forEach(q => { if (q.seed > -1) q.seed = -1; }); } } }
      b.y = PIGM.g0; }
    const vx = b.x - h.root.position.x, vz = b.z - h.root.position.z; if (Math.abs(vx) + Math.abs(vz) > 2e-3) b.yaw = Math.atan2(vx, vz);
    h.root.position.set(b.x, b.y, b.z); h.root.rotation.y = b.yaw; });
  // stand still by him and one lands on your shoulder
  if (dP < 2.8 && pv < 0.15 && PIGM.air <= 0) { PIGM.still += dt; if (PIGM.still > 14 && PIGM.perch === null) { PIGM.perch = 3; PIGM.birds[3].st = 'ground'; pigmSecret(); } } else PIGM.still = 0;
}
window.__FRAMES.push(dt => { try { pigmFrame(dt); } catch (e) { if (!PIGM.err) { PIGM.err = e; console.warn('v129 pigeon man', e); } } });
