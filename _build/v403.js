/* ================================================================
   v403 ILLUSION: STARE, THEN LOOK AT THE SHOP (2026-11-24)
   The second sideshow board: a spiral of MLow's contour colours turning slowly inward round an Open Eye Flower.
   Stare at the eye for thirty seconds, then look at N3W CUTS beside it: the shop swells and breathes toward you for
   a few seconds. The motion detectors that were tuned to the inward pull are tired, and the still world reads as
   moving the other way (the motion aftereffect; Aristotle saw it in a river, Robert Addams at the Falls of Foyers
   in 1834). ?sideshow=0 off.
   ================================================================ */
(function spiral() {
  if (!LOOK.on || /sideshow=0/.test(location.search) || typeof sideBooth !== 'function') return;
  const B = sideBooth(243, 'STARE, THEN LOOK AT THE SHOP', 'THIRTY SECONDS ON THE EYE. THEN LOOK AT N3W CUTS. IT BREATHES.');
  const cv = document.createElement('canvas'); cv.width = 1024; cv.height = 1024; const c = cv.getContext('2d'); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
  const draw = img => { if (!c || !c.createImageData || !c.putImageData || !c.arc || !c.beginPath) return; const im = c.createImageData(1024, 1024), d = im.data, cols = [[22, 35, 63], [41, 98, 255], [8, 222, 255], [239, 232, 218], [255, 79, 163], [41, 98, 255]];
    for (let y = 0; y < 1024; y++) for (let x = 0; x < 1024; x++) { const dx = x - 512, dy = y - 512, r = Math.hypot(dx, dy) / 512, i = (y * 1024 + x) * 4; if (r > 1) { d[i + 3] = 0; continue; }
      const th = Math.atan2(dy, dx), s = (th / (PI * 2) * 4 + Math.log(r + 0.02) * 2.6) % 1, k = Math.floor(((s + 1) % 1) * 6), cc = cols[k]; d[i] = cc[0]; d[i + 1] = cc[1]; d[i + 2] = cc[2]; d[i + 3] = 255; }
    c.putImageData(im, 0, 0); c.fillStyle = '#16233f'; c.beginPath(); c.arc(512, 512, 120, 0, PI * 2); c.fill(); if (img) c.drawImage(img, 412, 412, 200, 200); t.needsUpdate = true; };
  draw(null); const im = new Image(); im.onload = () => { try { draw(im); } catch (e) { } }; im.src = 'assets/iv_flower.webp';
  const disc = new THREE.Mesh(new THREE.CircleGeometry(0.95, 96), new THREE.MeshBasicMaterial({ map: t, transparent: true, alphaTest: 0.5, toneMapped: false })); const [x, z] = B.at(0, 0.06); disc.position.set(x, B.g + 1.75, z); disc.rotation.y = B.ry; scene.add(disc); SIDE.spiral = disc;
  if (window.__MAP) MAP.places.push(['STARE, THEN LOOK', B.x, B.z, ...B.at(0, 3)]);
})();
window.__FRAMES.push(dt => { try { if (SIDE.spiral) SIDE.spiral.rotateZ(-dt * 0.9); } catch (e) { } });
