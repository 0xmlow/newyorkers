/* ================================================================
   v406 THE TOUR AND THE COUNT MEET THE SIDESHOW (2026-11-24)
   One tour stop walks the sideshow row past the dancer, the spiral and the colours that leave. The count over the
   pier board now reads 26 ILLUSIONS (18, the five at N3W CUTS and the crossing, the three sideshow boards).
   ================================================================ */
(function tourV406() { const T = (window.__game && __game.TOUR) || TOUR; if (!window.__SIDE || SIDE.list.length < 3) return;
  const [a, b, c] = SIDE.list, p = (B, d) => { const q = B.at(0, d); return [q[0], B.g + 1.7, q[1]]; }, l = B => { const q = B.at(0, 0); return [q[0], B.g + 1.8, q[1]]; };
  const stop = { name: 'the sideshow row', dur: 12, pos: [p(a, 4.5), p(b, 4.5), p(c, 4.5)], look: [l(a), l(b), l(c)] };
  const ins = (L, before) => { let at = L.findIndex(q => q.name === before); if (at < 0) at = L.findIndex(q => q.name === 'aerial'); L.splice(at < 0 ? L.length : at, 0, stop); };
  ins(T, 'tied together'); if (window.__TOURFULL && __TOURFULL !== T) ins(__TOURFULL, 'aerial');
})();
(function counts26() { try { const s = SIGNS.find(q => q.lines && q.lines[0] && /^18 ILLUSIONS/.test(q.lines[0].t)); if (!s) return; s.lines[0].t = '26 ILLUSIONS · 577 CARDS · 472 ARTISTS'; signCanvas(s.lines, s.w, s.h, s.bg, s.fg, s.cv); s.t.needsUpdate = true; } catch (e) { } })();
