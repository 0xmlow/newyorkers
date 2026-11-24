/* ================================================================
   v443 THE LOOK: A KEPT LAWN (2026-11-24)
   The lawn was one even green from edge to edge, the same tile repeated, which is how a game lawn looks and a
   real one never does. It is now a park the Parks Department mows: broad stripes laid north to south where the
   mower went up and back (the grass bent toward you reads lighter, away from you darker, so the stripes swap as
   you walk round them, like Sheep Meadow), and under the stripes a slow drift of richer and tireder greens,
   drier patches toward the sand and lusher ones by the paths. Seen from the air the island now has a lawn, not a
   green disc. ?mow=0 off.
   ================================================================ */
(function lookMow() {
  if (!LOOK.on || /mow=0/.test(location.search) || !MAT.grass) return;
  const m = MAT.grass, prev = m.onBeforeCompile, pk = m.customProgramCacheKey ? m.customProgramCacheKey() : '';
  m.onBeforeCompile = sh => { if (prev) prev(sh);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vMowW;').replace('#include <project_vertex>', '#include <project_vertex>\nvMowW = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vMowW;')
      .replace('#include <color_fragment>', `#include <color_fragment>
      { float mwBand = floor(vMowW.x / 3.6); float mwDir = mod(mwBand, 2.0) * 2.0 - 1.0;
        vec3 mwCam = normalize(cameraPosition - vMowW); float mwFace = mwDir * mwCam.z;
        float mwEdge = smoothstep(0.0, 0.25, fract(vMowW.x / 3.6)) * smoothstep(1.0, 0.75, fract(vMowW.x / 3.6));
        float mwK = 1.0 + 0.16 * mwFace * mix(0.6, 1.0, mwEdge);
        float mwM = sin(vMowW.x * 0.043 + 1.1) * cos(vMowW.z * 0.051 - 0.3) + 0.5 * sin(vMowW.x * 0.11 - vMowW.z * 0.09);
        float mwR = length(vMowW.xz); float mwDry = clamp(mwM * 0.35 + smoothstep(80.0, 103.0, mwR) * 0.45, 0.0, 1.0);
        diffuseColor.rgb *= mwK; diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(1.12, 1.05, 0.78), mwDry * 0.55);
        diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.88, 1.06, 0.9), clamp(-mwM, 0.0, 1.0) * 0.4); }`);
  };
  m.customProgramCacheKey = () => pk + '-mow443'; m.needsUpdate = true;
})();
