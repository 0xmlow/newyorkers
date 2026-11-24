/* ================================================================
   v255 ILLUSION: THE IMPOSSIBLE TRIANGLE (2026-11-23)
   High over the centre of the island hangs a Penrose triangle nine metres a side, in cobalt, cyan and bone. It is three straight
   beams in a zig zag that never meet: from almost everywhere you can see it is an open, crooked thing. From one
   spot on the promenade ring (the painted footprints), the last beam's far end lines up exactly in front of the
   first beam's start and the three close into the triangle that cannot exist. An Open Eye Flower sits on the
   corner that is not there. ?penrose=0 turns it off.
   ================================================================ */
const PEN = { stand: false };
window.__PEN = PEN;
(function penrose() {
  if (!LOOK.on || /penrose=0/.test(location.search)) return;
  const C = new THREE.Vector3(0, 15.5, 0), a0 = (window.__PEN_A != null ? __PEN_A : -2.35), V = new THREE.Vector3(Math.cos(a0) * 39.4, 0.665 + 1.62, Math.sin(a0) * 39.4); PEN.V = V; PEN.C = C;
  const L = 9.0, t = 1.05, loc = [new THREE.Vector3(0, 0, 0), new THREE.Vector3(L, 0, 0), new THREE.Vector3(L, L, 0), new THREE.Vector3(L, L, L)];
  const cen = new THREE.Vector3(); loc.forEach(p => cen.add(p)); cen.multiplyScalar(0.25);
  const axis = new THREE.Vector3(1, 1, 1).normalize(); let q = new THREE.Quaternion(), P0 = C.clone();
  // orient so that local (1,1,1) points from P0 to the viewer, choosing the roll that stands it upright, then re-centre (iterate)
  let best = null;
  for (let roll = 0; roll < 24; roll++) { let p0 = C.clone(), qq = new THREE.Quaternion();
    for (let k = 0; k < 6; k++) { const dir = V.clone().sub(p0).normalize(); qq.setFromUnitVectors(axis, dir); const qr = new THREE.Quaternion().setFromAxisAngle(dir, roll / 24 * PI * 2); qq.premultiply(qr); p0 = C.clone().sub(cen.clone().applyQuaternion(qq)); }
    const ys = loc.map(p => p.clone().applyQuaternion(qq).add(p0).y); const lo = Math.min(...ys); if (!best || lo > best.lo) best = { lo, q: qq.clone(), p0 }; }
  q = best.q; P0 = best.p0;
  const W = loc.map(p => p.clone().applyQuaternion(q).add(P0)); PEN.W = W;
  const mats = [new THREE.MeshStandardMaterial({ color: 0x2962FF, roughness: 0.35, metalness: 0.2 }), new THREE.MeshStandardMaterial({ color: 0x08b8e0, roughness: 0.35, metalness: 0.2 }), new THREE.MeshStandardMaterial({ color: 0xefe8da, roughness: 0.45 })];
  const beam = (A, B, m) => { const len = A.distanceTo(B) + t, mesh = new THREE.Mesh(new THREE.BoxGeometry(t, t, len), m); mesh.position.copy(A).add(B).multiplyScalar(0.5); mesh.up.set(0, 1, 0).applyQuaternion(q); mesh.lookAt(B); mesh.castShadow = mesh.receiveShadow = true; scene.add(mesh); return mesh; };
  beam(W[0], W[1], mats[0]); beam(W[1], W[2], mats[1]); beam(W[2], W[3], mats[2]);
  // a slim steel post holds it from the lowest corner, and an eye flower on the corner that is not there
  const low = W.reduce((m, p) => p.y < m.y ? p : m, W[0]); const gy = ground(low.x, low.z); const post2 = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.08, Math.max(0.2, low.y - gy), 10), new THREE.MeshStandardMaterial({ color: 0x55595e, metalness: 0.8, roughness: 0.35 })); post2.position.set(low.x, (low.y + gy) / 2, low.z); scene.add(post2); post(low.x, low.z, 0.4, -5, low.y);
  const fl = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.1), new THREE.MeshBasicMaterial({ map: tex('assets/iv_flower.webp'), transparent: true, alphaTest: 0.4, side: THREE.DoubleSide })); fl.position.copy(W[0]).lerp(V, 0.0); fl.lookAt(V); fl.translateZ(t * 0.7); scene.add(fl);
  // footprints
  const fc = document.createElement('canvas'); fc.width = fc.height = 256; const f = fc.getContext('2d');
  if (f && f.ellipse && f.fill) { f.clearRect(0, 0, 256, 256); f.fillStyle = '#08DEFF'; [[96, 130, -0.1], [160, 126, 0.1]].forEach(([x, y, r]) => { f.save(); f.translate(x, y); f.rotate(r); f.beginPath(); f.ellipse(0, 0, 26, 52, 0, 0, PI * 2); f.fill(); f.beginPath(); f.ellipse(0, -66, 18, 16, 0, 0, PI * 2); f.fill(); f.restore(); }); }
  const fm = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.0), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(fc), transparent: true, polygonOffset: true, polygonOffsetFactor: -7, polygonOffsetUnits: -7 }));
  fm.rotation.x = -PI / 2; fm.rotation.z = Math.atan2(C.x - V.x, C.z - V.z) + PI; fm.position.set(V.x, 0.665 + 0.03, V.z); fm.renderOrder = 4; scene.add(fm);
  PEN.ok = true;
})();
const penSecret = secret('penrose', () => { toast('IT CLOSES. THREE BEAMS THAT NEVER TOUCH, AND FROM HERE THEY ARE A TRIANGLE THAT CANNOT EXIST.', 'blue'); });
window.__FRAMES.push(() => { try { if (!PEN.ok) return; const d = Math.hypot(P.x - PEN.V.x, P.z - PEN.V.z); if (d < 0.7 && !PEN.stand) { const f = new THREE.Vector3(); camera.getWorldDirection(f); if (f.dot(PEN.C.clone().sub(camera.position).normalize()) > 0.95) { PEN.stand = true; penSecret(); } } if (d > 2) PEN.stand = false; } catch (e) { } });
