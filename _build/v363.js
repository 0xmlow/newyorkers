/* ================================================================
   v363 THE TOUR: ROUND THREE OF TRICKS (2026-11-24)
   Five stops before the aerial: inside the camera obscura, round then square, walking the moiré fence, the shadow
   checker, which eye is bigger.
   ================================================================ */
(function tourV363() { const T = (window.__game && __game.TOUR) || TOUR, add = [];
  if (window.__OBS && OBS.ok) { const [x, g, z] = OBS.P; add.push({ name: 'camera obscura', dur: 8, pos: [[x + 3.5, g + 1.6, z], [x + 0.9, g + 1.6, z]], look: [[x - 1.6, g + 1.3, z], [x - 1.6, g + 1.3, z]] }); }
  if (window.__AMB && AMB.ok) { const [a, b] = AMB.V, c = [AMB.P[0], AMB.P[1] + 1.4, AMB.P[2]]; add.push({ name: 'round or square', dur: 10, pos: [a, [a[0] + 2.6, a[1], AMB.P[2]], b], look: [c, c, c] }); }
  if (window.__MOIRE) { const [x, z] = __MOIRE.P; add.push({ name: 'the moire fence', dur: 7, pos: [[x - 5, SK.g0 + 1.6, z + 3], [x + 5, SK.g0 + 1.6, z + 3]], look: [[x - 3, SK.g0 + 1, z], [x + 3, SK.g0 + 1, z]] }); }
  if (window.__ADEL) { const [x, g, z] = __ADEL.P; add.push({ name: 'the shadow checker', dur: 6, pos: [[x + 2.6, g + 2.2, z - 1], [x + 2.2, g + 2.0, z - 0.6]], look: [[x, g + 0.6, z], [x, g + 0.6, z]] }); }
  if (window.__EBB) { const [x, g, z] = __EBB.P; add.push({ name: 'which eye is bigger', dur: 6, pos: [[x + 4, g + 1.7, z], [x + 3.2, g + 1.7, z]], look: [[x, g + 1.6, z], [x, g + 1.6, z]] }); }
  const at = T.findIndex(r => r.name === 'aerial'); T.splice(at < 0 ? T.length : at, 0, ...add); })();
