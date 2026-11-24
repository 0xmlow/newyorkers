/* ================================================================
   v297 WALLPAPER: THE COURT (2026-11-24)
   New York lets artists paint its basketball courts. N3W COURT (v19) is painted now in a Firefly piece made from
   MLow's own references: a giant Open Eye Flower in the centre circle and contour rivers to every corner, with the
   court's white lines laid back over the paint the way the parks department does it. ?wallpaper=0 off.
   ================================================================ */
(function courtMural() {
  if (!WALLS.on || typeof COURT === 'undefined') return; const { x, z } = COURT, g0 = ground(x, z) + 0.06, W = 13, D = 11;
  const cv = document.createElement('canvas'); cv.width = 1300; cv.height = 1100; const c = cv.getContext('2d'); const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
  const lines = () => { if (!c || !c.strokeRect || !c.arc) return; c.strokeStyle = 'rgba(244,242,236,.92)'; c.lineWidth = 7; c.strokeRect(14, 14, 1272, 1072);
    c.strokeRect(650 - 245, 14, 490, 580); c.beginPath(); c.arc(650, 594, 180, 0, PI); c.stroke(); c.beginPath(); c.moveTo(80, 14); c.lineTo(80, 300); c.arc(650, 160, 675, PI - 0.06, 0.06, true); c.lineTo(1220, 14); c.stroke();
    c.beginPath(); c.arc(650, 1086, 180, PI, 0); c.stroke(); t.needsUpdate = true; };
  const im = new Image(); im.onload = () => { try { c.drawImage(im, (im.width - im.height * 13 / 11) / 2, 0, im.height * 13 / 11, im.height, 0, 0, 1300, 1100); lines(); } catch (e) { } }; im.src = 'assets/wall/court.webp';
  if (c && c.fillRect) { c.fillStyle = '#16233f'; c.fillRect(0, 0, 1300, 1100); lines(); }
  const m = new THREE.Mesh(new THREE.PlaneGeometry(W, D), new THREE.MeshStandardMaterial({ map: t, roughness: 0.82, polygonOffset: true, polygonOffsetFactor: -3, polygonOffsetUnits: -3 }));
  m.rotation.x = -PI / 2; m.rotation.z = COURT.ry || 0; m.position.set(x, g0 + 0.014, z); m.receiveShadow = true; scene.add(m); WALLS.n++; WALLS.court = m;
})();
