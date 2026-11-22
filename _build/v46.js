/* ================================================================
   v46 THE MURMURATION (2026-11-22)
   A flock of pigeons that wheels over the island at dawn and dusk (New York sun), folding and stretching like one
   animal, darker where it is thick. Each bird chases a point on a slowly twisting sheet, with its own lag, so the
   flock pours rather than marches. CLAP or FLOCK sends it up any time of day; at night it roosts out of sight.
   One InstancedMesh, no lights.
   ================================================================ */
const FLOCK = { N: isMobile ? 160 : 380, k: 0, call: 0, t: 0, b: [] };
window.__FLOCK = FLOCK;
(function build() {
  const g = new THREE.BufferGeometry();
  // a pigeon from below: body, two swept wings, a fan tail (flat, both sides)
  const v = [0, 0, 0.22, -0.05, 0, -0.05, 0.05, 0, -0.05, /* L wing */ -0.04, 0, 0.06, -0.42, 0.02, -0.06, -0.04, 0, -0.06, /* R wing */ 0.04, 0, 0.06, 0.04, 0, -0.06, 0.42, 0.02, -0.06, /* tail */ -0.05, 0, -0.05, 0, 0, -0.24, 0.05, 0, -0.05];
  g.setAttribute('position', new THREE.Float32BufferAttribute(v, 3)); g.computeVertexNormals();
  const m = new THREE.MeshBasicMaterial({ color: 0x24252b, side: THREE.DoubleSide });
  const im = new THREE.InstancedMesh(g, m, FLOCK.N); im.frustumCulled = false; im.visible = false; scene.add(im); FLOCK.im = im;
  for (let i = 0; i < FLOCK.N; i++) FLOCK.b.push({ u: Math.random(), v: Math.random(), p: new THREE.Vector3(0, -50, 0), vel: new THREE.Vector3(), ph: Math.random() * 9, lag: 0.6 + Math.random() * 1.6, s: 0.85 + Math.random() * 0.35 });
})();
const flockSecret = secret('murmuration', () => { FLOCK.call = 40; toast('THE PIGEONS GO UP ALL AT ONCE. THEY HAVE BEEN WAITING FOR AN EXCUSE.', 'blue'); try { [0, 0.05, 0.1].forEach(w => beep(90 + Math.random() * 40, 0.12, 'triangle', 0.05, w)); } catch (e) { } }, ['clap', 'flock', 'murmuration']);
const _fm = new THREE.Matrix4(), _fq = new THREE.Quaternion(), _fs = new THREE.Vector3(), _fT = new THREE.Vector3(), _fUp = new THREE.Vector3(0, 1, 0), _fd = new THREE.Vector3(), _fo = new THREE.Object3D();
function flockFrame(dt) {
  const el = SKY.el === undefined ? 20 : SKY.el, golden = el > -5 && el < 9; FLOCK.call = Math.max(0, FLOCK.call - dt);
  const want = golden || FLOCK.call > 0 ? 1 : 0; FLOCK.k += (want - FLOCK.k) * Math.min(1, dt * 0.35);
  if (FLOCK.k < 0.01 && !want) { FLOCK.im.visible = false; FLOCK.b.forEach(b => b.p.set(-150, 10, -60)); return; }
  FLOCK.im.visible = true; FLOCK.t += dt; const t = FLOCK.t;
  // the flock's centre rides a slow loop over the island; when it is leaving it climbs away north west
  const cx = Math.sin(t * 0.07) * 55 + Math.sin(t * 0.19) * 12, cz = Math.cos(t * 0.05) * 45 - 10, cy = 34 + Math.sin(t * 0.13) * 8;
  const away = 1 - FLOCK.k, ax = cx - away * 220, ay = cy + away * 60, az = cz - away * 160;
  const A = t * 0.21, B = t * 0.13, stretch = 1 + 0.6 * Math.sin(t * 0.31), fold = Math.sin(t * 0.17) * 1.4;
  const ca = Math.cos(A), sa = Math.sin(A), cb = Math.cos(B), sb = Math.sin(B);
  const near = Math.hypot(P.x - cx, P.z - cz) < 60;
  for (let i = 0; i < FLOCK.N; i++) { const b = FLOCK.b[i];
    // a point on a sheet that folds over itself (a twisted ribbon), then turned in space
    const u = (b.u - 0.5) * 2, w = (b.v - 0.5) * 2, x0 = u * 26 * stretch, y0 = Math.sin(u * 2.2 + t * 0.6 + fold) * 7 + w * 3, z0 = w * 9 + Math.cos(u * 1.7 - t * 0.4) * 6 * fold;
    const x1 = x0 * ca - z0 * sa, z1 = x0 * sa + z0 * ca, y1 = y0 * cb - z1 * sb * 0.35, z2 = z1 * cb + y0 * sb * 0.35;
    _fT.set(ax + x1, Math.max(8, ay + y1), az + z2);
    // chase the point with a per bird lag, so the flock pours
    _fd.subVectors(_fT, b.p); const acc = Math.min(1, dt * 1.6 / b.lag); b.vel.lerp(_fd.multiplyScalar(1.2 / b.lag), acc); const sp = b.vel.length(); if (sp > 26) b.vel.multiplyScalar(26 / sp);
    b.p.addScaledVector(b.vel, dt);
    _fo.position.copy(b.p); _fd.copy(b.vel); if (_fd.lengthSq() < 0.01) _fd.set(1, 0, 0); _fo.lookAt(_fT.copy(b.p).add(_fd)); _fo.rotateZ(Math.max(-0.7, Math.min(0.7, -b.vel.x * 0.02)));
    const flap = window.__CALM ? 0.8 : 0.35 + 0.65 * Math.abs(Math.cos(t * 13 * (0.8 + 0.2 * b.s) + b.ph)); _fs.set(flap * b.s * 1.4, b.s * 1.4, b.s * 1.4);
    _fo.scale.copy(_fs); _fo.updateMatrix(); FLOCK.im.setMatrixAt(i, _fo.matrix); }
  FLOCK.im.instanceMatrix.needsUpdate = true;
  // the sound of a lot of wings when it passes low and close
  if (near && FLOCK.k > 0.5 && Math.random() < dt * 0.25) try { beep(70 + Math.random() * 30, 0.25, 'triangle', 0.025); } catch (e) { }
}
window.__FRAMES.push(dt => { try { flockFrame(dt); } catch (e) { if (!FLOCK.err) { FLOCK.err = e; console.warn('v46 flock', e); } } });
