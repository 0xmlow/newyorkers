/* ================================================================
   v333 THE TOUR: THE ISLAND TONIGHT (2026-11-24)
   A stop that rises over the island and holds while the river glows and the painted walls catch their lights, the
   frame every promo wants. The tour keeps its own clock; this stop reads best on a night visit.
   ================================================================ */
(function tourV333() { const T = (window.__game && __game.TOUR) || TOUR, at = T.findIndex(r => r.name === 'aerial');
  T.splice(at < 0 ? T.length : at, 0, { name: 'the island tonight', dur: 9, pos: [[-70, 40, 90], [-40, 58, 70]], look: [[0, 0, 10], [0, 0, 0]] }); })();
