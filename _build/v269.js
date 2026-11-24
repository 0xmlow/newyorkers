/* ================================================================
   v269 WALLPAPER: THE HOARDING (2026-11-23)
   BUIDL never finishes, so like every stalled site in the city it gets a plywood hoarding round its south and west
   sides, and the hoarding gets painted: the Firefly panorama (three Open Eye Flowers rising over contour hills,
   drips down the boards) runs the length of it, between timber posts with a rail along the top. ?wallpaper=0 off.
   ================================================================ */
(function hoarding() {
  if (!WALLS.on) return; const g = ground(-48, -47), H = 2.6;
  FACM.stud = FACM.stud || new THREE.MeshStandardMaterial({ color: 0x9a7a52, roughness: 0.85 });
  const run = (ax, az, bx, bz, nm, rep) => { const L0 = Math.hypot(bx - ax, bz - az), ry = Math.atan2(-(bz - az), bx - ax), cx = (ax + bx) / 2, cz = (az + bz) / 2;
    const m = new THREE.Mesh(new THREE.BoxGeometry(L0, H, 0.04), [FACM.stud, FACM.stud, FACM.stud, FACM.stud, wallMat(nm, rep, 1), FACM.stud]); m.position.set(cx, g + H / 2 + 0.05, cz); m.rotation.y = ry; m.castShadow = m.receiveShadow = true; scene.add(m);
    for (let u = 0; u <= L0 + 0.01; u += 2.44) { const t = u / L0; facPut('stud', ax + (bx - ax) * t, g + H / 2, az + (bz - az) * t, 0.1, H + 0.1, 0.1, ry); }
    facPut('stud', cx, g + H + 0.08, cz, L0, 0.08, 0.12, ry); wall(ax, az, bx, bz, -5, g + H); WALLS.n++; };
  run(-39.4, -55.6, -56.6, -55.6, 'hoarding', 3); run(-57.4, -55.2, -57.4, -40.5, 'concrete', 2);
  facFlush();
})();
