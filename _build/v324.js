/* ================================================================
   v324 THE FRUIT STAND AT NIGHT (2026-11-24)
   A scanned caged work light hangs under the bodega's awning over the fruit stand, and after dusk it is a real cool
   light on the fruit (one more practical, inside v177's nearest eight budget). ?props=0 off.
   ================================================================ */
(function standLight() { if (!PH.on) return; const g = ground(17, 66) + 0.02; phPlace('isl_caged', [[10.7, g + 2.6, 70.55, PI / 2, 0.6]], { shadow: false }); practical(10.7, g + 2.2, 70.55, 0xf0f6ff, 5, 6); })();
