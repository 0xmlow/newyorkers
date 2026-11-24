/* ================================================================
   v338 WALLPAPER: THE SKATE PLAZA'S PIECES (2026-11-24)
   Every skatepark's concrete is painted over by the people who skate it. The plaza's quarter pipe and bank (v219)
   carry Firefly's skatepark piece: an Open Eye Flower throw up and contour lines sprayed across the concrete, with
   wheel marks and wax scuffed over the paint. ?wallpaper=0 off.
   ================================================================ */
(function skatePieces() {
  if (!WALLS.on || !window.__SK2 || !SK2.ok) return; const mt = wallMat('skategraf', 1, 1, { rough: 0.7 });
  if (SK2.qp) { SK2.qp.material = mt; const uv = SK2.qp.geometry.attributes.uv, pos = SK2.qp.geometry.attributes.position; for (let i = 0; i < uv.count; i++) uv.setXY(i, pos.getZ(i) / 5.2 + 0.5, pos.getY(i) / 1.8); uv.needsUpdate = true; WALLS.n++; }
  scene.traverse(o => { if (o.isMesh && o.geometry && o.geometry.type === 'BoxGeometry' && o.material === FACM.skConc && Math.abs(o.geometry.parameters.width - 2.4) < 1e-3 && Math.abs(o.geometry.parameters.depth - 3.0) < 1e-3) { o.material = mt; WALLS.n++; } });
})();
