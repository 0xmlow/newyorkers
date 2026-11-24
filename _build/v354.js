/* ================================================================
   v354 THE TOUR: SATURDAY (2026-11-24)
   Three stops before the aerial: the stoop sale, the birthday on the lawn, laundry day.
   ================================================================ */
(function tourV354() { const T = (window.__game && __game.TOUR) || TOUR, add = [];
  if (window.__SALE && SALE.P) { const [x, g, z] = SALE.P; add.push({ name: 'the stoop sale', dur: 7, pos: [[x - 4, g + 1.7, z - 2.5], [x - 3, g + 1.6, z + 1]], look: [[x, g + 0.8, z], [x, g + 0.8, z + 0.3]] }); }
  if (window.__BDAY && BDAY.P) { const [x, g, z] = BDAY.P; add.push({ name: 'the birthday', dur: 6, pos: [[x + 3, g + 1.8, z + 3.5], [x + 2, g + 1.7, z + 2.6]], look: [[x + 0.4, g + 1.1, z], [x + 0.6, g + 1.3, z]] }); }
  if (window.__LAUND) add.push({ name: 'laundry day', dur: 6, pos: [[-81.5, LAUND.g0 + 1.7, -2.5], [-82.5, LAUND.g0 + 1.6, -3]], look: [[-85.6, LAUND.g0 + 1, -4], [-85.6, LAUND.g0 + 1, -3]] });
  const at = T.findIndex(r => r.name === 'aerial'); T.splice(at < 0 ? T.length : at, 0, ...add); })();
