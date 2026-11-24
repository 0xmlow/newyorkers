/* ================================================================
   v319 REAL PROPS: THE SPEAKEASY'S STOCK (2026-11-24)
   Scanned wine bottles along the back bar's shelves and three oak barrels stacked in the speakeasy's far corner,
   seen only when you are down there (they hide with the room). ?props=0 off.
   ================================================================ */
(function speakeasyStock() {
  if (!PH.on || !window.__BACK) return; const cx = BACK.cx, cz = BACK.cz, fy = BACK.fy, ims = []; const keep = p => p.then(a => { ims.push(...a); a.forEach(im => im.visible = !!(BACK.g && BACK.g.visible)); });
  const W = []; [1.35, 1.85, 2.35].forEach(y => { for (let i = 0; i < 4; i++) W.push([cx + 4.55, fy + y + 0.02, cz - 2.4 + i * 1.6, PI / 2 + Math.random() * 0.4, 0.9]); }); keep(phPlace('isl_wine', W, { shadow: false }));
  keep(phPlace('isl_barrel', [[cx - 3.4, fy, cz + 2.9, 0.2, 1], [cx - 2.6, fy, cz + 2.9, -0.3, 1], [cx - 3.0, fy + 0.95, cz + 2.9, PI / 2, 1]], { shadow: false }));
  window.__FRAMES.push(() => { try { const v = !!(BACK.g && BACK.g.visible); ims.forEach(im => im.visible = v); } catch (e) { } });
})();
