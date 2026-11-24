/* ================================================================
   v353 SPECTATORS AT THE CHESS TABLES (2026-11-24)
   Every Washington Square chess table has a ring of people watching on whatever they can sit on: blue milk crates
   (scanned, CC0) round the island's three tables. ?props=0 off.
   ================================================================ */
(function chessCrates() { if (!PH.on || !window.__CHESS) return; const L0 = []; CHESS.tables.forEach((T, i) => { [[1.1, 0.4], [-1.1, 0.6], [0.9, -1.1]].forEach(([dx, dz], j) => { if ((i + j) % 3 === 2) return; L0.push([T.x + dx, ground(T.x + dx, T.z + dz), T.z + dz, Math.random() * 6, 1]); }); }); phPlace('isl_milk', L0); })();
