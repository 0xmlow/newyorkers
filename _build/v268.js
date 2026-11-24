/* ================================================================
   v268 FRAME RATE: THE PAINTING SKIPS THE GRASS (2026-11-23)
   Profiling the plaza view by triangles showed the anamorphic eye (v253) laying its overlay on whole fields of
   grass clumps, five thousand triangles a clump, about three hundred thousand triangles drawn twice for paint you
   could never see on a blade of grass. The projector now skips vegetation (anything alpha tested or instanced
   above 1,500 triangles a copy) and any single surface over 60,000 triangles; the painting lands on the paving,
   the buildings and the things in the street, which is where Varini paints too. Also: the card backs (v267)
   skip the shadow pass. ?anamorph=0 / ?backs=0.
   ================================================================ */
window.__FRAMES.push(() => { try { if (window.__BACKS && BACKS.im && BACKS.im.castShadow) BACKS.im.castShadow = false; } catch (e) { } });
