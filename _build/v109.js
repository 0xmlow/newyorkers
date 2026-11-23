/* ================================================================
   v109 REAL CARS (2026-11-23)
   The N3W cab (TAXI) is now Quaternius' CC0 taxi with its wheels turning, still wearing the N3W YORKERS topper;
   the two parked cars of v81 (the car alarm) are now the CC0 car and taxi; and the ring road finally has traffic:
   six cars, three each way, in four paint jobs, keeping their distance, slowing behind the bus and the cab, and
   stopping for the crosswalk when it says walk.
   ================================================================ */
const TRAF = { c: [] };
window.__TRAF = TRAF;
(function realCars() {
  try { CC0.dress(CAB.g, 'taxi', { len: 4.7, keep: o => o.position.y > 1.85 }); } catch (e) { }
  try { CARS.c.forEach((c, i) => CC0.dress(c.g, i ? 'taxi' : 'car_b', { len: c.L, yaw: PI / 2, tint: i ? undefined : 0x2a3a4a })); } catch (e) { }
  const paints = [0xffffff, 0x8a2b1e, 0x2f4a33, 0x1b1d22, 0xd9d4c8, 0x2962FF];
  for (let i = 0; i < 6; i++) { const inner = i < 3, kind = i === 2 || i === 5 ? 'taxi' : 'car_b'; const h = CC0.make(kind, { len: 4.4, tint: kind === 'taxi' ? undefined : paints[i] });
    TRAF.c.push({ h, inner, b: (i % 3) * (PI * 2 / 3) + (inner ? 0.4 : 1.4), dir: inner ? 1 : -1, sp: 0, max: 8 + Math.random() * 3, R: inner ? 98.3 : 101.7 }); }
})();
const angAhead = (from, to, dir) => { let d = (to - from) * dir; d = ((d % (2 * PI)) + 2 * PI) % (2 * PI); return d; };
function trafFrame(dt) {
  const others = { 1: [], '-1': [] };   // b angles of every vehicle in each lane
  try { others[1].push(Math.atan2(BUS.g.position.x, BUS.g.position.z)); } catch (e) { }
  try { others[-1].push(Math.atan2(CAB.g.position.x, CAB.g.position.z)); } catch (e) { }
  TRAF.c.forEach(c => others[c.dir].push(c.b));
  TRAF.c.forEach(c => { let gap = 99; others[c.dir].forEach(b => { if (b === c.b) return; const a = angAhead(c.b, b, c.dir) * c.R; if (a > 0.1 && a < gap) gap = a; });
    const cross = angAhead(c.b, 0, c.dir) * c.R; let want = c.max; if (gap < 18) want = Math.min(want, (gap - 7) * 0.8); if (window.__XWALK_PED && cross > 4 && cross < 14) want = Math.min(want, (cross - 5) * 0.8);
    want = Math.max(0, want); c.sp += (want - c.sp) * Math.min(1, dt * (want < c.sp ? 3 : 1.2)); c.b += c.dir * c.sp / c.R * dt;
    const x = Math.sin(c.b) * c.R, z = Math.cos(c.b) * c.R; c.h.root.position.set(x, ground(x, z) + 0.02, z); const tx = Math.cos(c.b) * c.dir, tz = -Math.sin(c.b) * c.dir; c.h.root.rotation.y = Math.atan2(tx, tz); });
}
window.__FRAMES.push(dt => { try { trafFrame(dt); } catch (e) { if (!TRAF.err) { TRAF.err = e; console.warn('v109 cars', e); } } });
