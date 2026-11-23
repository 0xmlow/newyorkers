/* ================================================================
   v207 THE LOOK: THE MARKET'S GOODS (2026-11-23)
   The five kiosks had empty brown counters. Each now sells what its sign says: HOT CIDER has a steaming kettle and
   a row of paper cups; EYE BAUBLES hangs blue and white glass eyes on strings across its front; N3W PRINTS has
   print bins of cards; KNITS has a row of bobble hats and scarves hung on the frame; CHURROS has paper cones of
   churros and a sugar tray. Every kiosk gets shelves of stock on its back wall. ?goods=0 off.
   ================================================================ */
const GOODS = {};
window.__GOODS = GOODS;
(function marketGoods() {
  if (!LOOK.on || /goods=0/.test(location.search) || !window.__MKT || !MKT.k || !MKT.k.length) return;
  const M = c => new THREE.MeshStandardMaterial({ color: c, roughness: 0.6 }), parts = new Map(), put = (geo, mat, x, y, z, s, rx) => { const k = geo.uuid + mat.uuid; if (!parts.has(k)) parts.set(k, { geo, mat, list: [] }); parts.get(k).list.push([x, y, z, s || 1, rx || 0]); };
  const cup = new THREE.CylinderGeometry(0.045, 0.035, 0.11, 10), ball = new THREE.SphereGeometry(0.055, 12, 10), hat = new THREE.SphereGeometry(0.09, 12, 8, 0, PI * 2, 0, PI / 2), box = new THREE.BoxGeometry(1, 1, 1), stick = new THREE.CylinderGeometry(0.013, 0.013, 0.24, 6), cone = new THREE.ConeGeometry(0.05, 0.14, 10), str = new THREE.CylinderGeometry(0.003, 0.003, 1, 3);
  const white = M(0xf2efe8), red = M(0x9a2430), blue = new THREE.MeshStandardMaterial({ color: 0x2962ff, roughness: 0.15, metalness: 0.2 }), glassW = new THREE.MeshStandardMaterial({ color: 0xf0f4f8, roughness: 0.15 }), brown = M(0xa8692c), sugar = M(0xe9dcc0), kraft = M(0xb89466), ink = M(0x1a1a1a);
  const knits = [0x9a2430, 0x2f4a33, 0xd9b45a, 0x2962ff, 0xefe8da, 0x6b4a8a].map(M), stock = [0x9a2430, 0xd9b45a, 0x2f4a33, 0xefe8da, 0x2962ff, 0xb06a1c, 0x5a3f28].map(M);
  MKT.k.forEach((k, i) => { const gy = ground(k.x, k.z), fz = k.z - 0.85, top = gy + 1.0;   // kiosks face -z; the counter top is at 1.0
    if (i === 0) { for (let j = 0; j < 8; j++) put(cup, j % 2 ? white : red, k.x - 1.2 + j * 0.16, top + 0.055, fz + 0.05); put(new THREE.CylinderGeometry(0.16, 0.18, 0.3, 16), ink, k.x + 0.9, top + 0.15, fz + 0.02); }
    if (i === 1) for (let j = 0; j < 14; j++) { const x = k.x - 1.45 + j * 0.22, y = gy + 2.15 - (j % 3) * 0.18; put(str, ink, x, y + 0.2, fz - 0.45, 1); put(ball, j % 2 ? blue : glassW, x, y, fz - 0.45); }
    if (i === 2) [-0.9, -0.3, 0.3, 0.9].forEach(x => { put(box, kraft, k.x + x, top + 0.12, fz + 0.02, [0.5, 0.24, 0.32]); for (let c = 0; c < 6; c++) put(box, stock[(c + i) % stock.length], k.x + x - 0.18 + c * 0.07, top + 0.27, fz + 0.02, [0.012, 0.22, 0.28], -0.25); });
    if (i === 3) { for (let j = 0; j < 9; j++) put(hat, knits[j % knits.length], k.x - 1.25 + j * 0.31, top, fz + 0.03); for (let j = 0; j < 5; j++) put(box, knits[(j + 2) % knits.length], k.x - 1.3 + j * 0.65, gy + 1.75, fz - 0.42, [0.18, 0.75, 0.02]); }
    if (i === 4) { for (let j = 0; j < 7; j++) { const x = k.x - 1.1 + j * 0.3; put(cone, white, x, top + 0.07, fz + 0.05, 1, PI); for (let s = 0; s < 3; s++) put(stick, brown, x - 0.02 + s * 0.02, top + 0.2, fz + 0.05); } put(box, sugar, k.x + 1.0, top + 0.03, fz + 0.03, [0.4, 0.05, 0.25]); }
    // shelves of stock on the back wall (world z + 1.0)
    [1.3, 1.75].forEach(y => { put(box, kraft, k.x, gy + y, k.z + 0.92, [2.9, 0.035, 0.28]); for (let s = 0; s < 14; s++) put(box, stock[(s * 3 + i + (y > 1.5 ? 2 : 0)) % stock.length], k.x - 1.3 + s * 0.2, gy + y + 0.1, k.z + 0.9, [0.12, 0.16 + (s % 3) * 0.03, 0.12]); }); });
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), e = new THREE.Euler(); let n = 0;
  parts.forEach(({ geo, mat, list }) => { const im = new THREE.InstancedMesh(geo, mat, list.length); list.forEach(([x, y, z, s, rx], j) => { const sc = Array.isArray(s) ? new V3(s[0], s[1], s[2]) : new V3(s, geo === str ? (s === 1 ? 0.3 : s) : s, s); m4.compose(new V3(x, y, z), q.setFromEuler(e.set(rx, 0, 0)), sc); im.setMatrixAt(j, m4); }); im.castShadow = true; scene.add(im); n += list.length; });
  GOODS.n = n;
})();
