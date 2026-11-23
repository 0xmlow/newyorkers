/* ================================================================
   v102 THE BALLOON MAN (2026-11-22)
   A balloon seller on the west grass at (-86, -24) with a big bunch of eye balloons (evil eye blue, white iris,
   black pupil) bobbing on strings over his head. E buys one for a TDH: it rides along above your shoulder,
   tugging in the wind, wherever you go. Press E again anywhere (when nothing else is near) or type LETGO and it
   floats away up into the sky until it is a dot. The island counts the first one you let go.
   ================================================================ */
const BALL = { bunch: [], mine: null, free: [] };
window.__BALL = BALL;
const BALL_AT = { x: -86, z: -24 };
function eyeBalloon() { const g = new THREE.Group(); const m = new THREE.Mesh(new THREE.SphereGeometry(0.32, 18, 14), new THREE.MeshStandardMaterial({ color: 0x2962FF, roughness: 0.2, metalness: 0.1 })); m.scale.y = 1.15; g.add(m);
  const w = new THREE.Mesh(new THREE.CircleGeometry(0.16, 18), new THREE.MeshBasicMaterial({ color: 0xffffff })); w.position.z = 0.31; g.add(w); const c = new THREE.Mesh(new THREE.CircleGeometry(0.09, 16), new THREE.MeshBasicMaterial({ color: 0x5ab8ff })); c.position.z = 0.315; g.add(c);
  const p = new THREE.Mesh(new THREE.CircleGeometry(0.045, 12), new THREE.MeshBasicMaterial({ color: 0x050505 })); p.position.z = 0.32; g.add(p); return g; }
(function balloonMan() {
  const x0 = BALL_AT.x, z0 = BALL_AT.z, g0 = ground(x0, z0); BALL.g0 = g0;
  const man = person(0xe2581c, 0x2a2f45, SKIN[5], 'wiseguy'); man.g.position.set(x0, g0 - 0.35, z0); man.g.rotation.y = Math.atan2(-x0, -z0);
  const lineM = new THREE.LineBasicMaterial({ color: 0xeeeeee, transparent: true, opacity: 0.7 }); const hand = new THREE.Vector3(x0 + 0.3, g0 + 1.3, z0);
  for (let i = 0; i < 9; i++) { const b = eyeBalloon(); const a = i / 9 * PI * 2, r = 0.45 + (i % 3) * 0.2; const base = new THREE.Vector3(x0 + 0.3 + Math.cos(a) * r, g0 + 3.0 + (i % 3) * 0.35, z0 + Math.sin(a) * r); b.position.copy(base); scene.add(b);
    const l = new THREE.Line(new THREE.BufferGeometry().setFromPoints([hand, base]), lineM); scene.add(l); BALL.bunch.push({ b, l, base, ph: Math.random() * 6 }); }
  BALL.hand = hand; post(x0, z0, 0.4, -5, 2);
  interact(x0 + Math.sin(Math.atan2(-x0, -z0)) * 1.4, z0 + Math.cos(Math.atan2(-x0, -z0)) * 1.4, 1.8, 'E · BUY A BALLOON (1 TDH)', () => ballBuy());
  const ml = new THREE.Line(new THREE.BufferGeometry().setFromPoints([new THREE.Vector3(), new THREE.Vector3()]), lineM); ml.frustumCulled = false; ml.visible = false; scene.add(ml); BALL.ml = ml;
  if (window.__MAP) MAP.places.push(['BALLOONS', x0, z0, x0 + 1.5, z0 + 0.5]);
})();
const balloonSecret = secret('letgo', () => { toast('YOU LET IT GO. IT GETS SMALLER AND SMALLER AND THEN IT IS SOMEONE ELSES SKY.', 'blue'); });
function ballBuy() { if (BALL.mine) { ballLetGo(); return; } state.tdh = Math.max(0, state.tdh - 1); try { hud(); } catch (e) { } const b = eyeBalloon(); scene.add(b); BALL.mine = { b, x: P.x, y: P.y + 3, z: P.z }; BALL.ml.visible = true; toast('ONE EYE BALLOON. IT FOLLOWS YOU. E AGAIN OR TYPE LETGO TO LET IT GO.'); }
function ballLetGo() { if (!BALL.mine) return; BALL.free.push({ b: BALL.mine.b, vy: 1.2, vx: 0.6, t: 0 }); BALL.mine = null; BALL.ml.visible = false; balloonSecret(); }
EGGS.letgo = () => { BALL.mine ? ballLetGo() : toast('YOU ARE NOT HOLDING ANYTHING. THE BALLOON MAN IS ON THE WEST GRASS.'); }; EGGS.letgo.__s = true;
addEventListener('keydown', e => { if (e.code !== 'KeyE' || e.repeat || !BALL.mine || $('chat').style.display === 'block') return; if (typeof nearest !== 'undefined' && nearest) return; ballLetGo(); });
function ballFrame(dt) {
  BALL.bunch.forEach(q => { q.b.position.set(q.base.x + Math.sin(LIFE.t * 0.9 + q.ph) * 0.12, q.base.y + Math.sin(LIFE.t * 1.3 + q.ph) * 0.08, q.base.z + Math.cos(LIFE.t * 0.7 + q.ph) * 0.12); q.b.rotation.y = Math.sin(LIFE.t * 0.4 + q.ph) * 0.4; const a = q.l.geometry.attributes.position; a.setXYZ(1, q.b.position.x, q.b.position.y - 0.36, q.b.position.z); a.needsUpdate = true; });
  if (BALL.mine) { const m = BALL.mine, tx = P.x + Math.cos(P.yaw) * 0.5, tz = P.z - Math.sin(P.yaw) * 0.5, ty = P.y + 3.2; m.x += (tx - m.x) * Math.min(1, dt * 2.5); m.y += (ty - m.y) * Math.min(1, dt * 2.5); m.z += (tz - m.z) * Math.min(1, dt * 2.5);
    m.b.position.set(m.x + Math.sin(LIFE.t * 1.1) * 0.1, m.y, m.z + Math.cos(LIFE.t * 0.9) * 0.1); m.b.lookAt(camera.position.x, m.b.position.y, camera.position.z); const a = BALL.ml.geometry.attributes.position; a.setXYZ(0, tx, P.y + 1.2, tz); a.setXYZ(1, m.b.position.x, m.b.position.y - 0.36, m.b.position.z); a.needsUpdate = true; }
  BALL.free = BALL.free.filter(f => { f.t += dt; f.b.position.y += f.vy * dt; f.b.position.x += f.vx * dt * (1 + Math.sin(f.t * 0.5)); f.vy = Math.min(3, f.vy + dt * 0.1); if (f.t > 120) { scene.remove(f.b); return false; } return true; });
}
window.__FRAMES.push(dt => { try { ballFrame(dt); } catch (e) { if (!BALL.err) { BALL.err = e; console.warn('v102 balloons', e); } } });
