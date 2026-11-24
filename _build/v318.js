/* ================================================================
   v318 REAL PROPS: HARDWARE ON THE SIDEWALK (2026-11-24)
   N3W HARDWARE (v214) does what every city hardware store does at opening time: half the shop comes out onto the
   sidewalk. A scanned green tool cart with a toolbox on it, two propane tanks, brooms and a spade leaning on the
   wall, a sledgehammer, a step ladder. ?props=0 off.
   ================================================================ */
(function hardwareOut() {
  if (!PH.on || !window.__WT) return; const x0 = WT_AT.x + 1.8, z = WT_AT.z + 3.5 + 0.19 + 0.55, g = WT.top - 7 + 0.02, G = (x, zz) => ground(x, zz);
  phPlace('isl_toolcart', [[x0 + 0.6, G(x0 + 0.6, z), z + 0.1, 0, 1]]); phPlace('isl_toolbox', [[x0 + 0.6, G(x0 + 0.6, z) + 0.86, z + 0.1, 0.2, 1]]);
  phPlace('isl_propane', [[x0 + 1.7, G(x0 + 1.7, z), z, 0.4, 1], [x0 + 2.15, G(x0 + 2.15, z), z + 0.1, 1.7, 1]]);
  phPlace('isl_broom', [[x0 + 2.8, G(x0 + 2.8, z - 0.3), z - 0.32, 0.15, 1], [x0 + 3.0, G(x0 + 3.0, z - 0.3), z - 0.32, -0.1, 1]]);
  phPlace('isl_spade', [[x0 + 3.25, G(x0 + 3.25, z - 0.3), z - 0.32, 0.05, 1]]); phPlace('isl_sledge', [[x0 + 1.2, G(x0 + 1.2, z), z + 0.35, 1.3, 1]]);
  phPlace('isl_ladder', [[x0 - 0.5, G(x0 - 0.5, z), z - 0.1, 0, 0.8]]);
})();
