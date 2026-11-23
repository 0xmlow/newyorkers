/* ================================================================
   v125 THE TOUR MEETS THE ANIMALS (2026-11-23)
   Six more stops before the aerial: the traffic on the ring road, the carriage horse, the dog run, the holiday
   windows, the Christmas tree sellers and the ferry.
   ================================================================ */
(function tourV125() {
  const add = [];
  try { add.push({ name: 'the ring road', dur: 7, pos: [[-14, 2.2, 90], [14, 2.6, 92]], look: [[-30, 1, 99], [30, 1, 99]] }); } catch (e) { }
  try { add.push({ name: 'the carriage', dur: 8, pos: [[8, 2.6, 36], [-6, 2.2, 36]], look: [[0, 1.4, 42.6], [-4, 1.4, 42.6]], pre: () => { try { HORSE.a = 0.35; HORSE.wait = 0; } catch (e) { } } }); } catch (e) { }
  try { const x = DRUN_AT.x, z = DRUN_AT.z, gy = DRUN.g0; add.push({ name: 'the dog run', dur: 7, pos: [[x + 9, gy + 2.4, z - 4], [x + 7, gy + 2, z + 4]], look: [[x, gy + 0.4, z], [x, gy + 0.4, z]], pre: () => { try { drunThrow(false); } catch (e) { } } }); } catch (e) { }
  try { const x = BROWN.fx, z = BROWN_AT.z + 1.2, gy = BROWN.g0; add.push({ name: 'the holiday windows', dur: 7, pos: [[x - 6, gy + 1.7, z - 2], [x - 3, gy + 1.5, z + 0.5]], look: [[x, gy + 1.5, z], [x, gy + 1.4, z]] }); } catch (e) { }
  try { const x = XMAS.x, z = XMAS.z, b = 0.8; add.push({ name: 'the christmas trees', dur: 7, pos: [[x - Math.sin(b) * 10 - Math.cos(b) * 6, ground(x, z) + 2, z - Math.cos(b) * 10 + Math.sin(b) * 6], [x - Math.sin(b) * 6, ground(x, z) + 1.7, z - Math.cos(b) * 6]], look: [[x, ground(x, z) + 1.4, z], [x, ground(x, z) + 1.3, z]] }); } catch (e) { }
  try { add.push({ name: 'the ferry', dur: 8, pos: [[-20, 6, 176], [20, 8, 178]], look: [[0, 8, 255], [30, 9, 255]], pre: () => { try { FERRY.t = FERRY.dur * 0.47; } catch (e) { } } }); } catch (e) { }
  const at = TOUR.findIndex(r => r.name === 'aerial'); TOUR.splice(at < 0 ? TOUR.length : at, 0, ...add);
})();
