/* ================================================================
   v336 THE TOUR ENDS WHERE IT BEGAN (2026-11-24)
   The last stop before the aerial walks back down the meme river to the pier and turns to face the credits: every
   artist on the island, by name, before you leave.
   ================================================================ */
(function tourV336() { const T = (window.__game && __game.TOUR) || TOUR, at = T.findIndex(r => r.name === 'aerial'); if (!window.__CRED || !CRED.mesh) return; const y = ground(0, 108);
  T.splice(at < 0 ? T.length : at, 0, { name: 'the credits again', dur: 9, pos: [[2.2, y + 1.7, 90], [0.6, y + 1.8, 101], [0.2, y + 2.2, 106]], look: [[0, y + 1.5, 96], [0, y + 6, 116], [0, y + 9, 117]] }); })();
