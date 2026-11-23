/* ================================================================
   v228 THE LOOK: THE BLOCK GROWS, THE LAUNDROMAT (2026-11-23)
   SPIN CYCLE 420 gets the two floors of apartments every laundromat has over it: same brick, stone sills and
   lintels, rooms behind the lit windows, a full cornice, the fire escape down its glass front, a bulkhead and
   condensers on the roof. Built with v227's tenementAbove().
   ?block=0 turns it off.
   ================================================================ */
(function laundromatUpstairs() {
  if (!BLK_ON || !window.__LAUND || LAUND.g0 == null) return;
  const g0 = LAUND.g0; blkHideIn(-86 - 2.4, -86 + 2.4, -4 - 3.9, -4 + 3.9, g0 + 3.84, g0 + 11);
  const r = tenementAbove({ cx: -86, cz: -4, w: 5, d: 8, y0: g0 + 3.86, floors: 2, fn: [1, 0] }); BLK.laund = r.top;
})();
