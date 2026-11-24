/* ================================================================
   v427 THE TOUR WALKS THE BOARDWALK (2026-11-24)
   One stroll replaces the separate boardwalk stops in the highlights tour: down the N3W Boardwalk from the first
   sideshow board past N3W CUTS' window to the last board, about twenty seconds. The full tour (Shift T) keeps the
   close stops (the pole, the magic eye, the zoetrope).
   ================================================================ */
(function tourBoardwalk() { const T = (window.__game && __game.TOUR) || TOUR; if (!window.__BWALK || !BWALK.ok) return;
  const P = (deg, r, y) => { const a = deg * PI / 180; return [Math.sin(a) * r, y, Math.cos(a) * r]; }, g = ground(Math.sin(4.2) * 106, Math.cos(4.2) * 106);
  const stop = { name: 'the n3w boardwalk', dur: 20, pos: [P(222, 105.6, g + 1.7), P(232, 105.8, g + 1.7), P(240, 105.9, g + 1.7), P(250, 105.8, g + 1.7), P(259, 105.6, g + 1.7)], look: [P(228, 109.6, g + 1.8), P(236, 110, g + 1.8), P(240.5, 111, g + 1.7), P(253, 109.6, g + 1.8), P(262, 108, g + 1.6)] };
  const drop = ['the barber pole', 'magic eye', 'the zoetrope', 'the sideshow row'], at = T.findIndex(q => q.name === 'the infinite barbershop');
  for (let i = T.length - 1; i >= 0; i--) if (drop.includes(T[i].name)) T.splice(i, 1);
  const at2 = T.findIndex(q => q.name === 'the infinite barbershop'); T.splice(at2 < 0 ? T.length - 1 : at2 + 1, 0, stop);
  if (window.__TOURFULL && __TOURFULL !== T) { const k = __TOURFULL.findIndex(q => q.name === 'the sideshow row'); __TOURFULL.splice(k < 0 ? __TOURFULL.length - 1 : k + 1, 0, stop); }
})();
