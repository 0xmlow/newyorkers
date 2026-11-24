/* ================================================================
   v441 THE LOOK: SUN ON THE WATER (2026-11-24)
   Look toward a low sun across real water and the path of light is not a smooth smear, it is thousands of
   separate sparks, each one a wave facet tilted just right for an instant. The harbour now glitters: every
   facet (a cell of a fine moving grid, its tilt jittered by the swell) flashes when it would mirror the sun into
   your eye, brightest in the golden hour, thinning to a scatter at noon, silver under a high moon, and gone under
   cloud, fog and rain. The bloom pass turns each spark into a point of light. ?glitter=0 off.
   ================================================================ */
(function lookGlitter() {
  if (!LOOK.on || /glitter=0/.test(location.search)) return;
  OCEAN.u.uGlint = { value: 1 };
  const prev = MAT.water.onBeforeCompile;
  MAT.water.onBeforeCompile = sh => { prev(sh); sh.uniforms.uGlint = OCEAN.u.uGlint;
    sh.fragmentShader = sh.fragmentShader.replace('uniform float uFoam;', 'uniform float uFoam, uGlint;')
      .replace('totalEmissiveRadiance += uShallow * uSunCol * oSSS * 0.35 * (1.0 - oFoam);', `totalEmissiveRadiance += uShallow * uSunCol * oSSS * 0.35 * (1.0 - oFoam);
      { vec2 gc = floor(vOW.xz * 3.2); float gt = floor(uTime * 9.0 + fract(sin(dot(gc, vec2(7.13, 3.71))) * 91.7) * 9.0);
        float gh1 = fract(sin(dot(gc + gt, vec2(12.9898, 78.233))) * 43758.5453), gh2 = fract(sin(dot(gc - gt, vec2(39.346, 11.135))) * 24634.6345);
        vec3 gN = normalize(oceanN + vec3(gh1 - 0.5, 0.0, gh2 - 0.5) * 0.5);
        vec3 gR = reflect(oV, gN); float gS = max(dot(gR, normalize(uSunDir)), 0.0);
        float gl = pow(gS, 650.0) * step(0.42, gh1) * smoothstep(0.0, 0.06, uSunDir.y) * uGlint * (1.0 - oFoam) * (1.0 - oShallow * 0.6);
        totalEmissiveRadiance += uSunCol * gl * 9.0; }`);
  };
  MAT.water.customProgramCacheKey = () => 'mi-ocean-v441'; MAT.water.needsUpdate = true;
  window.__FRAMES.push(() => { try { const W = WX.override || WX.cur; OCEAN.u.uGlint.value = (W === 'CLEAR' ? 1 : W === 'SCATTERED' ? 0.6 : 0.05) * (1 - Math.max(WX.fog || 0, WX.wet || 0)); } catch (e) { } });
})();
