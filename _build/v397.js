/* ================================================================
   v397 THE LOOK: GRASS THAT CATCHES THE LIGHT (2026-11-24)
   The lawn's blades (v170) are two sided, and the lighting lit every blade's back face as if it faced away from
   the sun, so half the field rendered near black: the dark spiky look at eye level in every shot. Now both faces
   take the lit side's light, and a blade with the sun behind it glows a little at the tip the way real grass
   does (light through a thin leaf), the base colour comes up from near black to a deep green, and broad patches
   drift between lush and a touch of dry straw so the lawn is not one green. ?grasslight=0 off.
   ================================================================ */
(function grassLight() {
  if (!window.__LAWN && typeof LAWN === 'undefined') return; if (/grasslight=0/.test(location.search)) return;
  const W = typeof LAWN !== 'undefined' ? LAWN : window.__LAWN; if (!W || !W.mat || !W.u) return;
  W.u.uBase.value.set(0x2b4718); W.u.uTip.value.set(0xa2bd58); W.u.uSun = W.u.uSun || { value: new THREE.Vector3(0.5, 0.7, 0.3) }; W.u.uDry = { value: new THREE.Color(0xb3a25e) };
  const prev = W.mat.onBeforeCompile;
  W.mat.onBeforeCompile = sh => { prev(sh); sh.uniforms.uDry = W.u.uDry; sh.uniforms.uSun = W.u.uSun;
    sh.vertexShader = sh.vertexShader.replace('uniform vec3 uBase, uTip;', 'uniform vec3 uBase, uTip, uDry, uSun; varying float vTipK; varying float vBack;')
      .replace('vGrass = mix(uBase,', 'float dry = smoothstep(0.35, 0.85, 0.5 + 0.5 * sin(wxz.x * 0.11 + sin(wxz.y * 0.07) * 2.0) * sin(wxz.y * 0.09 + 1.3)); vTipK = v; vec3 tipC = mix(uTip, uDry, dry * 0.55);\n        vBack = clamp(-dot(normalize(vec3(dir.x, 0.25, dir.y)), normalize(uSun)), 0.0, 1.0);\n        vGrass = mix(uBase,')
      .replace('uTip * (0.8 + 0.4 * aRnd.w)', 'tipC * (0.8 + 0.4 * aRnd.w)');
    sh.fragmentShader = sh.fragmentShader.replace('varying vec3 vGrass;', 'varying vec3 vGrass; varying float vTipK; varying float vBack;')
      .split(': vLightBack').join(': vLightFront').split(': vIndirectBack').join(': vIndirectFront')
      .replace('#include <emissivemap_fragment>', '#include <emissivemap_fragment>\n totalEmissiveRadiance += vGrass * vec3(1.0, 1.05, 0.7) * 0.22 * vBack * vTipK * vTipK;');
  };
  W.mat.customProgramCacheKey = () => 'mi-lawn-v397b'; W.mat.needsUpdate = true;
})();
window.__FRAMES.push(() => { try { const W = typeof LAWN !== 'undefined' ? LAWN : null; if (!W || !W.u || !W.u.uSun) return; W.u.uSun.value.copy(sun.position).sub(sun.target.position).normalize(); } catch (e) { } });
