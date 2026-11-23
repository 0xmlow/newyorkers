/* ================================================================
   v92 THE STOOP (2026-11-22)
   A four storey brick walk up at (78, -56), facing the island: old red brick, tall windows with white trim, a cornice,
   and a stoop of seven steps up to a black door with a brass number. E on the stoop sits you down: the camera
   drops to a seated eye and the day goes by about two hundred times faster while you sit, clouds and shadows
   and the sky turning, until you get up (any move key). Sit long enough to see an hour pass and it counts.
   ================================================================ */
const BROWN = {};
window.__BROWN = BROWN;
const BROWN_AT = { x: 78, z: -56 };
(function brownstone() {
  const x0 = BROWN_AT.x, z0 = BROWN_AT.z, g0 = ground(x0, z0), W = 8, D = 7, Hf = 3.1, F = 4, H = Hf * F + 0.6; BROWN.g0 = g0; BROWN.H = H; BROWN.fx = x0 - D / 2;   // the front faces west, toward the island
  const stone = new THREE.MeshStandardMaterial({ map: tex('assets/brick_c.webp', [3, 4]), color: 0x5e4334, roughness: 0.85 });
  const b = new THREE.Mesh(new THREE.BoxGeometry(D, H, W), stone); b.position.set(x0, g0 + H / 2, z0); b.castShadow = b.receiveShadow = true; scene.add(b);
  boxWalls(x0, z0, D, W, 0, -5, g0 + H - 0.3); padRect(x0 - D / 2 + 0.2, x0 + D / 2 - 0.2, z0 - W / 2 + 0.2, z0 + W / 2 - 0.2, g0 + H + 0.05, g0 + H - 0.5);
  const roofM = new THREE.Mesh(new THREE.BoxGeometry(D - 0.1, 0.05, W - 0.1), new THREE.MeshStandardMaterial({ color: 0x3b3936, roughness: 0.95 })); roofM.position.set(x0, g0 + H + 0.03, z0); scene.add(roofM);
  const corn = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.5, W + 0.4), new THREE.MeshStandardMaterial({ color: 0x4a3a30, roughness: 0.7 })); corn.position.set(x0 - D / 2 - 0.1, g0 + H - 0.1, z0); scene.add(corn);
  const winM = new THREE.MeshStandardMaterial({ color: 0x12151a, roughness: 0.1, metalness: 0.5, emissive: 0xffd28a, emissiveIntensity: 0 }), trim = new THREE.MeshStandardMaterial({ color: 0xe9e4da, roughness: 0.6 }); BROWN.winM = winM; BROWN.wins = [];
  for (let f = 0; f < F; f++) for (let k = 0; k < 3; k++) { if (f === 0 && k === 0) continue; const y = g0 + 1.9 + f * Hf, z = z0 - 2.4 + k * 2.4; const wm = winM.clone(); const w = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 1.9), wm); w.position.set(x0 - D / 2 - 0.01, y, z); w.rotation.y = -PI / 2; scene.add(w); BROWN.wins.push({ m: wm, f, k, on: Math.random() < 0.5, t: Math.random() * 60 });
    const tr = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.14, 1.35), trim); tr.position.set(x0 - D / 2 - 0.04, y + 1.02, z); scene.add(tr); const sill = tr.clone(); sill.position.y = y - 1.0; scene.add(sill); }
  // the door and the stoop, on the left bay (k = 0), ground floor raised 1.4 m
  const door = new THREE.Mesh(new THREE.PlaneGeometry(1.1, 2.3), new THREE.MeshStandardMaterial({ color: 0x0d0d0d, roughness: 0.3 })); door.position.set(x0 - D / 2 - 0.01, g0 + 1.4 + 1.15, z0 - 2.4); door.rotation.y = -PI / 2; scene.add(door);
  const num = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.2), new THREE.MeshBasicMaterial({ map: signTex([{ t: '420', s: 0.6, f: 'Georgia, serif' }], 256, 128, null, '#d9b45a'), transparent: true })); num.position.set(x0 - D / 2 - 0.02, g0 + 4.0, z0 - 2.4); num.rotation.y = -PI / 2; scene.add(num);
  const stoneM = new THREE.MeshStandardMaterial({ color: 0x6e4f3c, roughness: 0.9 });
  for (let s = 0; s < 7; s++) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.38, 0.2 * (s + 1), 1.6), stoneM); const sx = x0 - D / 2 - 0.4 - (6 - s) * 0.36 - 0.6; st.position.set(sx, g0 + 0.1 * (s + 1), z0 - 2.4); scene.add(st); padRect(sx - 0.19, sx + 0.19, z0 - 3.2, z0 - 1.6, g0 + 0.2 * (s + 1)); }
  const landing = new THREE.Mesh(new THREE.BoxGeometry(1.0, 1.4, 1.6), stoneM); landing.position.set(x0 - D / 2 - 0.5, g0 + 0.7, z0 - 2.4); scene.add(landing); padRect(x0 - D / 2 - 1.0, x0 - D / 2, z0 - 3.2, z0 - 1.6, g0 + 1.4);
  [-1, 1].forEach(s => { const r = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.05, 0.05), new THREE.MeshStandardMaterial({ color: 0x111111, roughness: 0.4, metalness: 0.6 })); r.position.set(x0 - D / 2 - 1.9, g0 + 1.5, z0 - 2.4 + s * 0.82); r.rotation.z = -0.38; scene.add(r); });
  BROWN.seat = [x0 - D / 2 - 1.5, z0 - 2.4, g0 + 0.8];
  interact(x0 - D / 2 - 2.6, z0 - 2.4, 1.8, 'E · SIT ON THE STOOP', () => stoopSit());
  if (window.__MAP) MAP.places.push(['THE WALK UP', x0, z0, x0 - D / 2 - 3.5, z0 - 2.4]);
})();
const stoopSecret = secret('stoop', () => { toast('AN HOUR WENT BY ON THE STOOP. THIS IS THE ENTIRE POINT OF A STOOP.', 'blue'); });
function stoopSit() { if (BROWN.sit) return; const [x, z, y] = BROWN.seat; teleport(x, z, PI / 2, y + 0.5); BROWN.sit = true; BROWN.lapsed = 0; BROWN.prevEye = window.__EYE || 1; window.__EYE = 0.62; if (TIME.mode === 'live') TIME.mode = 'fixed'; toast('YOU SIT. THE DAY STARTS GOING BY. ANY MOVE KEY TO GET UP.'); }
function stoopFrame(dt) {
  const night = Math.min(1, (L.lamps || 0) * 1.4); BROWN.wins.forEach(w => { w.t -= dt; if (w.t < 0) { w.t = 30 + Math.random() * 90; w.on = Math.random() < 0.6; } w.m.emissiveIntensity = w.on ? night * 0.9 : 0; });
  if (!BROWN.sit) return; const moving = keys.KeyW || keys.KeyS || keys.KeyA || keys.KeyD || joy.x || joy.y; if (moving) { BROWN.sit = false; window.__EYE = BROWN.prevEye; toast('YOU GET UP. YOUR KNEES MAKE A NOISE.'); return; }
  TIME.utc += dt * 200; BROWN.lapsed += dt * 200; if (BROWN.lapsed > 3600) stoopSecret();
}
window.__FRAMES.push(dt => { try { stoopFrame(dt); } catch (e) { if (!BROWN.err) { BROWN.err = e; console.warn('v92 stoop', e); } } });
