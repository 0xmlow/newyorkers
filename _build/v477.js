/* ================================================================
   v477 THE ILLUSION BEACH DUCKBOARDS (2026-11-24)
   A path of grey duckboards (the slatted walkways laid over beach sand at Rockaway and Coney) runs from the gate
   along the east beach past all nine illusions, a metre and a half wide, gently wandering, so the walk is clear
   and nobody has to guess where to stand. Same weathered plank texture as the boardwalk. ?eastbeach=0 off.
   ================================================================ */
(function duckboards() {
  if (!window.__EASTB || /eastbeach=0/.test(location.search) || !window.__BWALK || !BWALK.mat) return;
  const d0 = 33, d1 = 152, segs = 220, w = 0.75, pos = [], uv = [], idx = []; let L2 = 0, prev = null;
  for (let i = 0; i <= segs; i++) { const d = d0 + (d1 - d0) * i / segs, r = 111.2 + 0.6 * Math.sin(d * 0.21), a = d * PI / 180, cx = Math.sin(a) * r, cz = Math.cos(a) * r, nx = Math.sin(a), nz = Math.cos(a);
    if (prev) L2 += Math.hypot(cx - prev[0], cz - prev[1]); prev = [cx, cz];
    [-w, w].forEach((o, j) => { const x = cx + nx * o, z = cz + nz * o; pos.push(x, ground(x, z) + 0.06, z); uv.push(L2 / 4, j ? 1.5 / 4 : 0); });
    if (i) { const b = (i - 1) * 2; idx.push(b, b + 2, b + 1, b + 1, b + 2, b + 3); } }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(uv, 2)); g.setIndex(idx); g.computeVertexNormals();
  if (g.attributes.normal.array[1] < 0) { idx.reverse(); g.setIndex(idx); g.computeVertexNormals(); }
  const m = new THREE.Mesh(g, BWALK.mat); m.receiveShadow = true; scene.add(m); EASTB.path = m;
})();
