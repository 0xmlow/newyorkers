/* ================================================================
   v75 THE DELIVERY RIDERS (2026-11-22)
   Four e-bike delivery riders lap the ring road day and night, an insulated cube bag on every back, a white front
   light and a red one behind, two going each way. They are fast, they ring once when they pass you, and they lean
   round you if you are in the lane. Stand still and let one go by within a metre and the island counts it.
   ================================================================ */
const RIDE5 = { r: [] };
window.__RIDERS = RIDE5;
const ROAD_R = 100;   // the road ring runs from 96 to 104 (island.html, RingGeometry(96, 104))
(function riders() {
  const bagC = [0xe2581c, 0x2f4a33, 0x2962FF, 0x15161a];
  for (let i = 0; i < 4; i++) { const g = new THREE.Group(); scene.add(g); const b = bikeModel(1); b.rotation.y = 0; g.add(b);
    const p = person([0x2a2d33, 0x3b4a5c, 0x15161a, 0x5a1712][i], 0x15161a, SKIN[(i * 3 + 1) % SKIN.length], ['cabbie', 'writer', 'editor', 'wiseguy'][i]);
    scene.remove(p.g); p.g.position.set(-0.22, 0.45 - 0.35, 0); p.g.rotation.y = PI / 2; p.g.scale.setScalar(0.92); g.add(p.g);
    const bag = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.42, 0.42), new THREE.MeshStandardMaterial({ color: bagC[i], roughness: 0.7 })); bag.position.set(-0.42, 1.7, 0); g.add(bag);
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); fl.position.set(0.72, 0.95, 0); g.add(fl);
    const rl = new THREE.Mesh(new THREE.SphereGeometry(0.04, 8, 6), new THREE.MeshBasicMaterial({ color: 0xff2020, toneMapped: false })); rl.position.set(-0.62, 0.7, 0); g.add(rl);
    const dir = i % 2 ? -1 : 1; RIDE5.r.push({ g, wheels: b.userData.wheels, a: i * PI / 2 + 0.3, dir, lane: dir > 0 ? -1.7 : 1.7, sp: 7 + Math.random() * 2.5, off: 0, rang: false }); }
})();
const nearMiss = secret('nearmiss', () => { toast('A DELIVERY BIKE MISSED YOU BY A HAND. HE DID NOT EVEN LOOK. THAT IS RESPECT.', 'blue'); });
function ridersFrame(dt) {
  RIDE5.r.forEach(r => { const R = ROAD_R + r.lane + r.off, toX = Math.atan2(Math.sin(-r.a), Math.cos(-r.a)) * r.dir, hold = window.__XWALK_PED && toX > 0.035 && toX < 0.09; if (!hold) r.a += r.dir * r.sp / R * dt; const x = Math.sin(r.a) * R, z = Math.cos(r.a) * R, gy = ground(x, z);
    // lean out round the player if in the lane ahead
    const dx = P.x - x, dz = P.z - z, d = Math.hypot(dx, dz), tx = Math.cos(r.a) * r.dir, tz = -Math.sin(r.a) * r.dir, ahead = dx * tx + dz * tz, side = -(dx * Math.sin(r.a) + dz * Math.cos(r.a));
    const want = ahead > 0 && ahead < 10 && Math.abs(side) < 1.6 ? (side > 0 ? -1.4 : 1.4) : 0; r.off += (want - r.off) * Math.min(1, dt * 3);
    r.g.position.set(x, gy, z); r.g.rotation.set(0, Math.atan2(-tz, tx), -r.dir * 0.05 + (want ? -Math.sign(want) * 0.12 : 0), 'YXZ');
    r.wheels.forEach(w => w.rotation.z -= r.sp / 0.33 * dt);
    if (d < 6 && !r.rang) { r.rang = true; try { if (AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0) beep(2300, 0.12, 'sine', 0.035); } catch (e) { } }
    if (d > 12) r.rang = false; if (d < 1.1 && P.ground) nearMiss(); });
}
window.__FRAMES.push(dt => { try { ridersFrame(dt); } catch (e) { if (!RIDE5.err) { RIDE5.err = e; console.warn('v75 riders', e); } } });
