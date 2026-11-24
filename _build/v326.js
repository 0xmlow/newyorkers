/* ================================================================
   v326 THE TOUR: DOWN THE BACK STAIRS (2026-11-24)
   One stop inside the speakeasy under the bodega, to see its damask, its stools, its bottles and its barrels.
   ================================================================ */
(function tourV326() {
  const T = (window.__game && __game.TOUR) || TOUR; if (!window.__BACK) return; const at = T.findIndex(r => r.name === 'aerial'), br = BACK.fy + 1.6;
  T.splice(at < 0 ? T.length : at, 0, { name: 'the speakeasy', dur: 8, pre: () => { try { BACK.g.visible = true; BACK.show = LIFE.t + 8.5; } catch (e) { } }, pos: [[BACK.cx - 3, br, BACK.cz + 2.5], [BACK.cx - 1.5, br, BACK.cz - 1]], look: [[BACK.cx + 3.5, br - 0.3, BACK.cz], [BACK.cx + 4, br, BACK.cz - 2]] });
})();
