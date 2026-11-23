/* ================================================================
   v202 THE LOOK: PIGEONS ON THE LEDGES (2026-11-23)
   Every cornice in New York has its pigeons. A row sits along the walk up's cornice, more on the bank's, a few on
   the water tower building's parapet: grey blue, each its own shade, heads bobbing, now and then one turning
   round or shuffling along the ledge. ?ledges=0 off.
   ================================================================ */
const LEDGE = { birds: [] };
window.__LEDGE = LEDGE;
(function ledgePigeons() {
  if (!FAC_ON || /ledges=0/.test(location.search)) return; const spots = [];
  if (window.__BROWN && BROWN.H) { const y = BROWN.g0 + BROWN.H + 0.11, x = BROWN_AT.x - 3.5 - 0.32; for (let i = 0; i < 9; i++) spots.push([x, y, BROWN_AT.z - 3.6 + Math.random() * 7.2, -PI / 2 + (Math.random() - 0.5)]); }
  { const g = ground(-66, 0) + 0.02, y = g + 10.3 + 0.11; for (let i = 0; i < 8; i++) spots.push([-66 - 4 + Math.random() * 10, y, -9.3 - 0.32, PI + (Math.random() - 0.5)]); for (let i = 0; i < 6; i++) spots.push([-74.3 - 0.32, y, -6 + Math.random() * 12, -PI / 2 + (Math.random() - 0.5)]); }
  if (window.__WT && WT.top) { const y = WT.top + 0.7 + 0.01; for (let i = 0; i < 5; i++) spots.push([WT_AT.x - 3 + Math.random() * 6, y, WT_AT.z + 3.5 + 0.02, Math.random() * PI * 2]); }
  const N = spots.length; if (!N) return;
  const body = new THREE.InstancedMesh(new THREE.SphereGeometry(1, 10, 8), new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.8 }), N), head = new THREE.InstancedMesh(new THREE.SphereGeometry(0.045, 8, 6), new THREE.MeshStandardMaterial({ color: 0x5a6068, roughness: 0.7 }), N), tail = new THREE.InstancedMesh(new THREE.BoxGeometry(0.06, 0.015, 0.1), new THREE.MeshStandardMaterial({ color: 0x3e434a, roughness: 0.8 }), N);
  const c = new THREE.Color(); spots.forEach((s, i) => { body.setColorAt(i, c.setHSL(0.62, 0.08 + Math.random() * 0.06, 0.2 + Math.random() * 0.12)); LEDGE.birds.push({ x: s[0], y: s[1], z: s[2], ry: s[3], ph: Math.random() * 10, t: Math.random() * 8 }); });
  [body, head, tail].forEach(o => { o.castShadow = true; o.frustumCulled = false; scene.add(o); }); LEDGE.body = body; LEDGE.head = head; LEDGE.tail = tail;
})();
const _lgq = new THREE.Quaternion(), _lgm = new THREE.Matrix4(), _lgv = new V3(), _lgy = new V3(0, 1, 0);
window.__FRAMES.push(dt => { try { if (!LEDGE.body) return; const T0 = LIFE.t;
  LEDGE.birds.forEach((b, i) => { b.t -= dt; if (b.t < 0) { b.t = 3 + Math.random() * 9; if (Math.random() < 0.5) b.ry += (Math.random() - 0.5) * 2.4; }
    _lgq.setFromAxisAngle(_lgy, b.ry); const f = new V3(Math.sin(b.ry), 0, Math.cos(b.ry));
    _lgm.compose(_lgv.set(b.x, b.y + 0.07, b.z), _lgq, new V3(0.085, 0.075, 0.14)); LEDGE.body.setMatrixAt(i, _lgm);
    const bob = Math.max(0, Math.sin(T0 * 6 + b.ph)) * 0.025; _lgm.compose(_lgv.set(b.x + f.x * (0.12 + bob), b.y + 0.15, b.z + f.z * (0.12 + bob)), _lgq, new V3(1, 1, 1)); LEDGE.head.setMatrixAt(i, _lgm);
    _lgm.compose(_lgv.set(b.x - f.x * 0.16, b.y + 0.06, b.z - f.z * 0.16), _lgq, new V3(1, 1, 1)); LEDGE.tail.setMatrixAt(i, _lgm); });
  [LEDGE.body, LEDGE.head, LEDGE.tail].forEach(o => o.instanceMatrix.needsUpdate = true); } catch (e) { } });
