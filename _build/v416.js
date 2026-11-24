/* ================================================================
   v416 ILLUSION: THE DOTS THAT BLINK (2026-11-24)
   A fourth sideshow board: a navy grid on black with a small bone disc at every crossing. Let your eyes wander over
   it and black dots flash in the white discs, never in the one you are looking straight at (the scintillating
   grid, Schrauf, Lingelbach and Wist, 1997). ?sideshow=0 off.
   ================================================================ */
(function blinkGrid() {
  if (!LOOK.on || /sideshow=0/.test(location.search) || typeof sideBooth !== 'function') return;
  const B = sideBooth(228, 'THE DOTS THAT BLINK', 'LET YOUR EYES WANDER. COUNT THE BLACK DOTS. THERE ARE NONE.');
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 1024; const c = cv.getContext('2d'); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
  if (c && c.fillRect && c.beginPath && c.arc) { c.fillStyle = '#060708'; c.fillRect(0, 0, 1024, 1024); c.fillStyle = '#4a5a7a'; const N = 11, st = 1024 / N, w = 14;
    for (let i = 0; i <= N; i++) { c.fillRect(i * st - w / 2 + st / 2, 0, w, 1024); c.fillRect(0, i * st - w / 2 + st / 2, 1024, w); }
    c.fillStyle = '#f4efe4'; for (let i = 0; i <= N; i++) for (let j = 0; j <= N; j++) { c.beginPath(); c.arc(i * st + st / 2, j * st + st / 2, 12, 0, PI * 2); c.fill(); } }
  const p = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); const [x, z] = B.at(0, 0.06); p.position.set(x, B.g + 1.75, z); p.rotation.y = B.ry; scene.add(p);
  SIDE.grid = p; if (SIDE.panels) SIDE.panels.push(p.material); if (window.__MAP) MAP.places.push(['THE DOTS THAT BLINK', B.x, B.z, ...B.at(0, 3)]);
})();
