/* ================================================================
   v303 THE NEW MURALS AFTER DARK (2026-11-24)
   The factory walls, the vault and the lighthouse's back get the same warm wash from below at night as v252's murals.
   ================================================================ */
(function moreUplights() {
  if (!window.__WNIGHT || !WNIGHT.mat) return;
  scene.traverse(o => { if (!o.isMesh || !o.material || !o.material.userData || !['factory', 'steel', 'tower'].includes(o.material.userData.wall) || o.geometry.type !== 'PlaneGeometry' || o.userData.__wn) return; o.userData.__wn = 1;
    const p = o.geometry.parameters, w = new THREE.Mesh(new THREE.PlaneGeometry(p.width, Math.min(p.height, 9)), WNIGHT.mat); w.position.copy(o.position); w.quaternion.copy(o.quaternion); w.translateZ(0.01); w.translateY(-(p.height - Math.min(p.height, 9)) / 2); w.renderOrder = 5; scene.add(w); WNIGHT.mats.push(w); });
})();
