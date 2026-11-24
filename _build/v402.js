/* ================================================================
   v402 THE SIDESHOW ROW, AND THE SPINNING DANCER (2026-11-24)
   Coney Island's boardwalk had a row of sideshow boards; N3W CUTS gets three neighbours in the gaps between the beach
   billboards, each a navy board with a gold rule on two iron posts and a cast header. The first: a black dancer
   turns on one toe in front of a lit panel, one leg out, one arm up. Which way is it turning? Watch long enough
   and it reverses on you, though nothing changes: a silhouette carries no depth, so your brain picks a direction
   and sometimes changes its mind (the kinetic depth effect; Nobuyuki Kayahara's 2003 dancer made it famous).
   booth(angle, title, line) is shared by v403 and v404. ?sideshow=0 off.
   ================================================================ */
const SIDE = { ok: false, list: [] };
window.__SIDE = SIDE;
function sideBooth(deg, title, line) {
  const a = deg * PI / 180, R = 109.6, x = Math.sin(a) * R, z = Math.cos(a) * R, g = ground(x, z), nx = -Math.sin(a), nz = -Math.cos(a), ry = Math.atan2(nx, nz), tx = nz, tz = -nx;
  const at = (u, d) => [x + tx * u + nx * d, z + tz * u + nz * d];
  const navy = new THREE.MeshStandardMaterial({ color: 0x16233f, roughness: 0.55, metalness: 0.2 });
  const back = new THREE.Mesh(new THREE.BoxGeometry(2.3, 2.7, 0.08), navy); back.position.set(x, g + 1.75, z); back.rotation.y = ry; back.castShadow = true; scene.add(back);
  [-1.2, 1.2].forEach(u => { const [px, pz] = at(u, -0.02); facPut('frameK', px, g + 1.6, pz, 0.1, 3.2, 0.1, ry); post(px, pz, 0.12, -5, 3.3); });
  const [hx, hz] = at(0, 0.06); const ht = signTex([{ t: title, s: 0.42 }, { t: line, s: 0.16 }], 1024, 256, '#16233f', '#c9a24a');
  const hm = new THREE.Mesh(new THREE.PlaneGeometry(2.3, 0.575), new THREE.MeshStandardMaterial({ map: ht, roughness: 0.4, metalness: 0.3 })); hm.position.set(hx, g + 3.42, hz); hm.rotation.y = ry; scene.add(hm);
  facPut('frameK', hx, g + 3.72, hz - nz * 0.04, 2.45, 0.06, 0.12, ry); facPut('frameK', hx, g + 3.12, hz - nz * 0.04, 2.45, 0.06, 0.12, ry);
  const gold = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.35, metalness: 0.9 }); [[0, 3.08, 2.3, 0.03], [0, 0.42, 2.3, 0.03], [-1.13, 1.75, 0.03, 2.66], [1.13, 1.75, 0.03, 2.66]].forEach(([u, y, w, h]) => { const [qx, qz] = at(u, 0.045); const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), gold); m.position.set(qx, g + y, qz); m.rotation.y = ry; scene.add(m); });
  facFlush(); const B = { x, z, g, ry, nx, nz, tx, tz, at }; SIDE.list.push(B); return B;
}
(function spinningDancer() {
  if (!LOOK.on || /sideshow=0/.test(location.search)) return;
  const B = sideBooth(233, 'WHICH WAY IS IT TURNING?', 'WATCH IT FOR A WHILE. IT WILL CHANGE ITS MIND.');
  const [px, pz] = B.at(0, 0.05); const panel = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.4), new THREE.MeshBasicMaterial({ color: 0xf3ead2, toneMapped: false })); panel.position.set(px, B.g + 1.8, pz); panel.rotation.y = B.ry; scene.add(panel);
  const blk = new THREE.MeshBasicMaterial({ color: 0x050505 }), D = new THREE.Group(), cap = (r0, r1, L, x0, y0, z0, rx, rz) => { const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, L, 12), blk); m.position.set(x0, y0, z0); m.rotation.set(rx || 0, 0, rz || 0); D.add(m); return m; };
  cap(0.045, 0.06, 0.82, 0, 0.42, 0); const k = new THREE.Mesh(new THREE.SphereGeometry(0.06, 10, 8), blk); k.position.y = 0.84; D.add(k);
  cap(0.04, 0.065, 0.8, 0.3, 0.98, 0.05, 0, -1.25);                       // the raised leg, out to one side
  cap(0.11, 0.15, 0.56, 0, 1.13, 0); cap(0.05, 0.11, 0.16, 0, 0.88, 0);     // torso and hips
  const hd = new THREE.Mesh(new THREE.SphereGeometry(0.105, 14, 12), blk); hd.position.set(0, 1.55, 0); hd.scale.set(0.9, 1.1, 1); D.add(hd);
  const bun = new THREE.Mesh(new THREE.SphereGeometry(0.055, 10, 8), blk); bun.position.set(-0.02, 1.66, -0.07); D.add(bun);
  cap(0.025, 0.035, 0.6, -0.1, 1.62, 0.02, 0, 0.35);                      // one arm over the head
  cap(0.025, 0.035, 0.58, 0.34, 1.33, 0.02, 0, -1.35);                    // one arm out
  const [dx, dz] = B.at(0, 0.7); D.position.set(dx, B.g + 0.62, dz); D.scale.setScalar(1.05); scene.add(D); SIDE.dancer = D;
  const plinth = new THREE.Mesh(new THREE.CylinderGeometry(0.35, 0.4, 0.6, 32), new THREE.MeshStandardMaterial({ color: 0x16233f, roughness: 0.5 })); plinth.position.set(dx, B.g + 0.3, dz); scene.add(plinth); post(dx, dz, 0.4, -5, 1.0);
  SIDE.ok = true; SIDE.dancerB = B;
  if (window.__MAP) MAP.places.push(['THE SPINNING DANCER', B.x, B.z, ...B.at(0, 3)]);
})();
window.__FRAMES.push(dt => { try { if (SIDE.dancer) SIDE.dancer.rotation.y += dt * PI * 2 * 0.42; } catch (e) { } });
