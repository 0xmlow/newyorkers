/* ================================================================
   v376 THE MAP AND THE BOARD: WEATHER (2026-11-24)
   The pier board's AND ALSO panel line about weather is implied by the island's weather menu; nothing new to place.
   This version adds the steam stack to the map.
   ================================================================ */
(function () { try { if (window.__MAP && MAP.places && MANH.list[1]) { const p = MANH.list[1].position; MAP.places.push(['THE STEAM STACK', p.x, p.z, p.x - 5, p.z + 4]); } } catch (e) { } })();
