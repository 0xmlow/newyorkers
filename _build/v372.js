/* ================================================================
   v372 REALISM: THE STEAM STACK (2026-11-24)
   Where Con Edison has a leak it puts up an orange and white striped stack to carry the steam above people's heads.
   One stands over the manhole by the north spoke's ring road crossing, steam pouring out of its top. ?steam=0 off.
   ================================================================ */
(function steamStack() {
  if (!LOOK.on || /steam=0/.test(location.search) || !window.__MANH || !MANH.list[1]) return; const src = MANH.list[1], x = src.position.x, z = src.position.z, g = src.position.y;
  const cv = document.createElement('canvas'); cv.width = 64; cv.height = 256; const c = cv.getContext('2d'); if (!c || !c.fillRect) return; for (let i = 0; i < 8; i++) { c.fillStyle = i % 2 ? '#f2f2ee' : '#e8641e'; c.fillRect(0, i * 32, 64, 32); }
  const m = new THREE.Mesh(new THREE.CylinderGeometry(0.32, 0.36, 2.6, 20, 1, true), new THREE.MeshStandardMaterial({ map: new THREE.CanvasTexture(cv), roughness: 0.6, side: THREE.DoubleSide })); m.position.set(x, g + 1.3, z); m.castShadow = true; scene.add(m); post(x, z, 0.45, -5, g + 2.6);
  if (window.__STEAM2) STEAM2.p.filter(s => s.src === src).forEach(s => s.lift = 2.6);
})();
window.__FRAMES.push(() => { try { if (window.__STEAM2) STEAM2.p.forEach(s => { if (s.lift && s.m.visible) s.m.position.y += s.lift; }); } catch (e) { } });
