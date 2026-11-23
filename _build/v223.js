/* ================================================================
   v223 THE TOUR, CHECKED (2026-11-23)
   Every one of the 82 tour stops was photographed at its start, middle and end. Ten opened inside something: a
   sculpture, a billboard, the new crane's lattice, a white wall, a tree. Those stops now begin (or end) where the
   view is clear; the bodega and the bank flags get new camera paths altogether.
   ================================================================ */
(function tourChecked() {
  const T = (window.__game && __game.TOUR) || (typeof TOUR !== 'undefined' ? TOUR : null); if (!T) return;
  const lerp = (A, t) => { if (A.length === 1) return A[0].slice(); const f = t * (A.length - 1), i = Math.min(A.length - 2, Math.floor(f)), u = f - i; return A[i].map((v, k) => v + (A[i + 1][k] - v) * u); };
  // keep only the part of a stop between a and b (0..1), resampled to three points
  const trim = (name, a, b) => { const s = T.find(r => r.name === name); if (!s) return; const P = s.pos, L = s.look;
    s.pos = [lerp(P, a), lerp(P, (a + b) / 2), lerp(P, b)]; s.look = [lerp(L, a), lerp(L, (a + b) / 2), lerp(L, b)]; s.dur = Math.max(4, s.dur * (b - a) + 1.5); };
  trim('the ripples', 0.45, 1); trim('the watchers', 0.4, 1); trim('fresh off the press', 0.4, 1); trim('the impermanent wall', 0.45, 1);
  trim('the cut', 0.45, 1); trim('survive bunker', 0, 0.7); trim('the pond', 0.4, 1);
  try { const s = T.find(r => r.name === 'the bodega'); if (s) { const g = ground(17, 66); s.pos = [[5.2, g + 1.8, 67.8], [6.4, g + 1.7, 64.4]]; s.look = [[11.7, g + 3, 66.5], [11.7, g + 2.8, 66]]; } } catch (e) { }
  try { const s = T.find(r => r.name === 'the flags'); if (s) { const g = ground(-50, -10); s.pos = [[-36, g + 6.5, -2], [-39, g + 5.5, -5]]; s.look = [[-50.6, g + 10, -10.6], [-50.6, g + 10.5, -10.6]]; } } catch (e) { }
})();
