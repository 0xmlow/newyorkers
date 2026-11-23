/* ================================================================
   v175 THE LOOK: THE NEXT THREE (2026-11-23)
   - THE COLOSSUS PEDESTAL: the plain sandstone block in the harbour becomes a pedestal in the manner of the one
     under Liberty: a stepped granite plinth, rusticated lower courses, corner piers and pilasters on every face,
     a loggia band of dark openings between little columns near the top, and a heavy cornice with dentils.
   - SURVIVE: the two long concrete walls get board form buttresses every six metres, a coping, and steel
     scuppers with rust running down the concrete under each one.
   - THE BELL TOWER: the clapboard shaft gets corner boards, a water table, a belt course, tall louvred openings
     with pediment caps on three sides and a pedimented surround on the door.
   Same instanced kit as v173; ?facades=0 turns it off.
   ================================================================ */
FACM.sand = new THREE.MeshStandardMaterial({ color: 0xd9c7a6, roughness: 0.85 });
FACM.sandD = new THREE.MeshStandardMaterial({ color: 0xa8977c, roughness: 0.9 });
FACM.void = new THREE.MeshStandardMaterial({ color: 0x0c0d10, roughness: 0.9 });
FACM.conc = new THREE.MeshStandardMaterial({ color: 0x57524a, roughness: 0.92 });
FACM.concJ = new THREE.MeshStandardMaterial({ color: 0x2c2924, roughness: 0.95 });
FACM.rust = new THREE.MeshStandardMaterial({ color: 0x5a3a24, roughness: 0.95, transparent: true, opacity: 0.55, depthWrite: false });
FACM.white = new THREE.MeshStandardMaterial({ color: 0xf4f2ec, roughness: 0.6 });
FACM.louv = new THREE.MeshStandardMaterial({ color: 0x2f3a3a, roughness: 0.6, metalness: 0.2 });
const FAC3 = {};
window.__FAC3 = FAC3;
(function nextThree() {
  if (!FAC_ON) return;
  // ---------------- the pedestal: 28 x 28 x 16 at (58, 262), turned to face the island
  { const ox = 58, oz = 262, ry = Math.atan2(-ox, 180 - oz), S = 28, Hb = 16;
    for (let k = 0; k < 4; k++) { const a = ry + k * PI / 2, F = facFace(ox, oz, Math.sin(a), Math.cos(a), S / 2);
      F.at(0, 1.0, 0.9, S + 1.8, 2.0, 1.8, 'sandD'); F.at(0, 2.3, 0.45, S + 0.9, 0.6, 0.9, 'sand');                         // stepped plinth
      for (let y = 3.0; y < 7.2; y += 0.7) F.at(0, y, 0.06, S + 0.12, 0.58, 0.12, 'sand');                                  // rustication
      F.at(0, 7.4, 0.14, S + 0.3, 0.35, 0.28, 'sandD');                                                                     // string course
      [-1, 1].forEach(s => F.at(s * (S / 2 - 1.3), 11.5, 0.35, 2.6, 8.2, 0.7, 'sand'));                                     // corner piers
      [-6.5, 6.5].forEach(u => F.at(u, 11.5, 0.18, 1.1, 8.2, 0.36, 'sand'));                                                 // pilasters
      // the loggia: dark openings between small columns, near the top
      for (let i = 0; i < 4; i++) { const u0 = -4.9 + i * 3.27; F.at(u0, 12.6, 0.02, 2.2, 2.6, 0.04, 'void'); F.at(u0, 14.0, 0.12, 2.5, 0.2, 0.24, 'sand'); F.at(u0, 11.2, 0.12, 2.5, 0.2, 0.3, 'sand'); }
      for (let i = 0; i <= 4; i++) { const u = -6.5 + i * 3.27; if (i > 0 && i < 4) F.at(u, 12.6, 0.2, 0.34, 2.8, 0.34, 'sandD'); }
      F.at(0, Hb - 0.75, 0.05, S + 0.1, 0.9, 0.1, 'sand'); for (let u = -S / 2 + 0.2; u <= S / 2 - 0.1; u += 0.36) F.at(u, Hb - 0.2, 0.12, 0.18, 0.2, 0.24, 'sand');
      for (let u = -S / 2 + 0.6; u <= S / 2 - 0.4; u += 1.4) F.at(u, Hb - 0.55, 0.26, 0.26, 0.7, 0.5, 'sandD');
      [-9.5, 9.5].forEach(u => { F.at(u, 10.5, 0.03, 3.2, 4.6, 0.06, 'sandD'); F.at(u, 10.5, 0.06, 2.4, 3.8, 0.04, 'sand'); });   // sunk panels
    }
    FAC3.ped = true; }
  // ---------------- SURVIVE: walls along x 22 to 66 at z 40.2 and 47.8, 6.4 m tall
  { const gB = ground(44, 44) + 0.02, y0 = 0.6, y1 = 7.0;
    [[39.9, -1], [48.1, 1]].forEach(([zf, s]) => {
      for (let x = 25; x <= 63; x += 6) { facPut('conc', x, (y0 + y1 - 0.6) / 2, zf + s * 0.35, 0.7, y1 - 0.6 - y0, 0.7); facPut('conc', x, y0 + 1.0, zf + s * 0.75, 0.75, 2.0, 0.8); facPut('conc', x, y1 - 0.4, zf + s * 0.32, 0.8, 0.25, 0.68); }
      facPut('conc', 44, y1 + 0.1, zf + s * 0.05, 44.4, 0.2, 0.45);
      for (let x = 28; x <= 60; x += 6) { facPut('steel', x, y1 - 0.75, zf + s * 0.18, 0.22, 0.14, 0.4); facPut('rust', x, y1 - 0.85 - 1.3, zf + s * 0.012, 0.3, 2.6, 0.01); }
      for (let x = 22.5; x < 66; x += 1.2) facPut('concJ', x, (y0 + y1) / 2, zf + s * 0.012, 0.04, y1 - y0 - 0.2, 0.02);   // board form joints
    });
    FAC3.survive = true; }
  // ---------------- the bell tower: S 3.2, shaft 9 m, door on -x
  if (window.__BELLS && BELLS.g0 != null) { const X = BELLS.X, Z = BELLS.Z, g0 = BELLS.g0, S = 3.2, H1 = 9;
    for (let k = 0; k < 4; k++) { const a = k * PI / 2, F = facFace(X, Z, Math.sin(a), Math.cos(a), S / 2);
      [-1, 1].forEach(s => F.at(s * (S / 2 - 0.09), g0 + H1 / 2, 0.03, 0.22, H1, 0.06, 'white'));
      F.at(0, g0 + 0.3, 0.04, S + 0.1, 0.6, 0.1, 'white'); F.at(0, g0 + 0.62, 0.07, S + 0.16, 0.08, 0.16, 'white'); F.at(0, g0 + 4.6, 0.04, S + 0.1, 0.22, 0.1, 'white');
      const door = Math.abs(Math.sin(a) + 1) < 1e-6;   // the -x face
      if (!door) { const y = g0 + 6.6; F.at(0, y, 0.015, 0.9, 2.2, 0.02, 'louv'); for (let j = 0; j < 9; j++) F.at(0, y - 0.95 + j * 0.24, 0.05, 0.86, 0.05, 0.08, 'louv');
        [-1, 1].forEach(s => F.at(s * 0.53, y, 0.05, 0.16, 2.4, 0.1, 'white')); F.at(0, y - 1.2, 0.08, 1.3, 0.1, 0.18, 'white'); F.at(0, y + 1.25, 0.06, 1.3, 0.14, 0.12, 'white');
        const pg = new THREE.Shape(); pg.moveTo(-0.75, 0); pg.lineTo(0.75, 0); pg.lineTo(0, 0.42); pg.closePath(); const pm = new THREE.Mesh(new THREE.ExtrudeGeometry(pg, { depth: 0.12, bevelEnabled: false }), FACM.white);
        pm.position.set(X + Math.sin(a) * (S / 2), y + 1.32, Z + Math.cos(a) * (S / 2)); pm.rotation.y = a; pm.castShadow = true; scene.add(pm); }
      else { [-1, 1].forEach(s => F.at(s * 0.72, g0 + 1.2, 0.06, 0.22, 2.4, 0.12, 'white')); F.at(0, g0 + 2.5, 0.08, 1.7, 0.2, 0.18, 'white');
        const pg = new THREE.Shape(); pg.moveTo(-0.95, 0); pg.lineTo(0.95, 0); pg.lineTo(0, 0.5); pg.closePath(); const pm = new THREE.Mesh(new THREE.ExtrudeGeometry(pg, { depth: 0.16, bevelEnabled: false }), FACM.white);
        pm.position.set(X - S / 2, g0 + 2.6, Z); pm.rotation.y = a; pm.castShadow = true; scene.add(pm); }
    }
    FAC3.bells = true; }
  facFlush();
  if (typeof weathMat === 'function') [FACM.sand, FACM.sandD, FACM.conc].forEach(m => { try { weathMat(m); } catch (e) { } });
})();
