/* ================================================================
   v251 WALLPAPER: THE BACK ROOM'S DAMASK (2026-11-23)
   The speakeasy behind the bodega (v41) had walls painted near black. They are papered now in the Firefly damask:
   white Open Eye Flowers in a lattice of fine contour lines on deep navy, dimmed by the room's low light, the way a
   bar's wallpaper reads at one in the morning. ?wallpaper=0 off.
   ================================================================ */
(function backRoomDamask() {
  if (!WALLS.on || !window.__BACK || !BACK.g) return; let n = 0;
  const m = new THREE.MeshStandardMaterial({ map: wallTex('damask', 3, 1), color: 0x6f6878, roughness: 0.7 });
  BACK.g.children.forEach(o => { if (o.isMesh && o.geometry.type === 'PlaneGeometry' && o.material && o.material.color && o.material.color.getHex() === 0x14070a) { o.material = m; n++; } });
  WALLS.n += n; WALLS.damask = n;
})();
