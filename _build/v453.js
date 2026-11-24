/* ================================================================
   v453 THE FENCE THAT LEANS (2026-11-24)
   A length of snow fence, the slatted kind that stands on every New York beach in winter, along the east dunes.
   Its four long rails are dead level and parallel. They look as if they tilt toward and away from each other,
   because the short slats across each rail slant one way on one rail and the other way on the next. Johann
   Zöllner, 1860, who noticed it in a fabric pattern. ?eastbeach=0 off.
   ================================================================ */
(function zollner() {
  if (!window.__EASTB || /eastbeach=0/.test(location.search)) return;
  const P = eastAt(118, 124.5); eastLabel(118, 117.5, 'ARE THE RAILS LEVEL?', 'PUT A STRAIGHT EDGE ON THEM. THEY ARE. ALL FOUR.');
  const along = new V3(P.tx, 0, P.tz), L2 = 11, rails = [0.55, 1.0, 1.45, 1.9];
  const white = new THREE.MeshStandardMaterial({ color: 0xece6da, roughness: 0.7 }), blk = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.6 });
  rails.forEach(y => { const m = new THREE.Mesh(new THREE.BoxGeometry(L2, 0.07, 0.05), white); m.position.set(P.x, P.g + y, P.z); m.rotation.y = P.ry + PI / 2; m.castShadow = true; scene.add(m); });
  const n = 0; const slat = new THREE.BoxGeometry(0.035, 0.36, 0.03); let cnt = 0; const im = new THREE.InstancedMesh(slat, blk, 4 * 40), o = new THREE.Object3D();
  rails.forEach((y, ri) => { const tilt = (ri % 2 ? 1 : -1) * 0.75; for (let i = 0; i < 40; i++) { const u = -L2 / 2 + 0.2 + i * (L2 - 0.4) / 39, p = new V3(P.x, P.g + y, P.z).addScaledVector(along, u); o.position.copy(p).addScaledVector(new V3(P.nx, 0, P.nz), 0.04); o.rotation.set(0, P.ry, tilt); o.updateMatrix(); im.setMatrixAt(cnt++, o.matrix); } });
  im.castShadow = true; scene.add(im);
  [-L2 / 2, -L2 / 6, L2 / 6, L2 / 2].forEach(u => { const p = new V3(P.x, 0, P.z).addScaledVector(along, u), m = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.06, 2.3, 6), new THREE.MeshStandardMaterial({ color: 0x6a5a48, roughness: 0.9 })); m.position.set(p.x, P.g + 1.1, p.z); scene.add(m); post(p.x, p.z, 0.2, -5, 3); });
  for (let u = -L2 / 2; u <= L2 / 2; u += 1.2) { const p = new V3(P.x, 0, P.z).addScaledVector(along, u); CIRCS.push({ x: p.x, z: p.z, r: 0.35, y0: -5, y1: 3, on: true }); }
  EASTB.fence = true;
})();
