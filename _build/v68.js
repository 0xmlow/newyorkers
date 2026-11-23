/* ================================================================
   v68 THE RINK (2026-11-22)
   A small outdoor ice rink at (-78, 35): scuffed white ice with the blue line, white boards with a rail, a gap to
   walk in, string lights over it, and five skaters going round counterclockwise like they do. On the ice you keep
   your momentum: you push, you glide, you take a while to stop. Glide thirty metres and the island counts it.
   ICESKATE puts you on the ice.
   ================================================================ */
const RINK = { s: [], vx: 0, vz: 0, px: 0, pz: 0, on: false, glide: 0 };
window.__RINK = RINK;
const RINK_AT = { x: -78, z: 35, a: 7.2, b: 4.6 };
(function rink() {
  const x0 = RINK_AT.x, z0 = RINK_AT.z, A = RINK_AT.a, Bz = RINK_AT.b, g0 = ground(x0, z0); RINK.g0 = g0;
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 660; const c = cv.getContext('2d');
  if (c && c.fillRect && c.beginPath) { c.fillStyle = '#e8eef2'; c.fillRect(0, 0, 1024, 660); for (let i = 0; i < 900; i++) { c.strokeStyle = `rgba(150,170,185,${Math.random() * 0.25})`; c.lineWidth = 1; c.beginPath(); const x = Math.random() * 1024, y = Math.random() * 660, a = Math.random() * 6, l = 20 + Math.random() * 120; c.moveTo(x, y); c.quadraticCurveTo && c.quadraticCurveTo(x + Math.cos(a) * l * 0.5 + 10, y + Math.sin(a) * l * 0.5, x + Math.cos(a) * l, y + Math.sin(a) * l); c.stroke(); }
    c.fillStyle = 'rgba(41,98,255,.55)'; c.fillRect(330, 0, 14, 660); c.fillRect(680, 0, 14, 660); c.fillStyle = 'rgba(200,40,60,.5)'; c.fillRect(508, 0, 8, 660);
    c.strokeStyle = 'rgba(200,40,60,.5)'; c.lineWidth = 6; c.beginPath(); c.arc(512, 330, 90, 0, PI * 2); c.stroke(); }
  const it = new THREE.CanvasTexture(cv); it.encoding = THREE.sRGBEncoding; it.anisotropy = ANISO;
  const ice = new THREE.Mesh(new THREE.CircleGeometry(1, 64), new THREE.MeshStandardMaterial({ map: it, roughness: 0.08, metalness: 0.15 })); ice.scale.set(A, Bz, 1); ice.rotation.x = -PI / 2; ice.position.set(x0, g0 + 0.06, z0); ice.receiveShadow = true; scene.add(ice);
  // boards: an ellipse of short white panels, with a gap facing the island
  const white = new THREE.MeshStandardMaterial({ color: 0xf2f2ee, roughness: 0.5 }), railM = new THREE.MeshStandardMaterial({ color: 0x2962FF, roughness: 0.4 });
  const gapA = Math.atan2(-z0, -x0 * Bz / A); const n = 44;
  for (let i = 0; i < n; i++) { const a0 = i / n * PI * 2, a1 = (i + 1) / n * PI * 2, am = (a0 + a1) / 2; let da = Math.atan2(Math.sin(am - gapA), Math.cos(am - gapA)); if (Math.abs(da) < 0.11) continue;
    const xA = x0 + Math.cos(a0) * (A + 0.1), zA = z0 + Math.sin(a0) * (Bz + 0.1), xB = x0 + Math.cos(a1) * (A + 0.1), zB = z0 + Math.sin(a1) * (Bz + 0.1);
    const len = Math.hypot(xB - xA, zB - zA), ry = Math.atan2(-(zB - zA), xB - xA);
    const p = new THREE.Mesh(new THREE.BoxGeometry(len + 0.02, 1.0, 0.08), white); p.position.set((xA + xB) / 2, g0 + 0.5, (zA + zB) / 2); p.rotation.y = ry; scene.add(p);
    const r = new THREE.Mesh(new THREE.BoxGeometry(len + 0.02, 0.06, 0.14), railM); r.position.set((xA + xB) / 2, g0 + 1.02, (zA + zB) / 2); r.rotation.y = ry; scene.add(r);
    wall(xA, zA, xB, zB, -5, g0 + 1.05); }
  // string lights on four poles
  const poles = [[-1, -1], [1, -1], [1, 1], [-1, 1]].map(([sx, sz]) => [x0 + sx * (A + 1.4), z0 + sz * (Bz + 1.4)]); const pm = new THREE.MeshStandardMaterial({ color: 0x1b1d20, roughness: 0.5, metalness: 0.5 });
  poles.forEach(([x, z]) => { const p = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.07, 5, 8), pm); p.position.set(x, ground(x, z) + 2.5, z); scene.add(p); post(x, z, 0.12, -5, 6); });
  const bulbG = new THREE.SphereGeometry(0.07, 8, 6), bulbs = new THREE.InstancedMesh(bulbG, new THREE.MeshBasicMaterial({ color: 0xffe2a8, toneMapped: false }), 120); const o = new THREE.Object3D(); let k = 0;
  [[0, 2], [1, 3], [0, 1], [2, 3], [1, 2], [3, 0]].forEach(([a, b]) => { const [ax, az] = poles[a], [bx2, bz2] = poles[b]; for (let i = 0; i < 20 && k < 120; i++) { const u = (i + 0.5) / 20; o.position.set(ax + (bx2 - ax) * u, g0 + 4.9 - Math.sin(u * PI) * 1.1, az + (bz2 - az) * u); o.updateMatrix(); bulbs.setMatrixAt(k++, o.matrix); } });
  bulbs.count = k; scene.add(bulbs); RINK.bulbs = bulbs;
  // skaters
  [[0x7a1f2a, 0x15161a, 'actress'], [0x2a4a6a, 0x2a2f45, 'editor'], [0xefe8da, 0x3b4a5c, 'workgirl'], [0x2f4a33, 0x15161a, 'writer'], [0xe2581c, 0x2a2f45, 'cabbie']].forEach(([sh, pa, cast], i) => {
    const p = person(sh, pa, SKIN[(i * 3 + 2) % SKIN.length], cast); RINK.s.push({ P: p, a: i / 5 * PI * 2, sp: 0.16 + Math.random() * 0.06, r: 0.62 + Math.random() * 0.25, ph: Math.random() * 6 }); });
  if (window.__MAP) MAP.places.push(['THE RINK', x0, z0, x0 + Math.cos(gapA) * (A + 2), z0 + Math.sin(gapA) * (Bz + 2)]);
  RINK.gapA = gapA;
})();
const rinkSecret = secret('iceskate', () => { toast('THIRTY METRES OF GLIDE. YOUR ANKLES WILL REMEMBER THIS.', 'blue'); }, []);
EGGS.iceskate = EGGS.rink = () => { teleport(RINK_AT.x, RINK_AT.z, 0); toast('ON THE ICE. PUSH, THEN LET GO.'); }; EGGS.iceskate.__s = true;
const rinkIn = (x, z) => ((x - RINK_AT.x) / (RINK_AT.a - 0.2)) ** 2 + ((z - RINK_AT.z) / (RINK_AT.b - 0.2)) ** 2 < 1;
function rinkFrame(dt) {
  const d = Math.hypot(P.x - RINK_AT.x, P.z - RINK_AT.z); if (d > 120) return;
  const night = Math.min(1, (L.lamps || 0) * 1.4); RINK.bulbs.material.color.setRGB(0.55 + 0.45 * night, (0.55 + 0.45 * night) * 0.88, (0.55 + 0.45 * night) * 0.66);
  RINK.s.forEach((s, i) => { s.a += s.sp * dt * 1.6; const x = RINK_AT.x + Math.cos(s.a) * RINK_AT.a * s.r, z = RINK_AT.z + Math.sin(s.a) * RINK_AT.b * s.r;
    s.P.g.position.set(x, RINK.g0 - 0.35 + 0.06, z); const tx = -Math.sin(s.a) * RINK_AT.a, tz = Math.cos(s.a) * RINK_AT.b; s.P.g.rotation.set(0, Math.atan2(tx, tz), Math.sin(LIFE.t * 1.8 + s.ph) * 0.12); });
  // your glide: what the walk did this frame becomes a push, and the ice keeps what you had
  const on = rinkIn(P.x, P.z) && P.ground && !RAIL.on;
  if (on && RINK.on) { const ix = (P.x - RINK.px) / Math.max(dt, 1e-3), iz = (P.z - RINK.pz) / Math.max(dt, 1e-3), push = Math.hypot(ix, iz) > 0.3;
    const k = push ? Math.min(1, dt * 1.6) : Math.min(1, dt * 0.25); RINK.vx += (ix - RINK.vx) * k * (push ? 1 : 1); RINK.vz += (iz - RINK.vz) * k;
    if (!push) { RINK.vx *= 1 - dt * 0.25; RINK.vz *= 1 - dt * 0.25; }
    const nx = RINK.px + RINK.vx * dt, nz = RINK.pz + RINK.vz * dt; if (rinkIn(nx, nz)) { P.x = nx; P.z = nz; } else { RINK.vx *= -0.3; RINK.vz *= -0.3; }
    const sp = Math.hypot(RINK.vx, RINK.vz); if (!push && sp > 1.2) { RINK.glide += sp * dt; if (RINK.glide > 30) rinkSecret(); } }
  else { RINK.vx = RINK.vz = 0; }
  RINK.on = on; RINK.px = P.x; RINK.pz = P.z;
}
window.__FRAMES.push(dt => { try { rinkFrame(dt); } catch (e) { if (!RINK.err) { RINK.err = e; console.warn('v68 rink', e); } } });
