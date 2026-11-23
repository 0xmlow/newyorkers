/* ================================================================
   v134 THE BUNKER RUN (2026-11-23)
   From spring to the end of November the harbour fills with bunker (menhaden), and every day somewhere off the
   beach a school gets pushed to the top and the water boils: silver fish flicking out in arcs, splashes, and
   gulls that wheel over the boil, fold their wings and plunge straight in, then flap back up to go again. The
   boils drift and move. Watch a gull hit the water from the pier and it counts.
   ================================================================ */
const BUNK = { p: [], fish: [], spl: [], birds: [], k: 0 };
window.__BUNK = BUNK;
(function bunker() {
  for (let i = 0; i < 3; i++) BUNK.p.push({ x: [-38, 26, 48][i], z: [168, 196, 158][i], ph: i * 2.1 });
  const fm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.06, 8, 6), new THREE.MeshStandardMaterial({ color: 0xd8dde4, metalness: 0.95, roughness: 0.15 }), 90); fm.frustumCulled = false; scene.add(fm); BUNK.fm = fm;
  for (let i = 0; i < 90; i++) BUNK.fish.push({ p: i % 3, x: 0, y: -1, z: 0, vx: 0, vy: 0, vz: 0, wait: Math.random() * 3 });
  const sm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.3, 10, 6), new THREE.MeshBasicMaterial({ color: 0xf2f6f8, transparent: true, opacity: 0.75, depthWrite: false }), 40); sm.frustumCulled = false; scene.add(sm); BUNK.sm = sm;
  for (let i = 0; i < 40; i++) BUNK.spl.push({ x: 0, z: 0, t: 9, s: 1 });
  try { const src = GULL.g[0], wi = src.wings.map(w => src.g.children.indexOf(w)); for (let k = 0; k < 7; k++) { const c = src.g.clone(true); c.scale.setScalar(1.1); scene.add(c); BUNK.birds.push({ g: c, wings: wi.map(j => c.children[j]), p: k % 3, st: 'circle', t: Math.random() * 6, a: Math.random() * 6.28, y: 10 }); } } catch (e) { }
})();
const bunkSecret = secret('bunker', () => { toast('THE GULL FOLDS UP AND HITS THE WATER LIKE A DROPPED KNIFE AND COMES UP WITH A FISH. THE OTHER GULLS SCREAM AT IT. CLASSIC NEW YORK.', 'blue'); });
const _bo = new THREE.Object3D();
function bunkSplash(x, z, s) { const q = BUNK.spl.find(q => q.t > 0.8); if (!q) return; q.x = x; q.z = z; q.t = 0; q.s = s; }
function bunkFrame(dt) {
  const t = nycTime(TIME.utc), season = t.mo >= 4 && t.mo <= 11, want = season && SKY.el > -4 ? 1 : 0; BUNK.k += (want - BUNK.k) * Math.min(1, dt * 0.2);
  const on = BUNK.k > 0.05; BUNK.fm.visible = BUNK.sm.visible = on; BUNK.birds.forEach(b => b.g.visible = on); if (!on) return;
  BUNK.p.forEach((p, i) => { p.cx = p.x + Math.sin(LIFE.t * 0.03 + p.ph) * 14; p.cz = p.z + Math.cos(LIFE.t * 0.025 + p.ph) * 10; p.boil = Math.max(0, Math.sin(LIFE.t * 0.05 + p.ph * 1.7)); });
  BUNK.fish.forEach((f, i) => { const p = BUNK.p[f.p];
    if (f.y < -0.5) { f.wait -= dt; if (f.wait <= 0 && p.boil > 0.15) { const a = Math.random() * 6.28, r = Math.random() * 4.5; f.x = p.cx + Math.cos(a) * r; f.z = p.cz + Math.sin(a) * r; f.y = 0; f.vy = 1.8 + Math.random() * 1.8; const h = Math.random() * 6.28; f.vx = Math.cos(h) * 1.2; f.vz = Math.sin(h) * 1.2; if (Math.random() < 0.5) bunkSplash(f.x, f.z, 0.5); } }
    else { f.vy -= 9.8 * dt; f.x += f.vx * dt; f.z += f.vz * dt; f.y += f.vy * dt; if (f.y < 0) { f.y = -1; f.wait = (0.3 + Math.random() * 2.5) / Math.max(0.2, p.boil); if (Math.random() < 0.6) bunkSplash(f.x, f.z, 0.45); } }
    _bo.position.set(f.x, f.y, f.z); _bo.rotation.set(Math.atan2(-f.vy, Math.hypot(f.vx, f.vz)), Math.atan2(f.vx, f.vz), 0); _bo.scale.set(0.7, 0.8, f.y < -0.5 ? 0 : 2.6); _bo.updateMatrix(); BUNK.fm.setMatrixAt(i, _bo.matrix); });
  BUNK.fm.instanceMatrix.needsUpdate = true;
  BUNK.spl.forEach((q, i) => { q.t += dt; const u = q.t / 0.8, s = u >= 1 ? 0 : q.s * (0.6 + u * 1.6) * (1 - u); _bo.position.set(q.x, 0.05 + u * 0.25 * q.s, q.z); _bo.rotation.set(0, 0, 0); _bo.scale.set(s, s * (1.6 - u), s); _bo.updateMatrix(); BUNK.sm.setMatrixAt(i, _bo.matrix); }); BUNK.sm.instanceMatrix.needsUpdate = true;
  const onPier = Math.abs(P.x) < 3.5 && P.z > 148;
  BUNK.birds.forEach((b, k) => { const p = BUNK.p[b.p]; b.t += dt; let x, y, z, flap;
    if (b.st === 'circle') { b.a += dt * 0.7; x = p.cx + Math.cos(b.a) * 7; z = p.cz + Math.sin(b.a) * 7; b.y += (11 - b.y) * Math.min(1, dt); y = b.y; flap = Math.sin(LIFE.t * 6 + k) * 0.5; b.g.rotation.set(0, Math.atan2(-Math.cos(b.a), -Math.sin(b.a)), -0.3); if (b.t > 5 + (k % 4) * 2 && p.boil > 0.3) { b.st = 'dive'; b.t = 0; b.dx = x; b.dz = z; } }
    else if (b.st === 'dive') { x = b.dx + (p.cx - b.dx) * Math.min(1, b.t * 0.6); z = b.dz + (p.cz - b.dz) * Math.min(1, b.t * 0.6); b.y -= (4 + b.t * 14) * dt; y = b.y; flap = 1.25; b.g.rotation.set(0, b.g.rotation.y, -1.3);
      if (b.y <= 0.15) { b.st = 'sit'; b.t = 0; bunkSplash(x, z, 1.6); b.dx = x; b.dz = z; if (onPier && Math.hypot(P.x - x, P.z - z) < 40) bunkSecret(); try { gullCry(x, z); } catch (e) { } } }
    else if (b.st === 'sit') { x = b.dx; z = b.dz; y = 0.12; b.y = y; flap = 0; b.g.rotation.set(0, b.g.rotation.y, 0); if (b.t > 1.2) { b.st = 'rise'; b.t = 0; } }
    else { x = b.dx; z = b.dz; b.y += 3 * dt; y = b.y; flap = Math.sin(LIFE.t * 16 + k) * 0.8; b.g.rotation.set(0, b.g.rotation.y, 0); if (b.y > 9) { b.st = 'circle'; b.t = 0; b.a = Math.atan2(z - p.cz, x - p.cx); } }
    b.g.position.set(x, y, z); b.wings[0].rotation.x = flap; b.wings[1].rotation.x = -flap; });
}
window.__FRAMES.push(dt => { try { bunkFrame(dt); } catch (e) { if (!BUNK.err) { BUNK.err = e; console.warn('v134 bunker', e); } } });
