/* ================================================================
   v176 THE LOOK: STREET STRUCTURES (2026-11-23)
   - THE WELCOME BILLBOARD at the head of the pier, the first thing you see when you land: no longer a board on two
     posts but a real New York billboard: a steel frame round the image, a catwalk with a railing along its foot,
     gooseneck lamps that come on at dusk, steel stringers across its back, and steel jackets and kickers on the
     legs.
   - THE OPEN WALL: the plywood hoarding gets the most New York thing there is, a green sidewalk shed in front of
     it (posts, beams, a deck, a fascia and bulbs underneath) and stud framing with raking braces behind.
   - THE LIGHTHOUSE: the vault floor gets a bronze portal round the PORT door, steel bands round its walls, a stone
     plinth course and steps up to the platform.
   ?facades=0 turns it off.
   ================================================================ */
FACM.green = new THREE.MeshStandardMaterial({ color: 0x2b4a32, roughness: 0.6, metalness: 0.2 });
FACM.stud = new THREE.MeshStandardMaterial({ color: 0x9a7a52, roughness: 0.85 });
FACM.bulb = new THREE.MeshStandardMaterial({ color: 0x2a2620, roughness: 0.3, emissive: 0xffd9a0, emissiveIntensity: 0 });
const FAC4 = {};
window.__FAC4 = FAC4;
(function streetStructures() {
  if (!FAC_ON) return;
  // ---------------- the welcome billboard: 16 x 9 image at z 117.2 facing +z, centre height by
  { const by = ground(0, 117) + 4.4 + 4.5, zf = 117.2, bot = by - 4.7;
    [[-8.1, 0, 0.25, 9.6], [8.1, 0, 0.25, 9.6], [0, 4.6, 16.45, 0.25], [0, -4.6, 16.45, 0.25]].forEach(([x, y, w, h]) => facPut('steel', x, by + y, zf + 0.05, w, h, 0.2));
    // catwalk, brackets, railing
    facPut('steel', 0, bot - 0.15, zf + 0.6, 16.6, 0.06, 1.1); facPut('steel', 0, bot - 0.22, zf + 1.13, 16.6, 0.14, 0.05);
    for (let x = -7.6; x <= 7.61; x += 2.53) { facPut('steel', x, bot - 0.5, zf + 0.55, 0.08, 0.08, 1.0); }
    facPut('steel', 0, bot + 0.85, zf + 1.12, 16.6, 0.05, 0.05); facPut('steel', 0, bot + 0.38, zf + 1.12, 16.6, 0.04, 0.04);
    for (let x = -8.2; x <= 8.21; x += 1.64) facPut('steel', x, bot + 0.36, zf + 1.12, 0.05, 1.0, 0.05);
    // gooseneck lamps
    for (let i = 0; i < 6; i++) { const x = -6.9 + i * 2.76; facPut('steel', x, bot + 0.75, zf + 1.0, 0.05, 1.5, 0.05); facPut('steel', x, bot + 1.5, zf + 1.2, 0.05, 0.05, 0.45); facPut('steel', x, bot + 1.42, zf + 1.45, 0.36, 0.14, 0.3); facPut('bulb', x, bot + 1.34, zf + 1.45, 0.3, 0.02, 0.24); }
    // stringers on the back, jackets and kickers on the legs
    [by - 3, by, by + 3].forEach(y => facPut('steel', 0, y, 116.78, 16.2, 0.3, 0.12));
    for (let x = -6; x <= 6.01; x += 3) facPut('steel', x, by, 116.76, 0.18, 9.2, 0.1);
    [-7.6, 7.6].forEach(x => { [[0.28, 0], [-0.28, 0]].forEach(([dx]) => facPut('steel', x + dx, (by + 4.5) / 2 - 0.4, 116.8, 0.06, by + 4.5, 0.6));
      facBar(FACM.steel, new THREE.Vector3(x, bot - 0.6, 116.5), new THREE.Vector3(x, ground(x, 113.6) + 0.05, 113.6), 0.16, 0.16);
      facPut('stoneD', x, ground(x, 116.8) + 0.2, 116.8, 1.0, 0.4, 1.0); facPut('stoneD', x, ground(x, 113.6) + 0.12, 113.6, 0.6, 0.24, 0.6); });
    FAC4.billboard = true; }
  // ---------------- the OPEN WALL: hoarding x -58.5 to -43.5, front face z -34.05, 5.2 m tall
  { const wg = ground(-51, -34), zf = -34.05, zs = -31.1, dh = wg + 5.65;
    for (let x = -58.2; x <= -43.7; x += 2.42) { facPut('green', x, (wg + dh) / 2, zs, 0.16, dh - wg, 0.16); facPut('green', x, wg + 0.06, zs, 0.4, 0.12, 0.4); facPut('green', x, dh - 0.25, (zf + zs) / 2, 0.14, 0.2, zs - zf); if (typeof post === 'function') post(x, zs, 0.14); }
    facPut('green', -51, dh - 0.25, zs, 15.2, 0.24, 0.16);
    facPut('stud', -51, dh, (zf + zs) / 2, 15.4, 0.12, zs - zf + 0.3); facPut('green', -51, dh + 0.42, zs + 0.15, 15.5, 0.75, 0.06); facPut('green', -51, dh + 0.42, zf - 0.05, 15.5, 0.75, 0.06);
    [-1, 1].forEach(s => facPut('green', -51 + s * 7.75, dh + 0.42, (zf + zs) / 2, 0.06, 0.75, zs - zf + 0.2));
    for (let x = -57; x <= -45; x += 2.42) facPut('bulb', x + 1.2, dh - 0.12, (zf + zs) / 2 + 0.6, 0.18, 0.12, 0.18);
    // the fascia's permit board
    const pc = signTex([{ t: 'SIDEWALK SHED', s: 0.32 }, { t: 'PERMIT 420 · POST NO BILLS', s: 0.16 }], 1024, 256, '#2b4a32', '#efe8da');
    const pb = new THREE.Mesh(new THREE.PlaneGeometry(3.4, 0.62), new THREE.MeshStandardMaterial({ map: pc, roughness: 0.7 })); pb.position.set(-51, dh + 0.42, zs + 0.19); scene.add(pb);
    // stud framing and raking braces behind
    for (let x = -58.4; x <= -43.6; x += 0.61) facPut('stud', x, wg + 2.6, -34.42, 0.05, 5.2, 0.14);
    [wg + 0.3, wg + 2.6, wg + 4.95].forEach(y => facPut('stud', -51, y, -34.5, 15.1, 0.14, 0.05));
    for (let x = -57.5; x <= -44.4; x += 3.25) facBar(FACM.stud, new THREE.Vector3(x, wg + 3.9, -34.56), new THREE.Vector3(x, wg + 0.04, -37.0), 0.12, 0.06);
    FAC4.shed = true; }
  // ---------------- the lighthouse vault floor: w 16, d 8, rh 5.6 at (0, -126), floor g0 0.9
  if (typeof LH !== 'undefined' && LH.g != null) { const { x, z, w, d } = LH, g0 = LH.g, rh = 5.6;
    const Fr = facFace(x, z, 0, 1, d / 2), L = facFace(x, z, -1, 0, w / 2), R = facFace(x, z, 1, 0, w / 2);
    [-1, 1].forEach(s => Fr.at(s * 2.35, g0 + 1.85, 0.12, 0.3, 3.7, 0.3, 'bronze')); Fr.at(0, g0 + 3.6, 0.14, 5.0, 0.32, 0.34, 'bronze'); Fr.at(0, g0 + 3.84, 0.2, 5.3, 0.1, 0.42, 'bronze');
    for (let i = 0; i < 8; i++) [-1, 1].forEach(s => Fr.at(s * 2.35, g0 + 0.3 + i * 0.44, 0.28, 0.08, 0.08, 0.04, 'steel'));
    [[Fr, w], [L, d], [R, d]].forEach(([F, fw]) => { F.at(0, g0 + 0.3, 0.06, fw + 0.12, 0.6, 0.12, 'stoneD'); [g0 + 1.9, g0 + 4.2].forEach(y => F.at(0, y, 0.04, fw + 0.08, 0.16, 0.08, 'steel')); F.at(0, g0 + rh - 0.1, 0.08, fw + 0.16, 0.22, 0.16, 'steel'); });
    // steps down from the platform edge on the island side
    const ez = z + 1.5 + 11.5; [0.6, 0.3].forEach((h, i) => facPut('stoneD', x, h / 2, ez + 0.2 + i * 0.4, 30, h, 0.4));
    FAC4.lighthouse = true; }
  facFlush();
  if (typeof weathMat === 'function') [FACM.green, FACM.stud].forEach(m => { try { weathMat(m); } catch (e) { } });
})();
window.__FRAMES.push(dt => { try { if (!FAC_ON) return; FACM.bulb.emissiveIntensity = 0.05 + 2.2 * Math.min(1, (L.lamps || 0) * 1.3); } catch (e) { } });
