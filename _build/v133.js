/* ================================================================
   v133 THE LIFEGUARD CHAIR (2026-11-23)
   A tall white wooden lifeguard chair on GM BEACH at (43, 111), facing the water, with a red rescue can hung on
   it and a flag pole: green for calm, yellow for fog or rain, red when it storms. In season (Memorial Day to
   Labor Day, ten to six) a guard sits up there in a red suit and blows the whistle if you wade out past the
   buoys. The rest of the year the chair is empty and a sign says so, which is how New York does it. E at the
   ladder climbs up; the view from the seat is the best on the beach.
   ================================================================ */
const GUARD = { x: 43, z: 111, up: false };
window.__GUARD = GUARD;
(function lifeguardChair() {
  const X = GUARD.x, Z = GUARD.z, g0 = ground(X, Z); GUARD.g0 = g0; const g = new THREE.Group(); g.position.set(X, g0, Z); scene.add(g); GUARD.g = g;
  const paint = new THREE.MeshStandardMaterial({ color: 0xf2f0ea, roughness: 0.75 }), red = new THREE.MeshStandardMaterial({ color: 0xc8202a, roughness: 0.5 });
  const B = (w, h, d, m, x, y, z, rx, rz) => { const o = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); o.position.set(x, y, z); o.rotation.set(rx || 0, 0, rz || 0); o.castShadow = true; g.add(o); return o; };
  [[-0.75, -0.6], [0.75, -0.6], [-0.75, 0.6], [0.75, 0.6]].forEach(([x, z]) => B(0.12, 2.6, 0.12, paint, x * 0.9, 1.3, z * 0.9, -z * 0.1, x * 0.1));
  B(1.7, 0.08, 1.5, paint, 0, 2.2, 0); B(1.2, 0.08, 0.6, paint, 0, 2.62, -0.2); B(1.2, 0.8, 0.08, paint, 0, 3.0, -0.52); [-0.6, 0.6].forEach(x => B(0.08, 0.35, 0.6, paint, x, 2.8, -0.2));
  for (let i = 0; i < 6; i++) B(1.4, 0.06, 0.1, paint, 0, 0.35 + i * 0.36, 0.72, 0, 0);
  [-0.68, 0.68].forEach(x => B(0.08, 2.2, 0.08, paint, x, 1.1, 0.74));
  const can = new THREE.Mesh(new THREE.CylinderGeometry(0.1, 0.1, 0.7, 10), red); can.position.set(0.95, 1.6, 0); can.rotation.z = 0.15; g.add(can);
  const pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.04, 4.4, 6), new THREE.MeshStandardMaterial({ color: 0xc9cdd1, metalness: 0.8, roughness: 0.3 })); pole.position.set(-1.2, 2.2, -0.3); g.add(pole);
  const flagM = new THREE.MeshStandardMaterial({ color: 0x2f9a4a, roughness: 0.8, side: THREE.DoubleSide }), flag = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.5, 8, 1), flagM); flag.position.set(-0.8, 4.1, -0.3); g.add(flag); GUARD.flag = flag; GUARD.flagM = flagM; GUARD.flagP = flag.geometry.attributes.position.array.slice();
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.6), new THREE.MeshBasicMaterial({ map: signTex([{ t: 'NO LIFEGUARD', s: 0.17 }, { t: 'ON DUTY', s: 0.17 }, { t: 'NO SWIMMING', s: 0.12 }], 512, 256, '#b3121b', '#ffffff'), side: THREE.DoubleSide })); sign.position.set(0, 1.4, 0.82); g.add(sign); GUARD.sign = sign;
  const gd = person(0xc8202a, 0xc8202a, SKIN[2], 'actress'); scene.remove(gd.g); gd.g.position.set(0, 2.66 - 0.86 + 0.0, -0.15); gd.legs.forEach(l => l.rotation.x = -PI / 2); g.add(gd.g); GUARD.gd = gd;
  [[-0.75, -0.6], [0.75, -0.6], [-0.75, 0.6], [0.75, 0.6]].forEach(([x, z]) => post(X + x * 0.9, Z + z * 0.9, 0.1, -5, g0 + 2.1));
  padRect(X - 0.85, X + 0.85, Z - 0.75, Z + 0.75, g0 + 2.24, g0 + 1.6);
  // the swim line of buoys off the beach
  const buoy = new THREE.InstancedMesh(new THREE.SphereGeometry(0.22, 10, 8), new THREE.MeshStandardMaterial({ color: 0xff7a1a, roughness: 0.5 }), 14), o = new THREE.Object3D(); GUARD.buoy = buoy;
  for (let i = 0; i < 14; i++) { o.position.set(X - 26 + i * 4, -0.02, 146); o.updateMatrix(); buoy.setMatrixAt(i, o.matrix); } scene.add(buoy);
  interact(X, Z + 1.4, 1.6, 'E · CLIMB THE CHAIR', () => guardClimb());
})();
const guardSecret = secret('lifeguard', () => { toast('YOU SIT IN THE LIFEGUARD CHAIR AND WATCH THE WATER. NOBODY IS SWIMMING. IT IS STILL THE BEST SEAT ON THE ISLAND.', 'blue'); });
function guardSeason() { const t = nycTime(TIME.utc); const inS = (t.mo === 5 && t.d >= 25) || t.mo === 6 || t.mo === 7 || t.mo === 8 || (t.mo === 9 && t.d <= 7); return { inS, duty: inS && t.hours >= 10 && t.hours < 18 }; }
function guardClimb() { const s = guardSeason(); if (s.duty) { toast('THE LIFEGUARD LOOKS DOWN AT YOU. THE LIFEGUARD SAYS NO.'); return; } teleport(GUARD.x, GUARD.z - 0.1, 0, 4); P.y = GUARD.g0 + 2.24; GUARD.up = true; GUARD.upT = 0; toast('YOU CLIMB UP AND SIT. THE HARBOUR IS ALL YOURS.'); }
let whistleT = 0;
function guardFrame(dt) {
  const d = Math.hypot(P.x - GUARD.x, P.z - GUARD.z); const s = guardSeason(); GUARD.gd.g.visible = s.duty; GUARD.sign.visible = !s.duty;
  const W = WX.override || WX.cur; const col = (WXX && WXX.storm > 0.3) ? 0xc8202a : (W === 'RAIN' || W === 'HARBOR FOG' || W === 'SNOW') ? 0xe8c43a : 0x2f9a4a; GUARD.flagM.color.setHex(col);
  if (d < 80) { const a = GUARD.flag.geometry.attributes.position, p0 = GUARD.flagP; for (let i = 0; i < a.count; i++) { const x = p0[i * 3]; a.setZ(i, Math.sin(LIFE.t * 5 + x * 6) * 0.08 * (x + 0.4)); } a.needsUpdate = true; }
  if (GUARD.up) { GUARD.upT += dt; if (GUARD.upT > 6) guardSecret(); if (d > 1.5) GUARD.up = false; }
  whistleT -= dt; if (s.duty && P.z > 140 && Math.abs(P.x - GUARD.x) < 60 && whistleT <= 0 && AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0) { whistleT = 4; toast('PHWEEEET. THE LIFEGUARD WAVES YOU BACK INSIDE THE BUOYS.'); try { beep(2900, 0.5, 'sine', 0.05); beep(3100, 0.4, 'sine', 0.04, 0.55); } catch (e) { } }
}
window.__FRAMES.push(dt => { try { guardFrame(dt); } catch (e) { if (!GUARD.err) { GUARD.err = e; console.warn('v133 lifeguard', e); } } });
