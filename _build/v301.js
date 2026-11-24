/* ================================================================
   v301 WALLPAPER: THE VAULT'S STEEL (2026-11-24)
   The hardware wallet lighthouse's vault floor (v176) gets its casing engraved: the Firefly steel panels, riveted,
   with cobalt and cyan contour lines etched across them toward an engraved Open Eye Flower, on both side walls, like
   the shell of a precious device. ?wallpaper=0 off.
   ================================================================ */
(function vaultSteel() {
  if (!WALLS.on || typeof LH === 'undefined' || LH.g == null) return; const { x, z, w, d } = LH, g0 = LH.g, rh = 5.6;
  [-1, 1].forEach(s => { const m = new THREE.Mesh(new THREE.PlaneGeometry(d + 0.6, rh - 0.4), wallMat('steel', 1, 1, { rough: 0.45 })); m.material.metalness = 0.55; m.position.set(x + s * (w / 2 + 0.38), g0 + rh / 2, z); m.rotation.y = s * PI / 2; m.receiveShadow = true; scene.add(m); WALLS.n++; });
})();
