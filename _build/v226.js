/* ================================================================
   v226 THE TOUR: THE PARKS (2026-11-23)
   Four more stops before the aerial: the handball court, the rink boards, the skate plaza and the census walk's
   picture lights.
   ================================================================ */
(function tourV226() {
  const T = (window.__game && __game.TOUR) || TOUR, add = [];
  try { if (window.__HB2 && HB2.L2W) { const W = HB2.L2W, g = ground(WALL_AT.x, WALL_AT.z); const a = W(3.2, 14), b = W(0, 13.2), l = W(0, 0); add.push({ name: 'the handball court', dur: 7, pos: [[a[0], g + 2.4, a[1]], [b[0], g + 1.9, b[1]]], look: [[l[0], g + 1.8, l[1]], [l[0], g + 2, l[1]]] }); } } catch (e) { }
  try { if (window.__RB2 && RB2.ok) { const x = RINK_AT.x, z = RINK_AT.z, g = RINK.g0, gx = Math.cos(RINK.gapA), gz = Math.sin(RINK.gapA); add.push({ name: 'the rink boards', dur: 7, pos: [[x + gx * 15 - gz * 8, g + 2.8, z + gz * 15 + gx * 8], [x + gx * 10 + gz * 3, g + 2.0, z + gz * 10 - gx * 3]], look: [[x, g + 0.8, z], [x, g + 0.8, z]] }); } } catch (e) { }
  try { if (window.__SK2 && SK2.ok) { const W = SK.L2W, g = SK.g0, a = W(-10, -1), b = W(-8, 3), l = W(1, 7); add.push({ name: 'the skate plaza', dur: 7, pos: [[a[0], g + 2.2, a[1]], [b[0], g + 1.8, b[1]]], look: [[l[0], g + 0.6, l[1]], [l[0], g + 0.6, l[1]]] }); } } catch (e) { }
  try { if (window.__CW2 && CW2.ok) { const g = ground(-6, 60); add.push({ name: 'the picture lights', dur: 7, pos: [[-3, g + 2.0, 50], [-3.5, g + 2.0, 60]], look: [[-11, g + 3.4, 56], [-11, g + 3.4, 66]] }); } } catch (e) { }
  const at = T.findIndex(r => r.name === 'aerial'); T.splice(at < 0 ? T.length : at, 0, ...add);
})();
