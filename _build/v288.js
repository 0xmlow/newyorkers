/* ================================================================
   v288 REAL PROPS: DOOR LIGHTS (2026-11-24)
   A scanned industrial wall sconce over each new tenement's front door (v233), and after dusk each one is a real
   warm light on the step (the v177 light budget keeps only the nearest eight live, so these cost nothing far away).
   ?props=0 off.
   ================================================================ */
(function doorLights() {
  if (!PH.on || !window.__BLK) return; const L0 = [];
  const at = (cx, cz, nx, nz, hd, u, g) => { const tx = nz, tz = -nx, x = cx + nx * (hd + 0.02) + tx * (u + 0.95), z = cz + nz * (hd + 0.02) + tz * (u + 0.95); L0.push([x, g + 2.35, z, Math.atan2(nx, nz), 0.9]); practical(x + nx * 0.35, g + 2.3, z + nz * 0.35, 0xffc98a, 6, 9); };
  try { at(17, 66, 0, 1, 7.2, -3.0, ground(17, 66) + 0.02); } catch (e) { }
  try { if (BLK.laund) at(-86, -4, 0, -1, 4, -1.3, LAUND.g0); } catch (e) { }
  try { if (BLK.drop) at(-62, 80, 1, 0, 3.5, 0.7, LINE.g0); } catch (e) { }
  phPlace('isl_sconce', L0);
})();
