/* ================================================================
   v265 THE MEME RIVER REACHES THE PIER (2026-11-23)
   The river now begins where you land: it comes off the pier at the welcome billboard and runs up the north spoke
   all the way to the ring, so the first thing under your feet when you step onto the island is the current, and
   it leads you in. Same shader as v241. ?river=0 off.
   ================================================================ */
(function riverToPier() {
  if (!window.__RIVER || !RIVER.mesh || !RIVER.mat) return; const PY = 0.665 + 0.012, P = [], U = [], I = []; let vi = 0;
  const pts = []; for (let z = 116; z >= 96; z -= 1.5) pts.push([0, z]); let s = 0;
  pts.forEach(([x, z], i) => { if (i) s -= 1.5; P.push(x + 1.1, PY, z, x - 1.1, PY, z); U.push(s + 54, 1, s + 54, -1); if (i) I.push(vi - 2, vi - 1, vi, vi - 1, vi + 1, vi); vi += 2; });
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals();
  const m = new THREE.Mesh(g, RIVER.mat); m.renderOrder = 2; m.userData.__single = true; m.userData.__nofreeze = true; scene.add(m); RIVER.pier = m;
})();
