/* ================================================================
   v219 THE LOOK: THE SKATE PLAZA (2026-11-23)
   The skate spot was a bare pad with one ledge, a kicker and a rail. It grows into a plaza: a second slab along
   its side with a steel edged quarter pipe, a manual pad with angle iron edges, a three stair block with a
   handrail, and a bank. The old ledge gets wax and black grind marks down its coping, the pad gets a red painted
   curb along its edge, there are stickers on the rail post, and a park bench where the ones who are not skating
   sit. The skaters keep their lines on the old pad; the new pieces are for looking at (and walking round).
   ?plaza=0 turns it off.
   ================================================================ */
const SK2 = {};
window.__SK2 = SK2;
(function skatePlaza() {
  if (!FAC_ON || /plaza=0/.test(location.search) || !window.__SK || !SK.L2W) return;
  const L2W = SK.L2W, g0 = SK.g0, ry = SK.ry;
  const put = (key, u, v, y, su, sy, sv) => { const [x, z] = L2W(u, v); facPut(key, x, g0 + y, z, su, sy, sv, ry); };
  FACM.skConc = FACM.skConc || new THREE.MeshStandardMaterial({ color: 0x9a968e, roughness: 0.72 });
  FACM.skConcD = FACM.skConcD || new THREE.MeshStandardMaterial({ color: 0x7c7972, roughness: 0.8 });
  FACM.wax = FACM.wax || new THREE.MeshStandardMaterial({ color: 0x15140f, roughness: 0.25, transparent: true, opacity: 0.6, depthWrite: false });
  FACM.redCurb = FACM.redCurb || new THREE.MeshStandardMaterial({ color: 0xa8332a, roughness: 0.7 });
  FACM.angle = FACM.angle || new THREE.MeshStandardMaterial({ color: 0x8a8d90, roughness: 0.35, metalness: 0.85 });
  // ---- the second slab along v 5 .. 11
  const V0 = 5.0, V1 = 11.0;
  put('skConcD', 0, (V0 + V1) / 2, 0.0, 16, 0.12, V1 - V0);
  for (let u = -6; u <= 6.01; u += 4) put('concJ', u, (V0 + V1) / 2, 0.065, 0.03, 0.01, V1 - V0 - 0.1);
  put('concJ', 0, 8, 0.065, 15.9, 0.01, 0.03);
  // red curb along the old pad's other edge
  put('redCurb', 0, -5.06, 0.1, 16.1, 0.2, 0.14);
  // ---- the quarter pipe at the far edge, its lip a steel coping
  { const R = 1.6, Wd = 5.2, sh = new THREE.Shape(); sh.moveTo(0, 0); for (let i = 0; i <= 12; i++) { const a = i / 12 * PI / 2; sh.lineTo(R - Math.cos(a) * R + 0.0, R - Math.sin(a) * R); }
    // the curve runs from the floor (0,0)... build as: floor point (0,0) -> lip (R, R) -> back (R+0.3, R) -> (R+0.3, 0)
    const s2 = new THREE.Shape(); s2.moveTo(0, 0); for (let i = 0; i <= 14; i++) { const a = i / 14 * PI / 2; s2.lineTo(R * Math.sin(a), R - R * Math.cos(a)); } s2.lineTo(R + 0.35, R); s2.lineTo(R + 0.35, 0); s2.closePath();
    const geo = new THREE.ExtrudeGeometry(s2, { depth: Wd, bevelEnabled: false, curveSegments: 14 }); geo.translate(0, 0, -Wd / 2);
    const m = new THREE.Mesh(geo, FACM.skConc); const [qx, qz] = L2W(1.5, V1 - R - 0.4); m.position.set(qx, g0 + 0.06, qz); m.rotation.y = ry - PI / 2; m.castShadow = m.receiveShadow = true; scene.add(m); SK2.qp = m;
    // coping pipe along the lip, deck plate behind
    const cop = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, Wd, 10), FACM.angle); const [cx, cz] = L2W(1.5, V1 - 0.4); cop.position.set(cx, g0 + 0.06 + R, cz); cop.rotation.set(0, ry, PI / 2); scene.add(cop);
    put('angle', 1.5, V1 - 0.22, R + 0.05, Wd, 0.02, 0.36);
    boxWalls(...L2W(1.5, V1 - 1.2), Wd, 1.6, ry, -1, g0 + R); }
  // ---- a manual pad with angle iron edges
  { const u0 = -4.6, v0 = 7.2; put('skConc', u0, v0, 0.2, 3.2, 0.3, 1.4); put('angle', u0, v0 - 0.7, 0.35, 3.2, 0.03, 0.03); put('angle', u0, v0 + 0.7, 0.35, 3.2, 0.03, 0.03);
    put('wax', u0, v0 - 0.69, 0.368, 2.6, 0.004, 0.06); boxWalls(...L2W(u0, v0), 3.2, 1.4, ry, -1, g0 + 0.35); }
  // ---- a three stair block with a handrail (up from the slab to a little deck and down the other side)
  { const u0 = 5.6, v0 = 7.6;
    for (let i = 0; i < 3; i++) put('skConc', u0 - 1.2 + i * 0.32, v0, 0.12 + i * 0.16 / 2 + 0.04, 2.4 - i * 0.64, 0.16 * (i + 1), 2.0);
    put('skConc', u0 + 0.6, v0, 0.32, 1.2, 0.48, 2.0);
    // the rail down the steps
    const [ax, az] = L2W(u0 - 1.4, v0), [bx, bz] = L2W(u0 - 0.1, v0); facBar(FACM.angle, new THREE.Vector3(ax, g0 + 0.82, az), new THREE.Vector3(bx, g0 + 1.3, bz), 0.05, 0.05);
    [[u0 - 1.3, 0.8], [u0 - 0.2, 1.28]].forEach(([u, h]) => put('angle', u, v0, h / 2, 0.05, h, 0.05)); put('angle', u0 + 0.6, v0, 1.3, 1.2, 0.05, 0.05); put('angle', u0 + 1.18, v0, 0.9, 0.05, 0.8, 0.05);
    boxWalls(...L2W(u0, v0), 3.0, 2.0, ry, -1, g0 + 0.5); }
  // ---- a bank against the slab's end
  { const geo = new THREE.BoxGeometry(2.4, 0.9, 3.0); const p = geo.attributes.position; for (let i = 0; i < p.count; i++) if (p.getY(i) > 0 && p.getX(i) < 0) p.setY(i, -0.45); p.needsUpdate = true; geo.computeVertexNormals();
    const m = new THREE.Mesh(geo, FACM.skConc); const [x, z] = L2W(-7.0, 7.8); m.position.set(x, g0 + 0.5, z); m.rotation.y = ry + PI; m.castShadow = m.receiveShadow = true; scene.add(m); boxWalls(x, z, 2.4, 3.0, ry, -1, g0 + 0.9); }
  // ---- wax and grind marks on the old ledge, stickers on the rail legs
  put('wax', 1.5, -2.33, 0.512, 4.6, 0.004, 0.08); put('wax', 1.5, -2.3, 0.4, 4.4, 0.18, 0.004);
  for (let i = 0; i < 9; i++) put('wax', -0.3 + Math.random() * 3.6, -2.29, 0.25 + Math.random() * 0.2, 0.2 + Math.random() * 0.5, 0.01, 0.003);
  const stick = ['#2962FF', '#ff3fa4', '#f2d230', '#efe8da'];
  [-1, 3].forEach(u => stick.forEach((col, i) => { const [x, z] = L2W(u + (i % 2 ? 0.02 : -0.02), 2.8); facPut('white', x, g0 + 0.1 + i * 0.07, z, 0.055, 0.05, 0.055, ry, col); }));
  // ---- the bench for the ones who are not skating
  FACM.benchW = FACM.benchW || new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.75 }); FACM.iron = FACM.iron || new THREE.MeshStandardMaterial({ color: 0x1d2b24, roughness: 0.55, metalness: 0.5 });
  { const u0 = -1.5, v0 = 10.3; for (let k = 0; k < 3; k++) put('benchW', u0, v0 + (k - 1) * 0.12, 0.45, 2.0, 0.04, 0.1); for (let k = 0; k < 2; k++) put('benchW', u0, v0 + 0.22, 0.62 + k * 0.14, 2.0, 0.1, 0.04);
    [-0.8, 0.8].forEach(d => { put('iron', u0 + d, v0, 0.22, 0.06, 0.44, 0.4); }); boxWalls(...L2W(u0, v0), 2.0, 0.5, ry, -1, g0 + 0.5); }
  facFlush();
  SK2.ok = true;
})();
