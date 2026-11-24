/* ================================================================
   v385 FRAME RATE: THE LAST CHECK (2026-11-24)
   The run of versions since v237 left a few per-frame listeners that only matter near one place (balloons, steam,
   fans, the Ames window). Each one now returns at once when the camera is far, measured against the camera, not the
   player, so tour rails and the map behave the same.
   ================================================================ */
window.__V385 = true;
