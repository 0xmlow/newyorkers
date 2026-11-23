/* ================================================================
   v93 THE FIRE ESCAPE (2026-11-22)
   Black iron zigzag down the front of the brownstone: three slatted landings with railings, stairs between them,
   a drop ladder hanging over the sidewalk and a gooseneck ladder to the roof. E under the drop ladder pulls you
   up; on each landing E goes up one more (the front end) or down one (the back end). Plants and a folding chair
   on the second landing, because that is what fire escapes are actually for.
   ================================================================ */
const FIRE = { l: [] };
window.__FIRE = FIRE;
(function fireEscape() {
  const x0 = BROWN_AT.x, z0 = BROWN_AT.z, g0 = BROWN.g0, fx = BROWN.fx, iron = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.55, metalness: 0.6 });
  const zA = z0 - 0.4, zB = z0 + 3.2, xA = fx - 1.3, xB = fx - 0.02, slat = (() => { const cv = document.createElement('canvas'); cv.width = 128; cv.height = 128; const c = cv.getContext('2d'); if (c && c.fillRect && c.clearRect) { c.clearRect(0, 0, 128, 128); c.fillStyle = '#fff'; for (let i = 0; i < 128; i += 12) c.fillRect(i, 0, 7, 128); c.fillRect(0, 0, 128, 6); c.fillRect(0, 122, 128, 6); } return new THREE.CanvasTexture(cv); })();
  const deckM = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.55, metalness: 0.6, alphaMap: slat, alphaTest: 0.5, side: THREE.DoubleSide });
  for (let f = 1; f <= 3; f++) { const y = g0 + f * 3.1 + 0.85; FIRE.l.push(y);
    const deck = new THREE.Mesh(new THREE.PlaneGeometry(xB - xA, zB - zA), deckM); deck.rotation.x = -PI / 2; deck.position.set((xA + xB) / 2, y, (zA + zB) / 2); scene.add(deck);
    padRect(xA, xB, zA, zB, y + 0.02, y - 0.3);
    // railing: top rail and balusters on the open sides
    const rail = (ax, az, bx, bz) => { const L = Math.hypot(bx - ax, bz - az), m = new THREE.Mesh(new THREE.BoxGeometry(L, 0.04, 0.04), iron); m.position.set((ax + bx) / 2, y + 0.95, (az + bz) / 2); m.rotation.y = Math.atan2(-(bz - az), bx - ax); scene.add(m);
      for (let u = 0; u <= 1.0001; u += 0.1) { const b = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.95, 0.02), iron); b.position.set(ax + (bx - ax) * u, y + 0.47, az + (bz - az) * u); scene.add(b); } wall(ax, az, bx, bz, y - 0.2, y + 1.0); };
    rail(xA, zA, xA, zB); rail(xA, zA, xB, zA); rail(xA, zB, xB, zB);
    // stairs down to the landing below, along the facade
    if (f > 1) { const st = new THREE.Mesh(new THREE.BoxGeometry(0.6, 0.05, Math.hypot(3.1, zB - zA - 1.2)), iron); st.position.set(xB - 0.4, y - 1.55, (zA + zB) / 2); st.rotation.x = Math.atan2(3.1, zB - zA - 1.2) * (f % 2 ? 1 : -1); scene.add(st); }
    interact(xA + 0.5, zB - 0.6, 1.1, 'E · UP', () => { const ny = f < 3 ? FIRE.l[f] : BROWN.H + g0; teleport(f < 3 ? xA + 0.5 : x0, f < 3 ? zB - 0.9 : z0, PI / 2, ny + 1); if (f === 3) fireSecret(); }, y);
    interact(xA + 0.5, zA + 0.6, 1.1, 'E · DOWN', () => { if (f === 1) teleport(xA - 0.8, zA + 1.5, -PI / 2, g0 + 1); else teleport(xA + 0.5, zA + 0.9, PI / 2, FIRE.l[f - 2] + 1); }, y);
    if (f === 2) { [0, 0.5, 1.0].forEach((dz, i) => { const pot = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.1, 0.22, 10), new THREE.MeshStandardMaterial({ color: 0xa0522d, roughness: 0.9 })); pot.position.set(xB - 0.25, y + 0.11, zA + 0.5 + dz); scene.add(pot);
        const leaf = new THREE.Mesh(new THREE.SphereGeometry(0.2, 8, 6), new THREE.MeshStandardMaterial({ color: [0x2f6a3a, 0x3e7a3a, 0x2a5a30][i], roughness: 0.9 })); leaf.scale.y = 1.3; leaf.position.set(xB - 0.25, y + 0.42, zA + 0.5 + dz); scene.add(leaf); });
      const chair = new THREE.Mesh(new THREE.BoxGeometry(0.4, 0.04, 0.4), new THREE.MeshStandardMaterial({ color: 0x2962FF, roughness: 0.6 })); chair.position.set(xA + 0.5, y + 0.42, (zA + zB) / 2 + 0.6); scene.add(chair); } }
  // the drop ladder from the first landing, and the gooseneck to the roof
  const lad = (x, z, ya, yb) => { [-0.2, 0.2].forEach(s => { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, yb - ya, 6), iron); r.position.set(x, (ya + yb) / 2, z + s); scene.add(r); }); for (let y = ya + 0.2; y < yb; y += 0.3) { const r = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.4, 6), iron); r.rotation.x = PI / 2; r.position.set(x, y, z); scene.add(r); } };
  lad(xA + 0.3, zA + 1.5, g0 + 2.2, FIRE.l[0] + 0.95); lad(xB - 0.2, zB - 0.6, FIRE.l[2], BROWN.H + g0 + 1.0);
  interact(xA - 0.4, zA + 1.5, 1.4, 'E · PULL DOWN THE LADDER', () => teleport(xA + 0.6, zA + 1.5, PI / 2, FIRE.l[0] + 1));
})();
const fireSecret = secret('fireescape', () => { toast('UP THE FIRE ESCAPE AND ONTO THE ROOF. THE LANDLORD WOULD LIKE A WORD. THE LANDLORD IS NOT HERE.', 'blue'); });
