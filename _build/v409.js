/* ================================================================
   v409 REAL PROPS: THE ROOFTOP CONDENSERS (2026-11-24)
   The rooftop air conditioners on the bodega block, the laundromat and the line's building were grey boxes with a
   lid. Each pair is now Poly Haven's scanned outdoor unit (exterior_aircon_unit, CC0, through the wrap tool as
   isl_ac): fan grilles, rust runs, the copper lines. The window units stay (the scan is a split condenser, not a
   window unit). ?props=0 keeps the boxes.
   ================================================================ */
(function roofCondensers() {
  if (!window.__PH || !PH.on || !window.__FAC || !FAC.acMesh) return;
  const m = FAC.acMesh, k = FAC.frameKMesh, p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(), M = new THREE.Matrix4(), e = new THREE.Euler(), Z = new THREE.Matrix4().makeScale(0, 0, 0), roof = [];
  for (let i = 0; i < m.count; i++) { m.getMatrixAt(i, M); M.decompose(p, q, s); if (Math.abs(s.x - 1) < 0.01 && Math.abs(s.y - 0.84) < 0.01) { e.setFromQuaternion(q); roof.push({ i, x: p.x, y: p.y - s.y / 2, z: p.z, ry: e.y }); } }
  if (!roof.length) return;
  phLoad('isl_ac').then(A => { const w = Math.max(A.size.x, A.size.z), sc = 2.3 / w, list = [], used = new Set();
    roof.forEach(a => { if (used.has(a.i)) return; const b = roof.find(o => o !== a && !used.has(o.i) && Math.hypot(o.x - a.x, o.z - a.z) < 1.8 && Math.abs(o.y - a.y) < 0.2); used.add(a.i); if (b) used.add(b.i);
      const c = b ? [(a.x + b.x) / 2, a.y, (a.z + b.z) / 2] : [a.x, a.y, a.z], dx = b ? b.x - a.x : 1, dz = b ? b.z - a.z : 0; list.push([c[0], c[1], c[2], Math.atan2(-dz, dx), b ? sc : sc * 0.55]); });
    roof.forEach(a => m.setMatrixAt(a.i, Z)); m.instanceMatrix.needsUpdate = true;
    if (k) { for (let j = 0; j < k.count; j++) { k.getMatrixAt(j, M); M.decompose(p, q, s); if (Math.abs(s.x - 0.62) < 0.01 && Math.abs(s.y - 0.04) < 0.01 && roof.some(a => Math.hypot(a.x - p.x, a.z - p.z) < 0.05 && Math.abs(a.y + 0.86 - p.y) < 0.1)) k.setMatrixAt(j, Z); } k.instanceMatrix.needsUpdate = true; }
    return phPlace('isl_ac', list); }).catch(e => console.warn('v409', e));
})();
