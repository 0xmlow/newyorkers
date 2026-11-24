/* ================================================================
   v340 WALLPAPER: THE MARKET'S BOARDS (2026-11-24)
   The market kiosks' tongue and groove backs (v173) are painted now, like the backs of the holiday market stalls in
   Bryant Park: Firefly's green boards with contour lines and three small Open Eye Flowers running across them, the
   joints and grain showing through. ?wallpaper=0 off.
   ================================================================ */
(function marketBoards() {
  if (!WALLS.on || !window.__MKT || !MKT.k) return; const mt = wallMat('boards', 1, 1, { rough: 0.8 });
  MKT.k.forEach(k => { const gy = ground(k.x, k.z), m = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.5), mt); m.position.set(k.x, gy + 1.25, k.z + 1.1 + 0.075); m.receiveShadow = true; scene.add(m); WALLS.n++; });
})();
