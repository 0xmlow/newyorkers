/* ================================================================
   v148 FOOTPRINTS (2026-11-23)
   You leave tracks: shoe prints in the sand of GM BEACH, left and right, turning with you, darker where the sand
   is wet near the water, and in snow anywhere on the island when it has settled. The last two hundred stay. The
   waterline smooths the ones that are too close to the sea.
   ================================================================ */
const PRINTS = { n: 200, i: 0, acc: 0, side: 1, lx: null, lz: null, list: [] };
window.__PRINTS = PRINTS;
(function footprints() {
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 128; const c = cv.getContext('2d');
  if (c && c.ellipse) { c.fillStyle = '#fff'; c.beginPath(); c.ellipse(32, 40, 20, 34, 0, 0, PI * 2); c.fill(); c.beginPath(); c.ellipse(32, 100, 16, 22, 0, 0, PI * 2); c.fill(); c.globalCompositeOperation = 'destination-out'; c.fillStyle = 'rgba(0,0,0,.55)'; for (let y = 14; y < 120; y += 9) c.fillRect(0, y, 64, 3); }
  const t = new THREE.CanvasTexture(cv);
  const mesh = new THREE.InstancedMesh(new THREE.PlaneGeometry(0.13, 0.28), new THREE.MeshBasicMaterial({ map: t, color: 0x000000, transparent: true, opacity: 0.28, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -4 }), PRINTS.n);
  const o = new THREE.Object3D(); o.scale.set(0, 0, 0); o.updateMatrix(); for (let i = 0; i < PRINTS.n; i++) mesh.setMatrixAt(i, o.matrix); mesh.frustumCulled = false; scene.add(mesh); PRINTS.mesh = mesh; PRINTS.o = o;
})();
function printSurface(x, z, f) { const W = WX.override || WX.cur; if ((WX.snow || 0) > 0.4) return 'snow'; if (z > 103 && Math.abs(x) > 3.2 && f < 0.62) return 'sand'; return null; }
function printsFrame(dt) {
  PRINTS.wipe = (PRINTS.wipe || 0) - dt; if (PRINTS.wipe < 0) { PRINTS.wipe = 2; let ch = false; PRINTS.list.forEach((q, i) => { if (q && q.y < 0.07 && Math.random() < 0.3) { PRINTS.o.position.set(0, -50, 0); PRINTS.o.scale.set(0, 0, 0); PRINTS.o.updateMatrix(); PRINTS.mesh.setMatrixAt(i, PRINTS.o.matrix); PRINTS.list[i] = null; ch = true; } }); if (ch) PRINTS.mesh.instanceMatrix.needsUpdate = true; }
  if (PRINTS.lx === null) { PRINTS.lx = P.x; PRINTS.lz = P.z; return; } const dx = P.x - PRINTS.lx, dz = P.z - PRINTS.lz, d = Math.hypot(dx, dz); PRINTS.lx = P.x; PRINTS.lz = P.z; if (d > 3) return;
  if (!P.ground || d < 1e-4) return; PRINTS.acc += d; if (PRINTS.acc < 0.62) return; PRINTS.acc = 0;
  const f = floorAt(P.x, P.z, P.y + 1); if (f.f === null || Math.abs(f.f - P.y) > 0.3) return; const s = printSurface(P.x, P.z, f.f); if (!s) return;
  const yaw = Math.atan2(dx, dz); PRINTS.side = -PRINTS.side; const rx = Math.cos(yaw) * 0.11 * PRINTS.side, rz = -Math.sin(yaw) * 0.11 * PRINTS.side, o = PRINTS.o;
  o.position.set(P.x + rx, f.f + 0.015, P.z + rz); o.rotation.set(-PI / 2, 0, yaw + PI); o.scale.set(PRINTS.side < 0 ? -1 : 1, 1, 1); o.updateMatrix(); const i = PRINTS.i++ % PRINTS.n; PRINTS.mesh.setMatrixAt(i, o.matrix); PRINTS.mesh.instanceMatrix.needsUpdate = true;
  PRINTS.mesh.material.color.setHex(s === 'snow' ? 0x3a4a66 : 0x000000); PRINTS.mesh.material.opacity = s === 'snow' ? 0.35 : f.f < 0.15 ? 0.4 : 0.24;
  PRINTS.list[i] = { x: o.position.x, z: o.position.z, y: f.f };
}
window.__FRAMES.push(dt => { try { printsFrame(dt); } catch (e) { if (!PRINTS.err) { PRINTS.err = e; console.warn('v148 footprints', e); } } });
