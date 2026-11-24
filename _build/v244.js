/* ================================================================
   v244 REAL PROPS: HYDRANTS (2026-11-23)
   A real scanned fire hydrant, re-skinned by the wrap tool in the island's cobalt with an Open Eye Flower on its
   bonnet, stands at the kerb by each of the new buildings and at the corners where the river's spokes meet the
   ring road. (The red hydrant that opens, v49, stays red: that one is on duty.) ?props=0 turns them off.
   ================================================================ */
(function hydrantsCC0() {
  if (!PH.on) return; const L0 = [];
  const at = (x, z, ry) => L0.push([x, ground(x, z), z, ry, 1]);
  try { at(11.4, 74.2, 0.3); } catch (e) { }
  try { if (BLK.laund) at(-82.9, -8.7, 1.2); } catch (e) { }
  try { if (BLK.drop) at(-57.9, 77.4, -0.4); } catch (e) { }
  [[3.6, 60], [-3.6, -46], [46, -3.6], [-48, 3.6]].forEach(([x, z]) => at(x, z, Math.random() * 6));
  phPlace('isl_hydrant', L0);
})();
