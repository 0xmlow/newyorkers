/* ================================================================
   v292 REAL PROPS: TYRES AND A CAN (2026-11-24)
   An old tyre leaning on the BUIDL hoarding and one flat on the skate slab (the skaters ollie it), a red jerrycan by
   the site generator. ?props=0 off.
   ================================================================ */
(function tyres() {
  if (!PH.on) return; const T0 = [];
  T0.push([-44, ground(-44, -54.9), -54.9, 0, 1]);
  try { const [x, z] = SK.L2W(-6.5, 9.5); T0.push([x, SK.g0 + 0.06, z, 0, 1]); } catch (e) { }
  phPlace('isl_tyre', T0); phPlace('isl_jerry', [[-37.9, ground(-37.9, -47.4), -47.4, 0.6, 1]]);
})();
