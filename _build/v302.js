/* ================================================================
   v302 WALLPAPER: THE LIGHTHOUSE'S BACK (2026-11-24)
   The forty metre back of the hardware wallet lighthouse faces the open sea and every aerial shot, and it was blank.
   It carries the Firefly tower piece now: three tall rivers of contour lines climbing it, three Open Eye Flowers
   stacked up each one like floors, paint falling. ?wallpaper=0 off.
   ================================================================ */
(function lighthouseBack() {
  if (!WALLS.on || typeof LH === 'undefined' || LH.g == null) return; const { x, z, w, d, H } = LH, g0 = LH.g;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w - 0.6, H - 8), wallMat('tower', 1, 2, { rough: 0.6 })); m.position.set(x, g0 + 5.6 + (H - 8) / 2, z - d / 2 - 0.4); m.rotation.y = PI; m.receiveShadow = true; scene.add(m); WALLS.n++; WALLS.lhBack = m;
})();
