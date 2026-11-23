/* ================================================================
   v154 MORNING TAI CHI (2026-11-23)
   From seven to half past nine on dry mornings a teacher and six regulars do tai chi on the west lawn at
   (-72, 24), the way groups do in Chinatown's parks at dawn: a slow cycle of eight postures (commencing, ward
   off, roll back, press, push, single whip, cloud hands, closing), weight shifting from leg to leg, the whole
   group a beat behind the teacher. The empty place at the end of the back row is yours: stand in it through a
   whole cycle and it counts.
   ================================================================ */
const TAICHI = { X: -72, Z: 24, p: [], t: 0, stay: 0 };
window.__TAICHI = TAICHI;
const TAI_POSES = [[-0.3, -0.3, 0, 0, 0], [-1.4, -0.9, 0.2, -0.2, 0.3], [-1.2, -1.2, -0.3, 0.3, -0.4], [-1.5, -1.5, 0, 0, 0.35], [-1.5, -1.5, 0.15, -0.15, 0.45], [-1.5, -0.2, 1.2, 0, -0.5], [-1.1, -1.6, 0.5, 0.5, -0.2], [-0.2, -0.2, 0, 0, 0]];
(function taiChi() {
  const X = TAICHI.X, Z = TAICHI.Z, g0 = ground(X, Z); TAICHI.g0 = g0;
  const t = person(0xf2f0ea, 0x15161a, SKIN[2], 'writer'); t.g.position.set(X, g0 - 0.35, Z - 2.4); t.g.rotation.y = 0; TAICHI.p.push({ P: t, lag: 0, x: X, z: Z - 2.4, ry: 0 });
  const shirts = [0xc8202a, 0x2a2f45, 0xe8e2d4, 0x3a5a3a, 0x7a1f2a, 0x8a8f99]; for (let i = 0; i < 6; i++) { const x = X - 2.4 + (i % 3) * 2.4, z = Z + Math.floor(i / 3) * 2.2; const p = person(shirts[i], 0x2a2a2e, SKIN[(i * 3 + 2) % SKIN.length], ['actress', 'cabbie', 'editor', 'writer', 'workgirl', 'wiseguy'][i]); p.g.position.set(x, g0 - 0.35, z); p.g.rotation.y = PI; TAICHI.p.push({ P: p, lag: 0.35 + i * 0.05, x, z, ry: PI }); }
  TAICHI.spot = [X + 4.8, Z + 2.2];
  const mark = new THREE.Mesh(new THREE.RingGeometry(0.32, 0.38, 24), new THREE.MeshBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.25, depthWrite: false })); mark.rotation.x = -PI / 2; mark.position.set(TAICHI.spot[0], g0 + 0.03, TAICHI.spot[1]); scene.add(mark); TAICHI.mark = mark;
  if (window.__MAP) MAP.places.push(['TAI CHI', X, Z, X + 6, Z + 2.2]);
})();
const taiSecret = secret('taichi', () => { toast('ONE WHOLE ROUND OF TAI CHI WITH STRANGERS AT SEVEN IN THE MORNING. THE TEACHER BOWS TO YOU. SAME TIME TOMORROW.', 'blue'); });
const taiS = u => u * u * (3 - 2 * u);
function taiFrame(dt) {
  const t = nycTime(TIME.utc), W = WX.override || WX.cur, on = t.hours >= 7 && t.hours < 9.5 && W !== 'RAIN' && W !== 'SNOW'; TAICHI.p.forEach(q => q.P.g.visible = on); TAICHI.mark.visible = on; if (!on) return;
  const d = Math.hypot(P.x - TAICHI.X, P.z - TAICHI.Z); if (d > 80) return; TAICHI.t += dt; const cyc = 5.5, N = TAI_POSES.length;
  TAICHI.p.forEach(q => { const tt = Math.max(0, TAICHI.t - q.lag), k = Math.floor(tt / cyc) % N, u = taiS((tt % cyc) / cyc), a = TAI_POSES[k], b = TAI_POSES[(k + 1) % N], m = i => a[i] + (b[i] - a[i]) * u;
    q.P.arms[0].rotation.set(m(0), 0, -m(2)); q.P.arms[1].rotation.set(m(1), 0, m(3)); const w = m(4); q.P.g.rotation.y = q.ry + w * 0.5; q.P.g.position.set(q.x + Math.cos(q.ry) * w * 0.15, TAICHI.g0 - 0.35 - Math.abs(w) * 0.06, q.z);
    q.P.legs[0].rotation.x = -Math.max(0, w) * 0.35; q.P.legs[1].rotation.x = Math.min(0, w) * 0.35; });
  if (Math.hypot(P.x - TAICHI.spot[0], P.z - TAICHI.spot[1]) < 0.7) { TAICHI.stay += dt; if (TAICHI.stay > cyc * N) taiSecret(); } else TAICHI.stay = 0;
}
window.__FRAMES.push(dt => { try { taiFrame(dt); } catch (e) { if (!TAICHI.err) { TAICHI.err = e; console.warn('v154 tai chi', e); } } });
