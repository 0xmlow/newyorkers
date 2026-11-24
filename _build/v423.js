/* ================================================================
   v423 THE TOUR STARTS THE WAVE (2026-11-24)
   When the tour reaches the Memes Walk it sets off the wave (v413), so everyone who takes the tour sees the
   collection light up in mint order from #1, not only those here at 6:52 in the evening.
   ================================================================ */
(function tourWave() { [((window.__game && __game.TOUR) || TOUR), window.__TOURFULL].forEach(R => { if (!R) return; const s = R.find(q => q.name === 'the memes walk'); if (s && !s.pre) s.pre = () => { try { if (window.__MWAVE && MWAVE.go) MWAVE.go(); } catch (e) { } }; }); })();
