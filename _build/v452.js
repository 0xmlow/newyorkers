/* ================================================================
   v452 THE TWO BARS ON THE TRACK (2026-11-24)
   A length of railway runs down the east beach toward the sea, its rails closing in toward the vanishing point
   the way every track does. Two yellow bars lie across it, one near, one far. The far one is plainly longer.
   They are the same length to the centimetre (walk out and stand between them). Mario Ponzo, 1911: the rails tell
   your brain the far bar is further away, so it scales it up. ?eastbeach=0 off.
   ================================================================ */
(function ponzo() {
  if (!window.__EASTB || /eastbeach=0/.test(location.search)) return;
  const V = eastAt(100, 110.5), out = new V3(-V.nx, 0, -V.nz), right = new V3(-V.tx, 0, -V.tz);
  eastLabel(97.5, 111, 'WHICH YELLOW BAR IS LONGER?', 'THEY ARE THE SAME LENGTH. GO AND CHECK.');
  const steel = new THREE.MeshStandardMaterial({ color: 0x9a9088, roughness: 0.3, metalness: 0.7 }), wood = new THREE.MeshStandardMaterial({ color: 0x4a3a2c, roughness: 0.9 }), yel = new THREE.MeshStandardMaterial({ color: 0xffc400, roughness: 0.45, emissive: 0x4a3200, emissiveIntensity: 0.5 });
  const L2 = 19, w0 = 1.45, w1 = 0.18, at = (d, u) => { const p = new V3(V.x, 0, V.z).addScaledVector(out, d).addScaledVector(right, u); p.y = ground(p.x, p.z); return p; };
  [-1, 1].forEach(sd => { const a = at(0.5, sd * w0 / 2), b = at(L2, sd * w1 / 2), m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.11, a.distanceTo(b)), steel); m.position.copy(a).add(b).multiplyScalar(0.5); m.position.y += 0.1; m.lookAt(b.x, m.position.y, b.z); m.castShadow = true; scene.add(m); });
  for (let d = 0.8; d < L2; d += 0.9) { const w = w0 + (w1 - w0) * (d / L2), p = at(d, 0), m = new THREE.Mesh(new THREE.BoxGeometry(w + 0.5 * (w / w0), 0.07, 0.2 * (0.4 + 0.6 * w / w0)), wood); m.position.copy(p); m.position.y += 0.035; m.rotation.y = V.ry; m.receiveShadow = true; scene.add(m); }
  [2.6, 11.5].forEach(d => { const p = at(d, 0), m = new THREE.Mesh(new THREE.BoxGeometry(1.1, 0.1, 0.22), yel); m.position.copy(p); m.position.y += 0.21; m.rotation.y = V.ry; m.castShadow = true; scene.add(m); });
  EASTB.ponzo = true;
})();
