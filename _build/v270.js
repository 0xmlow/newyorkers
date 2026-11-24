/* ================================================================
   v270 WALLPAPER: THE PAINTED WATER TANK (2026-11-23)
   New York has a tradition of artists painting the wooden water tanks on its roofs. The water tower building's
   cedar tank (v66) is wrapped now in MLow's Firefly witness mural, two Open Eye Flowers looking out over the island
   from forty feet up, its steel hoops left on top of the paint. ?wallpaper=0 off.
   ================================================================ */
(function paintedTank() {
  if (!WALLS.on || !window.__WT || !WT.tank) return;
  WT.tank.children.forEach(o => { if (o.isMesh && o.geometry.type === 'CylinderGeometry' && o.geometry.parameters.openEnded) { o.material = wallMat('mural_eye', 2, 1, { rough: 0.8 }); o.material.side = THREE.DoubleSide; WT.painted = o; WALLS.n++; } });
})();
