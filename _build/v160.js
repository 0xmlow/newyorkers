/* ================================================================
   v160 THE KETTLE (2026-11-23)
   From the twentieth of November to Christmas Eve, ten to seven, a sidewalk Santa stands by the Christmas tree
   sellers at (60, 54) with a red kettle on a tripod, ringing a hand bell, all day, in any weather. You hear the
   bell before you see him. E drops a coin in the kettle.
   ================================================================ */
const KETTLE = { X: 60, Z: 54, n: 0 };
window.__KETTLE = KETTLE;
(function kettle() {
  const X = KETTLE.X, Z = KETTLE.Z, g0 = ground(X, Z), ry = Math.atan2(-X, -Z); const g = new THREE.Group(); g.position.set(X, g0, Z); g.rotation.y = ry; scene.add(g); KETTLE.g = g;
  const red = new THREE.MeshStandardMaterial({ color: 0xb3121b, roughness: 0.55 }), white = new THREE.MeshStandardMaterial({ color: 0xf6f4ee, roughness: 0.95 }), black = new THREE.MeshStandardMaterial({ color: 0x151515, roughness: 0.5, metalness: 0.4 }), brass = new THREE.MeshStandardMaterial({ color: 0xd8b04a, roughness: 0.25, metalness: 1 });
  [0, 2.1, 4.2].forEach(a => { const l = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 1.15, 5), black); l.position.set(0.75 + Math.cos(a) * 0.2, 0.55, 0.3 + Math.sin(a) * 0.2); l.rotation.set(Math.sin(a) * 0.18, 0, -Math.cos(a) * 0.18); g.add(l); });
  const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.3, 16), red); pot.position.set(0.75, 1.15, 0.3); pot.castShadow = true; g.add(pot); const rim = new THREE.Mesh(new THREE.TorusGeometry(0.2, 0.015, 6, 20), brass); rim.rotation.x = PI / 2; rim.position.set(0.75, 1.3, 0.3); g.add(rim);
  const s = person(0xb3121b, 0xb3121b, SKIN[4], 'wiseguy'); scene.remove(s.g); s.g.position.set(0, -0.35, 0); g.add(s.g); KETTLE.s = s;
  const beard = new THREE.Mesh(new THREE.SphereGeometry(0.15, 10, 8), white); beard.scale.set(1, 1.2, 0.7); beard.position.set(0, 1.62, 0.1); s.g.add(beard);
  const hat = new THREE.Mesh(new THREE.ConeGeometry(0.17, 0.38, 12), red); hat.position.set(0, 2.03, -0.03); hat.rotation.x = -0.35; s.g.add(hat); const pom = new THREE.Mesh(new THREE.SphereGeometry(0.05, 8, 6), white); pom.position.set(0, 2.2, -0.12); s.g.add(pom); const band = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.035, 6, 16), white); band.rotation.x = PI / 2; band.position.y = 1.86; s.g.add(band);
  const coat = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.3, 0.8, 14), red); coat.position.y = 1.18; s.g.add(coat); const hem = new THREE.Mesh(new THREE.TorusGeometry(0.3, 0.035, 6, 18), white); hem.rotation.x = PI / 2; hem.position.y = 0.79; s.g.add(hem); const belt = new THREE.Mesh(new THREE.CylinderGeometry(0.235, 0.235, 0.08, 14), black); belt.position.y = 1.0; s.g.add(belt); belt.scale.set(1.12, 1, 1.12);
  const bell = new THREE.Mesh(new THREE.ConeGeometry(0.06, 0.1, 10, 1, true), Object.assign(brass.clone(), { side: THREE.DoubleSide })); bell.position.set(0, -0.36, 0.05); s.arms[1].add(bell);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.22), new THREE.MeshBasicMaterial({ map: signTex([{ t: 'THANK YOU', s: 0.3 }, { t: 'HAPPY HOLIDAYS', s: 0.18 }], 256, 140, '#b3121b', '#ffffff'), side: THREE.DoubleSide })); sign.position.set(0.75, 0.75, 0.48); g.add(sign);
  post(X, Z, 0.35, -5, g0 + 2);
  interact(X + Math.sin(ry) * 1.1 + Math.cos(ry) * 0.7, Z + Math.cos(ry) * 1.1 - Math.sin(ry) * 0.7, 1.4, 'E · DROP A COIN IN THE KETTLE', () => kettleGive());
})();
const kettleSecret = secret('kettle', () => { toast('CLINK. "THANK YOU, AND MERRY CHRISTMAS." HE RINGS THE BELL TWICE, JUST FOR YOU.', 'blue'); });
function kettleSeason() { const t = nycTime(TIME.utc); return ((t.mo === 11 && t.d >= 20) || (t.mo === 12 && t.d <= 24)) && t.hours >= 10 && t.hours < 19; }
function kettleGive() { if (!kettleSeason()) { toast('NOBODY HERE. THE KETTLE COMES OUT AFTER THANKSGIVING WEEK STARTS.'); return; } KETTLE.n++; try { beep(2400, 0.08, 'sine', 0.04); beep(3100, 0.1, 'sine', 0.03, 0.06); } catch (e) { } kettleSecret(); }
function kettleFrame(dt) {
  const on = kettleSeason(); KETTLE.g.visible = on; if (!on) return; const d = Math.hypot(P.x - KETTLE.X, P.z - KETTLE.Z); if (d > 90) return;
  const ring = Math.sin(LIFE.t * 9); KETTLE.s.arms[1].rotation.x = -1.3 + ring * 0.35; KETTLE.s.arms[1].rotation.z = 0.2;
  if (d < 60 && AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0) { const k = Math.floor(LIFE.t * 9 / PI); if (k !== KETTLE.k) { KETTLE.k = k; const v = Math.min(0.03, 0.8 / (d + 6)); try { beep(2093, 0.25, 'sine', v); beep(2637, 0.2, 'sine', v * 0.5); beep(4186, 0.08, 'sine', v * 0.3); } catch (e) { } } }
}
window.__FRAMES.push(dt => { try { kettleFrame(dt); } catch (e) { if (!KETTLE.err) { KETTLE.err = e; console.warn('v160 kettle', e); } } });
