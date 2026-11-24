/* ================================================================
   v313 ILLUSION: SEE THE TRUE COLOURS (2026-11-24)
   A poster of an Open Eye Flower in negative (orange eye, dark petals on a pale yellow ground) with a small black dot
   on the eye, and beside it a blank white panel with another dot. Stare at the first dot for twenty seconds, then at
   the second: the eye flower appears on the blank panel in its real colours, painted by your own retina for a few
   seconds. ?afterimage=0 off.
   ================================================================ */
(function afterimage() {
  if (!LOOK.on || /afterimage=0/.test(location.search)) return; const X = 16.6, Z = 9.2, g = ground(X, Z);
  const cv = document.createElement('canvas'); cv.width = cv.height = 512; const c = cv.getContext('2d'); const t = new THREE.CanvasTexture(cv);
  const im = new Image(); im.onload = () => { try { c.fillStyle = '#ffffff'; c.fillRect(0, 0, 512, 512); c.drawImage(im, 32, 32, 448, 448); const d = c.getImageData(0, 0, 512, 512); for (let i = 0; i < d.data.length; i += 4) { d.data[i] = 255 - d.data[i]; d.data[i + 1] = 255 - d.data[i + 1]; d.data[i + 2] = 255 - d.data[i + 2]; } c.putImageData(d, 0, 0);
    c.fillStyle = '#000'; c.beginPath(); c.arc(256, 256, 7, 0, PI * 2); c.fill(); t.needsUpdate = true; } catch (e) { } }; im.src = 'assets/iv_flower.webp';
  const cv2 = document.createElement('canvas'); cv2.width = cv2.height = 256; const c2 = cv2.getContext('2d'); if (c2 && c2.fillRect && c2.arc) { c2.fillStyle = '#ffffff'; c2.fillRect(0, 0, 256, 256); c2.fillStyle = '#000'; c2.beginPath(); c2.arc(128, 128, 4, 0, PI * 2); c2.fill(); }
  const a = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: t, toneMapped: false })); a.position.set(X - 0.9, g + 1.8, Z); a.rotation.y = PI; scene.add(a);
  const b = new THREE.Mesh(new THREE.PlaneGeometry(1.5, 1.5), new THREE.MeshBasicMaterial({ map: new THREE.CanvasTexture(cv2), toneMapped: false })); b.position.set(X + 0.9, g + 1.8, Z); b.rotation.y = PI; scene.add(b);
  const lab = signTex([{ t: 'STARE AT THE LEFT DOT FOR 20 SECONDS', s: 0.1 }, { t: 'THEN LOOK AT THE RIGHT ONE', s: 0.1 }], 1024, 200, '#16233f', '#efe8da'); const l = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 0.45), new THREE.MeshBasicMaterial({ map: lab })); l.position.set(X, g + 0.75, Z); l.rotation.y = PI; scene.add(l);
  facPut('iron', X, g + 1.8, Z + 0.04, 3.5, 1.7, 0.06, 0); facPut('iron', X - 1.6, g + 0.5, Z + 0.04, 0.08, 1.0, 0.08, 0); facPut('iron', X + 1.6, g + 0.5, Z + 0.04, 0.08, 1.0, 0.08, 0); facFlush(); boxWalls(X, Z, 3.5, 0.2, 0, -5, g + 2.7);
  window.__AFTER = { ok: true, P: [X, g, Z] };
})();
