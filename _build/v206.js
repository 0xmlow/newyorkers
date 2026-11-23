/* ================================================================
   v206 THE TOUR MEETS THE SITE (2026-11-23)
   Three more stops before the aerial: the steel of BUIDL and its tower crane, the wind ripples on GM beach, and
   an N3W LINK kiosk on the promenade.
   ================================================================ */
(function tourV206() {
  const add = [];
  try { const g = ground(-48, -47); add.push({ name: 'the steel', dur: 8, pos: [[-30, g + 1.7, -36], [-32, g + 2.2, -40]], look: [[-46, g + 7, -47], [-40, g + 18, -56]] }); } catch (e) { }
  add.push({ name: 'the ripples', dur: 7, pos: [[14, 1.4, 112], [18, 1.2, 116]], look: [[22, 0, 122], [26, 0, 126]] });
  try { const [x, z] = P2(49, 43.1); add.push({ name: 'n3w link', dur: 6, pos: [[x * 0.86, 1.7, z * 0.86], [x * 0.9, 1.7, z * 0.9]], look: [[x, 2.0, z], [x, 2.0, z]] }); } catch (e) { }
  const at = TOUR.findIndex(r => r.name === 'aerial'); TOUR.splice(at < 0 ? TOUR.length : at, 0, ...add);
})();
