/* ================================================================
   v249 WALLPAPER: GHOST SIGNS (2026-11-23)
   A New York tenement next to a lower building shows a blank brick party wall, and on it, very often, the ghost of
   an old painted advertisement. The three new buildings (v227 to v229) now have one blank party wall each (the
   bodega's east side, the laundromat's sea side, the DROP shop's west side), and on each a faded MLow mural from
   Firefly: an Open Eye Flower and contour waves painted straight onto the brick decades ago, flaking. ?wallpaper=0 off.
   ================================================================ */
(function ghostSigns() {
  if (!WALLS.on || !window.__BLK || !BLK.party) return;
  BLK.party.forEach(p => { const { cx, cz, nx, nz, hd, fw, y0, H } = p; const m = new THREE.Mesh(new THREE.PlaneGeometry(fw, H), wallMat('ghostbrick', 1, 1, { rough: 0.92 }));
    m.position.set(cx + nx * (hd + 0.012), y0 + H / 2, cz + nz * (hd + 0.012)); m.rotation.y = Math.atan2(nx, nz); m.receiveShadow = true; scene.add(m); WALLS.n++; });
})();
