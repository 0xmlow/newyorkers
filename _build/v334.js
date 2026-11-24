/* ================================================================
   v334 THE TOUR: WHAT TO LOOK FOR (2026-11-24)
   The tour's first island stop after the pier now pauses on the board of things to look for (v332).
   ================================================================ */
(function tourV334() { const T = (window.__game && __game.TOUR) || TOUR; if (!window.__LOOKFOR) return; const [x, g, z] = __LOOKFOR.P; const i = Math.max(1, T.findIndex(r => r.name === 'great wave'));
  T.splice(i, 0, { name: 'what to look for', dur: 6, pos: [[x - 1.0, g + 1.7, z - 2.6], [x - 0.8, g + 1.65, z - 2.0]], look: [[x, g + 1.6, z], [x, g + 1.6, z]] }); })();
