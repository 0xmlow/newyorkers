/* ================================================================
   v305 THE TOUR: ROOFS FROM THE WHEEL (2026-11-24)
   One stop high over the bodega block, looking down on its painted roof eye with the laundromat's and the DROP shop's
   further off, the way you see them from the top of the Ferris wheel.
   ================================================================ */
(function tourV305() {
  const T = (window.__game && __game.TOUR) || TOUR; if (!window.__BLK || !BLK.bodega) return; const at = T.findIndex(r => r.name === 'aerial');
  T.splice(at < 0 ? T.length : at, 0, { name: 'roof eyes', dur: 7, pos: [[4, 34, 50], [10, 30, 56]], look: [[17, 11, 66], [17, 11, 66]] });
})();
