/* ================================================================
   v217 THE LOOK: THE HANDBALL COURT (2026-11-23)
   The handball wall stood alone on the grass. Now it has the court every New York wall has in front of it: green
   asphalt with the white side lines, the short line and the service line, a long line at the back, ball scuffs
   in front of the wall. A three metre chain link fence runs down both sides and across the back with a gate,
   the wall gets end piers and a footing, the back gets its board form joints, and there is a park bench and a
   cast iron drinking fountain by the gate. Shared here: CHAINM, the chain link material later versions reuse.
   ?court=0 turns it off.
   ================================================================ */
const HB2 = {};
window.__HB2 = HB2;
// chain link: one diamond mesh canvas, uv scaled per panel so the weave keeps its size
const CHAINM = (() => { const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d');
  if (c && c.beginPath && c.stroke) { c.clearRect(0, 0, 64, 64); c.strokeStyle = 'rgba(178,182,184,1)'; c.lineWidth = 3; c.beginPath(); c.moveTo(0, 32); c.lineTo(32, 0); c.lineTo(64, 32); c.lineTo(32, 64); c.closePath(); c.stroke();
    c.strokeStyle = 'rgba(120,124,128,1)'; c.lineWidth = 1.2; c.beginPath(); c.moveTo(0, 32); c.lineTo(32, 0); c.stroke(); }
  const t = new THREE.CanvasTexture(cv); t.wrapS = t.wrapT = THREE.RepeatWrapping; t.anisotropy = ANISO;
  return new THREE.MeshStandardMaterial({ map: t, alphaTest: 0.35, transparent: false, side: THREE.DoubleSide, roughness: 0.45, metalness: 0.75, color: 0xffffff }); })();
window.__CHAINM = CHAINM;
// a chain link panel between two ground points, h tall, with a top rail and line posts (facPut 'galv')
FACM.galv = FACM.galv || new THREE.MeshStandardMaterial({ color: 0x9a9fa3, roughness: 0.4, metalness: 0.8 });
function chainPanel(ax, az, bx, bz, h, gy, opt) { opt = opt || {}; const L0 = Math.hypot(bx - ax, bz - az); if (L0 < 0.05) return; const ry = Math.atan2(-(bz - az), bx - ax);
  const geo = new THREE.PlaneGeometry(L0, h - 0.06); const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) * L0 / 0.06, uv.getY(i) * (h - 0.06) / 0.06); uv.needsUpdate = true;
  const m = new THREE.Mesh(geo, CHAINM); m.position.set((ax + bx) / 2, gy + (h - 0.06) / 2 + 0.03, (az + bz) / 2); m.rotation.y = ry; m.castShadow = true; scene.add(m);
  facPut('galv', (ax + bx) / 2, gy + h, (az + bz) / 2, L0, 0.045, 0.045, ry); facPut('galv', (ax + bx) / 2, gy + 0.05, (az + bz) / 2, L0, 0.03, 0.03, ry);
  const n = Math.max(1, Math.round(L0 / 3)); for (let i = 0; i <= n; i++) { const u = i / n; facPut('galv', ax + (bx - ax) * u, gy + h / 2, az + (bz - az) * u, 0.06, h + 0.04, 0.06, 0); }
  if (opt.solid !== false) wall(ax, az, bx, bz, -5, gy + h); }
window.chainPanel = chainPanel;
(function handballCourt() {
  if (!FAC_ON || /court=0/.test(location.search) || !window.__WALLP || WALLP.ry == null) return;
  const ry = WALLP.ry, X = WALL_AT.x, Z = WALL_AT.z, g0 = ground(X, Z), cs = Math.cos(ry), sn = Math.sin(ry), W = 7.2, H = 4.4, D = 0.45;
  const L2W = (lx, lz) => [X + cs * lx + sn * lz, Z - sn * lx + cs * lz]; HB2.L2W = L2W;
  const CL = 9.4, CW = 7.6, z0c = D / 2;           // court length out from the wall face, width
  // ---- the court surface
  const cv = document.createElement('canvas'); cv.width = 512; cv.height = 640; const c = cv.getContext('2d');
  if (c && c.fillRect && c.beginPath) { c.fillStyle = '#3f5a48'; c.fillRect(0, 0, 512, 640);
    for (let i = 0; i < 5000; i++) { const v = Math.random(); c.fillStyle = v < 0.5 ? `rgba(20,30,24,${0.12 + Math.random() * 0.2})` : `rgba(140,160,145,${0.06 + Math.random() * 0.12})`; c.fillRect(Math.random() * 512, Math.random() * 640, 1 + Math.random() * 2.5, 1 + Math.random() * 2.5); }
    // worn patches where people stand
    [[256, 210, 120], [256, 420, 90], [160, 300, 70], [350, 280, 70]].forEach(([x, y, r]) => { const gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, 'rgba(70,80,74,.45)'); gr.addColorStop(1, 'rgba(70,80,74,0)'); c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2); });
    const px = 512 / CW, pz = 640 / CL, ln = (x0, y0, x1, y1) => { c.fillRect(Math.min(x0, x1), Math.min(y0, y1), Math.max(4, Math.abs(x1 - x0)), Math.max(4, Math.abs(y1 - y0))); };
    c.fillStyle = 'rgba(236,236,228,.88)'; const sx = (CW - 6.1) / 2 * px; ln(sx, 0, sx, 640); ln(512 - sx - 4, 0, 512 - sx - 4, 640);
    ln(sx, 4.9 * pz, 512 - sx, 4.9 * pz); ln(sx, 2.75 * pz, 512 - sx, 2.75 * pz); ln(sx, 8.9 * pz, 512 - sx, 8.9 * pz);
    // ball scuffs near the wall, old paint at the wall foot
    for (let i = 0; i < 60; i++) { c.fillStyle = `rgba(30,32,40,${0.1 + Math.random() * 0.2})`; c.beginPath(); c.arc(80 + Math.random() * 350, 6 + Math.random() * 80, 2 + Math.random() * 4, 0, PI * 2); c.fill(); }
    c.save(); c.translate(256, 5.9 * pz); c.font = '700 34px "Archivo Black",Impact,sans-serif'; c.textAlign = 'center'; c.fillStyle = 'rgba(236,236,228,.5)'; c.fillText('N3W PARKS', 0, 0); c.restore(); }
  const ct = new THREE.CanvasTexture(cv); ct.encoding = THREE.sRGBEncoding; ct.anisotropy = ANISO;
  const court = new THREE.Mesh(new THREE.PlaneGeometry(CW, CL), new THREE.MeshStandardMaterial({ map: ct, roughness: 0.88, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  court.rotation.order = 'YXZ'; court.rotation.set(-PI / 2, ry, 0); const [cx, cz] = L2W(0, z0c + CL / 2); court.position.set(cx, Math.max(g0, ground(cx, cz)) + 0.035, cz); court.receiveShadow = true; scene.add(court); HB2.court = court;
  // asphalt edge: a low curb round the court
  FACM.curbA = FACM.curbA || new THREE.MeshStandardMaterial({ color: 0x6f6c66, roughness: 0.9 });
  [[-CW / 2 - 0.08, z0c + CL / 2, 0.16, CL], [CW / 2 + 0.08, z0c + CL / 2, 0.16, CL], [0, z0c + CL + 0.08, CW + 0.32, 0.16]].forEach(([lx, lz, w, d]) => { const [x, z] = L2W(lx, lz); facPut('curbA', x, g0 + 0.03, z, w, 0.1, d, ry); });
  // ---- the wall: end piers, a footing, a chamfered coping, board form joints on the back
  const F = (lx, y, lz, sx, sy, sz, key) => { const [x, z] = L2W(lx, lz); facPut(key, x, y, z, sx, sy, sz, ry); };
  [-1, 1].forEach(s => { F(s * (W / 2 + 0.16), g0 + H / 2 - 0.08, 0, 0.36, H + 0.1, D + 0.24, 'conc'); F(s * (W / 2 + 0.16), g0 + H + 0.02, 0, 0.44, 0.1, D + 0.32, 'stoneD'); });
  F(0, g0 + 0.08, 0, W + 0.8, 0.26, D + 0.4, 'conc'); F(0, g0 + H + 0.06, 0, W + 0.24, 0.06, D + 0.2, 'stoneD');
  for (let lx = -W / 2 + 0.6; lx < W / 2; lx += 0.6) F(lx, g0 + H / 2, -D / 2 - 0.012, 0.03, H - 0.4, 0.02, 'concJ');
  [g0 + 1.4, g0 + 2.8].forEach(y => F(0, y, -D / 2 - 0.012, W - 0.1, 0.03, 0.02, 'concJ'));
  // ---- chain link: down both sides and across the back, a 2 m gate in the back
  const gy = g0, fz0 = z0c + 0.3, fz1 = z0c + CL + 0.4, fx = CW / 2 + 0.35, FH = 3.0;
  const P = (lx, lz) => L2W(lx, lz);
  [[-fx, fz0, -fx, fz1], [fx, fz0, fx, fz1], [-fx, fz1, -1.1, fz1], [1.1, fz1, fx, fz1]].forEach(([a, b, c2, d]) => { const [ax, az] = P(a, b), [bx, bz] = P(c2, d); chainPanel(ax, az, bx, bz, FH, gy); });
  // the gate standing open, and its posts
  { const [ax, az] = P(1.1, fz1), [bx, bz] = P(1.1 + 0.15, fz1 + 1.95); chainPanel(ax, az, bx, bz, 2.2, gy, { solid: false }); }
  [-1.1, 1.1].forEach(lx => { const [x, z] = P(lx, fz1); facPut('galv', x, gy + FH / 2 + 0.1, z, 0.09, FH + 0.2, 0.09, 0); });
  // the wall's fence: behind the wall the fence returns to the piers
  [[-fx, fz0, -W / 2 - 0.34, 0.3], [fx, fz0, W / 2 + 0.34, 0.3]].forEach(([a, b, c2, d]) => { const [ax, az] = P(a, b), [bx, bz] = P(c2, d); chainPanel(ax, az, bx, bz, FH, gy); });
  // ---- a bench and a cast iron fountain by the gate
  FACM.benchW = FACM.benchW || new THREE.MeshStandardMaterial({ color: 0x6b4a2a, roughness: 0.75 });
  FACM.iron = FACM.iron || new THREE.MeshStandardMaterial({ color: 0x1d2b24, roughness: 0.55, metalness: 0.5 });
  { const [bqx, bqz] = L2W(fx + 1.2, z0c + 5.0); (window.BENCHQ = window.BENCHQ || []).push([bqx, g0, bqz, ry - PI / 2]); } if (!LOOK.on || /props=0/.test(location.search)) { const bl = 2.0, lx = fx + 1.2, lz = z0c + 5.0; for (let k = 0; k < 3; k++) F(lx + (k - 1) * 0.12, g0 + 0.45, lz, 0.1, 0.04, bl, 'benchW'); for (let k = 0; k < 2; k++) F(lx + 0.2, g0 + 0.62 + k * 0.14, lz, 0.04, 0.1, bl, 'benchW');
    [-0.8, 0.8].forEach(d => { F(lx, g0 + 0.22, lz + d, 0.4, 0.44, 0.06, 'iron'); F(lx + 0.2, g0 + 0.6, lz + d, 0.05, 0.4, 0.06, 'iron'); }); boxWalls(...L2W(lx, lz), 0.5, bl, ry, -5, g0 + 0.5); }
  { const [x, z] = L2W(-1.9, fz1 + 1.4); const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.24, 0.85, 12), FACM.iron); ped.position.set(x, g0 + 0.43, z); ped.castShadow = true; scene.add(ped);
    const bowl = new THREE.Mesh(new THREE.CylinderGeometry(0.26, 0.14, 0.14, 16), FACM.iron); bowl.position.set(x, g0 + 0.92, z); scene.add(bowl);
    const sp = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 8), FACM.galv); sp.position.set(x, g0 + 1.02, z); scene.add(sp); post(x, z, 0.3, -5, g0 + 1); }
  facFlush();
  HB2.ok = true;
})();
