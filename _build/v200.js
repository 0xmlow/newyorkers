/* ================================================================
   v200 THE LOOK: WIND ON THE SAND (2026-11-23)
   The beach sand was one smooth tone. Wind lays sand into ripples a hand's width apart, crests catching the low
   sun and troughs holding shadow, broken by footfall into patches; damp sand toward the water is darker and
   smoother. The sand shader now draws ripples in its normal and its colour, running across the prevailing wind.
   ?ripples=0 off.
   ================================================================ */
(function sandRipples() {
  if (!LOOK.on || /ripples=0/.test(location.search) || !MAT.sand) return; const m = MAT.sand, prev = m.onBeforeCompile, pk = m.customProgramCacheKey ? m.customProgramCacheKey() : '';
  m.onBeforeCompile = (sh, r) => { if (prev) prev.call(m, sh, r);
    sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vRP;').replace('#include <project_vertex>', '#include <project_vertex>\n{ vec4 rp = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\nrp = instanceMatrix * rp;\n#endif\nvRP = (modelMatrix * rp).xyz; }');
    sh.fragmentShader = sh.fragmentShader.replace('#include <common>', `#include <common>
      varying vec3 vRP; float rpH(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5); }
      float rpN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(rpH(i), rpH(i + vec2(1, 0)), f.x), mix(rpH(i + vec2(0, 1)), rpH(i + vec2(1, 1)), f.x), f.y); }
      float rpW(vec2 p){ float w = dot(p, vec2(0.86, 0.5)) * 9.5 + rpN(p * 0.6) * 3.0 + rpN(p * 2.2) * 0.8; return sin(w) * 0.5 + 0.5; }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        float rpm = smoothstep(0.35, 0.75, rpN(vRP.xz * 0.18)) * smoothstep(0.75, 1.1, vRP.y + 0.9); float rw = rpW(vRP.xz);
        diffuseColor.rgb *= 1.0 + (rw - 0.5) * 0.22 * rpm; float damp = 1.0 - smoothstep(-0.55, 0.35, vRP.y); diffuseColor.rgb *= 1.0 - 0.28 * damp;`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        { float e = 0.02; float h0 = rpW(vRP.xz), hx = rpW(vRP.xz + vec2(e, 0.0)), hz = rpW(vRP.xz + vec2(0.0, e)); float rpm2 = smoothstep(0.35, 0.75, rpN(vRP.xz * 0.18)) * smoothstep(0.75, 1.1, vRP.y + 0.9);
          vec3 dn = vec3(-(hx - h0) / e, 0.0, -(hz - h0) / e) * 0.012 * rpm2; normal = normalize(normal + (viewMatrix * vec4(dn, 0.0)).xyz); }`); };
  m.customProgramCacheKey = () => pk + '-ripple200'; m.needsUpdate = true;
})();
