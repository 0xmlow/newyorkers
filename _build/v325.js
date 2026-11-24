/* ================================================================
   v325 THE TOUR: THE GOODS (2026-11-24)
   Three stops before the aerial: the bodega's fruit stand, the hardware store's sidewalk, and the market counters.
   ================================================================ */
(function tourV325() {
  const T = (window.__game && __game.TOUR) || TOUR, add = [], g = ground(17, 66);
  add.push({ name: 'the fruit stand', dur: 6, pos: [[9.2, g + 1.75, 64.6], [9.6, g + 1.6, 63.6]], look: [[11, g + 0.8, 61.5], [11, g + 0.8, 61.5]] });
  if (window.__WT) { const x0 = WT_AT.x + 1.8, z = WT_AT.z + 4.24; add.push({ name: 'the hardware sidewalk', dur: 6, pos: [[x0 + 1.5, ground(x0, z) + 1.7, z + 4.5], [x0 + 2.2, ground(x0, z) + 1.6, z + 3.2]], look: [[x0 + 1.5, ground(x0, z) + 0.6, z], [x0 + 1.5, ground(x0, z) + 0.6, z]] }); }
  if (window.__MKT && MKT.k && MKT.k[0]) { const k = MKT.k[0], gy = ground(k.x, k.z); add.push({ name: 'the market counters', dur: 6, pos: [[k.x - 2.5, gy + 1.7, k.z - 3.2], [k.x + 2.5, gy + 1.7, k.z - 3.2]], look: [[k.x, gy + 1.1, k.z - 0.8], [k.x + 3, gy + 1.1, k.z - 0.8]] }); }
  const at = T.findIndex(r => r.name === 'aerial'); T.splice(at < 0 ? T.length : at, 0, ...add);
})();
