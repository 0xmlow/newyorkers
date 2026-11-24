/* ================================================================
   v461 THE FULL TOUR WATCHES THE DRONES (2026-11-24)
   After the boardwalk at night, the full tour (Shift T) stands on the south beach and sends the drones up, then
   watches the eye, N3W YORKERS, 6529 and the card of the hour come together over the harbour. The highlights
   tour keeps its four minutes.
   ================================================================ */
(function tourDrones() {
  try { if (window.__DRONES && typeof droneGo === "function") DRONES.go = droneGo; } catch (e) { }
  if (!window.__DRONES || !window.__TOURFULL || typeof droneGo !== 'function') return;
  const stop = { name: 'the drone show', dur: 36, pos: [[22, 2.4, 126], [16, 2.2, 129]], look: [[10, 70, 236], [10, 76, 236]], pre: () => { try { droneGo('THE TOUR SENDS THE DRONES UP. LOOK SOUTH.'); } catch (e) { } } };
  if (__TOURFULL.some(q => q.name === stop.name)) return; const k = __TOURFULL.findIndex(q => q.name === 'the boardwalk at night'); __TOURFULL.splice(k >= 0 ? k + 1 : __TOURFULL.length - 1, 0, stop);
})();
