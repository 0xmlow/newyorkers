/* ================================================================
   v349 A BIRTHDAY ON THE LAWN (2026-11-24)
   On the east lawn picnic table by the hollow eye, somebody's birthday: a scanned tea set, a carrot cake and a
   strawberry chocolate cake, a cassette player, and a bunch of balloons in the island's colours tied to the table,
   bobbing in the wind. ?props=0 off.
   ================================================================ */
const BDAY = { b: [] };
window.__BDAY = BDAY;
(function birthday() {
  if (!PH.on) return; const x = 17.5, z = -7.5, g = ground(x, z), ty = g + 0.78; BDAY.P = [x, g, z];
  phPlace('isl_teaset', [[x - 0.3, ty, z, 0.2, 0.9]], { shadow: false }); phPlace('isl_cake', [[x + 0.35, ty, z + 0.05, 0, 1]], { shadow: false }); phPlace('isl_cake2', [[x + 0.75, ty, z - 0.1, 0, 1]], { shadow: false });
  phPlace('isl_cassette', [[x - 0.85, ty, z + 0.1, 0.5, 1]], { shadow: false });
  const cols = [0x2962FF, 0x08DEFF, 0xff3fa4, 0xefe8da, 0x2962FF, 0xff3fa4];
  cols.forEach((col, i) => { const b = new THREE.Mesh(new THREE.SphereGeometry(0.17, 16, 12), new THREE.MeshStandardMaterial({ color: col, roughness: 0.25, metalness: 0.05 })); b.scale.y = 1.15; scene.add(b);
    const s = new THREE.Mesh(new THREE.CylinderGeometry(0.003, 0.003, 1, 4), new THREE.MeshBasicMaterial({ color: 0xffffff })); scene.add(s); BDAY.b.push({ b, s, ph: i * 1.1, ox: (i % 3 - 1) * 0.28, oz: (i > 2 ? 0.2 : -0.15) }); });
})();
window.__FRAMES.push(() => { try { if (!BDAY.P) return; const [x, g, z] = BDAY.P, ax = x + 1.0, ay = g + 0.8, az = z; BDAY.b.forEach(o => { const t = LIFE.t + o.ph, bx = ax + o.ox + Math.sin(t * 0.9) * 0.15, by = g + 2.3 + Math.sin(t * 1.3) * 0.06 + (o.oz > 0 ? 0.25 : 0), bz = az + o.oz + Math.cos(t * 0.7) * 0.12;
  o.b.position.set(bx, by, bz); const dx = bx - ax, dy = by - 0.17 - ay, dz = bz - az, L0 = Math.hypot(dx, dy, dz); o.s.position.set((bx + ax) / 2, (by - 0.17 + ay) / 2, (bz + az) / 2); o.s.scale.y = L0; o.s.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), new THREE.Vector3(dx, dy, dz).normalize()); }); } catch (e) { } });
