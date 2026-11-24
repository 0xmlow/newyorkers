/* ================================================================
   v465 THE SPIRAL THAT ISN'T (2026-11-24)
   A round mosaic five metres across tilted up off the sand on a low frame, black and white and gold: a spiral
   winding into the middle. There is no spiral. It is a set of separate circles, each drawn as a twisted cord, on a
   chequered ground that leans the same way, and your brain joins the leaning pieces into one path. Follow a ring
   round with your eye and you come back to where you started. James Fraser, 1908. ?eastbeach=0 off.
   ================================================================ */
(function fraserSpiral() {
  if (!window.__EASTB || /eastbeach=0/.test(location.search)) return;
  const P = eastAt(150, 120.5); eastLabel(150, 114.8, 'FOLLOW THE SPIRAL IN', 'THERE IS NO SPIRAL. EVERY RING CLOSES ON ITSELF.');
  const S = 1024, cv = document.createElement('canvas'); cv.width = S; cv.height = S; const c = cv.getContext('2d');
  if (c && c.arc && c.save) { const cx = S / 2; c.fillStyle = '#16233f'; c.fillRect(0, 0, S, S);
    // the chequered ground: wedges by rings, alternating, leaning
    for (let r = 0; r < 12; r++) { const r0 = 30 + r * 40, r1 = r0 + 40; for (let k = 0; k < 48; k++) { const a0 = k / 48 * PI * 2 + r * 0.06, a1 = a0 + PI * 2 / 48; c.fillStyle = (k + r) % 2 ? '#c9a24a' : '#e9e2d0'; c.beginPath(); c.arc(cx, cx, r1, a0, a1); c.arc(cx, cx, r0, a1, a0, true); c.closePath(); c.fill(); } }
    // the twisted cords: short tilted dashes along each circle, alternating black and white
    for (let r = 1; r < 12; r++) { const rr = 30 + r * 40; const n = Math.round(rr * 0.42); for (let k = 0; k < n; k++) { const a = k / n * PI * 2; c.save(); c.translate(cx + Math.cos(a) * rr, cx + Math.sin(a) * rr); c.rotate(a + PI / 2 + 0.45); c.fillStyle = k % 2 ? '#0b0b0c' : '#ffffff'; c.fillRect(-7, -3.2, 14, 6.4); c.restore(); } }
    c.beginPath(); c.arc(cx, cx, 30, 0, PI * 2); c.fillStyle = '#16233f'; c.fill(); }
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = Math.min(ANISO, 8);
  const disc = new THREE.Mesh(new THREE.CircleGeometry(2.5, 96), new THREE.MeshStandardMaterial({ map: t, roughness: 0.6 })); disc.rotation.order = 'YXZ'; disc.rotation.set(-0.45, P.ry, 0); disc.position.set(P.x, P.g + 1.7, P.z); scene.add(disc);
  const back = new THREE.Mesh(new THREE.CylinderGeometry(2.6, 2.6, 0.08, 96), EASTB.navy); back.rotation.order = 'YXZ'; back.rotation.set(-0.45 + PI / 2, P.ry, 0); back.position.set(P.x - P.nx * 0.05, P.g + 1.7 - 0.02, P.z - P.nz * 0.05); scene.add(back);
  [-1.6, 1.6].forEach(u => { const m = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.2, 0.1), EASTB.navy); m.position.set(P.x + P.tx * u - P.nx * 0.5, P.g + 0.6, P.z + P.tz * u - P.nz * 0.5); scene.add(m); });
  post(P.x, P.z, 2.4, -5, 4); EASTB.fraser = disc;
})();
