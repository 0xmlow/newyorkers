/* ================================================================
   v188 THE LOOK: PARK BENCHES (2026-11-23)
   The promenade benches were two planks on two blocks. They are rebuilt as the classic New York park bench:
   five slats in the seat, three in a back that leans away, cast iron ends with a front leg, a raked back leg and an
   armrest, the same places and the same way round. ?benches=0 off.
   ================================================================ */
const BENCH = { n: 0 };
window.__BENCH = BENCH;
(function benches() {
  if (!LOOK.on || /benches=0/.test(location.search)) return; let seat = null; const hide = [];
  scene.traverse(o => { if (!o.isInstancedMesh || !o.geometry || !o.geometry.parameters) return; const p = o.geometry.parameters;
    if (p.width === 2.4 && p.height === 0.12 && p.depth === 0.55) { seat = o; hide.push(o); } else if (p.width === 2.4 && p.height === 0.5 && p.depth === 0.08) hide.push(o); else if (p.width === 0.1 && p.height === 0.45 && p.depth === 0.5) hide.push(o); });
  if (!seat || hide.length < 3) return; hide.forEach(o => o.visible = false);
  const wood = new THREE.MeshStandardMaterial({ color: 0x7b5a3c, roughness: 0.75 }), iron = new THREE.MeshStandardMaterial({ color: 0x1d2a22, roughness: 0.45, metalness: 0.55 });
  const parts = []; // [material, sx, sy, sz, x, y, z, rx]
  [-0.2, -0.1, 0, 0.1, 0.2].forEach(z => parts.push([wood, 2.3, 0.035, 0.08, 0, 0.45, z, 0]));
  [0.6, 0.72, 0.84].forEach((y, i) => parts.push([wood, 2.3, 0.095, 0.035, 0, y, -0.27 - i * 0.035, -0.28]));
  [-1.05, 1.05].forEach(x => { parts.push([iron, 0.05, 0.44, 0.05, x, 0.22, 0.2, 0]); parts.push([iron, 0.05, 0.95, 0.05, x, 0.45, -0.28, -0.22]); parts.push([iron, 0.06, 0.04, 0.5, x, 0.64, -0.02, 0]); parts.push([iron, 0.05, 0.05, 0.48, x, 0.42, -0.03, 0]); parts.push([iron, 0.05, 0.22, 0.05, x, 0.53, 0.2, 0]); });
  const n = seat.count, m4 = new THREE.Matrix4(), b4 = new THREE.Matrix4(), l4 = new THREE.Matrix4(), pos = new V3(), q = new THREE.Quaternion(), sc = new V3(), e = new THREE.Euler();
  const byMat = new Map(); parts.forEach(p => { if (!byMat.has(p[0])) byMat.set(p[0], []); byMat.get(p[0]).push(p); });
  byMat.forEach((ps, mat) => { const im = new THREE.InstancedMesh(FAC_BOX, mat, ps.length * n); let k = 0;
    for (let i = 0; i < n; i++) { seat.getMatrixAt(i, m4); m4.decompose(pos, q, sc); b4.compose(new V3(pos.x, pos.y - 0.45, pos.z), q, new V3(1, 1, 1));
      ps.forEach(([, sx, sy, sz, x, y, z, rx]) => { l4.compose(new V3(x, y, z), new THREE.Quaternion().setFromEuler(e.set(rx, 0, 0)), new V3(sx, sy, sz)); im.setMatrixAt(k++, new THREE.Matrix4().multiplyMatrices(b4, l4)); }); }
    im.castShadow = im.receiveShadow = true; scene.add(im); });
  BENCH.n = n;
})();
