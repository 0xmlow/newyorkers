/* ================================================================
   v89 THE TOURISTS (2026-11-22)
   A tour group of four in matching blue caps, led by a guide holding up a flag on a stick, walks the ring path
   from landmark to landmark (THE FLOOR, the wheel, the lighthouse, the water tower, the steam, the market) and stops at each for photos.
   Cameras flash. Get in the frame when they are shooting and one of them says sorry, can you, actually, stay.
   ================================================================ */
const TOUR4 = { p: [], i: 0, t: 0, phase: 'walk', x: 0, z: 30 };
window.__TOURISTS = TOUR4;
(function tourists() {
  TOUR4.stops = [[0.15, 0, 0], [1.35, 62, 0], [2.6, 0, -126], [-2.45, WT_AT.x, WT_AT.z], [-0.75, STEAM_AT.x, STEAM_AT.z], [0.75, MKT_AT.x, MKT_AT.z]].map(([a, lx, lz]) => [Math.sin(a) * 41, Math.cos(a) * 41, lx, lz, a]);   // stops on the ring path, each looking at a landmark
  const guide = person(0xe2581c, 0x2a2f45, SKIN[3], 'writer'); const flag = new THREE.Group(); const stick = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 1.4, 6), new THREE.MeshStandardMaterial({ color: 0x8a6a42 })); stick.position.y = 0.7; flag.add(stick);
  const f = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.28), new THREE.MeshBasicMaterial({ color: 0xffd84a, side: THREE.DoubleSide })); f.position.set(0.2, 1.3, 0); flag.add(f); flag.position.set(0.3, 1.6, 0); guide.g.add(flag);
  TOUR4.p.push({ P: guide, ox: 0, oz: 0, guide: true });
  const blueCap = new THREE.MeshStandardMaterial({ color: 0x2962FF, roughness: 0.6 }); [[0xefe8da, 1.2, 1.0], [0x8a2b1e, -1.0, 1.4], [0x2f4a33, 0.4, 2.2], [0x15161a, -0.6, 2.6]].forEach(([sh, ox, oz], i) => {
    const p = person(sh, 0x3b4a5c, SKIN[(i * 2 + 4) % SKIN.length], ['actress', 'editor', 'workgirl', 'annieh'][i]); const c = new THREE.Mesh(new THREE.CylinderGeometry(0.15, 0.16, 0.07, 12), blueCap); c.position.y = 2.22; p.g.add(c);
    const cam = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.09, 0.07), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4 })); cam.position.set(0, 1.95, 0.22); p.g.add(cam);
    const fl = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), new THREE.MeshBasicMaterial({ color: 0xffffff, toneMapped: false })); fl.position.set(0, 1.97, 0.27); fl.visible = false; p.g.add(fl);
    TOUR4.p.push({ P: p, ox, oz, fl, ft: 0 }); });
  const s0 = TOUR4.stops[0]; TOUR4.x = s0[0]; TOUR4.z = s0[1]; TOUR4.a = s0[4];
})();
const touristSecret = secret('tourists', () => { toast('A TOURIST LOWERS THE CAMERA: SORRY, CAN YOU, ACTUALLY, STAY. YOU ARE NOW IN THEIR HOLIDAY PHOTOS FOREVER.', 'blue'); });
function touristFrame(dt) {
  const T = TOUR4, s = T.stops[T.i], nx = T.stops[(T.i + 1) % T.stops.length]; T.t += dt;
  if (T.phase === 'shoot' && T.t > 14) { T.phase = 'walk'; T.t = 0; T.i = (T.i + 1) % T.stops.length; }
  const tgt = T.phase === 'walk' ? T.stops[T.i] : s; let hx = 0, hz = 1;
  if (T.phase === 'walk') { if (T.a === undefined) T.a = s[4]; const da = Math.atan2(Math.sin(tgt[4] - T.a), Math.cos(tgt[4] - T.a)); if (Math.abs(da) < 0.01) { T.phase = 'shoot'; T.t = 0; } else { const st = Math.sign(da) * Math.min(Math.abs(da), 1.3 / 41 * dt); T.a += st; T.x = Math.sin(T.a) * 41; T.z = Math.cos(T.a) * 41; hx = Math.cos(T.a) * Math.sign(da); hz = -Math.sin(T.a) * Math.sign(da); } }
  if (T.phase === 'shoot') { hx = s[2] - T.x; hz = s[3] - T.z; const l = Math.hypot(hx, hz) || 1; hx /= l; hz /= l; }
  const near = Math.hypot(P.x - T.x, P.z - T.z) < 120; const yaw = Math.atan2(hx, hz);
  T.p.forEach((q, i) => { const x = T.x + (q.guide ? 0 : hz * q.ox - hx * q.oz), z = T.z + (q.guide ? 0 : -hx * q.ox - hz * q.oz);
    q.P.g.position.set(x, ground(x, z) - 0.35 + (T.phase === 'walk' ? Math.abs(Math.sin(LIFE.t * 5 + i)) * 0.03 : 0), z); q.P.g.rotation.y = yaw + (q.guide && T.phase === 'shoot' ? PI : 0);
    if (q.fl && near) { if (T.phase === 'shoot' && Math.random() < dt * 0.35) { q.ft = 0.08;
        // you in the shot: between this camera and what it is pointed at
        const cx = x, cz = z, vx = s[2] - cx, vz = s[3] - cz, vl = Math.hypot(vx, vz) || 1, px = P.x - cx, pz = P.z - cz, along = (px * vx + pz * vz) / vl, side = Math.abs(px * vz - pz * vx) / vl; if (along > 1 && along < vl && side < 2.5) touristSecret(); }
      q.ft -= dt; q.fl.visible = q.ft > 0; } });
}
window.__FRAMES.push(dt => { try { touristFrame(dt); } catch (e) { if (!TOUR4.err) { TOUR4.err = e; console.warn('v89 tourists', e); } } });
