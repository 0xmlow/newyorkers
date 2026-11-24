/* ================================================================
   v278 REAL PROPS: MARKET STOCK (2026-11-23)
   Behind each market kiosk (v69), a stack of scanned wooden crates with a 6529 card pasted on the end, where the
   stall keeps its stock. ?props=0 off.
   ================================================================ */
(function marketStock() {
  if (!PH.on || !window.__MKT || !MKT.k) return; const L0 = [];
  MKT.k.forEach((k, i) => { const g = ground(k.x, k.z), x = k.x + 1.9, z = k.z + 0.8; L0.push([x, g, z, 0.1 * i, 1], [x + 0.05, g + 0.35, z + 0.02, -0.1, 1]); if (i % 2) L0.push([x, g, z - 0.5, 0.3, 1]); });
  phPlace('isl_crate', L0);
})();
