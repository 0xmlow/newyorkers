/* ================================================================
   v236 THE TOUR: THE BLOCK (2026-11-23)
   Five more stops before the aerial: the bodega building from across the street, the laundromat building, the
   N3W DROP building over the line, inside SPIN CYCLE 420, and the chess sets close up.
   ================================================================ */
(function tourV236() {
  const T = (window.__game && __game.TOUR) || TOUR, add = [];
  try { if (window.__BLK && BLK.bodega) { const g = ground(17, 66); add.push({ name: 'the bodega building', dur: 8, pos: [[5.5, g + 3.6, 74.5], [5, g + 3.2, 76]], look: [[17, g + 6.5, 64], [17, g + 7.5, 65]] }); } } catch (e) { }
  try { if (window.__BLK && BLK.laund) { const g = LAUND.g0; add.push({ name: 'the laundromat building', dur: 7, pos: [[-72, g + 9, -14], [-76, g + 6, -12]], look: [[-86, g + 5, -4], [-86, g + 5, -4]] }); } } catch (e) { }
  try { if (window.__BLK && BLK.drop) { const g = LINE.g0; add.push({ name: 'the drop building', dur: 7, pos: [[-62, g + 12, 64], [-60, g + 8, 68]], look: [[-62, g + 5, 80], [-62, g + 6, 80]] }); } } catch (e) { }
  try { if (window.__LIN && LIN.ok) { const g = LAUND.g0; add.push({ name: 'spin cycle', dur: 7, pos: [[-81, g + 1.7, -2], [-82.5, g + 1.6, -3]], look: [[-87.5, g + 1.3, -4], [-87.5, g + 1.4, -5]] }); } } catch (e) { }
  try { if (window.__CS2 && CS2.ok) { const g = ground(74, -21); add.push({ name: 'the chess sets', dur: 6, pos: [[75.6, g + 1.9, -19.4], [75.0, g + 1.6, -19.9]], look: [[74, g + 0.8, -21], [74, g + 0.8, -21]] }); } } catch (e) { }
  const at = T.findIndex(r => r.name === 'aerial'); T.splice(at < 0 ? T.length : at, 0, ...add);
})();
