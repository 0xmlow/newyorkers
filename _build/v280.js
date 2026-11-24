/* ================================================================
   v280 ILLUSION: THE DISC THAT TURNS (2026-11-23)
   A four metre disc on a navy pole on the west lawn, painted in rings of little teardrop cells in MLow's colours
   (ink, cobalt, bone, cyan, in that order round every cell). It does not move. Look at it and the rings turn, each
   the opposite way to the next, and stop dead wherever you look straight at them, the peripheral drift that Akiyoshi
   Kitaoka found in his rotating snakes. An Open Eye Flower sits in the middle, watching it not move. ?snakes=0 off.
   ================================================================ */
const SNAKE = {};
window.__SNAKE = SNAKE;
(function snakes() {
  if (!LOOK.on || /snakes=0/.test(location.search)) return;
  const cv = document.createElement('canvas'); cv.width = cv.height = 1024; const c = cv.getContext('2d'); if (!c || !c.beginPath || !c.arc || !c.fill) return;
  c.fillStyle = '#7f8a99'; c.fillRect(0, 0, 1024, 1024); const cols = ['#0d0d0d', '#2962FF', '#efe8da', '#08DEFF'];
  for (let ring = 0; ring < 7; ring++) { const r0 = 90 + ring * 60, n = 12 + ring * 6, dir = ring % 2 ? 1 : -1;
    for (let i = 0; i < n; i++) { const a0 = i / n * PI * 2; for (let k = 0; k < 4; k++) { const a = a0 + dir * k * (PI * 2 / n) * 0.2, w = (PI * 2 / n) * 0.24; c.fillStyle = cols[k]; c.beginPath(); c.arc(512, 512, r0 + 26, a, a + w); c.arc(512, 512, r0 - 26, a + w, a, true); c.closePath(); c.fill(); } } }
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
  const X = -58.5, Z = 24.5, g = ground(X, Z), ry = Math.atan2(-X, -Z);
  const m = new THREE.Mesh(new THREE.CircleGeometry(2.1, 96), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6, side: THREE.DoubleSide })); m.position.set(X, g + 3.2, Z); m.rotation.y = ry; m.castShadow = true; scene.add(m);
  const fl = new THREE.Mesh(new THREE.CircleGeometry(0.42, 40), new THREE.MeshBasicMaterial({ map: tex('assets/iv_flower.webp'), transparent: true, alphaTest: 0.4 })); fl.position.copy(m.position); fl.rotation.y = ry; fl.translateZ(0.01); scene.add(fl);
  const rim = new THREE.Mesh(new THREE.TorusGeometry(2.12, 0.06, 10, 96), new THREE.MeshStandardMaterial({ color: 0x122039, roughness: 0.5, metalness: 0.5 })); rim.position.copy(m.position); rim.rotation.y = ry; scene.add(rim);
  facPut('iron', X, g + 0.55, Z, 0.16, 1.1, 0.16, 0); facPut('iron', X, g + 0.06, Z, 0.7, 0.12, 0.7, 0); facFlush(); post(X, Z, 0.3, -5, 2);
  SNAKE.ok = true; SNAKE.P = [X, g + 3.2, Z];
})();
