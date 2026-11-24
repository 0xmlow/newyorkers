/* ================================================================
   v321 REAL PROPS: CANS AND DELIVERIES (2026-11-24)
   Scanned spray cans (the real thing, labels and drips) at the foot of the handball wall where the island tags it,
   and taped cardboard delivery boxes stacked by the bodega's side door and the DROP shop, waiting to be carried in.
   ?props=0 off.
   ================================================================ */
(function cansDeliveries() {
  if (!PH.on) return;
  try { if (window.__HB2) { const [x, z] = HB2.L2W(-2.4, 0.75), g = ground(WALL_AT.x, WALL_AT.z); phPlace('isl_spray', [[x, g, z, WALLP.ry + 0.4, 1]], { shadow: false }); } } catch (e) { }
  const C = [], g = ground(17, 66) + 0.02; C.push([12.9, g, 72.9, 0.1, 1], [12.95, g + 0.36, 72.9, -0.2, 0.9]);
  try { if (window.__LINE) C.push([-58.1, LINE.g0, 81.6, 0.3, 1], [-58.1, LINE.g0 + 0.36, 81.6, 0.1, 0.85], [-58.0, LINE.g0, 80.7, -0.4, 1]); } catch (e) { }
  phPlace('isl_cardboard', C);
})();
