/* ================================================================
   v248 WALLPAPER: GATES AND THE LAUNDROMAT (2026-11-23)
   The two roll down gates (v183) now wear the Firefly shutter piece: contour rivers running across the slats to an
   Open Eye Flower, sprayed on corrugated steel. Inside SPIN CYCLE 420 the walls are papered in MLow's laundromat
   paper: soap bubbles that are eye flowers, coat hangers, water swirling like the inside of a drum. ?wallpaper=0 off.
   ================================================================ */
(function gatesAndLaundry() {
  if (!WALLS.on) return;
  try { if (window.__GATES && GATES.gm) { GATES.gm.map = wallTex('shutter'); GATES.gm.needsUpdate = true; WALLS.n++; } } catch (e) { }
  try { if (window.__LAUND && LAUND.wallM) { LAUND.wallM.map = wallTex('laundrypaper', 2, 1); LAUND.wallM.color.setHex(0xffffff); LAUND.wallM.needsUpdate = true; WALLS.n++; } } catch (e) { }
})();
