/* ================================================================
   v43 SEA LIFE (2026-11-22)
   Crabs on GM Beach that scuttle sideways and dig into the sand when you come close; fish that jump in little arcs
   off the shore and the pier with a ring where they land; jellyfish round the pier that glow cyan and pink after
   dark and pulse as they drift; starfish on the wet sand.
   ================================================================ */
const SEA = { crabs: [], fish: [], jelly: [] };
window.__SEA = SEA;
(function crabs() {
  const shell = new THREE.MeshStandardMaterial({ color: 0x8a1e10, roughness: 0.35 }), leg = new THREE.MeshStandardMaterial({ color: 0xa83a22, roughness: 0.6 });
  for (let i = 0; i < 9; i++) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.16, 12, 8), shell); b.scale.set(1.7, 0.32, 1.15); b.position.y = 0.07; g.add(b);
    [-1, 1].forEach(s => { const cl = new THREE.Mesh(new THREE.SphereGeometry(0.085, 8, 6), shell); cl.scale.set(1.5, 0.6, 1.1); cl.position.set(s * 0.22, 0.06, 0.24); g.add(cl); const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.16, 4), leg); arm.rotation.set(PI / 2.6, 0, s * 0.6); arm.position.set(s * 0.2, 0.06, 0.15); g.add(arm);
      for (let k = 0; k < 3; k++) { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.009, 0.24, 4), leg); l.rotation.z = s * 1.25; l.position.set(s * 0.33, 0.035, -0.09 + k * 0.08); g.add(l); } });
    [-0.05, 0.05].forEach(x => { const e = new THREE.Mesh(new THREE.SphereGeometry(0.018, 6, 4), new THREE.MeshStandardMaterial({ color: 0x111111 })); e.position.set(x, 0.17, 0.12); g.add(e); });
    const a = -0.2 + Math.random() * 3.5, r = 113 + Math.random() * 10; const x = Math.cos(a) * r, z = Math.sin(a) * r; g.position.set(x, ground(x, z), z); scene.add(g); SEA.crabs.push({ g, x, z, dir: Math.random() < 0.5 ? 1 : -1, t: Math.random() * 4, hide: 0, a }); }
})();
(function fish() {
  const m = new THREE.MeshStandardMaterial({ color: 0xbfc9d2, metalness: 0.8, roughness: 0.25 });
  for (let i = 0; i < 6; i++) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.12, 10, 6), m); b.scale.set(0.5, 0.7, 2.2); g.add(b); const t = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.18, 4), m); t.rotation.x = -PI / 2; t.position.z = -0.32; t.scale.x = 0.3; g.add(t); g.visible = false; scene.add(g); SEA.fish.push({ g, t: -Math.random() * 8 }); }
  const ring = new THREE.RingGeometry(0.4, 0.55, 20); ring.rotateX(-PI / 2); SEA.ringM = new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false });
  SEA.rings = Array.from({ length: 6 }, () => { const r = new THREE.Mesh(ring, SEA.ringM.clone()); r.visible = false; scene.add(r); return { r, t: 9 }; });
})();
(function jellies() {
  for (let i = 0; i < 12; i++) { const col = i % 3 ? 0x5ae8ff : 0xff6ad0; const g = new THREE.Group();
    const bell = new THREE.Mesh(new THREE.SphereGeometry(0.6, 16, 10, 0, PI * 2, 0, PI * 0.55), new THREE.MeshBasicMaterial({ color: col, transparent: true, opacity: 0.35, blending: THREE.AdditiveBlending, depthWrite: false, side: THREE.DoubleSide, toneMapped: false })); g.add(bell);
    for (let k = 0; k < 5; k++) { const tn = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.004, 0.9, 3), bell.material); const a = k / 5 * PI * 2; tn.position.set(Math.cos(a) * 0.18, -0.45, Math.sin(a) * 0.18); g.add(tn); }
    const x = (i % 2 ? 1 : -1) * (3.6 + Math.random() * 4.5), z = 150 + Math.random() * 30; g.position.set(x, -0.4, z); scene.add(g); SEA.jelly.push({ g, bell, x, z, ph: Math.random() * 9 }); }
})();
(function starfish() {
  const sh = new THREE.Shape(); for (let i = 0; i <= 10; i++) { const a = i / 10 * PI * 2 - PI / 2, r = i % 2 ? 0.08 : 0.2; i ? sh.lineTo(Math.cos(a) * r, Math.sin(a) * r) : sh.moveTo(Math.cos(a) * r, Math.sin(a) * r); }
  const geo = new THREE.ExtrudeGeometry(sh, { depth: 0.03, bevelEnabled: true, bevelThickness: 0.015, bevelSize: 0.015, bevelSegments: 2 }); geo.rotateX(-PI / 2);
  const cols = [0xe06a3a, 0xd8a24a, 0xb84a6a]; for (let i = 0; i < 14; i++) { const a = -0.3 + Math.random() * 3.7, r = 133 + Math.random() * 4; const x = Math.cos(a) * r, z = Math.sin(a) * r; const m = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ color: cols[i % 3], roughness: 0.7 })); m.position.set(x, ground(x, z) + 0.02, z); m.rotation.y = Math.random() * 6; scene.add(m); }
})();
function seaFrame(dt) {
  SEA.crabs.forEach(c => { const d = Math.hypot(P.x - c.x, P.z - c.z);
    if (d < 3 && c.hide <= 0) { c.hide = 4; } if (c.hide > 0) { c.hide -= dt; const k = c.hide > 3.4 ? (4 - c.hide) / 0.6 : c.hide < 0.6 ? c.hide / 0.6 : 1; c.g.position.y = ground(c.x, c.z) - 0.2 * k; if (d < 3) c.hide = Math.max(c.hide, 1.2); return; }
    c.t -= dt; if (c.t <= 0) { c.t = 1 + Math.random() * 3; c.dir *= Math.random() < 0.4 ? -1 : 1; c.pause = Math.random() < 0.4 ? 1 : 0; }
    if (!c.pause) { c.a += c.dir * dt * 0.012; const r = Math.hypot(c.x, c.z); c.x = Math.cos(c.a) * r; c.z = Math.sin(c.a) * r; }
    c.g.position.set(c.x, ground(c.x, c.z) + Math.abs(Math.sin(LIFE.t * 20)) * 0.01, c.z); c.g.rotation.y = -c.a; });
  SEA.fish.forEach(f => { f.t += dt; if (f.t < 0) return; if (f.t === dt || !f.on) { f.on = true; const a = Math.random() < 0.4 ? null : Math.random() * PI * 2; if (a === null) { f.x = (Math.random() < 0.5 ? -4 : 4) + (Math.random() - 0.5) * 3; f.z = 145 + Math.random() * 35; } else { const r = 142 + Math.random() * 30; f.x = Math.cos(a) * r; f.z = Math.sin(a) * r; } f.dir = Math.random() * PI * 2; }
    const D = 0.9, k = f.t / D; if (k > 1) { f.on = false; f.g.visible = false; f.t = -4 - Math.random() * 9; const rg = SEA.rings.find(q => q.t > 1.2); if (rg) { rg.t = 0; rg.r.position.set(f.x + Math.sin(f.dir) * 1.6, 0.06, f.z + Math.cos(f.dir) * 1.6); rg.r.visible = true; } return; }
    f.g.visible = true; f.g.position.set(f.x + Math.sin(f.dir) * k * 1.6, -0.1 + Math.sin(k * PI) * 0.9, f.z + Math.cos(f.dir) * k * 1.6); f.g.rotation.set(-(k - 0.5) * 2.4, f.dir, 0, 'YXZ'); });
  SEA.rings.forEach(q => { if (q.t > 1.2) return; q.t += dt; q.r.scale.setScalar(0.4 + q.t * 2); q.r.material.opacity = 0.5 * (1 - q.t / 1.2); if (q.t > 1.2) q.r.visible = false; });
  const night = Math.min(1, (L.lamps || 0) * 1.4);
  SEA.jelly.forEach(j => { const p = 1 + Math.sin(LIFE.t * 2 + j.ph) * 0.12; j.g.scale.set(p, 2 - p, p); j.g.position.set(j.x + Math.sign(j.x) * Math.abs(Math.sin(LIFE.t * 0.1 + j.ph)) * 1.5, 0.02 + Math.sin(LIFE.t * 0.6 + j.ph) * 0.05, j.z + Math.cos(LIFE.t * 0.08 + j.ph) * 2); j.bell.material.opacity = 0.15 + 0.7 * night; });
}
window.__FRAMES.push(dt => { try { seaFrame(dt); } catch (e) { if (!SEA.err) { SEA.err = e; console.warn('v43 sea', e); } } });
