/* ================================================================
   v245 THE ISLAND LIVERY (2026-11-23)
   One island, one set of colours for everything that belongs to it: the lamp posts (v182), the litter baskets
   (v190), the cast iron of benches, fountains and fences, and the park signs (v225) all take MLow's navy enamel,
   the same navy as the meme river, the CC0 benches' supports and bins, with bone lettering. Real New York does
   this borough by borough; the island does it in its own colours. ?livery=0 turns it off.
   ================================================================ */
(function livery() {
  if (!LOOK.on || /livery=0/.test(location.search)) return; const navy = 0x1a2a4c, navyD = 0x122039;
  try { if (window.__POSTS2 && POSTS2.iron) POSTS2.iron.color.setHex(navyD); } catch (e) { }
  try { if (window.__BASKET && BASKET.mesh) { BASKET.mesh.color.setHex(navy); BASKET.rim.color.setHex(navyD); } } catch (e) { }
  try { if (FACM.iron) FACM.iron.color.setHex(navyD); } catch (e) { }
  window.__LIVERY = { on: true };
})();
