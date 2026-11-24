/* ================================================================
   v377 FRAME RATE: NO HITCH ON THE FIRST LOOK (2026-11-24)
   Each new material (the river, the murals, the illusions, the triplanar kit, the snow term) compiles its shader the
   first time it comes into view, which is a visible hitch the first time you turn toward it. Once the island has
   settled, every program is compiled up front in one go while the welcome screen is still up, so turning round never
   stutters.
   ================================================================ */
const WARM = { done: false };
window.__WARM = WARM;
window.__FRAMES.push(dt => { try { if (WARM.done) return; WARM.t = (WARM.t || 0) + dt; if (WARM.t < 16) return; WARM.done = true; const vis = []; scene.traverse(o => { if (o.isMesh && !o.visible) { vis.push(o); o.visible = true; } }); const t0 = performance.now(); renderer.compile(scene, camera); WARM.ms = Math.round(performance.now() - t0); vis.forEach(o => o.visible = false); } catch (e) { WARM.done = true; } });
