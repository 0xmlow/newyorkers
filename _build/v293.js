/* ================================================================
   v293 REAL PROPS: LIGHT UNDER THE SHED (2026-11-24)
   The green sidewalk shed in front of the OPEN WALL (v176) gets what every real one has under its deck: scanned
   caged fluorescent fixtures hanging on chains, and after dusk they light the walk under it. ?props=0 off.
   ================================================================ */
(function shedLights() {
  if (!PH.on) return; const wg = ground(-51, -34), dh = wg + 5.65, L0 = [];
  for (let x = -56; x <= -46; x += 3.3) { L0.push([x, dh - 1.15, -32.6, 0, 1]); }
  phPlace('isl_caged', L0, { shadow: false }); practical(-51, dh - 1.4, -32.6, 0xe8f0ff, 9, 12);
})();
