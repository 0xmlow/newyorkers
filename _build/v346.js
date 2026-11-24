/* ================================================================
   v346 THE MAP: THE PAINTED PLACES (2026-11-24)
   The island map gains the painted places as stops of their own: the factory mural, the painted court, the rooftop
   billboard, the sky over the census, the lighthouse back.
   ================================================================ */
(function mapWalls() { if (!window.__MAP || !MAP.places) return; const A = (n, x, z, tx, tz) => MAP.places.push([n, x, z, tx, tz]);
  A('THE FACTORY MURAL', 16, -64, 26, -64); try { A('THE PAINTED COURT', COURT.x, COURT.z, COURT.x + 8, COURT.z + 6); } catch (e) { } A('THE ROOFTOP BILLBOARD', 20, 69, 0, 62); A('THE SKY OVER THE CENSUS', -11, 66, -2, 62); A('THE LIGHTHOUSE BACK', 0, -130, 0, -150); })();
