/* ================================================================
   v178 THE LOOK: WHERE GROUND MEETS GROUND (2026-11-23)
   Grass met paving, plinths, buildings and paths along a hard computer line. Nothing real does that: the lawn
   wears down to bare soil where people step off the path and where it meets a wall, and the paving collects dirt
   and moss in its joints along the grass. The lawn's own top down map (v170) already knows where every edge is;
   the grass and the paving now read it, eight samples round each pixel, and blend in a band of trodden soil on
   the grass side and grime on the paving side, broken up by noise so no edge is a line. Desktop; ?edges=0 off.
   ================================================================ */
const GEDGE = { u: { uGMask: { value: null }, uGOn: { value: 0 } } };
window.__GEDGE = GEDGE;
(function groundEdges() {
  if (!LOOK.on || isMobile || /edges=0/.test(location.search) || !window.__LAWN || !LAWN.rt) return; GEDGE.u.uGMask.value = LAWN.rt.texture;
  const GL = `varying vec3 vGE; uniform sampler2D uGMask; uniform float uGOn;
    vec2 geUV(vec2 p){ return vec2((p.x + 110.0) / 220.0, (110.0 - p.y) / 220.0); }
    float geH(vec2 p){ return fract(sin(dot(p, vec2(41.3, 289.1))) * 43758.5); }
    float geN(vec2 p){ vec2 i = floor(p), f = fract(p); f = f * f * (3.0 - 2.0 * f); return mix(mix(geH(i), geH(i + vec2(1, 0)), f.x), mix(geH(i + vec2(0, 1)), geH(i + vec2(1, 1)), f.x), f.y); }
    float geRing(vec2 p, float r){ float s = 0.0; for (int i = 0; i < 8; i++) { float a = float(i) * 0.7854 + 0.3; s += texture2D(uGMask, geUV(p + vec2(cos(a), sin(a)) * r)).r; } return s / 8.0; }`;
  const add = (m, grass) => { if (!m) return; const prev = m.onBeforeCompile, pk = m.customProgramCacheKey ? m.customProgramCacheKey() : '';
    m.onBeforeCompile = (sh, r) => { if (prev) prev.call(m, sh, r); Object.assign(sh.uniforms, GEDGE.u);
      sh.vertexShader = sh.vertexShader.replace('#include <common>', '#include <common>\nvarying vec3 vGE;').replace('#include <project_vertex>', '#include <project_vertex>\n{ vec4 gw = vec4(transformed, 1.0);\n#ifdef USE_INSTANCING\ngw = instanceMatrix * gw;\n#endif\nvGE = (modelMatrix * gw).xyz; }');
      sh.fragmentShader = sh.fragmentShader.replace('#include <common>', '#include <common>\n' + GL).replace('#include <color_fragment>', `#include <color_fragment>
        if (uGOn > 0.5 && abs(vGE.x) < 109.0 && abs(vGE.z) < 109.0) { vec2 p = vGE.xz; float c = texture2D(uGMask, geUV(p)).r; float n1 = geRing(p, 0.42), n2 = geRing(p, 1.0); float nz = geN(p * 2.3) * 0.6 + geN(p * 7.1) * 0.4;
          ${grass ? `if (c > 0.5) { float e = 1.0 - (n1 * 0.6 + n2 * 0.4); float soil = smoothstep(0.08 + 0.25 * nz, 0.55 + 0.2 * nz, e); diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.2, 0.15, 0.1) * (0.75 + 0.5 * nz), soil * 0.8); diffuseColor.rgb *= 1.0 - 0.18 * smoothstep(0.0, 0.5, 1.0 - n2) * (1.0 - soil); }`
                  : `if (c < 0.5) { float g = n1 * 0.65 + n2 * 0.35; float dirt = smoothstep(0.05, 0.6, g) * (0.55 + 0.45 * nz); diffuseColor.rgb = mix(diffuseColor.rgb, diffuseColor.rgb * vec3(0.58, 0.6, 0.48), dirt * 0.75); }`} }`);
    };
    m.customProgramCacheKey = () => pk + '-gedge178'; m.needsUpdate = true; };
  add(MAT.grass, true); add(MAT.pave, false); if (MAT.conc) add(MAT.conc, false);
})();
window.__FRAMES.push(() => { try { if (window.__LAWN && GEDGE.u.uGMask.value) GEDGE.u.uGOn.value = LAWN.shots > 0 ? 1 : 0; } catch (e) { } });
// the blades thin out near every edge so the trodden band shows between the lawn and the paving
try { if (window.__LAWN && LAWN.mat && GEDGE.u.uGMask.value) { const prevL = LAWN.mat.onBeforeCompile;
  LAWN.mat.onBeforeCompile = (sh, r) => { prevL(sh, r); sh.vertexShader = sh.vertexShader.replace('float on = mk.r * step(0.5, mk2.r) * step(0.5, mk3.r);', `float on = mk.r * step(0.5, mk2.r) * step(0.5, mk3.r);
    { float rr = 0.45 + 0.75 * aRnd.y; on *= step(0.5, texture2D(uMask, lawnUV(wxz + vec2(rr, 0.0))).r) * step(0.5, texture2D(uMask, lawnUV(wxz - vec2(rr, 0.0))).r) * step(0.5, texture2D(uMask, lawnUV(wxz + vec2(0.0, rr))).r) * step(0.5, texture2D(uMask, lawnUV(wxz - vec2(0.0, rr))).r); }`); };
  LAWN.mat.customProgramCacheKey = () => 'mi-lawn-v170-edge178'; LAWN.mat.needsUpdate = true; } } catch (e) { }
