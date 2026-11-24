/* ================================================================
   v364 THE OBSCURA IS DARK INSIDE (2026-11-24)
   A camera obscura only works in the dark. The hut's door gets a heavy black curtain on a rail, pulled aside, and the
   inside walls and ceiling are matte black so the image on the back wall is the only light in the room.
   ================================================================ */
(function obscuraDark() { if (!window.__OBS || !OBS.ok) return; const [X, g, Z] = OBS.P, blk = new THREE.MeshStandardMaterial({ color: 0x020203, roughness: 1 });
  [[0, 1.3, -1.5, 3.0, 2.6, 0.02], [0, 1.3, 1.5, 3.0, 2.6, 0.02], [0, 2.52, 0, 3.0, 0.02, 3.0]].forEach(([dx, y, dz, w, h, d]) => { const m = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), blk); m.position.set(X + dx, g + y, Z + dz); scene.add(m); });
  const cur = new THREE.Mesh(new THREE.BoxGeometry(0.06, 2.1, 0.5), new THREE.MeshStandardMaterial({ color: 0x0a0a0c, roughness: 1 })); cur.position.set(X + 1.5, g + 1.05, Z - 0.42); scene.add(cur); })();
