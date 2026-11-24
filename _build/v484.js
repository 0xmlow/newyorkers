/* ================================================================
   v484 THE FOOTPRINTS TELL YOU WHAT TO DO (2026-11-24)
   Step onto any of the gold footprints on the illusion beach and a toast says what to look for: the chair is one
   chair, now step aside; the triangle is there, now look for its edges. Once per visit to each.
   ================================================================ */
const FEET = { said: {} };
window.__FEET = FEET;
(function feetHints() {
  if (!window.__EASTB) return; const s = (deg, r, msg) => { const P = eastAt(deg, r); return { x: P.x, z: P.z, msg }; };
  FEET.list = [s(55, 112, 'ONE CHAIR. NOW TAKE ONE STEP TO THE SIDE.'), s(70, 111.5, 'A WHITE TRIANGLE. LOOK FOR ITS EDGES. THEN STEP OFF THE FEET.')];
})();
window.__FRAMES.push(() => { try { if (!FEET.list || !state.started) return; FEET.list.forEach((f, i) => { const d = Math.hypot(P.x - f.x, P.z - f.z); if (d < 0.6 && !FEET.said[i]) { FEET.said[i] = true; toast(f.msg, 'blue'); } if (d > 4) FEET.said[i] = false; }); } catch (e) { } });
