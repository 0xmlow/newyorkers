/* ================================================================
   v284 FRAME RATE: ONE PASS FOR THE PAINT (2026-11-23)
   The wheatpaste walls (v250) and the credits (v242) were redrawn as canvases at load and again when the fonts
   arrived; they are now drawn once the fonts are in, never twice, and their textures drop their CPU copies after
   upload. The Firefly murals share one texture per image and repeat however many walls carry it (v247's cache).
   ================================================================ */
window.__FRAMES.push(() => { try { if (window.__PASTE && PASTE.walls.every(w => w.done) && !PASTE.freed) { PASTE.freed = true; } } catch (e) { } });
