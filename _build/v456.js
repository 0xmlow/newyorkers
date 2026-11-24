/* ================================================================
   v456 THE LOOK: THE EL IN PAINTED IRON (2026-11-24)
   The viaduct that rings the harbour is in almost every outdoor frame, and it read as a white plastic toy track:
   its steel was 70 percent metallic, so it mirrored the bright painted sky and came out white. A New York el is
   painted iron, dark green grey, chalky where the sun bakes it, rust bleeding from every rivet line. The girders,
   the pillars and the deck are now that: a painted, mostly non metallic finish in the el's colour, a darker
   underside, rust streaks running down from the deck in world space, and only the running rails keep a polished
   steel shine. ?elpaint=0 off.
   ================================================================ */
(function elPaint() {
  if (!LOOK.on || /elpaint=0/.test(location.search)) return;
  const seen = new Set();
  scene.traverse(o => { if (!o.isMesh || !o.material || Array.isArray(o.material)) return; const m = o.material; if (seen.has(m) || !m.color) return; const h = m.color.getHexString();
    if ((h === '3d4a52' && m.metalness > 0.6) || (h === '5a4436' && m.metalness > 0.3)) { seen.add(m); const rusty = h === '5a4436';
      m.color.set(rusty ? 0x4a3a2e : 0x34453d); m.metalness = rusty ? 0.15 : 0.22; m.roughness = rusty ? 0.85 : 0.62; m.envMapIntensity = 0.55;
      const prev = m.onBeforeCompile, pk = m.customProgramCacheKey ? m.customProgramCacheKey() : '';
      m.onBeforeCompile = sh => { if (prev) prev(sh);
        sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vElW; varying vec3 vElN;').replace('#include <project_vertex>', '#include <project_vertex>\nvec4 elw = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nelw = instanceMatrix * elw;\n#endif\nelw = modelMatrix * elw; vElW = elw.xyz; vElN = normalize(mat3(modelMatrix) * objectNormal);');
        sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vElW; varying vec3 vElN;')
          .replace('#include <color_fragment>', `#include <color_fragment>
          { float ea = atan(vElW.z, vElW.x) * 165.0; float streak = smoothstep(0.55, 0.95, sin(ea * 2.3 + sin(ea * 0.31) * 3.0) * 0.5 + 0.5) * smoothstep(12.5, 8.0, vElW.y) * smoothstep(0.0, 6.0, vElW.y);
            float chalk = smoothstep(0.3, 0.9, vElN.y) * 0.25; float under = smoothstep(-0.2, -0.8, vElN.y);
            diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.36, 0.2, 0.11), streak * 0.45); diffuseColor.rgb *= (1.0 + chalk) * (1.0 - under * 0.45); }`);
      };
      m.customProgramCacheKey = () => pk + '-elpaint456'; m.needsUpdate = true; } });
})();
