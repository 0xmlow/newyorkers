/* ================================================================
   v138 THE CAROUSEL (2026-11-23)
   A carousel on the west lawn at (-36, 30): a turning platform under a striped canopy, a rounding board ringed
   with bulbs and mirrors, brass poles, and eight carved horses (the CC0 horse, painted cream and gilt) rising
   and falling on their poles as it goes round, to a little band organ waltz. Ten in the morning to nine at night.
   E at the edge to ride; three times round counts.
   ================================================================ */
const CAROU = { X: -36, Z: 30, a: 0, w: 0, horses: [], ride: -1, rideA: 0, music: 0, beat: 0 };
window.__CAROU = CAROU;
(function carousel() {
  const X = CAROU.X, Z = CAROU.Z, g0 = ground(X, Z), R = 4.2, top = 0.32; CAROU.g0 = g0; CAROU.top = g0 + top;
  const rot = new THREE.Group(); rot.position.set(X, g0, Z); scene.add(rot); CAROU.rot = rot;
  const deck = new THREE.Mesh(new THREE.CylinderGeometry(R, R, top, 40), new THREE.MeshStandardMaterial({ color: 0x6b4a2e, roughness: 0.6 })); deck.position.y = top / 2; deck.receiveShadow = deck.castShadow = true; rot.add(deck);
  const brass = new THREE.MeshStandardMaterial({ color: 0xc9a24a, roughness: 0.22, metalness: 1 }), red = new THREE.MeshStandardMaterial({ color: 0x9a1a24, roughness: 0.5 }), cream = new THREE.MeshStandardMaterial({ color: 0xf2e8d4, roughness: 0.5 });
  const core = new THREE.Mesh(new THREE.CylinderGeometry(0.9, 0.9, 3.0, 20), new THREE.MeshStandardMaterial({ map: (() => { const cv = document.createElement('canvas'); cv.width = 256; cv.height = 64; const c = cv.getContext('2d'); if (c && c.fillRect) { for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#9a1a24' : '#f2e8d4'; c.fillRect(i * 32, 0, 32, 64); } c.fillStyle = '#c9a24a'; c.fillRect(0, 28, 256, 8); } const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t; })(), roughness: 0.5 })); core.position.y = top + 1.5; rot.add(core);
  const canopy = new THREE.Mesh(new THREE.ConeGeometry(R + 0.4, 1.6, 16, 1, true), new THREE.MeshStandardMaterial({ side: THREE.DoubleSide, roughness: 0.7, map: (() => { const cv = document.createElement('canvas'); cv.width = 512; cv.height = 32; const c = cv.getContext('2d'); if (c && c.fillRect) for (let i = 0; i < 16; i++) { c.fillStyle = i % 2 ? '#9a1a24' : '#f2e8d4'; c.fillRect(i * 32, 0, 32, 32); } const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; return t; })() })); canopy.position.y = top + 3.9; canopy.castShadow = true; rot.add(canopy);
  const finial = new THREE.Mesh(new THREE.SphereGeometry(0.22, 12, 8), brass); finial.position.y = top + 4.85; rot.add(finial);
  const board = new THREE.Mesh(new THREE.CylinderGeometry(R + 0.4, R + 0.4, 0.55, 40, 1, true), new THREE.MeshStandardMaterial({ color: 0x2a3a5a, roughness: 0.4, metalness: 0.3, side: THREE.DoubleSide })); board.position.y = top + 2.85; rot.add(board);
  const bulbs = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 6, 5), new THREE.MeshBasicMaterial({ color: 0xffe2a8, toneMapped: false }), 96), o = new THREE.Object3D(); CAROU.bulbs = bulbs;
  for (let i = 0; i < 96; i++) { const a = i / 48 * PI * 2, row = i < 48 ? 0 : 1; o.position.set(Math.cos(a) * (R + 0.42), top + 2.68 + row * 0.34, Math.sin(a) * (R + 0.42)); o.updateMatrix(); bulbs.setMatrixAt(i, o.matrix); } rot.add(bulbs);
  for (let i = 0; i < 12; i++) { const a = (i + 0.5) / 12 * PI * 2, m = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.3), new THREE.MeshStandardMaterial({ color: 0xdfe6ec, roughness: 0.02, metalness: 1 })); m.position.set(Math.cos(a) * (R + 0.43), top + 2.85, Math.sin(a) * (R + 0.43)); m.rotation.set(0, -a + PI / 2, 0); rot.add(m); }
  for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2, r = 2.9, pole = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 2.5, 8), brass); pole.position.set(Math.cos(a) * r, top + 1.25, Math.sin(a) * r); rot.add(pole);
    const hg = new THREE.Group(); hg.position.set(Math.cos(a) * r, top + 0.35, Math.sin(a) * r); hg.rotation.y = -a; rot.add(hg);
    const h = CC0.make('horse', { h: 1.3, parent: hg, tint: i % 2 ? 0xf6efe2 : 0xe8d6b0, far: -1 }); const saddle = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.06, 0.5), i % 2 ? red : brass); saddle.position.y = 1.08; hg.add(saddle);
    CAROU.horses.push({ hg, a, r, ph: i * 0.8, h }); }
  for (let i = 0; i < 16; i++) { const a = i / 16 * PI * 2, p = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 3.0, 8), brass); p.position.set(X + Math.cos(a) * (R + 0.2), g0 + 1.5 + top, Z + Math.sin(a) * (R + 0.2)); scene.add(p); }
  padCirc(X, Z, R, g0 + top, g0 - 1); post(X, Z, 1.0, -5, g0 + 6);
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.5), new THREE.MeshBasicMaterial({ map: signTex([{ t: 'CAROUSEL', s: 0.36, f: 'Georgia, serif' }, { t: 'RIDES ONE MEME', s: 0.15 }], 512, 180, '#9a1a24', '#f2e8d4'), side: THREE.DoubleSide })); sign.position.set(X + R + 1.2, g0 + 1.4, Z); sign.rotation.y = PI / 2; scene.add(sign); post(X + R + 1.2, Z, 0.08, -5, g0 + 1.7);
  const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 1.4, 6), brass); sp.position.set(X + R + 1.2, g0 + 0.6, Z); scene.add(sp);
  interact(X + R + 0.6, Z + 1.2, 1.8, 'E · RIDE THE CAROUSEL', () => carouRide());
  if (window.__MAP) MAP.places.push(['THE CAROUSEL', X, Z, X + R + 2, Z]);
})();
const carouSecret = secret('carousel', () => { toast('THREE TIMES ROUND ON A WOODEN HORSE. YOU ARE A GROWN ADULT. YOU WOULD DO IT AGAIN.', 'blue'); });
function carouOpen() { const h = nycTime(TIME.utc).hours; return h >= 10 && h < 21; }
function carouRide() { if (CAROU.ride >= 0) return; if (!carouOpen()) { toast('THE CAROUSEL IS CLOSED. THE HORSES ARE ASLEEP. TEN IN THE MORNING.'); return; } let best = 0, bd = 99; CAROU.horses.forEach((h, i) => { const wa = h.a + CAROU.a, x = CAROU.X + Math.cos(wa) * h.r, z = CAROU.Z + Math.sin(wa) * h.r, d = Math.hypot(P.x - x, P.z - z); if (d < bd) { bd = d; best = i; } }); CAROU.ride = best; CAROU.rideA = 0; toast('YOU CLIMB ON A HORSE. THE ORGAN STARTS UP. ANY MOVE KEY TO GET OFF.'); }
const CAROU_TUNE = [392, 0, 494, 0, 587, 587, 523, 0, 494, 0, 440, 440, 392, 0, 330, 0, 349, 349, 392, 0, 440, 0, 392, 392, 330, 0, 294, 0, 262, 262, 294, 0];
function carouFrame(dt) {
  const d = Math.hypot(P.x - CAROU.X, P.z - CAROU.Z); const open = carouOpen(); CAROU.w += ((open ? 0.42 : 0) - CAROU.w) * Math.min(1, dt * 0.25);
  const night = Math.min(1, (L.lamps || 0) * 1.4); CAROU.bulbs.material.color.setScalar(open ? 0.9 + night * 1.6 * (0.85 + 0.15 * Math.sin(LIFE.t * 4)) : 0.12);
  if (d > 110 && CAROU.ride < 0) return; const da = CAROU.w * dt; CAROU.a += da; CAROU.rot.rotation.y = -CAROU.a;
  CAROU.horses.forEach(h => { h.hg.position.y = CAROU.top - CAROU.g0 + 0.35 + Math.sin(CAROU.a * 3 + h.ph) * 0.22 * (CAROU.w / 0.42); });
  if (CAROU.ride >= 0) { const h = CAROU.horses[CAROU.ride], wa = h.a + CAROU.a, x = CAROU.X + Math.cos(wa) * h.r, z = CAROU.Z + Math.sin(wa) * h.r; const moving = keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD || joy.x || joy.y;
    if (moving && CAROU.rideA > 0.4) { CAROU.ride = -1; teleport(CAROU.X + Math.cos(wa) * 5.4, CAROU.Z + Math.sin(wa) * 5.4, P.yaw); toast('YOU STEP OFF. THE GROUND KEEPS TURNING FOR A SECOND.'); }
    else { CAROU.rideA += da; P.x = x; P.z = z; P.y = h.hg.position.y + CAROU.g0 + 0.15; P.vy = 0; P.ground = true; if (CAROU.rideA > PI * 6) { carouSecret(); } } }
  // the band organ
  if (open && d < 40 && AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0) { CAROU.beat -= dt; if (CAROU.beat <= 0) { CAROU.beat = 0.21; const f = CAROU_TUNE[CAROU.music++ % CAROU_TUNE.length], v = Math.min(0.035, 0.6 / (d + 6)); if (f) { try { beep(f, 0.19, 'square', v * 0.5); beep(f * 2, 0.12, 'triangle', v * 0.4); } catch (e) { } } if (CAROU.music % 3 === 1) { try { beep(98 * (CAROU.music % 6 < 3 ? 1 : 1.5), 0.1, 'triangle', v * 0.6); } catch (e) { } } } }
}
window.__FRAMES.push(dt => { try { carouFrame(dt); } catch (e) { if (!CAROU.err) { CAROU.err = e; console.warn('v138 carousel', e); } } });
