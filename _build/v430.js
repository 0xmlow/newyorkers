/* ================================================================
   v430 THE MEMES WALK AT NIGHT (2026-11-24)
   After dark the enamel cards on the walk give back a little light, as if lit from below the glass, so from the
   promenade at night and from the air the ring of 577 reads as a faint necklace round the river.
   ================================================================ */
(function walkNight() {
  if (!window.__MWALK || !MWALK.ims) return; MWALK.nightU = { value: 0 };
  MWALK.ims.forEach(im => { const m = im.material, prev = m.onBeforeCompile; m.onBeforeCompile = (sh, r) => { prev(sh, r); sh.uniforms.uWN = MWALK.nightU;
    sh.fragmentShader = sh.fragmentShader.replace('uniform float uWave, uWet;', 'uniform float uWave, uWet, uWN;').replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n if (plM < 0.5) totalEmissiveRadiance += diffuseColor.rgb * 0.55 * uWN;'); };
    m.customProgramCacheKey = () => 'mwalk-night'; m.needsUpdate = true; });
})();
window.__FRAMES.push(() => { try { if (MWALK.nightU) MWALK.nightU.value = Math.min(1, (L.lamps || 0) * 1.3); } catch (e) { } });
