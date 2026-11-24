/* ================================================================
   v404 ILLUSION: THE COLOURS THAT LEAVE (2026-11-24)
   The third sideshow board: soft clouds of cobalt, pink, cyan and bone on grey, with a small black dot in the
   middle. Hold your eyes on the dot without moving them and within twenty seconds the colours fade into the grey
   and are gone; blink and they come back. Edges this soft never refresh the retina, so the brain stops reporting
   them (Troxler fading, 1804). ?sideshow=0 off.
   ================================================================ */
(function troxler() {
  if (!LOOK.on || /sideshow=0/.test(location.search) || typeof sideBooth !== 'function') return;
  const B = sideBooth(248, 'THE COLOURS THAT LEAVE', 'KEEP YOUR EYES ON THE DOT. DO NOT MOVE THEM. THEY GO.');
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 1024; const c = cv.getContext('2d'); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding;
  if (c && c.fillRect && c.beginPath && c.arc) { c.fillStyle = '#8f8d88'; c.fillRect(0, 0, 1024, 1024); c.filter = 'blur(70px)';
    [['#2962FF', 250, 300], ['#ff4fa3', 760, 270], ['#08DEFF', 300, 760], ['#efe8da', 740, 740], ['#7f6bff', 520, 140], ['#c9a24a', 140, 520], ['#ff4fa3', 880, 560]].forEach(([col, x, y]) => { c.fillStyle = col; c.globalAlpha = 0.8; c.beginPath(); c.arc(x, y, 150, 0, PI * 2); c.fill(); });
    c.filter = 'none'; c.globalAlpha = 1; c.fillStyle = '#000'; c.beginPath(); c.arc(512, 512, 9, 0, PI * 2); c.fill(); }
  const p = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); const [x, z] = B.at(0, 0.06); p.position.set(x, B.g + 1.75, z); p.rotation.y = B.ry; scene.add(p);
  SIDE.trox = p; if (window.__MAP) MAP.places.push(['THE COLOURS THAT LEAVE', B.x, B.z, ...B.at(0, 3)]);
})();
