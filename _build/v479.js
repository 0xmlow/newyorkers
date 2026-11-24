/* ================================================================
   v479 BENCHES FOR STARING (2026-11-24)
   Most of the east beach illusions need you to look for a while (the cube flips after a minute, the wheel takes
   twenty seconds to reverse, the head turns slowly). Three of the scanned park benches (CC0) now face them from
   the island side of the duckboards: one at the cube, one at the wheel, one at the hollow face.
   ================================================================ */
(function eastBenches() {
  if (!window.__EASTB || !window.__PH || !PH.on || /eastbeach=0/.test(location.search)) return;
  const B = [37.5, 89, 131.5].map(d => { const P = eastAt(d, 108.6); return [P.x, P.g + 0.02, P.z, P.ry + PI, 1.0]; }); phPlace('isl_seating', B);
  B.forEach(b => CIRCS.push({ x: b[0], z: b[2], r: 0.8, y0: -5, y1: 1.2, on: true }));
})();
