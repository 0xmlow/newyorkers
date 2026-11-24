/* ================================================================
   v294 THE LOOK: MORE REAL MATERIAL (2026-11-24)
   The triplanar detail of v287 reaches the rest of the kit: the condensers and rooftop units take brushed metal, the
   tar roofs and rubber mats take asphalt, the market's stall frames and the island's stone plinths take limestone.
   ================================================================ */
(function moreKit() {
  if (!window.kitTex || /kittex=0/.test(location.search)) return;
  [['ac', 'metal', 0.8, 0.35, 0.6], ['tar', 'asph', 0.5, 0.5, 0.5], ['mat', 'asph', 0.6, 0.45, 0.4], ['frameK', 'metal', 0.6, 0.25, 0.5], ['boni', 'metal', 0.6, 0.2, 0.4]].forEach(([k, n, s, a, r]) => { if (FACM[k] && !FACM[k].transparent) kitTex(FACM[k], n, s, a, r); });
  ['graphite', 'ink', 'red', 'orange', 'blue'].forEach(k => { const m = MAT[k]; if (m && !m.map && !m.transparent) kitTex(m, 'metal', 0.4, 0.25, 0.4); });
})();
