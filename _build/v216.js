/* ================================================================
   v216 THE TOUR AFTER DARK (2026-11-23)
   Three more stops before the aerial: the market's goods, the bodega's neon and the hardware store.
   ================================================================ */
(function tourV216() {
  const add = [];
  try { const x = MKT_AT.x, z = MKT_AT.z, g = ground(x, z); add.push({ name: 'the market stalls', dur: 7, pos: [[x - 6, g + 1.6, z - 5], [x - 2, g + 1.6, z - 4]], look: [[x - 4, g + 1.2, z - 0.8], [x, g + 1.2, z - 0.8]] }); } catch (e) { }
  try { const g = ground(17, 66); add.push({ name: 'the neon', dur: 6, pos: [[5, g + 1.7, 64], [7, g + 1.7, 65]], look: [[11.7, g + 2, 66], [11.7, g + 2, 66]] }); } catch (e) { }
  try { const x = WT_AT.x, z = WT_AT.z, g = WT.top - 7; add.push({ name: 'n3w hardware', dur: 6, pos: [[x - 3, g + 1.7, z + 10], [x - 1, g + 1.7, z + 8]], look: [[x, g + 1.8, z + 3.5], [x, g + 1.8, z + 3.5]] }); } catch (e) { }
  const at = TOUR.findIndex(r => r.name === 'aerial'); TOUR.splice(at < 0 ? TOUR.length : at, 0, ...add);
})();
// at night the only shadows are the moon's, soft and slow: draw them every other frame (v177's late frame rule
// already does this when frames run late; this makes it the rule after dark)
window.__FRAMES.push(() => { try { if (!window.__SHH || (window.__GOV && __GOV.tier >= 3)) return; if ((L.lamps || 0) > 0.6) { renderer.shadowMap.autoUpdate = false; if (((__SHH.nf = (__SHH.nf || 0) + 1) & 1) === 0) renderer.shadowMap.needsUpdate = true; } else if (!__SHH.on && !renderer.shadowMap.autoUpdate) renderer.shadowMap.autoUpdate = true; } catch (e) { } });
