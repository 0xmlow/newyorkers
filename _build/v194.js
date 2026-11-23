/* ================================================================
   v194 THE LOOK: THE BODEGA AWNING (2026-11-23)
   The 6529 Bodega's awning was a red plank. It is now a real one: a striped canvas sloping out on a steel frame
   with three arms, and a scalloped valance along the front lettered 6529 BODEGA · DELI · GROCERY · ATM · LOTTO ·
   COLD JPGs, the way every corner store in the city announces itself. ?awning=0 off.
   ================================================================ */
(function awning() {
  if (!LOOK.on || /awning=0/.test(location.search)) return; const bx = 17, bz = 66, w = 10, d = 14, g = ground(bx, bz) + 0.02;
  scene.traverse(o => { const p = o.isMesh && o.geometry && o.geometry.parameters; if (p && p.width === 2.4 && p.height === 0.15 && p.depth === 14 && Math.abs(o.position.x - (bx - w / 2 - 1.1)) < 0.2) o.visible = false; });
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 1024; const c = cv.getContext('2d');
  if (c && c.fillRect) for (let i = 0; i < 32; i++) { c.fillStyle = i % 2 ? '#efe6d4' : '#b8231c'; c.fillRect(0, i * 32, 256, 32); }
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
  const slope = 0.36, L0 = 2.3, xw = bx - w / 2 - 0.2, yTop = g + 3.62;
  const geo = new THREE.PlaneGeometry(L0, d - 0.4); geo.rotateX(-PI / 2); geo.rotateZ(slope); geo.translate(xw - L0 / 2 * Math.cos(slope), yTop - L0 / 2 * Math.sin(slope), bz);
  const can = new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ map: t, roughness: 0.85, side: THREE.DoubleSide })); can.castShadow = can.receiveShadow = true; scene.add(can);
  const ox = xw - L0 * Math.cos(slope), oy = yTop - L0 * Math.sin(slope);
  const vc = document.createElement('canvas'); vc.width = 2048; vc.height = 96; const v = vc.getContext('2d');
  if (v && v.fillRect) { v.clearRect(0, 0, 2048, 96); v.fillStyle = '#b8231c'; v.fillRect(0, 0, 2048, 66); if (v.arc) for (let x = 0; x < 2048; x += 64) { v.beginPath(); v.arc(x + 32, 64, 32, 0, PI); v.fill(); }
    if (v.fillText) { v.fillStyle = '#f6efdf'; v.font = '700 40px "Archivo Black", Impact, sans-serif'; v.textAlign = 'center'; v.textBaseline = 'middle'; v.fillText('6529 BODEGA  ·  DELI  ·  GROCERY  ·  ATM  ·  LOTTO  ·  COLD JPGs', 1024, 36); } }
  const vt = new THREE.CanvasTexture(vc); vt.encoding = THREE.sRGBEncoding; vt.anisotropy = ANISO;
  const val = new THREE.Mesh(new THREE.PlaneGeometry(d - 0.4, 0.42), new THREE.MeshStandardMaterial({ map: vt, alphaTest: 0.5, transparent: false, roughness: 0.85, side: THREE.DoubleSide })); val.position.set(ox - 0.01, oy - 0.2, bz); val.rotation.y = -PI / 2; scene.add(val);
  facPut('steel', ox, oy, bz, 0.05, 0.05, d - 0.3); [-1, 0, 1].forEach(s => { const z = bz + s * (d / 2 - 0.6); facBar(FACM.steel, new V3(xw, g + 2.9, z), new V3(ox + 0.05, oy - 0.02, z), 0.04, 0.04); });
  facFlush();
})();
