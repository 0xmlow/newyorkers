/* ================================================================
   v190 THE LOOK: LITTER BASKETS (2026-11-23)
   The green wire litter basket, on every corner in the city. Woven steel mesh you can see through, a rolled rim,
   a liner bag inside, beside every other bench on the promenade and along the pier. ?baskets=0 off.
   ================================================================ */
const BASKET = { n: 0 };
window.__BASKET = BASKET;
(function baskets() {
  if (!LOOK.on || /baskets=0/.test(location.search)) return;
  const cv = document.createElement('canvas'); cv.width = cv.height = 128; const c = cv.getContext('2d');
  if (c && c.fillRect && c.beginPath) { c.clearRect(0, 0, 128, 128); c.strokeStyle = '#fff'; c.lineWidth = 7; for (let i = -128; i < 256; i += 32) { c.beginPath(); c.moveTo(i, 0); c.lineTo(i + 128, 128); c.stroke(); c.beginPath(); c.moveTo(i + 128, 0); c.lineTo(i, 128); c.stroke(); } }
  const at = new THREE.CanvasTexture(cv); at.wrapS = at.wrapT = THREE.RepeatWrapping; at.repeat.set(6, 3);
  const mesh = new THREE.MeshStandardMaterial({ color: 0x2f5a3a, roughness: 0.5, metalness: 0.5, alphaMap: at, alphaTest: 0.5, transparent: false, side: THREE.DoubleSide });
  const rimM = new THREE.MeshStandardMaterial({ color: 0x2a4f34, roughness: 0.4, metalness: 0.6 }), bag = new THREE.MeshStandardMaterial({ color: 0x15171a, roughness: 0.35 });
  const spots = []; for (let i = 0; i < 18; i += 2) { const a = (i + 0.5) / 18 * 360; if (Math.abs(((a + 22.5) % 45) - 22.5) < 6) continue; spots.push(P2(a + 2.6, 43.75)); }
  [[2.55, 136], [-2.55, 152], [2.55, 168]].forEach(s => spots.push(s));
  const g1 = new THREE.CylinderGeometry(0.31, 0.26, 0.85, 20, 1, true), g2 = new THREE.TorusGeometry(0.31, 0.025, 6, 24), g3 = new THREE.CylinderGeometry(0.27, 0.22, 0.62, 14, 1, true);
  const im1 = new THREE.InstancedMesh(g1, mesh, spots.length), im2 = new THREE.InstancedMesh(g2, rimM, spots.length * 2), im3 = new THREE.InstancedMesh(g3, bag, spots.length), m4 = new THREE.Matrix4(), q = new THREE.Quaternion().setFromAxisAngle(new V3(1, 0, 0), PI / 2);
  spots.forEach(([x, z], i) => { const g = Math.max(ground(x, z), z > 125 ? 0.55 : 0.665); m4.makeTranslation(x, g + 0.43, z); im1.setMatrixAt(i, m4); m4.makeTranslation(x, g + 0.36, z); im3.setMatrixAt(i, m4);
    m4.compose(new V3(x, g + 0.85, z), q, new V3(1, 1, 1)); im2.setMatrixAt(i * 2, m4); m4.compose(new V3(x, g + 0.03, z), q, new V3(0.84, 0.84, 0.84)); im2.setMatrixAt(i * 2 + 1, m4); if (typeof post === 'function') post(x, z, 0.32); });
  [im1, im2, im3].forEach(o => { o.castShadow = true; scene.add(o); }); BASKET.n = spots.length;
})();
