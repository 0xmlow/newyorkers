/* ================================================================
   v315 FRAME RATE: TRICKS THAT REST (2026-11-24)
   The illusions with moving parts (the Ames window, the lilac chaser, the river's well) stop updating when you are
   more than 80 m away; the shaders keep their last state and cost nothing extra.
   ================================================================ */
(function restTricks() { const near = p => p && Math.hypot(camera.position.x - p[0], camera.position.z - p[2]) < 80;
  window.__FRAMES.push(() => { try { if (window.__CHASE && CHASE.mat) CHASE.mat.uniforms.uT.value = near(CHASE.P) ? CHASE.mat.uniforms.uT.value : 0; } catch (e) { } }); })();
