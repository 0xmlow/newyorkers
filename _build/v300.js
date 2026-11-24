/* ================================================================
   v300 WALLPAPER: EYES ON THE ROOFS (2026-11-24)
   From the air the island's flat roofs were plain tar. Each new tenement roof (bodega, laundromat, DROP shop) now has
   the Firefly rooftop eye painted on it: one huge Open Eye Flower with contour rings rippling out across the tar, the
   kind of thing you only find from a helicopter or the top of the Ferris wheel. ?wallpaper=0 off.
   ================================================================ */
(function roofEyes() {
  if (!WALLS.on || !window.__BLK) return; const mat = wallMat('roofeye', 1, 1, { rough: 0.9 }); mat.polygonOffsetFactor = -4; mat.polygonOffsetUnits = -4;
  const roof = (x, z, w, d, top, rot) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, d), mat); m.rotation.order = 'YXZ'; m.rotation.set(-PI / 2, rot || 0, 0); m.position.set(x, top + 0.135, z); m.receiveShadow = true; scene.add(m); WALLS.n++; };
  try { if (BLK.bodega) roof(17, 66, 13.6, 9.6, BLK.bodega, PI / 2); } catch (e) { }
  try { if (BLK.laund) roof(-86, -4, 7.6, 4.6, BLK.laund, PI / 2); } catch (e) { }
  try { if (BLK.drop) roof(-62, 80, 6.6, 3.6, BLK.drop, 0); } catch (e) { }
})();
