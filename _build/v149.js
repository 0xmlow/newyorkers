/* ================================================================
   v149 SPLASH (2026-11-23)
   In the rain, and for a while after while the ground is still wet, every step you take splashes: a little
   crown of drops thrown up and out, a ring spreading on the wet ground, and the slap of a shoe in water. Run and
   they get bigger.
   ================================================================ */
const SPL = { acc: 0, lx: null, lz: null, drops: [], rings: [] };
window.__SPL = SPL;
(function splash() {
  const dm = new THREE.InstancedMesh(new THREE.SphereGeometry(0.012, 5, 4), new THREE.MeshStandardMaterial({ color: 0xdbe6ee, roughness: 0.05, metalness: 0.4, transparent: true, opacity: 0.8 }), 96); dm.frustumCulled = false; scene.add(dm); SPL.dm = dm;
  for (let i = 0; i < 96; i++) SPL.drops.push({ x: 0, y: -99, z: 0, vx: 0, vy: 0, vz: 0, on: false });
  for (let i = 0; i < 8; i++) { const m = new THREE.Mesh(new THREE.RingGeometry(0.85, 1.0, 24), new THREE.MeshBasicMaterial({ color: 0xc8d6de, transparent: true, opacity: 0, depthWrite: false })); m.rotation.x = -PI / 2; m.visible = false; scene.add(m); SPL.rings.push({ m, t: 9 }); }
})();
const _so = new THREE.Object3D();
function splashSound(v) { if (!AC || AC.state !== 'running' || !oceanGain || oceanGain.gain.value === 0) return; try { const n = AC.sampleRate * 0.12 | 0, b = AC.createBuffer(1, n, AC.sampleRate), a = b.getChannelData(0); for (let i = 0; i < n; i++) a[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / n, 3); const s = AC.createBufferSource(), f = AC.createBiquadFilter(), g = AC.createGain(); s.buffer = b; f.type = 'bandpass'; f.frequency.value = 1600 + Math.random() * 900; f.Q.value = 0.8; g.gain.value = 0.05 * v; s.connect(f); f.connect(g); g.connect(AC.destination); s.start(); } catch (e) { } }
function splFrame(dt) {
  const wet = (WX.wet || 0); if (SPL.lx === null) { SPL.lx = P.x; SPL.lz = P.z; } const dx = P.x - SPL.lx, dz = P.z - SPL.lz, d = Math.hypot(dx, dz); SPL.lx = P.x; SPL.lz = P.z;
  if (wet > 0.25 && P.ground && d < 2 && d > 1e-4) { SPL.acc += d; if (SPL.acc > 0.7) { SPL.acc = 0; const sp = d / Math.max(dt, 1e-3), v = Math.min(1.6, 0.5 + sp / 6); const f = floorAt(P.x, P.z, P.y + 1); const y = f.f === null ? P.y : f.f;
      for (let k = 0, made = 0; k < SPL.drops.length && made < 10; k++) { const q = SPL.drops[k]; if (q.on) continue; const a = Math.random() * PI * 2, h = (0.6 + Math.random()) * v; q.on = true; q.x = P.x + Math.cos(a) * 0.08; q.z = P.z + Math.sin(a) * 0.08; q.y = y + 0.03; q.vx = Math.cos(a) * h * 0.9 + dx / Math.max(dt, 1e-3) * 0.15; q.vz = Math.sin(a) * h * 0.9 + dz / Math.max(dt, 1e-3) * 0.15; q.vy = 1.0 + Math.random() * 1.3 * v; q.floor = y; made++; }
      const r = SPL.rings.find(r => r.t > 1.2); if (r) { r.t = 0; r.m.position.set(P.x, y + 0.02, P.z); r.m.visible = true; r.v = v; } splashSound(v * Math.min(1, wet * 1.5)); } }
  SPL.drops.forEach((q, i) => { if (q.on) { q.vy -= 9.8 * dt; q.x += q.vx * dt; q.y += q.vy * dt; q.z += q.vz * dt; if (q.y < q.floor) q.on = false; } _so.position.set(q.x, q.on ? q.y : -99, q.z); _so.scale.setScalar(q.on ? 1 : 0); _so.updateMatrix(); SPL.dm.setMatrixAt(i, _so.matrix); }); SPL.dm.instanceMatrix.needsUpdate = true;
  SPL.rings.forEach(r => { if (r.t > 1.2) { r.m.visible = false; return; } r.t += dt; const s = 0.05 + r.t * 0.45 * (r.v || 1); r.m.scale.set(s, s, 1); r.m.material.opacity = 0.5 * (1 - r.t / 1.2); });
}
window.__FRAMES.push(dt => { try { splFrame(dt); } catch (e) { if (!SPL.err) { SPL.err = e; console.warn('v149 splash', e); } } });
