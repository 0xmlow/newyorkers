/* ================================================================
   v451 THE POLE THAT NEVER STOPS RISING (2026-11-24)
   The barber pole is a visual illusion (the stripes only go round; they look as if they climb). With the sound
   on, it now has a twin you hear: a Shepard tone, a chord of tones an octave apart, every one sliding up, the
   top ones fading out as new ones fade in at the bottom, so it rises for ever and never gets any higher. Roger
   Shepard, 1964. Loudest under the pole, gone twelve metres away. ?shepard=0 off.
   ================================================================ */
const SHEP = { on: false, ph: 0, osc: [], g: [] };
window.__SHEP = SHEP;
function shepFrame(dt) {
  if (/shepard=0/.test(location.search) || !window.__CUTS || !CUTS.pole) return;
  const live = typeof AC !== 'undefined' && AC && AC.state === 'running' && oceanGain && oceanGain.gain.value > 0;
  const wp = CUTS.pole.getWorldPosition(_shp), d = camera.position.distanceTo(wp), want = live ? Math.max(0, 1 - d / 12) : 0;
  if (!SHEP.on) { if (want <= 0) return; SHEP.master = AC.createGain(); SHEP.master.gain.value = 0; SHEP.master.connect(AC.destination);
    for (let i = 0; i < 8; i++) { const o = AC.createOscillator(), g = AC.createGain(); o.type = 'sine'; g.gain.value = 0; o.connect(g); g.connect(SHEP.master); o.start(); SHEP.osc.push(o); SHEP.g.push(g); } SHEP.on = true; }
  SHEP.ph = (SHEP.ph + dt * 0.06) % 1; const t = AC.currentTime;
  for (let i = 0; i < 8; i++) { const oc = i + SHEP.ph, f = 27.5 * Math.pow(2, oc), x = (oc - 4) / 1.6, a = Math.exp(-x * x); SHEP.osc[i].frequency.setTargetAtTime(f, t, 0.02); SHEP.g[i].gain.setTargetAtTime(a * 0.12, t, 0.02); }
  SHEP.master.gain.setTargetAtTime(want * want * 0.5, t, 0.15);
}
const _shp = new V3();
window.__FRAMES.push(dt => { try { shepFrame(dt); } catch (e) { if (!SHEP.err) { SHEP.err = e; console.warn('v451 shepard', e); } } });
