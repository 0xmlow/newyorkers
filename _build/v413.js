/* ================================================================
   v413 THE 6:52:29 WAVE (2026-11-24)
   Once a day, at 6:52 and 29 seconds in the evening, New York time, a wave of light runs round the Memes Walk:
   plaque #1 lights, then #2, and on through every card in mint order to the newest, both banks, in about forty
   seconds, like a stadium standing up for the collection. Type WAVE to send one yourself.
   ================================================================ */
const MWAVE = { t: -1, last: '' };
window.__MWAVE = MWAVE;
(function memesWave() {
  if (!window.__MWALK || !MWALK.ok) return;
  MWAVE.go = () => { MWAVE.t = 0; toast('6529 · THE MEMES WAVE · #1 TO #' + MWALK.pos.length, 'blue'); };
  try { secret('memeswave', () => MWAVE.go(), ['wave']); } catch (e) { }
})();
window.__FRAMES.push(dt => { try { if (!window.__MWALK || !MWALK.ok) return; MWAVE.ck = (MWAVE.ck || 0) - dt;
  if (MWAVE.ck <= 0) { MWAVE.ck = 1; const s = new Date().toLocaleTimeString('en-US', { timeZone: 'America/New_York', hour12: false }); if (s.slice(0, 8) === '18:52:29' && MWAVE.last !== new Date().toDateString()) { MWAVE.last = new Date().toDateString(); MWAVE.go(); } }
  if (MWAVE.t < 0) { MWALK.wave.value = -1; return; } MWAVE.t += dt; const k = MWAVE.t / 40; MWALK.wave.value = k * 1.03 - 0.01; if (k > 1.05) MWAVE.t = -1; } catch (e) { } });
