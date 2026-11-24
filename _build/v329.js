/* ================================================================
   v329 CARD BACKS AFTER DARK (2026-11-24)
   The designed card backs (v267) carry a faint glow at night, enough that the freeway's 71 billboards still read from
   the beach as a ring of eye flowers after sunset.
   ================================================================ */
window.__FRAMES.push(() => { try { if (!window.__BACKS || !BACKS.mat) return; const m = BACKS.mat; if (!m.emissiveMap) { m.emissiveMap = m.map; m.emissive = new THREE.Color(0xffffff); m.needsUpdate = true; } m.emissiveIntensity = 0.28 * Math.min(1, (L.lamps || 0) * 1.3); } catch (e) { } });
