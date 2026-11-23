/* ================================================================
   v165 THE TOUR MEETS THE BEACH (2026-11-23)
   Five more stops before the aerial: the sandpipers, the telescope, the shoe shine, the clotheslines and the poet.
   ================================================================ */
(function tourV165() {
  const add = [];
  try { const x = PIPERS.cx, z = shoreZ(x); add.push({ name: 'the sandpipers', dur: 7, pos: [[x - 6, 1.0, z - 5], [x - 3, 0.8, z - 3]], look: [[x, 0.1, z - 0.8], [x + 1, 0.1, z - 0.8]] }); } catch (e) { }
  try { const x = SCOPE.X, z = SCOPE.Z, y = SCOPE.g0; add.push({ name: 'the telescope', dur: 7, pos: [[x - 4, y + 1.6, z - 3], [x - 2.5, y + 1.6, z - 1.5]], look: [[x, y + 1.3, z], [x, y + 1.4, z]] }); } catch (e) { }
  try { const x = SHINE.X, z = SHINE.Z, y = SHINE.g0; add.push({ name: 'the shoe shine', dur: 7, pos: [[x + 3, y + 1.7, z + 4], [x + 1.5, y + 1.5, z + 3]], look: [[x, y + 1, z], [x, y + 1, z]] }); } catch (e) { }
  try { const y = WASH.g0; add.push({ name: 'wash day', dur: 7, pos: [[-50, y + 2, -48], [-49, y + 2.4, -52]], look: [[-56, y + 6, -56], [-57, y + 6.5, -56]] }); } catch (e) { }
  try { const x = POET.X, z = POET.Z, r = POET.ry; add.push({ name: 'the poet', dur: 7, pos: [[x + Math.sin(r) * 3 + Math.cos(r) * 1.5, 1.7, z + Math.cos(r) * 3 - Math.sin(r) * 1.5], [x + Math.sin(r) * 2.2, 1.6, z + Math.cos(r) * 2.2]], look: [[x, 1.1, z], [x, 1.1, z]] }); } catch (e) { }
  const at = TOUR.findIndex(r => r.name === 'aerial'); TOUR.splice(at < 0 ? TOUR.length : at, 0, ...add);
})();
