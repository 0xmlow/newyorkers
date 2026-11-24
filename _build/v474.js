/* ================================================================
   v474 THE LOOK: WHITECAPS (2026-11-24)
   When the wind is up the harbour breaks white far out, not only on the beach: scattered whitecaps flicker on
   the crests across the open water, each a few metres long, forming and dying in a couple of seconds, thicker in
   rain and storms, none on a calm clear day. From the air the sea stops being a smooth sheet. ?whitecaps=0 off.
   ================================================================ */
(function whitecaps() {
  if (!LOOK.on || /whitecaps=0/.test(location.search)) return;
  OCEAN.u.uCaps = { value: 0 };
  const prev = MAT.water.onBeforeCompile;
  MAT.water.onBeforeCompile = sh => { prev(sh); sh.uniforms.uCaps = OCEAN.u.uCaps;
    sh.fragmentShader = sh.fragmentShader.replace('uniform float uFoam', 'uniform float uCaps; uniform float uFoam')
      .replace('diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.95, 0.94), oFoam);', `{ vec2 cc = floor(vOW.xz / 7.0); float ch = fract(sin(dot(cc, vec2(41.3, 17.9))) * 9131.7); float life = fract(uTime * 0.23 + ch * 7.0);
        vec2 cl = fract(vOW.xz / 7.0) - 0.5; float shape = smoothstep(0.32, 0.0, length(cl * vec2(1.0, 2.6))) * smoothstep(0.0, 0.2, life) * smoothstep(1.0, 0.45, life);
        float caps = shape * step(1.0 - uCaps * 0.35, ch) * smoothstep(0.1, 0.35, vCrest + oNz * 0.3) * smoothstep(uShore + 20.0, uShore + 60.0, oR) * smoothstep(0.35, 0.65, oNz + 0.2);
        oFoam = max(oFoam, caps * 0.85); }
      diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.93, 0.95, 0.94), oFoam);`);
  };
  MAT.water.customProgramCacheKey = () => 'mi-ocean-v474'; MAT.water.needsUpdate = true;
  window.__FRAMES.push(() => { try { const W = WX.override || WX.cur; OCEAN.u.uCaps.value = Math.min(1, (W === 'CLEAR' ? 0.15 : W === 'SCATTERED' ? 0.4 : 0.7) + (WX.wet || 0) * 0.5); } catch (e) { } });
})();
