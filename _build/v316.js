/* ================================================================
   v316 THE MAP: EVERY TRICK IN ONE PLACE (2026-11-24)
   The island map gains the lilac chaser and the afterimage, so all fourteen illusions are one click away.
   ================================================================ */
(function mapTricks() { const add = (n, p, dx, dz) => { if (window.__MAP && MAP.places && p) MAP.places.push([n, p[0], p[2], p[0] + dx, p[2] + dz]); };
  try { add('THE LILAC CHASER', CHASE.P, 0, -4); } catch (e) { } try { add('SEE THE TRUE COLOURS', __AFTER.P, 0, -4); } catch (e) { } })();
