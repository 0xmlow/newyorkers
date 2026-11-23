/* ================================================================
   v235 THE TOUR, CHECKED AT THE END (2026-11-23)
   v223 checked where every tour stop begins. This pass photographed where each of the 90 ends. Five ended badly:
   both sidewalk shed stops on a green panel at arm's length, the bank between two columns, the steel in a tree,
   N3W HARDWARE on a canopy pole, and wash day stayed under a dark shed looking up. Those now stop short of the
   obstacle, and wash day watches the clotheslines from the street.
   ================================================================ */
(function tourCheckedEnd() {
  const T = (window.__game && __game.TOUR) || (typeof TOUR !== 'undefined' ? TOUR : null); if (!T) return;
  const lerp = (A, t) => { if (A.length === 1) return A[0].slice(); const f = t * (A.length - 1), i = Math.min(A.length - 2, Math.floor(f)), u = f - i; return A[i].map((v, k) => v + (A[i + 1][k] - v) * u); };
  const trim = (name, a, b) => T.filter(r => r.name === name).forEach(s => { const P = s.pos, L = s.look;
    s.pos = [lerp(P, a), lerp(P, (a + b) / 2), lerp(P, b)]; s.look = [lerp(L, a), lerp(L, (a + b) / 2), lerp(L, b)]; s.dur = Math.max(4, s.dur * (b - a) + 1.5); });
  trim('the sidewalk shed', 0, 0.55); trim('bank', 0, 0.6); trim('the steel', 0, 0.5); trim('n3w hardware', 0, 0.45);
  try { const s = T.find(r => r.name === 'wash day'); if (s && window.__WASH) { const y = WASH.g0; s.pos = [[-49, y + 1.8, -64], [-51, y + 2.0, -62.5]]; s.look = [[-58, y + 6, -56], [-58, y + 6.5, -55.5]]; } } catch (e) { }
})();
