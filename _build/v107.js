/* ================================================================
   v107 REAL PIGEONS (2026-11-23)
   The island's pigeons (the flocks on THE FLOOR, the Census Walk and GM BEACH, still run by v12: they peck about,
   scatter when you come close and glide back) are now Quaternius' rigged CC0 pigeon. The nearest eighteen (eight
   on a phone) are full rigged birds that walk, idle, peck and flap; the rest of the flock stays the light
   instanced bird out past where you can tell the difference. Feeding and the dogs chasing them still work.
   ================================================================ */
const PIGR = { pool: [], K: isMobile ? 8 : 18, t: 0, im: null };
window.__PIGR = PIGR;
(function realPigeons() {
  scene.traverse(o => { if (o.isInstancedMesh && o.count === 44 && o.material && o.material.color && (o.material.color.getHex() === 0x8a8f99 || o.material.color.getHex() === 0x6f7480)) (o.material.color.getHex() === 0x8a8f99 ? (PIGR.im = o) : (PIGR.w = (PIGR.w || []).concat(o))); });
  for (let i = 0; i < PIGR.K; i++) { const h = CC0.make('pigeon', { h: 0.3, walkSp: 0.35, far: 60, tint: [0xffffff, 0xd8d8d8, 0xb8b8c0, 0xefe9e0][i % 4] }); h.root.visible = false; h.idx = -1; PIGR.pool.push(h); }
})();
const _pz = new THREE.Matrix4().makeScale(0, 0, 0), _pm = new THREE.Matrix4();
function pigrFrame(dt) {
  const B = LIFE.pigeons; if (!B || !PIGR.pool.length) return; PIGR.t -= dt;
  if (PIGR.t <= 0) { PIGR.t = 0.5; const order = B.map((b, i) => [Math.hypot(b.x - P.x, b.z - P.z), i]).sort((a, b) => a[0] - b[0]).slice(0, PIGR.K); PIGR.pool.forEach((h, k) => { h.idx = order[k] && order[k][0] < 70 ? order[k][1] : -1; }); }
  const used = new Set();
  PIGR.pool.forEach(h => { if (h.idx < 0 || !h.ready) { h.root.visible = false; return; } const b = B[h.idx]; used.add(h.idx); h.root.visible = true;
    h.root.position.set(b.x, b.y + (b.st === 0 ? 0 : 0.05), b.z); h.root.rotation.y = b.yaw; h.force = b.st === 0 ? (Math.sin(LIFE.t * 0.7 + h.idx) > 0.5 ? 'peck' : null) : 'jump'; });
  // hide the instanced bird wherever a rigged one stands in
  if (PIGR.im) { used.forEach(i => PIGR.im.setMatrixAt(i, _pz)); PIGR.im.instanceMatrix.needsUpdate = true; }
  if (PIGR.w) PIGR.w.forEach(w => { used.forEach(i => w.setMatrixAt(i, _pz)); w.instanceMatrix.needsUpdate = true; });
}
window.__FRAMES.push(dt => { try { pigrFrame(dt); } catch (e) { if (!PIGR.err) { PIGR.err = e; console.warn('v107 pigeons', e); } } });
