/* ================================================================
   v384 THE WHAT TO LOOK FOR BOARD COUNTS (2026-11-24)
   The pier boards (v332, v366) gain a line at the top of the first board: 19 ILLUSIONS · 22 PAINTED WALLS · 577 CARDS ·
   472 ARTISTS, so the scale of the island is clear before the walk.
   ================================================================ */
(function counts() { if (!window.__LOOKFOR) return; const [x, g, z] = __LOOKFOR.P, t = signTex([{ t: '18 ILLUSIONS · 577 CARDS · 472 ARTISTS', s: 0.11 }], 1024, 96, '#2962FF', '#ffffff');
  const m = new THREE.Mesh(new THREE.PlaneGeometry(1.6, 0.15), new THREE.MeshBasicMaterial({ map: t })); m.position.set(x, g + 2.75, z); m.rotation.y = PI + 0.35; scene.add(m); })();
