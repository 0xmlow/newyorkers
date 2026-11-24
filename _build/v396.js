/* ================================================================
   v396 THE TOUR WALKS THE MEMES WALK (2026-11-24)
   A stop at the start of the walk: down at the pier spoke, reading the first plaques, #1 Seize the Memes of
   Production onward, gliding east along the outer bank at a slow walk with the river beside you.
   ================================================================ */
(function tourV396() { const T = (window.__game && __game.TOUR) || TOUR; if (!window.__MWALK || !MWALK.ok) return;
  const r = 41.86, y = MWALK.PY, P = a => [Math.sin(a) * (r - 1.4), y + 1.55, Math.cos(a) * (r - 1.4)], Lk = a => [Math.sin(a + 0.05) * r, y, Math.cos(a + 0.05) * r];
  const a0 = 0.045, a1 = 0.2, stop = { name: 'the memes walk', dur: 12, pos: [P(a0), P((a0 + a1) / 2), P(a1)], look: [Lk(a0), Lk((a0 + a1) / 2), Lk(a1)] };
  const ins = (L, before) => { let at = L.findIndex(q => q.name === before); if (at < 0) at = L.findIndex(q => q.name === 'aerial'); L.splice(at < 0 ? L.length : at, 0, stop); };
  const mr = T.findIndex(q => q.name === 'the meme river'); if (mr >= 0) T.splice(mr + 1, 0, stop); else ins(T, 'tied together');
  if (window.__TOURFULL && __TOURFULL !== T) { const m2 = __TOURFULL.findIndex(q => q.name === 'the meme river'); if (m2 >= 0) __TOURFULL.splice(m2 + 1, 0, stop); else ins(__TOURFULL, 'aerial'); }
})();
