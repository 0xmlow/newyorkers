/* ================================================================
   v259 REAL PROPS: THE SITE THAT NEVER FINISHES (2026-11-23)
   BUIDL, the building that is never finished, gets the kit a real stalled New York site leaves lying around:
   a yellow generator, a stack of cement bags, a wooden step ladder, a hand truck, and a line of concrete jersey
   barriers along its open side with 6529 cards wheatpasted on them (the wrap tool's isl_barrier). All scanned
   CC0. ?props=0 turns them off.
   ================================================================ */
(function siteKit() {
  if (!PH.on) return; const G = (x, z) => ground(x, z);
  phPlace('isl_generator', [[-38.6, G(-38.6, -46.2), -46.2, 1.2, 1]]);
  phPlace('isl_cement', [[-38.9, G(-38.9, -50), -50, 0.1, 1], [-38.3, G(-38.3, -50.2), -50.2, -0.2, 1], [-38.6, G(-38.6, -50.1) + 0.2, -50.1, 0.4, 1]]);
  phPlace('isl_ladder', [[-41.2, G(-41.2, -40.9), -40.9, PI, 1]]);
  phPlace('isl_handtruck', [[-38.4, G(-38.4, -43.6), -43.6, -1.1, 1]]);
  const bar = []; for (let i = 0; i < 6; i++) { const z = -52.4 + i * 1.62; bar.push([-36.9, G(-36.9, z), z, PI / 2 + (Math.random() - 0.5) * 0.08, 1]); } phPlace('isl_barrier', bar); bar.forEach(([x, , z]) => post(x, z, 0.4, -5, 1));
})();
