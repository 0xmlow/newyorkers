/* ================================================================
   v466 THE ILLUSION BEACH: NINE THINGS, 38 ILLUSIONS (2026-11-24)
   With the wheel and the spiral the east beach holds nine: the gate says NINE THINGS THAT ARE NOT THERE, the pier
   says 38 ILLUSIONS, and the full tour's beach walk runs on past the cube to the spiral before it stops on the
   Kanizsa footprints.
   ================================================================ */
(function eastNine() {
  if (!window.__EASTB) return;
  try { const s = SIGNS.find(q => q.lines && q.lines[0] && q.lines[0].t === 'N3W ILLUSION BEACH'); if (s) { s.lines[1].t = 'NINE THINGS THAT ARE NOT THERE'; signCanvas(s.lines, s.w, s.h, s.bg, s.fg, s.cv); s.t.needsUpdate = true; } } catch (e) { }
  try { const s = SIGNS.find(q => q.lines && q.lines[0] && /^\d+ ILLUSIONS/.test(q.lines[0].t)); if (s) { s.lines[0].t = '38 ILLUSIONS · 577 CARDS · 472 ARTISTS'; signCanvas(s.lines, s.w, s.h, s.bg, s.fg, s.cv); s.t.needsUpdate = true; } } catch (e) { }
  try { if (window.__TOURFULL) { const st = __TOURFULL.find(q => q.name === 'the illusion beach'); if (st) { const E3 = (deg, r, y) => { const q = eastAt(deg, r); return [q.x, q.g + y, q.z]; }, kz = eastAt(70, 120.5);
    st.pos = [E3(37, 112, 2.1), E3(60, 111, 2.0), E3(100, 111, 2.0), E3(140, 112, 2.0), E3(110, 110.5, 1.9), E3(70, 111.5, 1.65)]; st.look = [E3(40, 120, 1.9), E3(70, 121, 2.2), E3(110, 121, 2.4), E3(150, 120.5, 1.7), E3(90, 121, 3.0), [kz.x, kz.g + 1.65 + 0.55, kz.z]]; st.dur = 30; } } } catch (e) { }
})();
