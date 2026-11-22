/* ================================================================
   v55 THE TOUR GOES ROUND THE NEW CORNERS (2026-11-22)
   Five more tour stops before the aerial: the handball wall, the monte box, the open hydrant (it opens for the
   camera), the Watchers (who shut as the camera arrives, of course) and the south channel with the container ship.
   ================================================================ */
(function moreTour() {
  const add = [];
  try { const ry = WALLP.ry, wx = WALL_AT.x, wz = WALL_AT.z, gy = ground(wx, wz); add.push({ name: 'the handball wall', dur: 7, pos: [[wx + Math.sin(ry) * 11 + Math.cos(ry) * 5, gy + 2.4, wz + Math.cos(ry) * 11 - Math.sin(ry) * 5], [wx + Math.sin(ry) * 6, gy + 1.9, wz + Math.cos(ry) * 6]], look: [[wx, gy + 2, wz], [wx, gy + 2, wz]] }); } catch (e) { }
  try { const ry = MONTE.ry, mx = MONTE_AT.x, mz = MONTE_AT.z, gy = ground(mx, mz); add.push({ name: 'find the eye', dur: 6, pos: [[mx + Math.sin(ry) * 4 + Math.cos(ry) * 2, gy + 1.8, mz + Math.cos(ry) * 4 - Math.sin(ry) * 2], [mx + Math.sin(ry) * 1.3, gy + 1.5, mz + Math.cos(ry) * 1.3]], look: [[mx, gy + 0.8, mz], [mx, gy + 0.6, mz]], pre: () => { try { if (MONTE.phase === 'idle' && !MONTE.gone) { MONTE.phase = 'show'; MONTE.t = 0; MONTE.applied = 0; MONTE.pos = [0, 1, 2]; MONTE.swaps = [[0, 1], [1, 2], [0, 2], [1, 0], [2, 1]]; MONTE.sw = 0.5; } } catch (e) { } } }); } catch (e) { }
  try { const ry = HYD.ry, hx = HYD_AT.x, hz = HYD_AT.z, gy = ground(hx, hz); const sx = hx + Math.sin(ry) * 2.5, sz = hz + Math.cos(ry) * 2.5; add.push({ name: 'the open hydrant', dur: 7, pos: [[sx + Math.cos(ry) * 8, gy + 1.6, sz - Math.sin(ry) * 8], [sx + Math.cos(ry) * 5 + Math.sin(ry) * 2, gy + 1.4, sz - Math.sin(ry) * 5 + Math.cos(ry) * 2]], look: [[sx, gy + 0.8, sz], [sx, gy + 0.6, sz]], pre: () => { try { if (HYD.on <= 0) { HYD.on = 30; HYD.pts.visible = true; } } catch (e) { } } }); } catch (e) { }
  try { const x0 = WATCH_AT.x, z0 = WATCH_AT.z, gy = ground(x0, z0), ry = Math.atan2(-x0, -z0); add.push({ name: 'the watchers', dur: 8, pos: [[x0 + Math.sin(ry + 0.9) * 12, gy + 2.6, z0 + Math.cos(ry + 0.9) * 12], [x0 + Math.sin(ry) * 7, gy + 2.2, z0 + Math.cos(ry) * 7]], look: [[x0, gy + 2, z0], [x0, gy + 1.8, z0]] }); } catch (e) { }
  try { const s = SHIPS.list[0]; add.push({ name: 'the south channel', dur: 8, pos: [[-30, 6, 176], [30, 9, 186]], look: [[0, 6, 320], [40, 8, 320]], pre: () => { try { s.t = s.dur * 0.47; } catch (e) { } } }); } catch (e) { }
  const at = TOUR.findIndex(r => r.name === 'aerial'); TOUR.splice(at < 0 ? TOUR.length : at, 0, ...add);
})();
