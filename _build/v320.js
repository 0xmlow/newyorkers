/* ================================================================
   v320 REAL PROPS: THE MARKET'S WARES (2026-11-24)
   Every market kiosk (v69) gets scanned wares at the ends of its counter: a wicker basket, turned wooden bowls, a
   white ceramic vase, so the stalls look like they sell things you could pick up. ?props=0 off.
   ================================================================ */
(function marketWares() {
  if (!PH.on || !window.__MKT || !MKT.k) return; const B = [], O = [], V = [];
  MKT.k.forEach((k, i) => { const gy = ground(k.x, k.z), y = gy + 1.02, z = k.z - 0.85; B.push([k.x - 1.15, y, z, 0.2 * i, 0.8]); O.push([k.x + 1.1, y, z, 0.5 * i, 0.9], [k.x + 1.32, y, z + 0.08, 1.3 * i, 0.7]); if (i % 2 === 0) V.push([k.x + 0.85, y, z + 0.05, 0, 0.7]); });
  phPlace('isl_basket', B, { shadow: false }); phPlace('isl_bowl', O, { shadow: false }); phPlace('isl_vase', V, { shadow: false });
})();
