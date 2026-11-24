/* ================================================================
   v415 WALLPAPER: THE BACKS OF THE SIDESHOW (2026-11-24)
   The sideshow boards (v402 to v404) turn their backs to the sea and the ferry, and the backs were plain navy. They
   carry MLow's Firefly wheatpaste now, the hoarding paper of contour rivers and eye flowers, the way the backs of
   real boardwalk signs collect posters. ?wallpaper=0 off.
   ================================================================ */
(function sideBacks() {
  if (!WALLS.on || /wallpaper=0/.test(location.search) || !window.__SIDE) return; const M = wallMat('hoarding');
  const go = () => SIDE.list.forEach(B => { if (B.backed) return; B.backed = true; const [x, z] = B.at(0, -0.05), m = new THREE.Mesh(new THREE.PlaneGeometry(2.26, 2.66), M); m.position.set(x, B.g + 1.75, z); m.rotation.y = B.ry + PI; m.receiveShadow = true; scene.add(m); WALLS.n++; });
  go(); SIDE.backs = go;
})();
