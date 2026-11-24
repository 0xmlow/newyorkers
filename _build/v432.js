/* ================================================================
   v432 SIX BOARDS, 29 ILLUSIONS (2026-11-24)
   The floating disc gets its marquee bulbs like the other five, the full tour's sideshow stop walks all six, and the
   pier count reads 29 ILLUSIONS.
   ================================================================ */
(function sideSix() {
  if (!window.__SIDE || SIDE.list.length < 6) return; const B = SIDE.list[SIDE.list.length - 1];
  try { if (SIDE.bulbs) { const extra = []; for (let i = 0; i < 14; i++) { const u = -1.12 + i * 2.24 / 13; [3.72, 3.12].forEach(y => { const [x, z] = B.at(u, 0.1); extra.push([x, B.g + y, z]); }); }
    const im = new THREE.InstancedMesh(SIDE.bulbs.geometry, SIDE.bulbs.material, SIDE.bn + extra.length), M = new THREE.Matrix4(), o = new THREE.Object3D(), c = new THREE.Color(0x3a3226);
    for (let i = 0; i < SIDE.bn; i++) { SIDE.bulbs.getMatrixAt(i, M); im.setMatrixAt(i, M); im.setColorAt(i, c); } extra.forEach((p, j) => { o.position.set(p[0], p[1], p[2]); o.updateMatrix(); im.setMatrixAt(SIDE.bn + j, o.matrix); im.setColorAt(SIDE.bn + j, c); });
    im.instanceMatrix.needsUpdate = true; scene.remove(SIDE.bulbs); scene.add(im); SIDE.bulbs = im; SIDE.bn += extra.length; } } catch (e) { }
  try { const L = SIDE.list.slice().sort((a, b) => Math.atan2(a.x, a.z) - Math.atan2(b.x, b.z)), p = (Q, d) => { const q = Q.at(0, d); return [q[0], Q.g + 1.7, q[1]]; }, l = Q => { const q = Q.at(0, 0); return [q[0], Q.g + 1.8, q[1]]; };
    if (window.__TOURFULL) { const s = __TOURFULL.find(q => q.name === 'the sideshow row'); if (s) { s.pos = L.map(Q => p(Q, 4.5)); s.look = L.map(l); s.dur = 18; } } } catch (e) { }
  try { const s = SIGNS.find(q => q.lines && q.lines[0] && /^\d+ ILLUSIONS/.test(q.lines[0].t)); if (s) { s.lines[0].t = '29 ILLUSIONS · 577 CARDS · 472 ARTISTS'; signCanvas(s.lines, s.w, s.h, s.bg, s.fg, s.cv); s.t.needsUpdate = true; } } catch (e) { }
})();
