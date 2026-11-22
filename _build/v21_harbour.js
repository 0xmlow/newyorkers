/* ================================================================
   v21 THE HARBOUR (2026-11-21)
   A jet ski tied up on the west side of the pier: E to get on, W to throttle, S to brake, A and D (or the mouse)
   to steer, E again to tie up. It leaves a wake and a spray, bounces on the swell, buzzes louder with speed,
   and keeps off the beach. A pod of dolphins leaps in the harbour now and then, and always when you ride out.
   ================================================================ */
(window.__FRAMES = window.__FRAMES || []);
const SKI = { on: false, x: -5.5, z: 162, yaw: PI, v: 0, home: [-5.5, 162], g: null, spray: null, engine: null };
window.__SKI = SKI;
(function jetski() {
  const g = new THREE.Group(), hullM = new THREE.MeshStandardMaterial({ color: 0x2962ff, roughness: 0.3, metalness: 0.2 }), white = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.35 }), blk = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.5 });
  const sh = new THREE.Shape(); sh.moveTo(0, 1.5); sh.quadraticCurveTo(0.55, 0.9, 0.55, -0.2); sh.lineTo(0.5, -1.2); sh.lineTo(-0.5, -1.2); sh.lineTo(-0.55, -0.2); sh.quadraticCurveTo(-0.55, 0.9, 0, 1.5);
  const hull = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.45, bevelEnabled: true, bevelThickness: 0.08, bevelSize: 0.08, bevelSegments: 3 }), hullM); hull.rotation.x = PI / 2; hull.position.y = 0.45; g.add(hull);
  const deck = new THREE.Mesh(new THREE.ExtrudeGeometry(sh, { depth: 0.05, bevelEnabled: false }), white); deck.rotation.x = PI / 2; deck.position.y = 0.5; deck.scale.set(0.85, 0.85, 1); g.add(deck);
  const seat = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.18, 1.1), blk); seat.position.set(0, 0.62, -0.45); g.add(seat);
  const col = new THREE.Mesh(new THREE.BoxGeometry(0.34, 0.35, 0.3), hullM); col.position.set(0, 0.72, 0.45); col.rotation.x = -0.4; g.add(col);
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.025, 0.8, 8), blk); bar.rotation.z = PI / 2; bar.position.set(0, 0.92, 0.42); g.add(bar);
  const dec = signTex([{ t: 'N3W', s: 0.7 }], 256, 96, null, '#FFFFFF'); [-1, 1].forEach(s => { const d = new THREE.Mesh(new THREE.PlaneGeometry(0.8, 0.3), new THREE.MeshBasicMaterial({ map: dec, transparent: true })); d.position.set(s * 0.6, 0.32, 0.2); d.rotation.y = s * PI / 2; g.add(d); });
  g.position.set(SKI.x, 0.05, SKI.z); g.rotation.y = SKI.yaw; scene.add(g); SKI.g = g;
  const N = 220, gg = new THREE.BufferGeometry(), pos = new Float32Array(N * 3).fill(-999); gg.setAttribute('position', new THREE.BufferAttribute(pos, 3));
  const pts = new THREE.Points(gg, new THREE.PointsMaterial({ size: 0.7, map: LIFE.soft, color: 0xf2fbff, transparent: true, opacity: 0.85, depthWrite: false })); pts.frustumCulled = false; scene.add(pts);
  SKI.spray = { pts, pos, v: Array.from({ length: N }, () => [0, 0, 0, 0]), i: 0 };
  const wg = new THREE.PlaneGeometry(1, 1); wg.rotateX(-PI / 2);
  const wake = new THREE.InstancedMesh(wg, new THREE.MeshBasicMaterial({ map: LIFE.soft, color: 0xffffff, transparent: true, opacity: 0.5, depthWrite: false }), 60); wake.instanceMatrix.setUsage(THREE.DynamicDrawUsage); wake.frustumCulled = false; wake.count = 0; scene.add(wake);
  SKI.wake = { mesh: wake, d: Array.from({ length: 60 }, () => ({ x: 0, z: 0, t: 9, s: 1 })), i: 0, acc: 0 };
})();
const skiSecret = secret('jetski', () => { });
function skiOn() { SKI.on = true; window.__DRIVE = true; skiSecret(); SKI.v = 0; toast('ON THE JET SKI. W THROTTLE, S BRAKE, A D OR THE MOUSE TO STEER, E TO TIE UP.'); DOLPH.next = 4;
  try { if (AC && AC.state === 'running' && !SKI.engine) { const o = AC.createOscillator(), f = AC.createBiquadFilter(), g = AC.createGain(); o.type = 'sawtooth'; o.frequency.value = 60; f.type = 'lowpass'; f.frequency.value = 500; g.gain.value = 0; o.connect(f); f.connect(g); g.connect(AC.destination); o.start(); SKI.engine = { o, g, f }; } } catch (e) { } }
function skiOff() { SKI.on = false; window.__DRIVE = false; SKI.x = SKI.home[0]; SKI.z = SKI.home[1]; SKI.yaw = PI; SKI.v = 0; teleport(-1.6, 162, PI / 2); toast('TIED UP AT THE PIER.', 'blue'); if (SKI.engine) SKI.engine.g.gain.value = 0; }
interact(-1.6, 162, 2.6, '', () => { }); SKI.inter = INTER[INTER.length - 1];
addEventListener('keydown', e => { if (SKI.on && e.code === 'KeyE' && SKI.ready) { e.stopImmediatePropagation(); skiOff(); } }, true);

/* dolphins */
const DOLPH = { pod: [], next: 25 }; window.__DOLPH = DOLPH;
(function dolphins() {
  const skin = new THREE.MeshStandardMaterial({ color: 0x6f7f8f, roughness: 0.4 }), bel = new THREE.MeshStandardMaterial({ color: 0xd8dde2, roughness: 0.5 });
  for (let i = 0; i < 3; i++) { const g = new THREE.Group(); const b = new THREE.Mesh(new THREE.SphereGeometry(0.45, 14, 10), skin); b.scale.set(0.8, 0.75, 2.6); g.add(b);
    const be = new THREE.Mesh(new THREE.SphereGeometry(0.42, 12, 8, 0, PI * 2, PI * 0.55, PI * 0.45), bel); be.scale.set(0.78, 0.7, 2.5); g.add(be);
    const sn = new THREE.Mesh(new THREE.ConeGeometry(0.14, 0.5, 8), skin); sn.rotation.x = PI / 2; sn.position.z = 1.3; g.add(sn);
    const fin = new THREE.Mesh(new THREE.ConeGeometry(0.16, 0.5, 4), skin); fin.position.set(0, 0.45, -0.1); fin.rotation.x = -0.4; fin.scale.z = 0.3; g.add(fin);
    const tail = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.3), skin); tail.position.z = -1.25; g.add(tail);
    g.visible = false; scene.add(g); DOLPH.pod.push({ g, t: -1 }); }
})();
function dolphFrame(dt) {
  DOLPH.next -= dt;
  if (DOLPH.next <= 0) { DOLPH.next = SKI.on ? 14 : 35 + Math.random() * 30; const bx = SKI.on ? SKI.x : -20 + Math.random() * 60, bz = SKI.on ? SKI.z : 180 + Math.random() * 40; const a = SKI.on ? -SKI.yaw + PI / 2 + (Math.random() - 0.5) : Math.random() * PI * 2;
    const ox = SKI.on ? Math.cos(-SKI.yaw - PI / 2) * 9 : 0, oz = SKI.on ? Math.sin(-SKI.yaw - PI / 2) * 9 : 0;
    DOLPH.pod.forEach((d, i) => { d.t = -i * 0.35; d.x = bx + ox + (i - 1) * 2.2; d.z = bz + oz + (i % 2) * 1.5; d.a = a; d.g.visible = true; }); }
  DOLPH.pod.forEach(d => { if (d.t === -1 && !d.g.visible) return; d.t += dt; if (d.t < 0) { d.g.visible = false; return; } const D = 1.4, k = d.t / D;
    if (k > 3) { d.g.visible = false; d.t = -1; return; } const kk = k % 1, hop = Math.floor(k);
    const fx = Math.sin(d.a), fz = Math.cos(d.a); d.g.visible = true; d.g.position.set(d.x + fx * (k * 5), -0.6 + Math.sin(kk * PI) * 2.1, d.z + fz * (k * 5)); d.g.rotation.set(-(kk - 0.5) * 1.8, d.a, 0);
    if (kk < dt / D * 1.5 && Math.hypot(P.x - d.g.position.x, P.z - d.g.position.z) < 60) splashAt && splashAt(d.g.position.x, d.g.position.z, 12); });
}

function skiFrame(dt) {
  const near = !SKI.on && Math.hypot(P.x - SKI.home[0], P.z - SKI.home[1]) < 5; SKI.inter.label = near ? 'E · RIDE THE JET SKI' : ''; SKI.inter.fn = near ? skiOn : () => { };
  SKI.ready = SKI.on && (SKI.ready || (SKI.readyT = (SKI.readyT || 0) + dt) > 0.4); if (!SKI.on) SKI.readyT = 0;
  const S = SKI.spray, W = SKI.wake, m = new THREE.Matrix4();
  if (SKI.on) {
    const thr = (keys.KeyW || keys.ArrowUp || (joy && joy.y < -0.3)) ? 1 : 0, brk = (keys.KeyS || keys.ArrowDown) ? 1 : 0, steer = ((keys.KeyA || keys.ArrowLeft) ? 1 : 0) - ((keys.KeyD || keys.ArrowRight) ? 1 : 0);
    SKI.v += (thr * 14 - brk * 10 - SKI.v * 0.55) * dt; SKI.v = Math.max(-3, Math.min(22, SKI.v));
    P.yaw += steer * dt * (0.8 + Math.min(1.4, Math.abs(SKI.v) * 0.08)); SKI.yaw = P.yaw;
    const fx = -Math.sin(SKI.yaw), fz = -Math.cos(SKI.yaw); let nx = SKI.x + fx * SKI.v * dt, nz = SKI.z + fz * SKI.v * dt;
    const r = Math.hypot(nx, nz); if (r < SHORE + 3) { nx *= (SHORE + 3) / r; nz *= (SHORE + 3) / r; SKI.v *= 0.6; } if (Math.abs(nx) < 2.6 && nz > 138 && nz < 182) { nx = SKI.x; SKI.v *= -0.3; }
    const cr = Math.hypot(nx - 58, nz - 262); if (cr < 30) { nx = 58 + (nx - 58) * 30 / cr; nz = 262 + (nz - 262) * 30 / cr; SKI.v *= 0.7; }
    if (r > 480) { nx *= 480 / r; nz *= 480 / r; }
    SKI.x = nx; SKI.z = nz; const bob = Math.sin(LIFE.t * 2.4) * 0.12 + Math.sin(LIFE.t * 5.1 + SKI.x * 0.1) * 0.05 * Math.min(1, SKI.v / 8);
    P.x = SKI.x - fx * 0.45; P.z = SKI.z - fz * 0.45; P.y = -0.45 + bob; P.ground = true; P.vy = 0;
    SKI.g.position.set(SKI.x, 0.05 + bob, SKI.z); SKI.g.rotation.set(-Math.min(0.25, SKI.v * 0.012), SKI.yaw + PI, -steer * Math.min(0.35, SKI.v * 0.02), 'YXZ');
    if (SKI.engine) { SKI.engine.o.frequency.value = 55 + Math.abs(SKI.v) * 7; SKI.engine.f.frequency.value = 300 + Math.abs(SKI.v) * 60; SKI.engine.g.gain.value = (oceanGain && oceanGain.gain.value > 0) ? 0.025 + Math.abs(SKI.v) * 0.002 : 0; }
    if (Math.abs(SKI.v) > 3) { for (let k = 0; k < 3; k++) { const i = S.i = (S.i + 1) % S.v.length, side = k % 2 ? 1 : -1; S.pos[i * 3] = SKI.x - fx * 1.1 + fz * side * 0.4; S.pos[i * 3 + 1] = 0.3; S.pos[i * 3 + 2] = SKI.z - fz * 1.1 - fx * side * 0.4; S.v[i] = [-fx * 2 + fz * side * 2.5, 2 + Math.random() * 2 * SKI.v / 10, -fz * 2 - fx * side * 2.5, 0.9]; }
      W.acc += dt; if (W.acc > 0.06) { W.acc = 0; const d = W.d[W.i = (W.i + 1) % W.d.length]; d.x = SKI.x - fx * 1.2; d.z = SKI.z - fz * 1.2; d.t = 0; d.yaw = SKI.yaw; } }
  } else { SKI.g.position.set(SKI.home[0], 0.05 + Math.sin(LIFE.t * 1.6) * 0.06, SKI.home[1]); SKI.g.rotation.set(0, PI + PI, Math.sin(LIFE.t * 1.2) * 0.05); }
  let any = false; for (let i = 0; i < S.v.length; i++) { const v = S.v[i]; if (v[3] <= 0) continue; any = true; v[3] -= dt; v[1] -= 9 * dt; S.pos[i * 3] += v[0] * dt; S.pos[i * 3 + 1] += v[1] * dt; S.pos[i * 3 + 2] += v[2] * dt; if (v[3] <= 0 || S.pos[i * 3 + 1] < 0) { v[3] = 0; S.pos[i * 3 + 1] = -999; } }
  S.pts.visible = any; if (any) S.pts.geometry.attributes.position.needsUpdate = true;
  let n = 0; W.d.forEach(d => { if (d.t > 3) return; d.t += dt; const s = 0.8 + d.t * 2.4; m.makeRotationY(d.yaw || 0); m.scale(new THREE.Vector3(s * 0.7, 1, s)); m.setPosition(d.x, 0.06, d.z); W.mesh.setMatrixAt(n++, m); });
  W.mesh.count = n; W.mesh.instanceMatrix.needsUpdate = true; W.mesh.material.opacity = 0.45;
}
window.__FRAMES.push(dt => { try { skiFrame(dt); dolphFrame(dt); } catch (e) { if (!SKI.err) { SKI.err = e; console.warn('v21 harbour', e); } } });
