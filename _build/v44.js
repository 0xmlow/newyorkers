/* ================================================================
   v44 SMOOTH ON EVERY SCREEN (2026-11-22)
   A quality governor: it watches how late frames arrive and, when the island cannot keep up, steps down one tier at
   a time (sharpness, then ambient occlusion and god rays, then live shadows), and steps back up when there is room.
   ?lite=1 starts at the lightest tier, ?hq=1 pins the highest. Typing LITE or HQ does the same from inside. People
   who ask their system for reduced motion get no head bob and no drone twinkle.
   ================================================================ */
const GOV = { tier: 0, max: 3, slow: 0, fast: 0, t: 0, gap: 16.7, last: 0, pin: /hq=1/.test(location.search) ? 0 : null, log: [] };
window.__GOV = GOV;
GOV.calm = matchMedia('(prefers-reduced-motion: reduce)').matches; window.__CALM = GOV.calm;
GOV.basePR = Math.min(devicePixelRatio, 1.5);
function govApply(t) {
  t = Math.max(0, Math.min(GOV.max, t)); if (t === GOV.tier && GOV.applied) return; GOV.tier = t; GOV.applied = true; GOV.log.push([Math.round(performance.now() / 1000), t]);
  const pr = [GOV.basePR, Math.min(GOV.basePR, 1.15), Math.min(GOV.basePR, 1), Math.min(GOV.basePR, 0.85)][t];
  try { if (Math.abs(renderer.getPixelRatio() - pr) > 0.01) { renderer.setPixelRatio(pr); renderer.setSize(innerWidth, innerHeight); if (POST.comp) { if (POST.comp.setPixelRatio) POST.comp.setPixelRatio(pr); POST.comp.setSize(innerWidth, innerHeight); } } } catch (e) { }
  try { if (t >= 2) { if (AO.on) { GOV.aoWas = true; AO.on = false; POST.grade.uniforms.uAO.value = 0; } } else if (GOV.aoWas && !AO.on) { AO.on = true; POST.grade.uniforms.uAO.value = 0.9; GOV.aoWas = false; } } catch (e) { }
  try { if (window.__RAYS && __RAYS.pass) __RAYS.pass.enabled = t < 2; } catch (e) { }
  try { renderer.shadowMap.autoUpdate = t < 3; if (t >= 3) renderer.shadowMap.needsUpdate = true; } catch (e) { }
}
function govFrame(dt) {
  const now = performance.now(), gap = GOV.last ? now - GOV.last : 16.7; GOV.last = now;
  if (window.__RAYS && __RAYS.pass && __RAYS.pass.enabled !== (GOV.tier < 2)) __RAYS.pass.enabled = GOV.tier < 2;   // the rays pass is made late
  if (!state.started || (window.__POWER && __POWER.blurred) || document.hidden || gap > 250) return;
  const budget = window.__powerBudget ? Math.max(16.7, __powerBudget()) : 16.7; GOV.gap += (gap / budget - GOV.gap) * 0.05;   // 1.0 = on time
  GOV.t += dt; if (GOV.tier >= 3) GOV.shT = (GOV.shT || 0) + dt, GOV.shT > 0.5 && (GOV.shT = 0, renderer.shadowMap.needsUpdate = true);
  if (GOV.pin !== null || GOV.t < 8) return;
  if (GOV.gap > 1.45) { GOV.slow += dt; GOV.fast = 0; } else if (GOV.gap < 1.08) { GOV.fast += dt; GOV.slow = 0; } else { GOV.slow = Math.max(0, GOV.slow - dt); GOV.fast = 0; }
  if (GOV.slow > 3 && GOV.tier < GOV.max) { govApply(GOV.tier + 1); GOV.slow = 0; GOV.gap = 1.2; GOV.t = 5; if (GOV.tier === 2) toast('MEME ISLAND EASED OFF A LITTLE SO IT RUNS SMOOTHLY HERE. TYPE HQ FOR FULL QUALITY.'); }
  else if (GOV.fast > 12 && GOV.tier > (GOV.floor || 0)) { govApply(GOV.tier - 1); GOV.fast = 0; GOV.t = 5; }
}
if (/lite=1/.test(location.search)) { GOV.floor = 3; govApply(3); } else if (isMobile) { GOV.floor = 1; govApply(1); }
const govLite = () => { GOV.pin = null; GOV.floor = 3; govApply(3); toast('LITE MODE: LIGHTER SHADOWS AND EFFECTS, SAME ISLAND.'); };
['lite', 'lowpower', 'potato'].forEach(w => EGGS[w] = govLite);   // settings, not secrets: never counted
const govHQ = () => { GOV.pin = 0; GOV.floor = 0; govApply(0); toast('FULL QUALITY, PINNED. TYPE LITE IF IT STUTTERS.'); };
['hq', 'ultra', 'fullquality'].forEach(w => EGGS[w] = govHQ);
window.__FRAMES.push(dt => { try { govFrame(dt); } catch (e) { if (!GOV.err) { GOV.err = e; console.warn('v44 gov', e); } } });
