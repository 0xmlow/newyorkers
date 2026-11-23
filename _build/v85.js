/* ================================================================
   v85 THE TOUR GOES UP ON THE ROOF (2026-11-22)
   Six more tour stops before the aerial: the water tower, the shed, the rink, the market, Showtime (it starts for
   the camera) and the impermanent wall.
   ================================================================ */
(function tourV85() {
  const add = [];
  try { const x = WT_AT.x, z = WT_AT.z, gy = ground(x, z); add.push({ name: 'the water tower', dur: 7, pos: [[x + 14, gy + 3, z + 14], [x + 9, gy + 9, z + 10]], look: [[x, gy + 8, z], [x, gy + 10, z]] }); } catch (e) { }
  try { const x = SHED_AT.x, z = SHED_AT.z, gy = ground(x, z); add.push({ name: 'the sidewalk shed', dur: 7, pos: [[x + 10, gy + 1.7, z + 0.2], [x - 6, gy + 1.7, z + 0.2]], look: [[x, gy + 1.6, z - 1.5], [x - 10, gy + 1.6, z - 1]] }); } catch (e) { }
  try { const x = RINK_AT.x, z = RINK_AT.z, gy = ground(x, z); add.push({ name: 'the rink', dur: 7, pos: [[x + 10, gy + 3, z - 6], [x + 7, gy + 2.2, z + 6]], look: [[x, gy, z], [x, gy, z]] }); } catch (e) { }
  try { const x = MKT_AT.x, z = MKT_AT.z, gy = ground(x, z); add.push({ name: 'the market', dur: 7, pos: [[x - 12, gy + 2, z - 7], [x + 8, gy + 1.8, z - 6]], look: [[x - 4, gy + 1.5, z], [x + 4, gy + 1.5, z]] }); } catch (e) { }
  try { const x = SHOW_AT.x, z = SHOW_AT.z, gy = SHOW.g0, ry = SHOW.ry; add.push({ name: 'showtime', dur: 8, pos: [[x + Math.sin(ry + 0.6) * 7, gy + 1.7, z + Math.cos(ry + 0.6) * 7], [x + Math.sin(ry - 0.6) * 6, gy + 1.5, z + Math.cos(ry - 0.6) * 6]], look: [[x, gy + 1.3, z], [x, gy + 1.3, z]], pre: () => { try { showStart(true); } catch (e) { } } }); } catch (e) { }
  try { const x = IWALL_AT.x, z = IWALL_AT.z, gy = ground(x, z), ry = IWALL.ry; add.push({ name: 'the impermanent wall', dur: 7, pos: [[x + Math.sin(ry) * 12 + Math.cos(ry) * 5, gy + 2, z + Math.cos(ry) * 12 - Math.sin(ry) * 5], [x + Math.sin(ry) * 8, gy + 2, z + Math.cos(ry) * 8]], look: [[x, gy + 2.2, z], [x, gy + 2.2, z]] }); } catch (e) { }
  const at = TOUR.findIndex(r => r.name === 'aerial'); TOUR.splice(at < 0 ? TOUR.length : at, 0, ...add);
})();
