/* ================================================================
   v411 THE ROOMS AT NIGHT: SOMEONE HOME (2026-11-24)
   The rooms behind the windows (v408) get their people. In about a quarter of them someone is standing at the back
   of the room, a dark figure against the lamplight you only see once their window is lit; and the rooms lit blue
   flicker with a television. Nothing more, the way you see your neighbours across the street. The shader code is
   in v408; this keeps its clock.
   ================================================================ */
window.__FRAMES.push(dt => { try { if (window.__ROOMS && ROOMS.t) ROOMS.t.value += dt; } catch (e) { } });
