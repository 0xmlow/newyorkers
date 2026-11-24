/* ================================================================
   v431 ILLUSION: THE FLOATING DISC (2026-11-24)
   A sixth sideshow board at the end of the boardwalk: a field of fine horizontal stripes with a disc of vertical
   stripes in it. Walk past, or just move your head, and the disc slides and floats on its own, out of step with
   the board (the Ouchi illusion, Hajime Ouchi, 1977: the eye cannot read motion along the stripes, so the two
   patterns seem to move differently). ?sideshow=0 off.
   ================================================================ */
(function ouchi() {
  if (!LOOK.on || /sideshow=0/.test(location.search) || typeof sideBooth !== 'function') return;
  const B = sideBooth(258, 'THE FLOATING DISC', 'WALK PAST IT, OR MOVE YOUR HEAD. THE DISC SLIDES ON ITS OWN.');
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 1024; const c = cv.getContext('2d'); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
  if (c && c.fillRect && c.beginPath && c.arc && c.save && c.clip) { const s = 20; for (let y = 0; y < 1024; y += s) for (let x = 0; x < 1024; x += s * 4) { c.fillStyle = ((y / s + x / (s * 4)) % 2) ? '#0b0b0b' : '#f2ede2'; c.fillRect(x, y, s * 4, s); }
    c.save(); c.beginPath(); c.arc(512, 512, 250, 0, PI * 2); c.clip(); for (let x = 0; x < 1024; x += s) for (let y = 0; y < 1024; y += s * 4) { c.fillStyle = ((x / s + y / (s * 4)) % 2) ? '#0b0b0b' : '#f2ede2'; c.fillRect(x, y, s, s * 4); } c.restore(); }
  const p = new THREE.Mesh(new THREE.PlaneGeometry(2.0, 2.0), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); const [x, z] = B.at(0, 0.06); p.position.set(x, B.g + 1.75, z); p.rotation.y = B.ry; scene.add(p);
  if (SIDE.panels) SIDE.panels.push(p.material); try { if (SIDE.backs) SIDE.backs(); } catch (e) { }
  if (window.__MAP) MAP.places.push(['THE FLOATING DISC', B.x, B.z, ...B.at(0, 3)]);
})();
