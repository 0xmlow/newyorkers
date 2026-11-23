/* ================================================================
   v130 THE MURMURATION (2026-11-23)
   From October to March, around sunset, a cloud of starlings comes in off the water and murmurs over the
   harbour to the south west: eighteen hundred birds (six hundred on phones) folding into ribbons, sheets and
   funnels, waves rolling through them, the whole flock shimmering as the birds bank. They arrive as the sun
   gets low and leave as it goes, out toward New Jersey. Watch them long enough and it counts. Type
   MURMURATION to call them any evening of the year.
   ================================================================ */
const MURM = { k: 0, t: 0, n: isMobile ? 600 : 1800, s: [], watch: 0, force: 0 };
window.__MURM = MURM;
(function murmuration() {
  const geo = new THREE.BufferGeometry(); geo.setAttribute('position', new THREE.Float32BufferAttribute([0, 0, 0.18, -0.35, 0.02, -0.05, 0, 0, -0.12, 0, 0, 0.18, 0.35, 0.02, -0.05, 0, 0, -0.12], 3)); geo.computeVertexNormals();
  const mesh = new THREE.InstancedMesh(geo, new THREE.MeshBasicMaterial({ color: 0x15161c, side: THREE.DoubleSide }), MURM.n); mesh.frustumCulled = false; mesh.visible = false; scene.add(mesh); MURM.mesh = mesh;
  for (let i = 0; i < MURM.n; i++) { let x, y, z; do { x = Math.random() * 2 - 1; y = Math.random() * 2 - 1; z = Math.random() * 2 - 1; } while (x * x + y * y + z * z > 1); MURM.s.push([x, y, z, Math.random() * 6.28, 0.85 + Math.random() * 0.4]); }
})();
const murmSecret = secret('murmuration', () => { toast('EIGHTEEN HUNDRED STARLINGS AND NOT ONE OF THEM IN CHARGE. NOBODY HAS EVER FULLY EXPLAINED THIS.', 'blue'); });
EGGS.MURMURATION = () => { MURM.force = 90; toast('A DARK SMUDGE COMES IN LOW OVER THE WATER FROM THE SOUTH WEST.'); };
const _mo = new THREE.Object3D(), _mc = new V3(), _mq = new THREE.Quaternion(), _me = new THREE.Euler();
function murmFrame(dt) {
  const t = nycTime(TIME.utc), season = t.mo >= 10 || t.mo <= 3, dusk = t.hours > 12 && SKY.el < 7 && SKY.el > -6, W = WX.override || WX.cur;
  MURM.force = Math.max(0, MURM.force - dt); const want = (MURM.force > 0 || (season && dusk && W !== 'RAIN' && W !== 'SNOW' && W !== 'HARBOR FOG')) ? 1 : 0;
  MURM.k += (want - MURM.k) * Math.min(1, dt * 0.08); if (MURM.k < 0.01) { MURM.mesh.visible = false; return; } MURM.mesh.visible = true; MURM.t += dt; const T = MURM.t;
  const away = 1 - MURM.k, cx = -70 + Math.sin(T * 0.07) * 40 - away * 320, cy = 42 + Math.sin(T * 0.11) * 8 + away * 30, cz = 175 + Math.cos(T * 0.05) * 30 + away * 120;
  _mc.set(cx, cy, cz); const vx = Math.cos(T * 0.07) * 2.8, vz = -Math.sin(T * 0.05) * 1.5;
  // is it worth the work this frame? (only when the flock is in front of the camera)
  const look = _mc.clone().sub(camera.position).normalize(), fwd = new V3(0, 0, -1).applyQuaternion(camera.quaternion), dot = look.dot(fwd);
  if (dot > 0.9 && MURM.k > 0.6) { MURM.watch += dt; if (MURM.watch > 12) murmSecret(); }
  if (dot < -0.3 && MURM.drawn) return; MURM.drawn = true;
  const th = T * 0.13, ph = Math.sin(T * 0.09) * 0.8, ct = Math.cos(th), st = Math.sin(th), cp = Math.cos(ph), sp = Math.sin(ph);
  const SX = 30 + 18 * Math.sin(T * 0.21), SY = 6 + 5 * Math.sin(T * 0.17 + 1), SZ = 14 + 10 * Math.cos(T * 0.15), wave = 3 + 4 * Math.max(0, Math.sin(T * 0.23)), spread = 1 + away * 2;
  const head = Math.atan2(vx, vz);
  for (let i = 0; i < MURM.n; i++) { const s = MURM.s[i];
    let x = s[0] + 0.35 * Math.sin(s[2] * 3 + T * 0.5), y = s[1], z = s[2] + 0.3 * Math.sin(s[0] * 2.4 - T * 0.4);
    x *= SX * spread; y = y * SY * spread + Math.sin(s[0] * 2.5 + T * 0.9) * wave; z *= SZ * spread;
    const x1 = x * ct - z * st, z1 = x * st + z * ct, y1 = y * cp - z1 * sp, z2 = y * sp + z1 * cp;
    _mo.position.set(cx + x1, cy + y1, cz + z2);
    const bank = Math.sin(T * 1.7 + s[0] * 4 + s[3]) * 0.9, flap = 0.55 + 0.45 * Math.abs(Math.sin(T * 14 * s[4] + s[3]));
    _mo.rotation.set(Math.cos(s[0] * 2.5 + T * 0.9) * 0.4, head + Math.sin(s[1] * 3 + T * 0.3) * 0.5, bank); _mo.scale.set(1.6 * flap, 1.6, 1.6); _mo.updateMatrix(); MURM.mesh.setMatrixAt(i, _mo.matrix); }
  MURM.mesh.instanceMatrix.needsUpdate = true;
}
window.__FRAMES.push(dt => { try { murmFrame(dt); } catch (e) { if (!MURM.err) { MURM.err = e; console.warn('v130 murmuration', e); } } });
