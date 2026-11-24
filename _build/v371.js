/* ================================================================
   v371 REALISM: THE RIVER IS WET WHEN IT RAINS (2026-11-24)
   The meme river's painted surface turns glossy in the rain (its roughness drops with the island's wetness), so the
   lamps and signs streak across it the way they do on wet asphalt.
   ================================================================ */
window.__FRAMES.push(() => { try { if (!window.__RIVER || !RIVER.mat || typeof WX === 'undefined') return; RIVER.mat.roughness = 0.35 - 0.3 * Math.min(1, WX.wet); RIVER.mat.metalness = 0.25 * Math.min(1, WX.wet); } catch (e) { } });
