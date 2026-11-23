/* ================================================================
   v105 THE TOUR CLIMBS THE FIRE ESCAPE (2026-11-22)
   Six more stops before the aerial: the brownstone and its stoop, the threshold (walked through), the newsstand,
   the dominoes, the pier with the fishermen and the gulls, and the outline.
   ================================================================ */
(function tourV105() {
  const add = [];
  try { const x = BROWN.fx, z = BROWN_AT.z, gy = BROWN.g0; add.push({ name: 'the walk up', dur: 8, pos: [[x - 14, gy + 2, z - 8], [x - 7, gy + 5, z + 1]], look: [[x, gy + 4, z], [x, gy + 7, z]] }); } catch (e) { }
  try { const x = THR_AT.x, z = THR_AT.z, gy = THR.g0; add.push({ name: 'the threshold', dur: 8, pos: [[x, gy + 1.7, z + 12], [x, gy + 1.7, z - 4]], look: [[x, gy + 2.6, z], [x, gy + 2, z - 20]] }); } catch (e) { }
  try { const x = NEWS_AT.x, z = NEWS_AT.z, gy = ground(x, z), ry = NEWS.ry; add.push({ name: 'the newsstand', dur: 6, pos: [[x + Math.sin(ry) * 7 + Math.cos(ry) * 3, gy + 1.7, z + Math.cos(ry) * 7 - Math.sin(ry) * 3], [x + Math.sin(ry) * 4, gy + 1.6, z + Math.cos(ry) * 4]], look: [[x, gy + 1.4, z], [x, gy + 1.4, z]] }); } catch (e) { }
  try { const x = DOM_AT.x, z = DOM_AT.z, gy = DOM.g0; add.push({ name: 'dominoes', dur: 6, pos: [[x + 4, gy + 1.8, z - 3], [x + 2, gy + 1.5, z - 1.8]], look: [[x, gy + 0.8, z], [x, gy + 0.8, z]] }); } catch (e) { }
  try { add.push({ name: 'gone fishing', dur: 7, pos: [[6, 3, 168], [3, 2.2, 176]], look: [[-1, 1, 182], [0, 0.6, 186]] }); } catch (e) { }
  try { const x = GHOST_AT.x, z = GHOST_AT.z, gy = GHOST.g0; add.push({ name: 'the outline', dur: 7, pos: [[x + 4, gy + 2, z + 16], [x - 1, gy + 3, z + 10]], look: [[x, gy + 6, z], [x, gy + 8, z]] }); } catch (e) { }
  const at = TOUR.findIndex(r => r.name === 'aerial'); TOUR.splice(at < 0 ? TOUR.length : at, 0, ...add);
})();
