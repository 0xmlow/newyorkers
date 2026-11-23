/* ================================================================
   v115 THE DOG RUN (2026-11-23)
   A fenced dog run on the west grass at (-86, 13): wood chips, a double gate, a water bowl, a bench, and four real
   dogs (CC0, rigged) who never stop: one chases a ball someone keeps throwing, two chase each other in loops, one
   lies by the bowl eating until it decides it is time to gallop. E at the gate throws the ball yourself.
   ================================================================ */
const DRUN = { d: [], ball: null, bx: 0, bz: 0, by: 0, vx: 0, vz: 0, vy: 0, t: 0 };
window.__DRUN = DRUN;
const DRUN_AT = { x: -86, z: 13, w: 9, l: 9 };
(function dogRun() {
  const x0 = DRUN_AT.x, z0 = DRUN_AT.z, g0 = ground(x0, z0), W = DRUN_AT.w, Lz = DRUN_AT.l; DRUN.g0 = g0;
  const chips = new THREE.Mesh(new THREE.PlaneGeometry(W, Lz), new THREE.MeshStandardMaterial({ map: tex('assets/sand_c.webp', [3, 3]), color: 0x8a6a48, roughness: 1, polygonOffset: true, polygonOffsetFactor: -2 })); chips.rotation.x = -PI / 2; chips.position.set(x0, g0 + 0.03, z0); chips.receiveShadow = true; scene.add(chips);
  const iron = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.5, metalness: 0.6 });
  const fence = (ax, az, bx, bz) => { const L2 = Math.hypot(bx - ax, bz - az), ry = Math.atan2(-(bz - az), bx - ax); const top = new THREE.Mesh(new THREE.BoxGeometry(L2, 0.05, 0.05), iron); top.position.set((ax + bx) / 2, g0 + 1.1, (az + bz) / 2); top.rotation.y = ry; scene.add(top);
    for (let u = 0; u <= 1.0001; u += 0.5 / L2) { const p = new THREE.Mesh(new THREE.BoxGeometry(0.025, 1.1, 0.025), iron); p.position.set(ax + (bx - ax) * u, g0 + 0.55, az + (bz - az) * u); scene.add(p); } wall(ax, az, bx, bz, -5, g0 + 1.15); };
  const hx = W / 2, hz = Lz / 2; fence(x0 - hx, z0 - hz, x0 + hx, z0 - hz); fence(x0 - hx, z0 + hz, x0 + hx, z0 + hz); fence(x0 - hx, z0 - hz, x0 - hx, z0 + hz); fence(x0 + hx, z0 - hz, x0 + hx, z0 - 0.8); fence(x0 + hx, z0 + 0.8, x0 + hx, z0 + hz);   // the gate gap faces the island
  const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.2, 0.16, 0.08, 16), new THREE.MeshStandardMaterial({ color: 0xc9cdd1, metalness: 0.9, roughness: 0.2 })); bowl.position.set(x0 - hx + 0.8, g0 + 0.05, z0 + hz - 0.8); scene.add(bowl); DRUN.bowl = [bowl.position.x, bowl.position.z];
  const ball = new THREE.Mesh(new THREE.SphereGeometry(0.07, 12, 8), new THREE.MeshStandardMaterial({ color: 0xd8f03a, roughness: 0.7 })); ball.castShadow = true; scene.add(ball); DRUN.ball = ball; DRUN.bx = x0; DRUN.bz = z0;
  const sign = new THREE.Mesh(new THREE.PlaneGeometry(1.2, 0.4), new THREE.MeshBasicMaterial({ map: signTex([{ t: 'DOG RUN', s: 0.42 }, { t: 'CLOSE THE GATE', s: 0.16 }], 512, 170, '#2f4a33', '#efe8da'), side: THREE.DoubleSide })); sign.position.set(x0 + hx + 0.05, g0 + 1.5, z0 - 1.4); sign.rotation.y = PI / 2; scene.add(sign);
  [['shiba', 0.6, undefined, 'ball'], ['husky', 0.74, undefined, 'chase'], ['shiba', 0.5, 0x2a2622, 'chase'], ['husky', 0.68, 0xd9c3a0, 'bowl']].forEach(([n, h, tint, role], i) => { const hh = CC0.make(n, { h, tint, runAt: 2.4, runSp: 6, walkSp: 1.1, idleAlt: 'eat' }); DRUN.d.push({ h: hh, role, x: x0 + (i - 1.5) * 1.5, z: z0, yaw: 0, ph: i * 1.9, t: 0 }); });
  interact(x0 + hx + 1.0, z0, 1.8, 'E · THROW THE BALL', () => drunThrow(true));
  if (window.__MAP) MAP.places.push(['DOG RUN', x0, z0, x0 + hx + 2, z0]);
})();
const drunSecret = secret('dogrun', () => { toast('THE SHIBA BRINGS IT BACK AND DROPS IT AT YOUR FEET AND LOOKS AT YOU LIKE YOU ARE THE ONLY PERSON ON EARTH. THROW IT AGAIN.', 'blue'); });
function drunThrow(you) { const a = Math.random() * PI * 2, sp = 6 + Math.random() * 3; DRUN.bx = you ? DRUN_AT.x + DRUN_AT.w / 2 - 0.5 : DRUN.bx; DRUN.bz = you ? DRUN_AT.z : DRUN.bz; DRUN.by = 1.2; DRUN.vx = -Math.abs(Math.cos(a)) * sp; DRUN.vz = Math.sin(a) * sp * 0.6; DRUN.vy = 4; DRUN.you = you; DRUN.t = 0; }
function drunFrame(dt) {
  const d0 = Math.hypot(P.x - DRUN_AT.x, P.z - DRUN_AT.z); if (d0 > 110) return; const hx = DRUN_AT.w / 2 - 0.5, hz = DRUN_AT.l / 2 - 0.5, X0 = DRUN_AT.x, Z0 = DRUN_AT.z;
  // the ball
  DRUN.vy -= 12 * dt; DRUN.bx += DRUN.vx * dt; DRUN.bz += DRUN.vz * dt; DRUN.by += DRUN.vy * dt; if (DRUN.by < 0.07) { DRUN.by = 0.07; DRUN.vy *= -0.45; DRUN.vx *= 0.8; DRUN.vz *= 0.8; }
  if (Math.abs(DRUN.bx - X0) > hx) { DRUN.bx = X0 + Math.sign(DRUN.bx - X0) * hx; DRUN.vx *= -0.5; } if (Math.abs(DRUN.bz - Z0) > hz) { DRUN.bz = Z0 + Math.sign(DRUN.bz - Z0) * hz; DRUN.vz *= -0.5; }
  DRUN.t += dt; if (DRUN.t > 9) drunThrow(false);
  DRUN.d.forEach((d, i) => { d.t += dt; let tx = d.x, tz = d.z, sp = 0;
    if (d.role === 'ball') { tx = DRUN.bx; tz = DRUN.bz; sp = 6.2; if (Math.hypot(tx - d.x, tz - d.z) < 0.35 && DRUN.by < 0.3) { DRUN.vx = DRUN.vz = 0; if (DRUN.you && DRUN.t > 1) { DRUN.you = false; drunSecret(); } DRUN.bx = d.x + Math.sin(d.yaw) * 0.35; DRUN.bz = d.z + Math.cos(d.yaw) * 0.35; DRUN.by = 0.3; sp = 0; } }
    else if (d.role === 'chase') { const a = LIFE.t * 0.9 + d.ph, r = 2.6 + Math.sin(LIFE.t * 0.3 + i) * 0.8; tx = X0 + Math.cos(a) * r; tz = Z0 + Math.sin(a * 1.3) * Math.min(r, hz); sp = 5.5; }
    else { const k = (LIFE.t * 0.05) % 1; if (k < 0.7) { tx = DRUN.bowl[0] + 0.4; tz = DRUN.bowl[1] - 0.4; sp = 1.2; } else { const a = LIFE.t * 1.2; tx = X0 + Math.cos(a) * 3; tz = Z0 + Math.sin(a) * 3; sp = 6; } }
    const dx = tx - d.x, dz = tz - d.z, dd = Math.hypot(dx, dz); if (dd > 0.25) { const st = Math.min(dd, sp * dt); d.x += dx / dd * st; d.z += dz / dd * st; const ty = Math.atan2(dx, dz); let dy = Math.atan2(Math.sin(ty - d.yaw), Math.cos(ty - d.yaw)); d.yaw += dy * Math.min(1, dt * 7); }
    d.x = Math.max(X0 - hx, Math.min(X0 + hx, d.x)); d.z = Math.max(Z0 - hz, Math.min(Z0 + hz, d.z)); d.h.root.position.set(d.x, DRUN.g0 + 0.03, d.z); d.h.root.rotation.y = d.yaw; });
  DRUN.ball.position.set(DRUN.bx, DRUN.g0 + DRUN.by, DRUN.bz);
}
window.__FRAMES.push(dt => { try { drunFrame(dt); } catch (e) { if (!DRUN.err) { DRUN.err = e; console.warn('v115 dog run', e); } } });
