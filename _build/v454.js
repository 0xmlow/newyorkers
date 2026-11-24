/* ================================================================
   v454 THE EAST BEACH: GATE, TOUR, MAP, 36 ILLUSIONS (2026-11-24)
   A navy and gold gate on two iron posts at the north end of the east beach names it (N3W ILLUSION BEACH, SEVEN
   THINGS THAT ARE NOT THERE) with marquee bulbs that chase after dark; the map gets the beach; the tour walks it
   from the hollow face to the chair and stops dead on the Kanizsa footprints, so the triangle appears on screen;
   and the pier count goes to 36 ILLUSIONS.
   ================================================================ */
(function eastBeachGate() {
  if (!window.__EASTB || !EASTB.list.length) return;
  const P = eastAt(33, 112.5), at = (u, d) => [P.x + P.tx * u + P.nx * d, P.z + P.tz * u + P.nz * d];
  FACM.iron = FACM.iron || new THREE.MeshStandardMaterial({ color: 0x1d2b24, roughness: 0.55, metalness: 0.5 });
  [-2.1, 2.1].forEach(u => { const [x, z] = at(u, 0); facPut('iron', x, P.g + 1.9, z, 0.12, 3.8, 0.12, P.ry); post(x, z, 0.15, -5, 4); });
  const t = signTex([{ t: 'N3W ILLUSION BEACH', s: 0.42 }, { t: 'SEVEN THINGS THAT ARE NOT THERE', s: 0.17 }], 1024, 220, '#16233f', '#c9a24a');
  const [hx, hz] = at(0, 0); const hm = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 0.9), new THREE.MeshStandardMaterial({ map: t, roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide })); hm.position.set(hx, P.g + 3.55, hz); hm.rotation.y = P.ry; scene.add(hm);
  facPut('iron', hx, P.g + 4.03, hz, 4.4, 0.07, 0.1, P.ry); facPut('iron', hx, P.g + 3.07, hz, 4.4, 0.07, 0.1, P.ry); facFlush();
  const B = [], n = 22; for (let i = 0; i < n; i++) { const u = -2.1 + i * 4.2 / (n - 1); [4.03, 3.07].forEach(y => { const [x, z] = at(u, -0.07); B.push([x, P.g + y, z]); }); }
  const im = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false }), B.length), o = new THREE.Object3D(), c = new THREE.Color(0x3a3226);
  B.forEach((p, i) => { o.position.set(p[0], p[1], p[2]); o.updateMatrix(); im.setMatrixAt(i, o.matrix); im.setColorAt(i, c); }); scene.add(im); EASTB.bulbs = im; EASTB.bn = B.length;
  if (window.__MAP) { const m = eastAt(75, 118); MAP.places.push(['N3W ILLUSION BEACH', m.x, m.z, eastAt(75, 106).x, eastAt(75, 106).z]); }
  // the tour: along the beach, ending on the Kanizsa footprints
  try { const E3 = (deg, r, y) => { const q = eastAt(deg, r); return [q.x, q.g + y, q.z]; }, kz = eastAt(70, 120.5);
    const stop = { name: 'the illusion beach', dur: 14, pos: [E3(37, 112, 2.1), E3(70, 111.5, 1.65)], look: [E3(40, 120, 1.9), [kz.x, kz.g + 1.65 + 0.55, kz.z]] };
    [((window.__game && __game.TOUR) || TOUR), window.__TOURFULL].forEach(R => { if (!R) return; if (R.some(q => q.name === stop.name)) return; let k = R.findIndex(q => q.name === 'the sideshow row'); if (k < 0) k = R.findIndex(q => q.name === 'the n3w boardwalk'); R.splice(k >= 0 ? k + 1 : R.length - 1, 0, R === window.__TOURFULL ? stop : Object.assign({}, stop, { dur: 10 })); }); } catch (e) { }
  try { const s = SIGNS.find(q => q.lines && q.lines[0] && /^\d+ ILLUSIONS/.test(q.lines[0].t)); if (s) { s.lines[0].t = '36 ILLUSIONS · 577 CARDS · 472 ARTISTS'; signCanvas(s.lines, s.w, s.h, s.bg, s.fg, s.cv); s.t.needsUpdate = true; } } catch (e) { }
})();
window.__FRAMES.push(() => { try { if (!EASTB.bulbs) return; const k = Math.min(1, (L.lamps || 0) * 1.3), t = performance.now() / 1000, c = EASTB.c || (EASTB.c = new THREE.Color());
  for (let i = 0; i < EASTB.bn; i++) { const on = ((i >> 1) + Math.floor(t * 5)) % 3 === 0; const v = 0.23 + k * (on ? 1.6 : 0.5); c.setRGB(v * 1.0, v * 0.82, v * 0.55); EASTB.bulbs.setColorAt(i, c); } EASTB.bulbs.instanceColor.needsUpdate = true; } catch (e) { } });
