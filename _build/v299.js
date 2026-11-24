/* ================================================================
   v299 WALLPAPER: ASPHALT ART (2026-11-24)
   New York's asphalt art program lets artists paint intersections. Where the four diagonal paths meet the freeway
   loop, the road itself is painted now: the Firefly asphalt piece, contour rivers with eye flowers floating in them,
   the asphalt grain and cracks showing through, the cars driving over it. ?wallpaper=0 off.
   ================================================================ */
(function asphaltArt() {
  if (!WALLS.on) return; const mat = wallMat('asphalt', 1, 1, { rough: 0.85 }); mat.polygonOffsetFactor = -3; mat.polygonOffsetUnits = -3;
  [45, 135, 225, 315].forEach(deg => { const a = deg * PI / 180, m = new THREE.Mesh(new THREE.PlaneGeometry(14, 7.8), mat); m.rotation.order = 'YXZ'; m.rotation.set(-PI / 2, -a, 0); m.position.set(Math.cos(a) * 100, 0.66 + 0.012, Math.sin(a) * 100); m.receiveShadow = true; scene.add(m); WALLS.n++; });
})();
