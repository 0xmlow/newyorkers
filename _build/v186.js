/* ================================================================
   v186 THE TOUR MEETS THE BUILDINGS (2026-11-23)
   Four more stops before the aerial for the rebuilt city: the walk up's fire escape, the sidewalk shed at the
   Open Wall, the bank's portico and its Open Eye, and the lamp posts and street signs on the ring road.
   ================================================================ */
(function tourV186() {
  const add = [];
  try { const x = BROWN_AT.x, z = BROWN_AT.z, y = BROWN.g0; add.push({ name: 'the fire escape', dur: 7, pos: [[x + 12, y + 1.7, z - 6], [x + 9, y + 2.2, z - 3]], look: [[x + 3.6, y + 7, z - 1], [x + 3.6, y + 8, z - 1]] }); } catch (e) { }
  try { const g = ground(-51, -34); add.push({ name: 'the sidewalk shed', dur: 7, pos: [[-42, g + 1.7, -24], [-46, g + 1.7, -27]], look: [[-52, g + 3.2, -33], [-53, g + 3.4, -33]] }); } catch (e) { }
  try { const g = ground(-66, 0); add.push({ name: 'the bank', dur: 8, pos: [[-36, g + 1.7, 8], [-42, g + 1.9, 3]], look: [[-54, g + 8, 0], [-54, g + 12, 0]] }); } catch (e) { }
  try { const [x, z] = P2(16, 94.5), g = ground(x, z); add.push({ name: 'the ring road', dur: 7, pos: [[x + 3, g + 1.6, z + 4], [x + 2, g + 1.7, z + 2.5]], look: [[x, g + 3.3, z], [x, g + 3.5, z]] }); } catch (e) { }
  const at = TOUR.findIndex(r => r.name === 'aerial'); TOUR.splice(at < 0 ? TOUR.length : at, 0, ...add);
})();
