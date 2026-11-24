/* ================================================================
   v304 THE TOUR: ROUND TWO OF THE WALLS (2026-11-24)
   Four stops before the aerial: the painted court, the factory's mural, the asphalt art under the traffic, and the
   lighthouse's painted back from the sea.
   ================================================================ */
(function tourV304() {
  const T = (window.__game && __game.TOUR) || TOUR, add = [];
  if (typeof COURT !== 'undefined') add.push({ name: 'the painted court', dur: 7, pos: [[COURT.x + 10, 9, COURT.z + 9], [COURT.x + 6, 12, COURT.z + 3]], look: [[COURT.x, 0.6, COURT.z], [COURT.x, 0.6, COURT.z]] });
  add.push({ name: 'the factory mural', dur: 7, pos: [[26, 3, -70], [24, 3.4, -58]], look: [[16, 4.5, -68], [16, 4.5, -58]] });
  add.push({ name: 'asphalt art', dur: 7, pos: [[62, 6, 62], [66, 8, 74]], look: [[70.7, 0.6, 70.7], [70.7, 0.6, 70.7]] });
  if (typeof LH !== 'undefined') add.push({ name: 'the lighthouse back', dur: 8, pos: [[10, 4, -170], [-8, 14, -160]], look: [[0, 20, -130], [0, 26, -130]] });
  const at = T.findIndex(r => r.name === 'aerial'); T.splice(at < 0 ? T.length : at, 0, ...add);
})();
