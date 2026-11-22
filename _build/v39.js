/* ================================================================
   v39 TOP OF THE SQUARE (2026-11-22)
   An elevator door in the base of N3W Square (the island side): E and it takes you up, with a ding, to a railed
   observation deck on the crown, under the mast and the ball. Two coin-op tower viewers on the deck: E to look
   through them (the view narrows to a circle and zooms on the Witness, or on the Colossus). E at the deck's
   elevator door goes back down.
   ================================================================ */
const TOP = {};
window.__TOP = TOP;
(function deck() {
  if (!window.__SQ) return; const x = SQ.x, z = SQ.z, g0 = ground(x, z), H = 44, top = g0 + H + 3.02; TOP.top = top; TOP.x = x; TOP.z = z;
  const steel = new THREE.MeshStandardMaterial({ color: 0x9aa0a6, metalness: 0.85, roughness: 0.3 }), dark = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.4, metalness: 0.4 });
  // the elevator door at the base, island side (-x face)
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.8, 2.6), new THREE.MeshStandardMaterial({ color: 0xc9a23a, metalness: 0.95, roughness: 0.25 })); door.position.set(x - 4.62, g0 + 1.3, z); door.rotation.y = -PI / 2; scene.add(door);
  const seam = new THREE.Mesh(new THREE.PlaneGeometry(0.02, 2.6), dark); seam.position.set(x - 4.63, g0 + 1.3, z); seam.rotation.y = -PI / 2; scene.add(seam);
  const lab = signTex([{ t: 'TOP OF THE SQUARE', s: 0.4 }, { t: 'OBSERVATION DECK · FREE · NO GAS', s: 0.15 }], 1024, 256, '#0D0D0D', '#FFFFFF');
  const ls = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 0.6), new THREE.MeshBasicMaterial({ map: lab, toneMapped: false })); ls.position.set(x - 4.63, g0 + 3.0, z); ls.rotation.y = -PI / 2; scene.add(ls);
  // the deck: floor pad, railings, a small door hut
  const half = 3.5; padRect(x - half, x + half, z - half, z + half, top);
  const floor = new THREE.Mesh(new THREE.BoxGeometry(half * 2, 0.08, half * 2), MAT.wood || steel); floor.position.set(x, top - 0.04, z); scene.add(floor);
  [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([sx, sz]) => { const len = half * 2, rx = x + sx * half, rz = z + sz * half;
    const rail = new THREE.Mesh(new THREE.BoxGeometry(sx ? 0.06 : len, 0.06, sz ? 0.06 : len), steel); rail.position.set(rx, top + 1.05, rz); scene.add(rail);
    const rail2 = rail.clone(); rail2.position.y = top + 0.55; scene.add(rail2);
    for (let k = -3; k <= 3; k++) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.05, 1.05, 0.05), steel); p.position.set(rx + (sx ? 0 : k), top + 0.52, rz + (sz ? 0 : k)); scene.add(p); }
    wall(sx ? rx : x - half, sz ? rz : z - half, sx ? rx : x + half, sz ? rz : z + half, top - 1, top + 3); });
  post(x, z, 0.4, top - 1, top + 20);
  const hut = new THREE.Mesh(new THREE.BoxGeometry(1.4, 2.4, 1.6), dark); hut.position.set(x - half + 0.75, top + 1.2, z + 2.2); scene.add(hut); post(x - half + 0.75, z + 2.2, 0.85, top - 1, top + 3);
  const hd = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 2.0), door.material); hd.position.set(x - half + 1.46, top + 1.0, z + 2.2); hd.rotation.y = PI / 2; scene.add(hd);
  // two coin-op tower viewers
  TOP.viewers = [[x + 2.6, z - 2.6, new THREE.Vector3(0, 63, -215), 'THE WITNESS'], [x + 2.6, z + 2.6, new THREE.Vector3(58, 30, 262), 'THE COLOSSUS OF 6529']].map(([vx, vz, tgt, name]) => {
    const g = new THREE.Group(); g.position.set(vx, top, vz); scene.add(g);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.16, 1.1, 10), new THREE.MeshStandardMaterial({ color: 0x2c6b4a, metalness: 0.6, roughness: 0.4 })); ped.position.y = 0.55; g.add(ped);
    const head = new THREE.Group(); head.position.y = 1.25; g.add(head); const body = new THREE.Mesh(new THREE.BoxGeometry(0.5, 0.36, 0.42), ped.material); head.add(body);
    [-0.12, 0.12].forEach(o => { const e = new THREE.Mesh(new THREE.CylinderGeometry(0.07, 0.07, 0.2, 12), dark); e.rotation.x = PI / 2; e.position.set(o, 0.04, -0.28); head.add(e); });
    head.lookAt(new THREE.Vector3(tgt.x, top + 1.25, tgt.z)); head.rotateY(PI);
    post(vx, vz, 0.3, top - 1, top + 2); return { vx, vz, tgt, name };
  });
})();
const topSecret = secret('topofsquare', () => { }), viewSecret = secret('binoculars', () => { });
function ride(up) {
  if (RAIL.on) return; const { x, z, top } = TOP, g0 = ground(x, z); beep(880, 0.15, 'sine', 0.05); flash('#0D0D0D');
  const from = up ? [x - 5.6, g0 + 1.7, z] : [x - 2.2, top + 1.7, z + 2.2], to = up ? [x - 1.6, top + 1.7, z + 2.2] : [x - 6.5, g0 + 1.7, z];
  playRail({ pos: [from, [x - 6, (g0 + top) / 2 + 6, z - 3], to], look: [[x, up ? g0 + 10 : top, z], [x + 30, 30, z - 20], [x + 40, up ? top - 6 : g0 + 1, z]], dur: 6, done: () => { teleport(to[0], to[2], up ? -PI / 2 : PI / 2, up ? top + 2 : 3); beep(1320, 0.2, 'sine', 0.05); if (up) { topSecret(); toast('TOP OF THE SQUARE. THE WHOLE ISLAND, THE EL, THE HARBOUR AND THE WITNESS. TWO VIEWERS ON THE DECK.'); } } });
}
if (TOP.top) { interact(TOP.x - 5.6, TOP.z, 2.4, 'E · TAKE THE ELEVATOR UP', () => ride(true));
  interact(TOP.x - 2.2, TOP.z + 2.2, 1.6, 'E · ELEVATOR DOWN', () => { if (P.y > TOP.top - 1) ride(false); });
  TOP.viewers.forEach(v => interact(v.vx, v.vz, 1.3, 'E · LOOK THROUGH THE VIEWER', () => { if (P.y < TOP.top - 1 || RAIL.on) return; viewSecret(); const eye = [v.vx - Math.sign(v.tgt.x - v.vx) * 0.1, TOP.top + 1.35, v.vz];
    beep(400, 0.05, 'square', 0.03); beep(600, 0.05, 'square', 0.03, 0.07); toast('ONE QUARTER. ' + v.name + '.'); viewerMask(true);
    playRail({ pos: [eye, [eye[0], eye[1], eye[2] + 0.001]], look: [[v.tgt.x, v.tgt.y, v.tgt.z], [v.tgt.x, v.tgt.y, v.tgt.z]], fov: [38, 9], dur: 8, done: () => { viewerMask(false); teleport(v.vx - 1.2, v.vz, -PI / 2, TOP.top + 2); } }); }));
}
(function mask() { const el = document.createElement('div'); el.style.cssText = 'position:fixed;inset:0;z-index:55;pointer-events:none;display:none;background:radial-gradient(circle 40vh at 50% 50%, transparent 93%, #000 96%)'; document.body.appendChild(el); TOP.mask = el; })();
function viewerMask(on) { if (TOP.mask) TOP.mask.style.display = on ? 'block' : 'none'; }
