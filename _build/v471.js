/* ================================================================
   v471 THE LOOK PASSES KEEP THE FRAME RATE (2026-11-24)
   This round added four full screen passes (air, the tour lens, sharpening, night streaks). On a machine that
   cannot carry them they now step aside by themselves: if frames average slower than 30 ms for five seconds of
   walking, the streaks go first, then the sharpening, then the air, then the tour lens, one at a time, ten
   seconds apart, and a quiet note goes to the console. A fast machine never notices. ?governor=0 off.
   ================================================================ */
const GOVN = { acc: 0, n: 0, wait: 8, drop: [] };
window.__GOVN = GOVN;
window.__FRAMES.push(dt => { try { if (/governor=0/.test(location.search) || window.__cap || isMobile) return; GOVN.wait -= dt; if (GOVN.wait > 0) return;
  GOVN.acc += dt; GOVN.n++; if (GOVN.acc < 5) return; const ms = GOVN.acc / GOVN.n * 1000; GOVN.acc = 0; GOVN.n = 0; GOVN.ms = ms; if (ms < 30) return;
  const steps = [['streaks', () => { STREAK.no = true; if (STREAK.pass) STREAK.pass.enabled = false; }], ['sharp', () => { if (SHARP.pass) { SHARP.pass.enabled = false; SHARP.no = true; } }], ['air', () => { HAZE.k = 0; if (HAZE.pass) HAZE.pass.enabled = false; HAZE.off = true; }], ['lens', () => { if (DOF.pass) { DOF.pass.enabled = false; } DOF.off = true; }]];
  const s = steps.find(q => !GOVN.drop.includes(q[0])); if (!s) return; s[1](); GOVN.drop.push(s[0]); GOVN.wait = 10; console.info('MEME ISLAND: frame time ' + ms.toFixed(1) + ' ms, turned off', s[0]); } catch (e) { } });
