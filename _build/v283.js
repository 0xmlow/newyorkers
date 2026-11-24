/* ================================================================
   v283 THE MAP KNOWS (2026-11-23)
   The island map (v50) gains the new places so you can click straight to them: THE MEME RIVER, THE CREDITS, THE
   WELL, THE EYE FROM ONE SPOT, THE HOLLOW EYE, THE IMPOSSIBLE TRIANGLE, THE CARD THAT STANDS UP, THE DISC THAT
   TURNS, THE PAINTED TANK and the handball court.
   ================================================================ */
(function mapPlaces() {
  if (!window.__MAP || !MAP.places) return; const add = (n, x, z, tx, tz) => MAP.places.push([n, x, z, tx == null ? x : tx, tz == null ? z : tz]);
  add('THE MEME RIVER', 0, 60, 1.5, 70); try { if (window.__CRED && CRED.mesh) add('THE CREDITS', 0, 116.6, 0, 108); } catch (e) { }
  try { if (WELL.P) add('THE WELL', WELL.P[0], WELL.P[2], 2, -24); } catch (e) { }
  try { if (ANA.V) add('THE EYE FROM ONE SPOT', ANA.T.x, ANA.T.z, ANA.V.x, ANA.V.z); } catch (e) { }
  try { if (HOLLOW.ok) add('THE HOLLOW EYE', 21, 6.8, 20, -0.5); } catch (e) { }
  try { if (PEN.V) add('THE IMPOSSIBLE TRIANGLE', PEN.C.x, PEN.C.z, PEN.V.x, PEN.V.z); } catch (e) { }
  try { if (STAND.V) add('THE CARD THAT STANDS UP', STAND.Q.x, STAND.Q.z, STAND.V.x, STAND.V.z); } catch (e) { }
  try { if (SNAKE.ok) add('THE DISC THAT TURNS', SNAKE.P[0], SNAKE.P[2], SNAKE.P[0] + 5, SNAKE.P[2] + 3); } catch (e) { }
  try { if (WT.painted) add('THE PAINTED TANK', WT_AT.x, WT_AT.z, WT_AT.x + 10, WT_AT.z + 10); } catch (e) { }
})();
