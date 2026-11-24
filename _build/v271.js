/* ================================================================
   v271 A TANK ON THE BODEGA'S ROOF (2026-11-23)
   The new bodega tenement (v227) had a bulkhead and condensers but no water tank, which every building that height
   in New York has. It gets one: a copy of the island's cedar tank on four steel legs and a cross braced frame,
   painted in the Firefly shutter piece (contour rivers running round to an eye), facing the plaza. ?block=0 off.
   ================================================================ */
(function bodegaTank() {
  if (!BLK_ON || !BLK.bodega || !window.__WT || !WT.tank) return; const top = BLK.bodega + 0.12, x = 19.6, z = 61.6;
  const t2 = WT.tank.clone(true); t2.position.set(x, top + 3.0, z); t2.scale.setScalar(0.82); scene.add(t2);
  t2.traverse(o => { if (o.isMesh && o.geometry.type === 'CylinderGeometry' && o.geometry.parameters.openEnded) { o.material = wallMat('shutter', 2, 1, { rough: 0.8 }); o.material.side = THREE.DoubleSide; } });
  const V = THREE.Vector3; [[-1, -1], [1, -1], [1, 1], [-1, 1]].forEach(([a, b]) => facBar(FACM.steel, new V(x + a * 1.4, top, z + b * 1.4), new V(x + a * 1.2, top + 3.0, z + b * 1.2), 0.14, 0.14));
  [[-1, -1, 1, -1], [1, -1, 1, 1], [1, 1, -1, 1], [-1, 1, -1, -1]].forEach(([a, b, c, d]) => { facBar(FACM.steel, new V(x + a * 1.35, top + 0.3, z + b * 1.35), new V(x + c * 1.25, top + 2.7, z + d * 1.25), 0.05, 0.05); facBar(FACM.steel, new V(x + c * 1.35, top + 0.3, z + d * 1.35), new V(x + a * 1.25, top + 2.7, z + b * 1.25), 0.05, 0.05); });
  facPut('steel', x, top + 3.0, z, 3.0, 0.12, 3.0, 0); facFlush(); BLK.tank = t2;
})();
