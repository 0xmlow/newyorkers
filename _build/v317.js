/* ================================================================
   v317 REAL PROPS: THE BODEGA'S FRUIT STAND (2026-11-24)
   Every bodega puts its fruit out on the sidewalk under the awning. Three scanned wooden crates tilted toward the
   street, heaped with scanned apples, limes, lemons, onions and pomegranates (each fruit a CC0 scan, instanced, so a
   few hundred cost a handful of draws), a bunch of bananas across the top. ?props=0 off.
   ================================================================ */
(function fruitStand() {
  if (!PH.on) return; const g = ground(17, 66) + 0.02, x = 10.95, rows = [[69.6, 'isl_apple'], [70.55, 'isl_lime'], [71.5, 'isl_lemon']], R = (a, b) => a + Math.random() * (b - a);
  phPlace('isl_crate', rows.map(([z]) => [x, g + 0.32, z, PI / 2, 1]).concat(rows.map(([z]) => [x + 0.05, g, z, PI / 2, 1])));
  const fruit = {}; const pile = (name, z, n, top) => { const L = fruit[name] || (fruit[name] = []); for (let i = 0; i < n; i++) { const lz = R(-0.36, 0.36), lx = R(-0.14, 0.14), h = top + R(0, 0.06) + (0.16 - Math.abs(lz) * 0.2); L.push([x + lx, h, z + lz, R(0, 6.28), R(0.9, 1.1)]); } };
  rows.forEach(([z, f]) => pile(f, z, 22, g + 0.62));
  pile('isl_onion', 69.6, 8, g + 0.3); pile('isl_pomegranate', 71.5, 6, g + 0.3);
  Object.keys(fruit).forEach(k => phPlace(k, fruit[k], { shadow: false }));
  phPlace('isl_bananas', [[x, g + 0.82, 70.55, PI / 2, 1]], { shadow: false });
})();
