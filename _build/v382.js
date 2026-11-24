/* ================================================================
   v382 THE TOUR ENDS AT NIGHT (2026-11-24)
   The tour's last three stops (the island tonight, the credits, the aerial) now run at dusk: the tour sets the island's
   clock forward to 7 pm for them and puts it back when the tour ends, so they show the river glowing and the murals
   lit instead of the same afternoon.
   ================================================================ */
(function nightEnd() { const T = (window.__game && __game.TOUR) || TOUR; ['the island tonight', 'the credits again'].forEach(n => { const s = T.find(r => r.name === n); if (!s) return; const pre = s.pre;
  s.pre = () => { try { if (pre) pre(); if (TIME.mode !== 'fixed') { window.__TOURCLK = { mode: TIME.mode, utc: TIME.utc }; } window.__TOURCLK && (__TOURCLK.at = LIFE.t); const t = nycTime(TIME.utc); TIME.mode = 'fixed'; TIME.utc = TIME.utc + ((19 - t.hours + 24) % 24) * 3600; } catch (e) { } }; }); })();
window.__FRAMES.push(() => { try { if (window.__TOURCLK && __TOURCLK.at != null && LIFE.t - __TOURCLK.at > 40 && typeof RAIL !== 'undefined' && !RAIL.on) { TIME.mode = __TOURCLK.mode; TIME.utc = __TOURCLK.utc; window.__TOURCLK = null; } } catch (e) { } });
