/* ================================================================
   v350 LAUNDRY DAY (2026-11-24)
   Inside SPIN CYCLE 420, scanned wicker baskets heaped with folded laundry sit on the folding table and on the floor by
   the dryers, and a cardboard box of detergent waits by the change machine. ?props=0 off.
   ================================================================ */
(function laundryDay() {
  if (!PH.on || !window.__LAUND) return; const g = LAUND.g0, x0 = -86, z0 = -4;
  phPlace('isl_basket', [[x0 + 0.4, g + 0.93, z0 - 1.4, 0.1, 0.9], [x0 + 0.4, g + 0.93, z0 + 0.6, -0.2, 0.9], [x0 - 1.0, g + 0.02, z0 - 2.5, 0.4, 1]], { shadow: false });
  const fold = new THREE.InstancedMesh(new THREE.BoxGeometry(0.34, 0.05, 0.26), new THREE.MeshStandardMaterial({ roughness: 0.95 }), 9), o = new THREE.Object3D(), c = new THREE.Color(), cols = [0xe8e2d4, 0x2962FF, 0xb3121b, 0x1f5a36, 0xe8c45a, 0x8a8f99];
  for (let i = 0; i < 9; i++) { const b = i < 4 ? [x0 + 0.4, g + 1.0, z0 - 1.4] : i < 8 ? [x0 + 0.4, g + 1.0, z0 + 0.6] : [x0 - 1.0, g + 0.1, z0 - 2.5]; o.position.set(b[0] + (Math.random() - 0.5) * 0.05, b[1] + (i % 4) * 0.05, b[2]); o.rotation.y = Math.random() * 0.3; o.updateMatrix(); fold.setMatrixAt(i, o.matrix); fold.setColorAt(i, c.setHex(cols[i % cols.length])); }
  fold.instanceColor.needsUpdate = true; scene.add(fold);
  phPlace('isl_cardboard', [[x0 + 1.2, g + 0.02, z0 + 3.0, 0.3, 0.7]]);
})();
