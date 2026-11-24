/* ================================================================
   v275 THE TOUR: TANKS, BACKS, BANNERS (2026-11-23)
   Four stops before the aerial: the painted water tank over the island, the bodega's roof tank, a card banner at a
   river crossing, and the freeway billboards from the beach with their new card backs.
   ================================================================ */
(function tourV275() {
  const T = (window.__game && __game.TOUR) || TOUR, add = [];
  if (window.__WT && WT.painted) add.push({ name: 'the painted tank', dur: 7, pos: [[-50, 10, -58], [-54, 13, -62]], look: [[-63.4, 13, -72.4], [-63.4, 13.5, -72.4]] });
  if (window.__BLK && BLK.tank) add.push({ name: 'the roof tank', dur: 6, pos: [[4, 8, 52], [6, 10, 55]], look: [[19.6, 10, 61.6], [19.6, 10.4, 61.6]] });
  if (window.__CBAN && CBAN.list.length) add.push({ name: 'the card banners', dur: 7, pos: [[33, 1.7, -4], [37, 1.7, -3.5]], look: [[40, 4.6, 2.6], [43, 4.6, 2.6]] });
  if (window.__BACKS && BACKS.mat) add.push({ name: 'the card backs', dur: 7, pos: [[-114, 4, 20], [-110, 4, 0]], look: [[-100, 4, 10], [-100, 4, -8]] });
  const at = T.findIndex(r => r.name === 'aerial'); T.splice(at < 0 ? T.length : at, 0, ...add);
})();
