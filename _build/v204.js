/* ================================================================
   v204 THE LOOK: CELLAR DOORS (2026-11-23)
   The steel doors set into the sidewalk in front of New York shops, where the deliveries go down: two leaves of
   diamond plate in an angle iron frame, hinges along the outside edges, worn bright down the middle where everyone
   walks over them. In front of the bodega and the laundromat. ?cellar=0 off.
   ================================================================ */
(function cellarDoors() {
  if (!LOOK.on || /cellar=0/.test(location.search)) return;
  const cv = document.createElement('canvas'); cv.width = cv.height = 256; const c = cv.getContext('2d');
  if (c && c.fillRect && c.save) { c.fillStyle = '#4a4b4c'; c.fillRect(0, 0, 256, 256); for (let y = 0; y < 256; y += 16) for (let x = 0; x < 256; x += 16) { const o = (y / 16) % 2 ? 8 : 0; c.save(); c.translate(x + o, y + 8); c.rotate((y / 16) % 2 ? 0.8 : -0.8); c.fillStyle = '#8b8c8d'; c.fillRect(-6, -1.5, 12, 3); c.restore(); }
    const g = c.createLinearGradient(0, 0, 256, 0); if (g) { g.addColorStop(0, 'rgba(0,0,0,0.25)'); g.addColorStop(0.5, 'rgba(255,255,255,0.18)'); g.addColorStop(1, 'rgba(0,0,0,0.25)'); c.fillStyle = g; c.fillRect(0, 0, 256, 256); } }
  const t = new THREE.CanvasTexture(cv); t.encoding = THREE.sRGBEncoding; t.anisotropy = ANISO;
  const plate = new THREE.MeshStandardMaterial({ map: t, roughness: 0.45, metalness: 0.75 }), frame = new THREE.MeshStandardMaterial({ color: 0x2a2b2c, roughness: 0.5, metalness: 0.7 });
  const door = (x, z, ry) => { const g = new THREE.Group(); g.position.set(x, ground(x, z) + 0.13, z); g.rotation.y = ry; scene.add(g);
    [-0.36, 0.36].forEach(s => { const p = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.03, 1.4), plate); p.position.set(s, 0.015, 0); p.receiveShadow = true; g.add(p); const h = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.04, 0.18), frame); [-0.45, 0.45].forEach(zz => { const hh = h.clone(); hh.position.set(s * 1.97, 0.03, zz); g.add(hh); }); });
    const f = new THREE.Mesh(new THREE.BoxGeometry(1.52, 0.035, 1.5), frame); f.position.y = 0.0; g.add(f); };
  door(10.6, 62.2, PI / 2); door(-82.2, -6.6, PI / 2);
})();
