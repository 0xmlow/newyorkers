/* ================================================================
   v281 ILLUSION: THE WALL THAT LEANS (2026-11-23)
   The laundromat's blank north side is tiled, floor to cornice, in the café wall pattern (first seen on a café in
   Bristol): rows of navy and bone tiles, each row shifted half a tile, with thin grey mortar between. Every row is
   dead level. Every row looks like a wedge leaning against the next. ?cafewall=0 off.
   ================================================================ */
(function cafeWall() {
  if (!LOOK.on || /cafewall=0/.test(location.search) || !window.__LAUND || LAUND.g0 == null) return;
  const W = 5.0, H = 3.5, cv = document.createElement('canvas'); cv.width = 1000; cv.height = 700; const c = cv.getContext('2d'); if (!c || !c.fillRect) return;
  c.fillStyle = '#8c8f94'; c.fillRect(0, 0, 1000, 700); const tw = 100, th = 70, mort = 6;
  for (let r = 0; r < 10; r++) { const off = [0, 25, 50, 25][r % 4]; for (let i = -1; i < 11; i++) { c.fillStyle = (i % 2 === 0) ? '#16233f' : '#efe8da'; c.fillRect(i * tw + off, r * th + mort / 2, tw, th - mort); } }
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(W - 0.1, H - 0.2), new THREE.MeshStandardMaterial({ map: t, roughness: 0.35, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.position.set(-86, LAUND.g0 + H / 2 + 0.05, -4 + 4 + 0.012); m.receiveShadow = true; scene.add(m); window.__CAFE = { ok: true };
})();
