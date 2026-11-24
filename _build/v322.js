/* ================================================================
   v322 THE FRUIT STAND'S PRICE CARDS (2026-11-24)
   Hand lettered price cards on sticks stuck into each crate, the fluorescent card stock every bodega uses: APPLES 3
   FOR $2, LIMES 4 FOR $1, LEMONS 2 FOR $1, written in marker, a little crooked.
   ================================================================ */
(function priceCards() {
  if (!PH.on) return; const g = ground(17, 66) + 0.02, x = 10.95;
  [[60.5, 'APPLES', '3 FOR $2', '#f2ff4a'], [61.45, 'LIMES', '4 FOR $1', '#ff7ad1'], [62.4, 'LEMONS', '2 FOR $1', '#7affb1']].forEach(([z, a, b, col], i) => {
    const t = signTex([{ t: a, s: 0.3, f: '"Permanent Marker",cursive' }, { t: b, s: 0.36, f: '"Permanent Marker",cursive' }], 256, 192, col, '#111111');
    const m = new THREE.Mesh(new THREE.PlaneGeometry(0.22, 0.165), new THREE.MeshStandardMaterial({ map: t, roughness: 0.8, side: THREE.DoubleSide })); m.position.set(x - 0.22, g + 0.98, z + 0.12); m.rotation.set(0, -PI / 2, (i - 1) * 0.08); scene.add(m);
    facPut('stud', x - 0.2, g + 0.8, z + 0.12, 0.012, 0.3, 0.012, 0); });
  facFlush();
})();
