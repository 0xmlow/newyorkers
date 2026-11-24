/* ================================================================
   v256 THE TOUR: WALLS AND ILLUSIONS (2026-11-23)
   Six stops before the aerial: the Firefly mural on SURVIVE, the wheatpaste on the bodega, a ghost sign, the
   anamorphic eye from its spot (then a step off it), the hollow eye walked past, and the impossible triangle from
   its footprints.
   ================================================================ */
(function tourV256() {
  const T = (window.__game && __game.TOUR) || TOUR, add = [];
  if (window.__WALLS && WALLS.n) { add.push({ name: 'the survive mural', dur: 7, pos: [[30, 2.2, 31], [44, 2.4, 31]], look: [[34, 3.6, 39.9], [46, 3.6, 39.9]] });
    add.push({ name: 'the ghost sign', dur: 7, pos: [[33, 5, 70], [30, 6, 64]], look: [[22, 8, 66], [22, 8.4, 66]] }); }
  if (window.__PASTE && PASTE.walls.length) add.push({ name: 'the wheatpaste', dur: 7, pos: [[27.5, 1.7, 63], [26.5, 1.7, 70]], look: [[22.2, 1.9, 63], [22.2, 1.9, 69]] });
  if (window.__ANA && ANA.mat) add.push({ name: 'the eye from one spot', dur: 10, pos: [[ANA.V.x, ANA.V.y, ANA.V.z], [ANA.V.x, ANA.V.y, ANA.V.z + 0.01], [ANA.V.x - 2.5, ANA.V.y, ANA.V.z + 0.5]], look: [[ANA.T.x, ANA.T.y, ANA.T.z], [ANA.T.x, ANA.T.y, ANA.T.z], [ANA.T.x, ANA.T.y, ANA.T.z]] });
  if (window.__HOLLOW && HOLLOW.ok) add.push({ name: 'the hollow eye', dur: 8, pos: [[15, 1.7, -0.6], [23, 1.7, -0.6]], look: [[21, 2.9, 6.8], [21, 2.9, 6.8]] });
  if (window.__PEN && PEN.ok) add.push({ name: 'the impossible triangle', dur: 9, pos: [[PEN.V.x - 6, PEN.V.y, PEN.V.z + 3], [PEN.V.x, PEN.V.y, PEN.V.z], [PEN.V.x, PEN.V.y, PEN.V.z + 0.01]], look: [[PEN.C.x, PEN.C.y, PEN.C.z], [PEN.C.x, PEN.C.y, PEN.C.z], [PEN.C.x, PEN.C.y, PEN.C.z]] });
  const at = T.findIndex(r => r.name === 'aerial'); T.splice(at < 0 ? T.length : at, 0, ...add);
})();
