/* ================================================================
   v383 THE LOOK: THE ROOFTOP BILLBOARD FROM THE WATER (2026-11-24)
   The rooftop billboard (v339) gets a painted back too (the Firefly sky river, v337) so from the sea side of the island
   it is not a bare steel plate.
   ================================================================ */
(function rbbBack() { if (!window.__RBB || !RBB.mesh || !window.wallMat) return; const m = new THREE.Mesh(new THREE.PlaneGeometry(8.4, 4.7), wallMat('skyriver', 1, 1)); m.position.copy(RBB.mesh.position); m.position.x += 0.1; m.rotation.y = PI / 2; scene.add(m); })();
