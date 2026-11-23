/* ================================================================
   v90 FALL (2026-11-22)
   From September to early December the island has leaves: rust, ochre and brown drifts heaped along the ring path,
   a few always coming down and tumbling across the paving in the wind. Run through a pile and it bursts and
   scatters and settles again. The rest of the year they are gone. LEAVES brings them out any time.
   ================================================================ */
const LEAF = { piles: [], fall: [], k: 0, force: 0, t: 0 };
window.__LEAF = LEAF;
(function fall() {
  const cv = document.createElement('canvas'); cv.width = cv.height = 64; const c = cv.getContext('2d');
  if (c && c.beginPath && c.quadraticCurveTo) { c.fillStyle = '#fff'; c.beginPath(); c.moveTo(32, 2); c.quadraticCurveTo(62, 22, 32, 62); c.quadraticCurveTo(2, 22, 32, 2); c.fill(); c.strokeStyle = 'rgba(0,0,0,.35)'; c.lineWidth = 2; c.beginPath(); c.moveTo(32, 6); c.lineTo(32, 60); c.stroke(); }
  const lt = new THREE.CanvasTexture(cv); const cols = [0xa8461c, 0xc27a2a, 0x7a3a18, 0xd19a3a, 0x6b4a2a, 0x8e2a16];
  const geo = new THREE.PlaneGeometry(0.16, 0.16), mat = new THREE.MeshStandardMaterial({ map: lt, alphaTest: 0.5, side: THREE.DoubleSide, roughness: 0.9 });
  const N = isMobile ? 500 : 1400, im = new THREE.InstancedMesh(geo, mat, N); im.frustumCulled = false; scene.add(im); LEAF.im = im; const col = new THREE.Color();
  // piles along the ring path edge, and loose leaves on the paving
  const piles = 14; for (let p = 0; p < piles; p++) { const a = p / piles * PI * 2 + 0.2, r = 43.4 + Math.random() * 0.6; LEAF.piles.push({ x: Math.sin(a) * r, z: Math.cos(a) * r, burst: 0 }); }
  for (let i = 0; i < N; i++) { const pile = i < N * 0.7 ? LEAF.piles[i % piles] : null; let x, z; if (pile) { const a = Math.random() * PI * 2, rr = Math.pow(Math.random(), 0.7) * 1.3; x = pile.x + Math.cos(a) * rr; z = pile.z + Math.sin(a) * rr; } else { const a = Math.random() * PI * 2, r = 38 + Math.random() * 7; x = Math.sin(a) * r; z = Math.cos(a) * r; }
    const h = pile ? Math.max(0, 0.35 - Math.hypot(x - pile.x, z - pile.z) * 0.25) * Math.random() : 0;
    LEAF.fall.push({ x, z, y: h, hx: x, hz: z, hy: h, vx: 0, vy: 0, vz: 0, rx: Math.random() * 6, ry: Math.random() * 6, spin: 0, pile }); im.setColorAt(i, col.setHex(cols[i % cols.length]).multiplyScalar(0.8 + Math.random() * 0.3)); }
  im.instanceColor.needsUpdate = true; LEAF.o = new THREE.Object3D();
})();
EGGS.leaves = EGGS.autumn = () => { LEAF.force = LEAF.t + 300; toast('IT IS FALL NOW. THE CITY SMELLS LIKE ROASTED NUTS AND WET PAPER.'); }; EGGS.leaves.__s = true;
const leafSecret = secret('leafpile', () => { toast('YOU RAN THROUGH A LEAF PILE. SOMEONE RAKED THAT.', 'blue'); });
function leafFrame(dt) {
  LEAF.t += dt; const mo = SKY.t ? SKY.t.mo : 11, d = SKY.t ? SKY.t.d : 1, season = (mo >= 9 && mo <= 11) || (mo === 12 && d <= 8); const want = (season || LEAF.force > LEAF.t) ? 1 : 0; LEAF.k += (want - LEAF.k) * Math.min(1, dt * 0.5);
  LEAF.im.visible = LEAF.k > 0.02; if (!LEAF.im.visible || Math.hypot(P.x, P.z) > 120) return;
  const o = LEAF.o, wind = 0.6 + Math.sin(LEAF.t * 0.3) * 0.4, ps = Math.hypot(P.x - (LEAF.px || P.x), P.z - (LEAF.pz || P.z)) / Math.max(dt, 1e-3); LEAF.px = P.x; LEAF.pz = P.z;
  LEAF.piles.forEach(p => { if (Math.hypot(P.x - p.x, P.z - p.z) < 1.3 && ps > 2 && p.burst <= 0) { p.burst = 8; leafSecret(); } p.burst = Math.max(0, p.burst - dt); });
  LEAF.fall.forEach((L2, i) => { const p = L2.pile;
    if (p && p.burst > 7.6) { L2.vx += (L2.x - p.x) * 6 * dt + (Math.random() - 0.5) * 3; L2.vz += (L2.z - p.z) * 6 * dt + (Math.random() - 0.5) * 3; L2.vy += 9 * dt * Math.random(); L2.spin = 8; }
    else if (!p && Math.random() < dt * 0.02 * wind) { L2.vx += wind * 1.2; L2.vz += wind * 0.6; L2.spin = 4; }
    L2.vy -= 3 * dt; L2.x += L2.vx * dt; L2.y += L2.vy * dt; L2.z += L2.vz * dt; L2.vx *= 1 - dt * 2.5; L2.vz *= 1 - dt * 2.5;
    if (L2.y < 0) { L2.y = 0; L2.vy = 0; L2.spin *= 0.9; if (p && p.burst <= 0) { L2.x += (L2.hx - L2.x) * dt * 0.3; L2.z += (L2.hz - L2.z) * dt * 0.3; L2.y = L2.hy * Math.min(1, 1 - p.burst / 8); } }
    if (!p && Math.hypot(L2.x, L2.z) > 46) { const a = Math.random() * PI * 2, r = 38 + Math.random() * 3; L2.x = Math.sin(a) * r; L2.z = Math.cos(a) * r; }
    L2.rx += L2.spin * dt; L2.ry += L2.spin * 0.7 * dt; if (L2.gy === undefined || (i + Math.floor(LEAF.t * 60)) % 30 === 0) L2.gy = ground(L2.x, L2.z); o.position.set(L2.x, L2.gy + 0.07 + L2.y, L2.z); o.rotation.set(L2.y > 0.01 ? L2.rx : -PI / 2 + Math.sin(L2.rx) * 0.2, L2.ry, 0); o.scale.setScalar(LEAF.k); o.updateMatrix(); LEAF.im.setMatrixAt(i, o.matrix); });
  LEAF.im.instanceMatrix.needsUpdate = true;
}
window.__FRAMES.push(dt => { try { leafFrame(dt); } catch (e) { if (!LEAF.err) { LEAF.err = e; console.warn('v90 leaves', e); } } });
