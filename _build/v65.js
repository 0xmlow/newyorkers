/* ================================================================
   v65 THE TOUR TAKES THE BIKE LANE (2026-11-22)
   Five more tour stops before the aerial: the steam stacks, the skate spot (a tre flip for the camera), the grate
   (a train arrives on cue), the hole (seen from the footprints, then from the side, so the trick shows itself) and
   the bubble man.
   ================================================================ */
(function tourV65() {
  const add = [];
  try { const x = STEAM_AT.x, z = STEAM_AT.z, gy = ground(x, z); add.push({ name: 'the steam', dur: 7, pos: [[x + 9, gy + 1.7, z + 7], [x + 5, gy + 1.6, z + 4.5]], look: [[x, gy + 3.2, z], [x, gy + 3.6, z]] }); } catch (e) { }
  try { const [ax, az] = SK.L2W(0, 0), gy = SK.g0; add.push({ name: 'the skate spot', dur: 8, pos: [[ax + SK.bx * 9 - SK.ax * 4, gy + 1.4, az + SK.bz * 9 - SK.az * 4], [ax + SK.bx * 6 + SK.ax * 2, gy + 1.1, az + SK.bz * 6 + SK.az * 2]], look: [[ax, gy + 0.6, az], [ax, gy + 0.5, az]], pre: () => { try { SK.s[1].forced = 'tre'; SK.s[1].t = SK.s[1].dur - 0.2; } catch (e) { } } }); } catch (e) { }
  try { const x = GR_AT.x, z = GR_AT.z, gy = GR.g0; const ox = Math.sin(GR.ry - PI / 2), oz = Math.cos(GR.ry - PI / 2); add.push({ name: 'the grate', dur: 7, pos: [[x + ox * 6, gy + 1.8, z + oz * 6], [x + ox * 3.5, gy + 1.6, z + oz * 3.5]], look: [[x, gy, z], [x, gy + 0.6, z]], pre: () => { try { GR.next = GR.t + 0.8; } catch (e) { } } }); } catch (e) { }
  try { const V = HOLE.V, e = HOLE.eye, c = HOLE.at(0, 0, 0), sx = HOLE.at(6, 0, 0); add.push({ name: 'the hole', dur: 9, pos: [[e.x, e.y, e.z], [e.x, e.y, e.z], [sx.x, e.y + 0.4, sx.z]], look: [[c.x, c.y - 2, c.z], [c.x, c.y - 2, c.z], [c.x, c.y, c.z]] }); } catch (e) { }
  try { const x = BUB_AT.x, z = BUB_AT.z, gy = BUB.g0, ry = BUB.ry; add.push({ name: 'the bubble man', dur: 8, pos: [[x + Math.sin(ry) * 9 + Math.cos(ry) * 4, gy + 1.7, z + Math.cos(ry) * 9 - Math.sin(ry) * 4], [x + Math.sin(ry) * 6, gy + 1.6, z + Math.cos(ry) * 6]], look: [[x, gy + 2, z], [x, gy + 2.4, z]], pre: () => { try { BUB.rush = 20; BUB.next = 0; } catch (e) { } } }); } catch (e) { }
  const at = TOUR.findIndex(r => r.name === 'aerial'); TOUR.splice(at < 0 ? TOUR.length : at, 0, ...add);
})();
