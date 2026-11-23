/* ================================================================
   v150 THE SANDPIPERS (2026-11-23)
   A little flock of sanderlings works the waterline east of the pier, the way they do on every New York beach
   from autumn to spring: chasing each retreating wave down the sand on legs too fast to see, probing the wet
   sand, then sprinting back up ahead of the next one. Walk at them and they all lift together, fly low along
   the surf with a flash of white wing bars, and land again thirty metres down.
   ================================================================ */
const SHOREC = { c: {} };
function shoreZ(x) { const k = Math.round(x); if (SHOREC.c[k] !== undefined) return SHOREC.c[k]; let z = 100; for (; z < 160; z += 0.25) { const f = floorAt(k, z, 3); if (f.f === null || f.f < 0.03) break; } return (SHOREC.c[k] = z); }
const PIPERS = { b: [], cx: 24, st: 'feed', t: 0, flushT: 0 };
window.__SAND = PIPERS;
(function sandpipers() {
  const white = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.8 }), grey = new THREE.MeshStandardMaterial({ color: 0x9a948a, roughness: 0.8 }), blk = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.6 });
  for (let i = 0; i < 14; i++) { const g = new THREE.Group(); const body = new THREE.Mesh(new THREE.SphereGeometry(0.055, 8, 6), white); body.scale.set(0.9, 0.85, 1.4); body.position.y = 0.09; g.add(body);
    const back = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), grey); back.scale.set(0.95, 0.6, 1.4); back.position.set(0, 0.115, -0.01); g.add(back);
    const head = new THREE.Mesh(new THREE.SphereGeometry(0.03, 8, 6), white); head.position.set(0, 0.13, 0.07); g.add(head); const bill = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.006, 0.05, 4), blk); bill.rotation.x = PI / 2 + 0.3; bill.position.set(0, 0.12, 0.11); g.add(bill);
    const legs = [-0.015, 0.015].map(x => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 0.06, 3), blk); l.position.set(x, 0.035, 0); g.add(l); return l; });
    const wings = [-1, 1].map(s => { const w = new THREE.Mesh(new THREE.BoxGeometry(0.13, 0.005, 0.06), grey); w.position.set(s * 0.07, 0.11, 0); w.visible = false; g.add(w); return w; });
    g.scale.setScalar(1.25); scene.add(g); PIPERS.b.push({ g, legs, wings, off: (i - 7) * 0.9 + (Math.random() - 0.5) * 0.6, ph: Math.random() * 6, x: 24 + (i - 7) * 0.9, z: 125, y: 0, yaw: 0 }); }
})();
function sandFrame(dt) {
  const t = nycTime(TIME.utc), season = t.mo >= 8 || t.mo <= 5; PIPERS.b.forEach(b => b.g.visible = season); if (!season) return; const dP = Math.hypot(P.x - PIPERS.cx, P.z - 126); if (dP > 90) return;
  const swash = Math.sin(LIFE.t * 0.55) * 1.4 + Math.sin(LIFE.t * 1.3) * 0.35; // the wave's reach along the sand, metres
  if (PIPERS.st === 'feed' && PIPERS.b.some(b => Math.hypot(P.x - b.x, P.z - b.z) < 5)) { PIPERS.st = 'fly'; PIPERS.t = 0; PIPERS.from = PIPERS.cx; PIPERS.to = PIPERS.cx < 25 ? PIPERS.cx + 30 : PIPERS.cx - 30; if (PIPERS.to < 8) PIPERS.to = 40; if (PIPERS.to > 55) PIPERS.to = 15; PIPERS.flushT += 1; }
  if (PIPERS.st === 'fly') { PIPERS.t += dt; const u = Math.min(1, PIPERS.t / 3.5); PIPERS.cx = PIPERS.from + (PIPERS.to - PIPERS.from) * (u * u * (3 - 2 * u)); if (u >= 1) PIPERS.st = 'feed'; }
  PIPERS.b.forEach((b, i) => { const tx = PIPERS.cx + b.off, sz = shoreZ(tx); let tz, ty, run;
    if (PIPERS.st === 'fly') { const u = PIPERS.t / 3.5; tz = sz - 1.5 - Math.sin(u * PI) * 2; ty = Math.sin(u * PI) * 1.6 + 0.1; b.x += (tx - b.x) * Math.min(1, dt * 4); b.z += (tz - b.z) * Math.min(1, dt * 4); b.y = ty; b.wings.forEach((w, k) => { w.visible = true; w.rotation.z = (k ? 1 : -1) * Math.sin(LIFE.t * 30 + i) * 0.7; }); b.legs.forEach(l => l.rotation.x = 0.9); b.yaw = Math.atan2(PIPERS.to - PIPERS.from, 0); }
    else { b.wings.forEach(w => w.visible = false); const edge = sz - 0.3 - swash - 0.4 + Math.sin(i * 1.7) * 0.25; const dz = edge - b.z; run = Math.abs(dz) > 0.08; const sp = 2.2; b.z += Math.sign(dz) * Math.min(Math.abs(dz), sp * dt); b.x += (tx - b.x) * Math.min(1, dt * 0.5); b.y = 0;
      b.yaw = run ? (dz > 0 ? 0 : PI) : b.yaw + Math.sin(LIFE.t * 2 + b.ph) * 0.02; const lf = run ? Math.sin(LIFE.t * 40 + i) * 0.8 : 0; b.legs[0].rotation.x = lf; b.legs[1].rotation.x = -lf; b.g.rotation.x = run ? 0 : Math.max(0, Math.sin(LIFE.t * 4 + b.ph)) * 0.5; }
    const f = floorAt(b.x, b.z, 3); b.g.position.set(b.x, (f.f === null ? 0 : f.f) + b.y, b.z); b.g.rotation.y = b.yaw; });
}
window.__FRAMES.push(dt => { try { sandFrame(dt); } catch (e) { if (!PIPERS.err) { PIPERS.err = e; console.warn('v150 sandpipers', e); } } });
