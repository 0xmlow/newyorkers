/* ================================================================
   v285 THE TOUR: THE LAST TRICKS (2026-11-23)
   Three stops before the aerial: the disc that turns, the wall that leans, and the stoop plants at the bodega's
   side door.
   ================================================================ */
(function tourV285() {
  const T = (window.__game && __game.TOUR) || TOUR, add = [];
  if (window.__SNAKE && SNAKE.ok) { const [x, y, z] = SNAKE.P; add.push({ name: 'the disc that turns', dur: 8, pos: [[x + 7, y - 1.4, z + 4], [x + 5.5, y - 1.4, z + 3.2]], look: [[x, y, z], [x, y, z]] }); }
  if (window.__CAFE) add.push({ name: 'the wall that leans', dur: 7, pos: [[-80, 1.8, 6], [-82.5, 1.8, 5]], look: [[-86, 1.9, 0], [-86.5, 1.9, 0]] });
  try { const g = ground(17, 66); add.push({ name: 'the stoop', dur: 6, pos: [[16, g + 1.7, 79], [14.5, g + 1.6, 77]], look: [[14, g + 1.2, 73.2], [14, g + 1.2, 73.2]] }); } catch (e) { }
  const at = T.findIndex(r => r.name === 'aerial'); T.splice(at < 0 ? T.length : at, 0, ...add);
})();
