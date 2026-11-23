/* ================================================================
   v156 BOCCE (2026-11-23)
   A crushed stone bocce court at (9, -84) with low timber sides, where four old men play every afternoon the way
   they still do in Carroll Gardens: the pallino rolled out first, then red and green balls rolled underhand in
   turn, real rolling on the gravel (friction, the balls knocking each other with a clack), then all four walk up
   to stare at who is closest and argue about it. E when it is quiet between ends: they let you roll one. Get
   closest to the pallino and it counts.
   ================================================================ */
const BOCCE = { X: 9, Z: -84, L: 12, W: 2.6, balls: [], st: 'wait', t: 0, turn: 0, you: false };
window.__BOCCE = BOCCE;
(function bocce() {
  const X = BOCCE.X, Z = BOCCE.Z, g0 = ground(X, Z), L = BOCCE.L, W = BOCCE.W; BOCCE.y = g0 + 0.08;
  const bed = new THREE.Mesh(new THREE.PlaneGeometry(L, W), new THREE.MeshStandardMaterial({ map: tex('assets/sand_c.webp', [6, 1.4]), color: 0xb8a888, roughness: 1 })); bed.rotation.x = -PI / 2; bed.position.set(X, g0 + 0.06, Z); bed.receiveShadow = true; scene.add(bed);
  const wood = new THREE.MeshStandardMaterial({ color: 0x6b5236, roughness: 0.9 }); [[0, -W / 2, L + 0.3, 0.15], [0, W / 2, L + 0.3, 0.15], [-L / 2, 0, 0.15, W], [L / 2, 0, 0.15, W]].forEach(([dx, dz, w, d]) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.25, d), wood); b.position.set(X + dx, g0 + 0.12, Z + dz); b.castShadow = true; scene.add(b); });
  boxWalls(X, Z, L + 0.3, W + 0.15, 0, -5, g0 + 0.25);
  const mk = (r, c) => { const m = new THREE.Mesh(new THREE.SphereGeometry(r, 16, 12), new THREE.MeshStandardMaterial({ color: c, roughness: 0.25, metalness: 0.1 })); m.castShadow = true; scene.add(m); return m; };
  BOCCE.pal = { m: mk(0.03, 0xf2f0ea), x: X, z: Z, vx: 0, vz: 0, r: 0.03 };
  for (let i = 0; i < 8; i++) BOCCE.balls.push({ m: mk(0.055, i % 2 ? 0x2f6a3a : 0xb3121b), x: X - L / 2 - 1, z: Z + (i - 3.5) * 0.15, vx: 0, vz: 0, r: 0.055, team: i % 2, out: true });
  BOCCE.men = [0x8a8f99, 0x2a2f45, 0xe8e2d4, 0x5a4a3a].map((c, i) => { const p = person(c, 0x2a2a2e, SKIN[(i * 2 + 3) % SKIN.length], ['wiseguy', 'cabbie', 'writer', 'wiseguy'][i]); const cap = new THREE.Mesh(new THREE.CylinderGeometry(0.17, 0.18, 0.07, 12), new THREE.MeshStandardMaterial({ color: 0x3a3a34, roughness: 0.9 })); cap.position.set(0, 1.98, 0.02); p.g.add(cap); const hx = X - L / 2 - 0.9, hz = Z + (i - 1.5) * 0.7; p.g.position.set(hx, g0 - 0.35, hz); p.g.rotation.y = PI / 2; return { P: p, hx, hz }; });
  interact(X - L / 2 - 1.2, Z + W / 2 + 0.8, 1.6, 'E · ROLL ONE', () => { if (BOCCE.st !== 'wait') { toast('WAIT FOR THE END. THEY ARE VERY SERIOUS ABOUT THIS.'); return; } BOCCE.you = true; bocceStart(); toast('THEY HAND YOU A RED ONE. ROLL IT.'); });
  if (window.__MAP) MAP.places.push(['BOCCE', X, Z, X - L / 2 - 1.5, Z + 2]);
})();
const bocceSecret = secret('bocce', () => { toast('YOURS IS CLOSEST. THE FOUR OF THEM MEASURE IT TWICE WITH A STRING. ONE OF THEM SAYS SOMETHING IN NEAPOLITAN THAT IS PROBABLY A COMPLIMENT.', 'blue'); });
function bocceStart() { const X = BOCCE.X, L = BOCCE.L; BOCCE.st = 'pal'; BOCCE.t = 0; BOCCE.turn = 0; BOCCE.balls.forEach(b => { b.out = true; b.m.visible = false; }); const p = BOCCE.pal; p.x = X - L / 2 + 0.3; p.z = BOCCE.Z; p.vx = 4.2 + Math.random() * 1.2; p.vz = (Math.random() - 0.5) * 0.4; }
function bocceRoll(b, you) { const p = BOCCE.pal, dist = p.x - (BOCCE.X - BOCCE.L / 2 + 0.3); b.out = false; b.m.visible = true; b.x = BOCCE.X - BOCCE.L / 2 + 0.3; b.z = BOCCE.Z + (Math.random() - 0.5) * 0.5; const err = you ? (Math.random() - 0.45) * 2.2 : (Math.random() - 0.5) * 1.4; b.vx = Math.sqrt(2 * 0.9 * Math.max(0.5, dist + err)); b.vz = (p.z - b.z) / Math.max(0.5, dist) * b.vx * 0.9 + (Math.random() - 0.5) * 0.15; }
function boccePhys(dt) { const all = [BOCCE.pal].concat(BOCCE.balls.filter(b => !b.out)), X = BOCCE.X, Z = BOCCE.Z, hx = BOCCE.L / 2 - 0.05, hz = BOCCE.W / 2 - 0.05; let moving = false;
  all.forEach(b => { const s = Math.hypot(b.vx, b.vz); if (s > 0.01) { moving = true; const ns = Math.max(0, s - 0.9 * dt); b.vx *= ns / s; b.vz *= ns / s; b.x += b.vx * dt; b.z += b.vz * dt; if (Math.abs(b.x - X) > hx) { b.x = X + Math.sign(b.x - X) * hx; b.vx *= -0.4; } if (Math.abs(b.z - Z) > hz) { b.z = Z + Math.sign(b.z - Z) * hz; b.vz *= -0.4; } } else b.vx = b.vz = 0; });
  for (let i = 0; i < all.length; i++) for (let j = i + 1; j < all.length; j++) { const a = all[i], c = all[j], dx = c.x - a.x, dz = c.z - a.z, d = Math.hypot(dx, dz), m = a.r + c.r; if (d < m && d > 1e-5) { const nx = dx / d, nz = dz / d, rel = (a.vx - c.vx) * nx + (a.vz - c.vz) * nz; if (rel > 0) { const ma = a.r * a.r * a.r, mc = c.r * c.r * c.r, k = 2 * rel / (ma + mc) * 0.9; a.vx -= k * mc * nx; a.vz -= k * mc * nz; c.vx += k * ma * nx; c.vz += k * ma * nz; if (Math.hypot(P.x - a.x, P.z - a.z) < 25) { try { beep(1300, 0.03, 'square', 0.03); } catch (e) { } } } const o = (m - d) / 2; a.x -= nx * o; a.z -= nz * o; c.x += nx * o; c.z += nz * o; } }
  all.forEach(b => { b.m.position.set(b.x, BOCCE.y + b.r, b.z); b.m.rotation.z -= b.vx * dt / b.r; }); return moving; }
function bocceFrame(dt) {
  const h = nycTime(TIME.utc).hours, W = WX.override || WX.cur, on = h >= 12 && h < 18 && W !== 'RAIN' && W !== 'SNOW'; BOCCE.men.forEach(m => m.P.g.visible = on); const d = Math.hypot(P.x - BOCCE.X, P.z - BOCCE.Z); if (d > 70) return;
  if (!on && !BOCCE.you) { BOCCE.st = 'wait'; return; } BOCCE.t += dt; const moving = boccePhys(dt);
  if (BOCCE.st === 'wait') { if (BOCCE.t > 6 && on) bocceStart(); }
  else if (BOCCE.st === 'pal') { if (!moving && BOCCE.t > 1) { BOCCE.st = 'roll'; BOCCE.t = 0; } }
  else if (BOCCE.st === 'roll') { const i = BOCCE.turn; if (BOCCE.t > 2.2 && !moving) { if (i >= 8) { BOCCE.st = 'look'; BOCCE.t = 0; } else { const thrower = BOCCE.men[i % 4]; thrower.swing = 0.8; bocceRoll(BOCCE.balls[i], BOCCE.you && i === 0); BOCCE.turn++; BOCCE.t = 0; } } }
  else if (BOCCE.st === 'look') { const p = BOCCE.pal; let best = -1, bd = 99; BOCCE.balls.forEach((b, i) => { const dd = Math.hypot(b.x - p.x, b.z - p.z); if (dd < bd) { bd = dd; best = i; } });
    if (BOCCE.t < 0.1 && BOCCE.you && best === 0 && d < 15) bocceSecret(); if (BOCCE.t > 9) { BOCCE.st = 'wait'; BOCCE.t = 0; BOCCE.you = false; } }
  BOCCE.men.forEach((m, i) => { const look = BOCCE.st === 'look'; const tx = look ? BOCCE.pal.x - 0.8 + (i % 2) * 1.6 : m.hx, tz = look ? BOCCE.pal.z + (i < 2 ? -0.95 : 0.95) * (BOCCE.W / 2 + 0.3) / 1.2 : m.hz; const g = m.P.g, dx = tx - g.position.x, dz = tz - g.position.z, dd = Math.hypot(dx, dz);
    if (dd > 0.1) { g.position.x += dx / dd * Math.min(dd, 1.1 * dt); g.position.z += dz / dd * Math.min(dd, 1.1 * dt); g.rotation.y = Math.atan2(dx, dz); } else if (look) g.rotation.y = Math.atan2(BOCCE.pal.x - g.position.x, BOCCE.pal.z - g.position.z); else g.rotation.y = PI / 2;
    animLegs(m.P, LIFE.t + i, dd > 0.1); m.swing = Math.max(0, (m.swing || 0) - dt); if (m.swing > 0) m.P.arms[1].rotation.x = -Math.sin((0.8 - m.swing) / 0.8 * PI) * 1.4; if (look && dd <= 0.1) m.P.arms[i % 2].rotation.x = -0.9 + Math.sin(LIFE.t * 4 + i) * 0.5; });
}
window.__FRAMES.push(dt => { try { bocceFrame(dt); } catch (e) { if (!BOCCE.err) { BOCCE.err = e; console.warn('v156 bocce', e); } } });
