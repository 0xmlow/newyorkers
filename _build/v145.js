/* ================================================================
   v145 THE TOUR MEETS THE NEIGHBOURS (2026-11-23)
   Six more stops before the aerial: the pond, the carousel, the laundromat, the bell tower, double dutch and
   the kayaks.
   ================================================================ */
(function tourV145() {
  const add = [];
  try { const x = POND.x, z = POND.z, y = POND.y; add.push({ name: 'the pond', dur: 8, pos: [[x + 9, y + 1.6, z + 6], [x + 6, y + 1.2, z + 2]], look: [[x, y, z], [x - 1, y, z - 1]] }); } catch (e) { }
  try { const x = CAROU.X, z = CAROU.Z, y = CAROU.g0; add.push({ name: 'the carousel', dur: 8, pos: [[x + 9, y + 2.2, z - 5], [x + 7, y + 1.8, z + 5]], look: [[x, y + 1.6, z], [x, y + 1.5, z]] }); } catch (e) { }
  try { const x = LAUND.fx, z = LAUND.z0, y = LAUND.g0; add.push({ name: 'the laundromat', dur: 7, pos: [[x + 8, y + 1.7, z + 4], [x + 4, y + 1.6, z + 1]], look: [[x - 2, y + 1.2, z], [x - 2.4, y + 1.1, z]] }); } catch (e) { }
  try { const x = BELLS.X, z = BELLS.Z, y = BELLS.g0; add.push({ name: 'the bell tower', dur: 7, pos: [[x - 14, y + 2, z - 8], [x - 10, y + 6, z - 4]], look: [[x, y + 9, z], [x, y + 11, z]] }); } catch (e) { }
  try { const x = DD.X, z = DD.Z, y = DD.g0; add.push({ name: 'double dutch', dur: 7, pos: [[x + 1, y + 1.5, z + 6], [x - 1, y + 1.3, z + 4]], look: [[x, y + 1, z], [x, y + 1, z]] }); } catch (e) { }
  try { add.push({ name: 'the kayaks', dur: 8, pos: [[2.2, 1.8, 160], [2.2, 2.2, 172]], look: [[30, 0.5, 160], [40, 0.5, 168]] }); } catch (e) { }
  const at = TOUR.findIndex(r => r.name === 'aerial'); TOUR.splice(at < 0 ? TOUR.length : at, 0, ...add);
})();
