/* ================================================================
   v239 REAL PROPS: BENCHES (2026-11-23)
   Every bench on the island is now the same scanned park bench: hardwood slats on cast steel supports, with a
   small N3W PARKS plaque pressed into the backrest by the wrap tool. It replaces the slat-and-box benches of v188
   along the promenade and the pier, and the coded ones by the handball court, at the skate plaza and in the dog
   run. Same places, same way round. ?props=0 brings the old ones back.
   ================================================================ */
(function benchesCC0() {
  if (!PH.on) return; const list = [];
  try { if (window.__BENCH && BENCH.seat && BENCH.ims.length) { const m4 = new THREE.Matrix4(), p = new THREE.Vector3(), q = new THREE.Quaternion(), s = new THREE.Vector3(), e = new THREE.Euler();
      for (let i = 0; i < BENCH.seat.count; i++) { BENCH.seat.getMatrixAt(i, m4); m4.decompose(p, q, s); e.setFromQuaternion(q, 'YXZ'); list.push([p.x, p.y - 0.45, p.z, e.y]); } } } catch (e) { }
  (window.BENCHQ || []).forEach(b => list.push(b.slice()));
  if (!list.length) return;
  phLoad('isl_seating').then(M => { const k = 2.2 / Math.max(0.5, M.size.x); list.forEach(L => L[4] = k);
    return phPlace('isl_seating', list).then(ims => { if (ims.length && window.__BENCH) BENCH.ims.forEach(o => o.visible = false); }); }).catch(() => { });
})();
