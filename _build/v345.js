/* ================================================================
   v345 THE ROOFTOP BILLBOARD'S LAMPS (2026-11-24)
   The billboard's gooseneck lamps (v339) light with the street lamps, like the welcome billboard's (v176).
   ================================================================ */
window.__FRAMES.push(() => { try { if (FACM.bulb) FACM.bulb.emissiveIntensity = Math.max(FACM.bulb.emissiveIntensity, 0.05 + 2.2 * Math.min(1, (L.lamps || 0) * 1.3)); } catch (e) { } });
