/* ================================================================
   v196 THE TOUR MEETS THE STREET (2026-11-23)
   Four more stops before the aerial: the pier's boards and bollards, the N3W BIKE dock, the bodega's awning and
   the flags over the bank.
   ================================================================ */
(function tourV196() {
  const add = [];
  add.push({ name: 'the pier', dur: 7, pos: [[1.5, 1.7, 138], [1.2, 1.6, 146]], look: [[2.8, 0.6, 152], [2.8, 0.6, 160]] });
  try { const { x, z } = BIKES.at, g = ground(x, z); add.push({ name: 'n3w bike', dur: 7, pos: [[x - 2, g + 1.7, z - 6], [x, g + 1.6, z - 4]], look: [[x, g + 0.8, z], [x + 1, g + 0.8, z]] }); } catch (e) { }
  try { const g = ground(17, 66); add.push({ name: 'the bodega', dur: 7, pos: [[4, g + 1.7, 58], [6, g + 1.7, 62]], look: [[11, g + 3, 66], [11, g + 3, 66]] }); } catch (e) { }
  try { const g = ground(-66, 0); add.push({ name: 'the flags', dur: 7, pos: [[-38, g + 1.7, -14], [-42, g + 1.7, -12]], look: [[-50.6, g + 11, -10.6], [-50.6, g + 11.5, -10.6]] }); } catch (e) { }
  const at = TOUR.findIndex(r => r.name === 'aerial'); TOUR.splice(at < 0 ? TOUR.length : at, 0, ...add);
})();
