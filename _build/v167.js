/* ================================================================
   v167 THE LOOK: THE HARBOUR (2026-11-23)
   The sea was a Caribbean pool: turquoise over the island's shelf and rings of white water rolling in on every
   side of a round island, which from the air read as a target. New York Harbour is green grey and deep: this
   pass gives it the harbour's colour (dark slate offshore, a muted bottle green over the shallows), keeps the
   breaking white water to the beach on the south side only (the other sides are bulkhead and riprap, where the
   water just slaps), and makes the surface clearer and more mirror-like so the sky and the skyline sit in it.
   ================================================================ */
(function lookHarbour() {
  if (!LOOK.on) return;
  OCEAN.SHALLOW.set(0x3d6258); OCEAN.u.uShallow.value.set(0x3d6258);
  const prev = MAT.water.onBeforeCompile;
  MAT.water.onBeforeCompile = sh => { prev(sh);
    sh.fragmentShader = sh.fragmentShader
      .replace('float oOut = oR - uShore;', 'float oOut = oR - uShore; float oBeach = smoothstep(0.55, 0.85, sin(oAng));')
      .replace('float oFoam = clamp((oLine + oRoll * 0.85)', 'float oFoam = clamp((oLine * mix(0.25, 1.0, oBeach) + oRoll * 0.85 * oBeach)')
      .replace('diffuseColor.rgb = mix(diffuseColor.rgb, uShallow, oShallow * 0.85);', 'diffuseColor.rgb = mix(diffuseColor.rgb, uShallow, oShallow * 0.55);');
  };
  MAT.water.customProgramCacheKey = () => 'mi-ocean-v167'; MAT.water.roughness = 0.035; MAT.water.metalness = 0.1; MAT.water.envMapIntensity = 1.35; MAT.water.opacity = 0.96; MAT.water.normalScale.set(0.42, 0.42); MAT.water.needsUpdate = true;
  // the weather code resets roughness every frame from WX.wet; keep the clear surface as its floor
  window.__FRAMES.push(() => { try { MAT.water.roughness = Math.max(0.035, 0.035 + 0.2 * (WX.wet || 0)); } catch (e) { } });
})();
