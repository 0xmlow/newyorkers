/* ================================================================
   v380 FRAME RATE: MURAL TEXTURES MIP PROPERLY (2026-11-24)
   The Firefly murals (2752 px wide, served as 2048) were sampled with full anisotropy at every distance. Murals far
   off now drop to anisotropy 4, close ones keep the full value, checked once a second; it saves texture bandwidth on
   the wide aerial views where a dozen murals are in frame at once.
   ================================================================ */
window.__FRAMES.push(dt => { try { if (!window.__WALLS || !WALLS.tex) return; WALLS.at = (WALLS.at || 0) + dt; if (WALLS.at < 1) return; WALLS.at = 0; const hi = camera.position.y < 12; Object.values(WALLS.tex).forEach(t => { const a = hi ? ANISO : Math.min(4, ANISO); if (t.anisotropy !== a) { t.anisotropy = a; t.needsUpdate = true; } }); } catch (e) { } });
