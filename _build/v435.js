/* ================================================================
   v435 THE HIGHLIGHTS TOUR KEEPS TO FOUR MINUTES (2026-11-24)
   This round added stops to the highlights tour. If they push it past four and a half minutes, every stop added
   since the round began is shortened in proportion so the whole tour still fits, ending at dusk as before (v382).
   ================================================================ */
(function tourFits() { const T = (window.__game && __game.TOUR) || TOUR; if (/fulltour/.test(location.search)) return;
  const ours = ['the infinite barbershop', 'the n3w boardwalk', 'the floating crosswalk', 'the memes walk', 'the boardwalk at night'];
  const tot = T.reduce((s, r) => s + (r.dur || 8), 0), cap = 270; if (tot <= cap) return; const mine = T.filter(r => ours.includes(r.name)), m = mine.reduce((s, r) => s + r.dur, 0), k = Math.max(0.6, 1 - (tot - cap) / Math.max(1, m)); mine.forEach(r => r.dur = Math.round(r.dur * k * 10) / 10);
  window.__TOURLEN = T.reduce((s, r) => s + (r.dur || 8), 0); })();
