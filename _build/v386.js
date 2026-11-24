/* ================================================================
   v386 THE CREDITS COUNT AGAIN (2026-11-24)
   The credits wall (v242) is redrawn once more after the island's fonts arrive and the atlas loads, so its names are
   always set in the island's own type, never the fallback.
   ================================================================ */
(function credFonts() { if (!window.__CRED || !CRED.tex) return; addEventListener('n3wfonts', () => { try { CRED.tex.needsUpdate = true; } catch (e) { } }); })();
