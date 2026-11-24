/* ================================================================
   v296 THE TOUR: DOORS, CRATES, MATERIAL (2026-11-24)
   Three stops before the aerial: a tenement door at dusk under its sconce, the milk crates and boombox at the skate
   plaza, and SURVIVE's buttresses close up in their board formed concrete.
   ================================================================ */
(function tourV296() {
  const T = (window.__game && __game.TOUR) || TOUR, add = []; const g = ground(17, 66);
  add.push({ name: 'the door', dur: 6, pos: [[15.5, g + 1.7, 78], [14.5, g + 1.7, 76.5]], look: [[14, g + 1.8, 73.2], [14, g + 2, 73.2]] });
  try { const [x, z] = SK.L2W(0.2, 10.1); add.push({ name: 'the crates', dur: 6, pos: [[x + 3, SK.g0 + 1.6, z - 2.5], [x + 2, SK.g0 + 1.4, z - 1.6]], look: [[x, SK.g0 + 0.5, z], [x, SK.g0 + 0.5, z]] }); } catch (e) { }
  add.push({ name: 'board form', dur: 6, pos: [[27, 1.8, 37.6], [29, 2.2, 38]], look: [[25, 3, 39.6], [31, 3.4, 39.6]] });
  const at = T.findIndex(r => r.name === 'aerial'); T.splice(at < 0 ? T.length : at, 0, ...add);
})();
