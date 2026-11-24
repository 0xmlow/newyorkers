/* ================================================================
   v361 ILLUSION: WHICH EYE IS BIGGER (2026-11-24)
   On a panel by the river's west spoke, two Open Eye Flowers exactly the same size: one ringed by six big eye flowers,
   one by eight tiny ones. The one among the small looks much bigger (the Ebbinghaus illusion).
   ================================================================ */
(function ebbinghaus() {
  if (!LOOK.on) return; const X = -44, Z = -1.6, g = ground(X, Z);
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 512; const c = cv.getContext('2d'); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding;
  const im = new Image(); im.onload = () => { try { c.fillStyle = '#16233f'; c.fillRect(0, 0, 1024, 512); const F = (x, y, r) => c.drawImage(im, x - r, y - r, r * 2, r * 2);
    F(256, 256, 48); for (let i = 0; i < 6; i++) { const a = i / 6 * PI * 2; F(256 + Math.cos(a) * 150, 256 + Math.sin(a) * 150, 80); }
    F(768, 256, 48); for (let i = 0; i < 8; i++) { const a = i / 8 * PI * 2; F(768 + Math.cos(a) * 78, 256 + Math.sin(a) * 78, 18); } t.needsUpdate = true; } catch (e) { } }; im.src = 'assets/iv_flower.webp';
  const m = new THREE.Mesh(new THREE.PlaneGeometry(3.0, 1.5), new THREE.MeshStandardMaterial({ map: t, roughness: 0.5 })); m.position.set(X, g + 1.6, Z); m.rotation.y = PI / 2; scene.add(m);
  facPut('iron', X - 0.04, g + 1.6, Z, 0.05, 1.6, 3.1, 0); facPut('iron', X - 0.04, g + 0.4, Z - 1.3, 0.08, 0.8, 0.08, 0); facPut('iron', X - 0.04, g + 0.4, Z + 1.3, 0.08, 0.8, 0.08, 0); facFlush(); boxWalls(X, Z, 0.2, 3.1, 0, -5, g + 2.4);
  window.__EBB = { ok: true, P: [X, g, Z] };
})();
