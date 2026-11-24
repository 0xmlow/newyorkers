/* ================================================================
   v486 NINE OUT OF NINE (2026-11-24)
   The illusion beach keeps count. Each of the nine things counts as seen once you have stood within a few metres
   of it; a small toast ticks it off (4 OF 9 THINGS THAT ARE NOT THERE), and the ninth says you have seen them all.
   Kept in this browser only. ?eastbeach=0 off.
   ================================================================ */
const SEEN9 = { got: {} };
window.__SEEN9 = SEEN9;
(function seenNine() {
  if (!window.__EASTB || /eastbeach=0/.test(location.search)) return; const p = (deg, r, n) => { const Q = eastAt(deg, r); return { x: Q.x, z: Q.z, n }; };
  SEEN9.list = [p(40, 117, 'THE HOLLOW FACE'), p(55, 113, 'THE CHAIR'), p(70, 113, 'THE TRIANGLE'), p(89, 117, 'THE CUBE'), p(100, 113, 'THE TWO BARS'), p(118, 119, 'THE FENCE'), p(134, 117, 'THE WHEEL'), p(150, 116, 'THE SPIRAL')];
  try { SEEN9.got = JSON.parse(localStorage.getItem('mi_seen9') || '{}'); } catch (e) { SEEN9.got = {}; }
})();
window.__FRAMES.push(() => { try { if (!SEEN9.list || !state.started) return; const add = n => { if (SEEN9.got[n]) return; SEEN9.got[n] = 1; try { localStorage.setItem('mi_seen9', JSON.stringify(SEEN9.got)); } catch (e) { } const k = Object.keys(SEEN9.got).length; toast(k >= 9 ? 'NINE OUT OF NINE. YOU HAVE SEEN EVERYTHING THAT IS NOT THERE.' : n + ' · ' + k + ' OF 9 THINGS THAT ARE NOT THERE', 'blue'); };
  SEEN9.list.forEach(s => { if (Math.hypot(P.x - s.x, P.z - s.z) < 5) add(s.n); });
  // the ninth is the one you hear: the barber pole's Shepard tone, with the sound on
  if (window.__SHEP && SHEP.master && SHEP.master.gain.value > 0.05) add('THE ENDLESS TONE'); } catch (e) { } });
