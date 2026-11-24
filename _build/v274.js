/* ================================================================
   v274 WALLPAPER: THE OTHER TANK (2026-11-23)
   The walk up's second water tank (v192) is painted too, in the Firefly damask: white Open Eye Flowers in a lattice
   of contour lines on navy, so from the ring road three painted tanks stand on three roofs. ?wallpaper=0 off.
   ================================================================ */
(function tank2() { if (!WALLS.on || !window.__TANK2) return; __TANK2.material = wallMat('damask', 3, 1, { rough: 0.8 }); __TANK2.material.side = THREE.DoubleSide; WALLS.n++; })();
