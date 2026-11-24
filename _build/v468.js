/* ================================================================
   v468 THE LOOK: THE WET LINE (2026-11-24)
   Everything that stands in the harbour now carries the mark of the water: a band of darker, glossier stone or
   steel from the waterline up to where the waves reach, a thin green line of weed at the bottom of it, so the
   rocks, the bridge legs and the piles look as if they have been in the sea for years instead of placed on top of
   it. Applied to the materials of whatever the v455 collars found. ?wetline=0 off.
   ================================================================ */
const WETL = { done: false };
window.__WETL = WETL;
function wetLineApply() {
  const mats = new Set(), b = new THREE.Box3(), M = new THREE.Matrix4(); scene.updateMatrixWorld(true);
  scene.traverse(o => { if (!o.isMesh || !o.visible || !o.geometry || o.isSkinnedMesh || !o.material || Array.isArray(o.material) || !o.material.isMeshStandardMaterial) return; if (!o.geometry.boundingBox) o.geometry.computeBoundingBox(); const n = o.isInstancedMesh ? Math.min(o.count, 200) : 1;
    for (let i = 0; i < n; i++) { if (o.isInstancedMesh) { o.getMatrixAt(i, M); M.premultiply(o.matrixWorld); } else M.copy(o.matrixWorld); b.copy(o.geometry.boundingBox).applyMatrix4(M); if (b.min.y < -0.15 && b.max.y > 0.25 && Math.hypot((b.min.x + b.max.x) / 2, (b.min.z + b.max.z) / 2) > SHORE - 2) { mats.add(o.material); break; } } });
  mats.forEach(m => { if (m.userData.wetline || m === MAT.water) return; m.userData.wetline = true; const prev = m.onBeforeCompile, pk = m.customProgramCacheKey ? m.customProgramCacheKey.bind(m) : null;
    m.onBeforeCompile = (sh, r) => { if (prev) prev(sh, r);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vWlW;').replace('#include <project_vertex>', '#include <project_vertex>\nvec4 wlw = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nwlw = instanceMatrix * wlw;\n#endif\nvWlW = (modelMatrix * wlw).xyz;');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vWlW;')
        .replace('#include <color_fragment>', '#include <color_fragment>\nfloat wlR = length(vWlW.xz); float wlK = step(' + (SHORE - 2).toFixed(1) + ', wlR) * (1.0 - smoothstep(0.25, 0.75 + 0.15 * sin(vWlW.x * 3.1 + vWlW.z * 2.3), vWlW.y)); float wlG = wlK * (1.0 - smoothstep(-0.05, 0.12, vWlW.y));\ndiffuseColor.rgb *= mix(1.0, 0.52, wlK); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.08, 0.12, 0.05), wlG * 0.7);')
        .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.18, wlK * (1.0 - wlG));'); };
    m.customProgramCacheKey = () => (pk ? pk() : '') + '|wetline468'; m.needsUpdate = true; });
  WETL.n = mats.size;
}
window.__FRAMES.push(() => { try { if (WETL.done || !LOOK.on || /wetline=0/.test(location.search) || !window.__COLLAR || COLLAR.done < 2400) return; WETL.done = true; wetLineApply(); } catch (e) { WETL.err = e; WETL.done = true; console.warn('v468', e); } });
