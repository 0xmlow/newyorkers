/* ================================================================
   v266 THE TOUR: THE WELL, THE CARD, THE STREET (2026-11-23)
   Four stops before the aerial: looking down the well, the card standing up on the court from its spot and then
   falling flat as you step aside, the payphone corner, and the site that never finishes.
   ================================================================ */
(function tourV266() {
  const T = (window.__game && __game.TOUR) || TOUR, add = [];
  if (window.__WELL && WELL.ok) add.push({ name: 'the well', dur: 7, pos: [[2.2, 2.4, -24], [0.6, 2.6, -26]], look: [[0, 0.3, -27.5], [0, 0, -27.5]] });
  if (window.__STAND && STAND.ok) { const V = STAND.V, Q = STAND.Q; add.push({ name: 'the card that stands up', dur: 9, pos: [[V.x, V.y, V.z], [V.x, V.y, V.z + 0.01], [V.x + (Q.x - V.x) * 0.35 + (Q.z - V.z) * 0.3, V.y + 0.3, V.z + (Q.z - V.z) * 0.35 - (Q.x - V.x) * 0.3]], look: [[Q.x, Q.y + 0.5, Q.z], [Q.x, Q.y + 0.5, Q.z], [Q.x, Q.y + 0.3, Q.z]] }); }
  if (window.__PH) { add.push({ name: 'the site', dur: 6, pos: [[-31, 2, -44], [-33, 2, -48]], look: [[-38.5, 0.9, -47], [-38.5, 0.9, -49]] }); }
  const at = T.findIndex(r => r.name === 'aerial'); T.splice(at < 0 ? T.length : at, 0, ...add);
})();
