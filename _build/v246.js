/* ================================================================
   v246 THE TOUR: THE RIVER (2026-11-23)
   Three stops before the aerial: down the north spoke on the meme river to the Floor, the credits on the back of
   the welcome billboard, and the river from above.
   ================================================================ */
(function tourV246() {
  const T = (window.__game && __game.TOUR) || TOUR, add = [];
  if (window.__RIVER && RIVER.mesh) { add.push({ name: 'the meme river', dur: 9, pos: [[0.6, 1.5, 70], [0.4, 1.4, 44], [0.3, 1.6, 22]], look: [[0.2, 0.4, 58], [0.1, 0.5, 32], [0, 0.6, 8]] });
    add.push({ name: 'the river from above', dur: 8, pos: [[60, 70, 60], [0, 80, 72]], look: [[0, 0, 0], [0, 0, 6]] }); }
  if (window.__CRED && CRED.mesh) { const y = ground(0, 112); add.push({ name: 'the credits', dur: 8, pos: [[-4, y + 2.4, 103], [2, y + 3.2, 106]], look: [[0, y + 8.6, 117], [0, y + 9, 117]] }); }
  const at = T.findIndex(r => r.name === 'aerial'); T.splice(at < 0 ? T.length : at, 0, ...add);
})();
