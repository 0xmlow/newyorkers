/* ================================================================
   v277 REAL PROPS: STOOP PLANTS (2026-11-23)
   Scanned potted plants (big leaved, terracotta pots) stand either side of each new tenement's front door (v233),
   and a scanned planter with an Open Eye Flower on its face sits under the bodega's window. ?props=0 off.
   ================================================================ */
(function stoopPlants() {
  if (!PH.on) return; const L0 = [];
  const pair = (cx, cz, nx, nz, hd, u, g) => { const tx = nz, tz = -nx; [-0.95, 0.95].forEach(d => { const x = cx + nx * (hd + 0.55) + tx * (u + d), z = cz + nz * (hd + 0.55) + tz * (u + d); L0.push([x, g + 0.16, z, Math.random() * 6, 0.9]); }); };
  try { pair(17, 66, 0, 1, 7.2, -3.0, ground(17, 66) + 0.02); } catch (e) { }
  try { if (BLK.laund) pair(-86, -4, 0, -1, 4, -1.3, LAUND.g0); } catch (e) { }
  try { if (BLK.drop) pair(-62, 80, 1, 0, 3.5, 0.7, LINE.g0); } catch (e) { }
  phPlace('isl_pot', L0); try { const g = ground(17, 66) + 0.02; phPlace('isl_planter', [[11.45, g, 66, -PI / 2, 1.1]]); } catch (e) { }
})();
