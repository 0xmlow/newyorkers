/* ================================================================
   v418 THE SIDESHOW ROW, FIVE BOARDS (2026-11-24)
   The two new boards get bulbs and painted backs like the first three, the sideshow tour stop now walks all five,
   and the pier count reads 28 ILLUSIONS.
   ================================================================ */
(function sideFive() {
  if (!window.__SIDE) return; try { if (SIDE.backs) SIDE.backs(); } catch (e) { }
  try { if (SIDE.bulbs && SIDE.list.length > 3) { const extra = []; SIDE.list.slice(3).forEach(B => { for (let i = 0; i < 14; i++) { const u = -1.12 + i * 2.24 / 13; [3.72, 3.12].forEach(y => { const [x, z] = B.at(u, 0.1); extra.push([x, B.g + y, z]); }); } });
    const im = new THREE.InstancedMesh(SIDE.bulbs.geometry, SIDE.bulbs.material, SIDE.bn + extra.length), M = new THREE.Matrix4(), o = new THREE.Object3D(), c = new THREE.Color(0x3a3226);
    for (let i = 0; i < SIDE.bn; i++) { SIDE.bulbs.getMatrixAt(i, M); im.setMatrixAt(i, M); im.setColorAt(i, c); } extra.forEach((p, j) => { o.position.set(p[0], p[1], p[2]); o.updateMatrix(); im.setMatrixAt(SIDE.bn + j, o.matrix); im.setColorAt(SIDE.bn + j, c); });
    im.instanceMatrix.needsUpdate = true; scene.remove(SIDE.bulbs); scene.add(im); SIDE.bulbs = im; SIDE.bn += extra.length; } } catch (e) { console.warn('v418', e); }
  try { const T = (window.__game && __game.TOUR) || TOUR, L = SIDE.list.slice().sort((a, b) => Math.atan2(a.x, a.z) - Math.atan2(b.x, b.z)), p = (B, d) => { const q = B.at(0, d); return [q[0], B.g + 1.7, q[1]]; }, l = B => { const q = B.at(0, 0); return [q[0], B.g + 1.8, q[1]]; };
    [T, window.__TOURFULL].forEach(R => { if (!R) return; const s = R.find(q => q.name === 'the sideshow row'); if (s) { s.pos = L.map(B => p(B, 4.5)); s.look = L.map(l); s.dur = 16; } }); } catch (e) { }
  try { const s = SIGNS.find(q => q.lines && q.lines[0] && /^\d+ ILLUSIONS/.test(q.lines[0].t)); if (s) { s.lines[0].t = '28 ILLUSIONS · 577 CARDS · 472 ARTISTS'; signCanvas(s.lines, s.w, s.h, s.bg, s.fg, s.cv); s.t.needsUpdate = true; } } catch (e) { }
})();
