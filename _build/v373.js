/* ================================================================
   v373 THE TOUR: WEATHER AND WEAR (2026-11-24)
   Two stops before the aerial: steam on the ring road, and the fruit stand with its contact shadows close up.
   ================================================================ */
(function tourV373() { const T = (window.__game && __game.TOUR) || TOUR, add = []; if (window.__MANH && MANH.list[0]) { const s = MANH.list[0].position; add.push({ name: 'steam', dur: 6, pos: [[s.x - 6, 1.8, s.z + 5], [s.x - 4.5, 1.8, s.z + 4]], look: [[s.x, 2.2, s.z], [s.x, 2.6, s.z]] }); }
  const at = T.findIndex(r => r.name === 'aerial'); T.splice(at < 0 ? T.length : at, 0, ...add); })();
