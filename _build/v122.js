/* ================================================================
   v122 EVERYBODY DANCE (2026-11-23)
   Type DANCE and every rigged pigeon on the island (the flocks, the holiday windows) breaks into its dance for
   fifteen seconds, and the dogs leap for joy. The rigs had the clips all along.
   ================================================================ */
secret('dance', () => { toast('EVERY PIGEON ON THE ISLAND STARTS DANCING. THE DOGS LEAP. NOBODY CAN EXPLAIN IT.', 'blue'); CC0.dance = LIFE.t + 15; }, ['dance', 'dancedance']);
window.__FRAMES.push(dt => { try { if (!CC0.dance) return; const on = LIFE.t < CC0.dance;
  CC0.live.forEach(h => { if (h.name === 'pigeon' && on) h.force = 'dance'; if (h.name === 'shiba' || h.name === 'husky') { if (on && h.sp < 0.3) h.force = 'leap'; else if (h.force === 'leap') h.force = null; } });
  if (!on) { CC0.dance = 0; HWIN.p.forEach(h => h.force = 'dance'); } } catch (e) { } });
