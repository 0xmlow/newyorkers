/* ================================================================
   v393 THE TOUR GOES TO THE BOARDWALK (2026-11-24)
   Five stops, in the highlights and in the full tour (Shift T), before the island at night: walking past N3W CUTS'
   window so the mirrored shop slides, the barber pole close, the magic eye, the zoetrope from above, and the
   floating crosswalk from its footprints and then from the side.
   ================================================================ */
(function tourV393() { const T = (window.__game && __game.TOUR) || TOUR, add = [];
  try { if (window.__CUTS && CUTS.ok) { const g = CUTS.g, e = g + 1.62, w = CUTS.win, a = CUTS.at(w.u - 2.6, CUTS.D / 2 + 3.2), b = CUTS.at(w.u + 2.2, CUTS.D / 2 + 2.6), la = CUTS.at(w.u - 0.6, CUTS.D / 2 - 1), lb = CUTS.at(w.u + 0.6, CUTS.D / 2 - 1);
    add.push({ name: 'the infinite barbershop', dur: 9, pos: [[a[0], e, a[1]], [b[0], e, b[1]]], look: [[la[0], g + 1.6, la[1]], [lb[0], g + 1.6, lb[1]]] });
    const p = CUTS.at(-CUTS.W / 2 + 0.25, CUTS.D / 2 + 2.2), pl = CUTS.at(-CUTS.W / 2 + 0.25, CUTS.D / 2 + 0.52); add.push({ name: 'the barber pole', dur: 5, pos: [[p[0], g + 1.9, p[1]], [p[0], g + 2.0, p[1]]], look: [[pl[0], g + 2.05, pl[1]], [pl[0], g + 2.05, pl[1]]] }); } } catch (e) { }
  try { if (window.__MEYE && MEYE.ok) { const [vx, vy, vz] = MEYE.V, [px, py, pz] = MEYE.P; add.push({ name: 'magic eye', dur: 6, pos: [[vx, vy, vz], [vx * 0.97 + px * 0.03, vy, vz * 0.97 + pz * 0.03]], look: [[px, py + 1.85, pz], [px, py + 1.85, pz]] }); } } catch (e) { }
  try { if (window.__ZOE && ZOE.ok) { const [x, g, z] = ZOE.P, [nx, nz] = CUTS.n; add.push({ name: 'the zoetrope', dur: 6, pos: [[x + nx * 1.1, g + 1.75, z + nz * 1.1], [x + nx * 0.8, g + 1.65, z + nz * 0.8]], look: [[x, g + 1.12, z], [x, g + 1.12, z]] }); } } catch (e) { }
  try { if (window.__XW3 && XW3.ok) { const [x, y, z] = XW3.V, gr = XW3.P[1]; add.push({ name: 'the floating crosswalk', dur: 10, pos: [[x, y, z], [x, y, z - 0.2], [x - 7, gr + 2.2, z - 3]], look: [[0, gr + 0.2, -99.5], [0, gr + 0.2, -99.6], [0, gr, -100]] }); } } catch (e) { }
  const ins = (L, before) => { let at = L.findIndex(r => r.name === before); if (at < 0) at = L.findIndex(r => r.name === 'aerial'); L.splice(at < 0 ? L.length : at, 0, ...add); };
  ins(T, 'tied together'); if (window.__TOURFULL && __TOURFULL !== T) ins(__TOURFULL, 'aerial');
})();
