/* ================================================================
   v287 THE LOOK: REAL MATERIAL ON THE KIT (2026-11-24)
   Every piece of the facade kit since v173 (cornices, sills, lintels, kerbs, buttresses, rails, steel, timber,
   enamel) was a flat colour with a shader mottle. Up close that reads as plastic. Each kit material now samples a
   real scanned texture in world space from three directions at once (triplanar, so there are no seams and no UVs
   needed): limestone and brownstone on the stone, board formed concrete on the concrete, brushed and pitted metal on
   the steel, grain on the timber. The texture modulates colour and roughness only, keeping each material's own hue,
   so the island's palette is unchanged. ?kittex=0 turns it off.
   ================================================================ */
const KTEX = { n: 0, tex: {} };
window.__KTEX = KTEX;
function kitTex(m, name, scale, k, rk) {
  if (!m || m.userData.kitTex) return; m.userData.kitTex = name; KTEX.n++;
  const t = KTEX.tex[name] || (KTEX.tex[name] = tex('assets/' + name + '_c.webp', 1)); t.wrapS = t.wrapT = THREE.RepeatWrapping;
  const prev = m.onBeforeCompile, prevKey = m.customProgramCacheKey ? m.customProgramCacheKey() : '';
  m.onBeforeCompile = (sh, r) => { if (prev) prev.call(m, sh, r); sh.uniforms.uKT = { value: t }; sh.uniforms.uKS = { value: scale }; sh.uniforms.uKK = { value: k }; sh.uniforms.uKR = { value: rk };
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vKW; varying vec3 vKN;').replace('#include <project_vertex>', `#include <project_vertex>
      { vec4 kw = vec4(transformed, 1.0); vec3 kn = objectNormal;
      #ifdef USE_INSTANCING
        kw = instanceMatrix * kw; kn = mat3(instanceMatrix) * kn;
      #endif
        kw = modelMatrix * kw; vKW = kw.xyz; vKN = normalize(mat3(modelMatrix) * kn); }`);
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\nvarying vec3 vKW; varying vec3 vKN; uniform sampler2D uKT; uniform float uKS, uKK, uKR;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 kb = pow(abs(normalize(vKN)), vec3(4.0)); kb /= (kb.x + kb.y + kb.z + 1e-4);
        vec3 kc = texture2D(uKT, vKW.zy * uKS).rgb * kb.x + texture2D(uKT, vKW.xz * uKS).rgb * kb.y + texture2D(uKT, vKW.xy * uKS).rgb * kb.z;
        float kl = dot(kc, vec3(0.299, 0.587, 0.114)); vec3 kd = kc / max(0.04, kl) * (kl / 0.45);
        diffuseColor.rgb *= mix(vec3(1.0), clamp(kd, 0.0, 2.2), uKK);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = clamp(roughnessFactor * mix(1.0, 1.35 - kl * 0.8, uKR), 0.04, 1.0);'); };
  m.customProgramCacheKey = () => prevKey + '-kt287' + name; m.needsUpdate = true;
}
window.kitTex = kitTex;
(function kitMaterials() {
  if (!FAC_ON || /kittex=0/.test(location.search)) return;
  const A = (keys, name, s, k, rk) => keys.forEach(key => { if (FACM[key] && !FACM[key].transparent) kitTex(FACM[key], name, s, k, rk); });
  A(['stone', 'stoneD', 'lime', 'limeD', 'sand', 'sandD'], 'lime', 0.45, 0.55, 0.6);
  A(['conc', 'concJ', 'curbA', 'skConc', 'skConcD', 'gravel'], 'conc', 0.35, 0.6, 0.6);
  A(['frame', 'white'], 'lime', 0.8, 0.22, 0.3);
  A(['steel', 'galv', 'iron', 'inox', 'primer', 'rail', 'angle', 'bin', 'nsGreen', 'green', 'louv', 'kick'], 'metal', 0.6, 0.35, 0.7);
  A(['stud', 'benchW', 'board', 'lgWood'], 'wood', 0.5, 0.55, 0.5);
  A(['brickP'], 'brick', 0.5, 0.6, 0.4);
  // and the stone the old buildings are made of
  ['stone', 'conc', 'bone', 'sandstone', 'bankstone', 'white'].forEach(k => { const m = MAT[k]; if (m && !m.map && !m.transparent) kitTex(m, k === 'conc' || k === 'bone' ? 'conc' : 'lime', 0.3, 0.45, 0.5); });
})();
