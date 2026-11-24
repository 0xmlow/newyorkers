/* ================================================================
   v464 THE WHEEL THAT GOES BACKWARDS (2026-11-24)
   A bicycle wheel on a stand, spun by a motor that speeds up and slows down. As it gets fast it seems to slow,
   stop dead and then turn backwards, though it never does: your screen (like a film camera, or your eye under
   street lights) samples it a set number of times a second, and when a spoke moves almost one spoke gap between
   looks, the nearest spoke appears to have crept back. The wagon wheel effect, from every western ever filmed.
   ?eastbeach=0 off.
   ================================================================ */
(function wagonWheel() {
  if (!window.__EASTB || /eastbeach=0/.test(location.search)) return;
  const P = eastAt(134, 121); eastLabel(136.5, 116, 'WHICH WAY IS IT TURNING?', 'IT ONLY EVER TURNS ONE WAY. WATCH IT SPEED UP.');
  const G = new THREE.Group(), steel = new THREE.MeshStandardMaterial({ color: 0xd8dde3, roughness: 0.25, metalness: 0.9 }), tyre = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.8 }), R = 1.25;
  const rim = new THREE.Mesh(new THREE.TorusGeometry(R, 0.035, 8, 64), steel), ty = new THREE.Mesh(new THREE.TorusGeometry(R + 0.05, 0.05, 8, 64), tyre); G.add(rim, ty);
  for (let i = 0; i < 24; i++) { const a = i / 24 * PI * 2, s = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, R, 4), steel); s.position.set(Math.cos(a) * R / 2, Math.sin(a) * R / 2, 0); s.rotation.z = a - PI / 2; G.add(s); }
  // one spoke painted red, so you can follow it at low speed
  const red = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, R, 4), new THREE.MeshStandardMaterial({ color: 0xd8231a, roughness: 0.5 })); red.position.set(0, R / 2, 0.01); G.add(red);
  const hub = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.08, 0.16, 16), steel); hub.rotation.x = PI / 2; G.add(hub);
  const W = new THREE.Group(); W.add(G); W.position.set(P.x, P.g + 1.9, P.z); W.rotation.y = P.ry; scene.add(W);
  const navy = EASTB.navy; [-1, 1].forEach(s => { const f = new THREE.Mesh(new THREE.BoxGeometry(0.06, 1.9, 0.06), navy); f.position.set(P.x + P.nx * 0.12 * s, P.g + 0.95, P.z + P.nz * 0.12 * s); scene.add(f); }); post(P.x, P.z, 0.5, -5, 3.4);
  EASTB.wheel = { G, t: 0, a: 0 };
})();
window.__FRAMES.push(dt => { try { const w = EASTB.wheel; if (!w || camera.position.distanceTo(w.G.parent.position) > 70) return; w.t += dt; const sp = 17 * (0.5 - 0.5 * Math.cos(w.t * 2 * PI / 24)); w.a -= sp * dt; w.G.rotation.z = w.a; } catch (e) { } });
