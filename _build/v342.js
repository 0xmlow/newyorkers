/* ================================================================
   v342 THE TOUR: ROUND THREE OF THE WALLS (2026-11-24)
   Four stops before the aerial: the sky over the census walk, the skate plaza's pieces, the rooftop billboard over the
   bodega, the market's painted boards.
   ================================================================ */
(function tourV342() { const T = (window.__game && __game.TOUR) || TOUR, add = [];
  if (window.__WALLS && WALLS.sky) add.push({ name: 'the sky over the census', dur: 8, pos: [[-2, 2.6, 50], [-2.5, 3.2, 72]], look: [[-11, 6.8, 54], [-11, 7, 76]] });
  try { const [x, z] = SK.L2W(-12, 3); add.push({ name: 'skate pieces', dur: 6, pos: [[x, SK.g0 + 2.2, z], [x + 2, SK.g0 + 2, z + 2]], look: [[SK.L2W(-4, 8)[0], SK.g0 + 0.5, SK.L2W(-4, 8)[1]], [SK.L2W(0, 9)[0], SK.g0 + 0.6, SK.L2W(0, 9)[1]]] }); } catch (e) { }
  if (window.__RBB && RBB.mesh) add.push({ name: 'the rooftop billboard', dur: 7, pos: [[-6, 8, 62], [-2, 10, 66]], look: [[20, 9.5, 69], [20, 10, 69]] });
  if (window.__MKT && MKT.k && MKT.k[0]) { const k = MKT.k[0], gy = ground(k.x, k.z); add.push({ name: 'the market boards', dur: 6, pos: [[k.x - 2, gy + 1.7, k.z + 6], [k.x + 4, gy + 1.7, k.z + 6]], look: [[k.x, gy + 1.3, k.z + 1.2], [k.x + 4, gy + 1.3, k.z + 1.2]] }); }
  const at = T.findIndex(r => r.name === 'aerial'); T.splice(at < 0 ? T.length : at, 0, ...add); })();
