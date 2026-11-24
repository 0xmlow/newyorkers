/* ================================================================
   v476 THE PIER BOARD, ROUND FIVE (2026-11-24)
   The AND NOW panel at the pier lists what this round added: the illusion beach and its nine, the drone show's
   card of the hour, cards in the windows, the glowing surf.
   ================================================================ */
(function andNow3() { try { const s = SIGNS.find(q => q.lines && q.lines[0] && q.lines[0].t === 'AND NOW'); if (!s) return;
  s.lines = [{ t: 'AND NOW', s: 0.08 }].concat(['N3W ILLUSION BEACH · THE EAST SAND: NINE THINGS THAT ARE NOT THERE', 'THE HOLLOW FACE · THE CHAIR · THE TRIANGLE · THE CUBE · THE WHEEL', 'THE DRONE SHOW FLIES THE CARD OF THE HOUR · ON THE HOUR AFTER DARK', 'N3W CUTS AND THE BOARDWALK · THE WEST BEACH', 'THE MEMES WALK · 577 PLAQUES · THE WAVE AT 6:52:29 PM', 'AFTER DARK · CARDS ON THE WALLS IN THE WINDOWS, THE SURF GLOWS'].map(r => ({ t: r, s: 0.031, b: false })));
  signCanvas(s.lines, s.w, s.h, s.bg, s.fg, s.cv); s.t.needsUpdate = true; } catch (e) { } })();
