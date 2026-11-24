/* ================================================================
   v290 REAL PROPS: THE BACK ROOM'S STOOLS (2026-11-24)
   Six scanned turned-wood bar stools with brass footrings along the speakeasy's zinc bar (v41), under its new damask
   (v251). ?props=0 off.
   ================================================================ */
(function barStools() {
  if (!PH.on || !window.__BACK) return; const L0 = []; for (let i = 0; i < 6; i++) L0.push([BACK.cx + 2.75, BACK.fy, BACK.cz - 2.6 + i * 1.04, PI / 2 + (Math.random() - 0.5) * 0.4, 1]);
  phPlace('isl_barstool', L0, { shadow: false }).then(ims => { BACK.stools = ims; ims.forEach(im => { im.visible = !!(BACK.g && BACK.g.visible); }); });
  window.__FRAMES.push(() => { try { if (BACK.stools && BACK.g) BACK.stools.forEach(im => im.visible = BACK.g.visible); } catch (e) { } });
})();
