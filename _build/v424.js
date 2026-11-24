/* ================================================================
   v424 THE PIER BOARD, UPDATED (2026-11-24)
   The AND NOW panel at the pier (v392) gains the newest: the wave at 6:52:29 (or type WAVE), the rooms behind the
   windows, the barber, the two new sideshow boards.
   ================================================================ */
(function andNow2() { try { const s = SIGNS.find(q => q.lines && q.lines[0] && q.lines[0].t === 'AND NOW'); if (!s) return;
  s.lines = [{ t: 'AND NOW', s: 0.08 }].concat(['N3W CUTS · THE WEST BEACH: THE INFINITE BARBERSHOP, THE POLE', 'MAGIC EYE AND THE ZOETROPE · BY THE SHOP', 'THE SIDESHOW ROW · FIVE BOARDS OF TRICKS', 'THE FLOATING CROSSWALK · THE NORTH KERB', 'THE MEMES WALK · 577 PLAQUES ROUND THE RIVER', 'THE WAVE · 6:52:29 PM, OR TYPE WAVE', 'AFTER DARK · SOMEONE HOME IN THE WINDOWS'].map(r => ({ t: r, s: 0.033, b: false })));
  signCanvas(s.lines, s.w, s.h, s.bg, s.fg, s.cv); s.t.needsUpdate = true; } catch (e) { } })();
