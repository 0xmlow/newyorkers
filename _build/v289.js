/* ================================================================
   v289 REAL PROPS: MILK CRATES AND A BOOMBOX (2026-11-24)
   The blue milk crate, New York's chair: a stack by the skate plaza bench with a scanned boombox on top (an Open
   Eye Flower sticker on its speaker grille), a few by the N3W DROP line for the people who have been waiting longest,
   and two by the bodega's side door. ?props=0 off.
   ================================================================ */
(function crates() {
  if (!PH.on) return; const C = [], G = (x, z) => ground(x, z);
  try { const [x, z] = SK.L2W(0.2, 10.1); C.push([x, SK.g0, z, 0.3, 1], [x, SK.g0 + 0.3, z, 0.1, 1]); phPlace('isl_boombox', [[x, SK.g0 + 0.6, z, SK.ry + PI, 1]]); } catch (e) { }
  try { [[-57.4, 77.2], [-56.6, 77.9], [-55.9, 76.8]].forEach(([x, z], i) => C.push([x, G(x, z), z, i * 0.7, 1])); } catch (e) { }
  try { const g = ground(17, 66) + 0.02; C.push([16.4, g, 74.0, 0.2, 1], [16.4, g + 0.3, 74.0, -0.2, 1]); } catch (e) { }
  phPlace('isl_milk', C);
})();
