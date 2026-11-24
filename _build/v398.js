/* ================================================================
   v398 WALLPAPER: THE BOARDWALK SHOP AND THE DARK HUT (2026-11-24)
   Two new blank faces get MLow's Firefly paint. N3W CUTS' back wall faces the open sea and the ferry: it carries the
   eye mural, rivers of contour lines to an Open Eye Flower; its north wall, a ghost sign. The camera obscura (v357)
   was a plain navy box; its four outer walls now wear the painted boards, with a black cornice round the roof and a
   brass ring round the pinhole so you can find it from outside. ?wallpaper=0 off.
   ================================================================ */
(function wallpaper4() {
  if (!WALLS.on || /wallpaper=0/.test(location.search)) return;
  const plane = (w, h, mat, x, y, z, ry) => { const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), mat); m.position.set(x, y, z); m.rotation.y = ry; m.receiveShadow = true; scene.add(m); WALLS.n++; return m; };
  try { if (window.__CUTS && CUTS.ok) { const [cx, g, cz] = CUTS.c, [nx, nz] = CUTS.n, [tx, tz] = CUTS.t, d = CUTS.D / 2 + 0.012, hw = CUTS.W / 2 + 0.012;
    plane(CUTS.W - 0.3, CUTS.H - 0.7, wallMat('mural_eye'), cx - nx * d, g + 0.25 + (CUTS.H - 0.7) / 2, cz - nz * d, Math.atan2(-nx, -nz));
    plane(CUTS.D - 0.6, CUTS.H - 1.2, wallMat('ghostbrick'), cx + tx * hw, g + 1.0 + (CUTS.H - 1.2) / 2, cz + tz * hw, Math.atan2(tx, tz)); } } catch (e) { console.warn('v398 cuts', e); }
  try { if (window.__OBS && OBS.ok) { const [X, g, Z] = OBS.P, W = 3.2, D = 3.2, H = 2.6, o = 0.088, M = wallMat('boards');
    plane(W, H, M, X, g + H / 2, Z - D / 2 - o, PI); plane(W, H, M, X, g + H / 2, Z + D / 2 + o, 0); plane(D, H, M, X - W / 2 - o, g + H / 2, Z, -PI / 2);
    const side = (D - 1.1) / 2; plane(side, H, M, X + W / 2 + o, g + H / 2, Z - 0.55 - side / 2, PI / 2); plane(side, H, M, X + W / 2 + o, g + H / 2, Z + 0.55 + side / 2, PI / 2);
    FACM.frameK && [[0, -D / 2 - 0.1, W + 0.5, 0.2], [0, D / 2 + 0.1, W + 0.5, 0.2]].forEach(([dx, dz, w, d]) => facPut('frameK', X + dx, g + H + 0.12, Z + dz, w, 0.22, d, 0));
    [[-W / 2 - 0.1, 0], [W / 2 + 0.1, 0]].forEach(([dx]) => facPut('frameK', X + dx, g + H + 0.12, Z, 0.2, 0.22, D + 0.1, 0)); facFlush();
    const brass = new THREE.MeshStandardMaterial({ color: 0xb8913e, roughness: 0.3, metalness: 0.95 }); const ring = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.022, 10, 28), brass); ring.position.set(X - W / 2 - 0.1, g + 1.6, Z); ring.rotation.y = PI / 2; scene.add(ring);
    const hole = new THREE.Mesh(new THREE.CircleGeometry(0.05, 16), new THREE.MeshBasicMaterial({ color: 0x000000 })); hole.position.set(X - W / 2 - 0.101, g + 1.6, Z); hole.rotation.y = -PI / 2; scene.add(hole); } } catch (e) { console.warn('v398 obscura', e); }
})();
