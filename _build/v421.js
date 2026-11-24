/* ================================================================
   v421 RAIN ON THE BRASS (2026-11-24)
   When it rains, the 577 brass plaques of the Memes Walk go wet with the paving: the brass darkens a little and
   turns glassy, the enamel cards shine, and the lamps and sky slide across them; they dry with the puddles (v368).
   ================================================================ */
(function wetBrass() {
  if (!window.__MWALK || !MWALK.ims) return; MWALK.wet = { value: 0 };
  MWALK.ims.forEach(im => { const m = im.material, prev = m.onBeforeCompile; m.onBeforeCompile = (sh, r) => { prev(sh, r); sh.uniforms.uWet = MWALK.wet;
    sh.fragmentShader = sh.fragmentShader.replace('uniform float uWave;', 'uniform float uWave, uWet;').replace('roughnessFactor = plR;', 'roughnessFactor = mix(plR, 0.06, uWet); diffuseColor.rgb *= 1.0 - 0.25 * uWet;'); };
    m.customProgramCacheKey = () => 'mwalk-wet'; m.needsUpdate = true; });
})();
window.__FRAMES.push(() => { try { if (MWALK.wet && window.__PUD) MWALK.wet.value = Math.min(1, PUD.w || 0); } catch (e) { } });
