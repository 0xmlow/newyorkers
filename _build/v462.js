/* ================================================================
   v462 THE LOOK: SURF THAT GLOWS (2026-11-24)
   On dark nights the breaking water at the beach and the white water round the rocks and the bridge legs glow a
   faint electric blue, the way plankton light up the surf on a warm night at Rockaway: only the foam, only after
   dark, strongest in the moving edge of each wave, gone when the moon is bright and gone by day. ?glowsurf=0 off.
   ================================================================ */
(function glowSurf() {
  if (!LOOK.on || /glowsurf=0/.test(location.search)) return;
  OCEAN.u.uBio = { value: 0 };
  const prev = MAT.water.onBeforeCompile;
  MAT.water.onBeforeCompile = sh => { prev(sh); sh.uniforms.uBio = OCEAN.u.uBio;
    sh.fragmentShader = sh.fragmentShader.replace('uniform float uFoam', 'uniform float uBio; uniform float uFoam')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n      totalEmissiveRadiance += vec3(0.05, 0.55, 0.9) * uBio * oFoam * (0.6 + 0.4 * sin(uTime * 2.3 + oAng * 40.0 + oR));');
  };
  MAT.water.customProgramCacheKey = () => 'mi-ocean-v462'; MAT.water.needsUpdate = true;
  window.__FRAMES.push(() => { try { const n = Math.min(1, Math.max(0, (L.lamps || 0) * 1.3 - 0.3)); OCEAN.u.uBio.value = n * 0.9;
    if (window.__COLLAR && COLLAR.mat) COLLAR.mat.uniforms.uCol.value.setRGB(0.9 - 0.75 * n, 0.93 - 0.35 * n, 0.92 + 0.08 * n); } catch (e) { } });
})();
