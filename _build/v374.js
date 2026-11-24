/* ================================================================
   v374 REALISM: SNOW SETTLES (2026-11-24)
   When the island's weather snows, the river, the roofs and the plinths do not stay clean: a white layer settles on
   every surface that faces up, in the shader, thickening while it snows and melting after. ?snowlay=0 off.
   ================================================================ */
const SNOWL = { k: 0, mats: new Set() };
window.__SNOWL = SNOWL;
(function snowLayer() {
  if (!LOOK.on || /snowlay=0/.test(location.search) || typeof WEATH === 'undefined') return;
  SNOWL.u = { value: 0 };
  const add = m => { if (!m || SNOWL.mats.has(m) || !m.isMeshStandardMaterial) return; SNOWL.mats.add(m); const prev = m.onBeforeCompile, pk = m.customProgramCacheKey ? m.customProgramCacheKey() : '';
    m.onBeforeCompile = (sh, r) => { if (prev) prev.call(m, sh, r); sh.uniforms.uSnowL = SNOWL.u; sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nuniform float uSnowL;').replace('#include <lights_fragment_begin>', 'float snowUp = smoothstep(0.55, 0.85, (inverseTransformDirection(normal, viewMatrix)).y) * uSnowL; diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.92, 0.94, 0.97), snowUp); roughnessFactor = mix(roughnessFactor, 0.85, snowUp);\n#include <lights_fragment_begin>'); };
    m.customProgramCacheKey = () => pk + '-snow374'; m.needsUpdate = true; };
  SNOWL.add = add; setTimeout(() => { try { WEATH.done.forEach(add); Object.values(FACM).forEach(add); } catch (e) { } }, 30000);
})();
window.__FRAMES.push(dt => { try { if (!SNOWL.u || typeof WX === 'undefined') return; const tgt = WX.snow > 0.3 ? 1 : 0; SNOWL.k += (tgt - SNOWL.k) * Math.min(1, dt * (tgt ? 0.02 : 0.01)); SNOWL.u.value = SNOWL.k * 0.9; } catch (e) { } });
