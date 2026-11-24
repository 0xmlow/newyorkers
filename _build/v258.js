/* ================================================================
   v258 REAL PROPS: TABLES OUTSIDE (2026-11-23)
   Two scanned bistro sets (slatted wood, folding steel) on the bodega's sidewalk, where people drink the coffee
   they bought inside; scanned picnic tables, an Open Eye Flower burned into each top, by the rink for lacing skates
   and on the east lawn by the hollow eye. The rink's boxy ice machine of v218 is retired for them.
   ?props=0 turns them off.
   ================================================================ */
(function tablesOutside() {
  if (!PH.on) return;
  try { const g = ground(17, 66) + 0.02; phPlace('isl_cafe', [[8.6, g, 70.4, 0.3, 1], [8.4, g, 61.8, -0.4, 1]]); } catch (e) { }
  const pic = [[17.5, ground(17.5, -7.5), -7.5, 0.2, 1], [23.5, ground(23.5, -6.5), -6.5, -0.3, 1]];
  try { if (window.__RB2 && RB2.boni) { const [bx, bz] = RB2.boni; blkHideIn(bx - 1.8, bx + 1.8, bz - 1.8, bz + 1.8, RINK.g0 - 0.3, RINK.g0 + 2.6); pic.push([bx, ground(bx, bz), bz, RINK.gapA, 1]); } } catch (e) { }
  phPlace('isl_picnic', pic); pic.forEach(([x, , z]) => post(x, z, 0.9, -5, 1));
})();
