/* ================================================================
   v360 ILLUSION: THE SHADOW CHECKER (2026-11-24)
   A painted checkerboard of navy and bone tiles on a low plinth, a real cobalt cylinder standing on it and a painted
   soft shadow falling across the board. Two tiles are marked A and B: A looks dark, B in the shadow looks light. They
   are the exact same paint (Edward Adelson, 1995). A strip of that same paint runs between them to prove it.
   ?adelson=0 off.
   ================================================================ */
(function adelson() {
  if (!LOOK.on || /adelson=0/.test(location.search)) return; const X = -44, Z = -5.6, g = ground(X, Z);
  const cv = document.createElement('canvas'); cv.width = cv.height = 640; const c = cv.getContext('2d'); if (!c || !c.fillRect || !c.createRadialGradient) return;
  const T = 80, dark = [70, 80, 110], light = [175, 185, 205];
  for (let i = 0; i < 8; i++) for (let j = 0; j < 8; j++) { const base = (i + j) % 2 ? dark : light, sx = i * T + T / 2, sy = j * T + T / 2; const sh = Math.max(0, 1 - Math.hypot(sx - 470, sy - 470) / 230) * 0.55;
    const col = base.map(v => Math.round(v * (1 - sh))); c.fillStyle = `rgb(${col})`; c.fillRect(i * T, j * T, T, T); }
  // A sits outside the shadow on a dark tile, B inside the shadow on a light tile, and they are painted the same
  const A = [2, 3], Bt = [5, 6]; const same = 'rgb(70,80,110)'; c.fillStyle = same; c.fillRect(A[0] * T, A[1] * T, T, T);
  const shB = Math.max(0, 1 - Math.hypot(Bt[0] * T + 40 - 470, Bt[1] * T + 40 - 470) / 230) * 0.55; c.fillStyle = same; c.fillRect(Bt[0] * T, Bt[1] * T, T, T);
  c.fillStyle = '#efe8da'; c.font = '700 40px Arial'; c.textAlign = 'center'; c.textBaseline = 'middle'; c.fillText('A', A[0] * T + 40, A[1] * T + 40); c.fillText('B', Bt[0] * T + 40, Bt[1] * T + 40);
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding;
  const top = new THREE.Mesh(new THREE.PlaneGeometry(2.4, 2.4), new THREE.MeshBasicMaterial({ map: t })); top.rotation.x = -PI / 2; top.position.set(X, g + 0.62, Z); scene.add(top);
  const pl = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.6, 2.6), new THREE.MeshStandardMaterial({ color: 0xcfc6b6, roughness: 0.7 })); pl.position.set(X, g + 0.3, Z); pl.castShadow = pl.receiveShadow = true; scene.add(pl); boxWalls(X, Z, 2.6, 2.6, 0, -5, g + 0.6);
  const cy = new THREE.Mesh(new THREE.CylinderGeometry(0.3, 0.3, 0.9, 24), new THREE.MeshStandardMaterial({ color: 0x2962FF, roughness: 0.4 })); cy.position.set(X + 0.75, g + 1.07, Z + 0.75); cy.castShadow = true; scene.add(cy);
  window.__ADEL = { ok: true, P: [X, g, Z] };
})();
