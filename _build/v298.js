/* ================================================================
   v298 WALLPAPER: THE FACTORY (2026-11-24)
   SEIZE THE MEMES OF PRODUCTION's long red steel walls were bare. They carry the Firefly factory mural now: gears and
   a conveyor dissolving into MLow's contour rivers, an Open Eye Flower in the biggest gear, paint running down the
   corrugations, round all three outside walls. ?wallpaper=0 off.
   ================================================================ */
(function factoryMural() {
  if (!WALLS.on) return; const cx = 0, cz = -64, w = 32, d = 28, h = 9, g = ground(cx, cz) + 0.02;
  const put = (x, z, ry, len, rep) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(len, h - 0.2), wallMat('factory', rep, 1)); m.position.set(x, g + h / 2, z); m.rotation.y = ry; m.receiveShadow = true; scene.add(m); WALLS.n++; };
  put(cx, cz - d / 2 - 0.265, PI, w, 2); put(cx - w / 2 - 0.265, cz, -PI / 2, d, 2); put(cx + w / 2 + 0.265, cz, PI / 2, d, 2);
})();
