/* ================================================================
   v344 WALLPAPER: THE HUT AND THE NEWSSTAND (2026-11-24)
   The skate rental hut by the rink and the newsstand's back wall get the painted boards too (Firefly, v340), so every
   small wooden structure on the island is painted the same hand.
   ================================================================ */
(function hutBoards() {
  if (!WALLS.on) return; const mt = wallMat('boards', 1, 1, { rough: 0.8 });
  try { if (window.__RB2 && RB2.hut) { const [hx, hz] = RB2.hut, g = RINK.g0, gx = Math.cos(RINK.gapA), gz = Math.sin(RINK.gapA), hr = Math.atan2(gx, gz);
    [[0, -1.01], [PI / 2, -1.31], [-PI / 2, -1.31]].forEach(([dr, d]) => { const r = hr + PI + dr, m = new THREE.Mesh(new THREE.PlaneGeometry(dr ? 2.0 : 2.6, 2.4), mt); m.position.set(hx + Math.sin(r) * -d * (dr ? 1 : 1), g + 1.25, hz + Math.cos(r) * -d); m.rotation.y = r + PI; scene.add(m); WALLS.n++; }); } } catch (e) { }
  try { if (window.__NEWS) { const x0 = NEWS_AT.x, z0 = NEWS_AT.z, ry = NEWS.ry, g0 = ground(x0, z0), m = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 2.5), mt); m.position.set(x0 - Math.sin(ry) * 1.015, g0 + 1.3, z0 - Math.cos(ry) * 1.015); m.rotation.y = ry + PI; scene.add(m); WALLS.n++; } } catch (e) { }
})();
