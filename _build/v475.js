/* ================================================================
   v475 THE HIGHLIGHTS TOUR ENDS ON THE DRONES (2026-11-24)
   The highlights tour already ends in the dark (v382: the island tonight, then the credits). Between the two it now
   stands on the south beach and sends the drone show up, so the four minute tour closes on the eye, 6529 and the
   card of the hour over the harbour. Stops added this round are trimmed to keep it near four and a half minutes.
   ================================================================ */
(function tourFinale() {
  const T = (window.__game && __game.TOUR) || TOUR; if (!window.__DRONES || !DRONES.go || /fulltour/.test(location.search)) return;
  const stop = { name: 'the drone show', dur: 24, pos: [[22, 2.4, 126], [16, 2.2, 129]], look: [[10, 70, 236], [10, 76, 236]], pre: () => { try { DRONES.go('THE TOUR SENDS THE DRONES UP. LOOK SOUTH.'); } catch (e) { } } };
  if (T.some(q => q.name === stop.name)) return; const k = T.findIndex(q => q.name === 'the credits again'); T.splice(k >= 0 ? k : T.length, 0, stop);
  const ours = ['the illusion beach', 'the n3w boardwalk', 'the infinite barbershop', 'the memes walk', 'the boardwalk at night'], tot = T.reduce((s, r) => s + (r.dur || 8), 0), cap = 285;
  if (tot > cap) { const mine = T.filter(r => ours.includes(r.name)), m = mine.reduce((s, r) => s + r.dur, 0), f = Math.max(0.6, 1 - (tot - cap) / Math.max(1, m)); mine.forEach(r => r.dur = Math.round(r.dur * f * 10) / 10); }
  window.__TOURLEN = T.reduce((s, r) => s + (r.dur || 8), 0);
})();
