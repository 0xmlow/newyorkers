/* ================================================================
   v433 THE TOUR SEES THE BOARDWALK LIT (2026-11-24)
   After the island at night, the tour drifts down the N3W Boardwalk under its string lights: the marquee bulbs
   chasing, OPEN buzzing in the barbershop door, the barber pole glowing, the lit windows across the road.
   ================================================================ */
(function tourBoardwalkNight() { if (!window.__BWALK || !BWALK.ok) return; const P = (deg, r, y) => { const a = deg * PI / 180; return [Math.sin(a) * r, y, Math.cos(a) * r]; }, g = 0.6;
  const stop = { name: 'the boardwalk at night', dur: 10, pos: [P(258, 103.2, g + 2.6), P(244, 103.4, g + 2.2)], look: [P(246, 108.5, g + 2.4), P(236, 109, g + 2.2)] };
  [((window.__game && __game.TOUR) || TOUR), window.__TOURFULL].forEach(R => { if (!R) return; const k = R.findIndex(q => q.name === 'the island tonight'); if (k >= 0 && !R.some(q => q === stop)) R.splice(k + 1, 0, stop); });
})();
