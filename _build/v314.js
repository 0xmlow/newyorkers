/* ================================================================
   v314 THE TOUR: THE SECOND ROUND OF TRICKS (2026-11-24)
   Five stops before the aerial: walking past the lenticular so it flips, the Ames window turning, the door to
   nowhere from the front and then from the side, the mirror cylinder on its table, and the lilac chaser.
   ================================================================ */
(function tourV314() {
  const T = (window.__game && __game.TOUR) || TOUR, add = [];
  if (window.__LENT && LENT.ok) { const [x, g, z] = LENT.P; add.push({ name: 'the lenticular', dur: 8, pos: [[x - 6, g + 1.7, z + 6], [x + 6, g + 1.7, z + 6]], look: [[x, g + 2.6, z], [x, g + 2.6, z]] }); }
  if (window.__AMES && AMES.ok) { const [x, g, z] = AMES.P; add.push({ name: 'the ames window', dur: 8, pos: [[x + 4.5, g + 2.2, z + 3], [x + 4.2, g + 2.3, z + 3.3]], look: [[x, g + 2.6, z], [x, g + 2.6, z]] }); }
  if (window.__DOORN && DOORN.ok) { const [x, g, z] = DOORN.P; add.push({ name: 'the door to nowhere', dur: 9, pos: [[x + 6, g + 1.6, z], [x + 2.2, g + 1.6, z + 0.2], [x + 1.8, g + 1.7, z + 2.6]], look: [[x, g + 1.2, z], [x, g + 1.2, z], [x, g + 1.2, z]] }); }
  if (window.__CYL && CYL.ok) { const [x, y, z] = CYL.P; add.push({ name: 'the mirror cylinder', dur: 7, pos: [[x + 1.2, y + 0.9, z + 0.6], [x + 0.9, y + 0.7, z + 0.9]], look: [[x, y + 0.2, z], [x, y + 0.2, z]] }); }
  if (window.__CHASE && CHASE.ok) { const [x, g, z] = CHASE.P; add.push({ name: 'the lilac chaser', dur: 8, pos: [[x, g + 2.2, z - 3.2], [x, g + 2.25, z - 3.1]], look: [[x, g + 2.3, z], [x, g + 2.3, z]] }); }
  const at = T.findIndex(r => r.name === 'aerial'); T.splice(at < 0 ? T.length : at, 0, ...add);
})();
