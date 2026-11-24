/* ================================================================
   v337 WALLPAPER: THE SKY OVER THE CENSUS (2026-11-24)
   Above the two rows of portraits and the lettered frieze, the census walk's Hadid ribbon rose two to four metres in
   blank bone. It carries Firefly's sky river now: contour lines flowing like wind, clouds drawn as contour rings, five
   Open Eye Flowers rising across it like suns, following the ribbon's own rise and fall. ?wallpaper=0 off.
   ================================================================ */
(function censusSky() {
  if (!WALLS.on) return; const pts = []; for (let i = 0; i <= 24; i++) { const z = 46 + i * 1.6; pts.push([-11 - 2.2 * Math.sin(i / 24 * PI * 2), z]); }
  const P = [], U = [], I = []; let s = 0, total = 0; for (let i = 1; i < pts.length; i++) total += Math.hypot(pts[i][0] - pts[i - 1][0], pts[i][1] - pts[i - 1][1]);
  for (let i = 0; i < pts.length; i++) { const [x, z] = pts[i], [x2, z2] = pts[Math.min(24, i + 1)], [x1, z1] = pts[Math.max(0, i - 1)]; const dx = x2 - x1, dz = z2 - z1, l = Math.hypot(dx, dz), nx = dz / l, nz = -dx / l;
    if (i) s += Math.hypot(x - pts[i - 1][0], z - pts[i - 1][1]); const g = ground(x, z), hh = 6.2 + Math.sin(Math.min(i, 23.5) / 24 * PI) * 2.4, ox = x + nx * 0.259, oz = z + nz * 0.259;
    P.push(ox, g + 5.72, oz, ox, g + hh - 0.12, oz); const u = 1 - s / total * 1.6; U.push(u, 0.07, u, 0.93); if (i) I.push(i * 2 - 2, i * 2 - 1, i * 2, i * 2 - 1, i * 2 + 1, i * 2); }
  const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(P, 3)); g.setAttribute('uv', new THREE.Float32BufferAttribute(U, 2)); g.setIndex(I); g.computeVertexNormals();
  const mt = wallMat('skyriver', 1, 1, { rough: 0.75 }); const m = new THREE.Mesh(g, mt); mt.side = THREE.DoubleSide; mt.map.wrapS = THREE.RepeatWrapping; m.receiveShadow = true; scene.add(m); WALLS.n++; WALLS.sky = m;
})();
