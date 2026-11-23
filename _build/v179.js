/* ================================================================
   v179 THE LOOK: SIDEWALK WEAR (2026-11-23)
   New York pavement is a record of everyone who walked it. The paving and the concrete now carry flattened gum
   (the black dots on every Manhattan sidewalk), old stains and darker patches, and the ring road gets the oil
   that drips down the middle of every lane and the tyre polish either side of it. All in the shader, in world
   space, so it never repeats. ?wear=0 off.
   ================================================================ */
(function sidewalkWear() {
  if (!LOOK.on || /wear=0/.test(location.search)) return;
  const H = `varying vec3 vSW; float swH(vec2 p){ return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
    float swN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(swH(i), swH(i + vec2(1, 0)), f.x), mix(swH(i + vec2(0, 1)), swH(i + vec2(1, 1)), f.x), f.y); }`;
  const inj = (m, body, key) => { if (!m) return; const prev = m.onBeforeCompile, pk = m.customProgramCacheKey ? m.customProgramCacheKey() : '';
    m.onBeforeCompile = (sh, r) => { if (prev) prev.call(m, sh, r);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vSW;').replace('#include <project_vertex>', '#include <project_vertex>\n{ vec4 sw = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nsw = instanceMatrix * sw;\n#endif\nvSW = (modelMatrix * sw).xyz; }');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + H).replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\n' + body); };
    m.customProgramCacheKey = () => pk + key; m.needsUpdate = true; };
  const walk = `{ vec2 p = vSW.xz; vec2 cell = floor(p / 0.45); vec2 o = vec2(swH(cell), swH(cell + 7.3)); float has = step(swH(cell + 3.1), 0.3);
      float r = 0.04 + 0.05 * swH(cell + 9.2); float gd = length(p - (cell + 0.2 + 0.6 * o) * 0.45); float gum = has * (1.0 - smoothstep(r * 0.7, r, gd));
      float st = smoothstep(0.62, 0.9, swN(p * 0.35)) * 0.3 + smoothstep(0.66, 0.95, swN(p * 1.3 + 4.0)) * 0.18;
      diffuseColor.rgb *= (1.0 - st) * (1.0 - 0.7 * gum); roughnessFactor = mix(roughnessFactor, 0.55, gum); }`;
  inj(MAT.pave, walk, '-wear179'); inj(MAT.conc, walk, '-wear179');
  inj(MAT.road, `{ float rr = length(vSW.xz), ang = atan(vSW.z, vSW.x); if (rr > 95.0 && rr < 105.0) { float oil = 0.0, pol = 0.0;
      for (int k = 0; k < 2; k++) { float lc = k == 0 ? 98.0 : 102.0; float d = rr - lc; oil += exp(-d * d / 0.18) * (0.45 + 0.55 * swN(vec2(ang * 260.0, lc))); pol += exp(-pow(abs(d) - 0.85, 2.0) / 0.05); }
      diffuseColor.rgb *= 1.0 - 0.35 * oil - 0.12 * pol; roughnessFactor = clamp(roughnessFactor - 0.25 * oil - 0.2 * pol, 0.25, 1.0); } }`, '-wear179');
})();
