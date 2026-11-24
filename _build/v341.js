/* ================================================================
   v341 THE PAINTED EYE AT NIGHT (2026-11-24)
   The anamorphic eye (v253) is painted with an unlit material, so after dark its rings glowed on the bodega block like
   neon. Paint does not glow: it now darkens with the daylight, the way the real walls round it do.
   ================================================================ */
window.__FRAMES.push(() => { try { if (window.__ANA && ANA.U && ANA.U.uDim) ANA.U.uDim.value = Math.min(1, (L.lamps || 0) * 1.2); } catch (e) { } });
