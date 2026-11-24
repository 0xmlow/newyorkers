/* ================================================================
   v257 REAL PROPS: PAYPHONES (2026-11-23)
   The New York payphone, scanned and already wearing the N3W BELL livery from MLow's ON LOCATION set (the wrap
   tool's nyb_payphone), at the kerb where the river's north spoke reaches the ring road, at the east spoke, and on
   the corner by the bodega's side door. ?props=0 turns them off.
   ================================================================ */
(function payphones() {
  if (!PH.on) return; const L0 = [];
  [[-3.6, 83.5, PI / 2], [83.5, 3.6, PI], [11.3, 75.6, -PI / 2]].forEach(([x, z, r]) => L0.push([x, ground(x, z), z, r, 1]));
  phPlace('isl_payphone', L0); L0.forEach(([x, , z]) => post(x, z, 0.35, -5, 3));
})();
