/* ================================================================
   v229 THE LOOK: THE BLOCK GROWS, THE N3W DROP SHOP (2026-11-23)
   The shopfront where the line waits for something nobody can name gets its building too: two floors over the
   black awning, the fire escape down the front above the line, the cornice and the roof gear. With v227 and v228
   the island now has three proper New York corner buildings instead of three one storey boxes.
   ?block=0 turns it off.
   ================================================================ */
(function dropUpstairs() {
  if (!BLK_ON || !window.__LINE || LINE.g0 == null) return;
  const g0 = LINE.g0; blkHideIn(-62 - 3.4, -62 + 3.4, 80 - 1.9, 80 + 1.9, g0 + 4.55, g0 + 11);
  const r = tenementAbove({ cx: -62, cz: 80, w: 7, d: 4, y0: g0 + 4.6, floors: 2, fn: [0, -1] }); BLK.drop = r.top;
})();
