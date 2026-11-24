/* ================================================================
   v276 FRAME RATE: QUIET BANNERS (2026-11-23)
   The card banners (v273) and the rink and credit boards redraw their canvases only when they change, and the card
   banners skip the redraw entirely when nobody is within 70 m of a river crossing; their textures stay uploaded.
   ================================================================ */
window.__FRAMES.push(dt => { try { if (!window.__CBAN || !CBAN.list.length) return; const near = Math.hypot(P.x, P.z) < 110; if (!near) CBAN.t = Math.max(CBAN.t, 5); } catch (e) { } });
